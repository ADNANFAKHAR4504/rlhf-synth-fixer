"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests Trading Analytics Platform infrastructure without actual AWS deployment.
"""

import unittest
import pulumi
import json


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that returns inputs as outputs without resource-specific logic.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs, "id": f"{args.name}-id", "arn": f"arn:aws:service:region:account:{args.name}"}
        
        # Add specific outputs for different resource types
        # Use typ instead of type (MockResourceArgs uses 'typ' attribute)
        resource_type = getattr(args, 'typ', '').lower()
        
        if "vpc" in resource_type:
            outputs["cidr_block"] = args.inputs.get("cidr_block", "10.0.0.0/16")
        elif "subnet" in resource_type:
            outputs["vpc_id"] = args.inputs.get("vpc_id", "vpc-id")
        elif "role" in resource_type:
            outputs["name"] = args.name
        elif "bucket" in resource_type:
            outputs["bucket"] = args.name
        elif "table" in resource_type:
            outputs["name"] = args.name
        elif "function" in resource_type:
            outputs["name"] = args.name
            outputs["runtime"] = args.inputs.get("runtime", "python3.9")
        elif "loggroup" in resource_type or "log_group" in resource_type:
            outputs["name"] = args.inputs.get("name", args.name)
        
        return [f"{args.name}-id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        # Handle AWS region lookup
        if args.token in ["aws:index/getRegion:getRegion", "aws:getRegion"]:
            return {"region": "us-east-1", "name": "us-east-1"}
        # Handle AWS caller identity lookup
        elif args.token in ["aws:index/getCallerIdentity:getCallerIdentity", "aws:getCallerIdentity"]:
            return {"accountId": "123456789012", "arn": "arn:aws:iam::123456789012:root"}
        # Handle IAM policy document
        elif args.token in ["aws:iam/getPolicyDocument:getPolicyDocument", "aws:iam:getPolicyDocument"]:
            return {"json": json.dumps({"Version": "2012-10-17", "Statement": []})}
        # Default: return args as-is
        return args.args


pulumi.runtime.set_mocks(MinimalMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

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

    def test_tap_stack_args_production_environment(self):
        """Test TapStackArgs with production environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="production")

        self.assertEqual(args.environment_suffix, 'production')


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
            self.assertEqual(stack.environment, "test")
            
            return {}

        return check_instantiation([])

    @pulumi.runtime.test
    def test_stack_with_default_environment(self):
        """Test stack with default environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_env(args):
            stack = TapStack("test-stack", TapStackArgs())
            
            # Should default to 'dev'
            self.assertEqual(stack.environment, "dev")
            
            return {}

        return check_default_env([])

    @pulumi.runtime.test
    def test_stack_with_prod_environment(self):
        """Test stack with production environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_env(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="production"))
            
            self.assertEqual(stack.environment, "production")
            
            return {}

        return check_prod_env([])

    @pulumi.runtime.test
    def test_stack_suffix_formatting(self):
        """Test that suffix is formatted correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_suffix(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))
            
            # Suffix should be environment-region format
            self.assertIn("dev", stack.suffix)
            self.assertIn("us-east-1", stack.suffix)
            
            return {}

        return check_suffix([])


class TestTapStackTags(unittest.TestCase):
    """Test resource tagging functionality."""

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are merged with common tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "DevOps", "Project": "TradingAnalytics"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            # Common tags should be present
            self.assertEqual(stack.common_tags['Environment'], "test")
            self.assertEqual(stack.common_tags['ManagedBy'], "Pulumi")
            self.assertEqual(stack.common_tags['Project'], "TradingAnalytics")
            # Custom tags should be merged
            self.assertEqual(stack.common_tags['Team'], "DevOps")

            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_no_tags_provided(self):
        """Test stack works when no tags are provided."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_no_tags(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Common tags should still be present
            self.assertIn('Environment', stack.common_tags)
            self.assertIn('ManagedBy', stack.common_tags)
            self.assertIn('Project', stack.common_tags)
            self.assertIn('Region', stack.common_tags)

            return {}

        return check_no_tags([])


