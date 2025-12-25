# CloudFormation Template for Cryptocurrency Price Alert System

This is a complete CloudFormation JSON template implementing a serverless cryptocurrency price alert system with DynamoDB, Lambda, SNS, KMS, and CloudWatch integration.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Cryptocurrency Price Alert System - Serverless architecture with DynamoDB, Lambda, SNS, and KMS encryption",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names to ensure uniqueness across deployments",
      "Default": "prod",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    }
  },
  "Resources": {
    "PriceAlertsKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "Customer-managed KMS key for encrypting Lambda environment variables",
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
              "Sid": "Allow Lambda to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": ["kms:Decrypt", "kms:DescribeKey"],
              "Resource": "*"
            },
            {
              "Sid": "Allow SNS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "sns.amazonaws.com"
              },
              "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Service",
            "Value": "PriceAlerts"
          }
        ]
      }
    },
    "PriceAlertsKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/price-alerts-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "PriceAlertsKMSKey"
        }
      }
    },
    "PriceAlertsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "PriceAlerts-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "userId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "alertId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "userId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "alertId",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Service",
            "Value": "PriceAlerts"
          }
        ]
      }
    },
    "PriceAlertNotificationsTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "PriceAlertNotifications-${EnvironmentSuffix}"
        },
        "KmsMasterKeyId": {
          "Ref": "PriceAlertsKMSKey"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Service",
            "Value": "PriceAlerts"
          }
        ]
      }
    },
    "ProcessPriceChecksLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/ProcessPriceChecks-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Service",
            "Value": "PriceAlerts"
          }
        ]
      }
    },
    "ProcessPriceChecksExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ProcessPriceChecksRole-${EnvironmentSuffix}"
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
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["PriceAlertsTable", "Arn"]
                  }
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
                  "Action": "sns:Publish",
                  "Resource": {
                    "Ref": "PriceAlertNotificationsTopic"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "KMSDecryptAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["kms:Decrypt", "kms:DescribeKey"],
                  "Resource": {
                    "Fn::GetAtt": ["PriceAlertsKMSKey", "Arn"]
                  }
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
                  "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
                  "Resource": {
                    "Fn::GetAtt": ["ProcessPriceChecksLogGroup", "Arn"]
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
          },
          {
            "Key": "Service",
            "Value": "PriceAlerts"
          }
        ]
      }
    },
    "ProcessPriceChecksFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "ProcessPriceChecksLogGroup",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "ProcessPriceChecks-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["ProcessPriceChecksExecutionRole", "Arn"]
        },
        "Architectures": ["arm64"],
        "MemorySize": 512,
        "Timeout": 60,
        "ReservedConcurrentExecutions": 100,
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n  console.log('Processing price check event:', JSON.stringify(event, null, 2));\n  \n  const AWS = require('aws-sdk');\n  const dynamodb = new AWS.DynamoDB.DocumentClient();\n  const sns = new AWS.SNS();\n  \n  const tableName = process.env.DYNAMODB_TABLE_NAME;\n  const snsTopicArn = process.env.SNS_TOPIC_ARN;\n  \n  try {\n    // Example: Query alerts for a specific user\n    const userId = event.userId || 'test-user';\n    const params = {\n      TableName: tableName,\n      KeyConditionExpression: 'userId = :userId',\n      ExpressionAttributeValues: {\n        ':userId': userId\n      }\n    };\n    \n    const result = await dynamodb.query(params).promise();\n    console.log(`Found ${result.Items.length} alerts for user ${userId}`);\n    \n    // Example: Send notification if price threshold is met\n    if (event.priceAlert && event.currentPrice >= event.priceAlert.targetPrice) {\n      const message = `Price alert triggered! ${event.priceAlert.cryptocurrency} reached ${event.currentPrice}`;\n      await sns.publish({\n        TopicArn: snsTopicArn,\n        Message: message,\n        Subject: 'Cryptocurrency Price Alert'\n      }).promise();\n      console.log('Notification sent:', message);\n    }\n    \n    return {\n      statusCode: 200,\n      body: JSON.stringify({\n        message: 'Price check processed successfully',\n        alertsChecked: result.Items.length\n      })\n    };\n  } catch (error) {\n    console.error('Error processing price check:', error);\n    throw error;\n  }\n};\n"
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE_NAME": {
              "Ref": "PriceAlertsTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "PriceAlertNotificationsTopic"
            },
            "KMS_KEY_ID": {
              "Ref": "PriceAlertsKMSKey"
            }
          }
        },
        "KmsKeyArn": {
          "Fn::GetAtt": ["PriceAlertsKMSKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Service",
            "Value": "PriceAlerts"
          }
        ]
      }
    }
  },
  "Outputs": {
    "LambdaFunctionArn": {
      "Description": "ARN of the ProcessPriceChecks Lambda function",
      "Value": {
        "Fn::GetAtt": ["ProcessPriceChecksFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "DynamoDBTableName": {
      "Description": "Name of the PriceAlerts DynamoDB table",
      "Value": {
        "Ref": "PriceAlertsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DynamoDBTableName"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of the PriceAlertNotifications SNS topic",
      "Value": {
        "Ref": "PriceAlertNotificationsTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "ARN of the customer-managed KMS key",
      "Value": {
        "Fn::GetAtt": ["PriceAlertsKMSKey", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyArn"
        }
      }
    },
    "LambdaExecutionRoleArn": {
      "Description": "ARN of the Lambda execution role",
      "Value": {
        "Fn::GetAtt": ["ProcessPriceChecksExecutionRole", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaExecutionRoleArn"
        }
      }
    }
  }
}
```

## Implementation Details

### Resources Created

1. **PriceAlertsKMSKey**: Customer-managed KMS key for encryption
   - Used for Lambda environment variable encryption
   - Used for SNS topic encryption
   - Proper key policy allowing Lambda and SNS services

2. **PriceAlertsTable**: DynamoDB table
   - Partition key: userId (String)
   - Sort key: alertId (String)
   - PAY_PER_REQUEST billing mode
   - Point-in-time recovery enabled

3. **PriceAlertNotificationsTopic**: SNS topic
   - Server-side encryption with KMS
   - Used for sending price alert notifications

4. **ProcessPriceChecksLogGroup**: CloudWatch Logs group
   - 30-day retention period
   - Pre-created to ensure proper permissions

5. **ProcessPriceChecksExecutionRole**: IAM role
   - Least privilege access
   - Explicit resource ARNs (no wildcards)
   - Separate policies for DynamoDB, SNS, KMS, and CloudWatch Logs

6. **ProcessPriceChecksFunction**: Lambda function
   - Node.js 22 runtime
   - ARM64 architecture (Graviton2)
   - 512MB memory
   - 100 reserved concurrent executions
   - Environment variables encrypted with KMS
   - Inline code for demonstration (replace with actual implementation)

### Key Features

- All resource names include EnvironmentSuffix parameter for uniqueness
- All resources tagged with Environment: Production and Service: PriceAlerts
- All IAM policies use explicit resource ARNs (no wildcards)
- Lambda environment variables encrypted with customer-managed KMS key
- SNS topic encrypted with customer-managed KMS key
- DynamoDB point-in-time recovery enabled
- CloudWatch Logs retention set to exactly 30 days
- Lambda reserved concurrent executions set to 100
- All resources use DeletionPolicy: Delete (default, destroyable)

### Deployment

Deploy using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name price-alerts-stack \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Update stack:

```bash
aws cloudformation update-stack \
  --stack-name price-alerts-stack \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Delete stack:

```bash
aws cloudformation delete-stack \
  --stack-name price-alerts-stack \
  --region us-east-1
```

### Testing

Test the Lambda function:

```bash
aws lambda invoke \
  --function-name ProcessPriceChecks-prod \
  --payload '{"userId": "test-user", "priceAlert": {"cryptocurrency": "BTC", "targetPrice": 50000}, "currentPrice": 51000}' \
  --region us-east-1 \
  output.json
```

Query DynamoDB table:

```bash
aws dynamodb query \
  --table-name PriceAlerts-prod \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"test-user"}}' \
  --region us-east-1
```

Publish to SNS topic:

```bash
aws sns publish \
  --topic-arn <SNS_TOPIC_ARN> \
  --message "Test price alert notification" \
  --subject "Test Alert" \
  --region us-east-1
```
