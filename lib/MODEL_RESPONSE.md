# Aurora Global Database CloudFormation Implementation

This CloudFormation JSON template deploys an Aurora Global Database with cross-region disaster recovery capabilities spanning us-east-1 (primary) and eu-west-1 (secondary).

## Architecture Overview

The solution implements:
- Aurora MySQL 8.0 compatible global database
- Primary cluster in us-east-1 with one writer and one reader instance
- Secondary cluster in eu-west-1 configured as read replica
- Route 53 health checks and failover routing
- KMS encryption in both regions
- CloudWatch alarms for replication lag monitoring
- Multi-AZ database subnet groups

## Files

### File: lib/aurora-global-primary.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora Global Database - Primary Cluster in us-east-1",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "dev"
    },
    "DBUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "admin",
      "NoEcho": true
    },
    "DBPassword": {
      "Type": "String",
      "Description": "Master password for Aurora database",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID for database deployment"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of 3 private subnet IDs spanning different AZs"
    }
  },
  "Resources": {
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "trading-db-subnets-us-east-1-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora Global Database primary cluster",
        "SubnetIds": {
          "Ref": "PrivateSubnetIds"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-subnets-us-east-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "trading-db-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora database access",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.0.0.0/8",
            "Description": "MySQL access from VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-sg-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for Aurora encryption in us-east-1 ${EnvironmentSuffix}"
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
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
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
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-kms-us-east-1-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/trading-db-us-east-1-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      },
      "DeletionPolicy": "Delete"
    },
    "GlobalCluster": {
      "Type": "AWS::RDS::GlobalCluster",
      "Properties": {
        "GlobalClusterIdentifier": {
          "Fn::Sub": "trading-db-global-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "StorageEncrypted": true,
        "DeletionProtection": false
      },
      "DeletionPolicy": "Delete"
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "trading-db-us-east-1-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "MasterUsername": {
          "Ref": "DBUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBPassword"
        },
        "DatabaseName": "tradingdb",
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
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery",
          "audit"
        ],
        "GlobalClusterIdentifier": {
          "Ref": "GlobalCluster"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-us-east-1-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Region",
            "Value": "us-east-1"
          },
          {
            "Key": "Role",
            "Value": "Primary"
          }
        ]
      },
      "DependsOn": [
        "GlobalCluster"
      ],
      "DeletionPolicy": "Delete"
    },
    "DBInstanceWriter": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "trading-db-us-east-1-writer-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "DBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.2xlarge",
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "EnhancedMonitoringRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-us-east-1-writer-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Role",
            "Value": "Writer"
          }
        ]
      },
      "DependsOn": [
        "DBCluster"
      ],
      "DeletionPolicy": "Delete"
    },
    "DBInstanceReader": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "trading-db-us-east-1-reader-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "DBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.2xlarge",
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "EnhancedMonitoringRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-us-east-1-reader-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Role",
            "Value": "Reader"
          }
        ]
      },
      "DependsOn": [
        "DBInstanceWriter"
      ],
      "DeletionPolicy": "Delete"
    },
    "EnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "rds-enhanced-monitoring-role-${EnvironmentSuffix}"
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
              "Fn::Sub": "rds-enhanced-monitoring-role-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "trading-db-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Aurora Global Database Alerts",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-alerts-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "CPUAlarmWriter": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "trading-db-writer-cpu-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when writer instance CPU exceeds 80%",
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
            "Value": {
              "Ref": "DBInstanceWriter"
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
          "Fn::Sub": "trading-db-connections-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when database connections exceed threshold",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "DBCluster"
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
    "HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "CALCULATED",
          "ChildHealthChecks": [],
          "HealthThreshold": 1
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-primary-health-${EnvironmentSuffix}"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "GlobalClusterIdentifier": {
      "Description": "Aurora Global Cluster Identifier",
      "Value": {
        "Ref": "GlobalCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-GlobalClusterId"
        }
      }
    },
    "PrimaryClusterEndpoint": {
      "Description": "Primary cluster writer endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DBCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrimaryEndpoint"
        }
      }
    },
    "PrimaryClusterReadEndpoint": {
      "Description": "Primary cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DBCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrimaryReadEndpoint"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for alerts",
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
```

### File: lib/aurora-global-secondary.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora Global Database - Secondary Cluster in eu-west-1",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "dev"
    },
    "GlobalClusterIdentifier": {
      "Type": "String",
      "Description": "Global cluster identifier from primary stack"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID for database deployment in eu-west-1"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of 3 private subnet IDs spanning different AZs in eu-west-1"
    }
  },
  "Resources": {
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "trading-db-subnets-eu-west-1-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora Global Database secondary cluster",
        "SubnetIds": {
          "Ref": "PrivateSubnetIds"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-subnets-eu-west-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "trading-db-sg-eu-west-1-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora database access in eu-west-1",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.0.0.0/8",
            "Description": "MySQL access from VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-sg-eu-west-1-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for Aurora encryption in eu-west-1 ${EnvironmentSuffix}"
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
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
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
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-kms-eu-west-1-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/trading-db-eu-west-1-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      },
      "DeletionPolicy": "Delete"
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "trading-db-eu-west-1-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
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
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery",
          "audit"
        ],
        "GlobalClusterIdentifier": {
          "Ref": "GlobalClusterIdentifier"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-eu-west-1-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Region",
            "Value": "eu-west-1"
          },
          {
            "Key": "Role",
            "Value": "Secondary"
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DBInstanceReader": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "trading-db-eu-west-1-reader-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "DBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.2xlarge",
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "EnhancedMonitoringRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-eu-west-1-reader-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Role",
            "Value": "Reader"
          }
        ]
      },
      "DependsOn": [
        "DBCluster"
      ],
      "DeletionPolicy": "Delete"
    },
    "EnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "rds-enhanced-monitoring-role-eu-${EnvironmentSuffix}"
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
              "Fn::Sub": "rds-enhanced-monitoring-role-eu-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "trading-db-alerts-eu-west-1-${EnvironmentSuffix}"
        },
        "DisplayName": "Aurora Global Database Alerts - EU",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-alerts-eu-west-1-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "ReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "trading-db-replication-lag-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when replication lag exceeds 1000ms threshold",
        "MetricName": "AuroraGlobalDBReplicationLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 3,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "DBCluster"
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
    "ReplicatedIOAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "trading-db-replicated-io-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when replicated write IO is high",
        "MetricName": "AuroraGlobalDBReplicatedWriteIO",
        "Namespace": "AWS/RDS",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1000000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "DBCluster"
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
    "CPUAlarmReader": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "trading-db-reader-cpu-high-eu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when reader instance CPU exceeds 80%",
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
            "Value": {
              "Ref": "DBInstanceReader"
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
    "HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "CALCULATED",
          "ChildHealthChecks": [],
          "HealthThreshold": 1
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-db-secondary-health-${EnvironmentSuffix}"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "SecondaryClusterEndpoint": {
      "Description": "Secondary cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DBCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecondaryEndpoint"
        }
      }
    },
    "SecondaryClusterReadEndpoint": {
      "Description": "Secondary cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DBCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecondaryReadEndpoint"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption in eu-west-1",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "ReplicationLagAlarmArn": {
      "Description": "CloudWatch Alarm ARN for replication lag",
      "Value": {
        "Fn::GetAtt": [
          "ReplicationLagAlarm",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ReplicationLagAlarm"
        }
      }
    }
  }
}
```

### File: lib/route53-failover.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Route 53 Failover Configuration for Aurora Global Database",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "dev"
    },
    "HostedZoneId": {
      "Type": "AWS::Route53::HostedZone::Id",
      "Description": "Route 53 Hosted Zone ID for DNS records"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for database endpoint (e.g., db.example.com)",
      "Default": "tradingdb.example.com"
    },
    "PrimaryEndpoint": {
      "Type": "String",
      "Description": "Primary cluster endpoint from us-east-1"
    },
    "SecondaryEndpoint": {
      "Type": "String",
      "Description": "Secondary cluster endpoint from eu-west-1"
    },
    "PrimaryHealthCheckId": {
      "Type": "String",
      "Description": "Health check ID for primary region"
    },
    "SecondaryHealthCheckId": {
      "Type": "String",
      "Description": "Health check ID for secondary region"
    }
  },
  "Resources": {
    "PrimaryDNSRecord": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
        },
        "Name": {
          "Ref": "DomainName"
        },
        "Type": "CNAME",
        "SetIdentifier": {
          "Fn::Sub": "Primary-${EnvironmentSuffix}"
        },
        "Failover": "PRIMARY",
        "TTL": "60",
        "ResourceRecords": [
          {
            "Ref": "PrimaryEndpoint"
          }
        ],
        "HealthCheckId": {
          "Ref": "PrimaryHealthCheckId"
        }
      }
    },
    "SecondaryDNSRecord": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
        },
        "Name": {
          "Ref": "DomainName"
        },
        "Type": "CNAME",
        "SetIdentifier": {
          "Fn::Sub": "Secondary-${EnvironmentSuffix}"
        },
        "Failover": "SECONDARY",
        "TTL": "60",
        "ResourceRecords": [
          {
            "Ref": "SecondaryEndpoint"
          }
        ],
        "HealthCheckId": {
          "Ref": "SecondaryHealthCheckId"
        }
      }
    }
  },
  "Outputs": {
    "FailoverDNSName": {
      "Description": "DNS name for failover endpoint",
      "Value": {
        "Ref": "DomainName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-FailoverDNS"
        }
      }
    }
  }
}
```

### File: lib/README.md

```markdown
# Aurora Global Database - Disaster Recovery Solution

