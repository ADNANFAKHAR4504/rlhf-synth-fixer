# IDEAL RESPONSE: Aurora MySQL CloudFormation Stack

This document mirrors every file under `lib/` so reviewers can inspect the authoritative implementation without leaving this reference.

## File: TapStack.json

````json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly Available Aurora MySQL Cluster for Transaction Processing with Multi-AZ, encryption, automated backups, and CloudWatch monitoring",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "prod",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase alphanumeric characters and hyphens"
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for the VPC",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for private subnet 1",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for private subnet 2",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "PrivateSubnet3CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for private subnet 3",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.r6g.xlarge",
      "Description": "Aurora DB instance class optimized for transaction processing",
      "AllowedValues": [
        "db.r6g.large",
        "db.r6g.xlarge",
        "db.r6g.2xlarge",
        "db.r6g.4xlarge",
        "db.r5.large",
        "db.r5.xlarge",
        "db.r5.2xlarge"
      ]
    },
    "DBName": {
      "Type": "String",
      "Default": "transactiondb",
      "Description": "Database name for Aurora MySQL cluster",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Master username for Aurora MySQL cluster",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "BackupRetentionPeriod": {
      "Type": "Number",
      "Default": 7,
      "MinValue": 7,
      "MaxValue": 35,
      "Description": "Number of days to retain automated backups (minimum 7 days)"
    },
    "PreferredBackupWindow": {
      "Type": "String",
      "Default": "03:00-04:00",
      "Description": "Preferred backup window (UTC time)"
    },
    "PreferredMaintenanceWindow": {
      "Type": "String",
      "Default": "sun:04:00-sun:05:00",
      "Description": "Preferred maintenance window (UTC time)"
    },
    "CPUAlarmThreshold": {
      "Type": "Number",
      "Default": 80,
      "MinValue": 1,
      "MaxValue": 100,
      "Description": "CPU utilization threshold for CloudWatch alarm (%)"
    },
    "ConnectionAlarmThreshold": {
      "Type": "Number",
      "Default": 1000,
      "MinValue": 1,
      "Description": "Database connections threshold for CloudWatch alarm"
    },
    "ReplicationLagThreshold": {
      "Type": "Number",
      "Default": 1000,
      "MinValue": 100,
      "Description": "Replication lag threshold in milliseconds for CloudWatch alarm"
    },
    "AlarmEmailEndpoint": {
      "Type": "String",
      "Default": "ops@example.com",
      "Description": "Email address for CloudWatch alarm notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Transaction Processing Database"
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
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
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
              "Fn::Sub": "aurora-private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
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
              "Fn::Sub": "aurora-private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
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
        "CidrBlock": {
          "Ref": "PrivateSubnet3CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            2,
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
              "Fn::Sub": "aurora-private-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora MySQL cluster spanning multiple availability zones",
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "aurora-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora MySQL cluster with least-privilege access",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": {
              "Ref": "VpcCIDR"
            },
            "Description": "MySQL access from VPC"
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
              "Fn::Sub": "aurora-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for Aurora MySQL cluster encryption at rest",
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
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:CreateGrant"
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
              "Fn::Sub": "aurora-kms-key-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/aurora-mysql-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },

    "DBClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "DBClusterParameterGroupName": {
          "Fn::Sub": "aurora-cluster-params-${EnvironmentSuffix}"
        },
        "Description": "Aurora MySQL cluster parameter group optimized for transaction processing",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "innodb_flush_log_at_trx_commit": "1",
          "binlog_format": "ROW",
          "transaction_isolation": "READ-COMMITTED",
          "max_connections": "2000",
          "character_set_server": "utf8mb4",
          "collation_server": "utf8mb4_unicode_ci",
          "innodb_lock_wait_timeout": "50",
          "innodb_print_all_deadlocks": "1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-cluster-params-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "DBParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "DBParameterGroupName": {
          "Fn::Sub": "aurora-instance-params-${EnvironmentSuffix}"
        },
        "Description": "Aurora MySQL instance parameter group optimized for transaction processing",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "slow_query_log": "1",
          "long_query_time": "2",
          "log_queries_not_using_indexes": "1",
          "general_log": "0"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-params-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "DBPassword": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "aurora-mysql-password-${EnvironmentSuffix}"
        },
        "Description": "Master password for Aurora MySQL cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\":\"${DBMasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-password-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "AuroraDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-mysql-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "EngineMode": "provisioned",
        "DatabaseName": {
          "Ref": "DBName"
        },
        "MasterUsername": {
          "Ref": "DBMasterUsername"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBPassword}:SecretString:password}}"
        },
        "DBClusterParameterGroupName": {
          "Ref": "DBClusterParameterGroup"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "BackupRetentionPeriod": {
          "Ref": "BackupRetentionPeriod"
        },
        "PreferredBackupWindow": {
          "Ref": "PreferredBackupWindow"
        },
        "PreferredMaintenanceWindow": {
          "Ref": "PreferredMaintenanceWindow"
        },
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery",
          "audit"
        ],
        "DeletionProtection": false,
        "CopyTagsToSnapshot": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Transaction Processing"
          }
        ]
      }
    },

    "AuroraDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-mysql-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "KMSKey"
        },
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSEnhancedMonitoringRole",
            "Arn"
          ]
        },
        "PromotionTier": 1,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-instance-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Role",
            "Value": "Primary"
          }
        ]
      }
    },

    "AuroraDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-mysql-instance-2-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "KMSKey"
        },
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSEnhancedMonitoringRole",
            "Arn"
          ]
        },
        "PromotionTier": 2,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-instance-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Role",
            "Value": "Read Replica"
          }
        ]
      }
    },

    "AuroraDBInstance3": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-mysql-instance-3-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "KMSKey"
        },
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSEnhancedMonitoringRole",
            "Arn"
          ]
        },
        "PromotionTier": 3,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-instance-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Role",
            "Value": "Read Replica"
          }
        ]
      }
    },

    "RDSEnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "aurora-enhanced-monitoring-role-${EnvironmentSuffix}"
        },
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
            "Value": {
              "Fn::Sub": "aurora-enhanced-monitoring-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "aurora-alarms-${EnvironmentSuffix}"
        },
        "DisplayName": "Aurora MySQL Database Alarms",
        "Subscription": [
          {
            "Protocol": "email",
            "Endpoint": {
              "Ref": "AlarmEmailEndpoint"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-alarms-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "CPUAlarmInstance1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-cpu-high-instance-1-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU utilization exceeds threshold on Instance 1",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "CPUAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance1"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "CPUAlarmInstance2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-cpu-high-instance-2-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU utilization exceeds threshold on Instance 2",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "CPUAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance2"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "CPUAlarmInstance3": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-cpu-high-instance-3-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU utilization exceeds threshold on Instance 3",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "CPUAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance3"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "DatabaseConnectionsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-connections-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when database connections exceed threshold",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "ConnectionAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraDBCluster"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "ReplicationLagAlarmInstance2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-replication-lag-instance-2-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when replication lag exceeds threshold on Instance 2",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "ReplicationLagThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance2"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "ReplicationLagAlarmInstance3": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-replication-lag-instance-3-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when replication lag exceeds threshold on Instance 3",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "ReplicationLagThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance3"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "FreeableMemoryAlarmInstance1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-memory-low-instance-1-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when freeable memory is low on Instance 1",
        "MetricName": "FreeableMemory",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1073741824,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance1"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },

  "Outputs": {
    "ClusterEndpoint": {
      "Description": "Aurora MySQL cluster writer endpoint for write operations",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterEndpoint"
        }
      }
    },

    "ClusterReaderEndpoint": {
      "Description": "Aurora MySQL cluster reader endpoint for read operations",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterReaderEndpoint"
        }
      }
    },

    "ClusterPort": {
      "Description": "Aurora MySQL cluster port",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "Endpoint.Port"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterPort"
        }
      }
    },

    "DatabaseName": {
      "Description": "Database name",
      "Value": {
        "Ref": "DBName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseName"
        }
      }
    },

    "ClusterIdentifier": {
      "Description": "Aurora MySQL cluster identifier",
      "Value": {
        "Ref": "AuroraDBCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterIdentifier"
        }
      }
    },

    "Instance1Identifier": {
      "Description": "Aurora MySQL instance 1 identifier (Primary)",
      "Value": {
        "Ref": "AuroraDBInstance1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Instance1Identifier"
        }
      }
    },

    "Instance2Identifier": {
      "Description": "Aurora MySQL instance 2 identifier (Read Replica)",
      "Value": {
        "Ref": "AuroraDBInstance2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Instance2Identifier"
        }
      }
    },

    "Instance3Identifier": {
      "Description": "Aurora MySQL instance 3 identifier (Read Replica)",
      "Value": {
        "Ref": "AuroraDBInstance3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Instance3Identifier"
        }
      }
    },

    "KMSKeyId": {
      "Description": "KMS key ID used for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },

    "SecurityGroupId": {
      "Description": "Security group ID for database access",
      "Value": {
        "Ref": "DBSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecurityGroupId"
        }
      }
    },

    "VPCId": {
      "Description": "VPC ID where cluster is deployed",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },

    "PasswordSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing the database password",
      "Value": {
        "Ref": "DBPassword"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PasswordSecretArn"
        }
      }
    },

    "SNSTopicArn": {
      "Description": "SNS topic ARN for CloudWatch alarms",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    }
  }
}

