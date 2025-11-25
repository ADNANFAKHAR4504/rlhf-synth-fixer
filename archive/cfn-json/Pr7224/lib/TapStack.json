{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora Global Database infrastructure for cross-region disaster recovery with automated failover capabilities",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple stack deployments",
      "Default": "prod",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "DatabaseName": {
      "Type": "String",
      "Description": "Name of the database to create",
      "Default": "appdb",
      "MinLength": 1,
      "MaxLength": 64,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "MasterUsername": {
      "Type": "String",
      "Description": "Master username for database access",
      "Default": "admin",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "Database instance class",
      "Default": "db.r5.large",
      "AllowedValues": [
        "db.r5.large",
        "db.r5.xlarge",
        "db.r5.2xlarge",
        "db.r6g.large",
        "db.r6g.xlarge"
      ]
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
            "Value": { "Fn::Sub": "aurora-vpc-${environmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "environmentSuffix" }
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-1-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-2-${environmentSuffix}" }
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-3-${environmentSuffix}" }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "db-subnet-group-${environmentSuffix}" },
        "DBSubnetGroupDescription": "Subnet group for Aurora cluster",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" },
          { "Ref": "PrivateSubnet3" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "db-subnet-group-${environmentSuffix}" }
          }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "db-sg-${environmentSuffix}" },
        "GroupDescription": "Security group for Aurora cluster",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.0.0.0/16",
            "Description": "Allow MySQL access from VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "db-sg-${environmentSuffix}" }
          }
        ]
      }
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "aurora-master-credentials-${environmentSuffix}" },
        "Description": "Master credentials for Aurora Global Database",
        "GenerateSecretString": {
          "SecretStringTemplate": { "Fn::Sub": "{\"username\": \"${MasterUsername}\"}" },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-secret-${environmentSuffix}" }
          }
        ]
      }
    },
    "GlobalCluster": {
      "Type": "AWS::RDS::GlobalCluster",
      "Properties": {
        "GlobalClusterIdentifier": { "Fn::Sub": "global-aurora-cluster-${environmentSuffix}" },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "StorageEncrypted": true
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": { "Fn::Sub": "aurora-cluster-${environmentSuffix}" },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "GlobalClusterIdentifier": { "Ref": "GlobalCluster" },
        "MasterUsername": { "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}" },
        "MasterUserPassword": { "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}" },
        "DatabaseName": { "Ref": "DatabaseName" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "DBSecurityGroup" }],
        "StorageEncrypted": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-cluster-${environmentSuffix}" }
          }
        ]
      }
    },
    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "aurora-instance-1-${environmentSuffix}" },
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "DBCluster" },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-instance-1-${environmentSuffix}" }
          }
        ]
      }
    },
    "DBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "aurora-instance-2-${environmentSuffix}" },
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "DBCluster" },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-instance-2-${environmentSuffix}" }
          }
        ]
      }
    },
    "ClusterHealthCheck": {
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
            "Value": { "Fn::Sub": "cluster-health-${environmentSuffix}" }
          }
        ]
      }
    },
    "ClusterCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "cluster-cpu-${environmentSuffix}" },
        "AlarmDescription": "Alert when cluster CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": { "Ref": "DBCluster" }
          }
        ]
      }
    }
  },
  "Outputs": {
    "GlobalClusterIdentifier": {
      "Description": "Aurora Global Cluster identifier",
      "Value": { "Ref": "GlobalCluster" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-GlobalClusterIdentifier" }
      }
    },
    "ClusterEndpoint": {
      "Description": "Aurora cluster write endpoint",
      "Value": { "Fn::GetAtt": ["DBCluster", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ClusterEndpoint" }
      }
    },
    "ClusterReadEndpoint": {
      "Description": "Aurora cluster reader endpoint",
      "Value": { "Fn::GetAtt": ["DBCluster", "ReadEndpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ClusterReadEndpoint" }
      }
    },
    "DatabaseSecretArn": {
      "Description": "ARN of the database credentials secret",
      "Value": { "Ref": "DatabaseSecret" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DatabaseSecretArn" }
      }
    },
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPCId" }
      }
    },
    "DBClusterIdentifier": {
      "Description": "Aurora DB Cluster identifier",
      "Value": { "Ref": "DBCluster" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DBClusterIdentifier" }
      }
    },
    "DBSubnetGroupName": {
      "Description": "DB Subnet Group name",
      "Value": { "Ref": "DBSubnetGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DBSubnetGroupName" }
      }
    }
  }
}
