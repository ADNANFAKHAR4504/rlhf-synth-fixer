# AWS CloudFormation Template for VPC with EC2 and S3

Here's a CloudFormation template for creating AWS infrastructure:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: VPC with EC2 and S3 bucket

Mappings:
  RegionMap:
    us-west-2:
      AZ1: us-west-2a
      AZ2: us-west-2b

Parameters:
  EnvironmentName:
    Type: String
    Default: dev

Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-vpc"
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref "AWS::Region", AZ1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref "AWS::Region", AZ2]
      Tags:
        - Key: Name
          Value: Private Subnet
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: Internet Gateway
        - Key: Environment
          Value: !Ref EnvironmentName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC
      Tags:
        - Key: Name
          Value: Public Routes
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC
      Tags:
        - Key: Name
          Value: Private Routes
        - Key: Environment
          Value: !Ref EnvironmentName

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

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
      Tags:
        - Key: Name
          Value: EC2 S3 Role
        - Key: Environment
          Value: !Ref EnvironmentName

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: ami-0c55b159cbfafe1f0
      SubnetId: !Ref PublicSubnet
      IamInstanceProfile: !Ref InstanceProfile
      Tags:
        - Key: Name
          Value: Web Server
        - Key: Environment
          Value: !Ref EnvironmentName

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: LogDeliveryWrite
      Tags:
        - Key: Name
          Value: CloudWatch Logs Bucket
        - Key: Environment
          Value: !Ref EnvironmentName
```

This template creates:
- A VPC with public and private subnets
- Internet Gateway and NAT Gateway for routing
- EC2 instance with IAM role for S3 access
- S3 bucket for storing logs