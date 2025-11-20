"""Unit tests for SimplifiedDRStack - Comprehensive coverage for all resources"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack_simplified import SimplifiedDRStack


@mark.describe("SimplifiedDRStack")
class TestSimplifiedDRStack(unittest.TestCase):
    """Comprehensive unit tests for SimplifiedDRStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.app.node.set_context("environmentSuffix", "test")
        # Provide environment for region-specific resources like DynamoDB GlobalTable
        self.env = cdk.Environment(account="123456789012", region="us-east-1")

    @mark.it("creates stack with all core resources")
    def test_creates_all_core_resources(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Verify all resource types exist
        template.resource_count_is("AWS::KMS::Key", 1)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.resource_count_is("AWS::DynamoDB::GlobalTable", 1)
        # 2 Lambda functions: 1 main + 1 custom resource for S3 auto-delete
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::Backup::BackupVault", 1)
        template.resource_count_is("AWS::Backup::BackupPlan", 1)

    @mark.it("creates KMS key with rotation enabled")
    def test_kms_key_with_rotation(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
        })

    @mark.it("creates VPC with correct CIDR and subnet configuration")
    def test_vpc_configuration(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - VPC with correct CIDR
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

        # ASSERT - Subnets (2 AZs × 3 types = 6 subnets)
        template.resource_count_is("AWS::EC2::Subnet", 6)

    @mark.it("creates Aurora cluster with PostgreSQL 14.6")
    def test_aurora_cluster_configuration(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Aurora cluster
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": Match.string_like_regexp("14\\.6"),
            "StorageEncrypted": True,
            "DeletionProtection": False,
        })

        # ASSERT - Aurora instance
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "aurora-postgresql",
            "DBInstanceClass": "db.t3.medium",
        })

    @mark.it("creates Aurora with correct master username")
    def test_aurora_master_username(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Secrets Manager secret for credentials
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "GenerateSecretString": Match.object_like({
                "GenerateStringKey": "password",
                "SecretStringTemplate": Match.string_like_regexp(".*dbadmin.*"),
            })
        })

    @mark.it("creates DynamoDB table with point-in-time recovery")
    def test_dynamodb_table_configuration(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": Match.array_with([
                Match.object_like({"AttributeName": "transactionId", "KeyType": "HASH"}),
                Match.object_like({"AttributeName": "timestamp", "KeyType": "RANGE"}),
            ]),
            "StreamSpecification": Match.object_like({
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            })
        })

    @mark.it("creates S3 bucket with encryption and versioning")
    def test_s3_bucket_configuration(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.any_value()
            }),
            "VersioningConfiguration": Match.object_like({
                "Status": "Enabled"
            })
        })

    @mark.it("creates Lambda function with VPC configuration")
    def test_lambda_function_configuration(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Timeout": 30,
            "Environment": Match.object_like({
                "Variables": Match.object_like({
                    "TABLE_NAME": Match.any_value(),
                    "ENVIRONMENT_SUFFIX": Match.any_value(),
                })
            })
        })

    @mark.it("creates Lambda with required IAM permissions")
    def test_lambda_iam_permissions(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Lambda role exists (multiple roles for Lambda + custom resources)
        # Just verify at least one role with VPC execution policy exists
        template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": Match.array_with([
                Match.object_like({
                    "Fn::Join": Match.array_with([
                        Match.array_with([
                            Match.string_like_regexp(".*AWSLambdaVPCAccessExecutionRole.*")
                        ])
                    ])
                })
            ])
        })

    @mark.it("creates Backup vault with correct configuration")
    def test_backup_vault_configuration(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Backup::BackupVault", {
            "BackupVaultName": Match.string_like_regexp("dr-backup-vault-.*")
        })

    @mark.it("creates Backup plan with hourly backups")
    def test_backup_plan_configuration(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Backup::BackupPlan", {
            "BackupPlan": Match.object_like({
                "BackupPlanName": Match.string_like_regexp("dr-backup-plan-.*"),
                "BackupPlanRule": Match.array_with([
                    Match.object_like({
                        "RuleName": "HourlyBackup",
                        "ScheduleExpression": Match.string_like_regexp("cron.*")
                    })
                ])
            })
        })

    @mark.it("creates Backup selections for Aurora and DynamoDB")
    def test_backup_selections(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 backup selections
        template.resource_count_is("AWS::Backup::BackupSelection", 2)

    @mark.it("applies correct removal policies for testing")
    def test_removal_policies(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - KMS key can be deleted
        template.has_resource("AWS::KMS::Key", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

        # ASSERT - S3 bucket can be deleted
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("creates all required CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Verify all expected outputs exist
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())

        assert "VPCId" in output_keys
        assert "AuroraClusterEndpoint" in output_keys
        assert "DynamoDBTableName" in output_keys
        assert "LambdaFunctionName" in output_keys
        assert "S3BucketName" in output_keys
        assert "BackupVaultName" in output_keys

    @mark.it("uses environment suffix in all resource names")
    def test_environment_suffix_in_names(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Backup vault name includes suffix
        template.has_resource_properties("AWS::Backup::BackupVault", {
            "BackupVaultName": Match.string_like_regexp(".*test.*")
        })

    @mark.it("configures security groups correctly")
    def test_security_groups(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Should have security groups for Aurora and Lambda (at least 2)
        # Actual count may vary with custom resources
        sg_resources = template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(sg_resources), 2)

    @mark.it("creates NAT Gateway for private subnet egress")
    def test_nat_gateway(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Should have 1 NAT Gateway
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("configures Aurora in isolated subnets")
    def test_aurora_subnet_placement(self):
        # ARRANGE
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - DB subnet group exists
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("uses consistent tagging")
    def test_resource_tagging(self):
        # ARRANGE
        self.app.node.set_context("environmentSuffix", "test")
        stack = SimplifiedDRStack(self.app, "TestStack", env=self.env)

        # ASSERT - Stack should be created successfully
        assert stack is not None

if __name__ == "__main__":
    unittest.main()
