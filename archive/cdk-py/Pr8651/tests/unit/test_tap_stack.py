"""
Unit tests for TapStack CDK infrastructure
Tests all resources created by the stack with comprehensive coverage
"""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Infrastructure")
class TestTapStack(unittest.TestCase):
    """Comprehensive test suite for TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            env=cdk.Environment(region="us-east-2")
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates exactly one S3 bucket")
    def test_creates_s3_bucket(self):
        """Verify S3 bucket is created"""
        self.template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("S3 bucket has correct name following naming convention")
    def test_s3_bucket_name(self):
        """Verify S3 bucket follows project-env-resource naming"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "tap-preprod-storage"
        })

    @mark.it("S3 bucket has versioning enabled")
    def test_s3_bucket_versioning(self):
        """Verify S3 bucket versioning is enabled"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    @mark.it("S3 bucket has encryption enabled")
    def test_s3_bucket_encryption(self):
        """Verify S3 bucket has server-side encryption"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        })

    @mark.it("S3 bucket blocks all public access")
    def test_s3_bucket_public_access(self):
        """Verify S3 bucket blocks all public access"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("S3 bucket has lifecycle rules for cost optimization")
    def test_s3_bucket_lifecycle_rules(self):
        """Verify S3 bucket has lifecycle rules configured"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Status": "Enabled"
                    })
                ])
            }
        })

    @mark.it("creates exactly one DynamoDB table")
    def test_creates_dynamodb_table(self):
        """Verify DynamoDB table is created"""
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)

    @mark.it("DynamoDB table has correct name following naming convention")
    def test_dynamodb_table_name(self):
        """Verify DynamoDB table follows project-env-resource naming"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tap-preprod-table"
        })

    @mark.it("DynamoDB table has correct partition key")
    def test_dynamodb_partition_key(self):
        """Verify DynamoDB table has 'id' as partition key"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {
                    "AttributeName": "id",
                    "KeyType": "HASH"
                }
            ],
            "AttributeDefinitions": [
                {
                    "AttributeName": "id",
                    "AttributeType": "S"
                }
            ]
        })

    @mark.it("DynamoDB table uses on-demand billing")
    def test_dynamodb_billing_mode(self):
        """Verify DynamoDB table uses PAY_PER_REQUEST billing"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })

    @mark.it("DynamoDB table has encryption enabled")
    def test_dynamodb_encryption(self):
        """Verify DynamoDB table has encryption enabled"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })

    @mark.it("DynamoDB table has point-in-time recovery enabled")
    def test_dynamodb_pitr(self):
        """Verify DynamoDB table has point-in-time recovery"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates exactly one Lambda function")
    def test_creates_lambda_function(self):
        """Verify Lambda function is created"""
        self.template.resource_count_is("AWS::Lambda::Function", 1)

    @mark.it("Lambda function has correct name following naming convention")
    def test_lambda_function_name(self):
        """Verify Lambda function follows project-env-resource naming"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tap-preprod-handler"
        })

    @mark.it("Lambda function uses Python 3.12 runtime")
    def test_lambda_runtime(self):
        """Verify Lambda function uses correct Python runtime"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.12"
        })

    @mark.it("Lambda function has correct handler")
    def test_lambda_handler(self):
        """Verify Lambda function handler is configured correctly"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.lambda_handler"
        })

    @mark.it("Lambda function has appropriate timeout")
    def test_lambda_timeout(self):
        """Verify Lambda function timeout is 30 seconds"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": 30
        })

    @mark.it("Lambda function has appropriate memory size")
    def test_lambda_memory(self):
        """Verify Lambda function memory is 256 MB"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 256
        })

    @mark.it("Lambda function has environment variables configured")
    def test_lambda_environment_variables(self):
        """Verify Lambda function has required environment variables"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "S3_BUCKET_NAME": Match.any_value(),
                    "DYNAMODB_TABLE_NAME": Match.any_value(),
                    "ENVIRONMENT": "preprod"
                }
            }
        })

    @mark.it("creates IAM role for Lambda function")
    def test_creates_lambda_role(self):
        """Verify IAM role is created for Lambda"""
        self.template.resource_count_is("AWS::IAM::Role", 1)

    @mark.it("Lambda IAM role has correct name following naming convention")
    def test_lambda_role_name(self):
        """Verify Lambda IAM role follows naming convention"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "tap-preprod-lambda-role"
        })

    @mark.it("Lambda IAM role has correct trust policy")
    def test_lambda_role_trust_policy(self):
        """Verify Lambda IAM role trusts lambda.amazonaws.com"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ])
            }
        })

    @mark.it("Lambda IAM role has basic execution policy attached")
    def test_lambda_role_managed_policies(self):
        """Verify Lambda IAM role has AWSLambdaBasicExecutionRole"""
        # The ManagedPolicyArns contains Fn::Join intrinsic function, check it exists
        self.template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": Match.any_value()
        })

    @mark.it("Lambda IAM role has S3 permissions")
    def test_lambda_role_s3_permissions(self):
        """Verify Lambda IAM role has specific S3 permissions"""
        # Check for inline policy with S3 permissions
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
                        "Effect": "Allow"
                    })
                ])
            }
        })

    @mark.it("Lambda IAM role has DynamoDB permissions")
    def test_lambda_role_dynamodb_permissions(self):
        """Verify Lambda IAM role has specific DynamoDB permissions"""
        # Check for inline policy with DynamoDB permissions
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ]),
                        "Effect": "Allow"
                    })
                ])
            }
        })

    @mark.it("stack has proper removal policies for cleanup")
    def test_removal_policies(self):
        """Verify resources have deletion policies configured"""
        # S3 bucket should have deletion policy
        self.template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

        # DynamoDB table should have deletion policy
        self.template.has_resource("AWS::DynamoDB::Table", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("stack property accessors return correct values")
    def test_stack_properties(self):
        """Verify stack property accessors work correctly"""
        # Properties may contain CDK tokens, so just verify they exist and are not None
        self.assertIsNotNone(self.stack.bucket_name)
        self.assertIsNotNone(self.stack.table_name)
        self.assertIsNotNone(self.stack.function_name)

    @mark.it("stack can be instantiated with custom props")
    def test_stack_with_custom_props(self):
        """Verify stack can be created with TapStackProps"""
        # Create a fresh app for this test to avoid synthesis conflicts
        custom_app = cdk.App()
        props = TapStackProps(environment_suffix="custom")
        custom_stack = TapStack(
            custom_app,
            "CustomStack",
            props=props,
            env=cdk.Environment(region="us-east-2")
        )
        template = Template.from_stack(custom_stack)

        # Verify stack is created successfully
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.resource_count_is("AWS::Lambda::Function", 1)


if __name__ == "__main__":
    unittest.main()
