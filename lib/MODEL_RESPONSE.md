### Reasoning Trace
---

The user is asking for a comprehensive AWS CloudFormation template in JSON format that sets up a secure baseline for an AWS environment. Let me break down the requirements:

1. **IAM**: Create an IAM role with read-only S3 access
2. **VPC Security**:
    - VPC Flow Logs
    - Security Group with specific inbound rules
3. **Logging and Monitoring**:
    - CloudTrail with S3 bucket
    - CloudWatch Alarm for failed console sign-ins
    - GuardDuty
4. **Data Protection**:
    - KMS key
    - S3 bucket encrypted with KMS
    - Bucket policy with CIDR restrictions
5. **Secrets Management**:
    - SSM Parameter Store with SecureString
6. **Compliance**:
    - AWS Config rule for public S3 buckets

I need to create a comprehensive CloudFormation template that includes all these resources with proper dependencies and configurations.

Let me structure this properly:

1. Start with Parameters section for flexibility
2. Create resources in logical order with dependencies
3. Add proper comments
4. Ensure all security best practices are followed

Key considerations:
- CloudTrail needs an S3 bucket with proper bucket policy
- VPC Flow Logs need a VPC first
- Config needs to be enabled before rules can be created
- GuardDuty detector creation
- KMS key with proper key policy
- S3 bucket policies with CIDR restrictions
- SSM Parameter with SecureString type

Let me create this template step by step.
### Answer
---

I'll create a comprehensive AWS CloudFormation template that establishes a secure baseline for your AWS environment. This template includes all the security controls you've requested with detailed comments.

