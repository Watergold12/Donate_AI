"""
Tests for the semantic embedding matching pipeline.
"""
from __future__ import annotations

import logging
import math
import sys
import types
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import FastAPI

from app.matching.base import ScorerInput
from app.matching.weighted_scorer import WeightedScorer
from app.models.donation import DonationItem
from app.models.enums import DemandUrgency, ItemCategory, ItemCondition
from app.models.match import Match
from app.models.ngo import NGOProfile
from app.models.ngo_demand import NGODemand
from app.services import embedding_service as es
from app.utils import matching_algorithm as ma


class FakeVector(list):
    def tolist(self):
        return list(self)


class DummySentenceTransformer:
    instances = 0

    def __init__(self, model_name: str):
        type(self).instances += 1
        self.model_name = model_name
        self.encode_calls = 0

    def encode(self, texts, normalize_embeddings=True, convert_to_numpy=True):
        self.encode_calls += 1
        text = texts[0]
        vectors = {
            "hello world": FakeVector([1.0, 0.0]),
            "apple": FakeVector([1.0, 0.0]),
            "banana": FakeVector([0.0, 1.0]),
            "t shirt clothing": FakeVector([0.7, 0.3]),
            "warm jacket clothing insulated winter clothes high needed 5": FakeVector([0.7, 0.3]),
        }
        return [vectors.get(text, FakeVector([0.5, 0.5]))]


class MissingSentenceTransformerModule(types.ModuleType):
    pass


def _install_sentence_transformer_module(monkeypatch, module):
    monkeypatch.setitem(sys.modules, "sentence_transformers", module)


def _make_entities():
    donor_item = DonationItem(
        id=uuid4(),
        donation_id=uuid4(),
        item_name="T Shirt",
        category=ItemCategory.clothing,
        quantity=5,
        condition=ItemCondition.good,
        is_confirmed=True,
    )
    donor = SimpleNamespace(city="Bengaluru", state="Karnataka")
    donation = SimpleNamespace(
        donor=donor,
        items=[donor_item],
    )
    ngo = NGOProfile(
        id=uuid4(),
        user_id=uuid4(),
        org_name="Test NGO",
        registration_number="NGO-001",
        city="Bengaluru",
        state="Karnataka",
        service_areas=["Bengaluru"],
        is_verified=True,
    )
    demand = NGODemand(
        id=uuid4(),
        ngo_id=ngo.id,
        item_category=ItemCategory.clothing,
        item_name="Warm Jacket",
        quantity_needed=10,
        quantity_fulfilled=5,
        urgency_level=DemandUrgency.high,
        description="Insulated winter clothes",
        is_active=True,
    )
    demand.ngo = ngo
    return donor_item, donation, ngo, demand


def test_embedding_model_initialization_loads_once(monkeypatch):
    module = types.ModuleType("sentence_transformers")
    module.SentenceTransformer = DummySentenceTransformer
    _install_sentence_transformer_module(monkeypatch, module)

    monkeypatch.setattr(es, "_embedding_service", None, raising=False)
    DummySentenceTransformer.instances = 0

    service1 = es.initialize_embedding_service(force_reload=True)
    service2 = es.initialize_embedding_service()

    assert service1 is service2
    assert service1.is_ready is True
    assert service1.model_name == es.EMBEDDING_MODEL_NAME
    assert DummySentenceTransformer.instances == 1


def test_embedding_model_initialization_handles_load_failure(monkeypatch):
    module = MissingSentenceTransformerModule("sentence_transformers")
    _install_sentence_transformer_module(monkeypatch, module)

    monkeypatch.setattr(es, "_embedding_service", None, raising=False)
    service = es.initialize_embedding_service(force_reload=True)

    assert service.is_ready is False
    assert service.load_error is not None


def test_embedding_generation_uses_cache(monkeypatch):
    module = types.ModuleType("sentence_transformers")
    module.SentenceTransformer = DummySentenceTransformer
    _install_sentence_transformer_module(monkeypatch, module)

    service = es.EmbeddingService().load()
    assert service.is_ready is True

    first = service.embed("  Hello World  ")
    second = service.embed("hello world")

    assert first == second
    assert service._model.encode_calls == 1


def test_cosine_similarity(monkeypatch):
    module = types.ModuleType("sentence_transformers")
    module.SentenceTransformer = DummySentenceTransformer
    _install_sentence_transformer_module(monkeypatch, module)

    service = es.EmbeddingService().load()

    assert math.isclose(service.cosine_similarity("apple", "apple"), 1.0, rel_tol=1e-6)
    assert math.isclose(service.cosine_similarity("apple", "banana"), 0.0, rel_tol=1e-6)


