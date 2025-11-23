# CloudFormation VPC Infrastructure Solution

This solution provides a production-ready, PCI DSS compliant VPC infrastructure with three-tier network segmentation.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready VPC infrastructure for three-tier web application with PCI DSS compliance",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support parallel deployments",
      "Default": "dev"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment name for tagging",
      "Default": "prod",
      "AllowedValues": ["dev", "staging", "prod"]
    },
    "Project": {
      "Type": "String",
      "Description": "Project name for tagging",
      "Default": "payment-platform"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for billing allocation",
      "Default": "engineering"
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "public"}
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
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "public"}
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
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "public"}
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
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "private"}
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
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "private"}
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
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "private"}
        ]
      }
    },
    "DatabaseSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.21.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "database-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "database"}
        ]
      }
    },
    "DatabaseSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.22.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "database-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "database"}
        ]
      }
    },
    "DatabaseSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.23.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "database-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "Tier", "Value": "database"}
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
    "NATGateway1": {
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
    "NATGateway2": {
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
    "NATGateway3": {
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
          {"Key": "Name", "Value": {"Fn::Sub": "prod-public-rtb-${EnvironmentSuffix}"}},
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
          {"Key": "Name", "Value": {"Fn::Sub": "prod-private-az1-rtb-${EnvironmentSuffix}"}},
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
          {"Key": "Name", "Value": {"Fn::Sub": "prod-private-az2-rtb-${EnvironmentSuffix}"}},
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
          {"Key": "Name", "Value": {"Fn::Sub": "prod-private-az3-rtb-${EnvironmentSuffix}"}},
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
    "DatabaseRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "prod-database-az1-rtb-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DatabaseSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DatabaseSubnet1"},
        "RouteTableId": {"Ref": "DatabaseRouteTable1"}
      }
    },
    "DatabaseRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "prod-database-az2-rtb-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DatabaseSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DatabaseSubnet2"},
        "RouteTableId": {"Ref": "DatabaseRouteTable2"}
      }
    },
    "DatabaseRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "prod-database-az3-rtb-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DatabaseSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DatabaseSubnet3"},
        "RouteTableId": {"Ref": "DatabaseRouteTable3"}
      }
    },
    "PublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-nacl-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PublicNetworkAclInboundHTTP": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "PublicNetworkAcl"},
        "RuleNumber": 100,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {"From": 80, "To": 80}
      }
    },
    "PublicNetworkAclInboundHTTPS": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "PublicNetworkAcl"},
        "RuleNumber": 110,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {"From": 443, "To": 443}
      }
    },
    "PublicNetworkAclInboundEphemeral": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "PublicNetworkAcl"},
        "RuleNumber": 120,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {"From": 1024, "To": 65535}
      }
    },
    "PublicNetworkAclOutbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "PublicNetworkAcl"},
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "PublicSubnetNetworkAclAssociation1": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "NetworkAclId": {"Ref": "PublicNetworkAcl"}
      }
    },
    "PublicSubnetNetworkAclAssociation2": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "NetworkAclId": {"Ref": "PublicNetworkAcl"}
      }
    },
    "PublicSubnetNetworkAclAssociation3": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "NetworkAclId": {"Ref": "PublicNetworkAcl"}
      }
    },
    "PrivateNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "private-nacl-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "PrivateNetworkAclInboundFromPublic": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "PrivateNetworkAcl"},
        "RuleNumber": 100,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.0.0/16",
        "PortRange": {"From": 1024, "To": 65535}
      }
    },
    "PrivateNetworkAclOutbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "PrivateNetworkAcl"},
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "PrivateSubnetNetworkAclAssociation1": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "NetworkAclId": {"Ref": "PrivateNetworkAcl"}
      }
    },
    "PrivateSubnetNetworkAclAssociation2": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "NetworkAclId": {"Ref": "PrivateNetworkAcl"}
      }
    },
    "PrivateSubnetNetworkAclAssociation3": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "NetworkAclId": {"Ref": "PrivateNetworkAcl"}
      }
    },
    "DatabaseNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "database-nacl-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "DatabaseNetworkAclInboundMySQL1": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"},
        "RuleNumber": 100,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.11.0/24",
        "PortRange": {"From": 3306, "To": 3306}
      }
    },
    "DatabaseNetworkAclInboundMySQL2": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"},
        "RuleNumber": 110,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.12.0/24",
        "PortRange": {"From": 3306, "To": 3306}
      }
    },
    "DatabaseNetworkAclInboundMySQL3": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"},
        "RuleNumber": 120,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.13.0/24",
        "PortRange": {"From": 3306, "To": 3306}
      }
    },
    "DatabaseNetworkAclInboundPostgres1": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"},
        "RuleNumber": 130,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.11.0/24",
        "PortRange": {"From": 5432, "To": 5432}
      }
    },
    "DatabaseNetworkAclInboundPostgres2": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"},
        "RuleNumber": 140,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.12.0/24",
        "PortRange": {"From": 5432, "To": 5432}
      }
    },
    "DatabaseNetworkAclInboundPostgres3": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"},
        "RuleNumber": 150,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "10.0.13.0/24",
        "PortRange": {"From": 5432, "To": 5432}
      }
    },
    "DatabaseNetworkAclOutbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"},
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "10.0.0.0/16"
      }
    },
    "DatabaseSubnetNetworkAclAssociation1": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DatabaseSubnet1"},
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"}
      }
    },
    "DatabaseSubnetNetworkAclAssociation2": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DatabaseSubnet2"},
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"}
      }
    },
    "DatabaseSubnetNetworkAclAssociation3": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DatabaseSubnet3"},
        "NetworkAclId": {"Ref": "DatabaseNetworkAcl"}
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
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-flow-logs-role-${EnvironmentSuffix}"}},
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
        "RetentionInDays": 7,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-flow-logs-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {"Ref": "VPC"},
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {"Ref": "VPCFlowLogsLogGroup"},
        "DeliverLogsPermissionArn": {"Fn::GetAtt": ["VPCFlowLogsRole", "Arn"]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-flow-log-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}}
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {"Ref": "PublicSubnet1"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet1Id"}}
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {"Ref": "PublicSubnet2"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet2Id"}}
    },
    "PublicSubnet3Id": {
      "Description": "Public Subnet 3 ID",
      "Value": {"Ref": "PublicSubnet3"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet3Id"}}
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {"Ref": "PrivateSubnet1"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"}}
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {"Ref": "PrivateSubnet2"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"}}
    },
    "PrivateSubnet3Id": {
      "Description": "Private Subnet 3 ID",
      "Value": {"Ref": "PrivateSubnet3"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet3Id"}}
    },
    "DatabaseSubnet1Id": {
      "Description": "Database Subnet 1 ID",
      "Value": {"Ref": "DatabaseSubnet1"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DatabaseSubnet1Id"}}
    },
    "DatabaseSubnet2Id": {
      "Description": "Database Subnet 2 ID",
      "Value": {"Ref": "DatabaseSubnet2"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DatabaseSubnet2Id"}}
    },
    "DatabaseSubnet3Id": {
      "Description": "Database Subnet 3 ID",
      "Value": {"Ref": "DatabaseSubnet3"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DatabaseSubnet3Id"}}
    },
    "NATGateway1Id": {
      "Description": "NAT Gateway 1 ID",
      "Value": {"Ref": "NATGateway1"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-NATGateway1Id"}}
    },
    "NATGateway2Id": {
      "Description": "NAT Gateway 2 ID",
      "Value": {"Ref": "NATGateway2"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-NATGateway2Id"}}
    },
    "NATGateway3Id": {
      "Description": "NAT Gateway 3 ID",
      "Value": {"Ref": "NATGateway3"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-NATGateway3Id"}}
    },
    "InternetGatewayId": {
      "Description": "Internet Gateway ID",
      "Value": {"Ref": "InternetGateway"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-InternetGatewayId"}}
    },
    "VPCFlowLogsLogGroupName": {
      "Description": "VPC Flow Logs CloudWatch Log Group Name",
      "Value": {"Ref": "VPCFlowLogsLogGroup"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VPCFlowLogsLogGroupName"}}
    }
  }
}
```

## Architecture Overview

The template creates a comprehensive VPC infrastructure with:

1. **VPC**: 10.0.0.0/16 with DNS support and hostnames enabled
2. **Subnets**: 9 subnets across 3 availability zones
   - Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
   - Private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
   - Database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
3. **Internet Gateway**: Attached to VPC for public subnet internet access
4. **NAT Gateways**: 3 NAT Gateways (one per AZ) with Elastic IPs for private subnet outbound traffic
5. **Route Tables**: Separate route tables for each tier with proper routing
6. **Network ACLs**: Custom NACLs for each tier with PCI DSS compliant rules
7. **VPC Flow Logs**: Enabled with CloudWatch Logs destination and 7-day retention

All resources include the EnvironmentSuffix parameter for unique naming and consistent tagging for cost tracking and organization.
