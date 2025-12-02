"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component and all infrastructure stacks.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib.config import EnvironmentConfig

# Add lambda directory to path for Lambda function tests
lambda_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'lambda')
if lambda_dir not in sys.path:
    sys.path.insert(0, lambda_dir)

import payment_processor
import session_manager


# Mocking utilities
def pulumi_set_mocks():
    """Set up Pulumi mocks for testing."""
    pulumi.runtime.set_mocks(MyMocks())

class MyMocks(pulumi.runtime.Mocks):
    """Custom Pulumi mocks."""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
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
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "invoke_arn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations",
                "id": args.name
            }
        elif args.typ == "aws:apigatewayv2/api:Api":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "api_endpoint": f"https://test-api.execute-api.us-east-1.amazonaws.com"
            }
        elif args.typ == "aws:route53/zone:Zone":
            outputs = {
                **args.inputs,
                "id": f"Z{args.name}",
                "zone_id": f"Z{args.name}",
                "name_servers": ["ns1.example.com", "ns2.example.com"]
            }
        elif args.typ == "aws:cloudfront/distribution:Distribution":
            outputs = {
                **args.inputs,
                "id": f"dist-{args.name}",
                "domain_name": "d123456.cloudfront.net",
                "arn": f"arn:aws:cloudfront::123456789012:distribution/{args.name}"
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
                "status": "ISSUED"
            }
        return [f"{args.name}_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012", "user_id": "test-user", "arn": "arn:aws:iam::123456789012:user/test"}
        elif args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1", "id": "us-east-1"}
        return {}


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
        self.assertEqual(config.get('s3_log_retention_days'), 7)
        self.assertFalse(config.get('dynamodb_pitr'))
        self.assertEqual(config.get('cost_center'), 'DEV-001')
        self.assertEqual(config.get('domain_prefix'), 'dev.api')

    def test_staging_environment_config(self):
        """Test staging environment configuration."""
        config = EnvironmentConfig('staging')

        self.assertEqual(config.environment, 'staging')
        self.assertEqual(config.get('dynamodb_read_capacity'), 25)
        self.assertEqual(config.get('dynamodb_write_capacity'), 25)
        self.assertEqual(config.get('lambda_memory'), 1024)
        self.assertEqual(config.get('lambda_timeout'), 60)
        self.assertEqual(config.get('s3_log_retention_days'), 30)
        self.assertTrue(config.get('dynamodb_pitr'))
        self.assertEqual(config.get('cost_center'), 'STG-001')

    def test_prod_environment_config(self):
        """Test production environment configuration."""
        config = EnvironmentConfig('prod')

        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.get('dynamodb_read_capacity'), 100)
        self.assertEqual(config.get('dynamodb_write_capacity'), 100)
        self.assertEqual(config.get('lambda_memory'), 3008)
        self.assertEqual(config.get('lambda_timeout'), 120)
        self.assertEqual(config.get('s3_log_retention_days'), 90)
        self.assertTrue(config.get('dynamodb_pitr'))
        self.assertEqual(config.get('cost_center'), 'PROD-001')

    def test_invalid_environment(self):
        """Test invalid environment raises ValueError."""
        with self.assertRaises(ValueError) as context:
            EnvironmentConfig('invalid')
        self.assertIn('Invalid environment', str(context.exception))

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = EnvironmentConfig('dev')
        tags = config.get_common_tags()

        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')
        self.assertEqual(tags['CostCenter'], 'DEV-001')
        self.assertEqual(tags['Project'], 'PaymentProcessing')

    def test_get_domain(self):
        """Test domain name generation."""
        config = EnvironmentConfig('dev')
        domain = config.get_domain()
        self.assertEqual(domain, 'dev.api.example.com')

    def test_get_domain_staging(self):
        """Test domain name generation for staging."""
        config = EnvironmentConfig('staging')
        domain = config.get_domain()
        self.assertEqual(domain, 'staging.api.example.com')

    def test_get_domain_prod(self):
        """Test domain name generation for production."""
        config = EnvironmentConfig('prod')
        domain = config.get_domain()
        self.assertEqual(domain, 'api.example.com')

    def test_validate_capacity_valid(self):
        """Test capacity validation with valid values."""
        config = EnvironmentConfig('dev')
        config.validate_capacity()  # Should not raise

    def test_validate_capacity_invalid_read(self):
        """Test capacity validation with invalid read capacity."""
        config = EnvironmentConfig('dev')
        config.current_config['dynamodb_read_capacity'] = 0

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('read capacity', str(context.exception))

    def test_validate_capacity_invalid_write(self):
        """Test capacity validation with invalid write capacity."""
        config = EnvironmentConfig('dev')
        config.current_config['dynamodb_write_capacity'] = 2000

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('write capacity', str(context.exception))

    def test_validate_capacity_invalid_memory(self):
        """Test capacity validation with invalid lambda memory."""
        config = EnvironmentConfig('dev')
        config.current_config['lambda_memory'] = 100

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('Lambda memory', str(context.exception))

    def test_validate_capacity_edge_cases(self):
        """Test capacity validation at boundaries."""
        config = EnvironmentConfig('dev')

        # Test min valid values
        config.current_config['dynamodb_read_capacity'] = 1
        config.current_config['dynamodb_write_capacity'] = 1
        config.current_config['lambda_memory'] = 128
        config.validate_capacity()  # Should not raise

        # Test max valid values
        config.current_config['dynamodb_read_capacity'] = 1000
        config.current_config['dynamodb_write_capacity'] = 1000
        config.current_config['lambda_memory'] = 10240
        config.validate_capacity()  # Should not raise


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag', 'Application': 'Test'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.tags['Custom'], 'Tag')

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags."""
        args = TapStackArgs(environment_suffix='prod', tags=None)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})


class TestConfigValidation(unittest.TestCase):
    """Test configuration validation edge cases."""

    def test_all_environments_have_required_fields(self):
        """Test that all environments have required configuration fields."""
        required_fields = [
            'dynamodb_read_capacity',
            'dynamodb_write_capacity',
            'lambda_memory',
            'lambda_timeout',
            's3_log_retention_days',
            'api_throttle_burst',
            'api_throttle_rate',
            'dynamodb_pitr',
            'cost_center',
            'domain_prefix',
        ]

        for env in ['dev', 'staging', 'prod']:
            config = EnvironmentConfig(env)
            for field in required_fields:
                value = config.get(field)
                self.assertIsNotNone(value, f"{env} missing {field}")

    def test_pitr_enabled_for_staging_and_prod(self):
        """Test that PITR is properly configured for staging and prod."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertFalse(dev_config.get('dynamodb_pitr'))
        self.assertTrue(staging_config.get('dynamodb_pitr'))
        self.assertTrue(prod_config.get('dynamodb_pitr'))

    def test_capacity_increases_across_environments(self):
        """Test that capacity increases from dev to staging to prod."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        # Check DynamoDB capacity
        self.assertLess(
            dev_config.get('dynamodb_read_capacity'),
            staging_config.get('dynamodb_read_capacity')
        )
        self.assertLess(
            staging_config.get('dynamodb_read_capacity'),
            prod_config.get('dynamodb_read_capacity')
        )

        # Check Lambda memory
        self.assertLess(
            dev_config.get('lambda_memory'),
            staging_config.get('lambda_memory')
        )
        self.assertLess(
            staging_config.get('lambda_memory'),
            prod_config.get('lambda_memory')
        )

    def test_log_retention_increases_across_environments(self):
        """Test that log retention increases from dev to staging to prod."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertEqual(dev_config.get('s3_log_retention_days'), 7)
        self.assertEqual(staging_config.get('s3_log_retention_days'), 30)
        self.assertEqual(prod_config.get('s3_log_retention_days'), 90)


