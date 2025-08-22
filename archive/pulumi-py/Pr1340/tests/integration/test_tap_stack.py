import os
from urllib.parse import urlparse

import boto3
import pytest


# ------------------------
# Safe helper
# ------------------------
def safe_get(d, key, default=None):
    if isinstance(d, dict):
        return d.get(key, default)
    return default

# ------------------------
# Fixtures
# ------------------------


@pytest.fixture(scope="module")
def aws_clients():
    region = os.getenv("AWS_REGION", "us-east-1")
    return {
        "s3": boto3.client("s3", region_name=region),
        "apigw": boto3.client("apigateway", region_name=region),
        "lambda": boto3.client("lambda", region_name=region),
        "codedeploy": boto3.client("codedeploy", region_name=region),
        "codebuild": boto3.client("codebuild", region_name=region),
        "codepipeline": boto3.client("codepipeline", region_name=region),
    }

# ------------------------
# S3 Bucket Security Test
# ------------------------


@pytest.mark.parametrize("bucket_prefix", ["corp-ci-artifacts", "corp-app-logs"])
def test_s3_bucket_secure(bucket_prefix, aws_clients):
    s3 = aws_clients["s3"]
    buckets = s3.list_buckets().get("Buckets", [])
    target = next((b["Name"]
                  for b in buckets if b["Name"].startswith(bucket_prefix)), None)
    assert target, f"No bucket found starting with {bucket_prefix}"

    # Server-side encryption
    try:
        sse = s3.get_bucket_encryption(Bucket=target)
        config = safe_get(sse, "ServerSideEncryptionConfiguration", {})
        rules = safe_get(config, "Rules", [])
        algo = None
        if rules and isinstance(rules, list):
            algo = safe_get(rules[0].get(
                "ApplyServerSideEncryptionByDefault", {}), "SSEAlgorithm")
        assert algo == "aws:kms", f"SSE Algorithm is not aws:kms for bucket {target}"
    except s3.exceptions.ClientError as e:
        assert False, f"No ServerSideEncryptionConfiguration for bucket {target}: {str(e)}"

    # Ownership controls
    try:
        oc = s3.get_bucket_ownership_controls(Bucket=target)
        ownership_controls = safe_get(oc, "OwnershipControls", {})
        rules = safe_get(ownership_controls, "Rules", [])
        obj_ownership = None
        if rules and isinstance(rules, list):
            obj_ownership = safe_get(rules[0], "ObjectOwnership")
        assert obj_ownership == "BucketOwnerEnforced", f"Ownership not enforced for bucket {target}"
    except s3.exceptions.ClientError as e:
        assert False, f"No BucketOwnershipControls for bucket {target}: {str(e)}"

    # Versioning
    ver = s3.get_bucket_versioning(Bucket=target)
    assert safe_get(
        ver, "Status") == "Enabled", f"Versioning not enabled for bucket {target}"

# ------------------------
# Lambda Alias Test
# ------------------------


def test_lambda_alias_is_live(aws_clients):
    lam = aws_clients["lambda"]
    functions = lam.list_functions().get("Functions", [])
    assert functions, "No Lambda functions found"
    for fn in functions:
        aliases = lam.list_aliases(
            FunctionName=fn["FunctionName"]).get("Aliases", [])
        if any(a["Name"] == "live" for a in aliases):
            return
    assert False, "No Lambda alias 'live' found in any function"

# ------------------------
# CodeDeploy App & Deployment Group Test
# ------------------------


def test_codedeploy_app_and_group_exist(aws_clients):
    cd = aws_clients["codedeploy"]
    apps = cd.list_applications().get("applications", [])
    assert apps, "No CodeDeploy applications found"
    for app in apps:
        dgs = cd.list_deployment_groups(
            applicationName=app).get("deploymentGroups", [])
        if dgs:
            return
    assert False, "No deployment groups found for any CodeDeploy application"

# ------------------------
# CodeBuild Project Test
# ------------------------


def test_codebuild_project_exists(aws_clients):
    cb = aws_clients["codebuild"]
    projects = cb.list_projects().get("projects", [])
    assert any(p.startswith("cb-")
               for p in projects), "No CodeBuild project starting with 'cb-' found"

# ------------------------
# CodePipeline Stages Test
# ------------------------


def test_codepipeline_has_expected_stages(aws_clients):
    cp = aws_clients["codepipeline"]
    pipelines = cp.list_pipelines().get("pipelines", [])
    assert pipelines, "No CodePipeline pipelines found"
    for pipe in pipelines:
        stages = cp.get_pipeline(name=pipe["name"])[
            "pipeline"].get("stages", [])
        stage_names = {s["name"] for s in stages}
        if {"Source", "Build", "Deploy"}.issubset(stage_names):
            return
    assert False, "No pipeline found with stages Source, Build, Deploy"
