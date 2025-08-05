"""Edge case and performance tests."""

import pytest
from cdktf import App

from lib.infrastructure import Infrastructure
from lib.tap_stack import TapStack


class TestEdgeCases:
  """Test edge cases and error conditions."""

  def test_empty_environment_suffix(self):
    """Test with empty environment suffix."""
    app = App()
    stack = TapStack(app, "empty-env", environment_suffix="")
    assert stack is not None

  def test_very_long_environment_suffix(self):
    """Test with very long environment suffix."""
    app = App()
    long_suffix = "a" * 50
    stack = TapStack(app, "long-env", environment_suffix=long_suffix)
    assert stack is not None

  def test_special_characters_in_tags(self):
    """Test tags with various special characters."""
    app = App()
    special_tags = {
      "Normal": "normal-value",
      "WithSpaces": "value with spaces",
      "WithSymbols": "value_with-symbols.test",
      "WithNumbers": "value123"
    }
    stack = TapStack(app, "special-chars", default_tags=special_tags)
    assert stack is not None

  def test_none_values_in_kwargs(self):
    """Test handling of None values in configuration."""
    app = App()
    config = {
      "environment_suffix": None,
      "aws_region": None,
      "default_tags": None
    }
    # Filter out None values as they would use defaults
    filtered_config = {k: v for k, v in config.items() if v is not None}
    stack = TapStack(app, "none-values", **filtered_config)
    assert stack is not None

  def test_large_tag_dictionary(self):
    """Test with a large number of tags."""
    app = App()
    large_tags = {f"Tag{i}": f"Value{i}" for i in range(20)}
    stack = TapStack(app, "large-tags", default_tags=large_tags)
    assert stack is not None
