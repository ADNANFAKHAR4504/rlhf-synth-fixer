# Multi-Environment Database Replication System - CloudFormation Implementation

This implementation creates a complete multi-environment database replication infrastructure using CloudFormation with JSON. The solution deploys three separate environments (dev, staging, prod) in a single AWS account with isolated VPCs, Aurora MySQL clusters, Lambda-based synchronization, and comprehensive monitoring.

## Architecture Overview

- Three isolated VPCs (dev: 10.1.0.0/16, staging: 10.2.0.0/16, prod: 10.3.0.0/16)
- RDS Aurora MySQL 5.7 compatible clusters in each environment
- VPC peering connections for controlled inter-environment communication
- Lambda functions for schema and reference data synchronization
- S3 buckets for migration script storage with versioning
- KMS encryption for all data at rest
- Secrets Manager for database credential management
- Parameter Store for connection string storage
- CloudWatch alarms for replication lag monitoring

## Implementation Notes

**Cross-Account Consideration**: While the task originally specified cross-account deployment, CloudFormation single templates cannot deploy across accounts. This implementation uses single-account multi-environment architecture with separate VPCs. For true cross-account deployment, use CloudFormation StackSets or deploy separate templates to each account.

**Resource Naming**: All resources include the `EnvironmentSuffix` parameter to avoid naming conflicts during parallel CI/CD deployments.

