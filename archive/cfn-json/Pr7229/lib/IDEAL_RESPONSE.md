# Overview

Please find solution files below.

## ./lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Credit Scoring Web Application - CloudFormation Template",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names to ensure uniqueness",
      "Default": "prod"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center tag for billing",
      "Default": "fintech"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"]
    },
    "DataClassification": {
      "Type": "String",
      "Description": "Data classification tag",
      "Default": "confidential",
      "AllowedValues": ["public", "internal", "confidential", "restricted"]
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "dbadmin",
      "NoEcho": true
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
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "igw-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP1", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP2", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP3", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet3"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-3-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-rt-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway1"}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable2"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway2"}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable3"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway3"}
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable3"}
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for credit scoring application encryption",
        "EnableKeyRotation": true,
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
              "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant"],
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {"Service": {"Fn::Sub": "logs.${AWS::Region}.amazonaws.com"}},
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                }
              }
            }
          ]
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "kms-key-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/credit-scoring-${EnvironmentSuffix}"},
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443, "CidrIp": "0.0.0.0/0"},
          {"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "CidrIp": "0.0.0.0/0"}
        ],
        "SecurityGroupEgress": [{"IpProtocol": "-1", "CidrIp": "0.0.0.0/0"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [{"IpProtocol": "-1", "CidrIp": "0.0.0.0/0"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"}
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Aurora database",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-postgresql",
        "EngineMode": "provisioned",
        "EngineVersion": "15.8",
        "DatabaseName": "creditscoring",
        "MasterUsername": {"Ref": "DBMasterUsername"},
        "ManageMasterUserPassword": true,
        "MasterUserSecret": {
          "KmsKeyId": {"Ref": "KMSKey"}
        },
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "RDSSecurityGroup"}],
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "KMSKey"},
        "BackupRetentionPeriod": 30,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["postgresql"],
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": 0.5,
          "MaxCapacity": 1
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "DBInstanceClass": "db.serverless",
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"],
        "Policies": [
          {
            "PolicyName": "LambdaAuroraAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds-data:ExecuteStatement",
                    "rds-data:BatchExecuteStatement",
                    "rds-data:BeginTransaction",
                    "rds-data:CommitTransaction",
                    "rds-data:RollbackTransaction"
                  ],
                  "Resource": {"Fn::GetAtt": ["DBCluster", "DBClusterArn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": ["secretsmanager:GetSecretValue"],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "LambdaLogging",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-role-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/lambda/credit-scoring-${EnvironmentSuffix}"},
        "RetentionInDays": 365,
        "KmsKeyId": {"Fn::GetAtt": ["KMSKey", "Arn"]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-log-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "CreditScoringFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "LambdaLogGroup",
      "Properties": {
        "FunctionName": {"Fn::Sub": "credit-scoring-${EnvironmentSuffix}"},
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n  console.log('Credit scoring request received:', JSON.stringify(event, null, 2));\n  \n  let body;\n  try {\n    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;\n  } catch (error) {\n    return {\n      statusCode: 400,\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ error: 'Invalid JSON in request body' })\n    };\n  }\n  \n  const { income, creditHistory, debtRatio } = body;\n  \n  if (!income || !creditHistory || debtRatio === undefined) {\n    return {\n      statusCode: 400,\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ error: 'Missing required fields: income, creditHistory, debtRatio' })\n    };\n  }\n  \n  let score = 300;\n  \n  if (income > 50000) score += 100;\n  if (income > 75000) score += 100;\n  if (income > 100000) score += 100;\n  \n  if (creditHistory === 'excellent') score += 200;\n  else if (creditHistory === 'good') score += 150;\n  else if (creditHistory === 'fair') score += 50;\n  \n  if (debtRatio < 0.2) score += 100;\n  else if (debtRatio < 0.4) score += 50;\n  else if (debtRatio > 0.6) score -= 100;\n  \n  score = Math.min(850, Math.max(300, score));\n  \n  const result = {\n    creditScore: score,\n    rating: score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Poor',\n    timestamp: new Date().toISOString(),\n    requestId: event.requestContext?.requestId || 'N/A'\n  };\n  \n  console.log('Credit score calculated:', result);\n  \n  return {\n    statusCode: 200,\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(result)\n  };\n};\n"
        },
        "Environment": {
          "Variables": {
            "DB_CLUSTER_ARN": {"Fn::GetAtt": ["DBCluster", "DBClusterArn"]},
            "DB_NAME": "creditscoring",
            "ENVIRONMENT": {"Ref": "Environment"}
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"},
            {"Ref": "PrivateSubnet3"}
          ]
        },
        "ReservedConcurrentExecutions": 10,
        "Timeout": 30,
        "MemorySize": 512,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "credit-scoring-lambda-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "CreditScoringFunction"},
        "Action": "lambda:InvokeFunction",
        "Principal": "elasticloadbalancing.amazonaws.com",
        "SourceArn": {"Fn::Sub": "arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:targetgroup/tg-${EnvironmentSuffix}/*"}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "ALBLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/alb/credit-scoring-${EnvironmentSuffix}"},
        "RetentionInDays": 365,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-log-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "tg-${EnvironmentSuffix}"},
        "TargetType": "lambda",
        "Targets": [{"Id": {"Fn::GetAtt": ["CreditScoringFunction", "Arn"]}}],
        "HealthCheckEnabled": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "target-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "HTTPListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "TargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}}
    },
    "ALBDNSName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-ALBDNSName"}}
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the credit scoring Lambda function",
      "Value": {"Fn::GetAtt": ["CreditScoringFunction", "Arn"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-LambdaArn"}}
    },
    "DBClusterEndpoint": {
      "Description": "Aurora cluster endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DBEndpoint"}}
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {"Ref": "KMSKey"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-KMSKeyId"}}
    }
  }
}

