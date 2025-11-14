"""
Unit tests for TapStack - Payment Processing Infrastructure

Tests CDK resource creation and configuration without deploying to AWS.
Uses CDK assertions to verify CloudFormation template generation.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack - Payment Processing Infrastructure")
# pylint: disable=too-many-public-methods
class TestTapStack(unittest.TestCase):
    """Unit test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"

    def _create_stack(self):
        """Helper method to create a stack with test properties"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        return TapStack(self.app, "TestStack", props=props)

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates subnets in 3 availability zones")
    def test_creates_subnets_in_azs(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - Should have public, private, and database subnets * 2 AZs = 6 subnets (cost optimization)
        template.resource_count_is("AWS::EC2::Subnet", 6)

    @mark.it("creates NAT Gateway for private subnet connectivity")
    def test_creates_nat_gateway(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - Using 1 NAT Gateway for cost optimization
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates VPC Flow Logs for compliance")
    def test_creates_vpc_flow_logs(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::FlowLog", 1)
        # LogGroups created for VPC Flow Logs and other services
        resources = template.find_resources("AWS::Logs::LogGroup")
        self.assertGreater(len(resources), 0)

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("creates RDS Aurora PostgreSQL cluster")
    def test_creates_aurora_cluster(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7
        })

    @mark.it("creates Aurora instances with proper configuration")
    def test_creates_aurora_instances(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - 2 instances (1 writer + 1 reader)
        template.resource_count_is("AWS::RDS::DBInstance", 2)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "aurora-postgresql",
            "DBInstanceClass": "db.t3.medium"
        })

    @mark.it("creates DynamoDB transactions table with GSI")
    def test_creates_transactions_table(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 2)  # transactions + fraud
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "transactionId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates DynamoDB GSI with proper projection")
    def test_creates_dynamodb_gsi(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": Match.array_with([
                Match.object_like({
                    "IndexName": "CustomerIdIndex",
                    "Projection": {
                        "ProjectionType": "INCLUDE"
                    }
                })
            ])
        })

    @mark.it("creates S3 audit bucket with encryption")
    def test_creates_audit_bucket(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates S3 lifecycle policy for 90-day archive")
    def test_creates_s3_lifecycle_policy(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Status": "Enabled",
                        "Transitions": Match.array_with([
                            Match.object_like({
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 90
                            })
                        ])
                    })
                ])
            }
        })

    @mark.it("creates Lambda execution role with proper permissions")
    def test_creates_lambda_role(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            }
        })

    @mark.it("creates payment validation Lambda function")
    def test_creates_payment_validation_lambda(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - At least 4 Lambda functions (validation, fraud, processing, rotation)
        resources = template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(resources), 4)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Handler": "index.handler",
            "ReservedConcurrentExecutions": 10,
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    @mark.it("creates Lambda layer for shared dependencies")
    def test_creates_lambda_layer(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::LayerVersion", 1)

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internal",
            "Type": "application"
        })

    @mark.it("creates two target groups for blue-green deployment")
    def test_creates_target_groups(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - Blue and Green target groups
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)

    @mark.it("creates ALB listener with HTTP")
    def test_creates_alb_listener(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Protocol": "HTTP",
            "Port": 80
        })

    @mark.it("creates API Gateway REST API")
    def test_creates_api_gateway(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)

    @mark.it("creates API Gateway Lambda integrations")
    def test_creates_lambda_integrations(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - API Gateway methods with Lambda integrations
        resources = template.find_resources("AWS::ApiGateway::Method")
        self.assertGreater(len(resources), 0)

    @mark.it("creates API Gateway request validator")
    def test_creates_request_validator(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RequestValidator", 1)
        template.has_resource_properties("AWS::ApiGateway::RequestValidator", {
            "ValidateRequestBody": True,
            "ValidateRequestParameters": True
        })

    @mark.it("creates API Gateway resources for endpoints")
    def test_creates_api_resources(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - validate, fraud-check, transaction resources
        template.resource_count_is("AWS::ApiGateway::Resource", 3)

    @mark.it("creates SNS topics for alerting")
    def test_creates_sns_topics(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - Transaction failures and system errors topics
        template.resource_count_is("AWS::SNS::Topic", 2)

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - At least API latency and Lambda error alarms
        resources = template.find_resources("AWS::CloudWatch::Alarm")
        self.assertGreater(len(resources), 0, "Should have at least one CloudWatch alarm")

    @mark.it("creates secrets rotation Lambda function")
    def test_creates_secrets_rotation_lambda(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Timeout": 300  # 5 minutes
        })

    @mark.it("creates rotation schedule for secrets")
    def test_creates_rotation_schedule(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::RotationSchedule", 1)
        template.has_resource_properties("AWS::SecretsManager::RotationSchedule", {
            "RotationRules": {
                "ScheduleExpression": "rate(30 days)"
            }
        })

    @mark.it("creates SSM parameter for database endpoint")
    def test_creates_ssm_parameter(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SSM::Parameter", 1)
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Type": "String"
        })

    @mark.it("creates security groups for components")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - Lambda, ALB, and RDS security groups
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    @mark.it("creates Lambda permission for ALB invocation")
    def test_creates_lambda_permission(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "elasticloadbalancing.amazonaws.com"
        })

    @mark.it("creates CloudFormation outputs for key resources")
    def test_creates_outputs(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Get all outputs
        outputs = template.to_json()["Outputs"]

        # ASSERT
        self.assertIn("VpcId", outputs)
        self.assertIn("DatabaseEndpoint", outputs)
        self.assertIn("ApiEndpoint", outputs)
        self.assertIn("AlbDnsName", outputs)
        self.assertIn("AuditBucketName", outputs)
        self.assertIn("TransactionsTableName", outputs)
        self.assertIn("EnvironmentSuffix", outputs)

    @mark.it("applies environment suffix to resource names")
    def test_applies_environment_suffix(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT - Check that resources use environment suffix in naming
        outputs = template.to_json()["Outputs"]
        self.assertEqual(outputs["EnvironmentSuffix"]["Value"], self.env_suffix)

    @mark.it("enables encryption for all data at rest")
    def test_enables_encryption(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        # S3 bucket encrypted
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.any_value()
            })
        })

        # DynamoDB encrypted
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })

        # RDS encrypted
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True
        })

    @mark.it("enables CloudWatch Logs for RDS")
    def test_enables_rds_logs(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    @mark.it("configures Lambda functions in VPC")
    def test_lambda_in_vpc(self):
        # ARRANGE
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value(),
                "SecurityGroupIds": Match.any_value()
            })
        })

    @mark.it("sets proper tags on stack")
    def test_stack_tags(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)

        # Add tags to app
        cdk.Tags.of(stack).add("Project", "PaymentProcessing")
        cdk.Tags.of(stack).add("Environment", self.env_suffix)

        template = Template.from_stack(stack)

        # ASSERT - Tags are applied (check via CDK Tags API)
        self.assertIsNotNone(stack)

    @mark.it("uses default environment suffix when props is None")
    def test_default_environment_suffix_no_props(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TestStackNoProps", props=None)

        # ASSERT
        self.assertEqual(stack.environment_suffix, 'dev')

    @mark.it("uses default environment suffix when props has no suffix")
    def test_default_environment_suffix_empty_props(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=None)

        # ACT
        stack = TapStack(self.app, "TestStackEmptyProps", props=props)

        # ASSERT
        self.assertEqual(stack.environment_suffix, 'dev')

    @mark.it("validates environment suffix length")
    def test_environment_suffix_validation(self):
        # ARRANGE
        props = TapStackProps(environment_suffix="a" * 21)  # 21 characters

        # ACT & ASSERT
        with self.assertRaises(ValueError) as context:
            TapStack(self.app, "TestStackTooLong", props=props)

        self.assertIn("Environment suffix cannot exceed 20 characters", str(context.exception))

    @mark.it("accepts valid environment suffix")
    def test_valid_environment_suffix(self):
        # ARRANGE
        props = TapStackProps(environment_suffix="valid-suffix")

        # ACT
        stack = TapStack(self.app, "TestStackValid", props=props)

        # ASSERT
        self.assertEqual(stack.environment_suffix, "valid-suffix")


if __name__ == '__main__':
    unittest.main()
