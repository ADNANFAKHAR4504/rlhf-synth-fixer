AWSTemplateFormatVersion: '2010-09-09'
Description: Basic networking setup with VPC, public/private subnets, and internet acces

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: MainVPC
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: PublicSubnet
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: MainInternetGateway
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PublicRouteTable
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable
  
  # NAT Gateway + EIP for Private Subnet
  NatEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGateway

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: MainNATGateway
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PrivateRouteTable
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable


Outputs:

  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnetId"

  PrivateSubnetId:
    Description: Private Subnet ID
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnetId"

  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway
    Export:
      Name: !Sub "${AWS::StackName}-InternetGatewayId"

  PublicRouteTableId:
    Description: Public Route Table ID
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub "${AWS::StackName}-PublicRouteTableId"
