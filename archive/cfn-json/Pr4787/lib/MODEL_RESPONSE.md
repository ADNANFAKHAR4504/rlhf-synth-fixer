```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless email notification system for job board platform",
  "Parameters": {
    "SenderEmail": {
      "Type": "String",
      "Description": "Verified SES email address for sending notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address format"
    }
  },
  "Resources": {
    "UserPreferencesTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
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
        "BillingMode": "PAY_PER_REQUEST",
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
        "BillingMode": "PAY_PER_REQUEST",
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
    "EmailNotificationLambdaRole": {
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
        "Policies": [
          {
            "PolicyName": "EmailNotificationLambdaPolicy",
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
                },
                {
                  "Effect": "Allow",
                  "Action": "s3:GetObject",
                  "Resource": {
                    "Fn::Sub": "${EmailTemplatesBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": "ses:SendEmail",
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
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "EmailNotificationLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["EmailNotificationLambdaRole", "Arn"]
        },
        "Timeout": 60,
        "MemorySize": 256,
        "Environment": {
          "Variables": {
            "USER_PREFERENCES_TABLE": {
              "Ref": "UserPreferencesTable"
            },
            "JOB_POSTINGS_TABLE": {
              "Ref": "JobPostingsTable"
            },
            "TEMPLATES_BUCKET": {
              "Ref": "EmailTemplatesBucket"
            },
            "SENDER_EMAIL": {
              "Ref": "SenderEmail"
            },
            "SES_CONFIGURATION_SET": {
              "Ref": "SESConfigurationSet"
            }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "const AWS = require('aws-sdk');",
                "const dynamodb = new AWS.DynamoDB.DocumentClient();",
                "const s3 = new AWS.S3();",
                "const ses = new AWS.SES({ region: 'us-east-2' });",
                "",
                "exports.handler = async (event) => {",
                "  try {",
                "    // Scan UserPreferences table",
                "    const userPreferences = await dynamodb.scan({",
                "      TableName: process.env.USER_PREFERENCES_TABLE",
                "    }).promise();",
                "    ",
                "    // Scan JobPostings table",
                "    const jobPostings = await dynamodb.scan({",
                "      TableName: process.env.JOB_POSTINGS_TABLE",
                "    }).promise();",
                "    ",
                "    // Fetch email template from S3",
                "    const templateData = await s3.getObject({",
                "      Bucket: process.env.TEMPLATES_BUCKET,",
                "      Key: 'notification-template.html'",
                "    }).promise();",
                "    ",
                "    const template = templateData.Body.toString('utf-8');",
                "    ",
                "    // Match jobs to users based on preferences",
                "    for (const user of userPreferences.Items) {",
                "      if (!user.keywords || !user.email) continue;",
                "      ",
                "      const matchedJobs = jobPostings.Items.filter(job => {",
                "        const jobText = `${job.title} ${job.description}`.toLowerCase();",
                "        return user.keywords.some(keyword => ",
                "          jobText.includes(keyword.toLowerCase())",
                "        );",
                "      });",
                "      ",
                "      if (matchedJobs.length > 0) {",
                "        // Prepare email content",
                "        const jobsList = matchedJobs.map(job => ",
                "          `<li><strong>${job.title}</strong>: ${job.description}</li>`",
                "        ).join('');",
                "        ",
                "        const htmlBody = template",
                "          .replace('{{userId}}', user.userId)",
                "          .replace('{{jobs}}', jobsList);",
                "        ",
                "        // Send email via SES",
                "        const params = {",
                "          Source: process.env.SENDER_EMAIL,",
                "          Destination: {",
                "            ToAddresses: [user.email]",
                "          },",
                "          Message: {",
                "            Subject: {",
                "              Data: 'Job Notifications - New Matches Found'",
                "            },",
                "            Body: {",
                "              Html: {",
                "                Data: htmlBody",
                "              }",
                "            }",
                "          },",
                "          ConfigurationSetName: process.env.SES_CONFIGURATION_SET",
                "        };",
                "        ",
                "        await ses.sendEmail(params).promise();",
                "        console.log(`Email sent to user ${user.userId}`);",
                "      }",
                "    }",
                "    ",
                "    return {",
                "      statusCode: 200,",
                "      body: JSON.stringify('Email notifications processed successfully')",
                "    };",
                "  } catch (error) {",
                "    console.error('Error processing notifications:', error);",
                "    throw error;",
                "  }",
                "};"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DailyScheduleRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Description": "Daily trigger for email notification lambda",
        "ScheduleExpression": "cron(0 12 * * ? *)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["EmailNotificationLambda", "Arn"]
            },
            "Id": "EmailNotificationLambdaTarget"
          }
        ]
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "EmailNotificationLambda"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["DailyScheduleRule", "Arn"]
        }
      }
    },
    "SESConfigurationSet": {
      "Type": "AWS::SES::ConfigurationSet",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ses-config-set"
        },
        "ReputationOptions": {
          "ReputationMetricsEnabled": true
        },
        "SendingOptions": {
          "SendingEnabled": true
        }
      }
    },
    "SESConfigurationSetEventDestination": {
      "Type": "AWS::SES::ConfigurationSetEventDestination",
      "Properties": {
        "ConfigurationSetName": {
          "Ref": "SESConfigurationSet"
        },
        "EventDestination": {
          "Name": "CloudWatchEventDestination",
          "Enabled": true,
          "CloudWatchDestination": {
            "DimensionConfigurations": [
              {
                "DimensionName": "MessageTag",
                "DimensionValueSource": "messageTag",
                "DefaultDimensionValue": "none"
              }
            ]
          },
          "MatchingEventTypes": [
            "send",
            "bounce",
            "complaint",
            "delivery",
            "reject"
          ]
        }
      }
    },
    "TemplateUploaderRole": {
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
            "PolicyName": "S3PutObjectPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:PutObject", "s3:DeleteObject"],
                  "Resource": {
                    "Fn::Sub": "${EmailTemplatesBucket.Arn}/*"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "TemplateUploaderFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Runtime": "python3.9",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["TemplateUploaderRole", "Arn"]
        },
        "Timeout": 30,
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import boto3",
                "import cfnresponse",
                "import json",
                "",
                "s3 = boto3.client('s3')",
                "",
                "def handler(event, context):",
                "    try:",
                "        bucket = event['ResourceProperties']['BucketName']",
                "        key = 'notification-template.html'",
                "        ",
                "        if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':",
                "            template_content = '''<!DOCTYPE html>",
                "<html>",
                "<head>",
                "    <title>Job Notifications</title>",
                "    <style>",
                "        body { font-family: Arial, sans-serif; }",
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }",
                "        h1 { color: #333; }",
                "        ul { list-style-type: none; padding: 0; }",
                "        li { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }",
                "    </style>",
                "</head>",
                "<body>",
                "    <div class=\"container\">",
                "        <h1>New Job Matches for User: {{userId}}</h1>",
                "        <p>We found the following jobs matching your preferences:</p>",
                "        <ul>{{jobs}}</ul>",
                "        <p>Best regards,<br>Job Board Team</p>",
                "    </div>",
                "</body>",
                "</html>'''",
                "            ",
                "            s3.put_object(",
                "                Bucket=bucket,",
                "                Key=key,",
                "                Body=template_content,",
                "                ContentType='text/html'",
                "            )",
                "            ",
                "        elif event['RequestType'] == 'Delete':",
                "            s3.delete_object(Bucket=bucket, Key=key)",
                "        ",
                "        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})",
                "    except Exception as e:",
                "        print(f'Error: {str(e)}')",
                "        cfnresponse.send(event, context, cfnresponse.FAILED, {})"
              ]
            ]
          }
        }
      }
    },
    "TemplateUploaderCustomResource": {
      "Type": "AWS::CloudFormation::CustomResource",
      "Properties": {
        "ServiceToken": {
          "Fn::GetAtt": ["TemplateUploaderFunction", "Arn"]
        },
        "BucketName": {
          "Ref": "EmailTemplatesBucket"
        }
      }
    }
  },
  "Outputs": {
    "UserPreferencesTable": {
      "Description": "Name of the UserPreferences DynamoDB table",
      "Value": {
        "Ref": "UserPreferencesTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-UserPreferencesTable"
        }
      }
    },
    "JobPostingsTable": {
      "Description": "Name of the JobPostings DynamoDB table",
      "Value": {
        "Ref": "JobPostingsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-JobPostingsTable"
        }
      }
    },
    "S3Bucket": {
      "Description": "Name of the S3 bucket for email templates",
      "Value": {
        "Ref": "EmailTemplatesBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EmailTemplatesBucket"
        }
      }
    },
    "LambdaFunctionARN": {
      "Description": "ARN of the email notification Lambda function",
      "Value": {
        "Fn::GetAtt": ["EmailNotificationLambda", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionARN"
        }
      }
    }
  }
}
```
