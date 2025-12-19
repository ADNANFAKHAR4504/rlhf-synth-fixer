# Secure S3 Infrastructure CloudFormation Template

I'll create a comprehensive CloudFormation template that implements enterprise-grade security controls for S3 bucket management with automated compliance monitoring and remediation.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Enterprise-grade secure S3 infrastructure with automated compliance monitoring and remediation capabilities",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name for resource naming and configuration"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming to avoid conflicts between deployments"
    },
    "KMSKeyArn": {
      "Type": "String",
      "Default": "",
      "Description": "Optional existing KMS key ARN. If empty, a new key will be created"
    },
    "BackupAccountId": {
      "Type": "String",
      "Description": "AWS Account ID for cross-account backup destination",
      "AllowedPattern": "^[0-9]{12}$"
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for security notifications",
      "AllowedPattern": "^[^@]+@[^@]+\\.[^@]+$"
    },
  },
  "Conditions": {
    "CreateKMSKey": {
      "Fn::Equals": [{"Ref": "KMSKeyArn"}, ""]
    },
    "IsProduction": {
      "Fn::Equals": [{"Ref": "Environment"}, "prod"]
    }
  },
  "Resources": {
    "S3KMSKey": {
      "Type": "AWS::KMS::Key",
      "Condition": "CreateKMSKey",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for S3 bucket encryption in ${Environment} environment"
        },
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudTrail to encrypt logs",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": [
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow S3 Service",
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey*"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Purpose",
            "Value": "S3-Encryption"
          }
        ]
      }
    },
    "S3KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Condition": "CreateKMSKey",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/corp-${Environment}-s3-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {"Ref": "S3KMSKey"}
      }
    },
    "S3ReadOnlyRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "corp-${Environment}-s3-readonly-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "Bool": {
                  "aws:MultiFactorAuthPresent": "true"
                }
              }
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3ReadOnlyAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket",
                    "s3:ListBucketVersions"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["MainS3Bucket", "Arn"]},
                    {"Fn::Sub": "${MainS3Bucket}/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::If": [
                      "CreateKMSKey",
                      {"Ref": "S3KMSKey"},
                      {"Ref": "KMSKeyArn"}
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
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "S3WriteRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "corp-${Environment}-s3-write-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "Bool": {
                  "aws:MultiFactorAuthPresent": "true"
                },
                "StringEquals": {
                  "aws:RequestedRegion": "us-east-1"
                }
              }
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3WriteAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:PutObjectAcl",
                    "s3:ListBucket",
                    "s3:ListBucketVersions"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["MainS3Bucket", "Arn"]},
                    {"Fn::Sub": "${MainS3Bucket}/*"}
                  ]
                },
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
                    "Fn::If": [
                      "CreateKMSKey",
                      {"Ref": "S3KMSKey"},
                      {"Ref": "KMSKeyArn"}
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
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "corp-${Environment}-lambda-execution-role-${EnvironmentSuffix}"
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
            "PolicyName": "S3RemediationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketPolicy",
                    "s3:GetBucketAcl",
                    "s3:GetBucketPublicAccessBlock",
                    "s3:PutBucketPolicy",
                    "s3:PutBucketAcl",
                    "s3:PutBucketPublicAccessBlock",
                    "s3:GetBucketVersioning",
                    "s3:PutBucketVersioning",
                    "s3:GetBucketEncryption",
                    "s3:PutBucketEncryption"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["MainS3Bucket", "Arn"]},
                    {"Fn::GetAtt": ["LoggingS3Bucket", "Arn"]}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {"Ref": "SecurityNotificationTopic"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "CloudTrailRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "corp-${Environment}-cloudtrail-role-${EnvironmentSuffix}"
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
                    "s3:PutObject",
                    "s3:GetBucketAcl"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["LoggingS3Bucket", "Arn"]},
                    {"Fn::Sub": "${LoggingS3Bucket}/*"}
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "CrossAccountReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "corp-${Environment}-replication-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "ReplicationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl"
                  ],
                  "Resource": {"Fn::Sub": "${MainS3Bucket}/*"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {"Fn::GetAtt": ["MainS3Bucket", "Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete"
                  ],
                  "Resource": {"Fn::Sub": "arn:aws:s3:::corp-${Environment}-backup-${BackupAccountId}/*"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "LoggingS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "corp-${Environment}-logging-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::If": [
                    "CreateKMSKey",
                    {"Ref": "S3KMSKey"},
                    {"Ref": "KMSKeyArn"}
                  ]
                }
              },
              "BucketKeyEnabled": true
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
              "Id": "LogRetention",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "STANDARD_IA"
                },
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
                },
                {
                  "TransitionInDays": 365,
                  "StorageClass": "DEEP_ARCHIVE"
                }
              ]
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Purpose",
            "Value": "Logging"
          }
        ]
      }
    },
    "MainS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "corp-${Environment}-main-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::If": [
                    "CreateKMSKey",
                    {"Ref": "S3KMSKey"},
                    {"Ref": "KMSKeyArn"}
                  ]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "MfaDelete": {
          "Fn::If": ["IsProduction", "Enabled", "Disabled"]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {"Ref": "LoggingS3Bucket"},
          "LogFilePrefix": "access-logs/"
        },
        "ReplicationConfiguration": {
          "Role": {"Fn::GetAtt": ["CrossAccountReplicationRole", "Arn"]},
          "Rules": [
            {
              "Id": "CrossAccountBackup",
              "Status": "Enabled",
              "Prefix": "",
              "Destination": {
                "Bucket": {"Fn::Sub": "arn:aws:s3:::corp-${Environment}-backup-${BackupAccountId}"},
                "StorageClass": "STANDARD_IA"
              }
            }
          ]
        },
        "NotificationConfiguration": {
          "CloudWatchConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "CloudWatchConfiguration": {
                "LogGroupName": {"Ref": "S3LogGroup"}
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Purpose",
            "Value": "Main-Storage"
          }
        ]
      }
    },
    "S3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "MainS3Bucket"},
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureConnections",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {"Fn::GetAtt": ["MainS3Bucket", "Arn"]},
                {"Fn::Sub": "${MainS3Bucket}/*"}
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            },
            {
              "Sid": "DenyUnencryptedObjectUploads",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObject",
              "Resource": {"Fn::Sub": "${MainS3Bucket}/*"},
              "Condition": {
                "StringNotEquals": {
                  "s3:x-amz-server-side-encryption": "aws:kms"
                }
              }
            }
          ]
        }
      }
    },
    "SecurityNotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "corp-${Environment}-security-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "S3 Security Notifications",
        "KmsMasterKeyId": {
          "Fn::If": [
            "CreateKMSKey",
            {"Ref": "S3KMSKey"},
            {"Ref": "KMSKeyArn"}
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "SecurityNotificationSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "TopicArn": {"Ref": "SecurityNotificationTopic"},
        "Protocol": "email",
        "Endpoint": {"Ref": "NotificationEmail"}
      }
    },
    "S3LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/s3/corp-${Environment}-${EnvironmentSuffix}"
        },
        "RetentionInDays": {
          "Fn::If": ["IsProduction", 365, 30]
        }
      }
    },
    "S3RemediationLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "corp-${Environment}-s3-remediation-${EnvironmentSuffix}"
        },
        "Runtime": "python3.12",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Timeout": 300,
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef lambda_handler(event, context):\n    s3_client = boto3.client('s3')\n    sns_client = boto3.client('sns')\n    \n    # Get environment variables\n    sns_topic = os.environ.get('SNS_TOPIC_ARN')\n    main_bucket = os.environ.get('MAIN_BUCKET')\n    logging_bucket = os.environ.get('LOGGING_BUCKET')\n    kms_key = os.environ.get('KMS_KEY_ID')\n    \n    try:\n        # Parse the CloudTrail event\n        detail = event.get('detail', {})\n        event_name = detail.get('eventName')\n        bucket_name = detail.get('requestParameters', {}).get('bucketName')\n        \n        print(f'Processing event: {event_name} for bucket: {bucket_name}')\n        \n        # Only process events for our managed buckets\n        if bucket_name not in [main_bucket, logging_bucket]:\n            return {'statusCode': 200, 'body': 'Event not for managed buckets'}\n        \n        # Remediation logic based on event type\n        if event_name in ['PutBucketPolicy', 'DeleteBucketPolicy']:\n            remediate_bucket_policy(s3_client, bucket_name, kms_key)\n        elif event_name in ['PutBucketAcl']:\n            remediate_bucket_acl(s3_client, bucket_name)\n        elif event_name in ['PutBucketPublicAccessBlock', 'DeleteBucketPublicAccessBlock']:\n            remediate_public_access(s3_client, bucket_name)\n        elif event_name in ['PutBucketEncryption', 'DeleteBucketEncryption']:\n            remediate_encryption(s3_client, bucket_name, kms_key)\n        \n        # Send notification\n        message = f'S3 security remediation completed for bucket: {bucket_name}, event: {event_name}'\n        sns_client.publish(TopicArn=sns_topic, Message=message)\n        \n        return {'statusCode': 200, 'body': 'Remediation completed'}\n        \n    except Exception as e:\n        print(f'Error: {str(e)}')\n        error_message = f'S3 remediation failed: {str(e)}'\n        if sns_topic:\n            sns_client.publish(TopicArn=sns_topic, Message=error_message)\n        return {'statusCode': 500, 'body': str(e)}\n\ndef remediate_bucket_policy(s3_client, bucket_name, kms_key):\n    # Ensure bucket policy denies insecure transport and unencrypted uploads\n    policy = {\n        'Version': '2012-10-17',\n        'Statement': [\n            {\n                'Sid': 'DenyInsecureConnections',\n                'Effect': 'Deny',\n                'Principal': '*',\n                'Action': 's3:*',\n                'Resource': [f'arn:aws:s3:::{bucket_name}', f'arn:aws:s3:::{bucket_name}/*'],\n                'Condition': {'Bool': {'aws:SecureTransport': 'false'}}\n            },\n            {\n                'Sid': 'DenyUnencryptedObjectUploads',\n                'Effect': 'Deny',\n                'Principal': '*',\n                'Action': 's3:PutObject',\n                'Resource': f'arn:aws:s3:::{bucket_name}/*',\n                'Condition': {'StringNotEquals': {'s3:x-amz-server-side-encryption': 'aws:kms'}}\n            }\n        ]\n    }\n    s3_client.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))\n\ndef remediate_bucket_acl(s3_client, bucket_name):\n    # Reset to private ACL\n    s3_client.put_bucket_acl(Bucket=bucket_name, ACL='private')\n\ndef remediate_public_access(s3_client, bucket_name):\n    # Block all public access\n    s3_client.put_public_access_block(\n        Bucket=bucket_name,\n        PublicAccessBlockConfiguration={\n            'BlockPublicAcls': True,\n            'IgnorePublicAcls': True,\n            'BlockPublicPolicy': True,\n            'RestrictPublicBuckets': True\n        }\n    )\n\ndef remediate_encryption(s3_client, bucket_name, kms_key):\n    # Ensure KMS encryption is enabled\n    s3_client.put_bucket_encryption(\n        Bucket=bucket_name,\n        ServerSideEncryptionConfiguration={\n            'Rules': [{\n                'ApplyServerSideEncryptionByDefault': {\n                    'SSEAlgorithm': 'aws:kms',\n                    'KMSMasterKeyID': kms_key\n                },\n                'BucketKeyEnabled': True\n            }]\n        }\n    )\n"
        },
        "Environment": {
          "Variables": {
            "SNS_TOPIC_ARN": {"Ref": "SecurityNotificationTopic"},
            "MAIN_BUCKET": {"Ref": "MainS3Bucket"},
            "LOGGING_BUCKET": {"Ref": "LoggingS3Bucket"},
            "KMS_KEY_ID": {
              "Fn::If": [
                "CreateKMSKey",
                {"Ref": "S3KMSKey"},
                {"Ref": "KMSKeyArn"}
              ]
            }
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "S3CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "corp-${Environment}-s3-trail-${EnvironmentSuffix}"
        },
        "S3BucketName": {"Ref": "LoggingS3Bucket"},
        "S3KeyPrefix": "cloudtrail-logs/",
        "IncludeGlobalServiceEvents": true,
        "IsMultiRegionTrail": false,
        "EnableLogFileValidation": true,
        "KMSKeyId": {
          "Fn::If": [
            "CreateKMSKey",
            {"Ref": "S3KMSKey"},
            {"Ref": "KMSKeyArn"}
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
                  {"Fn::Sub": "${MainS3Bucket}/*"}
                ]
              },
              {
                "Type": "AWS::S3::Bucket",
                "Values": [
                  {"Fn::GetAtt": ["MainS3Bucket", "Arn"]}
                ]
              }
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },
    "S3ConfigurationChangeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "corp-${Environment}-s3-config-change-${EnvironmentSuffix}"
        },
        "Description": "Triggers remediation Lambda on S3 configuration changes",
        "EventPattern": {
          "source": ["aws.s3"],
          "detail-type": ["AWS API Call via CloudTrail"],
          "detail": {
            "eventSource": ["s3.amazonaws.com"],
            "eventName": [
              "PutBucketPolicy",
              "DeleteBucketPolicy",
              "PutBucketAcl",
              "PutBucketPublicAccessBlock",
              "DeleteBucketPublicAccessBlock",
              "PutBucketEncryption",
              "DeleteBucketEncryption"
            ]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Fn::GetAtt": ["S3RemediationLambda", "Arn"]},
            "Id": "S3RemediationTarget"
          }
        ]
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "S3RemediationLambda"},
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {"Fn::GetAtt": ["S3ConfigurationChangeRule", "Arn"]}
      }
    },
    "S3PublicAccessAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "corp-${Environment}-s3-public-access-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm for S3 bucket public access attempts",
        "MetricName": "PublicAccessAttempts",
        "Namespace": "Custom/S3Security",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "AlarmActions": [
          {"Ref": "SecurityNotificationTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "MainBucketArn": {
      "Description": "ARN of the main S3 bucket",
      "Value": {"Fn::GetAtt": ["MainS3Bucket", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MainBucketArn"}
      }
    },
    "MainBucketName": {
      "Description": "Name of the main S3 bucket",
      "Value": {"Ref": "MainS3Bucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MainBucketName"}
      }
    },
    "LoggingBucketArn": {
      "Description": "ARN of the logging S3 bucket",
      "Value": {"Fn::GetAtt": ["LoggingS3Bucket", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LoggingBucketArn"}
      }
    },
    "LoggingBucketName": {
      "Description": "Name of the logging S3 bucket",
      "Value": {"Ref": "LoggingS3Bucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LoggingBucketName"}
      }
    },
    "ReadOnlyRoleArn": {
      "Description": "ARN of the S3 read-only IAM role",
      "Value": {"Fn::GetAtt": ["S3ReadOnlyRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ReadOnlyRoleArn"}
      }
    },
    "WriteRoleArn": {
      "Description": "ARN of the S3 write IAM role",
      "Value": {"Fn::GetAtt": ["S3WriteRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-WriteRoleArn"}
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key used for encryption",
      "Value": {
        "Fn::If": [
          "CreateKMSKey",
          {"Ref": "S3KMSKey"},
          {"Ref": "KMSKeyArn"}
        ]
      },
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-KMSKeyId"}
      }
    },
    "CloudTrailArn": {
      "Description": "ARN of the CloudTrail for S3 monitoring",
      "Value": {"Fn::GetAtt": ["S3CloudTrail", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-CloudTrailArn"}
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of the SNS topic for security notifications",
      "Value": {"Ref": "SecurityNotificationTopic"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SNSTopicArn"}
      }
    },
    "RemediationLambdaArn": {
      "Description": "ARN of the remediation Lambda function",
      "Value": {"Fn::GetAtt": ["S3RemediationLambda", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RemediationLambdaArn"}
      }
    }
  }
}
```

## Complex Configuration Explanations

### 1. **KMS Key Policy**
The KMS key policy allows CloudTrail and S3 services to use the key while maintaining strict access controls. The policy includes specific permissions for encryption operations needed by different AWS services.

### 2. **MFA Protection**
MFA delete is enabled for production environments on the main S3 bucket, requiring multi-factor authentication for object version deletion operations.

### 3. **Cross-Account Replication**
The template sets up cross-account replication to a backup bucket in a different AWS account, providing disaster recovery capabilities.

### 4. **Event-Driven Remediation**
CloudWatch Events rules trigger the Lambda function when specific S3 configuration changes occur, enabling automatic compliance remediation.

## Assumptions Made

1. **Lambda Code**: The Lambda deployment package exists in the specified S3 bucket
2. **Backup Account**: The destination backup account has appropriate bucket policies to accept replication
3. **Email Verification**: The notification email address will be verified manually after deployment
4. **Regional Deployment**: All resources are deployed in us-east-1 as specified

## Deployment Best Practices

### Pre-Deployment Steps
1. **Prepare Lambda Code**: Upload the remediation Lambda package to the specified S3 bucket
2. **Verify Permissions**: Ensure the deployment role has necessary permissions
3