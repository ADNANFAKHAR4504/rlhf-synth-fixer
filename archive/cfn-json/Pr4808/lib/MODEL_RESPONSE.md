### Reasoning Trace

---

The user wants me to create a CloudFormation template in JSON format for a serverless application. Let me break down what's needed:

1. **API Gateway** with `/v1/resource` supporting GET and POST
2. **Lambda function** that:
   - Is integrated with the API Gateway
   - Writes logs to S3 bucket `project-logs-<environment>`
   - Has CloudWatch Logs enabled
3. **IAM Roles**:
   - Lambda role with minimal S3 and CloudWatch permissions
   - API Gateway role for CloudWatch access logging
4. **Logging**:
   - CloudWatch logs for both Lambda and API Gateway
   - Lambda writes to S3
5. **Tagging**: All resources need `environment` and `project` tags
6. **Metadata**: Include validation, deployment, verification, and cleanup instructions
7. **Outputs**: API endpoint URL, Lambda ARN, S3 bucket name

Key considerations:

- Use least privilege for IAM roles (no wildcards)
- The template should be valid JSON
- Region is us-east-1
- The S3 bucket name should be `project-logs-<environment>`
- Need to set up proper integrations between API Gateway and Lambda

Let me create this CloudFormation template step by step.

### Answer

---

I'll create a comprehensive CloudFormation template for your serverless infrastructure. Here's the complete solution:

