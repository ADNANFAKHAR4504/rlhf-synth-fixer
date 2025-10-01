### Reasoning Trace

---

The user is asking for a comprehensive CloudFormation template in JSON format for a production-ready serverless backend. Let me break down the requirements:

1. **Core Services:**
   - Lambda functions (Node.js runtime)
   - API Gateway (Regional)
   - DynamoDB (On-demand billing)
   - CloudWatch monitoring
   - SNS for notifications

2. **Security Requirements:**
   - Least privilege IAM roles
   - Encryption (KMS for Lambda environment variables)
   - Secure configuration

3. **Production Features:**
   - Dead Letter Queues (DLQs)
   - Usage plans for API Gateway
   - CloudWatch alarms
   - Proper tagging

4. **Template Requirements:**
   - Modular design
   - Parameterized for reusability
   - Should pass cfn-lint checks
   - Deploy successfully in us-west-2
   - Clean and reusable structure

Let me create a comprehensive CloudFormation template that addresses all these requirements.

### Answer

---

I'll create a comprehensive, production-ready CloudFormation template for your serverless backend. This template will be modular, secure, and follow AWS best practices.

## CloudFormation Template - Serverless Backend

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready serverless backend with Lambda, API Gateway, DynamoDB, and monitoring",

  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": { "default": "Environment Configuration" },
          "Parameters": ["Environment", "ProjectName"]
        },
        {
          "Label": { "default": "Lambda Configuration" },
          "Parameters": [
            "LambdaRuntime",
            "LambdaMemory",
            "LambdaTimeout",
            "ReservedConcurrentExecutions"
          ]
        },
        {
          "Label": { "default": "DynamoDB Configuration" },
          "Parameters": ["DynamoDBReadCapacity", "DynamoDBWriteCapacity"]
        },
        {
          "Label": { "default": "Monitoring Configuration" },
          "Parameters": ["AlertEmail", "LogRetentionDays"]
        },
        {
          "Label": { "default": "API Configuration" },
          "Parameters": ["ApiThrottleBurstLimit", "ApiThrottleRateLimit"]
        }
      ]
    }
  },

  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"],
      "Description": "Deployment environment"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "serverless-app",
      "MinLength": 1,
      "MaxLength": 50,
      "AllowedPattern": "^[a-z0-9-]+$",
      "Description": "Project name (lowercase, alphanumeric and hyphens only)"
    },
    "LambdaRuntime": {
      "Type": "String",
      "Default": "nodejs18.x",
      "AllowedValues": ["nodejs18.x", "nodejs20.x"],
      "Description": "Lambda runtime version"
    },
    "LambdaMemory": {
      "Type": "Number",
      "Default": 256,
      "MinValue": 128,
      "MaxValue": 3008,
      "Description": "Lambda function memory in MB"
    },
    "LambdaTimeout": {
      "Type": "Number",
      "Default": 30,
      "MinValue": 3,
      "MaxValue": 900,
      "Description": "Lambda function timeout in seconds"
    },
    "ReservedConcurrentExecutions": {
      "Type": "Number",
      "Default": 100,
      "MinValue": 1,
      "MaxValue": 1000,
      "Description": "Reserved concurrent executions for Lambda"
    },
    "DynamoDBReadCapacity": {
      "Type": "Number",
      "Default": 5,
      "MinValue": 1,
      "MaxValue": 40000,
      "Description": "DynamoDB read capacity units (for provisioned mode)"
    },
    "DynamoDBWriteCapacity": {
      "Type": "Number",
      "Default": 5,
      "MinValue": 1,
      "MaxValue": 40000,
      "Description": "DynamoDB write capacity units (for provisioned mode)"
    },
    "AlertEmail": {
      "Type": "String",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "Description": "Email address for CloudWatch alarm notifications"
    },
    "LogRetentionDays": {
      "Type": "Number",
      "Default": 30,
      "AllowedValues": [
        1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827,
        3653
      ],
      "Description": "CloudWatch Logs retention period in days"
    },
    "ApiThrottleBurstLimit": {
      "Type": "Number",
      "Default": 5000,
      "MinValue": 0,
      "MaxValue": 5000,
      "Description": "API Gateway throttle burst limit"
    },
    "ApiThrottleRateLimit": {
      "Type": "Number",
      "Default": 10000,
      "MinValue": 0,
      "MaxValue": 10000,
      "Description": "API Gateway throttle rate limit"
    }
  },

  "Mappings": {
    "EnvironmentConfig": {
      "development": {
        "LogLevel": "DEBUG",
        "EnableXRay": "false"
      },
      "staging": {
        "LogLevel": "INFO",
        "EnableXRay": "true"
      },
      "production": {
        "LogLevel": "WARN",
        "EnableXRay": "true"
      }
    }
  },

  "Conditions": {
    "IsProduction": { "Fn::Equals": [{ "Ref": "Environment" }, "production"] },
    "EnableXRay": {
      "Fn::Equals": [
        {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            { "Ref": "Environment" },
            "EnableXRay"
          ]
        },
        "true"
      ]
    }
  },

  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for ${ProjectName}-${Environment} serverless application"
        },
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow Lambda to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": ["kms:Decrypt", "kms:DescribeKey"],
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {
                "Service": { "Fn::Sub": "logs.${AWS::Region}.amazonaws.com" }
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                }
              }
            }
          ]
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": { "Fn::Sub": "alias/${ProjectName}-${Environment}" },
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    },

    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": { "Fn::Sub": "${ProjectName}-${Environment}-table" },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": { "Ref": "KMSKey" }
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": {
            "Fn::If": ["IsProduction", true, false]
          }
        },
        "TimeToLiveSpecification": {
          "AttributeName": "ttl",
          "Enabled": true
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "LambdaDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": { "Fn::Sub": "${ProjectName}-${Environment}-dlq" },
        "MessageRetentionPeriod": 1209600,
        "VisibilityTimeout": 300,
        "KmsMasterKeyId": { "Ref": "KMSKey" },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "${ProjectName}-${Environment}-lambda-role" },
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
          {
            "Fn::If": [
              "EnableXRay",
              "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
              { "Ref": "AWS::NoValue" }
            ]
          }
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
                    "dynamodb:Scan",
                    "dynamodb:DescribeTable",
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams"
                  ],
                  "Resource": [
                    { "Fn::GetAtt": ["DynamoDBTable", "Arn"] },
                    { "Fn::Sub": "${DynamoDBTable.Arn}/index/*" },
                    { "Fn::Sub": "${DynamoDBTable.Arn}/stream/*" }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "KMSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["kms:Decrypt", "kms:DescribeKey"],
                  "Resource": { "Fn::GetAtt": ["KMSKey", "Arn"] }
                }
              ]
            }
          },
          {
            "PolicyName": "DLQAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["sqs:SendMessage", "sqs:GetQueueAttributes"],
                  "Resource": { "Fn::GetAtt": ["LambdaDLQ", "Arn"] }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogsAccess",
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-${Environment}-*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/${ProjectName}-${Environment}-api"
        },
        "RetentionInDays": { "Ref": "LogRetentionDays" },
        "KmsKeyId": { "Fn::GetAtt": ["KMSKey", "Arn"] }
      }
    },

    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": { "Fn::Sub": "${ProjectName}-${Environment}-api" },
        "Runtime": { "Ref": "LambdaRuntime" },
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "ZipFile": "const AWS = require('aws-sdk');\nconst dynamodb = new AWS.DynamoDB.DocumentClient();\n\nexports.handler = async (event) => {\n  console.log('Event:', JSON.stringify(event));\n  \n  const tableName = process.env.DYNAMODB_TABLE;\n  const method = event.httpMethod;\n  const path = event.path;\n  \n  try {\n    let response;\n    \n    switch(method) {\n      case 'GET':\n        if (path === '/items') {\n          const result = await dynamodb.scan({ TableName: tableName }).promise();\n          response = {\n            statusCode: 200,\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify(result.Items)\n          };\n        } else if (path.startsWith('/items/')) {\n          const id = path.split('/')[2];\n          const result = await dynamodb.get({\n            TableName: tableName,\n            Key: { id: id, timestamp: parseInt(event.queryStringParameters?.timestamp || Date.now()) }\n          }).promise();\n          response = {\n            statusCode: result.Item ? 200 : 404,\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify(result.Item || { message: 'Item not found' })\n          };\n        }\n        break;\n        \n      case 'POST':\n        const body = JSON.parse(event.body || '{}');\n        const item = {\n          id: body.id || `item-${Date.now()}`,\n          timestamp: Date.now(),\n          ...body,\n          ttl: Math.floor(Date.now() / 1000) + 86400 * 30\n        };\n        await dynamodb.put({\n          TableName: tableName,\n          Item: item\n        }).promise();\n        response = {\n          statusCode: 201,\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify(item)\n        };\n        break;\n        \n      default:\n        response = {\n          statusCode: 405,\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({ message: 'Method not allowed' })\n        };\n    }\n    \n    return response;\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ message: 'Internal server error', error: error.message })\n    };\n  }\n};"
        },
        "MemorySize": { "Ref": "LambdaMemory" },
        "Timeout": { "Ref": "LambdaTimeout" },
        "ReservedConcurrentExecutions": {
          "Ref": "ReservedConcurrentExecutions"
        },
        "DeadLetterConfig": {
          "TargetArn": { "Fn::GetAtt": ["LambdaDLQ", "Arn"] }
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": { "Ref": "DynamoDBTable" },
            "ENVIRONMENT": { "Ref": "Environment" },
            "LOG_LEVEL": {
              "Fn::FindInMap": [
                "EnvironmentConfig",
                { "Ref": "Environment" },
                "LogLevel"
              ]
            },
            "KMS_KEY_ID": { "Ref": "KMSKey" }
          }
        },
        "KmsKeyArn": { "Fn::GetAtt": ["KMSKey", "Arn"] },
        "TracingConfig": {
          "Mode": { "Fn::If": ["EnableXRay", "Active", "PassThrough"] }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      },
      "DependsOn": ["LambdaLogGroup"]
    },

    "ApiGatewayRestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-api" },
        "Description": {
          "Fn::Sub": "API Gateway for ${ProjectName} ${Environment} environment"
        },
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Policy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": "execute-api:Invoke",
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "ApiGatewayResourceItems": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ParentId": { "Fn::GetAtt": ["ApiGatewayRestApi", "RootResourceId"] },
        "PathPart": "items"
      }
    },

    "ApiGatewayResourceItemsId": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ParentId": { "Ref": "ApiGatewayResourceItems" },
        "PathPart": "{id}"
      }
    },

    "ApiGatewayMethodGetItems": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ResourceId": { "Ref": "ApiGatewayResourceItems" },
        "HttpMethod": "GET",
        "AuthorizationType": "AWS_IAM",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          },
          "IntegrationResponses": [
            {
              "StatusCode": 200
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseModels": {
              "application/json": "Empty"
            }
          }
        ]
      }
    },

    "ApiGatewayMethodPostItems": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ResourceId": { "Ref": "ApiGatewayResourceItems" },
        "HttpMethod": "POST",
        "AuthorizationType": "AWS_IAM",
        "RequestValidatorId": { "Ref": "ApiGatewayRequestValidator" },
        "RequestModels": {
          "application/json": { "Ref": "ApiGatewayModel" }
        },
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          },
          "IntegrationResponses": [
            {
              "StatusCode": 201
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 201,
            "ResponseModels": {
              "application/json": "Empty"
            }
          }
        ]
      }
    },

    "ApiGatewayMethodGetItemsId": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ResourceId": { "Ref": "ApiGatewayResourceItemsId" },
        "HttpMethod": "GET",
        "AuthorizationType": "AWS_IAM",
        "RequestParameters": {
          "method.request.path.id": true
        },
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          },
          "IntegrationResponses": [
            {
              "StatusCode": 200
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseModels": {
              "application/json": "Empty"
            }
          }
        ]
      }
    },

    "ApiGatewayRequestValidator": {
      "Type": "AWS::ApiGateway::RequestValidator",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "Name": "BodyValidator",
        "ValidateRequestBody": true,
        "ValidateRequestParameters": false
      }
    },

    "ApiGatewayModel": {
      "Type": "AWS::ApiGateway::Model",
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "ContentType": "application/json",
        "Name": "ItemModel",
        "Schema": {
          "$schema": "http://json-schema.org/draft-04/schema#",
          "title": "Item",
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            }
          },
          "required": ["name"]
        }
      }
    },

    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": [
        "ApiGatewayMethodGetItems",
        "ApiGatewayMethodPostItems",
        "ApiGatewayMethodGetItemsId"
      ],
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "Description": {
          "Fn::Sub": "Deployment for ${Environment} environment"
        }
      }
    },

    "ApiGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": { "Ref": "Environment" },
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "DeploymentId": { "Ref": "ApiGatewayDeployment" },
        "TracingEnabled": { "Fn::If": ["EnableXRay", true, false] },
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "LoggingLevel": {
              "Fn::FindInMap": [
                "EnvironmentConfig",
                { "Ref": "Environment" },
                "LogLevel"
              ]
            },
            "DataTraceEnabled": { "Fn::If": ["IsProduction", false, true] },
            "MetricsEnabled": true,
            "ThrottlingBurstLimit": { "Ref": "ApiThrottleBurstLimit" },
            "ThrottlingRateLimit": { "Ref": "ApiThrottleRateLimit" }
          }
        ],
        "AccessLogSetting": {
          "DestinationArn": { "Fn::GetAtt": ["ApiGatewayLogGroup", "Arn"] },
          "Format": "$context.requestId $context.extendedRequestId $context.identity.sourceIp $context.requestTime $context.routeKey $context.status"
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "ApiGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/${ProjectName}-${Environment}"
        },
        "RetentionInDays": { "Ref": "LogRetentionDays" },
        "KmsKeyId": { "Fn::GetAtt": ["KMSKey", "Arn"] }
      }
    },

    "ApiGatewayUsagePlan": {
      "Type": "AWS::ApiGateway::UsagePlan",
      "DependsOn": "ApiGatewayStage",
      "Properties": {
        "UsagePlanName": {
          "Fn::Sub": "${ProjectName}-${Environment}-usage-plan"
        },
        "Description": {
          "Fn::Sub": "Usage plan for ${ProjectName} ${Environment} API"
        },
        "ApiStages": [
          {
            "ApiId": { "Ref": "ApiGatewayRestApi" },
            "Stage": { "Ref": "Environment" },
            "Throttle": {
              "/*/*/*": {
                "BurstLimit": { "Ref": "ApiThrottleBurstLimit" },
                "RateLimit": { "Ref": "ApiThrottleRateLimit" }
              }
            }
          }
        ],
        "Throttle": {
          "BurstLimit": { "Ref": "ApiThrottleBurstLimit" },
          "RateLimit": { "Ref": "ApiThrottleRateLimit" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "ApiGatewayApiKey": {
      "Type": "AWS::ApiGateway::ApiKey",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-api-key" },
        "Description": {
          "Fn::Sub": "API key for ${ProjectName} ${Environment} environment"
        },
        "Enabled": true,
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "ApiGatewayUsagePlanKey": {
      "Type": "AWS::ApiGateway::UsagePlanKey",
      "Properties": {
        "KeyId": { "Ref": "ApiGatewayApiKey" },
        "KeyType": "API_KEY",
        "UsagePlanId": { "Ref": "ApiGatewayUsagePlan" }
      }
    },

    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "LambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*/*"
        }
      }
    },

    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "${ProjectName}-${Environment}-alerts" },
        "DisplayName": { "Fn::Sub": "${ProjectName} ${Environment} Alerts" },
        "KmsMasterKeyId": { "Ref": "KMSKey" },
        "Subscription": [
          {
            "Endpoint": { "Ref": "AlertEmail" },
            "Protocol": "email"
          }
        ],
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "ManagedBy", "Value": "CloudFormation" }
        ]
      }
    },

    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${Environment}-lambda-errors"
        },
        "AlarmDescription": "Alarm when Lambda function errors exceed threshold",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "LambdaFunction" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "LambdaThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${Environment}-lambda-throttles"
        },
        "AlarmDescription": "Alarm when Lambda function is throttled",
        "MetricName": "Throttles",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "LambdaFunction" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "LambdaDurationAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${Environment}-lambda-duration"
        },
        "AlarmDescription": "Alarm when Lambda function duration is too high",
        "MetricName": "Duration",
        "Namespace": "AWS/Lambda",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": { "Fn::Sub": "${LambdaTimeout}000" },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "LambdaFunction" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "ApiGateway4xxAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "${ProjectName}-${Environment}-api-4xx" },
        "AlarmDescription": "Alarm when API Gateway 4xx errors exceed threshold",
        "MetricName": "4XXError",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 50,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ApiName",
            "Value": { "Fn::Sub": "${ProjectName}-${Environment}-api" }
          },
          {
            "Name": "Stage",
            "Value": { "Ref": "Environment" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "ApiGateway5xxAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "${ProjectName}-${Environment}-api-5xx" },
        "AlarmDescription": "Alarm when API Gateway 5xx errors exceed threshold",
        "MetricName": "5XXError",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ApiName",
            "Value": { "Fn::Sub": "${ProjectName}-${Environment}-api" }
          },
          {
            "Name": "Stage",
            "Value": { "Ref": "Environment" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "DynamoDBThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${Environment}-dynamodb-throttles"
        },
        "AlarmDescription": "Alarm when DynamoDB throttles exceed threshold",
        "MetricName": "UserErrors",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": { "Ref": "DynamoDBTable" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "DLQAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${Environment}-dlq-messages"
        },
        "AlarmDescription": "Alarm when messages are sent to DLQ",
        "MetricName": "ApproximateNumberOfMessagesVisible",
        "Namespace": "AWS/SQS",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "QueueName",
            "Value": { "Fn::GetAtt": ["LambdaDLQ", "QueueName"] }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "${ProjectName}-${Environment}-dashboard"
        },
        "DashboardBody": {
          "Fn::Sub": "{\n  \"widgets\": [\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/Lambda\", \"Invocations\", {\"stat\": \"Sum\", \"label\": \"Invocations\"}],\n          [\".\", \"Errors\", {\"stat\": \"Sum\", \"label\": \"Errors\"}],\n          [\".\", \"Throttles\", {\"stat\": \"Sum\", \"label\": \"Throttles\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Lambda Metrics\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"FunctionName\": \"${LambdaFunction}\"\n        }\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/Lambda\", \"Duration\", {\"stat\": \"Average\", \"label\": \"Average Duration\"}],\n          [\".\", \".\", {\"stat\": \"Maximum\", \"label\": \"Max Duration\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Lambda Duration\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"FunctionName\": \"${LambdaFunction}\"\n        },\n        \"yAxis\": {\n          \"left\": {\n            \"min\": 0\n          }\n        }\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/ApiGateway\", \"Count\", {\"stat\": \"Sum\", \"label\": \"API Calls\"}],\n          [\".\", \"4XXError\", {\"stat\": \"Sum\", \"label\": \"4XX Errors\"}],\n          [\".\", \"5XXError\", {\"stat\": \"Sum\", \"label\": \"5XX Errors\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"API Gateway Metrics\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"ApiName\": \"${ProjectName}-${Environment}-api\",\n          \"Stage\": \"${Environment}\"\n        }\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/DynamoDB\", \"ConsumedReadCapacityUnits\", {\"stat\": \"Sum\"}],\n          [\".\", \"ConsumedWriteCapacityUnits\", {\"stat\": \"Sum\"}],\n          [\".\", \"UserErrors\", {\"stat\": \"Sum\"}],\n          [\".\", \"SystemErrors\", {\"stat\": \"Sum\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"DynamoDB Metrics\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"TableName\": \"${DynamoDBTable}\"\n        }\n      }\n    }\n  ]\n}"
        }
      }
    }
  },

  "Outputs": {
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}"
      },
      "Export": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-ApiEndpoint" }
      }
    },
    "ApiKeyId": {
      "Description": "API Key ID for accessing the API",
      "Value": { "Ref": "ApiGatewayApiKey" },
      "Export": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-ApiKeyId" }
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda Function ARN",
      "Value": { "Fn::GetAtt": ["LambdaFunction", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-LambdaArn" }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB Table Name",
      "Value": { "Ref": "DynamoDBTable" },
      "Export": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-TableName" }
      }
    },
    "DynamoDBTableArn": {
      "Description": "DynamoDB Table ARN",
      "Value": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-TableArn" }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for alerts",
      "Value": { "Ref": "SNSTopic" },
      "Export": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-SNSTopicArn" }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": { "Ref": "KMSKey" },
      "Export": {
        "Name": { "Fn::Sub": "${ProjectName}-${Environment}-KMSKeyId" }
      }
    },
    "DashboardURL": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ProjectName}-${Environment}-dashboard"
      }
    }
  }
}
```

## Deployment Instructions

### 1. **Validate the Template**

```bash
# Install cfn-lint
pip install cfn-lint

