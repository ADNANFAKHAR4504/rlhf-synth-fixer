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

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

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

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

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
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"
        - PolicyName: SecretsManagerReadPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref RDSSecret

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
          - Sid: AllowCloudFrontOAIAccess
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}"
            Action:
              - s3:GetObject
            Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "arn:aws:s3:::${S3Bucket}"
              - !Sub "arn:aws:s3:::${S3Bucket}/*"
            Condition:
              Bool:
                aws:SecureTransport: false

  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: RDS PostgreSQL master password
      GenerateSecretString:
        SecretStringTemplate: '{"username": "master"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.medium
      Engine: postgres
      MasterUsername: !Sub '{{resolve:secretsmanager:${RDSSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
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

  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: OAI for S3 bucket access

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.RegionalDomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${CloudFrontOAI}"
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          ViewerProtocolPolicy: redirect-to-https
          TargetOriginId: S3Origin
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          AllowedMethods:
            - GET
            - HEAD
          CachedMethods:
            - GET
            - HEAD
        ViewerCertificate:
          CloudFrontDefaultCertificate: true

  FlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  FlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !GetAtt FlowLogsLogGroup.Arn

  FlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/vpc/flowlogs
      RetentionInDays: 7

  FlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref FlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt FlowLogsRole.Arn

  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      IsLogging: true
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      S3BucketName: !Ref CloudTrailBucket
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      SnsTopicName: !GetAtt SNSTopic.TopicName

  EventBridgeRuleForGuardDuty:
    Type: AWS::Events::Rule
    Properties:
      Description: Send GuardDuty findings to SNS
      State: ENABLED
      EventPattern:
        source:
          - aws.guardduty
        detail-type:
          - GuardDuty Finding
      Targets:
        - Arn: !Ref SNSTopic
          Id: GuardDutyToSNS

  SNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SNSTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudTrailPublish
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: SNS:Publish
            Resource: !Ref SNSTopic
          - Sid: AllowEventBridgePublish
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: SNS:Publish
            Resource: !Ref SNSTopic

Outputs:
  VPCId:
    Value: !Ref VPC
  S3BucketName:
    Value: !Ref S3Bucket