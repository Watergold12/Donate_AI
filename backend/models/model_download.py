from pathlib import Path
from ultralytics import YOLO


MODELS_DIR = Path("models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODELS = {
    "YOLOv8": "yolov8n.pt",
    "YOLO26": "yolo26n.pt",
}


def download_models():
    print("=" * 60)
    print("Downloading YOLO pretrained models")
    print("=" * 60)

    for name, filename in MODELS.items():
        destination = MODELS_DIR / filename

        print(f"\n[{name}]")
        print(f"Model: {filename}")
        print(f"Destination: {destination}")

        try:
            # Ultralytics downloads the pretrained weights automatically.
            model = YOLO(filename)

            # Move/copy the downloaded model to our models directory
            source = Path(model.ckpt_path)

            if source.resolve() != destination.resolve():
                destination.write_bytes(source.read_bytes())

            print(f"✓ Downloaded: {destination}")

        except Exception as e:
            print(f"✗ Failed to download {filename}")
            print(f"  Error: {e}")

    print("\n" + "=" * 60)
    print("Download complete")
    print("=" * 60)


if __name__ == "__main__":
    download_models()