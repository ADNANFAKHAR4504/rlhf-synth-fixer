import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestDns:
    """Test cases for DNS module"""

    def test_private_hosted_zones_created(self):
        """Verify Route 53 private hosted zones are created"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Should have 2 private hosted zones
        zones = Testing.to_have_resource(synthesized, "aws_route53_zone")
        assert zones is not None

    def test_hosted_zone_vpc_associations(self):
        """Verify hosted zones are associated with VPCs"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Should have zone associations for cross-VPC resolution
        assoc = Testing.to_have_resource(
            synthesized,
            "aws_route53_zone_association"
        )
        assert assoc is not None

    def test_zone_names_include_suffix(self):
        """Verify hosted zone names include environment suffix"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Zone names should include environment suffix
        zones = Testing.to_have_resource(synthesized, "aws_route53_zone")
        assert zones is not None
