# VPC Infrastructure for Financial Services Platform

Thanks for reaching out about setting up the networking foundation for your microservices platform. I'll help you create a secure VPC infrastructure using CloudFormation that meets all your requirements for network isolation and high availability.

## Solution Overview

I've designed a production-ready VPC with comprehensive network segmentation across three availability zones. The architecture includes public and private subnets, high-availability NAT Gateways, VPC Flow Logs for security monitoring, and custom Network ACLs to enforce security policies.

## Architecture Components

**VPC Configuration**:
- VPC with 10.0.0.0/16 CIDR block
- DNS support and DNS hostnames enabled
- DHCP options configured with AmazonProvidedDNS

**Subnet Strategy**:
- 3 Public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) across availability zones
- 3 Private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) across availability zones
- Public subnets auto-assign public IPs for EC2 instances
- Dynamic availability zone selection using Fn::Select and Fn::GetAZs

**High Availability NAT Strategy**:
- 3 NAT Gateways deployed in each public subnet
- Each private subnet routes through its AZ-specific NAT Gateway
- Elastic IPs allocated for each NAT Gateway with proper DependsOn

**Security Controls**:
- VPC Flow Logs capturing ALL traffic to CloudWatch Logs
- Custom Network ACLs denying inbound SSH from 0.0.0.0/0
- CloudWatch Log Group with 7-day retention
- IAM role with least-privilege permissions scoped to specific log group

**Route Configuration**:
- Public route table routing 0.0.0.0/0 to Internet Gateway with DependsOn
- Private route tables routing 0.0.0.0/0 to respective NAT Gateways

## CloudFormation Template

