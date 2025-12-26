# CloudFormation Template for Serverless Infrastructure

This CloudFormation template implements a production-ready serverless infrastructure on AWS that handles HTTP requests and scheduled tasks. The template uses JSON format and deploys all resources in the us-west-1 region with comprehensive security, monitoring, and high availability.

## Architecture Overview

The infrastructure consists of:

- **Lambda Function**: Python 3.8 runtime that processes requests from both API Gateway and EventBridge scheduler
- **API Gateway HTTP API**: Low-latency HTTP endpoint with CORS enabled for all origins
- **DynamoDB Table**: NoSQL database with partition and sort keys using provisioned throughput
- **S3 Bucket**: Object storage with versioning and KMS encryption
- **VPC Configuration**: Private subnets across multiple availability zones with VPC endpoints
- **KMS Encryption**: Customer-managed key for encrypting all sensitive data
- **CloudWatch Monitoring**: Comprehensive logging and alarming across all services
- **SNS Notifications**: Error alerting via SNS topic
- **EventBridge Scheduler**: Triggers Lambda function every 24 hours

## Template Structure

### Parameters

**EnvironmentSuffix**: String parameter for environment naming (default: "dev"). Must contain only lowercase alphanumeric characters to ensure compatibility with S3 bucket naming requirements.

### Resources

#### Encryption and Security

**KMSKey**: Customer-managed KMS key that encrypts DynamoDB, S3, SNS, CloudWatch Logs, and SQS. The key policy allows the account root full permissions and grants CloudWatch Logs service permission to encrypt log data with proper encryption context conditions.

**KMSKeyAlias**: User-friendly alias for the KMS key using the stack name for uniqueness.

#### Networking

**VPC**: Virtual Private Cloud with 10.0.0.0/16 CIDR block, DNS hostnames and DNS support enabled for proper service resolution within the VPC.

**VPCFlowLogsRole**: IAM role that allows VPC Flow Logs service to write logs to CloudWatch Logs.

**VPCFlowLogsLogGroup**: CloudWatch log group for VPC flow logs with 30-day retention and KMS encryption.

**VPCFlowLogs**: Flow logs configuration capturing all traffic (accepted and rejected) for security monitoring and troubleshooting.

**PrivateSubnet1** and **PrivateSubnet2**: Two private subnets in different availability zones (10.0.1.0/24 and 10.0.2.0/24) for high availability. Lambda functions are deployed across both subnets to ensure failover capability.

**RouteTable**: Route table associated with both private subnets.

**SubnetRouteTableAssociation1** and **SubnetRouteTableAssociation2**: Associate each private subnet with the route table.

**S3VPCEndpoint**: Gateway VPC endpoint for S3 that allows Lambda to access S3 without internet gateway or NAT gateway. The endpoint policy restricts access to only the S3 bucket created in this stack, allowing GetObject, GetObjectVersion, ListBucket, and HeadObject operations.

**DynamoDBVPCEndpoint**: Gateway VPC endpoint for DynamoDB that allows Lambda to access DynamoDB tables without leaving the AWS network. The policy restricts access to the specific DynamoDB table created in this stack.

**LambdaSecurityGroup**: Security group for Lambda function with egress rule allowing HTTPS (port 443) to AWS services.

#### Storage

**S3Bucket**: S3 bucket with versioning enabled for all objects. Encryption uses customer-managed KMS key with bucket key enabled for cost optimization. Public access is completely blocked. Lifecycle policy automatically deletes noncurrent versions after 90 days to manage storage costs. Bucket name uses lowercase prefix "tapstack" with environment suffix and account ID to ensure global uniqueness and comply with S3 naming requirements (lowercase only).

**DynamoDBTable**: DynamoDB table with partition key "partitionKey" (String) and sort key "sortKey" (String). Uses provisioned billing mode with 5 read capacity units and 5 write capacity units as required. KMS encryption enabled using customer-managed key. Point-in-time recovery enabled for data protection.

#### Messaging and Queuing

**DeadLetterQueue**: SQS queue that captures failed Lambda invocations from asynchronous triggers like EventBridge. Messages are retained for 14 days (maximum). Queue is encrypted with customer-managed KMS key.

**SNSTopic**: SNS topic for error notifications from Lambda function and CloudWatch alarms. Encrypted with customer-managed KMS key.

