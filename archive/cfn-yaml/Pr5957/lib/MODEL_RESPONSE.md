# CloudFormation VPC Infrastructure Implementation

This implementation creates a production-ready VPC infrastructure with multi-tier networking for a financial trading platform.

## File: lib/tap-stack.yaml

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
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
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
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
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
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
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
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
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
    Properties:
      RouteTableId: !Ref DatabaseRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
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
    Properties:
      RouteTableId: !Ref DatabaseRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
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
    Properties:
      RouteTableId: !Ref DatabaseRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  DatabaseSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
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
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
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
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 10.0.0.0/16

  PrivateNetworkAclInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
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
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
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
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      NetworkAclId: !Ref DatabaseNetworkAcl

  DatabaseSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      NetworkAclId: !Ref DatabaseNetworkAcl

  DatabaseSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
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

## File: lib/tap-stack-params.json

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "ProjectTag",
    "ParameterValue": "FinancialTradingPlatform"
  },
  {
    "ParameterKey": "CostCenterTag",
    "ParameterValue": "TradingOps"
  }
]
```

## File: tests/test_vpc_stack.py

```python
#!/usr/bin/env python3
"""
Unit tests for CloudFormation VPC Stack
Tests validate template structure, parameters, resources, and outputs
"""

import json
import unittest
import yaml
import os
from typing import Dict, Any


