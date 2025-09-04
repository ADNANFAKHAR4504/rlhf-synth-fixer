import aws_cdk as cdk
import pytest
from lib.tap_stack import TapStack


@pytest.fixture
def stack():
    app = cdk.App()
    return TapStack(app, "test-stack")


def test_stack_synthesis(stack):
    """Test that the stack can be synthesized without errors"""
    app = cdk.App()
    test_stack = TapStack(app, "test-synthesis-stack")
    
    # This will raise an exception if synthesis fails
    template = app.synth().get_stack_by_name("test-synthesis-stack").template
    
    assert template is not None
    assert "Resources" in template


def test_stack_has_required_resources(stack):
    """Test that the stack contains all required resource types"""
    app = cdk.App()
    test_stack = TapStack(app, "test-resources-stack")
    template = app.synth().get_stack_by_name("test-resources-stack").template
    
    resource_types = [resource.get("Type") for resource in template["Resources"].values()]
    
    required_types = [
        "AWS::EC2::VPC",
        "AWS::EC2::SecurityGroup",
        "AWS::RDS::DBInstance",
        "AWS::ElasticLoadBalancingV2::LoadBalancer",
        "AWS::Lambda::Function"
    ]
    
    for required_type in required_types:
        assert required_type in resource_types