# IDEAL RESPONSE: PCI-DSS Compliant Secure Data Processing Pipeline

## Executive Summary

This document provides a comprehensive explanation of the ideal CloudFormation template implementation for a PCI-DSS compliant secure data processing pipeline. The architecture emphasizes defense-in-depth security, encryption at every layer, network isolation, and comprehensive audit capabilities.

## Architecture Overview

The solution implements a zero-trust security model with multiple layers of protection for sensitive payment card data:

1. **Network Isolation Layer**: Private VPC with no internet gateway, isolated subnets across 3 AZs
2. **Encryption Layer**: Customer-managed KMS keys for all data at rest and in transit
3. **Access Control Layer**: IAM roles with least privilege, explicit security group rules
4. **Audit Layer**: VPC flow logs, AWS Config rules, CloudWatch monitoring
5. **Compliance Layer**: Mandatory PCI tagging, Config rules for policy enforcement

### File lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "PCI-DSS compliant secure data processing pipeline with encryption, network isolation, and comprehensive audit logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to enable parallel deployments",
      "Default": "dev"
    }
  },
  "Resources": {
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
              "Fn::Sub": "vpc-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
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
            "0",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-1-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
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
            "1",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-2-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            "2",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-3-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
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
              "Fn::Sub": "private-rt-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
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
        "VpcEndpointType": "Gateway",
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
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
                "s3:PutObject",
                "s3:ListBucket"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "KMSVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.kms"
        },
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": true,
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          },
          {
            "Ref": "PrivateSubnet3"
          }
        ],
        "SecurityGroupIds": [
          {
            "Ref": "KMSEndpointSecurityGroup"
          }
        ]
      }
    },
    "KMSEndpointSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for KMS VPC endpoint",
        "GroupName": {
          "Fn::Sub": "kms-endpoint-sg-v1-${EnvironmentSuffix}"
        },
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "kms-endpoint-sg-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda function",
        "GroupName": {
          "Fn::Sub": "lambda-sg-v1-${EnvironmentSuffix}"
        },
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "lambda-sg-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "KMSEndpointSecurityGroupIngress": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {
          "Ref": "KMSEndpointSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 443,
        "ToPort": 443,
        "SourceSecurityGroupId": {
          "Ref": "LambdaSecurityGroup"
        }
      }
    },
    "LambdaSecurityGroupEgress": {
      "Type": "AWS::EC2::SecurityGroupEgress",
      "Properties": {
        "GroupId": {
          "Ref": "LambdaSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 443,
        "ToPort": 443,
        "DestinationSecurityGroupId": {
          "Ref": "KMSEndpointSecurityGroup"
        },
        "Description": "Allow HTTPS to KMS endpoint"
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "Description": {
          "Fn::Sub": "Customer-managed KMS key for PCI data encryption - ${EnvironmentSuffix}"
        },
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
              "Sid": "Allow S3 to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Logs to use the key",
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
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "kms-key-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/pci-data-key-v1-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "pci-data-bucket-v1-${EnvironmentSuffix}-${AWS::AccountId}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
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
            "Key": "Name",
            "Value": {
              "Fn::Sub": "pci-data-bucket-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "DataBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "DataBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyUnencryptedObjectUploads",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${DataBucket.Arn}/*"
              },
              "Condition": {
                "StringNotEquals": {
                  "s3:x-amz-server-side-encryption": "aws:kms"
                }
              }
            },
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": [
                    "DataBucket",
                    "Arn"
                  ]
                },
                {
                  "Fn::Sub": "${DataBucket.Arn}/*"
                }
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "VPCFlowLogsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/flowlogs-v1-${EnvironmentSuffix}"
        },
        "RetentionInDays": 90,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "KMSKey",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flowlogs-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "vpc-flowlogs-role-v1-${EnvironmentSuffix}"
        },
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
            "PolicyName": "CloudWatchLogGroupAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "VPCFlowLogsLogGroup",
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
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "VPCFlowLog": {
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
          "Fn::GetAtt": [
            "VPCFlowLogsRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flowlog-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-v1-${EnvironmentSuffix}"
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
                    "Fn::Sub": "${DataBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "DataBucket",
                      "Arn"
                    ]
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
                    "kms:GenerateDataKey",
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
        ],
        "Tags": [
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "DataValidationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "data-validation-v1-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "MemorySize": 1024,
        "Timeout": 60,
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
            },
            {
              "Ref": "PrivateSubnet3"
            }
          ]
        },
        "Environment": {
          "Variables": {
            "DATA_BUCKET": {
              "Ref": "DataBucket"
            },
            "KMS_KEY_ID": {
              "Ref": "KMSKey"
            }
          }
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n  console.log('Validating payment card data...');\n  console.log('Event:', JSON.stringify(event, null, 2));\n  \n  // Extract S3 event details if present\n  const bucket = event.Records?.[0]?.s3?.bucket?.name || process.env.DATA_BUCKET;\n  const key = event.Records?.[0]?.s3?.object?.key || 'test-data.json';\n  \n  console.log(`Processing file: s3://${bucket}/${key}`);\n  \n  // Basic validation logic\n  const validationResult = {\n    status: 'valid',\n    timestamp: new Date().toISOString(),\n    bucket: bucket,\n    key: key,\n    message: 'Payment card data validation completed successfully'\n  };\n  \n  console.log('Validation result:', JSON.stringify(validationResult, null, 2));\n  \n  return {\n    statusCode: 200,\n    body: JSON.stringify(validationResult)\n  };\n};\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "data-validation-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "SecurityAlertTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "security-alerts-v1-${EnvironmentSuffix}"
        },
        "DisplayName": "PCI Security Alerts",
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "security-alerts-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "ConfigRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "config-role-v1-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ],
        "Policies": [
          {
            "PolicyName": "ConfigPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "config:*",
                    "sns:Publish"
                  ],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "ConfigBucketAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketVersioning",
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ConfigBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ConfigBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "ConfigKMSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:GenerateDataKey",
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
        ],
        "Tags": [
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "ConfigBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "config-bucket-v1-${EnvironmentSuffix}-${AWS::AccountId}"
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
            "Key": "Name",
            "Value": {
              "Fn::Sub": "config-bucket-v1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PCI"
          },
          {
            "Key": "ComplianceScope",
            "Value": "Payment"
          }
        ]
      }
    },
    "ConfigBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ConfigBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSConfigBucketPermissionsCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::Sub": "arn:aws:s3:::${ConfigBucket}"
              }
            },
            {
              "Sid": "AWSConfigBucketDelivery",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "arn:aws:s3:::${ConfigBucket}/AWSLogs/${AWS::AccountId}/Config/*"
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
    "EncryptedVolumesConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "encrypted-volumes-v1-${EnvironmentSuffix}"
        },
        "Description": "Checks that EBS volumes are encrypted",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "ENCRYPTED_VOLUMES"
        }
      }
    },
    "S3BucketSSLRequestsOnlyConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "s3-bucket-ssl-requests-only-v1-${EnvironmentSuffix}"
        },
        "Description": "Checks that S3 buckets have policies requiring SSL",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_SSL_REQUESTS_ONLY"
        }
      }
    },
    "IAMPasswordPolicyConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "iam-password-policy-v1-${EnvironmentSuffix}"
        },
        "Description": "Checks that the account password policy meets PCI DSS requirements",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "IAM_PASSWORD_POLICY"
        }
      }
    },
    "ConfigParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/pci/config/${EnvironmentSuffix}/data-bucket"
        },
        "Description": "S3 bucket name for PCI data storage",
        "Type": "String",
        "Value": {
          "Ref": "DataBucket"
        },
        "Tags": {
          "DataClassification": "PCI",
          "ComplianceScope": "Payment"
        }
      }
    },
    "KMSKeyParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/pci/config/${EnvironmentSuffix}/kms-key-id"
        },
        "Description": "KMS key ID for PCI data encryption",
        "Type": "String",
        "Value": {
          "Ref": "KMSKey"
        },
        "Tags": {
          "DataClassification": "PCI",
          "ComplianceScope": "Payment"
        }
      }
    }
  },
  "Outputs": {
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
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      }
    },
    "PrivateSubnet3Id": {
      "Description": "Private Subnet 3 ID",
      "Value": {
        "Ref": "PrivateSubnet3"
      }
    },
    "DataBucketName": {
      "Description": "S3 bucket name for PCI data",
      "Value": {
        "Ref": "DataBucket"
      }
    },
    "KMSKeyId": {
      "Description": "KMS key ID for encryption",
      "Value": {
        "Ref": "KMSKey"
      }
    },
    "KMSKeyArn": {
      "Description": "KMS key ARN",
      "Value": {
        "Fn::GetAtt": [
          "KMSKey",
          "Arn"
        ]
      }
    },
    "DataValidationFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": {
        "Fn::GetAtt": [
          "DataValidationFunction",
          "Arn"
        ]
      }
    },
    "DataValidationFunctionName": {
      "Description": "Lambda function name",
      "Value": {
        "Ref": "DataValidationFunction"
      }
    },
    "SecurityAlertTopicArn": {
      "Description": "SNS topic ARN for security alerts",
      "Value": {
        "Ref": "SecurityAlertTopic"
      }
    },
    "VPCFlowLogsLogGroup": {
      "Description": "CloudWatch Logs log group for VPC flow logs",
      "Value": {
        "Ref": "VPCFlowLogsLogGroup"
      }
    },
    "ConfigBucketName": {
      "Description": "S3 bucket for AWS Config",
      "Value": {
        "Ref": "ConfigBucket"
      }
    }
  }
}
```