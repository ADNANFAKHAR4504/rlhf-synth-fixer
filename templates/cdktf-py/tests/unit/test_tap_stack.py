import pytest
from cdktf import Testing
from tap_stack import TapStack

ENVIRONMENT_SUFFIX = "dev"
STATE_BUCKET = "iac-rlhf-tf-states"
STATE_BUCKET_REGION = "us-east-1"
AWS_REGION = "us-east-1"

@pytest.fixture
def app():
    return Testing.app()

@pytest.fixture
def stack(app):
    return TapStack(
        app,
        "TestTapStack",
        environment_suffix=ENVIRONMENT_SUFFIX,
        state_bucket=STATE_BUCKET,
        state_bucket_region=STATE_BUCKET_REGION,
        aws_region=AWS_REGION,
    )

def test_tap_stack_initialization(stack):
    assert stack is not None

def test_tap_stack_creation(stack):
    synthesized = Testing.synth(stack)
    assert isinstance(synthesized, list)
    assert len(synthesized) > 0