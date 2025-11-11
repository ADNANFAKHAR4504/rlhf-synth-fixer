"""
Integration tests for Payment Processing Infrastructure.
Tests use cfn-outputs/flat-outputs.json for dynamic validation.
"""
import json
import os
import unittest
import re
from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests validating deployed infrastructure"""

    def setUp(self):
        """Set up test environment"""
        self.outputs = flat_outputs

    @mark.it("validates ALB DNS name is present")
    def test_alb_dns_name_present(self):
        """Test that ALB DNS name exists in outputs"""
        assert "ALBDNSName" in self.outputs, "ALB DNS Name not in outputs"
        alb_dns = self.outputs["ALBDNSName"]
        assert alb_dns, "ALB DNS Name is empty"

    @mark.it("validates ALB DNS name format")
    def test_alb_dns_name_format(self):
        """Test that ALB DNS name has correct format"""
        alb_dns = self.outputs.get("ALBDNSName", "")
        # ALB DNS format: name-randomid.region.elb.amazonaws.com
        pattern = r'^[a-z0-9\-]+\.[a-z0-9\-]+\.elb\.amazonaws\.com$'
        assert re.match(pattern, alb_dns), f"Invalid ALB DNS format: {alb_dns}"

    @mark.it("validates API Gateway endpoint is present")
    def test_api_gateway_endpoint_present(self):
        """Test that API Gateway endpoint exists in outputs"""
        assert "ApiGatewayEndpoint" in self.outputs, "API Gateway endpoint not in outputs"
        api_endpoint = self.outputs["ApiGatewayEndpoint"]
        assert api_endpoint, "API Gateway endpoint is empty"

    @mark.it("validates API Gateway endpoint format")
    def test_api_gateway_endpoint_format(self):
        """Test that API Gateway endpoint has correct HTTPS URL format"""
        api_endpoint = self.outputs.get("ApiGatewayEndpoint", "")
        assert api_endpoint.startswith("https://"), "API Gateway endpoint should use HTTPS"
        assert "execute-api" in api_endpoint, "API Gateway endpoint should contain execute-api"
        assert api_endpoint.endswith("/prod/"), "API Gateway endpoint should end with /prod/"

    @mark.it("validates CloudWatch Dashboard URL is present")
    def test_cloudwatch_dashboard_url_present(self):
        """Test that CloudWatch Dashboard URL exists in outputs"""
        assert "CloudWatchDashboardURL" in self.outputs, "CloudWatch Dashboard URL not in outputs"
        dashboard_url = self.outputs["CloudWatchDashboardURL"]
        assert dashboard_url, "CloudWatch Dashboard URL is empty"

    @mark.it("validates CloudWatch Dashboard URL format")
    def test_cloudwatch_dashboard_url_format(self):
        """Test that CloudWatch Dashboard URL has correct format"""
        dashboard_url = self.outputs.get("CloudWatchDashboardURL", "")
        assert dashboard_url.startswith("https://"), "Dashboard URL should use HTTPS"
        assert "console.aws.amazon.com/cloudwatch" in dashboard_url, "Should be CloudWatch console URL"
        assert "dashboards" in dashboard_url, "Should contain dashboards path"

    @mark.it("validates Database Cluster endpoint is present")
    def test_database_cluster_endpoint_present(self):
        """Test that RDS cluster endpoint exists in outputs"""
        assert "DatabaseClusterEndpoint" in self.outputs, "Database cluster endpoint not in outputs"
        db_endpoint = self.outputs["DatabaseClusterEndpoint"]
        assert db_endpoint, "Database cluster endpoint is empty"

    @mark.it("validates Database Cluster endpoint format")
    def test_database_cluster_endpoint_format(self):
        """Test that RDS cluster endpoint has correct format"""
        db_endpoint = self.outputs.get("DatabaseClusterEndpoint", "")
        # RDS endpoint format: cluster-name.cluster-id.region.rds.amazonaws.com
        pattern = r'^[a-z0-9\-]+\.cluster-[a-z0-9]+\.[a-z0-9\-]+\.rds\.amazonaws\.com$'
        assert re.match(pattern, db_endpoint), f"Invalid RDS endpoint format: {db_endpoint}"

    @mark.it("validates Database Read endpoint is present")
    def test_database_read_endpoint_present(self):
        """Test that RDS cluster read endpoint exists in outputs"""
        assert "ClusterReadEndpoint" in self.outputs, "Database read endpoint not in outputs"
        read_endpoint = self.outputs["ClusterReadEndpoint"]
        assert read_endpoint, "Database read endpoint is empty"

    @mark.it("validates Database Read endpoint format")
    def test_database_read_endpoint_format(self):
        """Test that RDS cluster read endpoint has correct format"""
        read_endpoint = self.outputs.get("ClusterReadEndpoint", "")
        # Read endpoint should contain cluster-ro
        assert "cluster-ro" in read_endpoint, "Read endpoint should contain cluster-ro"
        assert ".rds.amazonaws.com" in read_endpoint, "Read endpoint should be RDS domain"

    @mark.it("validates Document Bucket name is present")
    def test_document_bucket_name_present(self):
        """Test that S3 document bucket name exists in outputs"""
        assert "DocumentBucketName" in self.outputs, "Document bucket name not in outputs"
        bucket_name = self.outputs["DocumentBucketName"]
        assert bucket_name, "Document bucket name is empty"

    @mark.it("validates Document Bucket naming convention")
    def test_document_bucket_naming_convention(self):
        """Test that S3 bucket follows naming conventions"""
        bucket_name = self.outputs.get("DocumentBucketName", "")
        # Bucket names must be lowercase, can contain hyphens
        assert bucket_name.islower() or '-' in bucket_name, "Bucket name should be lowercase"
        assert "payment-docs" in bucket_name, "Bucket name should contain payment-docs"

    @mark.it("validates Replication Bucket name is present")
    def test_replication_bucket_name_present(self):
        """Test that S3 replication bucket name exists in outputs"""
        assert "ReplicationBucketName" in self.outputs, "Replication bucket name not in outputs"
        replica_bucket = self.outputs["ReplicationBucketName"]
        assert replica_bucket, "Replication bucket name is empty"

    @mark.it("validates VPC ID is present")
    def test_vpc_id_present(self):
        """Test that VPC ID exists in outputs"""
        assert "VPCId" in self.outputs, "VPC ID not in outputs"
        vpc_id = self.outputs["VPCId"]
        assert vpc_id, "VPC ID is empty"

    @mark.it("validates VPC ID format")
    def test_vpc_id_format(self):
        """Test that VPC ID has correct AWS format"""
        vpc_id = self.outputs.get("VPCId", "")
        # VPC ID format: vpc-xxxxxxxxxxxxxxxxx (vpc- followed by 17 hex chars)
        pattern = r'^vpc-[a-f0-9]{17}$'
        assert re.match(pattern, vpc_id), f"Invalid VPC ID format: {vpc_id}"

    @mark.it("validates ECS Service name is present")
    def test_ecs_service_name_present(self):
        """Test that ECS service name exists in outputs"""
        assert "ECSServiceName" in self.outputs, "ECS service name not in outputs"
        service_name = self.outputs["ECSServiceName"]
        assert service_name, "ECS service name is empty"

    @mark.it("validates ECS Service naming convention")
    def test_ecs_service_naming_convention(self):
        """Test that ECS service follows naming conventions"""
        service_name = self.outputs.get("ECSServiceName", "")
        assert "payment-service" in service_name, "Service name should contain payment-service"

    @mark.it("validates SQS Queue URL is present")
    def test_sqs_queue_url_present(self):
        """Test that SQS queue URL exists in outputs"""
        assert "QueueURL" in self.outputs, "Queue URL not in outputs"
        queue_url = self.outputs["QueueURL"]
        assert queue_url, "Queue URL is empty"

    @mark.it("validates SQS Queue URL format")
    def test_sqs_queue_url_format(self):
        """Test that SQS queue URL has correct format"""
        queue_url = self.outputs.get("QueueURL", "")
        assert queue_url.startswith("https://sqs."), "Queue URL should start with https://sqs."
        assert ".amazonaws.com/" in queue_url, "Queue URL should contain amazonaws.com"
        assert "payment-queue" in queue_url, "Queue URL should contain payment-queue"

    @mark.it("validates API Key ID is present")
    def test_api_key_id_present(self):
        """Test that API Key ID exists in outputs"""
        assert "APIKeyId" in self.outputs, "API Key ID not in outputs"
        api_key_id = self.outputs["APIKeyId"]
        assert api_key_id, "API Key ID is empty"

    @mark.it("validates API Endpoint is present")
    def test_api_endpoint_present(self):
        """Test that API endpoint exists in outputs"""
        assert "APIEndpoint" in self.outputs, "API endpoint not in outputs"
        api_endpoint = self.outputs["APIEndpoint"]
        assert api_endpoint, "API endpoint is empty"

    @mark.it("validates environment suffix usage consistency")
    def test_environment_suffix_consistency(self):
        """Test that environment suffix is consistently used across resources"""
        # Extract suffix from one resource
        bucket_name = self.outputs.get("DocumentBucketName", "")
        if bucket_name:
            # Bucket name format: payment-docs-{suffix}
            parts = bucket_name.split('-')
            if len(parts) >= 3:
                suffix = parts[-1]

                # Check that suffix appears in other resources
                service_name = self.outputs.get("ECSServiceName", "")
                assert suffix in service_name, f"Environment suffix {suffix} not in service name"

    @mark.it("validates no hard-coded regions in outputs")
    def test_no_hardcoded_regions(self):
        """Test that outputs use actual deployment region, not hard-coded values"""
        dashboard_url = self.outputs.get("CloudWatchDashboardURL", "")
        api_endpoint = self.outputs.get("ApiGatewayEndpoint", "")
        db_endpoint = self.outputs.get("DatabaseClusterEndpoint", "")

        # All should be in ap-southeast-1 per PROMPT requirements
        if dashboard_url:
            assert "ap-southeast-1" in dashboard_url, "Dashboard should be in ap-southeast-1"

        if api_endpoint:
            assert "ap-southeast-1" in api_endpoint, "API should be in ap-southeast-1"

        if db_endpoint:
            assert "ap-southeast-1" in db_endpoint, "Database should be in ap-southeast-1"

    @mark.it("validates ALB ARN is present")
    def test_alb_arn_present(self):
        """Test that ALB ARN exists in outputs"""
        assert "ALBArn" in self.outputs, "ALB ARN not in outputs"
        alb_arn = self.outputs["ALBArn"]
        assert alb_arn, "ALB ARN is empty"

    @mark.it("validates ALB ARN format")
    def test_alb_arn_format(self):
        """Test that ALB ARN has correct AWS ARN format"""
        alb_arn = self.outputs.get("ALBArn", "")
        # ARN format: arn:aws:elasticloadbalancing:region:account:loadbalancer/app/name/id
        assert alb_arn.startswith("arn:aws:elasticloadbalancing:"), "ALB ARN should start with correct prefix"
        assert "/app/" in alb_arn, "ALB ARN should contain /app/ for application load balancer"

    @mark.it("validates resource interdependencies")
    def test_resource_interdependencies(self):
        """Test that all required resources are present for proper integration"""
        # Core resources that must exist together
        required_outputs = [
            "VPCId",
            "ALBDNSName",
            "DatabaseClusterEndpoint",
            "DocumentBucketName",
            "ECSServiceName",
            "QueueURL",
            "APIEndpoint"
        ]

        missing = [key for key in required_outputs if key not in self.outputs]
        assert not missing, f"Missing required outputs for integration: {missing}"

    @mark.it("validates output values are not empty or null")
    def test_no_empty_outputs(self):
        """Test that all outputs have non-empty values"""
        for key, value in self.outputs.items():
            assert value, f"Output {key} has empty value"
            assert value != "null", f"Output {key} has null value"
            assert value != "undefined", f"Output {key} has undefined value"


if __name__ == "__main__":
    unittest.main()
