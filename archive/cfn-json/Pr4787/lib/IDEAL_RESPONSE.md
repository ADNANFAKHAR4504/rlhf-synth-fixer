```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Email Notification System for Job Board Platform",
  "Parameters": {
    "SenderEmail": {
      "Type": "String",
      "Description": "Verified SES email address for sending notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address",
      "Default": "test@example.com"
    }
  },
  "Resources": {
    "UserPreferencesTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "userId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "userId",
            "KeyType": "HASH"
          }
        ],
        "Tags": [
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "JobPostingsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "jobId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "jobId",
            "KeyType": "HASH"
          }
        ],
        "Tags": [
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "EmailTemplatesBucket": {
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
        "Tags": [
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
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
            "PolicyName": "DynamoDBScanPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "dynamodb:Scan",
                  "Resource": [
                    {
                      "Fn::GetAtt": ["UserPreferencesTable", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["JobPostingsTable", "Arn"]
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "S3GetObjectPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "s3:GetObject",
                  "Resource": {
                    "Fn::Sub": "${EmailTemplatesBucket.Arn}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SESSendEmailPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "ses:SendEmail",
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "NotificationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Runtime": "nodejs20.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');",
                "const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');",
                "const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');",
                "",
                "const dynamodb = new DynamoDBClient({ region: 'us-east-2' });",
                "const s3 = new S3Client({ region: 'us-east-2' });",
                "const ses = new SESClient({ region: 'us-east-2' });",
                "",
                "exports.handler = async (event) => {",
                "  try {",
                "    const usersResponse = await dynamodb.send(new ScanCommand({",
                "      TableName: process.env.USER_PREFERENCES_TABLE",
                "    }));",
                "",
                "    const jobsResponse = await dynamodb.send(new ScanCommand({",
                "      TableName: process.env.JOB_POSTINGS_TABLE",
                "    }));",
                "",
                "    const templateResponse = await s3.send(new GetObjectCommand({",
                "      Bucket: process.env.TEMPLATE_BUCKET,",
                "      Key: 'notification-template.html'",
                "    }));",
                "",
                "    const templateContent = await templateResponse.Body.transformToString();",
                "",
                "    const users = usersResponse.Items || [];",
                "    const jobs = jobsResponse.Items || [];",
                "",
                "    for (const user of users) {",
                "      const emailParams = {",
                "        Source: process.env.SENDER_EMAIL,",
                "        Destination: {",
                "          ToAddresses: [user.email?.S || 'test@example.com']",
                "        },",
                "        Message: {",
                "          Subject: {",
                "            Data: 'New Job Matches Available'",
                "          },",
                "          Body: {",
                "            Html: {",
                "              Data: templateContent",
                "            }",
                "          }",
                "        }",
                "      };",
                "",
                "      await ses.send(new SendEmailCommand(emailParams));",
                "    }",
                "    console.log('Notifications sent successfully');",
                "    return {",
                "      statusCode: 200,",
                "      body: JSON.stringify({ message: 'Notifications sent successfully' })",
                "    };",
                "  } catch (error) {",
                "    console.error('Error:', error);",
                "    throw error;",
                "  }",
                "};"
              ]
            ]
          }
        },
        "Environment": {
          "Variables": {
            "USER_PREFERENCES_TABLE": {
              "Ref": "UserPreferencesTable"
            },
            "JOB_POSTINGS_TABLE": {
              "Ref": "JobPostingsTable"
            },
            "TEMPLATE_BUCKET": {
              "Ref": "EmailTemplatesBucket"
            },
            "SENDER_EMAIL": {
              "Ref": "SenderEmail"
            }
          }
        },
        "Timeout": 300,
        "Tags": [
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "EventBridgeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Description": "Trigger notification Lambda function daily at 12 PM UTC",
        "ScheduleExpression": "cron(0 12 * * ? *)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["NotificationFunction", "Arn"]
            },
            "Id": "NotificationFunctionTarget"
          }
        ]
      }
    },
    "EventBridgeLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "NotificationFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["EventBridgeRule", "Arn"]
        }
      }
    },
    "SESConfigurationSet": {
      "Type": "AWS::SES::ConfigurationSet",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-email-config-set"
        }
      }
    },
    "SESEventDestination": {
      "Type": "AWS::SES::ConfigurationSetEventDestination",
      "Properties": {
        "ConfigurationSetName": {
          "Ref": "SESConfigurationSet"
        },
        "EventDestination": {
          "Name": "CloudWatchDestination",
          "Enabled": true,
          "MatchingEventTypes": ["send", "bounce", "complaint"],
          "CloudWatchDestination": {
            "DimensionConfigurations": [
              {
                "DimensionName": "ses:configuration-set",
                "DimensionValueSource": "messageTag",
                "DefaultDimensionValue": "default"
              }
            ]
          }
        }
      }
    }
  },
  "Outputs": {
    "UserPreferencesTable": {
      "Description": "Name of the UserPreferences DynamoDB table",
      "Value": {
        "Ref": "UserPreferencesTable"
      }
    },
    "JobPostingsTable": {
      "Description": "Name of the JobPostings DynamoDB table",
      "Value": {
        "Ref": "JobPostingsTable"
      }
    },
    "S3Bucket": {
      "Description": "Name of the S3 bucket for email templates",
      "Value": {
        "Ref": "EmailTemplatesBucket"
      }
    },
    "LambdaFunctionARN": {
      "Description": "ARN of the notification Lambda function",
      "Value": {
        "Fn::GetAtt": ["NotificationFunction", "Arn"]
      }
    }
  }
}
```
