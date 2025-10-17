"""Integration tests for TapStack."""
import json
import re
from pathlib import Path
from typing import Any, Dict, Tuple

import pytest
from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify basic structure
        assert stack is not None


BASE_DIR = Path(__file__).resolve().parents[2]
FLAT_OUTPUTS_PATH = BASE_DIR / "cfn-outputs" / "flat-outputs.json"


def _load_flat_outputs() -> Dict[str, Any]:
    """Load the deployment flat outputs JSON if available."""
    if not FLAT_OUTPUTS_PATH.exists():
        return {}

    try:
        content = FLAT_OUTPUTS_PATH.read_text(encoding="utf-8").strip()
    except OSError:
        return {}

    if not content:
        return {}

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


@pytest.fixture(scope="module")
def flat_outputs() -> Dict[str, Any]:
    """Provide flat outputs or skip if they are unavailable."""
    outputs = _load_flat_outputs()
    if not outputs:
        pytest.skip(f"Flat outputs not found at {FLAT_OUTPUTS_PATH}")
    return outputs


@pytest.fixture(scope="module")
def tap_stack_context(flat_outputs: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """
    Return the first TapStack entry and its outputs.

    Expected structure:
    {
        "TapStack<suffix>": {
            "ecs_cluster_name": "...",
            ...
        }
    }
    """
    stack_keys = [key for key in flat_outputs if key.startswith("TapStack")]
    if not stack_keys:
        pytest.skip("TapStack outputs are missing from flat outputs")

    stack_key = stack_keys[0]
    stack_outputs = flat_outputs.get(stack_key, {})
    if not isinstance(stack_outputs, dict) or not stack_outputs:
        pytest.skip(f"TapStack outputs for {stack_key} are empty or malformed")

    return stack_key, stack_outputs


class TestTapStackLiveOutputs:
    """Validate live outputs emitted by TapStack deployments."""

    def test_required_outputs_present(self, tap_stack_context: Tuple[str, Dict[str, Any]]):
        """Ensure all expected output keys exist in the flat outputs."""
        _, outputs = tap_stack_context
        required_keys = {
            "ecs_cluster_name",
            "ecs_service_name",
            "efs_dns_name",
            "efs_id",
            "redis_endpoint",
            "vpc_id",
        }

        missing = sorted(required_keys - outputs.keys())
        assert not missing, f"Missing required outputs: {', '.join(missing)}"

    def test_ecs_cluster_and_service_share_suffix(self, tap_stack_context: Tuple[str, Dict[str, Any]]):
        """Cluster and service names should share the same generated suffix."""
        stack_key, outputs = tap_stack_context
        cluster_name = outputs["ecs_cluster_name"]
        service_name = outputs["ecs_service_name"]

        assert cluster_name.startswith("lms-cluster-")
        assert service_name.startswith("lms-service-")

        cluster_suffix = cluster_name[len("lms-cluster-") :]
        service_suffix = service_name[len("lms-service-") :]
        assert cluster_suffix == service_suffix

        stack_suffix = stack_key.replace("TapStack", "")
        assert stack_suffix in cluster_suffix, "Stack suffix should be part of generated names"

    def test_efs_dns_matches_efs_id(self, tap_stack_context: Tuple[str, Dict[str, Any]]):
        """EFS DNS name should be derived from the EFS ID."""
        _, outputs = tap_stack_context
        efs_id = outputs["efs_id"]
        efs_dns_name = outputs["efs_dns_name"]

        assert efs_id.startswith("fs-")
        assert efs_dns_name.startswith(f"{efs_id}.")
        assert ".efs." in efs_dns_name and efs_dns_name.endswith(".amazonaws.com")

    def test_redis_endpoint_is_valid(self, tap_stack_context: Tuple[str, Dict[str, Any]]):
        """Redis endpoint should point to an AWS ElastiCache cluster."""
        _, outputs = tap_stack_context
        redis_endpoint = outputs["redis_endpoint"]

        assert redis_endpoint.endswith(".cache.amazonaws.com")
        assert re.search(r"\.cache\.amazonaws\.com$", redis_endpoint)

    def test_vpc_id_format(self, tap_stack_context: Tuple[str, Dict[str, Any]]):
        """VPC ID should match the expected AWS identifier format."""
        _, outputs = tap_stack_context
        vpc_id = outputs["vpc_id"]

        assert re.fullmatch(r"vpc-[0-9a-f]{8,17}", vpc_id), f"Unexpected VPC ID format: {vpc_id}"