def test_semantic_match_score_uses_embedding_service_when_available(monkeypatch, caplog):
    _, donation, _, demand = _make_entities()

    fake_service = SimpleNamespace(
        is_ready=True,
        cosine_similarity=lambda left, right: 0.87,
    )
    monkeypatch.setattr(es, "get_embedding_service", lambda: fake_service)
    caplog.set_level(logging.DEBUG)

    score = ma.semantic_match_score(donation.items, demand)

    assert score == pytest.approx(0.87, rel=1e-6)
    assert "used=embedding" in caplog.text


def test_semantic_match_score_falls_back_when_embedding_service_unavailable(monkeypatch, caplog):
    _, donation, _, demand = _make_entities()

    monkeypatch.setattr(es, "get_embedding_service", lambda: None)
    caplog.set_level(logging.DEBUG)

    score = ma.semantic_match_score(donation.items, demand)
    fallback = ma._semantic_score(donation.items, demand)

    assert score == pytest.approx(fallback, rel=1e-6)
    assert "used=fallback-unavailable" in caplog.text


def test_weighted_scorer_integration(monkeypatch):
    _, donation, ngo, demand = _make_entities()

    monkeypatch.setattr("app.matching.weighted_scorer.semantic_match_score", lambda donation_items, demand_obj: 0.80)

    scorer = WeightedScorer()
    result = scorer.score(
        ScorerInput(
            donation_items=donation.items,
            demand=demand,
            ngo_profile=ngo,
            donor_city=donation.donor.city,
            donor_state=donation.donor.state,
        )
    )

    expected_total = round(
        0.25 * 1.0 +
        0.20 * 0.5 +
        0.15 * 1.0 +
        0.10 * 1.0 +
        0.15 * 0.75 +
        0.15 * 0.80,
        4,
    )

    assert result.breakdown["semantic"] == pytest.approx(0.80, rel=1e-6)
    assert result.total_score == pytest.approx(expected_total, rel=1e-6)


def test_compute_score_uses_semantic_match_score(monkeypatch):
    _, donation, ngo, demand = _make_entities()

    monkeypatch.setattr(ma, "semantic_match_score", lambda donation_items, demand_obj: 0.66)

    score = ma.compute_score(
        donation.items,
        demand,
        ngo,
        donor_city=donation.donor.city,
        donor_state=donation.donor.state,
    )

    expected_total = round(
        0.35 * 1.0 +
        0.20 * 0.5 +
        0.20 * 0.75 +
        0.10 * 1.0 +
        0.15 * 0.66,
        4,
    )

    assert score.semantic_score == pytest.approx(0.66, rel=1e-6)
    assert score.score == pytest.approx(expected_total, rel=1e-6)


def test_match_explanation_includes_semantic_similarity_and_uses_cache(monkeypatch):
    _, donation, ngo, demand = _make_entities()

    call_count = {"count": 0}

    def fake_compute_score(donation_items, demand_obj, ngo_profile, donor_city=None, donor_state=None):
        call_count["count"] += 1
        return ma.MatchingScore(
            ngo_demand=demand_obj,
            ngo_profile=ngo_profile,
            score=0.84,
            category_score=1.0,
            quantity_score=0.5,
            urgency_score=0.75,
            geo_score=1.0,
            semantic_score=0.66,
        )

    monkeypatch.setattr(ma, "compute_score", fake_compute_score)

    match = Match(
        donation_id=uuid4(),
        ngo_demand_id=demand.id,
        ngo_id=ngo.id,
        score=0.84,
    )
    match.donation = donation
    match.ngo_demand = demand
    match.ngo = ngo

    breakdown = match.score_breakdown
    explanation = match.match_explanation

    assert call_count["count"] == 1
    assert breakdown["semantic"] == pytest.approx(0.66, rel=1e-6)
    assert any("Semantic similarity score" in line for line in explanation)


@pytest.mark.asyncio
async def test_lifespan_initializes_embedding_service_once(monkeypatch):
    from app import main as app_main

    fake_service = SimpleNamespace(is_ready=True, model_name=es.EMBEDDING_MODEL_NAME, load_error=None)
    call_count = {"count": 0}

    def fake_initialize_embedding_service():
        call_count["count"] += 1
        return fake_service

    monkeypatch.setattr("app.services.embedding_service.initialize_embedding_service", fake_initialize_embedding_service)

    app = FastAPI()
    async with app_main.lifespan(app):
        pass

    assert call_count["count"] == 1
    assert app.state.embedding_service is fake_service