## cloud_security_template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS Security Baseline Template - Provisions essential security resources including IAM, VPC security, logging, monitoring, encryption, and compliance controls",
  
  "Parameters": {
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
            "Value": "SecurityBaselineVPC"
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
        "LogGroupName": "/aws/vpc/flowlogs",
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
            "Value": "SecurityVPCFlowLog"
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
            "Value": "WebSecurityGroup"
          }
        ]
      }
    },
    
    "S3ReadOnlyRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "S3ReadOnlyAccessRole",
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
        "ManagedPolicyArns": [],
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
        "Description": "Customer-managed KMS key for data encryption",
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
        "AliasName": "alias/security-baseline-key",
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    
    "CloudTrailS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloudtrail-logs-${AWS::AccountId}-${AWS::Region}"
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
        "TrailName": "SecurityBaselineTrail",
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
            "IncludeManagementEvents": true,
            "DataResources": [
              {
                "Type": "AWS::S3::Object",
                "Values": ["arn:aws:s3:::*/"]
              }
            ]
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
    
    "ConsoleSignInMetricFilter": {
      "Type": "AWS::Logs::MetricFilter",
      "Properties": {
        "FilterName": "ConsoleSignInFailures",
        "FilterPattern": "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }",
        "LogGroupName": {
          "Fn::Sub": "/aws/cloudtrail/${CloudTrail}"
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
        "AlarmName": "ConsoleSignInFailures",
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
    
    "GuardDutyDetector": {
      "Type": "AWS::GuardDuty::Detector",
      "Properties": {
        "Enable": true,
        "FindingPublishingFrequency": "FIFTEEN_MINUTES",
        "DataSources": {
          "S3Logs": {
            "Enable": true
          },
          "Kubernetes": {
            "AuditLogs": {
              "Enable": true
            }
          }
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ThreatDetection"
          }
        ]
      }
    },
    
    "SecureS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "secure-data-${AWS::AccountId}-${AWS::Region}"
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
              "Sid": "RestrictToCIDRBlock",
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
                "IpAddressNotEquals": {
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
    
    "DatabasePasswordParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/security/database/password",
        "Description": "Securely stored database password",
        "Type": "SecureString",
        "Value": "ChangeMeImmediately123!",
        "Tags": {
          "Purpose": "DatabaseCredentials",
          "Environment": "Production"
        }
      }
    },
    
    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "Properties": {
        "Name": "SecurityBaselineRecorder",
        "RoleArn": {
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
          "arn:aws:iam::aws:policy/service-role/ConfigRole"
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
          "Fn::Sub": "aws-config-bucket-${AWS::AccountId}-${AWS::Region}"
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
        "Name": "SecurityBaselineDeliveryChannel",
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
        "ConfigRuleName": "s3-bucket-public-read-prohibited",
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
        "Name": "SecurityVPC-ID"
      }
    },
    "SecurityGroupId": {
      "Description": "ID of the Web Security Group",
      "Value": {
        "Ref": "WebSecurityGroup"
      },
      "Export": {
        "Name": "WebSecurityGroup-ID"
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS Key for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": "KMSKey-ID"
      }
    },
    "SecureS3BucketName": {
      "Description": "Name of the secure S3 bucket",
      "Value": {
        "Ref": "SecureS3Bucket"
      },
      "Export": {
        "Name": "SecureS3Bucket-Name"
      }
    },
    "CloudTrailName": {
      "Description": "Name of the CloudTrail",
      "Value": {
        "Ref": "CloudTrail"
      },
      "Export": {
        "Name": "CloudTrail-Name"
      }
    },
    "GuardDutyDetectorId": {
      "Description": "ID of the GuardDuty Detector",
      "Value": {
        "Ref": "GuardDutyDetector"
      },
      "Export": {
        "Name": "GuardDutyDetector-ID"
      }
    },
    "IAMRoleArn": {
      "Description": "ARN of the S3 Read-Only IAM Role",
      "Value": {
        "Fn::GetAtt": ["S3ReadOnlyRole", "Arn"]
      },
      "Export": {
        "Name": "S3ReadOnlyRole-ARN"
      }
    }
  }
}
```

## Key Security Features Implemented

This CloudFormation template implements the following security controls:

### 1. **Identity and Access Management (IAM)**
- Creates an IAM role with least-privilege S3 read-only access
- Implements proper assume role policies for EC2 instances

### 2. **Network Security**
- Establishes a VPC with Flow Logs enabled for network traffic monitoring
- Creates a Security Group with restricted inbound access (SSH/HTTP) from specified IP ranges only

### 3. **Logging and Monitoring**
- Enables CloudTrail for comprehensive API logging across all regions
- Stores CloudTrail logs in an encrypted S3 bucket with lifecycle policies
- Sets up CloudWatch alarms to detect failed console sign-in attempts
- Activates GuardDuty for automated threat detection

### 4. **Data Protection**
- Creates a customer-managed KMS key for encryption at rest
- Implements S3 bucket encryption using KMS
- Enforces SSL/TLS connections for S3 access
- Restricts S3 bucket access to specific CIDR blocks

### 5. **Secrets Management**
- Stores sensitive data (database password) in Systems Manager Parameter Store as SecureString
- Uses KMS for parameter encryption

### 6. **Compliance and Governance**
- Enables AWS Config for configuration tracking
- Implements Config rules to detect publicly accessible S3 buckets
- Maintains audit trails with log file validation

## Deployment Instructions

1. Save the template as `cloud_security_template.json`

2. Validate the template:
```bash
aws cloudformation validate-template \
  --template-body file://cloud_security_template.json \
  --region us-west-2
```

3. Deploy the stack:
```bash
aws cloudformation create-stack \
  --stack-name security-baseline \
  --template-body file://cloud_security_template.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2 \
  --parameters \
    ParameterKey=AllowedIPRange,ParameterValue=10.0.0.0/16 \
    ParameterKey=S3AccessCIDR,ParameterValue=10.0.0.0/16
```

4. Monitor the deployment:
```bash
aws cloudformation describe-stacks \
  --stack-name security-baseline \
  --region us-west-2 \
  --query 'Stacks[0].StackStatus'
```

## Important Notes

- **Change Default Values**: Update the database password in SSM Parameter Store immediately after deployment
- **Review IP Ranges**: Adjust the CIDR blocks in parameters to match your organization's requirements
- **Cost Considerations**: Some services (GuardDuty, Config, KMS) incur ongoing charges
- **Bucket Names**: S3 bucket names must be globally unique; the template uses account ID and region to ensure uniqueness
- **Regional Deployment**: This template is designed for us-west-2 but can be adapted for other regions

This template provides a robust security foundation that follows AWS best practices and can be customized further based on your specific requirements.