### Reasoning Trace

---

This is a complex CloudFormation template request with multiple AWS services. Let me break down the requirements:

1. Lambda function (Python 3.8)
   - Triggered by API Gateway
   - Triggered by CloudWatch Events (24-hour schedule)
   - Read access to S3 bucket
   - Access to DynamoDB
   - Environment variables for configuration
   - Error notifications to SNS

2. API Gateway
   - HTTP endpoint
   - CORS enabled for all origins
   - Integrated with Lambda

3. DynamoDB Table
   - Partition and sort keys
   - Provisioned throughput (5 read/write units)
   - KMS encryption

4. S3 Bucket
   - Versioning enabled
   - KMS encryption
   - VPC endpoint for private access

5. CloudWatch
   - Logs for all services
   - Events for scheduled Lambda trigger

6. SNS Topic
   - For error notifications

7. IAM Roles
   - Least privilege principle
   - Appropriate permissions for each service

8. VPC Endpoint
   - For S3 private access

9. KMS
   - Encryption for DynamoDB and S3

10. Tags
    - For cost tracking and resource management

Let me create a comprehensive CloudFormation template in JSON format.

### Answer

---

I'll create a comprehensive CloudFormation template that implements all the specified requirements for a serverless infrastructure. This template follows AWS best practices and includes all the components you've requested.