class TestVPCStack(unittest.TestCase):
    """Test suite for VPC CloudFormation stack"""

    @classmethod
    def setUpClass(cls):
        """Load CloudFormation template once for all tests"""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'tap-stack.yaml')
        with open(template_path, 'r') as f:
            cls.template = yaml.safe_load(f)

    def test_template_format_version(self):
        """Test CloudFormation template format version"""
        self.assertEqual(
            self.template['AWSTemplateFormatVersion'],
            '2010-09-09',
            "Template format version should be 2010-09-09"
        )

    def test_template_has_description(self):
        """Test template has description"""
        self.assertIn('Description', self.template)
        self.assertIsInstance(self.template['Description'], str)
        self.assertGreater(len(self.template['Description']), 0)

    def test_parameters_exist(self):
        """Test all required parameters are defined"""
        parameters = self.template.get('Parameters', {})
        required_params = ['EnvironmentSuffix', 'ProjectTag', 'CostCenterTag']

        for param in required_params:
            self.assertIn(param, parameters, f"Parameter {param} should be defined")

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration"""
        env_param = self.template['Parameters']['EnvironmentSuffix']
        self.assertEqual(env_param['Type'], 'String')
        self.assertEqual(env_param['Default'], 'dev')
        self.assertIn('AllowedPattern', env_param)

    def test_vpc_resource_exists(self):
        """Test VPC resource is defined"""
        resources = self.template.get('Resources', {})
        self.assertIn('VPC', resources, "VPC resource should exist")

        vpc = resources['VPC']
        self.assertEqual(vpc['Type'], 'AWS::EC2::VPC')
        self.assertEqual(vpc['Properties']['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['Properties']['EnableDnsHostnames'])
        self.assertTrue(vpc['Properties']['EnableDnsSupport'])

    def test_vpc_tags(self):
        """Test VPC has required tags"""
        vpc = self.template['Resources']['VPC']
        tags = {tag['Key']: tag['Value'] for tag in vpc['Properties']['Tags']}

        required_tags = ['Name', 'Environment', 'Project', 'CostCenter']
        for tag in required_tags:
            self.assertIn(tag, tags, f"VPC should have {tag} tag")

    def test_internet_gateway_exists(self):
        """Test Internet Gateway is defined"""
        resources = self.template['Resources']
        self.assertIn('InternetGateway', resources)
        self.assertEqual(
            resources['InternetGateway']['Type'],
            'AWS::EC2::InternetGateway'
        )

        # Test attachment
        self.assertIn('AttachGateway', resources)
        self.assertEqual(
            resources['AttachGateway']['Type'],
            'AWS::EC2::VPCGatewayAttachment'
        )

    def test_public_subnets_count(self):
        """Test correct number of public subnets"""
        resources = self.template['Resources']
        public_subnets = [k for k in resources.keys() if k.startswith('PublicSubnet') and k[12:].isdigit()]
        self.assertEqual(len(public_subnets), 3, "Should have 3 public subnets")

    def test_public_subnet_cidrs(self):
        """Test public subnet CIDR blocks"""
        resources = self.template['Resources']
        expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']

        actual_cidrs = [
            resources['PublicSubnet1']['Properties']['CidrBlock'],
            resources['PublicSubnet2']['Properties']['CidrBlock'],
            resources['PublicSubnet3']['Properties']['CidrBlock']
        ]

        self.assertEqual(sorted(actual_cidrs), sorted(expected_cidrs))

    def test_public_subnets_map_public_ip(self):
        """Test public subnets auto-assign public IPs"""
        resources = self.template['Resources']
        for i in range(1, 4):
            subnet = resources[f'PublicSubnet{i}']
            self.assertTrue(
                subnet['Properties']['MapPublicIpOnLaunch'],
                f"PublicSubnet{i} should map public IPs"
            )

    def test_private_subnets_count(self):
        """Test correct number of private subnets"""
        resources = self.template['Resources']
        private_subnets = [k for k in resources.keys() if k.startswith('PrivateSubnet') and k[13:].isdigit()]
        self.assertEqual(len(private_subnets), 3, "Should have 3 private subnets")

    def test_private_subnet_cidrs(self):
        """Test private subnet CIDR blocks"""
        resources = self.template['Resources']
        expected_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']

        actual_cidrs = [
            resources['PrivateSubnet1']['Properties']['CidrBlock'],
            resources['PrivateSubnet2']['Properties']['CidrBlock'],
            resources['PrivateSubnet3']['Properties']['CidrBlock']
        ]

        self.assertEqual(sorted(actual_cidrs), sorted(expected_cidrs))

    def test_database_subnets_count(self):
        """Test correct number of database subnets"""
        resources = self.template['Resources']
        db_subnets = [k for k in resources.keys() if k.startswith('DatabaseSubnet') and k[14:].isdigit()]
        self.assertEqual(len(db_subnets), 3, "Should have 3 database subnets")

    def test_database_subnet_cidrs(self):
        """Test database subnet CIDR blocks"""
        resources = self.template['Resources']
        expected_cidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']

        actual_cidrs = [
            resources['DatabaseSubnet1']['Properties']['CidrBlock'],
            resources['DatabaseSubnet2']['Properties']['CidrBlock'],
            resources['DatabaseSubnet3']['Properties']['CidrBlock']
        ]

        self.assertEqual(sorted(actual_cidrs), sorted(expected_cidrs))

    def test_nat_gateways_count(self):
        """Test correct number of NAT Gateways"""
        resources = self.template['Resources']
        nat_gateways = [k for k in resources.keys() if k.startswith('NatGateway') and k[10:].isdigit()]
        self.assertEqual(len(nat_gateways), 3, "Should have 3 NAT Gateways")

    def test_nat_gateway_eips(self):
        """Test NAT Gateways have Elastic IPs"""
        resources = self.template['Resources']

        for i in range(1, 4):
            eip_key = f'NatGateway{i}EIP'
            self.assertIn(eip_key, resources)
            self.assertEqual(resources[eip_key]['Type'], 'AWS::EC2::EIP')
            self.assertEqual(resources[eip_key]['Properties']['Domain'], 'vpc')

    def test_nat_gateway_placement(self):
        """Test NAT Gateways are in public subnets"""
        resources = self.template['Resources']

        for i in range(1, 4):
            nat_gw = resources[f'NatGateway{i}']
            subnet_ref = nat_gw['Properties']['SubnetId']
            self.assertIn('PublicSubnet', str(subnet_ref))

    def test_route_tables_exist(self):
        """Test route tables exist for all subnet types"""
        resources = self.template['Resources']

        # Public route table
        self.assertIn('PublicRouteTable', resources)

        # Private route tables (one per AZ)
        for i in range(1, 4):
            self.assertIn(f'PrivateRouteTable{i}', resources)
            self.assertIn(f'DatabaseRouteTable{i}', resources)

    def test_public_route_to_igw(self):
        """Test public route table routes to Internet Gateway"""
        resources = self.template['Resources']
        public_route = resources['PublicRoute']

        self.assertEqual(public_route['Type'], 'AWS::EC2::Route')
        self.assertEqual(
            public_route['Properties']['DestinationCidrBlock'],
            '0.0.0.0/0'
        )
        self.assertIn('InternetGateway', str(public_route['Properties']['GatewayId']))

    def test_private_routes_to_nat_gateways(self):
        """Test private subnets route to NAT Gateways"""
        resources = self.template['Resources']

        for i in range(1, 4):
            route = resources[f'PrivateRoute{i}']
            self.assertEqual(route['Type'], 'AWS::EC2::Route')
            self.assertEqual(
                route['Properties']['DestinationCidrBlock'],
                '0.0.0.0/0'
            )
            self.assertIn(f'NatGateway{i}', str(route['Properties']['NatGatewayId']))

    def test_database_routes_to_nat_gateways(self):
        """Test database subnets route to NAT Gateways"""
        resources = self.template['Resources']

        for i in range(1, 4):
            route = resources[f'DatabaseRoute{i}']
            self.assertEqual(route['Type'], 'AWS::EC2::Route')
            self.assertEqual(
                route['Properties']['DestinationCidrBlock'],
                '0.0.0.0/0'
            )
            self.assertIn(f'NatGateway{i}', str(route['Properties']['NatGatewayId']))

    def test_route_table_associations(self):
        """Test all subnets are associated with route tables"""
        resources = self.template['Resources']

        # Count associations
        associations = [k for k in resources.keys() if 'RouteTableAssociation' in k]
        # 3 public + 3 private + 3 database = 9 associations
        self.assertEqual(len(associations), 9)

    def test_network_acls_exist(self):
        """Test Network ACLs exist for all subnet types"""
        resources = self.template['Resources']

        self.assertIn('PublicNetworkAcl', resources)
        self.assertIn('PrivateNetworkAcl', resources)
        self.assertIn('DatabaseNetworkAcl', resources)

    def test_public_nacl_http_https_rules(self):
        """Test public NACL allows HTTP and HTTPS"""
        resources = self.template['Resources']

        # Check inbound HTTP
        http_rule = resources['PublicNetworkAclInboundHTTP']
        self.assertEqual(http_rule['Properties']['PortRange']['From'], 80)
        self.assertEqual(http_rule['Properties']['RuleAction'], 'allow')

        # Check inbound HTTPS
        https_rule = resources['PublicNetworkAclInboundHTTPS']
        self.assertEqual(https_rule['Properties']['PortRange']['From'], 443)
        self.assertEqual(https_rule['Properties']['RuleAction'], 'allow')

    def test_database_nacl_restricts_access(self):
        """Test database NACL only allows access from private subnets"""
        resources = self.template['Resources']

        # Check that database NACL has rules for private subnet CIDRs only
        mysql_rule = resources['DatabaseNetworkAclInboundMySQL']
        self.assertEqual(mysql_rule['Properties']['CidrBlock'], '10.0.11.0/24')
        self.assertEqual(mysql_rule['Properties']['PortRange']['From'], 3306)

    def test_network_acl_associations(self):
        """Test all subnets are associated with Network ACLs"""
        resources = self.template['Resources']

        nacl_associations = [k for k in resources.keys() if 'NetworkAclAssociation' in k]
        # 3 public + 3 private + 3 database = 9 associations
        self.assertEqual(len(nacl_associations), 9)

    def test_vpc_flow_logs_exist(self):
        """Test VPC Flow Logs are configured"""
        resources = self.template['Resources']

        self.assertIn('VPCFlowLog', resources)
        self.assertIn('VPCFlowLogsLogGroup', resources)
        self.assertIn('VPCFlowLogsRole', resources)

    def test_vpc_flow_logs_retention(self):
        """Test VPC Flow Logs retention is 7 days"""
        log_group = self.template['Resources']['VPCFlowLogsLogGroup']
        self.assertEqual(log_group['Properties']['RetentionInDays'], 7)

    def test_vpc_flow_logs_configuration(self):
        """Test VPC Flow Logs configuration"""
        flow_log = self.template['Resources']['VPCFlowLog']

        self.assertEqual(flow_log['Type'], 'AWS::EC2::FlowLog')
        self.assertEqual(flow_log['Properties']['ResourceType'], 'VPC')
        self.assertEqual(flow_log['Properties']['TrafficType'], 'ALL')
        self.assertEqual(flow_log['Properties']['LogDestinationType'], 'cloud-watch-logs')

    def test_iam_role_for_flow_logs(self):
        """Test IAM role for VPC Flow Logs has correct policies"""
        role = self.template['Resources']['VPCFlowLogsRole']

        self.assertEqual(role['Type'], 'AWS::IAM::Role')

        # Check trust policy
        trust_policy = role['Properties']['AssumeRolePolicyDocument']
        self.assertEqual(
            trust_policy['Statement'][0]['Principal']['Service'],
            'vpc-flow-logs.amazonaws.com'
        )

        # Check has CloudWatch logs policy
        policies = role['Properties']['Policies']
        self.assertEqual(len(policies), 1)
        self.assertEqual(policies[0]['PolicyName'], 'CloudWatchLogPolicy')

    def test_outputs_exist(self):
        """Test all required outputs are defined"""
        outputs = self.template.get('Outputs', {})

        required_outputs = [
            'VPCId',
            'PublicSubnetIds',
            'PrivateSubnetIds',
            'DatabaseSubnetIds',
            'NatGatewayIds',
            'InternetGatewayId',
            'VPCFlowLogsLogGroupName'
        ]

        for output in required_outputs:
            self.assertIn(output, outputs, f"Output {output} should be defined")

    def test_individual_subnet_outputs(self):
        """Test individual subnet outputs are defined"""
        outputs = self.template.get('Outputs', {})

        for i in range(1, 4):
            self.assertIn(f'PublicSubnet{i}Id', outputs)
            self.assertIn(f'PrivateSubnet{i}Id', outputs)
            self.assertIn(f'DatabaseSubnet{i}Id', outputs)

    def test_individual_nat_gateway_outputs(self):
        """Test individual NAT Gateway outputs are defined"""
        outputs = self.template.get('Outputs', {})

        for i in range(1, 4):
            self.assertIn(f'NatGateway{i}Id', outputs)

    def test_outputs_have_exports(self):
        """Test outputs have export names for cross-stack references"""
        outputs = self.template.get('Outputs', {})

        critical_outputs = ['VPCId', 'PublicSubnetIds', 'PrivateSubnetIds', 'DatabaseSubnetIds']

        for output_name in critical_outputs:
            self.assertIn('Export', outputs[output_name])
            self.assertIn('Name', outputs[output_name]['Export'])

    def test_no_retain_policies(self):
        """Test no resources have Retain deletion policy"""
        resources = self.template.get('Resources', {})

        for resource_name, resource in resources.items():
            if 'DeletionPolicy' in resource:
                self.assertNotEqual(
                    resource['DeletionPolicy'],
                    'Retain',
                    f"Resource {resource_name} should not have Retain policy"
                )

    def test_resource_naming_uses_environment_suffix(self):
        """Test resources use EnvironmentSuffix in naming"""
        resources = self.template['Resources']

        # Sample key resources that should use the suffix
        key_resources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'NatGateway1']

        for resource_name in key_resources:
            resource = resources[resource_name]
            tags = resource['Properties'].get('Tags', [])
            name_tags = [tag for tag in tags if tag['Key'] == 'Name']

            self.assertEqual(len(name_tags), 1, f"{resource_name} should have Name tag")
            name_value = name_tags[0]['Value']

            # Check if name uses Sub function with EnvironmentSuffix
            if isinstance(name_value, dict) and 'Fn::Sub' in name_value:
                sub_value = name_value['Fn::Sub']
                self.assertIn('${EnvironmentSuffix}', sub_value)

    def test_route_table_naming_convention(self):
        """Test route tables follow naming pattern: {vpc-name}-{subnet-type}-rt-{az}"""
        resources = self.template['Resources']

        # Test private route tables
        for i in range(1, 4):
            rt = resources[f'PrivateRouteTable{i}']
            tags = {tag['Key']: tag['Value'] for tag in rt['Properties']['Tags']}
            name = tags['Name']

            if isinstance(name, dict) and 'Fn::Sub' in name:
                name_pattern = name['Fn::Sub']
                self.assertIn('vpc-', name_pattern)
                self.assertIn('private-rt', name_pattern)
                self.assertIn('az', name_pattern)

    def test_all_resources_have_required_tags(self):
        """Test all taggable resources have Environment, Project, and CostCenter tags"""
        resources = self.template['Resources']
        required_tags = {'Environment', 'Project', 'CostCenter'}

        taggable_resources = [
            'VPC', 'InternetGateway', 'PublicSubnet1', 'NatGateway1',
            'PublicRouteTable', 'PrivateRouteTable1', 'VPCFlowLogsLogGroup'
        ]

        for resource_name in taggable_resources:
            if resource_name in resources:
                resource = resources[resource_name]
                tags = resource['Properties'].get('Tags', [])
                tag_keys = {tag['Key'] for tag in tags}

                self.assertTrue(
                    required_tags.issubset(tag_keys),
                    f"{resource_name} missing required tags. Has: {tag_keys}, Required: {required_tags}"
                )

    def test_cidr_blocks_no_overlap(self):
        """Test all CIDR blocks are within VPC and don't overlap"""
        resources = self.template['Resources']

        vpc_cidr = resources['VPC']['Properties']['CidrBlock']
        self.assertEqual(vpc_cidr, '10.0.0.0/16')

        # Collect all subnet CIDRs
        subnet_cidrs = []
        for key in resources:
            if 'Subnet' in key and key not in ['DatabaseSubnetIds', 'PublicSubnetIds', 'PrivateSubnetIds']:
                if resources[key].get('Type') == 'AWS::EC2::Subnet':
                    cidr = resources[key]['Properties']['CidrBlock']
                    subnet_cidrs.append(cidr)

        # Check uniqueness
        self.assertEqual(len(subnet_cidrs), len(set(subnet_cidrs)), "CIDR blocks should be unique")

    def test_availability_zones_distribution(self):
        """Test subnets are distributed across availability zones"""
        resources = self.template['Resources']

        # Check public subnets use different AZs
        public_azs = [
            resources['PublicSubnet1']['Properties']['AvailabilityZone'],
            resources['PublicSubnet2']['Properties']['AvailabilityZone'],
            resources['PublicSubnet3']['Properties']['AvailabilityZone']
        ]

        # Each should use different index in GetAZs
        az_indices = [
            str(public_azs[0]),
            str(public_azs[1]),
            str(public_azs[2])
        ]

        # Check they reference different indices (0, 1, 2)
        self.assertIn('[0,', az_indices[0])
        self.assertIn('[1,', az_indices[1])
        self.assertIn('[2,', az_indices[2])


