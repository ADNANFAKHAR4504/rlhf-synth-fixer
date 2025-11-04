
"""Unit tests for the TAP CDKTF stack."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Dict, Tuple

import pytest
from cdktf import Testing

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position

DEFAULT_STACK_KWARGS: Dict[str, object] = {
    "environment_suffix": "test",
    "aws_region": "ca-central-1",
    "state_bucket": "unit-test-state-bucket",
    "state_bucket_region": "us-east-1",
    "default_tags": {
        "tags": {
            "Environment": "test",
            "Repository": "unit-tests",
            "Author": "pytest",
        }
    },
}


def synthesize_stack(**overrides) -> Tuple[TapStack, Dict[str, object]]:
    """Helper to synthesize a TapStack and return the manifest."""
    kwargs = {**DEFAULT_STACK_KWARGS, **overrides}
    stack = TapStack(Testing.app(), "UnitTestTapStack", **kwargs)
    manifest = json.loads(Testing.synth(stack))
    return stack, manifest


def _collect_resources(manifest: Dict[str, object], resource_type: str) -> Dict[str, Dict]:
    """Return the dictionary of resources by type from the synthesized manifest."""
    return manifest.get("resource", {}).get(resource_type, {})


class TestTapStack:
    """Unit tests that validate the synthesized infrastructure definition."""

    def test_stack_creation(self) -> None:
        """Stack should synthesize and expose expected Terraform outputs."""
        stack, manifest = synthesize_stack()

        assert stack is not None
        outputs = manifest.get("output", {})
        expected_outputs = {
            "vpc_id",
            "public_subnet_1_id",
            "public_subnet_2_id",
            "private_subnet_1_id",
            "private_subnet_2_id",
            "internet_gateway_id",
            "nat_gateway_id",
            "s3_endpoint_id",
            "dynamodb_endpoint_id",
            "flow_log_id",
        }
        assert expected_outputs.issubset(set(outputs.keys()))

    def test_vpc_configuration(self) -> None:
        """Ensure the VPC uses the requested CIDR and DNS settings."""
        _, manifest = synthesize_stack()
        vpcs = _collect_resources(manifest, "aws_vpc")

        assert len(vpcs) == 1
        vpc_config = next(iter(vpcs.values()))
        assert vpc_config["cidr_block"] == "10.0.0.0/16"
        assert vpc_config["enable_dns_hostnames"] is True
        assert vpc_config["enable_dns_support"] is True

    def test_subnet_layout(self) -> None:
        """Validate the public and private subnet layout across AZs."""
        _, manifest = synthesize_stack()
        subnets = _collect_resources(manifest, "aws_subnet")

        assert len(subnets) == 4
        cidrs = {cfg["cidr_block"] for cfg in subnets.values()}
        assert cidrs == {"10.0.1.0/24", "10.0.2.0/24", "10.0.11.0/24", "10.0.12.0/24"}

        azs = {cfg["availability_zone"] for cfg in subnets.values()}
        assert azs == {"ca-central-1a", "ca-central-1b"}

        for cfg in subnets.values():
            if cfg["tags"]["Type"] == "Public":
                assert cfg["map_public_ip_on_launch"] is True
            else:
                assert cfg.get("map_public_ip_on_launch") is not True

    def test_route_tables(self) -> None:
        """Route tables should direct traffic through IGW and NAT where appropriate."""
        _, manifest = synthesize_stack()
        route_tables = _collect_resources(manifest, "aws_route_table")

        assert len(route_tables) == 2
        for config in route_tables.values():
            routes = config.get("route", [])
            assert any(route.get("cidr_block") == "0.0.0.0/0" for route in routes)
            if config["tags"]["Type"] == "Public":
                assert any(route.get("gateway_id") for route in routes)
            else:
                assert any(route.get("nat_gateway_id") for route in routes)

    def test_nat_gateway_configuration(self) -> None:
        """Confirm NAT Gateway and Elastic IP resources exist."""
        _, manifest = synthesize_stack()
        nat_gateways = _collect_resources(manifest, "aws_nat_gateway")
        eips = _collect_resources(manifest, "aws_eip")

        assert len(nat_gateways) == 1
        nat_config = next(iter(nat_gateways.values()))
        assert nat_config["subnet_id"]

        assert len(eips) == 1
        eip_config = next(iter(eips.values()))
        assert eip_config["domain"] == "vpc"

    def test_flow_logs_configuration(self) -> None:
        """Flow log should send all traffic to CloudWatch Logs."""
        _, manifest = synthesize_stack()
        flow_logs = _collect_resources(manifest, "aws_flow_log")

        assert len(flow_logs) == 1
        config = next(iter(flow_logs.values()))
        assert config["traffic_type"] == "ALL"
        assert config["log_destination_type"] == "cloud-watch-logs"
        assert config["max_aggregation_interval"] == 300

    def test_gateway_endpoints(self) -> None:
        """Gateway VPC endpoints should be provisioned for S3 and DynamoDB."""
        _, manifest = synthesize_stack()
        endpoints = _collect_resources(manifest, "aws_vpc_endpoint")

        service_names = {cfg["service_name"] for cfg in endpoints.values()}
        assert service_names == {
            "com.amazonaws.ca-central-1.s3",
            "com.amazonaws.ca-central-1.dynamodb",
        }

    def test_environment_suffix_in_tags(self) -> None:
        """Every resource tag should include the environment suffix for traceability."""
        suffix = "qa"
        _, manifest = synthesize_stack(environment_suffix=suffix)

        resources = manifest.get("resource", {})
        for resource_map in resources.values():
            for cfg in resource_map.values():
                tags = cfg.get("tags")
                if not tags:
                    continue
                name_tag = tags.get("Name", "")
                if name_tag:
                    assert name_tag.endswith(f"-{suffix}")

    def test_backend_configuration(self) -> None:
        """The S3 backend should use encryption and the expected key prefix."""
        _, manifest = synthesize_stack()
        backend_cfg = manifest.get("terraform", {}).get("backend", {}).get("s3", {})

        assert backend_cfg["bucket"] == DEFAULT_STACK_KWARGS["state_bucket"]
        assert backend_cfg["encrypt"] is True
        assert backend_cfg["key"].startswith(f"{DEFAULT_STACK_KWARGS['environment_suffix']}/")
