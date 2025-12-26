# Serverless Infrastructure Solution

## Overview

This CloudFormation template creates a comprehensive serverless infrastructure for logging API requests to both S3 and CloudWatch. The solution includes an API Gateway with GET and POST endpoints, a Lambda function for request processing and logging, and proper IAM roles with least privilege access. All resources are tagged for cost allocation and include security best practices like S3 public access blocking.

## Architecture

The serverless architecture consists of:

1. **API Gateway** - Regional REST API with `/v1/resource` endpoint supporting GET and POST methods
2. **Lambda Function** - Python-based function that processes requests and writes structured logs to S3
3. **S3 Bucket** - Secure storage for application logs with versioning, lifecycle policies, and public access blocking
4. **CloudWatch Logs** - Centralized logging for both Lambda execution and API Gateway access logs
5. **IAM Roles** - Least privilege roles for Lambda execution and API Gateway CloudWatch integration

The flow is: API Gateway → Lambda Function → S3 Logging + CloudWatch Logging

## CloudFormation Template

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
          "Parameters": ["EnvironmentSuffix", "ProjectName"]
        }
      ]
    },
    "DeploymentInstructions": {
      "Validation": "aws cloudformation validate-template --template-body file://TapStack.json",
      "Deployment": "aws cloudformation deploy --template-file TapStack.json --stack-name serverless-app-stack --parameter-overrides Environment=dev ProjectName=serverless-demo --capabilities CAPABILITY_IAM --region us-east-1",
      "Verification": {
        "TestAPI": "curl -X GET https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/v1/resource",
        "CheckCloudWatchLogs": "aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/serverless-' --region us-east-1",
        "CheckS3Logs": "aws s3 ls s3://project-logs-<environment>/ --region us-east-1"
      },
      "Cleanup": "aws cloudformation delete-stack --stack-name serverless-app-stack --region us-east-1"
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
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
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "project-logs-${EnvironmentSuffix}"
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
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "serverless-lambda-role-${EnvironmentSuffix}"
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/serverless-lambda-${EnvironmentSuffix}:*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["s3:PutObject"],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::${LogsBucket}/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "serverless-lambda-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            },
            "LOGS_BUCKET": {
              "Ref": "LogsBucket"
            }
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/serverless-lambda-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7,
        "Tags": [
          {
            "Key": "environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "ApiGatewayCloudWatchRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "serverless-apigateway-role-${EnvironmentSuffix}"
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
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
          "Fn::Sub": "serverless-api-${EnvironmentSuffix}"
        },
        "Description": "Serverless API Gateway",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "ApiGatewayV1Resource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Fn::GetAtt": ["ApiGateway", "RootResourceId"]
        },
        "PathPart": "v1"
      }
    },
    "ApiGatewayResourceResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Ref": "ApiGatewayV1Resource"
        },
        "PathPart": "resource"
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
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
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResourceResource"
        },
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
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResourceResource"
        },
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
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "Description": "Production deployment"
      }
    },
    "ApiGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": "prod",
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "DeploymentId": {
          "Ref": "ApiGatewayDeployment"
        },
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
          "DestinationArn": {
            "Fn::GetAtt": ["ApiGatewayLogGroup", "Arn"]
          },
          "Format": "$context.requestId $context.error.message $context.error.messageString $context.extendedRequestId $context.identity.sourceIp $context.requestTime $context.routeKey $context.status"
        },
        "Tags": [
          {
            "Key": "environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "ApiGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/serverless-api-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7,
        "Tags": [
          {
            "Key": "environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "project",
            "Value": {
              "Ref": "ProjectName"
            }
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
      "Value": {
        "Ref": "LogsBucket"
      }
    }
  }
}
```

## Key Features Explained

### 1. **Enhanced Security with Public Access Blocking**

The S3 bucket now includes `PublicAccessBlockConfiguration` to prevent any public access to sensitive log data:

```json
"PublicAccessBlockConfiguration": {
  "BlockPublicAcls": true,
  "BlockPublicPolicy": true,
  "IgnorePublicAcls": true,
  "RestrictPublicBuckets": true
}
```

### 2. **Improved Parameter Naming Convention**

Changed from `Environment` to `EnvironmentSuffix` to follow organizational naming conventions and removed restrictive `AllowedValues`:

```json
"EnvironmentSuffix": {
  "Type": "String",
  "Default": "dev",
  "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
  "AllowedPattern": "^[a-zA-Z0-9]+$",
  "ConstraintDescription": "Must contain only alphanumeric characters"
}
```

### 3. **Clean Resource Destruction**

Added `DeletionPolicy: Delete` and `UpdateReplacePolicy: Delete` to the S3 bucket for guaranteed cleanup:

```json
"LogsBucket": {
  "Type": "AWS::S3::Bucket",
  "DeletionPolicy": "Delete",
  "UpdateReplacePolicy": "Delete",
  // ... rest of configuration
}
```

### 4. **IAM Roles with Least Privilege**

- **Lambda Role**: Only has permissions to write to specific CloudWatch log groups and put objects in the designated S3 bucket
- **API Gateway Role**: Only has CloudWatch logging permissions via managed policy

### 5. **Lambda Function**

The Lambda function:

- Logs incoming requests to both CloudWatch and S3 with structured JSON
- Writes execution logs with date-based partitioning to S3: `logs/YYYY/MM/DD/request-id.json`
- Returns appropriate HTTP responses while gracefully handling S3 write errors

### 6. **API Gateway Configuration**

- Exposes `/v1/resource` endpoint with GET and POST methods
- Configured with CloudWatch access logging and detailed request tracing
- Uses AWS_PROXY integration for seamless Lambda integration

### 7. **Comprehensive Logging Architecture**

- **CloudWatch Logs**: Both Lambda and API Gateway write to separate log groups with 7-day retention
- **S3 Logging**: Lambda writes detailed execution logs with timestamp and request details
- **API Gateway Access Logs**: Captures request/response metadata for auditing

### 8. **Resource Tagging Strategy**

All resources are tagged with:

- `environment`: Environment suffix (dev, staging, prod, etc.)
- `project`: Project name for cost allocation and resource management

## Deployment Instructions

1. **Validate the template**:

```bash
aws cloudformation validate-template --template-body file://TapStack.json
```

2. **Deploy the stack**:

```bash
aws cloudformation deploy \
  --template-file TapStack.json \
  --stack-name serverless-app-stack \
  --parameter-overrides EnvironmentSuffix=dev ProjectName=serverless-demo \
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
# Empty the S3 bucket first (important for successful stack deletion)
aws s3 rm s3://project-logs-dev --recursive

# Delete the stack
aws cloudformation delete-stack --stack-name serverless-app-stack --region us-east-1
```

This template provides a complete serverless infrastructure with enhanced security, comprehensive logging, and proper resource management while adhering to all specified requirements and AWS Well-Architected Framework principles.