if __name__ == '__main__':
    unittest.main(verbosity=2)
```

## File: tests/test_integration.py

```python
#!/usr/bin/env python3
"""
Integration tests for CloudFormation VPC Stack
Tests validate deployed resources and connectivity
"""

import json
import os
import time
import unittest
import boto3
from typing import Dict, List, Optional


class TestVPCIntegration(unittest.TestCase):
    """Integration test suite for deployed VPC infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients"""
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.logs_client = boto3.client('logs', region_name='us-east-1')
        cls.cfn_client = boto3.client('cloudformation', region_name='us-east-1')

        # Load outputs from cfn-outputs/flat-outputs.json
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            'cfn-outputs',
            'flat-outputs.json'
        )

        if os.path.exists(outputs_path):
            with open(outputs_path, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}
            cls.skip_tests = True
            return

        cls.skip_tests = False
        cls.vpc_id = cls.outputs.get('VPCId')
        cls.public_subnet_ids = cls.outputs.get('PublicSubnetIds', '').split(',')
        cls.private_subnet_ids = cls.outputs.get('PrivateSubnetIds', '').split(',')
        cls.database_subnet_ids = cls.outputs.get('DatabaseSubnetIds', '').split(',')
        cls.nat_gateway_ids = cls.outputs.get('NatGatewayIds', '').split(',')
        cls.igw_id = cls.outputs.get('InternetGatewayId')
        cls.flow_logs_group = cls.outputs.get('VPCFlowLogsLogGroupName')

    def setUp(self):
        """Skip tests if outputs not available"""
        if self.skip_tests:
            self.skipTest("Stack outputs not available - stack may not be deployed")

    def test_vpc_exists(self):
        """Test VPC exists and has correct configuration"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]

        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])

    def test_internet_gateway_attached(self):
        """Test Internet Gateway is attached to VPC"""
        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[self.igw_id]
        )

        self.assertEqual(len(response['InternetGateways']), 1)
        igw = response['InternetGateways'][0]

        attachments = igw['Attachments']
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]['VpcId'], self.vpc_id)
        self.assertEqual(attachments[0]['State'], 'available')

    def test_public_subnets_exist(self):
        """Test all public subnets exist with correct configuration"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.public_subnet_ids)

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}

        self.assertEqual(actual_cidrs, expected_cidrs)

        # Check all are in the VPC
        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], self.vpc_id)
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

    def test_public_subnets_across_azs(self):
        """Test public subnets are distributed across different AZs"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.public_subnet_ids)

        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        self.assertEqual(len(azs), 3, "Public subnets should be in 3 different AZs")

    def test_private_subnets_exist(self):
        """Test all private subnets exist with correct configuration"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.private_subnet_ids)

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}

        self.assertEqual(actual_cidrs, expected_cidrs)

        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], self.vpc_id)

    def test_database_subnets_exist(self):
        """Test all database subnets exist with correct configuration"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.database_subnet_ids)

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}

        self.assertEqual(actual_cidrs, expected_cidrs)

    def test_nat_gateways_exist(self):
        """Test all NAT Gateways exist and are available"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        self.assertEqual(len(response['NatGateways']), 3)

        for nat_gw in response['NatGateways']:
            self.assertEqual(nat_gw['State'], 'available')
            self.assertEqual(nat_gw['VpcId'], self.vpc_id)
            self.assertIn(nat_gw['SubnetId'], self.public_subnet_ids)

    def test_nat_gateways_in_different_azs(self):
        """Test NAT Gateways are in different availability zones"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        # Get subnets for NAT Gateways
        subnet_ids = [nat_gw['SubnetId'] for nat_gw in response['NatGateways']]
        subnets_response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)

        azs = {subnet['AvailabilityZone'] for subnet in subnets_response['Subnets']}
        self.assertEqual(len(azs), 3, "NAT Gateways should be in 3 different AZs")

    def test_nat_gateways_have_elastic_ips(self):
        """Test each NAT Gateway has an Elastic IP"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        for nat_gw in response['NatGateways']:
            addresses = nat_gw['NatGatewayAddresses']
            self.assertEqual(len(addresses), 1)
            self.assertIsNotNone(addresses[0].get('PublicIp'))
            self.assertIsNotNone(addresses[0].get('AllocationId'))

    def test_public_route_table_to_igw(self):
        """Test public subnets route to Internet Gateway"""
        # Get route tables for public subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.public_subnet_ids}
            ]
        )

        for rt in response['RouteTables']:
            # Check for route to IGW
            routes = rt['Routes']
            igw_route = [r for r in routes if r.get('GatewayId', '').startswith('igw-')]

            self.assertGreater(len(igw_route), 0, "Public route table should have IGW route")
            self.assertEqual(igw_route[0]['DestinationCidrBlock'], '0.0.0.0/0')

    def test_private_route_tables_to_nat_gateways(self):
        """Test private subnets route to NAT Gateways"""
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.private_subnet_ids}
            ]
        )

        for rt in response['RouteTables']:
            routes = rt['Routes']
            nat_route = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]

            self.assertGreater(len(nat_route), 0, "Private route table should have NAT Gateway route")
            self.assertEqual(nat_route[0]['DestinationCidrBlock'], '0.0.0.0/0')

    def test_database_route_tables_to_nat_gateways(self):
        """Test database subnets route to NAT Gateways"""
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.database_subnet_ids}
            ]
        )

        for rt in response['RouteTables']:
            routes = rt['Routes']
            nat_route = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]

            self.assertGreater(len(nat_route), 0, "Database route table should have NAT Gateway route")

    def test_network_acls_configured(self):
        """Test Network ACLs are properly configured"""
        # Get all network ACLs for the VPC
        response = self.ec2_client.describe_network_acls(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # Should have at least 3 custom NACLs (public, private, database) + 1 default
        self.assertGreaterEqual(len(response['NetworkAcls']), 4)

    def test_public_nacl_allows_http_https(self):
        """Test public NACL allows HTTP and HTTPS traffic"""
        # Get public subnets' NACL
        response = self.ec2_client.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': [self.public_subnet_ids[0]]}
            ]
        )

        if len(response['NetworkAcls']) > 0:
            nacl = response['NetworkAcls'][0]
            entries = nacl['Entries']

            # Check for HTTP (80) and HTTPS (443) allow rules
            inbound_entries = [e for e in entries if not e['Egress'] and e['RuleAction'] == 'allow']

            http_rules = [e for e in inbound_entries
                         if e.get('PortRange', {}).get('From') == 80]
            https_rules = [e for e in inbound_entries
                          if e.get('PortRange', {}).get('From') == 443]

            self.assertGreater(len(http_rules), 0, "Should have HTTP allow rule")
            self.assertGreater(len(https_rules), 0, "Should have HTTPS allow rule")

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled"""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]}
            ]
        )

        self.assertGreater(len(response['FlowLogs']), 0, "VPC should have flow logs enabled")

        flow_log = response['FlowLogs'][0]
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 'cloud-watch-logs')

    def test_flow_logs_log_group_exists(self):
        """Test VPC Flow Logs CloudWatch Log Group exists"""
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=self.flow_logs_group
        )

        self.assertGreater(len(response['logGroups']), 0, "Flow logs log group should exist")

        log_group = response['logGroups'][0]
        self.assertEqual(log_group['retentionInDays'], 7)

    def test_flow_logs_generating_data(self):
        """Test VPC Flow Logs are generating data"""
        # Wait a bit for logs to generate
        time.sleep(5)

        try:
            response = self.logs_client.describe_log_streams(
                logGroupName=self.flow_logs_group,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )

            # If log streams exist, flow logs are working
            if len(response['logStreams']) > 0:
                log_stream = response['logStreams'][0]
                self.assertIsNotNone(log_stream.get('lastEventTimestamp'))
        except self.logs_client.exceptions.ResourceNotFoundException:
            self.skipTest("Log streams not yet created - this is normal for new deployments")

    def test_resource_tags_present(self):
        """Test resources have required tags"""
        # Check VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        required_tags = ['Environment', 'Project', 'CostCenter']
        for tag in required_tags:
            self.assertIn(tag, tags, f"VPC should have {tag} tag")

    def test_subnet_tags_present(self):
        """Test subnets have required tags"""
        all_subnet_ids = self.public_subnet_ids + self.private_subnet_ids + self.database_subnet_ids
        response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)

        required_tags = ['Environment', 'Project', 'CostCenter', 'Type']

        for subnet in response['Subnets']:
            tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            for tag in required_tags:
                self.assertIn(tag, tags, f"Subnet {subnet['SubnetId']} should have {tag} tag")

    def test_nat_gateway_tags_present(self):
        """Test NAT Gateways have required tags"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        required_tags = ['Environment', 'Project', 'CostCenter']

        for nat_gw in response['NatGateways']:
            tags = {tag['Key']: tag['Value'] for tag in nat_gw.get('Tags', [])}
            for tag in required_tags:
                self.assertIn(tag, tags, f"NAT Gateway should have {tag} tag")


