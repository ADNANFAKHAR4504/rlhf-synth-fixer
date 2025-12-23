"""Unit tests for S3, Lambda, Backup, Route53, and Monitoring stacks"""
import unittest
import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_kms as kms
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.s3_stack import S3Stack, S3StackProps
from lib.lambda_stack import LambdaStack, LambdaStackProps
from lib.backup_stack import BackupStack, BackupStackProps
from lib.route53_stack import Route53Stack, Route53StackProps
from lib.monitoring_stack import MonitoringStack, MonitoringStackProps
from lib.aurora_stack import AuroraStack


@mark.describe("S3Stack")
class TestS3Stack(unittest.TestCase):
    """Unit tests for S3Stack"""

    def setUp(self):
        """Set up CDK app and dependencies"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")
        self.primary_key = kms.Key(self.stack, "PrimaryKey")
        self.secondary_key = kms.Key(self.stack, "SecondaryKey")

    @mark.it("creates S3 buckets")
    def test_creates_buckets(self):
        # ARRANGE
        props = S3StackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            primary_key=self.primary_key,
            secondary_key=self.secondary_key
        )
        s3_stack = S3Stack(self.stack, "S3Test", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 2)

    @mark.it("enables bucket versioning")
    def test_bucket_versioning(self):
        # ARRANGE
        props = S3StackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            primary_key=self.primary_key,
            secondary_key=self.secondary_key
        )
        s3_stack = S3Stack(self.stack, "S3Test", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": Match.object_like({
                "Status": "Enabled"
            })
        })

    @mark.it("enables bucket encryption")
    def test_bucket_encryption(self):
        # ARRANGE
        props = S3StackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            primary_key=self.primary_key,
            secondary_key=self.secondary_key
        )
        s3_stack = S3Stack(self.stack, "S3Test", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.any_value()
            })
        })


@mark.describe("LambdaStack")
class TestLambdaStack(unittest.TestCase):
    """Unit tests for LambdaStack"""

    def setUp(self):
        """Set up CDK app and dependencies"""
        self.app = cdk.App()
        self.env = cdk.Environment(account="123456789012", region="us-east-1")
        self.stack = cdk.Stack(self.app, "TestStack", env=self.env)
        self.primary_vpc = ec2.Vpc(
            self.stack, "PrimaryVpc",
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )
        self.secondary_vpc = ec2.Vpc(
            self.stack, "SecondaryVpc",
            max_azs=2,
            ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )
        self.table = dynamodb.TableV2(
            self.stack, "TestTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            )
        )

    @mark.it("creates Lambda functions")
    def test_creates_lambda_functions(self):
        # ARRANGE
        props = LambdaStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            primary_vpc=self.primary_vpc,
            secondary_vpc=self.secondary_vpc,
            table=self.table
        )
        lambda_stack = LambdaStack(self.stack, "LambdaTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        lambda_functions = template.find_resources("AWS::Lambda::Function")
        assert len(lambda_functions) >= 2

    @mark.it("creates IAM role for Lambda")
    def test_creates_iam_role(self):
        # ARRANGE
        props = LambdaStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            primary_vpc=self.primary_vpc,
            secondary_vpc=self.secondary_vpc,
            table=self.table
        )
        lambda_stack = LambdaStack(self.stack, "LambdaTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) > 0


@mark.describe("BackupStack")
class TestBackupStack(unittest.TestCase):
    """Unit tests for BackupStack"""

    def setUp(self):
        """Set up CDK app"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates backup vaults")
    def test_creates_backup_vaults(self):
        # ARRANGE
        props = BackupStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            aurora_cluster_arn="arn:aws:rds:us-east-1:123456789012:cluster:test",
            dynamodb_table_arn="arn:aws:dynamodb:us-east-1:123456789012:table/test"
        )
        backup_stack = BackupStack(self.stack, "BackupTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::Backup::BackupVault", 2)

    @mark.it("creates backup plan")
    def test_creates_backup_plan(self):
        # ARRANGE
        props = BackupStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            aurora_cluster_arn="arn:aws:rds:us-east-1:123456789012:cluster:test",
            dynamodb_table_arn="arn:aws:dynamodb:us-east-1:123456789012:table/test"
        )
        backup_stack = BackupStack(self.stack, "BackupTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::Backup::BackupPlan", 1)

    @mark.it("creates backup selections")
    def test_creates_backup_selections(self):
        # ARRANGE
        props = BackupStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            aurora_cluster_arn="arn:aws:rds:us-east-1:123456789012:cluster:test",
            dynamodb_table_arn="arn:aws:dynamodb:us-east-1:123456789012:table/test"
        )
        backup_stack = BackupStack(self.stack, "BackupTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::Backup::BackupSelection", 2)

    @mark.it("creates SNS topic for notifications")
    def test_creates_sns_topic(self):
        # ARRANGE
        props = BackupStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            aurora_cluster_arn="arn:aws:rds:us-east-1:123456789012:cluster:test",
            dynamodb_table_arn="arn:aws:dynamodb:us-east-1:123456789012:table/test"
        )
        backup_stack = BackupStack(self.stack, "BackupTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)


@mark.describe("Route53Stack")
class TestRoute53Stack(unittest.TestCase):
    """Unit tests for Route53Stack"""

    def setUp(self):
        """Set up CDK app"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates hosted zone")
    def test_creates_hosted_zone(self):
        # ARRANGE
        props = Route53StackProps(
            environment_suffix="test",
            primary_function_url="primary.lambda.us-east-1.amazonaws.com",
            secondary_function_url="secondary.lambda.us-west-2.amazonaws.com"
        )
        route53_stack = Route53Stack(self.stack, "Route53Test", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::Route53::HostedZone", 1)

    @mark.it("creates health checks")
    def test_creates_health_checks(self):
        # ARRANGE
        props = Route53StackProps(
            environment_suffix="test",
            primary_function_url="primary.lambda.us-east-1.amazonaws.com",
            secondary_function_url="secondary.lambda.us-west-2.amazonaws.com"
        )
        route53_stack = Route53Stack(self.stack, "Route53Test", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::Route53::HealthCheck", 2)

    @mark.it("creates DNS records")
    def test_creates_dns_records(self):
        # ARRANGE
        props = Route53StackProps(
            environment_suffix="test",
            primary_function_url="primary.lambda.us-east-1.amazonaws.com",
            secondary_function_url="secondary.lambda.us-west-2.amazonaws.com"
        )
        route53_stack = Route53Stack(self.stack, "Route53Test", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        records = template.find_resources("AWS::Route53::RecordSet")
        # Should have at least 2 A records for weighted routing
        assert len(records) >= 2


@mark.describe("MonitoringStack")
class TestMonitoringStack(unittest.TestCase):
    """Unit tests for MonitoringStack"""

    def setUp(self):
        """Set up CDK app and dependencies"""
        self.app = cdk.App()
        self.env = cdk.Environment(account="123456789012", region="us-east-1")
        self.stack = cdk.Stack(self.app, "TestStack", env=self.env)

        # Create dependencies
        vpc = ec2.Vpc(
            self.stack, "TestVpc",
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )
        kms_key = kms.Key(self.stack, "TestKey")

        from lib.aurora_stack import AuroraStack, AuroraStackProps
        aurora_props = AuroraStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            kms_key=kms_key,
            vpc=vpc
        )
        aurora = AuroraStack(self.stack, "Aurora", props=aurora_props)
        self.primary_cluster = aurora.primary_cluster

        self.table = dynamodb.TableV2(
            self.stack, "TestTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            )
        )

    @mark.it("creates CloudWatch dashboard")
    def test_creates_dashboard(self):
        # ARRANGE
        props = MonitoringStackProps(
            environment_suffix="test",
            primary_cluster=self.primary_cluster,
            table=self.table,
            backup_vault_name="test-vault"
        )
        monitoring_stack = MonitoringStack(self.stack, "MonitoringTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        dashboard_resources = template.find_resources("AWS::CloudWatch::Dashboard")
        assert len(dashboard_resources) > 0

    @mark.it("creates CloudWatch alarms")
    def test_creates_alarms(self):
        # ARRANGE
        props = MonitoringStackProps(
            environment_suffix="test",
            primary_cluster=self.primary_cluster,
            table=self.table,
            backup_vault_name="test-vault"
        )
        monitoring_stack = MonitoringStack(self.stack, "MonitoringTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        assert len(alarms) > 0

    @mark.it("creates SNS topic for alerts")
    def test_creates_alert_topic(self):
        # ARRANGE
        props = MonitoringStackProps(
            environment_suffix="test",
            primary_cluster=self.primary_cluster,
            table=self.table,
            backup_vault_name="test-vault"
        )
        monitoring_stack = MonitoringStack(self.stack, "MonitoringTest", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)


if __name__ == "__main__":
    unittest.main()
