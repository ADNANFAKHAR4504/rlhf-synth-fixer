# Serverless Fraud Detection Pipeline - CloudFormation Implementation

This implementation provides a complete serverless fraud detection pipeline using AWS CloudFormation with JSON. The solution includes Lambda functions for transaction processing, DynamoDB for data storage, Step Functions for orchestration, S3 for archival, EventBridge for event routing, and SNS for alerting.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Fraud Detection Pipeline - Expert Level CloudFormation Template",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support multiple environments",
      "Default": "dev",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    }
  },
  "Resources": {
    "TransactionTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "Properties": {
        "TableName": {
          "Fn::Sub": "fraud-transactions-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "transactionId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "transactionId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "FraudDetection"
          }
        ]
      }
    },
    "ArchiveBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "fraud-archive-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "IntelligentTieringConfigurations": [
          {
            "Id": "ArchiveConfig",
            "Status": "Enabled",
            "Tierings": [
              {
                "AccessTier": "ARCHIVE_ACCESS",
                "Days": 90
              },
              {
                "AccessTier": "DEEP_ARCHIVE_ACCESS",
                "Days": 180
              }
            ]
          }
        ],
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
                }
              ]
            }
          ]
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ComplianceTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "fraud-compliance-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Fraud Detection Compliance Alerts",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "TransactionProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/fraud-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "PostProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/fraud-post-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "TransactionProcessorRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "fraud-processor-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        ],
        "Policies": [
          {
            "PolicyName": "TransactionProcessorPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TransactionTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TransactionProcessorLogGroup", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "ComplianceTopic"
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
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "PostProcessorRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "fraud-post-processor-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        ],
        "Policies": [
          {
            "PolicyName": "PostProcessorPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TransactionTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ArchiveBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["PostProcessorLogGroup", "Arn"]
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
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "TransactionProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": ["TransactionProcessorLogGroup"],
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "fraud-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["TransactionProcessorRole", "Arn"]
        },
        "MemorySize": 1024,
        "Timeout": 60,
        "ReservedConcurrentExecutions": 100,
        "TracingConfig": {
          "Mode": "Active"
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "TransactionTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceTopic"
            },
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import os",
                "import boto3",
                "import time",
                "from decimal import Decimal",
                "",
                "dynamodb = boto3.resource('dynamodb')",
                "sns = boto3.client('sns')",
                "",
                "def lambda_handler(event, context):",
                "    table_name = os.environ['TABLE_NAME']",
                "    sns_topic = os.environ['SNS_TOPIC_ARN']",
                "    table = dynamodb.Table(table_name)",
                "    ",
                "    try:",
                "        transaction_id = event.get('transactionId', 'unknown')",
                "        amount = Decimal(str(event.get('amount', 0)))",
                "        merchant = event.get('merchant', 'unknown')",
                "        timestamp = int(time.time())",
                "        ",
                "        # Simple risk scoring logic",
                "        risk_score = 0",
                "        if amount > 1000:",
                "            risk_score += 50",
                "        if amount > 5000:",
                "            risk_score += 30",
                "        ",
                "        risk_level = 'HIGH' if risk_score >= 70 else 'MEDIUM' if risk_score >= 40 else 'LOW'",
                "        ",
                "        # Store transaction in DynamoDB",
                "        item = {",
                "            'transactionId': transaction_id,",
                "            'timestamp': timestamp,",
                "            'amount': amount,",
                "            'merchant': merchant,",
                "            'riskScore': risk_score,",
                "            'riskLevel': risk_level,",
                "            'status': 'PROCESSED'",
                "        }",
                "        table.put_item(Item=item)",
                "        ",
                "        # Alert on high-risk transactions",
                "        if risk_level == 'HIGH':",
                "            sns.publish(",
                "                TopicArn=sns_topic,",
                "                Subject='High-Risk Transaction Alert',",
                "                Message=f'Transaction {transaction_id} flagged as HIGH RISK with score {risk_score}'",
                "            )",
                "        ",
                "        return {",
                "            'statusCode': 200,",
                "            'transactionId': transaction_id,",
                "            'riskScore': risk_score,",
                "            'riskLevel': risk_level",
                "        }",
                "    except Exception as e:",
                "        print(f'Error processing transaction: {str(e)}')",
                "        raise"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "PostProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": ["PostProcessorLogGroup"],
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "fraud-post-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["PostProcessorRole", "Arn"]
        },
        "MemorySize": 512,
        "Timeout": 60,
        "ReservedConcurrentExecutions": 100,
        "TracingConfig": {
          "Mode": "Active"
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "TransactionTable"
            },
            "BUCKET_NAME": {
              "Ref": "ArchiveBucket"
            },
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import os",
                "import boto3",
                "from datetime import datetime",
                "",
                "s3 = boto3.client('s3')",
                "dynamodb = boto3.resource('dynamodb')",
                "",
                "def lambda_handler(event, context):",
                "    table_name = os.environ['TABLE_NAME']",
                "    bucket_name = os.environ['BUCKET_NAME']",
                "    ",
                "    try:",
                "        transaction_id = event.get('transactionId', 'unknown')",
                "        timestamp = event.get('timestamp')",
                "        ",
                "        # Retrieve transaction from DynamoDB",
                "        table = dynamodb.Table(table_name)",
                "        response = table.get_item(",
                "            Key={",
                "                'transactionId': transaction_id,",
                "                'timestamp': timestamp",
                "            }",
                "        )",
                "        ",
                "        if 'Item' in response:",
                "            transaction = response['Item']",
                "            ",
                "            # Archive to S3",
                "            date_prefix = datetime.now().strftime('%Y/%m/%d')",
                "            s3_key = f'transactions/{date_prefix}/{transaction_id}.json'",
                "            ",
                "            # Convert Decimal to float for JSON serialization",
                "            transaction_json = json.dumps(transaction, default=str)",
                "            ",
                "            s3.put_object(",
                "                Bucket=bucket_name,",
                "                Key=s3_key,",
                "                Body=transaction_json,",
                "                ContentType='application/json'",
                "            )",
                "            ",
                "            return {",
                "                'statusCode': 200,",
                "                'message': 'Transaction archived successfully',",
                "                's3Key': s3_key",
                "            }",
                "        else:",
                "            return {",
                "                'statusCode': 404,",
                "                'message': 'Transaction not found'",
                "            }",
                "    except Exception as e:",
                "        print(f'Error archiving transaction: {str(e)}')",
                "        raise"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "fraud-stepfunctions-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "states.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "StepFunctionsExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TransactionProcessorFunction", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["PostProcessorFunction", "Arn"]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "FraudDetectionStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": {
          "Fn::Sub": "fraud-detection-workflow-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": ["StepFunctionsRole", "Arn"]
        },
        "TracingConfiguration": {
          "Enabled": true
        },
        "DefinitionString": {
          "Fn::Sub": [
            "{\n  \"Comment\": \"Fraud Detection Workflow with Parallel Processing\",\n  \"StartAt\": \"ProcessTransaction\",\n  \"States\": {\n    \"ProcessTransaction\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": {\n        \"FunctionName\": \"${ProcessorArn}\",\n        \"Payload.$\": \"$\"\n      },\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"States.TaskFailed\", \"States.Timeout\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2.0\n        }\n      ],\n      \"Next\": \"ParallelProcessing\",\n      \"ResultPath\": \"$.processingResult\"\n    },\n    \"ParallelProcessing\": {\n      \"Type\": \"Parallel\",\n      \"Branches\": [\n        {\n          \"StartAt\": \"CheckRiskLevel\",\n          \"States\": {\n            \"CheckRiskLevel\": {\n              \"Type\": \"Choice\",\n              \"Choices\": [\n                {\n                  \"Variable\": \"$.processingResult.Payload.riskLevel\",\n                  \"StringEquals\": \"HIGH\",\n                  \"Next\": \"HighRiskDetected\"\n                }\n              ],\n              \"Default\": \"RiskCheckComplete\"\n            },\n            \"HighRiskDetected\": {\n              \"Type\": \"Pass\",\n              \"Result\": \"High risk transaction flagged\",\n              \"End\": true\n            },\n            \"RiskCheckComplete\": {\n              \"Type\": \"Pass\",\n              \"Result\": \"Risk check passed\",\n              \"End\": true\n            }\n          }\n        },\n        {\n          \"StartAt\": \"ArchiveTransaction\",\n          \"States\": {\n            \"ArchiveTransaction\": {\n              \"Type\": \"Task\",\n              \"Resource\": \"arn:aws:states:::lambda:invoke\",\n              \"Parameters\": {\n                \"FunctionName\": \"${PostProcessorArn}\",\n                \"Payload\": {\n                  \"transactionId.$\": \"$.transactionId\",\n                  \"timestamp.$\": \"$.processingResult.Payload.timestamp\"\n                }\n              },\n              \"Retry\": [\n                {\n                  \"ErrorEquals\": [\"States.TaskFailed\"],\n                  \"IntervalSeconds\": 2,\n                  \"MaxAttempts\": 3,\n                  \"BackoffRate\": 2.0\n                }\n              ],\n              \"End\": true\n            }\n          }\n        }\n      ],\n      \"Next\": \"WorkflowComplete\"\n    },\n    \"WorkflowComplete\": {\n      \"Type\": \"Succeed\"\n    }\n  }\n}",
            {
              "ProcessorArn": {
                "Fn::GetAtt": ["TransactionProcessorFunction", "Arn"]
              },
              "PostProcessorArn": {
                "Fn::GetAtt": ["PostProcessorFunction", "Arn"]
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "EventBridgeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "fraud-eventbridge-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "EventBridgeExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "states:StartExecution"
                  ],
                  "Resource": {
                    "Ref": "FraudDetectionStateMachine"
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
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "TransactionEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "fraud-transaction-rule-${EnvironmentSuffix}"
        },
        "Description": "Triggers fraud detection workflow for high-value transactions",
        "EventPattern": {
          "source": ["custom.frauddetection"],
          "detail-type": ["Transaction Received"],
          "detail": {
            "amount": [
              {
                "numeric": [">=", 100]
              }
            ]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "FraudDetectionStateMachine"
            },
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeRole", "Arn"]
            },
            "Id": "FraudDetectionTarget"
          }
        ]
      }
    }
  },
  "Outputs": {
    "StateMachineArn": {
      "Description": "ARN of the Step Functions state machine for fraud detection",
      "Value": {
        "Ref": "FraudDetectionStateMachine"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "FraudDetectionStateMachine-${EnvironmentSuffix}"
        }
      }
    },
    "ArchiveBucketName": {
      "Description": "Name of the S3 bucket for transaction archival",
      "Value": {
        "Ref": "ArchiveBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "ArchiveBucket-${EnvironmentSuffix}"
        }
      }
    },
    "ComplianceTopicArn": {
      "Description": "ARN of the SNS topic for compliance alerts",
      "Value": {
        "Ref": "ComplianceTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "ComplianceTopic-${EnvironmentSuffix}"
        }
      }
    },
    "TransactionTableName": {
      "Description": "Name of the DynamoDB table for transactions",
      "Value": {
        "Ref": "TransactionTable"
      }
    },
    "ProcessorFunctionArn": {
      "Description": "ARN of the transaction processor Lambda function",
      "Value": {
        "Fn::GetAtt": ["TransactionProcessorFunction", "Arn"]
      }
    },
    "PostProcessorFunctionArn": {
      "Description": "ARN of the post-processor Lambda function",
      "Value": {
        "Fn::GetAtt": ["PostProcessorFunction", "Arn"]
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Serverless Fraud Detection Pipeline

A comprehensive CloudFormation implementation of a serverless fraud detection system for processing payment transactions in real-time.

## Architecture Overview

This solution implements an event-driven architecture with the following components:

- **Lambda Functions**: Two Python 3.11 functions for transaction processing and archival
- **DynamoDB**: Transaction storage with point-in-time recovery
- **Step Functions**: Orchestration workflow with parallel processing
- **S3**: Long-term archival with intelligent tiering and lifecycle policies
- **EventBridge**: Event routing with content-based filtering
- **SNS**: Compliance team alerting for high-risk transactions
- **CloudWatch**: Centralized logging with 30-day retention
- **IAM**: Least-privilege security roles

## Features

### Transaction Processing
- Real-time risk scoring based on transaction amount
- Automatic high-risk transaction detection
- DynamoDB storage with encryption at rest
- X-Ray tracing for full audit trail

### Workflow Orchestration
- Parallel processing branches for efficiency
- Exponential backoff retry logic (max 3 attempts)
- Automatic archival to S3
- Risk-based routing

### Cost Controls
- Reserved concurrency of 100 per Lambda function
- Intelligent tiering for S3 storage optimization
- Pay-per-request DynamoDB billing
- Lifecycle policies for Glacier transition after 90 days

### Compliance Features
- Point-in-time recovery for DynamoDB
- X-Ray tracing on all Lambda functions
- CloudWatch Logs retention (30 days)
- Encryption at rest for all data stores
- S3 versioning enabled

## Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- IAM permissions for CloudFormation, Lambda, DynamoDB, S3, Step Functions, EventBridge, SNS
- Target region: us-east-1

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name fraud-detection-pipeline \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Testing

### Trigger Fraud Detection Workflow

Send a test event to EventBridge:

```bash
aws events put-events \
  --entries '[
    {
      "Source": "custom.frauddetection",
      "DetailType": "Transaction Received",
      "Detail": "{\"transactionId\":\"tx-12345\",\"amount\":1500,\"merchant\":\"Test Store\"}"
    }
  ]' \
  --region us-east-1
```

### Check Step Functions Execution

```bash
STATE_MACHINE_ARN=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`StateMachineArn`].OutputValue' \
  --output text)

aws stepfunctions list-executions \
  --state-machine-arn $STATE_MACHINE_ARN \
  --region us-east-1
```

### Query Transaction in DynamoDB

```bash
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`TransactionTableName`].OutputValue' \
  --output text)

aws dynamodb get-item \
  --table-name $TABLE_NAME \
  --key '{"transactionId":{"S":"tx-12345"},"timestamp":{"N":"1234567890"}}' \
  --region us-east-1
```

### Verify S3 Archive

```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`ArchiveBucketName`].OutputValue' \
  --output text)

aws s3 ls s3://$BUCKET_NAME/transactions/ --recursive
```

## Configuration

### Environment Parameter

The `EnvironmentSuffix` parameter allows multiple deployments:
- Development: `dev`
- Staging: `staging`
- Production: `prod`

### Lambda Configuration
- Runtime: Python 3.11
- Memory: 1024 MB (processor), 512 MB (post-processor)
- Timeout: 60 seconds
- Reserved Concurrency: 100 per function
- X-Ray Tracing: Active

### DynamoDB Configuration
- Billing Mode: Pay-per-request
- Partition Key: transactionId (String)
- Sort Key: timestamp (Number)
- Point-in-time Recovery: Enabled
- Encryption: AWS managed keys

### S3 Configuration
- Versioning: Enabled
- Intelligent Tiering: Archive after 90 days
- Lifecycle Policy: Glacier transition at 90 days
- Encryption: AES256
- Public Access: Blocked

### Step Functions Retry Configuration
- Max Attempts: 3
- Initial Interval: 2 seconds
- Backoff Rate: 2.0 (exponential)

## Monitoring

### CloudWatch Logs
- Processor logs: `/aws/lambda/fraud-processor-{EnvironmentSuffix}`
- Post-processor logs: `/aws/lambda/fraud-post-processor-{EnvironmentSuffix}`
- Retention: 30 days

### X-Ray Tracing
All Lambda functions and Step Functions have X-Ray tracing enabled for:
- Performance monitoring
- Error analysis
- Compliance auditing

### SNS Alerts
High-risk transactions (score >= 70) trigger SNS notifications to the compliance topic.

## Security

### IAM Roles
- **TransactionProcessorRole**: DynamoDB write, SNS publish, CloudWatch Logs
- **PostProcessorRole**: DynamoDB read, S3 write, CloudWatch Logs
- **StepFunctionsRole**: Lambda invoke permissions
- **EventBridgeRole**: Step Functions execution

All roles follow least-privilege principles.

### Encryption
- DynamoDB: Encryption at rest with AWS managed KMS keys
- S3: Server-side encryption (AES256)
- SNS: In-transit encryption (TLS)

### Network Security
- S3 bucket: Public access blocked
- Lambda: Default VPC configuration
- All AWS service endpoints: TLS 1.2+

## Cleanup

To delete the stack and all resources:

```bash
# Empty S3 bucket first (due to versioning)
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`ArchiveBucketName`].OutputValue' \
  --output text)

aws s3 rm s3://$BUCKET_NAME --recursive
aws s3api delete-bucket --bucket $BUCKET_NAME

# Delete stack
aws cloudformation delete-stack \
  --stack-name fraud-detection-pipeline \
  --region us-east-1
```

## Troubleshooting

### Lambda Errors
Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/fraud-processor-prod --follow
```

### Step Functions Failures
View execution details:
```bash
aws stepfunctions describe-execution --execution-arn <execution-arn>
```

### DynamoDB Throttling
Monitor consumed capacity:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=fraud-transactions-prod \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Cost Optimization

- Reserved concurrency prevents runaway Lambda costs
- Pay-per-request DynamoDB eliminates idle capacity costs
- Intelligent tiering reduces S3 storage costs automatically
- Lifecycle policies move old data to Glacier
- 30-day log retention prevents unbounded storage growth

## Support

For issues or questions:
1. Check CloudWatch Logs for error details
2. Review X-Ray traces for performance issues
3. Verify IAM permissions for all roles
4. Ensure all constraints are met (concurrency, retention, etc.)
```