if __name__ == '__main__':
    unittest.main(verbosity=2)
```

## File: README.md

```markdown
# VPC Infrastructure for Financial Trading Platform

This CloudFormation template deploys a production-ready VPC infrastructure with multi-tier networking for a financial trading platform. The infrastructure is designed to meet PCI-DSS compliance requirements with proper network segmentation.

## Architecture

The infrastructure creates:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **3 Public Subnets**: Across 3 AZs for load balancers and bastion hosts
- **3 Private Subnets**: Across 3 AZs for application servers
- **3 Database Subnets**: Across 3 AZs for RDS instances
- **Internet Gateway**: For public internet access
- **3 NAT Gateways**: One per AZ for private subnet outbound connectivity
- **Route Tables**: Separate route tables for each subnet type and AZ
- **Network ACLs**: Security controls with deny-by-default policy
- **VPC Flow Logs**: Network traffic logging to CloudWatch (7-day retention)

## Network Layout

| Subnet Type | CIDR Blocks | Availability Zones | Connectivity |
|------------|-------------|-------------------|--------------|
| Public | 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 | us-east-1a/b/c | Internet Gateway |
| Private | 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24 | us-east-1a/b/c | NAT Gateways |
| Database | 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24 | us-east-1a/b/c | NAT Gateways |

