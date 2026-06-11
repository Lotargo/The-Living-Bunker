import json
import pytest
import sys
sys.path.insert(0, '.')

from llm_client import parse_json_response, get_fallback_response


class TestParseJsonResponse:
    def test_plain_json_object(self):
        result = parse_json_response('{"thought": "Hello", "action": "IDLE"}')
        assert result == {"thought": "Hello", "action": "IDLE"}

    def test_plain_json_with_number(self):
        result = parse_json_response('{"health": 100, "hunger": 50.5}')
        assert result == {"health": 100, "hunger": 50.5}

    def test_plain_json_with_nested(self):
        result = parse_json_response('{"needs": {"hunger": 70, "energy": 30}}')
        assert result == {"needs": {"hunger": 70, "energy": 30}}

    def test_markdown_code_block_json(self):
        content = '```json\n{"thought": "I am thinking", "action": "MOVE", "target": "Kitchen"}\n```'
        result = parse_json_response(content)
        assert result == {"thought": "I am thinking", "action": "MOVE", "target": "Kitchen"}

    def test_markdown_code_block_plain(self):
        content = '```\n{"action": "STARE", "target": "self"}\n```'
        result = parse_json_response(content)
        assert result == {"action": "STARE", "target": "self"}

    def test_markdown_with_trailing_text(self):
        content = '```json\n{"action": "SLEEP"}\n```\nThis is the response.'
        result = parse_json_response(content)
        assert result == {"action": "SLEEP"}

    def test_markdown_with_multiple_fences(self):
        content = '```json\n{"a": 1}\n```\nsome text\n```json\n{"b": 2}\n```'
        result = parse_json_response(content)
        assert result == {"a": 1}

    def test_json_with_boolean_and_null(self):
        result = parse_json_response('{"active": true, "data": null, "count": false}')
        assert result == {"active": True, "data": None, "count": False}

    def test_json_with_array(self):
        result = parse_json_response('{"items": [1, 2, 3], "names": ["a", "b"]}')
        assert result == {"items": [1, 2, 3], "names": ["a", "b"]}

    def test_invalid_json_raises_error(self):
        with pytest.raises(json.JSONDecodeError):
            parse_json_response('not json at all')

    def test_empty_string_raises_error(self):
        with pytest.raises(json.JSONDecodeError):
            parse_json_response('')

    def test_empty_fences_raises_error(self):
        with pytest.raises(json.JSONDecodeError):
            parse_json_response('```json\n\n```')

    def test_llm_response_with_extra_newlines(self):
        content = '{\n  "thought": "Hmm",\n  "action": "IDLE"\n}'
        result = parse_json_response(content)
        assert result == {"thought": "Hmm", "action": "IDLE"}

    def test_realistic_llm_response(self):
        content = """```json
{
    "thought": "I am hungry, I should go eat",
    "action": "EAT",
    "target": "food_42"
}
```"""
        result = parse_json_response(content)
        assert result == {"thought": "I am hungry, I should go eat", "action": "EAT", "target": "food_42"}


class TestGetFallbackResponse:
    def test_returns_default_dict(self):
        result = get_fallback_response()
        assert result == {"thought": "...", "action": "IDLE", "target": "self"}

    def test_returns_new_dict_each_call(self):
        r1 = get_fallback_response()
        r2 = get_fallback_response()
        assert r1 is not r2
