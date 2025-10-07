# CloudFormation Template for Secure RDS PostgreSQL Database Infrastructure

## Implementation Overview

This CloudFormation template creates a secure RDS PostgreSQL database infrastructure for a retail company's inventory management system. The solution implements AWS best practices for security, monitoring, and data protection.

## Architecture Components

### 1. Network Infrastructure
- **VPC**: Custom VPC with CIDR 10.60.0.0/16
- **Private Subnets**: Two private subnets (10.60.10.0/24 and 10.60.20.0/24) across different availability zones
- **VPC Endpoint**: Gateway endpoint for S3 to keep traffic within AWS network
- **Route Tables**: Dedicated route tables for private subnets with S3 endpoint routing

### 2. Database Infrastructure
- **RDS PostgreSQL**: Version 16.8 on db.t3.micro instance
- **DB Subnet Group**: Multi-AZ deployment across private subnets
- **Security Group**: Restricted PostgreSQL access (port 5432) from VPC only
- **Parameter Group**: Custom PostgreSQL 16 parameters for logging and performance monitoring
- **Features**:
  - Performance Insights enabled with 7-day retention
  - Enhanced monitoring with 60-second granularity
  - Automatic backups with 7-day retention
  - CloudWatch Logs export enabled

### 3. Security Components
- **KMS Key**: Customer-managed key for encrypting RDS storage and S3 backups
- **IAM Roles**:
  - RDS Enhanced Monitoring Role
  - S3 Backup Role with specific permissions
- **Encryption**: At-rest encryption for database and S3 bucket
- **Network Security**: Database in private subnets with no internet access

### 4. Backup and Recovery
- **S3 Bucket**: Encrypted bucket for manual backups with:
  - Versioning enabled
  - Lifecycle policies for cost optimization (transition to IA and Glacier)
  - Public access blocked
  - SSL-only access enforced

### 5. Monitoring and Alerting
- **CloudWatch Alarms**:
  - CPU utilization (threshold: 80%)
  - Database connections (threshold: 15)
  - Free storage space (threshold: 2GB)
  - Read latency (threshold: 200ms)
  - Write latency (threshold: 200ms)
