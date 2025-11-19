# CloudFormation Infrastructure for Payment Webhook Processing System

This IDEAL_RESPONSE provides a complete CloudFormation JSON template for deploying a serverless payment webhook processing system with Lambda, DynamoDB, KMS encryption, and CloudWatch monitoring.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless payment webhook processing system with Lambda, DynamoDB, KMS encryption, and CloudWatch monitoring",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to enable parallel deployments",
      "MinLength": 1
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting Lambda environment variables and CloudWatch logs",
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
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {
                "Service": {
                  "Fn::Sub": "logs.${AWS::Region}.amazonaws.com"
                }
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*"
                  }
                }
              }
            },
            {
              "Sid": "Allow Lambda",
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
        }
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/webhook-processor-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "TransactionTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "transactions-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "transactionId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "transactionId",
            "KeyType": "HASH"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true
        }
      }
    },
    "WebhookLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/webhook-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "KMSKey",
            "Arn"
          ]
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "webhook-processor-role-${EnvironmentSuffix}"
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
            "PolicyName": "DynamoDBWritePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "TransactionTable",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "WebhookLogGroup",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "XRayPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
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
          },
          {
            "PolicyName": "KMSDecryptPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "KMSKey",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "WebhookProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "WebhookLogGroup",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "webhook-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndynamodb = boto3.resource('dynamodb')\ntable_name = os.environ['DYNAMODB_TABLE_NAME']\ntable = dynamodb.Table(table_name)\n\ndef handler(event, context):\n    \"\"\"\n    Process payment webhook events and store transaction data in DynamoDB.\n    \n    Expected event format:\n    {\n        \"transactionId\": \"txn_123456\",\n        \"amount\": 99.99,\n        \"currency\": \"USD\",\n        \"status\": \"completed\",\n        \"provider\": \"stripe\",\n        \"timestamp\": \"2025-01-15T10:30:00Z\"\n    }\n    \"\"\"\n    try:\n        logger.info(f\"Processing webhook event: {json.dumps(event)}\")\n        \n        # Extract transaction data from event\n        transaction_id = event.get('transactionId')\n        if not transaction_id:\n            raise ValueError(\"Missing required field: transactionId\")\n        \n        # Prepare transaction record\n        transaction_record = {\n            'transactionId': transaction_id,\n            'amount': event.get('amount', 0),\n            'currency': event.get('currency', 'USD'),\n            'status': event.get('status', 'unknown'),\n            'provider': event.get('provider', 'unknown'),\n            'timestamp': event.get('timestamp', datetime.utcnow().isoformat()),\n            'processedAt': datetime.utcnow().isoformat(),\n            'rawEvent': json.dumps(event)\n        }\n        \n        # Store transaction in DynamoDB\n        table.put_item(Item=transaction_record)\n        \n        logger.info(f\"Successfully processed transaction: {transaction_id}\")\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Transaction processed successfully',\n                'transactionId': transaction_id\n            })\n        }\n        \n    except Exception as e:\n        logger.error(f\"Error processing webhook: {str(e)}\", exc_info=True)\n        return {\n            'statusCode': 500,\n            'body': json.dumps({\n                'message': 'Error processing transaction',\n                'error': str(e)\n            })\n        }\n"
        },
        "MemorySize": 1024,
        "Timeout": 30,
        "Architectures": [
          "arm64"
        ],
        "TracingConfig": {
          "Mode": "Active"
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE_NAME": {
              "Ref": "TransactionTable"
            }
          }
        },
        "KmsKeyArn": {
          "Fn::GetAtt": [
            "KMSKey",
            "Arn"
          ]
        }
      }
    }
  },
  "Outputs": {
    "LambdaFunctionArn": {
      "Description": "ARN of the webhook processor Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "WebhookProcessorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaArn"
        }
      }
    },
    "DynamoDBTableName": {
      "Description": "Name of the DynamoDB transactions table",
      "Value": {
        "Ref": "TransactionTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TableName"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key used for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "LambdaFunctionName": {
      "Description": "Name of the webhook processor Lambda function",
      "Value": {
        "Ref": "WebhookProcessorFunction"
      }
    }
  }
}
```
