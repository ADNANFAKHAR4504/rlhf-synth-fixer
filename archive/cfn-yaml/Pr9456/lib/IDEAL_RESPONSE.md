# Ideal Response

This document contains all the infrastructure code and test files for this project.

## Infrastructure Code


### TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure event-driven data processing pipeline with S3, Lambda, DynamoDB, and Secrets Manager (Production, self-contained)'

Resources:
  # KMS Key for S3 Bucket Encryption
  ApplicationDataBucketKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for ApplicationDataBucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda to decrypt
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  # KMS Key Alias
  ApplicationDataBucketKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/application-data-bucket-key
      TargetKeyId: !Ref ApplicationDataBucketKMSKey

  # S3 Bucket for Application Data
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'application-data-bucket-prod-001-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationDataBucketKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: Production

  # DynamoDB Table for Processed Results
  ProcessedResultsDB:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ProcessedResultsDB
      AttributeDefinitions:
        - AttributeName: recordId
          AttributeType: S
      KeySchema:
        - AttributeName: recordId
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      Tags:
        - Key: Environment
          Value: Production

  # Secrets Manager Secret
  ApplicationSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: ApplicationSecret
      Description: 'Secret for storing sensitive application data'
      SecretString: '{"ApiKey": "your-placeholder-api-key"}'
      Tags:
        - Key: Environment
          Value: Production

  # IAM Role for Lambda Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3DataProcessorPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub 'arn:aws:s3:::application-data-bucket-prod-001-${AWS::AccountId}-us-east-1/*'
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                Resource: !GetAtt ProcessedResultsDB.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/S3DataProcessor:*'
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref ApplicationSecret
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt ApplicationDataBucketKMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  # MFA Enforcement Policy
  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: 'Policy that denies all actions if MFA is not present'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyAllActionsWithoutMFA
            Effect: Deny
            Action: '*'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/S3DataProcessor
      RetentionInDays: 14

  # Lambda Function for S3 Data Processing
  S3DataProcessor:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: S3DataProcessor
      Runtime: python3.13
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref ProcessedResultsDB
          SECRET_NAME: !Ref ApplicationSecret
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          from urllib.parse import unquote_plus
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          secrets_client = boto3.client('secretsmanager')
          def lambda_handler(event, context):
              try:
                  logger.info(f"Received event: {json.dumps(event)}")
                  for record in event['Records']:
                      bucket_name = record['s3']['bucket']['name']
                      object_key = unquote_plus(record['s3']['object']['key'])
                      logger.info(f"Processing object: {object_key} from bucket: {bucket_name}")
                      try:
                          secret_name = os.environ['SECRET_NAME']
                          secret_response = secrets_client.get_secret_value(SecretId=secret_name)
                          secret_data = json.loads(secret_response['SecretString'])
                          logger.info("Successfully retrieved secret from Secrets Manager")
                      except Exception as e:
                          logger.error(f"Error retrieving secret: {str(e)}")
                          raise
                      try:
                          s3_response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                          logger.info(f"S3 object metadata retrieved. Size: {s3_response.get('ContentLength', 'Unknown')}")
                      except Exception as e:
                          logger.error(f"Error accessing S3 object: {str(e)}")
                          raise
                      try:
                          table_name = os.environ['DYNAMODB_TABLE']
                          table = dynamodb.Table(table_name)
                          item = {
                              'recordId': object_key,
                              'bucketName': bucket_name,
                              'processedAt': context.aws_request_id,
                              'status': 'processed'
                          }
                          table.put_item(Item=item)
                          logger.info(f"Successfully wrote item to DynamoDB: {object_key}")
                      except Exception as e:
                          logger.error(f"Error writing to DynamoDB: {str(e)}")
                          raise
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Successfully processed S3 event')
                  }
              except Exception as e:
                  logger.error(f"Error processing event: {str(e)}")
                  raise
      Tags:
        - Key: Environment
          Value: Production

  # Permission for S3 to invoke Lambda
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref S3DataProcessor
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !GetAtt ApplicationDataBucket.Arn
      SourceAccount: !Ref AWS::AccountId