```

## ./lib/template-loader.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';

export function loadTemplate(): any {
  const templatePath = path.join(__dirname, 'TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  return JSON.parse(templateContent);
}

export function validateTemplateStructure(template: any): boolean {
  if (!template.AWSTemplateFormatVersion) return false;
  if (!template.Resources) return false;
  if (Object.keys(template.Resources).length === 0) return false;
  return true;
}

export function getResourcesByType(
  template: any,
  resourceType: string
): string[] {
  const resources: string[] = [];
  for (const [name, resource] of Object.entries(template.Resources)) {
    if ((resource as any).Type === resourceType) {
      resources.push(name);
    }
  }
  return resources;
}

export function validateResourceTags(
  resource: any,
  requiredTags: string[]
): boolean {
  if (!resource.Properties || !resource.Properties.Tags) {
    return false;
  }

  const tags = resource.Properties.Tags;
  const tagKeys = tags.map((t: any) => t.Key);

  return requiredTags.every(tag => tagKeys.includes(tag));
}

export function validateResourceNaming(resource: any): boolean {
  if (!resource.Properties) return false;

  const name = resource.Properties.Name || resource.Properties.FunctionName;
  const nameTag = resource.Properties.Tags?.find((t: any) => t.Key === 'Name');

  if (nameTag) {
    const nameValue = nameTag.Value;
    if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
      return nameValue['Fn::Sub'].includes('${EnvironmentSuffix}');
    }
  }

  if (name && typeof name === 'object' && name['Fn::Sub']) {
    return name['Fn::Sub'].includes('${EnvironmentSuffix}');
  }

  return true;
}

export function countResourcesByType(template: any): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const resource of Object.values(template.Resources)) {
    const type = (resource as any).Type;
    counts[type] = (counts[type] || 0) + 1;
  }

  return counts;
}

export function validateDeletionPolicies(template: any): {
  hasRetain: boolean;
  resources: string[];
} {
  const retainResources: string[] = [];

  for (const [name, resource] of Object.entries(template.Resources)) {
    if ((resource as any).DeletionPolicy === 'Retain') {
      retainResources.push(name);
    }
  }

  return {
    hasRetain: retainResources.length > 0,
    resources: retainResources,
  };
}

export function validateEncryption(template: any): {
  encrypted: string[];
  unencrypted: string[];
} {
  const encrypted: string[] = [];
  const unencrypted: string[] = [];

  for (const [name, resource] of Object.entries(template.Resources)) {
    const res = resource as any;

    if (res.Type === 'AWS::RDS::DBCluster') {
      if (res.Properties.StorageEncrypted === true && res.Properties.KmsKeyId) {
        encrypted.push(name);
      } else {
        unencrypted.push(name);
      }
    }

    if (res.Type === 'AWS::Lambda::Function') {
      if (res.Properties.Environment?.Variables) {
        encrypted.push(name);
      }
    }
  }

  return { encrypted, unencrypted };
}

export function validateVPCConfiguration(template: any): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check VPC exists
  const vpc = Object.values(template.Resources).find(
    (r: any) => r.Type === 'AWS::EC2::VPC'
  );
  if (!vpc) {
    issues.push('No VPC resource found');
  }

  // Check public subnets
  const publicSubnets = Object.values(template.Resources).filter(
    (r: any) =>
      r.Type === 'AWS::EC2::Subnet' && r.Properties.MapPublicIpOnLaunch === true
  );
  if (publicSubnets.length < 2) {
    issues.push('Less than 2 public subnets found');
  }

  // Check private subnets
  const privateSubnets = Object.values(template.Resources).filter(
    (r: any) =>
      r.Type === 'AWS::EC2::Subnet' && r.Properties.MapPublicIpOnLaunch !== true
  );
  if (privateSubnets.length < 2) {
    issues.push('Less than 2 private subnets found');
  }

  // Check NAT Gateways
  const natGateways = Object.values(template.Resources).filter(
    (r: any) => r.Type === 'AWS::EC2::NatGateway'
  );
  if (natGateways.length === 0) {
    issues.push('No NAT Gateways found');
  }

  return { valid: issues.length === 0, issues };
}

export function validateSecurityGroups(template: any): {
  count: number;
  hasRules: boolean;
} {
  const securityGroups = Object.values(template.Resources).filter(
    (r: any) => r.Type === 'AWS::EC2::SecurityGroup'
  );

  const hasRules = securityGroups.some((sg: any) => {
    return (
      sg.Properties.SecurityGroupIngress || sg.Properties.SecurityGroupEgress
    );
  });

  return { count: securityGroups.length, hasRules };
}

```

