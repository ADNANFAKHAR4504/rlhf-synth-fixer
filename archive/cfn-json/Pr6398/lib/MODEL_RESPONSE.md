# Infrastructure Compliance Analysis System - Implementation

This CloudFormation template implements a comprehensive compliance monitoring system using AWS Config to analyze and validate AWS infrastructure against compliance requirements.

> **Region Alignment:** The solution, validation steps, and deployment commands are written for the `eu-central-1` region to match the project requirement and the `lib/AWS_REGION` setting.

## Architecture Overview

The solution uses:
- **AWS Config**: Records resource configurations and evaluates compliance
- **AWS Config Rules**: Automated compliance checks (managed AWS rules)
- **S3 Bucket**: Stores configuration snapshots and compliance data
- **SNS Topic**: Sends notifications for compliance violations
- **CloudWatch Logs**: Operational logging
- **IAM Roles**: Least privilege permissions for Config service

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Infrastructure Compliance Analysis System - Monitors AWS resources for compliance violations using AWS Config",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for unique resource naming",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "NotificationEmail": {
      "Type": "String",
      "Default": "compliance-team@example.com",
      "Description": "Email address for compliance violation notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "ConfigSnapshotFrequency": {
      "Type": "String",
      "Default": "TwentyFour_Hours",
      "AllowedValues": [
        "One_Hour",
        "Three_Hours",
        "Six_Hours",
        "Twelve_Hours",
        "TwentyFour_Hours"
      ],
      "Description": "Frequency for configuration snapshot delivery"
    }
  },

  "Resources": {
    "ConfigBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "compliance-config-${EnvironmentSuffix}-${AWS::AccountId}"
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
              "Id": "DeleteOldConfigSnapshots",
              "Status": "Enabled",
              "ExpirationInDays": 90,
              "NoncurrentVersionExpirationInDays": 30
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ComplianceConfigBucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "ComplianceMonitoring"
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
                "Fn::GetAtt": ["ConfigBucket", "Arn"]
              },
              "Condition": {
                "StringEquals": {
                  "AWS:SourceAccount": {
                    "Ref": "AWS::AccountId"
                  }
                }
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
                "Fn::GetAtt": ["ConfigBucket", "Arn"]
              },
              "Condition": {
                "StringEquals": {
                  "AWS:SourceAccount": {
                    "Ref": "AWS::AccountId"
                  }
                }
              }
            },
            {
              "Sid": "AWSConfigBucketPutObject",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${ConfigBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control",
                  "AWS:SourceAccount": {
                    "Ref": "AWS::AccountId"
                  }
                }
              }
            }
          ]
        }
      }
    },

    "ComplianceNotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "compliance-violations-${EnvironmentSuffix}"
        },
        "DisplayName": "Compliance Violation Notifications",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "NotificationEmail"
            },
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ComplianceNotifications-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "ComplianceAlerts"
          }
        ]
      }
    },

    "ComplianceNotificationTopicPolicy": {
      "Type": "AWS::SNS::TopicPolicy",
      "Properties": {
        "Topics": [
          {
            "Ref": "ComplianceNotificationTopic"
          }
        ],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSConfigSNSPolicy",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "SNS:Publish",
              "Resource": {
                "Ref": "ComplianceNotificationTopic"
              }
            }
          ]
        }
      }
    },

    "ConfigRecorderRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ConfigRecorderRole-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/service-role/ConfigRole"
        ],
        "Policies": [
          {
            "PolicyName": "ConfigRecorderS3Policy",
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
                      "Fn::GetAtt": ["ConfigBucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${ConfigBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": "sns:Publish",
                  "Resource": {
                    "Ref": "ComplianceNotificationTopic"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ConfigRecorderRole-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "DependsOn": ["ConfigBucketPolicy"],
      "Properties": {
        "Name": {
          "Fn::Sub": "compliance-recorder-${EnvironmentSuffix}"
        },
        "RoleARN": {
          "Fn::GetAtt": ["ConfigRecorderRole", "Arn"]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true,
          "ResourceTypes": []
        }
      }
    },

    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": {
          "Fn::Sub": "compliance-delivery-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "ConfigBucket"
        },
        "SnsTopicARN": {
          "Ref": "ComplianceNotificationTopic"
        },
        "ConfigSnapshotDeliveryProperties": {
          "DeliveryFrequency": {
            "Ref": "ConfigSnapshotFrequency"
          }
        }
      }
    },

    "S3BucketPublicReadProhibitedRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
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
          "ComplianceResourceTypes": ["AWS::S3::Bucket"]
        }
      }
    },

    "S3BucketPublicWriteProhibitedRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "s3-bucket-public-write-prohibited-${EnvironmentSuffix}"
        },
        "Description": "Checks that S3 buckets do not allow public write access",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::S3::Bucket"]
        }
      }
    },

    "S3BucketServerSideEncryptionEnabledRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "s3-bucket-encryption-enabled-${EnvironmentSuffix}"
        },
        "Description": "Checks that S3 buckets have server-side encryption enabled",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::S3::Bucket"]
        }
      }
    },

    "S3BucketVersioningEnabledRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "s3-bucket-versioning-enabled-${EnvironmentSuffix}"
        },
        "Description": "Checks that S3 buckets have versioning enabled",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_VERSIONING_ENABLED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::S3::Bucket"]
        }
      }
    },

    "EC2VolumeEncryptionRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "ec2-volume-encryption-${EnvironmentSuffix}"
        },
        "Description": "Checks that EBS volumes are encrypted",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "ENCRYPTED_VOLUMES"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::EC2::Volume"]
        }
      }
    },

    "RDSEncryptionEnabledRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "rds-encryption-enabled-${EnvironmentSuffix}"
        },
        "Description": "Checks that RDS instances have encryption enabled",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "RDS_STORAGE_ENCRYPTED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::RDS::DBInstance"]
        }
      }
    },

    "IAMPasswordPolicyRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "iam-password-policy-${EnvironmentSuffix}"
        },
        "Description": "Checks that the account password policy meets specified requirements",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "IAM_PASSWORD_POLICY"
        },
        "InputParameters": {
          "RequireUppercaseCharacters": "true",
          "RequireLowercaseCharacters": "true",
          "RequireNumbers": "true",
          "MinimumPasswordLength": "14",
          "MaxPasswordAge": "90"
        }
      }
    },

    "IAMRootAccessKeyCheckRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "iam-root-access-key-check-${EnvironmentSuffix}"
        },
        "Description": "Checks whether the root user access key is available",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "IAM_ROOT_ACCESS_KEY_CHECK"
        }
      }
    },

    "VPCFlowLogsEnabledRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "vpc-flow-logs-enabled-${EnvironmentSuffix}"
        },
        "Description": "Checks that VPC Flow Logs are enabled for VPCs",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "VPC_FLOW_LOGS_ENABLED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::EC2::VPC"]
        }
      }
    },

    "CloudTrailEnabledRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "cloudtrail-enabled-${EnvironmentSuffix}"
        },
        "Description": "Checks that CloudTrail is enabled in the AWS account",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "CLOUD_TRAIL_ENABLED"
        }
      }
    },

    "ComplianceDashboardLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/compliance/monitoring-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    }
  },

  "Outputs": {
    "ConfigBucketName": {
      "Description": "S3 bucket storing configuration snapshots",
      "Value": {
        "Ref": "ConfigBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ConfigBucket"
        }
      }
    },

    "ConfigBucketArn": {
      "Description": "ARN of the configuration bucket",
      "Value": {
        "Fn::GetAtt": ["ConfigBucket", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ConfigBucketArn"
        }
      }
    },

    "ComplianceNotificationTopicArn": {
      "Description": "SNS topic for compliance violation notifications",
      "Value": {
        "Ref": "ComplianceNotificationTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NotificationTopic"
        }
      }
    },

    "ConfigRecorderName": {
      "Description": "Name of the AWS Config recorder",
      "Value": {
        "Ref": "ConfigRecorder"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ConfigRecorder"
        }
      }
    },

    "ComplianceRulesDeployed": {
      "Description": "Number of compliance rules deployed",
      "Value": "10"
    },

    "ComplianceDashboardLogGroup": {
      "Description": "CloudWatch log group for compliance monitoring",
      "Value": {
        "Ref": "ComplianceDashboardLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LogGroup"
        }
      }
    }
  }
}
```

## Implementation Notes

### AWS Config Rules Deployed

The template implements 10 managed AWS Config Rules covering critical compliance areas:

1. **S3 Security** (4 rules):
   - Public read access prohibited
   - Public write access prohibited
   - Server-side encryption enabled
   - Versioning enabled

2. **Encryption** (2 rules):
   - EC2 EBS volumes encrypted
   - RDS storage encrypted

3. **IAM Security** (2 rules):
   - Password policy compliance
   - Root access key check

4. **Network & Logging** (2 rules):
   - VPC Flow Logs enabled
   - CloudTrail enabled

### Resource Naming

All resources use the EnvironmentSuffix parameter:
- Config Bucket: `compliance-config-${EnvironmentSuffix}-${AWS::AccountId}`
- SNS Topic: `compliance-violations-${EnvironmentSuffix}`
- Config Recorder: `compliance-recorder-${EnvironmentSuffix}`
- All Config Rules: Include suffix in their names

### Security Features

- S3 bucket encrypted with AES256
- S3 versioning enabled for audit trail
- Public access completely blocked on config bucket
- IAM roles follow least privilege principle
- Bucket lifecycle policy removes old data after 90 days
- SNS topic policy restricts access to AWS Config service

### Compliance Monitoring

- Configuration changes recorded continuously
- Snapshots delivered based on specified frequency
- Compliance violations trigger SNS notifications
- Configuration history stored for audit purposes
- CloudWatch Logs for operational monitoring

### Cost Optimization

- Uses managed AWS Config Rules (no Lambda required)
- Lifecycle policy removes old snapshots automatically
- Serverless architecture (no compute instances)
- CloudWatch Logs retention limited to 30 days

### Deployment Considerations

1. The Config Recorder will start recording immediately after deployment
2. Email subscription requires confirmation via email
3. Initial compliance evaluation may take several minutes
4. All resources are fully destroyable (no Retain policies)
5. Deploy to eu-central-1 as specified

### Testing the Solution

After deployment:
1. Create a test S3 bucket without encryption
2. Verify AWS Config detects the violation
3. Confirm SNS notification is sent
4. Check configuration snapshots in S3 bucket
5. Review compliance status in AWS Config console