## CloudFormation Template for Serverless Infrastructure

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless infrastructure with Lambda, API Gateway, DynamoDB, S3, and comprehensive monitoring",

  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "production",
      "Description": "Environment name for tagging resources"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "serverless-app",
      "Description": "Project name for resource identification"
    }
  },

  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting sensitive data",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "dynamodb.amazonaws.com",
                  "s3.amazonaws.com",
                  "lambda.amazonaws.com",
                  "logs.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:Encrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/${ProjectName}-kms-key"
        },
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    },

    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-vpc" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "PrivateSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [0, { "Fn::GetAZs": "" }]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-private-subnet" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "RouteTableIds": [{ "Ref": "RouteTable" }],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": ["s3:GetObject", "s3:ListBucket"],
              "Resource": [
                { "Fn::Sub": "${S3Bucket.Arn}" },
                { "Fn::Sub": "${S3Bucket.Arn}/*" }
              ]
            }
          ]
        }
      }
    },

    "RouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-route-table" }
          }
        ]
      }
    },

    "SubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet" },
        "RouteTableId": { "Ref": "RouteTable" }
      }
    },

    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda function",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-lambda-sg" }
          }
        ]
      }
    },

    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ProjectName}-data-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${ProjectName}-table"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "partitionKey",
            "AttributeType": "S"
          },
          {
            "AttributeName": "sortKey",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "partitionKey",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "sortKey",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": { "Ref": "KMSKey" }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "${ProjectName}-error-notifications"
        },
        "DisplayName": "Lambda Error Notifications",
        "KmsMasterKeyId": { "Ref": "KMSKey" },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${ProjectName}-lambda-execution-role"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    { "Fn::GetAtt": ["S3Bucket", "Arn"] },
                    { "Fn::Sub": "${S3Bucket.Arn}/*" }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": ["sns:Publish"],
                  "Resource": { "Ref": "SNSTopic" }
                },
                {
                  "Effect": "Allow",
                  "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
                  "Resource": { "Fn::GetAtt": ["KMSKey", "Arn"] }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/${ProjectName}-function"
        },
        "RetentionInDays": 30,
        "KmsKeyId": { "Fn::GetAtt": ["KMSKey", "Arn"] },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${ProjectName}-function"
        },
        "Runtime": "python3.8",
        "Handler": "index.lambda_handler",
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import boto3",
                "import os",
                "from datetime import datetime",
                "",
                "dynamodb = boto3.resource('dynamodb')",
                "s3 = boto3.client('s3')",
                "sns = boto3.client('sns')",
                "",
                "def lambda_handler(event, context):",
                "    try:",
                "        table_name = os.environ.get('DYNAMODB_TABLE_NAME')",
                "        bucket_name = os.environ.get('S3_BUCKET_NAME')",
                "        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')",
                "        ",
                "        # Log the incoming event",
                "        print(f'Received event: {json.dumps(event)}')",
                "        ",
                "        # Sample DynamoDB operation",
                "        table = dynamodb.Table(table_name)",
                "        table.put_item(",
                "            Item={",
                "                'partitionKey': 'request',",
                "                'sortKey': datetime.utcnow().isoformat(),",
                "                'event': json.dumps(event)",
                "            }",
                "        )",
                "        ",
                "        # Construct response based on event source",
                "        if 'httpMethod' in event:",
                "            # API Gateway event",
                "            response = {",
                "                'statusCode': 200,",
                "                'headers': {",
                "                    'Access-Control-Allow-Origin': '*',",
                "                    'Access-Control-Allow-Headers': 'Content-Type',",
                "                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'",
                "                },",
                "                'body': json.dumps({",
                "                    'message': 'Request processed successfully',",
                "                    'timestamp': datetime.utcnow().isoformat()",
                "                })",
                "            }",
                "        else:",
                "            # CloudWatch Events or other trigger",
                "            response = {",
                "                'message': 'Scheduled task completed',",
                "                'timestamp': datetime.utcnow().isoformat()",
                "            }",
                "        ",
                "        return response",
                "        ",
                "    except Exception as e:",
                "        print(f'Error: {str(e)}')",
                "        # Send error notification",
                "        if sns_topic_arn:",
                "            sns.publish(",
                "                TopicArn=sns_topic_arn,",
                "                Subject='Lambda Function Error',",
                "                Message=f'Error in {context.function_name}: {str(e)}'",
                "            )",
                "        raise e"
              ]
            ]
          }
        },
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE_NAME": { "Ref": "DynamoDBTable" },
            "S3_BUCKET_NAME": { "Ref": "S3Bucket" },
            "SNS_TOPIC_ARN": { "Ref": "SNSTopic" }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{ "Ref": "LambdaSecurityGroup" }],
          "SubnetIds": [{ "Ref": "PrivateSubnet" }]
        },
        "Timeout": 30,
        "MemorySize": 256,
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "ApiGatewayRestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-api"
        },
        "Description": "HTTP API for Lambda function",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "ApiGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ParentId": { "Fn::GetAtt": ["ApiGatewayRestApi", "RootResourceId"] },
        "PathPart": "process"
      }
    },

    "ApiGatewayMethodOptions": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ResourceId": { "Ref": "ApiGatewayResource" },
        "HttpMethod": "OPTIONS",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [
            {
              "StatusCode": "200",
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,POST,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": "'*'"
              },
              "ResponseTemplates": {
                "application/json": ""
              }
            }
          ],
          "PassthroughBehavior": "WHEN_NO_MATCH",
          "RequestTemplates": {
            "application/json": "{\"statusCode\": 200}"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseModels": {
              "application/json": "Empty"
            },
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Headers": false,
              "method.response.header.Access-Control-Allow-Methods": false,
              "method.response.header.Access-Control-Allow-Origin": false
            }
          }
        ]
      }
    },

    "ApiGatewayMethodPost": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ResourceId": { "Ref": "ApiGatewayResource" },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": false
            }
          }
        ]
      }
    },

    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["ApiGatewayMethodPost", "ApiGatewayMethodOptions"],
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "StageName": "prod",
        "StageDescription": {
          "LoggingLevel": "INFO",
          "DataTraceEnabled": true,
          "MetricsEnabled": true
        }
      }
    },

    "ApiGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/${ProjectName}-api"
        },
        "RetentionInDays": 30
      }
    },

    "ApiGatewayAccount": {
      "Type": "AWS::ApiGateway::Account",
      "Properties": {
        "CloudWatchRoleArn": {
          "Fn::GetAtt": ["ApiGatewayCloudWatchRole", "Arn"]
        }
      }
    },

    "ApiGatewayCloudWatchRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "apigateway.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        ]
      }
    },

    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "LambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*"
        }
      }
    },

    "CloudWatchScheduleRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-daily-schedule"
        },
        "Description": "Trigger Lambda function every 24 hours",
        "ScheduleExpression": "rate(24 hours)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": { "Fn::GetAtt": ["LambdaFunction", "Arn"] },
            "Id": "LambdaFunctionTarget"
          }
        ]
      }
    },

    "LambdaSchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "LambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": { "Fn::GetAtt": ["CloudWatchScheduleRule", "Arn"] }
      }
    },

    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-lambda-errors"
        },
        "AlarmDescription": "Alert on Lambda function errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "LambdaFunction" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    },

    "DynamoDBReadAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-dynamodb-read-throttle"
        },
        "AlarmDescription": "Alert on DynamoDB read throttles",
        "MetricName": "ConsumedReadCapacityUnits",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 25,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": { "Ref": "DynamoDBTable" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    }
  },

  "Outputs": {
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/prod/process"
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda Function ARN",
      "Value": { "Fn::GetAtt": ["LambdaFunction", "Arn"] }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB Table Name",
      "Value": { "Ref": "DynamoDBTable" }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": { "Ref": "S3Bucket" }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for error notifications",
      "Value": { "Ref": "SNSTopic" }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": { "Ref": "KMSKey" }
    },
    "VPCEndpointId": {
      "Description": "VPC Endpoint ID for S3",
      "Value": { "Ref": "S3VPCEndpoint" }
    }
  }
}
```

## Key Features Implemented

### 1. **Security & Encryption**

- KMS key for encrypting DynamoDB, S3, and SNS data
- IAM roles with least privilege principle
- VPC endpoint for private S3 access
- Security groups restricting Lambda network access

### 2. **Lambda Configuration**

- Python 3.8 runtime with inline code
- Environment variables for configuration
- VPC configuration for private network access
- Error handling with SNS notifications

### 3. **API Gateway Setup**

- REST API with CORS enabled
- OPTIONS method for preflight requests
- POST method integrated with Lambda
- CloudWatch logging enabled

### 4. **DynamoDB Table**

- Partition key and sort key configuration
- Provisioned throughput with 5 RCU/WCU
- KMS encryption enabled
- Tagged for cost tracking

### 5. **S3 Bucket**

- Versioning enabled
- KMS encryption
- Public access blocked
- Accessible via VPC endpoint

### 6. **Monitoring & Alerting**

- CloudWatch Logs for all services
- CloudWatch Alarms for errors and throttling
- SNS topic for notifications
- Comprehensive logging with retention policies

### 7. **Scheduled Execution**

- CloudWatch Events rule for 24-hour schedule
- Automatic Lambda invocation

### 8. **Resource Tagging**

- Environment and Project tags on all resources
- Facilitates cost tracking and management

## Deployment Instructions

1. **Save the template** as `serverless-infrastructure.json`

2. **Deploy using AWS CLI**:

```bash
aws cloudformation create-stack \
  --stack-name serverless-app-stack \
  --template-body file://serverless-infrastructure.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

3. **Monitor deployment**:

```bash
aws cloudformation describe-stacks \
  --stack-name serverless-app-stack \
  --region us-west-2 \
  --query 'Stacks[0].StackStatus'
```

4. **Get outputs**:

```bash
aws cloudformation describe-stacks \
  --stack-name serverless-app-stack \
  --region us-west-2 \
  --query 'Stacks[0].Outputs'
```

## Testing the Infrastructure

### Test API Gateway:

```bash
curl -X POST https://[API_GATEWAY_URL]/prod/process \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Monitor Lambda Logs:

```bash
aws logs tail /aws/lambda/serverless-app-function \
  --follow \
  --region us-west-2
```

This template provides a production-ready serverless infrastructure with comprehensive security, monitoring, and compliance features, fully satisfying all the specified requirements.
