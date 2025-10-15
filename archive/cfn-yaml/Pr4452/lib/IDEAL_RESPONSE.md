```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure production infrastructure template (parameterized).
  - Deploy region controlled via Parameter TargetRegion (default us-west-2).
  - All resources tagged with Environment: Production and iac-rlhf-amazon: "true".

Parameters:
  KeyName:
    Type: String
    Default: ""
    Description: Name of an existing EC2 KeyPair to enable SSH (optional)
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.nano
      - t3.micro
      - t3.small
      - t3.medium
    Description: EC2 instance type
  SSHLocation:
    Type: String
    Default: 0.0.0.0/0
    Description: The IP address range that can be used to SSH to the EC2 instances (CIDR)
  TargetRegion:
    Type: String
    Default: us-west-2
    Description: The region this stack is intended to deploy into (keeps template portable)

Conditions:
  DeployInTargetRegion: !Equals [ !Ref "AWS::Region", !Ref TargetRegion ]
  HasKeyName: !Not [ !Equals [ !Ref KeyName, "" ] ]

Metadata:
  cfn-outputs:
    - VpcId
    - PublicSubnetA
    - PrivateSubnetA
    - ALBArn
    - EC2InstanceId
    - ConfigBucketName
    - LogBucketName

Resources:

  ###################################################
  # IAM Roles & Instance Profile
  ###################################################
  ConfigRecorderRole:
    Type: AWS::IAM::Role
    Condition: DeployInTargetRegion
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [config.amazonaws.com]
            Action: sts:AssumeRole
      Path: /
      Description: Role used by AWS Config to record configuration
      Policies:
        - PolicyName: AWSConfigRecordingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: "*"
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: "*"
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  EC2CloudWatchAgentRole:
    Type: AWS::IAM::Role
    Condition: DeployInTargetRegion
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [ec2.amazonaws.com]
            Action: sts:AssumeRole
      Path: /
      Description: Role for EC2 to push logs & metrics to CloudWatch
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Condition: DeployInTargetRegion
    Properties:
      Roles:
        - !Ref EC2CloudWatchAgentRole
      Path: /

  ###################################################
  # S3 buckets (AES-256 & public access blocked)
  ###################################################
  LogBucket:
    Type: AWS::S3::Bucket
    Condition: DeployInTargetRegion
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ALBAccessLogBucket:
    Type: AWS::S3::Bucket
    Condition: DeployInTargetRegion
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      # Allow ALB to set the required ACL header on delivered objects
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: false   # must be false so ALB's x-amz-acl is honored
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  # Bucket policy that permits ALB log delivery to write access logs
  ALBAccessLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: DeployInTargetRegion
    Properties:
      Bucket: !Ref ALBAccessLogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow ALB log delivery service to check the bucket ACL
          - Sid: AWSLogDeliveryCheck
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub arn:aws:s3:::${ALBAccessLogBucket}
            Condition:
              StringEquals:
                aws:SourceAccount: !Ref AWS::AccountId
              ArnLike:
                aws:SourceArn: !Sub arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:loadbalancer/app/*
          # Allow ALB log delivery service to put objects with proper ACL
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub arn:aws:s3:::${ALBAccessLogBucket}/AWSLogs/${AWS::AccountId}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
                aws:SourceAccount: !Ref AWS::AccountId
              ArnLike:
                aws:SourceArn: !Sub arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:loadbalancer/app/*

  ConfigBucket:
    Type: AWS::S3::Bucket
    Condition: DeployInTargetRegion
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ###################################################
  # VPC, Subnets, IGW, Route Tables
  ###################################################
  VPC:
    Type: AWS::EC2::VPC
    Condition: DeployInTargetRegion
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: TapVPC
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Condition: DeployInTargetRegion
    Properties:
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Condition: DeployInTargetRegion
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Condition: DeployInTargetRegion
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: public-rt
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    Condition: DeployInTargetRegion
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Condition: DeployInTargetRegion
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: public-subnet-a
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Condition: DeployInTargetRegion
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: public-subnet-b
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Condition: DeployInTargetRegion
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: private-subnet-a
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Condition: DeployInTargetRegion
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: private-subnet-b
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: DeployInTargetRegion
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: DeployInTargetRegion
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  ###################################################
  # Security Groups
  ###################################################
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: DeployInTargetRegion
    Properties:
      GroupDescription: Security group for ALB (public)
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: DeployInTargetRegion
    Properties:
      GroupDescription: Security group for EC2 (private) allowing traffic from ALB and SSH
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ###################################################
  # Application Load Balancer and related
  ###################################################
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Condition: DeployInTargetRegion
    Properties:
      Name: Production-ALB
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Scheme: internet-facing
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: "true"
        - Key: access_logs.s3.bucket
          Value: !Ref ALBAccessLogBucket
        - Key: idle_timeout.timeout_seconds
          Value: '60'
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Condition: DeployInTargetRegion
    Properties:
      Name: production-targets
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckPath: /
      Targets:
        - Id: !Ref EC2Instance
          Port: 80
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: DeployInTargetRegion
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  ###################################################
  # EC2 Instance in private subnet (Detailed Monitoring true)
  ###################################################
  EC2Instance:
    Type: AWS::EC2::Instance
    Condition: DeployInTargetRegion
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !If [ HasKeyName, !Ref KeyName, !Ref "AWS::NoValue" ]
      ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
      Monitoring: true
      SubnetId: !Ref PrivateSubnetA
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: |
          #!/bin/bash -xe
          yum update -y
          yum install -y amazon-cloudwatch-agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CWAGENT'
          {
            "metrics": {
              "namespace": "EC2/Production",
              "metrics_collected": {
                "cpu": { "measurement": ["cpu_usage_idle","cpu_usage_iowait"], "metrics_collection_interval": 60 }
              }
            },
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/ec2/production/messages",
                      "timestamp_format": "%b %d %H:%M:%S"
                    }
                  ]
                }
              }
            }
          }
          CWAGENT
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ###################################################
  # CloudWatch Log Groups
  ###################################################
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Condition: DeployInTargetRegion
    Properties:
      LogGroupName: /ec2/production/messages
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ALBLogGroup:
    Type: AWS::Logs::LogGroup
    Condition: DeployInTargetRegion
    Properties:
      LogGroupName: /alb/access-logs
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: Production
        - Key: iac-rlhf-amazon
          Value: "true"

  ###################################################
  # AWS Config Recorder & Channel
  ###################################################
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Condition: DeployInTargetRegion
    Properties:
      Name: default
      RoleARN: !GetAtt ConfigRecorderRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Condition: DeployInTargetRegion
    Properties:
      S3BucketName: !Ref ConfigBucket
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

Outputs:
  VpcId:
    Condition: DeployInTargetRegion
    Description: VPC Id
    Value: !Ref VPC
  PublicSubnetA:
    Condition: DeployInTargetRegion
    Description: Public Subnet A
    Value: !Ref PublicSubnetA
  PrivateSubnetA:
    Condition: DeployInTargetRegion
    Description: Private Subnet A
    Value: !Ref PrivateSubnetA
  ALBArn:
    Condition: DeployInTargetRegion
    Description: Application Load Balancer Arn
    Value: !Ref ApplicationLoadBalancer
  EC2InstanceId:
    Condition: DeployInTargetRegion
    Description: EC2 Instance Id
    Value: !Ref EC2Instance
  ConfigBucketName:
    Condition: DeployInTargetRegion
    Description: AWS Config Delivery Bucket
    Value: !Ref ConfigBucket
  LogBucketName:
    Condition: DeployInTargetRegion
    Description: Logs bucket
    Value: !Ref LogBucket
```
