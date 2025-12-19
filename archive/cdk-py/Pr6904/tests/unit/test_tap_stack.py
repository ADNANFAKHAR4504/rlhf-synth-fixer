import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps"""

    @mark.it("initializes with environment_suffix")
    def test_init_with_environment_suffix(self):
        props = TapStackProps(environment_suffix="test")
        self.assertEqual(props.environment_suffix, "test")

    @mark.it("initializes with env in kwargs")
    def test_init_with_env_kwarg(self):
        env = cdk.Environment(account="123456789", region="us-east-1")
        props = TapStackProps(environment_suffix="test", env=env)
        self.assertEqual(props.environment_suffix, "test")
        self.assertEqual(props.env, env)

    @mark.it("initializes without environment_suffix")
    def test_init_without_environment_suffix(self):
        props = TapStackProps()
        self.assertIsNone(props.environment_suffix)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with environment suffix from props")
    def test_creates_stack_with_env_suffix_from_props(self):
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify S3 buckets are created with correct names (includes stack name)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp(f"access-logs-tapstacktest-{env_suffix}"),
            },
        )
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp(f"documents-tapstacktest-{env_suffix}"),
            },
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp("access-logs-tapstacktestdefault-dev"),
            },
        )

    @mark.it("uses environment suffix from context when props not provided")
    def test_uses_env_suffix_from_context(self):
        app = cdk.App(context={"environmentSuffix": "contextenv"})
        stack = TapStack(app, "TapStackContext")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp("access-logs-tapstackcontext-contextenv"),
            },
        )

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key(self):
        stack = TapStack(self.app, "TapStackKMS")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
                "Description": Match.string_like_regexp("KMS key for document encryption"),
            },
        )

        # Verify KMS alias
        template.resource_count_is("AWS::KMS::Alias", 1)
        template.has_resource_properties(
            "AWS::KMS::Alias",
            {
                "AliasName": Match.string_like_regexp("alias/document-processing"),
            },
        )

    @mark.it("creates two S3 buckets with correct configurations")
    def test_creates_s3_buckets(self):
        stack = TapStack(self.app, "TapStackS3")
        template = Template.from_stack(stack)

        # Should have 2 buckets
        template.resource_count_is("AWS::S3::Bucket", 2)

        # Access log bucket
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp("access-logs-tapstacks3-dev"),
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

        # Document bucket
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp("documents-tapstacks3-dev"),
                "VersioningConfiguration": {"Status": "Enabled"},
                "LoggingConfiguration": Match.any_value(),
            },
        )

    @mark.it("creates VPC with private isolated subnets")
    def test_creates_vpc(self):
        stack = TapStack(self.app, "TapStackVPC")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "CidrBlock": Match.any_value(),
            },
        )

        # Verify VPC endpoints are created
        template.resource_count_is("AWS::EC2::VPCEndpoint", 5)

    @mark.it("creates DynamoDB table with correct schema")
    def test_creates_dynamodb_table(self):
        stack = TapStack(self.app, "TapStackDynamoDB")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": Match.string_like_regexp("audit-logs-tapstackdynamodb-dev"),
                "KeySchema": [
                    {"AttributeName": "requestId", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "AttributeDefinitions": [
                    {"AttributeName": "requestId", "AttributeType": "S"},
                    {"AttributeName": "timestamp", "AttributeType": "S"},
                ],
                "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            },
        )

    @mark.it("creates Secrets Manager secrets")
    def test_creates_secrets(self):
        stack = TapStack(self.app, "TapStackSecrets")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::SecretsManager::Secret", 2)

        # API key secret
        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "Name": Match.string_like_regexp("api-keys-tapstacksecrets-dev"),
                "Description": "API keys for document processing",
                "GenerateSecretString": Match.any_value(),
            },
        )

        # DB credentials secret
        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "Name": Match.string_like_regexp("db-credentials-tapstacksecrets-dev"),
                "Description": "Database credentials for document processing",
            },
        )

    @mark.it("creates validation Lambda function with correct configuration")
    def test_creates_validation_lambda(self):
        stack = TapStack(self.app, "TapStackValidationLambda")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Lambda::Function", 6)

        # Validation lambda doesn't have function_name set, so check by handler
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.9",
                "Handler": "validation.handler",
                "Timeout": 15,
            },
        )

        # Verify IAM role and policies (role_name is not set for validation lambda)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                            "Action": "sts:AssumeRole",
                        }
                    ]
                },
            },
        )

        # Verify policy statements
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": ["s3:GetObject", "s3:PutObject"],
                                    "Effect": "Allow",
                                }
                            ),
                            Match.object_like(
                                {
                                    "Action": "dynamodb:PutItem",
                                    "Effect": "Allow",
                                }
                            ),
                            Match.object_like(
                                {
                                    "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
                                    "Effect": "Allow",
                                }
                            ),
                        ]
                    )
                }
            },
        )

    @mark.it("creates encryption Lambda function with correct configuration")
    def test_creates_encryption_lambda(self):
        stack = TapStack(self.app, "TapStackEncryptionLambda")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.9",
                "Handler": "encryption.handler",
                "Timeout": 15,
            },
        )

        # Verify IAM role
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": "encryption-lambda-role-dev",
            },
        )

        # Verify KMS permissions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": [
                                        "kms:Encrypt",
                                        "kms:Decrypt",
                                        "kms:GenerateDataKey",
                                    ],
                                    "Effect": "Allow",
                                }
                            ),
                        ]
                    )
                }
            },
        )

    @mark.it("creates compliance Lambda function with correct configuration")
    def test_creates_compliance_lambda(self):
        stack = TapStack(self.app, "TapStackComplianceLambda")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.9",
                "Handler": "compliance.handler",
                "Timeout": 15,
            },
        )

        # Verify IAM role
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": "compliance-lambda-role-dev",
            },
        )

        # Verify Secrets Manager permission
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": "secretsmanager:GetSecretValue",
                                    "Effect": "Allow",
                                }
                            ),
                        ]
                    )
                }
            },
        )

    @mark.it("creates remediation Lambda function with correct configuration")
    def test_creates_remediation_lambda(self):
        stack = TapStack(self.app, "TapStackRemediationLambda")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.9",
                "Handler": "remediation.handler",
                "Timeout": 60,
            },
        )

        # Verify IAM role
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": "remediation-lambda-role-dev",
            },
        )

        # Verify remediation permissions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": [
                                        "ec2:RevokeSecurityGroupIngress",
                                        "ec2:RevokeSecurityGroupEgress",
                                        "iam:AttachUserPolicy",
                                        "iam:DetachUserPolicy",
                                    ],
                                    "Effect": "Allow",
                                }
                            ),
                            Match.object_like(
                                {
                                    "Action": "sns:Publish",
                                    "Effect": "Allow",
                                }
                            ),
                        ]
                    )
                }
            },
        )

    @mark.it("creates API Gateway with correct configuration")
    def test_creates_api_gateway(self):
        stack = TapStack(self.app, "TapStackAPIGateway")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {
                "Name": "document-processing-api-dev",
                "Description": "Secure document processing API",
            },
        )

        # Verify deployment stage
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::Stage",
            {
                "StageName": "prod",
            },
        )

        # Verify API methods
        template.resource_count_is("AWS::ApiGateway::Method", 3)

        # Verify API key
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::ApiKey",
            {
                "Name": "document-api-key-dev",
            },
        )

        # Verify usage plan
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::UsagePlan",
            {
                "UsagePlanName": "document-api-usage-dev",
                "Throttle": {
                    "RateLimit": 100,
                    "BurstLimit": 50,
                },
                "Quota": {
                    "Limit": 10000,
                    "Period": "DAY",
                },
            },
        )

        # Verify CloudWatch Log Group for API Gateway
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": "/aws/apigateway/document-api-dev",
            },
        )

    @mark.it("creates WAF with correct rules")
    def test_creates_waf(self):
        stack = TapStack(self.app, "TapStackWAF")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::WAFv2::WebACL", 1)
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Name": "document-api-waf-dev",
                "Scope": "REGIONAL",
                "DefaultAction": {"Allow": {}},
                "Rules": Match.array_with(
                    [
                        Match.object_like(
                            {
                                "Name": Match.string_like_regexp("SQLInjectionRule"),
                                "Priority": 1,
                                "Statement": {
                                    "ManagedRuleGroupStatement": {
                                        "VendorName": "AWS",
                                        "Name": "AWSManagedRulesSQLiRuleSet",
                                    }
                                },
                            }
                        ),
                        Match.object_like(
                            {
                                "Name": Match.string_like_regexp("XSSRule"),
                                "Priority": 2,
                                "Statement": {
                                    "ManagedRuleGroupStatement": {
                                        "VendorName": "AWS",
                                        "Name": "AWSManagedRulesKnownBadInputsRuleSet",
                                    }
                                },
                            }
                        ),
                    ]
                ),
            },
        )

        # Verify WAF association
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    @mark.it("creates CloudWatch monitoring resources")
    def test_creates_cloudwatch_monitoring(self):
        stack = TapStack(self.app, "TapStackCloudWatch")
        template = Template.from_stack(stack)

        # Verify log group
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": "/aws/events/api-calls-dev",
            },
        )

        # Verify EventBridge rule
        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "Name": "capture-api-calls-dev",
                "Description": "Capture all API Gateway calls",
                "EventPattern": {
                    "source": ["aws.apigateway"],
                    "detail-type": ["AWS API Call via CloudTrail"],
                },
            },
        )

    @mark.it("creates GuardDuty monitoring rule")
    def test_creates_guardduty_monitoring(self):
        stack = TapStack(self.app, "TapStackGuardDuty")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "Name": "guardduty-findings-dev",
                "Description": "Trigger remediation for high-severity GuardDuty findings",
                "EventPattern": {
                    "source": ["aws.guardduty"],
                    "detail-type": ["GuardDuty Finding"],
                    "detail": {
                        "severity": Match.array_with(
                            [
                                7,
                                7.0,
                                7.1,
                                7.2,
                                7.3,
                                7.4,
                                7.5,
                                7.6,
                                7.7,
                                7.8,
                                7.9,
                                8,
                                8.0,
                                8.1,
                                8.2,
                                8.3,
                                8.4,
                                8.5,
                                8.6,
                                8.7,
                                8.8,
                                8.9,
                            ]
                        )
                    },
                },
            },
        )

    @mark.it("creates SNS topic for security alerts")
    def test_creates_sns_alerts(self):
        stack = TapStack(self.app, "TapStackSNS")
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "TopicName": "security-alerts-dev",
                "DisplayName": "Security Alerts",
            },
        )

    @mark.it("creates all CloudFormation outputs")
    def test_creates_outputs(self):
        stack = TapStack(self.app, "TapStackOutputs")
        template = Template.from_stack(stack)

        template.has_output(
            "ApiEndpoint",
            {
                "Description": "API Gateway endpoint URL",
            },
        )

        template.has_output(
            "DocumentBucketName",
            {
                "Description": "Document storage bucket name",
            },
        )

        template.has_output(
            "AccessLogBucketName",
            {
                "Description": "Access log bucket name",
            },
        )

        template.has_output(
            "AuditTableName",
            {
                "Description": "Audit logs DynamoDB table name",
            },
        )

        template.has_output(
            "KmsKeyId",
            {
                "Description": "KMS key ID for encryption",
            },
        )

        template.has_output(
            "SecurityAlertTopicArn",
            {
                "Description": "SNS topic ARN for security alerts",
            },
        )

    @mark.it("creates all required resources")
    def test_creates_all_resources(self):
        stack = TapStack(self.app, "TapStackComplete")
        template = Template.from_stack(stack)

        # Verify resource counts
        template.resource_count_is("AWS::KMS::Key", 1)
        template.resource_count_is("AWS::KMS::Alias", 1)
        template.resource_count_is("AWS::S3::Bucket", 2)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::VPCEndpoint", 5)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.resource_count_is("AWS::SecretsManager::Secret", 2)
        template.resource_count_is("AWS::Lambda::Function", 6)
        template.resource_count_is("AWS::IAM::Role", 7)
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.resource_count_is("AWS::ApiGateway::Method", 3)
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        template.resource_count_is("AWS::WAFv2::WebACL", 1)
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)
        template.resource_count_is("AWS::Events::Rule", 2)
        template.resource_count_is("AWS::Logs::LogGroup", 2)
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.resource_count_is("AWS::CloudFormation::CustomResource", 0)

    @mark.it("creates Lambda functions with VPC configuration")
    def test_lambda_vpc_configuration(self):
        stack = TapStack(self.app, "TapStackLambdaVPC")
        template = Template.from_stack(stack)

        # All Lambda functions should have VPC configuration
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "VpcConfig": {
                    "SubnetIds": Match.any_value(),
                    "SecurityGroupIds": Match.any_value(),
                }
            },
        )

    @mark.it("creates API Gateway methods with API key requirement")
    def test_api_gateway_methods_require_api_key(self):
        stack = TapStack(self.app, "TapStackAPIMethods")
        template = Template.from_stack(stack)

        # Verify all methods require API key
        template.has_resource_properties(
            "AWS::ApiGateway::Method",
            {
                "ApiKeyRequired": True,
            },
        )

    @mark.it("creates resources with environment-specific naming")
    def test_environment_specific_naming(self):
        env_suffix = "prod"
        stack = TapStack(
            self.app, "TapStackProd", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Verify all resources use the environment suffix (with stack name)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp(f"access-logs-tapstackprod-{env_suffix}"),
            },
        )

        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": Match.string_like_regexp(f"audit-logs-tapstackprod-{env_suffix}"),
            },
        )

        # Validation lambda doesn't have function_name, check by handler
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Handler": "validation.handler",
            },
        )

    @mark.it("creates S3 buckets with encryption")
    def test_s3_bucket_encryption(self):
        stack = TapStack(self.app, "TapStackS3Encryption")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                            }
                        }
                    ]
                }
            },
        )

    @mark.it("creates DynamoDB table with customer-managed encryption")
    def test_dynamodb_encryption(self):
        stack = TapStack(self.app, "TapStackDynamoDBEncryption")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "SSESpecification": {
                    "SSEEnabled": True,
                    "SSEType": "KMS",
                }
            },
        )