class TestVpcStack(unittest.TestCase):
    """Test cases for VPC stack."""

    @pulumi.runtime.test
    def test_vpc_stack_creation(self):
        """Test VPC stack resource creation."""
        import lib.vpc_stack as vpc_stack

        stack = vpc_stack.VpcStack(
            "test-vpc",
            environment_suffix="dev",
            tags={"Environment": "test"}
        )

        # Verify VPC is created
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.lambda_sg)
        self.assertIsNotNone(stack.vpc_endpoint_sg)

    @pulumi.runtime.test
    def test_vpc_stack_dev_no_nat_gateway(self):
        """Test VPC stack skips NAT Gateway for dev environment."""
        import lib.vpc_stack as vpc_stack

        stack = vpc_stack.VpcStack(
            "test-vpc-dev",
            environment_suffix="dev",
            tags={"Environment": "dev"}
        )

        # For dev environment, NAT Gateway should be None
        self.assertIsNone(stack.nat_gateway)
        self.assertIsNone(stack.eip)

    @pulumi.runtime.test
    def test_vpc_stack_prod_has_nat_gateway(self):
        """Test VPC stack creates NAT Gateway for prod environment."""
        import lib.vpc_stack as vpc_stack

        stack = vpc_stack.VpcStack(
            "test-vpc-prod",
            environment_suffix="prod",
            tags={"Environment": "prod"}
        )

        # For prod environment, NAT Gateway should exist
        self.assertIsNotNone(stack.nat_gateway)
        self.assertIsNotNone(stack.eip)


