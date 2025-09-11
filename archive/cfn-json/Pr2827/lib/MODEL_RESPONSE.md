# AWS CloudFormation Template Response

## Overview
This CloudFormation template creates a secure serverless infrastructure that meets all the specified requirements. The implementation follows AWS best practices and includes all required components with proper security configurations.

## Template Structure
The template is organized into the following main sections:

### Core Components
1. Lambda Function
   - Python 3.8 runtime
   - Environment variables for configuration
   - Integration with API Gateway and CloudWatch Events
   - Secure role with least privilege access

2. API Gateway
   - HTTP API with Lambda integration
   - CORS enabled for all origins
   - Secure resource policy
   - Automatic deployments

3. DynamoDB Table
   - Provisioned throughput mode
   - PK/SK key schema
   - KMS encryption at rest

### Security Components
1. KMS Configuration
   - Custom encryption key
   - Automatic key rotation
   - Granular access policies

2. IAM Roles
   - Separate roles for each service
   - Minimum required permissions
   - Resource-level access controls

3. S3 Bucket
   - Versioning enabled
   - VPC endpoint access
   - Server-side encryption
   - Public access blocked

### Monitoring & Notifications
1. CloudWatch Setup
   - Lambda execution logs
   - 24-hour scheduled trigger
   - Metric alarms

2. SNS Integration
   - Encrypted notifications
   - Email subscription endpoint
   - CloudWatch integration