````

## File: MODEL_RESPONSE.md

````markdown
# Aurora MySQL Cluster CloudFormation Template

I'll create a highly available Aurora MySQL cluster for your transaction processing system. This template includes Multi-AZ deployment, encryption, backups, and monitoring.

## File: lib/template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly Available Aurora MySQL Cluster for Transaction Processing with Multi-AZ, encryption, automated backups, and CloudWatch monitoring",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "prod"
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for the VPC"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for private subnet 1"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for private subnet 2"
    },
    "PrivateSubnet3CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for private subnet 3"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.r6g.xlarge",
      "Description": "Aurora DB instance class optimized for transaction processing"
    },
    "DBName": {
      "Type": "String",
      "Default": "transactiondb",
      "Description": "Database name for Aurora MySQL cluster"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Master username for Aurora MySQL cluster"
    },
    "BackupRetentionPeriod": {
      "Type": "Number",
      "Default": 7,
      "Description": "Number of days to retain automated backups"
    },
    "PreferredBackupWindow": {
      "Type": "String",
      "Default": "03:00-04:00",
      "Description": "Preferred backup window (UTC time)"
    },
    "PreferredMaintenanceWindow": {
      "Type": "String",
      "Default": "sun:04:00-sun:05:00",
      "Description": "Preferred maintenance window (UTC time)"
    },
    "CPUAlarmThreshold": {
      "Type": "Number",
      "Default": 80,
      "Description": "CPU utilization threshold for CloudWatch alarm (%)"
    },
    "ConnectionAlarmThreshold": {
      "Type": "Number",
      "Default": 1000,
      "Description": "Database connections threshold for CloudWatch alarm"
    },
    "ReplicationLagThreshold": {
      "Type": "Number",
      "Default": 1000,
      "Description": "Replication lag threshold in milliseconds for CloudWatch alarm"
    },
    "AlarmEmailEndpoint": {
      "Type": "String",
      "Default": "ops@example.com",
      "Description": "Email address for CloudWatch alarm notifications"
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
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
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
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
              "Fn::Sub": "aurora-private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
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
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
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
              "Fn::Sub": "aurora-private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
        "CidrBlock": {
          "Ref": "PrivateSubnet3CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            2,
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
              "Fn::Sub": "aurora-private-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora MySQL cluster spanning multiple availability zones",
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "aurora-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora MySQL cluster",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": {
              "Ref": "VpcCIDR"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },

    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for Aurora MySQL cluster encryption",
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
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:CreateGrant"
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
              "Fn::Sub": "aurora-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/aurora-mysql-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },

    "DBClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "DBClusterParameterGroupName": {
          "Fn::Sub": "aurora-cluster-params-${EnvironmentSuffix}"
        },
        "Description": "Aurora MySQL cluster parameter group",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "innodb_flush_log_at_trx_commit": "1",
          "sync_binlog": "1",
          "binlog_format": "ROW",
          "transaction_isolation": "READ-COMMITTED",
          "max_connections": "2000",
          "character_set_server": "utf8mb4"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-cluster-params-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "DBParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "DBParameterGroupName": {
          "Fn::Sub": "aurora-instance-params-${EnvironmentSuffix}"
        },
        "Description": "Aurora MySQL instance parameter group",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "slow_query_log": "1",
          "long_query_time": "2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-params-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "DBPassword": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "aurora-mysql-password-${EnvironmentSuffix}"
        },
        "Description": "Master password for Aurora MySQL cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\":\"${DBMasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-password-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "AuroraDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-mysql-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "EngineMode": "provisioned",
        "DatabaseName": {
          "Ref": "DBName"
        },
        "MasterUsername": {
          "Ref": "DBMasterUsername"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBPassword}:SecretString:password}}"
        },
        "DBClusterParameterGroupName": {
          "Ref": "DBClusterParameterGroup"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "BackupRetentionPeriod": {
          "Ref": "BackupRetentionPeriod"
        },
        "PreferredBackupWindow": {
          "Ref": "PreferredBackupWindow"
        },
        "PreferredMaintenanceWindow": {
          "Ref": "PreferredMaintenanceWindow"
        },
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "DeletionProtection": false,
        "CopyTagsToSnapshot": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "AuroraDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-mysql-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "KMSKey"
        },
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSEnhancedMonitoringRole",
            "Arn"
          ]
        },
        "PromotionTier": 1,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "AuroraDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-mysql-instance-2-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "KMSKey"
        },
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSEnhancedMonitoringRole",
            "Arn"
          ]
        },
        "PromotionTier": 2,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-instance-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "AuroraDBInstance3": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-mysql-instance-3-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "KMSKey"
        },
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSEnhancedMonitoringRole",
            "Arn"
          ]
        },
        "PromotionTier": 3,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-instance-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "RDSEnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "aurora-enhanced-monitoring-role-${EnvironmentSuffix}"
        },
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
            "Value": {
              "Fn::Sub": "aurora-enhanced-monitoring-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "aurora-alarms-${EnvironmentSuffix}"
        },
        "DisplayName": "Aurora MySQL Database Alarms",
        "Subscription": [
          {
            "Protocol": "email",
            "Endpoint": {
              "Ref": "AlarmEmailEndpoint"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-alarms-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "CPUAlarmInstance1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-cpu-high-instance-1-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU utilization exceeds threshold on Instance 1",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "CPUAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance1"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },

    "CPUAlarmInstance2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-cpu-high-instance-2-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU utilization exceeds threshold on Instance 2",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "CPUAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance2"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },

    "CPUAlarmInstance3": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-cpu-high-instance-3-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU utilization exceeds threshold on Instance 3",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "CPUAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance3"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },

    "DatabaseConnectionsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-connections-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when database connections exceed threshold",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "ConnectionAlarmThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraDBCluster"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },

    "ReplicationLagAlarmInstance2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-replication-lag-instance-2-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when replication lag exceeds threshold on Instance 2",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "ReplicationLagThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance2"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },

    "ReplicationLagAlarmInstance3": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-replication-lag-instance-3-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when replication lag exceeds threshold on Instance 3",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Ref": "ReplicationLagThreshold"
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "AuroraDBInstance3"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    }
  },

  "Outputs": {
    "ClusterEndpoint": {
      "Description": "Aurora MySQL cluster writer endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "Endpoint.Address"
        ]
      }
    },

    "ClusterReaderEndpoint": {
      "Description": "Aurora MySQL cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "ReadEndpoint.Address"
        ]
      }
    },

    "ClusterPort": {
      "Description": "Aurora MySQL cluster port",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "Endpoint.Port"
        ]
      }
    },

    "DatabaseName": {
      "Description": "Database name",
      "Value": {
        "Ref": "DBName"
      }
    },

    "ClusterIdentifier": {
      "Description": "Aurora MySQL cluster identifier",
      "Value": {
        "Ref": "AuroraDBCluster"
      }
    },

    "KMSKeyId": {
      "Description": "KMS key ID used for encryption",
      "Value": {
        "Ref": "KMSKey"
      }
    },

    "SecurityGroupId": {
      "Description": "Security group ID for database access",
      "Value": {
        "Ref": "DBSecurityGroup"
      }
    },

    "VPCId": {
      "Description": "VPC ID where cluster is deployed",
      "Value": {
        "Ref": "VPC"
      }
    },

    "PasswordSecretArn": {
      "Description": "ARN of the Secrets Manager secret",
      "Value": {
        "Ref": "DBPassword"
      }
    }
  }
}
```

## Implementation Notes

This CloudFormation template creates a production-ready Aurora MySQL cluster with:

- Multi-AZ deployment across 3 availability zones
- 3 database instances (1 primary + 2 read replicas)
- KMS encryption with automatic key rotation
- Automated backups with 7-day retention
- CloudWatch alarms for monitoring (CPU, connections, replication lag)
- Secrets Manager for secure password management
- Performance Insights enabled on all instances
- Enhanced monitoring with 60-second intervals

**Minor issues** (typical in real-world implementations):
- Security group egress rules omitted (defaults to allow all)
- Missing TreatMissingData property on CloudWatch alarms
- Missing freeable memory alarm
- Missing audit log in CloudWatch logs exports
- Missing Export on some outputs
- Parameter validation patterns not as strict as they could be
- Missing Environment tag on some resources

The template meets all core requirements and is ready for deployment.

````

## File: MODEL_FAILURES.md

````markdown
# MODEL_FAILURES Documentation

This document catalogs the intentional errors in MODEL_RESPONSE.md for training purposes. Each error represents a common mistake that LLMs make when generating infrastructure code.

## Summary

Total Errors: 36

Categories:
- Missing Required Components: 8 errors
- Configuration Errors: 10 errors
- Security Issues: 6 errors
- Architecture/Design Flaws: 8 errors
- Missing Features: 4 errors

## Detailed Error Catalog

### Category 1: Missing Required Components (Critical)

**ERROR 1: Missing Required Tags**
- Location: `TapStack.__init__`
- Issue: Default tags don't include required fields
- Current: `self.default_tags = args.tags`
- Required: Must include 'Environment', 'CostCenter', 'MigrationPhase'
- Impact: Fails compliance requirements, difficult to track costs
- Fix: Add required tags to default_tags dictionary

**ERROR 2: No KMS Key Created**
- Location: `TapStack.__init__`
- Issue: KMS customer-managed key not created
- Requirement: "All data must be encrypted at rest using AWS KMS customer-managed keys"
- Impact: Fails PCI DSS compliance, security requirement violation
- Fix: Call `self.kms_key = self._create_kms_key()` and use in all encrypted resources

**ERROR 3: No VPC Endpoints**
- Location: `TapStack.__init__`
- Issue: VPC endpoints for S3 and DynamoDB not created
- Requirement: "Network traffic must use VPC endpoints to avoid internet exposure"
- Impact: Traffic goes through internet, fails security requirement
- Fix: Create Gateway endpoints for S3 and DynamoDB

**ERROR 4: No Secrets Manager**
- Location: `TapStack.__init__`
- Issue: Database credentials not stored in Secrets Manager
- Requirement: "Database credentials must be stored in AWS Secrets Manager with automatic rotation enabled"
- Impact: Hardcoded passwords, no rotation, fails security requirement
- Fix: Create Secrets Manager secrets with rotation for blue and green databases

**ERROR 5: No CloudWatch Alarms**
- Location: `TapStack.__init__`
- Issue: CloudWatch alarms not created
- Requirement: "Set up CloudWatch alarms for database connection counts and response times"
- Impact: No monitoring, can't detect issues
- Fix: Create alarms for DB connections, ALB response time, DynamoDB throttling

**ERROR 6: No AWS Backup Plan**
- Location: `TapStack.__init__`
- Issue: AWS Backup plan not configured
- Requirement: "Configure AWS Backup plans with 7-day retention for both environments"
- Impact: No disaster recovery capability
- Fix: Create backup vault, plan with 7-day retention, and selections for blue/green clusters

**ERROR 7: No SSM Parameter**
- Location: `TapStack.__init__`
- Issue: No tracking of active environment
- Requirement: "Implement stack outputs that display current active environment and migration status"
- Impact: Can't determine which environment is active
- Fix: Create SSM parameter to store active environment state

**ERROR 8: Single AZ Instead of Three**
- Location: `_create_vpc`
- Issue: `azs = ['us-east-1a']` - only 1 AZ
- Requirement: "Deployed in us-east-1 across 3 availability zones"
- Current: Only creating resources in 1 AZ
- Impact: No high availability, single point of failure
- Fix: Use `azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']`

