I'll create a comprehensive AWS CloudFormation template in JSON that provisions a secure, scalable, and fully serverless application in the **us-west-2** region.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure, scalable serverless application with Lambda, API Gateway, DynamoDB, and monitoring",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "test", "prod"],
      "Description": "Environment name for resource naming and configuration"
    },
    "ApplicationName": {
      "Type": "String",
      "Default": "serverless-app",
      "Description": "Name of the application for resource naming"
    },
    "LambdaCodeBucket": {
      "Type": "String",
      "Description": "S3 bucket containing Lambda function code"
    },
    "LambdaCodeKey": {
      "Type": "String",
      "Default": "lambda-functions.zip",
      "Description": "S3 key for Lambda function code zip file"
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for SNS notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    },
    "DatabaseEncryptionKey": {
      "Type": "String",
      "NoEcho": true,
      "Description": "KMS key ID for DynamoDB encryption (optional)",
      "Default": ""
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [
        { "Ref": "Environment" },
        "prod"
      ]
    },
    "HasCustomEncryptionKey": {
      "Fn::Not": [
        { "Fn::Equals": [{ "Ref": "DatabaseEncryptionKey" }, ""] }
      ]
    }
  },
  "Resources": {
    "LambdaCodeS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ApplicationName}-lambda-code-${Environment}-${AWS::AccountId}"
        },
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
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${ApplicationName}-${Environment}-data"
        },
        "BillingMode": "ON_DEMAND",
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          },
          {
            "AttributeName": "gsi1pk",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "GSI1",
            "KeySchema": [
              {
                "AttributeName": "gsi1pk",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "SSESpecification": {
          "SSEEnabled": true,
          "KMSMasterKeyId": {
            "Fn::If": [
              "HasCustomEncryptionKey",
              { "Ref": "DatabaseEncryptionKey" },
              { "Ref": "AWS::NoValue" }
            ]
          }
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": {
            "Fn::If": ["IsProduction", true, false]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "${ApplicationName}-${Environment}-notifications"
        },
        "DisplayName": {
          "Fn::Sub": "${ApplicationName} ${Environment} Notifications"
        },
        "KmsMasterKeyId": "alias/aws/sns",
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "SNSSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "TopicArn": { "Ref": "SNSTopic" },
        "Protocol": "email",
        "Endpoint": { "Ref": "NotificationEmail" }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${ApplicationName}-${Environment}-lambda-execution-role"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        ],
        "Policies": [
          {
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    { "Fn::GetAtt": ["DynamoDBTable", "Arn"] },
                    {
                      "Fn::Sub": "${DynamoDBTable.Arn}/index/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "SNSPublishAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": { "Ref": "SNSTopic" }
                }
              ]
            }
          },
          {
            "PolicyName": "SecretsManagerAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${ApplicationName}/${Environment}/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "GetItemsLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${ApplicationName}-${Environment}-get-items"
        },
        "Runtime": "python3.9",
        "Handler": "get_items.lambda_handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "S3Bucket": { "Ref": "LambdaCodeBucket" },
          "S3Key": { "Ref": "LambdaCodeKey" }
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": { "Ref": "DynamoDBTable" },
            "SNS_TOPIC_ARN": { "Ref": "SNSTopic" },
            "ENVIRONMENT": { "Ref": "Environment" },
            "AWS_REGION": { "Ref": "AWS::Region" }
          }
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "ReservedConcurrencyLimit": {
          "Fn::If": ["IsProduction", 100, 10]
        },
        "Timeout": 30,
        "MemorySize": 256,
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "CreateItemLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${ApplicationName}-${Environment}-create-item"
        },
        "Runtime": "python3.9",
        "Handler": "create_item.lambda_handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "S3Bucket": { "Ref": "LambdaCodeBucket" },
          "S3Key": { "Ref": "LambdaCodeKey" }
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": { "Ref": "DynamoDBTable" },
            "SNS_TOPIC_ARN": { "Ref": "SNSTopic" },
            "ENVIRONMENT": { "Ref": "Environment" },
            "AWS_REGION": { "Ref": "AWS::Region" }
          }
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "ReservedConcurrencyLimit": {
          "Fn::If": ["IsProduction", 100, 10]
        },
        "Timeout": 30,
        "MemorySize": 256,
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "UpdateItemLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${ApplicationName}-${Environment}-update-item"
        },
        "Runtime": "python3.9",
        "Handler": "update_item.lambda_handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "S3Bucket": { "Ref": "LambdaCodeBucket" },
          "S3Key": { "Ref": "LambdaCodeKey" }
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": { "Ref": "DynamoDBTable" },
            "SNS_TOPIC_ARN": { "Ref": "SNSTopic" },
            "ENVIRONMENT": { "Ref": "Environment" },
            "AWS_REGION": { "Ref": "AWS::Region" }
          }
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "ReservedConcurrencyLimit": {
          "Fn::If": ["IsProduction", 100, 10]
        },
        "Timeout": 30,
        "MemorySize": 256,
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "ApiGatewayRestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-${Environment}-api"
        },
        "Description": {
          "Fn::Sub": "REST API for ${ApplicationName} ${Environment}"
        },
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "TracingEnabled": true,
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    },
    "ApiGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ParentId": { "Fn::GetAtt": ["ApiGatewayRestApi", "RootResourceId"] },
        "PathPart": "items"
      }
    },
    "ApiGatewayResourceWithId": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ParentId": { "Ref": "ApiGatewayResource" },
        "PathPart": "{id}"
      }
    },
    "ApiGatewayMethodGet": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ResourceId": { "Ref": "ApiGatewayResource" },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetItemsLambdaFunction.Arn}/invocations"
          }
        }
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
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${CreateItemLambdaFunction.Arn}/invocations"
          }
        }
      }
    },
    "ApiGatewayMethodPut": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ResourceId": { "Ref": "ApiGatewayResourceWithId" },
        "HttpMethod": "PUT",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${UpdateItemLambdaFunction.Arn}/invocations"
          }
        }
      }
    },
    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": [
        "ApiGatewayMethodGet",
        "ApiGatewayMethodPost",
        "ApiGatewayMethodPut"
      ],
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "StageName": { "Ref": "Environment" },
        "StageDescription": {
          "TracingEnabled": true,
          "LoggingLevel": "INFO",
          "DataTraceEnabled": true,
          "MetricsEnabled": true,
          "Variables": {
            "environment": { "Ref": "Environment" }
          }
        }
      }
    },
    "LambdaInvokePermissionGet": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "GetItemsLambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*/*"
        }
      }
    },
    "LambdaInvokePermissionPost": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "CreateItemLambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*/*"
        }
      }
    },
    "LambdaInvokePermissionPut": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "UpdateItemLambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*/*"
        }
      }
    },
    "CloudWatchLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/${ApplicationName}-${Environment}-api"
        },
        "RetentionInDays": {
          "Fn::If": ["IsProduction", 30, 7]
        }
      }
    },
    "ApiGatewayAccount": {
      "Type": "AWS::ApiGateway::Account",
      "Properties": {
        "CloudWatchRoleArn": { "Fn::GetAtt": ["ApiGatewayCloudWatchRole", "Arn"] }
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
    "ApplicationSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}/${Environment}/config"
        },
        "Description": {
          "Fn::Sub": "Configuration secrets for ${ApplicationName} ${Environment}"
        },
        "SecretString": {
          "Fn::Sub": "{\"environment\":\"${Environment}\",\"region\":\"${AWS::Region}\",\"account\":\"${AWS::AccountId}\"}"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Application",
            "Value": { "Ref": "ApplicationName" }
          }
        ]
      }
    }
  },
  "Outputs": {
    "ApiGatewayEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiGatewayEndpoint"
        }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB table name",
      "Value": { "Ref": "DynamoDBTable" },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DynamoDBTableName"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS topic ARN for notifications",
      "Value": { "Ref": "SNSTopic" },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    },
    "GetItemsLambdaFunctionArn": {
      "Description": "Get Items Lambda function ARN",
      "Value": { "Fn::GetAtt": ["GetItemsLambdaFunction", "Arn"] },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-GetItemsLambdaArn"
        }
      }
    },
    "CreateItemLambdaFunctionArn": {
      "Description": "Create Item Lambda function ARN",
      "Value": { "Fn::GetAtt": ["CreateItemLambdaFunction", "Arn"] },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CreateItemLambdaArn"
        }
      }
    },
    "UpdateItemLambdaFunctionArn": {
      "Description": "Update Item Lambda function ARN",
      "Value": { "Fn::GetAtt": ["UpdateItemLambdaFunction", "Arn"] },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-UpdateItemLambdaArn"
        }
      }
    },
    "LambdaCodeS3BucketName": {
      "Description": "S3 bucket for Lambda code storage",
      "Value": { "Ref": "LambdaCodeS3Bucket" },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaCodeBucket"
        }
      }
    },
    "SecretsManagerSecretArn": {
      "Description": "Secrets Manager secret ARN",
      "Value": { "Ref": "ApplicationSecret" },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecretArn"
        }
      }
    }
  }
}
```

## Key Features of This Ideal CloudFormation Template

### **Architecture Components**
1. **Lambda Functions**: Three serverless functions for GET, POST, and PUT operations
2. **API Gateway**: RESTful API with proper resource structure and method configurations
3. **DynamoDB**: On-demand table with GSI and encryption at rest
4. **SNS**: Topic for notifications with email subscription
5. **S3**: Versioned bucket for Lambda code storage
6. **Secrets Manager**: Secure storage for environment-specific configurations

### **Security Best Practices**
- **Least Privilege IAM**: Roles with minimal required permissions
- **Encryption**: DynamoDB encryption at rest, S3 bucket encryption, SNS encryption
- **Private Access**: S3 bucket with public access blocked
- **Secure API**: API Gateway with proper resource isolation

### **Monitoring & Observability**
- **X-Ray Tracing**: Enabled on all Lambda functions and API Gateway
- **CloudWatch Logs**: Structured logging with environment-specific retention
- **API Gateway Logging**: Detailed request/response logging
- **CloudWatch Metrics**: Built-in metrics for all services

### **Multi-Environment Support**
- **Parameters**: Environment-specific configuration
- **Conditions**: Different settings for production vs non-production
- **Resource Naming**: Environment-aware naming conventions
- **Scaling**: Different concurrency limits per environment

### **Deployment Instructions**

1. **Prerequisites**:
   ```bash
   # Upload Lambda code to S3 bucket
   aws s3 cp lambda-functions.zip s3://your-lambda-code-bucket/
   ```

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name serverless-app-dev \
     --template-body file://template.json \
     --parameters ParameterKey=Environment,ParameterValue=dev \
                  ParameterKey=LambdaCodeBucket,ParameterValue=your-lambda-code-bucket \
                  ParameterKey=NotificationEmail,ParameterValue=admin@example.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2
   ```

This template provides a production-ready, secure, and scalable serverless architecture that follows AWS best practices and meets all the specified requirements.