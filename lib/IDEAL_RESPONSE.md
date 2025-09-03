The ideal response should provide a **production-grade, valid CloudFormation template**

It must include the following components:

- **Lambda Function**

  - Runtime: Node.js 22.x
  - IAM execution role with the least privilege (basic logging + DynamoDB access only)
  - Environment variables wired to the DynamoDB table
  - Explicit CloudWatch Log Group with 14-day retention

- **API Gateway**

  - REST API with a `GET` method, integrated with the Lambda (AWS_PROXY)
  - OPTIONS method for CORS with appropriate headers
  - Deployment stage (`prod`) configured with logging and metrics

- **DynamoDB Table**

  - Partition key: `id` (string)
  - Provisioned throughput (5 read / 5 write units)
  - Server-side encryption enabled with KMS

- **S3 Bucket (for logs)**

  - Encrypted with SSE-S3
  - Versioning enabled
  - Block public access enabled

- **CloudWatch Monitoring**

  - Log groups for both Lambda and API Gateway with proper retention

- **Tagging**
  - Every resource tagged with `Environment=Production`

This version is clean, deployable without modification, and aligned with AWS best practices.

---

## CloudFormation Template (YAML)

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Production-ready serverless application with Lambda, API Gateway, DynamoDB, and S3 logging"

Parameters:
  Environment:
    Type: String
    Default: Production
    Description: Environment name for resource tagging

  LambdaFunctionName:
    Type: String
    Default: ServerlessFunction
    Description: Name for the Lambda function

  DynamoDBTableName:
    Type: String
    Default: ServerlessTable
    Description: Name for the DynamoDB table

  S3LogsBucketName:
    Type: String
    Default: serverless-logs
    Description: Name for the S3 logs bucket (will be appended with account ID and region)

Resources:
  # S3 Bucket for Logs
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${S3LogsBucketName}-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Logging

  # DynamoDB Table
  ServerlessTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref DynamoDBTableName
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: alias/aws/dynamodb
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for Lambda Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${LambdaFunctionName}-execution-role"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt ServerlessTable.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda Function
  ServerlessFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Runtime: nodejs22.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();

          exports.handler = async (event) => {
              console.log('Event received:', JSON.stringify(event, null, 2));

              try {
                  // Get the table name from environment variables
                  const tableName = process.env.DYNAMODB_TABLE_NAME;

                  // Example: Get item from DynamoDB
                  const params = {
                      TableName: tableName,
                      Key: {
                          id: 'sample-id'
                      }
                  };

                  const result = await dynamodb.get(params).promise();

                  const response = {
                      statusCode: 200,
                      headers: {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*',
                          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                          'Access-Control-Allow-Methods': 'GET,OPTIONS'
                      },
                      body: JSON.stringify({
                          message: 'Hello from Lambda!',
                          timestamp: new Date().toISOString(),
                          data: result.Item || null
                      })
                  };

                  return response;
              } catch (error) {
                  console.error('Error:', error);

                  const errorResponse = {
                      statusCode: 500,
                      headers: {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      body: JSON.stringify({
                          error: 'Internal Server Error',
                          message: error.message
                      })
                  };

                  return errorResponse;
              }
          };
      Environment:
        Variables:
          DYNAMODB_TABLE_NAME: !Ref ServerlessTable
      Timeout: 30
      MemorySize: 128
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${LambdaFunctionName}"
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for API Gateway CloudWatch logging
  ApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Account (for CloudWatch logging)
  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCloudWatchRole.Arn

  # API Gateway REST API
  ServerlessApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: ServerlessAPI
      Description: Serverless application API Gateway
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Resource
  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ServerlessApi
      ParentId: !GetAtt ServerlessApi.RootResourceId
      PathPart: "data"

  # API Gateway Method (GET)
  ApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref ApiResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ServerlessFunction.Arn}/invocations"
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Origin: "'*'"
          - StatusCode: 500
            ResponseParameters:
              method.response.header.Access-Control-Allow-Origin: "'*'"
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
        - StatusCode: 500
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true

  # API Gateway OPTIONS Method for CORS
  ApiMethodOptions:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref ApiResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
            ResponseTemplates:
              application/json: ""
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Origin: true

  # API Gateway Deployment with Stage
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiMethod
      - ApiMethodOptions
    Properties:
      RestApiId: !Ref ServerlessApi
      StageName: prod
      StageDescription:
        AccessLogSetting:
          DestinationArn: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/apigateway/${ServerlessApi}"
          Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","caller":"$context.identity.caller","user":"$context.identity.user","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength"}'
        MethodSettings:
          - ResourcePath: "/*"
            HttpMethod: "*"
            LoggingLevel: INFO
            DataTraceEnabled: true
            MetricsEnabled: true
        Tags:
          - Key: Environment
            Value: !Ref Environment

  # CloudWatch Log Group for API Gateway
  ApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/apigateway/${ServerlessApi}"
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ServerlessFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/GET/data"

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/prod/data"
    Export:
      Name: !Sub "${AWS::StackName}-ApiEndpoint"

  LambdaFunctionArn:
    Description: Lambda function ARN
    Value: !GetAtt ServerlessFunction.Arn
    Export:
      Name: !Sub "${AWS::StackName}-LambdaFunctionArn"

  DynamoDBTableName:
    Description: DynamoDB table name
    Value: !Ref ServerlessTable
    Export:
      Name: !Sub "${AWS::StackName}-DynamoDBTableName"

  S3LogsBucketName:
    Description: S3 logs bucket name
    Value: !Ref LogsBucket
    Export:
      Name: !Sub "${AWS::StackName}-S3LogsBucketName"
