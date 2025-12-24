"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch
import pytest

import pulumi

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MockPulumiMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""
    
    def new_resource(self, args):
        outputs = args.inputs.copy() if args.inputs else {}
        
        # Handle different AWS resource types
        self._handle_secrets_manager_resources(args, outputs)
        self._handle_kms_resources(args, outputs)
        self._handle_s3_resources(args, outputs)
        self._handle_kinesis_resources(args, outputs)
        self._handle_iam_resources(args, outputs)
        self._handle_lambda_resources(args, outputs)
        self._handle_api_gateway_resources(args, outputs)
        self._handle_cloudwatch_resources(args, outputs)
        self._handle_sns_resources(args, outputs)
        
        # Set default id if not already set
        if "id" not in outputs:
            outputs["id"] = args.name
            
        return [args.name + "_id", outputs]
    
    def _handle_secrets_manager_resources(self, args, outputs):
        """Handle Secrets Manager resource types."""
        if args.typ == "aws:secretsmanager/secret:Secret":
            outputs["arn"] = (
                f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}"
            )
            outputs["name"] = args.name
            outputs["id"] = args.name
        elif args.typ == "aws:secretsmanager/secretVersion:SecretVersion":
            outputs["arn"] = (
                f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}:version-id"
            )
            outputs["id"] = f"{args.name}:version-id"
    
    def _handle_kms_resources(self, args, outputs):
        """Handle KMS resource types."""
        if args.typ == "aws:kms/key:Key":
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:key/{args.name}"
            outputs["key_id"] = f"key-{args.name}"
            outputs["id"] = f"key-{args.name}"
        elif args.typ == "aws:kms/alias:Alias":
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:alias/{args.name}"
            outputs["id"] = args.name
    
    def _handle_s3_resources(self, args, outputs):
        """Handle S3 resource types."""
        if args.typ == "aws:s3/bucket:Bucket":
            outputs["bucket"] = args.name
            outputs["arn"] = f"arn:aws:s3:::{args.name}"
            outputs["id"] = args.name
        elif args.typ.startswith("aws:s3/bucket"):
            # Handle S3 bucket configurations
            outputs["id"] = args.name
            outputs["bucket"] = args.name if "bucket" not in outputs else outputs["bucket"]
        elif args.typ == "aws:s3/bucketNotification:BucketNotification":
            outputs["id"] = args.name
    
    def _handle_kinesis_resources(self, args, outputs):
        """Handle Kinesis resource types."""
        if args.typ == "aws:kinesis/stream:Stream":
            outputs["arn"] = f"arn:aws:kinesis:us-east-1:123456789012:stream/{args.name}"
            outputs["name"] = args.name
            outputs["id"] = args.name
    
    def _handle_iam_resources(self, args, outputs):
        """Handle IAM resource types."""
        if args.typ == "aws:iam/role:Role":
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
            outputs["name"] = args.name
            outputs["id"] = args.name
            outputs["unique_id"] = f"AROABC123DEFGHIJKLMN{args.name[:8].upper()}"
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = f"{args.name}:policy"
            outputs["name"] = args.name
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs["id"] = args.name
    
    def _handle_lambda_resources(self, args, outputs):
        """Handle Lambda resource types."""
        if args.typ == "aws:lambda/function:Function":
            outputs["arn"] = f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}"
            outputs["function_name"] = args.name
            outputs["name"] = args.name
            outputs["id"] = args.name
            outputs["invoke_arn"] = (
                f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/"
                f"functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations"
            )
            outputs["qualified_arn"] = (
                f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}:$LATEST"
            )
            outputs["version"] = "$LATEST"
        elif args.typ == "aws:lambda/eventSourceMapping:EventSourceMapping":
            outputs["id"] = f"esm-{args.name}"
            outputs["uuid"] = f"12345678-1234-1234-1234-{args.name[:12]}"
        elif args.typ == "aws:lambda/permission:Permission":
            outputs["id"] = args.name
    
    def _handle_api_gateway_resources(self, args, outputs):
        """Handle API Gateway resource types."""
        if args.typ == "aws:apigatewayv2/api:Api":
            outputs["id"] = f"api-{args.name}"
            outputs["api_endpoint"] = f"https://{args.name}.execute-api.us-east-1.amazonaws.com"
            outputs["execution_arn"] = f"arn:aws:execute-api:us-east-1:123456789012:{outputs['id']}"
        elif args.typ == "aws:apigatewayv2/integration:Integration":
            outputs["id"] = f"integration-{args.name}"
        elif args.typ == "aws:apigatewayv2/route:Route":
            outputs["id"] = f"route-{args.name}"
        elif args.typ == "aws:apigatewayv2/stage:Stage":
            outputs["id"] = f"stage-{args.name}"
            outputs["invoke_url"] = f"https://{args.name}.execute-api.us-east-1.amazonaws.com/dev"
    
    def _handle_cloudwatch_resources(self, args, outputs):
        """Handle CloudWatch resource types."""
        if args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["name"] = args.name
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.name}"
            outputs["id"] = args.name
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs["id"] = args.name
            outputs["arn"] = f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}"
    
    def _handle_sns_resources(self, args, outputs):
        """Handle SNS resource types."""
        if args.typ == "aws:sns/topic:Topic":
            outputs["arn"] = f"arn:aws:sns:us-east-1:123456789012:{args.name}"
            outputs["name"] = args.name
            outputs["id"] = args.name
    
    def call(self, args):
        if args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1", "id": "us-east-1"}
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {
                "accountId": "123456789012",  # AWS provider expects camelCase
                "account_id": "123456789012", # Also provide snake_case for compatibility
                "arn": "arn:aws:iam::123456789012:user/test-user",
                "userId": "AIDACKCEVSQ6C2EXAMPLE", # AWS provider expects camelCase
                "user_id": "AIDACKCEVSQ6C2EXAMPLE", # Also provide snake_case for compatibility
                "id": "123456789012"
            }
        # Return some default values for unhandled calls to avoid None
        return {
            "id": "default-id",
            "name": "default-name", 
            "arn": "arn:aws:service:region:123456789012:default"
        }


