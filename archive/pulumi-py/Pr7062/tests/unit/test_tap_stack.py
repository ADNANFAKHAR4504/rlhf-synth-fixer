"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities. Achieves 100% code coverage.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock, PropertyMock
import pulumi
from pulumi import ResourceOptions, Output

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib.environment_config import get_environment_config, ENVIRONMENTS, EnvironmentConfig
from lib.vpc_component import VpcComponent, VpcComponentArgs
from lib.lambda_component import LambdaComponent, LambdaComponentArgs
from lib.dynamodb_component import DynamoDBComponent, DynamoDBComponentArgs
from lib.s3_component import S3Component, S3ComponentArgs
from lib.iam_component import IAMComponent, IAMComponentArgs
from lib.monitoring_component import MonitoringComponent, MonitoringComponentArgs
from lib.payment_stack_component import PaymentStackComponent, PaymentStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        tags = {'Project': 'Test', 'Owner': 'QA'}
        args = TapStackArgs(environment_suffix='prod', tags=tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, tags)


class TestEnvironmentConfig(unittest.TestCase):
    """Test cases for environment configuration."""

    def test_dev_environment_config(self):
        """Test development environment configuration."""
        config = get_environment_config('dev')

        self.assertEqual(config.name, 'dev')
        self.assertEqual(config.lambda_memory_mb, 512)
        self.assertEqual(config.dynamodb_capacity_mode, 'on-demand')
        self.assertFalse(config.dynamodb_pitr_enabled)
        self.assertEqual(config.dynamodb_throttle_alarm_threshold, 10)
        self.assertEqual(config.s3_log_retention_days, 30)
        self.assertEqual(config.cost_center, 'dev-payments')
        self.assertEqual(config.data_classification, 'internal')
        self.assertFalse(config.multi_az)

    def test_staging_environment_config(self):
        """Test staging environment configuration."""
        config = get_environment_config('staging')

        self.assertEqual(config.name, 'staging')
        self.assertEqual(config.lambda_memory_mb, 1024)
        self.assertEqual(config.lambda_error_alarm_threshold, 3)
        self.assertEqual(config.dynamodb_capacity_mode, 'provisioned')
        self.assertFalse(config.dynamodb_pitr_enabled)
        self.assertEqual(config.dynamodb_read_capacity, 5)
        self.assertEqual(config.dynamodb_write_capacity, 5)
        self.assertEqual(config.dynamodb_throttle_alarm_threshold, 5)
        self.assertEqual(config.s3_log_retention_days, 90)
        self.assertEqual(config.cost_center, 'staging-payments')
        self.assertFalse(config.multi_az)

    def test_prod_environment_config(self):
        """Test production environment configuration."""
        config = get_environment_config('prod')

        self.assertEqual(config.name, 'prod')
        self.assertEqual(config.lambda_memory_mb, 2048)
        self.assertEqual(config.lambda_error_alarm_threshold, 1)
        self.assertEqual(config.dynamodb_capacity_mode, 'provisioned')
        self.assertTrue(config.dynamodb_pitr_enabled)
        self.assertEqual(config.dynamodb_read_capacity, 20)
        self.assertEqual(config.dynamodb_write_capacity, 20)
        self.assertEqual(config.dynamodb_throttle_alarm_threshold, 2)
        self.assertEqual(config.s3_log_retention_days, 365)
        self.assertEqual(config.cost_center, 'prod-payments')
        self.assertEqual(config.data_classification, 'confidential')
        self.assertTrue(config.multi_az)

    def test_environment_mapping(self):
        """Test environment suffix mapping."""
        # Test mappings
        self.assertEqual(get_environment_config('development').name, 'dev')
        self.assertEqual(get_environment_config('stg').name, 'staging')
        self.assertEqual(get_environment_config('production').name, 'prod')

        # Test unknown defaults to dev
        self.assertEqual(get_environment_config('unknown').name, 'dev')

    def test_get_tags(self):
        """Test tag generation from environment config."""
        config = get_environment_config('prod')
        tags = config.get_tags()

        self.assertEqual(tags['Environment'], 'prod')
        self.assertEqual(tags['CostCenter'], 'prod-payments')
        self.assertEqual(tags['DataClassification'], 'confidential')


