AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to migrate infrastructure to AWS with best practices.

Parameters:
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - m5.large
  InstanceCount:
    Type: Number 
    Default: 2
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
  EnvironmentSuffix:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - prod

Resources:
  # Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub VPC-${EnvironmentSuffix}

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub IGW-${EnvironmentSuffix}

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Security
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
      Policies:
        - PolicyName: EC2S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource: "*"

  # Compute
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: ami-0abcdef1234567890 # Example AMI ID
      SubnetId: !Ref Subnet
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Name
          Value: !Sub EC2-${EnvironmentSuffix}

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # AutoScaling
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: !Ref InstanceCount
      MaxSize: 5
      DesiredCapacity: !Ref InstanceCount
      LaunchConfigurationName: !Ref LaunchConfig
      VPCZoneIdentifier:
        - !Ref Subnet
      Tags:
        - Key: Name
          Value: !Sub ASG-${EnvironmentSuffix}
          PropagateAtLaunch: true

  LaunchConfig:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      ImageId: ami-0abcdef1234567890 # Example AMI ID
      InstanceType: !Ref InstanceType
      IamInstanceProfile: !Ref EC2InstanceProfile
      KeyName: !Ref KeyName
      SecurityGroups:
        - !Ref EC2SecurityGroup

  # Monitoring
  S3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub cfn-logs-${EnvironmentSuffix}
      AccessControl: LogDeliveryWrite

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC

  EC2InstanceId:
    Description: EC2 Instance ID
    Value: !Ref EC2Instance