class TestTapStackEnvironmentConfig(unittest.TestCase):
    """Test environment-specific configuration."""

    @pulumi.runtime.test
    def test_dev_environment_config(self):
        """Test dev environment configuration values."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_config(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))
            
            config = stack.config
            self.assertEqual(config['lambda_memory'], 512)
            self.assertEqual(config['log_retention_days'], 7)
            self.assertEqual(config['dynamodb_billing_mode'], 'PAY_PER_REQUEST')
            self.assertFalse(config['s3_versioning'])
            self.assertIsNone(config['dynamodb_read_capacity'])
            self.assertIsNone(config['dynamodb_write_capacity'])

            return {}

        return check_dev_config([])

    @pulumi.runtime.test
    def test_staging_environment_config(self):
        """Test staging environment configuration values."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_staging_config(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="staging"))

            config = stack.config
            self.assertEqual(config['lambda_memory'], 1024)
            self.assertEqual(config['log_retention_days'], 30)
            self.assertEqual(config['dynamodb_billing_mode'], 'PAY_PER_REQUEST')
            self.assertFalse(config['s3_versioning'])

            return {}

        return check_staging_config([])

    @pulumi.runtime.test
    def test_production_environment_config(self):
        """Test production environment configuration values."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_config(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="production"))

            config = stack.config
            self.assertEqual(config['lambda_memory'], 2048)
            self.assertEqual(config['log_retention_days'], 90)
            self.assertEqual(config['dynamodb_billing_mode'], 'PROVISIONED')
            self.assertTrue(config['s3_versioning'])
            self.assertEqual(config['dynamodb_read_capacity'], 5)
            self.assertEqual(config['dynamodb_write_capacity'], 5)

            return {}

        return check_prod_config([])

    @pulumi.runtime.test
    def test_unknown_environment_defaults_to_dev(self):
        """Test that unknown environment defaults to dev config."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_config(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="unknown-env"))

            config = stack.config
            # Should default to dev config
            self.assertEqual(config['lambda_memory'], 512)
            self.assertEqual(config['log_retention_days'], 7)
            
            return {}

        return check_default_config([])


class TestTapStackVPCInfrastructure(unittest.TestCase):
    """Test VPC and networking infrastructure creation."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that VPC is created as part of the stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify VPC is created
            self.assertIsNotNone(stack.vpc)
            
            return {}

        return check_vpc([])

    @pulumi.runtime.test
    def test_private_subnet_creation(self):
        """Test that private subnet is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_subnet(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify private subnet is created
            self.assertIsNotNone(stack.private_subnet)
            
            return {}

        return check_subnet([])


class TestTapStackIAMRoles(unittest.TestCase):
    """Test IAM role and policy creation."""

    @pulumi.runtime.test
    def test_lambda_role_creation(self):
        """Test that Lambda IAM role is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_role(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify Lambda role is created
            self.assertIsNotNone(stack.lambda_role)
            
            return {}

        return check_role([])


class TestTapStackS3Infrastructure(unittest.TestCase):
    """Test S3 bucket creation and configuration."""

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test that S3 bucket is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_s3(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify S3 bucket is created
            self.assertIsNotNone(stack.s3_bucket)
            
            return {}

        return check_s3([])

    @pulumi.runtime.test
    def test_s3_versioning_production_only(self):
        """Test that S3 versioning is only enabled for production."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_versioning(args):
            # Dev should not have versioning
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            self.assertFalse(dev_stack.config['s3_versioning'])
            
            # Production should have versioning
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="production"))
            self.assertTrue(prod_stack.config['s3_versioning'])
            
            return {}

        return check_versioning([])