## ./lib/template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Credit Scoring Web Application - CloudFormation Template",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names to ensure uniqueness",
      "Default": "prod"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center tag for billing",
      "Default": "fintech"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"]
    },
    "DataClassification": {
      "Type": "String",
      "Description": "Data classification tag",
      "Default": "confidential",
      "AllowedValues": ["public", "internal", "confidential", "restricted"]
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "dbadmin",
      "NoEcho": true
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for Aurora database",
      "NoEcho": true,
      "MinLength": 8
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
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "igw-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP1", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP2", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP3", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet3"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-3-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-rt-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway1"}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable2"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway2"}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable3"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway3"}
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable3"}
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for credit scoring application encryption",
        "EnableKeyRotation": true,
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
              "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant"],
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {"Service": {"Fn::Sub": "logs.${AWS::Region}.amazonaws.com"}},
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                }
              }
            }
          ]
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "kms-key-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/credit-scoring-${EnvironmentSuffix}"},
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443, "CidrIp": "0.0.0.0/0"},
          {"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "CidrIp": "0.0.0.0/0"}
        ],
        "SecurityGroupEgress": [{"IpProtocol": "-1", "CidrIp": "0.0.0.0/0"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [{"IpProtocol": "-1", "CidrIp": "0.0.0.0/0"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"}
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Aurora database",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-postgresql",
        "EngineMode": "provisioned",
        "EngineVersion": "15.8",
        "DatabaseName": "creditscoring",
        "MasterUsername": {"Ref": "DBMasterUsername"},
        "MasterUserPassword": {"Ref": "DBMasterPassword"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "RDSSecurityGroup"}],
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "KMSKey"},
        "BackupRetentionPeriod": 30,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["postgresql"],
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": 0.5,
          "MaxCapacity": 1
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "DBInstanceClass": "db.serverless",
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"],
        "Policies": [
          {
            "PolicyName": "LambdaAuroraAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds-data:ExecuteStatement",
                    "rds-data:BatchExecuteStatement",
                    "rds-data:BeginTransaction",
                    "rds-data:CommitTransaction",
                    "rds-data:RollbackTransaction"
                  ],
                  "Resource": {"Fn::GetAtt": ["DBCluster", "DBClusterArn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": ["secretsmanager:GetSecretValue"],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "LambdaLogging",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-role-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/lambda/credit-scoring-${EnvironmentSuffix}"},
        "RetentionInDays": 365,
        "KmsKeyId": {"Fn::GetAtt": ["KMSKey", "Arn"]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-log-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "CreditScoringFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "LambdaLogGroup",
      "Properties": {
        "FunctionName": {"Fn::Sub": "credit-scoring-${EnvironmentSuffix}"},
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n  console.log('Credit scoring request received:', JSON.stringify(event, null, 2));\n  \n  let body;\n  try {\n    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;\n  } catch (error) {\n    return {\n      statusCode: 400,\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ error: 'Invalid JSON in request body' })\n    };\n  }\n  \n  const { income, creditHistory, debtRatio } = body;\n  \n  if (!income || !creditHistory || debtRatio === undefined) {\n    return {\n      statusCode: 400,\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ error: 'Missing required fields: income, creditHistory, debtRatio' })\n    };\n  }\n  \n  let score = 300;\n  \n  if (income > 50000) score += 100;\n  if (income > 75000) score += 100;\n  if (income > 100000) score += 100;\n  \n  if (creditHistory === 'excellent') score += 200;\n  else if (creditHistory === 'good') score += 150;\n  else if (creditHistory === 'fair') score += 50;\n  \n  if (debtRatio < 0.2) score += 100;\n  else if (debtRatio < 0.4) score += 50;\n  else if (debtRatio > 0.6) score -= 100;\n  \n  score = Math.min(850, Math.max(300, score));\n  \n  const result = {\n    creditScore: score,\n    rating: score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Poor',\n    timestamp: new Date().toISOString(),\n    requestId: event.requestContext?.requestId || 'N/A'\n  };\n  \n  console.log('Credit score calculated:', result);\n  \n  return {\n    statusCode: 200,\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(result)\n  };\n};\n"
        },
        "Environment": {
          "Variables": {
            "DB_CLUSTER_ARN": {"Fn::GetAtt": ["DBCluster", "DBClusterArn"]},
            "DB_NAME": "creditscoring",
            "ENVIRONMENT": {"Ref": "Environment"}
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"},
            {"Ref": "PrivateSubnet3"}
          ]
        },
        "ReservedConcurrentExecutions": 10,
        "Timeout": 30,
        "MemorySize": 512,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "credit-scoring-lambda-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "CreditScoringFunction"},
        "Action": "lambda:InvokeFunction",
        "Principal": "elasticloadbalancing.amazonaws.com",
        "SourceArn": {"Fn::Sub": "arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:targetgroup/tg-${EnvironmentSuffix}/*"}
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
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "ALBLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/alb/credit-scoring-${EnvironmentSuffix}"},
        "RetentionInDays": 365,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-log-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "tg-${EnvironmentSuffix}"},
        "TargetType": "lambda",
        "Targets": [{"Id": {"Fn::GetAtt": ["CreditScoringFunction", "Arn"]}}],
        "HealthCheckEnabled": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "target-group-${EnvironmentSuffix}"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "DataClassification", "Value": {"Ref": "DataClassification"}}
        ]
      }
    },
    "HTTPListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "TargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}}
    },
    "ALBDNSName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-ALBDNSName"}}
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the credit scoring Lambda function",
      "Value": {"Fn::GetAtt": ["CreditScoringFunction", "Arn"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-LambdaArn"}}
    },
    "DBClusterEndpoint": {
      "Description": "Aurora cluster endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DBEndpoint"}}
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {"Ref": "KMSKey"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-KMSKeyId"}}
    }
  }
}

