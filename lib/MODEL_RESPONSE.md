### Reasoning Trace
---

The user is asking for a CloudFormation template that sets up a secure baseline for an AWS environment. Let me break down all the requirements:

1. IAM: Create a role with read-only S3 access policy
2. VPC Security:
    - VPC Flow Log for a new VPC
    - Security Group with SSH (22) and HTTP (80) from 10.0.0.0/16
3. Logging and Monitoring:
    - CloudTrail with logs to secure S3 bucket
    - CloudWatch Alarm for failed console sign-ins
4. Data Protection:
    - Customer-managed KMS key
    - Private S3 bucket encrypted with the KMS key
    - Bucket policy restricting access to specific CIDR
5. Secrets Management:
    - Store sample database password in SSM Parameter Store as SecureString
6. Compliance:
    - AWS Config rule for publicly accessible S3 buckets

I'll create a comprehensive CloudFormation template in JSON format that includes all these components. Let me structure this properly:

- Parameters section for customizable values
- Resources section with all the required components
- Outputs section for important resource references

I'll make sure to include proper dependencies and configurations for each resource.
### Answer
---

I'll create a comprehensive AWS CloudFormation template that establishes a secure baseline for your AWS environment. This template includes all the security components you've requested.

## cloud_security_template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure baseline CloudFormation template for AWS environment with security best practices",
  
  "Parameters": {
    "AllowedIPRange": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "IP address range allowed for SSH and HTTP access"
    },
    "S3BucketAllowedCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/8",
      "Description": "CIDR block allowed to access the private S3 bucket"
    },
    "DatabasePassword": {
      "Type": "String",
      "NoEcho": true,
      "Default": "MySecurePassword123!",
      "Description": "Sample database password to store in Parameter Store"
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
            "Value": "SecureVPC"
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
      "DependsOn": ["VPCFlowLogGroup", "VPCFlowLogRole"],
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": { "Ref": "VPC" },
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": "/aws/vpc/flowlogs",
        "DeliverLogsPermissionArn": { "Fn::GetAtt": ["VPCFlowLogRole", "Arn"] },
        "Tags": [
          {
            "Key": "Name",
            "Value": "VPCFlowLog"
          }
        ]
      }
    },
    
    "SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group allowing SSH and HTTP from specific IP range",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": { "Ref": "AllowedIPRange" },
            "Description": "Allow SSH from specific IP range"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": { "Ref": "AllowedIPRange" },
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
            "Value": "SecureSecurityGroup"
          }
        ]
      }
    },
    
    "IAMRoleS3ReadOnly": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "S3ReadOnlyRole",
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
          "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
        ],
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "S3ReadOnlyAccess"
          }
        ]
      }
    },
    
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "Customer-managed KMS key for encryption",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
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
                "kms:DecryptDataKey"
              ],
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
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "SecurityBaselineKMSKey"
          }
        ]
      }
    },
    
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/security-baseline-key",
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    },
    
    "CloudTrailS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "cloudtrail-logs-${AWS::AccountId}-${AWS::Region}" },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
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
        "Bucket": { "Ref": "CloudTrailS3Bucket" },
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
              "Resource": { "Fn::GetAtt": ["CloudTrailS3Bucket", "Arn"] }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${CloudTrailS3Bucket.Arn}/*" },
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
      "DependsOn": ["CloudTrailS3BucketPolicy"],
      "Properties": {
        "TrailName": "SecurityBaselineTrail",
        "S3BucketName": { "Ref": "CloudTrailS3Bucket" },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EnableLogFileValidation": true,
        "KMSKeyId": { "Ref": "KMSKey" },
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true,
            "DataResources": [
              {
                "Type": "AWS::S3::Object",
                "Values": ["arn:aws:s3:::*/*"]
              }
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "SecurityAudit"
          }
        ]
      }
    },
    
    "FailedSignInMetricFilter": {
      "Type": "AWS::Logs::MetricFilter",
      "Properties": {
        "FilterName": "FailedConsoleSignIn",
        "FilterPattern": "{ ($.eventName = ConsoleLogin) && ($.responseElements.ConsoleLogin = \"Failure\") }",
        "LogGroupName": { "Fn::Sub": "/aws/cloudtrail/${CloudTrail}" },
        "MetricTransformations": [
          {
            "MetricName": "FailedConsoleSignInCount",
            "MetricNamespace": "CloudTrailMetrics",
            "MetricValue": "1",
            "DefaultValue": 0
          }
        ]
      }
    },
    
    "FailedSignInAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "FailedConsoleSignInAlarm",
        "AlarmDescription": "Alarm triggered on failed AWS console sign-in attempts",
        "MetricName": "FailedConsoleSignInCount",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 3,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching"
      }
    },
    
    "PrivateS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "private-secure-bucket-${AWS::AccountId}-${AWS::Region}" },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
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
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "PrivateDataStorage"
          }
        ]
      }
    },
    
    "PrivateS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "PrivateS3Bucket" },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowAccessFromSpecificCIDR",
              "Effect": "Allow",
              "Principal": "*",
              "Action": [
                "s3:GetObject",
                "s3:ListBucket"
              ],
              "Resource": [
                { "Fn::GetAtt": ["PrivateS3Bucket", "Arn"] },
                { "Fn::Sub": "${PrivateS3Bucket.Arn}/*" }
              ],
              "Condition": {
                "IpAddress": {
                  "aws:SourceIp": { "Ref": "S3BucketAllowedCIDR" }
                }
              }
            },
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                { "Fn::GetAtt": ["PrivateS3Bucket", "Arn"] },
                { "Fn::Sub": "${PrivateS3Bucket.Arn}/*" }
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
    
    "DatabasePasswordParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/secure/database/password",
        "Description": "Securely stored database password",
        "Type": "SecureString",
        "Value": { "Ref": "DatabasePassword" },
        "KeyId": { "Ref": "KMSKey" },
        "Tags": {
          "Purpose": "DatabaseCredentials",
          "Environment": "Production"
        }
      }
    },
    
    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "Properties": {
        "Name": "SecurityConfigRecorder",
        "RoleArn": { "Fn::GetAtt": ["ConfigRole", "Arn"] },
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
            "PolicyName": "S3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketAcl",
                    "s3:ListBucket"
                  ],
                  "Resource": { "Fn::GetAtt": ["ConfigS3Bucket", "Arn"] }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": { "Fn::Sub": "${ConfigS3Bucket.Arn}/*" },
                  "Condition": {
                    "StringEquals": {
                      "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                  }
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
        "BucketName": { "Fn::Sub": "config-bucket-${AWS::AccountId}-${AWS::Region}" },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
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
        "Bucket": { "Ref": "ConfigS3Bucket" },
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
              "Resource": { "Fn::GetAtt": ["ConfigS3Bucket", "Arn"] }
            },
            {
              "Sid": "AWSConfigBucketExistenceCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:ListBucket",
              "Resource": { "Fn::GetAtt": ["ConfigS3Bucket", "Arn"] }
            },
            {
              "Sid": "AWSConfigBucketWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${ConfigS3Bucket.Arn}/*" },
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
        "Name": "SecurityConfigDeliveryChannel",
        "S3BucketName": { "Ref": "ConfigS3Bucket" },
        "ConfigSnapshotDeliveryProperties": {
          "DeliveryFrequency": "TwentyFour_Hours"
        }
      }
    },
    
    "S3PublicReadProhibitedRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder", "ConfigDeliveryChannel"],
      "Properties": {
        "ConfigRuleName": "s3-bucket-public-read-prohibited",
        "Description": "Checks that S3 buckets do not allow public read access",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_PUBLIC_READ_PROHIBITED"
        }
      }
    }
  },
  
  "Outputs": {
    "VPCId": {
      "Description": "ID of the created VPC",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPCId" }
      }
    },
    "SecurityGroupId": {
      "Description": "ID of the created Security Group",
      "Value": { "Ref": "SecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-SecurityGroupId" }
      }
    },
    "IAMRoleArn": {
      "Description": "ARN of the S3 read-only IAM role",
      "Value": { "Fn::GetAtt": ["IAMRoleS3ReadOnly", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-IAMRoleArn" }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key for encryption",
      "Value": { "Ref": "KMSKey" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-KMSKeyId" }
      }
    },
    "CloudTrailArn": {
      "Description": "ARN of the CloudTrail",
      "Value": { "Fn::GetAtt": ["CloudTrail", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-CloudTrailArn" }
      }
    },
    "PrivateS3BucketName": {
      "Description": "Name of the private encrypted S3 bucket",
      "Value": { "Ref": "PrivateS3Bucket" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateS3BucketName" }
      }
    },
    "DatabasePasswordParameterName": {
      "Description": "Name of the SSM parameter storing the database password",
      "Value": { "Ref": "DatabasePasswordParameter" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DatabasePasswordParameter" }
      }
    }
  }
}
```

## Key Features of this Template

### 1. **IAM Security**
- Created an IAM role with read-only S3 access following least privilege principle
- Role can be assumed by EC2 instances

### 2. **VPC Security**
- VPC with Flow Logs enabled for traffic monitoring
- Security Group restricting SSH and HTTP to specific IP range (10.0.0.0/16)
- Flow logs stored in CloudWatch for analysis

### 3. **Logging and Monitoring**
- CloudTrail configured for comprehensive audit logging
- Logs encrypted with KMS and stored in secure S3 bucket
- CloudWatch alarm for failed console sign-in attempts (triggers after 3 failures)

### 4. **Data Protection**
- Customer-managed KMS key for encryption across services
- Private S3 bucket with KMS encryption
- Bucket policy restricting access to specific CIDR block
- Enforces HTTPS-only connections

### 5. **Secrets Management**
- Database password stored securely in SSM Parameter Store
- Encrypted using the custom KMS key
- Can be retrieved programmatically by authorized services

### 6. **Compliance**
- AWS Config enabled with configuration recording
- Config rule to detect and flag publicly accessible S3 buckets
- Configuration history stored in encrypted S3 bucket

## Deployment Instructions

1. Save the template as `cloud_security_template.json`

2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name security-baseline-stack \
  --template-body file://cloud_security_template.json \
  --parameters ParameterKey=DatabasePassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

3. Monitor stack creation:
```bash
aws cloudformation describe-stacks \
  --stack-name security-baseline-stack \
  --region us-west-2
```

## Security Best Practices Implemented

- **Encryption at rest**: All storage services use KMS encryption
- **Least privilege access**: IAM roles and policies follow minimal permissions
- **Network segmentation**: VPC and Security Groups control network access
- **Audit logging**: CloudTrail and VPC Flow Logs provide comprehensive logging
- **Compliance monitoring**: AWS Config rules check for security violations
- **Secret management**: Sensitive data stored securely in Parameter Store
- **Versioning**: S3 buckets have versioning enabled for data protection
- **Public access blocking**: All S3 buckets block public access by default

This template provides a solid security foundation that can be customized based on your specific requirements.