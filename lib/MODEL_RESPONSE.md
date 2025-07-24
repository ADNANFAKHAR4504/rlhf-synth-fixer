AWSTemplateFormatVersion: '2010-09-09'
Description: Basic development environment setup with VPC, subnets, EC2 instances, and security groups.

Parameters:
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access
    Type: 'AWS::EC2::KeyPair::KeyName'
    ConstraintDescription: Must be the name of an existing EC2 KeyPair.

Resources:
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: Development

  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Environment
          Value: Development

  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: us-east-1b
      Tags:
        - Key: Environment
          Value: Development

  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Environment
          Value: Development

  VPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Development

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  InstanceSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: Enable SSH and HTTP access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: Development

  EC2Instance1:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      NetworkInterfaces:
        - DeviceIndex: '0'
          SubnetId: !Ref PublicSubnet1
          AssociatePublicIpAddress: true
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

  EC2Instance2:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      NetworkInterfaces:
        - DeviceIndex: '0'
          SubnetId: !Ref PublicSubnet2
          AssociatePublicIpAddress: true
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

Outputs:
  EC2Instance1PublicDNS:
    Description: Public DNS name of the first EC2 instance
    Value: !GetAtt EC2Instance1.PublicDnsName

  EC2Instance2PublicDNS:
    Description: Public DNS name of the second EC2 instance
    Value: !GetAtt EC2Instance2.PublicDnsName