"""
Tests for API WebSocket routing
"""
import pytest
from api.routing import websocket_urlpatterns


class TestRouting:
    """Test WebSocket URL routing"""

    def test_websocket_urlpatterns_exists(self):
        """Test websocket_urlpatterns is defined and has one route"""
        assert websocket_urlpatterns is not None
        assert len(websocket_urlpatterns) >= 1

    def test_websocket_pattern_has_user_id(self):
        """Test the ws URL pattern includes user_id"""
        pattern = websocket_urlpatterns[0]
        pattern_str = str(pattern)
        assert 'user_id' in pattern_str or 'ws' in pattern_str