**SNSTopicPolicy**: Resource-based policy on SNS topic that allows Lambda service to publish messages (with source ARN condition limiting to this specific Lambda function) and CloudWatch alarms to publish notifications. This provides defense-in-depth security with both IAM and resource policies.

#### Lambda Function

**LambdaExecutionRole**: IAM role for Lambda with AWSLambdaVPCAccessExecutionRole managed policy for VPC networking (creates ENIs, describes subnets and security groups). Inline policy grants least-privilege permissions:
- CreateLogStream and PutLogEvents on the specific log group (no CreateLogGroup permission since log group is pre-created)
- GetItem, PutItem, Query, Scan on the specific DynamoDB table
- GetObject, GetObjectVersion, ListBucket on the specific S3 bucket
- Publish to the specific SNS topic
- Decrypt, GenerateDataKey, DescribeKey for the specific KMS key
- SendMessage to the specific Dead Letter Queue

**LambdaLogGroup**: CloudWatch log group created before the Lambda function to prevent race conditions. Retention is 30 days with KMS encryption enabled.

**LambdaFunction**: Lambda function with Python 3.13 runtime. The function is deployed in both private subnets for high availability. The dependency on the log group is automatically enforced through the LoggingConfig reference. The inline code:
- Imports boto3 for AWS SDK, json for data handling, os for environment variables, datetime for timestamps
- Creates DynamoDB resource, S3 client, and SNS client
- Reads environment variables for table name, bucket name, and SNS topic ARN
- Logs incoming events to CloudWatch
- Writes event data to DynamoDB with partition key "request" and sort key as current UTC timestamp
- Detects event source: if requestContext exists (API Gateway HTTP API format), returns HTTP response with 200 status code and CORS headers; otherwise returns plain response for EventBridge
- Error handling: prints error, publishes to SNS topic with function name and error details, then re-raises exception

Environment variables pass DynamoDB table name, S3 bucket name, and SNS topic ARN. VPC configuration includes security group and both private subnets. Dead letter queue captures failed invocations. Reserved concurrent executions is 10 to prevent runaway scaling. Timeout is 30 seconds with 256 MB memory.

#### API Gateway HTTP API

**HttpApi**: API Gateway HTTP API (AWS::ApiGatewayV2::Api) which is the correct resource type for HTTP APIs (not REST APIs). Protocol type is HTTP. CORS configuration allows all origins (*), GET/POST/OPTIONS methods, standard headers, with 300-second max age for preflight caching.

**HttpApiLogGroup**: CloudWatch log group for API Gateway access logs with 30-day retention and KMS encryption.

**HttpApiStage**: Default stage ($default) with auto-deploy enabled. Access logs are sent to the log group with custom format capturing request ID and error details. Default route settings enable detailed metrics with throttling limits (100 burst, 50 rate per second).

**HttpApiIntegration**: Lambda proxy integration using payload format version 2.0 (HTTP API format, not REST API format). Integration method is POST to invoke the Lambda function.

**HttpApiRoutePost** and **HttpApiRouteGet**: Routes for POST /process and GET /process that target the Lambda integration.

**LambdaApiGatewayPermission**: Resource-based permission allowing API Gateway service to invoke the Lambda function, scoped to the specific HTTP API.

#### EventBridge Scheduler

**EventBridgeScheduleRule**: EventBridge rule that triggers the Lambda function every 24 hours using rate expression. State is ENABLED. Uses default event bus.

**LambdaSchedulePermission**: Permission allowing EventBridge service to invoke Lambda function, scoped to the specific rule ARN.

#### CloudWatch Alarms

**LambdaErrorAlarm**: CloudWatch alarm monitoring Lambda Errors metric. Triggers when sum of errors is greater than or equal to 1 in a 5-minute period. Sends notification to SNS topic. Treats missing data as not breaching (function not invoked).

**DynamoDBReadThrottleAlarm**: CloudWatch alarm monitoring DynamoDB ReadThrottleEvents metric. Triggers when sum is greater than 1 in a 5-minute period, indicating capacity needs adjustment. Sends notification to SNS topic.

### Outputs

The template exports the following outputs with stack name prefix for cross-stack references:

