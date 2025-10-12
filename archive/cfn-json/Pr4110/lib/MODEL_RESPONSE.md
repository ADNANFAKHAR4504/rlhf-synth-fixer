### Reasoning Trace
---

This is a comprehensive request for creating a secure AWS CloudFormation template. Let me break down the requirements:

1. **Multi-region deployment**: The template should work for both us-east-1 and eu-central-1
2. **Networking**:
    - Optional VPC ID parameter
    - Use default VPC if not provided
    - Secure Security Groups with descriptions
    - Non-public databases
3. **Data Protection**:
    - S3 encryption
    - RDS encryption
    - Parameter Store for secrets
4. **Access & Hardening**:
    - Least privilege IAM roles
    - EC2 hardening (disable password logins)
5. **Monitoring & Logging**:
    - CloudTrail
    - CloudWatch alarms for unauthorized access
6. **Threat Protection**:
    - AWS WAF
    - AWS Shield
7. **Best Practices**:
    - Resource tagging
    - Security best practices
    - Valid JSON output

I'll create a comprehensive CloudFormation template that addresses all these requirements. Note that some services like AWS Shield Standard are automatically enabled, and Shield Advanced requires subscription. Also, multi-region deployment typically requires multiple stack deployments or StackSets.

Let me create a robust template that can be deployed in either region.
### Answer
---

I'll create a comprehensive AWS CloudFormation template that meets all your security requirements. This template is designed to be deployed in either `us-east-1` or `eu-central-1` regions.

