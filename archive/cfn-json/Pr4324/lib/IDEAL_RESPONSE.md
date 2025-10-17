# E-commerce Order Processing Monitoring System - CloudFormation Solution

This document provides the ideal CloudFormation implementation for an e-commerce order processing monitoring system with comprehensive audit logging, deployed to the **ap-southeast-1** region.

## Solution Overview

The infrastructure implements:

1. **DynamoDB Table** - Stores order events with DynamoDB Streams enabled for change tracking
2. **S3 Bucket** - Stores audit logs with encryption, versioning, and Glacier lifecycle policy
3. **Lambda Function** - Processes DynamoDB stream events and writes audit logs to S3
4. **SNS Topic** - Sends notifications for order failures with KMS encryption
5. **CloudWatch Alarm** - Monitors Lambda error rates using metric math (>5% threshold)
6. **IAM Role** - Provides least-privilege permissions for Lambda execution

## CloudFormation Template

File: `lib/TapStack.json`

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "E-commerce Order Processing Monitoring System with comprehensive audit logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming",
      "Default": "dev"
    }
  },
  "Resources": {
    "OrderEventsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "order-events-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "orderId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          },
          {
            "AttributeName": "status",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "orderId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "status-timestamp-index",
            "KeySchema": [
              {
                "AttributeName": "status",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "order-events-table-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Order events storage and tracking"
          }
        ]
      }
    },
    "AuditLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "audit-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "audit-logs-bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Order audit logs storage"
          }
        ]
      }
    },
    "OrderAlertsTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "order-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Order Processing Alerts",
        "KmsMasterKeyId": "alias/aws/sns",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "order-alerts-topic-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Order processing alerts and notifications"
          }
        ]
      }
    },
    "OrderProcessorLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "order-processor-lambda-role-${EnvironmentSuffix}"
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
            "PolicyName": "OrderProcessorPolicy",
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
                    {
                      "Fn::GetAtt": [
                        "OrderEventsTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${OrderEventsTable.Arn}/index/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${AuditLogsBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": [
                    {
                      "Ref": "OrderAlertsTopic"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "OrderEventsTable",
                        "StreamArn"
                      ]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "OrderProcessorLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/order-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "OrderProcessorLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "order-processor-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs20.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "OrderProcessorLambdaRole",
            "Arn"
          ]
        },
        "Timeout": 60,
        "MemorySize": 256,
        "Environment": {
          "Variables": {
            "ORDER_EVENTS_TABLE": {
              "Ref": "OrderEventsTable"
            },
            "AUDIT_BUCKET_NAME": {
              "Ref": "AuditLogsBucket"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "OrderAlertsTopic"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');",
                "const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');",
                "const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');",
                "",
                "const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });",
                "const s3Client = new S3Client({ region: process.env.AWS_REGION });",
                "const snsClient = new SNSClient({ region: process.env.AWS_REGION });",
                "",
                "exports.handler = async (event) => {",
                "  console.log('Processing order event:', JSON.stringify(event));",
                "  ",
                "  try {",
                "    // Process DynamoDB Stream events",
                "    for (const record of event.Records || []) {",
                "      if (record.eventSource === 'aws:dynamodb') {",
                "        await processDynamoDBRecord(record);",
                "      }",
                "    }",
                "    ",
                "    return {",
                "      statusCode: 200,",
                "      body: JSON.stringify({ message: 'Order processed successfully' })",
                "    };",
                "  } catch (error) {",
                "    console.error('Error processing order:', error);",
                "    ",
                "    // Send alert for failed processing",
                "    await snsClient.send(new PublishCommand({",
                "      TopicArn: process.env.SNS_TOPIC_ARN,",
                "      Subject: 'Order Processing Error',",
                "      Message: `Error processing order: ${error.message}`",
                "    }));",
                "    ",
                "    throw error;",
                "  }",
                "};",
                "",
                "async function processDynamoDBRecord(record) {",
                "  const orderId = record.dynamodb?.Keys?.orderId?.S;",
                "  const status = record.dynamodb?.NewImage?.status?.S;",
                "  const timestamp = Date.now();",
                "  ",
                "  // Create audit log",
                "  const auditLog = {",
                "    timestamp: new Date().toISOString(),",
                "    orderId: orderId,",
                "    eventName: record.eventName,",
                "    status: status,",
                "    record: record",
                "  };",
                "  ",
                "  // Save audit log to S3 with pattern: orders/{orderId}/{timestamp}.json",
                "  await s3Client.send(new PutObjectCommand({",
                "    Bucket: process.env.AUDIT_BUCKET_NAME,",
                "    Key: `orders/${orderId}/${timestamp}.json`,",
                "    Body: JSON.stringify(auditLog),",
                "    ContentType: 'application/json'",
                "  }));",
                "  ",
                "  // Send alert for FAILED orders",
                "  if (status === 'FAILED') {",
                "    await snsClient.send(new PublishCommand({",
                "      TopicArn: process.env.SNS_TOPIC_ARN,",
                "      Subject: 'Failed Order Alert',",
                "      Message: `Order ${orderId} has failed processing`",
                "    }));",
                "  }",
                "}"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "order-processor-lambda-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Order status change processing and audit logging"
          }
        ]
      }
    },
    "DynamoDBStreamEventSourceMapping": {
      "Type": "AWS::Lambda::EventSourceMapping",
      "Properties": {
        "EventSourceArn": {
          "Fn::GetAtt": [
            "OrderEventsTable",
            "StreamArn"
          ]
        },
        "FunctionName": {
          "Ref": "OrderProcessorLambda"
        },
        "StartingPosition": "LATEST",
        "BatchSize": 10,
        "MaximumBatchingWindowInSeconds": 5
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-error-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when Lambda error rate exceeds 5% over 5 minutes",
        "Metrics": [
          {
            "Id": "errors",
            "MetricStat": {
              "Metric": {
                "Namespace": "AWS/Lambda",
                "MetricName": "Errors",
                "Dimensions": [
                  {
                    "Name": "FunctionName",
                    "Value": {
                      "Ref": "OrderProcessorLambda"
                    }
                  }
                ]
              },
              "Period": 300,
              "Stat": "Sum"
            },
            "ReturnData": false
          },
          {
            "Id": "invocations",
            "MetricStat": {
              "Metric": {
                "Namespace": "AWS/Lambda",
                "MetricName": "Invocations",
                "Dimensions": [
                  {
                    "Name": "FunctionName",
                    "Value": {
                      "Ref": "OrderProcessorLambda"
                    }
                  }
                ]
              },
              "Period": 300,
              "Stat": "Sum"
            },
            "ReturnData": false
          },
          {
            "Id": "error_rate",
            "Expression": "(errors / invocations) * 100",
            "Label": "Error Rate (%)",
            "ReturnData": true
          }
        ],
        "ComparisonOperator": "GreaterThanThreshold",
        "Threshold": 5,
        "EvaluationPeriods": 1,
        "TreatMissingData": "notBreaching",
        "AlarmActions": [
          {
            "Ref": "OrderAlertsTopic"
          }
        ]
      }
    }
  },
  "Outputs": {
    "OrderEventsTableName": {
      "Description": "Name of the order events DynamoDB table",
      "Value": {
        "Ref": "OrderEventsTable"
      }
    },
    "OrderEventsTableArn": {
      "Description": "ARN of the order events DynamoDB table",
      "Value": {
        "Fn::GetAtt": [
          "OrderEventsTable",
          "Arn"
        ]
      }
    },
    "OrderEventsTableStreamArn": {
      "Description": "ARN of the order events DynamoDB table stream",
      "Value": {
        "Fn::GetAtt": [
          "OrderEventsTable",
          "StreamArn"
        ]
      }
    },
    "AuditLogsBucketName": {
      "Description": "Name of the audit logs S3 bucket",
      "Value": {
        "Ref": "AuditLogsBucket"
      }
    },
    "AuditLogsBucketArn": {
      "Description": "ARN of the audit logs S3 bucket",
      "Value": {
        "Fn::GetAtt": [
          "AuditLogsBucket",
          "Arn"
        ]
      }
    },
    "OrderProcessorLambdaName": {
      "Description": "Name of the order processor Lambda function",
      "Value": {
        "Ref": "OrderProcessorLambda"
      }
    },
    "OrderProcessorLambdaArn": {
      "Description": "ARN of the order processor Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "OrderProcessorLambda",
          "Arn"
        ]
      }
    },
    "OrderAlertsTopicArn": {
      "Description": "ARN of the order alerts SNS topic",
      "Value": {
        "Ref": "OrderAlertsTopic"
      }
    },
    "LambdaErrorAlarmName": {
      "Description": "Name of the Lambda error CloudWatch alarm",
      "Value": {
        "Ref": "LambdaErrorAlarm"
      }
    },
    "StackName": {
      "Description": "CloudFormation stack name",
      "Value": {
        "Ref": "AWS::StackName"
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for resource naming",
      "Value": {
        "Ref": "EnvironmentSuffix"
      }
    }
  }
}
```

## Key Implementation Details

### DynamoDB Table Configuration
- **Primary Key**: `orderId` (String, HASH key)
- **Sort Key**: `timestamp` (Number, RANGE key)
- **Global Secondary Index**: `status-timestamp-index` with `status` as partition key and `timestamp` as sort key
- **Billing Mode**: PAY_PER_REQUEST for automatic scaling
- **Point-in-Time Recovery**: Enabled for data protection
- **Streams**: NEW_AND_OLD_IMAGES for change data capture
- **Tags**: Name, Environment, and Purpose tags applied

### S3 Bucket Configuration
- **Encryption**: AES256 server-side encryption
- **Versioning**: Enabled for audit trail
- **Lifecycle Policy**: Automatic transition to Glacier storage class after 90 days
- **Public Access**: Completely blocked at all levels
- **Unique Naming**: Includes AccountId and Region for global uniqueness
- **Tags**: Name, Environment, and Purpose tags applied

### Lambda Function
- **Runtime**: nodejs20.x
- **Configuration**: 60-second timeout, 256 MB memory
- **Trigger**: DynamoDB Streams with batch size of 10
- **S3 Audit Logs**: Written with key pattern `orders/{orderId}/{timestamp}.json`
- **SNS Alerts**: Sent when order status is "FAILED"
- **Error Handling**: Comprehensive try-catch with error logging
- **Tags**: Name, Environment, and Purpose tags applied

### SNS Topic Configuration
- **Encryption**: KMS encryption using AWS managed key (alias/aws/sns)
- **Display Name**: "Order Processing Alerts"
- **Purpose**: Critical order failure notifications
- **Tags**: Name, Environment, and Purpose tags applied

### CloudWatch Alarm
- **Monitoring**: Lambda error rate using metric math expression
- **Threshold**: 5% error rate over 5-minute period
- **Calculation**: `(errors / invocations) * 100`
- **Actions**: Publishes to SNS topic when threshold exceeded
- **Missing Data**: Treated as not breaching

### IAM Permissions
The Lambda execution role includes:
- **DynamoDB**: Table operations (GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan)
- **DynamoDB GSI**: Access to Global Secondary Index
- **DynamoDB Streams**: Read permissions (DescribeStream, GetRecords, GetShardIterator, ListStreams)
- **S3**: Write operations (GetObject, PutObject, DeleteObject) scoped to audit bucket
- **SNS**: Publish permissions scoped to alerts topic
- **CloudWatch Logs**: Basic execution logging via AWSLambdaBasicExecutionRole

All IAM policies follow the principle of least privilege with resources scoped to specific ARNs.

### Resource Naming Convention
All resources use the pattern: `{resource-type}-${EnvironmentSuffix}`

This ensures:
- Clear resource identification
- Environment separation
- No naming conflicts across deployments
- Easy cleanup and management

### Security Features
- Encryption at rest for all services (DynamoDB default, S3 AES256, SNS KMS)
- All S3 public access blocked
- IAM policies scoped to specific resource ARNs
- CloudWatch log retention configured (7 days)
- No DeletionPolicy: Retain - infrastructure is fully destroyable