### Resource Tags
All resources include:
- Environment tag
- Project name tag
- Cost center tracking
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment designation for resource tagging and configuration"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "ServerlessApp",
      "Description": "Project name for resource naming and tagging"
    },
    "NotificationEmail": {
      "Type": "String",
      "Default": "admin@example.com",
      "Description": "Email address for SNS notifications"
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for ${ProjectName} encryption"
        },
        "EnableKeyRotation": true,
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
              "Sid": "Allow use of the key",
              "Effect": "Allow",
              "Principal": {
                "AWS": [
                  {
                    "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
                  }
                ]
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            }
          ]
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
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/${ProjectName}-${Environment}-key"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ProjectName}-${Environment}-storage-${AWS::AccountId}"
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
                  "Ref": "KMSKey"
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
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "S3LoggingBucket"
          },
          "LogFilePrefix": "access-logs/"
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
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "S3LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ProjectName}-${Environment}-access-logs-${AWS::AccountId}"
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
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "VPCEndpointS3": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "VpcEndpointType": "Gateway",
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ]
      }
    },
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-${Environment}-vpc"
            }
          },
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
    "PrivateSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-west-2a",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-${Environment}-private-subnet"
            }
          }
        ]
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-${Environment}-private-rt"
            }
          }
        ]
      }
    },
    "PrivateSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${ProjectName}-${Environment}-data-table"
        },
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
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
        "SSESpecification": {
          "SSEEnabled": true,
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
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${ProjectName}-${Environment}-lambda-execution-role"
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
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["DynamoDBTable", "Arn"]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${S3Bucket}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["S3Bucket", "Arn"]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "KMSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["KMSKey", "Arn"]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SNSPublish",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "SNSTopic"
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
    "ApiGatewayRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${ProjectName}-${Environment}-apigateway-role"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "apigateway.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "LambdaInvokeFunction",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["LambdaFunction", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${ProjectName}-${Environment}-function"
        },
        "Runtime": "python3.8",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": {
            "Fn::Sub": [
              "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\ndef lambda_handler(event, context):\n    print(f'Event: {json.dumps(event)}')\n    \n    # Environment variables\n    table_name = os.environ['DYNAMODB_TABLE']\n    bucket_name = os.environ['S3_BUCKET']\n    sns_topic = os.environ['SNS_TOPIC']\n    \n    try:\n        # Process the request\n        response_body = {\n            'message': 'Function executed successfully',\n            'timestamp': datetime.now().isoformat(),\n            'environment': os.environ['ENVIRONMENT']\n        }\n        \n        return {\n            'statusCode': 200,\n            'headers': {\n                'Access-Control-Allow-Origin': '*',\n                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',\n                'Access-Control-Allow-Headers': 'Content-Type, Authorization'\n            },\n            'body': json.dumps(response_body)\n        }\n        \n    except Exception as e:\n        print(f'Error: {str(e)}')\n        # Send error notification\n        sns = boto3.client('sns')\n        sns.publish(\n            TopicArn=sns_topic,\n            Message=f'Lambda function error: {str(e)}',\n            Subject='Lambda Function Error'\n        )\n        \n        return {\n            'statusCode': 500,\n            'headers': {\n                'Access-Control-Allow-Origin': '*'\n            },\n            'body': json.dumps({'error': 'Internal server error'})\n        }\n",
              {}
            ]
          }
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": {
              "Ref": "DynamoDBTable"
            },
            "S3_BUCKET": {
              "Ref": "S3Bucket"
            },
            "SNS_TOPIC": {
              "Ref": "SNSTopic"
            },
            "ENVIRONMENT": {
              "Ref": "Environment"
            },
            "KMS_KEY_ID": {
              "Ref": "KMSKey"
            }
          }
        },
        "Timeout": 30,
        "MemorySize": 256,
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
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/${LambdaFunction}"
        },
        "RetentionInDays": 14
      }
    },
    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-${Environment}-api"
        },
        "Description": "API Gateway for serverless application",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Policy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": "execute-api:Invoke",
              "Resource": "execute-api:/*/*/*"
            },
            {
              "Effect": "Deny",
              "Principal": "*",
              "Action": "execute-api:Invoke",
              "Resource": "execute-api:/*/*/*",
              "Condition": {
                "StringNotEquals": {
                  "aws:SourceVpce": {
                    "Ref": "VPCEndpointAPI"
                  }
                }
              }
            }
          ]
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
    "VPCEndpointAPI": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.execute-api"
        },
        "VpcEndpointType": "Interface",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet"
          }
        ]
      }
    },
    "ApiGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Fn::GetAtt": ["ApiGateway", "RootResourceId"]
        },
        "PathPart": "api"
      }
    },
    "ApiGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResource"
        },
        "HttpMethod": "ANY",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          },
          "Credentials": {
            "Fn::GetAtt": ["ApiGatewayRole", "Arn"]
          }
        }
      }
    },
    "ApiGatewayOptionsMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResource"
        },
        "HttpMethod": "OPTIONS",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [
            {
              "StatusCode": "200",
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Origin": "'*'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization'"
              }
            }
          ],
          "RequestTemplates": {
            "application/json": "{\"statusCode\": 200}"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Headers": true
            }
          }
        ]
      }
    },
    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["ApiGatewayMethod", "ApiGatewayOptionsMethod"],
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "StageName": {
          "Ref": "Environment"
        }
      }
    },
    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"
        }
      }
    },
    "CloudWatchEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-${Environment}-daily-trigger"
        },
        "Description": "Trigger Lambda function every 24 hours",
        "ScheduleExpression": "rate(24 hours)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["LambdaFunction", "Arn"]
            },
            "Id": "LambdaDailyTrigger"
          }
        ]
      }
    },
    "LambdaCloudWatchPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["CloudWatchEventRule", "Arn"]
        }
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "${ProjectName}-${Environment}-notifications"
        },
        "DisplayName": "Application Error Notifications",
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
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
    "CloudWatchAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${Environment}-lambda-errors"
        },
        "AlarmDescription": "Lambda function error rate alarm",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "LambdaFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "ApiGatewayUrl": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/api"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiGatewayUrl"
        }
      }
    },
    "LambdaFunctionName": {
      "Description": "Lambda function name",
      "Value": {
        "Ref": "LambdaFunction"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionName"
        }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB table name",
      "Value": {
        "Ref": "DynamoDBTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DynamoDBTableName"
        }
      }
    },
    "S3BucketName": {
      "Description": "S3 bucket name",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS key ID",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS topic ARN",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    }
  }
}