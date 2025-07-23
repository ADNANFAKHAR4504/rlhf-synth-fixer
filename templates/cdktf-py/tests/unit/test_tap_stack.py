import pytest
from cdktf import Testing
from tap_stack import TapStack

def test_tap_stack_initialization():
    app = Testing.app()
    stack = TapStack(app, "test")
    assert stack is not None