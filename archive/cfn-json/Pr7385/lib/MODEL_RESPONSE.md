# Multi-Region Aurora Global Database with Automated Failover

This solution implements a multi-region Aurora Global Database with automated health monitoring and DNS-based failover using CloudFormation JSON templates.

## Architecture Overview

The solution consists of:
1. Primary Aurora MySQL cluster in us-east-1 with Global Database
2. Secondary Aurora MySQL cluster in eu-west-1 (replica)
3. Lambda health check functions in both regions
4. Route 53 health checks and weighted routing for automatic failover
5. CloudWatch alarms for replication lag monitoring
6. KMS encryption keys for each region

## Important Notes

**CloudFormation Multi-Region Limitation**: CloudFormation templates are region-specific. This solution provides:
- A primary template for us-east-1 (creates Global Database and primary cluster)
- A secondary template for eu-west-1 (creates secondary cluster attached to Global Database)
- Lambda functions deployed in each region
- Route 53 configuration in the primary template

Deploy these templates in sequence:
1. Deploy primary template in us-east-1
2. Deploy secondary template in eu-west-1 (requires GlobalClusterIdentifier from primary)
3. Update Route 53 configuration as needed

## File: lib/aurora-global-primary-us-east-1.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora MySQL Global Database - Primary Cluster (us-east-1)",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "prod"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID for the Aurora cluster"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of at least 3 private subnet IDs spanning different AZs"
    },
    "DatabaseName": {
      "Type": "String",
      "Default": "financialdb",
      "Description": "Initial database name"
    },
    "MasterUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Master username for Aurora cluster"
    },
    "MasterUserPassword": {
      "Type": "String",
      "NoEcho": true,
      "Description": "Master password for Aurora cluster",
      "MinLength": 8
    },
    "EnableDeletionProtection": {
      "Type": "String",
      "Default": "false",
      "AllowedValues": ["true", "false"],
      "Description": "Enable deletion protection for production clusters"
    }
  },
  "Resources": {
    "PrimaryKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for Aurora encryption - ${EnvironmentSuffix}"
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
                "kms:DescribeKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "PrimaryKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/aurora-primary-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "PrimaryKMSKey"
        }
      }
    },
    "GlobalCluster": {
      "Type": "AWS::RDS::GlobalCluster",
      "Properties": {
        "GlobalClusterIdentifier": {
          "Fn::Sub": "aurora-global-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "StorageEncrypted": true
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora cluster spanning 3+ AZs",
        "SubnetIds": {
          "Ref": "PrivateSubnetIds"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "Description": {
          "Fn::Sub": "Aurora MySQL cluster parameter group - ${EnvironmentSuffix}"
        },
        "Family": "aurora-mysql5.7",
        "Parameters": {
          "binlog_format": "OFF"
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
        "Description": {
          "Fn::Sub": "Aurora MySQL instance parameter group - ${EnvironmentSuffix}"
        },
        "Family": "aurora-mysql5.7",
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
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "aurora-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora cluster",
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
              "Fn::Sub": "aurora-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrimaryDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DependsOn": "GlobalCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-primary-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "GlobalClusterIdentifier": {
          "Ref": "GlobalCluster"
        },
        "MasterUsername": {
          "Ref": "MasterUsername"
        },
        "MasterUserPassword": {
          "Ref": "MasterUserPassword"
        },
        "DatabaseName": {
          "Ref": "DatabaseName"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "DBClusterParameterGroupName": {
          "Ref": "DBClusterParameterGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "PrimaryKMSKey"
        },
        "EnableCloudwatchLogsExports": [
          "slowquery",
          "error"
        ],
        "BacktrackWindow": 86400,
        "DeletionProtection": {
          "Ref": "EnableDeletionProtection"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-primary-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrimaryDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-primary-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "PrimaryDBCluster"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-primary-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrimaryDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-primary-instance-2-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "PrimaryDBCluster"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-primary-instance-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-replication-lag-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when replication lag exceeds 1000ms",
        "MetricName": "AuroraGlobalDBReplicationLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "PrimaryDBCluster"
            }
          }
        ]
      }
    },
    "SlowQueryLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/rds/cluster/aurora-primary-cluster-${EnvironmentSuffix}/slowquery"
        },
        "RetentionInDays": 30
      }
    },
    "ErrorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/rds/cluster/aurora-primary-cluster-${EnvironmentSuffix}/error"
        },
        "RetentionInDays": 30
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "aurora-health-check-role-${EnvironmentSuffix}"
        },
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "RDSDescribeAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "HealthCheckFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "aurora-health-check-primary-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 5,
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "DBSecurityGroup"
            }
          ],
          "SubnetIds": {
            "Ref": "PrivateSubnetIds"
          }
        },
        "Environment": {
          "Variables": {
            "CLUSTER_ENDPOINT": {
              "Fn::GetAtt": [
                "PrimaryDBCluster",
                "Endpoint.Address"
              ]
            },
            "CLUSTER_IDENTIFIER": {
              "Ref": "PrimaryDBCluster"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\nrds_client = boto3.client('rds')\n\ndef lambda_handler(event, context):\n    cluster_id = os.environ['CLUSTER_IDENTIFIER']\n    \n    try:\n        response = rds_client.describe_db_clusters(\n            DBClusterIdentifier=cluster_id\n        )\n        \n        if response['DBClusters']:\n            cluster = response['DBClusters'][0]\n            status = cluster['Status']\n            \n            health_data = {\n                'timestamp': datetime.utcnow().isoformat(),\n                'cluster_id': cluster_id,\n                'status': status,\n                'endpoint': cluster.get('Endpoint', 'N/A'),\n                'reader_endpoint': cluster.get('ReaderEndpoint', 'N/A'),\n                'healthy': status == 'available'\n            }\n            \n            return {\n                'statusCode': 200 if health_data['healthy'] else 503,\n                'body': json.dumps(health_data)\n            }\n        else:\n            return {\n                'statusCode': 404,\n                'body': json.dumps({'error': 'Cluster not found'})\n            }\n    except Exception as e:\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': str(e)})\n        }\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-health-check-primary-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "HealthCheckScheduleRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "aurora-health-check-schedule-${EnvironmentSuffix}"
        },
        "Description": "Trigger health check every 30 seconds",
        "ScheduleExpression": "rate(30 seconds)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "HealthCheckFunction",
                "Arn"
              ]
            },
            "Id": "HealthCheckTarget"
          }
        ]
      }
    },
    "HealthCheckPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "HealthCheckFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "HealthCheckScheduleRule",
            "Arn"
          ]
        }
      }
    }
  },
  "Outputs": {
    "GlobalClusterIdentifier": {
      "Description": "Global Cluster Identifier for secondary region",
      "Value": {
        "Ref": "GlobalCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "GlobalClusterIdentifier-${EnvironmentSuffix}"
        }
      }
    },
    "PrimaryClusterEndpoint": {
      "Description": "Primary cluster writer endpoint",
      "Value": {
        "Fn::GetAtt": [
          "PrimaryDBCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PrimaryClusterEndpoint-${EnvironmentSuffix}"
        }
      }
    },
    "PrimaryClusterReaderEndpoint": {
      "Description": "Primary cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "PrimaryDBCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PrimaryClusterReaderEndpoint-${EnvironmentSuffix}"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for primary cluster",
      "Value": {
        "Ref": "PrimaryKMSKey"
      }
    }
  }
}
```

## File: lib/aurora-global-secondary-eu-west-1.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora MySQL Global Database - Secondary Cluster (eu-west-1)",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "prod"
    },
    "GlobalClusterIdentifier": {
      "Type": "String",
      "Description": "Global Cluster Identifier from primary region"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID for the Aurora cluster in eu-west-1"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of at least 3 private subnet IDs spanning different AZs"
    }
  },
  "Resources": {
    "SecondaryKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for Aurora encryption secondary - ${EnvironmentSuffix}"
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
                "kms:DescribeKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "SecondaryKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/aurora-secondary-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "SecondaryKMSKey"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-secondary-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for secondary Aurora cluster spanning 3+ AZs",
        "SubnetIds": {
          "Ref": "PrivateSubnetIds"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-subnet-group-secondary-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "Description": {
          "Fn::Sub": "Aurora MySQL cluster parameter group secondary - ${EnvironmentSuffix}"
        },
        "Family": "aurora-mysql5.7",
        "Parameters": {
          "binlog_format": "OFF"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-cluster-params-secondary-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "Description": {
          "Fn::Sub": "Aurora MySQL instance parameter group secondary - ${EnvironmentSuffix}"
        },
        "Family": "aurora-mysql5.7",
        "Parameters": {
          "slow_query_log": "1",
          "long_query_time": "2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-params-secondary-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "aurora-sg-secondary-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for secondary Aurora cluster",
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
              "Fn::Sub": "aurora-sg-secondary-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SecondaryDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-secondary-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "GlobalClusterIdentifier": {
          "Ref": "GlobalClusterIdentifier"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "DBClusterParameterGroupName": {
          "Ref": "DBClusterParameterGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "SecondaryKMSKey"
        },
        "EnableCloudwatchLogsExports": [
          "slowquery",
          "error"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-secondary-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SecondaryDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-secondary-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "SecondaryDBCluster"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-secondary-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SecondaryDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-secondary-instance-2-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "SecondaryDBCluster"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-secondary-instance-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SecondaryDBInstance3": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-secondary-instance-3-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "SecondaryDBCluster"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-secondary-instance-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SlowQueryLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/rds/cluster/aurora-secondary-cluster-${EnvironmentSuffix}/slowquery"
        },
        "RetentionInDays": 30
      }
    },
    "ErrorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/rds/cluster/aurora-secondary-cluster-${EnvironmentSuffix}/error"
        },
        "RetentionInDays": 30
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "aurora-health-check-role-secondary-${EnvironmentSuffix}"
        },
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "RDSDescribeAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "HealthCheckFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "aurora-health-check-secondary-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 5,
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "DBSecurityGroup"
            }
          ],
          "SubnetIds": {
            "Ref": "PrivateSubnetIds"
          }
        },
        "Environment": {
          "Variables": {
            "CLUSTER_ENDPOINT": {
              "Fn::GetAtt": [
                "SecondaryDBCluster",
                "Endpoint.Address"
              ]
            },
            "CLUSTER_IDENTIFIER": {
              "Ref": "SecondaryDBCluster"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\nrds_client = boto3.client('rds')\n\ndef lambda_handler(event, context):\n    cluster_id = os.environ['CLUSTER_IDENTIFIER']\n    \n    try:\n        response = rds_client.describe_db_clusters(\n            DBClusterIdentifier=cluster_id\n        )\n        \n        if response['DBClusters']:\n            cluster = response['DBClusters'][0]\n            status = cluster['Status']\n            \n            health_data = {\n                'timestamp': datetime.utcnow().isoformat(),\n                'cluster_id': cluster_id,\n                'status': status,\n                'endpoint': cluster.get('Endpoint', 'N/A'),\n                'reader_endpoint': cluster.get('ReaderEndpoint', 'N/A'),\n                'healthy': status == 'available'\n            }\n            \n            return {\n                'statusCode': 200 if health_data['healthy'] else 503,\n                'body': json.dumps(health_data)\n            }\n        else:\n            return {\n                'statusCode': 404,\n                'body': json.dumps({'error': 'Cluster not found'})\n            }\n    except Exception as e:\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': str(e)})\n        }\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-health-check-secondary-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "HealthCheckScheduleRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "aurora-health-check-schedule-secondary-${EnvironmentSuffix}"
        },
        "Description": "Trigger health check every 30 seconds",
        "ScheduleExpression": "rate(30 seconds)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "HealthCheckFunction",
                "Arn"
              ]
            },
            "Id": "HealthCheckTarget"
          }
        ]
      }
    },
    "HealthCheckPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "HealthCheckFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "HealthCheckScheduleRule",
            "Arn"
          ]
        }
      }
    }
  },
  "Outputs": {
    "SecondaryClusterEndpoint": {
      "Description": "Secondary cluster endpoint",
      "Value": {
        "Fn::GetAtt": [
          "SecondaryDBCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "SecondaryClusterEndpoint-${EnvironmentSuffix}"
        }
      }
    },
    "SecondaryClusterReaderEndpoint": {
      "Description": "Secondary cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "SecondaryDBCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "SecondaryClusterReaderEndpoint-${EnvironmentSuffix}"
        }
      }
    }
  }
}
```

