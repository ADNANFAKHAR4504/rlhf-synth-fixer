# CloudFormation Template - Serverless Cryptocurrency Alert Processing System

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless cryptocurrency alert processing system with Lambda, DynamoDB, SNS, SQS, and CloudWatch",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to ensure uniqueness",
      "Default": "dev"
    },
    "AlertEmailAddress": {
      "Type": "String",
      "Description": "Email address for critical alert notifications",
      "Default": "alerts@example.com"
    }
  },
  "Resources": {
    "AlertsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "crypto-alerts-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "AlertId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "Timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "AlertId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "Timestamp",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true
        }
      },
      "DeletionPolicy": "Retain"
    },
    "CriticalAlertsTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "critical-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Critical Cryptocurrency Alerts"
      },
      "DeletionPolicy": "Delete"
    },
    "AlertEmailSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "Protocol": "email",
        "TopicArn": {
          "Ref": "CriticalAlertsTopic"
        },
        "Endpoint": {
          "Ref": "AlertEmailAddress"
        }
      }
    },
    "IngestionDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "alert-ingestion-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600
      },
      "DeletionPolicy": "Delete"
    },
    "ProcessingDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "alert-processing-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600
      },
      "DeletionPolicy": "Delete"
    },
    "IngestionFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "alert-ingestion-role-${EnvironmentSuffix}"
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
            "PolicyName": "IngestionFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "AlertsTable",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "IngestionDLQ",
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/alert-ingestion-${EnvironmentSuffix}:*"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "ProcessingFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "alert-processing-role-${EnvironmentSuffix}"
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
            "PolicyName": "ProcessingFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "AlertsTable",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "CriticalAlertsTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "ProcessingDLQ",
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/alert-processing-${EnvironmentSuffix}:*"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "IngestionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/alert-ingestion-${EnvironmentSuffix}"
        },
        "RetentionInDays": 3
      },
      "DeletionPolicy": "Delete"
    },
    "ProcessingLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/alert-processing-${EnvironmentSuffix}"
        },
        "RetentionInDays": 3
      },
      "DeletionPolicy": "Delete"
    },
    "AlertIngestionFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "alert-ingestion-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "IngestionFunctionRole",
            "Arn"
          ]
        },
        "Architectures": [
          "arm64"
        ],
        "ReservedConcurrentExecutions": 100,
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": [
              "IngestionDLQ",
              "Arn"
            ]
          }
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "AlertsTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "CriticalAlertsTopic"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport os\nimport boto3\nimport time\nfrom decimal import Decimal\n\ndynamodb = boto3.resource('dynamodb')\ntable_name = os.environ['TABLE_NAME']\ntable = dynamodb.Table(table_name)\n\ndef lambda_handler(event, context):\n    try:\n        # Parse incoming alert\n        alert_data = json.loads(event['body']) if 'body' in event else event\n        \n        alert_id = alert_data.get('alertId', f\"alert-{int(time.time() * 1000)}\")\n        timestamp = int(time.time() * 1000)\n        \n        # Store alert in DynamoDB\n        item = {\n            'AlertId': alert_id,\n            'Timestamp': timestamp,\n            'cryptocurrency': alert_data.get('cryptocurrency', 'BTC'),\n            'price': Decimal(str(alert_data.get('price', 0))),\n            'threshold': Decimal(str(alert_data.get('threshold', 0))),\n            'status': 'ingested'\n        }\n        \n        table.put_item(Item=item)\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Alert ingested successfully',\n                'alertId': alert_id,\n                'timestamp': timestamp\n            })\n        }\n    except Exception as e:\n        print(f\"Error ingesting alert: {str(e)}\")\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': str(e)})\n        }\n"
        }
      },
      "DependsOn": [
        "IngestionLogGroup"
      ],
      "DeletionPolicy": "Delete"
    },
    "AlertProcessingFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "alert-processing-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "ProcessingFunctionRole",
            "Arn"
          ]
        },
        "Architectures": [
          "arm64"
        ],
        "ReservedConcurrentExecutions": 100,
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": [
              "ProcessingDLQ",
              "Arn"
            ]
          }
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "AlertsTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "CriticalAlertsTopic"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport os\nimport boto3\nfrom decimal import Decimal\n\ndynamodb = boto3.resource('dynamodb')\nsns = boto3.client('sns')\n\ntable_name = os.environ['TABLE_NAME']\nsns_topic_arn = os.environ['SNS_TOPIC_ARN']\n\ntable = dynamodb.Table(table_name)\n\ndef lambda_handler(event, context):\n    try:\n        # Process alert from DynamoDB or direct invocation\n        for record in event.get('Records', [event]):\n            if isinstance(record, dict) and 'body' in record:\n                alert_data = json.loads(record['body'])\n            else:\n                alert_data = record\n            \n            alert_id = alert_data.get('alertId') or alert_data.get('AlertId')\n            price = float(alert_data.get('price', 0))\n            \n            # Update status in DynamoDB\n            if alert_id:\n                table.update_item(\n                    Key={\n                        'AlertId': alert_id,\n                        'Timestamp': int(alert_data.get('timestamp', alert_data.get('Timestamp', 0)))\n                    },\n                    UpdateExpression='SET #status = :status',\n                    ExpressionAttributeNames={'#status': 'status'},\n                    ExpressionAttributeValues={':status': 'processed'}\n                )\n            \n            # Send SNS notification for high-value alerts\n            if price > 1000:\n                cryptocurrency = alert_data.get('cryptocurrency', 'BTC')\n                message = f\"CRITICAL ALERT: {cryptocurrency} price alert triggered at ${price:.2f}\"\n                \n                sns.publish(\n                    TopicArn=sns_topic_arn,\n                    Subject=f\"Critical Alert: {cryptocurrency} Price\",\n                    Message=message\n                )\n                print(f\"Sent critical alert for {cryptocurrency} at ${price}\")\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({'message': 'Alerts processed successfully'})\n        }\n    except Exception as e:\n        print(f\"Error processing alert: {str(e)}\")\n        raise\n"
        }
      },
      "DependsOn": [
        "ProcessingLogGroup"
      ],
      "DeletionPolicy": "Delete"
    },
    "IngestionFunctionRetryConfig": {
      "Type": "AWS::Lambda::EventInvokeConfig",
      "Properties": {
        "FunctionName": {
          "Ref": "AlertIngestionFunction"
        },
        "Qualifier": "$LATEST",
        "MaximumRetryAttempts": 5,
        "DestinationConfig": {
          "OnFailure": {
            "Destination": {
              "Fn::GetAtt": [
                "IngestionDLQ",
                "Arn"
              ]
            }
          }
        }
      }
    },
    "ProcessingFunctionRetryConfig": {
      "Type": "AWS::Lambda::EventInvokeConfig",
      "Properties": {
        "FunctionName": {
          "Ref": "AlertProcessingFunction"
        },
        "Qualifier": "$LATEST",
        "MaximumRetryAttempts": 5,
        "DestinationConfig": {
          "OnFailure": {
            "Destination": {
              "Fn::GetAtt": [
                "ProcessingDLQ",
                "Arn"
              ]
            }
          }
        }
      }
    }
  },
  "Outputs": {
    "AlertIngestionFunctionArn": {
      "Description": "ARN of the Alert Ingestion Lambda Function",
      "Value": {
        "Fn::GetAtt": [
          "AlertIngestionFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-IngestionFunctionArn"
        }
      }
    },
    "AlertProcessingFunctionArn": {
      "Description": "ARN of the Alert Processing Lambda Function",
      "Value": {
        "Fn::GetAtt": [
          "AlertProcessingFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProcessingFunctionArn"
        }
      }
    },
    "AlertsTableName": {
      "Description": "Name of the DynamoDB Alerts Table",
      "Value": {
        "Ref": "AlertsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AlertsTableName"
        }
      }
    },
    "CriticalAlertsTopicArn": {
      "Description": "ARN of the Critical Alerts SNS Topic",
      "Value": {
        "Ref": "CriticalAlertsTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CriticalAlertsTopicArn"
        }
      }
    },
    "IngestionDLQUrl": {
      "Description": "URL of the Ingestion Dead Letter Queue",
      "Value": {
        "Ref": "IngestionDLQ"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-IngestionDLQUrl"
        }
      }
    },
    "ProcessingDLQUrl": {
      "Description": "URL of the Processing Dead Letter Queue",
      "Value": {
        "Ref": "ProcessingDLQ"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProcessingDLQUrl"
        }
      }
    }
  }
}
```

## Implementation Summary

This CloudFormation template implements a complete serverless cryptocurrency alert processing system with the following components:

### Lambda Functions
- **AlertIngestionFunction**: Receives incoming cryptocurrency alerts and stores them in DynamoDB
- **AlertProcessingFunction**: Processes stored alerts and sends SNS notifications for critical alerts (>$1000)
- Both functions use ARM64 architecture (Graviton2) for cost optimization
- Reserved concurrent executions set to 100 for each function
- Python 3.11 runtime with inline code

### DynamoDB Table
- **AlertsTable**: Stores alert history with AlertId (partition key) and Timestamp (sort key)
- Point-in-time recovery enabled
- Encryption at rest enabled
- Pay-per-request billing mode for variable workloads
- DeletionPolicy set to Retain to preserve data

### SNS Topic
- **CriticalAlertsTopic**: Sends email notifications for alerts above $1000
- Email subscription configured via parameter

### Dead Letter Queues
- **IngestionDLQ**: Captures failed ingestion function invocations
- **ProcessingDLQ**: Captures failed processing function invocations
- 14-day message retention period (1209600 seconds)
- 5 retry attempts configured via EventInvokeConfig

### CloudWatch Log Groups
- Separate log groups for each Lambda function
- 3-day retention period for cost optimization
- Automatic cleanup via DeletionPolicy

### IAM Roles
- Least-privilege IAM roles for each Lambda function
- No wildcard permissions
- Specific resource ARNs in all policies
- Separate policies for DynamoDB, SNS, SQS, and CloudWatch Logs access

### Outputs
- Lambda function ARNs (both ingestion and processing)
- DynamoDB table name
- SNS topic ARN
- Dead letter queue URLs

All resources follow the naming convention with environmentSuffix parameter for uniqueness across parallel deployments.
