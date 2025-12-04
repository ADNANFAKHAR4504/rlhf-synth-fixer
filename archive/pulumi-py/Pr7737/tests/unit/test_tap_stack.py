"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing framework.
"""

import unittest
from unittest.mock import Mock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Custom mocks for Pulumi resource creation."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": f"{args.name}-id", "arn": f"arn:aws:s3:::{args.name}"}
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:dynamodb:us-east-1:123:table/{args.name}", "name": args.name}
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:sns:us-east-1:123:{args.name}", "name": args.name}
        elif args.typ == "aws:lambda/function:Function":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:lambda:us-east-1:123:function:{args.name}", "name": args.name}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:iam::123:role/{args.name}", "name": args.name}
        elif args.typ == "aws:cfg/recorder:Recorder":
            outputs = {**args.inputs, "id": args.name, "name": args.name, "arn": f"arn:aws:config:us-east-1:123:recorder/{args.name}"}
        elif args.typ == "aws:cloudwatch/eventRule:EventRule":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:events:us-east-1:123:rule/{args.name}", "name": args.name}
        else:
            outputs = {**args.inputs, "id": f"{args.name}-id"}
        return [args.name + '_id', outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


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

        custom_tags = {'Project': 'TAP', 'Owner': 'DevOps'}
        args = TapStackArgs(
            environment_suffix='prod',
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_suffix_defaults_to_dev(self):
        """Test that None environment_suffix defaults to 'dev'."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix=None)

        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_initialization(self):
        """Test TapStack component initialization."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.environment_suffix, 'test')
        self.assertIsNone(stack.tags)

    @pulumi.runtime.test
    def test_tap_stack_creates_monitoring_stack(self):
        """Test that TapStack creates MonitoringStack."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.monitoring_stack)
        self.assertEqual(stack.monitoring_stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_tap_stack_creates_compliance_stack(self):
        """Test that TapStack creates ComplianceStack."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.compliance_stack)
        self.assertEqual(stack.compliance_stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_tap_stack_creates_config_stack(self):
        """Test that TapStack creates ConfigStack."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.config_stack)
        self.assertEqual(stack.config_stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_tap_stack_with_custom_tags(self):
        """Test TapStack with custom tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {'Environment': 'staging', 'Cost-Center': '1234'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)
        stack = TapStack('staging-stack', args)

        self.assertEqual(stack.tags, custom_tags)
        self.assertEqual(stack.environment_suffix, 'staging')


class TestMonitoringStack(unittest.TestCase):
    """Test cases for MonitoringStack component."""

    @pulumi.runtime.test
    def test_monitoring_stack_creates_sns_topic(self):
        """Test that MonitoringStack creates SNS topic."""
        from lib.monitoring_stack import MonitoringStack

        stack = MonitoringStack('monitoring-test', 'test')

        self.assertIsNotNone(stack.sns_topic)

    @pulumi.runtime.test
    def test_monitoring_stack_creates_dynamodb_table(self):
        """Test that MonitoringStack creates DynamoDB table."""
        from lib.monitoring_stack import MonitoringStack

        stack = MonitoringStack('monitoring-test', 'test')

        self.assertIsNotNone(stack.dynamodb_table)

    @pulumi.runtime.test
    def test_monitoring_stack_creates_config_bucket(self):
        """Test that MonitoringStack creates config S3 bucket."""
        from lib.monitoring_stack import MonitoringStack

        stack = MonitoringStack('monitoring-test', 'test')

        self.assertIsNotNone(stack.config_bucket)

    @pulumi.runtime.test
    def test_monitoring_stack_creates_reports_bucket(self):
        """Test that MonitoringStack creates reports S3 bucket."""
        from lib.monitoring_stack import MonitoringStack

        stack = MonitoringStack('monitoring-test', 'test')

        self.assertIsNotNone(stack.reports_bucket)

    @pulumi.runtime.test
    def test_monitoring_stack_enables_bucket_versioning(self):
        """Test that MonitoringStack enables versioning on buckets."""
        from lib.monitoring_stack import MonitoringStack

        stack = MonitoringStack('monitoring-test', 'test')

        self.assertIsNotNone(stack.config_bucket_versioning)
        self.assertIsNotNone(stack.reports_bucket_versioning)

    @pulumi.runtime.test
    def test_monitoring_stack_enables_bucket_encryption(self):
        """Test that MonitoringStack enables encryption on buckets."""
        from lib.monitoring_stack import MonitoringStack

        stack = MonitoringStack('monitoring-test', 'test')

        self.assertIsNotNone(stack.config_bucket_encryption)
        self.assertIsNotNone(stack.reports_bucket_encryption)

    @pulumi.runtime.test
    def test_monitoring_stack_creates_sns_subscription(self):
        """Test that MonitoringStack creates SNS topic subscription."""
        from lib.monitoring_stack import MonitoringStack

        stack = MonitoringStack('monitoring-test', 'test')

        self.assertIsNotNone(stack.sns_subscription)


class TestComplianceStack(unittest.TestCase):
    """Test cases for ComplianceStack component."""

    @pulumi.runtime.test
    def test_compliance_stack_creates_lambda_functions(self):
        """Test that ComplianceStack creates all Lambda functions."""
        from lib.compliance_stack import ComplianceStack
        import pulumi

        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789:test")
        mock_table = pulumi.Output.from_input("test-table")
        mock_bucket = pulumi.Output.from_input("test-bucket")

        stack = ComplianceStack(
            'compliance-test',
            'test',
            mock_sns_arn,
            mock_table,
            mock_bucket
        )

        self.assertIsNotNone(stack.ec2_tag_lambda)
        self.assertIsNotNone(stack.s3_encryption_lambda)
        self.assertIsNotNone(stack.rds_backup_lambda)
        self.assertIsNotNone(stack.report_aggregator_lambda)

    @pulumi.runtime.test
    def test_compliance_stack_creates_cloudwatch_rule(self):
        """Test that ComplianceStack creates CloudWatch Events rule."""
        from lib.compliance_stack import ComplianceStack
        import pulumi

        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789:test")
        mock_table = pulumi.Output.from_input("test-table")
        mock_bucket = pulumi.Output.from_input("test-bucket")

        stack = ComplianceStack(
            'compliance-test',
            'test',
            mock_sns_arn,
            mock_table,
            mock_bucket
        )

        self.assertIsNotNone(stack.schedule_rule)

    @pulumi.runtime.test
    def test_compliance_stack_creates_iam_roles(self):
        """Test that ComplianceStack creates IAM roles for Lambda functions."""
        from lib.compliance_stack import ComplianceStack
        import pulumi

        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789:test")
        mock_table = pulumi.Output.from_input("test-table")
        mock_bucket = pulumi.Output.from_input("test-bucket")

        stack = ComplianceStack(
            'compliance-test',
            'test',
            mock_sns_arn,
            mock_table,
            mock_bucket
        )

        self.assertIsNotNone(stack.ec2_tag_role)
        self.assertIsNotNone(stack.s3_encryption_role)
        self.assertIsNotNone(stack.rds_backup_role)
        self.assertIsNotNone(stack.report_aggregator_role)

    @pulumi.runtime.test
    def test_compliance_stack_creates_event_targets(self):
        """Test that ComplianceStack creates EventBridge targets."""
        from lib.compliance_stack import ComplianceStack
        import pulumi

        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789:test")
        mock_table = pulumi.Output.from_input("test-table")
        mock_bucket = pulumi.Output.from_input("test-bucket")

        stack = ComplianceStack(
            'compliance-test',
            'test',
            mock_sns_arn,
            mock_table,
            mock_bucket
        )

        self.assertIsNotNone(stack.ec2_target)
        self.assertIsNotNone(stack.s3_target)
        self.assertIsNotNone(stack.rds_target)
        self.assertIsNotNone(stack.report_target)

    @pulumi.runtime.test
    def test_compliance_stack_compliance_rule_lambdas_dict(self):
        """Test that compliance_rule_lambdas dictionary contains expected keys."""
        from lib.compliance_stack import ComplianceStack
        import pulumi

        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789:test")
        mock_table = pulumi.Output.from_input("test-table")
        mock_bucket = pulumi.Output.from_input("test-bucket")

        stack = ComplianceStack(
            'compliance-test',
            'test',
            mock_sns_arn,
            mock_table,
            mock_bucket
        )

        self.assertIn('ec2_tags', stack.compliance_rule_lambdas)
        self.assertIn('s3_encryption', stack.compliance_rule_lambdas)
        self.assertIn('rds_backups', stack.compliance_rule_lambdas)

    @pulumi.runtime.test
    def test_compliance_stack_lambda_permissions(self):
        """Test that ComplianceStack creates Lambda permissions for EventBridge."""
        from lib.compliance_stack import ComplianceStack
        import pulumi

        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789:test")
        mock_table = pulumi.Output.from_input("test-table")
        mock_bucket = pulumi.Output.from_input("test-bucket")

        stack = ComplianceStack(
            'compliance-test',
            'test',
            mock_sns_arn,
            mock_table,
            mock_bucket
        )

        self.assertIsNotNone(stack.ec2_permission)
        self.assertIsNotNone(stack.s3_permission)
        self.assertIsNotNone(stack.rds_permission)
        self.assertIsNotNone(stack.report_permission)

    @pulumi.runtime.test
    def test_compliance_stack_events_role_and_policy(self):
        """Test that ComplianceStack creates IAM role and policy for CloudWatch Events."""
        from lib.compliance_stack import ComplianceStack
        import pulumi

        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789:test")
        mock_table = pulumi.Output.from_input("test-table")
        mock_bucket = pulumi.Output.from_input("test-bucket")

        stack = ComplianceStack(
            'compliance-test',
            'test',
            mock_sns_arn,
            mock_table,
            mock_bucket
        )

        self.assertIsNotNone(stack.events_role)
        self.assertIsNotNone(stack.events_policy)


class TestConfigStack(unittest.TestCase):
    """Test cases for ConfigStack component."""

    def _create_mock_lambdas(self):
        """Helper to create mock Lambda functions with proper attributes."""
        import pulumi_aws as aws

        ec2_lambda = Mock(spec=aws.lambda_.Function)
        ec2_lambda.arn = 'arn:aws:lambda:us-east-1:123:function:ec2'
        ec2_lambda.name = 'ec2-lambda'

        s3_lambda = Mock(spec=aws.lambda_.Function)
        s3_lambda.arn = 'arn:aws:lambda:us-east-1:123:function:s3'
        s3_lambda.name = 's3-lambda'

        rds_lambda = Mock(spec=aws.lambda_.Function)
        rds_lambda.arn = 'arn:aws:lambda:us-east-1:123:function:rds'
        rds_lambda.name = 'rds-lambda'

        return {
            'ec2_tags': ec2_lambda,
            's3_encryption': s3_lambda,
            'rds_backups': rds_lambda,
        }

    @pulumi.runtime.test
    def test_config_stack_skips_config_recorder_by_default(self):
        """Test that ConfigStack skips AWS Config recorder by default to avoid limit conflict."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        # Config recorder is None by default to avoid AWS limit of 1 recorder per region
        self.assertIsNone(stack.config_recorder)

    @pulumi.runtime.test
    def test_config_stack_skips_delivery_channel_by_default(self):
        """Test that ConfigStack skips AWS Config delivery channel by default."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        # Delivery channel is None by default (requires config recorder)
        self.assertIsNone(stack.delivery_channel)

    @pulumi.runtime.test
    def test_config_stack_creates_config_rules(self):
        """Test that ConfigStack creates AWS Config rules."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        self.assertIsNotNone(stack.ec2_tag_config_rule)
        self.assertIsNotNone(stack.s3_encryption_config_rule)
        self.assertIsNotNone(stack.rds_backup_config_rule)

    @pulumi.runtime.test
    def test_config_stack_creates_iam_role(self):
        """Test that ConfigStack creates IAM role for AWS Config."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        self.assertIsNotNone(stack.config_role)

    @pulumi.runtime.test
    def test_config_stack_skips_recorder_status_by_default(self):
        """Test that ConfigStack skips Config recorder status by default."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        # Recorder status is None by default (requires config recorder)
        self.assertIsNone(stack.recorder_status)

    @pulumi.runtime.test
    def test_config_stack_creates_lambda_permissions(self):
        """Test that ConfigStack creates Lambda permissions for Config."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        self.assertIsNotNone(stack.ec2_config_permission)
        self.assertIsNotNone(stack.s3_config_permission)
        self.assertIsNotNone(stack.rds_config_permission)

    @pulumi.runtime.test
    def test_config_stack_creates_s3_policy(self):
        """Test that ConfigStack creates S3 policy for Config role."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        self.assertIsNotNone(stack.config_s3_policy)

    @pulumi.runtime.test
    def test_config_stack_attaches_managed_policy(self):
        """Test that ConfigStack attaches AWS managed policy to Config role."""
        from lib.config_stack import ConfigStack
        import pulumi

        mock_bucket = pulumi.Output.from_input("test-config-bucket")
        mock_lambdas = self._create_mock_lambdas()

        stack = ConfigStack(
            'config-test',
            'test',
            mock_bucket,
            mock_lambdas
        )

        self.assertIsNotNone(stack.config_policy_attachment)


if __name__ == '__main__':
    unittest.main()