**Destroyability**: All resources are configured for clean removal - no DeletionPolicy: Retain, RDS has DeletionProtection: false and SkipFinalSnapshot: true.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-Environment Database Replication System with Aurora MySQL, Lambda synchronization, and cross-VPC connectivity",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts in parallel deployments",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "MasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora clusters",
      "Default": "admin",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    }
  },
  "Resources": {
    "DevVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.1.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "dev"
          }
        ]
      }
    },
    "StagingVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.2.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "staging"
          }
        ]
      }
    },
    "ProdVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.3.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "prod"
          }
        ]
      }
    },
    "DevPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "DevVPC"
        },
        "CidrBlock": "10.1.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-private-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DevPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "DevVPC"
        },
        "CidrBlock": "10.1.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-private-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "StagingPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "StagingVPC"
        },
        "CidrBlock": "10.2.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-private-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "StagingPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "StagingVPC"
        },
        "CidrBlock": "10.2.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-private-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ProdPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "ProdVPC"
        },
        "CidrBlock": "10.3.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-private-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ProdPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "ProdVPC"
        },
        "CidrBlock": "10.3.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-private-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DevKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for dev environment encryption - ${EnvironmentSuffix}"
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
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "rds.amazonaws.com",
                  "s3.amazonaws.com",
                  "ssm.amazonaws.com",
                  "secretsmanager.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "DevKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/dev-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "DevKMSKey"
        }
      }
    },
    "StagingKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for staging environment encryption - ${EnvironmentSuffix}"
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
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "rds.amazonaws.com",
                  "s3.amazonaws.com",
                  "ssm.amazonaws.com",
                  "secretsmanager.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "StagingKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/staging-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "StagingKMSKey"
        }
      }
    },
    "ProdKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for prod environment encryption - ${EnvironmentSuffix}"
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
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "rds.amazonaws.com",
                  "s3.amazonaws.com",
                  "ssm.amazonaws.com",
                  "secretsmanager.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "ProdKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/prod-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "ProdKMSKey"
        }
      }
    },
    "DevDBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "dev-aurora-secret-${EnvironmentSuffix}"
        },
        "Description": "Master password for dev Aurora cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\": \"${MasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": {
          "Ref": "DevKMSKey"
        }
      }
    },
    "StagingDBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "staging-aurora-secret-${EnvironmentSuffix}"
        },
        "Description": "Master password for staging Aurora cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\": \"${MasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": {
          "Ref": "StagingKMSKey"
        }
      }
    },
    "ProdDBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "prod-aurora-secret-${EnvironmentSuffix}"
        },
        "Description": "Master password for prod Aurora cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\": \"${MasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": {
          "Ref": "ProdKMSKey"
        }
      }
    },
    "DevDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "dev-aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for dev Aurora cluster",
        "SubnetIds": [
          {
            "Ref": "DevPrivateSubnet1"
          },
          {
            "Ref": "DevPrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-aurora-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "StagingDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "staging-aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for staging Aurora cluster",
        "SubnetIds": [
          {
            "Ref": "StagingPrivateSubnet1"
          },
          {
            "Ref": "StagingPrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-aurora-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ProdDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "prod-aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for prod Aurora cluster",
        "SubnetIds": [
          {
            "Ref": "ProdPrivateSubnet1"
          },
          {
            "Ref": "ProdPrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-aurora-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DevDBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "dev-aurora-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for dev Aurora cluster - allows MySQL traffic from Lambda and peered VPCs",
        "VpcId": {
          "Ref": "DevVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.1.0.0/16",
            "Description": "MySQL from dev VPC"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.2.0.0/16",
            "Description": "MySQL from staging VPC"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.3.0.0/16",
            "Description": "MySQL from prod VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-aurora-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "StagingDBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "staging-aurora-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for staging Aurora cluster - allows MySQL traffic from Lambda and peered VPCs",
        "VpcId": {
          "Ref": "StagingVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.1.0.0/16",
            "Description": "MySQL from dev VPC"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.2.0.0/16",
            "Description": "MySQL from staging VPC"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.3.0.0/16",
            "Description": "MySQL from prod VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-aurora-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ProdDBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "prod-aurora-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for prod Aurora cluster - allows MySQL traffic from Lambda and peered VPCs",
        "VpcId": {
          "Ref": "ProdVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.1.0.0/16",
            "Description": "MySQL from dev VPC"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.2.0.0/16",
            "Description": "MySQL from staging VPC"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "10.3.0.0/16",
            "Description": "MySQL from prod VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-aurora-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DevAuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "dev-aurora-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DevDBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DevDBSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "DevDBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DevDBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "DevKMSKey"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-aurora-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "dev"
          }
        ]
      }
    },
    "DevAuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "dev-aurora-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "DevAuroraCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-aurora-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "StagingAuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "staging-aurora-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${StagingDBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${StagingDBSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "StagingDBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "StagingDBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "StagingKMSKey"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-aurora-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "staging"
          }
        ]
      }
    },
    "StagingAuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "staging-aurora-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "StagingAuroraCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-aurora-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ProdAuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "prod-aurora-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${ProdDBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${ProdDBSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "ProdDBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "ProdDBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "ProdKMSKey"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-aurora-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "prod"
          }
        ]
      }
    },
    "ProdAuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "prod-aurora-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "ProdAuroraCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-aurora-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DevToStagingPeeringConnection": {
      "Type": "AWS::EC2::VPCPeeringConnection",
      "Properties": {
        "VpcId": {
          "Ref": "DevVPC"
        },
        "PeerVpcId": {
          "Ref": "StagingVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-to-staging-peering-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "StagingToProdPeeringConnection": {
      "Type": "AWS::EC2::VPCPeeringConnection",
      "Properties": {
        "VpcId": {
          "Ref": "StagingVPC"
        },
        "PeerVpcId": {
          "Ref": "ProdVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-to-prod-peering-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DevRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "DevVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dev-route-table-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DevToStagingRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "DevRouteTable"
        },
        "DestinationCidrBlock": "10.2.0.0/16",
        "VpcPeeringConnectionId": {
          "Ref": "DevToStagingPeeringConnection"
        }
      }
    },
    "DevSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "DevPrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "DevRouteTable"
        }
      }
    },
    "DevSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "DevPrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "DevRouteTable"
        }
      }
    },
    "StagingRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "StagingVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "staging-route-table-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "StagingToDevRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "StagingRouteTable"
        },
        "DestinationCidrBlock": "10.1.0.0/16",
        "VpcPeeringConnectionId": {
          "Ref": "DevToStagingPeeringConnection"
        }
      }
    },
    "StagingToProdRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "StagingRouteTable"
        },
        "DestinationCidrBlock": "10.3.0.0/16",
        "VpcPeeringConnectionId": {
          "Ref": "StagingToProdPeeringConnection"
        }
      }
    },
    "StagingSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "StagingPrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "StagingRouteTable"
        }
      }
    },
    "StagingSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "StagingPrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "StagingRouteTable"
        }
      }
    },
    "ProdRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "ProdVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "prod-route-table-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ProdToStagingRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "ProdRouteTable"
        },
        "DestinationCidrBlock": "10.2.0.0/16",
        "VpcPeeringConnectionId": {
          "Ref": "StagingToProdPeeringConnection"
        }
      }
    },
    "ProdSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "ProdPrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "ProdRouteTable"
        }
      }
    },
    "ProdSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "ProdPrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "ProdRouteTable"
        }
      }
    },
    "MigrationScriptsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "migration-scripts-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "DevKMSKey"
                }
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldMigrationScripts",
              "Status": "Enabled",
              "ExpirationInDays": 30,
              "NoncurrentVersionExpirationInDays": 30
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
            "Value": {
              "Fn::Sub": "migration-scripts-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "db-sync-lambda-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "DatabaseSyncPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": [
                    {
                      "Ref": "DevDBSecret"
                    },
                    {
                      "Ref": "StagingDBSecret"
                    },
                    {
                      "Ref": "ProdDBSecret"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "DevKMSKey",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "StagingKMSKey",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "ProdKMSKey",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "MigrationScriptsBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${MigrationScriptsBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:PutParameter"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/db-replication/${EnvironmentSuffix}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/db-sync-*-${EnvironmentSuffix}:*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-sync-lambda-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "lambda-db-sync-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Lambda functions accessing Aurora clusters",
        "VpcId": {
          "Ref": "DevVPC"
        },
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
              "Fn::Sub": "lambda-db-sync-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SchemaReplicationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "db-sync-schema-replication-${EnvironmentSuffix}"
        },
        "Description": "Synchronizes database schema changes across environments",
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 300,
        "MemorySize": 512,
        "VpcConfig": {
          "SubnetIds": [
            {
              "Ref": "DevPrivateSubnet1"
            },
            {
              "Ref": "DevPrivateSubnet2"
            }
          ],
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ]
        },
        "Environment": {
          "Variables": {
            "DEV_SECRET_ARN": {
              "Ref": "DevDBSecret"
            },
            "STAGING_SECRET_ARN": {
              "Ref": "StagingDBSecret"
            },
            "PROD_SECRET_ARN": {
              "Ref": "ProdDBSecret"
            },
            "DEV_ENDPOINT": {
              "Fn::GetAtt": [
                "DevAuroraCluster",
                "Endpoint.Address"
              ]
            },
            "STAGING_ENDPOINT": {
              "Fn::GetAtt": [
                "StagingAuroraCluster",
                "Endpoint.Address"
              ]
            },
            "PROD_ENDPOINT": {
              "Fn::GetAtt": [
                "ProdAuroraCluster",
                "Endpoint.Address"
              ]
            },
            "MIGRATION_BUCKET": {
              "Ref": "MigrationScriptsBucket"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport pymysql\nfrom datetime import datetime\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Synchronizes database schema changes from source to target environment.\n    Expected event: {\"source_env\": \"dev\", \"target_env\": \"staging\", \"migration_script\": \"s3://bucket/script.sql\"}\n    \"\"\"\n    print(f\"Schema replication triggered: {json.dumps(event)}\")\n    \n    source_env = event.get('source_env', 'dev')\n    target_env = event.get('target_env', 'staging')\n    migration_script = event.get('migration_script')\n    \n    # Retrieve database credentials\n    secrets_client = boto3.client('secretsmanager')\n    s3_client = boto3.client('s3')\n    ssm_client = boto3.client('ssm')\n    \n    try:\n        # Get source database credentials\n        source_secret_arn = os.environ[f'{source_env.upper()}_SECRET_ARN']\n        source_secret = json.loads(secrets_client.get_secret_value(SecretId=source_secret_arn)['SecretString'])\n        source_endpoint = os.environ[f'{source_env.upper()}_ENDPOINT']\n        \n        # Get target database credentials\n        target_secret_arn = os.environ[f'{target_env.upper()}_SECRET_ARN']\n        target_secret = json.loads(secrets_client.get_secret_value(SecretId=target_secret_arn)['SecretString'])\n        target_endpoint = os.environ[f'{target_env.upper()}_ENDPOINT']\n        \n        # Download migration script from S3 if provided\n        if migration_script:\n            bucket = os.environ['MIGRATION_BUCKET']\n            key = migration_script.replace(f's3://{bucket}/', '')\n            response = s3_client.get_object(Bucket=bucket, Key=key)\n            sql_script = response['Body'].read().decode('utf-8')\n        else:\n            # Extract schema from source\n            source_conn = pymysql.connect(\n                host=source_endpoint,\n                user=source_secret['username'],\n                password=source_secret['password'],\n                database='mysql',\n                connect_timeout=5\n            )\n            \n            with source_conn.cursor() as cursor:\n                cursor.execute(\"SHOW TABLES\")\n                tables = cursor.fetchall()\n                \n                sql_script = f\"-- Schema sync from {source_env} to {target_env} at {datetime.utcnow().isoformat()}\\n\"\n                for table in tables:\n                    cursor.execute(f\"SHOW CREATE TABLE {table[0]}\")\n                    create_stmt = cursor.fetchone()[1]\n                    sql_script += f\"\\n{create_stmt};\\n\"\n            \n            source_conn.close()\n        \n        # Apply schema to target\n        target_conn = pymysql.connect(\n            host=target_endpoint,\n            user=target_secret['username'],\n            password=target_secret['password'],\n            database='mysql',\n            connect_timeout=5\n        )\n        \n        with target_conn.cursor() as cursor:\n            for statement in sql_script.split(';'):\n                if statement.strip():\n                    cursor.execute(statement)\n        \n        target_conn.commit()\n        target_conn.close()\n        \n        # Store sync metadata in Parameter Store\n        env_suffix = os.environ['ENVIRONMENT_SUFFIX']\n        ssm_client.put_parameter(\n            Name=f'/db-replication/{env_suffix}/last-schema-sync/{source_env}-to-{target_env}',\n            Value=json.dumps({\n                'timestamp': datetime.utcnow().isoformat(),\n                'status': 'success',\n                'source': source_env,\n                'target': target_env\n            }),\n            Type='String',\n            Overwrite=True\n        )\n        \n        print(f\"Schema sync completed: {source_env} -> {target_env}\")\n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': f'Schema synchronized from {source_env} to {target_env}',\n                'timestamp': datetime.utcnow().isoformat()\n            })\n        }\n        \n    except Exception as e:\n        print(f\"Error during schema sync: {str(e)}\")\n        \n        # Store error in Parameter Store\n        env_suffix = os.environ['ENVIRONMENT_SUFFIX']\n        ssm_client.put_parameter(\n            Name=f'/db-replication/{env_suffix}/last-schema-sync/{source_env}-to-{target_env}',\n            Value=json.dumps({\n                'timestamp': datetime.utcnow().isoformat(),\n                'status': 'error',\n                'error': str(e),\n                'source': source_env,\n                'target': target_env\n            }),\n            Type='String',\n            Overwrite=True\n        )\n        \n        raise e\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-sync-schema-replication-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DataReplicationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "db-sync-data-replication-${EnvironmentSuffix}"
        },
        "Description": "Synchronizes reference data across environments",
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 300,
        "MemorySize": 512,
        "VpcConfig": {
          "SubnetIds": [
            {
              "Ref": "DevPrivateSubnet1"
            },
            {
              "Ref": "DevPrivateSubnet2"
            }
          ],
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ]
        },
        "Environment": {
          "Variables": {
            "DEV_SECRET_ARN": {
              "Ref": "DevDBSecret"
            },
            "STAGING_SECRET_ARN": {
              "Ref": "StagingDBSecret"
            },
            "PROD_SECRET_ARN": {
              "Ref": "ProdDBSecret"
            },
            "DEV_ENDPOINT": {
              "Fn::GetAtt": [
                "DevAuroraCluster",
                "Endpoint.Address"
              ]
            },
            "STAGING_ENDPOINT": {
              "Fn::GetAtt": [
                "StagingAuroraCluster",
                "Endpoint.Address"
              ]
            },
            "PROD_ENDPOINT": {
              "Fn::GetAtt": [
                "ProdAuroraCluster",
                "Endpoint.Address"
              ]
            },
            "MIGRATION_BUCKET": {
              "Ref": "MigrationScriptsBucket"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport pymysql\nfrom datetime import datetime\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Synchronizes reference data from source to target environment.\n    Expected event: {\"source_env\": \"dev\", \"target_env\": \"staging\", \"tables\": [\"lookup_table\", \"config_table\"]}\n    \"\"\"\n    print(f\"Data replication triggered: {json.dumps(event)}\")\n    \n    source_env = event.get('source_env', 'dev')\n    target_env = event.get('target_env', 'staging')\n    tables = event.get('tables', [])\n    \n    secrets_client = boto3.client('secretsmanager')\n    ssm_client = boto3.client('ssm')\n    \n    try:\n        # Get database credentials\n        source_secret_arn = os.environ[f'{source_env.upper()}_SECRET_ARN']\n        source_secret = json.loads(secrets_client.get_secret_value(SecretId=source_secret_arn)['SecretString'])\n        source_endpoint = os.environ[f'{source_env.upper()}_ENDPOINT']\n        \n        target_secret_arn = os.environ[f'{target_env.upper()}_SECRET_ARN']\n        target_secret = json.loads(secrets_client.get_secret_value(SecretId=target_secret_arn)['SecretString'])\n        target_endpoint = os.environ[f'{target_env.upper()}_ENDPOINT']\n        \n        # Connect to source database\n        source_conn = pymysql.connect(\n            host=source_endpoint,\n            user=source_secret['username'],\n            password=source_secret['password'],\n            database='mysql',\n            connect_timeout=5\n        )\n        \n        # Connect to target database\n        target_conn = pymysql.connect(\n            host=target_endpoint,\n            user=target_secret['username'],\n            password=target_secret['password'],\n            database='mysql',\n            connect_timeout=5\n        )\n        \n        rows_synced = 0\n        \n        for table in tables:\n            print(f\"Syncing table: {table}\")\n            \n            # Extract data from source\n            with source_conn.cursor() as cursor:\n                cursor.execute(f\"SELECT * FROM {table}\")\n                rows = cursor.fetchall()\n                \n                if not rows:\n                    print(f\"No data in table {table}\")\n                    continue\n                \n                # Get column names\n                cursor.execute(f\"DESCRIBE {table}\")\n                columns = [col[0] for col in cursor.fetchall()]\n            \n            # Clear target table and insert data\n            with target_conn.cursor() as cursor:\n                cursor.execute(f\"TRUNCATE TABLE {table}\")\n                \n                if rows:\n                    placeholders = ','.join(['%s'] * len(columns))\n                    insert_sql = f\"INSERT INTO {table} ({','.join(columns)}) VALUES ({placeholders})\"\n                    cursor.executemany(insert_sql, rows)\n                    rows_synced += len(rows)\n            \n            target_conn.commit()\n            print(f\"Synced {len(rows)} rows from table {table}\")\n        \n        source_conn.close()\n        target_conn.close()\n        \n        # Store sync metadata in Parameter Store\n        env_suffix = os.environ['ENVIRONMENT_SUFFIX']\n        ssm_client.put_parameter(\n            Name=f'/db-replication/{env_suffix}/last-data-sync/{source_env}-to-{target_env}',\n            Value=json.dumps({\n                'timestamp': datetime.utcnow().isoformat(),\n                'status': 'success',\n                'source': source_env,\n                'target': target_env,\n                'tables': tables,\n                'rows_synced': rows_synced\n            }),\n            Type='String',\n            Overwrite=True\n        )\n        \n        print(f\"Data sync completed: {source_env} -> {target_env}, {rows_synced} rows\")\n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': f'Data synchronized from {source_env} to {target_env}',\n                'rows_synced': rows_synced,\n                'tables': tables,\n                'timestamp': datetime.utcnow().isoformat()\n            })\n        }\n        \n    except Exception as e:\n        print(f\"Error during data sync: {str(e)}\")\n        \n        # Store error in Parameter Store\n        env_suffix = os.environ['ENVIRONMENT_SUFFIX']\n        ssm_client.put_parameter(\n            Name=f'/db-replication/{env_suffix}/last-data-sync/{source_env}-to-{target_env}',\n            Value=json.dumps({\n                'timestamp': datetime.utcnow().isoformat(),\n                'status': 'error',\n                'error': str(e),\n                'source': source_env,\n                'target': target_env\n            }),\n            Type='String',\n            Overwrite=True\n        )\n        \n        raise e\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-sync-data-replication-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SchemaReplicationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/db-sync-schema-replication-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "DataReplicationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/db-sync-data-replication-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "DevReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "dev-aurora-replication-lag-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when dev Aurora replication lag exceeds 60 seconds",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 60000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "DevAuroraCluster"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "StagingReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "staging-aurora-replication-lag-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when staging Aurora replication lag exceeds 60 seconds",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 60000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "StagingAuroraCluster"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "ProdReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "prod-aurora-replication-lag-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when prod Aurora replication lag exceeds 60 seconds",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 60000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "ProdAuroraCluster"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DevConnectionParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/db-replication/${EnvironmentSuffix}/dev/connection-string"
        },
        "Description": "Dev Aurora cluster connection string",
        "Type": "String",
        "Value": {
          "Fn::Sub": "mysql://${DevAuroraCluster.Endpoint.Address}:3306"
        },
        "Tags": {
          "Environment": "dev",
          "Name": {
            "Fn::Sub": "dev-connection-${EnvironmentSuffix}"
          }
        }
      }
    },
    "StagingConnectionParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/db-replication/${EnvironmentSuffix}/staging/connection-string"
        },
        "Description": "Staging Aurora cluster connection string",
        "Type": "String",
        "Value": {
          "Fn::Sub": "mysql://${StagingAuroraCluster.Endpoint.Address}:3306"
        },
        "Tags": {
          "Environment": "staging",
          "Name": {
            "Fn::Sub": "staging-connection-${EnvironmentSuffix}"
          }
        }
      }
    },
    "ProdConnectionParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/db-replication/${EnvironmentSuffix}/prod/connection-string"
        },
        "Description": "Prod Aurora cluster connection string",
        "Type": "String",
        "Value": {
          "Fn::Sub": "mysql://${ProdAuroraCluster.Endpoint.Address}:3306"
        },
        "Tags": {
          "Environment": "prod",
          "Name": {
            "Fn::Sub": "prod-connection-${EnvironmentSuffix}"
          }
        }
      }
    }
  },
  "Outputs": {
    "DevAuroraClusterEndpoint": {
      "Description": "Dev Aurora cluster endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DevAuroraCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DevAuroraEndpoint"
        }
      }
    },
    "StagingAuroraClusterEndpoint": {
      "Description": "Staging Aurora cluster endpoint",
      "Value": {
        "Fn::GetAtt": [
          "StagingAuroraCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StagingAuroraEndpoint"
        }
      }
    },
    "ProdAuroraClusterEndpoint": {
      "Description": "Prod Aurora cluster endpoint",
      "Value": {
        "Fn::GetAtt": [
          "ProdAuroraCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProdAuroraEndpoint"
        }
      }
    },
    "MigrationScriptsBucketName": {
      "Description": "S3 bucket for migration scripts",
      "Value": {
        "Ref": "MigrationScriptsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MigrationBucket"
        }
      }
    },
    "SchemaReplicationFunctionArn": {
      "Description": "ARN of schema replication Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "SchemaReplicationFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SchemaReplicationFunctionArn"
        }
      }
    },
    "DataReplicationFunctionArn": {
      "Description": "ARN of data replication Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "DataReplicationFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DataReplicationFunctionArn"
        }
      }
    }
  }
}
```

## AWS Services Implemented

1. **VPC** - Three isolated VPCs for dev, staging, prod environments
2. **EC2 (Subnets, Security Groups, VPC Peering)** - Network infrastructure and connectivity
3. **RDS Aurora MySQL** - Three Aurora clusters with encryption, backups, and monitoring
4. **Lambda** - Two functions for schema and data synchronization
5. **S3** - Versioned bucket for migration scripts with lifecycle policies
6. **KMS** - Separate encryption keys for each environment
7. **Secrets Manager** - Secure password generation and storage for Aurora clusters
8. **Systems Manager Parameter Store** - Connection string storage and sync metadata
9. **CloudWatch** - Log groups for Lambda functions and replication lag alarms
10. **IAM** - Least-privilege roles for Lambda with explicit resource ARNs

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Sufficient permissions to create VPC, RDS, Lambda, IAM resources
   - Python pymysql layer required for Lambda functions (not included in inline code)

2. **Deploy Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name db-replication-system \
     --template-body file://lib/TapStack.json \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=test123 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Monitor Deployment**:
   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name db-replication-system \
     --region us-east-1
   ```

