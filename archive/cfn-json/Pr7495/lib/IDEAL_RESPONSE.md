# CloudFormation Template for DMS Database Migration to Aurora PostgreSQL

This solution implements a complete database migration infrastructure using AWS Database Migration Service (DMS) to migrate an on-premises PostgreSQL database to Amazon Aurora PostgreSQL with zero downtime.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "DMS Database Migration Infrastructure - Migrate on-premises PostgreSQL to Aurora PostgreSQL with zero downtime",
  "Metadata": {
    "cfn-lint": {
      "config": {
        "ignore_checks": [
          "W1011"
        ]
      }
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC"
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
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.101.0/24",
      "Description": "CIDR block for public subnet 1"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.102.0/24",
      "Description": "CIDR block for public subnet 2"
    },
    "PublicSubnet3CIDR": {
      "Type": "String",
      "Default": "10.0.103.0/24",
      "Description": "CIDR block for public subnet 3"
    },
    "OnPremisesDatabaseEndpoint": {
      "Type": "String",
      "Description": "On-premises PostgreSQL database endpoint (hostname or IP)"
    },
    "OnPremisesDatabasePort": {
      "Type": "Number",
      "Default": 5432,
      "Description": "On-premises PostgreSQL database port"
    },
    "OnPremisesDatabaseName": {
      "Type": "String",
      "Description": "On-premises PostgreSQL database name"
    },
    "OnPremisesDatabaseUsername": {
      "Type": "String",
      "Description": "On-premises PostgreSQL database username"
    },
    "OnPremisesDatabasePassword": {
      "Type": "String",
      "NoEcho": true,
      "Description": "On-premises PostgreSQL database password"
    },
    "AuroraDBUsername": {
      "Type": "String",
      "Default": "dbadmin",
      "Description": "Aurora PostgreSQL master username"
    },
    "AuroraDBPassword": {
      "Type": "String",
      "NoEcho": true,
      "Description": "Aurora PostgreSQL master password"
    },
    "Route53HostedZoneName": {
      "Type": "String",
      "Description": "Route 53 hosted zone name (e.g., example.com)"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for DMS replication alerts"
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
              "Fn::Sub": "dms-migration-vpc-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-igw-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-public-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-public-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet3CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-public-subnet-3-${EnvironmentSuffix}"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-private-subnet-1-${EnvironmentSuffix}"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-private-subnet-2-${EnvironmentSuffix}"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-private-subnet-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-public-rt-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-private-rt-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for encrypting Aurora database and DMS resources - ${EnvironmentSuffix}"
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
            },
            {
              "Sid": "Allow DMS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "dms.amazonaws.com"
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
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/dms-migration-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "OnPremDBPasswordParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/dms/onprem-db-password-${EnvironmentSuffix}"
        },
        "Type": "String",
        "Value": {
          "Ref": "OnPremisesDatabasePassword"
        },
        "Description": "On-premises database password for DMS source endpoint"
      }
    },
    "AuroraDBPasswordParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/dms/aurora-db-password-${EnvironmentSuffix}"
        },
        "Type": "String",
        "Value": {
          "Ref": "AuroraDBPassword"
        },
        "Description": "Aurora database password for DMS target endpoint"
      }
    },
    "AuroraDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora PostgreSQL cluster",
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
          }
        ]
      }
    },
    "AuroraSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "aurora-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora PostgreSQL cluster",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {
              "Ref": "DMSSecurityGroup"
            },
            "Description": "Allow PostgreSQL from DMS"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": {
              "Ref": "VpcCIDR"
            },
            "Description": "Allow PostgreSQL from VPC"
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
    "AuroraDBClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "Description": "Aurora PostgreSQL cluster parameter group",
        "Family": "aurora-postgresql15",
        "Parameters": {
          "rds.force_ssl": "1"
        }
      }
    },
    "AuroraDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "Engine": "aurora-postgresql",
        "EngineVersion": "15.10",
        "DatabaseName": {
          "Ref": "OnPremisesDatabaseName"
        },
        "MasterUsername": {
          "Ref": "AuroraDBUsername"
        },
        "MasterUserPassword": {
          "Ref": "AuroraDBPassword"
        },
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"
        },
        "DBSubnetGroupName": {
          "Ref": "AuroraDBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "AuroraSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "DBClusterParameterGroupName": {
          "Ref": "AuroraDBClusterParameterGroup"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "postgresql"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraDBInstance3": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-reader-1-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-reader-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "dms-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for DMS replication instance",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow PostgreSQL outbound"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS outbound"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSVPCRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "dms-vpc-role",
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "dms.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-vpc-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSReplicationSubnetGroup": {
      "Type": "AWS::DMS::ReplicationSubnetGroup",
      "Properties": {
        "ReplicationSubnetGroupIdentifier": {
          "Fn::Sub": "dms-subnet-group-${EnvironmentSuffix}"
        },
        "ReplicationSubnetGroupDescription": "Subnet group for DMS replication instance",
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
              "Fn::Sub": "dms-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSReplicationInstance": {
      "Type": "AWS::DMS::ReplicationInstance",
      "Properties": {
        "ReplicationInstanceIdentifier": {
          "Fn::Sub": "dms-replication-instance-${EnvironmentSuffix}"
        },
        "ReplicationInstanceClass": "dms.t3.medium",
        "AllocatedStorage": 100,
        "VpcSecurityGroupIds": [
          {
            "Ref": "DMSSecurityGroup"
          }
        ],
        "ReplicationSubnetGroupIdentifier": {
          "Ref": "DMSReplicationSubnetGroup"
        },
        "PubliclyAccessible": false,
        "MultiAZ": false,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-replication-instance-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSSourceEndpoint": {
      "Type": "AWS::DMS::Endpoint",
      "Properties": {
        "EndpointIdentifier": {
          "Fn::Sub": "dms-source-endpoint-${EnvironmentSuffix}"
        },
        "EndpointType": "source",
        "EngineName": "postgres",
        "ServerName": {
          "Ref": "OnPremisesDatabaseEndpoint"
        },
        "Port": {
          "Ref": "OnPremisesDatabasePort"
        },
        "DatabaseName": {
          "Ref": "OnPremisesDatabaseName"
        },
        "Username": {
          "Ref": "OnPremisesDatabaseUsername"
        },
        "Password": {
          "Ref": "OnPremisesDatabasePassword"
        },
        "SslMode": "require",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-source-endpoint-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSTargetEndpoint": {
      "Type": "AWS::DMS::Endpoint",
      "Properties": {
        "EndpointIdentifier": {
          "Fn::Sub": "dms-target-endpoint-${EnvironmentSuffix}"
        },
        "EndpointType": "target",
        "EngineName": "aurora-postgresql",
        "ServerName": {
          "Fn::GetAtt": [
            "AuroraDBCluster",
            "Endpoint.Address"
          ]
        },
        "Port": {
          "Fn::GetAtt": [
            "AuroraDBCluster",
            "Endpoint.Port"
          ]
        },
        "DatabaseName": {
          "Ref": "OnPremisesDatabaseName"
        },
        "Username": {
          "Ref": "AuroraDBUsername"
        },
        "Password": {
          "Ref": "AuroraDBPassword"
        },
        "SslMode": "require",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-target-endpoint-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSReplicationTask": {
      "Type": "AWS::DMS::ReplicationTask",
      "Properties": {
        "ReplicationTaskIdentifier": {
          "Fn::Sub": "dms-migration-task-${EnvironmentSuffix}"
        },
        "SourceEndpointArn": {
          "Ref": "DMSSourceEndpoint"
        },
        "TargetEndpointArn": {
          "Ref": "DMSTargetEndpoint"
        },
        "ReplicationInstanceArn": {
          "Ref": "DMSReplicationInstance"
        },
        "MigrationType": "full-load-and-cdc",
        "TableMappings": "{\"rules\":[{\"rule-type\":\"selection\",\"rule-id\":\"1\",\"rule-name\":\"1\",\"object-locator\":{\"schema-name\":\"%\",\"table-name\":\"%\"},\"rule-action\":\"include\"}]}",
        "ReplicationTaskSettings": "{\"Logging\":{\"EnableLogging\":true,\"LogComponents\":[{\"Id\":\"TRANSFORMATION\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"SOURCE_UNLOAD\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"IO\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"TARGET_LOAD\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"PERFORMANCE\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"SOURCE_CAPTURE\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"SORTER\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"REST_SERVER\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"VALIDATOR_EXT\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"TARGET_APPLY\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"TASK_MANAGER\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"TABLES_MANAGER\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"METADATA_MANAGER\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"FILE_FACTORY\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"COMMON\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"ADDONS\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"DATA_STRUCTURE\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"COMMUNICATION\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"},{\"Id\":\"FILE_TRANSFER\",\"Severity\":\"LOGGER_SEVERITY_DEFAULT\"}]},\"ValidationSettings\":{\"EnableValidation\":true,\"ValidationMode\":\"ROW_LEVEL\",\"ThreadCount\":5},\"FullLoadSettings\":{\"TargetTablePrepMode\":\"DO_NOTHING\",\"MaxFullLoadSubTasks\":8},\"ChangeProcessingTuning\":{\"BatchApplyEnabled\":true,\"BatchApplyTimeoutMin\":1,\"BatchApplyTimeoutMax\":30}}",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-migration-task-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "Route53HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "Properties": {
        "Name": {
          "Ref": "Route53HostedZoneName"
        },
        "HostedZoneConfig": {
          "Comment": {
            "Fn::Sub": "Hosted zone for database migration blue-green deployment - ${EnvironmentSuffix}"
          }
        },
        "HostedZoneTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-hosted-zone-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "Route53OnPremRecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "Route53HostedZone"
        },
        "Name": {
          "Fn::Sub": "db.${Route53HostedZoneName}"
        },
        "Type": "CNAME",
        "TTL": "60",
        "SetIdentifier": "OnPremises",
        "Weight": 100,
        "ResourceRecords": [
          {
            "Ref": "OnPremisesDatabaseEndpoint"
          }
        ]
      }
    },
    "Route53AuroraRecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "Route53HostedZone"
        },
        "Name": {
          "Fn::Sub": "db.${Route53HostedZoneName}"
        },
        "Type": "CNAME",
        "TTL": "60",
        "SetIdentifier": "Aurora",
        "Weight": 0,
        "ResourceRecords": [
          {
            "Fn::GetAtt": [
              "AuroraDBCluster",
              "Endpoint.Address"
            ]
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "dms-replication-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "DMS Replication Alerts",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "AlertEmail"
            },
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dms-replication-alerts-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DMSReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "DependsOn": "DMSReplicationTask",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "dms-replication-lag-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when DMS replication lag exceeds 300 seconds",
        "MetricName": "CDCLatencySource",
        "Namespace": "AWS/DMS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 300,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ReplicationInstanceIdentifier",
            "Value": {
              "Fn::Sub": "dms-replication-instance-${EnvironmentSuffix}"
            }
          },
          {
            "Name": "ReplicationTaskIdentifier",
            "Value": {
              "Fn::Sub": "dms-migration-task-${EnvironmentSuffix}"
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
    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "dms-migration-dashboard-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/DMS\",\"CDCLatencySource\",{\"stat\":\"Average\"}],[\"AWS/DMS\",\"CDCLatencyTarget\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"DMS Replication Lag\",\"yAxis\":{\"left\":{\"label\":\"Seconds\"}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/DMS\",\"CDCIncomingChanges\",{\"stat\":\"Sum\"}],[\"AWS/DMS\",\"CDCChangesMemorySource\",{\"stat\":\"Sum\"}]],\"period\":300,\"stat\":\"Sum\",\"region\":\"${AWS::Region}\",\"title\":\"CDC Changes (Source)\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/DMS\",\"CDCChangesMemoryTarget\",{\"stat\":\"Sum\"}]],\"period\":300,\"stat\":\"Sum\",\"region\":\"${AWS::Region}\",\"title\":\"CDC Changes (Target)\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/DMS\",\"FullLoadThroughputRowsSource\",{\"stat\":\"Average\"}],[\"AWS/DMS\",\"FullLoadThroughputRowsTarget\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"Full Load Throughput\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/RDS\",\"CPUUtilization\",\"DBClusterIdentifier\",\"${ClusterIdentifier}\",{\"stat\":\"Average\"}],[\"AWS/RDS\",\"DatabaseConnections\",\"DBClusterIdentifier\",\"${ClusterIdentifier}\",{\"stat\":\"Sum\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"Aurora Cluster Metrics\"}}]}",
            {
              "ClusterIdentifier": {
                "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"
              }
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "DMSTaskARN": {
      "Description": "ARN of the DMS replication task",
      "Value": {
        "Ref": "DMSReplicationTask"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DMSTaskARN"
        }
      }
    },
    "AuroraClusterEndpoint": {
      "Description": "Aurora PostgreSQL cluster write endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuroraClusterEndpoint"
        }
      }
    },
    "AuroraReaderEndpoint": {
      "Description": "Aurora PostgreSQL cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuroraReaderEndpoint"
        }
      }
    },
    "Route53HostedZoneId": {
      "Description": "Route 53 Hosted Zone ID",
      "Value": {
        "Ref": "Route53HostedZone"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Route53HostedZoneId"
        }
      }
    },
    "DMSReplicationInstanceARN": {
      "Description": "ARN of the DMS replication instance",
      "Value": {
        "Ref": "DMSReplicationInstance"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DMSReplicationInstanceARN"
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
    "SNSTopicARN": {
      "Description": "SNS Topic ARN for DMS alerts",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicARN"
        }
      }
    },
    "CloudWatchDashboardURL": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=dms-migration-dashboard-${EnvironmentSuffix}"
      }
    },
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    }
  }
}
```

## Architecture Overview

This CloudFormation template implements a comprehensive database migration solution with the following components:

### Network Infrastructure
- VPC with public and private subnets across 3 availability zones
- Internet Gateway for public subnet connectivity
- Route tables for public and private subnet routing
- Security groups for Aurora and DMS instances

### Database Infrastructure
- Aurora PostgreSQL cluster with Multi-AZ deployment
- 3 Aurora instances (1 writer + 2 readers) for high availability
- Customer-managed KMS encryption for data at rest
- SSL/TLS encryption enforced for connections
- Automated backups with 7-day retention
- CloudWatch Logs enabled for PostgreSQL logs

### DMS Configuration
- DMS replication instance (t3.medium) in private subnet
- DMS VPC role for managing VPC resources
- Source endpoint for on-premises PostgreSQL with SSL
- Target endpoint for Aurora PostgreSQL with SSL
- Replication task configured for full-load + CDC
- Data validation enabled during replication

### Blue-Green Deployment
- Route 53 hosted zone for DNS management
- Weighted routing policies (100% on-premises, 0% Aurora initially)
- TTL of 60 seconds for fast cutover

### Monitoring and Alerting
- CloudWatch dashboard with DMS and Aurora metrics
- CloudWatch alarm for replication lag > 300 seconds
- SNS topic for email notifications
- Metrics tracked: CDC latency, throughput, CPU, connections

### Security
- All passwords stored in Parameter Store
- Customer-managed KMS keys for encryption
- Security groups with least privilege access
- SSL/TLS required for all database connections
- Private subnets for database and DMS instances
