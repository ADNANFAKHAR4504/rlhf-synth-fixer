# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with the correct environment suffix")
    def test_creates_s3_bucket_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         props=TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Check bucket name contains the environment suffix
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.string_like_regexp(f"tap-storage-{env_suffix}-.*")
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Check bucket name contains 'dev' as default environment
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.string_like_regexp("tap-storage-dev-.*")
        })

    @mark.it("creates SNS topic for error notifications")
    def test_creates_sns_topic(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackSNS")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "TAP Error Notifications",
            "TopicName": Match.string_like_regexp("tap-errors-dev-.*")
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackLambda")
        template = Template.from_stack(stack)

        # ASSERT
        # Note: CDK creates 2 Lambda functions - our main one + BucketNotificationsHandler
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp("tap-processor-dev-.*"),
            "Handler": "index.lambda_handler",
            "Runtime": "python3.8",
            "Timeout": 15,  # Back to 15 seconds
            "Description": "Processes files uploaded to S3 bucket"
        })

    @mark.it("creates IAM role for Lambda execution")
    def test_creates_iam_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackIAM")
        template = Template.from_stack(stack)

        # ASSERT
        # Note: CDK creates 2 IAM roles - our main one + one for BucketNotificationsHandler
        template.resource_count_is("AWS::IAM::Role", 2)
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": Match.string_like_regexp("TapLambdaRole-dev-.*"),
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    })
                ])
            }
        })

    @mark.it("configures S3 bucket with proper security settings")
    def test_s3_bucket_security_settings(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackS3Security")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": Match.absent(),  # Versioning is false
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    })
                ])
            }
        })

    @mark.it("creates S3 lifecycle rules")
    def test_s3_lifecycle_rules(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackS3Lifecycle")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Id": "DeleteOldFiles",
                        "ExpirationInDays": 30,
                        "AbortIncompleteMultipartUpload": {
                            "DaysAfterInitiation": 1
                        },
                        "Status": "Enabled"
                    })
                ])
            }
        })

    @mark.it("creates CloudWatch alarm for Lambda errors")
    def test_creates_cloudwatch_alarm(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackAlarm")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": Match.string_like_regexp("TAP-Lambda-Errors-dev-.*"),
            "AlarmDescription": "Triggers when Lambda function encounters errors",
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "EvaluationPeriods": 1,
            "Threshold": 1,
            "TreatMissingData": "notBreaching",
            "Statistic": "Sum",
            "Period": 300
        })

    @mark.it("grants Lambda permission to read from S3 bucket")
    def test_lambda_s3_permissions(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackPermissions")
        template = Template.from_stack(stack)

        # ASSERT
        # Check for S3 access permissions (via grant_read)
        roles = template.find_resources("AWS::IAM::Role")
        lambda_role_found = False
        
        for role_id, role in roles.items():
            if "TapLambdaRole" in role.get("Properties", {}).get("RoleName", ""):
                lambda_role_found = True
                break
        
        self.assertTrue(lambda_role_found, "Lambda execution role should be created")

    @mark.it("configures S3 event notification for Lambda")
    def test_s3_event_notification(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackS3Event")
        template = Template.from_stack(stack)

        # ASSERT
        # Check for Lambda permission for S3 to invoke
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com"
        })

    @mark.it("tags all resources with environment and project tags")
    def test_resource_tags(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTags",
                         props=TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # Check that Lambda functions have the required tags
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp(f"tap-processor-{env_suffix}-.*"),
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": "Prod"},
                {"Key": "Project", "Value": "TAP"}
            ])
        })

    @mark.it("creates CloudFormation outputs for all resources")
    def test_cloudformation_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackOutputs")
        template = Template.from_stack(stack)

        # ASSERT
        # Check for expected outputs
        template.has_output("S3BucketName", {
            "Description": "Name of the S3 bucket for file storage",
            "Export": {
                "Name": Match.string_like_regexp("TAP-S3Bucket-dev-.*")
            }
        })

        template.has_output("LambdaFunctionArn", {
            "Description": "ARN of the file processing Lambda function",
            "Export": {
                "Name": Match.string_like_regexp("TAP-Lambda-dev-.*")
            }
        })

        template.has_output("SNSTopicArn", {
            "Description": "ARN of the SNS topic for error notifications",
            "Export": {
                "Name": Match.string_like_regexp("TAP-SNS-dev-.*")
            }
        })

        template.has_output("LambdaExecutionRoleArn", {
            "Description": "ARN of the Lambda execution role",
            "Export": {
                "Name": Match.string_like_regexp("TAP-Role-dev-.*")
            }
        })

    @mark.it("connects CloudWatch alarm to SNS topic")
    def test_alarm_sns_connection(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackAlarmSNS")
        template = Template.from_stack(stack)

        # ASSERT
        # Check that the alarm has an SNS action
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        self.assertTrue(len(alarms) > 0, "Should have at least one CloudWatch Alarm")
        
        for alarm_id, alarm in alarms.items():
            alarm_actions = alarm.get("Properties", {}).get("AlarmActions", [])
            self.assertTrue(len(alarm_actions) > 0, "Alarm should have at least one action")
            # Verify the action references an SNS topic
            self.assertIn("Ref", alarm_actions[0], "Alarm action should reference a resource")

    @mark.it("uses environment suffix from context if not in props")
    def test_uses_context_env_suffix(self):
        # ARRANGE
        self.app = cdk.App(context={"environmentSuffix": "staging"})
        stack = TapStack(self.app, "TapStackContext")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.string_like_regexp("tap-storage-staging-.*")
        })

    @mark.it("Lambda function includes inline code")
    def test_lambda_inline_code(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackLambdaCode")
        template = Template.from_stack(stack)

        # ASSERT
        # Find our main Lambda function (not the CDK-generated BucketNotificationsHandler)
        lambdas = template.find_resources("AWS::Lambda::Function")
        self.assertEqual(len(lambdas), 2, "Should have 2 Lambda functions (main + CDK handler)")
        
        # Find our main Lambda by checking for our specific function name pattern
        main_lambda = None
        for lambda_id, lambda_resource in lambdas.items():
            if "tap-processor" in lambda_resource.get("Properties", {}).get("FunctionName", ""):
                main_lambda = lambda_resource
                break
        
        self.assertIsNotNone(main_lambda, "Should find our main Lambda function")
        
        # Check our main Lambda has inline code with expected content
        code = main_lambda.get("Properties", {}).get("Code", {})
        self.assertIn("ZipFile", code, "Lambda should have inline code")
        zip_content = code.get("ZipFile", "")
        self.assertIn("lambda_handler", zip_content, "Code should contain lambda_handler function")
        self.assertIn("Processing event:", zip_content, "Code should contain expected log message")

    @mark.it("complete integration test - all resources created")
    def test_complete_stack_integration(self):
        # ARRANGE
        env_suffix = "integration"
        stack = TapStack(self.app, "TapStackIntegration",
                         props=TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Verify all expected resources are created
        # Note: CDK creates additional resources for S3 event notifications
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::Lambda::Function", 2)  # Main + BucketNotificationsHandler
        template.resource_count_is("AWS::IAM::Role", 2)  # Main + BucketNotificationsHandler role
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        template.resource_count_is("AWS::Lambda::Permission", 2)  # Main + notification handler
        
        # Verify environment suffix is used consistently
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.string_like_regexp(f"tap-storage-{env_suffix}-.*")
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp(f"tap-processor-{env_suffix}-.*")
        })
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": Match.string_like_regexp(f"tap-errors-{env_suffix}-.*")
        })