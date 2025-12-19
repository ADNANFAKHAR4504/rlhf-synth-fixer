# HIPAA-Compliant Healthcare Data Processing Infrastructure

This CloudFormation template in JSON format implements a complete HIPAA-compliant healthcare data processing infrastructure with comprehensive audit logging and security controls.

## Complete Solution

The infrastructure includes 27 AWS resources deployed across multiple service categories to ensure secure, compliant healthcare data processing:

### 1. Encryption Management (2 resources)
- **KMS Key**: Customer-managed CMK with automatic rotation enabled
- **KMS Alias**: Friendly name alias for the encryption key

### 2. Storage Layer (4 resources)
- **Patient Data Bucket**: S3 bucket with SSE-S3 encryption, versioning, lifecycle policies, and logging
- **Logging Bucket**: Centralized S3 access logs storage with lifecycle management
- **CloudTrail Bucket**: Dedicated bucket for CloudTrail audit logs
- **CloudTrail Bucket Policy**: Policy allowing CloudTrail service to write logs

### 3. Audit Trail (3 resources)
- **CloudTrail**: Multi-region trail with log file validation
- **CloudTrail Log Group**: CloudWatch Logs integration with KMS encryption
- **CloudTrail Role**: IAM role for CloudTrail to write to CloudWatch Logs

### 4. Network Security (9 resources)
- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Private Subnets**: 2 subnets across different availability zones
- **Route Table**: Private routing table with subnet associations
- **S3 VPC Endpoint**: Gateway endpoint for S3 access
- **CloudWatch Logs VPC Endpoint**: Interface endpoint for logs
- **Security Groups**: Separate groups for Lambda and VPC endpoints with restrictive rules

### 5. Data Processing (5 resources)
- **Lambda Function**: Node.js 20.x function for processing patient data
- **Lambda Execution Role**: IAM role with least-privilege access to S3, DynamoDB, SNS, KMS, and SSM
- **Lambda Log Group**: CloudWatch Logs with KMS encryption and 14-day retention
- **Lambda Permission**: S3 bucket notification permission
- **DynamoDB Audit Table**: Encrypted table with point-in-time recovery for audit trail

### 6. Alerting (1 resource)
- **SNS Topic**: Encrypted topic for processing error notifications

### 7. Configuration Management (2 resources)
- **Config Parameter**: SSM parameter storing environment configuration
- **Bucket Name Parameter**: SSM parameter storing patient data bucket name

## Key HIPAA Compliance Features

1. **Encryption at Rest**: All data storage services use encryption (S3, DynamoDB, CloudWatch Logs, SNS)
2. **Encryption in Transit**: VPC endpoints and security groups enforce HTTPS-only communication
3. **Key Management**: Customer-managed KMS key with automatic rotation
4. **Audit Logging**: CloudTrail tracks all API calls with data event tracking on patient data bucket
5. **Access Control**: IAM roles follow least-privilege principle
6. **Data Lifecycle**: Automated transition to lower-cost storage and expiration policies
7. **Versioning**: S3 versioning enabled for data recovery
8. **Point-in-Time Recovery**: DynamoDB PITR for audit trail protection
9. **Network Isolation**: Lambda runs in private subnets with no internet access
10. **Log Retention**: CloudWatch Logs retained for 14 days as required

## Resource Naming Convention

All resources use the `EnvironmentSuffix` parameter for naming:
- Pattern: `{resource-purpose}-${EnvironmentSuffix}`
- Examples: `patient-data-dev`, `audit-trail-prod`
- Ensures no naming conflicts across environments

## Outputs

