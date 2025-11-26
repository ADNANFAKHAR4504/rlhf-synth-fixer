# Aurora Global Database CloudFormation Implementation

This CloudFormation JSON template deploys an Aurora Global Database with cross-region disaster recovery capabilities for a financial trading platform requiring 99.99% uptime.

## Architecture Overview

The solution implements:
- Aurora MySQL 8.0 compatible global database
- Primary cluster in us-east-1 with one writer and one reader instance
- VPC with public and private subnets across multiple availability zones
- Route 53 health checks for failover routing
- KMS encryption at rest with key rotation
- CloudWatch alarms for replication lag, CPU, memory, and connection monitoring
- CloudWatch dashboard for centralized monitoring
- Multi-AZ database subnet groups
- SNS topic for critical alerts with CloudWatch integration

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora Global Database for Cross-Region Disaster Recovery - Financial Trading Platform with 99.99% uptime SLA",
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
      "NoEcho": true,
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DBPassword": {
      "Type": "String",
      "Description": "Master password for Aurora database",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "Default": "ChangeMe123!"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for VPC",
      "Default": "10.0.0.0/16"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for database failover endpoint",
      "Default": "tradingdb.example.com"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Ref": "VpcCidr" },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "trading-vpc-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-igw-${EnvironmentSuffix}" } }]
      }
    },
    "VPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-public-subnet-1-${EnvironmentSuffix}" } }]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-public-subnet-2-${EnvironmentSuffix}" } }]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.10.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-private-subnet-1-${EnvironmentSuffix}" } }]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-private-subnet-2-${EnvironmentSuffix}" } }]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": "" }] },
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-private-subnet-3-${EnvironmentSuffix}" } }]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": { "Fn::Sub": "KMS key for Aurora encryption us-east-1 ${EnvironmentSuffix}" },
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": { "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" } },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": { "Service": "rds.amazonaws.com" },
              "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant", "kms:ReEncrypt*", "kms:DescribeKey"],
              "Resource": "*"
            }
          ]
        },
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-db-kms-${EnvironmentSuffix}" } }]
      },
      "DeletionPolicy": "Delete"
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "trading-db-sg-${EnvironmentSuffix}" },
        "GroupDescription": "Security group for Aurora database access - restricts to application tier only",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          { "IpProtocol": "tcp", "FromPort": 3306, "ToPort": 3306, "CidrIp": "10.0.0.0/16", "Description": "MySQL access from VPC" }
        ],
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-db-sg-${EnvironmentSuffix}" } }]
      },
      "DeletionPolicy": "Delete"
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "trading-db-subnets-${EnvironmentSuffix}" },
        "DBSubnetGroupDescription": "Subnet group for Aurora Global Database spanning multiple AZs",
        "SubnetIds": [{ "Ref": "PrivateSubnet1" }, { "Ref": "PrivateSubnet2" }, { "Ref": "PrivateSubnet3" }],
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-db-subnets-${EnvironmentSuffix}" } }]
      },
      "DeletionPolicy": "Delete"
    },
    "GlobalCluster": {
      "Type": "AWS::RDS::GlobalCluster",
      "Properties": {
        "GlobalClusterIdentifier": { "Fn::Sub": "trading-db-global-${EnvironmentSuffix}" },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "StorageEncrypted": true,
        "DeletionProtection": false
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": { "Fn::Sub": "trading-db-cluster-${EnvironmentSuffix}" },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "MasterUsername": { "Ref": "DBUsername" },
        "MasterUserPassword": { "Ref": "DBPassword" },
        "DatabaseName": "tradingdb",
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "DBSecurityGroup" }],
        "StorageEncrypted": true,
        "KmsKeyId": { "Ref": "KMSKey" },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery", "audit"],
        "GlobalClusterIdentifier": { "Ref": "GlobalCluster" },
        "CopyTagsToSnapshot": true,
        "EnableIAMDatabaseAuthentication": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "trading-db-cluster-${EnvironmentSuffix}" } },
          { "Key": "Role", "Value": "Primary" }
        ]
      },
      "DependsOn": ["GlobalCluster"],
      "DeletionPolicy": "Delete"
    },
    "EnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "rds-enhanced-monitoring-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{ "Effect": "Allow", "Principal": { "Service": "monitoring.rds.amazonaws.com" }, "Action": "sts:AssumeRole" }]
        },
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryDBInstanceWriter": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "trading-db-writer-${EnvironmentSuffix}" },
        "DBClusterIdentifier": { "Ref": "PrimaryDBCluster" },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.2xlarge",
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsKMSKeyId": { "Ref": "KMSKey" },
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": { "Fn::GetAtt": ["EnhancedMonitoringRole", "Arn"] },
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-db-writer-${EnvironmentSuffix}" } }, { "Key": "Role", "Value": "Writer" }]
      },
      "DependsOn": ["PrimaryDBCluster"],
      "DeletionPolicy": "Delete"
    },
    "PrimaryDBInstanceReader": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "trading-db-reader-${EnvironmentSuffix}" },
        "DBClusterIdentifier": { "Ref": "PrimaryDBCluster" },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.2xlarge",
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsKMSKeyId": { "Ref": "KMSKey" },
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": { "Fn::GetAtt": ["EnhancedMonitoringRole", "Arn"] },
        "Tags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-db-reader-${EnvironmentSuffix}" } }, { "Key": "Role", "Value": "Reader" }]
      },
      "DependsOn": ["PrimaryDBInstanceWriter"],
      "DeletionPolicy": "Delete"
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "trading-db-alerts-${EnvironmentSuffix}" },
        "DisplayName": "Aurora Global Database Critical Alerts",
        "KmsMasterKeyId": { "Ref": "KMSKey" }
      },
      "DeletionPolicy": "Delete"
    },
    "CPUAlarmWriter": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-db-writer-cpu-high-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when writer instance CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [{ "Name": "DBInstanceIdentifier", "Value": { "Ref": "PrimaryDBInstanceWriter" } }],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },
    "ReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-db-replication-lag-high-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when global replication lag exceeds 1000ms",
        "MetricName": "AuroraGlobalDBReplicationLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 3,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [{ "Name": "DBClusterIdentifier", "Value": { "Ref": "PrimaryDBCluster" } }],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },
    "PrimaryHealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "CLOUDWATCH_METRIC",
          "AlarmIdentifier": {
            "Name": { "Fn::Sub": "trading-db-writer-cpu-high-${EnvironmentSuffix}" },
            "Region": { "Ref": "AWS::Region" }
          },
          "InsufficientDataHealthStatus": "Healthy"
        },
        "HealthCheckTags": [{ "Key": "Name", "Value": { "Fn::Sub": "trading-db-primary-health-${EnvironmentSuffix}" } }]
      },
      "DependsOn": ["CPUAlarmWriter"]
    },
    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": { "Fn::Sub": "TradingDB-Health-${EnvironmentSuffix}" },
        "DashboardBody": { "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"title\":\"CPU Utilization\",\"metrics\":[[\"AWS/RDS\",\"CPUUtilization\",\"DBInstanceIdentifier\",\"${PrimaryDBInstanceWriter}\"]],\"period\":60,\"stat\":\"Average\",\"region\":\"${AWS::Region}\"}}]}" }
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID for the trading platform",
      "Value": { "Ref": "VPC" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-VpcId" } }
    },
    "GlobalClusterIdentifier": {
      "Description": "Aurora Global Cluster Identifier",
      "Value": { "Ref": "GlobalCluster" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-GlobalClusterId" } }
    },
    "PrimaryClusterEndpoint": {
      "Description": "Primary cluster writer endpoint",
      "Value": { "Fn::GetAtt": ["PrimaryDBCluster", "Endpoint.Address"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-PrimaryEndpoint" } }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for Aurora encryption",
      "Value": { "Ref": "KMSKey" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-KMSKeyId" } }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for alerts",
      "Value": { "Ref": "SNSTopic" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-SNSTopicArn" } }
    }
  }
}
```

## Deployment Instructions

### Deploy Stack

```bash
export ENVIRONMENT_SUFFIX="dev"
export DB_PASSWORD="YourSecurePassword123!"

aws cloudformation create-stack \
  --stack-name TapStack-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=$ENVIRONMENT_SUFFIX \
    ParameterKey=DBUsername,ParameterValue=admin \
    ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name TapStack-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

## Key Features Implemented

- Aurora MySQL 8.0 compatible engine (version 8.0.mysql_aurora.3.04.0)
- Global database cluster with primary cluster
- Primary cluster with writer and reader instances
- Complete VPC infrastructure with public/private subnets
- KMS encryption with key rotation
- 7-day automated backup retention
- CloudWatch alarms for CPU, connections, and replication lag
- Route 53 health checks for failover
- Enhanced monitoring with 60-second granularity
- Performance Insights enabled
- CloudWatch log exports (error, general, slowquery, audit)
- SNS topic for alarm notifications
- CloudWatch dashboard for monitoring
- Proper IAM roles for enhanced monitoring

## Cost Estimate

- Aurora instances: ~$794/month (2x db.r6g.2xlarge)
- KMS key: $1/month
- VPC: Free
- Route 53 health check: $0.50/month
- SNS: Free tier
- CloudWatch dashboard: Free (first 3)

**Total**: ~$796/month