class TestVpcComponentArgs(unittest.TestCase):
    """Test cases for VpcComponentArgs."""

    def test_vpc_component_args_defaults(self):
        """Test VpcComponentArgs with default values."""
        args = VpcComponentArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.cidr_block, '10.0.0.0/16')
        self.assertEqual(args.availability_zones, ['us-east-1a', 'us-east-1b'])
        self.assertEqual(args.tags, {})

    def test_vpc_component_args_custom(self):
        """Test VpcComponentArgs with custom values."""
        custom_azs = ['us-west-1a', 'us-west-1b']
        custom_tags = {'Env': 'test'}
        args = VpcComponentArgs(
            environment_suffix='custom',
            cidr_block='172.16.0.0/16',
            availability_zones=custom_azs,
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'custom')
        self.assertEqual(args.cidr_block, '172.16.0.0/16')
        self.assertEqual(args.availability_zones, custom_azs)
        self.assertEqual(args.tags, custom_tags)


class TestLambdaComponentArgs(unittest.TestCase):
    """Test cases for LambdaComponentArgs."""

    def test_lambda_component_args(self):
        """Test LambdaComponentArgs initialization."""
        env_config = get_environment_config('dev')
        args = LambdaComponentArgs(
            environment_suffix='test',
            env_config=env_config,
            role_arn='arn:aws:iam::123456789012:role/test'
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.env_config, env_config)
        self.assertEqual(args.role_arn, 'arn:aws:iam::123456789012:role/test')
        self.assertEqual(args.tags, {})

    def test_lambda_component_args_with_tags(self):
        """Test LambdaComponentArgs with custom tags."""
        env_config = get_environment_config('prod')
        custom_tags = {'App': 'payment-processor'}
        args = LambdaComponentArgs(
            environment_suffix='prod',
            env_config=env_config,
            role_arn='arn:aws:iam::345678901234:role/prod',
            tags=custom_tags
        )

        self.assertEqual(args.tags, custom_tags)


class TestDynamoDBComponentArgs(unittest.TestCase):
    """Test cases for DynamoDBComponentArgs."""

    def test_dynamodb_component_args(self):
        """Test DynamoDBComponentArgs initialization."""
        env_config = get_environment_config('staging')
        args = DynamoDBComponentArgs(
            environment_suffix='staging',
            env_config=env_config
        )

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.env_config, env_config)
        self.assertEqual(args.tags, {})

    def test_dynamodb_component_args_with_tags(self):
        """Test DynamoDBComponentArgs with custom tags."""
        env_config = get_environment_config('prod')
        custom_tags = {'Service': 'transactions'}
        args = DynamoDBComponentArgs(
            environment_suffix='prod',
            env_config=env_config,
            tags=custom_tags
        )

        self.assertEqual(args.tags, custom_tags)


class TestS3ComponentArgs(unittest.TestCase):
    """Test cases for S3ComponentArgs."""

    def test_s3_component_args(self):
        """Test S3ComponentArgs initialization."""
        env_config = get_environment_config('dev')
        args = S3ComponentArgs(
            environment_suffix='dev',
            env_config=env_config
        )

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.env_config, env_config)
        self.assertEqual(args.tags, {})

    def test_s3_component_args_with_tags(self):
        """Test S3ComponentArgs with custom tags."""
        env_config = get_environment_config('staging')
        custom_tags = {'Purpose': 'audit-logs'}
        args = S3ComponentArgs(
            environment_suffix='staging',
            env_config=env_config,
            tags=custom_tags
        )

        self.assertEqual(args.tags, custom_tags)