### Category 2: Configuration Errors

**ERROR 9: Missing Elastic IP**
- Location: `_create_vpc`
- Issue: NAT Gateway created without Elastic IP allocation
- Current: Missing `aws.ec2.Eip` resource
- Impact: NAT Gateway creation will fail
- Fix: Create EIP before NAT Gateway and use allocation_id

**ERROR 10: Missing allocation_id Parameter**
- Location: `_create_vpc`
- Issue: NAT Gateway missing required `allocation_id` parameter
- Current: `aws.ec2.NatGateway(...)` without allocation_id
- Impact: Resource creation fails
- Fix: Add `allocation_id=eip.id`

**ERROR 11: Index Out of Bounds**
- Location: `_create_vpc`
- Issue: Trying to access `nat_gateways[i]` when only 1 NAT gateway exists
- Current: Loop creates 1 NAT but tries to use index 0, 1, 2
- Impact: Runtime error when deploying with proper 3 AZs
- Fix: Create NAT gateway for each AZ (3 total)

**ERROR 12: Missing Point-in-Time Recovery**
- Location: `_create_dynamodb_table`
- Issue: DynamoDB table created without PITR
- Requirement: "Configure DynamoDB tables with point-in-time recovery for session data"
- Current: No `point_in_time_recovery` parameter
- Impact: No disaster recovery for session data
- Fix: Add `point_in_time_recovery={'enabled': True}`

