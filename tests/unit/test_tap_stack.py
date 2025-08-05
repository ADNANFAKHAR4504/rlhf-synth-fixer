import pytest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from tap_stack import TapStack, TapStackProps # Assuming your stack is in tap_stack.py

# Define a pytest fixture to synthesize the stack once for all tests
@pytest.fixture(scope="module")
def template():
    """
    Synthesizes the TapStack into a CloudFormation template
    and returns it for assertions with 'test' environment suffix.
    """
    app = cdk.App()
    stack = TapStack(app, "TestTapStack", props=TapStackProps(environment_suffix="test"))
    return Template.from_stack(stack)

# New pytest fixture for 'pr510' environment suffix
@pytest.fixture(scope="module")
def template_pr510():
    """
    Synthesizes the TapStack into a CloudFormation template
    and returns it for assertions with 'pr510' environment suffix.
    """
    app = cdk.App()
    stack = TapStack(app, "Pr510TapStack", props=TapStackProps(environment_suffix="pr510"))
    return Template.from_stack(stack)


def test_s3_bucket_created(template: Template):
    """
    Verifies that an S3 bucket resource is created in the template.
    """
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "BucketName": "tap-test-bucket"
        }
    )
    print("Test: S3 Bucket Created - PASSED")

def test_s3_bucket_properties(template: Template):
    """
    Verifies the properties of the created S3 bucket.
    Note: PublicAccessBlockConfiguration is NOT set when public_read_access=False.
    """
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "BucketName": "tap-test-bucket",
            "VersioningConfiguration": Match.absent(), # versioned=False
            # PublicAccessBlockConfiguration is not set when public_read_access=False
            "PublicAccessBlockConfiguration": Match.absent() # Corrected: Expect it to be absent
        }
    )
    # Check removal policy and auto_delete_objects (these are stack-level properties
    # but their effect is on the bucket's Cfn resource).
    # CDK's auto_delete_objects translates to a custom resource for deletion.
    # The removal policy for the bucket itself will be DESTROY.
    template.has_resource(
        "AWS::S3::Bucket",
        {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        }
    )
    print("Test: S3 Bucket Properties - PASSED")

def test_dynamodb_table_created(template: Template):
    """
    Verifies that a DynamoDB table resource is created in the template.
    """
    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        {
            "TableName": "tap-test-table",
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
            ],
            "BillingMode": "PAY_PER_REQUEST"
        }
    )
    print("Test: DynamoDB Table Created - PASSED")

def test_dynamodb_table_properties(template: Template):
    """
    Verifies the properties of the created DynamoDB table.
    """
    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        {
            "TableName": "tap-test-table",
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
            ],
            "BillingMode": "PAY_PER_REQUEST"
        }
    )
    template.has_resource(
        "AWS::DynamoDB::Table",
        {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        }
    )
    print("Test: DynamoDB Table Properties - PASSED")

def test_lambda_function_created(template: Template):
    """
    Verifies that a Lambda function resource is created in the template.
    """
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {
            "FunctionName": "tap-test-lambda",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Environment": {
                "Variables": {
                    # Use Match.string_like for dynamic logical IDs
                    "TABLE_NAME": { "Fn::GetAtt": [Match.string_like("AppTable*"), "TableName"] },
                    "BUCKET_NAME": { "Ref": Match.string_like("AppBucket*") }
                }
            }
        }
    )
    print("Test: Lambda Function Created - PASSED")

def test_lambda_dynamodb_permissions(template: Template):
    """
    Verifies that the Lambda function has read/write permissions to the DynamoDB table.
    """
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": [
                            "dynamodb:BatchGetItem",
                            "dynamodb:GetRecords",
                            "dynamodb:GetShardIterator",
                            "dynamodb:Query",
                            "dynamodb:GetItem",
                            "dynamodb:Scan",
                            "dynamodb:ConditionCheckItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem"
                        ],
                        "Effect": "Allow",
                        # Use Match.string_like for dynamic logical ID in resource ARN
                        "Resource": { "Fn::GetAtt": [Match.string_like("AppTable*"), "Arn"] }
                    })
                ]),
                "Version": "2012-10-17"
            },
            "PolicyName": Match.string_like("AppLambdaServiceRoleDefaultPolicy*"),
            # Use Match.string_like for dynamic logical ID in role ARN
            "Roles": [
                { "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"] }
            ]
        }
    )
    print("Test: Lambda DynamoDB Permissions - PASSED")

