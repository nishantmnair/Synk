"""
Tests for api.gemini_utils (server-side Gemini API calls).
"""
import json
import pytest
from unittest.mock import patch, MagicMock

from api import gemini_utils


class TestGetApiKey:
    """Test _get_api_key."""

    def test_returns_key_from_env(self):
        with patch.dict("os.environ", {"GEMINI_API_KEY": " test-key "}, clear=False):
            assert gemini_utils._get_api_key() == "test-key"

    def test_returns_empty_when_empty(self):
        with patch.dict("os.environ", {"GEMINI_API_KEY": ""}, clear=False):
            assert gemini_utils._get_api_key() == ""


class TestCallGemini:
    """Test _call_gemini (mocked urlopen)."""

    def test_returns_none_when_no_api_key(self):
        with patch.dict("os.environ", {"GEMINI_API_KEY": ""}, clear=False):
            result = gemini_utils._call_gemini("Hello", response_mime_type=None)
        assert result is None

    @patch("api.gemini_utils.urllib.request.urlopen")
    def test_returns_parsed_json_when_response_valid(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": '{"title": "Beach Day", "description": "Fun", "location": "Beach", "category": "Adventure"}'}]
                    }
                }
            ]
        }).encode("utf-8")
        mock_resp.__enter__ = MagicMock(return_value=mock_resp)
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        with patch.dict("os.environ", {"GEMINI_API_KEY": "key123"}, clear=False):
            result = gemini_utils._call_gemini(
                "Suggest a date",
                response_mime_type="application/json",
                response_schema={"type": "OBJECT"},
            )
        assert result == {
            "title": "Beach Day",
            "description": "Fun",
            "location": "Beach",
            "category": "Adventure",
        }

    @patch("api.gemini_utils.urllib.request.urlopen")
    def test_returns_plain_text_when_no_mime_type(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "candidates": [
                {"content": {"parts": [{"text": "Plan a surprise date!"}]}}
            ]
        }).encode("utf-8")
        mock_resp.__enter__ = MagicMock(return_value=mock_resp)
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        with patch.dict("os.environ", {"GEMINI_API_KEY": "key123"}, clear=False):
            result = gemini_utils._call_gemini("Pro tip?", response_mime_type=None)
        assert result == "Plan a surprise date!"

    @patch("api.gemini_utils.urllib.request.urlopen")
    def test_returns_none_on_http_error(self, mock_urlopen):
        import urllib.error
        mock_urlopen.side_effect = urllib.error.HTTPError("url", 500, "Error", None, None)
        with patch.dict("os.environ", {"GEMINI_API_KEY": "key123"}, clear=False):
            result = gemini_utils._call_gemini("Hello", response_mime_type="application/json")
        assert result is None

    @patch("api.gemini_utils.urllib.request.urlopen")
    def test_returns_none_when_response_empty_candidates(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({"candidates": []}).encode("utf-8")
        mock_resp.__enter__ = MagicMock(return_value=mock_resp)
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp
        with patch.dict("os.environ", {"GEMINI_API_KEY": "key123"}, clear=False):
            result = gemini_utils._call_gemini("Hello", response_mime_type="application/json")
        assert result is None

    @patch("api.gemini_utils.urllib.request.urlopen")
    def test_returns_none_when_json_response_invalid(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "not valid json {"}]}}]
        }).encode("utf-8")
        mock_resp.__enter__ = MagicMock(return_value=mock_resp)
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp
        with patch.dict("os.environ", {"GEMINI_API_KEY": "key123"}, clear=False):
            result = gemini_utils._call_gemini("Hello", response_mime_type="application/json")
        assert result is None


class TestGenerateDateIdea:
    """Test generate_date_idea."""

    @patch("api.gemini_utils._call_gemini")
    def test_returns_idea_when_api_succeeds(self, mock_call):
        mock_call.return_value = {
            "title": "Sunset Picnic",
            "description": "A relaxing evening.",
            "location": "Park",
            "category": "Romantic",
        }
        result = gemini_utils.generate_date_idea("relaxed")
        assert result["title"] == "Sunset Picnic"
        assert result["description"] == "A relaxing evening."
        assert result["location"] == "Park"
        assert result["category"] == "Romantic"
        mock_call.assert_called_once()

    @patch("api.gemini_utils._call_gemini")
    def test_returns_none_when_api_returns_none(self, mock_call):
        mock_call.return_value = None
        result = gemini_utils.generate_date_idea("cozy")
        assert result is None

    @patch("api.gemini_utils._call_gemini")
    def test_normalizes_missing_fields(self, mock_call):
        mock_call.return_value = {"title": "Only title"}
        result = gemini_utils.generate_date_idea("any")
        assert result["title"] == "Only title"
        assert result["description"] == ""
        assert result["location"] == "Anywhere"
        assert result["category"] == "Date idea"

    @patch("api.gemini_utils._call_gemini")
    def test_passes_hint_for_variety_when_provided(self, mock_call):
        mock_call.return_value = {
            "title": "Hiking",
            "description": "Outdoor fun.",
            "location": "Trail",
            "category": "Adventure",
        }
        gemini_utils.generate_date_idea("adventurous", hint=1)
        mock_call.assert_called_once()
        call_args = mock_call.call_args[0]
        assert "follow-up" in call_args[0].lower() or "different" in call_args[0].lower()


class TestGetProTip:
    """Test get_pro_tip."""

    @patch("api.gemini_utils._call_gemini")
    def test_returns_tip_when_api_succeeds(self, mock_call):
        mock_call.return_value = "Dream big together!"
        result = gemini_utils.get_pro_tip("Trip (Upcoming)")
        assert result == "Dream big together!"
        mock_call.assert_called_once()

    @patch("api.gemini_utils._call_gemini")
    def test_returns_none_when_api_fails(self, mock_call):
        mock_call.return_value = None
        result = gemini_utils.get_pro_tip("No milestones")
        assert result is None


class TestGetDailyConnectionPrompt:
    """Test get_daily_connection_prompt."""

    @patch("api.gemini_utils._call_gemini")
    def test_returns_prompt_when_api_succeeds(self, mock_call):
        mock_call.return_value = "What are you grateful for today?"
        result = gemini_utils.get_daily_connection_prompt()
        assert result == "What are you grateful for today?"
        mock_call.assert_called_once()

    @patch("api.gemini_utils._call_gemini")
    def test_returns_none_when_api_fails(self, mock_call):
        mock_call.return_value = None
        result = gemini_utils.get_daily_connection_prompt()
        assert result is None
