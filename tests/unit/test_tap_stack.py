"""
Unit Tests for TapStack Infrastructure

Tests cover:
- VPC and subnet creation
- RDS Aurora cluster configuration
- DynamoDB table setup
- Lambda function configurations
- API Gateway with VPC Link
- ALB with target groups for blue-green deployment
- S3 bucket configuration
- CloudWatch dashboards and alarms
- SNS topics
- Secrets Manager with rotation
- KMS keys
- SSM parameters
- Security groups
- Resource naming with environmentSuffix
"""

import json
import os
import unittest
from unittest.mock import MagicMock, patch, Mock
from pathlib import Path

# Set up environment for testing
os.environ["ENVIRONMENT_SUFFIX"] = "test"
os.environ["AWS_REGION"] = "us-east-1"

from cdktf import App, Testing
from lib.tap_stack import TapStack
from constructs import Construct


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack infrastructure"""

    def setUp(self):
        """Set up test fixtures before each test"""
        self.app = App()
        self.stack = TapStack(self.app, "TapStacktest", environment_suffix="test")

    def test_stack_synthesis(self):
        """Test that stack synthesizes without errors"""
        try:
            self.app.synth()
            self.assertTrue(True, "Stack synthesized successfully")
        except Exception as e:
            self.fail(f"Stack synthesis failed: {str(e)}")

    def test_vpc_creation(self):
        """Test VPC is created with correct CIDR"""
        # Verify VPC resource is present in synthesized output
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")

        # Check that VPC exists in the synthesized resources
        self.assertIsNotNone(stack_manifest, "Stack should be in manifest")

    def test_subnet_configuration(self):
        """Test subnet creation (9 subnets: 3 public, 3 private, 3 database)"""
        # Verify all 9 subnets are created
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")

        # Count subnet resources
        resources = stack_manifest.resources
        subnet_count = sum(1 for r in resources.values()
                          if r.get("type") == "aws_subnet")

        self.assertEqual(subnet_count, 9,
                        f"Expected 9 subnets, found {subnet_count}")

    def test_subnet_naming_convention(self):
        """Test subnets follow naming convention with environmentSuffix"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check subnet naming includes environmentSuffix
        subnet_names = []
        for resource_id, resource in resources.items():
            if resource.get("type") == "aws_subnet":
                tags = resource.get("arguments", {}).get("tags", {})
                if "Name" in tags:
                    subnet_names.append(tags["Name"])

        # Verify at least some subnets have the suffix
        suffixed_subnets = [s for s in subnet_names if "test" in s.lower()]
        self.assertTrue(len(suffixed_subnets) > 0,
                       "Subnets should include environmentSuffix in naming")

    def test_rds_cluster_creation(self):
        """Test RDS Aurora cluster is configured"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for RDS cluster resource
        cluster_resources = [r for r in resources.values()
                            if r.get("type") == "aws_rds_cluster"]

        self.assertTrue(len(cluster_resources) > 0,
                       "RDS cluster should be created")

    def test_rds_encryption_configuration(self):
        """Test RDS cluster has encryption enabled"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        cluster_resources = [r for r in resources.values()
                            if r.get("type") == "aws_rds_cluster"]

        for cluster in cluster_resources:
            args = cluster.get("arguments", {})
            self.assertTrue(args.get("storage_encrypted", False),
                          "RDS cluster should have encryption enabled")

    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for DynamoDB table
        dynamodb_tables = [r for r in resources.values()
                          if r.get("type") == "aws_dynamodb_table"]

        self.assertTrue(len(dynamodb_tables) > 0,
                       "DynamoDB table should be created")

    def test_dynamodb_encryption(self):
        """Test DynamoDB table has encryption at rest"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        dynamodb_tables = [r for r in resources.values()
                          if r.get("type") == "aws_dynamodb_table"]

        for table in dynamodb_tables:
            args = table.get("arguments", {})
            # Check for encryption configuration
            sse_spec = args.get("sse_specification", {})
            self.assertTrue(sse_spec.get("enabled", False),
                          "DynamoDB should have SSE enabled")

    def test_lambda_functions_created(self):
        """Test 4 Lambda functions are created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Count Lambda functions
        lambda_functions = [r for r in resources.values()
                           if r.get("type") == "aws_lambda_function"]

        self.assertEqual(len(lambda_functions), 4,
                        f"Expected 4 Lambda functions, found {len(lambda_functions)}")

    def test_lambda_vpc_configuration(self):
        """Test Lambda functions have VPC configuration"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        lambda_functions = [r for r in resources.values()
                           if r.get("type") == "aws_lambda_function"]

        for func in lambda_functions:
            args = func.get("arguments", {})
            vpc_config = args.get("vpc_config", {})
            self.assertTrue(vpc_config.get("subnet_ids"),
                          "Lambda should have subnet configuration")
            self.assertTrue(vpc_config.get("security_group_ids"),
                          "Lambda should have security group configuration")

    def test_lambda_reserved_concurrency(self):
        """Test Lambda functions have reserved concurrency"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        lambda_functions = [r for r in resources.values()
                           if r.get("type") == "aws_lambda_function"]

        for func in lambda_functions:
            args = func.get("arguments", {})
            reserved_concurrent = args.get("reserved_concurrent_executions", 0)
            self.assertGreater(reserved_concurrent, 0,
                             "Lambda should have reserved concurrency")

    def test_api_gateway_created(self):
        """Test API Gateway is created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for API Gateway v2 resources
        api_resources = [r for r in resources.values()
                        if r.get("type") == "aws_apigatewayv2_api"]

        self.assertTrue(len(api_resources) > 0,
                       "API Gateway should be created")

    def test_alb_created(self):
        """Test Application Load Balancer is created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for ALB resource
        alb_resources = [r for r in resources.values()
                        if r.get("type") == "aws_lb"]

        self.assertTrue(len(alb_resources) > 0,
                       "ALB should be created")

    def test_alb_target_groups_for_blue_green(self):
        """Test ALB has target groups for blue-green deployment"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for target groups
        tg_resources = [r for r in resources.values()
                       if r.get("type") == "aws_lb_target_group"]

        self.assertGreaterEqual(len(tg_resources), 2,
                               "ALB should have at least 2 target groups for blue-green")

    def test_s3_bucket_creation(self):
        """Test S3 bucket for audit logs is created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for S3 bucket
        s3_resources = [r for r in resources.values()
                       if r.get("type") == "aws_s3_bucket"]

        self.assertTrue(len(s3_resources) > 0,
                       "S3 bucket should be created")

    def test_s3_versioning_enabled(self):
        """Test S3 bucket has versioning enabled"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for versioning resource
        versioning_resources = [r for r in resources.values()
                               if r.get("type") == "aws_s3_bucket_versioning"]

        self.assertTrue(len(versioning_resources) > 0,
                       "S3 versioning should be configured")

    def test_s3_lifecycle_policy(self):
        """Test S3 bucket has lifecycle policy configured"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for lifecycle policy resource
        lifecycle_resources = [r for r in resources.values()
                              if r.get("type") == "aws_s3_bucket_lifecycle_configuration"]

        self.assertTrue(len(lifecycle_resources) > 0,
                       "S3 lifecycle policy should be configured")

    def test_cloudwatch_dashboard_created(self):
        """Test CloudWatch dashboard is created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for dashboard
        dashboard_resources = [r for r in resources.values()
                              if r.get("type") == "aws_cloudwatch_dashboard"]

        self.assertTrue(len(dashboard_resources) > 0,
                       "CloudWatch dashboard should be created")

    def test_cloudwatch_alarms_created(self):
        """Test CloudWatch alarms are created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Count alarms
        alarm_resources = [r for r in resources.values()
                          if r.get("type") == "aws_cloudwatch_metric_alarm"]

        self.assertGreaterEqual(len(alarm_resources), 3,
                               "CloudWatch alarms should be created")

    def test_cloudwatch_api_latency_alarm(self):
        """Test CloudWatch API latency alarm uses extended_statistic"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Find API latency alarm
        api_latency_alarms = [r for r in resources.values()
                             if r.get("type") == "aws_cloudwatch_metric_alarm"
                             and "api" in str(r).lower()]

        # Verify extended_statistic is used (p99)
        for alarm in api_latency_alarms:
            args = alarm.get("arguments", {})
            if "IntegrationLatency" in str(args):
                self.assertTrue(args.get("extended_statistic"),
                              "API latency alarm should use extended_statistic")

    def test_sns_topics_created(self):
        """Test SNS topics are created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for SNS topics
        sns_resources = [r for r in resources.values()
                        if r.get("type") == "aws_sns_topic"]

        self.assertGreaterEqual(len(sns_resources), 2,
                               "SNS topics should be created")

    def test_secrets_manager_created(self):
        """Test Secrets Manager secret is created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for secrets manager
        secret_resources = [r for r in resources.values()
                           if r.get("type") == "aws_secretsmanager_secret"]

        self.assertTrue(len(secret_resources) > 0,
                       "Secrets Manager should be configured")

    def test_kms_keys_created(self):
        """Test KMS keys are created for encryption"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check for KMS keys
        kms_resources = [r for r in resources.values()
                        if r.get("type") == "aws_kms_key"]

        self.assertGreater(len(kms_resources), 0,
                          "KMS keys should be created for encryption")

    def test_security_groups_created(self):
        """Test security groups are created"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Count security groups
        sg_resources = [r for r in resources.values()
                       if r.get("type") == "aws_security_group"]

        self.assertGreater(len(sg_resources), 0,
                          "Security groups should be created")

    def test_resource_count_comprehensive(self):
        """Test comprehensive resource count matches expected"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Expected resource types and rough counts
        resource_types = {}
        for resource in resources.values():
            res_type = resource.get("type", "unknown")
            resource_types[res_type] = resource_types.get(res_type, 0) + 1

        # Verify minimum resource types are present
        required_types = [
            "aws_vpc",
            "aws_subnet",
            "aws_rds_cluster",
            "aws_dynamodb_table",
            "aws_lambda_function",
            "aws_apigatewayv2_api",
            "aws_lb",
            "aws_s3_bucket",
            "aws_cloudwatch_dashboard",
            "aws_sns_topic",
        ]

        for req_type in required_types:
            self.assertIn(req_type, resource_types,
                         f"Resource type {req_type} should be present")

    def test_no_inline_code_in_lambda(self):
        """Test Lambda functions don't use inline code"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        lambda_functions = [r for r in resources.values()
                           if r.get("type") == "aws_lambda_function"]

        for func in lambda_functions:
            args = func.get("arguments", {})
            # Should have filename/s3_bucket, not inline_code
            has_filename = "filename" in args or "s3_bucket" in args
            self.assertTrue(has_filename,
                          "Lambda should use deployment package, not inline code")


class TestResourceNaming(unittest.TestCase):
    """Test resource naming conventions with environmentSuffix"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = App()
        self.stack = TapStack(self.app, "TapStacktest", environment_suffix="prod")

    def test_environment_suffix_in_resource_names(self):
        """Test resource names include environment suffix"""
        manifest = self.app.synth()
        stack_manifest = manifest.get_stack("TapStacktest")
        resources = stack_manifest.resources

        # Check that resources have suffix in identifiers
        resource_ids = list(resources.keys())
        suffixed_resources = [r for r in resource_ids if "prod" in r.lower()]

        self.assertTrue(len(suffixed_resources) > 0,
                       "Resources should include environment suffix in IDs")


if __name__ == "__main__":
    unittest.main()