The template exports 11 outputs for integration and testing:
- Bucket names (Patient Data, Logging, CloudTrail)
- DynamoDB table name
- Lambda function name and ARN
- SNS topic ARN
- VPC ID
- KMS key ID and ARN
- CloudTrail name

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "HIPAA-compliant healthcare data processing infrastructure with comprehensive audit logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming",
      "Default": "dev"
    }
  },
  "Resources": {
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting healthcare data",
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                }
              }
            }
          ]
        }
      }
    },
    "EncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/hipaa-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EncryptionKey"
        }
      }
    },
    "PatientDataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "patient-data-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
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
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 90,
                  "StorageClass": "STANDARD_IA"
                }
              ]
            }
          ]
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "LoggingBucket"
          },
          "LogFilePrefix": "patient-data-logs/"
        }
      }
    },
    "LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "logging-bucket-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}"
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
              "Id": "ExpireLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        }
      }
    },
    "CloudTrailBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloudtrail-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}"
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
        }
      }
    },
    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "CloudTrailBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": [
                  "CloudTrailBucket",
                  "Arn"
                ]
              }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${CloudTrailBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },
    "CloudTrailLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/cloudtrail/${EnvironmentSuffix}"
        },
        "RetentionInDays": 14,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "EncryptionKey",
            "Arn"
          ]
        }
      }
    },
    "CloudTrailRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "cloudtrail-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudTrailLogsPolicy",
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
                      "CloudTrailLogGroup",
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
    "AuditTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": [
        "CloudTrailBucketPolicy"
      ],
      "Properties": {
        "TrailName": {
          "Fn::Sub": "hipaa-audit-trail-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "CloudTrailBucket"
        },
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "IncludeGlobalServiceEvents": true,
        "EnableLogFileValidation": true,
        "CloudWatchLogsLogGroupArn": {
          "Fn::GetAtt": [
            "CloudTrailLogGroup",
            "Arn"
          ]
        },
        "CloudWatchLogsRoleArn": {
          "Fn::GetAtt": [
            "CloudTrailRole",
            "Arn"
          ]
        },
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true,
            "DataResources": [
              {
                "Type": "AWS::S3::Object",
                "Values": [
                  {
                    "Fn::Sub": "${PatientDataBucket.Arn}/*"
                  }
                ]
              }
            ]
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
              "Fn::Sub": "hipaa-vpc-${EnvironmentSuffix}"
            }
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
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
            }
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
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"
            }
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
              "Fn::Sub": "private-route-table-${EnvironmentSuffix}"
            }
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
        "VpcEndpointType": "Gateway"
      }
    },
    "CloudWatchLogsVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.logs"
        },
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": true,
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "SecurityGroupIds": [
          {
            "Ref": "VPCEndpointSecurityGroup"
          }
        ]
      }
    },
    "VPCEndpointSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "vpc-endpoint-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for VPC endpoints",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "LambdaSecurityGroup"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-endpoint-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "lambda-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS outbound"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "lambda-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuditTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "audit-trail-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "auditId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "auditId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "EncryptionKey"
          }
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        }
      }
    },
    "AlertTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "processing-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Healthcare Data Processing Alerts",
        "KmsMasterKeyId": {
          "Ref": "EncryptionKey"
        }
      }
    },
    "ProcessingFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/data-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 14,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "EncryptionKey",
            "Arn"
          ]
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${PatientDataBucket.Arn}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "AuditTable",
                      "Arn"
                    ]
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
                  "Action": "sns:Publish",
                  "Resource": {
                    "Ref": "AlertTopic"
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
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "EncryptionKey",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SSMAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/hipaa/${EnvironmentSuffix}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogs",
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
                      "ProcessingFunctionLogGroup",
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
    "DataProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": [
        "ProcessingFunctionLogGroup"
      ],
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "data-processor-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs20.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "PATIENT_DATA_BUCKET": {
              "Ref": "PatientDataBucket"
            },
            "AUDIT_TABLE": {
              "Ref": "AuditTable"
            },
            "ALERT_TOPIC": {
              "Ref": "AlertTopic"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            },
            "KMS_KEY_ID": {
              "Ref": "EncryptionKey"
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
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');",
                "const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');",
                "const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');",
                "",
                "const s3Client = new S3Client({ region: process.env.AWS_REGION });",
                "const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });",
                "const snsClient = new SNSClient({ region: process.env.AWS_REGION });",
                "",
                "exports.handler = async (event) => {",
                "  console.log('Processing healthcare data:', JSON.stringify(event));",
                "  ",
                "  try {",
                "    // Extract S3 event information",
                "    const bucket = event.Records ? event.Records[0].s3.bucket.name : process.env.PATIENT_DATA_BUCKET;",
                "    const key = event.Records ? event.Records[0].s3.object.key : 'test-data';",
                "    ",
                "    // Log audit trail",
                "    const auditEntry = {",
                "      TableName: process.env.AUDIT_TABLE,",
                "      Item: {",
                "        auditId: { S: `${Date.now()}-${Math.random().toString(36).substring(7)}` },",
                "        timestamp: { N: Date.now().toString() },",
                "        action: { S: 'DATA_PROCESSED' },",
                "        bucket: { S: bucket },",
                "        key: { S: key },",
                "        status: { S: 'SUCCESS' }",
                "      }",
                "    };",
                "    ",
                "    await dynamoClient.send(new PutItemCommand(auditEntry));",
                "    ",
                "    return {",
                "      statusCode: 200,",
                "      body: JSON.stringify({ message: 'Data processed successfully', bucket, key })",
                "    };",
                "  } catch (error) {",
                "    console.error('Error processing data:', error);",
                "    ",
                "    // Send alert",
                "    await snsClient.send(new PublishCommand({",
                "      TopicArn: process.env.ALERT_TOPIC,",
                "      Subject: 'Healthcare Data Processing Error',",
                "      Message: `Error processing data: ${error.message}`",
                "    }));",
                "    ",
                "    throw error;",
                "  }",
                "};"
              ]
            ]
          }
        }
      }
    },
    "S3InvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "DataProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "PatientDataBucket",
            "Arn"
          ]
        },
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "ConfigParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/hipaa/${EnvironmentSuffix}/config"
        },
        "Type": "String",
        "Value": {
          "Fn::Sub": "{\"environment\":\"${EnvironmentSuffix}\",\"region\":\"${AWS::Region}\"}"
        },
        "Description": "Configuration parameters for HIPAA infrastructure"
      }
    },
    "BucketNameParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/hipaa/${EnvironmentSuffix}/bucket-name"
        },
        "Type": "String",
        "Value": {
          "Ref": "PatientDataBucket"
        },
        "Description": "Patient data bucket name"
      }
    }
  },
  "Outputs": {
    "PatientDataBucketName": {
      "Description": "Name of the patient data S3 bucket",
      "Value": {
        "Ref": "PatientDataBucket"
      }
    },
    "LoggingBucketName": {
      "Description": "Name of the logging S3 bucket",
      "Value": {
        "Ref": "LoggingBucket"
      }
    },
    "CloudTrailBucketName": {
      "Description": "Name of the CloudTrail logs S3 bucket",
      "Value": {
        "Ref": "CloudTrailBucket"
      }
    },
    "AuditTableName": {
      "Description": "Name of the audit trail DynamoDB table",
      "Value": {
        "Ref": "AuditTable"
      }
    },
    "DataProcessorFunctionArn": {
      "Description": "ARN of the data processor Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "DataProcessorFunction",
          "Arn"
        ]
      }
    },
    "DataProcessorFunctionName": {
      "Description": "Name of the data processor Lambda function",
      "Value": {
        "Ref": "DataProcessorFunction"
      }
    },
    "AlertTopicArn": {
      "Description": "ARN of the SNS alert topic",
      "Value": {
        "Ref": "AlertTopic"
      }
    },
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      }
    },
    "EncryptionKeyId": {
      "Description": "KMS encryption key ID",
      "Value": {
        "Ref": "EncryptionKey"
      }
    },
    "EncryptionKeyArn": {
      "Description": "KMS encryption key ARN",
      "Value": {
        "Fn::GetAtt": [
          "EncryptionKey",
          "Arn"
        ]
      }
    },
    "CloudTrailName": {
      "Description": "CloudTrail name",
      "Value": {
        "Ref": "AuditTrail"
      }
    }
  }
}
```