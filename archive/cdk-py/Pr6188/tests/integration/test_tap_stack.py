from __future__ import annotations

import json
from ipaddress import IPv4Network
from pathlib import Path
from typing import Dict, Optional
import unittest

from pytest import mark

_BASE_DIR = Path(__file__).resolve().parents[2]
_FLAT_OUTPUTS_PATH = _BASE_DIR / "cfn-outputs" / "flat-outputs.json"


def _load_flat_outputs() -> Optional[Dict[str, str]]:
    if not _FLAT_OUTPUTS_PATH.exists():
        return None

    with _FLAT_OUTPUTS_PATH.open(encoding="utf-8") as handle:
        try:
            data = json.load(handle)
        except json.JSONDecodeError as exc:
            raise AssertionError(
                f"Unable to parse {_FLAT_OUTPUTS_PATH}: {exc}"
            ) from exc

    if not isinstance(data, dict):
        raise AssertionError(
            f"Expected object in {_FLAT_OUTPUTS_PATH}, got {type(data)}"
        )

    return {str(key): str(value) for key, value in data.items()}


@mark.describe("TapStack live integration outputs")
class TestTapStackOutputs(unittest.TestCase):
    """Live integration assertions for the synthesized TapStack outputs."""

    def setUp(self) -> None:
        self.outputs = _load_flat_outputs()
        if self.outputs is None:
            self.skipTest(
                f"flat-outputs.json not found at {_FLAT_OUTPUTS_PATH}"
            )
        self.vpc_id = self.outputs.get("VpcId")
        self.vpc_cidr = self.outputs.get("VpcCidr")
        self.vpc_network: Optional[IPv4Network]
        if self.vpc_cidr:
            try:
                self.vpc_network = IPv4Network(self.vpc_cidr)
            except ValueError:
                self.vpc_network = None
        else:
            self.vpc_network = None

    @mark.integration
    @mark.live
    def test_vpc_outputs_present(self) -> None:
        """Ensure the synthesized outputs include the expected VPC details."""
        self.assertIn("VpcId", self.outputs)
        self.assertIn("VpcCidr", self.outputs)
        self.assertTrue(self.outputs["VpcId"], "VpcId output should not be empty")
        self.assertTrue(self.outputs["VpcCidr"], "VpcCidr output should not be empty")

    @mark.integration
    @mark.live
    def test_vpc_id_format(self) -> None:
        """Validate the VPC identifier matches AWS formatting."""
        vpc_id = self.outputs.get("VpcId", "")
        self.assertRegex(
            vpc_id,
            r"^vpc-[0-9a-f]{8,}$",
            msg=f"VpcId '{vpc_id}' does not match expected AWS format",
        )

    @mark.integration
    @mark.live
    def test_vpc_cidr_is_valid_network(self) -> None:
        """Confirm the reported VPC CIDR is syntactically correct."""
        self.assertIsNotNone(
            self.vpc_network,
            f"VpcCidr '{self.vpc_cidr}' is not a valid IPv4 network",
        )
        self.assertGreaterEqual(
            self.vpc_network.prefixlen,
            16,
            "CIDR prefix should be /16 or smaller for the shared VPC",
        )

    @mark.integration
    @mark.live
    def test_outputs_dictionary_not_empty(self) -> None:
        """All live environments should emit at least one output."""
        self.assertGreater(
            len(self.outputs),
            0,
            "Expected at least one synthesized output entry",
        )

    @mark.integration
    @mark.live
    def test_vpc_cidr_resides_in_private_range(self) -> None:
        """VPC CIDR blocks must use the RFC1918 10.0.0.0/8 space."""
        self.assertIsNotNone(
            self.vpc_network,
            "VpcCidr must be defined before range validation",
        )
        self.assertTrue(
            str(self.vpc_network.network_address).startswith("10."),
            f"VpcCidr '{self.vpc_cidr}' should begin with 10.x.x.x for private addressing",
        )

    @mark.integration
    @mark.live
    def test_vpc_cidr_capacity(self) -> None:
        """Ensure the VPC has sufficient address space (≥ 65,536 addresses)."""
        self.assertIsNotNone(
            self.vpc_network,
            "VpcCidr must be defined before capacity validation",
        )
        self.assertGreaterEqual(
            self.vpc_network.num_addresses,
            65_536,
            f"VpcCidr '{self.vpc_cidr}' should provide at least 65,536 addresses",
        )
