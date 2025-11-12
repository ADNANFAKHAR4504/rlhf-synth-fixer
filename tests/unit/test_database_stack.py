"""
Unit tests for DatabaseStack.
Tests Aurora Global Database and DynamoDB configuration.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from aws_cdk import aws_ec2 as ec2
from pytest import mark

from lib.database_stack import DatabaseStack


@mark.describe("DatabaseStack")
class TestDatabaseStack(unittest.TestCase):
    """Test cases for the DatabaseStack"""

    def setUp(self):
        """Set up a fresh CDK app and VPC for each test"""
        self.app = cdk.App()
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(self.vpc_stack, "TestVPC")

    @mark.it("creates global cluster in primary region")
    def test_primary_global_cluster(self):
        """Test that primary database creates global cluster."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify global cluster exists
        template.resource_count_is("AWS::RDS::GlobalCluster", 1)

    @mark.it("creates Aurora PostgreSQL cluster in primary")
    def test_primary_aurora_cluster(self):
        """Test that Aurora PostgreSQL cluster is created in primary."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify Aurora cluster exists
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    @mark.it("uses encrypted storage for Aurora")
    def test_aurora_encryption(self):
        """Test that Aurora cluster uses encrypted storage."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify encryption is enabled
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "StorageEncrypted": True
            }
        )

    @mark.it("creates database credentials secret")
    def test_database_credentials(self):
        """Test that database credentials are stored in Secrets Manager."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify secret exists
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates DynamoDB table in primary")
    def test_dynamodb_table_primary(self):
        """Test that DynamoDB global table is created in primary."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify DynamoDB table exists
        template.resource_count_is("AWS::DynamoDB::GlobalTable", 1)

    @mark.it("does not create DynamoDB in secondary")
    def test_no_dynamodb_secondary(self):
        """Test that DynamoDB table is not created in secondary region."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="secondary",
            is_primary=False,
            global_cluster_id="payment-global-test"
        )

        template = Template.from_stack(stack)

        # Verify DynamoDB table doesn't exist in secondary
        template.resource_count_is("AWS::DynamoDB::GlobalTable", 0)

    @mark.it("configures Aurora backup retention")
    def test_backup_retention(self):
        """Test that Aurora has proper backup configuration."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify backup retention exists
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "BackupRetentionPeriod": 7
            }
        )

    @mark.it("uses isolated subnets for database")
    def test_isolated_subnets(self):
        """Test that database uses isolated (private) subnets."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify DB subnet group exists (indicates proper subnet placement)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("tags database cluster with DR role")
    def test_database_tags(self):
        """Test that database cluster is tagged with DR role."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify DR-Role tag
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "Tags": Match.array_with([
                    {"Key": "DR-Role", "Value": "primary"}
                ])
            }
        )

    @mark.it("exports global cluster ID from primary")
    def test_global_cluster_output(self):
        """Test that primary exports global cluster ID."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify global cluster ID is exported
        outputs = template.to_json().get('Outputs', {})
        assert 'GlobalClusterIdentifier' in outputs

    @mark.it("creates secondary cluster without global cluster")
    def test_secondary_cluster(self):
        """Test that secondary cluster is created correctly."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="secondary",
            is_primary=False,
            global_cluster_id="payment-global-test"
        )

        template = Template.from_stack(stack)

        # Verify Aurora cluster exists but no global cluster
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.resource_count_is("AWS::RDS::GlobalCluster", 0)

    @mark.it("uses on-demand billing for DynamoDB")
    def test_dynamodb_billing(self):
        """Test that DynamoDB uses on-demand billing."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify on-demand billing
        template.has_resource_properties(
            "AWS::DynamoDB::GlobalTable",
            {
                "BillingMode": "PAY_PER_REQUEST"
            }
        )

    @mark.it("enables point-in-time recovery for DynamoDB")
    def test_dynamodb_pitr(self):
        """Test that DynamoDB has point-in-time recovery enabled."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify PITR is enabled
        template.has_resource_properties(
            "AWS::DynamoDB::GlobalTable",
            {
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": True
                }
            }
        )