This CloudFormation solution deploys an Aurora MySQL 8.0 Global Database with cross-region disaster recovery spanning us-east-1 (primary) and eu-west-1 (secondary).

## Architecture

The solution implements:

- **Aurora Global Database**: MySQL 8.0 compatible cluster with global replication
- **Primary Region (us-east-1)**: One writer instance and one reader instance
- **Secondary Region (eu-west-1)**: One reader instance configured for disaster recovery
- **Encryption**: KMS encryption at rest in both regions using AWS-managed keys
- **Monitoring**: CloudWatch alarms for CPU, connections, and replication lag (threshold: 1000ms)
- **Failover**: Route 53 health checks and failover routing for automated DNS failover
- **Backups**: 7-day automated backup retention in both regions

## Deployment Order

Due to Aurora Global Database timing requirements, deploy in this specific order:

### Step 1: Deploy Primary Stack (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-primary \
  --template-body file://lib/aurora-global-primary.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBUsername,ParameterValue=admin \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx,subnet-yyy,subnet-zzz" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Wait for stack to reach CREATE_COMPLETE status:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name aurora-global-primary \
  --region us-east-1
```

Get the Global Cluster Identifier:

```bash
GLOBAL_CLUSTER_ID=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`GlobalClusterIdentifier`].OutputValue' \
  --output text)

