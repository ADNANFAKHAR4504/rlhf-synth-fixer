from cdktf import Testing
from tap_stack import TapStack

def test_tap_stack_synthesizes():
    app = Testing.app()
    stack = TapStack(app, "integration")
    synthesized = Testing.synth(stack)
    assert isinstance(synthesized, list)
    assert len(synthesized) > 0