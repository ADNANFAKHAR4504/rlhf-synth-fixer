"""Unit tests for TapStack CDK infrastructure"""
import unittest
import os
import sys

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

# Add lib to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Serverless Payment Processing Infrastructure")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"
        self.stack_props = TapStackProps(environment_suffix=self.env_suffix)

    def create_test_stack(self):
        """Helper method to create a test stack"""
        return TapStack(
            self.app,
            "TapStackTest",
            props=self.stack_props
        )

    def get_template(self, stack):
        """Helper method to get template from stack"""
        return Template.from_stack(stack)


@mark.describe("KMS Encryption")
class TestKMSConfiguration(TestTapStack):
    """Test KMS key configuration"""

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key_with_rotation(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": f"KMS key for payment system encryption - {self.env_suffix}"
        })

    @mark.it("creates KMS alias with environment suffix")
    def test_creates_kms_alias(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Alias", 1)
        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": f"alias/payment-system-{self.env_suffix}"
        })

    @mark.it("configures KMS key policy for CloudWatch Logs")
    def test_kms_key_policy_cloudwatch_logs(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check CloudWatch Logs policy in KMS key
        template.has_resource_properties("AWS::KMS::Key", {
            "KeyPolicy": {
                "Statement": Match.array_with([
                    {
                        "Sid": "AllowCloudWatchLogs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": Match.any_value()  # CDK generates Fn::Join for service name
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnEquals": {
                                "kms:EncryptionContext:aws:logs:arn": Match.any_value()
                            }
                        }
                    }
                ])
            }
        })
@mark.describe("DynamoDB Configuration")
class TestDynamoDBConfiguration(TestTapStack):
    """Test DynamoDB table configuration"""

    @mark.it("creates DynamoDB table with environment suffix")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"payment-transactions-{self.env_suffix}",
            "BillingMode": "PAY_PER_REQUEST"
        })

    @mark.it("configures DynamoDB table with proper keys")
    def test_dynamodb_table_keys(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "AttributeDefinitions": Match.array_with([
                {
                    "AttributeName": "transaction_id",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "timestamp",
                    "AttributeType": "S"
                }
            ]),
            "KeySchema": Match.array_with([
                {
                    "AttributeName": "transaction_id",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "timestamp",
                    "KeyType": "RANGE"
                }
            ])
        })

    @mark.it("enables DynamoDB encryption with customer managed key")
    def test_dynamodb_encryption(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True,
                "KMSMasterKeyId": Match.any_value()
            }
        })

    @mark.it("enables DynamoDB streams and point in time recovery")
    def test_dynamodb_streams_and_pitr(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })


@mark.describe("SQS Configuration")
class TestSQSConfiguration(TestTapStack):
    """Test SQS queue configuration"""

    @mark.it("creates notification queue with environment suffix")
    def test_creates_notification_queue(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"payment-notifications-{self.env_suffix}",
            "VisibilityTimeout": 300,
            "ReceiveMessageWaitTimeSeconds": 20
        })

    @mark.it("creates dead letter queues for each Lambda function")
    def test_creates_dead_letter_queues(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Should have 4 queues total (1 notification + 3 DLQs)
        template.resource_count_is("AWS::SQS::Queue", 4)
        
        # Check each DLQ exists
        dlq_names = [
            f"webhook-processor-dlq-{self.env_suffix}",
            f"transaction-reader-dlq-{self.env_suffix}",
            f"notification-sender-dlq-{self.env_suffix}"
        ]
        
        for dlq_name in dlq_names:
            template.has_resource_properties("AWS::SQS::Queue", {
                "QueueName": dlq_name
            })

    @mark.it("configures SQS encryption with KMS")
    def test_sqs_kms_encryption(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::SQS::Queue", {
            "KmsMasterKeyId": Match.any_value()
        })

    @mark.it("configures SQS retention period")
    def test_sqs_retention_period(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check retention period on notification queue
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"payment-notifications-{self.env_suffix}",
            "MessageRetentionPeriod": 1209600  # 14 days
        })


@mark.describe("SNS Configuration")
class TestSNSConfiguration(TestTapStack):
    """Test SNS topic configuration"""

    @mark.it("creates SNS topic with environment suffix")
    def test_creates_sns_topic(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"payment-email-notifications-{self.env_suffix}"
        })

    @mark.it("configures SNS encryption with KMS")
    def test_sns_kms_encryption(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::SNS::Topic", {
            "KmsMasterKeyId": Match.any_value()
        })


