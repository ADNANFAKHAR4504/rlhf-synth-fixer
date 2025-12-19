
```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS Security Baseline Template - Provisions essential security resources including IAM, VPC security, logging, monitoring, encryption, and compliance controls",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for unique resource naming (lowercase only)",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "AllowedIPRange": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR IP range allowed for SSH and HTTP access to Security Group"
    },
    "S3AccessCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR IP range allowed to access the secure S3 bucket"
    }
  },

  "Resources": {
    "SecurityVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "SecurityBaselineVPC-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Security"
          }
        ]
      }
    },

    "VPCFlowLogRole": {
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
            "PolicyName": "VPCFlowLogPolicy",
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
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "VPCFlowLogs"
          }
        ]
      }
    },

    "VPCFlowLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/flowlogs-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },

    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {
          "Ref": "SecurityVPC"
        },
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {
          "Ref": "VPCFlowLogGroup"
        },
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": ["VPCFlowLogRole", "Arn"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "SecurityVPCFlowLog-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "WebSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group allowing SSH and HTTP from specific IP range",
        "VpcId": {
          "Ref": "SecurityVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "AllowedIPRange"
            },
            "Description": "Allow SSH from specific IP range"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": {
              "Ref": "AllowedIPRange"
            },
            "Description": "Allow HTTP from specific IP range"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebSecurityGroup-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "S3ReadOnlyRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "S3ReadOnlyAccessRole-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "S3ReadOnlyPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                    "s3:GetObjectVersion",
                    "s3:GetBucketVersioning"
                  ],
                  "Resource": [
                    "arn:aws:s3:::*",
                    "arn:aws:s3:::*/*"
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "S3ReadOnlyAccess"
          },
          {
            "Key": "Principle",
            "Value": "LeastPrivilege"
          }
        ]
      }
    },

    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "Customer-managed KMS key for data encryption - ${EnvironmentSuffix}"
        },
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Id": "key-policy-1",
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
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "cloudtrail.amazonaws.com",
                  "s3.amazonaws.com",
                  "logs.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "DataEncryption"
          }
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/security-baseline-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },

    "CloudTrailS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloudtrail-logs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "CloudTrailLogs"
          }
        ]
      }
    },

    "CloudTrailS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "CloudTrailS3Bucket"
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
                "Fn::GetAtt": ["CloudTrailS3Bucket", "Arn"]
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
                "Fn::Sub": "${CloudTrailS3Bucket.Arn}/*"
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

    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailS3BucketPolicy",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "SecurityBaselineTrail-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "CloudTrailS3Bucket"
        },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EnableLogFileValidation": true,
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true
          }
        ],
        "Tags": [
          {
            "Key": "Compliance",
            "Value": "Required"
          }
        ]
      }
    },

    "CloudTrailLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/cloudtrail/${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },

    "ConsoleSignInMetricFilter": {
      "Type": "AWS::Logs::MetricFilter",
      "Properties": {
        "FilterName": {
          "Fn::Sub": "ConsoleSignInFailures-${EnvironmentSuffix}"
        },
        "FilterPattern": "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }",
        "LogGroupName": {
          "Ref": "CloudTrailLogGroup"
        },
        "MetricTransformations": [
          {
            "MetricName": "ConsoleSignInFailureCount",
            "MetricNamespace": "CloudTrailMetrics",
            "MetricValue": "1"
          }
        ]
      }
    },

    "ConsoleSignInAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ConsoleSignInFailures-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when console sign-in failures are detected",
        "MetricName": "ConsoleSignInFailureCount",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 3,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching"
      }
    },

    "SecureS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "secure-data-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "CloudTrailS3Bucket"
          },
          "LogFilePrefix": "s3-access-logs/"
        },
        "Tags": [
          {
            "Key": "Classification",
            "Value": "Confidential"
          }
        ]
      }
    },

    "SecureS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "SecureS3Bucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureConnections",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": ["SecureS3Bucket", "Arn"]
                },
                {
                  "Fn::Sub": "${SecureS3Bucket.Arn}/*"
                }
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            },
            {
              "Sid": "RestrictAccessToSpecificCIDR",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": ["SecureS3Bucket", "Arn"]
                },
                {
                  "Fn::Sub": "${SecureS3Bucket.Arn}/*"
                }
              ],
              "Condition": {
                "NotIpAddress": {
                  "aws:SourceIp": {
                    "Ref": "S3AccessCIDR"
                  }
                }
              }
            }
          ]
        }
      }
    },

    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "/security/database/credentials-${EnvironmentSuffix}"
        },
        "Description": "Securely stored database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "DatabaseCredentials"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecurityBaselineRecorder-${EnvironmentSuffix}"
        },
        "RoleARN": {
          "Fn::GetAtt": ["ConfigRole", "Arn"]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true
        }
      }
    },

    "ConfigRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "S3BucketPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketAcl",
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["ConfigS3Bucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${ConfigS3Bucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },

    "ConfigS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "aws-config-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        }
      }
    },

    "ConfigS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ConfigS3Bucket"
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
                "Fn::GetAtt": ["ConfigS3Bucket", "Arn"]
              }
            },
            {
              "Sid": "AWSConfigBucketExistenceCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:ListBucket",
              "Resource": {
                "Fn::GetAtt": ["ConfigS3Bucket", "Arn"]
              }
            },
            {
              "Sid": "AWSConfigBucketWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${ConfigS3Bucket.Arn}/*"
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

    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecurityBaselineDeliveryChannel-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "ConfigS3Bucket"
        }
      }
    },

    "PublicS3BucketRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": [
        "ConfigRecorder",
        "ConfigDeliveryChannel"
      ],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "s3-bucket-public-read-prohibited-${EnvironmentSuffix}"
        },
        "Description": "Checks that S3 buckets do not allow public read access",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_PUBLIC_READ_PROHIBITED"
        },
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::S3::Bucket"
          ]
        }
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "ID of the Security VPC",
      "Value": {
        "Ref": "SecurityVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "SecurityVPC-ID-${EnvironmentSuffix}"
        }
      }
    },
    "SecurityGroupId": {
      "Description": "ID of the Web Security Group",
      "Value": {
        "Ref": "WebSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "WebSecurityGroup-ID-${EnvironmentSuffix}"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS Key for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "KMSKey-ID-${EnvironmentSuffix}"
        }
      }
    },
    "SecureS3BucketName": {
      "Description": "Name of the secure S3 bucket",
      "Value": {
        "Ref": "SecureS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "SecureS3Bucket-Name-${EnvironmentSuffix}"
        }
      }
    },
    "CloudTrailName": {
      "Description": "Name of the CloudTrail",
      "Value": {
        "Ref": "CloudTrail"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "CloudTrail-Name-${EnvironmentSuffix}"
        }
      }
    },
    "IAMRoleArn": {
      "Description": "ARN of the S3 Read-Only IAM Role",
      "Value": {
        "Fn::GetAtt": ["S3ReadOnlyRole", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "S3ReadOnlyRole-ARN-${EnvironmentSuffix}"
        }
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the database credentials secret",
      "Value": {
        "Ref": "DBSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "DBSecret-ARN-${EnvironmentSuffix}"
        }
      }
    }
  }
}
```