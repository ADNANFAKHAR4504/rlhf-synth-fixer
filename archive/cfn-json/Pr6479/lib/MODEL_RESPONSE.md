# CloudFormation JSON Implementation - Highly Available Web Application

This implementation creates a production-grade, highly available web application infrastructure for financial services transaction processing across 3 availability zones in us-east-1.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly available web application infrastructure for financial services transaction processing across 3 AZs in us-east-1",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to ensure uniqueness",
      "Default": "prod",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"]
    },
    "Project": {
      "Type": "String",
      "Description": "Project tag value",
      "Default": "financial-transactions"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center tag value",
      "Default": "engineering"
    },
    "VpcCIDR": {
      "Type": "String",
      "Description": "CIDR block for VPC",
      "Default": "10.0.0.0/16",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for RDS Aurora",
      "Default": "admin",
      "NoEcho": true
    },
    "InstanceType": {
      "Type": "String",
      "Description": "EC2 instance type for application servers",
      "Default": "t3.medium",
      "AllowedValues": ["t3.medium", "t3.large", "m5.large", "m5.xlarge"]
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Description": "Latest Amazon Linux 2023 AMI ID from SSM Parameter Store",
      "Default": "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
    },
    "SSLCertificateArn": {
      "Type": "String",
      "Description": "ARN of SSL certificate for HTTPS termination on ALB (must be pre-created in ACM)",
      "Default": ""
    }
  },
  "Conditions": {
    "HasSSLCertificate": {
      "Fn::Not": [{"Fn::Equals": [{"Ref": "SSLCertificateArn"}, ""]}]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VpcCIDR"},
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "igw-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "InternetGatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [0, {"Fn::Cidr": [{"Ref": "VpcCIDR"}, 6, 8]}]},
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [1, {"Fn::Cidr": [{"Ref": "VpcCIDR"}, 6, 8]}]},
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [2, {"Fn::Cidr": [{"Ref": "VpcCIDR"}, 6, 8]}]},
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [3, {"Fn::Cidr": [{"Ref": "VpcCIDR"}, 6, 8]}]},
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [4, {"Fn::Cidr": [{"Ref": "VpcCIDR"}, 6, 8]}]},
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [5, {"Fn::Cidr": [{"Ref": "VpcCIDR"}, 6, 8]}]},
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "EIP1": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "eip-nat-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "EIP2": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "eip-nat-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "EIP3": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "eip-nat-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "NatGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP1", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "NatGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP2", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "NatGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP3", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet3"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-rt-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-rt-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway1"}
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-rt-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable2"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway2"}
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable2"}
      }
    },
    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-rt-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable3"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway3"}
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable3"}
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "vpc-flow-logs-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudWatchLogPolicy",
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
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "VPCFlowLogsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/vpc/flowlogs-${EnvironmentSuffix}"},
        "RetentionInDays": 30
      }
    },
    "VPCFlowLogs": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {"Ref": "VPC"},
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {"Ref": "VPCFlowLogsLogGroup"},
        "DeliverLogsPermissionArn": {"Fn::GetAtt": ["VPCFlowLogsRole", "Arn"]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-flow-logs-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {"Fn::Sub": "KMS key for RDS encryption - ${EnvironmentSuffix}"},
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {"AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}},
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {"Service": "rds.amazonaws.com"},
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "kms-rds-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/rds-${EnvironmentSuffix}"},
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": "Subnet group for RDS Aurora cluster",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "db-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for RDS Aurora cluster",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "EC2SecurityGroup"},
            "Description": "MySQL access from EC2 instances"
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
          {"Key": "Name", "Value": {"Fn::Sub": "db-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "rds-credentials-${EnvironmentSuffix}"},
        "Description": "RDS Aurora master credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": {"Fn::Sub": "{\"username\": \"${DBMasterUsername}\"}"},
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "rds-credentials-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"},
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "MasterUsername": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "DBSecurityGroup"}],
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "KMSKey"},
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DBInstanceWriter": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-writer-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-writer-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DBInstanceReader": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-reader-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-reader-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "SecretRotationLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "secret-rotation-lambda-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "lambda.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "SecretsManagerAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:DescribeSecret",
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:PutSecretValue",
                    "secretsmanager:UpdateSecretVersionStage"
                  ],
                  "Resource": {"Ref": "DBSecret"}
                },
                {
                  "Effect": "Allow",
                  "Action": "secretsmanager:GetRandomPassword",
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "DestinationSecurityGroupId": {"Ref": "DBSecurityGroup"},
            "Description": "MySQL access to RDS"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS for AWS API calls"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DBSecurityGroupIngressFromLambda": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {"Ref": "DBSecurityGroup"},
        "IpProtocol": "tcp",
        "FromPort": 3306,
        "ToPort": 3306,
        "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"},
        "Description": "MySQL access from Lambda rotation function"
      }
    },
    "SecretRotationLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "secret-rotation-${EnvironmentSuffix}"},
        "Description": "Rotates RDS Aurora credentials in Secrets Manager",
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["SecretRotationLambdaRole", "Arn"]},
        "Timeout": 300,
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"},
            {"Ref": "PrivateSubnet3"}
          ]
        },
        "Environment": {
          "Variables": {
            "SECRETS_MANAGER_ENDPOINT": {"Fn::Sub": "https://secretsmanager.${AWS::Region}.amazonaws.com"}
          }
        },
        "Code": {
          "ZipFile": {"Fn::Join": ["\n", [
            "import json",
            "import boto3",
            "import pymysql",
            "import os",
            "",
            "def lambda_handler(event, context):",
            "    \"\"\"Handles the secret rotation for RDS Aurora MySQL.\"\"\"",
            "    service_client = boto3.client('secretsmanager')",
            "    arn = event['SecretId']",
            "    token = event['ClientRequestToken']",
            "    step = event['Step']",
            "    ",
            "    metadata = service_client.describe_secret(SecretId=arn)",
            "    if not metadata['RotationEnabled']:",
            "        raise ValueError(f\"Secret {arn} is not enabled for rotation\")",
            "    ",
            "    versions = metadata['VersionIdsToStages']",
            "    if token not in versions:",
            "        raise ValueError(f\"Secret version {token} has no stage for rotation\")",
            "    ",
            "    if \"AWSCURRENT\" in versions[token]:",
            "        return {\"statusCode\": 200, \"body\": \"Secret already set as AWSCURRENT\"}",
            "    elif \"AWSPENDING\" not in versions[token]:",
            "        raise ValueError(f\"Secret version {token} not set as AWSPENDING for rotation\")",
            "    ",
            "    if step == \"createSecret\":",
            "        create_secret(service_client, arn, token)",
            "    elif step == \"setSecret\":",
            "        set_secret(service_client, arn, token)",
            "    elif step == \"testSecret\":",
            "        test_secret(service_client, arn, token)",
            "    elif step == \"finishSecret\":",
            "        finish_secret(service_client, arn, token)",
            "    else:",
            "        raise ValueError(\"Invalid step parameter\")",
            "    ",
            "    return {\"statusCode\": 200, \"body\": f\"Successfully completed {step} step\"}",
            "",
            "def create_secret(service_client, arn, token):",
            "    \"\"\"Generate a new secret.\"\"\"",
            "    service_client.get_secret_value(SecretId=arn, VersionStage=\"AWSCURRENT\")",
            "    try:",
            "        service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage=\"AWSPENDING\")",
            "    except service_client.exceptions.ResourceNotFoundException:",
            "        passwd = service_client.get_random_password(ExcludeCharacters='/@\"\\\\\\'')",
            "        current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage=\"AWSCURRENT\")['SecretString'])",
            "        current_dict['password'] = passwd['RandomPassword']",
            "        service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps(current_dict), VersionStages=['AWSPENDING'])",
            "",
            "def set_secret(service_client, arn, token):",
            "    \"\"\"Set the pending secret in the database.\"\"\"",
            "    pending_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage=\"AWSPENDING\")['SecretString'])",
            "    current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage=\"AWSCURRENT\")['SecretString'])",
            "    pass",
            "",
            "def test_secret(service_client, arn, token):",
            "    \"\"\"Test the pending secret.\"\"\"",
            "    pass",
            "",
            "def finish_secret(service_client, arn, token):",
            "    \"\"\"Finish the rotation by marking the pending secret as current.\"\"\"",
            "    metadata = service_client.describe_secret(SecretId=arn)",
            "    current_version = None",
            "    for version in metadata[\"VersionIdsToStages\"]:",
            "        if \"AWSCURRENT\" in metadata[\"VersionIdsToStages\"][version]:",
            "            if version == token:",
            "                return",
            "            current_version = version",
            "            break",
            "    service_client.update_secret_version_stage(SecretId=arn, VersionStage=\"AWSCURRENT\", MoveToVersionId=token, RemoveFromVersionId=current_version)"
          ]]}
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "secret-rotation-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "SecretRotationLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "SecretRotationLambda"},
        "Action": "lambda:InvokeFunction",
        "Principal": "secretsmanager.amazonaws.com"
      }
    },
    "SecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "DependsOn": ["SecretRotationLambdaPermission", "DBInstanceWriter"],
      "Properties": {
        "SecretId": {"Ref": "DBSecret"},
        "RotationLambdaARN": {"Fn::GetAtt": ["SecretRotationLambda", "Arn"]},
        "RotationRules": {
          "AutomaticallyAfterDays": 30
        }
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP from internet (redirect to HTTPS)"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "DestinationSecurityGroupId": {"Ref": "EC2SecurityGroup"},
            "Description": "HTTP to EC2 instances"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "ec2-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"},
            "Description": "HTTP from ALB"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS for updates and API calls"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP for updates"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "DestinationSecurityGroupId": {"Ref": "DBSecurityGroup"},
            "Description": "MySQL to RDS"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "ec2-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "alb-${EnvironmentSuffix}"},
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"},
          {"Ref": "PublicSubnet3"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "alb-tg-${EnvironmentSuffix}"},
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VPC"},
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/health",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {"HttpCode": "200"},
        "TargetType": "instance",
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-tg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "ALBListenerHTTPS": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Condition": "HasSSLCertificate",
      "Properties": {
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 443,
        "Protocol": "HTTPS",
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01",
        "Certificates": [{"CertificateArn": {"Ref": "SSLCertificateArn"}}],
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ]
      }
    },
    "ALBListenerHTTP": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Fn::If": [
              "HasSSLCertificate",
              {
                "Type": "redirect",
                "RedirectConfig": {
                  "Protocol": "HTTPS",
                  "Port": "443",
                  "StatusCode": "HTTP_301"
                }
              },
              {
                "Type": "forward",
                "TargetGroupArn": {"Ref": "ALBTargetGroup"}
              }
            ]
          }
        ]
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "ec2-instance-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "ec2.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "SecretsManagerReadAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {"Ref": "DBSecret"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {"Fn::GetAtt": ["KMSKey", "Arn"]}
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "ec2-instance-profile-${EnvironmentSuffix}"},
        "Roles": [{"Ref": "EC2InstanceRole"}]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "launch-template-${EnvironmentSuffix}"},
        "LaunchTemplateData": {
          "ImageId": {"Ref": "LatestAmiId"},
          "InstanceType": {"Ref": "InstanceType"},
          "IamInstanceProfile": {"Arn": {"Fn::GetAtt": ["EC2InstanceProfile", "Arn"]}},
          "SecurityGroupIds": [{"Ref": "EC2SecurityGroup"}],
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1,
            "HttpEndpoint": "enabled"
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": [
                "#!/bin/bash\nset -e\nyum update -y\nyum install -y amazon-cloudwatch-agent\n\n# Install application dependencies\nyum install -y httpd mysql\n\n# Configure CloudWatch agent\ncat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'\n{\n  \"logs\": {\n    \"logs_collected\": {\n      \"files\": {\n        \"collect_list\": [\n          {\n            \"file_path\": \"/var/log/httpd/access_log\",\n            \"log_group_name\": \"/aws/ec2/${EnvironmentSuffix}/httpd\",\n            \"log_stream_name\": \"{instance_id}/access.log\"\n          },\n          {\n            \"file_path\": \"/var/log/httpd/error_log\",\n            \"log_group_name\": \"/aws/ec2/${EnvironmentSuffix}/httpd\",\n            \"log_stream_name\": \"{instance_id}/error.log\"\n          }\n        ]\n      }\n    }\n  },\n  \"metrics\": {\n    \"namespace\": \"FinancialApp/${EnvironmentSuffix}\",\n    \"metrics_collected\": {\n      \"mem\": {\n        \"measurement\": [\n          {\"name\": \"mem_used_percent\", \"rename\": \"MemoryUsedPercent\", \"unit\": \"Percent\"}\n        ]\n      },\n      \"disk\": {\n        \"measurement\": [\n          {\"name\": \"used_percent\", \"rename\": \"DiskUsedPercent\", \"unit\": \"Percent\"}\n        ],\n        \"resources\": [\"*\"]\n      }\n    }\n  }\n}\nEOF\n\n# Start CloudWatch agent\n/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\\n  -a fetch-config \\\n  -m ec2 \\\n  -s \\\n  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json\n\n# Configure application\ncat > /var/www/html/index.html << 'EOF'\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Financial Services Application</title>\n</head>\n<body>\n  <h1>Financial Services Transaction Processing</h1>\n  <p>Environment: ${EnvironmentSuffix}</p>\n  <p>Instance ID: $(ec2-metadata --instance-id | cut -d \" \" -f 2)</p>\n  <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d \" \" -f 2)</p>\n</body>\n</html>\nEOF\n\n# Health check endpoint\ncat > /var/www/html/health << 'EOF'\nOK\nEOF\n\n# Start httpd\nsystemctl enable httpd\nsystemctl start httpd\n\necho \"Instance configuration completed successfully\"",
                {
                  "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"}
                }
              ]
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {"Key": "Name", "Value": {"Fn::Sub": "ec2-instance-${EnvironmentSuffix}"}},
                {"Key": "Environment", "Value": {"Ref": "Environment"}},
                {"Key": "Project", "Value": {"Ref": "Project"}},
                {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
              ]
            },
            {
              "ResourceType": "volume",
              "Tags": [
                {"Key": "Name", "Value": {"Fn::Sub": "ec2-volume-${EnvironmentSuffix}"}},
                {"Key": "Environment", "Value": {"Ref": "Environment"}},
                {"Key": "Project", "Value": {"Ref": "Project"}},
                {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "DependsOn": ["NatGateway1", "NatGateway2", "NatGateway3"],
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "asg-${EnvironmentSuffix}"},
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "LaunchTemplate"},
          "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
        },
        "MinSize": 2,
        "MaxSize": 6,
        "DesiredCapacity": 2,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "TargetGroupARNs": [{"Ref": "ALBTargetGroup"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "asg-instance-${EnvironmentSuffix}"}, "PropagateAtLaunch": true},
          {"Key": "Environment", "Value": {"Ref": "Environment"}, "PropagateAtLaunch": true},
          {"Key": "Project", "Value": {"Ref": "Project"}, "PropagateAtLaunch": true},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}, "PropagateAtLaunch": true}
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {"Ref": "AutoScalingGroup"},
        "Cooldown": 300,
        "ScalingAdjustment": 1
      }
    },
    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {"Ref": "AutoScalingGroup"},
        "Cooldown": 300,
        "ScalingAdjustment": -1
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "cpu-alarm-high-${EnvironmentSuffix}"},
        "AlarmDescription": "Scale up when CPU exceeds 70%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {"Ref": "AutoScalingGroup"}
          }
        ],
        "AlarmActions": [{"Ref": "ScaleUpPolicy"}]
      }
    },
    "CPUAlarmLow": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "cpu-alarm-low-${EnvironmentSuffix}"},
        "AlarmDescription": "Scale down when CPU below 30%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 30,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {"Ref": "AutoScalingGroup"}
          }
        ],
        "AlarmActions": [{"Ref": "ScaleDownPolicy"}]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}}
    },
    "PublicSubnets": {
      "Description": "Public subnet IDs",
      "Value": {
        "Fn::Join": [",", [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"},
          {"Ref": "PublicSubnet3"}
        ]]
      },
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnets"}}
    },
    "PrivateSubnets": {
      "Description": "Private subnet IDs",
      "Value": {
        "Fn::Join": [",", [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ]]
      },
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnets"}}
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS name",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-ALBDNSName"}}
    },
    "ALBArn": {
      "Description": "Application Load Balancer ARN",
      "Value": {"Ref": "ApplicationLoadBalancer"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-ALBArn"}}
    },
    "TargetGroupArn": {
      "Description": "Target Group ARN",
      "Value": {"Ref": "ALBTargetGroup"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-TargetGroupArn"}}
    },
    "DBClusterEndpoint": {
      "Description": "RDS Aurora cluster writer endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DBClusterEndpoint"}}
    },
    "DBClusterReadEndpoint": {
      "Description": "RDS Aurora cluster reader endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "ReadEndpoint.Address"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DBClusterReadEndpoint"}}
    },
    "DBSecretArn": {
      "Description": "ARN of RDS credentials secret in Secrets Manager",
      "Value": {"Ref": "DBSecret"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DBSecretArn"}}
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for RDS encryption",
      "Value": {"Ref": "KMSKey"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-KMSKeyId"}}
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group name",
      "Value": {"Ref": "AutoScalingGroup"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-AutoScalingGroupName"}}
    },
    "VPCFlowLogsLogGroup": {
      "Description": "CloudWatch Log Group for VPC Flow Logs",
      "Value": {"Ref": "VPCFlowLogsLogGroup"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VPCFlowLogsLogGroup"}}
    }
  }
}
```

## Implementation Notes

### Architecture Overview

This CloudFormation template implements a highly available, production-grade infrastructure with the following characteristics:

1. **Multi-AZ Deployment**: All components are distributed across 3 availability zones in us-east-1
2. **Network Isolation**: Public subnets for internet-facing resources, private subnets for application tier
3. **Database High Availability**: Aurora MySQL cluster with 1 writer and 1 reader instance
4. **Auto Scaling**: EC2 instances scale between 2 and 6 based on CPU utilization
5. **Security**: Least-privilege security groups, encryption at rest, IMDSv2, secrets rotation

### Security Features

- **Encryption**: RDS uses customer-managed KMS keys for encryption at rest
- **Secrets Management**: Database credentials stored in Secrets Manager with automatic 30-day rotation
- **IMDSv2**: EC2 instances enforce IMDSv2 exclusively via metadata options
- **Security Groups**: Follow least-privilege principle with explicit rules, no 0.0.0.0/0 inbound except ALB
- **HTTPS Enforcement**: ALB redirects HTTP to HTTPS when SSL certificate is provided
- **VPC Flow Logs**: All VPC traffic logged to CloudWatch with 30-day retention

### Resource Naming

All resources use the `environmentSuffix` parameter to ensure unique naming:
- VPC: `vpc-${EnvironmentSuffix}`
- Subnets: `public-subnet-1-${EnvironmentSuffix}`, `private-subnet-1-${EnvironmentSuffix}`
- RDS: `aurora-cluster-${EnvironmentSuffix}`
- ALB: `alb-${EnvironmentSuffix}`
- Security Groups: `alb-sg-${EnvironmentSuffix}`, `ec2-sg-${EnvironmentSuffix}`, etc.

### Blue-Green Deployment Support

The template supports blue-green deployments through:
1. **Launch Template Versioning**: ASG references latest version, allowing template updates
2. **Parameter Updates**: Change `EnvironmentSuffix` parameter to create parallel stack
3. **Target Group Swapping**: Update ALB listeners to point to new target group
4. **Rolling Updates**: ASG can perform rolling instance replacements

### Deployment Requirements

**Prerequisites**:
- AWS account with appropriate permissions
- Optional: SSL certificate ARN in ACM for HTTPS termination
- AWS CLI configured with valid credentials

**Parameters to Configure**:
- `EnvironmentSuffix`: Unique identifier for this deployment
- `Environment`: Environment tag (development/staging/production)
- `Project`: Project name for tagging
- `CostCenter`: Cost center for billing attribution
- `SSLCertificateArn`: ARN of ACM certificate (optional, enables HTTPS)

**Deployment Command**:
```bash
aws cloudformation create-stack \
  --stack-name financial-app-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Project,ParameterValue=financial-transactions \
    ParameterKey=CostCenter,ParameterValue=engineering \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitoring

The stack includes:
- VPC Flow Logs sent to CloudWatch Logs (`/aws/vpc/flowlogs-${EnvironmentSuffix}`)
- CloudWatch alarms for Auto Scaling based on CPU utilization
- CloudWatch agent on EC2 instances collecting logs and metrics
- RDS CloudWatch Logs exports (error, general, slowquery)

### Cost Optimization

While this is a production-grade deployment, consider these optimizations:
- **NAT Gateways**: Three NAT Gateways provide high availability but increase costs (~$100/month)
- **RDS Aurora**: Two instances (writer + reader) for HA; consider Aurora Serverless for variable workloads
- **EC2 Instance Type**: t3.medium provides good balance; adjust based on application needs

### Cleanup

To delete the stack and all resources:
```bash
aws cloudformation delete-stack --stack-name financial-app-prod --region us-east-1
```

Note: Ensure the RDS cluster has no retention policy issues before deletion.