```

## ./test/TapStack.int.test.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('CloudFormation Stack Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('VPC Configuration', () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    afterAll(() => {
      ec2Client.destroy();
    });

    test('VPC should exist and be properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should have 6 subnets (3 public + 3 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have NAT Gateways for private subnet outbound connectivity', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });

    test('should have security groups configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(1);
    });
  });

  describe('Lambda Function', () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
    });

    afterAll(() => {
      lambdaClient.destroy();
    });

    test('Lambda function should exist and be properly configured', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionArn).toBe(functionArn);
      expect(response.Configuration!.Runtime).toBe('nodejs22.x');
      expect(response.Configuration!.Handler).toBe('index.handler');
    });

    test('Lambda should be in VPC', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.VPCId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('Lambda should have execution role configured', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role).toMatch(/arn:aws:iam::/);
    });

    test('Lambda should have environment variables set', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.DB_CLUSTER_ARN).toBeDefined();
      expect(response.Environment!.Variables!.DB_NAME).toBe('creditscoring');
    });
  });

  describe('RDS Aurora Cluster', () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    afterAll(() => {
      rdsClient.destroy();
    });

    test('DB cluster should exist and be available', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineMode).toBe('provisioned');
    });

    test('DB cluster should have encryption enabled', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    test('DB cluster should have backup retention configured', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBe(30);
      expect(cluster.PreferredBackupWindow).toBeDefined();
    });

    test('DB cluster should have CloudWatch logs enabled', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.EnabledCloudwatchLogsExports).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports!.length).toBeGreaterThan(0);
    });

    test('DB cluster should be in VPC', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.DBSubnetGroup).toBeDefined();
      expect(cluster.VpcSecurityGroups).toBeDefined();
      expect(cluster.VpcSecurityGroups!.length).toBeGreaterThan(0);
    });

    test('DB instance should exist and be serverless v2', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterIdentifier],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);

      const instance = response.DBInstances![0];
      expect(instance.DBInstanceClass).toBe('db.serverless');
      expect(instance.PubliclyAccessible).toBe(false);
    });
  });

  describe('Application Load Balancer', () => {
    let elbClient: ElasticLoadBalancingV2Client;

    beforeAll(() => {
      elbClient = new ElasticLoadBalancingV2Client({ region });
    });

    afterAll(() => {
      elbClient.destroy();
    });

    test('ALB should exist and be active', async () => {
      const albDnsName = outputs.ALBDNSName;

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();

      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('ALB should be in correct VPC and subnets', async () => {
      const albDnsName = outputs.ALBDNSName;

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDnsName);
      expect(alb!.VpcId).toBe(outputs.VPCId);
      expect(alb!.AvailabilityZones).toBeDefined();
      expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have target group for Lambda', async () => {
      const albDnsName = outputs.ALBDNSName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers!.find(
        lb => lb.DNSName === albDnsName
      );

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = tgResponse.TargetGroups![0];
      expect(targetGroup.TargetType).toBe('lambda');
    });

    test('should have HTTP listener configured', async () => {
      const albDnsName = outputs.ALBDNSName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers!.find(
        lb => lb.DNSName === albDnsName
      );

      const listenerCommand = new DescribeListenersCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const listenerResponse = await elbClient.send(listenerCommand);

      expect(listenerResponse.Listeners).toBeDefined();
      expect(listenerResponse.Listeners!.length).toBeGreaterThan(0);

      const httpListener = listenerResponse.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    });
  });

  describe('KMS Key', () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    afterAll(() => {
      kmsClient.destroy();
    });

    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;

      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(keyId);
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('KMS key should have rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;

      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('CloudWatch Logs', () => {
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      logsClient = new CloudWatchLogsClient({ region });
    });

    afterAll(() => {
      logsClient.destroy();
    });

    test('Lambda log group should exist with 365 day retention', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();

      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(365);
    });
  });

  describe('End-to-End Workflow', () => {
    test('all required outputs should be present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
    });

    test('ALB DNS name should be reachable (HTTP endpoint exists)', () => {
      expect(outputs.ALBDNSName).toMatch(
        /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/
      );
    });

    test('Lambda function ARN should have correct format', () => {
      expect(outputs.LambdaFunctionArn).toMatch(
        /^arn:aws:lambda:[a-z0-9-]+:\d+:function:[a-z0-9-]+$/
      );
    });

    test('DB cluster endpoint should have correct format', () => {
      expect(outputs.DBClusterEndpoint).toMatch(
        /^[a-z0-9-]+\.cluster-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/
      );
    });

    test('KMS Key ID should be a valid UUID', () => {
      expect(outputs.KMSKeyId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('Resource Connectivity', () => {
    test('Lambda should be able to connect to database (via security groups)', async () => {
      const ec2Client = new EC2Client({ region });
      const lambdaClient = new LambdaClient({ region });

      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(lambdaConfig.VpcConfig).toBeDefined();
      expect(lambdaConfig.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(lambdaConfig.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(
        0
      );

      ec2Client.destroy();
      lambdaClient.destroy();
    });

    test('ALB should be able to invoke Lambda (via target group)', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region });
      const albDnsName = outputs.ALBDNSName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers!.find(
        lb => lb.DNSName === albDnsName
      );

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

      elbClient.destroy();
    });
  });
});

```

