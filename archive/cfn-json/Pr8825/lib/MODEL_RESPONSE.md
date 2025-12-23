# VPC Infrastructure for Financial Services Platform

Thanks for reaching out about setting up the networking foundation for your microservices platform. I'll help you create a secure VPC infrastructure using CloudFormation that meets all your requirements for network isolation and high availability.

## Solution Overview

I've designed a production-ready VPC with comprehensive network segmentation across three availability zones in us-east-1. The architecture includes public and private subnets, high-availability NAT Gateways, VPC Flow Logs for security monitoring, and custom Network ACLs to enforce security policies.

## Architecture Components

**VPC Configuration**:
- VPC with 10.0.0.0/16 CIDR block
- DNS support and DNS hostnames enabled
- DHCP options configured with AmazonProvidedDNS

**Subnet Strategy**:
- 3 Public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) across us-east-1a, 1b, 1c
- 3 Private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) across us-east-1a, 1b, 1c
- Public subnets auto-assign public IPs for EC2 instances

**High Availability NAT Strategy**:
- 3 NAT Gateways deployed in each public subnet
- Each private subnet routes through its AZ-specific NAT Gateway
- Elastic IPs allocated for each NAT Gateway

**Security Controls**:
- VPC Flow Logs capturing ALL traffic to CloudWatch Logs
- Custom Network ACLs denying inbound SSH from 0.0.0.0/0
- CloudWatch Log Group with 7-day retention

**Route Configuration**:
- Public route table routing 0.0.0.0/0 to Internet Gateway
- Private route tables routing 0.0.0.0/0 to respective NAT Gateways

## CloudFormation Template

Here's the complete implementation using **CloudFormation JSON**:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production VPC Infrastructure for Financial Services Microservices Platform",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming"
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
            "Value": "vpc-production"
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
            "Value": "dhcp-options-production"
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
            "Value": "igw-production"
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
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "public-subnet-a"
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
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "public-subnet-b"
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
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "public-subnet-c"
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
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-a"
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
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-b"
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
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-c"
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
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "eip-nat-a"
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
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "eip-nat-b"
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
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "eip-nat-c"
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
            "Value": "nat-gateway-a"
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
            "Value": "nat-gateway-b"
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
            "Value": "nat-gateway-c"
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
            "Value": "public-route-table"
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
            "Value": "private-route-table-a"
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
            "Value": "private-route-table-b"
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
            "Value": "private-route-table-c"
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
            "Value": "network-acl"
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
        "LogGroupName": "/aws/vpc/flowlogs",
        "RetentionInDays": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": "vpc-flowlogs"
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
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "vpc-flowlogs-role"
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
            "Value": "vpc-flowlog"
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
      }
    },
    "PublicSubnets": {
      "Description": "Public Subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PublicSubnetA"
            },
            {
              "Ref": "PublicSubnetB"
            },
            {
              "Ref": "PublicSubnetC"
            }
          ]
        ]
      }
    },
    "PrivateSubnets": {
      "Description": "Private Subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PrivateSubnetA"
            },
            {
              "Ref": "PrivateSubnetB"
            },
            {
              "Ref": "PrivateSubnetC"
            }
          ]
        ]
      }
    },
    "NatGateways": {
      "Description": "NAT Gateway IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "NatGatewayA"
            },
            {
              "Ref": "NatGatewayB"
            },
            {
              "Ref": "NatGatewayC"
            }
          ]
        ]
      }
    }
  }
}
```

## Deployment Instructions

1. Save the template as `TapStack.json`
2. Deploy using AWS CLI:
   ```bash
   aws cloudformation deploy \
     --template-file TapStack.json \
     --stack-name TapStackdev \
     --parameter-overrides EnvironmentSuffix=dev \
     --capabilities CAPABILITY_IAM
   ```

3. Monitor deployment:
   ```bash
   aws cloudformation describe-stacks --stack-name TapStackdev
   ```

4. Retrieve outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name TapStackdev \
     --query 'Stacks[0].Outputs'
   ```

## Key Features

- **Network Isolation**: Separate public and private subnets across 3 AZs provide strong network segmentation for development and production workloads
- **High Availability**: 3 NAT Gateways ensure outbound connectivity remains available even if an entire AZ fails
- **Security Monitoring**: VPC Flow Logs capture all network traffic to CloudWatch for security analysis and compliance auditing
- **SSH Protection**: Custom Network ACLs deny inbound SSH from the internet while allowing all other necessary traffic
- **Cost Tagging**: All resources tagged with Environment and CostCenter for cost allocation and management

## Stack Outputs

The template provides these outputs for reference by other stacks:
- **VPCId**: The VPC identifier for security group and resource associations
- **PublicSubnets**: Comma-separated list of public subnet IDs for load balancers and NAT gateways
- **PrivateSubnets**: Comma-separated list of private subnet IDs for application servers and databases
- **NatGateways**: Comma-separated list of NAT Gateway IDs for monitoring and cost tracking

This infrastructure provides a solid foundation for your microservices platform with the security controls and high availability required for financial services workloads.
