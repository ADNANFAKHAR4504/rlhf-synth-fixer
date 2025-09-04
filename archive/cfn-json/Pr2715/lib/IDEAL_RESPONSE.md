## Purpose

This document is an _ideal response_ describing, validating, and improving the provided `tapstack.json` CloudFormation template that provisions a secure serverless infrastructure (Lambda triggered by S3, API Gateway + usage plan, encrypted S3, least-privilege IAM). It:

- Confirms which requirements are satisfied.
- Lists correctness issues and security/operational improvements.
- Provides concrete fixes / code snippets for the most important problems.
- Recommends additional best-practice additions you should consider before deploying to production.

---

## Quick checklist vs. user requirements

**Required items and status:**

1. **Use CloudFormation** — ✅ Present (JSON template).
2. **Lambda function triggered by S3 event** — ✅ Achieved (custom resource config + Lambda + permission), but implementation can be simplified/safer (see suggestions).
3. **IAM Role & least-privilege policy granting S3 read-only** — ✅ Present, but the policy's resource reference has an issue and role could be tightened further.
4. **S3 bucket with server-side encryption** — ✅ Present (AES256 / SSE-S3). Recommend SSE-KMS for auditability.
5. **API Gateway calling Lambda** — ✅ Present (RestApi, Resource, Method, Integration).
6. **API Gateway Usage Plan with throttling + quotas** — ✅ Present.
7. **CloudFormation Parameter for naming** — ✅ `EnvironmentName` parameter exists.
8. **Portability (deployable in any region)** — ✅ Template does not hardcode region-specific ARNs. Good.

---

## CloudFormation Template (YAML)

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: Secure serverless infrastructure with Lambda, S3, and API Gateway following best practices

Parameters:
  EnvironmentName:
    Type: String
    Default: dev
    Description: Environment name suffix for resource naming
    AllowedValues:
      - dev
      - staging
      - prod
    ConstraintDescription: Must be dev, staging, or prod

