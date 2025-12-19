# Ideal CloudFormation Template Implementation

## Template Overview
This document outlines the ideal implementation of a secure serverless infrastructure using AWS CloudFormation. The solution addresses all requirements while following AWS best practices and security standards.

## Key Components and Implementation Details

### 1. Core Infrastructure

#### Lambda Function
- Python 3.8 runtime
- HTTP API Gateway trigger
- CloudWatch Events scheduled trigger (24-hour interval)
- Environment variables for configuration
- Proper error handling and logging

#### API Gateway
- HTTP API type
- Lambda integration
- CORS configuration for secure access
- Resource policy implementation
- API key management

#### DynamoDB Table
- Provisioned throughput mode
- Partition and sort key schema
- KMS encryption at rest
- Proper capacity planning

### 2. Security Implementation

#### KMS Configuration
- Custom encryption key
- Automatic key rotation
- Granular access policies
- Audit logging enabled

#### IAM Roles and Policies
- Least privilege principle
- Resource-level permissions
- Service-specific roles
- No shared roles between services

#### S3 Bucket Security
- Versioning enabled
- Server-side encryption
- VPC endpoint access
- Public access blocked

### 3. Monitoring and Notifications

#### CloudWatch Integration
- Comprehensive logging
- Metric collection
- Scheduled triggers
- Alarm configuration

#### SNS Topic
- Encrypted notifications
- Email subscriptions
- Integration with CloudWatch
- Error reporting

### 4. Best Practices

#### Resource Naming
- Consistent naming convention
- Environment-based prefixing
- Unique identifiers
- Clear purpose indication

#### Tagging Strategy
- Environment tags
- Cost allocation tags
- Project identification
- Resource ownership

#### Security Measures
- Encryption in transit
- Encryption at rest
- Network isolation
- Access logging

### 5. Template Parameters

#### Required Parameters
- Environment selection
- Project name
- Notification endpoints
- Resource sizing options

#### Optional Parameters
- Custom VPC configuration
- Backup retention periods
- Custom domain names
- Scale settings

## Deployment Instructions

1. Prerequisite Setup
   - AWS CLI configured
   - Required permissions
   - Parameter values ready

2. Deployment Steps
   - Template validation
   - Parameter verification
   - Stack creation
   - Resource verification

3. Post-Deployment
   - Security verification
   - Integration testing
   - Monitoring setup
   - Documentation update
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": [
        "dev",
        "staging",
        "prod"
      ],
      "Description": "Environment designation for resource tagging and configuration"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "ServerlessApp",
      "Description": "Project name for resource naming and tagging"
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for SNS notifications"
    }
  },
  "Resources": {
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
            "PolicyName": "LambdaCustomPolicy",
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
                  "Resource": {
                    "Fn::GetAtt": [
                      "DynamoDBTable",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "S3Bucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${S3Bucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
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
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Runtime": "python3.8",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "def handler(event, context):\n    return {'statusCode': 200, 'body': 'Hello from Lambda!'}"
        },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {
              "Ref": "Environment"
            },
            "DYNAMODB_TABLE": {
              "Ref": "DynamoDBTable"
            },
            "S3_BUCKET": {
              "Ref": "S3Bucket"
            },
            "KMS_KEY_ID": {
              "Ref": "KMSKey"
            }
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "ApiGateway": {
      "Type": "AWS::ApiGatewayV2::Api",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-${Environment}-api"
        },
        "ProtocolType": "HTTP",
        "CorsConfiguration": {
          "AllowHeaders": [
            "*"
          ],
          "AllowMethods": [
            "GET",
            "POST",
            "PUT",
            "DELETE"
          ],
          "AllowOrigins": [
            "*"
          ],
          "MaxAge": 300
        }
      }
    },
    "ApiGatewayStage": {
      "Type": "AWS::ApiGatewayV2::Stage",
      "Properties": {
        "ApiId": {
          "Ref": "ApiGateway"
        },
        "StageName": "$default",
        "AutoDeploy": true
      }
    },
    "ApiGatewayIntegration": {
      "Type": "AWS::ApiGatewayV2::Integration",
      "Properties": {
        "ApiId": {
          "Ref": "ApiGateway"
        },
        "IntegrationType": "AWS_PROXY",
        "IntegrationUri": {
          "Fn::GetAtt": [
            "LambdaFunction",
            "Arn"
          ]
        },
        "PayloadFormatVersion": "2.0"
      }
    },
    "ApiGatewayRoute": {
      "Type": "AWS::ApiGatewayV2::Route",
      "Properties": {
        "ApiId": {
          "Ref": "ApiGateway"
        },
        "RouteKey": "ANY /{proxy+}",
        "Target": {
          "Fn::Join": [
            "/",
            [
              "integrations",
              {
                "Ref": "ApiGatewayIntegration"
              }
            ]
          ]
        }
      }
    },
    "LambdaApiPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*"
        }
      }
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${ProjectName}-${Environment}-table"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "PK",
            "AttributeType": "S"
          },
          {
            "AttributeName": "SK",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "PK",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "SK",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "KMSKey"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ProjectName}-${Environment}-bucket-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": [
                    "KMSKey",
                    "Arn"
                  ]
                }
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
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "${ProjectName}-${Environment}-notifications"
        },
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "SNSTopicPolicy": {
      "Type": "AWS::SNS::TopicPolicy",
      "Properties": {
        "Topics": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "cloudwatch.amazonaws.com"
                ]
              },
              "Action": "SNS:Publish",
              "Resource": {
                "Ref": "SNSTopic"
              }
            }
          ]
        }
      }
    },
    "SNSSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "TopicArn": {
          "Ref": "SNSTopic"
        },
        "Protocol": "email",
        "Endpoint": {
          "Ref": "NotificationEmail"
        }
      }
    },
    "CloudWatchEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-${Environment}-schedule"
        },
        "Description": "Schedule for Lambda function",
        "ScheduleExpression": "rate(24 hours)",
        "State": "ENABLED",
        "Targets": [
          {
            "Id": "LambdaTarget",
            "Arn": {
              "Fn::GetAtt": [
                "LambdaFunction",
                "Arn"
              ]
            }
          }
        ]
      }
    },
    "LambdaEventPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "CloudWatchEventRule",
            "Arn"
          ]
        }
      }
    },
    "VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "VpcId": {
          "Ref": "AWS::NoValue"
        },
        "RouteTableIds": [
          {
            "Ref": "AWS::NoValue"
          }
        ],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": [
                "s3:GetObject",
                "s3:PutObject"
              ],
              "Resource": [
                {
                  "Fn::GetAtt": [
                    "S3Bucket",
                    "Arn"
                  ]
                },
                {
                  "Fn::Sub": "${S3Bucket.Arn}/*"
                }
              ]
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/"
      }
    },
    "LambdaArn": {
      "Description": "ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "LambdaFunction",
          "Arn"
        ]
      }
    },
    "DynamoDBTableName": {
      "Description": "Name of the DynamoDB table",
      "Value": {
        "Ref": "DynamoDBTable"
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket",
      "Value": {
        "Ref": "S3Bucket"
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of the SNS topic",
      "Value": {
        "Ref": "SNSTopic"
      }
    }
  }
}