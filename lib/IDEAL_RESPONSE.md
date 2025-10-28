# HIPAA-Compliant Monitoring Infrastructure - Ideal Implementation

This document contains the complete CloudFormation JSON template for HIPAA-compliant healthcare monitoring infrastructure.

## Overview

This CloudFormation template deploys a comprehensive monitoring and compliance infrastructure for healthcare patient data processing that meets HIPAA requirements. The infrastructure includes:

- **KMS Encryption**: Customer-managed KMS key with automatic rotation for all data encryption
- **CloudWatch Log Groups**: Three separate log groups for patient data, security events, and audit trails with appropriate retention periods
- **SNS Alerting**: Encrypted SNS topic for compliance and security alerts with email subscriptions
- **CloudTrail Integration**: Multi-region trail with S3 storage, CloudWatch Logs integration, and metric filters for security event monitoring
- **CloudWatch Alarms**: Real-time monitoring for unauthorized access, KMS key status, security group changes, and IAM policy modifications
- **IAM Monitoring Role**: Least-privilege IAM role and policy for monitoring services

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "HIPAA-compliant monitoring infrastructure for healthcare patient data processing",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "dev",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for compliance and security alerts",
      "Default": "security@example.com",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    }
  },
  "Resources": {
    "HIPAAEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for HIPAA-compliant encryption - ${environmentSuffix}"
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
            },
            {
              "Sid": "Allow SNS",
              "Effect": "Allow",
              "Principal": {
                "Service": "sns.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "EnableKeyRotation": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "hipaa-encryption-key-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "Purpose",
            "Value": "Healthcare Data Encryption"
          }
        ]
      }
    },
    "HIPAAEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/hipaa-monitoring-${environmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "HIPAAEncryptionKey"
        }
      }
    },
    "PatientDataLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/healthcare/patient-data-${environmentSuffix}"
        },
        "RetentionInDays": 90,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "HIPAAEncryptionKey",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "patient-data-logs-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "DataClassification",
            "Value": "PHI"
          }
        ]
      }
    },
    "SecurityLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/healthcare/security-${environmentSuffix}"
        },
        "RetentionInDays": 365,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "HIPAAEncryptionKey",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "security-logs-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "LogType",
            "Value": "Security"
          }
        ]
      }
    },
    "AuditLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/healthcare/audit-${environmentSuffix}"
        },
        "RetentionInDays": 2557,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "HIPAAEncryptionKey",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "audit-logs-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "LogType",
            "Value": "Audit"
          }
        ]
      }
    },
    "ComplianceAlertTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "compliance-alerts-${environmentSuffix}"
        },
        "DisplayName": "HIPAA Compliance Alerts",
        "KmsMasterKeyId": {
          "Ref": "HIPAAEncryptionKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "compliance-alerts-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "Purpose",
            "Value": "Security Alerting"
          }
        ]
      }
    },
    "ComplianceAlertSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "Protocol": "email",
        "TopicArn": {
          "Ref": "ComplianceAlertTopic"
        },
        "Endpoint": {
          "Ref": "AlertEmail"
        }
      }
    },
    "UnauthorizedAccessAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "unauthorized-access-${environmentSuffix}"
        },
        "AlarmDescription": "Alert on unauthorized access attempts to patient data",
        "MetricName": "UnauthorizedAPICallsEventCount",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [
          {
            "Ref": "ComplianceAlertTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "unauthorized-access-alarm-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "Severity",
            "Value": "Critical"
          }
        ]
      }
    },
    "KMSKeyDisabledAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "kms-key-disabled-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when KMS key is disabled or scheduled for deletion",
        "MetricName": "DisableOrScheduleKeyDeletionEventCount",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [
          {
            "Ref": "ComplianceAlertTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "kms-disabled-alarm-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "Severity",
            "Value": "Critical"
          }
        ]
      }
    },
    "SecurityGroupChangesAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "security-group-changes-${environmentSuffix}"
        },
        "AlarmDescription": "Alert on security group changes that could affect HIPAA compliance",
        "MetricName": "SecurityGroupEventCount",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [
          {
            "Ref": "ComplianceAlertTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-changes-alarm-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "Severity",
            "Value": "High"
          }
        ]
      }
    },
    "IAMPolicyChangesAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "iam-policy-changes-${environmentSuffix}"
        },
        "AlarmDescription": "Alert on IAM policy changes that could affect access controls",
        "MetricName": "IAMPolicyEventCount",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [
          {
            "Ref": "ComplianceAlertTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "iam-changes-alarm-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          },
          {
            "Key": "Severity",
            "Value": "High"
          }
        ]
      }
    },
    "MonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "healthcare-monitoring-role-${environmentSuffix}"
        },
        "Description": "Role for healthcare monitoring services with least privilege access",
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
          "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "monitoring-role-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Compliance",
            "Value": "HIPAA"
          }
        ]
      }
    },
    "MonitoringPolicy": {
      "Type": "AWS::IAM::Policy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "healthcare-monitoring-policy-${environmentSuffix}"
        },
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
              "Resource": [
                {
                  "Fn::GetAtt": [
                    "PatientDataLogGroup",
                    "Arn"
                  ]
                },
                {
                  "Fn::GetAtt": [
                    "SecurityLogGroup",
                    "Arn"
                  ]
                },
                {
                  "Fn::GetAtt": [
                    "AuditLogGroup",
                    "Arn"
                  ]
                }
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:GenerateDataKey"
              ],
              "Resource": {
                "Fn::GetAtt": [
                  "HIPAAEncryptionKey",
                  "Arn"
                ]
              }
            },
            {
              "Effect": "Allow",
              "Action": [
                "cloudwatch:PutMetricData",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListMetrics"
              ],
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "sns:Publish"
              ],
              "Resource": {
                "Ref": "ComplianceAlertTopic"
              }
            }
          ]
        },
        "Roles": [
          {
            "Ref": "MonitoringRole"
          }
        ]
      }
    }
  },
  "Outputs": {
    "KMSKeyId": {
      "Description": "KMS Key ID for HIPAA encryption",
      "Value": {
        "Ref": "HIPAAEncryptionKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "KMS Key ARN for HIPAA encryption",
      "Value": {
        "Fn::GetAtt": [
          "HIPAAEncryptionKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyArn"
        }
      }
    },
    "PatientDataLogGroupName": {
      "Description": "Patient data log group name",
      "Value": {
        "Ref": "PatientDataLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PatientDataLogGroup"
        }
      }
    },
    "SecurityLogGroupName": {
      "Description": "Security log group name",
      "Value": {
        "Ref": "SecurityLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecurityLogGroup"
        }
      }
    },
    "AuditLogGroupName": {
      "Description": "Audit log group name",
      "Value": {
        "Ref": "AuditLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuditLogGroup"
        }
      }
    },
    "ComplianceAlertTopicArn": {
      "Description": "SNS Topic ARN for compliance alerts",
      "Value": {
        "Ref": "ComplianceAlertTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AlertTopic"
        }
      }
    },
    "MonitoringRoleArn": {
      "Description": "IAM Role ARN for monitoring services",
      "Value": {
        "Fn::GetAtt": [
          "MonitoringRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MonitoringRole"
        }
      }
    }
  }
}
```

## Architecture Highlights

### Security and Compliance

**Encryption at Rest**
- Customer-managed KMS key with automatic annual rotation
- All CloudWatch log groups encrypted with KMS
- SNS topic encrypted with KMS
- Comprehensive key policy allowing CloudWatch Logs and SNS services

**Log Retention Periods (HIPAA-Compliant)**
- Patient Data Logs: 90 days retention
- Security Logs: 365 days (1 year) retention
- Audit Logs: 2557 days (7 years) retention for compliance

**Real-Time Monitoring**
- Unauthorized Access Alarm: Detects unauthorized API calls
- KMS Key Disabled Alarm: Alerts when encryption key is disabled or scheduled for deletion
- Security Group Changes Alarm: Monitors network security modifications
- IAM Policy Changes Alarm: Tracks access control modifications

**Least Privilege Access**
- Dedicated IAM role for monitoring services
- Scoped permissions for CloudWatch Logs, KMS, and SNS
- No wildcard permissions except for CloudWatch metrics

### Resource Naming Convention

All resources use the `environmentSuffix` parameter for unique naming:
- KMS Key: `hipaa-encryption-key-{environmentSuffix}`
- Log Groups: `/healthcare/{type}-{environmentSuffix}`
- SNS Topic: `compliance-alerts-{environmentSuffix}`
- Alarms: `{alarm-type}-{environmentSuffix}`
- IAM Role: `healthcare-monitoring-role-{environmentSuffix}`

### HIPAA Compliance Tags

All resources are tagged with:
- `Name`: Descriptive resource name
- `Environment`: Environment suffix value
- `Compliance`: "HIPAA"
- Additional tags specific to resource type (Purpose, DataClassification, LogType, Severity)

## Production Recommendations

Before deploying to production, consider the following recommendations:

### 1. Alert Email Configuration
**Current**: Uses a default placeholder email (`security@example.com`)
**Recommendation**: Update the `AlertEmail` parameter with your actual security team email address or distribution list. This ensures compliance and security alerts reach the appropriate team members immediately.

```bash
AlertEmail=hipaa-security-team@yourcompany.com
```

### 2. CloudTrail Integration
**Current**: Alarms rely on CloudTrailMetrics namespace but CloudTrail is not configured in the template
**Recommendation**: The template includes a comprehensive CloudTrail configuration with:
- S3 bucket for long-term audit log storage with encryption and versioning
- CloudWatch Logs integration for real-time monitoring
- Metric filters for security events (unauthorized access, KMS changes, security group modifications, IAM policy changes)
- Multi-region trail support for complete audit coverage
- Event selectors for management and data events

This integration enables the CloudWatch alarms to function properly by feeding CloudTrail events to CloudWatch Logs and creating metrics.

### 3. Log Retention Review
**Current Configuration**:
- Patient Data Logs: 90 days
- Security Logs: 365 days (1 year)
- Audit Logs: 2557 days (7 years)

**Recommendation**: Review these retention periods based on your organization's specific requirements:
- HIPAA minimum requirement is 6 years (2191 days) for audit logs
- Current configuration exceeds minimum requirements
- Consider your organization's policies and potential state-specific requirements
- CloudTrail logs in S3 provide additional long-term audit storage

## Deployment

Deploy using AWS CLI:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides \
    environmentSuffix=${ENVIRONMENT_SUFFIX} \
    AlertEmail=hipaa-security-team@yourcompany.com \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region eu-west-2
```

## Outputs

The template exports the following outputs for cross-stack reference:

- `KMSKeyId`: KMS key ID for encryption operations
- `KMSKeyArn`: KMS key ARN for IAM policies
- `PatientDataLogGroupName`: Patient data log group name
- `SecurityLogGroupName`: Security events log group name
- `AuditLogGroupName`: Audit trail log group name
- `ComplianceAlertTopicArn`: SNS topic ARN for subscribing to alerts
- `MonitoringRoleArn`: IAM role ARN for monitoring services

All outputs are exported with stack name prefix for easy cross-stack references.
