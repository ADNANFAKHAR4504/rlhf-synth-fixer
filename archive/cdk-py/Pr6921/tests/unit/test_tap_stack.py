"""Unit tests for TapStack CDK stack."""
import unittest
from typing import Dict, Any

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack."""

    def setUp(self) -> None:
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.env_config: Dict[str, Any] = {
            "kinesis_shard_count": 2,
            "lambda_memory_mb": 1024,
            "dynamodb_read_capacity": 10,
            "dynamodb_write_capacity": 10,
            "error_threshold_percent": 5,
            "log_retention_days": 14,
            "enable_tracing": True,
            "enable_pitr": True,
            "enable_versioning": True,
        }

    def test_creates_kinesis_stream_with_correct_shard_count(self) -> None:
        """Test that Kinesis stream is created with correct shard count."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.resource_count_is("AWS::Kinesis::Stream", 1)
        template.has_resource_properties("AWS::Kinesis::Stream", {
            "ShardCount": 2,
            "RetentionPeriodHours": 24,
            "StreamEncryption": {
                "EncryptionType": "KMS",
                "KeyId": "alias/aws/kinesis"
            }
        })

    def test_creates_dynamodb_table_with_correct_capacity(self) -> None:
        """Test that DynamoDB table is created with correct capacity."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 10,
                "WriteCapacityUnits": 10
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    def test_creates_s3_bucket_with_correct_naming(self) -> None:
        """Test that S3 bucket is created with correct naming pattern."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "company-fraud-data-staging-us-west-2-test123",
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    def test_creates_lambda_with_correct_memory(self) -> None:
        """Test that Lambda function is created with correct memory size."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert - Count includes S3 auto-delete lambdas (2) + our processor (1)
        template.resource_count_is("AWS::Lambda::Function", 3)
        # Check for our fraud processor function specifically
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "fraud-processor-staging-test123",
            "MemorySize": 1024,
            "Runtime": "python3.11",
            "Timeout": 60,
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    def test_creates_ssm_parameters(self) -> None:
        """Test that SSM parameters are created."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.resource_count_is("AWS::SSM::Parameter", 2)

    def test_creates_cloudwatch_alarms(self) -> None:
        """Test that CloudWatch alarms are created."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert - 3 alarms: error rate, duration, iterator age
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)

    def test_creates_sns_topic(self) -> None:
        """Test that SNS topic is created for alarms."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.resource_count_is("AWS::SNS::Topic", 1)

    def test_creates_event_source_mapping(self) -> None:
        """Test that event source mapping is created."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)
        template.has_resource_properties("AWS::Lambda::EventSourceMapping", {
            "BatchSize": 100,
            "StartingPosition": "LATEST",
            "MaximumRetryAttempts": 3,
            "MaximumBatchingWindowInSeconds": 5,
            "BisectBatchOnFunctionError": True
        })

    def test_creates_iam_role_for_lambda(self) -> None:
        """Test that IAM role is created for Lambda with correct policies."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
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

    def test_lambda_has_correct_environment_variables(self) -> None:
        """Test that Lambda function has correct environment variables."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "ENVIRONMENT": "staging",
                    "SSM_API_KEY_PARAM": "/fraud-detection/staging-test123/api-key",
                    "SSM_CONNECTION_STRING_PARAM": "/fraud-detection/staging-test123/connection-string",
                    "REGION": "us-west-2"
                })
            }
        })

    def test_tracing_disabled_for_dev_environment(self) -> None:
        """Test that X-Ray tracing is disabled for dev environment."""
        # Arrange
        dev_config = self.env_config.copy()
        dev_config["enable_tracing"] = False

        # Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="dev",
            env_config=dev_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-east-1")
        )
        template = Template.from_stack(stack)

        # Assert
        template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": Match.absent()
        })

    def test_point_in_time_recovery_disabled_for_dev(self) -> None:
        """Test that PITR is disabled for dev environment."""
        # Arrange
        dev_config = self.env_config.copy()
        dev_config["enable_pitr"] = False

        # Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="dev",
            env_config=dev_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-east-1")
        )
        template = Template.from_stack(stack)

        # Assert
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": False
            }
        })

    def test_s3_versioning_disabled_for_dev(self) -> None:
        """Test that S3 versioning is disabled for dev environment."""
        # Arrange
        dev_config = self.env_config.copy()
        dev_config["enable_versioning"] = False

        # Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="dev",
            env_config=dev_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-east-1")
        )
        template = Template.from_stack(stack)

        # Assert
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": Match.absent()
        })

    def test_all_resources_have_removal_policy_destroy(self) -> None:
        """Test that all resources have RemovalPolicy.DESTROY."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert - Check DynamoDB has DeletionPolicy: Delete
        template.has_resource("AWS::DynamoDB::Table", {
            "DeletionPolicy": "Delete"
        })

        # Assert - Check S3 has DeletionPolicy: Delete
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete"
        })

        # Assert - Check Kinesis has DeletionPolicy: Delete
        template.has_resource("AWS::Kinesis::Stream", {
            "DeletionPolicy": "Delete"
        })

    def test_s3_bucket_has_auto_delete_objects(self) -> None:
        """Test that S3 bucket has auto-delete objects enabled."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert - Custom resource for auto-delete should exist
        template.resource_count_is("Custom::S3AutoDeleteObjects", 1)

    def test_resource_naming_includes_environment_suffix(self) -> None:
        """Test that all resource names include environment suffix."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.has_resource_properties("AWS::Kinesis::Stream", {
            "Name": "fraud-transactions-staging-test123"
        })
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "fraud-results-staging-test123"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "fraud-processor-staging-test123"
        })

    def test_dynamodb_gsi_created(self) -> None:
        """Test that DynamoDB GSI is created."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "fraud-score-index",
                    "KeySchema": Match.array_with([
                        {
                            "AttributeName": "fraud_score_category",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "timestamp",
                            "KeyType": "RANGE"
                        }
                    ]),
                    "Projection": {
                        "ProjectionType": "ALL"
                    }
                }
            ]
        })

    def test_log_retention_set_correctly(self) -> None:
        """Test that log retention is set based on environment config."""
        # Arrange & Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=self.env_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert - Log group with 14 days retention
        template.has_resource_properties("Custom::LogRetention", {
            "RetentionInDays": 14
        })

    def test_sns_topic_with_email_subscription(self) -> None:
        """Test that SNS topic includes email subscription when configured."""
        # Arrange
        config_with_email = self.env_config.copy()
        config_with_email["alarm_email"] = "test@example.com"

        # Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="staging",
            env_config=config_with_email,
            environment_suffix="test123",
            env=cdk.Environment(region="us-west-2")
        )
        template = Template.from_stack(stack)

        # Assert
        template.resource_count_is("AWS::SNS::Subscription", 1)
        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "test@example.com"
        })

    def test_s3_lifecycle_policy_for_prod(self) -> None:
        """Test that S3 bucket has Glacier transition for prod environment."""
        # Arrange
        prod_config = self.env_config.copy()

        # Act
        stack = TapStack(
            self.app,
            "TestStack",
            env_name="prod",
            env_config=prod_config,
            environment_suffix="test123",
            env=cdk.Environment(region="us-east-1")
        )
        template = Template.from_stack(stack)

        # Assert - Should have lifecycle rules for Glacier transition
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Status": "Enabled"
                    })
                ])
            }
        })


if __name__ == '__main__':
    unittest.main()
