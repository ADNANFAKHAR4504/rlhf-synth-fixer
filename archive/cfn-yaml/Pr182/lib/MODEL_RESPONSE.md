AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to create a VPC, subnets, EC2 instances, S3 bucket, and NAT Gateway.

Parameters:
  VpcCidrBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for the VPC.

  PublicSubnet1CidrBlock:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for the first public subnet.

  PublicSubnet2CidrBlock:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for the second public subnet.

  PrivateSubnet1CidrBlock:
    Type: String
    Default: '10.0.3.0/24'
    Description: CIDR block for the first private subnet.

  PrivateSubnet2CidrBlock:
    Type: String
    Default: '10.0.4.0/24'
    Description: CIDR block for the second private subnet.

Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsSupport: true
      EnableDnsHostnames: true

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: !Ref PublicSubnet1CidrBlock
      AvailabilityZone: us-west-2a
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: !Ref PublicSubnet2CidrBlock
      AvailabilityZone: us-west-2b
      MapPublicIpOnLaunch: true

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: !Ref PrivateSubnet1CidrBlock
      AvailabilityZone: us-west-2a

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: !Ref PrivateSubnet2CidrBlock
      AvailabilityZone: us-west-2b

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  NatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1

  PrivateRouteNatGateway:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  MyS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled

  MyEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: ami-0abcdef1234567890 # Replace with a valid AMI ID
      SubnetId: !Ref PrivateSubnet1

Outputs:
  VPCId:
    Description: The ID of the VPC
    Value: !Ref MyVPC

  S3BucketName:
    Description: The name of the S3 bucket
    Value: !Ref MyS3Bucket