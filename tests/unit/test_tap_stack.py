# tests/unit/test_tap_stack.py

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack (Secure S3 IAM Role)")
class TestTapStack(unittest.TestCase):
  """Unit tests for the TapStack CDK stack (IAM role for S3 access)."""

  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates an IAM Role with env-suffixed name and required tags")
  def test_creates_iam_role_with_env_suffix_and_tags(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix),
    )

    # Inspect the nested S3AccessIamStack template (where IAM resources live)
    template = Template.from_stack(stack.s3_stack)

    template.resource_count_is("AWS::IAM::Role", 1)
    template.has_resource_properties(
      "AWS::IAM::Role",
      {
        "RoleName": f"tap-s3-readonly-{env_suffix}",
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

  @mark.it("creates a customer-managed policy with least-privilege S3 permissions")
  def test_managed_policy_scopes_to_list_and_get_under_prefix(self):
    # ARRANGE
    # Defaults in TapStack: bucket=example-prod-bucket ; prefix=apps/tap/
    stack = TapStack(self.app, "TapStackPolicyTest", TapStackProps(environment_suffix="x"))
    template = Template.from_stack(stack.s3_stack)

    # ASSERT: Exactly one ManagedPolicy
    template.resource_count_is("AWS::IAM::ManagedPolicy", 1)

    # Looser matcher: allow action to be string or list, but require the prefix condition
    template.has_resource_properties(
      "AWS::IAM::ManagedPolicy",
      {
        "PolicyDocument": {
          "Statement": Match.array_with(
            [
              # ListBucket scoped by s3:prefix
              Match.object_like(
                {
                  "Effect": "Allow",
                  "Action": Match.any_value(),
                  "Condition": Match.object_like(
                    {
                      "StringLike": Match.object_like(
                        {"s3:prefix": Match.array_with(["apps/tap/", "apps/tap/*"])}
                      )
                    }
                  ),
                }
              ),
              # GetObject statement (exact ARN not asserted here)
              Match.object_like(
                {"Effect": "Allow", "Action": Match.any_value()}
              ),
            ]
          )
        }
      },
    )

    # Extra robust checks on the synthesized policy JSON
    policy_resources = [
      r for r in template.to_json()["Resources"].values()
      if r["Type"] == "AWS::IAM::ManagedPolicy"
    ]
    self.assertEqual(len(policy_resources), 1)

    policy_doc = policy_resources[0]["Properties"]["PolicyDocument"]
    stmts = policy_doc.get("Statement", [])
    has_list = False
    has_get = False
    list_has_prefix_cond = False
    extra_s3_actions = []

    for s in stmts:
      act = s.get("Action")
      acts = [act] if isinstance(act, str) else (act or [])
      if "s3:ListBucket" in acts:
        has_list = True
        cond = s.get("Condition", {})
        string_like = cond.get("StringLike", {}) if isinstance(cond, dict) else {}
        pfx = string_like.get("s3:prefix")
        if isinstance(pfx, list):
          list_has_prefix_cond = ("apps/tap/" in pfx and "apps/tap/*" in pfx)
      if "s3:GetObject" in acts:
        has_get = True
      # Track any extra s3:* we didn't allow
      for a in acts:
        if isinstance(a, str) and a.startswith("s3:") and a not in (
          "s3:ListBucket", "s3:GetObject"
        ):
          extra_s3_actions.append(a)

    self.assertTrue(has_list, "Policy missing s3:ListBucket")
    self.assertTrue(has_get, "Policy missing s3:GetObject")
    self.assertTrue(
      list_has_prefix_cond,
      "ListBucket must be constrained by s3:prefix (apps/tap/, apps/tap/*).",
    )
    self.assertFalse(
      extra_s3_actions,
      f"Unexpected extra S3 actions present: {extra_s3_actions}",
    )


  @mark.it("defaults environment suffix to 'dev' for role naming when not provided")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TapStackDefault")
    template = Template.from_stack(stack.s3_stack)

    template.has_resource_properties(
      "AWS::IAM::Role",
      {"RoleName": "tap-s3-readonly-dev"},
    )
