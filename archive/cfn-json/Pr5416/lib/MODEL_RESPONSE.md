# CloudFormation Template for RDS PostgreSQL Migration

This implementation provides a parameterized CloudFormation template in JSON format that deploys RDS PostgreSQL 14.7 across dev, staging, and production environments.

## File: lib/rds-migration-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "RDS PostgreSQL 14.7 database infrastructure for multi-environment deployment (dev, staging, prod) with environment-specific configurations",

  "Parameters": {
    "EnvironmentType": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment type that controls instance sizing, Multi-AZ, and backup retention settings"
    },

    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix to append to all resource names for environment isolation",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },

    "SubnetId1": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "First subnet ID in an existing VPC (must be in different AZ from SubnetId2)"
    },

    "SubnetId2": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Second subnet ID in an existing VPC (must be in different AZ from SubnetId1)"
    },

    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID where the RDS instance will be deployed"
    },

    "MasterUsername": {
      "Type": "String",
      "Default": "dbadmin",
      "Description": "Master username for the RDS PostgreSQL instance",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },

    "MigrationDate": {
      "Type": "String",
      "Default": "2025-10-30",
      "Description": "Date of database migration for tagging purposes"
    }
  },

  "Mappings": {
    "EnvironmentConfig": {
      "dev": {
        "InstanceClass": "db.t3.micro",
        "MultiAZ": "false",
        "BackupRetention": 7,
        "AllocatedStorage": 20
      },
      "staging": {
        "InstanceClass": "db.t3.small",
        "MultiAZ": "true",
        "BackupRetention": 7,
        "AllocatedStorage": 50
      },
      "prod": {
        "InstanceClass": "db.m5.large",
        "MultiAZ": "true",
        "BackupRetention": 30,
        "AllocatedStorage": 100
      }
    }
  },

  "Resources": {
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS PostgreSQL database access",
        "VpcId": {"Ref": "VpcId"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": "10.0.0.0/8",
            "Description": "Allow PostgreSQL access from internal VPC"
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
            "Value": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "MigrationDate",
            "Value": {"Ref": "MigrationDate"}
          },
          {
            "Key": "Project",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "rds-subnet-group-${EnvironmentType}-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": {"Fn::Sub": "Subnet group for RDS PostgreSQL ${EnvironmentType} environment"},
        "SubnetIds": [
          {"Ref": "SubnetId1"},
          {"Ref": "SubnetId2"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "rds-subnet-group-${EnvironmentType}-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "MigrationDate",
            "Value": {"Ref": "MigrationDate"}
          },
          {
            "Key": "Project",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },

    "DBMasterPassword": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "/rds/${EnvironmentType}/master-password-${EnvironmentSuffix}"},
        "Description": {"Fn::Sub": "Master password for RDS PostgreSQL ${EnvironmentType} database"},
        "GenerateSecretString": {
          "SecretStringTemplate": {"Fn::Sub": "{\"username\":\"${MasterUsername}\"}"},
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "MigrationDate",
            "Value": {"Ref": "MigrationDate"}
          },
          {
            "Key": "Project",
            "Value": "DatabaseMigration"
          }
        ]
      }
    },

    "PostgreSQLInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DependsOn": ["DBSubnetGroup", "DBMasterPassword"],
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "migrated-rds-${EnvironmentType}-${EnvironmentSuffix}"},
        "DBName": "migrated_app_db",
        "Engine": "postgres",
        "EngineVersion": "14.7",
        "DBInstanceClass": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentType"}, "InstanceClass"]},
        "AllocatedStorage": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentType"}, "AllocatedStorage"]},
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MasterUsername": {"Ref": "MasterUsername"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBMasterPassword}:SecretString:password}}"},
        "MultiAZ": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentType"}, "MultiAZ"]},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VPCSecurityGroups": [{"Ref": "DBSecurityGroup"}],
        "BackupRetentionPeriod": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentType"}, "BackupRetention"]},
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["postgresql", "upgrade"],
        "DeletionProtection": false,
        "DeleteAutomatedBackups": true,
        "PubliclyAccessible": false,
        "AutoMinorVersionUpgrade": false,
        "CopyTagsToSnapshot": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "migrated-rds-${EnvironmentType}-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "MigrationDate",
            "Value": {"Ref": "MigrationDate"}
          },
          {
            "Key": "Project",
            "Value": "DatabaseMigration"
          }
        ]
      }
    }
  },

  "Outputs": {
    "RDSEndpoint": {
      "Description": "RDS PostgreSQL instance endpoint address for application configuration",
      "Value": {"Fn::GetAtt": ["PostgreSQLInstance", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RDSEndpoint"}
      }
    },

    "RDSPort": {
      "Description": "RDS PostgreSQL instance port number",
      "Value": {"Fn::GetAtt": ["PostgreSQLInstance", "Endpoint.Port"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RDSPort"}
      }
    },

    "DBInstanceIdentifier": {
      "Description": "RDS database instance identifier",
      "Value": {"Ref": "PostgreSQLInstance"}
    },

    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing the master password",
      "Value": {"Ref": "DBMasterPassword"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBSecretArn"}
      }
    },

    "DBName": {
      "Description": "Database name",
      "Value": "migrated_app_db"
    },

    "SecurityGroupId": {
      "Description": "Security group ID for database access",
      "Value": {"Ref": "DBSecurityGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SecurityGroupId"}
      }
    }
  }
}
```

## Implementation Notes

This CloudFormation template implements all requirements:

1. **Environment-Based Configuration**: Uses Mappings to define instance class, Multi-AZ, and backup retention per environment
2. **RDS PostgreSQL 14.7**: Exact engine version specified
3. **Credentials**: Secrets Manager generates and stores secure password with automatic rotation disabled
4. **Networking**: DB subnet group created from provided subnet IDs across multiple AZs
5. **Security**:
   - Storage encryption enabled with AWS managed keys
   - Security group restricts access to internal VPC only
   - DeletionProtection set to false for destroyability
6. **Tagging**: All resources include Environment, MigrationDate, and Project tags
7. **Outputs**: Exports RDS endpoint, port, and related resource identifiers

The template follows CloudFormation best practices with parameter validation, proper resource dependencies, and comprehensive tagging for resource management.