- **HttpApiEndpoint**: Full URL to invoke the HTTP API /process endpoint
- **LambdaFunctionArn**: ARN of the Lambda function
- **LambdaFunctionName**: Physical name of the Lambda function
- **DynamoDBTableName**: Physical name of the DynamoDB table
- **DynamoDBTableArn**: ARN of the DynamoDB table
- **S3BucketName**: Physical name of the S3 bucket
- **S3BucketArn**: ARN of the S3 bucket
- **SNSTopicArn**: ARN of the SNS topic for notifications
- **KMSKeyId**: Key ID of the KMS key
- **KMSKeyArn**: ARN of the KMS key
- **VPCId**: ID of the VPC
- **S3VPCEndpointId**: ID of the S3 VPC endpoint

## Key Design Decisions

**Multi-AZ High Availability**: Lambda function is deployed across two availability zones via two private subnets, ensuring the application remains available if one AZ fails.

**VPC Endpoints Instead of NAT Gateway**: The template uses VPC gateway endpoints for S3 and DynamoDB rather than a NAT gateway. This is more cost-effective and provides better performance since traffic stays on the AWS network. Gateway endpoints are free and have no data transfer charges.

**No Hardcoded Resource Names**: All resource names use CloudFormation intrinsic functions like Ref and Fn::Sub with AWS::StackName to ensure uniqueness. This allows multiple stack deployments in the same account/region without naming conflicts.

**Lowercase Parameter Constraint**: The EnvironmentSuffix parameter enforces lowercase alphanumeric characters only, ensuring S3 bucket names comply with AWS naming rules.

**Separate Log Groups**: CloudWatch log groups are created as separate resources before Lambda and API Gateway, ensuring proper KMS encryption and preventing automatic creation with default settings.

**Dead Letter Queue**: SQS queue captures failed asynchronous Lambda invocations from EventBridge scheduler, providing visibility into failures and enabling message replay.

**Reserved Concurrent Executions**: Lambda has a limit of 10 concurrent executions to prevent unlimited scaling and unexpected costs.

**Lifecycle Policy on S3**: With versioning enabled, old object versions are automatically expired after 90 days to prevent unbounded storage growth.

**Point-in-Time Recovery**: DynamoDB table has PITR enabled, allowing restoration to any point within the last 35 days.

**Comprehensive Tagging**: All resources are tagged with Environment (from parameter) and Project for cost allocation, resource filtering, and organizational purposes.

**Defense-in-Depth Security**: Uses both IAM policies and resource-based policies (SNS topic policy, VPC endpoint policies) for multiple layers of access control.

