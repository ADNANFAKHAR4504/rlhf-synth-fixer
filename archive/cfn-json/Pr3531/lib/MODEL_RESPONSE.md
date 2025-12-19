# Push Notification System Infrastructure

Here's the complete CloudFormation template for your push notification system:

## Main Stack Template (TapStack.json)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Push Notification System Infrastructure for Mobile Backend",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-zA-Z0-9]+$"
    },
    "APNSPlatformCredential": {
      "Type": "String",
      "NoEcho": true,
      "Description": "APNS Platform Credential (P8 key content)",
      "Default": "PLACEHOLDER_APNS_CREDENTIAL"
    },
    "APNSPlatformPrincipal": {
      "Type": "String",
      "NoEcho": true,
      "Description": "APNS Platform Principal (Key ID)",
      "Default": "PLACEHOLDER_APNS_PRINCIPAL"
    },
    "FCMServerKey": {
      "Type": "String",
      "NoEcho": true,
      "Description": "FCM Server Key for Android push notifications",
      "Default": "PLACEHOLDER_FCM_KEY"
    }
  },
  "Resources": {
    "DeviceTokensTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "DeviceTokens-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "userId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "deviceToken",
            "AttributeType": "S"
          },
          {
            "AttributeName": "platform",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "userId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "deviceToken",
            "KeyType": "RANGE"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "PlatformIndex",
            "KeySchema": [
              {
                "AttributeName": "platform",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
              "ReadCapacityUnits": 5,
              "WriteCapacityUnits": 5
            }
          }
        ],
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 10,
          "WriteCapacityUnits": 10
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
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
    "CampaignAnalyticsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "campaign-analytics-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldAnalytics",
              "Status": "Enabled",
              "ExpirationInDays": 90,
              "NoncurrentVersionExpirationInDays": 30
            },
            {
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "StorageClass": "STANDARD_IA",
                  "TransitionInDays": 30
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
    "DeadLetterQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "push-notifications-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600,
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
    "NotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "push-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "Push Notification Topic",
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
    "NotificationProcessorRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "notification-processor-role-${EnvironmentSuffix}"
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
            "PolicyName": "NotificationProcessorPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["DeviceTokensTable", "Arn"]
                    },
                    {
                      "Fn::Sub": "${DeviceTokensTable.Arn}/index/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish",
                    "sns:CreatePlatformEndpoint",
                    "sns:DeleteEndpoint",
                    "sns:GetEndpointAttributes",
                    "sns:SetEndpointAttributes"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage",
                    "sqs:GetQueueAttributes"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${CampaignAnalyticsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "mobiletargeting:SendMessages",
                    "mobiletargeting:SendUsersMessages",
                    "mobiletargeting:GetSegment",
                    "mobiletargeting:GetSegments"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:mobiletargeting:${AWS::Region}:${AWS::AccountId}:apps/${PinpointApp}/segments/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
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
    "NotificationProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/notification-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "NotificationProcessor": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "notification-processor-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["NotificationProcessorRole", "Arn"]
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "const AWS = require('aws-sdk');",
                "const sns = new AWS.SNS();",
                "const dynamodb = new AWS.DynamoDB.DocumentClient();",
                "const cloudwatch = new AWS.CloudWatch();",
                "const sqs = new AWS.SQS();",
                "",
                "const MAX_RETRIES = 3;",
                "const INITIAL_DELAY = 1000;",
                "",
                "async function sleep(ms) {",
                "  return new Promise(resolve => setTimeout(resolve, ms));",
                "}",
                "",
                "async function sendWithRetry(params, attempt = 1) {",
                "  try {",
                "    const result = await sns.publish(params).promise();",
                "    await cloudwatch.putMetricData({",
                "      Namespace: 'PushNotifications',",
                "      MetricData: [{",
                "        MetricName: 'SuccessfulDelivery',",
                "        Value: 1,",
                "        Unit: 'Count',",
                "        Timestamp: new Date()",
                "      }]",
                "    }).promise();",
                "    return result;",
                "  } catch (error) {",
                "    if (attempt < MAX_RETRIES) {",
                "      const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);",
                "      console.log(`Retry attempt ${attempt} after ${delay}ms`);",
                "      await sleep(delay);",
                "      return sendWithRetry(params, attempt + 1);",
                "    } else {",
                "      await cloudwatch.putMetricData({",
                "        Namespace: 'PushNotifications',",
                "        MetricData: [{",
                "          MetricName: 'FailedDelivery',",
                "          Value: 1,",
                "          Unit: 'Count',",
                "          Timestamp: new Date()",
                "        }]",
                "      }).promise();",
                "      const dlqUrl = process.env.DLQ_URL;",
                "      await sqs.sendMessage({",
                "        QueueUrl: dlqUrl,",
                "        MessageBody: JSON.stringify({",
                "          error: error.message,",
                "          params: params,",
                "          timestamp: new Date().toISOString()",
                "        })",
                "      }).promise();",
                "      throw error;",
                "    }",
                "  }",
                "}",
                "",
                "exports.handler = async (event) => {",
                "  console.log('Event:', JSON.stringify(event));",
                "  ",
                "  try {",
                "    const { userId, message, platform } = JSON.parse(event.Records[0].Sns.Message);",
                "    ",
                "    const deviceData = await dynamodb.get({",
                "      TableName: process.env.DEVICE_TABLE,",
                "      Key: { userId: userId }",
                "    }).promise();",
                "    ",
                "    if (!deviceData.Item) {",
                "      throw new Error('Device not found');",
                "    }",
                "    ",
                "    const params = {",
                "      Message: message,",
                "      TargetArn: deviceData.Item.endpointArn",
                "    };",
                "    ",
                "    await sendWithRetry(params);",
                "    ",
                "    return {",
                "      statusCode: 200,",
                "      body: JSON.stringify({ success: true })",
                "    };",
                "  } catch (error) {",
                "    console.error('Error:', error);",
                "    return {",
                "      statusCode: 500,",
                "      body: JSON.stringify({ error: error.message })",
                "    };",
                "  }",
                "};"
              ]
            ]
          }
        },
        "Environment": {
          "Variables": {
            "DEVICE_TABLE": {
              "Ref": "DeviceTokensTable"
            },
            "DLQ_URL": {
              "Ref": "DeadLetterQueue"
            },
            "PINPOINT_APP_ID": {
              "Ref": "PinpointApp"
            }
          }
        },
        "Timeout": 30,
        "MemorySize": 256,
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
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
    "NotificationTopicSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "Protocol": "lambda",
        "TopicArn": {
          "Ref": "NotificationTopic"
        },
        "Endpoint": {
          "Fn::GetAtt": ["NotificationProcessor", "Arn"]
        }
      }
    },
    "NotificationProcessorPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "NotificationProcessor"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "sns.amazonaws.com",
        "SourceArn": {
          "Ref": "NotificationTopic"
        }
      }
    },
    "PinpointApp": {
      "Type": "AWS::Pinpoint::App",
      "Properties": {
        "Name": {
          "Fn::Sub": "MobilePushApp-${EnvironmentSuffix}"
        },
        "Tags": {
          "Environment": {
            "Ref": "EnvironmentSuffix"
          }
        }
      }
    },
    "PinpointAPNSChannel": {
      "Type": "AWS::Pinpoint::APNSChannel",
      "Properties": {
        "ApplicationId": {
          "Ref": "PinpointApp"
        },
        "TokenKey": {
          "Ref": "APNSPlatformCredential"
        },
        "TokenKeyId": {
          "Ref": "APNSPlatformPrincipal"
        },
        "TeamId": "YOUR_TEAM_ID",
        "BundleId": "com.example.app"
      }
    },
    "PinpointGCMChannel": {
      "Type": "AWS::Pinpoint::GCMChannel",
      "Properties": {
        "ApplicationId": {
          "Ref": "PinpointApp"
        },
        "ApiKey": {
          "Ref": "FCMServerKey"
        },
        "Enabled": true
      }
    },
    "PinpointSegment": {
      "Type": "AWS::Pinpoint::Segment",
      "Properties": {
        "ApplicationId": {
          "Ref": "PinpointApp"
        },
        "Name": {
          "Fn::Sub": "AllUsers-${EnvironmentSuffix}"
        },
        "SegmentGroups": {
          "Include": "ALL"
        },
        "Tags": {
          "Environment": {
            "Ref": "EnvironmentSuffix"
          }
        }
      }
    },
    "SchedulerRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eventbridge-scheduler-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "scheduler.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "SchedulerPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "NotificationTopic"
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
    "DailyCampaignSchedule": {
      "Type": "AWS::Scheduler::Schedule",
      "Properties": {
        "Name": {
          "Fn::Sub": "daily-campaign-${EnvironmentSuffix}"
        },
        "Description": "Daily push notification campaign",
        "ScheduleExpression": "cron(0 10 * * ? *)",
        "FlexibleTimeWindow": {
          "Mode": "OFF"
        },
        "Target": {
          "Arn": {
            "Ref": "NotificationTopic"
          },
          "RoleArn": {
            "Fn::GetAtt": ["SchedulerRole", "Arn"]
          },
          "Input": {
            "Fn::Sub": "{\"campaign\":\"daily\",\"environment\":\"${EnvironmentSuffix}\"}"
          },
          "RetryPolicy": {
            "MaximumEventAge": 86400,
            "MaximumRetryAttempts": 3
          }
        },
        "State": "ENABLED"
      }
    },
    "EventBridgePipeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eventbridge-pipe-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "pipes.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "PipePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["DeviceTokensTable", "StreamArn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "NotificationTopic"
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
    "DynamoToSNSPipe": {
      "Type": "AWS::Pipes::Pipe",
      "Properties": {
        "Name": {
          "Fn::Sub": "dynamo-to-sns-${EnvironmentSuffix}"
        },
        "Description": "Pipe from DynamoDB streams to SNS for real-time updates",
        "RoleArn": {
          "Fn::GetAtt": ["EventBridgePipeRole", "Arn"]
        },
        "Source": {
          "Fn::GetAtt": ["DeviceTokensTable", "StreamArn"]
        },
        "SourceParameters": {
          "DynamoDBStreamParameters": {
            "StartingPosition": "LATEST",
            "BatchSize": 10,
            "MaximumBatchingWindowInSeconds": 5
          }
        },
        "Target": {
          "Ref": "NotificationTopic"
        },
        "Tags": {
          "Environment": {
            "Ref": "EnvironmentSuffix"
          }
        }
      }
    },
    "NotificationDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "PushNotifications-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"PushNotifications\",\"SuccessfulDelivery\",{\"stat\":\"Sum\"}],[\".\",\"FailedDelivery\",{\"stat\":\"Sum\"}]],\"period\":300,\"stat\":\"Sum\",\"region\":\"${AWS::Region}\",\"title\":\"Notification Delivery Metrics\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",{\"stat\":\"Sum\",\"dimensions\":{\"FunctionName\":\"notification-processor-${EnvironmentSuffix}\"}}],[\".\",\"Errors\",{\"stat\":\"Sum\",\"dimensions\":{\"FunctionName\":\"notification-processor-${EnvironmentSuffix}\"}}],[\".\",\"Duration\",{\"stat\":\"Average\",\"dimensions\":{\"FunctionName\":\"notification-processor-${EnvironmentSuffix}\"}}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"Lambda Performance\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/DynamoDB\",\"ConsumedReadCapacityUnits\",{\"dimensions\":{\"TableName\":\"DeviceTokens-${EnvironmentSuffix}\"}}],[\".\",\"ConsumedWriteCapacityUnits\",{\"dimensions\":{\"TableName\":\"DeviceTokens-${EnvironmentSuffix}\"}}]],\"period\":300,\"stat\":\"Sum\",\"region\":\"${AWS::Region}\",\"title\":\"DynamoDB Usage\"}}]}"
        }
      }
    },
    "SuccessAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "PushNotification-LowSuccessRate-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when push notification success rate drops below 90%",
        "MetricName": "SuccessfulDelivery",
        "Namespace": "PushNotifications",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 0.9,
        "ComparisonOperator": "LessThanThreshold",
        "TreatMissingData": "breaching"
      }
    }
  },
  "Outputs": {
    "NotificationTopicArn": {
      "Description": "ARN of the SNS notification topic",
      "Value": {
        "Ref": "NotificationTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NotificationTopicArn"
        }
      }
    },
    "DeviceTokensTableName": {
      "Description": "Name of the device tokens DynamoDB table",
      "Value": {
        "Ref": "DeviceTokensTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DeviceTokensTableName"
        }
      }
    },
    "DeviceTokensTableStreamArn": {
      "Description": "ARN of the DynamoDB stream",
      "Value": {
        "Fn::GetAtt": ["DeviceTokensTable", "StreamArn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DeviceTokensTableStreamArn"
        }
      }
    },
    "NotificationProcessorFunctionArn": {
      "Description": "ARN of the notification processor Lambda function",
      "Value": {
        "Fn::GetAtt": ["NotificationProcessor", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NotificationProcessorFunctionArn"
        }
      }
    },
    "CampaignAnalyticsBucketName": {
      "Description": "Name of the S3 bucket for campaign analytics",
      "Value": {
        "Ref": "CampaignAnalyticsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CampaignAnalyticsBucketName"
        }
      }
    },
    "PinpointAppId": {
      "Description": "Pinpoint Application ID",
      "Value": {
        "Ref": "PinpointApp"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PinpointAppId"
        }
      }
    },
    "DeadLetterQueueUrl": {
      "Description": "URL of the dead letter queue",
      "Value": {
        "Ref": "DeadLetterQueue"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DeadLetterQueueUrl"
        }
      }
    },
    "DashboardURL": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=PushNotifications-${EnvironmentSuffix}"
      }
    }
  }
}
```