Resources:
  # S3 Bucket for application data storage
  AppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

  # IAM Role for Lambda execution with S3 read-only access
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub "${AppDataBucket.Arn}/*"

  # Lambda function for data processing
  ProcessDataLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "process-data-${EnvironmentName}"
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt "LambdaExecutionRole.Arn"
      Code:
        ZipFile: |
          import json
          import boto3

          def lambda_handler(event, context):
              print("Received event: " + json.dumps(event, indent=2))

              # Process S3 event if triggered by S3
              if 'Records' in event and event['Records']:
                  for record in event['Records']:
                      if 's3' in record:
                          bucket_name = record['s3']['bucket']['name']
                          object_key = record['s3']['object']['key']
                          print(f"Processing S3 object: s3://{bucket_name}/{object_key}")

              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                  },
                  'body': json.dumps({
                      'message': 'Data processed successfully!',
                      'environment': context.function_name
                  })
              }
      MemorySize: 128
      Timeout: 30
      Environment:
        Variables:
          BUCKET_NAME: !Ref "AppDataBucket"
          ENVIRONMENT: !Ref "EnvironmentName"

  # Permission for S3 to invoke Lambda
  S3BucketEventPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt "ProcessDataLambda.Arn"
      Principal: s3.amazonaws.com
      SourceArn: !GetAtt "AppDataBucket.Arn"
      SourceAccount: !Ref "AWS::AccountId"

  # IAM Role for S3 Notification Configuration Lambda
  S3NotificationRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: S3NotificationPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutBucketNotification
                  - s3:GetBucketNotification
                Resource: !GetAtt AppDataBucket.Arn
              - Effect: Allow
                Action:
                  - lambda:GetFunction
                  - lambda:AddPermission
                  - lambda:RemovePermission
                Resource: !GetAtt ProcessDataLambda.Arn

  # Custom Lambda function to handle S3 notification configuration
  S3NotificationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "s3-notification-config-${EnvironmentName}"
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt S3NotificationRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import boto3
          import json
          import cfnresponse

          def handler(event, context):
              try:
                  s3 = boto3.client('s3')
                  lambda_client = boto3.client('lambda')

                  bucket_name = event['ResourceProperties']['BucketName']
                  lambda_arn = event['ResourceProperties']['LambdaArn']

                  if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
                      # First, ensure Lambda permission exists
                      try:
                          lambda_client.add_permission(
                              FunctionName=lambda_arn,
                              StatementId='S3InvokePermission',
                              Action='lambda:InvokeFunction',
                              Principal='s3.amazonaws.com',
                              SourceArn=f'arn:aws:s3:::{bucket_name}'
                          )
                      except lambda_client.exceptions.ResourceConflictException:
                          # Permission already exists, which is fine
                          pass

                      # Configure S3 bucket notification
                      s3.put_bucket_notification_configuration(
                          Bucket=bucket_name,
                          NotificationConfiguration={
                              'LambdaFunctionConfigurations': [{
                                  'Id': 'ProcessDataTrigger',
                                  'LambdaFunctionArn': lambda_arn,
                                  'Events': ['s3:ObjectCreated:*']
                              }]
                          }
                      )
                  elif event['RequestType'] == 'Delete':
                      # Remove notification configuration
                      s3.put_bucket_notification_configuration(
                          Bucket=bucket_name,
                          NotificationConfiguration={}
                      )

                      # Try to remove Lambda permission (optional, as stack deletion will clean up)
                      try:
                          lambda_client.remove_permission(
                              FunctionName=lambda_arn,
                              StatementId='S3InvokePermission'
                          )
                      except:
                          # Ignore errors during deletion
                          pass

                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})

  # Custom resource to configure S3 bucket notifications
  S3BucketNotificationConfig:
    Type: Custom::S3BucketNotification
    Properties:
      ServiceToken: !GetAtt S3NotificationFunction.Arn
      BucketName: !Ref AppDataBucket
      LambdaArn: !GetAtt ProcessDataLambda.Arn

  # API Gateway REST API
  ApiGatewayRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "data-api-${EnvironmentName}"
      Description: API Gateway for processing data with security best practices
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Gateway Resource
  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref "ApiGatewayRestApi"
      ParentId: !GetAtt "ApiGatewayRestApi.RootResourceId"
      PathPart: process

  # API Gateway POST Method
  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref "ApiGatewayRestApi"
      ResourceId: !Ref "ApiGatewayResource"
      HttpMethod: POST
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProcessDataLambda.Arn}/invocations"
        IntegrationResponses:
          - StatusCode: "200"
            ResponseParameters:
              method.response.header.Access-Control-Allow-Origin: "'*'"
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        PassthroughBehavior: WHEN_NO_MATCH
      MethodResponses:
        - StatusCode: "200"
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Headers: true

  # API Gateway OPTIONS Method for CORS
  ApiGatewayOptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref "ApiGatewayRestApi"
      ResourceId: !Ref "ApiGatewayResource"
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: "200"
            ResponseParameters:
              method.response.header.Access-Control-Allow-Origin: "'*'"
              method.response.header.Access-Control-Allow-Methods: "'POST,OPTIONS'"
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
            ResponseTemplates:
              application/json: "{}"
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: "200"
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Headers: true

  # API Gateway Deployment
  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    Properties:
      RestApiId: !Ref "ApiGatewayRestApi"
      StageName: !Ref "EnvironmentName"
    DependsOn:
      - ApiGatewayMethod
      - ApiGatewayOptionsMethod

  # Permission for API Gateway to invoke Lambda
  ApiGatewayLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt "ProcessDataLambda.Arn"
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/POST/process"

  # API Gateway Usage Plan
  ApiGatewayUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: !Sub "data-api-usage-plan-${EnvironmentName}"
      Description: Usage plan with throttling and quotas for secure API consumption
      Throttle:
        BurstLimit: 50
        RateLimit: 25
      Quota:
        Limit: 10000
        Period: MONTH
      ApiStages:
        - ApiId: !Ref "ApiGatewayRestApi"
          Stage: !Ref "EnvironmentName"
    DependsOn: ApiGatewayDeployment

  # API Gateway API Key
  ApiGatewayApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub "data-api-key-${EnvironmentName}"
      Description: API key for secure access to data processing API
      Enabled: true

  # Associate API Key with Usage Plan
  ApiGatewayUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref "ApiGatewayApiKey"
      KeyType: API_KEY
      UsagePlanId: !Ref "ApiGatewayUsagePlan"

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket for application data storage
    Value: !Ref "AppDataBucket"
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketName"

  S3BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt "AppDataBucket.Arn"
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketArn"

  LambdaFunctionName:
    Description: Name of the Lambda function
    Value: !Ref "ProcessDataLambda"
    Export:
      Name: !Sub "${AWS::StackName}-LambdaFunctionName"

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt "ProcessDataLambda.Arn"
    Export:
      Name: !Sub "${AWS::StackName}-LambdaFunctionArn"

  ApiGatewayUrl:
    Description: API Gateway endpoint URL for data processing
    Value: !Sub "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentName}/process"
    Export:
      Name: !Sub "${AWS::StackName}-ApiGatewayUrl"

  ApiGatewayId:
    Description: API Gateway REST API ID
    Value: !Ref "ApiGatewayRestApi"
    Export:
      Name: !Sub "${AWS::StackName}-ApiGatewayId"

  ApiKey:
    Description: API Key for secure access to the API
    Value: !Ref "ApiGatewayApiKey"
    Export:
      Name: !Sub "${AWS::StackName}-ApiKey"

  UsagePlanId:
    Description: Usage Plan ID for API consumption control
    Value: !Ref "ApiGatewayUsagePlan"
    Export:
      Name: !Sub "${AWS::StackName}-UsagePlanId"