**CloudWatch Logs Encryption**: All log groups use customer-managed KMS key with proper key policy allowing CloudWatch Logs service to encrypt data.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless infrastructure with Lambda, API Gateway HTTP API, DynamoDB, S3, KMS encryption, and comprehensive monitoring",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["EnvironmentSuffix"]
        }
      ],
      "ParameterLabels": {
        "EnvironmentSuffix": {
          "default": "Environment Suffix"
        }
      }
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-z0-9]+$",
      "ConstraintDescription": "Must contain only lowercase alphanumeric characters"
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting DynamoDB, S3, SNS, and CloudWatch Logs",
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
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/${AWS::StackName}-kms-key"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
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
              "Fn::Sub": "${AWS::StackName}-vpc"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "vpc-flow-logs.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudWatchLogPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["VPCFlowLogsLogGroup", "Arn"]
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
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "VPCFlowLogsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/${AWS::StackName}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["KMSKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "VPCFlowLogs": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {
          "Ref": "VPC"
        },
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {
          "Ref": "VPCFlowLogsLogGroup"
        },
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": ["VPCFlowLogsRole", "Arn"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [0, { "Fn::GetAZs": "" }]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-private-subnet-1"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [1, { "Fn::GetAZs": "" }]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-private-subnet-2"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "RouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-route-table"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "SubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "RouteTable"
        }
      }
    },
    "SubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "RouteTable"
        }
      }
    },
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "RouteTableIds": [
          {
            "Ref": "RouteTable"
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
                "s3:GetObjectVersion",
                "s3:ListBucket",
                "s3:HeadObject"
              ],
              "Resource": [
                {
                  "Fn::Sub": "${S3Bucket.Arn}"
                },
                {
                  "Fn::Sub": "${S3Bucket.Arn}/*"
                }
              ]
            }
          ]
        }
      }
    },
    "DynamoDBVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.dynamodb"
        },
        "RouteTableIds": [
          {
            "Ref": "RouteTable"
          }
        ],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
              ],
              "Resource": [
                {
                  "Fn::GetAtt": ["DynamoDBTable", "Arn"]
                },
                {
                  "Fn::Sub": "${DynamoDBTable.Arn}/index/*"
                }
              ]
            }
          ]
        }
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda function",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS outbound to AWS services"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-lambda-sg"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "tapstack-${EnvironmentSuffix}-data-${AWS::AccountId}"
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
              },
              "BucketKeyEnabled": true
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
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
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
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "AttributeDefinitions": [
          {
            "AttributeName": "partitionKey",
            "AttributeType": "S"
          },
          {
            "AttributeName": "sortKey",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "partitionKey",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "sortKey",
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
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "DeadLetterQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "${AWS::StackName}-lambda-dlq"
        },
        "MessageRetentionPeriod": 1209600,
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "DisplayName": "Lambda Error Notifications",
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
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
              "Sid": "AllowLambdaPublish",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sns:Publish",
              "Resource": {
                "Ref": "SNSTopic"
              },
              "Condition": {
                "ArnLike": {
                  "aws:SourceArn": {
                    "Fn::GetAtt": ["LambdaFunction", "Arn"]
                  }
                }
              }
            },
            {
              "Sid": "AllowCloudWatchAlarms",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudwatch.amazonaws.com"
              },
              "Action": "sns:Publish",
              "Resource": {
                "Ref": "SNSTopic"
              }
            }
          ]
        }
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaExecutionPolicy",
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
                    "Fn::GetAtt": ["LambdaLogGroup", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["DynamoDBTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["S3Bucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${S3Bucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": ["sns:Publish"],
                  "Resource": {
                    "Ref": "SNSTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["KMSKey", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["sqs:SendMessage"],
                  "Resource": {
                    "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
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
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["KMSKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Runtime": "python3.13",
        "Handler": "index.lambda_handler",
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import boto3",
                "import os",
                "from datetime import datetime",
                "",
                "dynamodb = boto3.resource('dynamodb')",
                "s3 = boto3.client('s3')",
                "sns = boto3.client('sns')",
                "",
                "def lambda_handler(event, context):",
                "    try:",
                "        table_name = os.environ.get('DYNAMODB_TABLE_NAME')",
                "        bucket_name = os.environ.get('S3_BUCKET_NAME')",
                "        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')",
                "        ",
                "        print(f'Received event: {json.dumps(event)}')",
                "        ",
                "        table = dynamodb.Table(table_name)",
                "        table.put_item(",
                "            Item={",
                "                'partitionKey': 'request',",
                "                'sortKey': datetime.utcnow().isoformat(),",
                "                'event': json.dumps(event)",
                "            }",
                "        )",
                "        ",
                "        if 'requestContext' in event:",
                "            response = {",
                "                'statusCode': 200,",
                "                'headers': {",
                "                    'Access-Control-Allow-Origin': '*',",
                "                    'Access-Control-Allow-Headers': 'Content-Type',",
                "                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'",
                "                },",
                "                'body': json.dumps({",
                "                    'message': 'Request processed successfully',",
                "                    'timestamp': datetime.utcnow().isoformat()",
                "                })",
                "            }",
                "        else:",
                "            response = {",
                "                'message': 'Scheduled task completed',",
                "                'timestamp': datetime.utcnow().isoformat()",
                "            }",
                "        ",
                "        return response",
                "        ",
                "    except Exception as e:",
                "        print(f'Error: {str(e)}')",
                "        if sns_topic_arn:",
                "            sns.publish(",
                "                TopicArn=sns_topic_arn,",
                "                Subject='Lambda Function Error',",
                "                Message=f'Error in {context.function_name}: {str(e)}'",
                "            )",
                "        raise e"
              ]
            ]
          }
        },
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "LoggingConfig": {
          "LogGroup": {
            "Ref": "LambdaLogGroup"
          }
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE_NAME": {
              "Ref": "DynamoDBTable"
            },
            "S3_BUCKET_NAME": {
              "Ref": "S3Bucket"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "SNSTopic"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ]
        },
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
          }
        },
        "ReservedConcurrentExecutions": 10,
        "Timeout": 30,
        "MemorySize": 256,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "HttpApi": {
      "Type": "AWS::ApiGatewayV2::Api",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-http-api"
        },
        "Description": "HTTP API for Lambda function with CORS enabled",
        "ProtocolType": "HTTP",
        "CorsConfiguration": {
          "AllowOrigins": ["*"],
          "AllowMethods": ["GET", "POST", "OPTIONS"],
          "AllowHeaders": ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"],
          "MaxAge": 300
        },
        "Tags": {
          "Environment": {
            "Ref": "EnvironmentSuffix"
          },
          "Project": "ServerlessApp"
        }
      }
    },
    "HttpApiLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/${AWS::StackName}-http-api"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["KMSKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessApp"
          }
        ]
      }
    },
    "HttpApiStage": {
      "Type": "AWS::ApiGatewayV2::Stage",
      "Properties": {
        "ApiId": {
          "Ref": "HttpApi"
        },
        "StageName": "$default",
        "AutoDeploy": true,
        "AccessLogSettings": {
          "DestinationArn": {
            "Fn::GetAtt": ["HttpApiLogGroup", "Arn"]
          },
          "Format": "$context.requestId $context.error.message $context.error.messageString"
        },
        "DefaultRouteSettings": {
          "DetailedMetricsEnabled": true,
          "ThrottlingBurstLimit": 100,
          "ThrottlingRateLimit": 50
        },
        "Tags": {
          "Environment": {
            "Ref": "EnvironmentSuffix"
          },
          "Project": "ServerlessApp"
        }
      }
    },
    "HttpApiIntegration": {
      "Type": "AWS::ApiGatewayV2::Integration",
      "Properties": {
        "ApiId": {
          "Ref": "HttpApi"
        },
        "IntegrationType": "AWS_PROXY",
        "IntegrationUri": {
          "Fn::GetAtt": ["LambdaFunction", "Arn"]
        },
        "IntegrationMethod": "POST",
        "PayloadFormatVersion": "2.0"
      }
    },
    "HttpApiRoutePost": {
      "Type": "AWS::ApiGatewayV2::Route",
      "Properties": {
        "ApiId": {
          "Ref": "HttpApi"
        },
        "RouteKey": "POST /process",
        "Target": {
          "Fn::Sub": "integrations/${HttpApiIntegration}"
        }
      }
    },
    "HttpApiRouteGet": {
      "Type": "AWS::ApiGatewayV2::Route",
      "Properties": {
        "ApiId": {
          "Ref": "HttpApi"
        },
        "RouteKey": "GET /process",
        "Target": {
          "Fn::Sub": "integrations/${HttpApiIntegration}"
        }
      }
    },
    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${HttpApi}/*/*"
        }
      }
    },
    "EventBridgeScheduleRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Description": "Trigger Lambda function every 24 hours",
        "ScheduleExpression": "rate(24 hours)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["LambdaFunction", "Arn"]
            },
            "Id": "LambdaFunctionTarget"
          }
        ],
        "EventBusName": "default"
      }
    },
    "LambdaSchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["EventBridgeScheduleRule", "Arn"]
        }
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${AWS::StackName}-lambda-errors"
        },
        "AlarmDescription": "Alert on Lambda function errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
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
    },
    "DynamoDBReadThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${AWS::StackName}-dynamodb-read-throttle"
        },
        "AlarmDescription": "Alert on DynamoDB read throttles",
        "MetricName": "ReadThrottleEvents",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {
              "Ref": "DynamoDBTable"
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
    "HttpApiEndpoint": {
      "Description": "HTTP API endpoint URL",
      "Value": {
        "Fn::Sub": "https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com/process"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HttpApiEndpoint"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda Function ARN",
      "Value": {
        "Fn::GetAtt": ["LambdaFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "LambdaFunctionName": {
      "Description": "Lambda Function Name",
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
      "Description": "DynamoDB Table Name",
      "Value": {
        "Ref": "DynamoDBTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DynamoDBTableName"
        }
      }
    },
    "DynamoDBTableArn": {
      "Description": "DynamoDB Table ARN",
      "Value": {
        "Fn::GetAtt": ["DynamoDBTable", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DynamoDBTableArn"
        }
      }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "S3BucketArn": {
      "Description": "S3 Bucket ARN",
      "Value": {
        "Fn::GetAtt": ["S3Bucket", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketArn"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for error notifications",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "KMS Key ARN",
      "Value": {
        "Fn::GetAtt": ["KMSKey", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyArn"
        }
      }
    },
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "S3VPCEndpointId": {
      "Description": "S3 VPC Endpoint ID",
      "Value": {
        "Ref": "S3VPCEndpoint"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3VPCEndpointId"
        }
      }
    }
  }
}
```