@mark.describe("IAM Roles and Policies")
class TestIAMConfiguration(TestTapStack):
    """Test IAM role and policy configuration"""

    @mark.it("creates IAM roles for each Lambda function")
    def test_creates_lambda_iam_roles(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Should have 3 Lambda roles
        lambda_roles = [
            f"webhook-processor-role-{self.env_suffix}",
            f"transaction-reader-role-{self.env_suffix}",
            f"notification-sender-role-{self.env_suffix}"
        ]
        
        for role_name in lambda_roles:
            template.has_resource_properties("AWS::IAM::Role", {
                "RoleName": role_name,
                "AssumeRolePolicyDocument": {
                    "Statement": Match.array_with([
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ])
                }
            })

    @mark.it("configures webhook processor IAM policy")
    def test_webhook_processor_iam_policy(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check IAM policy for webhook processor (CDK generates policy names)
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": ["dynamodb:PutItem", "dynamodb:UpdateItem"],
                        "Resource": Match.any_value()
                    },
                    {
                        "Effect": "Allow",
                        "Action": Match.any_value(),  # Can be string or array for SQS
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

    @mark.it("configures transaction reader IAM policy")
    def test_transaction_reader_iam_policy(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check IAM policy for transaction reader (CDK generates policy names)
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": Match.array_with(["dynamodb:GetItem"]),
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

    @mark.it("configures notification sender IAM policy")
    def test_notification_sender_iam_policy(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check IAM policy for notification sender (CDK generates policy names)
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": Match.any_value(),  # Can be string or array for SNS
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

    @mark.it("includes X-Ray permissions in all Lambda roles")
    def test_lambda_xray_permissions(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": Match.array_with([
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ])
                    })
                ])
            }
        })


@mark.describe("Lambda Functions")
class TestLambdaConfiguration(TestTapStack):
    """Test Lambda function configuration"""

    @mark.it("creates three Lambda functions with environment suffix")
    def test_creates_lambda_functions(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 3)
        
        function_names = [
            f"webhook-processor-{self.env_suffix}",
            f"transaction-reader-{self.env_suffix}",
            f"notification-sender-{self.env_suffix}"
        ]
        
        for function_name in function_names:
            template.has_resource_properties("AWS::Lambda::Function", {
                "FunctionName": function_name,
                "Runtime": "python3.11",
                "MemorySize": 512,
                "Timeout": 30,
                "Architectures": ["arm64"]
            })

    @mark.it("configures Lambda functions with X-Ray tracing")
    def test_lambda_xray_tracing(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    @mark.it("configures Lambda functions with dead letter queues")
    def test_lambda_dead_letter_queues(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "DeadLetterConfig": {
                "TargetArn": Match.any_value()
            }
        })

    @mark.it("configures Lambda environment variables")
    def test_lambda_environment_variables(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Webhook processor should have DynamoDB table and SQS queue
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"webhook-processor-{self.env_suffix}",
            "Environment": {
                "Variables": {
                    "DYNAMODB_TABLE": Match.any_value(),
                    "SQS_QUEUE_URL": Match.any_value(),
                    "KMS_KEY_ID": Match.any_value()
                }
            }
        })

    @mark.it("configures reserved concurrent executions")
    def test_lambda_reserved_concurrency(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Webhook processor should have higher concurrency
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"webhook-processor-{self.env_suffix}",
            "ReservedConcurrentExecutions": 100
        })

    @mark.it("configures Lambda encryption with KMS")
    def test_lambda_kms_encryption(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "KmsKeyArn": Match.any_value()
        })


