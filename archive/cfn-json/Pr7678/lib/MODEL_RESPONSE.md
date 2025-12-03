# CloudFormation Template for RDS Aurora MySQL Migration

This implementation provides a complete CloudFormation JSON template for migrating an on-premises MySQL database to AWS RDS Aurora MySQL cluster with encryption, high availability, and proper security controls.

## File: lib/tapstack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "RDS Aurora MySQL cluster for database migration with KMS encryption, Multi-AZ deployment, and security controls",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to ensure uniqueness",
      "AllowedPattern": "^[a-zA-Z0-9-]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters and hyphens"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID where the Aurora cluster will be deployed"
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "First private subnet ID for Aurora deployment"
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Second private subnet ID for Aurora deployment"
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Third private subnet ID for Aurora deployment"
    },
    "ApplicationSubnetCidr1": {
      "Type": "String",
      "Description": "First application subnet CIDR block allowed to access database",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$",
      "ConstraintDescription": "Must be a valid CIDR range"
    },
    "ApplicationSubnetCidr2": {
      "Type": "String",
      "Description": "Second application subnet CIDR block allowed to access database",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$",
      "ConstraintDescription": "Must be a valid CIDR range"
    },
    "ApplicationSubnetCidr3": {
      "Type": "String",
      "Description": "Third application subnet CIDR block allowed to access database",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$",
      "ConstraintDescription": "Must be a valid CIDR range"
    },
    "MasterUsername": {
      "Type": "String",
      "Description": "Master username for the Aurora cluster",
      "Default": "admin",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "MasterPassword": {
      "Type": "String",
      "Description": "Master password for the Aurora cluster (minimum 8 characters)",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "ConstraintDescription": "Must be at least 8 characters"
    }
  },
  "Resources": {
    "DatabaseEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for Aurora MySQL cluster encryption - ${EnvironmentSuffix}"
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
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "StringEquals": {
                  "kms:ViaService": {
                    "Fn::Sub": "rds.${AWS::Region}.amazonaws.com"
                  }
                }
              }
            }
          ]
        },
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
    "DatabaseEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/aurora-mysql-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "DatabaseEncryptionKey"
        }
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "aurora-mysql-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora MySQL cluster allowing access from application subnets",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": {
              "Ref": "ApplicationSubnetCidr1"
            },
            "Description": "MySQL access from application subnet 1"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": {
              "Ref": "ApplicationSubnetCidr2"
            },
            "Description": "MySQL access from application subnet 2"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": {
              "Ref": "ApplicationSubnetCidr3"
            },
            "Description": "MySQL access from application subnet 3"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-mysql-sg-${EnvironmentSuffix}"
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
    "DatabaseSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora MySQL cluster spanning three availability zones",
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
    "DatabaseClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "Description": "Aurora MySQL 8.0 cluster parameter group with UTF8MB4 character set",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "character_set_server": "utf8mb4",
          "character_set_client": "utf8mb4",
          "character_set_connection": "utf8mb4",
          "character_set_database": "utf8mb4",
          "character_set_results": "utf8mb4",
          "collation_server": "utf8mb4_unicode_ci",
          "collation_connection": "utf8mb4_unicode_ci"
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
    "DatabaseInstanceParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "Description": "Aurora MySQL 8.0 instance parameter group",
        "Family": "aurora-mysql8.0",
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
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "DatabaseName": "financialdb",
        "MasterUsername": {
          "Ref": "MasterUsername"
        },
        "MasterUserPassword": {
          "Ref": "MasterPassword"
        },
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-mysql-cluster-${EnvironmentSuffix}"
        },
        "DBClusterParameterGroupName": {
          "Ref": "DatabaseClusterParameterGroup"
        },
        "DBSubnetGroupName": {
          "Ref": "DatabaseSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "DatabaseEncryptionKey"
        },
        "BackupRetentionPeriod": 30,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": [
          "audit",
          "error",
          "general",
          "slowquery"
        ],
        "DeletionProtection": true,
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
          }
        ]
      }
    },
    "AuroraWriterInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-writer-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "DBParameterGroupName": {
          "Ref": "DatabaseInstanceParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "DatabaseEncryptionKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-writer-${EnvironmentSuffix}"
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
            "Value": "Writer"
          }
        ]
      }
    },
    "AuroraReaderInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-reader1-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "DBParameterGroupName": {
          "Ref": "DatabaseInstanceParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "DatabaseEncryptionKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-reader1-${EnvironmentSuffix}"
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
            "Value": "Reader"
          }
        ]
      }
    },
    "AuroraReaderInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-reader2-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "DBParameterGroupName": {
          "Ref": "DatabaseInstanceParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "DatabaseEncryptionKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-reader2-${EnvironmentSuffix}"
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
            "Value": "Reader"
          }
        ]
      }
    }
  },
  "Outputs": {
    "ClusterEndpoint": {
      "Description": "Aurora MySQL cluster writer endpoint for write operations",
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
    "ReaderEndpoint": {
      "Description": "Aurora MySQL cluster reader endpoint for read operations",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ReaderEndpoint"
        }
      }
    },
    "ClusterPort": {
      "Description": "Aurora MySQL cluster port",
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
    "KmsKeyArn": {
      "Description": "ARN of the KMS key used for encryption",
      "Value": {
        "Fn::GetAtt": [
          "DatabaseEncryptionKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KmsKeyArn"
        }
      }
    },
    "ClusterIdentifier": {
      "Description": "Aurora MySQL cluster identifier",
      "Value": {
        "Ref": "AuroraCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterIdentifier"
        }
      }
    },
    "SecurityGroupId": {
      "Description": "Security group ID for the Aurora cluster",
      "Value": {
        "Ref": "DatabaseSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecurityGroupId"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# RDS Aurora MySQL Migration Infrastructure

CloudFormation template for deploying an RDS Aurora MySQL cluster for database migration from on-premises to AWS.

## Overview

This infrastructure creates a highly available, encrypted RDS Aurora MySQL 8.0 cluster with:
- One writer instance and two reader instances (db.r5.large)
- Customer-managed KMS encryption
- 30-day backup retention
- Performance Insights with 7-day retention
- Multi-AZ deployment across three availability zones
- Security group restricting access to application subnets only

## Architecture

- **Database Engine**: Aurora MySQL 8.0 (compatible mode)
- **Instances**: 3 instances (1 writer + 2 readers)
- **Instance Class**: db.r5.large
- **Encryption**: KMS customer-managed key with automatic rotation
- **Availability**: Multi-AZ across 3 availability zones
- **Backup**: 30-day retention, backup window 03:00-04:00 UTC
- **Performance**: Performance Insights enabled with 7-day retention

## Resources Created

1. **KMS Key** - Customer-managed encryption key with automatic rotation
2. **KMS Alias** - Friendly alias for the encryption key
3. **Security Group** - Allows MySQL (port 3306) from application subnets
4. **DB Subnet Group** - Spans three private subnets across availability zones
5. **DB Cluster Parameter Group** - Configures UTF8MB4 character set
6. **DB Instance Parameter Group** - Instance-level parameters
7. **Aurora DB Cluster** - Main cluster resource with configuration
8. **Writer Instance** - Primary write instance
9. **Reader Instance 1** - First read replica
10. **Reader Instance 2** - Second read replica

## Parameters

- `EnvironmentSuffix`: Unique suffix for resource naming (e.g., "prod", "dev-123")
- `VpcId`: VPC where the cluster will be deployed
- `PrivateSubnet1/2/3`: Three private subnet IDs for Multi-AZ deployment
- `ApplicationSubnetCidr1/2/3`: CIDR blocks allowed to access the database
- `MasterUsername`: Database master username (default: admin)
- `MasterPassword`: Database master password (minimum 8 characters)

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate permissions
2. VPC with three private subnets across different availability zones
3. Application subnet CIDR blocks identified

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name aurora-mysql-migration-prod \
  --template-body file://lib/tapstack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnet1,ParameterValue=subnet-xxxxx \
    ParameterKey=PrivateSubnet2,ParameterValue=subnet-yyyyy \
    ParameterKey=PrivateSubnet3,ParameterValue=subnet-zzzzz \
    ParameterKey=ApplicationSubnetCidr1,ParameterValue=10.0.10.0/24 \
    ParameterKey=ApplicationSubnetCidr2,ParameterValue=10.0.11.0/24 \
    ParameterKey=ApplicationSubnetCidr3,ParameterValue=10.0.12.0/24 \
    ParameterKey=MasterUsername,ParameterValue=admin \
    ParameterKey=MasterPassword,ParameterValue=YourSecurePassword123 \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name aurora-mysql-migration-prod \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name aurora-mysql-migration-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Outputs

- `ClusterEndpoint`: Writer endpoint for write operations
- `ReaderEndpoint`: Reader endpoint for load-balanced read operations
- `ClusterPort`: MySQL port (3306)
- `KmsKeyArn`: ARN of the encryption key
- `ClusterIdentifier`: Aurora cluster identifier
- `SecurityGroupId`: Security group ID for the cluster

## Security Features

1. **Encryption at Rest**: All data encrypted using customer-managed KMS key
2. **Encryption in Transit**: SSL/TLS connections supported
3. **Network Isolation**: Deployed in private subnets with no internet access
4. **Access Control**: Security group restricts access to application subnets only
5. **Deletion Protection**: Enabled to prevent accidental deletion
6. **Audit Logging**: CloudWatch Logs enabled for audit, error, general, and slow query logs

## Backup and Recovery

- **Automated Backups**: Enabled with 30-day retention
- **Backup Window**: 03:00-04:00 UTC (non-peak hours)
- **Point-in-Time Recovery**: Enabled automatically
- **Maintenance Window**: Sunday 04:00-05:00 UTC

## Performance Monitoring

- **Performance Insights**: Enabled on all instances
- **Retention Period**: 7 days
- **Encryption**: Performance Insights data encrypted with same KMS key
- **CloudWatch Logs**: Audit, error, general, and slow query logs exported

## Cost Optimization

- Instance class db.r5.large provides good balance of performance and cost
- Performance Insights free tier covers 7-day retention
- 30-day backup retention meets compliance requirements
- Consider Aurora Serverless for non-production environments

## Cleanup

To delete the stack and all resources:

```bash
# First, disable deletion protection
aws rds modify-db-cluster \
  --db-cluster-identifier aurora-mysql-cluster-prod \
  --no-deletion-protection \
  --region us-east-1

# Then delete the stack
aws cloudformation delete-stack \
  --stack-name aurora-mysql-migration-prod \
  --region us-east-1
```

## Troubleshooting

### Connection Issues

1. Verify security group allows traffic from your application subnets
2. Check that instances are in "available" state
3. Verify credentials are correct
4. Ensure application is in the same VPC

### Performance Issues

1. Check Performance Insights dashboard
2. Review slow query logs in CloudWatch
3. Consider adding more reader instances if read-heavy
4. Verify parameter group settings

### Backup Issues

1. Verify backup window doesn't conflict with peak usage
2. Check CloudWatch metrics for backup duration
3. Ensure KMS key permissions are correct

## References

- [Aurora MySQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraMySQL.html)
- [Aurora Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_PerfInsights.html)
```

## Requirements Checklist

All 10 requirements from the problem statement have been implemented:

1. Aurora DB cluster with MySQL 8.0 engine compatibility
2. One writer instance and two reader instances of db.r5.large class
3. KMS key for database encryption with proper key policy
4. DB subnet group using three private subnet IDs (parameters)
5. Backup retention 30 days with backup window 03:00-04:00 UTC
6. Performance Insights enabled with 7-day retention period
7. Security group allowing MySQL traffic (port 3306) from application subnet CIDRs
8. DB cluster parameter group with character set UTF8MB4
9. Deletion protection enabled
10. Outputs for cluster endpoint, reader endpoint, and KMS key ARN