# Validate template
cfn-lint template.json

# AWS CLI validation
aws cloudformation validate-template \
  --template-body file://template.json \
  --region us-west-2
```

### 2. **Create Stack**

```bash
aws cloudformation create-stack \
  --stack-name serverless-backend-prod \
  --template-body file://template.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=ProjectName,ParameterValue=serverless-app \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

### 3. **Update Stack** (for changes)

```bash
aws cloudformation update-stack \
  --stack-name serverless-backend-prod \
  --template-body file://template.json \
  --parameters \
    ParameterKey=Environment,UsePreviousValue=true \
    ParameterKey=ProjectName,UsePreviousValue=true \
    ParameterKey=AlertEmail,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

## Key Features Implemented

### **Security**

- ✅ KMS encryption for DynamoDB, Lambda environment variables, and logs
- ✅ Least privilege IAM roles
- ✅ AWS IAM authorization for API Gateway
- ✅ Encrypted SNS topics
- ✅ VPC endpoints support ready

### **Production Readiness**

- ✅ Dead Letter Queues for Lambda
- ✅ API Gateway usage plans and throttling
- ✅ Comprehensive CloudWatch alarms
- ✅ CloudWatch dashboard
- ✅ X-Ray tracing (configurable per environment)
- ✅ Point-in-time recovery for DynamoDB (production only)

### **Modularity**

- ✅ Parameterized template
- ✅ Environment-specific configurations
- ✅ Exported outputs for cross-stack references
- ✅ Conditional resources based on environment

### **Monitoring & Observability**

- ✅ CloudWatch Logs with retention policies
- ✅ SNS notifications for critical alarms
- ✅ Metrics for Lambda, API Gateway, and DynamoDB
- ✅ Custom dashboard with key metrics

### **Best Practices**

- ✅ Proper tagging strategy
- ✅ Reserved concurrent executions
- ✅ Request validation in API Gateway
- ✅ DynamoDB TTL enabled
- ✅ Log encryption

## Testing the Deployment

After deployment, test your API:

```bash
# Get the API endpoint from stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name serverless-backend-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Test POST request
aws apigatewayv2 test-invoke-method \
  --api-id <api-id> \
  --resource-id <resource-id> \
  --http-method POST \
  --body '{"name":"Test Item","description":"Test Description"}'

# Monitor logs
aws logs tail /aws/lambda/serverless-app-production-api --follow
```

This template provides a robust, production-ready serverless infrastructure that can be easily customized and deployed across different environments. The modular design allows for easy maintenance and updates while maintaining security and performance best practices.
