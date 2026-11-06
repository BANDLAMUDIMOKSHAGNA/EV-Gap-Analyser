import pytest
from apps.api.main import root, health_check
from apps.api.config import settings

def test_root():
    res = root()
    assert res["app"] == "EV Gap Analyser"
    assert "data_mode" in res
    assert "routing_provider" in res

def test_health():
    res = health_check()
    assert res["status"] == "healthy"
    assert "data_mode" in res