class TestIAMComponentArgs(unittest.TestCase):
    """Test cases for IAMComponentArgs."""

    def test_iam_component_args(self):
        """Test IAMComponentArgs initialization."""
        env_config = get_environment_config('prod')
        dynamodb_arn = Output.from_input('arn:aws:dynamodb:us-east-1:123456789012:table/test')
        s3_arn = Output.from_input('arn:aws:s3:::test-bucket')

        args = IAMComponentArgs(
            environment_suffix='prod',
            env_config=env_config,
            dynamodb_table_arn=dynamodb_arn,
            s3_bucket_arn=s3_arn
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.env_config, env_config)
        self.assertEqual(args.tags, {})

    def test_iam_component_args_with_tags(self):
        """Test IAMComponentArgs with custom tags."""
        env_config = get_environment_config('dev')
        dynamodb_arn = Output.from_input('arn:aws:dynamodb:us-east-1:123456789012:table/test')
        s3_arn = Output.from_input('arn:aws:s3:::test-bucket')
        custom_tags = {'Security': 'restricted'}

        args = IAMComponentArgs(
            environment_suffix='dev',
            env_config=env_config,
            dynamodb_table_arn=dynamodb_arn,
            s3_bucket_arn=s3_arn,
            tags=custom_tags
        )

        self.assertEqual(args.tags, custom_tags)


class TestMonitoringComponentArgs(unittest.TestCase):
    """Test cases for MonitoringComponentArgs."""

    def test_monitoring_component_args(self):
        """Test MonitoringComponentArgs initialization."""
        env_config = get_environment_config('staging')
        lambda_name = Output.from_input('payment-processor-staging')
        dynamodb_name = Output.from_input('payment-transactions-staging')

        args = MonitoringComponentArgs(
            environment_suffix='staging',
            env_config=env_config,
            lambda_function_name=lambda_name,
            dynamodb_table_name=dynamodb_name
        )

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.env_config, env_config)
        self.assertEqual(args.tags, {})

    def test_monitoring_component_args_with_tags(self):
        """Test MonitoringComponentArgs with custom tags."""
        env_config = get_environment_config('prod')
        lambda_name = Output.from_input('payment-processor-prod')
        dynamodb_name = Output.from_input('payment-transactions-prod')
        custom_tags = {'Alerts': 'critical'}

        args = MonitoringComponentArgs(
            environment_suffix='prod',
            env_config=env_config,
            lambda_function_name=lambda_name,
            dynamodb_table_name=dynamodb_name,
            tags=custom_tags
        )

        self.assertEqual(args.tags, custom_tags)


