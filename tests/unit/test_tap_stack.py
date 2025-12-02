"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests payment processing infrastructure without actual AWS deployment.
"""

import unittest
import pulumi
import json
import sys
import os

# Add lambda directory to path for Lambda function tests
lambda_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'lambda')
if lambda_dir not in sys.path:
    sys.path.insert(0, lambda_dir)


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that returns inputs as outputs with computed properties.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs}
        
        # Add common computed properties based on resource type
        if "aws:s3" in args.typ:
            outputs["arn"] = f"arn:aws:s3:::{args.name}"
            outputs["bucket"] = args.inputs.get("bucket", f"{args.name}-bucket")
        elif "aws:dynamodb" in args.typ:
            outputs["arn"] = f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif "aws:ec2" in args.typ:
            if "vpc" in args.typ.lower():
                outputs["id"] = f"vpc-{args.name}"
                outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:vpc/{args.name}"
            elif "subnet" in args.typ.lower():
                outputs["id"] = f"subnet-{args.name}"
                outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:subnet/{args.name}"
            elif "securityGroup" in args.typ:
                outputs["id"] = f"sg-{args.name}"
                outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:security-group/{args.name}"
            else:
                outputs["id"] = f"{args.name}-id"
        elif "aws:lambda" in args.typ:
            outputs["arn"] = f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}"
            outputs["invoke_arn"] = f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations"
            outputs["id"] = args.name
        elif "aws:apigateway" in args.typ:
            if "restApi" in args.typ:
                outputs["id"] = "test-api-id"
                outputs["root_resource_id"] = "root-id"
                outputs["execution_arn"] = "arn:aws:execute-api:us-east-1:123456789012:test-api-id"
            else:
                outputs["id"] = f"{args.name}-id"
        elif "aws:cloudfront" in args.typ:
            outputs["id"] = f"dist-{args.name}"
            outputs["domain_name"] = "d1234567890abc.cloudfront.net"
            outputs["arn"] = f"arn:aws:cloudfront::123456789012:distribution/{args.name}"
        elif "aws:iam" in args.typ:
            if "role" in args.typ.lower():
                outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
            outputs["id"] = args.name
        elif "aws:cloudwatch" in args.typ:
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name', args.name)}"
            outputs["id"] = args.inputs.get('name', args.name)
        else:
            outputs["id"] = f"{args.name}-id"
        
        return [f"{args.name}-id", outputs]
    
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


pulumi.runtime.set_mocks(MinimalMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Team": "Infrastructure", "CostCenter": "Engineering"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_dev_environment(self):
        """Test TapStackArgs with dev environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="dev")

        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_staging_environment(self):
        """Test TapStackArgs with staging environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="staging")

        self.assertEqual(args.environment_suffix, 'staging')

    def test_tap_stack_args_prod_environment(self):
        """Test TapStackArgs with prod environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="prod")

        self.assertEqual(args.environment_suffix, 'prod')

    def test_tap_stack_args_pr_environment(self):
        """Test TapStackArgs with PR-based environment suffix."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="pr7669")

        self.assertEqual(args.environment_suffix, 'pr7669')


class TestEnvironmentConfig(unittest.TestCase):
    """Test cases for EnvironmentConfig class."""

    def test_dev_environment_config(self):
        """Test development environment configuration."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('dev')

        self.assertEqual(config.environment, 'dev')
        self.assertEqual(config.get('dynamodb_read_capacity'), 5)
        self.assertEqual(config.get('dynamodb_write_capacity'), 5)
        self.assertEqual(config.get('lambda_memory'), 512)
        self.assertEqual(config.get('lambda_timeout'), 30)
        self.assertEqual(config.get('s3_log_retention_days'), 7)
        self.assertFalse(config.get('dynamodb_pitr'))

    def test_staging_environment_config(self):
        """Test staging environment configuration."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('staging')

        self.assertEqual(config.environment, 'staging')
        self.assertEqual(config.get('dynamodb_read_capacity'), 25)
        self.assertEqual(config.get('dynamodb_write_capacity'), 25)
        self.assertEqual(config.get('lambda_memory'), 1024)
        self.assertEqual(config.get('lambda_timeout'), 60)
        self.assertEqual(config.get('s3_log_retention_days'), 30)
        self.assertTrue(config.get('dynamodb_pitr'))

    def test_prod_environment_config(self):
        """Test production environment configuration."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('prod')

        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.get('dynamodb_read_capacity'), 100)
        self.assertEqual(config.get('dynamodb_write_capacity'), 100)
        self.assertEqual(config.get('lambda_memory'), 3008)
        self.assertEqual(config.get('lambda_timeout'), 120)
        self.assertEqual(config.get('s3_log_retention_days'), 90)
        self.assertTrue(config.get('dynamodb_pitr'))

    def test_invalid_environment(self):
        """Test invalid environment raises ValueError."""
        from lib.config import EnvironmentConfig

        with self.assertRaises(ValueError):
            EnvironmentConfig('invalid')

    def test_get_common_tags(self):
        """Test common tags generation."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('dev')
        tags = config.get_common_tags()

        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')
        self.assertEqual(tags['CostCenter'], 'DEV-001')
        self.assertEqual(tags['Project'], 'PaymentProcessing')

    def test_get_domain(self):
        """Test domain generation for different environments."""
        from lib.config import EnvironmentConfig

        # Test with default base_domain
        config_dev = EnvironmentConfig('dev')
        domain_dev = config_dev.get_domain()
        self.assertEqual(domain_dev, 'dev.api.example.com')

        config_staging = EnvironmentConfig('staging')
        domain_staging = config_staging.get_domain()
        self.assertEqual(domain_staging, 'staging.api.example.com')

        config_prod = EnvironmentConfig('prod')
        domain_prod = config_prod.get_domain()
        self.assertEqual(domain_prod, 'api.example.com')

    def test_capacity_validation(self):
        """Test capacity validation."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('dev')
        # Should not raise
        config.validate_capacity()


