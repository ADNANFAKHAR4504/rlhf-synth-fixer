"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, PropertyMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.primary_region, 'us-east-1')
        self.assertEqual(args.dr_region, 'us-east-2')
        self.assertEqual(args.domain_name, 'payments-dev.example.com')
        self.assertEqual(args.replication_lag_threshold, 1)
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        args = TapStackArgs(
            environment_suffix='prod',
            primary_region='us-west-1',
            dr_region='us-west-2',
            domain_name='payments.example.com',
            replication_lag_threshold=5,
            tags={'Owner': 'DevOps'}
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.primary_region, 'us-west-1')
        self.assertEqual(args.dr_region, 'us-west-2')
        self.assertEqual(args.domain_name, 'payments.example.com')
        self.assertEqual(args.replication_lag_threshold, 5)
        self.assertEqual(args.tags, {'Owner': 'DevOps'})

    def test_tap_stack_args_none_environment_suffix(self):
        """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')


class MockOutputs:
    """Helper class to mock Pulumi outputs."""
    def __init__(self, value):
        self._value = value

    def apply(self, func):
        """Mock apply method that calls func with the value."""
        result = func(self._value)
        if isinstance(result, str):
            return MockOutputs(result)
        return result


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component resource."""

    def setUp(self):
        """Set up test fixtures before each test."""
        # Set Pulumi to test mode
        pulumi.runtime.set_mocks(MyMocks())

    def test_tap_stack_initialization(self):
        """Test TapStack initialization with default arguments."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify basic attributes
            self.assertEqual(stack.environment_suffix, 'test')
            self.assertEqual(stack.primary_region, 'us-east-1')
            self.assertEqual(stack.dr_region, 'us-east-2')
            self.assertEqual(stack.domain_name, 'payments-test.example.com')

            # Verify common tags
            self.assertIn('Environment', stack.common_tags)
            self.assertEqual(stack.common_tags['Environment'], 'test')
            self.assertEqual(stack.common_tags['ManagedBy'], 'Pulumi')
            self.assertEqual(stack.common_tags['Project'], 'PaymentProcessing')
            self.assertEqual(stack.common_tags['Purpose'], 'DisasterRecovery')

            return {
                'environment': stack.environment_suffix,
                'primary_region': stack.primary_region
            }

        result = test_stack()

    def test_tap_stack_custom_regions(self):
        """Test TapStack with custom regions."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(
                environment_suffix='staging',
                primary_region='eu-west-1',
                dr_region='eu-central-1'
            )
            stack = TapStack("test-stack", args)

            self.assertEqual(stack.primary_region, 'eu-west-1')
            self.assertEqual(stack.dr_region, 'eu-central-1')

            return {}

        test_stack()

    def test_create_sns_topic_primary(self):
        """Test SNS topic creation for primary region."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify SNS topics exist
            self.assertIsNotNone(stack.primary_sns_topic)
            self.assertIsNotNone(stack.dr_sns_topic)

            return {}

        test_stack()

    def test_create_lambda_execution_role(self):
        """Test Lambda execution role creation."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify Lambda role exists
            self.assertIsNotNone(stack.lambda_role)

            return {}

        test_stack()

    def test_create_s3_replication_role(self):
        """Test S3 replication role creation."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify replication role exists
            self.assertIsNotNone(stack.replication_role)

            return {}

        test_stack()

    def test_create_aurora_global_database(self):
        """Test Aurora Global Database creation."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify Aurora resources exist
            self.assertIsNotNone(stack.aurora_global)
            self.assertIn('global_cluster', stack.aurora_global)
            self.assertIn('primary_cluster', stack.aurora_global)
            self.assertIn('primary_instance', stack.aurora_global)
            self.assertIn('dr_cluster', stack.aurora_global)
            self.assertIn('dr_instance', stack.aurora_global)

            return {}

        test_stack()

    def test_create_dynamodb_global_table(self):
        """Test DynamoDB global table creation."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify DynamoDB table exists
            self.assertIsNotNone(stack.dynamodb_table)

            return {}

        test_stack()

    def test_create_s3_buckets_with_replication(self):
        """Test S3 buckets with cross-region replication."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify S3 buckets exist
            self.assertIsNotNone(stack.s3_buckets)
            self.assertIn('primary_bucket', stack.s3_buckets)
            self.assertIn('dr_bucket', stack.s3_buckets)

            return {}

        test_stack()

    def test_create_lambda_functions(self):
        """Test Lambda function creation in both regions."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify Lambda functions exist
            self.assertIsNotNone(stack.lambda_functions)
            self.assertIn('primary_lambda', stack.lambda_functions)
            self.assertIn('dr_lambda', stack.lambda_functions)

            return {}

        test_stack()

    def test_create_api_gateways(self):
        """Test API Gateway creation in both regions."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack("test-stack", args)

            # Verify API Gateways exist
            self.assertIsNotNone(stack.api_gateways)
            self.assertIn('primary_api', stack.api_gateways)
            self.assertIn('primary_stage', stack.api_gateways)
            self.assertIn('dr_api', stack.api_gateways)
            self.assertIn('dr_stage', stack.api_gateways)

            return {}

        test_stack()

    def test_create_monitoring_and_alarms(self):
        """Test CloudWatch monitoring and alarms creation."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(
                environment_suffix='test',
                replication_lag_threshold=3
            )
            stack = TapStack("test-stack", args)

            # Verify monitoring resources exist
            self.assertIsNotNone(stack.monitoring)
            self.assertIn('replication_lag_alarm', stack.monitoring)
            self.assertIn('lambda_error_alarm', stack.monitoring)

            return {}

        test_stack()

    def test_full_stack_with_all_components(self):
        """Test full stack initialization with all components."""

        @pulumi.runtime.test
        def test_stack():
            args = TapStackArgs(
                environment_suffix='integration',
                primary_region='us-east-1',
                dr_region='us-west-2',
                domain_name='payments-int.example.com',
                replication_lag_threshold=2,
                tags={'Team': 'Platform', 'Cost-Center': '12345'}
            )
            stack = TapStack("integration-stack", args)

            # Verify all major components exist
            self.assertIsNotNone(stack.primary_sns_topic)
            self.assertIsNotNone(stack.dr_sns_topic)
            self.assertIsNotNone(stack.lambda_role)
            self.assertIsNotNone(stack.replication_role)
            self.assertIsNotNone(stack.aurora_global)
            self.assertIsNotNone(stack.dynamodb_table)
            self.assertIsNotNone(stack.s3_buckets)
            self.assertIsNotNone(stack.lambda_functions)
            self.assertIsNotNone(stack.api_gateways)
            self.assertIsNotNone(stack.monitoring)

            # Verify DR provider exists
            self.assertIsNotNone(stack.dr_provider)

            return {}

        test_stack()


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi runtime for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resources."""
        outputs = args.inputs

        # Add default outputs based on resource type
        if args.typ == "aws:rds/globalCluster:GlobalCluster":
            outputs["id"] = f"mock-global-cluster-{args.name}"
            outputs["arn"] = f"arn:aws:rds::123456789012:global-cluster:{args.name}"
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs["id"] = f"mock-cluster-{args.name}"
            outputs["endpoint"] = f"{args.name}.cluster-abc123.us-east-1.rds.amazonaws.com"
            outputs["arn"] = f"arn:aws:rds:us-east-1:123456789012:cluster:{args.name}"
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs["id"] = f"mock-instance-{args.name}"
            outputs["endpoint"] = f"{args.name}.abc123.us-east-1.rds.amazonaws.com"
        elif args.typ == "aws:dynamodb/table:Table":
            outputs["id"] = f"mock-table-{args.name}"
            outputs["arn"] = f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs["id"] = f"mock-bucket-{args.name}"
            outputs["arn"] = f"arn:aws:s3:::{args.name}"
            outputs["bucket"] = args.inputs.get("bucket", args.name)
        elif args.typ == "aws:lambda/function:Function":
            outputs["id"] = f"mock-lambda-{args.name}"
            outputs["arn"] = f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}"
            outputs["invoke_arn"] = f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"mock-role-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
            outputs["name"] = args.name
        elif args.typ == "aws:iam/policy:Policy":
            outputs["id"] = f"mock-policy-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:policy/{args.name}"
        elif args.typ == "aws:sns/topic:Topic":
            outputs["id"] = f"mock-topic-{args.name}"
            outputs["arn"] = f"arn:aws:sns:us-east-1:123456789012:{args.name}"
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs["id"] = f"mock-api-{args.name}"
            outputs["root_resource_id"] = f"mock-root-{args.name}"
            outputs["execution_arn"] = f"arn:aws:execute-api:us-east-1:123456789012:{args.name}"
        elif args.typ == "aws:apigateway/resource:Resource":
            outputs["id"] = f"mock-resource-{args.name}"
        elif args.typ == "aws:apigateway/method:Method":
            outputs["id"] = f"mock-method-{args.name}"
        elif args.typ == "aws:apigateway/integration:Integration":
            outputs["id"] = f"mock-integration-{args.name}"
        elif args.typ == "aws:apigateway/deployment:Deployment":
            outputs["id"] = f"mock-deployment-{args.name}"
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs["id"] = f"mock-stage-{args.name}"
            outputs["invoke_url"] = f"https://mock-api.execute-api.us-east-1.amazonaws.com/prod"
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs["id"] = f"mock-alarm-{args.name}"
            outputs["arn"] = f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}"
        elif args.typ == "pulumi:providers:aws":
            outputs["id"] = f"mock-provider-{args.name}"

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


if __name__ == '__main__':
    unittest.main()