```

## CloudFormation Template (JSON)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure serverless infrastructure with Lambda, S3, and API Gateway following best practices",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment name suffix for resource naming",
      "AllowedValues": ["dev", "staging", "prod"],
      "ConstraintDescription": "Must be dev, staging, or prod"
    }
  },
  "Resources": {
    "AppDataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "S3ReadOnlyAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:GetObjectVersion"],
                  "Resource": {
                    "Fn::Sub": "${AppDataBucket.Arn}/*"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "ProcessDataLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "process-data-${EnvironmentName}"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\n\ndef lambda_handler(event, context):\n    print(\"Received event: \" + json.dumps(event, indent=2))\n    \n    # Process S3 event if triggered by S3\n    if 'Records' in event and event['Records']:\n        for record in event['Records']:\n            if 's3' in record:\n                bucket_name = record['s3']['bucket']['name']\n                object_key = record['s3']['object']['key']\n                print(f\"Processing S3 object: s3://{bucket_name}/{object_key}\")\n    \n    return {\n        'statusCode': 200,\n        'headers': {\n            'Content-Type': 'application/json',\n            'Access-Control-Allow-Origin': '*'\n        },\n        'body': json.dumps({\n            'message': 'Data processed successfully!',\n            'environment': context.function_name\n        })\n    }\n"
        },
        "MemorySize": 128,
        "Timeout": 30,
        "Environment": {
          "Variables": {
            "BUCKET_NAME": {
              "Ref": "AppDataBucket"
            },
            "ENVIRONMENT": {
              "Ref": "EnvironmentName"
            }
          }
        }
      }
    },
    "S3BucketEventPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {
          "Fn::GetAtt": ["ProcessDataLambda", "Arn"]
        },
        "Principal": "s3.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["AppDataBucket", "Arn"]
        },
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "S3NotificationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "S3NotificationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutBucketNotification",
                    "s3:GetBucketNotification"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["AppDataBucket", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:GetFunction",
                    "lambda:AddPermission",
                    "lambda:RemovePermission"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["ProcessDataLambda", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "S3NotificationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "s3-notification-config-${EnvironmentName}"
        },
        "Runtime": "python3.9",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["S3NotificationRole", "Arn"]
        },
        "Timeout": 300,
        "Code": {
          "ZipFile": "import boto3\nimport json\nimport cfnresponse\n\ndef handler(event, context):\n    try:\n        s3 = boto3.client('s3')\n        lambda_client = boto3.client('lambda')\n        \n        bucket_name = event['ResourceProperties']['BucketName']\n        lambda_arn = event['ResourceProperties']['LambdaArn']\n        \n        if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':\n            # First, ensure Lambda permission exists\n            try:\n                lambda_client.add_permission(\n                    FunctionName=lambda_arn,\n                    StatementId='S3InvokePermission',\n                    Action='lambda:InvokeFunction',\n                    Principal='s3.amazonaws.com',\n                    SourceArn=f'arn:aws:s3:::{bucket_name}'\n                )\n            except lambda_client.exceptions.ResourceConflictException:\n                # Permission already exists, which is fine\n                pass\n            \n            # Configure S3 bucket notification\n            s3.put_bucket_notification_configuration(\n                Bucket=bucket_name,\n                NotificationConfiguration={\n                    'LambdaFunctionConfigurations': [{\n                        'Id': 'ProcessDataTrigger',\n                        'LambdaFunctionArn': lambda_arn,\n                        'Events': ['s3:ObjectCreated:*']\n                    }]\n                }\n            )\n        elif event['RequestType'] == 'Delete':\n            # Remove notification configuration\n            s3.put_bucket_notification_configuration(\n                Bucket=bucket_name,\n                NotificationConfiguration={}\n            )\n            \n            # Try to remove Lambda permission (optional, as stack deletion will clean up)\n            try:\n                lambda_client.remove_permission(\n                    FunctionName=lambda_arn,\n                    StatementId='S3InvokePermission'\n                )\n            except:\n                # Ignore errors during deletion\n                pass\n        \n        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})\n    except Exception as e:\n        print(f\"Error: {str(e)}\")\n        cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})\n"
        }
      }
    },
    "S3BucketNotificationConfig": {
      "Type": "Custom::S3BucketNotification",
      "Properties": {
        "ServiceToken": {
          "Fn::GetAtt": ["S3NotificationFunction", "Arn"]
        },
        "BucketName": {
          "Ref": "AppDataBucket"
        },
        "LambdaArn": {
          "Fn::GetAtt": ["ProcessDataLambda", "Arn"]
        }
      }
    },
    "ApiGatewayRestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "data-api-${EnvironmentName}"
        },
        "Description": "API Gateway for processing data with security best practices",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        }
      }
    },
    "ApiGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "ParentId": {
          "Fn::GetAtt": ["ApiGatewayRestApi", "RootResourceId"]
        },
        "PathPart": "process"
      }
    },
    "ApiGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "ApiKeyRequired": true,
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProcessDataLambda.Arn}/invocations"
          },
          "IntegrationResponses": [
            {
              "StatusCode": "200",
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Origin": "'*'",
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              }
            }
          ],
          "PassthroughBehavior": "WHEN_NO_MATCH"
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Headers": true
            }
          }
        ]
      }
    },
    "ApiGatewayOptionsMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResource"
        },
        "HttpMethod": "OPTIONS",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [
            {
              "StatusCode": "200",
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Origin": "'*'",
                "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'",
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              },
              "ResponseTemplates": {
                "application/json": "{}"
              }
            }
          ],
          "RequestTemplates": {
            "application/json": "{\"statusCode\": 200}"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Headers": true
            }
          }
        ]
      }
    },
    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "StageName": {
          "Ref": "EnvironmentName"
        }
      },
      "DependsOn": ["ApiGatewayMethod", "ApiGatewayOptionsMethod"]
    },
    "ApiGatewayLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {
          "Fn::GetAtt": ["ProcessDataLambda", "Arn"]
        },
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/POST/process"
        }
      }
    },
    "ApiGatewayUsagePlan": {
      "Type": "AWS::ApiGateway::UsagePlan",
      "Properties": {
        "UsagePlanName": {
          "Fn::Sub": "data-api-usage-plan-${EnvironmentName}"
        },
        "Description": "Usage plan with throttling and quotas for secure API consumption",
        "Throttle": {
          "BurstLimit": 50,
          "RateLimit": 25
        },
        "Quota": {
          "Limit": 10000,
          "Period": "MONTH"
        },
        "ApiStages": [
          {
            "ApiId": {
              "Ref": "ApiGatewayRestApi"
            },
            "Stage": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      },
      "DependsOn": "ApiGatewayDeployment"
    },
    "ApiGatewayApiKey": {
      "Type": "AWS::ApiGateway::ApiKey",
      "Properties": {
        "Name": {
          "Fn::Sub": "data-api-key-${EnvironmentName}"
        },
        "Description": "API key for secure access to data processing API",
        "Enabled": true
      }
    },
    "ApiGatewayUsagePlanKey": {
      "Type": "AWS::ApiGateway::UsagePlanKey",
      "Properties": {
        "KeyId": {
          "Ref": "ApiGatewayApiKey"
        },
        "KeyType": "API_KEY",
        "UsagePlanId": {
          "Ref": "ApiGatewayUsagePlan"
        }
      }
    }
  },
  "Outputs": {
    "S3BucketName": {
      "Description": "Name of the S3 bucket for application data storage",
      "Value": {
        "Ref": "AppDataBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "S3BucketArn": {
      "Description": "ARN of the S3 bucket",
      "Value": {
        "Fn::GetAtt": ["AppDataBucket", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketArn"
        }
      }
    },
    "LambdaFunctionName": {
      "Description": "Name of the Lambda function",
      "Value": {
        "Ref": "ProcessDataLambda"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionName"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["ProcessDataLambda", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "ApiGatewayUrl": {
      "Description": "API Gateway endpoint URL for data processing",
      "Value": {
        "Fn::Sub": "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentName}/process"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiGatewayUrl"
        }
      }
    },
    "ApiGatewayId": {
      "Description": "API Gateway REST API ID",
      "Value": {
        "Ref": "ApiGatewayRestApi"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiGatewayId"
        }
      }
    },
    "ApiKey": {
      "Description": "API Key for secure access to the API",
      "Value": {
        "Ref": "ApiGatewayApiKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiKey"
        }
      }
    },
    "UsagePlanId": {
      "Description": "Usage Plan ID for API consumption control",
      "Value": {
        "Ref": "ApiGatewayUsagePlan"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-UsagePlanId"
        }
      }
    }
  }
}
```
