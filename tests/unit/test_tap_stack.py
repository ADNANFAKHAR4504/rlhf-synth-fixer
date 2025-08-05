import pytest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture(scope="module")
def template():
  """Synthesizes the TapStack into a CloudFormation template and returns it for assertions."""
  app = cdk.App()
  stack = TapStack(app, "TestTapStack", props=TapStackProps(environment_suffix="test"))
  return Template.from_stack(stack)


def test_s3_bucket_created(template: Template):
  """Verifies that an S3 bucket resource is created in the template."""
  template.has_resource_properties(
    "AWS::S3::Bucket",
    {
      "BucketName": "tap-test-bucket"
    }
  )


def test_s3_bucket_properties(template: Template):
  """Verifies the properties of the created S3 bucket."""
  template.has_resource_properties(
    "AWS::S3::Bucket",
    {
      "BucketName": "tap-test-bucket",
      "VersioningConfiguration": Match.absent(),
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True
      }
    }
  )
  template.has_resource(
    "AWS::S3::Bucket",
    {
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete"
    }
  )


def test_dynamodb_table_created(template: Template):
  """Verifies that a DynamoDB table resource is created in the template."""
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


def test_dynamodb_table_properties(template: Template):
  """Verifies the properties of the created DynamoDB table."""
  template.has_resource(
    "AWS::DynamoDB::Table",
    {
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete"
    }
  )


def test_lambda_function_created(template: Template):
  """Verifies that a Lambda function resource is created in the template."""
  template.has_resource_properties(
    "AWS::Lambda::Function",
    {
      "FunctionName": "tap-test-lambda",
      "Runtime": "python3.11",
      "Handler": "index.handler",
      "Environment": {
        "Variables": {
          "TABLE_NAME": {
            "Fn::GetAtt": ["AppTable0B8674E9", "TableName"]
          },
          "BUCKET_NAME": {
            "Ref": "AppBucketF68F369F"
          }
        }
      }
    }
  )


def test_lambda_dynamodb_permissions(template: Template):
  """Verifies Lambda has read/write permissions to DynamoDB table."""
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
              "Fn::GetAtt": ["AppTable0B8674E9", "Arn"]
            }
          })
        ]),
        "Version": "2012-10-17"
      },
      "PolicyName": Match.string_like("AppLambdaServiceRoleDefaultPolicy*"),
      "Roles": [
        {
          "Fn::GetAtt": ["AppLambdaServiceRoleC044B20B", "Arn"]
        }
      ]
    }
  )


def test_lambda_s3_permissions(template: Template):
  """Verifies Lambda has read/write permissions to S3 bucket."""
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
                "Fn::GetAtt": ["AppBucketF68F369F", "Arn"]
              },
              {
                "Fn::Join": ["", [
                  {
                    "Fn::GetAtt": ["AppBucketF68F369F", "Arn"]
                  },
                  "/*"
                ]]
              }
            ])
          })
        ]),
        "Version": "2012-10-17"
      },
      "PolicyName": Match.string_like("AppLambdaServiceRoleDefaultPolicy*"),
      "Roles": [
        {
          "Fn::GetAtt": ["AppLambdaServiceRoleC044B20B", "Arn"]
        }
      ]
    }
  )


def test_s3_event_source_configured(template: Template):
  """Verifies S3 bucket sends events to Lambda function."""
  template.has_resource_properties(
    "AWS::Lambda::Permission",
    {
      "Action": "lambda:InvokeFunction",
      "FunctionName": {
        "Fn::GetAtt": ["AppLambdaD97217B7", "Arn"]
      },
      "Principal": "s3.amazonaws.com",
      "SourceArn": {
        "Fn::GetAtt": ["AppBucketF68F369F", "Arn"]
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
              "Fn::GetAtt": ["AppLambdaD97217B7", "Arn"]
            }
          }
        ]
      }
    }
  )


def test_cloudformation_outputs(template: Template):
  """Verifies that CloudFormation outputs are defined correctly."""
  template.has_output(
    "S3BucketName",
    {
      "Value": {"Ref": "AppBucketF68F369F"},
      "Export": {"Name": "tap-test-bucket-name"}
    }
  )
  template.has_output(
    "DynamoDBTableName",
    {
      "Value": {
        "Fn::GetAtt": ["AppTable0B8674E9", "TableName"]
      },
      "Export": {"Name": "tap-test-table-name"}
    }
  )
  template.has_output(
    "LambdaFunctionName",
    {
      "Value": {"Ref": "AppLambdaD97217B7"},
      "Export": {"Name": "tap-test-lambda-name"}
    }
  )
  template.has_output(
    "LambdaRoleArn",
    {
      "Value": {
        "Fn::GetAtt": ["AppLambdaServiceRoleC044B20B", "Arn"]
      },
      "Export": {"Name": "tap-test-lambda-role-arn"}
    }
  )
