"""Integration checks driven by the exported CloudFormation outputs."""

import json
from pathlib import Path

import pytest


def _load_outputs():
    outputs_path = Path("cfn-outputs/flat-outputs.json")
    if not outputs_path.exists():
        raise AssertionError(
            f"Expected outputs file at {outputs_path}, but it was not found."
        )

    with outputs_path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)

    parsed = {}
    for key, value in raw.items():
        if isinstance(value, str) and value.startswith("["):
            try:
                parsed[key] = json.loads(value)
            except json.JSONDecodeError:
                parsed[key] = value
        else:
            parsed[key] = value
    return parsed


def _as_list(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


@pytest.mark.integration
class TestFlatOutputs:
    """Validate the structure and sanity of the flattened stack outputs."""

    @classmethod
    def setup_class(cls):
        cls.outputs = _load_outputs()

    def test_outputs_json_has_expected_keys(self):
        expected_keys = {
            "vpc_id",
            "vpc_cidr",
            "public_subnet_ids",
            "private_subnet_ids",
            "database_subnet_ids",
            "nat_gateway_ids",
            "flow_logs_bucket",
        }
        missing = expected_keys - set(self.outputs.keys())
        assert not missing, f"Missing expected output keys: {', '.join(sorted(missing))}"

    def test_vpc_identifier_format(self):
        vpc_id = self.outputs.get("vpc_id", "")
        assert vpc_id.startswith("vpc-") and len(vpc_id) > 4

    def test_vpc_cidr_block(self):
        assert self.outputs.get("vpc_cidr") == "10.0.0.0/16"

    def test_public_subnet_ids(self):
        public_subnets = _as_list(self.outputs.get("public_subnet_ids", []))
        assert len(public_subnets) == 3
        assert all(subnet.startswith("subnet-") for subnet in public_subnets)

    def test_private_subnet_ids(self):
        private_subnets = _as_list(self.outputs.get("private_subnet_ids", []))
        assert len(private_subnets) == 3
        assert all(subnet.startswith("subnet-") for subnet in private_subnets)

    def test_database_subnet_ids(self):
        database_subnets = _as_list(self.outputs.get("database_subnet_ids", []))
        assert len(database_subnets) == 3
        assert all(subnet.startswith("subnet-") for subnet in database_subnets)

    def test_all_subnets_are_unique(self):
        all_subnets = (
            _as_list(self.outputs.get("public_subnet_ids", []))
            + _as_list(self.outputs.get("private_subnet_ids", []))
            + _as_list(self.outputs.get("database_subnet_ids", []))
        )
        assert len(all_subnets) == len(set(all_subnets))

    def test_nat_gateway_ids(self):
        nat_gateways = _as_list(self.outputs.get("nat_gateway_ids", []))
        assert len(nat_gateways) == 3
        assert all(nat.startswith("nat-") for nat in nat_gateways)

    def test_flow_logs_bucket_name(self):
        bucket_name = self.outputs.get("flow_logs_bucket", "")
        assert bucket_name
        assert "flow" in bucket_name

    def test_security_group_ids_present(self):
        sg_keys = [
            "app_security_group_id",
            "web_security_group_id",
            "database_security_group_id",
        ]
        for key in sg_keys:
            sg_id = self.outputs.get(key, "")
            assert sg_id.startswith("sg-"), f"{key} is missing or invalid"
