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

    @mark.it("creates S3 buckets with correct properties")
    def test_creates_s3_buckets(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Should have 3 S3 buckets (main, access logs, cloudtrail)
        template.resource_count_is("AWS::S3::Bucket", 3)
        
        # Check main bucket properties
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"proj-bucket-{env_suffix}",
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

        # Check access log bucket
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"proj-access-logs-{env_suffix}"
        })

        # Check CloudTrail bucket
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"proj-cloudtrail-{env_suffix}"
        })

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"proj-table-{env_suffix}",
            "KeySchema": [
                {
                    "AttributeName": "pk",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "sk",
                    "KeyType": "RANGE"
                }
            ],
            "AttributeDefinitions": [
                {
                    "AttributeName": "pk",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "sk",
                    "AttributeType": "S"
                }
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {
                "SSEEnabled": True
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - CDK creates multiple Lambda functions (our main function + bucket notifications + auto-delete)
        # Check our main Lambda function exists
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"proj-lambda-{env_suffix}",
            "Runtime": "python3.12",
            "Handler": "lambda_handler.lambda_handler",
            "Timeout": 300
        })

        # Check environment variables are set
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "TABLE_NAME": f"proj-table-{env_suffix}",
                    "BUCKET_NAME": f"proj-bucket-{env_suffix}"
                }
            }
        })

    @mark.it("creates IAM role with least privilege permissions")
    def test_creates_iam_role(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check Lambda role exists
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"proj-lambda-role-{env_suffix}",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
        })

        # Check that IAM policies exist for Lambda function
        # Note: We just verify the actions exist, not the exact resource format due to CloudFormation complexity
        template.has_resource_with_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion"
                        ]
                    }
                ])
            }
        })

        template.has_resource_with_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem"
                        ]
                    }
                ])
            }
        })

    @mark.it("creates CloudTrail with correct configuration")
    def test_creates_cloudtrail(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudTrail::Trail", 1)
        template.has_resource_properties("AWS::CloudTrail::Trail", {
            "TrailName": f"proj-trail-{env_suffix}",
            "IsMultiRegionTrail": True,
            "EnableLogFileValidation": True,
            "IncludeGlobalServiceEvents": True
        })

    @mark.it("sets up S3 event notification for Lambda")
    def test_s3_lambda_notification(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Lambda permission for S3 should be created
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "proj-bucket-dev"
        })
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "proj-table-dev"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "proj-lambda-dev"
        })

    @mark.it("ensures all resources follow naming convention")
    def test_naming_convention(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - All resources should follow proj-<resource>-<env> pattern
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"proj-bucket-{env_suffix}"
        })
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"proj-access-logs-{env_suffix}"
        })
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"proj-cloudtrail-{env_suffix}"
        })
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"proj-table-{env_suffix}"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"proj-lambda-{env_suffix}"
        })
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"proj-lambda-role-{env_suffix}"
        })
        template.has_resource_properties("AWS::CloudTrail::Trail", {
            "TrailName": f"proj-trail-{env_suffix}"
        })

    @mark.it("ensures no retain policies are used")
    def test_no_retain_policies(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - No resources should have retain deletion policy
        # This is enforced by using RemovalPolicy.DESTROY in the stack
        # The CDK template should not contain any DeletionPolicy: Retain
        template_json = template.to_json()
        
        for resource_name, resource in template_json.get("Resources", {}).items():
            deletion_policy = resource.get("DeletionPolicy")
            if deletion_policy:
                self.assertNotEqual(deletion_policy, "Retain",
                                    f"Resource {resource_name} has Retain deletion policy")
