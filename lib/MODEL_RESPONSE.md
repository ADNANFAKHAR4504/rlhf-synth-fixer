AWSTemplateFormatVersion: '2010-09-09'
Description: Secure, auditable, high-availability infrastructure for a multi-tier app.

Parameters:
  SSHLocation:
    Type: String
    Description: CIDR range for SSH access.

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties: 
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1b
      MapPublicIpOnLaunch: true

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-east-1a

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: us-east-1b

  IAMRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [lambda.amazonaws.com, ec2.amazonaws.com]
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: "*"

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled

  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource: 
              - !Sub "arn:aws:s3:::${S3Bucket}/*"
          - Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:user/whitelisted-user"
            Action: "s3:*"
            Resource: 
              - !Sub "arn:aws:s3:::${S3Bucket}/*"

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.medium
      Engine: postgres
      MasterUsername: master
      MasterUserPassword: password
      MultiAZ: true
      StorageEncrypted: true
      BackupRetentionPeriod: 7
      DeletionProtection: true
      VPCSecurityGroups: 
        - !Ref DBSecurityGroup

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow PostgreSQL access
      VpcId: !Ref VPC

  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt IAMRole.Arn
      Runtime: python3.8
      Code:
        ZipFile: |
          import boto3
          def handler(event, context):
              print("Backup triggered")

  CloudWatchEventRule:
    Type: AWS::Events::Rule
    Properties:
      ScheduleExpression: "cron(0 1 * * ? *)"
      Targets:
        - Arn: !GetAtt LambdaFunction.Arn
          Id: "BackupTrigger"

  SNSTopic:
    Type: AWS::SNS::Topic

  SNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Endpoint: example@example.com
      Protocol: email
      TopicArn: !Ref SNSTopic

  ConfigRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: tag-compliance
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters:
        tag1Key: Environment
        tag2Key: Owner

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.DomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: ""
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          ViewerProtocolPolicy: redirect-to-https
          TargetOriginId: S3Origin
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        ViewerCertificate:
          CloudFrontDefaultCertificate: true

  FlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled

  FlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt FlowLogsBucket.Arn
      LogGroupName: VPCFlowLogs
      ResourceId: !Ref VPC
      TrafficType: ALL

  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties: 
      Enable: true

Outputs:
  VPCId:
    Value: !Ref VPC
  S3BucketName:
    Value: !Ref S3Bucket