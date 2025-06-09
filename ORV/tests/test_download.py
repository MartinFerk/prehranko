import os
import sys
import pytest

# Poskrbi, da lahko uvozimo app.py iz nadrejenega direktorija
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import download_model_if_missing, MODEL_PATH

def test_download_model_if_missing(tmp_path, monkeypatch):
    # Ustvari začasno pot za model
    temp_model_path = tmp_path / "model.pt"

    # Zamenjaj globalno spremenljivko MODEL_PATH v app.py
    monkeypatch.setattr("app.MODEL_PATH", str(temp_model_path))

    # Zamenjaj funkcijo gdown.download z lažno funkcijo, ki ustvari datoteko
    def mock_download(*args, **kwargs):
        with open(temp_model_path, "w") as f:
            f.write("dummy model content")

    monkeypatch.setattr("gdown.download", mock_download)

    # Test: datoteka naj ne obstaja pred klicem
    assert not os.path.exists(temp_model_path)

    # Kliči funkcijo
    download_model_if_missing()

    # Test: datoteka mora obstajati po klicu
    assert os.path.exists(temp_model_path)