class TestDynamoDBStack(unittest.TestCase):
    """Test cases for DynamoDB stack."""

    @pulumi.runtime.test
    def test_dynamodb_stack_creation(self):
        """Test DynamoDB stack resource creation."""
        import lib.dynamodb_stack as dynamodb_stack

        stack = dynamodb_stack.DynamoDBStack(
            "test-dynamodb",
            environment_suffix="dev",
            read_capacity=5,
            write_capacity=5,
            enable_pitr=False,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.transactions_table)
        self.assertIsNotNone(stack.sessions_table)


class TestS3Stack(unittest.TestCase):
    """Test cases for S3 stack."""

    @pulumi.runtime.test
    def test_s3_stack_creation(self):
        """Test S3 stack resource creation."""
        import lib.s3_stack as s3_stack

        stack = s3_stack.S3Stack(
            "test-s3",
            environment_suffix="dev",
            log_retention_days=7,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.api_logs_bucket)


class TestLambdaStack(unittest.TestCase):
    """Test cases for Lambda stack."""

    @pulumi.runtime.test
    def test_lambda_stack_creation(self):
        """Test Lambda stack resource creation."""
        import lib.lambda_stack as lambda_stack
        import pulumi

        stack = lambda_stack.LambdaStack(
            "test-lambda",
            environment_suffix="dev",
            memory_size=256,
            timeout=30,
            transactions_table_name=pulumi.Output.from_input("test-transactions"),
            transactions_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test-transactions"),
            sessions_table_name=pulumi.Output.from_input("test-sessions"),
            sessions_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test-sessions"),
            subnet_ids=[pulumi.Output.from_input("subnet-1"), pulumi.Output.from_input("subnet-2")],
            security_group_id=pulumi.Output.from_input("sg-test"),
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.payment_processor)
        self.assertIsNotNone(stack.session_manager)


class TestApiGatewayStack(unittest.TestCase):
    """Test cases for API Gateway stack."""

    @pulumi.runtime.test
    def test_api_gateway_stack_creation(self):
        """Test API Gateway stack resource creation."""
        import lib.api_gateway_stack as api_gateway_stack
        import pulumi

        stack = api_gateway_stack.ApiGatewayStack(
            "test-api",
            environment_suffix="dev",
            payment_processor_invoke_arn=pulumi.Output.from_input("arn:aws:lambda:invoke"),
            payment_processor_arn=pulumi.Output.from_input("arn:aws:lambda:function"),
            session_manager_invoke_arn=pulumi.Output.from_input("arn:aws:lambda:invoke"),
            session_manager_arn=pulumi.Output.from_input("arn:aws:lambda:function"),
            api_logs_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            throttle_burst=500,
            throttle_rate=250,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.api)


class TestRoute53Stack(unittest.TestCase):
    """Test cases for Route53 stack."""

    @pulumi.runtime.test
    def test_route53_stack_creation(self):
        """Test Route53 stack resource creation."""
        import lib.route53_stack as route53_stack
        import pulumi

        stack = route53_stack.Route53Stack(
            "test-route53",
            environment_suffix="dev",
            domain="dev.api.example.com",
            cloudfront_domain=pulumi.Output.from_input("d123456.cloudfront.net"),
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.hosted_zone)


class TestAcmStack(unittest.TestCase):
    """Test cases for ACM stack."""

    @pulumi.runtime.test
    def test_acm_stack_creation_without_validation(self):
        """Test ACM stack resource creation without hosted zone."""
        import lib.acm_stack as acm_stack

        stack = acm_stack.AcmStack(
            "test-acm",
            environment_suffix="dev",
            domain="dev.api.example.com",
            hosted_zone_id=None,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.certificate)
        self.assertIsNone(stack.certificate_validation)

    @pulumi.runtime.test
    def test_acm_stack_creation_with_validation(self):
        """Test ACM stack resource creation with hosted zone."""
        import lib.acm_stack as acm_stack
        import pulumi

        stack = acm_stack.AcmStack(
            "test-acm-validated",
            environment_suffix="dev",
            domain="dev.api.example.com",
            hosted_zone_id=pulumi.Output.from_input("Z123456"),
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.certificate)
        self.assertIsNotNone(stack.certificate_validation)


