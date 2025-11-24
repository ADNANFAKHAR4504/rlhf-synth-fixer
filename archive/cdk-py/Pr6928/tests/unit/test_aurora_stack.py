"""Unit tests for AuroraStack"""
import unittest
import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_kms as kms
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.aurora_stack import AuroraStack, AuroraStackProps


@mark.describe("AuroraStack")
class TestAuroraStack(unittest.TestCase):
    """Comprehensive unit tests for AuroraStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

        # Create VPC and KMS key for props
        self.vpc = ec2.Vpc(
            self.stack, "TestVpc",
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
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )
        self.kms_key = kms.Key(self.stack, "TestKey")

        self.props = AuroraStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            kms_key=self.kms_key,
            vpc=self.vpc
        )

    @mark.it("creates Aurora global cluster")
    def test_creates_global_cluster(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::GlobalCluster", 1)

    @mark.it("creates Aurora database cluster")
    def test_creates_database_cluster(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    @mark.it("creates Aurora database instances")
    def test_creates_database_instances(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT - 2 instances
        template.resource_count_is("AWS::RDS::DBInstance", 2)

    @mark.it("configures PostgreSQL 14.6 engine")
    def test_postgres_engine(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::GlobalCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "14.6",
        })

    @mark.it("enables storage encryption")
    def test_storage_encryption(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True,
        })

    @mark.it("disables deletion protection")
    def test_deletion_protection(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "DeletionProtection": False,
        })

    @mark.it("creates subnet group")
    def test_creates_subnet_group(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates parameter group")
    def test_creates_parameter_group(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBClusterParameterGroup", 1)

    @mark.it("configures backup retention")
    def test_backup_retention(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "BackupRetentionPeriod": 7,
        })

    @mark.it("enables CloudWatch logs export")
    def test_cloudwatch_logs(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "EnableCloudwatchLogsExports": ["postgresql"],
        })

    @mark.it("creates security group")
    def test_creates_security_group(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT - Should have security groups
        security_groups = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(security_groups) > 0

    @mark.it("uses correct instance class")
    def test_instance_class(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.t3.medium",
        })

    @mark.it("creates CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())

        # Outputs have construct path prefix
        assert any("GlobalClusterIdentifier" in key for key in output_keys)
        assert any("PrimaryClusterEndpoint" in key for key in output_keys)
        assert any("PrimaryClusterReadEndpoint" in key for key in output_keys)

    @mark.it("exposes cluster objects")
    def test_exposes_clusters(self):
        # ARRANGE
        aurora_stack = AuroraStack(self.stack, "AuroraTest", props=self.props)

        # ASSERT
        assert aurora_stack.primary_cluster is not None
        assert aurora_stack.global_cluster is not None
        assert hasattr(aurora_stack.primary_cluster, 'cluster_endpoint')


if __name__ == "__main__":
    unittest.main()