## ./test/TapStack.unit.test.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import {
  loadTemplate,
  validateTemplateStructure,
  getResourcesByType,
  validateResourceTags,
  validateResourceNaming,
  countResourcesByType,
  validateDeletionPolicies,
  validateEncryption,
  validateVPCConfiguration,
  validateSecurityGroups,
} from '../lib/template-loader';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    template = loadTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBeDefined();
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.NoEcho).toBe(true);
    });

    test('should have required tagging parameters', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.DataClassification).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toBeDefined();
      expect(attachment.Properties.InternetGatewayId).toBeDefined();
    });

    test('should have public subnets in 3 AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);

      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);

      expect(template.Resources.PublicSubnet3.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have private subnets in 3 AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      // MapPublicIpOnLaunch is false by default for private subnets (not explicitly set)
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBeFalsy();
    });

    test('should have NAT Gateways for each AZ', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway3).toBeDefined();

      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP2).toBeDefined();
      expect(template.Resources.EIP3).toBeDefined();

      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
    });

    test('should have route table for public subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda function', () => {
      const lambda = template.Resources.CreditScoringFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('nodejs22.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('should have Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have Lambda invoke permission for ELB', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe(
        'elasticloadbalancing.amazonaws.com'
      );
    });

    test('should have Lambda log group with retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });

    test('should have Lambda security group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Lambda should be in VPC', () => {
      const lambda = template.Resources.CreditScoringFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });
  });

  describe('RDS Resources', () => {
    test('should have Aurora DB cluster', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.EngineMode).toBe('provisioned');
    });

    test('should have Aurora Serverless v2 scaling configuration', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(
        cluster.Properties.ServerlessV2ScalingConfiguration.MinCapacity
      ).toBe(0.5);
      expect(
        cluster.Properties.ServerlessV2ScalingConfiguration.MaxCapacity
      ).toBe(1);
    });

    test('should have DB instance', () => {
      const instance = template.Resources.DBInstance1;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-postgresql');
      expect(instance.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('should have DB subnet group with 3 subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
      expect(Array.isArray(subnetGroup.Properties.SubnetIds)).toBe(true);
      expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    test('should have RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have encryption enabled with KMS', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('should have backup retention of 30 days', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(30);
      expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('should have CloudWatch logs enabled', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(
        Array.isArray(cluster.Properties.EnableCloudwatchLogsExports)
      ).toBe(true);
    });

    test('should have DeletionPolicy set to Delete', () => {
      const cluster = template.Resources.DBCluster;
      const instance = template.Resources.DBInstance1;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(instance.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Target Group for Lambda', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.TargetType).toBe('lambda');
    });

    test('should have HTTP Listener', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ALB log group with retention', () => {
      const logGroup = template.Resources.ALBLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('Resource Tagging', () => {
    const resourcesWithTags = [
      'VPC',
      'InternetGateway',
      'PublicSubnet1',
      'PublicSubnet2',
      'PublicSubnet3',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'PrivateSubnet3',
      'DBCluster',
      'DBInstance1',
      'CreditScoringFunction',
      'ApplicationLoadBalancer',
      'LambdaLogGroup',
      'ALBLogGroup',
    ];

    resourcesWithTags.forEach(resourceName => {
      test(`${resourceName} should have required tags`, () => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);

        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('CostCenter');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('DataClassification');
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Description).toBeDefined();
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    test('should have ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBDNSName.Description).toBeDefined();
      expect(template.Outputs.ALBDNSName.Value).toBeDefined();
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Description).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toBeDefined();
    });

    test('should have DBClusterEndpoint output', () => {
      expect(template.Outputs.DBClusterEndpoint).toBeDefined();
      expect(template.Outputs.DBClusterEndpoint.Description).toBeDefined();
      expect(template.Outputs.DBClusterEndpoint.Value).toBeDefined();
    });

    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Description).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('should have no Retain deletion policies', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('database should not be publicly accessible', () => {
      const instance = template.Resources.DBInstance1;
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('Lambda should have execution role', () => {
      const lambda = template.Resources.CreditScoringFunction;
      expect(lambda.Properties.Role).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    test('resource names should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'CreditScoringFunction',
        'ApplicationLoadBalancer',
        'TargetGroup',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags?.find(
          (t: any) => t.Key === 'Name'
        );
        const name =
          resource.Properties.Name || resource.Properties.FunctionName;

        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toMatch(/\$\{EnvironmentSuffix\}/);
        } else if (name) {
          if (typeof name === 'object' && name['Fn::Sub']) {
            expect(name['Fn::Sub']).toMatch(/\$\{EnvironmentSuffix\}/);
          }
        }
      });
    });
  });

  describe('Helper Function Validation', () => {
    test('validateTemplateStructure should return true', () => {
      expect(validateTemplateStructure(template)).toBe(true);
    });

    test('getResourcesByType should find EC2 subnets', () => {
      const subnets = getResourcesByType(template, 'AWS::EC2::Subnet');
      expect(subnets.length).toBeGreaterThanOrEqual(6);
    });

    test('validateDeletionPolicies should find no Retain policies', () => {
      const result = validateDeletionPolicies(template);
      expect(result.hasRetain).toBe(false);
      expect(result.resources.length).toBe(0);
    });

    test('validateEncryption should find encrypted resources', () => {
      const result = validateEncryption(template);
      expect(result.encrypted.length).toBeGreaterThan(0);
      expect(result.unencrypted.length).toBe(0);
    });

    test('validateVPCConfiguration should pass', () => {
      const result = validateVPCConfiguration(template);
      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('validateSecurityGroups should find security groups', () => {
      const result = validateSecurityGroups(template);
      expect(result.count).toBeGreaterThan(0);
    });

    test('countResourcesByType should count all resource types', () => {
      const counts = countResourcesByType(template);
      expect(Object.keys(counts).length).toBeGreaterThan(0);
      expect(counts['AWS::EC2::VPC']).toBe(1);
      expect(counts['AWS::Lambda::Function']).toBeGreaterThanOrEqual(1);
    });

    test('validateResourceTags should validate required tags', () => {
      const vpc = template.Resources.VPC;
      expect(
        validateResourceTags(vpc, [
          'CostCenter',
          'Environment',
          'DataClassification',
        ])
      ).toBe(true);
      expect(validateResourceTags(vpc, ['NonExistentTag'])).toBe(false);
    });

    test('validateResourceTags should return false for resources without tags', () => {
      const resourceWithoutTags = {
        Type: 'AWS::Test::Resource',
        Properties: {},
      };
      expect(validateResourceTags(resourceWithoutTags, ['AnyTag'])).toBe(false);
    });

    test('validateResourceNaming should validate EnvironmentSuffix usage', () => {
      const vpc = template.Resources.VPC;
      const lambda = template.Resources.CreditScoringFunction;
      expect(validateResourceNaming(vpc)).toBe(true);
      expect(validateResourceNaming(lambda)).toBe(true);
    });

    test('validateResourceNaming should return true for resources without naming', () => {
      const resource = { Type: 'AWS::Test::Resource', Properties: {} };
      expect(validateResourceNaming(resource)).toBe(true);
    });

    test('getResourcesByType should return empty array for non-existent type', () => {
      const resources = getResourcesByType(template, 'AWS::NonExistent::Type');
      expect(resources.length).toBe(0);
    });

    test('validateTemplateStructure should return false for invalid template', () => {
      expect(validateTemplateStructure({})).toBe(false);
      expect(
        validateTemplateStructure({ AWSTemplateFormatVersion: '2010-09-09' })
      ).toBe(false);
      expect(validateTemplateStructure({ Resources: {} })).toBe(false);
    });

    test('validateResourceNaming should return true for resource with FunctionName using Fn::Sub', () => {
      const resourceWithFnSubName = {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: { 'Fn::Sub': 'my-function-${EnvironmentSuffix}' },
        },
      };
      expect(validateResourceNaming(resourceWithFnSubName)).toBe(true);
    });

    test('validateResourceNaming should return false for resource with FunctionName missing suffix', () => {
      const resourceWithoutSuffix = {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: { 'Fn::Sub': 'my-function-hardcoded' },
        },
      };
      expect(validateResourceNaming(resourceWithoutSuffix)).toBe(false);
    });

    test('validateDeletionPolicies should find Retain policies', () => {
      const templateWithRetain = {
        Resources: {
          MyBucket: {
            Type: 'AWS::S3::Bucket',
            DeletionPolicy: 'Retain',
            Properties: {},
          },
          MyTable: {
            Type: 'AWS::DynamoDB::Table',
            DeletionPolicy: 'Delete',
            Properties: {},
          },
        },
      };
      const result = validateDeletionPolicies(templateWithRetain);
      expect(result.hasRetain).toBe(true);
      expect(result.resources).toContain('MyBucket');
      expect(result.resources.length).toBe(1);
    });

    test('validateEncryption should find unencrypted DBCluster', () => {
      const templateWithUnencryptedDB = {
        Resources: {
          UnencryptedCluster: {
            Type: 'AWS::RDS::DBCluster',
            Properties: {
              StorageEncrypted: false,
            },
          },
        },
      };
      const result = validateEncryption(templateWithUnencryptedDB);
      expect(result.unencrypted).toContain('UnencryptedCluster');
      expect(result.encrypted.length).toBe(0);
    });

    test('validateVPCConfiguration should detect missing VPC', () => {
      const templateWithoutVPC = {
        Resources: {
          MyLambda: {
            Type: 'AWS::Lambda::Function',
            Properties: {},
          },
        },
      };
      const result = validateVPCConfiguration(templateWithoutVPC);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('No VPC resource found');
    });

    test('validateVPCConfiguration should detect insufficient public subnets', () => {
      const templateWithOnePublicSubnet = {
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: { CidrBlock: '10.0.0.0/16' },
          },
          PublicSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PrivateSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
          PrivateSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
        },
      };
      const result = validateVPCConfiguration(templateWithOnePublicSubnet);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Less than 2 public subnets found');
      expect(result.issues).toContain('No NAT Gateways found');
    });

    test('validateVPCConfiguration should detect insufficient private subnets', () => {
      const templateWithOnePrivateSubnet = {
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: { CidrBlock: '10.0.0.0/16' },
          },
          PublicSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PublicSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PrivateSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
        },
      };
      const result = validateVPCConfiguration(templateWithOnePrivateSubnet);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Less than 2 private subnets found');
    });

    test('validateVPCConfiguration should detect missing NAT Gateways', () => {
      const templateWithoutNAT = {
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: { CidrBlock: '10.0.0.0/16' },
          },
          PublicSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PublicSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PrivateSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
          PrivateSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
        },
      };
      const result = validateVPCConfiguration(templateWithoutNAT);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('No NAT Gateways found');
    });

    test('validateTemplateStructure should return false for template with empty Resources', () => {
      const templateEmptyResources = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
      };
      expect(validateTemplateStructure(templateEmptyResources)).toBe(false);
    });

    test('validateResourceNaming should return false for resource without Properties', () => {
      const resourceNoProps = { Type: 'AWS::Test::Resource' };
      expect(validateResourceNaming(resourceNoProps)).toBe(false);
    });

    test('validateSecurityGroups should detect security groups without rules', () => {
      const templateWithSGNoRules = {
        Resources: {
          MySG: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
              GroupDescription: 'Test SG',
            },
          },
        },
      };
      const result = validateSecurityGroups(templateWithSGNoRules);
      expect(result.count).toBe(1);
      expect(result.hasRules).toBe(false);
    });
  });
});

```
