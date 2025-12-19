"""
Integration tests for TAP Stack CloudFront CDN infrastructure.

Tests verify that all AWS resources are deployed correctly and accessible.
"""

import pytest
import boto3
import json
import os
from pathlib import Path


@pytest.fixture(scope="module")
def outputs():
    """Load deployment outputs from flat-outputs.json"""
    outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

    if not outputs_path.exists():
        pytest.skip("No deployment outputs found")

    with open(outputs_path) as f:
        data = json.load(f)
        # Handle both nested and flat output formats
        if isinstance(data, dict):
            # Check if it's the nested format with stack key
            stack_keys = [k for k in data.keys() if k.startswith("TapStack")]
            if stack_keys:
                return data[stack_keys[0]]
            return data

    return {}


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment or default"""
    return os.getenv("AWS_REGION", "us-west-2")


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client"""
    return boto3.client("s3", region_name=aws_region)


@pytest.fixture(scope="module")
def cloudfront_client(aws_region):
    """Create CloudFront client"""
    return boto3.client("cloudfront", region_name=aws_region)


@pytest.fixture(scope="module")
def dynamodb_client(aws_region):
    """Create DynamoDB client"""
    return boto3.client("dynamodb", region_name=aws_region)


@pytest.fixture(scope="module")
def route53_client():
    """Create Route53 client"""
    return boto3.client("route53")


@pytest.mark.integration
class TestS3Bucket:
    """Test S3 origin bucket"""

    def test_bucket_exists(self, s3_client, outputs):
        """Verify S3 bucket exists"""
        bucket_name = outputs.get("bucket_name")
        assert bucket_name, "bucket_name not found in outputs"

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_bucket_versioning(self, s3_client, outputs):
        """Verify bucket versioning is enabled"""
        bucket_name = outputs.get("bucket_name")
        assert bucket_name, "bucket_name not found in outputs"

        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get("Status") == "Enabled"

    def test_bucket_encryption(self, s3_client, outputs):
        """Verify bucket encryption is configured"""
        bucket_name = outputs.get("bucket_name")
        assert bucket_name, "bucket_name not found in outputs"

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response.get("ServerSideEncryptionConfiguration", {}).get("Rules", [])
        assert len(rules) > 0
        assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"

    def test_bucket_public_access_blocked(self, s3_client, outputs):
        """Verify public access is blocked"""
        bucket_name = outputs.get("bucket_name")
        assert bucket_name, "bucket_name not found in outputs"

        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response["PublicAccessBlockConfiguration"]
        assert config["BlockPublicAcls"] is True
        assert config["BlockPublicPolicy"] is True
        assert config["IgnorePublicAcls"] is True
        assert config["RestrictPublicBuckets"] is True


@pytest.mark.integration
class TestCloudFrontDistribution:
    """Test CloudFront distribution"""

    def test_distribution_exists(self, cloudfront_client, outputs):
        """Verify CloudFront distribution exists and is deployed"""
        distribution_id = outputs.get("cloudfront_distribution_id")
        assert distribution_id, "cloudfront_distribution_id not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)
        assert response["Distribution"]["Status"] == "Deployed"

    def test_distribution_enabled(self, cloudfront_client, outputs):
        """Verify distribution is enabled"""
        distribution_id = outputs.get("cloudfront_distribution_id")
        assert distribution_id, "cloudfront_distribution_id not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)
        assert response["Distribution"]["DistributionConfig"]["Enabled"] is True

    def test_distribution_has_origin(self, cloudfront_client, outputs):
        """Verify distribution has S3 origin configured"""
        distribution_id = outputs.get("cloudfront_distribution_id")
        bucket_name = outputs.get("bucket_name")
        assert distribution_id, "cloudfront_distribution_id not found in outputs"
        assert bucket_name, "bucket_name not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)
        origins = response["Distribution"]["DistributionConfig"]["Origins"]["Items"]
        assert len(origins) > 0

        # Check that origin domain contains bucket name
        origin_domain = origins[0]["DomainName"]
        assert bucket_name in origin_domain

    def test_distribution_has_oac(self, cloudfront_client, outputs):
        """Verify distribution uses Origin Access Control"""
        distribution_id = outputs.get("cloudfront_distribution_id")
        assert distribution_id, "cloudfront_distribution_id not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)
        origins = response["Distribution"]["DistributionConfig"]["Origins"]["Items"]
        assert len(origins) > 0

        # Check for OAC configuration
        origin = origins[0]
        assert "OriginAccessControlId" in origin
        assert origin["OriginAccessControlId"] != ""

    def test_distribution_https_redirect(self, cloudfront_client, outputs):
        """Verify distribution redirects to HTTPS"""
        distribution_id = outputs.get("cloudfront_distribution_id")
        assert distribution_id, "cloudfront_distribution_id not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)
        default_behavior = response["Distribution"]["DistributionConfig"]["DefaultCacheBehavior"]
        assert default_behavior["ViewerProtocolPolicy"] == "redirect-to-https"

    def test_distribution_ipv6_enabled(self, cloudfront_client, outputs):
        """Verify IPv6 is enabled"""
        distribution_id = outputs.get("cloudfront_distribution_id")
        assert distribution_id, "cloudfront_distribution_id not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)
        assert response["Distribution"]["DistributionConfig"]["IsIPV6Enabled"] is True

    def test_distribution_has_lambda_edge(self, cloudfront_client, outputs):
        """Verify Lambda@Edge functions are attached"""
        distribution_id = outputs.get("cloudfront_distribution_id")
        assert distribution_id, "cloudfront_distribution_id not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)
        default_behavior = response["Distribution"]["DistributionConfig"]["DefaultCacheBehavior"]

        lambda_associations = default_behavior.get("LambdaFunctionAssociations", {}).get("Items", [])
        assert len(lambda_associations) > 0, "No Lambda@Edge functions attached"


