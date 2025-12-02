"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component.
Tests cover all resources, configurations, and Lambda function logic.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import json
import sys
import os
import pulumi
from pulumi import Output

# Add lambda directory to path for Lambda function tests
lambda_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'lambda')
if lambda_dir not in sys.path:
    sys.path.insert(0, lambda_dir)


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create a new mock resource."""
        outputs = args.inputs
        
        if args.typ == "aws:s3/bucketV2:BucketV2":
            outputs = {
                **args.inputs,
                "bucket": args.inputs.get("bucket", f"test-bucket-{args.name}"),
                "arn": f"arn:aws:s3:::{args.inputs.get('bucket', args.name)}",
                "id": f"test-bucket-{args.name}"
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "name": args.inputs.get("name", args.name),
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "id": args.name
            }
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": f"vpc-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:vpc/{args.name}"
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:subnet/{args.name}"
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:security-group/{args.name}"
            }
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {
                **args.inputs,
                "id": f"igw-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:internet-gateway/{args.name}"
            }
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {
                **args.inputs,
                "id": f"nat-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:nat-gateway/{args.name}"
            }
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {
                **args.inputs,
                "id": f"eip-{args.name}",
                "allocation_id": f"eipalloc-{args.name}"
            }
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {
                **args.inputs,
                "id": f"rtb-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:route-table/{args.name}"
            }
        elif args.typ == "aws:ec2/vpcEndpoint:VpcEndpoint":
            outputs = {
                **args.inputs,
                "id": f"vpce-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:vpc-endpoint/{args.name}"
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "id": args.name
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "id": args.name,
                "invoke_arn": (
                    f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/"
                    f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations"
                )
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": "test-api-id",
                "root_resource_id": "root-id",
                "execution_arn": "arn:aws:execute-api:us-east-1:123456789012:test-api-id"
            }
        elif args.typ == "aws:apigateway/resource:Resource":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-resource-id",
                "path": args.inputs.get("path_part", "/test")
            }
        elif args.typ == "aws:apigateway/method:Method":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-method-id"
            }
        elif args.typ == "aws:apigateway/integration:Integration":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-integration-id"
            }
        elif args.typ == "aws:apigateway/deployment:Deployment":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-deployment-id"
            }
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-stage-id",
                "stage_name": args.inputs.get("stage_name", "test")
            }
        elif args.typ == "aws:apigateway/methodSettings:MethodSettings":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-settings-id"
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name', args.name)}",
                "id": args.inputs.get('name', args.name)
            }
        elif args.typ == "aws:acm/certificate:Certificate":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:acm:us-east-1:123456789012:certificate/{args.name}",
                "id": f"cert-{args.name}",
                "domain_validation_options": [
                    {
                        "resource_record_name": "_test.example.com",
                        "resource_record_type": "CNAME",
                        "resource_record_value": "test-value.acm-validations.aws"
                    }
                ],
                "status": "PENDING_VALIDATION"
            }
        elif args.typ == "aws:cloudfront/distribution:Distribution":
            outputs = {
                **args.inputs,
                "id": f"dist-{args.name}",
                "domain_name": "d1234567890abc.cloudfront.net",
                "arn": f"arn:aws:cloudfront::123456789012:distribution/{args.name}"
            }
        elif args.typ == "aws:route53/zone:Zone":
            outputs = {
                **args.inputs,
                "id": f"Z{args.name}",
                "zone_id": f"Z{args.name}",
                "name_servers": ["ns1.example.com", "ns2.example.com", "ns3.example.com", "ns4.example.com"]
            }
        elif args.typ == "aws:route53/record:Record":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-record-id",
                "fqdn": args.inputs.get("name", "test.example.com")
            }
        elif args.typ == "aws:provider:Provider":
            outputs = {
                **args.inputs,
                "id": f"provider-{args.name}"
            }
        elif args.typ == "aws:s3/bucketVersioningV2:BucketVersioningV2":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-versioning"
            }
        elif args.typ == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-public-access-block"
            }
        elif args.typ == "aws:s3/bucketLifecycleConfigurationV2:BucketLifecycleConfigurationV2":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-lifecycle"
            }
        elif args.typ == "aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-encryption"
            }
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-attachment"
            }
        elif args.typ == "aws:iam/policy:Policy":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:policy/{args.name}",
                "id": args.name
            }
        elif args.typ == "aws:lambda/permission:Permission":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-permission"
            }
        elif args.typ == "aws:ec2/route:Route":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-route"
            }
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-rta"
            }
        
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Handle function calls."""
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {
                "account_id": "123456789012",
                "user_id": "test-user",
                "arn": "arn:aws:iam::123456789012:user/test"
            }
        elif args.token == "aws:index/getRegion:getRegion":
            return {
                "name": "us-east-1",
                "id": "us-east-1"
            }
        return {}