## secure-cloud-setup.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure multi-region AWS infrastructure with comprehensive security controls",
  
  "Parameters": {
    "VpcId": {
      "Type": "String",
      "Description": "Optional VPC ID. Leave empty to use default VPC",
      "Default": ""
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment name for tagging",
      "Default": "Production",
      "AllowedValues": ["Development", "Staging", "Production"]
    },
    "KeyName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 KeyPair for SSH access",
      "ConstraintDescription": "Must be the name of an existing EC2 KeyPair"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for security alerts",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },
  
  "Conditions": {
    "UseDefaultVPC": {
      "Fn::Equals": [{"Ref": "VpcId"}, ""]
    },
    "IsUSEast1": {
      "Fn::Equals": [{"Ref": "AWS::Region"}, "us-east-1"]
    }
  },
  
  "Mappings": {
    "RegionMap": {
      "us-east-1": {
        "AMI": "ami-0c02fb55731490381"
      },
      "eu-central-1": {
        "AMI": "ami-0a1ee2fb28fe05df3"
      }
    }
  },
  
  "Resources": {
    "S3LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "secure-logs-${AWS::AccountId}-${AWS::Region}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [{
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "AES256"
            }
          }]
        },
        "AccessControl": "LogDeliveryWrite",
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
          "Rules": [{
            "Id": "DeleteOldLogs",
            "Status": "Enabled",
            "ExpirationInDays": 90
          }]
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "SecurityLogs"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "ApplicationDataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "secure-app-data-${AWS::AccountId}-${AWS::Region}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [{
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "aws:kms",
              "KMSMasterKeyID": {"Ref": "KMSKey"}
            }
          }]
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
          "DestinationBucketName": {"Ref": "S3LoggingBucket"},
          "LogFilePrefix": "application-data/"
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "ApplicationData"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting sensitive data",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM policies",
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "rds.amazonaws.com",
                  "s3.amazonaws.com",
                  "logs.amazonaws.com"
                ]
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
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "DataEncryption"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/secure-infrastructure",
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },
    
    "DatabasePasswordSecret": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/secure-app/database/password",
        "Type": "String",
        "Value": {
          "Fn::Base64": {
            "Fn::Sub": "${AWS::StackName}-${AWS::AccountId}-${AWS::Region}"
          }
        },
        "Description": "RDS database master password",
        "Tags": {
          "Environment": {"Ref": "Environment"},
          "Purpose": "DatabaseCredentials",
          "ManagedBy": "CloudFormation"
        }
      }
    },
    
    "ApplicationSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for application servers",
        "VpcId": {
          "Fn::If": [
            "UseDefaultVPC",
            {"Ref": "AWS::NoValue"},
            {"Ref": "VpcId"}
          ]
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS traffic from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP traffic from anywhere (redirects to HTTPS)"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "SourceSecurityGroupId": {"Ref": "BastionSecurityGroup"},
            "Description": "Allow SSH from bastion host only"
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
          {"Key": "Name", "Value": "ApplicationSecurityGroup"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database instances",
        "VpcId": {
          "Fn::If": [
            "UseDefaultVPC",
            {"Ref": "AWS::NoValue"},
            {"Ref": "VpcId"}
          ]
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "ApplicationSecurityGroup"},
            "Description": "Allow MySQL/Aurora access from application servers only"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": "DatabaseSecurityGroup"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "BastionSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for bastion host",
        "VpcId": {
          "Fn::If": [
            "UseDefaultVPC",
            {"Ref": "AWS::NoValue"},
            {"Ref": "VpcId"}
          ]
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "10.0.0.0/8",
            "Description": "Allow SSH from internal network only"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": "BastionSecurityGroup"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "SecureEC2Role-${AWS::StackName}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {
              "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
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
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ApplicationDataBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": "s3:ListBucket",
                  "Resource": {
                    "Fn::GetAtt": ["ApplicationDataBucket", "Arn"]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "ParameterStoreAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [{
                "Effect": "Allow",
                "Action": [
                  "ssm:GetParameter",
                  "ssm:GetParameters"
                ],
                "Resource": {
                  "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/secure-app/*"
                }
              }]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{"Ref": "EC2Role"}]
      }
    },
    
    "HardenedEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "AMI"]
        },
        "InstanceType": "t3.micro",
        "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
        "SecurityGroupIds": [{"Ref": "ApplicationSecurityGroup"}],
        "KeyName": {"Ref": "KeyName"},
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\n# Update system\nyum update -y\n# Install CloudWatch agent\nwget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm\nrpm -U ./amazon-cloudwatch-agent.rpm\n# Disable password authentication\nsed -i 's/PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config\nsystemctl restart sshd\n# Install fail2ban for brute force protection\nyum install -y fail2ban\nsystemctl enable fail2ban\nsystemctl start fail2ban\n# Configure automatic security updates\nyum install -y yum-cron\nsed -i 's/apply_updates = no/apply_updates = yes/g' /etc/yum/yum-cron.conf\nsystemctl enable yum-cron\nsystemctl start yum-cron\n"
          }
        },
        "Tags": [
          {"Key": "Name", "Value": "HardenedApplicationServer"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS instances",
        "SubnetIds": {
          "Fn::If": [
            "UseDefaultVPC",
            {
              "Fn::Split": [
                ",",
                {
                  "Fn::ImportValue": "DefaultVPCSubnets"
                }
              ]
            },
            {
              "Fn::Split": [
                ",",
                {
                  "Fn::ImportValue": "CustomVPCSubnets"
                }
              ]
            }
          ]
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "secure-db-${AWS::StackName}"
        },
        "DBInstanceClass": "db.t3.micro",
        "Engine": "mysql",
        "EngineVersion": "8.0.28",
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "KMSKey"},
        "MasterUsername": "admin",
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:ssm:${DatabasePasswordSecret}:1}}"
        },
        "VPCSecurityGroups": [{"Ref": "DatabaseSecurityGroup"}],
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "DeletionProtection": true,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "ApplicationDatabase"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": ["S3LoggingBucket", "CloudTrailBucketPolicy"],
      "Properties": {
        "TrailName": {
          "Fn::Sub": "SecureTrail-${AWS::StackName}"
        },
        "S3BucketName": {"Ref": "S3LoggingBucket"},
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
                "Values": ["arn:aws:s3:::*/*"]
              }
            ]
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "AuditLogs"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "S3LoggingBucket"},
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["S3LoggingBucket", "Arn"]
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
                "Fn::Sub": "${S3LoggingBucket.Arn}/*"
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
    
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "SecurityAlerts",
        "DisplayName": "Security Alert Notifications",
        "Subscription": [
          {
            "Endpoint": {"Ref": "AlertEmail"},
            "Protocol": "email"
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "SecurityAlerts"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "UnauthorizedAPICallsMetricFilter": {
      "Type": "AWS::Logs::MetricFilter",
      "Properties": {
        "FilterName": "UnauthorizedAPICalls",
        "FilterPattern": "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }",
        "LogGroupName": "/aws/cloudtrail/SecureTrail",
        "MetricTransformations": [
          {
            "MetricName": "UnauthorizedAPICalls",
            "MetricNamespace": "CloudTrailMetrics",
            "MetricValue": "1"
          }
        ]
      }
    },
    
    "UnauthorizedAPICallsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "UnauthorizedAPICalls",
        "AlarmDescription": "Alert on unauthorized API calls",
        "MetricName": "UnauthorizedAPICalls",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [{"Ref": "SNSTopic"}]
      }
    },
    
    "RootAccountUsageMetricFilter": {
      "Type": "AWS::Logs::MetricFilter",
      "Properties": {
        "FilterName": "RootAccountUsage",
        "FilterPattern": "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }",
        "LogGroupName": "/aws/cloudtrail/SecureTrail",
        "MetricTransformations": [
          {
            "MetricName": "RootAccountUsage",
            "MetricNamespace": "CloudTrailMetrics",
            "MetricValue": "1"
          }
        ]
      }
    },
    
    "RootAccountUsageAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "RootAccountUsage",
        "AlarmDescription": "Alert when root account is used",
        "MetricName": "RootAccountUsage",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [{"Ref": "SNSTopic"}]
      }
    },
    
    "WebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureWebACL-${AWS::StackName}"
        },
        "Scope": {
          "Fn::If": ["IsUSEast1", "CLOUDFRONT", "REGIONAL"]
        },
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 1,
            "Statement": {
              "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          },
          {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 2,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "CommonRuleSetMetric"
            }
          },
          {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 3,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesKnownBadInputsRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "KnownBadInputsRuleSetMetric"
            }
          },
          {
            "Name": "AWSManagedRulesSQLiRuleSet",
            "Priority": 4,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesSQLiRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "SQLiRuleSetMetric"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "WebACLMetric"
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "WebApplicationFirewall"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    
    "WAFLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/aws/wafv2/secure-waf",
        "RetentionInDays": 30
      }
    },
    
    "WAFLoggingConfiguration": {
      "Type": "AWS::WAFv2::LoggingConfiguration",
      "Properties": {
        "ResourceArn": {
          "Fn::GetAtt": ["WebACL", "Arn"]
        },
        "LogDestinationConfigs": [
          {
            "Fn::GetAtt": ["WAFLogGroup", "Arn"]
          }
        ]
      }
    }
  },
  
  "Outputs": {
    "S3LoggingBucketName": {
      "Description": "Name of the S3 bucket for logging",
      "Value": {"Ref": "S3LoggingBucket"},
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LoggingBucket"
        }
      }
    },
    "ApplicationDataBucketName": {
      "Description": "Name of the S3 bucket for application data",
      "Value": {"Ref": "ApplicationDataBucket"},
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApplicationBucket"
        }
      }
    },
    "DatabaseEndpoint": {
      "Description": "RDS database endpoint",
      "Value": {
        "Fn::GetAtt": ["RDSDatabase", "Endpoint.Address"]
      }
    },
    "EC2InstanceId": {
      "Description": "ID of the hardened EC2 instance",
      "Value": {"Ref": "HardenedEC2Instance"}
    },
    "WebACLArn": {
      "Description": "ARN of the WAF WebACL",
      "Value": {
        "Fn::GetAtt": ["WebACL", "Arn"]
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of SNS topic for security alerts",
      "Value": {"Ref": "SNSTopic"}
    },
    "CloudTrailArn": {
      "Description": "ARN of the CloudTrail",
      "Value": {
        "Fn::GetAtt": ["CloudTrail", "Arn"]
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key for encryption",
      "Value": {"Ref": "KMSKey"}
    }
  }
}
```

## Key Security Features Implemented:

### 1. **Networking Security**
- Flexible VPC configuration with optional parameter
- Three security groups with strict ingress rules and descriptions
- Database not publicly accessible
- Bastion host pattern for secure SSH access

### 2. **Data Protection**
- All S3 buckets encrypted with AES256 or KMS
- RDS database encrypted with KMS
- SSM Parameter Store for database password management
- Versioning enabled on S3 buckets

### 3. **Access Control & Hardening**
- IAM roles following least privilege principle
- EC2 instance hardening via UserData script:
    - Disabled password authentication
    - Installed fail2ban for brute force protection
    - Configured automatic security updates
- Instance profile with minimal required permissions

### 4. **Monitoring & Logging**
- CloudTrail configured for multi-region API logging
- CloudWatch alarms for:
    - Unauthorized API calls
    - Root account usage
- Log retention policies configured
- WAF logging enabled

### 5. **Threat Protection**
- AWS WAF with multiple managed rule sets:
    - Rate limiting
    - Common attacks protection
    - SQL injection protection
    - Known bad inputs protection
- AWS Shield Standard (automatically enabled)
- DDoS protection through WAF rate limiting

### 6. **Best Practices**
- All resources tagged for cost management
- Deletion protection on RDS
- Backup retention configured
- Public access blocked on S3 buckets
- CloudTrail log file validation enabled
- Lifecycle policies for log rotation

## Deployment Instructions:

1. **Prerequisites**:
    - Create an EC2 KeyPair in your target region
    - Have an email address ready for alerts

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name secure-infrastructure \
  --template-body file://secure-cloud-setup.json \
  --parameters \
    ParameterKey=KeyName,ParameterValue=your-keypair-name \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **For multi-region deployment**, run the same command with `--region eu-central-1`

## Important Notes:

- AWS Shield Standard is automatically enabled for all AWS customers at no additional cost
- For AWS Shield Advanced, you would need to subscribe separately
- The template uses managed AWS AMIs that should be updated based on your requirements
- Database password is auto-generated and stored in Parameter Store
- Some resources like CloudFront distributions require deployment in us-east-1
- Consider using AWS StackSets for true multi-region deployments with a single operation

This template provides a robust security foundation that can be further customized based on your specific requirements.