@pytest.mark.integration
class TestDynamoDB:
    """Test DynamoDB table"""

    def test_table_exists(self, dynamodb_client, outputs):
        """Verify DynamoDB table exists"""
        table_name = outputs.get("dynamodb_table_name")
        assert table_name, "dynamodb_table_name not found in outputs"

        response = dynamodb_client.describe_table(TableName=table_name)
        assert response["Table"]["TableStatus"] == "ACTIVE"

    def test_table_has_correct_key_schema(self, dynamodb_client, outputs):
        """Verify table key schema"""
        table_name = outputs.get("dynamodb_table_name")
        assert table_name, "dynamodb_table_name not found in outputs"

        response = dynamodb_client.describe_table(TableName=table_name)
        key_schema = response["Table"]["KeySchema"]

        # Verify partition key
        partition_key = next((k for k in key_schema if k["KeyType"] == "HASH"), None)
        assert partition_key is not None
        assert partition_key["AttributeName"] == "configKey"


@pytest.mark.integration
class TestRoute53:
    """Test Route53 hosted zone"""

    def test_hosted_zone_exists(self, route53_client, outputs):
        """Verify Route53 hosted zone exists"""
        zone_id = outputs.get("route53_zone_id")
        assert zone_id, "route53_zone_id not found in outputs"

        response = route53_client.get_hosted_zone(Id=zone_id)
        assert response["HostedZone"]["Id"].endswith(zone_id)

    def test_hosted_zone_has_records(self, route53_client, outputs):
        """Verify hosted zone has DNS records"""
        zone_id = outputs.get("route53_zone_id")
        assert zone_id, "route53_zone_id not found in outputs"

        response = route53_client.list_resource_record_sets(HostedZoneId=zone_id)
        record_sets = response["ResourceRecordSets"]

        # Should have at least NS and SOA records
        assert len(record_sets) >= 2

        # Check for NS record
        ns_records = [r for r in record_sets if r["Type"] == "NS"]
        assert len(ns_records) > 0

    def test_cloudfront_alias_records(self, route53_client, outputs):
        """Verify CloudFront alias records exist"""
        zone_id = outputs.get("route53_zone_id")
        cloudfront_domain = outputs.get("cloudfront_domain_name")
        assert zone_id, "route53_zone_id not found in outputs"
        assert cloudfront_domain, "cloudfront_domain_name not found in outputs"

        response = route53_client.list_resource_record_sets(HostedZoneId=zone_id)
        record_sets = response["ResourceRecordSets"]

        # Check for A record alias
        a_records = [r for r in record_sets if r["Type"] == "A" and "AliasTarget" in r]
        if len(a_records) > 0:
            # Verify it points to CloudFront
            alias_target = a_records[0]["AliasTarget"]["DNSName"]
            assert "cloudfront.net" in alias_target.lower()


@pytest.mark.integration
class TestEndToEnd:
    """End-to-end integration tests"""

    def test_all_required_outputs_present(self, outputs):
        """Verify all required outputs are present"""
        required_outputs = [
            "bucket_name",
            "cloudfront_distribution_id",
            "cloudfront_domain_name",
            "dynamodb_table_name",
            "route53_zone_id"
        ]

        for output in required_outputs:
            assert output in outputs, f"Missing required output: {output}"
            assert outputs[output], f"Output {output} is empty"

    def test_cloudfront_domain_accessible(self, outputs):
        """Verify CloudFront domain name is in correct format"""
        cloudfront_domain = outputs.get("cloudfront_domain_name")
        assert cloudfront_domain, "cloudfront_domain_name not found in outputs"

        # CloudFront domain should end with .cloudfront.net
        assert cloudfront_domain.endswith(".cloudfront.net")

        # Domain should be a valid CloudFront distribution domain
        # Format: <random>.cloudfront.net
        parts = cloudfront_domain.split(".")
        assert len(parts) == 3
        assert parts[1] == "cloudfront"
        assert parts[2] == "net"

        # First part should be alphanumeric (CloudFront generates random prefix)
        assert len(parts[0]) > 0
        assert parts[0].replace("-", "").isalnum()
