import boto3
import pytest
from botocore.exceptions import ClientError


# Safe getter to avoid NoneType crashes
def safe_get(d, key, default=None):
    if isinstance(d, dict):
        return d.get(key, default)
    return default

@pytest.fixture(scope="module")
def aws_clients():
    return {
        "s3": boto3.client("s3"),
        "apigw": boto3.client("apigateway"),
        "lambda": boto3.client("lambda"),
        "codepipeline": boto3.client("codepipeline"),
    }

@pytest.mark.parametrize("bucket_prefix", ["corp-ci-artifacts", "corp-app-logs"])
def test_s3_bucket_secure(bucket_prefix, aws_clients):
    s3 = aws_clients["s3"]
    buckets = s3.list_buckets().get("Buckets", [])
    target = next((b["Name"] for b in buckets if b["Name"].startswith(bucket_prefix)), None)
    assert target, f"No bucket found starting with {bucket_prefix}"

    # Server-side encryption
    try:
        sse = s3.get_bucket_encryption(Bucket=target)
        config = safe_get(sse, "ServerSideEncryptionConfiguration", {})
        rules = safe_get(config, "Rules", [])
        algo = None
        if rules and isinstance(rules, list):
            algo = safe_get(rules[0].get("ApplyServerSideEncryptionByDefault", {}), "SSEAlgorithm")
        assert algo == "aws:kms", f"SSE Algorithm is not aws:kms for bucket {target}"
    except s3.exceptions.ClientError as e:
        # No encryption configuration set
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
        # No ownership controls set
        assert False, f"No BucketOwnershipControls for bucket {target}: {str(e)}"

    # Versioning
    ver = s3.get_bucket_versioning(Bucket=target)
    assert safe_get(ver, "Status") == "Enabled", f"Versioning not enabled for bucket {target}"

# Test API Gateway existence
def test_api_gateway_exists(aws_clients):
    apigw = aws_clients["apigw"]
    apis = apigw.get_rest_apis(limit=50).get("items", [])
    api = next((a for a in apis if a["name"].startswith("api-dev")), None)
    assert api, "API Gateway 'api-dev' not found"

# Test Lambda alias configuration
def test_lambda_alias_live(aws_clients):
    lam = aws_clients["lambda"]
    funcs = lam.list_functions().get("Functions", [])
    fn = next((f for f in funcs if f["FunctionName"].startswith("fn-dev")), None)
    assert fn, "Lambda 'fn-dev' not found"

    aliases = lam.list_aliases(FunctionName=fn["FunctionName"]).get("Aliases", [])
    live_alias = next((a for a in aliases if a["Name"] == "live"), None)
    assert live_alias, "Lambda alias 'live' not found"

# Test CodePipeline stages
def test_pipeline_stages(aws_clients):
    cp = aws_clients["codepipeline"]
    pipes = cp.list_pipelines().get("pipelines", [])
    pipeline = next((p for p in pipes if p["name"].startswith("pipeline-dev")), None)
    assert pipeline, "CodePipeline 'pipeline-dev' not found"

    detail = cp.get_pipeline(name=pipeline["name"])
    stages = {s["name"] for s in detail["pipeline"]["stages"]}
    assert {"Source", "Build", "Deploy"}.issubset(stages), f"Missing expected stages in {stages}"
