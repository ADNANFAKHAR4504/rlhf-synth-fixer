```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template for setting up a development environment in AWS

Parameters:
  InstanceType:
    Type: String
    Default: t2.micro
    Description: EC2 instance type
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instance

Resources:
  DevelopmentS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: PublicRead
      BucketName: !Sub 'dev-bucket-${AWS::AccountId}-${AWS::Region}'
      Tags:
        - Key: Environment
          Value: Development
    DeletionPolicy: Retain

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref DevelopmentS3Bucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: s3:GetObject
            Resource: !Sub 'arn:aws:s3:::${DevelopmentS3Bucket}/*'

  S3BucketLogging:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${DevelopmentS3Bucket}-logs'
      AccessControl: LogDeliveryWrite

  DevelopmentS3BucketLoggingConfiguration:
    Type: AWS::S3::BucketLoggingConfiguration
    Properties:
      DestinationBucketName: !Ref S3BucketLogging
      LogFilePrefix: logs/
      BucketName: !Ref DevelopmentS3Bucket

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: s3:Get*
                Resource: '*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      SecurityGroupIds:
        - sg-67890
      ImageId: ami-0abcdef1234567890 # Replace with a valid AMI ID in us-west-2
      SubnetId: !Select 
        - 0 
        - !GetAtt VPC.PublicSubnets
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Environment
          Value: Development

  EIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      InstanceId: !Ref EC2Instance

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: Development

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Development

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: us-west-2a
      Tags:
        - Key: Environment
          Value: Development

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  SecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: sg-67890
      IpProtocol: tcp
      FromPort: 22
      ToPort: 22
      CidrIp: 203.0.113.0/24

  CloudWatchAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if CPU exceeds 80% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance
      AlarmActions: []

Outputs:
  S3BucketName:
    Value: !Ref DevelopmentS3Bucket
    Description: Name of the S3 bucket

  EC2PublicIP:
    Value: !GetAtt EIP.PublicIp
    Description: Public IP address of the EC2 instance