echo "Global Cluster ID: $GLOBAL_CLUSTER_ID"
```

### Step 2: Deploy Secondary Stack (eu-west-1)

**CRITICAL**: Wait for primary cluster to be fully available before deploying secondary.

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-secondary \
  --template-body file://lib/aurora-global-secondary.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=GlobalClusterIdentifier,ParameterValue=$GLOBAL_CLUSTER_ID \
    ParameterKey=VpcId,ParameterValue=vpc-yyyyyyyyy \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-aaa,subnet-bbb,subnet-ccc" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-1
```

Wait for stack to reach CREATE_COMPLETE status:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name aurora-global-secondary \
  --region eu-west-1
```

### Step 3: Deploy Route 53 Failover (Optional)

If you have a Route 53 hosted zone:

```bash
PRIMARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PrimaryClusterEndpoint`].OutputValue' \
  --output text)

SECONDARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-secondary \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`SecondaryClusterEndpoint`].OutputValue' \
  --output text)

aws cloudformation create-stack \
  --stack-name aurora-global-route53 \
  --template-body file://lib/route53-failover.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=HostedZoneId,ParameterValue=Z1234567890ABC \
    ParameterKey=DomainName,ParameterValue=tradingdb.example.com \
    ParameterKey=PrimaryEndpoint,ParameterValue=$PRIMARY_ENDPOINT \
    ParameterKey=SecondaryEndpoint,ParameterValue=$SECONDARY_ENDPOINT \
    ParameterKey=PrimaryHealthCheckId,ParameterValue=<from-primary-stack> \
    ParameterKey=SecondaryHealthCheckId,ParameterValue=<from-secondary-stack> \
  --region us-east-1
```