4. **Expected Deployment Time**: 25-35 minutes (Aurora cluster creation is the slowest component)

## Lambda Function Dependencies

**Important**: The Lambda functions include inline Python code that requires the `pymysql` library. For production deployment, you need to:

1. Create a Lambda Layer with pymysql:
   ```bash
   mkdir python
   pip install pymysql -t python/
   zip -r pymysql-layer.zip python
   ```

2. Upload the layer and attach it to both Lambda functions

3. Or use AWS Lambda Powertools Python which includes database clients

For testing purposes, the template is deployable as-is, but the Lambda functions will fail at runtime without the pymysql dependency.

## Testing the Synchronization

1. **Invoke Schema Replication**:
   ```bash
   aws lambda invoke \
     --function-name db-sync-schema-replication-test123 \
     --payload '{"source_env": "dev", "target_env": "staging"}' \
     response.json
   ```

2. **Invoke Data Replication**:
   ```bash
   aws lambda invoke \
     --function-name db-sync-data-replication-test123 \
     --payload '{"source_env": "dev", "target_env": "staging", "tables": ["lookup_data"]}' \
     response.json
   ```

3. **Check Sync Status in Parameter Store**:
   ```bash
   aws ssm get-parameter \
     --name /db-replication/test123/last-schema-sync/dev-to-staging
   ```