Outputs:
  S3BucketName:
    Description: 'Name of the S3 bucket for application data'
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table for processed results'
    Value: !Ref ProcessedResultsDB
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  LambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref S3DataProcessor
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'

  SecretName:
    Description: 'Name of the Secrets Manager secret'
    Value: !Ref ApplicationSecret
    Export:
      Name: !Sub '${AWS::StackName}-SecretName'

  KMSKeyId:
    Description: 'ID of the KMS key used for S3 encryption'
    Value: !Ref ApplicationDataBucketKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  MFAEnforcementPolicyArn:
    Description: 'ARN of the MFA enforcement policy'
    Value: !Ref MFAEnforcementPolicy
    Export:
      Name: !Sub '${AWS::StackName}-MFAEnforcementPolicyArn'

# AWS CLI deployment command:
# aws cloudformation create-stack --stack-name secure-data-processing-pipeline --template-body file://secure_infrastructure.yaml --capabilities CAPABILITY_NAMED_IAM --region us-east-1```

### TapStack.json

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Secure event-driven data processing pipeline with S3, Lambda, DynamoDB, and Secrets Manager (Production, self-contained)",
    "Resources": {
        "ApplicationDataBucketKMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": "KMS Key for ApplicationDataBucket encryption",
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
                            "Sid": "Allow Lambda to decrypt",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
            }
        },
        "ApplicationDataBucketKMSKeyAlias": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": "alias/application-data-bucket-key",
                "TargetKeyId": {
                    "Ref": "ApplicationDataBucketKMSKey"
                }
            }
        },
        "ApplicationDataBucket": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "BucketName": {
                    "Fn::Sub": "application-data-bucket-prod-001-${AWS::AccountId}-${AWS::Region}"
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": {
                                    "Ref": "ApplicationDataBucketKMSKey"
                                }
                            },
                            "BucketKeyEnabled": true
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
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
            }
        },
        "ProcessedResultsDB": {
            "Type": "AWS::DynamoDB::Table",
            "Properties": {
                "TableName": "ProcessedResultsDB",
                "AttributeDefinitions": [
                    {
                        "AttributeName": "recordId",
                        "AttributeType": "S"
                    }
                ],
                "KeySchema": [
                    {
                        "AttributeName": "recordId",
                        "KeyType": "HASH"
                    }
                ],
                "BillingMode": "PAY_PER_REQUEST",
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
            }
        },
        "ApplicationSecret": {
            "Type": "AWS::SecretsManager::Secret",
            "Properties": {
                "Name": "ApplicationSecret",
                "Description": "Secret for storing sensitive application data",
                "SecretString": "{\"ApiKey\": \"your-placeholder-api-key\"}",
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
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
                        "PolicyName": "S3DataProcessorPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:GetObject"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:s3:::application-data-bucket-prod-001-${AWS::AccountId}-us-east-1/*"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "dynamodb:PutItem"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "ProcessedResultsDB",
                                            "Arn"
                                        ]
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/S3DataProcessor:*"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "secretsmanager:GetSecretValue"
                                    ],
                                    "Resource": {
                                        "Ref": "ApplicationSecret"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "kms:Decrypt"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "ApplicationDataBucketKMSKey",
                                            "Arn"
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
            }
        },
        "MFAEnforcementPolicy": {
            "Type": "AWS::IAM::ManagedPolicy",
            "Properties": {
                "Description": "Policy that denies all actions if MFA is not present",
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyAllActionsWithoutMFA",
                            "Effect": "Deny",
                            "Action": "*",
                            "Resource": "*",
                            "Condition": {
                                "BoolIfExists": {
                                    "aws:MultiFactorAuthPresent": "false"
                                }
                            }
                        }
                    ]
                }
            }
        },
        "LambdaLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": "/aws/lambda/S3DataProcessor",
                "RetentionInDays": 14
            }
        },
        "S3DataProcessor": {
            "Type": "AWS::Lambda::Function",
            "DependsOn": "LambdaLogGroup",
            "Properties": {
                "FunctionName": "S3DataProcessor",
                "Runtime": "python3.13",
                "Handler": "index.lambda_handler",
                "Role": {
                    "Fn::GetAtt": [
                        "LambdaExecutionRole",
                        "Arn"
                    ]
                },
                "Timeout": 60,
                "Environment": {
                    "Variables": {
                        "DYNAMODB_TABLE": {
                            "Ref": "ProcessedResultsDB"
                        },
                        "SECRET_NAME": {
                            "Ref": "ApplicationSecret"
                        }
                    }
                },
                "Code": {
                    "ZipFile": "import json\nimport boto3\nimport logging\nimport os\nfrom urllib.parse import unquote_plus\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\ns3_client = boto3.client('s3')\ndynamodb = boto3.resource('dynamodb')\nsecrets_client = boto3.client('secretsmanager')\ndef lambda_handler(event, context):\n    try:\n        logger.info(f\"Received event: {json.dumps(event)}\")\n        for record in event['Records']:\n            bucket_name = record['s3']['bucket']['name']\n            object_key = unquote_plus(record['s3']['object']['key'])\n            logger.info(f\"Processing object: {object_key} from bucket: {bucket_name}\")\n            try:\n                secret_name = os.environ['SECRET_NAME']\n                secret_response = secrets_client.get_secret_value(SecretId=secret_name)\n                secret_data = json.loads(secret_response['SecretString'])\n                logger.info(\"Successfully retrieved secret from Secrets Manager\")\n            except Exception as e:\n                logger.error(f\"Error retrieving secret: {str(e)}\")\n                raise\n            try:\n                s3_response = s3_client.head_object(Bucket=bucket_name, Key=object_key)\n                logger.info(f\"S3 object metadata retrieved. Size: {s3_response.get('ContentLength', 'Unknown')}\")\n            except Exception as e:\n                logger.error(f\"Error accessing S3 object: {str(e)}\")\n                raise\n            try:\n                table_name = os.environ['DYNAMODB_TABLE']\n                table = dynamodb.Table(table_name)\n                item = {\n                    'recordId': object_key,\n                    'bucketName': bucket_name,\n                    'processedAt': context.aws_request_id,\n                    'status': 'processed'\n                }\n                table.put_item(Item=item)\n                logger.info(f\"Successfully wrote item to DynamoDB: {object_key}\")\n            except Exception as e:\n                logger.error(f\"Error writing to DynamoDB: {str(e)}\")\n                raise\n        return {\n            'statusCode': 200,\n            'body': json.dumps('Successfully processed S3 event')\n        }\n    except Exception as e:\n        logger.error(f\"Error processing event: {str(e)}\")\n        raise\n"
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
            }
        },
        "LambdaInvokePermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "FunctionName": {
                    "Ref": "S3DataProcessor"
                },
                "Action": "lambda:InvokeFunction",
                "Principal": "s3.amazonaws.com",
                "SourceArn": {
                    "Fn::GetAtt": [
                        "ApplicationDataBucket",
                        "Arn"
                    ]
                },
                "SourceAccount": {
                    "Ref": "AWS::AccountId"
                }
            }
        }
    },
    "Outputs": {
        "S3BucketName": {
            "Description": "Name of the S3 bucket for application data",
            "Value": {
                "Ref": "ApplicationDataBucket"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-S3BucketName"
                }
            }
        },
        "DynamoDBTableName": {
            "Description": "Name of the DynamoDB table for processed results",
            "Value": {
                "Ref": "ProcessedResultsDB"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-DynamoDBTableName"
                }
            }
        },
        "LambdaFunctionName": {
            "Description": "Name of the Lambda function",
            "Value": {
                "Ref": "S3DataProcessor"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-LambdaFunctionName"
                }
            }
        },
        "SecretName": {
            "Description": "Name of the Secrets Manager secret",
            "Value": {
                "Ref": "ApplicationSecret"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-SecretName"
                }
            }
        },
        "KMSKeyId": {
            "Description": "ID of the KMS key used for S3 encryption",
            "Value": {
                "Ref": "ApplicationDataBucketKMSKey"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-KMSKeyId"
                }
            }
        },
        "MFAEnforcementPolicyArn": {
            "Description": "ARN of the MFA enforcement policy",
            "Value": {
                "Ref": "MFAEnforcementPolicy"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-MFAEnforcementPolicyArn"
                }
            }
        }
    }
}```

## Test Files

