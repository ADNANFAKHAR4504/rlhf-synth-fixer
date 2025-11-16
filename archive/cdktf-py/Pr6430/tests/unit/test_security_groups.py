"""Unit tests for Security Groups construct."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, TerraformStack, Testing
from lib.security_groups import SecurityGroups


class TestSecurityGroups:
    """Test suite for Security Groups construct."""

    def test_security_groups_creates_cluster_sg(self):
        """SecurityGroups creates EKS cluster security group."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_security_group" in resources

    def test_security_groups_uses_provided_vpc_id(self):
        """SecurityGroups uses provided VPC ID."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        test_vpc_id = "vpc-12345"
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id=test_vpc_id,
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        security_groups = output_json.get("resource", {}).get("aws_security_group", {})
        for sg_config in security_groups.values():
            assert sg_config.get("vpc_id") == test_vpc_id

    def test_security_groups_naming_convention(self):
        """SecurityGroups follows naming convention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "myenv"
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix=environment_suffix,
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        security_groups = output_json.get("resource", {}).get("aws_security_group", {})
        for sg_config in security_groups.values():
            sg_name = sg_config.get("name", "")
            assert f"eks-cluster-sg-{environment_suffix}" == sg_name

    def test_security_groups_creates_ingress_rule(self):
        """SecurityGroups creates ingress rule for HTTPS."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        sg_rules = output_json.get("resource", {}).get("aws_security_group_rule", {})
        ingress_found = False
        for rule_config in sg_rules.values():
            if rule_config.get("type") == "ingress":
                ingress_found = True
                assert rule_config.get("from_port") == 443
                assert rule_config.get("to_port") == 443
                assert rule_config.get("protocol") == "tcp"
        assert ingress_found

    def test_security_groups_creates_egress_rule(self):
        """SecurityGroups creates egress rule for all traffic."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        sg_rules = output_json.get("resource", {}).get("aws_security_group_rule", {})
        egress_found = False
        for rule_config in sg_rules.values():
            if rule_config.get("type") == "egress":
                egress_found = True
                assert rule_config.get("from_port") == 0
                assert rule_config.get("to_port") == 0
                assert rule_config.get("protocol") == "-1"
                assert rule_config.get("cidr_blocks") == ["0.0.0.0/0"]
        assert egress_found

    def test_security_groups_ingress_uses_vpc_cidr(self):
        """SecurityGroups ingress rule uses VPC CIDR."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        vpc_cidr = "192.168.0.0/16"
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id="vpc-12345",
            vpc_cidr=vpc_cidr
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        sg_rules = output_json.get("resource", {}).get("aws_security_group_rule", {})
        for rule_config in sg_rules.values():
            if rule_config.get("type") == "ingress":
                cidr_blocks = rule_config.get("cidr_blocks", [])
                assert vpc_cidr in cidr_blocks

    def test_security_groups_exposes_sg_id(self):
        """SecurityGroups exposes cluster_security_group_id property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        assert hasattr(sg, "cluster_security_group_id")
        assert sg.cluster_security_group_id is not None

    def test_security_groups_tags_include_environment(self):
        """SecurityGroups tags include environment suffix."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "prod"
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix=environment_suffix,
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        security_groups = output_json.get("resource", {}).get("aws_security_group", {})
        for sg_config in security_groups.values():
            tags = sg_config.get("tags", {})
            assert tags.get("Environment") == environment_suffix

    def test_security_groups_has_description(self):
        """SecurityGroups has proper description."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        security_groups = output_json.get("resource", {}).get("aws_security_group", {})
        for sg_config in security_groups.values():
            description = sg_config.get("description", "")
            assert "EKS cluster control plane" in description

    def test_security_groups_rules_have_descriptions(self):
        """SecurityGroups rules have proper descriptions."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        sg = SecurityGroups(
            stack, "test_sg",
            environment_suffix="test",
            vpc_id="vpc-12345",
            vpc_cidr="10.0.0.0/16"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        sg_rules = output_json.get("resource", {}).get("aws_security_group_rule", {})
        for rule_config in sg_rules.values():
            description = rule_config.get("description", "")
            assert len(description) > 0
