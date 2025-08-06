"""
Unit-tests for lib.tap_stack.TapStack.

The Pulumi *Mocks* mechanism is used so no real AWS calls are made.
We capture every logical resource produced by the stack and assert that
critical security-first requirements are met.

Run with:

    pytest -q tests/unit/test_tap_stack.py
"""
from __future__ import annotations

import json
import re
import unittest
from typing import Any, Dict, List

import pulumi
from pulumi.runtime import Mocks, set_mocks


# --------------------------------------------------------------------------- #
# Pulumi Mocks                                                                #
# --------------------------------------------------------------------------- #
class _MockRecorder(Mocks):
    """
    Records every resource created during the Pulumi program so that it can be
    inspected by assertions.
    """

    def __init__(self) -> None:
        self.resources: List[Dict[str, Any]] = []

    # new_resource is called each time a resource is instantiated
    def new_resource(  # type: ignore[override]
        self,
        type_: str,
        name: str,
        inputs: Dict[str, Any],
        provider: str | None,
        id_: str | None,
    ):
        self.resources.append(
            {
                "type": type_,
                "name": name,
                "inputs": inputs,
                "provider": provider,
            }
        )
        # Return a *fake* physical ID and the same inputs back to Pulumi
        return id_ or f"{name}_id", inputs

    # call is invoked for data-source look-ups (`get_ami`, `get_certificate`, …)
    def call(  # type: ignore[override]
        self,
        token: str,
        args: Dict[str, Any],
        provider: str | None,
    ):
        # For unit tests we can safely return an empty dict – the values are
        # never used in resource arguments that we validate.
        return {}


# --------------------------------------------------------------------------- #
# Unit-test cases                                                             #
# --------------------------------------------------------------------------- #
class TestTapStack(unittest.TestCase):
    """
    Minimal but meaningful unit-test coverage focusing on:

    • correct multi-region VPC creation,
    • mandatory tag propagation,
    • TLS-only S3 policy,
    • least-privilege IAM role for EC2.
    """

    @classmethod
    def setUpClass(cls) -> None:
        cls.mocks = _MockRecorder()
        set_mocks(cls.mocks, project="unit-test-proj", stack="unit")

        # *Instantiate* the stack under test
        from lib.tap_stack import TapStack  # local import so mocks are active
        TapStack("test-stack")  # noqa: F401 – object captured by recorder

    # -------------------------  helpers  ---------------------------------- #
    @staticmethod
    def _find_resources(type_regex: str) -> List[Dict[str, Any]]:
        rx = re.compile(type_regex)
        return [r for r in TestTapStack.mocks.resources if rx.match(r["type"])]

    # --------------------------  tests  ----------------------------------- #
    def test_three_vpcs_created(self) -> None:
        """Exactly three VPCs – one per mandated region – must exist."""
        vpcs = self._find_resources(r"aws:ec2/vpc:Vpc")
        self.assertEqual(
            len(vpcs),
            3,
            f"Expected 3 VPCs (one per region) but found {len(vpcs)}.",
        )

    def test_vpc_tags_contain_environment(self) -> None:
        """Every VPC must carry mandatory cost-allocation tags."""
        for vpc in self._find_resources(r"aws:ec2/vpc:Vpc"):
            tags = vpc["inputs"].get("tags", {})
            self.assertIn("Environment", tags)
            self.assertIn("CostCenter", tags)

    def test_s3_policy_denies_non_tls(self) -> None:
        """Primary S3 bucket policy must deny insecure (non-TLS) requests."""
        policies = self._find_resources(r"aws:s3/bucketPolicy:BucketPolicy")
        self.assertTrue(policies, "No S3 bucket policy found.")

        tls_statement_found = False
        for pol in policies:
            policy_str = (
                pol["inputs"]["policy"]
                if isinstance(pol["inputs"]["policy"], str)
                else json.dumps(pol["inputs"]["policy"])
            )
            if '"Sid": "TLSRequired"' in policy_str:
                tls_statement_found = True
                break
        self.assertTrue(
            tls_statement_found, "TLS-enforcement statement not present in policy."
        )

    def test_iam_ec2_role_is_least_privilege(self) -> None:
        """EC2 instance role must exist and must *not* be administrator."""
        roles = self._find_resources(r"aws:iam/role:Role")
        role_names = [r["name"] for r in roles]
        self.assertIn(
            "prod-ec2-role",
            role_names,
            "EC2 instance role 'prod-ec2-role' missing.",
        )

        # Ensure *no* role has AdministratorAccess policy attached
        attachments = self._find_resources(r"aws:iam/rolePolicyAttachment:RolePolicyAttachment")
        for att in attachments:
            self.assertNotIn(
                "AdministratorAccess",
                att["inputs"].get("policy_arn", ""),
                "AdministratorAccess attached to an IAM role – violates least-privilege.",
            )
