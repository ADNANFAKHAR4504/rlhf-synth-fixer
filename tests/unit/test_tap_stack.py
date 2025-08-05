import pytest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from tap_stack import TapStack, TapStackProps

@pytest.fixture(scope="module")
def template():
  app = cdk.App()
  stack = TapStack(app, "TestTapStack", props=TapStackProps(environment_suffix="test"))
  return Template.from_stack(stack)

@pytest.fixture(scope="module")
def template_pr510():
  app = cdk.App()
  stack = TapStack(app, "Pr510TapStack", props=TapStackProps(environment_suffix="pr510"))
  return Template.from_stack(stack)

def test_s3_bucket_created(template: Template):
  template.has_resource_properties(
    "AWS::S3::Bucket",
    {
      "BucketName": "tap-test-bucket"
    }
  )
  print("Test: S3 Bucket Created - PASSED")

def test_s3_bucket_properties(template: Template):
  template.has_resource_properties(
    "AWS::S3::Bucket",
    {
      "BucketName": "tap-test-bucket",
      "VersioningConfiguration": Match.absent(),
      "PublicAccessBlockConfiguration": Match.absent()
    }
  )
  template.has_resource(
    "AWS::S3::Bucket",
    {
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete"
    }
  )
  print("Test: S3 Bucket Properties - PASSED")

def test_dynamodb_table_created(template: Template):
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
  template.has_resource_properties(
    "AWS::Lambda::Function",
    {
      "FunctionName": "tap-test-lambda",
      "Runtime": "python3.11",
      "Handler": "index.handler",
      "Environment": {
        "Variables": {
          "TABLE_NAME": {
            "Fn::GetAtt": [Match.string_like("AppTable*"), "TableName"]
          },
          "BUCKET_NAME": {
            "Ref": Match.string_like("AppBucket*")
          }
        }
      }
    }
  )
  print("Test: Lambda Function Created - PASSED")

def test_lambda_dynamodb_permissions(template: Template):
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
            "Resource": {
              "Fn::GetAtt": [Match.string_like("AppTable*"), "Arn"]
            }
          })
        ]),
        "Version": "2012-10-17"
      },
      "PolicyName": Match.string_like("AppLambdaServiceRoleDefaultPolicy*"),
      "Roles": [
        {
          "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"]
        }
      ]
    }
  )
  print("Test: Lambda DynamoDB Permissions - PASSED")

def test_lambda_s3_permissions(template: Template):
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
            "Resource": Match.array_with([
              {
                "Fn::GetAtt": [Match.string_like("AppBucket*"), "Arn"]
              },
              {
                "Fn::Join": ["", [{
                  "Fn::GetAtt": [Match.string_like("AppBucket*"), "Arn"]
                }, "/*"]]
              }
            ])
          })
        ]),
        "Version": "2012-10-17"
      },
      "PolicyName": Match.string_like("AppLambdaServiceRoleDefaultPolicy*"),
      "Roles": [
        {
          "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"]
        }
      ]
    }
  )
  print("Test: Lambda S3 Permissions - PASSED")

def test_s3_event_source_configured(template: Template):
  template.has_resource_properties(
    "AWS::Lambda::Permission",
    {
      "Action": "lambda:InvokeFunction",
      "FunctionName": {
        "Fn::GetAtt": [Match.string_like("AppLambda*"), "Arn"]
      },
      "Principal": "s3.amazonaws.com",
      "SourceArn": {
        "Fn::GetAtt": [Match.string_like("AppBucket*"), "Arn"]
      }
    }
  )
  template.has_resource_properties(
    "AWS::S3::Bucket",
    {
      "NotificationConfiguration": {
        "LambdaConfigurations": [
          {
            "Event": "s3:ObjectCreated:*",
            "Function": {
              "Fn::GetAtt": [Match.string_like("AppLambda*"), "Arn"]
            }
          }
        ]
      }
    }
  )
  print("Test: S3 Event Source Configured - PASSED")

def test_cloudformation_outputs(template: Template):
  template.has_output(
    "S3BucketName",
    {
      "Value": {"Ref": Match.string_like("AppBucket*")},
      "Export": {"Name": "tap-test-bucket-name"}
    }
  )
  template.has_output(
    "DynamoDBTableName",
    {
      "Value": {"Fn::GetAtt": [Match.string_like("AppTable*"), "TableName"]},
      "Export": {"Name": "tap-test-table-name"}
    }
  )
  template.has_output(
    "LambdaFunctionName",
    {
      "Value": {"Ref": Match.string_like("AppLambda*")},
      "Export": {"Name": "tap-test-lambda-name"}
    }
  )
  template.has_output(
    "LambdaRoleArn",
    {
      "Value": {
        "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"]
      },
      "Export": {"Name": "tap-test-lambda-role-arn"}
    }
  )
  print("Test: CloudFormation Outputs - PASSED")

def test_cloudformation_outputs_pr510(template_pr510: Template):
  template_pr510.has_output(
    "S3BucketName",
    {
      "Value": {"Ref": Match.string_like("AppBucket*")},
      "Export": {"Name": "tap-pr510-bucket-name"}
    }
  )
  template_pr510.has_output(
    "DynamoDBTableName",
    {
      "Value": {"Fn::GetAtt": [Match.string_like("AppTable*"), "TableName"]},
      "Export": {"Name": "tap-pr510-table-name"}
    }
  )
  template_pr510.has_output(
    "LambdaFunctionName",
    {
      "Value": {"Ref": Match.string_like("AppLambda*")},
      "Export": {"Name": "tap-pr510-lambda-name"}
    }
  )
  template_pr510.has_output(
    "LambdaRoleArn",
    {
      "Value": {
        "Fn::GetAtt": [Match.string_like("AppLambdaServiceRole*"), "Arn"]
      },
      "Export": {"Name": "tap-pr510-lambda-role-arn"}
    }
  )
  print("Test: CloudFormation Outputs for pr510 - PASSED")