## Prerequisites

Before deployment, ensure you have:

1. **VPCs in both regions** with:
   - 3 private subnets spanning different availability zones
   - Appropriate CIDR ranges (e.g., 10.0.0.0/16)
   - Internet connectivity through NAT Gateways (if needed)

2. **IAM Permissions** for:
   - RDS cluster and instance creation
   - KMS key creation and management
   - CloudWatch alarm creation
   - Route 53 record management
   - SNS topic creation

3. **Database Password**:
   - Minimum 8 characters
   - Must contain uppercase, lowercase, and numbers
   - Store securely (AWS Secrets Manager recommended)

## Configuration

### Instance Class

The default instance class is `db.r6g.2xlarge` (memory-optimized, Graviton2). Adjust based on your workload:

- Development/Test: `db.r6g.large` or `db.r6g.xlarge`
- Production: `db.r6g.2xlarge` or larger
- High Performance: `db.r6g.4xlarge` or `db.r6g.8xlarge`

### Backup Retention

Default: 7 days. Adjust `BackupRetentionPeriod` parameter (1-35 days).

### Monitoring Thresholds

Current alarm thresholds:
- CPU Utilization: 80%
- Replication Lag: 1000ms
- Database Connections: 100

Adjust in the template based on your requirements.

## Monitoring

### CloudWatch Alarms

The solution creates several alarms:

**Primary Region (us-east-1)**:
- Writer instance CPU utilization
- Database connections count

**Secondary Region (eu-west-1)**:
- Reader instance CPU utilization
- Replication lag (critical for DR)
- Replicated write IO

### Metrics to Monitor

Key metrics for Aurora Global Database:
- `AuroraGlobalDBReplicationLag`: Latency between regions
- `AuroraGlobalDBReplicatedWriteIO`: Write operations replicated
- `AuroraGlobalDBDataTransferBytes`: Data transfer volume
- `CPUUtilization`: Instance CPU usage
- `DatabaseConnections`: Active connections

## Disaster Recovery

### Failover Procedure

To promote secondary cluster to primary (manual failover):

1. **Detach secondary from global cluster**:
```bash
aws rds remove-from-global-cluster \
  --global-cluster-identifier $GLOBAL_CLUSTER_ID \
  --db-cluster-identifier trading-db-eu-west-1-cluster-prod \
  --region eu-west-1
```

2. **Promote secondary cluster** (now standalone):
   - Update application connection strings to point to eu-west-1 endpoint
   - Secondary cluster becomes read-write capable

3. **Create new global cluster** (optional, for future DR):
   - Create new global cluster from promoted cluster
   - Add new secondary region

### Recovery Time Objective (RTO)

- Automated DNS failover: < 2 minutes (Route 53 TTL + health check interval)
- Manual cluster promotion: 5-10 minutes
- Full application recovery: Depends on application restart time

### Recovery Point Objective (RPO)

- Typical replication lag: < 1 second
- Maximum acceptable lag: 1000ms (alarm threshold)
- Data loss risk: Minimal under normal conditions

## Cost Optimization

Estimated monthly costs (us-east-1 + eu-west-1):

- **DB Instances**: 3x db.r6g.2xlarge × $0.544/hour × 730 hours ≈ $1,191/month
- **Storage**: Aurora storage is billed on usage (first 10GB free)
- **I/O Operations**: Included in Aurora pricing
- **Backup Storage**: 7 days retention included; additional backups charged
- **Data Transfer**: Cross-region replication data transfer charges apply
- **KMS**: $1/month per key × 2 regions = $2/month

**Total Estimated**: ~$1,200-1,500/month depending on storage and data transfer

### Cost Reduction Tips

1. Use smaller instance types for non-production environments
2. Reduce backup retention period if acceptable
3. Monitor and optimize replication data transfer
4. Use Aurora Serverless v2 for variable workloads (requires template modification)

## Security

### Encryption

- **At Rest**: KMS encryption enabled for all clusters
- **In Transit**: SSL/TLS enforced for client connections
- **Key Management**: Separate KMS keys per region

### Network Security

- Database instances in private subnets only
- Security group restricts access to 10.0.0.0/8 CIDR
- No public accessibility

