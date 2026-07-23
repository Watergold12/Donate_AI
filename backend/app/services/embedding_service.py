"""
Semantic embedding service for NGO demand matching.

Loads sentence-transformers/all-MiniLM-L6-v2 once at startup when available,
memoises text embeddings in-memory, and exposes cosine similarity helpers.
If the model cannot be loaded or any embedding operation fails, callers can
fall back to the rule-based matcher without interrupting the workflow.

Cache behaviour:
- Keys are normalized, lower-cased text strings.
- The cache is process-local and lives only for the current application worker.
- Entries are reused for repeated semantic comparisons within the same worker.
- No eviction policy is used because the text volume in a single matching flow
  is expected to remain small and predictable.
"""
from __future__ import annotations

import logging
from threading import RLock
from typing import Optional

logger = logging.getLogger(__name__)

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingService:
    """Load-once embedding helper with a small in-memory text cache."""

    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME) -> None:
        self.model_name = model_name
        self._model = None
        self._cache: dict[str, tuple[float, ...]] = {}
        self._lock = RLock()
        self._ready = False
        self._load_error: Optional[str] = None

    @property
    def is_ready(self) -> bool:
        return self._ready and self._model is not None

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    def load(self) -> "EmbeddingService":
        """Load the sentence-transformers model once."""
        if self.is_ready:
            return self

        with self._lock:
            if self.is_ready:
                return self

            try:
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(self.model_name)
                self._ready = True
                self._load_error = None
                logger.info("Embedding model loaded: %s", self.model_name)
            except Exception as exc:
                self._model = None
                self._ready = False
                self._load_error = str(exc)
                logger.warning(
                    "Embedding model failed to load (%s). Semantic matching will use the fallback matcher.",
                    exc,
                )

        return self

    @staticmethod
    def _normalize_text(text: str) -> str:
        return " ".join(text.split()).strip().lower()

    def _encode_uncached(self, text: str) -> tuple[float, ...]:
        if not self.is_ready or self._model is None:
            raise RuntimeError("Embedding service is not available")

        vector = self._model.encode(
            [text],
            normalize_embeddings=True,
            convert_to_numpy=True,
        )[0]
        return tuple(float(value) for value in vector.tolist())

    def embed(self, text: str) -> tuple[float, ...]:
        """Return a cached normalized embedding for text."""
        normalized = self._normalize_text(text)
        if not normalized:
            raise ValueError("Cannot embed empty text")

        with self._lock:
            cached = self._cache.get(normalized)
            if cached is not None:
                return cached

        vector = self._encode_uncached(normalized)

        with self._lock:
            self._cache[normalized] = vector

        return vector

    def cosine_similarity(self, left: str, right: str) -> float:
        """Compute cosine similarity using normalized embeddings."""
        left_vector = self.embed(left)
        right_vector = self.embed(right)

        if len(left_vector) != len(right_vector):
            raise ValueError("Embedding dimensions do not match")

        score = sum(a * b for a, b in zip(left_vector, right_vector))
        return max(0.0, min(1.0, float(score)))


_embedding_service: Optional[EmbeddingService] = None


def initialize_embedding_service(force_reload: bool = False) -> EmbeddingService:
    """Create and load the singleton embedding service."""
    global _embedding_service

    if _embedding_service is None or force_reload:
        _embedding_service = EmbeddingService().load()
    elif not _embedding_service.is_ready and _embedding_service.load_error is None:
        _embedding_service.load()

    return _embedding_service


def get_embedding_service() -> Optional[EmbeddingService]:
    """Return the initialized singleton, if available."""
    return _embedding_service
