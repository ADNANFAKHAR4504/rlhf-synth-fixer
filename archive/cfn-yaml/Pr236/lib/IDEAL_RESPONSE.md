### ✅ Ideal Response Checklist for CloudFormation YAML Template

The generated template is correct because:

- ✅ **VPC** is created with `10.0.0.0/16` CIDR, DNS support, and correct tags.
- ✅ **Public Subnets A & B** are created with proper CIDRs and dynamic AZ mapping using `!Select` and `!GetAZs`.
- ✅ **Internet Gateway** is provisioned and attached to the VPC.
- ✅ **Route Table** includes a default route to the IGW.
- ✅ **Subnet Associations** ensure both subnets are linked to the public route table.
- ✅ **All resources are tagged** with `Environment: Production` and `ManagedBy: CloudFormation`.
- ✅ **Outputs** export useful values like Subnet IDs, VPC ID, Route Table ID, etc.
- ✅ **YAML structure** is valid, indented properly, and deployable without errors.

yaml:
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Basic Production Network Infrastructure - VPC with Public Subnets'

Resources:
  ProductionVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: ProductionVPC
        - Key: Environment
          Value: Production
        - Key: ManagedBy
          Value: CloudFormation

  IGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: IGW
        - Key: Environment
          Value: Production
        - Key: ManagedBy
          Value: CloudFormation

  AttachIGW:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProductionVPC
      InternetGatewayId: !Ref IGW

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs us-east-1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnetA
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Public
        - Key: ManagedBy
          Value: CloudFormation

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs us-east-1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnetB
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Public
        - Key: ManagedBy
          Value: CloudFormation

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: PublicRouteTable
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Public
        - Key: ManagedBy
          Value: CloudFormation

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachIGW
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref IGW

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

Outputs:
  VPCId:
    Description: 'The ID of the created VPC'
    Value: !Ref ProductionVPC
    Export:
      Name: !Sub ${AWS::StackName}-VPCId

  PublicSubnetAId:
    Description: 'ID of Public Subnet A'
    Value: !Ref PublicSubnetA
    Export:
      Name: !Sub ${AWS::StackName}-PublicSubnetAId

  PublicSubnetBId:
    Description: 'ID of Public Subnet B'
    Value: !Ref PublicSubnetB
    Export:
      Name: !Sub ${AWS::StackName}-PublicSubnetBId

  InternetGatewayId:
    Description: 'ID of the Internet Gateway'
    Value: !Ref IGW
    Export:
      Name: !Sub ${AWS::StackName}-InternetGatewayId

  PublicRouteTableId:
    Description: 'ID of the Public Route Table'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub ${AWS::StackName}-PublicRouteTableId

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub ${AWS::StackName}-StackName