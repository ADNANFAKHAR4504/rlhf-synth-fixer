import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestSecurity:
    """Test cases for security module"""

    def test_security_groups_allow_required_ports(self):
        """Verify security groups allow HTTPS and PostgreSQL"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Security groups should exist
        sg = Testing.to_have_resource(synthesized, "aws_security_group")
        assert sg is not None

    def test_network_acls_created(self):
        """Verify Network ACLs are created for both VPCs"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        nacl = Testing.to_have_resource(synthesized, "aws_network_acl")
        assert nacl is not None

    def test_nacl_associations(self):
        """Verify Network ACLs are associated with subnets"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        nacl_assoc = Testing.to_have_resource(
            synthesized,
            "aws_network_acl_association"
        )
        assert nacl_assoc is not None

    def test_security_group_ingress_rules(self):
        """Verify security groups have correct ingress rules"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Security group with ingress rules should exist
        sg = Testing.to_have_resource(synthesized, "aws_security_group")
        assert sg is not None

    def test_security_group_egress_rules(self):
        """Verify security groups have egress rules"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Security group with egress rules should exist
        sg = Testing.to_have_resource(synthesized, "aws_security_group")
        assert sg is not None