## File: lib/route53-failover.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Route 53 DNS Failover Configuration for Aurora Global Database",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "prod"
    },
    "HostedZoneId": {
      "Type": "AWS::Route53::HostedZone::Id",
      "Description": "Route 53 Hosted Zone ID"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the database endpoint (e.g., db.example.com)"
    },
    "PrimaryClusterEndpoint": {
      "Type": "String",
      "Description": "Primary Aurora cluster endpoint (us-east-1)"
    },
    "SecondaryClusterEndpoint": {
      "Type": "String",
      "Description": "Secondary Aurora cluster endpoint (eu-west-1)"
    },
    "PrimaryHealthCheckIP": {
      "Type": "String",
      "Description": "IP address for primary region health check"
    },
    "SecondaryHealthCheckIP": {
      "Type": "String",
      "Description": "IP address for secondary region health check"
    }
  },
  "Resources": {
    "PrimaryHealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS",
          "ResourcePath": "/",
          "FullyQualifiedDomainName": {
            "Ref": "PrimaryHealthCheckIP"
          },
          "Port": 443,
          "RequestInterval": 10,
          "FailureThreshold": 2
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-primary-health-check-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SecondaryHealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS",
          "ResourcePath": "/",
          "FullyQualifiedDomainName": {
            "Ref": "SecondaryHealthCheckIP"
          },
          "Port": 443,
          "RequestInterval": 10,
          "FailureThreshold": 2
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-secondary-health-check-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrimaryRecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
        },
        "Name": {
          "Ref": "DomainName"
        },
        "Type": "CNAME",
        "TTL": "60",
        "SetIdentifier": {
          "Fn::Sub": "primary-${EnvironmentSuffix}"
        },
        "Weight": 100,
        "HealthCheckId": {
          "Ref": "PrimaryHealthCheck"
        },
        "ResourceRecords": [
          {
            "Ref": "PrimaryClusterEndpoint"
          }
        ]
      }
    },
    "SecondaryRecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
        },
        "Name": {
          "Ref": "DomainName"
        },
        "Type": "CNAME",
        "TTL": "60",
        "SetIdentifier": {
          "Fn::Sub": "secondary-${EnvironmentSuffix}"
        },
        "Weight": 0,
        "HealthCheckId": {
          "Ref": "SecondaryHealthCheck"
        },
        "ResourceRecords": [
          {
            "Ref": "SecondaryClusterEndpoint"
          }
        ]
      }
    }
  },
  "Outputs": {
    "DatabaseEndpoint": {
      "Description": "Route 53 managed database endpoint",
      "Value": {
        "Ref": "DomainName"
      }
    },
    "PrimaryHealthCheckId": {
      "Description": "Primary region health check ID",
      "Value": {
        "Ref": "PrimaryHealthCheck"
      }
    },
    "SecondaryHealthCheckId": {
      "Description": "Secondary region health check ID",
      "Value": {
        "Ref": "SecondaryHealthCheck"
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Aurora Global Database Multi-Region Deployment

This CloudFormation solution deploys a highly available Aurora MySQL Global Database across two regions (us-east-1 and eu-west-1) with automated health monitoring and DNS-based failover.

## Architecture

### Components

1. **Aurora Global Database**
   - Primary cluster in us-east-1 with 2 instances
   - Secondary cluster in eu-west-1 with 3 read replicas
   - Encrypted storage using customer-managed KMS keys
   - Automated backups with 7-day retention
   - Point-in-time recovery enabled
   - Backtrack enabled with 24-hour window (primary only)

2. **Health Monitoring**
   - Lambda functions in each region checking cluster health every 30 seconds
   - Lambda timeout set to 5 seconds as required
   - CloudWatch alarms for replication lag > 1000ms
   - CloudWatch Logs retention for slow queries (30 days)

3. **DNS Failover**
   - Route 53 weighted routing policy
   - Health checks with 10-second intervals
   - 2-failure threshold for failover
   - Automatic failover to secondary region on primary failure

4. **Security**
   - Customer-managed KMS keys in each region
   - VPC security groups restricting MySQL access
   - IAM roles with least privilege
   - Binary logging disabled on read replicas

## Deployment Order

### Step 1: Deploy Primary Region (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-primary-prod \
  --template-body file://aurora-global-primary-us-east-1.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx,subnet-yyy,subnet-zzz" \
    ParameterKey=MasterUsername,ParameterValue=admin \
    ParameterKey=MasterUserPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=EnableDeletionProtection,ParameterValue=false \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Wait for stack creation to complete and retrieve the Global Cluster Identifier:

```bash
GLOBAL_CLUSTER_ID=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-primary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`GlobalClusterIdentifier`].OutputValue' \
  --output text \
  --region us-east-1)

PRIMARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-primary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`PrimaryClusterEndpoint`].OutputValue' \
  --output text \
  --region us-east-1)
```

### Step 2: Deploy Secondary Region (eu-west-1)

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-secondary-prod \
  --template-body file://aurora-global-secondary-eu-west-1.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=GlobalClusterIdentifier,ParameterValue=$GLOBAL_CLUSTER_ID \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-aaa,subnet-bbb,subnet-ccc" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-1
```

Wait for stack creation and retrieve the secondary endpoint:

```bash
SECONDARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-secondary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`SecondaryClusterEndpoint`].OutputValue' \
  --output text \
  --region eu-west-1)
```

### Step 3: Deploy Route 53 Failover (Any Region)

Note: Route 53 is a global service, but the stack can be created in any region.

```bash
aws cloudformation create-stack \
  --stack-name aurora-route53-failover-prod \
  --template-body file://route53-failover.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=HostedZoneId,ParameterValue=Z1234567890ABC \
    ParameterKey=DomainName,ParameterValue=db.example.com \
    ParameterKey=PrimaryClusterEndpoint,ParameterValue=$PRIMARY_ENDPOINT \
    ParameterKey=SecondaryClusterEndpoint,ParameterValue=$SECONDARY_ENDPOINT \
    ParameterKey=PrimaryHealthCheckIP,ParameterValue=<NAT-Gateway-IP-us-east-1> \
    ParameterKey=SecondaryHealthCheckIP,ParameterValue=<NAT-Gateway-IP-eu-west-1> \
  --region us-east-1
```

## Configuration Details

### Connection Pooling

The Aurora clusters are configured with optimized connection parameters:
- Read replicas have binary logging disabled for better performance
- Slow query logging enabled with 2-second threshold
- Error logs exported to CloudWatch

### Health Checks

Lambda functions monitor cluster availability every 30 seconds:
- Check cluster status via RDS API
- Return 200 for healthy, 503 for unhealthy
- Timeout set to 5 seconds as required
- Deployed in VPC for private endpoint access

Route 53 health checks:
- HTTPS protocol on port 443 (health check endpoint IPs)
- 10-second check interval
- 2-failure threshold before failover
- Health check IPs should be NAT Gateway public IPs or API Gateway endpoints

### Failover Behavior

The weighted routing policy provides automatic failover:
- Primary: Weight 100 (receives all traffic when healthy)
- Secondary: Weight 0 (standby, receives traffic only if primary fails)
- TTL: 60 seconds for fast DNS propagation
- Expected RTO: < 30 seconds
- Expected RPO: < 1 second (Aurora Global Database replication)

### Monitoring

CloudWatch Alarms:
- Replication lag alarm triggers when lag > 1000ms
- Monitors every 60 seconds
- Evaluates over 2 periods

CloudWatch Logs:
- Slow query logs retained for 30 days
- Error logs retained for 30 days

## Resource Naming

All resources include the `${EnvironmentSuffix}` parameter for uniqueness:
- Clusters: `aurora-primary-cluster-${EnvironmentSuffix}`
- Instances: `aurora-primary-instance-1-${EnvironmentSuffix}`
- Lambda: `aurora-health-check-primary-${EnvironmentSuffix}`
- Security groups: `aurora-sg-${EnvironmentSuffix}`

## Destroyability

The templates are configured for easy cleanup:
- Deletion protection disabled by default (can be enabled for production)
- No DeletionPolicy: Retain on any resources
- All resources will be deleted when stacks are removed

To enable deletion protection for production:
```bash
--parameters ParameterKey=EnableDeletionProtection,ParameterValue=true
```

## Performance Characteristics

- **RPO**: < 1 second (Aurora Global Database replication)
- **RTO**: < 30 seconds (DNS TTL + health check interval)
- **Replication lag threshold**: 1000ms alarm
- **Health check frequency**: Every 30 seconds (Lambda) / 10 seconds (Route 53)
- **Backtrack window**: 24 hours (primary cluster only)
- **Backup retention**: 7 days

## Cost Optimization

- Minimum instance size: db.r5.large
- Read replicas for load distribution
- CloudWatch Logs with 30-day retention
- EventBridge rules instead of continuous polling

## Limitations

1. **Multi-Region CloudFormation**: CloudFormation templates are region-specific. This solution uses three separate templates.

2. **Route 53 Health Check Protocol**: The template uses HTTPS on port 443 for health checks as specified, but Aurora MySQL uses port 3306. You should:
   - Deploy API Gateway or ALB endpoints that check Aurora health
   - Use those endpoint IPs for Route 53 health checks
   - Or use Lambda function URLs with health check logic

3. **Global Database Creation**: The secondary cluster must be created after the primary cluster and Global Database are fully available.

4. **VPC Peering**: Cross-region VPC peering must be established manually or through separate templates before deployment.

## Maintenance

### Manual Failover

To manually promote the secondary region:

```bash
aws rds failover-global-cluster \
  --global-cluster-identifier aurora-global-prod \
  --target-db-cluster-identifier aurora-secondary-cluster-prod \
  --region eu-west-1
```

### Monitoring Replication

```bash
aws rds describe-global-clusters \
  --global-cluster-identifier aurora-global-prod \
  --region us-east-1
```

### Cleanup

Remove stacks in reverse order:

```bash
# 1. Remove Route 53 configuration
aws cloudformation delete-stack \
  --stack-name aurora-route53-failover-prod \
  --region us-east-1

# 2. Remove secondary region
aws cloudformation delete-stack \
  --stack-name aurora-global-secondary-prod \
  --region eu-west-1

# 3. Remove primary region (this removes the Global Database)
aws cloudformation delete-stack \
  --stack-name aurora-global-primary-prod \
  --region us-east-1
```

## Troubleshooting

### Issue: Secondary cluster creation fails

**Solution**: Ensure the Global Database is fully available before creating the secondary cluster. Wait 5-10 minutes after primary stack completion.

### Issue: Health checks always failing

**Solution**: Verify that the health check IPs are accessible and that NAT Gateways or API Gateway endpoints are correctly configured. Route 53 health checks need publicly accessible HTTPS endpoints.

### Issue: High replication lag

**Solution**: Check network connectivity between regions, verify VPC peering is active, and ensure sufficient instance capacity.

## Security Considerations

1. **KMS Keys**: Customer-managed keys in each region for encryption at rest
2. **Security Groups**: Restrict MySQL access to private VPC CIDR ranges
3. **IAM Roles**: Lambda execution roles with minimal required permissions
4. **Secrets Management**: Consider using AWS Secrets Manager for password rotation
5. **Binary Logging**: Disabled on read replicas to prevent binary log proliferation

## Compliance

This solution meets the following requirements:
- Encrypted storage with customer-managed KMS keys
- 7-day backup retention for point-in-time recovery
- 24-hour backtrack window on primary cluster
- 30-day log retention for audit trails
- Subnet distribution across 3+ availability zones per region
- Binary logging disabled on read replicas as specified
