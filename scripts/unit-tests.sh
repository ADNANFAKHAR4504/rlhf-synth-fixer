"""Unit tests for TAP Stack."""

from cdktf import App, Testing

from lib.tap_stack import TapStack


def _assert_networking_layout(networking_stack, expected_environment: str) -> None:
    """Shared assertions for the networking layout."""
    assert networking_stack.vpc.cidr_block == "10.0.0.0/16"
    assert networking_stack.environment_suffix == expected_environment

    # Public tier
    assert len(networking_stack.public_subnets) == 3
    for subnet in networking_stack.public_subnets:
        assert subnet.map_public_ip_on_launch is True
        assert subnet.tags.get("Tier") == "Public"
        assert subnet.tags.get("Environment") == "Production"

    # Private tier
    assert len(networking_stack.private_subnets) == 3
    for subnet in networking_stack.private_subnets:
        assert subnet.map_public_ip_on_launch is False
        assert subnet.tags.get("Tier") == "Private"

    # Database tier
    assert len(networking_stack.database_subnets) == 3
    for subnet in networking_stack.database_subnets:
        assert subnet.map_public_ip_on_launch is False
        assert subnet.tags.get("Tier") == "Database"

    # NAT Gateways and routing artefacts
    assert len(networking_stack.nat_gateways) == 3
    assert len(networking_stack.private_route_tables) == 3
    assert len(networking_stack.database_route_tables) == 3


class TestStackStructure:
    """Test suite for TAP stack composition."""

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via provided configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        synth = Testing.synth(stack)
        assert synth is not None
        assert hasattr(stack, "networking_stack")
        _assert_networking_layout(stack.networking_stack, "prod")

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack provides sensible defaults when no kwargs are supplied."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        synth = Testing.synth(stack)
        assert synth is not None
        assert hasattr(stack, "networking_stack")
        _assert_networking_layout(stack.networking_stack, "dev")
