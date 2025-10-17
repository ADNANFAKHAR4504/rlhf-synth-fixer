# E-commerce Order Processing Monitoring System - CloudFormation Implementation

This infrastructure provides a complete monitoring solution for e-commerce order processing with automated audit logging and alerting capabilities.

## Architecture Overview

The system consists of:

- **DynamoDB Table**: Stores order events with DynamoDB Streams enabled for change data capture
- **S3 Bucket**: Stores audit logs with versioning and lifecycle policies
- **Lambda Function**: Processes DynamoDB stream events, writes audit logs to S3, and sends alerts
- **SNS Topic**: Delivers alerts for failed orders
- **CloudWatch Alarm**: Monitors Lambda error rate
- **IAM Role**: Provides least-privilege permissions for Lambda execution

## Infrastructure Code

### File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "E-commerce Order Processing Monitoring System",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    }
  },
  "Resources": {
    "OrderEventsTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
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
        "BillingMode": "PAY_PER_REQUEST",
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "DeletionProtectionEnabled": false,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "OrderProcessingMonitoring"
          }
        ]
      }
    },
    "AuditLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "order-audit-logs-${EnvironmentSuffix}"
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
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "OrderProcessingMonitoring"
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
        "KmsMasterKeyId": "alias/aws/sns",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "OrderProcessingMonitoring"
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
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:DescribeStream",
                    "dynamodb:ListStreams"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["OrderEventsTable", "StreamArn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                  "Resource": {
                    "Fn::Sub": "${AuditLogsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["sns:Publish"],
                  "Resource": {
                    "Ref": "OrderAlertsTopic"
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
          },
          {
            "Key": "Purpose",
            "Value": "OrderProcessingMonitoring"
          }
        ]
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
          "Fn::GetAtt": ["OrderProcessorLambdaRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "AUDIT_BUCKET_NAME": {
              "Ref": "AuditLogsBucket"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "OrderAlertsTopic"
            }
          }
        },
        "Code": {
          "ZipFile": "const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');\nconst { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');\n\nconst s3Client = new S3Client();\nconst snsClient = new SNSClient();\n\nconst AUDIT_BUCKET_NAME = process.env.AUDIT_BUCKET_NAME;\nconst SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;\n\nexports.handler = async (event) => {\n  console.log('Processing DynamoDB stream event:', JSON.stringify(event, null, 2));\n  \n  try {\n    for (const record of event.Records) {\n      if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {\n        const newImage = record.dynamodb.NewImage;\n        \n        const orderId = newImage.orderId?.S;\n        const status = newImage.status?.S;\n        const timestamp = newImage.timestamp?.N;\n        \n        if (!orderId || !timestamp) {\n          console.error('Missing required fields in record:', record);\n          continue;\n        }\n        \n        // Create audit log\n        const auditLog = {\n          orderId: orderId,\n          status: status || 'UNKNOWN',\n          timestamp: parseInt(timestamp),\n          eventType: record.eventName,\n          processedAt: new Date().toISOString()\n        };\n        \n        // Write to S3\n        const s3Key = `orders/${orderId}/${timestamp}.json`;\n        await s3Client.send(new PutObjectCommand({\n          Bucket: AUDIT_BUCKET_NAME,\n          Key: s3Key,\n          Body: JSON.stringify(auditLog, null, 2),\n          ContentType: 'application/json'\n        }));\n        \n        console.log(`Audit log written to S3: ${s3Key}`);\n        \n        // Send SNS alert for failed orders\n        if (status === 'FAILED') {\n          await snsClient.send(new PublishCommand({\n            TopicArn: SNS_TOPIC_ARN,\n            Subject: `Order Failed: ${orderId}`,\n            Message: JSON.stringify(auditLog, null, 2)\n          }));\n          \n          console.log(`Alert sent for failed order: ${orderId}`);\n        }\n      }\n    }\n    \n    return {\n      statusCode: 200,\n      body: JSON.stringify({ message: 'Processing complete' })\n    };\n  } catch (error) {\n    console.error('Error processing records:', error);\n    throw error;\n  }\n};"
        },
        "Timeout": 60,
        "MemorySize": 256,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "OrderProcessingMonitoring"
          }
        ]
      }
    },
    "LambdaEventSourceMapping": {
      "Type": "AWS::Lambda::EventSourceMapping",
      "Properties": {
        "EventSourceArn": {
          "Fn::GetAtt": ["OrderEventsTable", "StreamArn"]
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
          "Fn::Sub": "order-processor-errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda error rate exceeds 5%",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "OrderProcessorLambda"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "OrderAlertsTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/order-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    }
  },
  "Outputs": {
    "OrderEventsTableName": {
      "Description": "Name of the DynamoDB order events table",
      "Value": {
        "Ref": "OrderEventsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OrderEventsTableName"
        }
      }
    },
    "OrderEventsTableArn": {
      "Description": "ARN of the DynamoDB order events table",
      "Value": {
        "Fn::GetAtt": ["OrderEventsTable", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OrderEventsTableArn"
        }
      }
    },
    "OrderEventsTableStreamArn": {
      "Description": "Stream ARN of the DynamoDB order events table",
      "Value": {
        "Fn::GetAtt": ["OrderEventsTable", "StreamArn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OrderEventsTableStreamArn"
        }
      }
    },
    "AuditLogsBucketName": {
      "Description": "Name of the S3 audit logs bucket",
      "Value": {
        "Ref": "AuditLogsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuditLogsBucketName"
        }
      }
    },
    "AuditLogsBucketArn": {
      "Description": "ARN of the S3 audit logs bucket",
      "Value": {
        "Fn::GetAtt": ["AuditLogsBucket", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuditLogsBucketArn"
        }
      }
    },
    "OrderProcessorLambdaName": {
      "Description": "Name of the order processor Lambda function",
      "Value": {
        "Ref": "OrderProcessorLambda"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OrderProcessorLambdaName"
        }
      }
    },
    "OrderProcessorLambdaArn": {
      "Description": "ARN of the order processor Lambda function",
      "Value": {
        "Fn::GetAtt": ["OrderProcessorLambda", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OrderProcessorLambdaArn"
        }
      }
    },
    "OrderAlertsTopicArn": {
      "Description": "ARN of the SNS order alerts topic",
      "Value": {
        "Ref": "OrderAlertsTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OrderAlertsTopicArn"
        }
      }
    },
    "LambdaErrorAlarmName": {
      "Description": "Name of the CloudWatch alarm for Lambda errors",
      "Value": {
        "Ref": "LambdaErrorAlarm"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaErrorAlarmName"
        }
      }
    },
    "StackName": {
      "Description": "Name of this CloudFormation stack",
      "Value": {
        "Ref": "AWS::StackName"
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      }
    }
  }
}
```

## Key Features

1. **Serverless Architecture**: Uses DynamoDB on-demand billing and Lambda for cost-effective scaling
2. **Event-Driven Processing**: DynamoDB Streams automatically trigger Lambda on order changes
3. **Comprehensive Audit Trail**: All order events are logged to S3 with versioning
4. **Cost Optimization**: S3 lifecycle policy transitions old logs to Glacier after 90 days
5. **Security**: Encryption at rest for all data stores, least-privilege IAM policies, blocked public S3 access
6. **Monitoring**: CloudWatch alarm monitors Lambda errors with SNS alerting
7. **High Availability**: DynamoDB point-in-time recovery enabled, S3 versioning for data protection
8. **Environment Isolation**: All resources use environmentSuffix parameter for multi-environment deployments

## Deployment

Deploy to ap-southeast-1:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name order-monitoring-${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```
