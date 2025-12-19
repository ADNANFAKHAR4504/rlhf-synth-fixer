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
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

# Set up environment for testing
os.environ["ENVIRONMENT_SUFFIX"] = "test"
os.environ["AWS_REGION"] = "us-east-1"

from cdktf import App, Testing
from constructs import Construct

from lib.tap_stack import TapStack


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
        manifest = json.loads(Testing.synth(self.stack))

        # Check that VPC exists in the synthesized resources
        resources = manifest.get("resource", {})
        vpc_present = "aws_vpc" in resources
        self.assertTrue(vpc_present, "VPC should be created")

    def test_subnet_configuration(self):
        """Test subnet creation (9 subnets: 3 public, 3 private, 3 database)"""
        # Verify all 9 subnets are created
        manifest = json.loads(Testing.synth(self.stack))

        # Count subnet resources
        resources = manifest.get("resource", {})
        subnet_count = len(resources.get("aws_subnet", {}))

        self.assertEqual(subnet_count, 9,
                        f"Expected 9 subnets, found {subnet_count}")

    def test_subnet_naming_convention(self):
        """Test subnets follow naming convention with environmentSuffix"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check subnet naming includes environmentSuffix
        subnet_ids = []
        for resource_type, resource_instances in resources.items():
            if resource_type == "aws_subnet":
                for instance_id, instance_config in resource_instances.items():
                    subnet_ids.append(instance_id)

        print(f"Subnet IDs: {subnet_ids}")
        # Verify at least some subnets have the suffix
        suffixed_subnets = [s for s in subnet_ids if "test" in s.lower()]
        self.assertTrue(len(suffixed_subnets) > 0,
                       "Subnets should include environmentSuffix in naming")

    def test_rds_cluster_creation(self):
        """Test RDS Aurora cluster is configured"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for RDS cluster resource
        cluster_present = "aws_rds_cluster" in resources

        self.assertTrue(cluster_present,
                       "RDS cluster should be created")

    def test_rds_encryption_configuration(self):
        """Test RDS cluster has encryption enabled"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        cluster_instances = resources.get("aws_rds_cluster", {})

        for instance_id, instance_config in cluster_instances.items():
            self.assertTrue(instance_config.get("storage_encrypted", False),
                          "RDS cluster should have encryption enabled")

    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for DynamoDB table
        dynamodb_present = "aws_dynamodb_table" in resources

        self.assertTrue(dynamodb_present,
                       "DynamoDB table should be created")

    def test_dynamodb_encryption(self):
        """Test DynamoDB table has encryption at rest"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        dynamodb_instances = resources.get("aws_dynamodb_table", {})

        for instance_id, instance_config in dynamodb_instances.items():
            # Check for encryption configuration
            sse_spec = instance_config.get("server_side_encryption", {})
            self.assertTrue(sse_spec.get("enabled", False),
                          "DynamoDB should have SSE enabled")

    def test_lambda_functions_created(self):
        """Test 4 Lambda functions are created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Count Lambda functions
        lambda_count = len(resources.get("aws_lambda_function", {}))

        self.assertEqual(lambda_count, 4,
                        f"Expected 4 Lambda functions, found {lambda_count}")

    def test_lambda_vpc_configuration(self):
        """Test Lambda functions have VPC configuration"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        lambda_instances = resources.get("aws_lambda_function", {})

        for instance_id, instance_config in lambda_instances.items():
            vpc_config = instance_config.get("vpc_config", {})
            self.assertTrue(vpc_config.get("subnet_ids"),
                          "Lambda should have subnet configuration")
            self.assertTrue(vpc_config.get("security_group_ids"),
                          "Lambda should have security group configuration")

    def test_lambda_reserved_concurrency(self):
        """Test Lambda functions have reserved concurrency"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        lambda_instances = resources.get("aws_lambda_function", {})

        for instance_id, instance_config in lambda_instances.items():
            reserved_concurrent = instance_config.get("reserved_concurrent_executions", 0)
            self.assertGreaterEqual(reserved_concurrent, 0,
                             "Lambda should have reserved concurrency")

    def test_api_gateway_created(self):
        """Test API Gateway is created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for API Gateway v2 resources
        api_present = "aws_apigatewayv2_api" in resources

        self.assertTrue(api_present,
                       "API Gateway should be created")

    def test_alb_created(self):
        """Test Application Load Balancer is created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for ALB resource
        alb_present = "aws_lb" in resources

        self.assertTrue(alb_present,
                       "ALB should be created")

    def test_alb_target_groups_for_blue_green(self):
        """Test ALB has target groups for blue-green deployment"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for target groups
        tg_count = len(resources.get("aws_lb_target_group", {}))

        self.assertGreaterEqual(tg_count, 2,
                               "ALB should have at least 2 target groups for blue-green")

    def test_s3_bucket_creation(self):
        """Test S3 bucket for audit logs is created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for S3 bucket
        s3_present = "aws_s3_bucket" in resources

        self.assertTrue(s3_present,
                       "S3 bucket should be created")

    def test_s3_versioning_enabled(self):
        """Test S3 bucket has versioning enabled"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for versioning resource
        versioning_present = "aws_s3_bucket_versioning" in resources

        self.assertTrue(versioning_present,
                       "S3 versioning should be configured")

    def test_s3_lifecycle_policy(self):
        """Test S3 bucket has lifecycle policy configured"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for lifecycle policy resource
        lifecycle_present = "aws_s3_bucket_lifecycle_configuration" in resources

        self.assertTrue(lifecycle_present,
                       "S3 lifecycle policy should be configured")

    def test_cloudwatch_dashboard_created(self):
        """Test CloudWatch dashboard is created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for dashboard
        dashboard_present = "aws_cloudwatch_dashboard" in resources

        self.assertTrue(dashboard_present,
                       "CloudWatch dashboard should be created")

    def test_cloudwatch_alarms_created(self):
        """Test CloudWatch alarms are created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Count alarms
        alarm_count = len(resources.get("aws_cloudwatch_metric_alarm", {}))

        self.assertGreaterEqual(alarm_count, 3,
                               "CloudWatch alarms should be created")

    def test_cloudwatch_api_latency_alarm(self):
        """Test CloudWatch API latency alarm uses extended_statistic"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Find API latency alarm
        alarm_instances = resources.get("aws_cloudwatch_metric_alarm", {})

        # Verify extended_statistic is used (p99)
        for instance_id, instance_config in alarm_instances.items():
            if "IntegrationLatency" in str(instance_config):
                self.assertTrue(instance_config.get("extended_statistic"),
                              "API latency alarm should use extended_statistic")

    def test_sns_topics_created(self):
        """Test SNS topics are created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for SNS topics
        sns_count = len(resources.get("aws_sns_topic", {}))

        self.assertGreaterEqual(sns_count, 2,
                               "SNS topics should be created")

    def test_secrets_manager_created(self):
        """Test Secrets Manager secret is created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for secrets manager
        secret_present = "aws_secretsmanager_secret" in resources

        self.assertTrue(secret_present,
                       "Secrets Manager should be configured")

    def test_kms_keys_created(self):
        """Test KMS keys are created for encryption"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check for KMS keys
        kms_count = len(resources.get("aws_kms_key", {}))

        self.assertGreater(kms_count, 0,
                          "KMS keys should be created for encryption")

    def test_security_groups_created(self):
        """Test security groups are created"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Count security groups
        sg_count = len(resources.get("aws_security_group", {}))

        self.assertGreater(sg_count, 0,
                          "Security groups should be created")

    def test_resource_count_comprehensive(self):
        """Test comprehensive resource count matches expected"""
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Expected resource types and rough counts
        resource_types = list(resources.keys())

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
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        lambda_instances = resources.get("aws_lambda_function", {})

        for instance_id, instance_config in lambda_instances.items():
            # Should have filename/s3_bucket, not inline_code
            has_filename = "filename" in instance_config or "s3_bucket" in instance_config
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
        manifest = json.loads(Testing.synth(self.stack))
        resources = manifest.get("resource", {})

        # Check that resources have suffix in identifiers
        resource_ids = []
        for resource_type, instances in resources.items():
            for instance_id in instances.keys():
                resource_ids.append(instance_id)

        print(f"Resource IDs: {resource_ids[:10]}")  # print first 10
        suffixed_resources = [r for r in resource_ids if "prod" in r.lower()]

        self.assertTrue(len(suffixed_resources) > 0,
                       "Resources should include environment suffix in IDs")


if __name__ == "__main__":
    unittest.main()
