import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates a VPC with public and private subnets")
    def test_creates_vpc_with_subnets(self):
        # ASSERT VPC
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties(
            "AWS::EC2::VPC", {"EnableDnsHostnames": True, "EnableDnsSupport": True}
        )

        # ASSERT Subnets - should have 2 public and 2 private (multi-AZ)
        self.template.resource_count_is("AWS::EC2::Subnet", 4)

        # ASSERT Internet Gateway
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

        # ASSERT NAT Gateway
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key_with_rotation(self):
        # ASSERT
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
                "KeyPolicy": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Sid": "Allow CloudWatch Logs to use the key",
                                        "Action": Match.array_with(
                                            ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey*"]
                                        ),
                                    }
                                )
                            ]
                        )
                    }
                ),
            },
        )

    @mark.it("creates Kinesis Data Stream with encryption")
    def test_creates_kinesis_stream_with_encryption(self):
        # ASSERT
        self.template.resource_count_is("AWS::Kinesis::Stream", 1)
        self.template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "Name": f"patient-data-stream-{self.env_suffix}",
                "ShardCount": 2,
                "RetentionPeriodHours": 24,
                "StreamEncryption": Match.object_like(
                    {"EncryptionType": "KMS", "KeyId": Match.any_value()}
                ),
            },
        )

    @mark.it("creates RDS PostgreSQL with encryption and private subnets")
    def test_creates_rds_with_encryption(self):
        # ASSERT RDS Instance
        self.template.resource_count_is("AWS::RDS::DBInstance", 1)
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "Engine": "postgres",
                "MultiAZ": True,
                "StorageEncrypted": True,
                "PubliclyAccessible": False,
                "BackupRetentionPeriod": 7,
                "DeletionProtection": False,
                "EnablePerformanceInsights": True,
            },
        )

        # ASSERT DB Subnet Group
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates Secrets Manager secret with encryption")
    def test_creates_secrets_manager_secret(self):
        # ASSERT
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
        self.template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "Name": f"healthcare-db-credentials-{self.env_suffix}",
                "Description": "RDS PostgreSQL credentials for healthcare database",
                "KmsKeyId": Match.any_value(),
            },
        )

    @mark.it("creates ECS cluster with container insights")
    def test_creates_ecs_cluster(self):
        # ASSERT
        self.template.resource_count_is("AWS::ECS::Cluster", 1)
        self.template.has_resource_properties(
            "AWS::ECS::Cluster",
            {
                "ClusterName": f"healthcare-processing-cluster-{self.env_suffix}",
                "ClusterSettings": [{"Name": "containerInsights", "Value": "enabled"}],
            },
        )

    @mark.it("creates ECS task definition with Fargate")
    def test_creates_ecs_task_definition(self):
        # ASSERT
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        self.template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {
                "Family": f"healthcare-processing-{self.env_suffix}",
                "Cpu": "512",
                "Memory": "1024",
                "NetworkMode": "awsvpc",
                "RequiresCompatibilities": ["FARGATE"],
            },
        )

    @mark.it("creates IAM roles with least privilege")
    def test_creates_iam_roles(self):
        # ASSERT Task Execution Role
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": f"healthcare-ecs-execution-role-{self.env_suffix}",
                "AssumeRolePolicyDocument": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Action": "sts:AssumeRole",
                                        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                                    }
                                )
                            ]
                        )
                    }
                ),
            },
        )

        # ASSERT Task Role
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": f"healthcare-ecs-task-role-{self.env_suffix}",
                "AssumeRolePolicyDocument": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Action": "sts:AssumeRole",
                                        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                                    }
                                )
                            ]
                        )
                    }
                ),
            },
        )

    @mark.it("creates CloudWatch log groups with encryption")
    def test_creates_cloudwatch_log_groups(self):
        # ASSERT - Should have audit log group and ECS log group
        self.template.resource_count_is("AWS::Logs::LogGroup", 2)

        # ASSERT Audit Log Group
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": f"/aws/healthcare/audit-{self.env_suffix}",
                "RetentionInDays": 30,
                "KmsKeyId": Match.any_value(),
            },
        )

        # ASSERT ECS Log Group
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": f"/aws/ecs/healthcare-processing-{self.env_suffix}",
                "RetentionInDays": 30,
                "KmsKeyId": Match.any_value(),
            },
        )

    @mark.it("creates security groups with proper isolation")
    def test_creates_security_groups(self):
        # ASSERT - Database SG and ECS SG
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 2)

        # ASSERT Database Security Group exists with correct name
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupName": f"healthcare-db-sg-{self.env_suffix}",
                "GroupDescription": f"Security group for RDS database-{self.env_suffix}",
            },
        )

        # ASSERT ECS Security Group exists with correct name
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupName": f"healthcare-ecs-sg-{self.env_suffix}",
                "GroupDescription": f"Security group for ECS tasks-{self.env_suffix}",
            },
        )

    @mark.it("creates stack outputs for all major resources")
    def test_creates_stack_outputs(self):
        # ASSERT outputs exist
        outputs = self.template.find_outputs("*")
        output_keys = [key for key in outputs.keys()]

        # Should have these outputs
        assert "VpcId" in output_keys
        assert "KinesisStreamName" in output_keys
        assert "KinesisStreamArn" in output_keys
        assert "EcsClusterName" in output_keys
        assert "DatabaseEndpoint" in output_keys
        assert "DatabaseSecretArn" in output_keys
        assert "KmsKeyId" in output_keys
        assert "AuditLogGroupName" in output_keys

    @mark.it("ensures all resources use removal policy DESTROY")
    def test_all_resources_destroyable(self):
        # Check KMS Key
        self.template.has_resource(
            "AWS::KMS::Key", {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"}
        )

        # Check RDS - uses Delete, not Snapshot (as per requirements)
        self.template.has_resource(
            "AWS::RDS::DBInstance",
            {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"},
        )

        # Check Log Groups
        self.template.has_resource(
            "AWS::Logs::LogGroup", {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"}
        )

    @mark.it("validates resource naming includes environment suffix")
    def test_resource_naming_with_suffix(self):
        # Kinesis
        self.template.has_resource_properties(
            "AWS::Kinesis::Stream", {"Name": Match.string_like_regexp(f".*{self.env_suffix}.*")}
        )

        # ECS Cluster
        self.template.has_resource_properties(
            "AWS::ECS::Cluster",
            {"ClusterName": Match.string_like_regexp(f".*{self.env_suffix}.*")},
        )

        # Secrets Manager
        self.template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {"Name": Match.string_like_regexp(f".*{self.env_suffix}.*")},
        )

        # Security Groups
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {"GroupName": Match.string_like_regexp(f".*{self.env_suffix}.*")},
        )

    @mark.it("validates HIPAA compliance features")
    def test_hipaa_compliance_features(self):
        # Encryption at rest for RDS
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance", {"StorageEncrypted": True, "KmsKeyId": Match.any_value()}
        )

        # Encryption for Kinesis
        self.template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {"StreamEncryption": {"EncryptionType": "KMS", "KeyId": Match.any_value()}},
        )

        # Encryption for CloudWatch Logs
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup", {"KmsKeyId": Match.any_value()}
        )

        # Database in private subnets only
        self.template.has_resource_properties("AWS::RDS::DBInstance", {"PubliclyAccessible": False})

        # Performance insights enabled
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {"EnablePerformanceInsights": True, "PerformanceInsightsKMSKeyId": Match.any_value()},
        )

        # CloudWatch logs for RDS
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance", {"EnableCloudwatchLogsExports": ["postgresql"]}
        )
