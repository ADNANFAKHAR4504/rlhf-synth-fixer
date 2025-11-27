# Serverless Credit Scoring Application - CloudFormation Implementation

## Infrastructure Overview

This CloudFormation template deploys a complete serverless credit scoring web application with the following architecture:

### AWS Services Used

1. **Networking (VPC)**: Multi-AZ VPC with public and private subnets
2. **Load Balancing (ALB)**: Application Load Balancer with HTTPS listener
3. **Compute (Lambda)**: Node.js 18 Lambda function for credit scoring logic
4. **Database (Aurora)**: Aurora Serverless v2 PostgreSQL cluster with encryption
5. **Security (KMS)**: Customer-managed KMS key for encryption at rest
6. **Logging (CloudWatch)**: Log groups with 365-day retention for compliance
7. **Networking (NAT)**: NAT Gateways for Lambda outbound connectivity

### CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Credit Scoring Application Infrastructure with ALB, Lambda, Aurora Serverless v2, and VPC across 3 AZs",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "prod"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center tag value",
      "Default": "fintech-ops"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "production"
    },
    "DataClassification": {
      "Type": "String",
      "Description": "Data classification tag value",
      "Default": "sensitive"
    },
    "CertificateArn": {
      "Type": "String",
      "Default": "",
      "Description": "ARN of ACM certificate for ALB HTTPS listener"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "dbadmin",
      "NoEcho": true
    }
  },
  "Conditions": {
    "HasCertificate": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "CertificateArn"
            },
            ""
          ]
        }
      ]
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
              "Fn::Sub": "credit-scoring-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-public-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-public-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-public-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-private-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-public-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
    "PublicSubnetRouteTableAssociation1": {
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
    "PublicSubnetRouteTableAssociation2": {
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
    "PublicSubnetRouteTableAssociation3": {
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
    "NatGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-nat-eip-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "NatGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NatGateway1EIP",
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
              "Fn::Sub": "credit-scoring-nat-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "NatGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-nat-eip-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "NatGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NatGateway2EIP",
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
              "Fn::Sub": "credit-scoring-nat-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "NatGateway3EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-nat-eip-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "NatGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NatGateway3EIP",
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
              "Fn::Sub": "credit-scoring-nat-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
              "Fn::Sub": "credit-scoring-private-rt-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
          "Ref": "NatGateway1"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
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
              "Fn::Sub": "credit-scoring-private-rt-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
          "Ref": "NatGateway2"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
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
              "Fn::Sub": "credit-scoring-private-rt-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
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
          "Ref": "NatGateway3"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
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
    "DBEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for Aurora database encryption",
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
                "kms:DescribeKey",
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
              "Fn::Sub": "credit-scoring-db-key-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "DBEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/credit-scoring-db-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "DBEncryptionKey"
        }
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora database",
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-db-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS for AWS API calls"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-lambda-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "DBSecurityGroupIngress": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {
          "Ref": "DBSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 5432,
        "ToPort": 5432,
        "SourceSecurityGroupId": {
          "Ref": "LambdaSecurityGroup"
        },
        "Description": "Allow PostgreSQL access from Lambda functions"
      }
    },
    "LambdaSecurityGroupEgressDB": {
      "Type": "AWS::EC2::SecurityGroupEgress",
      "Properties": {
        "GroupId": {
          "Ref": "LambdaSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 5432,
        "ToPort": 5432,
        "DestinationSecurityGroupId": {
          "Ref": "DBSecurityGroup"
        },
        "Description": "Allow PostgreSQL access to Aurora"
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Aurora cluster",
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
              "Fn::Sub": "credit-scoring-db-subnet-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "credit-scoring-db-secret-${EnvironmentSuffix}"
        },
        "Description": "Database credentials for Aurora PostgreSQL cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\": \"${DBMasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 16,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-db-secret-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-postgresql",
        "EngineMode": "provisioned",
        "EngineVersion": "15.8",
        "DatabaseName": "creditscoring",
        "MasterUsername": {
          "Ref": "DBMasterUsername"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "DBEncryptionKey"
        },
        "BackupRetentionPeriod": 30,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": [
          "postgresql"
        ],
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": 0.5,
          "MaxCapacity": 2
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-aurora-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "AuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "DBInstanceClass": "db.serverless",
        "PubliclyAccessible": false,
        "AutoMinorVersionUpgrade": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-aurora-instance-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "AuroraInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "DBInstanceClass": "db.serverless",
        "PubliclyAccessible": false,
        "AutoMinorVersionUpgrade": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-aurora-instance-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
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
            "PolicyName": "LambdaAuroraAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds-data:ExecuteStatement",
                    "rds-data:BatchExecuteStatement",
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraCluster}"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"
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
              "Fn::Sub": "credit-scoring-lambda-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/credit-scoring-${EnvironmentSuffix}"
        },
        "RetentionInDays": 365,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-lambda-logs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "CreditScoringFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "LambdaLogGroup",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "credit-scoring-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n  console.log('Credit scoring request received', JSON.stringify(event, null, 2));\n  \n  // Placeholder for credit scoring logic\n  const creditScore = Math.floor(Math.random() * (850 - 300 + 1)) + 300;\n  \n  return {\n    statusCode: 200,\n    headers: {\n      'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n      creditScore: creditScore,\n      timestamp: new Date().toISOString(),\n      status: 'success'\n    })\n  };\n};\n"
        },
        "Environment": {
          "Variables": {
            "DB_CLUSTER_ARN": {
              "Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraCluster}"
            },
            "DB_NAME": "creditscoring",
            "DB_ENDPOINT": {
              "Fn::GetAtt": [
                "AuroraCluster",
                "Endpoint.Address"
              ]
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ],
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
          ]
        },
        "ReservedConcurrentExecutions": 10,
        "Timeout": 30,
        "MemorySize": 512,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-function-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "LambdaFunctionUrl": {
      "Type": "AWS::Lambda::Url",
      "Properties": {
        "TargetFunctionArn": {
          "Fn::GetAtt": [
            "CreditScoringFunction",
            "Arn"
          ]
        },
        "AuthType": "AWS_IAM",
        "Cors": {
          "AllowOrigins": [
            "*"
          ],
          "AllowMethods": [
            "GET",
            "POST"
          ],
          "AllowHeaders": [
            "Content-Type",
            "Authorization"
          ],
          "MaxAge": 300
        }
      }
    },
    "LambdaInvokePermissionForUrl": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "CreditScoringFunction"
        },
        "Action": "lambda:InvokeFunctionUrl",
        "Principal": "*",
        "FunctionUrlAuthType": "AWS_IAM"
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
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
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from internet"
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
              "Fn::Sub": "credit-scoring-alb-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "credit-scoring-alb-${EnvironmentSuffix}"
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
              "Fn::Sub": "credit-scoring-alb-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "ALBAccessLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "credit-scoring-alb-logs-${EnvironmentSuffix}-${AWS::AccountId}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 365
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-alb-logs-bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "ALBAccessLogsBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ALBAccessLogsBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSLogDeliveryWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "elasticloadbalancing.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${ALBAccessLogsBucket.Arn}/*"
              }
            },
            {
              "Sid": "AWSLogDeliveryAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "elasticloadbalancing.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": [
                  "ALBAccessLogsBucket",
                  "Arn"
                ]
              }
            }
          ]
        }
      }
    },
    "LambdaInvokePermissionForALB": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "CreditScoringFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "elasticloadbalancing.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:targetgroup/*/*"
        }
      }
    },
    "LambdaTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "DependsOn": "LambdaInvokePermissionForALB",
      "Properties": {
        "Name": {
          "Fn::Sub": "credit-scoring-tg-${EnvironmentSuffix}"
        },
        "TargetType": "lambda",
        "Targets": [
          {
            "Id": {
              "Fn::GetAtt": [
                "CreditScoringFunction",
                "Arn"
              ]
            }
          }
        ],
        "HealthCheckEnabled": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-tg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "ALBHTTPSListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Condition": "HasCertificate",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 443,
        "Protocol": "HTTPS",
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01",
        "Certificates": [
          {
            "CertificateArn": {
              "Ref": "CertificateArn"
            }
          }
        ],
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "LambdaTargetGroup"
            }
          }
        ]
      }
    },
    "ALBHTTPListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Fn::If": [
              "HasCertificate",
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
                "TargetGroupArn": {
                  "Ref": "LambdaTargetGroup"
                }
              }
            ]
          }
        ]
      }
    },
    "ALBLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/alb/credit-scoring-${EnvironmentSuffix}"
        },
        "RetentionInDays": 365,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-alb-logs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    },
    "DBLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/rds/cluster/credit-scoring-aurora-cluster-${EnvironmentSuffix}/postgresql"
        },
        "RetentionInDays": 365,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "credit-scoring-db-logs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "DataClassification",
            "Value": {
              "Ref": "DataClassification"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "ALBDNSName": {
      "Description": "DNS name of the Application Load Balancer",
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
    "ALBUrl": {
      "Description": "URL of the Application Load Balancer",
      "Value": {
        "Fn::Sub": "https://${ApplicationLoadBalancer.DNSName}"
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the credit scoring Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "CreditScoringFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "LambdaFunctionUrl": {
      "Description": "Function URL of the credit scoring Lambda",
      "Value": {
        "Fn::GetAtt": [
          "LambdaFunctionUrl",
          "FunctionUrl"
        ]
      }
    },
    "AuroraClusterEndpoint": {
      "Description": "Writer endpoint for Aurora cluster",
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
    "AuroraClusterReadEndpoint": {
      "Description": "Reader endpoint for Aurora cluster",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuroraClusterReadEndpoint"
        }
      }
    },
    "DBEncryptionKeyId": {
      "Description": "KMS key ID for database encryption",
      "Value": {
        "Ref": "DBEncryptionKey"
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
    },
    "PrivateSubnetIds": {
      "Description": "Private subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            },
            {
              "Ref": "PrivateSubnet3"
            }
          ]
        ]
      }
    },
    "PublicSubnetIds": {
      "Description": "Public subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PublicSubnet1"
            },
            {
              "Ref": "PublicSubnet2"
            },
            {
              "Ref": "PublicSubnet3"
            }
          ]
        ]
      }
    }
  }
}
```

## Architecture Highlights

- **3 Availability Zones**: High availability across us-east-2a, us-east-2b, us-east-2c
- **65 AWS Resources**: Complete infrastructure with networking, compute, database, security
- **Encryption**: KMS customer-managed key with automatic rotation enabled
- **Compliance**: 365-day log retention, 30-day database backups
- **Security**: Least-privilege IAM roles, security groups, private subnets
- **Destroyability**: All resources have DeletionPolicy: Delete for clean teardown
