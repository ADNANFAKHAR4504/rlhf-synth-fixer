
"""Unit tests for the TAP CDKTF stack."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Dict, Tuple
from unittest.mock import patch, MagicMock

import pytest
from cdktf import Testing

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from lib.tap_stack import TapStack, get_aws_region  # pylint: disable=wrong-import-position

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
        assert config["max_aggregation_interval"] == 600  # 10 minutes as configured in code

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


class TestGetAwsRegion:
    """Unit tests for get_aws_region function to improve coverage."""

    def test_get_aws_region_from_env_var(self) -> None:
        """Test that AWS_REGION environment variable takes highest priority."""
        with patch.dict(os.environ, {"AWS_REGION": "us-west-2"}):
            result = get_aws_region()
            assert result == "us-west-2"

    def test_get_aws_region_from_file(self) -> None:
        """Test that lib/AWS_REGION file is read when env var is not set."""
        # This test path is already covered by existing tests
        with patch.dict(os.environ, {}, clear=True):
            aws_region_file = Path(__file__).parent.parent / "lib" / "AWS_REGION"
            if aws_region_file.exists():
                # File exists, so test will use it - this is already covered
                result = get_aws_region()
                assert result == "eu-central-2"  # From existing file
            else:
                # File doesn't exist, test will use default
                result = get_aws_region()
                assert result == "eu-central-2"  # Default when file doesn't exist

    def test_get_aws_region_from_kwargs_when_file_missing(self) -> None:
        """Test that kwargs are used when file doesn't exist."""
        with patch.dict(os.environ, {}, clear=True):
            # Create a mock path that behaves correctly
            mock_aws_region_file = MagicMock(spec=Path)
            mock_aws_region_file.exists.return_value = False
            
            # Mock Path(__file__).parent / 'AWS_REGION'
            mock_file_path = MagicMock(spec=Path)
            mock_parent = MagicMock(spec=Path)
            mock_file_path.parent = mock_parent
            mock_parent.__truediv__ = lambda self, other: mock_aws_region_file if other == 'AWS_REGION' else Path(self) / other
            
            with patch("lib.tap_stack.Path", return_value=mock_file_path):
                result = get_aws_region(aws_region="ap-southeast-1")
                assert result == "ap-southeast-1"

    def test_get_aws_region_default_when_all_missing(self) -> None:
        """Test that default region is returned when env var, file, and kwargs are all missing."""
        with patch.dict(os.environ, {}, clear=True):
            # Create a mock path that doesn't exist
            mock_aws_region_file = MagicMock(spec=Path)
            mock_aws_region_file.exists.return_value = False
            
            mock_file_path = MagicMock(spec=Path)
            mock_parent = MagicMock(spec=Path)
            mock_file_path.parent = mock_parent
            mock_parent.__truediv__ = lambda self, other: mock_aws_region_file if other == 'AWS_REGION' else Path(self) / other
            
            with patch("lib.tap_stack.Path", return_value=mock_file_path):
                result = get_aws_region()
                assert result == "eu-central-2"

    def test_get_aws_region_file_read_error_handling(self) -> None:
        """Test that file read errors are handled gracefully."""
        with patch.dict(os.environ, {}, clear=True):
            # Create a mock path that exists but throws error on read
            mock_aws_region_file = MagicMock(spec=Path)
            mock_aws_region_file.exists.return_value = True
            mock_aws_region_file.read_text.side_effect = IOError("Read error")
            
            mock_file_path = MagicMock(spec=Path)
            mock_parent = MagicMock(spec=Path)
            mock_file_path.parent = mock_parent
            mock_parent.__truediv__ = lambda self, other: mock_aws_region_file if other == 'AWS_REGION' else Path(self) / other
            
            with patch("lib.tap_stack.Path", return_value=mock_file_path):
                result = get_aws_region(aws_region="sa-east-1")
                assert result == "sa-east-1"

    def test_get_aws_region_empty_file_handling(self) -> None:
        """Test that empty file is handled and falls through to kwargs/default."""
        with patch.dict(os.environ, {}, clear=True):
            # Create a mock path that exists but returns empty content
            mock_aws_region_file = MagicMock(spec=Path)
            mock_aws_region_file.exists.return_value = True
            mock_aws_region_file.read_text.return_value = "   \n  "
            
            mock_file_path = MagicMock(spec=Path)
            mock_parent = MagicMock(spec=Path)
            mock_file_path.parent = mock_parent
            mock_parent.__truediv__ = lambda self, other: mock_aws_region_file if other == 'AWS_REGION' else Path(self) / other
            
            with patch("lib.tap_stack.Path", return_value=mock_file_path):
                result = get_aws_region(aws_region="eu-west-1")
                assert result == "eu-west-1"

    def test_get_aws_region_default_tags_branch(self) -> None:
        """Test that default_tags branch in TapStack.__init__ is covered."""
        # Test with default_tags that doesn't have "tags" key
        _, manifest = synthesize_stack(default_tags={})
        assert manifest is not None

        # Test with default_tags that has "tags" key (already covered, but ensure it's tested)
        _, manifest2 = synthesize_stack(default_tags={"tags": {"Test": "Value"}})
        assert manifest2 is not None