**ERROR 13: DynamoDB Missing KMS Encryption**
- Location: `_create_dynamodb_table`
- Issue: Table not encrypted with KMS customer-managed key
- Requirement: "All data must be encrypted at rest using AWS KMS customer-managed keys"
- Current: No `server_side_encryption` parameter
- Impact: Fails security compliance
- Fix: Add `server_side_encryption={'enabled': True, 'kms_key_arn': self.kms_key.arn}`

**ERROR 15: Using MySQL Instead of Aurora MySQL**
- Location: `_create_environment`
- Issue: `engine='mysql'` instead of `'aurora-mysql'`
- Requirement: "RDS Aurora MySQL 8.0 for transaction data"
- Current: Regular MySQL RDS (different service)
- Impact: Wrong database engine, different performance/pricing
- Fix: Change to `engine='aurora-mysql'`

**ERROR 16: Wrong Engine Version Format**
- Location: `_create_environment`
- Issue: `engine_version='8.0'` - wrong format for Aurora
- Current: Simplified version number
- Correct: `'8.0.mysql_aurora.3.02.0'` (Aurora-specific version)
- Impact: Deployment may fail or use wrong version
- Fix: Use proper Aurora MySQL version string

**ERROR 20: Insufficient Backup Retention**
- Location: `_create_environment`
- Issue: `backup_retention_period=3` - only 3 days
- Requirement: "AWS Backup plans with 7-day retention"
- Current: 3 days retention
- Impact: Doesn't meet requirement
- Fix: Change to `backup_retention_period=7`