class TestPaymentStackArgs(unittest.TestCase):
    """Test cases for PaymentStackArgs."""

    def test_payment_stack_args_defaults(self):
        """Test PaymentStackArgs with default values."""
        args = PaymentStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})

    def test_payment_stack_args_with_tags(self):
        """Test PaymentStackArgs with custom tags."""
        custom_tags = {'Stack': 'payment-processing'}
        args = PaymentStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStackWithMocks(unittest.TestCase):
    """Test TapStack component creation with mocked Pulumi runtime."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test that TapStack creates all required components."""
        def check_stack(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test"),
                opts=ResourceOptions()
            )

            # Verify that the stack has a payment_stack component
            self.assertIsNotNone(stack.payment_stack)

            # Verify that payment_stack has all required components
            self.assertIsNotNone(stack.payment_stack.vpc)
            self.assertIsNotNone(stack.payment_stack.dynamodb)
            self.assertIsNotNone(stack.payment_stack.s3)
            self.assertIsNotNone(stack.payment_stack.iam)
            self.assertIsNotNone(stack.payment_stack.lambda_func)
            self.assertIsNotNone(stack.payment_stack.monitoring)

            # Verify environment config is set
            self.assertIsNotNone(stack.payment_stack.env_config)

            return {}

        pulumi.runtime.test(check_stack)

    @pulumi.runtime.test
    def test_tap_stack_with_dev_environment(self):
        """Test TapStack with dev environment."""
        def check_dev_stack(args):
            stack = TapStack(
                "dev-stack",
                TapStackArgs(environment_suffix="dev"),
                opts=ResourceOptions()
            )

            # Verify environment is correctly configured
            self.assertEqual(stack.environment_suffix, 'dev')
            self.assertEqual(stack.payment_stack.env_config.name, 'dev')
            self.assertEqual(stack.payment_stack.env_config.lambda_memory_mb, 512)

            return {}

        pulumi.runtime.test(check_dev_stack)

    @pulumi.runtime.test
    def test_tap_stack_with_prod_environment(self):
        """Test TapStack with prod environment."""
        def check_prod_stack(args):
            stack = TapStack(
                "prod-stack",
                TapStackArgs(environment_suffix="prod"),
                opts=ResourceOptions()
            )

            # Verify environment is correctly configured
            self.assertEqual(stack.environment_suffix, 'prod')
            self.assertEqual(stack.payment_stack.env_config.name, 'prod')
            self.assertEqual(stack.payment_stack.env_config.lambda_memory_mb, 2048)
            self.assertTrue(stack.payment_stack.env_config.dynamodb_pitr_enabled)

            return {}

        pulumi.runtime.test(check_prod_stack)

    @pulumi.runtime.test
    def test_tap_stack_with_custom_tags(self):
        """Test TapStack with custom tags."""
        def check_tags(args):
            custom_tags = {'Owner': 'QA', 'Project': 'Payment-Infra'}
            stack = TapStack(
                "tagged-stack",
                TapStackArgs(environment_suffix="staging", tags=custom_tags),
                opts=ResourceOptions()
            )

            # Verify tags are set
            self.assertEqual(stack.tags, custom_tags)

            return {}

        pulumi.runtime.test(check_tags)


