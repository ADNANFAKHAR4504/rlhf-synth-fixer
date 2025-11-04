"""Unit tests for TAP Stack."""
import json
import os
import sys

from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack


def synthesize_stack(**overrides):
    """Synthesize the TapStack and return the Terraform JSON as a dictionary."""
    app = App()
    stack = TapStack(app, "UnitTestStack", **overrides)
    return json.loads(Testing.synth(stack))


class TestStackStructure:
    """Test suite validating generated infrastructure."""

    def test_stack_exports_required_outputs(self):
        """Stack exports key infrastructure identifiers for CI consumers."""
        synth = synthesize_stack(environment_suffix="prod", aws_region="us-west-2")
        outputs = synth.get("output", {})

        required_keys = {
            "environment_suffix",
            "aws_region",
            "vpc_id",
            "public_subnet_ids",
            "private_subnet_ids",
            "kms_key_arn",
            "db_secret_arn",
            "rds_endpoint",
            "elasticache_endpoint",
        }

        missing = required_keys.difference(outputs.keys())
        assert not missing, f"Missing expected outputs: {sorted(missing)}"

        assert outputs["environment_suffix"]["value"] == "prod"
        assert outputs["aws_region"]["value"] == "us-west-2"
        assert isinstance(outputs["public_subnet_ids"]["value"], list)
        assert isinstance(outputs["private_subnet_ids"]["value"], list)

    def test_stack_creates_network_and_database_resources(self):
        """Terraform plan contains critical network, security, and data resources."""
        synth = synthesize_stack()
        resources = synth["resource"]

        # Network resources
        assert "fintech_vpc" in resources["aws_vpc"]
        assert len(resources["aws_subnet"]) == 4, "Expected two public and two private subnets"
        assert len(resources["aws_nat_gateway"]) == 2
        assert len(resources["aws_route_table"]) >= 3  # one public, two private

        # Security resources
        for sg_name in ("rds_sg", "elasticache_sg"):
            assert sg_name in resources["aws_security_group"]

        # Data layer resources
        assert "rds_instance" in resources["aws_db_instance"]
        assert "rds_read_replica" in resources["aws_db_instance"]
        assert "elasticache" in resources["aws_elasticache_serverless_cache"]
