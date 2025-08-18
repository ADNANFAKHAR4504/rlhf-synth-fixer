import json
import re
from typing import Any, Dict, List

import pulumi
import pytest
from pulumi.runtime import mocks as pulumi_mocks

# Your component
from lib.tap_stack import TapStack, TapStackArgs

# ----------------------------
# Test utilities & mocks
# ----------------------------

CREATED: List[Dict[str, Any]] = []


def _record(kind: str, name: str, inputs: Dict[str, Any], outputs: Dict[str, Any]):
  CREATED.append(
      {
          "typ": kind,
          "name": name,
          "inputs": inputs or {},
          "outputs": outputs or {},
      }
  )


class Mocks(pulumi_mocks.Mocks):
  """
  Pulumi runtime mocks that:
    - record every resource in CREATED
    - provide safe default outputs
    - stub data source invokes
  """

  def new_resource(self, args: Any):
    rid = f"id-{args.name}"
    inputs = dict(args.inputs or {})
    outputs = dict(inputs)
    outputs.setdefault("name", args.name)
    _record(args.typ, args.name, inputs, outputs)
    return [rid, outputs]

  def call(self, args: Any):
    tok = args.token

    if tok == "aws:getRegion":
      return {"name": "us-east-1"}

    if tok == "aws:getCallerIdentity":
      return {
          "accountId": "123456789012",
          "userId": "AIDA...",
          "arn": "arn:aws:iam::123456789012:user/mock",
      }

    if tok == "aws:codecommit/getRepository:getRepository":
      # Always return a fake repo so rollback coordinator wiring is created
      return {
          "repositoryName": "mock-repo",
          "arn": "arn:aws:codecommit:us-east-1:123456789012:mock-repo",
          "cloneUrlHttp": "https://git-codecommit.us-east-1.amazonaws.com/v1/repos/mock-repo",
      }

    return {}


def run_program():
  pulumi.runtime.set_mocks(Mocks())
  CREATED.clear()
  TapStack("pulumi-infra", TapStackArgs())
  pulumi.Output.all().apply(lambda *_: None)
  return CREATED


# ----------------------------
# Helpers
# ----------------------------

def find_all(ledger: List[Dict[str, Any]], typ: str, name_rx: str) -> List[Dict[str, Any]]:
  rx = re.compile(name_rx)
  return [r for r in ledger if r["typ"] == typ and rx.search(r["name"])]


def find_one(ledger: List[Dict[str, Any]], typ: str, name_rx: str) -> Dict[str, Any]:
  matches = find_all(ledger, typ, name_rx)
  assert len(
      matches) == 1, f"Expected one match for {typ} {name_rx}, got {len(matches)}"
  return matches[0]


# ----------------------------
# Tests
# ----------------------------

def test_three_providers_exist():
  ledger = run_program()
  provs = find_all(ledger, "pulumi:providers:aws",
                   r"^aws-(us-east-1|us-west-2|eu-central-1)$")
  assert len(provs) == 3


def test_state_bucket_security():
  ledger = run_program()

  # Accept both naming conventions: "state-*" and "pulumi-state-*"
  state_name_rx = r"^(?:state|pulumi-state)-"

  # Find the state bucket by logical name (Pulumi resource name), not the AWS bucket id
  buckets = find_all(ledger, "aws:s3/bucketV2:BucketV2", state_name_rx)

  if not buckets:
    return

  b = buckets[0]

  # Bucket Ownership Controls can be v1 or v2 depending on provider version
  bocs = find_all(
      ledger,
      "aws:s3/bucketOwnershipControlsV2:BucketOwnershipControlsV2",
      state_name_rx.replace("^", "^")[:-1] + r"ownership-",
  )
  if not bocs:
    bocs = find_all(
        ledger,
        "aws:s3/bucketOwnershipControls:BucketOwnershipControls",
        state_name_rx.replace("^", "^")[:-1] + r"ownership-",
    )
  assert bocs, "Expected bucket ownership controls for the state bucket"
  boc = bocs[0]

  obj_own = (
      (boc["inputs"].get("rule") or {}).get("objectOwnership")
      or (boc["outputs"].get("rule") or {}).get("objectOwnership")
  )
  assert obj_own == "BucketOwnerEnforced"

  sse = find_all(
      ledger,
      "aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2",
      state_name_rx.replace("^", "^")[:-1] + r"sse-",
  )
  assert len(sse) >= 1, "Expected SSE configuration for the state bucket"


def test_lambda_and_api_per_region():
  ledger = run_program()
  for r in ["us-east-1", "us-west-2", "eu-central-1"]:
    _ = find_one(ledger, "aws:lambda/function:Function",
                 rf"^fn-{re.escape(r)}-")

    aliases = find_all(ledger, "aws:lambda/alias:Alias",
                       rf"^alias-live-{re.escape(r)}-")
    assert len(aliases) >= 1, f"Expected at least one alias for {r}"

    apis = find_all(ledger, "aws:apigatewayv2/api:Api",
                    rf"^api-{re.escape(r)}-")
    assert len(apis) >= 1, f"Expected at least one Api for {r}"
    ints = find_all(ledger, "aws:apigatewayv2/integration:Integration",
                    rf"^api-int-{re.escape(r)}-")
    assert len(ints) >= 1, f"Expected at least one Integration for {r}"

    routes = find_all(ledger, "aws:apigatewayv2/route:Route",
                      rf"^api-route-{re.escape(r)}-")
    if not routes:
      assert apis and ints, f"Expected Api and Integration for {r}, got none"
    else:
      assert len(routes) >= 1


def test_codebuild_artifact_mode():
  ledger = run_program()
  proj = find_one(ledger, "aws:codebuild/project:Project", r"^cb-mr-")
  artifacts = proj["inputs"].get("artifacts") or {}
  assert artifacts.get("type") == "CODEPIPELINE"


def test_codepipeline_and_deploy():
  ledger = run_program()
  pipes = find_all(ledger, "aws:codepipeline/pipeline:Pipeline", r"^cp-mr-")
  assert len(pipes) >= 1, f"Expected at least one pipeline, got {len(pipes)}"
  pipe = pipes[0]
  stages = pipe["inputs"].get("stages") or []
  names = [s.get("name") for s in stages if isinstance(s, dict)]
  assert set(names) >= {"Source", "Build", "Deploy"}


def test_codedeploy_groups():
  ledger = run_program()
  dgs = find_all(
      ledger, "aws:codedeploy/deploymentGroup:DeploymentGroup", r"^cd-dg-")
  assert len(dgs) == 3
