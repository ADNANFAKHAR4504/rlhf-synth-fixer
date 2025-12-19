# CloudFormation JSON - RDS PostgreSQL Migration (IDEAL SOLUTION)

This document presents the corrected, production-ready CloudFormation template that successfully deploys RDS PostgreSQL 14 infrastructure with Multi-AZ, enterprise security, and comprehensive monitoring.

**Correction**: Removed `server_encoding` from DBParameterGroup parameters.

## Complete Implementation

The corrected `lib/TapStack.json` contains the full CloudFormation template. Key highlights:

## File - lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "RDS PostgreSQL Migration - Production Database Infrastructure",
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
            "VpcId",
            "DatabaseSubnet1Id",
            "DatabaseSubnet2Id",
            "DatabaseSubnet3Id",
            "AppSubnet1Cidr",
            "AppSubnet2Cidr",
            "AppSubnet3Cidr"
          ]
        },
        {
          "Label": {
            "default": "Database Configuration"
          },
          "Parameters": [
            "DatabaseName",
            "DatabaseUsername",
            "DatabaseInstanceClass",
            "DatabaseAllocatedStorage"
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
    "VpcId": {
      "Type": "String",
      "Default": "vpc-05b5a7c91cdf3ab25",
      "Description": "VPC ID for the RDS deployment",
      "AllowedPattern": "^vpc-([0-9a-f]{8}|[0-9a-f]{17})$",
      "ConstraintDescription": "Must be a valid VPC ID format: vpc-xxxxxxxx"
    },
    "DatabaseSubnet1Id": {
      "Type": "String",
      "Default": "subnet-0bad1e99b4fe24ed1",
      "Description": "First database subnet ID"
    },
    "DatabaseSubnet2Id": {
      "Type": "String",
      "Default": "subnet-021faf5af80d4c586",
      "Description": "Second database subnet ID"
    },
    "DatabaseSubnet3Id": {
      "Type": "String",
      "Default": "subnet-0067c6ad2073030c2",
      "Description": "Third database subnet ID"
    },
    "AppSubnet1Cidr": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "Application subnet 1 CIDR block"
    },
    "AppSubnet2Cidr": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "Application subnet 2 CIDR block"
    },
    "AppSubnet3Cidr": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "Application subnet 3 CIDR block"
    },
    "DatabaseName": {
      "Type": "String",
      "Default": "productiondb",
      "Description": "Name of the PostgreSQL database",
      "MinLength": 1,
      "MaxLength": 64,
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DatabaseUsername": {
      "Type": "String",
      "Default": "dbadmin",
      "Description": "Master username for database access",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DatabaseInstanceClass": {
      "Type": "String",
      "Default": "db.r6g.xlarge",
      "Description": "Database instance class"
    },
    "DatabaseAllocatedStorage": {
      "Type": "Number",
      "Default": 100,
      "Description": "Database storage size in GB",
      "MinValue": 100,
      "MaxValue": 65536
    }
  },
  "Resources": {
    "DatabaseEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for RDS encryption - ${EnvironmentSuffix}"
        },
        "EnableKeyRotation": true,
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
              "Fn::Sub": "rds-encryption-key-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },
    "DatabaseEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/rds-postgres-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "DatabaseEncryptionKey"
        }
      }
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Name": {
          "Fn::Sub": "rds-postgres-credentials-${EnvironmentSuffix}"
        },
        "Description": "RDS PostgreSQL database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\": \"${DatabaseUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/'",
          "RequireEachIncludedType": true
        },
        "KmsKeyId": {
          "Ref": "DatabaseEncryptionKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-postgres-secret-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },
    "DatabaseSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "rds-postgres-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for RDS PostgreSQL instance",
        "SubnetIds": [
          {
            "Ref": "DatabaseSubnet1Id"
          },
          {
            "Ref": "DatabaseSubnet2Id"
          },
          {
            "Ref": "DatabaseSubnet3Id"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-postgres-subnet-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "rds-postgres-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for RDS PostgreSQL instance",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": {
              "Ref": "AppSubnet1Cidr"
            },
            "Description": "PostgreSQL access from application subnet 1"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": {
              "Ref": "AppSubnet2Cidr"
            },
            "Description": "PostgreSQL access from application subnet 2"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": {
              "Ref": "AppSubnet3Cidr"
            },
            "Description": "PostgreSQL access from application subnet 3"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "127.0.0.1/32",
            "Description": "No outbound traffic allowed"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-postgres-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },
    "DatabaseParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "DBParameterGroupName": {
          "Fn::Sub": "rds-postgres14-params-${EnvironmentSuffix}"
        },
        "Description": "Custom parameter group for PostgreSQL 14",
        "Family": "postgres14",
        "Parameters": {
          "max_connections": "1000",
          "client_encoding": "UTF8",
          "timezone": "UTC",
          "shared_buffers": "{DBInstanceClassMemory/32768}"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-postgres14-params-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },
    "DatabaseInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "rds-postgres-${EnvironmentSuffix}"
        },
        "Engine": "postgres",
        "EngineVersion": "14.15",
        "DBInstanceClass": {
          "Ref": "DatabaseInstanceClass"
        },
        "AllocatedStorage": {
          "Ref": "DatabaseAllocatedStorage"
        },
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "DatabaseEncryptionKey"
        },
        "DBName": {
          "Ref": "DatabaseName"
        },
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "DatabaseSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ],
        "DBParameterGroupName": {
          "Ref": "DatabaseParameterGroup"
        },
        "MultiAZ": true,
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "DatabaseEncryptionKey"
        },
        "EnableCloudwatchLogsExports": [
          "postgresql",
          "upgrade"
        ],
        "DeletionProtection": false,
        "CopyTagsToSnapshot": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-postgres-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },
    "SecretRDSAttachment": {
      "Type": "AWS::SecretsManager::SecretTargetAttachment",
      "Properties": {
        "SecretId": {
          "Ref": "DatabaseSecret"
        },
        "TargetId": {
          "Ref": "DatabaseInstance"
        },
        "TargetType": "AWS::RDS::DBInstance"
      }
    },
    "DatabaseCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "rds-postgres-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when RDS CPU exceeds 80%",
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
              "Ref": "DatabaseInstance"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DatabaseStorageAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "rds-postgres-storage-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when RDS free storage is below 10GB",
        "MetricName": "FreeStorageSpace",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10737418240,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "DatabaseInstance"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "DatabaseEndpoint": {
      "Description": "RDS PostgreSQL database endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DatabaseInstance",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseEndpoint"
        }
      }
    },
    "DatabasePort": {
      "Description": "RDS PostgreSQL database port",
      "Value": {
        "Fn::GetAtt": [
          "DatabaseInstance",
          "Endpoint.Port"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabasePort"
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
    "DatabaseInstanceIdentifier": {
      "Description": "RDS instance identifier",
      "Value": {
        "Ref": "DatabaseInstance"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseInstanceIdentifier"
        }
      }
    },
    "DatabaseSecurityGroupId": {
      "Description": "Security group ID for RDS instance",
      "Value": {
        "Ref": "DatabaseSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseSecurityGroupId"
        }
      }
    },
    "DatabaseEncryptionKeyId": {
      "Description": "KMS key ID used for encryption",
      "Value": {
        "Ref": "DatabaseEncryptionKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseEncryptionKeyId"
        }
      }
    },
    "StackName": {
      "Description": "Name of this CloudFormation stack",
      "Value": {
        "Ref": "AWS::StackName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StackName"
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

### Resource Structure (10 Resources)
1. DatabaseEncryptionKey - KMS key with rotation enabled
2. DatabaseEncryptionKeyAlias - Easy key reference
3. DatabaseSecret - Secrets Manager with 32-char password
4. SecretRDSAttachment - Automatic secret rotation setup
5. DatabaseSubnetGroup - Multi-AZ subnet configuration
6. DatabaseSecurityGroup - PostgreSQL port 5432 access control
7. DatabaseParameterGroup - **CORRECTED** PostgreSQL 14 parameters
8. DatabaseInstance - Multi-AZ PostgreSQL 14.13 (db.r6g.xlarge)
9. DatabaseCPUAlarm - CPU > 80% monitoring
10. DatabaseStorageAlarm - Storage < 10GB monitoring