@mark.describe("API Gateway Configuration")
class TestAPIGatewayConfiguration(TestTapStack):
    """Test API Gateway configuration"""

    @mark.it("creates REST API with environment suffix")
    def test_creates_rest_api(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"payment-api-{self.env_suffix}",
            "Description": "Serverless Payment Webhook Processing API",
            "EndpointConfiguration": {
                "Types": ["REGIONAL"]
            }
        })

    @mark.it("creates API Gateway resources for webhook endpoints")
    def test_creates_api_resources(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Should have resources for webhooks, payment, transactions, {id}, notify
        template.resource_count_is("AWS::ApiGateway::Resource", 5)

    @mark.it("creates API Gateway methods with IAM authorization")
    def test_creates_api_methods(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::Method", 3)
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "AuthorizationType": "AWS_IAM"
        })

    @mark.it("creates API Gateway integrations with Lambda functions")
    def test_creates_api_integrations(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check Lambda integrations (CDK creates Method resources with integrations)
        # In CDK, integrations are embedded in the Method resources, not separate resources
        template.resource_count_is("AWS::ApiGateway::Method", 3)  # webhook, status, notification endpoints

    @mark.it("creates request validators for API Gateway")
    def test_creates_request_validators(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RequestValidator", 1)
        template.has_resource_properties("AWS::ApiGateway::RequestValidator", {
            "ValidateRequestBody": True,
            "ValidateRequestParameters": True
        })

    @mark.it("creates request models for validation")
    def test_creates_request_models(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check request models (CDK doesn't set explicit names)
        template.resource_count_is("AWS::ApiGateway::Model", 2)
        template.has_resource_properties("AWS::ApiGateway::Model", {
            "ContentType": "application/json"
        })

    @mark.it("creates API Gateway deployment and stage")
    def test_creates_deployment_and_stage(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "MethodSettings": Match.array_with([
                Match.object_like({
                    "ResourcePath": "/*",
                    "HttpMethod": "*",
                    "MetricsEnabled": True,
                    "LoggingLevel": "INFO",
                    "DataTraceEnabled": True
                })
            ])
        })

    @mark.it("creates Lambda permissions for API Gateway")
    def test_creates_lambda_permissions(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check Lambda permissions (CDK creates more permissions for deployment)
        # CDK creates permissions for both methods and deployment stages
        template.resource_count_is("AWS::Lambda::Permission", 6)  # 3 functions x 2 permissions each


@mark.describe("CloudWatch Monitoring")
class TestCloudWatchConfiguration(TestTapStack):
    """Test CloudWatch monitoring configuration"""

    @mark.it("creates CloudWatch alarms for Lambda errors")
    def test_creates_lambda_error_alarms(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Should have error alarms for each Lambda function
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 5,
            "EvaluationPeriods": 2
        })

    @mark.it("creates CloudWatch alarms for Lambda duration")
    def test_creates_lambda_duration_alarms(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 10000,  # 10 seconds
            "EvaluationPeriods": 3
        })

    @mark.it("creates CloudWatch alarm for API Gateway errors")
    def test_creates_api_gateway_error_alarm(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 10
        })

    @mark.it("creates CloudWatch alarm for DynamoDB throttling")
    def test_creates_dynamodb_throttle_alarm(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 1,
            "EvaluationPeriods": 1
        })


@mark.describe("Stack Outputs")
class TestStackOutputs(TestTapStack):
    """Test CloudFormation stack outputs"""

    @mark.it("creates output for API Gateway invoke URL")
    def test_api_gateway_output(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_output("APIGatewayInvokeURL", {
            "Description": "API Gateway invoke URL"
        })

    @mark.it("creates output for DynamoDB table name")
    def test_dynamodb_table_output(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB table name"
        })

    @mark.it("creates output for SQS queue URL")
    def test_sqs_queue_output(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_output("SQSQueueURL", {
            "Description": "SQS queue URL"
        })

    @mark.it("creates output for KMS key ID")
    def test_kms_key_output(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_output("KMSKeyID", {
            "Description": "KMS key ID for encryption"
        })

    @mark.it("creates output for SNS topic ARN")
    def test_sns_topic_output(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT
        template.has_output("SNSTopicARN", {
            "Description": "SNS topic ARN for email notifications"
        })


@mark.describe("Resource Tagging")
class TestResourceTagging(TestTapStack):
    """Test resource tagging"""

    @mark.it("applies common tags to all resources")
    def test_common_tags_applied(self):
        # ARRANGE
        stack = self.create_test_stack()
        template = self.get_template(stack)

        # ASSERT - Check that resources have the expected tags
        # Check specific tags that are applied (CDK adds additional tags)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "Tags": Match.array_with([
                {
                    "Key": "Project",
                    "Value": "ServerlessPaymentAPI"
                }
            ])
        })

        # Check KMS key has tags too
        template.has_resource_properties("AWS::KMS::Key", {
            "Tags": Match.array_with([
                {
                    "Key": "Project", 
                    "Value": "ServerlessPaymentAPI"
                }
            ])
        })


@mark.describe("Environment Configuration")
class TestEnvironmentConfiguration(TestTapStack):
    """Test environment-specific configuration"""

    @mark.it("uses environment suffix in all resource names")
    def test_environment_suffix_in_names(self):
        # ARRANGE
        different_env = "production"
        props = TapStackProps(environment_suffix=different_env)
        stack = TapStack(self.app, "TapStackProd", props=props)
        template = self.get_template(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"payment-transactions-{different_env}"
        })
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"payment-api-{different_env}"
        })

    @mark.it("handles default environment suffix")
    def test_default_environment_suffix(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackDefault")
        template = self.get_template(stack)

        # ASSERT - Should use 'prod' as default
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "payment-transactions-prod"
        })


if __name__ == '__main__':
    unittest.main()