class TestTapStackDynamoDBInfrastructure(unittest.TestCase):
    """Test DynamoDB table creation and configuration."""

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test that DynamoDB table is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dynamodb(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify DynamoDB table is created
            self.assertIsNotNone(stack.dynamodb_table)
            
            return {}

        return check_dynamodb([])

    @pulumi.runtime.test
    def test_dynamodb_billing_modes(self):
        """Test that DynamoDB billing modes are correct per environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_billing_modes(args):
        # Dev and staging should use PAY_PER_REQUEST
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            self.assertEqual(dev_stack.config['dynamodb_billing_mode'], 'PAY_PER_REQUEST')
            
            staging_stack = TapStack("staging-stack", TapStackArgs(environment_suffix="staging"))
            self.assertEqual(staging_stack.config['dynamodb_billing_mode'], 'PAY_PER_REQUEST')

        # Production should use PROVISIONED
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="production"))
            self.assertEqual(prod_stack.config['dynamodb_billing_mode'], 'PROVISIONED')
            self.assertEqual(prod_stack.config['dynamodb_read_capacity'], 5)
            self.assertEqual(prod_stack.config['dynamodb_write_capacity'], 5)
            
            return {}

        return check_billing_modes([])


class TestTapStackCloudWatchInfrastructure(unittest.TestCase):
    """Test CloudWatch log group creation."""

    @pulumi.runtime.test
    def test_log_group_creation(self):
        """Test that CloudWatch log group is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_log_group(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify log group is created
            self.assertIsNotNone(stack.log_group)
            
            return {}

        return check_log_group([])

    @pulumi.runtime.test
    def test_log_retention_by_environment(self):
        """Test that log retention varies by environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_retention(args):
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            self.assertEqual(dev_stack.config['log_retention_days'], 7)
            
            staging_stack = TapStack("staging-stack", TapStackArgs(environment_suffix="staging"))
            self.assertEqual(staging_stack.config['log_retention_days'], 30)
            
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="production"))
            self.assertEqual(prod_stack.config['log_retention_days'], 90)
            
            return {}

        return check_retention([])


class TestTapStackLambdaFunctions(unittest.TestCase):
    """Test Lambda function creation and configuration."""

    @pulumi.runtime.test
    def test_lambda_function_creation(self):
        """Test that Lambda function is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_lambda(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify Lambda function is created
            self.assertIsNotNone(stack.lambda_function)
            
            return {}

        return check_lambda([])

    @pulumi.runtime.test
    def test_lambda_memory_by_environment(self):
        """Test that Lambda memory varies by environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_memory(args):
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            self.assertEqual(dev_stack.config['lambda_memory'], 512)
            
            staging_stack = TapStack("staging-stack", TapStackArgs(environment_suffix="staging"))
            self.assertEqual(staging_stack.config['lambda_memory'], 1024)
            
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="production"))
            self.assertEqual(prod_stack.config['lambda_memory'], 2048)
            
            return {}

        return check_memory([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_dev_environment(self):
        """Test resources are named with dev environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))

            self.assertEqual(stack.environment, "dev")
            self.assertIn("dev", stack.suffix)

            return {}

        return check_dev_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_prod_environment(self):
        """Test resources are named with prod environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="production"))

            self.assertEqual(stack.environment, "production")
            self.assertIn("production", stack.suffix)

            return {}

        return check_prod_naming([])


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
            self.assertEqual(stack1.environment, "dev")
            self.assertEqual(stack2.environment, "dev")
            
            return {}

        return check_multiple_stacks([])

    @pulumi.runtime.test
    def test_mixed_environment_stacks(self):
        """Test creating stacks with different environments."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_mixed_stacks(args):
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="production"))
            
            self.assertIsNotNone(dev_stack)
            self.assertIsNotNone(prod_stack)
            self.assertEqual(dev_stack.environment, "dev")
            self.assertEqual(prod_stack.environment, "production")
            self.assertEqual(dev_stack.config['lambda_memory'], 512)
            self.assertEqual(prod_stack.config['lambda_memory'], 2048)
            
            return {}

        return check_mixed_stacks([])


class TestTapStackResourceDependencies(unittest.TestCase):
    """Test that resources are created and dependencies are correct."""

    @pulumi.runtime.test
    def test_all_resources_created(self):
        """Test that all expected resources are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_resources(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify all main resources are created
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.private_subnet)
            self.assertIsNotNone(stack.lambda_role)
            self.assertIsNotNone(stack.s3_bucket)
            self.assertIsNotNone(stack.dynamodb_table)
            self.assertIsNotNone(stack.log_group)
            self.assertIsNotNone(stack.lambda_function)
            
            return {}

        return check_resources([])


if __name__ == '__main__':
    unittest.main()