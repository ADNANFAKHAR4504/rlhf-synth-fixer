AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation template for a secure, scalable cloud environment.

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: cf-task-vpc
        - Key: Environment
          Value: Production

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Name
          Value: cf-task-public-subnet
        - Key: Environment
          Value: Production

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Name
          Value: cf-task-private-subnet
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: cf-task-igw
        - Key: Environment
          Value: Production

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: cf-task-public-rt
        - Key: Environment
          Value: Production

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: cf-task-private-rt
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: cf-task-nat
        - Key: Environment
          Value: Production

  PrivateRouteToNAT:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 192.0.2.0/24 # Replace with your IP range
      Tags:
        - Key: Name
          Value: cf-task-sg
        - Key: Environment
          Value: Production

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0abcdef1234567890 # Replace with a valid AMI ID
      KeyName: your-key-pair # Replace with your key pair name
      NetworkInterfaces:
        - DeviceIndex: 0
          SubnetId: !Ref PublicSubnet
          GroupSet:
            - !Ref EC2SecurityGroup
          AssociatePublicIpAddress: true
      Tags:
        - Key: Name
          Value: cf-task-ec2
        - Key: Environment
          Value: Production

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: cf-task-s3bucket
      Tags:
        - Key: Environment
          Value: Production

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: cf-task-snstopic
      Tags:
        - Key: Environment
          Value: Production

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub arn:aws:s3:::cf-task-s3bucket/*
        - PolicyName: LambdaSNSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSTopic

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: cf-task-lambda
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          def handler(event, context):
              sns = boto3.client('sns')
              sns.publish(TopicArn=os.environ['SNS_TOPIC_ARN'], Message='File uploaded to S3')
      Runtime: python3.9
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      Tags:
        - Key: Environment
          Value: Production

  S3BucketEventNotification:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: cf-task-s3bucket
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt LambdaFunction.Arn

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet

  PrivateSubnetId:
    Description: Private Subnet ID
    Value: !Ref PrivateSubnet