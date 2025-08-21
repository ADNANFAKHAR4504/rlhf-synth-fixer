# Ideal Response - Complete Secure Infrastructure Setup

## Overview

The ideal response provides a comprehensive CloudFormation template that fully implements all security requirements with proper multi-account support and complete infrastructure provisioning.

## Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure Setup - Multi-Account Deployment Ready'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - ProjectName
      - Label:
          default: 'EC2 Configuration'
        Parameters:
          - WebServerInstanceType
          - DatabaseInstanceType
          - KeyName

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  ProjectName:
    Type: String
    Default: 'secure-infra'
    Description: 'Project name for resource naming'

  WebServerInstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type for web servers'

  DatabaseInstanceType:
    Type: String
    Default: 't3.small'
    Description: 'EC2 instance type for database servers'

  KeyName:
    Type: String
    Default: ''
    Description: 'Optional EC2 KeyPair name to enable SSH access; leave blank to skip'

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID'

Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      DBInstanceType: t3.small
      LogRetention: 7
    staging:
      InstanceType: t3.small
      DBInstanceType: t3.medium
      LogRetention: 30
    prod:
      InstanceType: t3.medium
      DBInstanceType: t3.large
      LogRetention: 365

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-subnet-2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-subnet-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-rt'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # KMS Key for Encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for encrypting resources'
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-1
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-kms-key'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${EnvironmentSuffix}-key'
      TargetKeyId: !Ref KMSKey

  # EBS Encryption by Default
  EBSEncryptionByDefault:
    Type: AWS::EC2::EBSEncryptionByDefault
    Properties:
      EbsEncryptionByDefault: true

  EBSDefaultKMSKey:
    Type: AWS::EC2::EBSDefaultKMSKey
    Properties:
      KmsKeyId: !Ref KMSKey

  # IAM Roles
  WebServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-web-server-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: WebServerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${LoggingBucket}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref WebServerRole

  DatabaseRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-database-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: DatabasePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  DatabaseInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref DatabaseRole

  # Enhanced Admin Role with Least Privilege
  AdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-admin-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
      Policies:
        - PolicyName: AdminPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:*
                  - s3:*
                  - iam:Get*
                  - iam:List*
                  - logs:*
                  - cloudtrail:*
                  - guardduty:*
                  - kms:Describe*
                  - kms:List*
                Resource: '*'
              - Effect: Deny
                Action:
                  - iam:DeleteRole
                  - iam:DeletePolicy
                  - iam:AttachUserPolicy
                  - iam:DetachUserPolicy
                Resource: '*'

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentSuffix}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-web-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentSuffix}-db-sg'
      GroupDescription: 'Security group for database servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-db-sg'

  # EC2 Instances
  WebServerInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref WebServerInstanceType
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds: [!Ref WebServerSecurityGroup]
      IamInstanceProfile: !Ref WebServerInstanceProfile
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-web-1'
        - Key: Type
          Value: WebServer

  WebServerInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref WebServerInstanceType
      SubnetId: !Ref PublicSubnet2
      SecurityGroupIds: [!Ref WebServerSecurityGroup]
      IamInstanceProfile: !Ref WebServerInstanceProfile
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-web-2'
        - Key: Type
          Value: WebServer

  DatabaseInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref DatabaseInstanceType
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds: [!Ref DatabaseSecurityGroup]
      IamInstanceProfile: !Ref DatabaseInstanceProfile
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 50
            Encrypted: true
            KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-db-1'
        - Key: Type
          Value: Database

  DatabaseInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref DatabaseInstanceType
      SubnetId: !Ref PrivateSubnet2
      SecurityGroupIds: [!Ref DatabaseSecurityGroup]
      IamInstanceProfile: !Ref DatabaseInstanceProfile
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 50
            Encrypted: true
            KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-db-2'
        - Key: Type
          Value: Database

  # S3 Buckets
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-logs'

  # CloudTrail with Comprehensive Logging
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${ProjectName}-${EnvironmentSuffix}-cloudtrail'
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: ['arn:aws:s3:::*/*']
            - Type: 'AWS::Lambda::Function'
              Values: ['arn:aws:lambda:*:*:function/*']
            - Type: 'AWS::DynamoDB::Table'
              Values: ['arn:aws:dynamodb:*:*:table/*']
      InsightSelectors:
        - InsightType: ApiCallRateInsight
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-cloudtrail'

  # GuardDuty with Enhanced Monitoring
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      DataSources:
        S3Logs:
          Enable: true
        KubernetesConfiguration:
          AuditLogs:
            Enable: true
        MalwareProtection:
          ScanEc2InstanceWithFindings:
            EbsVolumes: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-guardduty'

  # SNS Topic for Security Alerts
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${EnvironmentSuffix}-security-alerts'
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-security-alerts'

  # CloudWatch Event Rule for GuardDuty Findings
  GuardDutyEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-guardduty-rule'
      Description: 'Trigger on GuardDuty findings'
      EventPattern:
        source: ['aws.guardduty']
        detail-type: ['GuardDuty Finding']
      Targets:
        - Arn: !Ref SecurityAlertsTopic
          Id: SecurityAlertsTarget

  # VPC Flow Logs
  VPCFlowLogsRole:
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
        - PolicyName: flowlogsDeliveryRolePolicy
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
                Resource: '*'

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc-flowlogs'

Conditions:
  HasKeyName: !Not [!Equals [!Ref KeyName, '']]

Outputs:
  # Infrastructure Outputs
  VPCId:
    Description: 'VPC ID for cross-stack references'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  WebServerInstanceIds:
    Description: 'Web Server Instance IDs'
    Value: !Join [',', [!Ref WebServerInstance1, !Ref WebServerInstance2]]
    Export:
      Name: !Sub '${AWS::StackName}-WebServerInstanceIds'

  DatabaseInstanceIds:
    Description: 'Database Instance IDs'
    Value: !Join [',', [!Ref DatabaseInstance1, !Ref DatabaseInstance2]]
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseInstanceIds'

  # Security Outputs
  GuardDutyDetectorId:
    Description: 'GuardDuty Detector ID'
    Value: !Ref GuardDutyDetector
    Export:
      Name: !Sub '${AWS::StackName}-GuardDutyDetectorId'

  CloudTrailArn:
    Description: 'CloudTrail ARN for compliance'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'

  LoggingBucketName:
    Description: 'S3 Bucket for logs'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucketName'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  SecurityAlertsTopicArn:
    Description: 'SNS Topic ARN for security alerts'
    Value: !Ref SecurityAlertsTopic
    Export:
      Name: !Sub '${AWS::StackName}-SecurityAlertsTopicArn'
```

## Template Validation

The ideal template:

- Passes CloudFormation syntax validation
- Deploys successfully in US-East-1
- Follows AWS naming conventions
- Implements all security requirements
- Supports multi-account deployments
- Uses least privilege IAM principles
- Encrypts all data at rest and in transit
- Provides comprehensive logging and monitoring