Here's the complete implementation using **CloudFormation JSON**:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production VPC Infrastructure with High-Availability NAT Gateways, Network Segmentation, and Security Controls for Financial Services Microservices Platform",
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
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "DHCPOptions": {
      "Type": "AWS::EC2::DHCPOptions",
      "Properties": {
        "DomainNameServers": [
          "AmazonProvidedDNS"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dhcp-options-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "VPCDHCPOptionsAssociation": {
      "Type": "AWS::EC2::VPCDHCPOptionsAssociation",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "DhcpOptionsId": {
          "Ref": "DHCPOptions"
        }
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
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "VPCGatewayAttachment": {
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
        "CidrBlock": "10.0.0.0/24",
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
            "Key": "Type",
            "Value": "Public"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
        "CidrBlock": "10.0.1.0/24",
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
            "Key": "Type",
            "Value": "Public"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
        "CidrBlock": "10.0.2.0/24",
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
            "Key": "Type",
            "Value": "Public"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
        "CidrBlock": "10.0.10.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "EIPNatGatewayA": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "EIPNatGatewayB": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "EIPNatGatewayC": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "NatGatewayA": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPNatGatewayA",
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
              "Fn::Sub": "nat-gateway-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "NatGatewayB": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPNatGatewayB",
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
              "Fn::Sub": "nat-gateway-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "NatGatewayC": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPNatGatewayC",
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
              "Fn::Sub": "nat-gateway-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
              "Fn::Sub": "public-route-table-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "VPCGatewayAttachment",
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
              "Fn::Sub": "private-route-table-a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
          "Ref": "NatGatewayA"
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
              "Fn::Sub": "private-route-table-b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
          "Ref": "NatGatewayB"
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
              "Fn::Sub": "private-route-table-c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
          "Ref": "NatGatewayC"
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
    "NetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "network-acl-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "NetworkAclEntryInboundSSHDeny": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        },
        "RuleNumber": 100,
        "Protocol": 6,
        "RuleAction": "deny",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 22,
          "To": 22
        }
      }
    },
    "NetworkAclEntryInboundAllowAll": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        },
        "RuleNumber": 200,
        "Protocol": -1,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "NetworkAclEntryOutboundAllowAll": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        },
        "RuleNumber": 100,
        "Protocol": -1,
        "RuleAction": "allow",
        "Egress": true,
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "PublicSubnetANetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetA"
        },
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        }
      }
    },
    "PublicSubnetBNetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetB"
        },
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        }
      }
    },
    "PublicSubnetCNetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetC"
        },
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        }
      }
    },
    "PrivateSubnetANetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetA"
        },
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        }
      }
    },
    "PrivateSubnetBNetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetB"
        },
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        }
      }
    },
    "PrivateSubnetCNetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetC"
        },
        "NetworkAclId": {
          "Ref": "NetworkAcl"
        }
      }
    },
    "VPCFlowLogsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/flowlogs-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flowlogs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
          }
        ]
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "vpc-flowlogs-role-${EnvironmentSuffix}"
        },
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
                  "Resource": {
                    "Fn::GetAtt": [
                      "VPCFlowLogsLogGroup",
                      "Arn"
                    ]
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
              "Fn::Sub": "vpc-flowlogs-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {
          "Ref": "VPCFlowLogsLogGroup"
        },
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": [
            "VPCFlowLogsRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flowlog-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Infrastructure"
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
    "PublicSubnetAId": {
      "Description": "Public Subnet A ID (us-east-1a)",
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
      "Description": "Public Subnet B ID (us-east-1b)",
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
      "Description": "Public Subnet C ID (us-east-1c)",
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
      "Description": "Private Subnet A ID (us-east-1a)",
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
      "Description": "Private Subnet B ID (us-east-1b)",
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
      "Description": "Private Subnet C ID (us-east-1c)",
      "Value": {
        "Ref": "PrivateSubnetC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetCId"
        }
      }
    },
    "NatGatewayAId": {
      "Description": "NAT Gateway A ID (us-east-1a)",
      "Value": {
        "Ref": "NatGatewayA"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NatGatewayAId"
        }
      }
    },
    "NatGatewayBId": {
      "Description": "NAT Gateway B ID (us-east-1b)",
      "Value": {
        "Ref": "NatGatewayB"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NatGatewayBId"
        }
      }
    },
    "NatGatewayCId": {
      "Description": "NAT Gateway C ID (us-east-1c)",
      "Value": {
        "Ref": "NatGatewayC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NatGatewayCId"
        }
      }
    },
    "InternetGatewayId": {
      "Description": "Internet Gateway ID",
      "Value": {
        "Ref": "InternetGateway"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-InternetGatewayId"
        }
      }
    },
    "VPCFlowLogsLogGroupName": {
      "Description": "CloudWatch Log Group for VPC Flow Logs",
      "Value": {
        "Ref": "VPCFlowLogsLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCFlowLogsLogGroupName"
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

## Deployment Instructions

1. Deploy the infrastructure:
   ```bash
   aws cloudformation deploy \
     --template-file lib/TapStack.json \
     --stack-name TapStackdev \
     --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
     --parameter-overrides EnvironmentSuffix=dev
   ```

2. Extract outputs:
   ```bash
   aws cloudformation describe-stacks --stack-name TapStackdev --query 'Stacks[0].Outputs' --output json | jq 'reduce .[] as $item ({}; .[$item.OutputKey] = $item.OutputValue)' > cfn-outputs/flat-outputs.json
   ```

3. Run integration tests:
   ```bash
   npm run test:integration
   ```

## Key Features

- **Multi-Environment Support**: EnvironmentSuffix parameter with validation enables dev/staging/prod deployments
- **Network Isolation**: Separate public and private subnets across 3 AZs provide strong network segmentation
- **High Availability**: 3 NAT Gateways ensure outbound connectivity remains available even if an entire AZ fails
- **Security Monitoring**: VPC Flow Logs capture all network traffic to CloudWatch for security analysis
- **SSH Protection**: Custom Network ACLs deny inbound SSH from the internet
- **Cost Tagging**: All resources tagged with Environment and CostCenter for cost allocation
- **Region Agnostic**: Uses Fn::GetAZs to dynamically select availability zones
- **Cross-Stack Integration**: Comprehensive outputs with exports for cross-stack references

## Stack Outputs

**Network Resources**:
- **VPCId**: The VPC identifier with export ${AWS::StackName}-VPCId
- **InternetGatewayId**: Internet Gateway ID for reference

**Public Subnets**:
- **PublicSubnetAId**, **PublicSubnetBId**, **PublicSubnetCId**: Public subnet IDs with exports

**Private Subnets**:
- **PrivateSubnetAId**, **PrivateSubnetBId**, **PrivateSubnetCId**: Private subnet IDs with exports

**NAT Gateways**:
- **NatGatewayAId**, **NatGatewayBId**, **NatGatewayCId**: NAT Gateway IDs with exports

**Monitoring**:
- **VPCFlowLogsLogGroupName**: CloudWatch Log Group for VPC Flow Logs

**Configuration**:
- **EnvironmentSuffix**: The suffix used for this deployment

All outputs include CloudFormation exports for cross-stack references using the pattern `${AWS::StackName}-{OutputName}`.

This solution provides a robust, scalable, and secure VPC foundation for your financial services microservices platform.
