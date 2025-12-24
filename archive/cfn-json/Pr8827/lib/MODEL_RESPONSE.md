# CloudFormation Multi-AZ VPC Migration Infrastructure

This CloudFormation template creates a complete multi-AZ VPC infrastructure for migrating a payment processing system from a single-AZ setup to a highly available multi-AZ configuration.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-AZ VPC infrastructure for payment processing migration with proper isolation and cost optimization",
  "Parameters": {
    "VpcCidr": {
      "Type": "String",
      "Default": "172.16.0.0/16",
      "Description": "CIDR block for the new VPC",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "AllowedPattern": "^[a-z0-9-]+$",
      "MinLength": 3,
      "MaxLength": 20
    },
    "Environment": {
      "Type": "String",
      "Default": "production",
      "Description": "Environment name for resource tagging",
      "AllowedValues": ["development", "staging", "production"]
    },
    "Project": {
      "Type": "String",
      "Default": "payment-migration",
      "Description": "Project name for cost allocation tagging"
    },
    "Owner": {
      "Type": "String",
      "Description": "Team or individual responsible for these resources"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCidr"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
              "Fn::Sub": "igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
    "PublicSubnetA": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            0,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
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
              "Fn::Sub": "public-subnet-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PublicSubnetB": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            1,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
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
              "Fn::Sub": "public-subnet-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PublicSubnetC": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            2,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
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
              "Fn::Sub": "public-subnet-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PrivateSubnetA": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            3,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
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
              "Fn::Sub": "private-subnet-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PrivateSubnetB": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            4,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
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
              "Fn::Sub": "private-subnet-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PrivateSubnetC": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            5,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
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
              "Fn::Sub": "private-subnet-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "EIPA": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-natgw-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "EIPB": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-natgw-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "EIPC": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-natgw-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "NATGatewayA": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPA",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnetA"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "natgw-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "NATGatewayB": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPB",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnetB"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "natgw-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "NATGatewayC": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPC",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnetC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "natgw-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
              "Fn::Sub": "public-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
    "PublicSubnetARouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetA"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnetBRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetB"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnetCRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetC"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTableA": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PrivateRouteA": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTableA"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGatewayA"
        }
      }
    },
    "PrivateSubnetARouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetA"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTableA"
        }
      }
    },
    "PrivateRouteTableB": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PrivateRouteB": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTableB"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGatewayB"
        }
      }
    },
    "PrivateSubnetBRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetB"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTableB"
        }
      }
    },
    "PrivateRouteTableC": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "PrivateRouteC": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTableC"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGatewayC"
        }
      }
    },
    "PrivateSubnetCRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetC"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTableC"
        }
      }
    },
    "WebTierSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "web-tier-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for web tier allowing HTTPS traffic from internet",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS traffic from internet"
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
              "Fn::Sub": "web-tier-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "DatabaseTierSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "database-tier-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for database tier allowing PostgreSQL traffic only from web tier",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {
              "Ref": "WebTierSecurityGroup"
            },
            "Description": "Allow PostgreSQL traffic from web tier only"
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
              "Fn::Sub": "database-tier-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "MigrationLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "migration-logs-${EnvironmentSuffix}"
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
              "Fn::Sub": "migration-logs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "Project"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          }
        ]
      }
    },
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "VpcEndpointType": "Gateway",
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTableA"
          },
          {
            "Ref": "PrivateRouteTableB"
          },
          {
            "Ref": "PrivateRouteTableC"
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID for the new multi-AZ environment",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PublicSubnetAId": {
      "Description": "Public Subnet A ID in first availability zone",
      "Value": {
        "Ref": "PublicSubnetA"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetAId"
        }
      }
    },
    "PublicSubnetBId": {
      "Description": "Public Subnet B ID in second availability zone",
      "Value": {
        "Ref": "PublicSubnetB"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetBId"
        }
      }
    },
    "PublicSubnetCId": {
      "Description": "Public Subnet C ID in third availability zone",
      "Value": {
        "Ref": "PublicSubnetC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetCId"
        }
      }
    },
    "PrivateSubnetAId": {
      "Description": "Private Subnet A ID in first availability zone",
      "Value": {
        "Ref": "PrivateSubnetA"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetAId"
        }
      }
    },
    "PrivateSubnetBId": {
      "Description": "Private Subnet B ID in second availability zone",
      "Value": {
        "Ref": "PrivateSubnetB"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetBId"
        }
      }
    },
    "PrivateSubnetCId": {
      "Description": "Private Subnet C ID in third availability zone",
      "Value": {
        "Ref": "PrivateSubnetC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetCId"
        }
      }
    },
    "WebTierSecurityGroupId": {
      "Description": "Security Group ID for web tier (HTTPS from internet)",
      "Value": {
        "Ref": "WebTierSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WebTierSecurityGroupId"
        }
      }
    },
    "DatabaseTierSecurityGroupId": {
      "Description": "Security Group ID for database tier (PostgreSQL from web tier only)",
      "Value": {
        "Ref": "DatabaseTierSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseTierSecurityGroupId"
        }
      }
    },
    "MigrationLogsBucketName": {
      "Description": "S3 bucket name for migration logs",
      "Value": {
        "Ref": "MigrationLogsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MigrationLogsBucketName"
        }
      }
    },
    "MigrationLogsBucketArn": {
      "Description": "S3 bucket ARN for migration logs",
      "Value": {
        "Fn::GetAtt": [
          "MigrationLogsBucket",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MigrationLogsBucketArn"
        }
      }
    },
    "S3VPCEndpointId": {
      "Description": "VPC Endpoint ID for S3 service",
      "Value": {
        "Ref": "S3VPCEndpoint"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3VPCEndpointId"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Multi-AZ VPC Migration Infrastructure

This CloudFormation template creates a complete multi-AZ VPC infrastructure for migrating payment processing systems from single-AZ to highly available multi-AZ configuration.

## Architecture Overview

The template deploys:
- 1 VPC with configurable CIDR block
- 3 Public Subnets across 3 Availability Zones
- 3 Private Subnets across 3 Availability Zones
- 1 Internet Gateway
- 3 NAT Gateways (one per AZ for high availability)
- Route Tables for public and private subnets
- Security Groups for web tier (HTTPS) and database tier (PostgreSQL)
- S3 bucket for migration logs with versioning and encryption
- VPC Endpoint for S3 (cost optimization)

## Prerequisites

- AWS CLI configured with appropriate credentials
- IAM permissions for VPC, EC2, S3, and CloudFormation services
- Available Elastic IP addresses (3 required for NAT Gateways)

## Deployment Instructions

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name payment-migration-vpc \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=VpcCidr,ParameterValue=172.16.0.0/16 \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Project,ParameterValue=payment-migration \
    ParameterKey=Owner,ParameterValue=infrastructure-team \
  --region us-east-1
```

### Using AWS Console

1. Navigate to CloudFormation in AWS Console
2. Click "Create Stack" > "With new resources"
3. Upload the `lib/TapStack.json` template
4. Fill in the parameters:
   - **VpcCidr**: CIDR block for VPC (default: 172.16.0.0/16)
   - **EnvironmentSuffix**: Unique suffix for resource naming (e.g., prod-001)
   - **Environment**: Environment name (development/staging/production)
   - **Project**: Project name for cost allocation
   - **Owner**: Team or individual responsible for resources
5. Review and create the stack

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| VpcCidr | String | 172.16.0.0/16 | CIDR block for the VPC |
| EnvironmentSuffix | String | (required) | Unique suffix for resource naming |
| Environment | String | production | Environment name for tagging |
| Project | String | payment-migration | Project name for cost allocation |
| Owner | String | (required) | Team or individual owner |

## Outputs

The template exports the following outputs for use in subsequent migration steps:

| Output | Description |
|--------|-------------|
| VPCId | VPC ID for the new multi-AZ environment |
| PublicSubnetAId | Public Subnet A ID in first AZ |
| PublicSubnetBId | Public Subnet B ID in second AZ |
| PublicSubnetCId | Public Subnet C ID in third AZ |
| PrivateSubnetAId | Private Subnet A ID in first AZ |
| PrivateSubnetBId | Private Subnet B ID in second AZ |
| PrivateSubnetCId | Private Subnet C ID in third AZ |
| WebTierSecurityGroupId | Security Group ID for web tier |
| DatabaseTierSecurityGroupId | Security Group ID for database tier |
| MigrationLogsBucketName | S3 bucket name for migration logs |
| MigrationLogsBucketArn | S3 bucket ARN for migration logs |
| S3VPCEndpointId | VPC Endpoint ID for S3 service |

## Security Features

1. **Least Privilege Security Groups**: Database tier only accepts connections from web tier
2. **Private Subnets**: Database and sensitive resources isolated from internet
3. **NAT Gateways**: Outbound internet access for private resources without direct exposure
4. **S3 Encryption**: Migration logs encrypted at rest with AWS managed keys
5. **VPC Endpoints**: S3 access without traversing public internet

## Cost Optimization

- **VPC Endpoint for S3**: Reduces data transfer costs by keeping traffic within AWS network
- **Multi-AZ NAT Gateways**: While more expensive, provides high availability required for production payment processing

## Validation

After deployment, verify the stack:

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name payment-migration-vpc \
  --region us-east-1

# List stack outputs
aws cloudformation describe-stacks \
  --stack-name payment-migration-vpc \
  --query 'Stacks[0].Outputs' \
  --region us-east-1

# Verify VPC
aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=vpc-*" \
  --region us-east-1

# Verify NAT Gateways are active
aws ec2 describe-nat-gateways \
  --filter "Name=state,Values=available" \
  --region us-east-1
```

## Next Steps

After successful deployment:

1. Use the VPC ID and subnet IDs to launch EC2 instances
2. Create RDS instances in private subnets using the database security group
3. Configure application load balancers in public subnets
4. Migrate data from legacy VPC to new infrastructure
5. Update DNS records to point to new environment
6. Decommission legacy single-AZ infrastructure

## Cleanup

To delete the stack and all resources:

```bash
# Empty S3 bucket first (versioned buckets require special handling)
aws s3 rm s3://migration-logs-<environment-suffix> --recursive
aws s3api delete-bucket-versioning \
  --bucket migration-logs-<environment-suffix>

# Delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name payment-migration-vpc \
  --region us-east-1
```

## Tags

All resources are tagged with:
- **Environment**: Environment name (production/staging/development)
- **Project**: Project name for cost allocation
- **Owner**: Team or individual responsible for resources

These tags enable cost tracking and resource management across the organization.
```