**ERROR 21: Missing CloudWatch Logs Exports**
- Location: `_create_environment`
- Issue: No `enabled_cloudwatch_logs_exports` parameter
- Requirement: Audit logging for PCI DSS compliance
- Current: No log exports configured
- Impact: Missing audit trail, fails compliance
- Fix: Add `enabled_cloudwatch_logs_exports=['audit', 'error', 'general', 'slowquery']`

**ERROR 22: Only One Database Instance**
- Location: `_create_environment`
- Issue: Creating 1 instance instead of 2
- Requirement: High availability for payment processing
- Current: Single instance - single point of failure
- Impact: No redundancy, downtime if instance fails
- Fix: Create 2 instances in loop: `for i in range(2)`

### Category 3: Security Issues (Critical)

**ERROR 14: Overly Permissive Security Group**
- Location: `_create_environment`
- Issue: Database security group allows `0.0.0.0/0`
- Current: `'cidr_blocks': ['0.0.0.0/0']`
- Correct: `'cidr_blocks': ['10.0.0.0/16']` (VPC only)
- Impact: Database accessible from internet - major security risk!
- Severity: CRITICAL
- Fix: Restrict to VPC CIDR block only

**ERROR 17: Hardcoded Password**
- Location: `_create_environment`
- Issue: `master_password='SimplePassword123'` - plaintext, hardcoded
- Requirement: "Database credentials must be stored in AWS Secrets Manager"
- Current: Weak password in code
- Impact: Security vulnerability, credentials in source control
- Severity: CRITICAL
- Fix: Use `pulumi.Output.secret()` and reference Secrets Manager

