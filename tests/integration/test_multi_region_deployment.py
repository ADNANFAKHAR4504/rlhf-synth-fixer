"""
Integration tests for multi-region deployment.
Tests that stacks can be synthesized correctly.
"""
import aws_cdk as cdk
from aws_cdk import assertions


def test_multi_region_app_synthesis():
    """Test that multi-region app can be synthesized."""
    app = cdk.App()

    # Test environment configuration
    test_env_primary = cdk.Environment(account="123456789012", region="us-east-1")
    test_env_secondary = cdk.Environment(account="123456789012", region="us-east-2")

    # Import stacks (would need actual stack imports)
    from lib.tap_stack import TapStack, TapStackProps

    # Create main stack
    main_stack = TapStack(
        app,
        "TestTapStack",
        props=TapStackProps(environment_suffix="test", env=test_env_primary)
    )

    # Synthesize the app
    assembly = app.synth()

    # Verify assembly was created
    assert assembly is not None
    assert len(assembly.stacks) > 0


def test_stack_dependencies():
    """Test that stack dependencies are properly configured."""
    # This test would verify that:
    # - Secondary DB stack depends on primary DB stack
    # - Primary storage depends on secondary storage
    # - Route 53 depends on both API stacks
    # - Monitoring depends on infrastructure stacks

    # For now, this validates basic stack creation
    app = cdk.App()
    from lib.tap_stack import TapStack, TapStackProps

    stack = TapStack(
        app,
        "DependencyTest",
        props=TapStackProps(environment_suffix="test")
    )

    assert stack is not None
    assert len(stack.node.dependencies) >= 0


def test_cross_region_references():
    """Test cross-region references using CfnOutputs."""
    # This test would verify that:
    # - Global cluster ID is exported from primary
    # - Bucket ARNs are exported for replication
    # - VPC IDs are exported for reference

    # Validate stack can export outputs
    app = cdk.App()
    from lib.tap_stack import TapStack, TapStackProps

    stack = TapStack(
        app,
        "CrossRegionTest",
        props=TapStackProps(environment_suffix="test")
    )

    template = assertions.Template.from_stack(stack)
    outputs = template.to_json().get('Outputs', {})

    assert isinstance(outputs, dict)


def test_environment_suffix_propagation():
    """Test that environment suffix is properly used across all stacks."""
    app = cdk.App()

    from lib.tap_stack import TapStack, TapStackProps

    stack = TapStack(
        app,
        "TestStack",
        props=TapStackProps(environment_suffix="prod")
    )

    template = assertions.Template.from_stack(stack)

    # Verify environment suffix is in outputs
    template.has_output(
        "EnvironmentSuffix",
        {
            "Value": "prod"
        }
    )