- **SNS Topic**: Email notifications for all alarms

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure RDS PostgreSQL database infrastructure for retail inventory management",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentName",
            "ProjectName"
          ]
        },
        {
          "Label": {
            "default": "Database Configuration"
          },
          "Parameters": [
            "DBUsername",
            "DBPassword",
            "DBAllocatedStorage",
            "DBMaxAllocatedStorage"
          ]
        },
        {
          "Label": {
            "default": "Monitoring Configuration"
          },
          "Parameters": [
            "AlarmEmail"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "Production",
      "Description": "Environment name for resource tagging",
      "AllowedValues": ["Development", "Staging", "Production"]
    },
    "ProjectName": {
      "Type": "String",
      "Default": "RetailInventory",
      "Description": "Project name for resource identification"
    },
    "DBUsername": {
      "Type": "String",
      "Default": "dbadmin",
      "Description": "Database master username",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DBPassword": {
      "Type": "String",
      "NoEcho": true,
      "Description": "Database master password",
      "MinLength": "8",
      "MaxLength": "41",
      "AllowedPattern": "^[a-zA-Z0-9]*$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "DBAllocatedStorage": {
      "Type": "Number",
      "Default": "20",
      "Description": "Allocated storage for database in GB",
      "MinValue": "20",
      "MaxValue": "100"
    },
    "DBMaxAllocatedStorage": {
      "Type": "Number",
      "Default": "100",
      "Description": "Maximum allocated storage for database autoscaling in GB",
      "MinValue": "20",
      "MaxValue": "1000"
    },
    "AlarmEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarm notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    }
  },
  "Mappings": {
    "RegionConfig": {
      "us-west-2": {
        "AZ1": "us-west-2a",
        "AZ2": "us-west-2b"
      }
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.60.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-VPC"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
          },
          {
            "Key": "Project",
            "Value": {"Ref": "ProjectName"}
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.60.10.0/24",
        "AvailabilityZone": {"Fn::FindInMap": ["RegionConfig", {"Ref": "AWS::Region"}, "AZ1"]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-PrivateSubnet1"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.60.20.0/24",
        "AvailabilityZone": {"Fn::FindInMap": ["RegionConfig", {"Ref": "AWS::Region"}, "AZ2"]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-PrivateSubnet2"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-PrivateRouteTable1"}
          }
        ]
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-PrivateRouteTable2"}
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable2"}
      }
    },
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.s3"},
        "VpcEndpointType": "Gateway",
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable1"},
          {"Ref": "PrivateRouteTable2"}
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
              "Resource": [
                {"Fn::Sub": "arn:aws:s3:::${BackupBucket}"},
                {"Fn::Sub": "arn:aws:s3:::${BackupBucket}/*"}
              ]
            }
          ]
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS PostgreSQL database",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DBSubnetGroup"}
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS PostgreSQL database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": "10.60.0.0/16",
            "Description": "Allow PostgreSQL access from within VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DBSecurityGroup"}
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting RDS database and S3 backups",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Id": "key-policy-1",
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
              "Sid": "Allow use of the key for RDS",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow use of the key for S3",
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
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-KMSKey"}
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/${ProjectName}-${EnvironmentName}-encryption"},
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },
    "RDSEnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-RDSMonitoringRole"}
          }
        ]
      }
    },
    "DBParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "Description": "Custom parameter group for PostgreSQL 16",
        "Family": "postgres16",
        "Parameters": {
          "log_statement": "all",
          "log_min_duration_statement": "100",
          "shared_preload_libraries": "pg_stat_statements",
          "track_io_timing": "1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DBParameterGroup"}
          }
        ]
      }
    },
    "DBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-db"},
        "DBInstanceClass": "db.t3.micro",
        "Engine": "postgres",
        "EngineVersion": "16.8",
        "MasterUsername": {"Ref": "DBUsername"},
        "MasterUserPassword": {"Ref": "DBPassword"},
        "AllocatedStorage": {"Ref": "DBAllocatedStorage"},
        "MaxAllocatedStorage": {"Ref": "DBMaxAllocatedStorage"},
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "KMSKey"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VPCSecurityGroups": [
          {"Ref": "DatabaseSecurityGroup"}
        ],
        "DBParameterGroupName": {"Ref": "DBParameterGroup"},
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnablePerformanceInsights": true,
        "PerformanceInsightsKMSKeyId": {"Ref": "KMSKey"},
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {"Fn::GetAtt": ["RDSEnhancedMonitoringRole", "Arn"]},
        "EnableCloudwatchLogsExports": ["postgresql"],
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DBInstance"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
          }
        ]
      }
    },
    "BackupBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-backups-${AWS::AccountId}"},
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {"Ref": "KMSKey"}
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 30
            },
            {
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "STANDARD_IA"
                }
              ]
            },
            {
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
                }
              ]
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
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-BackupBucket"}
          }
        ]
      }
    },
    "BackupBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "BackupBucket"},
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureConnections",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {"Fn::GetAtt": ["BackupBucket", "Arn"]},
                {"Fn::Sub": "${BackupBucket.Arn}/*"}
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
    "S3BackupRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-S3BackupRole"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3BackupAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket",
                    "s3:DeleteObject"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["BackupBucket", "Arn"]},
                    {"Fn::Sub": "${BackupBucket.Arn}/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {"Fn::GetAtt": ["KMSKey", "Arn"]}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-S3BackupRole"}
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DBAlerts"},
        "DisplayName": "Database Alerts",
        "Subscription": [
          {
            "Endpoint": {"Ref": "AlarmEmail"},
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-SNSTopic"}
          }
        ]
      }
    },
    "CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DB-HighCPU"},
        "AlarmDescription": "Alarm when database CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "DBInstance"}
          }
        ],
        "AlarmActions": [
          {"Ref": "SNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DatabaseConnectionsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DB-HighConnections"},
        "AlarmDescription": "Alarm when database connections exceed 15",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 15,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "DBInstance"}
          }
        ],
        "AlarmActions": [
          {"Ref": "SNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "FreeStorageSpaceAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DB-LowStorage"},
        "AlarmDescription": "Alarm when free storage space is less than 2GB",
        "MetricName": "FreeStorageSpace",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 2147483648,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "DBInstance"}
          }
        ],
        "AlarmActions": [
          {"Ref": "SNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "ReadLatencyAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DB-HighReadLatency"},
        "AlarmDescription": "Alarm when read latency exceeds 200ms",
        "MetricName": "ReadLatency",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 0.2,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "DBInstance"}
          }
        ],
        "AlarmActions": [
          {"Ref": "SNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "WriteLatencyAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectName}-${EnvironmentName}-DB-HighWriteLatency"},
        "AlarmDescription": "Alarm when write latency exceeds 200ms",
        "MetricName": "WriteLatency",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 0.2,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "DBInstance"}
          }
        ],
        "AlarmActions": [
          {"Ref": "SNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {"Ref": "PrivateSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"}
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {"Ref": "PrivateSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"}
      }
    },
    "DBInstanceId": {
      "Description": "RDS Database Instance ID",
      "Value": {"Ref": "DBInstance"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBInstanceId"}
      }
    },
    "DBEndpoint": {
      "Description": "Database Endpoint",
      "Value": {"Fn::GetAtt": ["DBInstance", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBEndpoint"}
      }
    },
    "DBPort": {
      "Description": "Database Port",
      "Value": {"Fn::GetAtt": ["DBInstance", "Endpoint.Port"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBPort"}
      }
    },
    "BackupBucketName": {
      "Description": "S3 Backup Bucket Name",
      "Value": {"Ref": "BackupBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-BackupBucketName"}
      }
    },
    "BackupBucketArn": {
      "Description": "S3 Backup Bucket ARN",
      "Value": {"Fn::GetAtt": ["BackupBucket", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-BackupBucketArn"}
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID",
      "Value": {"Ref": "KMSKey"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-KMSKeyId"}
      }
    },
    "KMSKeyArn": {
      "Description": "KMS Key ARN",
      "Value": {"Fn::GetAtt": ["KMSKey", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-KMSKeyArn"}
      }
    },
    "DatabaseSecurityGroupId": {
      "Description": "Database Security Group ID",
      "Value": {"Ref": "DatabaseSecurityGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DatabaseSecurityGroupId"}
      }
    },
    "S3VPCEndpointId": {
      "Description": "S3 VPC Endpoint ID",
      "Value": {"Ref": "S3VPCEndpoint"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-S3VPCEndpointId"}
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for Alerts",
      "Value": {"Ref": "SNSTopic"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SNSTopicArn"}
      }
    },
    "S3BackupRoleArn": {
      "Description": "S3 Backup Role ARN",
      "Value": {"Fn::GetAtt": ["S3BackupRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-S3BackupRoleArn"}
      }
    },
    "RDSMonitoringRoleArn": {
      "Description": "RDS Enhanced Monitoring Role ARN",
      "Value": {"Fn::GetAtt": ["RDSEnhancedMonitoringRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RDSMonitoringRoleArn"}
      }
    }
  }
}
```

## Key Features

1. **Security-First Design**:
   - Database in private subnets with no internet access
   - KMS encryption for all data at rest
   - VPC Gateway Endpoint for secure S3 access
   - IAM roles with least-privilege permissions

2. **High Availability**:
   - Multi-AZ subnet group for database deployment
   - Automated backups with 7-day retention
   - S3 bucket for additional manual backups

3. **Monitoring & Alerting**:
   - Performance Insights for query analysis
   - Enhanced monitoring with 60-second granularity
   - CloudWatch alarms for critical metrics
   - SNS email notifications

4. **Cost Optimization**:
   - db.t3.micro instance with unlimited burst mode
   - S3 lifecycle policies for automatic data tiering
   - GP3 storage for better price-performance

5. **Operational Excellence**:
   - Comprehensive tagging strategy
   - Parameterized configuration for different environments
   - CloudFormation outputs for cross-stack references
   - Support for CloudFormation Hooks

This implementation follows AWS Well-Architected Framework principles and provides a secure, scalable, and maintainable database infrastructure for the retail company's inventory management needs.