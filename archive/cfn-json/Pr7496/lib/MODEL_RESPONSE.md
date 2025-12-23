# VPC Network Architecture - CloudFormation Template

This CloudFormation template creates a production-grade VPC network architecture with multi-AZ deployment.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production VPC Network Architecture for Financial Services Application",

  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix",
            "Environment",
            "Department"
          ]
        }
      ]
    }
  },

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-zA-Z0-9]+$"
    },
    "Environment": {
      "Type": "String",
      "Default": "production",
      "Description": "Environment name for tagging"
    },
    "Department": {
      "Type": "String",
      "Default": "finance",
      "Description": "Department name for cost allocation"
    }
  },

  "Mappings": {
    "SubnetConfig": {
      "us-east-1": {
        "PublicSubnet1": "10.0.0.0/24",
        "PublicSubnet2": "10.0.1.0/24",
        "PublicSubnet3": "10.0.2.0/24",
        "PrivateSubnet1": "10.0.10.0/24",
        "PrivateSubnet2": "10.0.11.0/24",
        "PrivateSubnet3": "10.0.12.0/24"
      },
      "us-west-2": {
        "PublicSubnet1": "10.0.0.0/24",
        "PublicSubnet2": "10.0.1.0/24",
        "PublicSubnet3": "10.0.2.0/24",
        "PrivateSubnet1": "10.0.10.0/24",
        "PrivateSubnet2": "10.0.11.0/24",
        "PrivateSubnet3": "10.0.12.0/24"
      }
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
            "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Department",
            "Value": {"Ref": "Department"}
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
            "Value": "igw-production"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Department",
            "Value": {"Ref": "Department"}
          }
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
        "CidrBlock": {"Fn::FindInMap": ["SubnetConfig", {"Ref": "AWS::Region"}, "PublicSubnet1"]},
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "public-subnet-1a"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::FindInMap": ["SubnetConfig", {"Ref": "AWS::Region"}, "PublicSubnet2"]},
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "public-subnet-1b"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::FindInMap": ["SubnetConfig", {"Ref": "AWS::Region"}, "PublicSubnet3"]},
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "public-subnet-1c"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::FindInMap": ["SubnetConfig", {"Ref": "AWS::Region"}, "PrivateSubnet1"]},
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-1a"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::FindInMap": ["SubnetConfig", {"Ref": "AWS::Region"}, "PrivateSubnet2"]},
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-1b"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::FindInMap": ["SubnetConfig", {"Ref": "AWS::Region"}, "PrivateSubnet3"]},
        "AvailabilityZone": "us-east-1c",
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-1c"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "EIP1": {
      "Type": "AWS::EC2::EIP",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "eip-nat-1a"
          }
        ]
      }
    },

    "EIP2": {
      "Type": "AWS::EC2::EIP",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "eip-nat-1b"
          }
        ]
      }
    },

    "EIP3": {
      "Type": "AWS::EC2::EIP",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "eip-nat-1c"
          }
        ]
      }
    },

    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP1", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "nat-1a-production"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP2", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "nat-1b-production"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP3", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet3"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "nat-1c-production"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      }
    },

    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "public-rt"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
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
          {
            "Key": "Name",
            "Value": "private-rt-1a"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
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
          {
            "Key": "Name",
            "Value": "private-rt-1b"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
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
          {
            "Key": "Name",
            "Value": "private-rt-1c"
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
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

    "FlowLogsRole": {
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
        ]
      }
    },

    "FlowLogsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/aws/vpc/flowlogs",
        "RetentionInDays": 30
      }
    },

    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {"Ref": "VPC"},
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {"Ref": "FlowLogsLogGroup"},
        "DeliverLogsPermissionArn": {"Fn::GetAtt": ["FlowLogsRole", "Arn"]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "vpc-flow-logs"
          }
        ]
      }
    },

    "NetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "custom-nacl"
          }
        ]
      }
    },

    "InboundHTTPRule": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 100,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 80,
          "To": 80
        }
      }
    },

    "InboundHTTPSRule": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 110,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 443,
          "To": 443
        }
      }
    },

    "InboundSSHRule": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 120,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.0.0/8",
        "PortRange": {
          "From": 22,
          "To": 22
        }
      }
    },

    "OutboundRule": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    }
  },

  "Outputs": {
    "VPCID": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPCID"}
      }
    },
    "PublicSubnet1ID": {
      "Description": "Public Subnet 1 ID",
      "Value": {"Ref": "PublicSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet1"}
      }
    },
    "PublicSubnet2ID": {
      "Description": "Public Subnet 2 ID",
      "Value": {"Ref": "PublicSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet2"}
      }
    },
    "PublicSubnet3ID": {
      "Description": "Public Subnet 3 ID",
      "Value": {"Ref": "PublicSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet3"}
      }
    },
    "PrivateSubnet1ID": {
      "Description": "Private Subnet 1 ID",
      "Value": {"Ref": "PrivateSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet1"}
      }
    },
    "PrivateSubnet2ID": {
      "Description": "Private Subnet 2 ID",
      "Value": {"Ref": "PrivateSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet2"}
      }
    },
    "PrivateSubnet3ID": {
      "Description": "Private Subnet 3 ID",
      "Value": {"Ref": "PrivateSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet3"}
      }
    },
    "NATGateway1IP": {
      "Description": "NAT Gateway 1 Elastic IP",
      "Value": {"Ref": "EIP1"}
    },
    "NATGateway2IP": {
      "Description": "NAT Gateway 2 Elastic IP",
      "Value": {"Ref": "EIP2"}
    },
    "NATGateway3IP": {
      "Description": "NAT Gateway 3 Elastic IP",
      "Value": {"Ref": "EIP3"}
    }
  }
}
```

## Deployment Instructions

Deploy the stack:

```bash
aws cloudformation create-stack \
  --stack-name vpc-network-dev \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
               ParameterKey=Environment,ParameterValue=production \
               ParameterKey=Department,ParameterValue=finance \
  --capabilities CAPABILITY_IAM
```

Clean up:

```bash
aws cloudformation delete-stack --stack-name vpc-network-dev
```
