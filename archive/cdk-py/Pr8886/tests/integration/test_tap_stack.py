# tests/integration/test_tap_stack_integration.py
import json
import os
import re
import unittest
from typing import Any, Dict, Optional

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError, NoRegionError
except ImportError:  # pragma: no cover - boto3 not always present in CI
    boto3 = None  # type: ignore

# ---------- Helpers for online (live) mode ----------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(
    BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json"
)

if os.path.exists(FLAT_OUTPUTS_PATH):
    with open(FLAT_OUTPUTS_PATH, "r", encoding="utf-8") as f:
        FLAT_OUTPUTS: Dict[str, Any] = json.loads(f.read() or "{}")
else:
    FLAT_OUTPUTS = {}


def _find_output_value(suffix: str) -> Optional[str]:
    """Find flattened output whose key ends with the suffix."""
    for key, val in FLAT_OUTPUTS.items():
        if key.endswith(suffix):
            return val
    return None


def _iam_client():
    if not boto3:
        return None
    region = os.getenv("AWS_REGION") or os.getenv("CDK_DEFAULT_REGION") or "us-east-1"
    try:
        return boto3.client("iam", region_name=region)
    except NoRegionError:
        return None


def _role_name_from_arn(role_arn: str) -> Optional[str]:
    # arn:aws:iam::<account>:role/<name>  OR  arn:aws:iam::<account>:role/path/name
    match = re.search(r":role/(.+)$", role_arn)
    if not match:
        return None
    return match.group(1).split("/")[-1]


def _should_force_offline() -> bool:
    return os.getenv("IT_OFFLINE", "").lower() in ("1", "true", "yes")


def _is_online_possible() -> bool:
    """Live checks possible only if outputs file exists and we can make an IAM client."""
    return bool(FLAT_OUTPUTS) and _iam_client() is not None and not _should_force_offline()


# ---------- Helpers for offline (synth) mode ----------

def _offline_template() -> Template:
    """Synthesize the nested S3 IAM stack template for offline assertions."""
    app = cdk.App()
    stack = TapStack(app, "TapStackIT", TapStackProps(environment_suffix="it"))
    # IAM Role/Policy live in the nested stack:
    return Template.from_stack(stack.s3_stack)


# ======================= TESTS =======================

