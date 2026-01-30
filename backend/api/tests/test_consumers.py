"""
Tests for API WebSocket consumers
"""
import pytest
import json
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from synk_backend.asgi import application


@pytest.fixture
def channel_layer(settings):
    """Use in-memory channel layer for tests"""
    settings.CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer'
        }
    }
    return get_channel_layer()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_synk_consumer_connect_disconnect(channel_layer):
    """Test consumer connect and disconnect"""
    communicator = WebsocketCommunicator(
        application,
        "/ws/1/"
    )
    connected, _ = await communicator.connect()
    assert connected
    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_synk_consumer_receive_send(channel_layer):
    """Test consumer receive and send_message"""
    communicator = WebsocketCommunicator(
        application,
        "/ws/42/"
    )
    connected, _ = await communicator.connect()
    assert connected

    # Send message from client
    await communicator.send_json_to({
        "message": {
            "event": "task:created",
            "data": {"id": 1, "title": "Test"}
        }
    })

    # Consumer broadcasts to group; we don't await response in this test
    # Just verify no exception and disconnect
    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_synk_consumer_send_message_type(channel_layer):
    """Test that send_message handler is invoked by group_send"""
    communicator = WebsocketCommunicator(
        application,
        "/ws/99/"
    )
    connected, _ = await communicator.connect()
    assert connected

    # Simulate channel layer sending to consumer (as views do)
    await channel_layer.group_send(
        "user_99",
        {
            "type": "send_message",
            "event": "task:updated",
            "data": {"id": 1, "title": "Updated"}
        }
    )

    response = await communicator.receive_json_from()
    assert response["event"] == "task:updated"
    assert response["data"]["title"] == "Updated"

    await communicator.disconnect()