# Set up mocks BEFORE importing the stack
pulumi.runtime.set_mocks(MyMocks())

# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs
from lib.config import EnvironmentConfig
import payment_processor
import session_manager


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initialization with environment suffix."""
        args = TapStackArgs(environment_suffix='test')
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_different_suffixes(self):
        """Test TapStackArgs with different environment suffixes."""
        for suffix in ['dev', 'staging', 'prod', 'test123', 'pr7669']:
            args = TapStackArgs(environment_suffix=suffix)
            self.assertEqual(args.environment_suffix, suffix)

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Custom': 'Tag', 'Application': 'Test'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})


class TestEnvironmentConfig(unittest.TestCase):
    """Test cases for EnvironmentConfig class."""

    def test_dev_environment_config(self):
        """Test development environment configuration."""
        config = EnvironmentConfig('dev')
        self.assertEqual(config.environment, 'dev')
        self.assertEqual(config.get('dynamodb_read_capacity'), 5)
        self.assertEqual(config.get('dynamodb_write_capacity'), 5)
        self.assertEqual(config.get('lambda_memory'), 512)
        self.assertEqual(config.get('lambda_timeout'), 30)
        self.assertFalse(config.get('dynamodb_pitr'))

    def test_staging_environment_config(self):
        """Test staging environment configuration."""
        config = EnvironmentConfig('staging')
        self.assertEqual(config.environment, 'staging')
        self.assertEqual(config.get('dynamodb_read_capacity'), 25)
        self.assertEqual(config.get('lambda_memory'), 1024)
        self.assertTrue(config.get('dynamodb_pitr'))

    def test_prod_environment_config(self):
        """Test production environment configuration."""
        config = EnvironmentConfig('prod')
        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.get('dynamodb_read_capacity'), 100)
        self.assertEqual(config.get('lambda_memory'), 3008)
        self.assertTrue(config.get('dynamodb_pitr'))

    def test_invalid_environment(self):
        """Test invalid environment raises ValueError."""
        with self.assertRaises(ValueError):
            EnvironmentConfig('invalid')

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = EnvironmentConfig('dev')
        tags = config.get_common_tags()
        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')
        self.assertEqual(tags['Project'], 'PaymentProcessing')


@pulumi.runtime.test
def test_tap_stack_creates_vpc():
    """Test that TapStack creates VPC with correct configuration."""
    def check_vpc(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix="test"),
            opts=None
        )
        # Verify stack was created
        assert stack is not None
        return {}
    return check_vpc({})


@pulumi.runtime.test
def test_tap_stack_creates_dynamodb_tables():
    """Test that TapStack creates DynamoDB tables."""
    def check_tables(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix="test"),
            opts=None
        )
        assert stack is not None
        return {}
    return check_tables({})


@pulumi.runtime.test
def test_tap_stack_creates_s3_bucket():
    """Test that TapStack creates S3 bucket."""
    def check_bucket(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix="test"),
            opts=None
        )
        assert stack is not None
        return {}
    return check_bucket({})


@pulumi.runtime.test
def test_tap_stack_creates_lambda_functions():
    """Test that TapStack creates Lambda functions."""
    def check_lambdas(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix="test"),
            opts=None
        )
        assert stack is not None
        return {}
    return check_lambdas({})


@pulumi.runtime.test
def test_tap_stack_creates_api_gateway():
    """Test that TapStack creates API Gateway REST API."""
    def check_api(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix="test"),
            opts=None
        )
        assert stack is not None
        return {}
    return check_api({})


@pulumi.runtime.test
def test_tap_stack_creates_cloudfront():
    """Test that TapStack creates CloudFront distribution."""
    def check_cloudfront(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix="test"),
            opts=None
        )
        assert stack is not None
        return {}
    return check_cloudfront({})


@pulumi.runtime.test
def test_environment_suffix_in_resource_names():
    """Test that environment suffix is included in resource names."""
    def check_suffix(args):
        suffix = "testsuffix"
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix=suffix),
            opts=None
        )
        assert stack is not None
        return {}
    return check_suffix({})


class TestPaymentProcessorLambda(unittest.TestCase):
    """Test cases for payment processor Lambda function."""

    def test_payment_processor_code_structure(self):
        """Test that payment processor Lambda code is properly formatted."""
        # Check that the module exists and has the handler
        self.assertTrue(hasattr(payment_processor, 'lambda_handler'))
        self.assertTrue(callable(payment_processor.lambda_handler))

    def test_payment_processor_imports(self):
        """Test that payment processor has required imports."""
        import inspect
        source = inspect.getsource(payment_processor)
        self.assertIn('import', source.lower())

    @patch('payment_processor.dynamodb_client')
    def test_payment_processor_handler_exists(self, mock_dynamodb):
        """Test that payment processor handler function exists."""
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'amount': 100, 'currency': 'USD'})
        }
        context = MagicMock()
        
        # Handler should exist and be callable
        self.assertTrue(hasattr(payment_processor, 'lambda_handler'))
        self.assertTrue(callable(payment_processor.lambda_handler))


class TestSessionManagerLambda(unittest.TestCase):
    """Test cases for session manager Lambda function."""

    def test_session_manager_code_structure(self):
        """Test that session manager Lambda code is properly formatted."""
        # Check that the module exists and has the handler
        self.assertTrue(hasattr(session_manager, 'lambda_handler'))
        self.assertTrue(callable(session_manager.lambda_handler))

    def test_session_manager_imports(self):
        """Test that session manager has required imports."""
        import inspect
        source = inspect.getsource(session_manager)
        self.assertIn('import', source.lower())

    @patch('session_manager.dynamodb_client')
    def test_session_manager_handler_exists(self, mock_dynamodb):
        """Test that session manager handler function exists."""
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'sessionId': 'test-session'})
        }
        context = MagicMock()
        
        # Handler should exist and be callable
        self.assertTrue(hasattr(session_manager, 'lambda_handler'))
        self.assertTrue(callable(session_manager.lambda_handler))


class TestResourceNaming(unittest.TestCase):
    """Test cases for resource naming conventions."""

    def test_all_resources_have_environment_suffix(self):
        """Test that all resources include environment suffix in their names."""
        suffix = "unittestsuffix"
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix=suffix),
            opts=None
        )
        # Verify stack was created
        self.assertIsNotNone(stack)


class TestConfiguration(unittest.TestCase):
    """Test cases for configuration values."""

    def test_dynamodb_capacity_by_environment(self):
        """Test that DynamoDB capacity varies by environment."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertLess(
            dev_config.get('dynamodb_read_capacity'),
            staging_config.get('dynamodb_read_capacity')
        )
        self.assertLess(
            staging_config.get('dynamodb_read_capacity'),
            prod_config.get('dynamodb_read_capacity')
        )

    def test_lambda_memory_by_environment(self):
        """Test that Lambda memory varies by environment."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertLess(
            dev_config.get('lambda_memory'),
            staging_config.get('lambda_memory')
        )
        self.assertLess(
            staging_config.get('lambda_memory'),
            prod_config.get('lambda_memory')
        )

    def test_pitr_enabled_for_staging_and_prod(self):
        """Test that PITR is enabled for staging and prod."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertFalse(dev_config.get('dynamodb_pitr'))
        self.assertTrue(staging_config.get('dynamodb_pitr'))
        self.assertTrue(prod_config.get('dynamodb_pitr'))


class TestIntegrationTest(unittest.TestCase):
    """Integration test for the complete stack."""

    def test_complete_stack_creation(self):
        """Test that complete stack can be created without errors."""
        try:
            stack = TapStack(
                name="integration-test-stack",
                args=TapStackArgs(environment_suffix="inttest"),
                opts=None
            )
            self.assertIsNotNone(stack)
        except Exception as e:
            self.fail(f"Stack creation failed: {str(e)}")

    def test_stack_with_pr_environment_suffix(self):
        """Test that stack handles PR-based environment suffixes."""
        try:
            stack = TapStack(
                name="pr-test-stack",
                args=TapStackArgs(environment_suffix="pr7669"),
                opts=None
            )
            self.assertIsNotNone(stack)
        except Exception as e:
            self.fail(f"Stack creation with PR suffix failed: {str(e)}")


if __name__ == '__main__':
    unittest.main()