## serverless_setup.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless application with API Gateway and Lambda for logging to S3 and CloudWatch",

  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["Environment", "ProjectName"]
        }
      ]
    },
    "DeploymentInstructions": {
      "Validation": "aws cloudformation validate-template --template-body file://serverless_setup.json",
      "Deployment": "aws cloudformation deploy --template-file serverless_setup.json --stack-name serverless-app-stack --parameter-overrides Environment=dev ProjectName=serverless-demo --capabilities CAPABILITY_IAM --region us-east-1",
      "Verification": {
        "TestAPI": "curl -X GET https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/v1/resource",
        "CheckCloudWatchLogs": "aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/serverless-' --region us-east-1",
        "CheckS3Logs": "aws s3 ls s3://project-logs-<environment>/ --region us-east-1"
      },
      "Cleanup": "aws cloudformation delete-stack --stack-name serverless-app-stack --region us-east-1"
    }
  },

  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Deployment environment"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "serverless-demo",
      "Description": "Project name for tagging"
    }
  },

  "Resources": {
    "LogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "project-logs-${Environment}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 30
            }
          ]
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "serverless-lambda-role-${Environment}"
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/serverless-lambda-${Environment}:*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["s3:PutObject"],
                  "Resource": {
                    "Fn::Sub": "${LogsBucket.Arn}/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "serverless-lambda-${Environment}"
        },
        "Runtime": "python3.9",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": { "Ref": "Environment" },
            "LOGS_BUCKET": { "Ref": "LogsBucket" }
          }
        },
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
                "s3 = boto3.client('s3')",
                "",
                "def handler(event, context):",
                "    print(f'Received event: {json.dumps(event)}')",
                "    ",
                "    # Log to S3",
                "    log_entry = {",
                "        'timestamp': datetime.utcnow().isoformat(),",
                "        'method': event.get('httpMethod'),",
                "        'path': event.get('path'),",
                "        'headers': event.get('headers'),",
                "        'body': event.get('body')",
                "    }",
                "    ",
                "    try:",
                "        bucket_name = os.environ['LOGS_BUCKET']",
                "        key = f\"logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json\"",
                "        ",
                "        s3.put_object(",
                "            Bucket=bucket_name,",
                "            Key=key,",
                "            Body=json.dumps(log_entry),",
                "            ContentType='application/json'",
                "        )",
                "        print(f'Log written to S3: {bucket_name}/{key}')",
                "    except Exception as e:",
                "        print(f'Error writing to S3: {str(e)}')",
                "    ",
                "    # Response",
                "    response_body = {",
                "        'message': 'Request processed successfully',",
                "        'method': event.get('httpMethod'),",
                "        'timestamp': datetime.utcnow().isoformat()",
                "    }",
                "    ",
                "    return {",
                "        'statusCode': 200,",
                "        'headers': {",
                "            'Content-Type': 'application/json'",
                "        },",
                "        'body': json.dumps(response_body)",
                "    }"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/serverless-lambda-${Environment}"
        },
        "RetentionInDays": 7,
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "ApiGatewayCloudWatchRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "serverless-apigateway-role-${Environment}"
        },
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
        ],
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
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

    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "serverless-api-${Environment}"
        },
        "Description": "Serverless API Gateway",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "ApiGatewayV1Resource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "ApiGateway" },
        "ParentId": { "Fn::GetAtt": ["ApiGateway", "RootResourceId"] },
        "PathPart": "v1"
      }
    },

    "ApiGatewayResourceResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "ApiGateway" },
        "ParentId": { "Ref": "ApiGatewayV1Resource" },
        "PathPart": "resource"
      }
    },

    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "LambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*/*"
        }
      }
    },

    "ApiGatewayMethodGet": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGateway" },
        "ResourceId": { "Ref": "ApiGatewayResourceResource" },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          }
        }
      }
    },

    "ApiGatewayMethodPost": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGateway" },
        "ResourceId": { "Ref": "ApiGatewayResourceResource" },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          }
        }
      }
    },

    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["ApiGatewayMethodGet", "ApiGatewayMethodPost"],
      "Properties": {
        "RestApiId": { "Ref": "ApiGateway" },
        "Description": "Production deployment"
      }
    },

    "ApiGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": "prod",
        "RestApiId": { "Ref": "ApiGateway" },
        "DeploymentId": { "Ref": "ApiGatewayDeployment" },
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "LoggingLevel": "INFO",
            "DataTraceEnabled": true,
            "MetricsEnabled": true
          }
        ],
        "AccessLogSetting": {
          "DestinationArn": { "Fn::GetAtt": ["ApiGatewayLogGroup", "Arn"] },
          "Format": "$context.requestId $context.error.message $context.error.messageString $context.extendedRequestId $context.identity.sourceIp $context.requestTime $context.routeKey $context.status"
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "ApiGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/serverless-api-${Environment}"
        },
        "RetentionInDays": 7,
        "Tags": [
          {
            "Key": "environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    }
  },

  "Outputs": {
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod/v1/resource"
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": {
        "Fn::GetAtt": ["LambdaFunction", "Arn"]
      }
    },
    "S3BucketName": {
      "Description": "S3 bucket name for logs",
      "Value": { "Ref": "LogsBucket" }
    }
  }
}
```

## Key Features Explained

### 1. **IAM Roles with Least Privilege**

- **Lambda Role**: Only has permissions to:
  - Write to specific CloudWatch log group
  - Put objects in the designated S3 bucket
- **API Gateway Role**: Only has CloudWatch logging permissions

### 2. **Lambda Function**

The Lambda function:

- Logs incoming requests to both CloudWatch and S3
- Writes structured JSON logs to S3 with date-based partitioning
- Returns appropriate HTTP responses

### 3. **API Gateway Configuration**

- Exposes `/v1/resource` endpoint with GET and POST methods
- Configured with CloudWatch access logging
- Uses AWS_PROXY integration for seamless Lambda integration

### 4. **Logging Architecture**

- **CloudWatch Logs**: Both Lambda and API Gateway write to separate log groups
- **S3 Logging**: Lambda writes execution logs with timestamp and request details

### 5. **Resource Tagging**

All resources are tagged with:

- `environment`: dev/staging/prod
- `project`: project name

## Deployment Instructions

1. **Validate the template**:

```bash
aws cloudformation validate-template --template-body file://serverless_setup.json
```

2. **Deploy the stack**:

```bash
aws cloudformation deploy \
  --template-file serverless_setup.json \
  --stack-name serverless-app-stack \
  --parameter-overrides Environment=dev ProjectName=serverless-demo \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. **Verify deployment**:

```bash
# Test GET request
curl -X GET https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/v1/resource

# Test POST request
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/v1/resource \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check CloudWatch logs
aws logs tail /aws/lambda/serverless-lambda-dev --follow

# Check S3 logs
aws s3 ls s3://project-logs-dev/logs/ --recursive
```

4. **Clean up**:

```bash
# Empty the S3 bucket first
aws s3 rm s3://project-logs-dev --recursive

# Delete the stack
aws cloudformation delete-stack --stack-name serverless-app-stack --region us-east-1
```

This template provides a complete serverless infrastructure with proper security, logging, and monitoring capabilities while adhering to all specified requirements.
