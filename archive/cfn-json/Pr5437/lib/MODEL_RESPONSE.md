# CloudFormation VPC Infrastructure Solution

This solution creates a complete multi-tier VPC network infrastructure with public and private subnets across two availability zones, including Internet Gateway, NAT Gateways, route tables, and security groups.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-tier VPC infrastructure with public and private subnets across two availability zones",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to ensure uniqueness across environments",
      "Default": "dev"
    },
    "BastionSSHCIDR": {
      "Type": "String",
      "Description": "CIDR block allowed to SSH into bastion hosts",
      "Default": "0.0.0.0/0",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    },
    "EnvironmentTag": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "development"
    },
    "ProjectTag": {
      "Type": "String",
      "Description": "Project tag value",
      "Default": "vpc-infrastructure"
    },
    "OwnerTag": {
      "Type": "String",
      "Description": "Owner tag value",
      "Default": "platform-team"
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
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
            }
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
              "Fn::Sub": "subnet-public-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
              "Fn::Sub": "subnet-public-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
              "Fn::Sub": "subnet-private-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
              "Fn::Sub": "subnet-private-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
            }
          }
        ]
      }
    },
    "EIP1": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
            }
          }
        ]
      }
    },
    "EIP2": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-nat-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
            "EIP1",
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
              "Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
            "EIP2",
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
              "Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
              "Fn::Sub": "rtb-public-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
            }
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
              "Fn::Sub": "rtb-private-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
              "Fn::Sub": "rtb-private-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
    "BastionSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-bastion-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for bastion host - allows SSH from specific CIDR",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "BastionSSHCIDR"
            },
            "Description": "Allow SSH from specified CIDR"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-bastion-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
            }
          }
        ]
      }
    },
    "ApplicationSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-application-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for application servers - allows HTTP/HTTPS from internet and SSH from bastion",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "SourceSecurityGroupId": {
              "Ref": "BastionSecurityGroup"
            },
            "Description": "Allow SSH from bastion security group"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-application-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
            }
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-database-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for database servers - allows MySQL from application security group only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "ApplicationSecurityGroup"
            },
            "Description": "Allow MySQL from application security group"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-database-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectTag"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "OwnerTag"
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
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet1Id"
        }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2Id"
        }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"
        }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"
        }
      }
    },
    "BastionSecurityGroupId": {
      "Description": "Bastion Security Group ID",
      "Value": {
        "Ref": "BastionSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-BastionSecurityGroupId"
        }
      }
    },
    "ApplicationSecurityGroupId": {
      "Description": "Application Security Group ID",
      "Value": {
        "Ref": "ApplicationSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApplicationSecurityGroupId"
        }
      }
    },
    "DatabaseSecurityGroupId": {
      "Description": "Database Security Group ID",
      "Value": {
        "Ref": "DatabaseSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseSecurityGroupId"
        }
      }
    },
    "NATGateway1Id": {
      "Description": "NAT Gateway 1 ID",
      "Value": {
        "Ref": "NATGateway1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATGateway1Id"
        }
      }
    },
    "NATGateway2Id": {
      "Description": "NAT Gateway 2 ID",
      "Value": {
        "Ref": "NATGateway2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATGateway2Id"
        }
      }
    }
  }
}
```

## Implementation Notes

This CloudFormation template creates a complete multi-tier VPC infrastructure with:

1. **VPC**: 10.0.0.0/16 CIDR with DNS hostnames and DNS support enabled
2. **Public Subnets**: Two public subnets (10.0.1.0/24, 10.0.2.0/24) across two AZs with auto-assign public IP
3. **Private Subnets**: Two private subnets (10.0.11.0/24, 10.0.12.0/24) across two AZs
4. **Internet Gateway**: Attached to VPC for public subnet internet access
5. **NAT Gateways**: Two NAT Gateways (one per AZ) with Elastic IPs for private subnet outbound connectivity
6. **Route Tables**:
   - Public route table with route to Internet Gateway
   - Two private route tables (one per AZ) with routes to respective NAT Gateways
7. **Security Groups**:
   - Bastion: SSH (22) from parameter-specified CIDR
   - Application: HTTP/HTTPS from internet, SSH from bastion SG
   - Database: MySQL (3306) from application SG only
8. **Parameters**: EnvironmentSuffix, BastionSSHCIDR, and tag values
9. **Outputs**: All resource IDs exported for cross-stack references
10. **Tags**: All resources tagged with Environment, Project, and Owner

All resource names use Fn::Sub with EnvironmentSuffix parameter for uniqueness. No DeletionPolicy: Retain is used, ensuring full destroyability.
