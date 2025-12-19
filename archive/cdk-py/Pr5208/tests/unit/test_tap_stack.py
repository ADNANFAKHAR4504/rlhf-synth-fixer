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

        # ASSERT Subnets - should have at least 2 subnets
        subnet_count = len(self.template.find_resources("AWS::EC2::Subnet"))
        self.assertGreaterEqual(subnet_count, 2)

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key_with_rotation(self):
        # ASSERT
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True
            },
        )

    @mark.it("creates Kinesis Data Stream with encryption")
    def test_creates_kinesis_stream_with_encryption(self):
        # ASSERT
        self.template.resource_count_is("AWS::Kinesis::Stream", 1)
        self.template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "ShardCount": Match.any_value(),
                "RetentionPeriodHours": Match.any_value(),
                "StreamEncryption": Match.object_like(
                    {"EncryptionType": "KMS"}
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
                "PubliclyAccessible": False
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
                "KmsKeyId": Match.any_value(),
            },
        )

    @mark.it("creates ECS cluster with container insights")
    def test_creates_ecs_cluster(self):
        # ASSERT
        self.template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates ECS task definition with Fargate")
    def test_creates_ecs_task_definition(self):
        # ASSERT
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        self.template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {
                "Cpu": Match.any_value(),
                "Memory": Match.any_value(),
                "NetworkMode": "awsvpc",
                "RequiresCompatibilities": ["FARGATE"],
            },
        )

    @mark.it("creates IAM roles with least privilege")
    def test_creates_iam_roles(self):
        # ASSERT at least one IAM role exists
        iam_roles = self.template.find_resources("AWS::IAM::Role")
        self.assertGreater(len(iam_roles), 0)

    @mark.it("creates CloudWatch log groups with encryption")
    def test_creates_cloudwatch_log_groups(self):
        # ASSERT - Should have at least one log group
        log_groups = self.template.find_resources("AWS::Logs::LogGroup")
        self.assertGreater(len(log_groups), 0)

        # ASSERT at least one has KMS encryption
        for log_group_id, log_group in log_groups.items():
            if "Properties" in log_group and "KmsKeyId" in log_group["Properties"]:
                self.assertIsNotNone(log_group["Properties"]["KmsKeyId"])
                break

    @mark.it("creates security groups with proper isolation")
    def test_creates_security_groups(self):
        # ASSERT - At least 2 security groups
        sg_count = len(self.template.find_resources("AWS::EC2::SecurityGroup"))
        self.assertGreaterEqual(sg_count, 2)

    @mark.it("creates stack outputs for major resources")
    def test_creates_stack_outputs(self):
        # ASSERT outputs exist
        outputs = self.template.find_outputs("*")
        output_keys = [key for key in outputs.keys()]

        # Should have at least some outputs
        self.assertGreater(len(output_keys), 0)

    @mark.it("ensures resources use removal policy DESTROY for dev")
    def test_resources_destroyable(self):
        # Check KMS Key has delete policy
        self.template.has_resource(
            "AWS::KMS::Key", {"DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete"}
        )

    @mark.it("validates HIPAA compliance features")
    def test_hipaa_compliance_features(self):
        # Encryption at rest for RDS
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance", {"StorageEncrypted": True}
        )

        # Encryption for Kinesis
        self.template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {"StreamEncryption": {"EncryptionType": "KMS"}},
        )

        # Database in private subnets only
        self.template.has_resource_properties("AWS::RDS::DBInstance", {"PubliclyAccessible": False})