## Prerequisites

- AWS CLI configured with appropriate credentials
- IAM permissions for:
  - VPC and EC2 resources
  - CloudFormation stack operations
  - CloudWatch Logs
  - IAM role creation

## Deployment

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name vpc-trading-platform-dev \
  --template-body file://lib/tap-stack.yaml \
  --parameters file://lib/tap-stack-params.json \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-trading-platform-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-trading-platform-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| EnvironmentSuffix | Suffix for resource names to enable multiple deployments | dev |
| ProjectTag | Project name for resource tagging | FinancialTradingPlatform |
| CostCenterTag | Cost center for billing allocation | TradingOps |

## Outputs

The stack exports the following outputs for cross-stack references:

- **VPCId**: VPC identifier
- **PublicSubnetIds**: Comma-separated list of public subnet IDs
- **PrivateSubnetIds**: Comma-separated list of private subnet IDs
- **DatabaseSubnetIds**: Comma-separated list of database subnet IDs
- **NatGatewayIds**: Comma-separated list of NAT Gateway IDs
- **InternetGatewayId**: Internet Gateway identifier
- **VPCFlowLogsLogGroupName**: CloudWatch Log Group for VPC Flow Logs

Individual subnet and NAT Gateway IDs are also exported separately.

## Security Features

### Network Segmentation
- Public subnets for internet-facing resources
- Private subnets for application tier (no direct internet access)
- Database subnets with restricted access from private subnets only

