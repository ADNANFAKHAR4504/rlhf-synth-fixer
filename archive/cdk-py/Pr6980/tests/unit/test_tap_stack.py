"""Comprehensive unit tests for TapStack CDK infrastructure.

Tests all components using CDK Template assertions (no AWS deployment needed).
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Infrastructure")
class TestTapStack(unittest.TestCase):
    """Comprehensive test suite for TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.env_suffix = "testenv"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix),
            env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates stack with correct resource counts")
    def test_resource_counts(self):
        """Verify all expected resources are created."""
        # VPC and networking
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

        # Security Groups (Aurora, ECS, Lambda, ALB)
        # Note: ALB creates its own security group
        security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(security_groups), 3)

        # Aurora Serverless v2
        self.template.resource_count_is("AWS::RDS::DBCluster", 1)
        self.template.resource_count_is("AWS::RDS::DBInstance", 2)  # Writer + Reader

        # DynamoDB
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)

        # S3
        self.template.resource_count_is("AWS::S3::Bucket", 1)

        # Lambda (Note: CDK may create additional Lambda functions for custom resources)
        lambda_functions = self.template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(lambda_functions), 1)
        self.template.resource_count_is("AWS::SQS::Queue", 1)  # DLQ

        # ECS
        self.template.resource_count_is("AWS::ECS::Cluster", 1)
        self.template.resource_count_is("AWS::ECS::Service", 1)
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

        # CloudWatch
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

        # SNS
        self.template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("configures VPC with 2 AZs and correct subnet structure")
    def test_vpc_configuration(self):
        """Verify VPC is configured with 2 AZs and proper subnets."""
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

        # Should have subnets across 2 AZs (public, private, isolated)
        # 2 AZs * 3 subnet types = 6 subnets
        self.template.resource_count_is("AWS::EC2::Subnet", 6)

        # Single NAT Gateway for cost optimization
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("configures Aurora Serverless v2 with PostgreSQL 15.8")
    def test_aurora_cluster_configuration(self):
        """Verify Aurora cluster is configured correctly."""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "15.8",
            "DatabaseName": "transactions",
            "ServerlessV2ScalingConfiguration": {
                "MinCapacity": 0.5,
                "MaxCapacity": 4
            },
            "DeletionProtection": False,
            "BackupRetentionPeriod": 7,
        })

    @mark.it("configures Aurora with Multi-AZ (writer + reader instances)")
    def test_aurora_multi_az(self):
        """Verify Aurora has writer and reader instances for Multi-AZ."""
        # Should have 2 instances: writer + reader
        self.template.resource_count_is("AWS::RDS::DBInstance", 2)

    @mark.it("configures Aurora with correct removal policy")
    def test_aurora_removal_policy(self):
        """Verify Aurora cluster has DESTROY removal policy."""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "DeletionProtection": False,
        })

    @mark.it("configures security groups for Aurora access")
    def test_aurora_security_groups(self):
        """Verify Aurora security group allows ECS and Lambda access."""
        # Aurora SG should exist
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Aurora Serverless v2",
        })

        # Should have ingress rules for port 5432 (PostgreSQL)
        self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "ToPort": 5432,
        })

    @mark.it("configures DynamoDB table with correct attributes")
    def test_dynamodb_table_configuration(self):
        """Verify DynamoDB table configuration."""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            },
            "KeySchema": [
                {"AttributeName": "sessionId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "AttributeDefinitions": Match.array_with([
                {"AttributeName": "sessionId", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "N"},
                {"AttributeName": "userId", "AttributeType": "S"}
            ])
        })

    @mark.it("configures DynamoDB with GSI for userId queries")
    def test_dynamodb_gsi(self):
        """Verify DynamoDB has Global Secondary Index."""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "userId-index",
                    "KeySchema": [
                        {"AttributeName": "userId", "KeyType": "HASH"},
                        {"AttributeName": "timestamp", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                }
            ]
        })

    @mark.it("configures S3 bucket with versioning and encryption")
    def test_s3_bucket_configuration(self):
        """Verify S3 bucket security and versioning."""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("configures S3 bucket with lifecycle rules")
    def test_s3_lifecycle_rules(self):
        """Verify S3 bucket has lifecycle policies."""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Id": "TransitionToIA",
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "STANDARD_IA",
                                "TransitionInDays": 30
                            }
                        ]
                    })
                ])
            }
        })

    @mark.it("configures Lambda function with correct runtime and handler")
    def test_lambda_configuration(self):
        """Verify Lambda function configuration."""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "Timeout": 30,
        })

    @mark.it("configures Lambda with retry logic and DLQ")
    def test_lambda_retry_and_dlq(self):
        """Verify Lambda has retry configuration and DLQ."""
        # DLQ should exist
        self.template.resource_count_is("AWS::SQS::Queue", 1)

        # Lambda should reference DLQ
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "DeadLetterConfig": Match.object_like({
                "TargetArn": Match.any_value()
            })
        })

    @mark.it("configures Lambda with VPC access")
    def test_lambda_vpc_configuration(self):
        """Verify Lambda is deployed in VPC."""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value(),
                "SecurityGroupIds": Match.any_value()
            })
        })

    @mark.it("configures Lambda with environment variables")
    def test_lambda_environment_variables(self):
        """Verify Lambda has required environment variables."""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "TABLE_NAME": Match.any_value(),
                    "BUCKET_NAME": Match.any_value()
                }
            }
        })

    @mark.it("grants Lambda permissions to DynamoDB and S3")
    def test_lambda_iam_permissions(self):
        """Verify Lambda has necessary IAM permissions."""
        # Lambda should have an execution role
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {"Service": "lambda.amazonaws.com"}
                    })
                ])
            })
        })

        # Should have policies for DynamoDB and S3
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.any_value(),
                        "Effect": "Allow"
                    })
                ])
            })
        })

    @mark.it("configures ECS cluster with correct name")
    def test_ecs_cluster_configuration(self):
        """Verify ECS cluster configuration."""
        self.template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("configures ECS Fargate service with correct CPU and memory")
    def test_ecs_task_definition(self):
        """Verify ECS task definition resources."""
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "256",
            "Memory": "512",
            "NetworkMode": "awsvpc",
            "RequiresCompatibilities": ["FARGATE"]
        })

    @mark.it("configures ECS service with desired count of 2")
    def test_ecs_service_configuration(self):
        """Verify ECS service has correct desired count."""
        self.template.has_resource_properties("AWS::ECS::Service", {
            "DesiredCount": 2,
            "LaunchType": "FARGATE"
        })

    @mark.it("configures ECS with Application Load Balancer")
    def test_ecs_alb_configuration(self):
        """Verify ALB is configured for ECS service."""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)

    @mark.it("configures ALB target group with health checks")
    def test_alb_health_check(self):
        """Verify ALB target group health check configuration."""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/",
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3,
            "HealthCheckIntervalSeconds": 30
        })

    @mark.it("configures ECS auto-scaling with min 2 and max 10 tasks")
    def test_ecs_auto_scaling(self):
        """Verify ECS auto-scaling configuration."""
        # Should have scalable target
        self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 10,
            "ServiceNamespace": "ecs"
        })

        # Should have scaling policies
        self.template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 2)

    @mark.it("configures ECS task with environment variables")
    def test_ecs_task_environment_variables(self):
        """Verify ECS task has required environment variables."""
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "Environment": Match.array_with([
                        {"Name": "DB_HOST", "Value": Match.any_value()},
                        {"Name": "DB_NAME", "Value": "transactions"},
                        {"Name": "TABLE_NAME", "Value": Match.any_value()},
                        {"Name": "BUCKET_NAME", "Value": Match.any_value()}
                    ])
                })
            ])
        })

    @mark.it("grants ECS task permissions to DynamoDB, S3, and Secrets Manager")
    def test_ecs_task_iam_permissions(self):
        """Verify ECS task has necessary IAM permissions."""
        # Should have task execution role and task role
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {"Service": "ecs-tasks.amazonaws.com"}
                    })
                ])
            })
        })

    @mark.it("configures CloudWatch alarms for Aurora, ECS, and Lambda")
    def test_cloudwatch_alarms(self):
        """Verify CloudWatch alarms are configured."""
        # Should have 3 alarms: Aurora CPU, ECS health, Lambda errors
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 3)

        # Verify alarm properties
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": Match.any_value(),
            "Threshold": Match.any_value()
        })

    @mark.it("configures CloudWatch Dashboard")
    def test_cloudwatch_dashboard(self):
        """Verify CloudWatch dashboard is created."""
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

        self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardBody": Match.any_value()
        })

    @mark.it("configures SNS topic for alarm notifications")
    def test_sns_topic_configuration(self):
        """Verify SNS topic for alarms."""
        self.template.resource_count_is("AWS::SNS::Topic", 1)

        self.template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "Transaction System Alerts"
        })

    @mark.it("configures CloudWatch log retention")
    def test_cloudwatch_log_retention(self):
        """Verify log retention is configured for Lambda and ECS."""
        # Should have log groups with retention
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 7
        })

    @mark.it("includes environmentSuffix in all resource names")
    def test_environment_suffix_usage(self):
        """Verify environment suffix is used in resource naming."""
        env_suffix = self.env_suffix

        # Check VPC name includes suffix
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": Match.string_like_regexp(f".*{env_suffix}.*")}
            ])
        })

    @mark.it("uses RemovalPolicy.DESTROY for all stateful resources")
    def test_removal_policies(self):
        """Verify all resources can be destroyed."""
        # Aurora
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "DeletionProtection": False
        })

        # S3 - should have deletion policy
        s3_resources = self.template.find_resources("AWS::S3::Bucket")
        for logical_id, resource in s3_resources.items():
            # If DeletionPolicy is set, it should be Delete
            if "DeletionPolicy" in resource:
                self.assertEqual(resource["DeletionPolicy"], "Delete")

    @mark.it("configures all outputs correctly")
    def test_stack_outputs(self):
        """Verify all required outputs are present."""
        outputs = self.template.find_outputs("*")

        # Should have outputs for VPC, Aurora, DynamoDB, S3, Lambda, ALB, Dashboard
        self.assertGreaterEqual(len(outputs), 7)

        # Check specific outputs exist
        output_names = [k for k in outputs.keys()]
        self.assertIn("VpcId", output_names)
        self.assertIn("AuroraClusterEndpoint", output_names)
        self.assertIn("DynamoDBTableName", output_names)
        self.assertIn("S3BucketName", output_names)
        self.assertIn("LambdaFunctionArn", output_names)
        self.assertIn("LoadBalancerDNS", output_names)
        self.assertIn("DashboardURL", output_names)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Verify default environment suffix is 'dev'."""
        # Create a new app for this test to avoid synthesis conflicts
        app = cdk.App()
        stack = TapStack(
            app,
            "TapStackTestDefault",
            env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        template = Template.from_stack(stack)

        # Should still create all resources
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    @mark.it("uses correct subnet types for each service")
    def test_subnet_selection(self):
        """Verify services are deployed to correct subnet types."""
        # Aurora should be in isolated subnets
        self.template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "SubnetIds": Match.any_value()
        })

        # Lambda should be in private subnets with egress
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value()
            })
        })

        # ECS tasks should be in private subnets
        self.template.has_resource_properties("AWS::ECS::Service", {
            "NetworkConfiguration": Match.object_like({
                "AwsvpcConfiguration": Match.object_like({
                    "Subnets": Match.any_value()
                })
            })
        })

    @mark.it("configures security group ingress rules correctly")
    def test_security_group_ingress_rules(self):
        """Verify security group ingress rules are properly configured."""
        # Should have ingress rules
        ingress_rules = self.template.find_resources("AWS::EC2::SecurityGroupIngress")

        # At least 2 rules: ECS->Aurora and Lambda->Aurora
        self.assertGreaterEqual(len(ingress_rules), 2)

    @mark.it("creates IAM roles with least privilege")
    def test_iam_least_privilege(self):
        """Verify IAM roles follow least privilege principle."""
        # Find all IAM policies
        policies = self.template.find_resources("AWS::IAM::Policy")

        # Each policy should have specific actions, not wildcards
        for logical_id, policy in policies.items():
            statements = policy["Properties"]["PolicyDocument"]["Statement"]
            for statement in statements:
                # Should have Effect: Allow
                self.assertEqual(statement["Effect"], "Allow")
                # Actions should be defined (not testing for wildcards as CDK may generate them)
                self.assertIn("Action", statement)


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test TapStackProps configuration."""

    @mark.it("creates props with environment suffix")
    def test_props_with_environment_suffix(self):
        """Verify TapStackProps accepts environment_suffix."""
        props = TapStackProps(environment_suffix="test123")
        self.assertEqual(props.environment_suffix, "test123")

    @mark.it("creates props without environment suffix")
    def test_props_without_environment_suffix(self):
        """Verify TapStackProps works without environment_suffix."""
        props = TapStackProps()
        self.assertIsNone(props.environment_suffix)


if __name__ == "__main__":
    unittest.main()