def test_lambda_s3_permissions(template: Template):
    """
    Verifies that the Lambda function has read/write permissions to the S3 bucket.
    """
    template.has_resource_properties(
        "AWS::IAM::Policy",
        {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "s3:GetObject*",
                            "s3:GetBucket*",
                            "s3:List*",
                            "s3:DeleteObject*",
                            "s3:PutObject*",
                            "s3:AbortMultipartUpload"
                        ]),
                        "Effect": "Allow",
                        # Use Match.string_like for dynamic logical IDs in resource ARNs
                        "Resource": Match.array_with([
                            { "Fn::GetAtt": [Match.string_like("AppBucket*"), "Arn"] },
                            { "Fn::Join": ["", [{ "Fn::GetAtt": [Match.string_like("AppBucket*"), "Arn"] }, "/*"]] }
                        ])
                    })
                ]),
                "Version": "2012-10-17"
            },
            "PolicyName": Match.string_like("AppLambdaServiceRoleDefaultPolicy*"),
            # Use Match.string_like for dynamic logical ID in role ARN
            "Roles": [
                { "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"] }
            ]
        }
    )
    print("Test: Lambda S3 Permissions - PASSED")

def test_s3_event_source_configured(template: Template):
    """
    Verifies that the S3 event source is correctly configured for the Lambda function.
    This involves checking the Lambda permission and the S3 bucket notification configuration.
    """
    # Check Lambda Permission for S3 to invoke it
    template.has_resource_properties(
        "AWS::Lambda::Permission",
        {
            "Action": "lambda:InvokeFunction",
            # Use Match.string_like for dynamic logical ID
            "FunctionName": { "Fn::GetAtt": [Match.string_like("AppLambda*"), "Arn"] },
            "Principal": "s3.amazonaws.com",
            # Use Match.string_like for dynamic logical ID
            "SourceArn": { "Fn::GetAtt": [Match.string_like("AppBucket*"), "Arn"] }
        }
    )

    # Check S3 Bucket Notification Configuration
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "NotificationConfiguration": {
                "LambdaConfigurations": [
                    {
                        "Event": "s3:ObjectCreated:*",
                        # Use Match.string_like for dynamic logical ID
                        "Function": { "Fn::GetAtt": [Match.string_like("AppLambda*"), "Arn"] }
                    }
                ]
            }
        }
    )
    print("Test: S3 Event Source Configured - PASSED")

def test_cloudformation_outputs(template: Template):
    """
    Verifies that the CloudFormation outputs are correctly defined for 'test' environment.
    """
    template.has_output(
        "S3BucketName",
        {
            "Value": { "Ref": Match.string_like("AppBucket*") },
            "Export": { "Name": "tap-test-bucket-name" }
        }
    )
    template.has_output(
        "DynamoDBTableName",
        {
            "Value": { "Fn::GetAtt": [Match.string_like("AppTable*"), "TableName"] },
            "Export": { "Name": "tap-test-table-name" }
        }
    )
    template.has_output(
        "LambdaFunctionName",
        {
            "Value": { "Ref": Match.string_like("AppLambda*") },
            "Export": { "Name": "tap-test-lambda-name" }
        }
    )
    template.has_output(
        "LambdaRoleArn",
        {
            "Value": { "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"] },
            "Export": { "Name": "tap-test-lambda-role-arn" }
        }
    )
    print("Test: CloudFormation Outputs - PASSED")

def test_cloudformation_outputs_pr510(template_pr510: Template):
    """
    Verifies that the CloudFormation outputs are correctly defined for 'pr510' environment.
    """
    template_pr510.has_output(
        "S3BucketName",
        {
            "Value": { "Ref": Match.string_like("AppBucket*") },
            "Export": { "Name": "tap-pr510-bucket-name" }
        }
    )
    template_pr510.has_output(
        "DynamoDBTableName",
        {
            "Value": { "Fn::GetAtt": [Match.string_like("AppTable*"), "TableName"] },
            "Export": { "Name": "tap-pr510-table-name" }
        }
    )
    template_pr510.has_output(
        "LambdaFunctionName",
        {
            "Value": { "Ref": Match.string_like("AppLambda*") },
            "Export": { "Name": "tap-pr510-lambda-name" }
        }
    )
    template_pr510.has_output(
        "LambdaRoleArn",
        {
            "Value": { "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"] },
            "Export": { "Name": "tap-pr510-lambda-role-arn" }
        }
    )
    print("Test: CloudFormation Outputs for pr510 - PASSED")