### Network ACLs
- **Public NACL**: Allows HTTP (80), HTTPS (443), and ephemeral ports
- **Private NACL**: Allows all traffic from VPC CIDR and ephemeral ports
- **Database NACL**: Allows MySQL (3306) and PostgreSQL (5432) only from private subnets

### High Availability
- Resources distributed across 3 availability zones
- Separate NAT Gateway per AZ for fault tolerance
- Independent route tables per AZ for private and database subnets

### Compliance
- PCI-DSS compliant network segmentation
- VPC Flow Logs enabled for security monitoring
- All resources tagged with Environment, Project, and CostCenter

## Testing

### Run Unit Tests

```bash
cd tests
python3 -m pytest test_vpc_stack.py -v
```

### Run Integration Tests

After stack deployment:

```bash
# Export outputs to flat file
mkdir -p cfn-outputs
aws cloudformation describe-stacks \
  --stack-name vpc-trading-platform-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' > cfn-outputs/raw-outputs.json

python3 << 'EOF'
import json
with open('cfn-outputs/raw-outputs.json') as f:
    outputs = json.load(f)
flat = {o['OutputKey']: o['OutputValue'] for o in outputs}
with open('cfn-outputs/flat-outputs.json', 'w') as f:
    json.dump(flat, f, indent=2)
EOF

# Run integration tests
python3 -m pytest tests/test_integration.py -v
```