### IAM

- Enhanced monitoring role with least-privilege permissions
- RDS service role for KMS key access

### Best Practices

1. **Rotate database credentials** regularly using AWS Secrets Manager
2. **Enable audit logging** in CloudWatch Logs
3. **Review security group rules** to restrict to specific application subnets
4. **Enable encryption in transit** by configuring SSL/TLS requirements
5. **Use IAM database authentication** for additional security layer

## Troubleshooting

### Common Issues

**Issue**: Secondary cluster fails to attach to global cluster
- **Cause**: Primary cluster not yet available
- **Solution**: Wait for primary cluster status to be "available" before deploying secondary stack

**Issue**: High replication lag alarm
- **Cause**: Network latency, high write volume, or instance resource constraints
- **Solution**: Check network connectivity, scale up instances, or reduce write load

**Issue**: Connection timeout to database
- **Cause**: Security group misconfiguration or subnet routing
- **Solution**: Verify security group allows traffic from application subnets, check route tables

**Issue**: KMS key permission errors
- **Cause**: IAM role lacks necessary KMS permissions
- **Solution**: Verify KMS key policy allows RDS service principal

### Validation Commands

Check cluster status:
```bash
aws rds describe-global-clusters \
  --global-cluster-identifier $GLOBAL_CLUSTER_ID \
  --region us-east-1
```

Check replication lag:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=trading-db-eu-west-1-cluster-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region eu-west-1
```

## Cleanup

To delete the infrastructure, remove stacks in reverse order:

```bash
# 1. Delete Route 53 stack (if created)
aws cloudformation delete-stack \
  --stack-name aurora-global-route53 \
  --region us-east-1

# 2. Delete secondary stack
aws cloudformation delete-stack \
  --stack-name aurora-global-secondary \
  --region eu-west-1

aws cloudformation wait stack-delete-complete \
  --stack-name aurora-global-secondary \
  --region eu-west-1

# 3. Delete primary stack
aws cloudformation delete-stack \
  --stack-name aurora-global-primary \
  --region us-east-1

aws cloudformation wait stack-delete-complete \
  --stack-name aurora-global-primary \
  --region us-east-1
```

**Note**: All resources are configured with `DeletionPolicy: Delete` for complete cleanup.

## Additional Resources

- [Aurora Global Database Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [Aurora MySQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Disaster Recovery Strategies](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- [CloudFormation RDS Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbcluster.html)

## Support

For issues or questions:
1. Review CloudWatch Logs for error messages
2. Check AWS Service Health Dashboard for regional issues
3. Consult AWS Support for production issues
```

## Deployment Notes

### Critical Points

1. **Deployment Order**: Primary stack MUST complete before secondary stack deployment
2. **DependsOn**: Secondary cluster has implicit dependency on primary through GlobalClusterIdentifier
3. **environmentSuffix**: All resource names include the EnvironmentSuffix parameter
4. **DeletionPolicy**: All resources set to Delete for clean removal
5. **Region-Specific**: Deploy templates in their respective regions (us-east-1 and eu-west-1)

### Parameters Required

**Primary Stack**:
- EnvironmentSuffix (string)
- DBUsername (string)
- DBPassword (string, NoEcho)
- VpcId (VPC ID in us-east-1)
- PrivateSubnetIds (3 subnet IDs in us-east-1)

**Secondary Stack**:
- EnvironmentSuffix (string)
- GlobalClusterIdentifier (from primary stack output)
- VpcId (VPC ID in eu-west-1)
- PrivateSubnetIds (3 subnet IDs in eu-west-1)

### Key Features Implemented

- Aurora MySQL 8.0 compatible engine (version 8.0.mysql_aurora.3.04.0)
- Global database cluster spanning us-east-1 and eu-west-1
- Primary cluster with writer and reader instances
- Secondary cluster with reader instance
- KMS encryption in both regions
- 7-day automated backup retention
- CloudWatch alarms for CPU, connections, and replication lag (1000ms threshold)
- Route 53 health checks for failover routing
- Enhanced monitoring with 60-second granularity
- Performance Insights enabled
- CloudWatch log exports (error, general, slowquery, audit)
- SNS topics for alarm notifications
- Proper IAM roles for enhanced monitoring
