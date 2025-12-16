AWSTemplateFormatVersion: '2010-09-09'
Description: >
  AWS CloudFormation template to create a VPC with public and private subnets,
  an Internet Gateway, a NAT Gateway, and two EC2 instances.

Parameters:
  VpcCidrBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for the VPC.

  PublicSubnetCidrBlock:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for the public subnet.

  PrivateSubnetCidrBlock:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for the private subnet.

  AllowedSSHLocation:
    Type: String
    Description: The IP address range that can be used to SSH into the EC2 instances.

  InstanceType:
    Type: String
    Default: 't2.micro'
    Description: EC2 instance type.

  KeyName:
    Type: 'AWS::EC2::KeyPair::KeyName'
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instances.

Resources:
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: MyVPC

  PublicSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidrBlock
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet

  PrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidrBlock
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      Tags:
        - Key: Name
          Value: PrivateSubnet

  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: InternetGateway

  InternetGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PublicRouteTable

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  NatGatewayEIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: NatGateway

  PrivateRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PrivateRouteTable

  PrivateRoute:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway

  PrivateSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: Enable SSH access and HTTP access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHLocation
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedSSHLocation
      Tags:
        - Key: Name
          Value: InstanceSecurityGroup

  PublicInstance:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: !Ref InstanceType
      SecurityGroupIds:
        - !Ref SecurityGroup
      KeyName: !Ref KeyName
      ImageId: ami-0abcdef1234567890 # Replace with a valid AMI ID
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: PublicInstance

  PrivateInstance:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: !Ref InstanceType
      SecurityGroupIds:
        - !Ref SecurityGroup
      KeyName: !Ref KeyName
      ImageId: ami-0abcdef1234567890 # Replace with a valid AMI ID
      SubnetId: !Ref PrivateSubnet
      Tags:
        - Key: Name
          Value: PrivateInstance