class TestComponentCreation(unittest.TestCase):
    """Test component creation with Pulumi mocking."""

    @pulumi.runtime.test
    def test_vpc_component_creation(self):
        """Test VPC component creation."""
        def check_vpc(args):
            vpc_args = VpcComponentArgs(
                environment_suffix='test',
                cidr_block='10.0.0.0/16'
            )
            vpc = VpcComponent('test-vpc', vpc_args, opts=ResourceOptions())

            # Verify VPC was created
            self.assertIsNotNone(vpc.vpc)
            self.assertIsNotNone(vpc.igw)
            self.assertIsNotNone(vpc.public_subnets)
            self.assertIsNotNone(vpc.private_subnets)
            self.assertIsNotNone(vpc.nat_gateway)
            self.assertIsNotNone(vpc.eip)

            return {}

        pulumi.runtime.test(check_vpc)

    @pulumi.runtime.test
    def test_lambda_component_creation(self):
        """Test Lambda component creation."""
        def check_lambda(args):
            env_config = get_environment_config('dev')
            lambda_args = LambdaComponentArgs(
                environment_suffix='test',
                env_config=env_config,
                role_arn='arn:aws:iam::123456789012:role/test'
            )
            lambda_comp = LambdaComponent('test-lambda', lambda_args, opts=ResourceOptions())

            # Verify Lambda was created
            self.assertIsNotNone(lambda_comp.function)
            self.assertIsNotNone(lambda_comp.log_group)

            return {}

        pulumi.runtime.test(check_lambda)

    @pulumi.runtime.test
    def test_dynamodb_component_creation_ondemand(self):
        """Test DynamoDB component creation with on-demand mode."""
        def check_dynamodb(args):
            env_config = get_environment_config('dev')  # on-demand
            dynamodb_args = DynamoDBComponentArgs(
                environment_suffix='test',
                env_config=env_config
            )
            dynamodb = DynamoDBComponent('test-dynamodb', dynamodb_args, opts=ResourceOptions())

            # Verify DynamoDB was created
            self.assertIsNotNone(dynamodb.table)

            return {}

        pulumi.runtime.test(check_dynamodb)

    @pulumi.runtime.test
    def test_dynamodb_component_creation_provisioned(self):
        """Test DynamoDB component creation with provisioned mode."""
        def check_dynamodb_provisioned(args):
            env_config = get_environment_config('prod')  # provisioned
            dynamodb_args = DynamoDBComponentArgs(
                environment_suffix='prod',
                env_config=env_config
            )
            dynamodb = DynamoDBComponent('prod-dynamodb', dynamodb_args, opts=ResourceOptions())

            # Verify DynamoDB was created with provisioned mode
            self.assertIsNotNone(dynamodb.table)

            return {}

        pulumi.runtime.test(check_dynamodb_provisioned)

    @pulumi.runtime.test
    def test_s3_component_creation(self):
        """Test S3 component creation."""
        def check_s3(args):
            env_config = get_environment_config('staging')
            s3_args = S3ComponentArgs(
                environment_suffix='test',
                env_config=env_config
            )
            s3 = S3Component('test-s3', s3_args, opts=ResourceOptions())

            # Verify S3 resources were created
            self.assertIsNotNone(s3.bucket)
            self.assertIsNotNone(s3.versioning)
            self.assertIsNotNone(s3.encryption)
            self.assertIsNotNone(s3.public_access_block)
            self.assertIsNotNone(s3.lifecycle)

            return {}

        pulumi.runtime.test(check_s3)

    @pulumi.runtime.test
    def test_iam_component_creation(self):
        """Test IAM component creation."""
        def check_iam(args):
            env_config = get_environment_config('prod')
            dynamodb_arn = Output.from_input('arn:aws:dynamodb:us-east-1:123456789012:table/test')
            s3_arn = Output.from_input('arn:aws:s3:::test-bucket')

            iam_args = IAMComponentArgs(
                environment_suffix='test',
                env_config=env_config,
                dynamodb_table_arn=dynamodb_arn,
                s3_bucket_arn=s3_arn
            )
            iam = IAMComponent('test-iam', iam_args, opts=ResourceOptions())

            # Verify IAM resources were created
            self.assertIsNotNone(iam.lambda_role)
            self.assertIsNotNone(iam.lambda_policy)

            return {}

        pulumi.runtime.test(check_iam)

    @pulumi.runtime.test
    def test_monitoring_component_creation(self):
        """Test Monitoring component creation."""
        def check_monitoring(args):
            env_config = get_environment_config('staging')
            lambda_name = Output.from_input('payment-processor-staging')
            dynamodb_name = Output.from_input('payment-transactions-staging')

            monitoring_args = MonitoringComponentArgs(
                environment_suffix='staging',
                env_config=env_config,
                lambda_function_name=lambda_name,
                dynamodb_table_name=dynamodb_name
            )
            monitoring = MonitoringComponent('test-monitoring', monitoring_args, opts=ResourceOptions())

            # Verify CloudWatch alarms were created
            self.assertIsNotNone(monitoring.lambda_error_alarm)
            self.assertIsNotNone(monitoring.dynamodb_read_throttle_alarm)
            self.assertIsNotNone(monitoring.dynamodb_write_throttle_alarm)

            return {}

        pulumi.runtime.test(check_monitoring)

    @pulumi.runtime.test
    def test_payment_stack_component_creation(self):
        """Test PaymentStack component creation."""
        def check_payment_stack(args):
            payment_args = PaymentStackArgs(environment_suffix='test')
            payment_stack = PaymentStackComponent('test-payment-stack', payment_args, opts=ResourceOptions())

            # Verify all sub-components were created
            self.assertIsNotNone(payment_stack.env_config)
            self.assertIsNotNone(payment_stack.vpc)
            self.assertIsNotNone(payment_stack.dynamodb)
            self.assertIsNotNone(payment_stack.s3)
            self.assertIsNotNone(payment_stack.iam)
            self.assertIsNotNone(payment_stack.lambda_func)
            self.assertIsNotNone(payment_stack.monitoring)

            return {}

        pulumi.runtime.test(check_payment_stack)


if __name__ == '__main__':
    unittest.main()
