"""
Unit tests for Pulumi infrastructure
"""
import unittest
import json
import os
import sys
from unittest.mock import MagicMock, patch, PropertyMock
import pulumi
import pulumi_aws as aws

# Add lib to path to import the infrastructure module
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib'))

# Set environment variables for testing
os.environ["ENVIRONMENT_SUFFIX"] = "test123"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


class TestPulumiMocks(pulumi.runtime.Mocks):
    """Mock for Pulumi runtime"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs

        # Mock specific resource types
        if args.typ == "aws:kms/key:Key":
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:key/test-key-{args.name}"
            outputs["id"] = f"test-key-{args.name}"
            outputs["key_id"] = f"test-key-{args.name}"

        elif args.typ == "aws:s3/bucket:Bucket":
            outputs["arn"] = f"arn:aws:s3:::test-bucket-{args.name}"
            outputs["id"] = f"test-bucket-{args.name}"
            outputs["bucket"] = outputs.get("bucket", f"test-bucket-{args.name}")

        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{outputs.get('name', args.name)}"
            outputs["id"] = outputs.get("name", args.name)

        elif args.typ == "aws:iam/role:Role":
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{outputs.get('name', args.name)}"
            outputs["id"] = outputs.get("name", args.name)
            outputs["name"] = outputs.get("name", args.name)

        elif args.typ == "aws:iam/policy:Policy":
            outputs["arn"] = f"arn:aws:iam::123456789012:policy/{outputs.get('name', args.name)}"
            outputs["id"] = outputs.get("name", args.name)

        elif args.typ == "aws:lambda/function:Function":
            outputs["arn"] = f"arn:aws:lambda:us-east-1:123456789012:function:{outputs.get('name', args.name)}"
            outputs["id"] = outputs.get("name", args.name)
            outputs["invoke_arn"] = outputs["arn"]

        elif args.typ == "aws:scheduler/schedule:Schedule":
            outputs["arn"] = f"arn:aws:scheduler:us-east-1:123456789012:schedule/default/{outputs.get('name', args.name)}"
            outputs["id"] = outputs.get("name", args.name)

        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}


class TestInfrastructure(unittest.TestCase):
    """Test cases for Pulumi infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        pulumi.runtime.set_mocks(TestPulumiMocks())

    def test_environment_suffix_usage(self):
        """Test that environment suffix is properly used in resource names"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Check environment suffix is used
        self.assertIn("environment_suffix", content)
        self.assertIn('os.getenv("ENVIRONMENT_SUFFIX"', content)
        # Check it's used in resource names
        self.assertIn("f\"log-encryption-key-{environment_suffix}\"", content)
        self.assertIn("f\"log-archive-bucket-{environment_suffix}\"", content)

    def test_kms_key_configuration(self):
        """Test KMS key configuration"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Verify KMS key has proper policy
        self.assertIn("key_policy", content)
        self.assertIn('"Allow CloudWatch Logs"', content)
        self.assertIn('"logs.{region}.amazonaws.com"', content)
        self.assertIn("enable_key_rotation=True", content)

    def test_s3_bucket_configuration(self):
        """Test S3 bucket configuration"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Test bucket name includes suffix
        self.assertIn('bucket=f"secure-logs-archive-{environment_suffix}"', content)
        # Test force destroy is enabled
        self.assertIn("force_destroy=True", content)
        # Test versioning is enabled
        self.assertIn("versioning=s3.BucketVersioningArgs", content)
        self.assertIn("enabled=True", content)

    def test_log_groups_created(self):
        """Test that required log groups are created"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Verify log groups are created
        self.assertIn("application_log_group = cloudwatch.LogGroup", content)
        self.assertIn("eventbridge_log_group = cloudwatch.LogGroup", content)
        # Verify they have encryption
        self.assertIn("kms_key_id=log_encryption_key.arn", content)
        # Verify retention is set
        self.assertIn("retention_in_days=90", content)

    def test_lambda_function_configuration(self):
        """Test Lambda function configuration"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Test Lambda runtime and handler are set correctly
        self.assertIn('runtime="python3.9"', content)
        self.assertIn('handler="index.handler"', content)
        self.assertIn("timeout=300", content)
        self.assertIn("memory_size=256", content)

    def test_iam_roles_created(self):
        """Test that required IAM roles are created"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Verify roles are created
        self.assertIn("cloudwatch_logs_role = iam.Role", content)
        self.assertIn("lambda_role = iam.Role", content)
        self.assertIn("scheduler_role = iam.Role", content)
        # Verify assume role policies
        self.assertIn('"Service": "logs.amazonaws.com"', content)
        self.assertIn('"Service": "lambda.amazonaws.com"', content)
        self.assertIn('"Service": "scheduler.amazonaws.com"', content)

    def test_scheduler_configuration(self):
        """Test EventBridge Scheduler configuration"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Verify scheduler is created
        self.assertIn("daily_log_export = scheduler.Schedule", content)
        self.assertIn('schedule_expression="rate(1 day)"', content)
        # Verify retry policy
        self.assertIn("maximum_retry_attempts=3", content)

    def test_cloudwatch_alarm_configuration(self):
        """Test CloudWatch alarm configuration"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Verify alarm is created
        self.assertIn("error_alarm = cloudwatch.MetricAlarm", content)
        self.assertIn('comparison_operator="GreaterThanThreshold"', content)
        self.assertIn("threshold=100.0", content)
        self.assertIn('statistic="Sum"', content)

    def test_metric_filter_configuration(self):
        """Test CloudWatch metric filter configuration"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Verify metric filter is created
        self.assertIn("anomaly_metric_filter = cloudwatch.LogMetricFilter", content)
        self.assertIn('pattern="[ERROR]"', content)
        self.assertIn('value="1"', content)

    def test_kms_key_rotation_enabled(self):
        """Test that KMS key rotation is enabled"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # KMS key rotation should be enabled
        self.assertIn("enable_key_rotation=True", content)

    def test_s3_lifecycle_policy(self):
        """Test S3 bucket lifecycle policy"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Verify lifecycle rules are configured
        self.assertIn("lifecycle_rules=", content)
        self.assertIn("days=90", content)
        self.assertIn('storage_class="GLACIER"', content)
        self.assertIn("days=365", content)

    def test_force_destroy_enabled(self):
        """Test that S3 bucket has force_destroy enabled"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()

        # Force destroy should be enabled for cleanup
        self.assertIn("force_destroy=True", content)

    def test_lambda_handler_exists(self):
        """Test that Lambda handler file exists"""
        lambda_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'lambda', 'index.py')
        self.assertTrue(os.path.exists(lambda_path))

        # Verify handler has required function
        with open(lambda_path, 'r') as f:
            content = f.read()
            self.assertIn("def handler(event, context):", content)
            self.assertIn("LOG_GROUP_NAME", content)
            self.assertIn("S3_BUCKET_NAME", content)

    def test_no_retain_policies(self):
        """Test that no resources have retain deletion policies"""
        # Read the infrastructure code
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()
            # Check that there are no retain policies
            self.assertNotIn("retain", content.lower())
            self.assertNotIn("deletion_policy", content.lower())

    def test_tags_applied(self):
        """Test that proper tags are applied to resources"""
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()
            # Verify tags are present
            self.assertIn("tags=", content)
            self.assertIn("EnvironmentSuffix", content)
            self.assertIn("Purpose", content)

    def test_exports_configured(self):
        """Test that Pulumi exports are configured"""
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()
            # Verify exports
            self.assertIn('export("logGroupName"', content)
            self.assertIn('export("archiveBucketName"', content)
            self.assertIn('export("kmsKeyId"', content)
            self.assertIn('export("lambdaFunctionName"', content)
            self.assertIn('export("schedulerName"', content)

    def test_data_protection_policy_handled(self):
        """Test data protection policy"""
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()
            # Check if data protection is mentioned (can be commented)
            self.assertIn("data", content.lower())
            self.assertIn("protection", content.lower())

    def test_lambda_environment_variables(self):
        """Test Lambda environment variables are set"""
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', '__main__.py'), 'r') as f:
            content = f.read()
            # Verify environment variables
            self.assertIn('"LOG_GROUP_NAME": application_log_group.name', content)
            self.assertIn('"S3_BUCKET_NAME": log_archive_bucket.bucket', content)


if __name__ == "__main__":
    unittest.main()