@mark.describe("TapStack (Integration)")
class TestTapStackIntegration(unittest.TestCase):
    """Integration checks for the deployed TapStack (secure S3 IAM Role)."""

    # ---------- Outputs existence ----------

    @mark.it("has CloudFormation outputs for the S3 access role and managed policy")
    def test_outputs_present(self):
        if _is_online_possible():
            role_arn = _find_output_value("S3AccessRoleArn")
            policy_arn = _find_output_value("S3AccessPolicyArn")
            self.assertIsNotNone(role_arn, "Missing CFN output: S3AccessRoleArn")
            self.assertIsNotNone(policy_arn, "Missing CFN output: S3AccessPolicyArn")
            return

        # Offline fallback: assert nested template defines the Outputs
        template = _offline_template()
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("S3AccessRoleArn", outputs)
        self.assertIn("S3AccessPolicyArn", outputs)

    # ---------- IAM Role checks ----------

    @mark.it("IAM role exists in AWS and is tagged correctly")
    def test_iam_role_exists_and_is_tagged(self):
        if _is_online_possible():
            iam = _iam_client()
            role_arn = _find_output_value("S3AccessRoleArn")
            if not all((iam, role_arn)):
                self.skipTest("Cannot resolve IAM client or role ARN for live checks.")
            role_name = _role_name_from_arn(role_arn)  # type: ignore[arg-type]
            if not role_name:
                self.skipTest(f"Cannot parse role name from ARN: {role_arn}")

            try:
                resp = iam.get_role(RoleName=role_name)  # type: ignore[union-attr]
            except (NoCredentialsError, NoRegionError):
                self.skipTest("AWS credentials/region not configured; skipping.")
            except ClientError as ex:
                self.fail(f"IAM get_role failed for {role_name}: {ex}")

            tags = {t["Key"]: t["Value"] for t in resp.get("Role", {}).get("Tags", [])}
            self.assertEqual(tags.get("Environment"), "Production")
            self.assertEqual(tags.get("Owner"), "DevOps")
            return

        # Offline fallback: validate role + tags in the synthesized template
        template = _offline_template()
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": "tap-s3-readonly-it",
                "AssumeRolePolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Effect": "Allow",
                                    "Action": "sts:AssumeRole",
                                    "Principal": {"Service": "lambda.amazonaws.com"},
                                }
                            )
                        ]
                    )
                },
                "Tags": Match.array_with(
                    [
                        Match.object_like({"Key": "Environment", "Value": "Production"}),
                        Match.object_like({"Key": "Owner", "Value": "DevOps"}),
                    ]
                ),
            },
        )

    # ---------- Managed policy checks ----------

    @mark.it("Managed policy exists, attached to role, and is least-privilege for S3")
    def test_managed_policy_attached_and_least_privilege(self):
        if _is_online_possible():
            iam = _iam_client()
            role_arn = _find_output_value("S3AccessRoleArn")
            policy_arn = _find_output_value("S3AccessPolicyArn")
            if not all((iam, role_arn, policy_arn)):
                self.skipTest("Missing outputs or IAM client; cannot verify live.")

            role_name = _role_name_from_arn(role_arn)  # type: ignore[arg-type]
            if not role_name:
                self.skipTest(f"Cannot parse role name from ARN: {role_arn}")

            try:
                pol = iam.get_policy(PolicyArn=policy_arn)["Policy"]  # type: ignore[union-attr]
                ver_id = pol["DefaultVersionId"]
                pver = iam.get_policy_version(
                    PolicyArn=policy_arn, VersionId=ver_id
                )["PolicyVersion"]
                doc = pver["Document"]
            except ClientError as ex:
                self.fail(f"Failed to retrieve managed policy {policy_arn}: {ex}")
            except (NoCredentialsError, NoRegionError):
                self.skipTest("AWS credentials/region not configured; skipping.")

            try:
                entities = iam.list_entities_for_policy(PolicyArn=policy_arn)
                role_names = [r["RoleName"] for r in entities.get("PolicyRoles", [])]
                self.assertIn(role_name, role_names)
            except ClientError as ex:
                self.fail(f"Failed to check policy attachments: {ex}")

            # Validate actions + prefix condition
            stmts = doc.get("Statement", [])
            actions: list[str] = []
            list_cond = {}
            for s in stmts:
                act = s.get("Action")
                acts = [act] if isinstance(act, str) else (act or [])
                actions.extend(acts)
                if "s3:ListBucket" in acts:
                    list_cond = s.get("Condition", {}) or {}
            self.assertIn("s3:ListBucket", actions)
            self.assertIn("s3:GetObject", actions)
            if list_cond:
                s_like = list_cond.get("StringLike") or {}
                s3p = s_like.get("s3:prefix")
                self.assertTrue(
                    bool(s3p),
                    "ListBucket must be constrained by s3:prefix when a prefix is configured.",
                )
            return

        # Offline fallback: assert policy content in synthesized template
        template = _offline_template()
        template.resource_count_is("AWS::IAM::ManagedPolicy", 1)

        # Loose match (Action may render as string or list). Require prefix condition.
        template.has_resource_properties(
            "AWS::IAM::ManagedPolicy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Effect": "Allow",
                                    "Action": Match.any_value(),
                                    "Condition": Match.object_like(
                                        {
                                            "StringLike": Match.object_like(
                                                {
                                                    "s3:prefix": Match.array_with(
                                                        ["apps/tap/", "apps/tap/*"]
                                                    )
                                                }
                                            )
                                        }
                                    ),
                                }
                            ),
                            Match.object_like(
                                {"Effect": "Allow", "Action": Match.any_value()}
                            ),
                        ]
                    )
                }
            },
        )

        # Extra strict verification of the synthesized JSON
        resources = template.to_json()["Resources"]
        pol = next(
            r for r in resources.values() if r["Type"] == "AWS::IAM::ManagedPolicy"
        )
        doc = pol["Properties"]["PolicyDocument"]
        stmts = doc.get("Statement", [])
        has_list = False
        has_get = False
        list_has_prefix = False
        extras: list[str] = []

        for s in stmts:
            a = s.get("Action")
            acts = [a] if isinstance(a, str) else (a or [])
            if "s3:ListBucket" in acts:
                has_list = True
                cond = s.get("Condition", {}) or {}
                s_like = cond.get("StringLike", {}) if isinstance(cond, dict) else {}
                pfx = s_like.get("s3:prefix")
                if isinstance(pfx, list):
                    list_has_prefix = "apps/tap/" in pfx and "apps/tap/*" in pfx
            if "s3:GetObject" in acts:
                has_get = True
            for one in acts:
                if isinstance(one, str) and one.startswith("s3:") and one not in (
                    "s3:ListBucket",
                    "s3:GetObject",
                ):
                    extras.append(one)

        self.assertTrue(has_list, "Policy missing s3:ListBucket")
        self.assertTrue(has_get, "Policy missing s3:GetObject")
        self.assertTrue(
            list_has_prefix,
            "ListBucket must be constrained by s3:prefix (apps/tap/, apps/tap/*).",
        )
        self.assertFalse(
            extras,
            f"Unexpected extra S3 actions present: {extras}",
        )
