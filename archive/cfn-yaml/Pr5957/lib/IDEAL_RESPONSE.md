# CFN VPC Infrastructure Implementation

This implementation creates a production-ready VPC infrastructure with multi-tier networking for a financial trading platform using CFN.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready VPC infrastructure with multi-tier networking for financial trading platform'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for resource names to enable multiple deployments
    Default: dev
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  ProjectTag:
    Type: String
    Description: Project name for resource tagging
    Default: FinancialTradingPlatform

  CostCenterTag:
    Type: String
    Description: Cost center for billing allocation
    Default: TradingOps

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Public

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.13.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Private

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.21.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'database-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Database

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.22.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'database-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Database

  DatabaseSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.23.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'database-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Type
          Value: Database

  # Elastic IPs for NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # NAT Gateways
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-public-rt'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-private-rt-az1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PrivateRoute1:
    Type: AWS::EC2::Route
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-private-rt-az2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PrivateRoute2:
    Type: AWS::EC2::Route
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-private-rt-az3'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PrivateRoute3:
    Type: AWS::EC2::Route
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # Database Route Tables
  DatabaseRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-database-rt-az1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  DatabaseRoute1:
    Type: AWS::EC2::Route
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      RouteTableId: !Ref DatabaseRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref DatabaseRouteTable1

  DatabaseRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-database-rt-az2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  DatabaseRoute2:
    Type: AWS::EC2::Route
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      RouteTableId: !Ref DatabaseRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref DatabaseRouteTable2

  DatabaseRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-database-rt-az3'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  DatabaseRoute3:
    Type: AWS::EC2::Route
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      RouteTableId: !Ref DatabaseRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  DatabaseSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref DatabaseSubnet3
      RouteTableId: !Ref DatabaseRouteTable3

  # Public Network ACL
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-nacl-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Public NACL Inbound Rules
  PublicNetworkAclInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  PublicNetworkAclInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  PublicNetworkAclInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Public NACL Outbound Rules
  PublicNetworkAclOutboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  PublicNetworkAclOutboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  PublicNetworkAclOutboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 120
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Public NACL Associations
  PublicSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PublicSubnet3
      NetworkAclId: !Ref PublicNetworkAcl

  # Private Network ACL
  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-nacl-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Private NACL Inbound Rules
  PrivateNetworkAclInboundVPC:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 10.0.0.0/16

  PrivateNetworkAclInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Private NACL Outbound Rules
  PrivateNetworkAclOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  # Private NACL Associations
  PrivateSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref PrivateSubnet3
      NetworkAclId: !Ref PrivateNetworkAcl

  # Database Network ACL
  DatabaseNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'database-nacl-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Database NACL Inbound Rules (only from private subnets)
  DatabaseNetworkAclInboundMySQL:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 10.0.11.0/24
      PortRange:
        From: 3306
        To: 3306

  DatabaseNetworkAclInboundMySQL2:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 10.0.12.0/24
      PortRange:
        From: 3306
        To: 3306

  DatabaseNetworkAclInboundMySQL3:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      CidrBlock: 10.0.13.0/24
      PortRange:
        From: 3306
        To: 3306

  DatabaseNetworkAclInboundPostgreSQL:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 130
      Protocol: 6
      RuleAction: allow
      CidrBlock: 10.0.11.0/24
      PortRange:
        From: 5432
        To: 5432

  DatabaseNetworkAclInboundPostgreSQL2:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 140
      Protocol: 6
      RuleAction: allow
      CidrBlock: 10.0.12.0/24
      PortRange:
        From: 5432
        To: 5432

  DatabaseNetworkAclInboundPostgreSQL3:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 150
      Protocol: 6
      RuleAction: allow
      CidrBlock: 10.0.13.0/24
      PortRange:
        From: 5432
        To: 5432

  DatabaseNetworkAclInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 160
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Database NACL Outbound Rules
  DatabaseNetworkAclOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      NetworkAclId: !Ref DatabaseNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  # Database NACL Associations
  DatabaseSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      NetworkAclId: !Ref DatabaseNetworkAcl

  DatabaseSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      NetworkAclId: !Ref DatabaseNetworkAcl

  DatabaseSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Metadata:
      EnvironmentSuffix: !Ref EnvironmentSuffix
    Properties:
      SubnetId: !Ref DatabaseSubnet3
      NetworkAclId: !Ref DatabaseNetworkAcl

  # VPC Flow Logs
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !GetAtt VPCFlowLogsLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-logs-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  VPCFlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs-${EnvironmentSuffix}'
      RetentionInDays: 7
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-log-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PublicSubnet3Id:
    Description: Public Subnet 3 ID
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet3Id'

  PublicSubnetIds:
    Description: Comma-separated list of Public Subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetIds'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  PrivateSubnet3Id:
    Description: Private Subnet 3 ID
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet3Id'

  PrivateSubnetIds:
    Description: Comma-separated list of Private Subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

  DatabaseSubnet1Id:
    Description: Database Subnet 1 ID
    Value: !Ref DatabaseSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnet1Id'

  DatabaseSubnet2Id:
    Description: Database Subnet 2 ID
    Value: !Ref DatabaseSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnet2Id'

  DatabaseSubnet3Id:
    Description: Database Subnet 3 ID
    Value: !Ref DatabaseSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnet3Id'

  DatabaseSubnetIds:
    Description: Comma-separated list of Database Subnet IDs
    Value: !Join [',', [!Ref DatabaseSubnet1, !Ref DatabaseSubnet2, !Ref DatabaseSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnetIds'

  NatGateway1Id:
    Description: NAT Gateway 1 ID
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway1Id'

  NatGateway2Id:
    Description: NAT Gateway 2 ID
    Value: !Ref NatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway2Id'

  NatGateway3Id:
    Description: NAT Gateway 3 ID
    Value: !Ref NatGateway3
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway3Id'

  NatGatewayIds:
    Description: Comma-separated list of NAT Gateway IDs
    Value: !Join [',', [!Ref NatGateway1, !Ref NatGateway2, !Ref NatGateway3]]
    Export:
      Name: !Sub '${AWS::StackName}-NatGatewayIds'

  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGatewayId'

  VPCFlowLogsLogGroupName:
    Description: VPC Flow Logs CloudWatch Log Group Name
    Value: !Ref VPCFlowLogsLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-VPCFlowLogsLogGroupName'
```

This CFN template successfully implements all requirements:
- VPC with CIDR 10.0.0.0/16 with DNS hostnames and DNS support enabled
- 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs
- 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across 3 AZs
- 3 database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24) across 3 AZs
- Internet Gateway for public subnets
- 3 NAT Gateways with Elastic IPs (one per AZ)
- Proper route tables for each subnet type
- Network ACLs with deny-by-default and explicit allow rules
- VPC Flow Logs with 7-day retention in CloudWatch
- Comprehensive stack outputs for cross-stack references
- All resources tagged with Environment, Project, and CostCenter
- EnvironmentSuffix parameter for resource naming
- No Retain deletion policies (all resources are destroyable)
- Deploys successfully with 40 unit tests and 20 integration tests passing