**ERROR 18: Missing Storage Encryption**
- Location: `_create_environment`
- Issue: No `storage_encrypted=True` parameter
- Requirement: "All data must be encrypted at rest"
- Current: Unencrypted database storage
- Impact: Fails PCI DSS compliance, security violation
- Severity: CRITICAL
- Fix: Add `storage_encrypted=True`

**ERROR 19: Missing KMS Key for RDS**
- Location: `_create_environment`
- Issue: No `kms_key_id` parameter
- Requirement: "All data must be encrypted at rest using AWS KMS customer-managed keys"
- Current: Would use AWS managed key if encrypted
- Impact: Not using customer-managed keys as required
- Fix: Add `kms_key_id=self.kms_key.arn`

**ERROR 23: Wrong Instance Class**
- Location: `_create_environment`
- Issue: Using `db.t3.medium` instead of `db.r6g.large`
- Requirement: Memory-optimized instances for payment processing
- Current: General purpose, insufficient for production
- Impact: Poor performance, potential service degradation
- Fix: Change to `instance_class='db.r6g.large'`

**ERROR 24: Database Publicly Accessible**
- Location: `_create_environment`
- Issue: `publicly_accessible=True`
- Requirement: Databases must be in private subnets, not public
- Current: Database has public IP
- Impact: CRITICAL security vulnerability
- Severity: CRITICAL
- Fix: Change to `publicly_accessible=False`

### Category 4: Architecture/Design Flaws

**ERROR 25: Missing Health Check Configuration**
- Location: `_create_alb` (blue target group)
- Issue: No health_check parameter
- Current: Uses default health check (may not work)
- Impact: ALB can't determine target health, routes to failed targets
- Fix: Add comprehensive health_check configuration with /health endpoint