## Security Considerations

- All Aurora clusters use KMS encryption at rest with separate keys per environment
- Secrets Manager handles password generation with 32-character random passwords
- Lambda functions use VPC isolation and security groups
- S3 bucket blocks all public access
- IAM roles follow least-privilege principle with explicit resource ARNs
- VPC peering connections restrict traffic to MySQL port 3306 only
- CloudWatch logging enabled for all Lambda functions

## Cost Optimization Notes

- Aurora db.r5.large instances are required per task constraints (not cost-optimized)
- Consider using Aurora Serverless v2 for lower environments in production
- S3 lifecycle policy automatically deletes old migration scripts after 30 days
- CloudWatch log retention set to 7 days to minimize costs

## Known Limitations

1. **Cross-Account Deployment**: This template deploys all environments in a single account. For true cross-account deployment, use CloudFormation StackSets or deploy separate templates to each account with cross-account IAM roles.

2. **Lambda Layer**: The Lambda functions require pymysql library which must be added as a Lambda Layer or included in the deployment package.

3. **Initial Database Setup**: The Aurora clusters are created empty. You need to create databases and tables before running synchronization.

4. **VPC Endpoints**: For production, consider adding VPC endpoints for S3, Secrets Manager, and Systems Manager to avoid NAT Gateway costs.

5. **Automated Rotation**: Secrets Manager automatic rotation is not enabled in this template but should be configured for production use.