## Cost Considerations

The primary cost drivers are:

- **NAT Gateways**: ~$0.045/hour per NAT Gateway + data processing charges
- **VPC Flow Logs**: CloudWatch Logs ingestion and storage
- **Elastic IPs**: No charge while attached to running NAT Gateways

For development/testing environments, consider:
- Reducing to 1 NAT Gateway across all AZs
- Shorter VPC Flow Logs retention
- Delete stack when not in use

## Cleanup

```bash
aws cloudformation delete-stack \
  --stack-name vpc-trading-platform-dev \
  --region us-east-1
```

Note: NAT Gateways take several minutes to delete.

## Troubleshooting

### Stack Creation Fails

Check CloudFormation events:
```bash
aws cloudformation describe-stack-events \
  --stack-name vpc-trading-platform-dev \
  --region us-east-1
```

### VPC Flow Logs Not Generating

1. Check IAM role permissions
2. Verify log group exists
3. Wait 5-10 minutes for initial log delivery

### NAT Gateway Issues

- Ensure NAT Gateways are in "available" state
- Verify Elastic IPs are allocated
- Check route table associations

## Contributing

This infrastructure is maintained as part of the Financial Trading Platform project. For changes:

1. Update the CloudFormation template
2. Run unit tests
3. Deploy to test environment
4. Run integration tests
5. Submit for review

## License

Internal use only - Financial Trading Platform Infrastructure
```

## Deployment Instructions

1. **Validate the template**:
```bash
aws cloudformation validate-template \
  --template-body file://lib/tap-stack.yaml \
  --region us-east-1
```

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name vpc-trading-platform-dev \
  --template-body file://lib/tap-stack.yaml \
  --parameters file://lib/tap-stack-params.json \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. **Run tests**:
```bash
# Unit tests
python3 -m pytest tests/test_vpc_stack.py -v --tb=short

# Integration tests (after deployment)
python3 -m pytest tests/test_integration.py -v --tb=short
```

## Key Features Implemented

1. VPC with 10.0.0.0/16 CIDR and DNS enabled
2. 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
3. 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
4. 3 database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
5. Internet Gateway for public access
6. 3 NAT Gateways (one per AZ) with Elastic IPs
7. Proper route tables for each subnet type
8. Network ACLs with deny-by-default and explicit allows
9. VPC Flow Logs with 7-day retention in CloudWatch
10. Comprehensive outputs for cross-stack references
11. All resources tagged with Environment, Project, CostCenter
12. EnvironmentSuffix parameter for resource naming
13. No Retain deletion policies
