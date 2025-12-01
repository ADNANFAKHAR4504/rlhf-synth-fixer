# Payment Processing Infrastructure - CloudFormation JSON Implementation

This implementation creates a complete PCI DSS compliant payment processing infrastructure using CloudFormation JSON format.

## Architecture Overview

The solution implements a three-tier architecture:
- **Network Layer**: VPC with public, private, and database subnets across 3 AZs
- **Application Layer**: Auto Scaling Group with EC2 instances behind an Application Load Balancer
- **Data Layer**: RDS Aurora MySQL cluster with encryption and backups

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Payment Processing System Migration - PCI DSS Compliant Infrastructure",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable parallel deployments",
      "MinLength": 4,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Latest Amazon Linux 2 AMI ID"
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
            "Value": {
              "Fn::Sub": "payment-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinancialServices"
          },
          {
            "Key": "MigrationPhase",
            "Value": "Phase1"
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
              "Fn::Sub": "payment-igw-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.1.0/24",
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
              "Fn::Sub": "payment-public-subnet-1-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.2.0/24",
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
              "Fn::Sub": "payment-public-subnet-2-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.3.0/24",
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
              "Fn::Sub": "payment-public-subnet-3-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.11.0/24",
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
              "Fn::Sub": "payment-private-subnet-1-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.12.0/24",
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
              "Fn::Sub": "payment-private-subnet-2-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.13.0/24",
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
              "Fn::Sub": "payment-private-subnet-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DatabaseSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.21.0/24",
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
              "Fn::Sub": "payment-database-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DatabaseSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.22.0/24",
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
              "Fn::Sub": "payment-database-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DatabaseSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.23.0/24",
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
              "Fn::Sub": "payment-database-subnet-3-${EnvironmentSuffix}"
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
              "Fn::Sub": "payment-public-rt-${EnvironmentSuffix}"
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
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway3EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway1EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway2EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway3EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway1"
        }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway2"
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
          "Ref": "PrivateRouteTable2"
        }
      }
    },
    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway3"
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
          "Ref": "PrivateRouteTable3"
        }
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "vpc-flow-logs.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "VPCFlowLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "FlowLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "payment-flow-logs-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldFlowLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
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
              "Fn::Sub": "payment-flow-logs-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {
          "Ref": "VPC"
        },
        "TrafficType": "ALL",
        "LogDestinationType": "s3",
        "LogDestination": {
          "Fn::GetAtt": [
            "FlowLogsBucket",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-flow-log-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "payment-alb-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from internet"
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
            "Value": {
              "Fn::Sub": "payment-alb-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "payment-ec2-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow HTTP from ALB"
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
            "Value": {
              "Fn::Sub": "payment-ec2-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "payment-rds-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for RDS Aurora cluster",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow MySQL from EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-rds-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Description": "KMS key for RDS Aurora encryption",
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
        },
        "PendingWindowInDays": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/payment-rds-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "payment-db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for RDS Aurora cluster",
        "SubnetIds": [
          {
            "Ref": "DatabaseSubnet1"
          },
          {
            "Ref": "DatabaseSubnet2"
          },
          {
            "Ref": "DatabaseSubnet3"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "payment-aurora-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "MasterUsername": "admin",
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:ssm-secure:/payment/${EnvironmentSuffix}/db/password}}"
        },
        "DatabaseName": "paymentdb",
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "RDSSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinancialServices"
          }
        ]
      }
    },
    "AuroraInstanceWriter": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "payment-aurora-writer-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-writer-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraInstanceReader": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "payment-aurora-reader-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-reader-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBConnectionsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-db-connections-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when database connections exceed 100",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraCluster"
            }
          }
        ]
      }
    },
    "ArtifactsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "payment-artifacts-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
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
              "Fn::Sub": "payment-artifacts-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "payment-ec2-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "ParameterStoreAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/payment/${EnvironmentSuffix}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "S3ArtifactsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ArtifactsBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ArtifactsBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-ec2-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "payment-ec2-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "EC2InstanceRole"
          }
        ]
      }
    },
    "ApplicationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/payment/application-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          },
          {
            "Ref": "PublicSubnet3"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-alb-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-tg-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-tg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 443,
        "Protocol": "HTTPS",
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01",
        "Certificates": [
          {
            "CertificateArn": {
              "Fn::Sub": "{{resolve:ssm:/payment/${EnvironmentSuffix}/alb/certificate-arn}}"
            }
          }
        ]
      }
    },
    "WebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-waf-${EnvironmentSuffix}"
        },
        "Scope": "REGIONAL",
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 1,
            "Statement": {
              "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {
            "Fn::Sub": "payment-waf-${EnvironmentSuffix}"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-waf-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "WebACLAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "Properties": {
        "ResourceArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "WebACLArn": {
          "Fn::GetAtt": [
            "WebACL",
            "Arn"
          ]
        }
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "payment-launch-template-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "LatestAmiId"
          },
          "InstanceType": "t3.large",
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "EC2InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "EC2SecurityGroup"
            }
          ],
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "VolumeSize": 100,
                "VolumeType": "gp3",
                "Iops": 3000,
                "Encrypted": true,
                "DeleteOnTermination": true
              }
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\necho 'Payment processing application deployment' > /var/log/user-data.log\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "payment-instance-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                },
                {
                  "Key": "CostCenter",
                  "Value": "FinancialServices"
                },
                {
                  "Key": "MigrationPhase",
                  "Value": "Phase1"
                }
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "payment-asg-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "LaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": 2,
        "MaxSize": 6,
        "DesiredCapacity": 2,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "VPCZoneIdentifier": [
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
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-asg-instance-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScalingPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-cpu-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
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
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALBDNSName"
        }
      }
    },
    "AuroraClusterEndpoint": {
      "Description": "Aurora Cluster Writer Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
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
      "Description": "Aurora Cluster Reader Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuroraReaderEndpoint"
        }
      }
    },
    "ArtifactsBucketName": {
      "Description": "S3 Bucket for Application Artifacts",
      "Value": {
        "Ref": "ArtifactsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ArtifactsBucketName"
        }
      }
    }
  }
}
```

## Deployment Instructions

### Prerequisites

1. Store the database password in Systems Manager Parameter Store:
   ```bash
   aws ssm put-parameter \
     --name "/payment/${ENVIRONMENT_SUFFIX}/db/password" \
     --value "YourSecurePassword123!" \
     --type "SecureString" \
     --region us-east-1
   ```

2. Store the ACM certificate ARN for HTTPS:
   ```bash
   aws ssm put-parameter \
     --name "/payment/${ENVIRONMENT_SUFFIX}/alb/certificate-arn" \
     --value "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID" \
     --type "String" \
     --region us-east-1
   ```

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Verify Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name payment-processing-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Access the Application

The ALB DNS name is available in the stack outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name payment-processing-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text
```

## Architecture Highlights

- **Multi-AZ High Availability**: Resources deployed across 3 availability zones
- **PCI DSS Compliance**: Encryption at rest (KMS), encryption in transit (TLS 1.2+), secure network architecture
- **Security**: WAF rate limiting, security groups with least privilege, private subnets for compute
- **Monitoring**: CloudWatch alarms for CPU and database connections, VPC Flow Logs, application logs
- **Scalability**: Auto Scaling based on CPU utilization (70% target)
- **Backup and Recovery**: 7-day backup retention with point-in-time recovery

## Resource Summary

This CloudFormation template creates 60+ AWS resources including:
- VPC with 9 subnets (3 public, 3 private, 3 database)
- 3 NAT Gateways for high availability
- Application Load Balancer with WAF protection
- Auto Scaling Group (2-6 EC2 t3.large instances)
- RDS Aurora MySQL cluster (1 writer + 1 reader)
- KMS customer-managed key for encryption
- IAM roles and policies
- CloudWatch Log Groups and Alarms
- S3 buckets for artifacts and flow logs
- VPC Flow Logs for network monitoring