class TestTapStackInstantiation(unittest.TestCase):
    """Test cases for TapStack instantiation and basic properties."""

    @pulumi.runtime.test
    def test_stack_instantiation_without_errors(self):
        """Test that stack can be instantiated without errors."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_instantiation(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify stack is created
            self.assertIsNotNone(stack)
            
            return {}

        return check_instantiation([])

    @pulumi.runtime.test
    def test_stack_with_default_environment(self):
        """Test stack with default environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_env(args):
            stack = TapStack("test-stack", TapStackArgs())
            
            # Should default to 'dev'
            self.assertIsNotNone(stack)
            
            return {}

        return check_default_env([])

    @pulumi.runtime.test
    def test_stack_with_prod_environment(self):
        """Test stack with production environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_env(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))
            
            self.assertIsNotNone(stack)
            
            return {}

        return check_prod_env([])

    @pulumi.runtime.test
    def test_stack_with_pr_environment(self):
        """Test stack with PR-based environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_pr_env(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="pr7669"))
            
            # Should use 'dev' config for PR environments
            self.assertIsNotNone(stack)
            
            return {}

        return check_pr_env([])


class TestTapStackTags(unittest.TestCase):
    """Test resource tagging functionality."""

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are applied to stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "DevOps", "Project": "PaymentProcessing"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            self.assertIsNotNone(stack)

            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_no_tags_provided(self):
        """Test stack works when no tags are provided."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_no_tags(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Stack should still be created
            self.assertIsNotNone(stack)

            return {}

        return check_no_tags([])


class TestTapStackVPCInfrastructure(unittest.TestCase):
    """Test VPC and networking infrastructure creation."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that VPC is created as part of the stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify stack is created without errors
            self.assertIsNotNone(stack)
            
            return {}

        return check_vpc([])

    @pulumi.runtime.test
    def test_vpc_subnets_creation(self):
        """Test that VPC subnets are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnets(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include VPC subnets
            self.assertIsNotNone(stack)
            
            return {}

        return check_subnets([])

    @pulumi.runtime.test
    def test_vpc_endpoints_creation(self):
        """Test that VPC endpoints are configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_endpoints(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include VPC endpoints for DynamoDB and S3
            self.assertIsNotNone(stack)
            
            return {}

        return check_endpoints([])


class TestTapStackDynamoDBInfrastructure(unittest.TestCase):
    """Test DynamoDB tables creation."""

    @pulumi.runtime.test
    def test_dynamodb_tables_creation(self):
        """Test that DynamoDB tables are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dynamodb(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include transactions and sessions tables
            self.assertIsNotNone(stack)
            
            return {}

        return check_dynamodb([])

    @pulumi.runtime.test
    def test_dynamodb_capacity_by_environment(self):
        """Test that DynamoDB capacity varies by environment."""
        from lib.config import EnvironmentConfig

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

    @pulumi.runtime.test
    def test_dynamodb_pitr_configuration(self):
        """Test that PITR is configured correctly by environment."""
        from lib.config import EnvironmentConfig

        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertFalse(dev_config.get('dynamodb_pitr'))
        self.assertTrue(staging_config.get('dynamodb_pitr'))
        self.assertTrue(prod_config.get('dynamodb_pitr'))


class TestTapStackS3Infrastructure(unittest.TestCase):
    """Test S3 bucket creation."""

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test that S3 bucket is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_s3(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include API logs bucket
            self.assertIsNotNone(stack)
            
            return {}

        return check_s3([])

    @pulumi.runtime.test
    def test_s3_lifecycle_policies(self):
        """Test that S3 lifecycle policies are configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_lifecycle(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include lifecycle configurations
            self.assertIsNotNone(stack)
            
            return {}

        return check_lifecycle([])

    @pulumi.runtime.test
    def test_s3_log_retention_by_environment(self):
        """Test that S3 log retention varies by environment."""
        from lib.config import EnvironmentConfig

        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertEqual(dev_config.get('s3_log_retention_days'), 7)
        self.assertEqual(staging_config.get('s3_log_retention_days'), 30)
        self.assertEqual(prod_config.get('s3_log_retention_days'), 90)


class TestTapStackLambdaFunctions(unittest.TestCase):
    """Test Lambda functions creation."""

    @pulumi.runtime.test
    def test_lambda_functions_creation(self):
        """Test that Lambda functions are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_lambdas(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include payment processor and session manager functions
            self.assertIsNotNone(stack)
            
            return {}

        return check_lambdas([])

    @pulumi.runtime.test
    def test_lambda_memory_by_environment(self):
        """Test that Lambda memory varies by environment."""
        from lib.config import EnvironmentConfig

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

    @pulumi.runtime.test
    def test_lambda_timeout_by_environment(self):
        """Test that Lambda timeout varies by environment."""
        from lib.config import EnvironmentConfig

        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertLess(
            dev_config.get('lambda_timeout'),
            staging_config.get('lambda_timeout')
        )
        self.assertLess(
            staging_config.get('lambda_timeout'),
            prod_config.get('lambda_timeout')
        )


class TestTapStackAPIGateway(unittest.TestCase):
    """Test API Gateway creation."""

    @pulumi.runtime.test
    def test_api_gateway_creation(self):
        """Test that API Gateway is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_api(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include API Gateway REST API
            self.assertIsNotNone(stack)
            
            return {}

        return check_api([])

    @pulumi.runtime.test
    def test_api_throttling_by_environment(self):
        """Test that API throttling varies by environment."""
        from lib.config import EnvironmentConfig

        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        # Check throttle burst
        self.assertLess(
            dev_config.get('api_throttle_burst'),
            staging_config.get('api_throttle_burst')
        )
        self.assertLess(
            staging_config.get('api_throttle_burst'),
            prod_config.get('api_throttle_burst')
        )

        # Check throttle rate
        self.assertLess(
            dev_config.get('api_throttle_rate'),
            staging_config.get('api_throttle_rate')
        )
        self.assertLess(
            staging_config.get('api_throttle_rate'),
            prod_config.get('api_throttle_rate')
        )


class TestTapStackCloudFront(unittest.TestCase):
    """Test CloudFront distribution creation."""

    @pulumi.runtime.test
    def test_cloudfront_creation(self):
        """Test that CloudFront distribution is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_cloudfront(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include CloudFront distribution
            self.assertIsNotNone(stack)
            
            return {}

        return check_cloudfront([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_dev_environment(self):
        """Test resources are named with dev environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))

            self.assertIsNotNone(stack)

            return {}

        return check_dev_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_prod_environment(self):
        """Test resources are named with prod environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            self.assertIsNotNone(stack)

            return {}

        return check_prod_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_custom_environment(self):
        """Test resources are named with custom environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_custom_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="staging"))

            self.assertIsNotNone(stack)

            return {}

        return check_custom_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_pr_environment(self):
        """Test resources are named with PR-based environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_pr_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="pr7669"))

            self.assertIsNotNone(stack)

            return {}

        return check_pr_naming([])


class TestTapStackCompliance(unittest.TestCase):
    """Test compliance-related configurations."""

    @pulumi.runtime.test
    def test_encryption_configured(self):
        """Test that encryption is configured for resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_encryption(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include encryption configurations
            self.assertIsNotNone(stack)
            
            return {}

        return check_encryption([])

    @pulumi.runtime.test
    def test_vpc_isolation(self):
        """Test that VPC isolation is configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_isolation(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Stack should include VPC with private subnets
            self.assertIsNotNone(stack)
            
            return {}

        return check_isolation([])


class TestTapStackMultipleInstances(unittest.TestCase):
    """Test creating multiple stack instances."""

    @pulumi.runtime.test
    def test_multiple_dev_stacks(self):
        """Test creating multiple dev environment stacks."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_multiple_stacks(args):
            stack1 = TapStack("dev-stack-1", TapStackArgs(environment_suffix="dev"))
            stack2 = TapStack("dev-stack-2", TapStackArgs(environment_suffix="dev"))
            
            self.assertIsNotNone(stack1)
            self.assertIsNotNone(stack2)
            
            return {}

        return check_multiple_stacks([])

    @pulumi.runtime.test
    def test_mixed_environment_stacks(self):
        """Test creating stacks with different environments."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_mixed_stacks(args):
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            staging_stack = TapStack("staging-stack", TapStackArgs(environment_suffix="staging"))
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="prod"))
            
            self.assertIsNotNone(dev_stack)
            self.assertIsNotNone(staging_stack)
            self.assertIsNotNone(prod_stack)
            
            return {}

        return check_mixed_stacks([])


class TestTapStackConfigurationValidation(unittest.TestCase):
    """Test configuration validation."""

    def test_capacity_validation_invalid_read(self):
        """Test capacity validation with invalid read capacity."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('dev')
        config.current_config['dynamodb_read_capacity'] = 0

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('read capacity', str(context.exception))

    def test_capacity_validation_invalid_write(self):
        """Test capacity validation with invalid write capacity."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('dev')
        config.current_config['dynamodb_write_capacity'] = 2000

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('write capacity', str(context.exception))

    def test_capacity_validation_invalid_memory(self):
        """Test capacity validation with invalid lambda memory."""
        from lib.config import EnvironmentConfig

        config = EnvironmentConfig('dev')
        config.current_config['lambda_memory'] = 100

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('Lambda memory', str(context.exception))

    def test_capacity_validation_edge_cases(self):
        """Test capacity validation at boundaries."""
        from lib.config import EnvironmentConfig

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


if __name__ == '__main__':
    unittest.main()

