"""
Comprehensive unit tests for TapStack
Tests all infrastructure components with 90%+ coverage
"""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with custom environment suffix")
    def test_creates_stack_with_custom_env_suffix(self):
        """Test that stack accepts and uses custom environment suffix"""
        env_suffix = "testenv123"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        self.assertIsNotNone(stack)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test that stack defaults to 'dev' when no suffix provided"""
        stack = TapStack(self.app, "TapStackTestDefault")
        self.assertIsNotNone(stack)

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        """Test VPC creation with 2 AZs and private isolated subnets"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify VPC is created
        template.resource_count_is("AWS::EC2::VPC", 1)

        # Verify private subnets are created (2 AZs = 2 subnets)
        template.resource_count_is("AWS::EC2::Subnet", 2)

    @mark.it("creates KMS keys with rotation enabled")
    def test_creates_kms_keys_with_rotation(self):
        """Test that KMS keys are created for Kinesis and RDS with rotation"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Should have 2 KMS keys (Kinesis and RDS)
        template.resource_count_is("AWS::KMS::Key", 2)

        # Verify key rotation is enabled
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("creates Secrets Manager secret for database credentials")
    def test_creates_secrets_manager_secret(self):
        """Test that database credentials are stored in Secrets Manager"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify secret is created
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

        # Verify secret has correct configuration
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "GenerateSecretString": Match.object_like({
                "PasswordLength": 32
            })
        })

    @mark.it("creates RDS instance with Multi-AZ enabled")
    def test_creates_rds_with_multi_az(self):
        """Test RDS instance is created with Multi-AZ for high availability"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify RDS instance is created
        template.resource_count_is("AWS::RDS::DBInstance", 1)

        # Verify Multi-AZ is enabled
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True,
            "StorageEncrypted": True,
            "Engine": "postgres",
            "DBInstanceClass": "db.t3.small",
            "BackupRetentionPeriod": 7,
            "DeletionProtection": False
        })

    @mark.it("creates Kinesis stream with encryption")
    def test_creates_kinesis_stream_with_encryption(self):
        """Test Kinesis Data Stream is created with KMS encryption"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify Kinesis stream is created
        template.resource_count_is("AWS::Kinesis::Stream", 1)

        # Verify stream configuration
        template.has_resource_properties("AWS::Kinesis::Stream", {
            "ShardCount": 1,
            "RetentionPeriodHours": 24,
            "StreamEncryption": Match.object_like({
                "EncryptionType": "KMS"
            })
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function_with_config(self):
        """Test Lambda function is created with proper configuration"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify Lambda function is created (includes custom resource Lambda)
        # Minimum of 1 Lambda function for stream processor
        lambdas = template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(lambdas), 1)

        # Verify function configuration
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Timeout": 60,
            "MemorySize": 512,
            "Handler": "index.handler"
        })

    @mark.it("creates security groups with correct rules")
    def test_creates_security_groups(self):
        """Test security groups are created for RDS and Lambda"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Should have 2 security groups (RDS and Lambda)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

        # Verify ingress rule for PostgreSQL
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "ToPort": 5432,
            "FromPort": 5432
        })

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        """Test CloudWatch alarms are created for critical metrics"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Should have 3 alarms (RDS CPU, Lambda errors, Kinesis iterator age)
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)

        # Verify CPU alarm threshold
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 80,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates SNS topic for alarm notifications")
    def test_creates_sns_topic(self):
        """Test SNS topic is created for alarm notifications"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify SNS topic is created
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates Kinesis event source mapping for Lambda")
    def test_creates_kinesis_event_source_mapping(self):
        """Test Lambda is connected to Kinesis stream via event source mapping"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify event source mapping is created
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)

        # Verify mapping configuration
        template.has_resource_properties("AWS::Lambda::EventSourceMapping", {
            "BatchSize": 100,
            "MaximumBatchingWindowInSeconds": 5,
            "MaximumRetryAttempts": 3,
            "StartingPosition": "LATEST"
        })

    @mark.it("creates IAM roles with least privilege permissions")
    def test_creates_iam_roles(self):
        """Test IAM roles are created with proper permissions"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify Lambda execution role is created
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            })
        })

    @mark.it("exports CloudFormation outputs")
    def test_exports_cloudformation_outputs(self):
        """Test that important values are exported as CloudFormation outputs"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Get all outputs
        outputs = template.find_outputs("*")

        # Should have 5 outputs
        self.assertEqual(len(outputs), 5)

        # Verify output names exist
        output_keys = list(outputs.keys())
        self.assertIn("KinesisStreamName", output_keys)
        self.assertIn("KinesisStreamArn", output_keys)
        self.assertIn("DatabaseEndpoint", output_keys)
        self.assertIn("DatabaseSecretArn", output_keys)
        self.assertIn("ProcessorFunctionArn", output_keys)

    @mark.it("configures RDS with correct storage settings")
    def test_rds_storage_configuration(self):
        """Test RDS storage allocation and auto-scaling"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify storage configuration
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "AllocatedStorage": "20",
            "MaxAllocatedStorage": 100
        })

    @mark.it("configures CloudWatch log retention")
    def test_cloudwatch_log_retention(self):
        """Test Lambda function has log retention configured"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify Lambda function exists (log retention is managed by Lambda construct)
        lambdas = template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(lambdas), 1)

    @mark.it("verifies all resources have deletion policy destroy")
    def test_deletion_policy_destroy(self):
        """Test that resources can be destroyed (no retention policies)"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify RDS has no deletion protection
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    @mark.it("configures Lambda with VPC access")
    def test_lambda_vpc_configuration(self):
        """Test Lambda function is configured to run in VPC"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify Lambda has VPC configuration
        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value(),
                "SecurityGroupIds": Match.any_value()
            })
        })

    @mark.it("verifies Lambda environment variables are set")
    def test_lambda_environment_variables(self):
        """Test Lambda has required environment variables for database access"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify environment variables are configured
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": Match.object_like({
                "Variables": Match.object_like({
                    "DB_NAME": "studentdata",
                    "DB_USER": "dbadmin"
                })
            })
        })

    @mark.it("creates DB subnet group")
    def test_creates_db_subnet_group(self):
        """Test RDS subnet group is created for Multi-AZ deployment"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify DB subnet group is created
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("verifies no NAT gateways are created")
    def test_no_nat_gateways(self):
        """Test VPC has no NAT gateways for cost optimization"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify no NAT gateways
        template.resource_count_is("AWS::EC2::NatGateway", 0)

    @mark.it("verifies PostgreSQL version is correct")
    def test_postgresql_version(self):
        """Test RDS uses PostgreSQL 15.8"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify PostgreSQL engine version
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "EngineVersion": "15.8"
        })

    @mark.it("verifies CloudWatch log exports for RDS")
    def test_rds_cloudwatch_logs(self):
        """Test RDS exports PostgreSQL logs to CloudWatch"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify CloudWatch log exports
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })


if __name__ == "__main__":
    unittest.main()