class TestCloudFrontStack(unittest.TestCase):
    """Test cases for CloudFront stack."""

    @pulumi.runtime.test
    def test_cloudfront_stack_creation(self):
        """Test CloudFront stack resource creation."""
        import lib.cloudfront_stack as cloudfront_stack
        import pulumi

        stack = cloudfront_stack.CloudFrontStack(
            "test-cloudfront",
            environment_suffix="dev",
            api_domain=pulumi.Output.from_input("test-api.execute-api.us-east-1.amazonaws.com"),
            certificate_arn=pulumi.Output.from_input("arn:aws:acm:us-east-1:123456789012:certificate/test"),
            domain="dev.api.example.com",
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.distribution)


class TestPaymentProcessor(unittest.TestCase):
    """Test cases for payment processor Lambda function."""

    def test_decimal_default(self):
        """Test decimal_default JSON encoder."""
        from decimal import Decimal
        
        result = payment_processor.decimal_default(Decimal('99.99'))
        self.assertEqual(result, 99.99)
        self.assertIsInstance(result, float)

    def test_decimal_default_raises(self):
        """Test decimal_default raises TypeError for non-Decimal."""
        with self.assertRaises(TypeError):
            payment_processor.decimal_default("not a decimal")

    @patch('payment_processor.dynamodb_client')
    def test_handler_success(self, mock_dynamodb_client):
        """Test payment processor handler with valid request."""
        mock_dynamodb_client.put_item.return_value = {}
        os.environ['TRANSACTIONS_TABLE'] = 'test-transactions'

        event = {
            'body': '{"transactionId": "tx-123", "customerId": "cust-456", "amount": 99.99}'
        }
        context = {}

        response = payment_processor.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('transactionId', response['body'])
        mock_dynamodb_client.put_item.assert_called_once()

    @patch('payment_processor.dynamodb_client')
    def test_handler_missing_fields(self, mock_dynamodb_client):
        """Test payment processor handler with missing required fields."""
        os.environ['TRANSACTIONS_TABLE'] = 'test-transactions'

        event = {'body': '{"transactionId": "tx-123"}'}
        context = {}

        response = payment_processor.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Missing required fields', response['body'])

    @patch('payment_processor.dynamodb_client')
    def test_handler_error(self, mock_dynamodb_client):
        """Test payment processor handler error handling."""
        mock_dynamodb_client.put_item.side_effect = Exception('DynamoDB error')
        os.environ['TRANSACTIONS_TABLE'] = 'test-transactions'

        event = {
            'body': '{"transactionId": "tx-123", "customerId": "cust-456", "amount": 99.99}'
        }
        context = {}

        response = payment_processor.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('Internal server error', response['body'])


class TestSessionManager(unittest.TestCase):
    """Test cases for session manager Lambda function."""

    @patch('session_manager.dynamodb_client')
    def test_create_session(self, mock_dynamodb_client):
        """Test session manager create session."""
        mock_dynamodb_client.put_item.return_value = {}
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'POST',
            'body': '{"userId": "user-123"}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 201)
        self.assertIn('sessionId', response['body'])
        mock_dynamodb_client.put_item.assert_called_once()

    @patch('session_manager.dynamodb_client')
    def test_validate_session(self, mock_dynamodb_client):
        """Test session manager validate session."""
        mock_dynamodb_client.get_item.return_value = {
            'Item': {
                'sessionId': {'S': 'session-123'},
                'userId': {'S': 'user-456'},
                'expiresAt': {'N': '1234567890'}
            }
        }
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'GET',
            'queryStringParameters': {'sessionId': 'session-123'}
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('valid', response['body'])

    @patch('session_manager.dynamodb_client')
    def test_session_not_found(self, mock_dynamodb_client):
        """Test session manager with non-existent session."""
        mock_dynamodb_client.get_item.return_value = {}
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'GET',
            'queryStringParameters': {'sessionId': 'invalid'}
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 404)
        self.assertIn('Session not found', response['body'])

    @patch('session_manager.dynamodb_client')
    def test_missing_user_id(self, mock_dynamodb_client):
        """Test session manager POST without userId."""
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'POST',
            'body': '{}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Missing userId', response['body'])

    @patch('session_manager.dynamodb_client')
    def test_method_not_allowed(self, mock_dynamodb_client):
        """Test session manager with unsupported HTTP method."""
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'DELETE',
            'body': '{}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 405)
        self.assertIn('Method not allowed', response['body'])

    @patch('session_manager.dynamodb_client')
    def test_session_manager_error_handling(self, mock_dynamodb_client):
        """Test session manager error handling."""
        mock_dynamodb_client.put_item.side_effect = Exception('DynamoDB error')
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'POST',
            'body': '{"userId": "user-123"}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('Internal server error', response['body'])


if __name__ == '__main__':
    pulumi_set_mocks()
    unittest.main()