**ERROR 26: Missing Health Check Configuration**
- Location: `_create_alb` (green target group)
- Issue: No health_check parameter
- Current: Uses default health check
- Impact: Same as ERROR 25
- Fix: Add comprehensive health_check configuration

**ERROR 27: Simple Forward Instead of Weighted Routing**
- Location: `_create_alb`
- Issue: Listener uses simple forward action, not weighted
- Requirement: "Application Load Balancer with weighted target groups for traffic shifting"
- Current: `'type': 'forward', 'target_group_arn': blue_tg.arn`
- Correct: Should use weighted forward with both target groups
- Impact: Can't do blue-green deployments, can't shift traffic
- Severity: HIGH - breaks core requirement
- Fix: Use forward action with ForwardConfig containing both target groups with weights

**ERROR 28: Missing IAM Policy Attachments**
- Location: `_create_switch_lambda`
- Issue: Lambda role created but no policies attached
- Current: Only basic role, no permissions for ELB operations
- Impact: Lambda can't modify listener, switching fails
- Fix: Attach policies for elasticloadbalancing:ModifyListener, SSM, CloudWatch

**ERROR 29: Incomplete Lambda Code**
- Location: `_create_switch_lambda`
- Issue: Lambda returns "Hello from Lambda!" - no actual switching logic
- Requirement: "Lambda functions to handle environment switching logic"
- Current: Stub code, doesn't implement switching
- Impact: No way to switch environments, core feature missing
- Fix: Implement full switching logic with ALB listener modification

**ERROR 30: Older Python Runtime**
- Location: `_create_switch_lambda`
- Issue: Using `runtime='python3.9'`
- Current: Python 3.9 (older version)
- Best Practice: Use latest supported version (`python3.11`)
- Impact: Missing newer features, potential deprecation warnings
- Fix: Change to `runtime='python3.11'`

**ERROR 31: Lambda Timeout Too Short**
- Location: `_create_switch_lambda`
- Issue: `timeout=30` - only 30 seconds
- Requirement: Must complete switching and validation
- Current: May timeout during operations
- Impact: Incomplete switches, failed operations
- Fix: Increase to `timeout=60` or more

**ERROR 32: Lambda Memory Too Low**
- Location: `_create_switch_lambda`
- Issue: `memory_size=128` - minimum memory
- Current: May be insufficient for boto3 operations
- Impact: Slow performance, potential memory errors
- Fix: Increase to `memory_size=256` or more

**ERROR 33: Missing Environment Variables**
- Location: `_create_switch_lambda`
- Issue: No environment variables passed to Lambda
- Required: LISTENER_ARN, BLUE_TG_ARN, GREEN_TG_ARN, SSM_PARAM_NAME
- Current: Lambda has no way to know what resources to modify
- Impact: Lambda can't function, no resource references
- Fix: Add environment dict with all required ARNs and names

### Category 5: Missing Features

**ERROR 34: Missing Default Tags in Entry Point**
- Location: `tap.py`
- Issue: TapStackArgs created without tags parameter
- Requirement: All resources must have Environment, CostCenter, MigrationPhase tags
- Current: No tags passed from entry point
- Impact: Resources lack required tags
- Fix: Create default_tags dict and pass to TapStackArgs

**ERROR 35: Missing Required Outputs**
- Location: `tap.py`
- Issue: Only exporting alb_dns_name
- Requirement: "Implement stack outputs that display current active environment and migration status"
- Required Outputs:
  - vpc_id
  - blue_cluster_endpoint
  - green_cluster_endpoint
  - dynamodb_table_name
  - switch_lambda_name/arn
  - active_environment_parameter
  - kms_key_id
  - backup_vault_name
  - connection_info (composite)
- Current: Only 1 output
- Impact: Missing visibility into infrastructure
- Fix: Export all required outputs

**ERROR 36: Missing AWS Region Configuration**
- Location: `Pulumi.yaml`
- Issue: No AWS region specified in configuration
- Requirement: "Deployed in us-east-1"
- Current: No config section
- Impact: May deploy to wrong region or fail
- Fix: Add config section with `aws:region: us-east-1`

## Impact Analysis

### Critical Errors (Must Fix):
- ERROR 2: No KMS encryption
- ERROR 4: No Secrets Manager
- ERROR 14: Overly permissive security group
- ERROR 17: Hardcoded passwords
- ERROR 18: Missing storage encryption
- ERROR 24: Database publicly accessible
- ERROR 27: No weighted routing (breaks blue-green deployment)

### High Priority Errors:
- ERROR 1: Missing required tags
- ERROR 3: No VPC endpoints
- ERROR 5: No CloudWatch alarms
- ERROR 6: No backup plan
- ERROR 8: Single AZ (no HA)
- ERROR 29: No switching logic in Lambda

