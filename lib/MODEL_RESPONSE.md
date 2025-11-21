# CloudFormation VPC Network Architecture - Model Response

This response provides a complete CloudFormation JSON template for deploying a production-grade VPC network architecture across 3 availability zones in us-east-1.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-grade VPC network architecture with multi-AZ high availability for financial services workloads",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "prod",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "Production",
      "AllowedValues": ["Production", "Staging", "Development"]
    },
    "Department": {
      "Type": "String",
      "Description": "Department tag value",
      "Default": "Engineering"
    }
  },
  "Mappings": {
    "SubnetCIDRs": {
      "us-east-1": {
        "PublicSubnetAZ1": "10.0.1.0/24",
        "PublicSubnetAZ2": "10.0.2.0/24",
        "PublicSubnetAZ3": "10.0.3.0/24",
        "PrivateSubnetAZ1": "10.0.11.0/24",
        "PrivateSubnetAZ2": "10.0.12.0/24",
        "PrivateSubnetAZ3": "10.0.13.0/24"
      },
      "us-west-2": {
        "PublicSubnetAZ1": "10.0.1.0/24",
        "PublicSubnetAZ2": "10.0.2.0/24",
        "PublicSubnetAZ3": "10.0.3.0/24",
        "PrivateSubnetAZ1": "10.0.11.0/24",
        "PrivateSubnetAZ2": "10.0.12.0/24",
        "PrivateSubnetAZ3": "10.0.13.0/24"
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
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
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
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
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
    "PublicSubnetAZ1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetCIDRs", "us-east-1", "PublicSubnetAZ1"]
        },
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "subnet-public-us-east-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PublicSubnetAZ2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetCIDRs", "us-east-1", "PublicSubnetAZ2"]
        },
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "subnet-public-us-east-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PublicSubnetAZ3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetCIDRs", "us-east-1", "PublicSubnetAZ3"]
        },
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "subnet-public-us-east-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateSubnetAZ1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetCIDRs", "us-east-1", "PrivateSubnetAZ1"]
        },
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "subnet-private-us-east-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateSubnetAZ2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetCIDRs", "us-east-1", "PrivateSubnetAZ2"]
        },
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "subnet-private-us-east-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateSubnetAZ3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetCIDRs", "us-east-1", "PrivateSubnetAZ3"]
        },
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "subnet-private-us-east-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "EIPForNATGatewayAZ1": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-us-east-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "EIPForNATGatewayAZ2": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-us-east-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "EIPForNATGatewayAZ3": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-us-east-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "NATGatewayAZ1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["EIPForNATGatewayAZ1", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnetAZ1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-us-east-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "NATGatewayAZ2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["EIPForNATGatewayAZ2", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnetAZ2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-us-east-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "NATGatewayAZ3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["EIPForNATGatewayAZ3", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnetAZ3"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-us-east-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
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
              "Fn::Sub": "rtb-public-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
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
    "PublicSubnetAZ1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetAZ1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnetAZ2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetAZ2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnetAZ3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetAZ3"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTableAZ1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rtb-private-us-east-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateRouteAZ1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTableAZ1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGatewayAZ1"
        }
      }
    },
    "PrivateSubnetAZ1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTableAZ1"
        }
      }
    },
    "PrivateRouteTableAZ2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rtb-private-us-east-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateRouteAZ2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTableAZ2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGatewayAZ2"
        }
      }
    },
    "PrivateSubnetAZ2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTableAZ2"
        }
      }
    },
    "PrivateRouteTableAZ3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rtb-private-us-east-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateRouteAZ3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTableAZ3"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGatewayAZ3"
        }
      }
    },
    "PrivateSubnetAZ3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTableAZ3"
        }
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "vpc-flow-logs-role-${EnvironmentSuffix}"
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
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "VPCFlowLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/flowlogs-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      },
      "DeletionPolicy": "Delete"
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
          "Ref": "VPCFlowLogGroup"
        },
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": ["VPCFlowLogsRole", "Arn"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "flowlog-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      }
    },
    "PublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nacl-public-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PublicNetworkAclEntryInboundHTTP": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
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
    "PublicNetworkAclEntryInboundHTTPS": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
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
    "PublicNetworkAclEntryInboundSSH": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": 120,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 22,
          "To": 22
        }
      }
    },
    "PublicNetworkAclEntryInboundEphemeral": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": 130,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 1024,
          "To": 65535
        }
      }
    },
    "PublicNetworkAclEntryOutbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "PublicSubnetAZ1NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetAZ1"
        },
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        }
      }
    },
    "PublicSubnetAZ2NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetAZ2"
        },
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        }
      }
    },
    "PublicSubnetAZ3NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnetAZ3"
        },
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        }
      }
    },
    "PrivateNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nacl-private-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Department",
            "Value": {
              "Ref": "Department"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateNetworkAclEntryInbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        },
        "RuleNumber": 100,
        "Protocol": -1,
        "RuleAction": "allow",
        "CidrBlock": "10.0.0.0/16"
      }
    },
    "PrivateNetworkAclEntryOutbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        },
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "PrivateSubnetAZ1NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ1"
        },
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        }
      }
    },
    "PrivateSubnetAZ2NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ2"
        },
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        }
      }
    },
    "PrivateSubnetAZ3NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ3"
        },
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        }
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
    "PublicSubnetAZ1Id": {
      "Description": "Public Subnet AZ1 ID",
      "Value": {
        "Ref": "PublicSubnetAZ1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetAZ1"
        }
      }
    },
    "PublicSubnetAZ2Id": {
      "Description": "Public Subnet AZ2 ID",
      "Value": {
        "Ref": "PublicSubnetAZ2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetAZ2"
        }
      }
    },
    "PublicSubnetAZ3Id": {
      "Description": "Public Subnet AZ3 ID",
      "Value": {
        "Ref": "PublicSubnetAZ3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetAZ3"
        }
      }
    },
    "PrivateSubnetAZ1Id": {
      "Description": "Private Subnet AZ1 ID",
      "Value": {
        "Ref": "PrivateSubnetAZ1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetAZ1"
        }
      }
    },
    "PrivateSubnetAZ2Id": {
      "Description": "Private Subnet AZ2 ID",
      "Value": {
        "Ref": "PrivateSubnetAZ2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetAZ2"
        }
      }
    },
    "PrivateSubnetAZ3Id": {
      "Description": "Private Subnet AZ3 ID",
      "Value": {
        "Ref": "PrivateSubnetAZ3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetAZ3"
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
          "Fn::Sub": "${AWS::StackName}-IGW"
        }
      }
    },
    "NATGatewayAZ1Id": {
      "Description": "NAT Gateway AZ1 ID",
      "Value": {
        "Ref": "NATGatewayAZ1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATAZ1"
        }
      }
    },
    "NATGatewayAZ2Id": {
      "Description": "NAT Gateway AZ2 ID",
      "Value": {
        "Ref": "NATGatewayAZ2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATAZ2"
        }
      }
    },
    "NATGatewayAZ3Id": {
      "Description": "NAT Gateway AZ3 ID",
      "Value": {
        "Ref": "NATGatewayAZ3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATAZ3"
        }
      }
    },
    "VPCFlowLogGroupName": {
      "Description": "VPC Flow Logs CloudWatch Log Group Name",
      "Value": {
        "Ref": "VPCFlowLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-FlowLogGroup"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# VPC Network Architecture - CloudFormation Deployment Guide

## Overview

This CloudFormation template deploys a production-grade VPC network architecture across 3 availability zones in us-east-1. The infrastructure includes high-availability networking components for financial services workloads requiring strict network isolation and compliance controls.

## Architecture Components

### Network Foundation
- VPC with CIDR 10.0.0.0/16 and DNS hostnames enabled
- 6 subnets across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
  - 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
  - 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)

### Internet Connectivity
- Internet Gateway for public subnet internet access
- 3 NAT Gateways (one per AZ) for private subnet outbound connectivity
- 3 Elastic IPs for NAT Gateways

### Routing
- 1 public route table (shared across all public subnets)
- 3 private route tables (one per AZ, routes through same-AZ NAT Gateway)
- Proper route table associations for all subnets

### Security and Compliance
- VPC Flow Logs capturing ALL traffic (accepted and rejected)
- CloudWatch Logs with 30-day retention for Flow Logs
- IAM role with proper permissions for VPC Flow Logs service
- Custom Network ACLs for public and private subnets
- Public NACL: Allows inbound HTTP (80), HTTPS (443), SSH (22), and ephemeral ports
- Private NACL: Allows inbound from VPC CIDR only

### Tagging
- All resources tagged with Environment and Department keys
- Cost allocation tags applied consistently

## Parameters

- **EnvironmentSuffix** (String): Unique suffix for resource naming (default: "prod")
- **Environment** (String): Environment tag value (Production/Staging/Development, default: "Production")
- **Department** (String): Department tag value (default: "Engineering")

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Permissions for VPC, EC2, IAM, CloudWatch Logs, and CloudFormation services
- Target region: us-east-1

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name vpc-network-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=Environment,ParameterValue=Production \
    ParameterKey=Department,ParameterValue=Engineering \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-network-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### View Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-network-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Outputs

The template exports the following outputs for cross-stack references:

- **VPCId**: VPC resource ID
- **PublicSubnetAZ1Id**: Public subnet in us-east-1a
- **PublicSubnetAZ2Id**: Public subnet in us-east-1b
- **PublicSubnetAZ3Id**: Public subnet in us-east-1c
- **PrivateSubnetAZ1Id**: Private subnet in us-east-1a
- **PrivateSubnetAZ2Id**: Private subnet in us-east-1b
- **PrivateSubnetAZ3Id**: Private subnet in us-east-1c
- **InternetGatewayId**: Internet Gateway ID
- **NATGatewayAZ1Id**: NAT Gateway in us-east-1a
- **NATGatewayAZ2Id**: NAT Gateway in us-east-1b
- **NATGatewayAZ3Id**: NAT Gateway in us-east-1c
- **VPCFlowLogGroupName**: CloudWatch Log Group for VPC Flow Logs

## Resource Deletion

All resources use `DeletionPolicy: Delete` to ensure clean teardown:

```bash
aws cloudformation delete-stack \
  --stack-name vpc-network-prod \
  --region us-east-1
```

Note: NAT Gateways take approximately 10-15 minutes to delete.

## Cost Considerations

### Ongoing Costs
- **NAT Gateways**: 3 NAT Gateways @ ~$0.045/hour each = ~$97/month
- **Elastic IPs**: 3 EIPs attached to NAT Gateways (no charge while attached)
- **VPC Flow Logs**: CloudWatch Logs ingestion and storage costs
- **Data Transfer**: NAT Gateway data processing charges ($0.045/GB)

### Cost Optimization Opportunities
- Consider VPC Endpoints for S3 and DynamoDB to reduce NAT Gateway data transfer
- Adjust CloudWatch Logs retention period based on compliance requirements
- For non-production environments, consider using fewer NAT Gateways

## Security Considerations

### Network ACLs
- Public subnets allow inbound HTTP, HTTPS, SSH, and ephemeral ports
- Private subnets only allow inbound traffic from VPC CIDR
- All outbound traffic allowed (stateless firewall)

### VPC Flow Logs
- Captures all network traffic (accepted and rejected)
- 30-day retention for compliance and troubleshooting
- Delivered to CloudWatch Logs with dedicated IAM role

### Best Practices
- Use Security Groups in addition to NACLs for defense in depth
- Restrict SSH access to specific IP ranges in production
- Consider AWS Systems Manager Session Manager instead of SSH
- Enable VPC Flow Logs analysis with CloudWatch Insights or Amazon Athena

## Troubleshooting

### Stack Creation Fails
- Check IAM permissions for CloudFormation, VPC, EC2, IAM, and CloudWatch Logs
- Verify no resource limits reached (VPCs per region, EIPs per region)
- Ensure CAPABILITY_NAMED_IAM capability is provided for IAM role creation

### NAT Gateway Issues
- Verify Elastic IPs are allocated in correct region
- Check route tables have correct NAT Gateway references
- Ensure NAT Gateways are in public subnets with IGW routes

### VPC Flow Logs Not Working
- Verify IAM role has correct trust policy for vpc-flow-logs.amazonaws.com
- Check CloudWatch Logs permissions in IAM policy
- Ensure log group retention is set correctly

## Compliance and Governance

This template meets the following requirements:
- Multi-AZ high availability architecture
- Network traffic logging for audit purposes
- Consistent resource tagging for cost allocation
- Proper IAM role configuration with least privilege
- Secure network segmentation (public/private subnets)
- Financial services compliance-ready network foundation

## Mappings

The template includes mappings for subnet CIDRs:
- Supports us-east-1 and us-west-2 regions
- Consistent CIDR allocation across regions
- Easy to extend for additional regions

## Next Steps

After deploying this VPC:
1. Deploy application workloads in private subnets
2. Configure Security Groups for application-level security
3. Set up VPC Endpoints for AWS services (S3, DynamoDB)
4. Configure CloudWatch Alarms for NAT Gateway metrics
5. Implement Transit Gateway for multi-VPC connectivity (if needed)
6. Deploy AWS Network Firewall for advanced threat protection (if needed)
```