```

## CloudFormation Template (JSON)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready serverless application with Lambda, API Gateway, DynamoDB, and S3 logging",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "Production",
      "Description": "Environment name for resource tagging"
    },
    "LambdaFunctionName": {
      "Type": "String",
      "Default": "ServerlessFunction",
      "Description": "Name for the Lambda function"
    },
    "DynamoDBTableName": {
      "Type": "String",
      "Default": "ServerlessTable",
      "Description": "Name for the DynamoDB table"
    },
    "S3LogsBucketName": {
      "Type": "String",
      "Default": "serverless-logs",
      "Description": "Name for the S3 logs bucket (will be appended with account ID and region)"
    }
  },
  "Resources": {
    "LogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${S3LogsBucketName}-${AWS::AccountId}-${AWS::Region}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
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
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Logging"
          }
        ]
      }
    },
    "ServerlessTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Ref": "DynamoDBTableName"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          }
        ],
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": "alias/aws/dynamodb"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${LambdaFunctionName}-execution-role"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
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
                  "Resource": {
                    "Fn::GetAtt": ["ServerlessTable", "Arn"]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "ServerlessFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunctionName"
        },
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": "const AWS = require('aws-sdk');\nconst dynamodb = new AWS.DynamoDB.DocumentClient();\n\nexports.handler = async (event) => {\n    console.log('Event received:', JSON.stringify(event, null, 2));\n    \n    try {\n        // Get the table name from environment variables\n        const tableName = process.env.DYNAMODB_TABLE_NAME;\n        \n        // Example: Get item from DynamoDB\n        const params = {\n            TableName: tableName,\n            Key: {\n                id: 'sample-id'\n            }\n        };\n        \n        const result = await dynamodb.get(params).promise();\n        \n        const response = {\n            statusCode: 200,\n            headers: {\n                'Content-Type': 'application/json',\n                'Access-Control-Allow-Origin': '*',\n                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',\n                'Access-Control-Allow-Methods': 'GET,OPTIONS'\n            },\n            body: JSON.stringify({\n                message: 'Hello from Lambda!',\n                timestamp: new Date().toISOString(),\n                data: result.Item || null\n            })\n        };\n        \n        return response;\n    } catch (error) {\n        console.error('Error:', error);\n        \n        const errorResponse = {\n            statusCode: 500,\n            headers: {\n                'Content-Type': 'application/json',\n                'Access-Control-Allow-Origin': '*'\n            },\n            body: JSON.stringify({\n                error: 'Internal Server Error',\n                message: error.message\n            })\n        };\n        \n        return errorResponse;\n    }\n};\n"
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE_NAME": {
              "Ref": "ServerlessTable"
            }
          }
        },
        "Timeout": 30,
        "MemorySize": 128,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/${LambdaFunctionName}"
        },
        "RetentionInDays": 14,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
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
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
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
    "ServerlessApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": "ServerlessAPI",
        "Description": "Serverless application API Gateway",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "ApiResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ServerlessApi"
        },
        "ParentId": {
          "Fn::GetAtt": ["ServerlessApi", "RootResourceId"]
        },
        "PathPart": "data"
      }
    },
    "ApiMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ServerlessApi"
        },
        "ResourceId": {
          "Ref": "ApiResource"
        },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ServerlessFunction.Arn}/invocations"
          },
          "IntegrationResponses": [
            {
              "StatusCode": 200,
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Origin": "'*'"
              }
            },
            {
              "StatusCode": 500,
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Origin": "'*'"
              }
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": true
            }
          },
          {
            "StatusCode": 500,
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": true
            }
          }
        ]
      }
    },
    "ApiMethodOptions": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ServerlessApi"
        },
        "ResourceId": {
          "Ref": "ApiResource"
        },
        "HttpMethod": "OPTIONS",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [
            {
              "StatusCode": 200,
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": "'*'"
              },
              "ResponseTemplates": {
                "application/json": ""
              }
            }
          ],
          "RequestTemplates": {
            "application/json": "{\"statusCode\": 200}"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true
            }
          }
        ]
      }
    },
    "ApiDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["ApiMethod", "ApiMethodOptions"],
      "Properties": {
        "RestApiId": {
          "Ref": "ServerlessApi"
        },
        "StageName": "prod",
        "StageDescription": {
          "AccessLogSetting": {
            "DestinationArn": {
              "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/apigateway/${ServerlessApi}"
            },
            "Format": "{\"requestId\":\"$context.requestId\",\"ip\":\"$context.identity.sourceIp\",\"caller\":\"$context.identity.caller\",\"user\":\"$context.identity.user\",\"requestTime\":\"$context.requestTime\",\"httpMethod\":\"$context.httpMethod\",\"resourcePath\":\"$context.resourcePath\",\"status\":\"$context.status\",\"protocol\":\"$context.protocol\",\"responseLength\":\"$context.responseLength\"}"
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
          "Tags": [
            {
              "Key": "Environment",
              "Value": {
                "Ref": "Environment"
              }
            }
          ]
        }
      }
    },
    "ApiLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/${ServerlessApi}"
        },
        "RetentionInDays": 14,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ServerlessFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/GET/data"
        }
      }
    }
  },
  "Outputs": {
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/prod/data"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiEndpoint"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": {
        "Fn::GetAtt": ["ServerlessFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB table name",
      "Value": {
        "Ref": "ServerlessTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DynamoDBTableName"
        }
      }
    },
    "S3LogsBucketName": {
      "Description": "S3 logs bucket name",
      "Value": {
        "Ref": "LogsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3LogsBucketName"
        }
      }
    }
  }
}
```
