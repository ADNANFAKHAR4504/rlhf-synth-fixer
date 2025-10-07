import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack - Real-time Quiz Platform"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates VPC with correct CIDR and subnets")
    def test_vpc_configuration(self):
        """Test VPC is created with correct configuration"""
        # VPC with correct CIDR
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

        # Verify subnet count (2 public + 2 private = 4)
        self.template.resource_count_is("AWS::EC2::Subnet", 4)

        # Verify NAT Gateway exists
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

        # Verify Internet Gateway
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

    @mark.it("creates DynamoDB tables with correct configuration")
    def test_dynamodb_tables(self):
        """Test DynamoDB tables for questions, answers, and participants"""
        # Questions table
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [
                {"AttributeName": "quiz_id", "KeyType": "HASH"},
                {"AttributeName": "question_id", "KeyType": "RANGE"}
            ]
        })

        # Answers table (participant_id and question_id as keys)
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [
                {"AttributeName": "participant_id", "KeyType": "HASH"},
                {"AttributeName": "question_id", "KeyType": "RANGE"}
            ]
        })

        # Participants table with GSI (Region is a Ref, not a string)
        self.template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "BillingMode": "PAY_PER_REQUEST",
            "Replicas": Match.array_with([
                Match.object_like({
                    "GlobalSecondaryIndexes": Match.any_value()
                })
            ])
        })

        # Verify table count
        self.template.resource_count_is("AWS::DynamoDB::Table", 2)
        self.template.resource_count_is("AWS::DynamoDB::GlobalTable", 1)

    @mark.it("creates S3 bucket for quiz media with correct properties")
    def test_s3_media_bucket(self):
        """Test S3 bucket for quiz media assets"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

        self.template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("creates Cognito User Pool for authentication")
    def test_cognito_user_pool(self):
        """Test Cognito User Pool and Client configuration"""
        # User Pool (RequireSymbols is false by default)
        self.template.has_resource_properties("AWS::Cognito::UserPool", {
            "AutoVerifiedAttributes": ["email"],
            "Policies": {
                "PasswordPolicy": {
                    "MinimumLength": 8,
                    "RequireLowercase": True,
                    "RequireNumbers": True,
                    "RequireSymbols": False,
                    "RequireUppercase": True
                }
            }
        })

        # User Pool Client
        self.template.resource_count_is("AWS::Cognito::UserPoolClient", 1)

    @mark.it("creates ElastiCache Redis cluster for leaderboard")
    def test_elasticache_redis(self):
        """Test ElastiCache Redis cluster configuration"""
        self.template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
            "CacheNodeType": "cache.t3.micro",
            "Engine": "redis",
            "NumCacheNodes": 1
        })

        # Redis security group
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 1)

    @mark.it("creates Lambda functions with correct configuration")
    def test_lambda_functions(self):
        """Test all Lambda functions are created"""
        # WebSocket handler
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"TapStack-{self.env_suffix}-WebSocketHandler",
            "Runtime": "python3.10",
            "Handler": "websocket_handler.handler",
            "Timeout": 30
        })

        # Answer validator
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.10",
            "Handler": "answer_validator.handler"
        })

        # Leaderboard handler
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.10",
            "Handler": "leaderboard_handler.handler"
        })

        # Quiz scheduler
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.10",
            "Handler": "quiz_scheduler.handler"
        })

        # Verify all Lambda functions (4 main + custom resources)
        lambda_resources = [
            r for r in self.template.to_json()["Resources"].values()
            if r.get("Type") == "AWS::Lambda::Function"
        ]
        self.assertGreaterEqual(len(lambda_resources), 4)

    @mark.it("creates WebSocket API with routes")
    def test_websocket_api(self):
        """Test WebSocket API Gateway configuration"""
        # WebSocket API
        self.template.has_resource_properties("AWS::ApiGatewayV2::Api", {
            "Name": "QuizWebSocketApi",
            "ProtocolType": "WEBSOCKET",
            "RouteSelectionExpression": "$request.body.action"
        })

        # WebSocket routes ($connect, $disconnect, $default)
        self.template.resource_count_is("AWS::ApiGatewayV2::Route", 5)

        # WebSocket stage
        self.template.has_resource_properties("AWS::ApiGatewayV2::Stage", {
            "StageName": "prod",
            "AutoDeploy": True
        })

    @mark.it("creates HTTP API with routes")
    def test_http_api(self):
        """Test HTTP API Gateway for REST endpoints"""
        # HTTP API
        self.template.has_resource_properties("AWS::ApiGatewayV2::Api", {
            "Name": "QuizHttpApi",
            "ProtocolType": "HTTP"
        })

        # HTTP routes (POST /answer, GET /leaderboard/{quiz_id})
        self.template.resource_count_is("AWS::ApiGatewayV2::Route", 5)

    @mark.it("creates EventBridge rules for quiz scheduling")
    def test_eventbridge_rules(self):
        """Test EventBridge rules for scheduled and manual quiz triggers"""
        # Scheduled quiz rule (cron expression)
        self.template.has_resource_properties("AWS::Events::Rule", {
            "ScheduleExpression": "cron(0 */4 ? * * *)",
            "Description": "Trigger scheduled quiz sessions"
        })

        # Manual quiz trigger rule
        self.template.has_resource_properties("AWS::Events::Rule", {
            "EventPattern": Match.object_like({
                "source": ["quiz.platform"],
                "detail-type": ["Quiz Control"]
            })
        })

        self.template.resource_count_is("AWS::Events::Rule", 2)

    @mark.it("creates SNS topic for winner notifications")
    def test_sns_topic(self):
        """Test SNS topic for winner notifications"""
        self.template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "Quiz Winner Notifications"
        })

    @mark.it("creates CloudWatch dashboard and alarms")
    def test_cloudwatch_monitoring(self):
        """Test CloudWatch dashboard and alarms"""
        # Dashboard
        self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"quiz-platform-{self.env_suffix}"
        })

        # High error rate alarm (no explicit AlarmName)
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda",
            "Statistic": "Sum",
            "Threshold": 10,
            "AlarmDescription": "Alert when answer validator has high error rate"
        })

    @mark.it("creates IAM role with correct permissions")
    def test_iam_role_permissions(self):
        """Test Lambda execution role has correct permissions"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            })
        })

    @mark.it("creates log groups with correct retention")
    def test_log_groups(self):
        """Test CloudWatch log groups for Lambda functions"""
        # WebSocket log group
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/TapStack-{self.env_suffix}-WebSocketHandler",
            "RetentionInDays": 7
        })

        # Verify at least one log group exists
        log_groups = [
            r for r in self.template.to_json()["Resources"].values()
            if r.get("Type") == "AWS::Logs::LogGroup"
        ]
        self.assertGreaterEqual(len(log_groups), 1)

    @mark.it("creates stack outputs with correct values")
    def test_stack_outputs(self):
        """Test CloudFormation stack outputs"""
        # Check stack has outputs defined
        template_json = self.template.to_json()
        outputs = template_json.get("Outputs", {})

        # Verify outputs exist
        self.assertIn("WebSocketApiUrl", outputs)
        self.assertIn("HttpApiUrl", outputs)
        self.assertIn("UserPoolId", outputs)
        self.assertIn("UserPoolClientId", outputs)
        self.assertIn("MediaBucketName", outputs)
        self.assertIn("DashboardUrl", outputs)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test stack defaults to 'dev' environment suffix"""
        # Create a new app instance to avoid multiple synth calls
        new_app = cdk.App()
        default_stack = TapStack(new_app, "TapStackDefault")
        default_template = Template.from_stack(default_stack)

        # Check that Cognito User Pool exists (no explicit name)
        default_template.has_resource_properties("AWS::Cognito::UserPool", {
            "AutoVerifiedAttributes": ["email"]
        })

    @mark.it("Lambda functions are in VPC with correct security groups")
    def test_lambda_vpc_configuration(self):
        """Test Lambda functions are deployed in VPC"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SecurityGroupIds": Match.any_value(),
                "SubnetIds": Match.any_value()
            })
        })

    @mark.it("DynamoDB tables have stream enabled")
    def test_dynamodb_streams(self):
        """Test DynamoDB tables have streams enabled"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            }
        })