### Medium Priority Errors:
- ERROR 15-16: Wrong database engine/version
- ERROR 22: Only one database instance
- ERROR 25-26: Missing health checks
- ERROR 28: Missing Lambda permissions
- ERROR 33: Missing Lambda environment variables

### Low Priority Errors:
- ERROR 30: Older Python version
- ERROR 31-32: Lambda resource limits
- ERROR 34-36: Missing tags and outputs

## Compliance Violations

### PCI DSS Requirements Failed:
1. ERROR 2, 13, 18, 19: Encryption at rest not properly configured
2. ERROR 4, 17: Credentials not properly managed
3. ERROR 14, 24: Network security violations
4. ERROR 21: Missing audit logging

### Architectural Requirements Failed:
1. ERROR 8: Single AZ instead of 3
2. ERROR 22: Single database instance
3. ERROR 27: No traffic shifting capability
4. ERROR 29: No environment switching logic

### Operational Requirements Failed:
1. ERROR 5: No monitoring/alerting
2. ERROR 6: No backup/disaster recovery
3. ERROR 7, 35: No visibility into system state

## Testing Implications

This MODEL_RESPONSE with errors should:
1. Generate detailed error messages during validation
2. Fail security checks (encryption, network isolation)
3. Fail compliance checks (PCI DSS requirements)
4. Fail functional tests (blue-green switching)
5. Fail availability tests (single AZ, single instance)

The IDEAL_RESPONSE correctly implements all requirements and should pass all tests.

## Training Value

These errors represent common LLM mistakes:
1. Forgetting required security features (encryption, secrets management)
2. Incomplete implementations (missing components)
3. Wrong configuration values (security groups, versions)
4. Simplified architecture (fewer AZs, instances)
5. Missing monitoring and operational features
6. Hardcoded values instead of proper secret management
7. Not implementing core functionality (Lambda switching logic)

By comparing MODEL_RESPONSE and IDEAL_RESPONSE, the training system can learn to:
- Always include required security features
- Implement complete architectures, not simplified versions
- Use proper secret management
- Include monitoring and backup
- Implement all functional requirements
- Follow AWS best practices

````

## File: PROMPT.md

````markdown
# Task: Highly Available Aurora MySQL Cluster for Transaction Processing

## Platform & Language
**MANDATORY:** This task MUST be implemented using **AWS CloudFormation with JSON**.

## Background
A financial technology company is building a new transaction processing system that requires a highly available database infrastructure. The system will handle payment transactions, account updates, and real-time balance inquiries with strict requirements for data consistency, availability, and disaster recovery.

## Problem Statement
Create a CloudFormation template to deploy a highly available Aurora MySQL cluster optimized for transaction processing workloads.

## Requirements

The configuration must implement the following:

1. Deploy an Aurora MySQL cluster with Multi-AZ configuration across multiple availability zones
2. Configure read replicas for load balancing and high availability
3. Implement automated backups with point-in-time recovery capability
4. Set up database parameter groups optimized for transaction processing
5. Configure CloudWatch alarms for database health monitoring (CPU, connections, replication lag)
6. Implement encryption at rest using AWS KMS
7. Configure VPC with private subnets for database deployment
8. Set up security groups with least-privilege access controls
9. Implement database subnet groups spanning multiple availability zones
10. Configure automated failover mechanisms

## Environment Details
Production-grade database infrastructure deployed in us-east-1 region. Requires VPC with private subnets across at least 2 availability zones for high availability. Aurora MySQL cluster should be configured for ACID transaction compliance with appropriate instance sizing for transaction processing workloads. CloudWatch monitoring must track database performance metrics including connections, throughput, and replication health.

## Constraints

1. Database must support automatic failover with minimal downtime (< 30 seconds)
2. All data must be encrypted at rest using AWS KMS customer-managed keys
3. Backups must be retained for at least 7 days with automated backup windows
4. Database credentials must be managed securely (no hardcoded passwords)
5. Network isolation required - database must not be publicly accessible
6. All resources must include proper tagging for cost allocation and management
7. Template must use parameters for configurable values (instance types, backup retention, etc.)

## Expected Output
A complete CloudFormation JSON template that creates a highly available Aurora MySQL cluster with all necessary networking, security, and monitoring components. The template should include proper parameter definitions, resource dependencies, and stack outputs for connection endpoints and resource identifiers.

## Region
us-east-1 (default)

## Subject Labels
- aws
- infrastructure
- failure-recovery-and-high-availability

````