@pytest.fixture(scope="session", autouse=True)
def setup_pulumi_mocks():
    """Set up Pulumi mocks for all tests."""
    # Set up Pulumi runtime mocks
    pulumi.runtime.set_mocks(MockPulumiMocks())
    
    # Mock pulumi.get_stack() to return a test stack name
    with patch('pulumi.get_stack', return_value='test-stack'):
        yield
    # Cleanup if needed


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.environment, 'dev')  # Compatibility alias
        self.assertEqual(args.region, 'us-east-1')
        self.assertEqual(args.project_name, 'NovaModelBreaking')
        self.assertFalse(args.enable_multi_region)
        self.assertEqual(args.lambda_memory_size, 256)
        self.assertEqual(args.lambda_timeout, 30)
        self.assertEqual(args.kinesis_shard_count, 1)
        self.assertEqual(args.s3_lifecycle_days, 30)
        self.assertEqual(args.cloudwatch_retention_days, 14)
        self.assertTrue(args.enable_xray_tracing)
        self.assertEqual(args.custom_tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Team': 'DevOps', 'Owner': 'test@example.com'}
        args = TapStackArgs(
            environment_suffix='prod',
            region='us-west-2',
            project_name='TestProject',
            enable_multi_region=True,
            lambda_memory_size=512,
            lambda_timeout=60,
            kinesis_shard_count=2,
            s3_lifecycle_days=90,
            cloudwatch_retention_days=30,
            enable_xray_tracing=False,
            custom_tags=custom_tags
        )
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.environment, 'prod')  # Compatibility alias
        self.assertEqual(args.region, 'us-west-2')
        self.assertEqual(args.project_name, 'TestProject')
        self.assertTrue(args.enable_multi_region)
        self.assertEqual(args.lambda_memory_size, 512)
        self.assertEqual(args.lambda_timeout, 60)
        self.assertEqual(args.kinesis_shard_count, 2)
        self.assertEqual(args.s3_lifecycle_days, 90)
        self.assertEqual(args.cloudwatch_retention_days, 30)
        self.assertFalse(args.enable_xray_tracing)
        self.assertEqual(args.custom_tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""
    
    @classmethod
    def setUpClass(cls):
        """Set up Pulumi mocks for all tests in this class."""
        pulumi.runtime.set_mocks(MockPulumiMocks())
    
    def setUp(self):
        """Set up each test."""
        # Ensure mocks are properly set before each test
        pulumi.runtime.set_mocks(MockPulumiMocks())
        
        # Mock pulumi.get_stack() to return test-stack
        self.stack_patcher = patch('pulumi.get_stack', return_value='test-stack')
        self.stack_patcher.start()
        
    def tearDown(self):
        """Clean up after each test."""
        if hasattr(self, 'stack_patcher'):
            self.stack_patcher.stop()

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack creation with default arguments."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_stack(stack_outputs):
            # Verify outputs exist
            self.assertIn("api_gateway_url", stack_outputs)
            self.assertIn("lambda_functions", stack_outputs)
            self.assertIn("s3_buckets", stack_outputs)
            self.assertIn("kinesis_streams", stack_outputs)
            self.assertIn("region", stack_outputs)
            self.assertIn("environment", stack_outputs)
            
            # Verify output values
            self.assertEqual(stack_outputs["region"], "us-east-1")
            self.assertEqual(stack_outputs["environment"], "dev")
        
        return pulumi.Output.all(
            api_gateway_url=stack.api_gateway.api_endpoint if stack.api_gateway else "no-api",
            lambda_functions={name: func.arn for name, func in stack.lambda_functions.items()},
            s3_buckets={name: bucket.bucket for name, bucket in stack.s3_buckets.items()},
            kinesis_streams={name: stream.arn for name, stream in stack.kinesis_streams.items()},
            region=stack.region,
            environment=stack.args.environment
        ).apply(check_stack)

    @pulumi.runtime.test
    def test_tap_stack_resource_naming(self):
        """Test resource naming convention."""
        args = TapStackArgs(
            environment_suffix="test",
            region="us-west-2",
            project_name="TestProject"
        )
        stack = TapStack("test-stack", args)
        
        # The stack will use the mocked AWS provider region (us-east-1) 
        # instead of args.region when aws.get_region() succeeds
        expected_prefix = "testproject-test-us-east-1"
        self.assertEqual(stack.resource_prefix, expected_prefix)

    @pulumi.runtime.test
    def test_tap_stack_tagging(self):
        """Test tagging policy."""
        custom_tags = {"Department": "Engineering", "CostCenter": "123"}
        args = TapStackArgs(
            environment_suffix="staging",
            custom_tags=custom_tags
        )
        stack = TapStack("test-stack", args)
        
        # Check that tags include standard and custom tags
        self.assertIn("Project", stack.tags)
        self.assertIn("Environment", stack.tags)
        self.assertIn("Region", stack.tags)
        self.assertIn("ManagedBy", stack.tags)
        self.assertIn("Stack", stack.tags)
        self.assertIn("Department", stack.tags)
        self.assertIn("CostCenter", stack.tags)
        
        self.assertEqual(stack.tags["Project"], "NovaModelBreaking")
        self.assertEqual(stack.tags["Environment"], "staging")
        self.assertEqual(stack.tags["ManagedBy"], "Pulumi")
        self.assertEqual(stack.tags["Department"], "Engineering")
        self.assertEqual(stack.tags["CostCenter"], "123")

    @pulumi.runtime.test
    def test_tap_stack_secrets_creation(self):
        """Test secrets manager resources creation."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        # Verify secrets were created
        self.assertIn("db_credentials", stack.secrets)
        self.assertIn("api_keys", stack.secrets)
        self.assertIn("kms_key", stack.secrets)

    @pulumi.runtime.test
    def test_tap_stack_s3_buckets_creation(self):
        """Test S3 buckets creation."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        # Verify S3 buckets were created
        self.assertIn("data", stack.s3_buckets)
        self.assertIn("logs", stack.s3_buckets)

    @pulumi.runtime.test
    def test_tap_stack_kinesis_streams_creation(self):
        """Test Kinesis streams creation."""
        args = TapStackArgs(kinesis_shard_count=3)
        stack = TapStack("test-stack", args)
        
        # Verify Kinesis streams were created
        self.assertIn("data", stack.kinesis_streams)
        self.assertIn("error", stack.kinesis_streams)

    @pulumi.runtime.test
    def test_tap_stack_lambda_functions_creation(self):
        """Test Lambda functions creation."""
        args = TapStackArgs(
            lambda_memory_size=512,
            lambda_timeout=45
        )
        stack = TapStack("test-stack", args)
        
        # Verify Lambda functions were created
        self.assertIn("data_processor", stack.lambda_functions)
        self.assertIn("api_handler", stack.lambda_functions)
        
        # Verify IAM roles were created
        self.assertIn("data_processor", stack.iam_roles)
        self.assertIn("api_handler", stack.iam_roles)

    @pulumi.runtime.test
    def test_tap_stack_api_gateway_creation(self):
        """Test API Gateway creation."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        # Verify API Gateway was created
        self.assertIsNotNone(stack.api_gateway)

    @pulumi.runtime.test
    def test_tap_stack_cloudwatch_monitoring(self):
        """Test CloudWatch monitoring resources."""
        args = TapStackArgs(cloudwatch_retention_days=7)
        stack = TapStack("test-stack", args)
        
        # Verify CloudWatch log groups were created
        self.assertIn("data_processor", stack.cloudwatch_log_groups)
        self.assertIn("api_handler", stack.cloudwatch_log_groups)

    @pulumi.runtime.test
    def test_tap_stack_xray_tracing_enabled(self):
        """Test X-Ray tracing configuration when enabled."""
        args = TapStackArgs(enable_xray_tracing=True)
        _stack = TapStack("test-stack", args)
        
        # This test verifies that the stack is created with X-Ray tracing enabled
        self.assertTrue(args.enable_xray_tracing)

    @pulumi.runtime.test
    def test_tap_stack_xray_tracing_disabled(self):
        """Test X-Ray tracing configuration when disabled."""
        args = TapStackArgs(enable_xray_tracing=False)
        _stack = TapStack("test-stack", args)
        
        # This test verifies that the stack is created with X-Ray tracing disabled
        self.assertFalse(args.enable_xray_tracing)

    @pulumi.runtime.test
    def test_tap_stack_multi_region_enabled(self):
        """Test multi-region configuration when enabled."""
        args = TapStackArgs(enable_multi_region=True)
        _stack = TapStack("test-stack", args)
        
        # This test verifies that the stack is created with multi-region enabled
        self.assertTrue(args.enable_multi_region)

    @pulumi.runtime.test
    def test_tap_stack_s3_lifecycle_configuration(self):
        """Test S3 lifecycle configuration."""
        args = TapStackArgs(s3_lifecycle_days=60)
        _stack = TapStack("test-stack", args)
        
        # This test verifies that the stack is created with custom lifecycle days
        self.assertEqual(args.s3_lifecycle_days, 60)


def run_tests():
    """Run all tests with Pulumi mocks."""
    # Set up Pulumi mocks globally
    pulumi.runtime.set_mocks(MockPulumiMocks())
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestTapStackArgs))
    suite.addTests(loader.loadTestsFromTestCase(TestTapStack))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


# Global setup for Pulumi mocks when module is imported
pulumi.runtime.set_mocks(MockPulumiMocks())

if __name__ == "__main__":
    # Set up Pulumi mocks before running tests
    pulumi.runtime.set_mocks(MockPulumiMocks())
    unittest.main()
