# Aurora PostgreSQL Production Database Infrastructure - CloudFormation Implementation

This implementation provides a complete production-ready Aurora Serverless v2 PostgreSQL cluster with all security, monitoring, and high availability features configured as specified.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora PostgreSQL Production Database Infrastructure - Transaction Processing System",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix"
          ]
        },
        {
          "Label": {
            "default": "Network Configuration"
          },
          "Parameters": [
            "SubnetId1",
            "SubnetId2",
            "VpcSecurityGroupId"
          ]
        },
        {
          "Label": {
            "default": "Database Configuration"
          },
          "Parameters": [
            "DatabaseName",
            "MasterUsername"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "prod",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "SubnetId1": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "First subnet ID for DB subnet group (must be in different AZ)"
    },
    "SubnetId2": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Second subnet ID for DB subnet group (must be in different AZ)"
    },
    "VpcSecurityGroupId": {
      "Type": "AWS::EC2::SecurityGroup::Id",
      "Description": "VPC Security Group ID for database access control"
    },
    "DatabaseName": {
      "Type": "String",
      "Default": "transactiondb",
      "Description": "Name of the initial database to create",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "MasterUsername": {
      "Type": "String",
      "Default": "dbadmin",
      "Description": "Master username for the database",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters",
      "MinLength": "1",
      "MaxLength": "16"
    }
  },
  "Resources": {
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Name": {
          "Fn::Sub": "aurora-credentials-${EnvironmentSuffix}"
        },
        "Description": "Master credentials for Aurora PostgreSQL cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\":\"${MasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-credentials-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora PostgreSQL cluster across 2 AZs",
        "SubnetIds": [
          {
            "Ref": "SubnetId1"
          },
          {
            "Ref": "SubnetId2"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
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
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "DBClusterParameterGroupName": {
          "Fn::Sub": "aurora-pg-params-${EnvironmentSuffix}"
        },
        "Description": "Custom parameter group for Aurora PostgreSQL with query logging",
        "Family": "aurora-postgresql15",
        "Parameters": {
          "log_statement": "all"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-pg-params-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "DependsOn": [
        "DatabaseSecret",
        "DBSubnetGroup",
        "DBClusterParameterGroup"
      ],
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-postgres-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-postgresql",
        "EngineVersion": "15.4",
        "EngineMode": "provisioned",
        "DatabaseName": {
          "Ref": "DatabaseName"
        },
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}"
        },
        "DBClusterParameterGroupName": {
          "Ref": "DBClusterParameterGroup"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "VpcSecurityGroupId"
          }
        ],
        "StorageEncrypted": true,
        "DeletionProtection": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "postgresql"
        ],
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": 0.5,
          "MaxCapacity": 1
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-postgres-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "DependsOn": "AuroraCluster",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "DBInstanceClass": "db.serverless",
        "Engine": "aurora-postgresql",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "DependsOn": "AuroraInstance1",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "DBInstanceClass": "db.serverless",
        "Engine": "aurora-postgresql",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CPUUtilizationAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "DependsOn": "AuroraCluster",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-cpu-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Triggers when Aurora cluster CPU exceeds 80% for 5 minutes",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraCluster"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "SecretTargetAttachment": {
      "Type": "AWS::SecretsManager::SecretTargetAttachment",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "DependsOn": [
        "DatabaseSecret",
        "AuroraCluster"
      ],
      "Properties": {
        "SecretId": {
          "Ref": "DatabaseSecret"
        },
        "TargetId": {
          "Ref": "AuroraCluster"
        },
        "TargetType": "AWS::RDS::DBCluster"
      }
    }
  },
  "Outputs": {
    "ClusterEndpoint": {
      "Description": "Aurora cluster writer endpoint for application connections",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
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
      "Description": "Aurora cluster reader endpoint for read-only queries",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
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
      "Description": "Aurora cluster port number",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "Endpoint.Port"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterPort"
        }
      }
    },
    "DatabaseSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "DatabaseSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseSecretArn"
        }
      }
    },
    "ClusterIdentifier": {
      "Description": "Aurora cluster identifier",
      "Value": {
        "Ref": "AuroraCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterIdentifier"
        }
      }
    },
    "DBSubnetGroupName": {
      "Description": "Name of the DB subnet group",
      "Value": {
        "Ref": "DBSubnetGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DBSubnetGroupName"
        }
      }
    },
    "CPUAlarmName": {
      "Description": "Name of the CloudWatch CPU alarm",
      "Value": {
        "Ref": "CPUUtilizationAlarm"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CPUAlarmName"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    }
  }
}
```

## Implementation Summary

### Resources Created

1. **DatabaseSecret** (AWS::SecretsManager::Secret)
   - Generates secure master username and password
   - Password: 32 characters with complexity requirements
   - Tagged with Environment=Production and ManagedBy=CloudFormation

2. **DBSubnetGroup** (AWS::RDS::DBSubnetGroup)
   - Spans exactly 2 availability zones using provided subnet IDs
   - Enables high availability deployment

3. **DBClusterParameterGroup** (AWS::RDS::DBClusterParameterGroup)
   - Family: aurora-postgresql15
   - Parameter: log_statement='all' for comprehensive query logging

4. **AuroraCluster** (AWS::RDS::DBCluster)
   - Engine: aurora-postgresql 15.4
   - ServerlessV2 scaling: 0.5 - 1 ACU
   - Deletion protection: ENABLED
   - Backup retention: 7 days
   - Backup window: 03:00-04:00 UTC
   - Encryption: Enabled with AWS managed keys
   - CloudWatch Logs: PostgreSQL logs exported

5. **AuroraInstance1 & AuroraInstance2** (AWS::RDS::DBInstance)
   - Two db.serverless instances for high availability
   - Deployed across 2 AZs via subnet group
   - Private access only (PubliclyAccessible: false)

6. **CPUUtilizationAlarm** (AWS::CloudWatch::Alarm)
   - Monitors cluster CPU utilization
   - Threshold: 80%
   - Period: 5 minutes (300 seconds)
   - Triggers on average CPU exceeding threshold

7. **SecretTargetAttachment** (AWS::SecretsManager::SecretTargetAttachment)
   - Links secret to Aurora cluster for credential management
   - Enables automatic updates if credentials rotate

### Requirements Validation

All 10 requirements implemented:
1. Aurora Serverless v2 with PostgreSQL 15.4 - IMPLEMENTED
2. Min 0.5 ACU, Max 1 ACU scaling - IMPLEMENTED
3. Deletion protection and KMS encryption - IMPLEMENTED
4. 7-day backup retention, 03:00-04:00 UTC window - IMPLEMENTED
5. DB subnet group with parameter-provided subnet IDs - IMPLEMENTED
6. Secrets Manager with auto-generated credentials - IMPLEMENTED
7. Custom parameter group with log_statement='all' - IMPLEMENTED
8. CloudWatch alarm for CPU > 80% for 5 minutes - IMPLEMENTED
9. Outputs for cluster endpoint, reader endpoint, secret ARN - IMPLEMENTED
10. All resources tagged with Environment=Production and ManagedBy=CloudFormation - IMPLEMENTED

### Constraints Validation

All 8 constraints satisfied:
1. Aurora Serverless v2 auto-scaling (0.5-1 ACU) - SATISFIED
2. Deletion protection enabled - SATISFIED
3. Automated backups with 7-day retention - SATISFIED
4. AWS Secrets Manager for credentials - SATISFIED
5. Parameter groups with slow query logging - SATISFIED
6. Deployment across exactly 2 AZs - SATISFIED
7. Encryption at rest with AWS managed keys - SATISFIED
8. CloudWatch alarms for CPU > 80% - SATISFIED

### Deployment Notes

1. **Prerequisites**: VPC with at least 2 private subnets in different AZs and a security group for database access must exist before deploying this template.

2. **Parameter Values**: Provide SubnetId1, SubnetId2, and VpcSecurityGroupId during stack creation.

3. **Credentials**: Master credentials are automatically generated and stored in Secrets Manager. Retrieve them using:
   ```bash
   aws secretsmanager get-secret-value --secret-id aurora-credentials-{suffix}
   ```

4. **Connection**: Use the ClusterEndpoint output for write operations and ClusterReaderEndpoint for read-only queries.

5. **Scaling**: The cluster automatically scales between 0.5 and 1 ACU based on workload demand.

6. **Monitoring**: CPU alarm will trigger when utilization exceeds 80% for 5 consecutive minutes.

7. **Deletion**: To delete the stack, first disable deletion protection on the Aurora cluster manually or via AWS CLI:
   ```bash
   aws rds modify-db-cluster --db-cluster-identifier aurora-postgres-cluster-{suffix} --no-deletion-protection
   ```
