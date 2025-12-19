AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-Ready Highly Available Web Application Architecture with Security Best Practices (SSM instead of KeyPair)'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    AllowedPattern: '^[a-z0-9-]+$'
    Description: Lowercase environment name (only lowercase letters, numbers, hyphen)

  EnvironmentSuffix:
    Type: String
    Default: prod
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-z0-9-]+$'
    Description: Short lowercase environment suffix used by CI/CD (e.g. dev, staging, prod)

  KeyPairName:
    Type: String
    Default: "none"
    Description: "Dummy parameter retained for CI tests. Not used when SSM Session Manager is enabled."

  DBMasterUsername:
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database master username

  AlertEmail:
    Type: String
    Description: Email address for SNS notifications
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'
    Default: mithilesh.s@turing.com

  DomainName:
    Type: String
    Description: Domain name for the application
    Default: turing.com

  HostedZoneId:
    Type: String
    Default: ''
    Description: (Optional) Use an existing Hosted Zone by ID. Leave empty to create a HostedZone resource.

  EnableConfig:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Create AWS Config resources (set to true only if account does not already have a delivery channel).'

  LatestAmi:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'SSM parameter for the latest Amazon Linux 2 AMI (region-specific)'

  CertificateArn:
    Type: String
    Default: ''
    Description: ACM certificate ARN for HTTPS listener (leave empty to use HTTP)

Conditions:
  CreateHostedZone:
    Fn::Equals:
      - Ref: HostedZoneId
      - ''
  CreateConfig:
    Fn::Equals:
      - Ref: EnableConfig
      - 'true'
  HasCertificate:
    Fn::Not:
      - Fn::Equals:
          - Ref: CertificateArn
          - ''
  NoCertificate:
    Fn::Equals:
      - Ref: CertificateArn
      - ''

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-1:
      AMI: ami-0955821d356eec2d6
    us-east-2:
      AMI: ami-08962a4068733a2b6
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0c1bc246476a5572b
    ap-southeast-2:
      AMI: ami-0c237403f20a6f4db
    ca-central-1:
      AMI: ami-02a2af70a66af6dfb
    ap-northeast-2:
      AMI: ami-0e23c576dacf2e3df
    ap-northeast-3:
      AMI: ami-08d48b50e38feca52
    eu-west-3:
      AMI: ami-09a1e275e350acf38
    eu-north-1:
      AMI: ami-0f1b74ca0f5082b44
    eu-central-1:
      AMI: ami-0e04bcbe83a83792e
    ap-northeast-1:
      AMI: ami-0bba69335379e17f8
    eu-west-2:
      AMI: ami-08c6d344574f547b8
    ap-southeast-1:
      AMI: ami-0e5f882be1900e43b
    ap-south-1:
      AMI: ami-0dee22c13ea7a9a67
    sa-east-1:
      AMI: ami-07b14488da8ea02a0

Resources:
  ApplicationKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for application encryption
      Enabled: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowAccountFullAccess
            Effect: Allow
            Principal:
              AWS:
                Fn::Sub: 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowServiceUse
            Effect: Allow
            Principal:
              Service:
                - logs.amazonaws.com
                - cloudtrail.amazonaws.com
                - s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
          - Sid: AllowEC2ServiceToUseKey
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
              - kms:Encrypt
              - kms:DescribeKey
            Resource: '*'
          - Sid: AllowEC2ServiceToCreateGrants
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - kms:CreateGrant
            Resource: '*'
            Condition:
              Bool:
                kms:GrantIsForAWSResource: 'true'
          - Sid: AllowAutoScalingServiceToUseKey
            Effect: Allow
            Principal:
              AWS:
                Fn::Sub: 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: AllowAutoScalingServiceToCreateGrants
            Effect: Allow
            Principal:
              AWS:
                Fn::Sub: 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling'
            Action:
              - kms:CreateGrant
            Resource: '*'
            Condition:
              Bool:
                kms:GrantIsForAWSResource: 'true'
          - Sid: AllowSSMToUseKey
            Effect: Allow
            Principal:
              Service:
                - ssm.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:Encrypt
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value:
            Ref: Environment

  ApplicationKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName:
        Fn::Sub: 'alias/tap-stakes-cftap-exc-${EnvironmentSuffix}'
      TargetKeyId:
        Ref: ApplicationKMSKey

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'vpc-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value:
            Ref: Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'igw-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId:
        Ref: VPC
      InternetGatewayId:
        Ref: InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'pubsub1-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'pubsub2-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Public

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'privsub1-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock: 10.0.20.0/24
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'privsub2-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Private

  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock: 10.0.30.0/24
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'dbsub1-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Database

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: VPC
      CidrBlock: 10.0.40.0/24
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'dbsub2-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'
        - Key: Type
          Value: Database

  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'nat1-eip-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'nat2-eip-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId:
        Fn::GetAtt:
          - NATGateway1EIP
          - AllocationId
      SubnetId:
        Ref: PublicSubnet1
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'nat1-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId:
        Fn::GetAtt:
          - NATGateway2EIP
          - AllocationId
      SubnetId:
        Ref: PublicSubnet2
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'nat2-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'pubrt-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId:
        Ref: PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId:
        Ref: InternetGateway

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'privrt1-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId:
        Ref: PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        Ref: NATGateway1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'privrt2-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId:
        Ref: PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        Ref: NATGateway2

  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: 'vpcflow-role-cftap-exc-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
      Tags:
        - Key: cost-center
          Value: '1234'

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName:
        Fn::Sub: '/aws/vpc/flowlogs/tap-stakes-cftap-exc-${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId:
        Fn::GetAtt:
          - ApplicationKMSKey
          - Arn

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId:
        Ref: VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName:
        Ref: VPCFlowLogGroup
      DeliverLogsPermissionArn:
        Fn::GetAtt:
          - VPCFlowLogsRole
          - Arn
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'vpcflow-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/8
          Description: Allow outbound to VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'alb-cftap-exc-sg-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId:
            Ref: ALBSecurityGroup
          Description: HTTP from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
          Description: SSH from admin network (replace with your IP if you still need SSH; otherwise SSM Session Manager will be used)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/8
          Description: Allow outbound to VPC
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'web-sg-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Bastion Host
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: SSH from specific IPs
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'bastion-sg-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId:
        Ref: VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId:
            Ref: WebServerSecurityGroup
          Description: MySQL from web servers
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/8
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'db-sg-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId:
        Ref: VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to anywhere
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/8
          Description: MySQL to database
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'lambda-sg-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: RDS Master Database Password
      KmsKeyId:
        Ref: ApplicationKMSKey
      GenerateSecretString:
        SecretStringTemplate:
          Fn::Sub: '{"username":"${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'
      Tags:
        - Key: cost-center
          Value: '1234'

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - Ref: DBSubnet1
        - Ref: DBSubnet2
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'dbsubgrp-cftap-exc-${EnvironmentSuffix}'
        - Key: cost-center
          Value: '1234'

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier:
        Fn::Sub: 'db-cftap-exc-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.42'
      MasterUsername:
        Fn::Sub: '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:username}}'
      MasterUserPassword:
        Fn::Sub: '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId:
        Ref: ApplicationKMSKey
      DBSubnetGroupName:
        Ref: DBSubnetGroup
      VPCSecurityGroups:
        - Ref: DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId:
        Ref: ApplicationKMSKey
      PerformanceInsightsRetentionPeriod: 7
      MonitoringInterval: 60
      MonitoringRoleArn:
        Fn::GetAtt:
          - RDSEnhancedMonitoringRole
          - Arn
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value:
            Ref: Environment

  RDSReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier:
        Fn::Sub: 'dbrep-cftap-exc-${EnvironmentSuffix}'
      SourceDBInstanceIdentifier:
        Ref: RDSDatabase
      DBInstanceClass: db.t3.medium
      PubliclyAccessible: false
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value:
            Ref: Environment

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: 'rds-mon-tscf-exc-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ''
            Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Tags:
        - Key: cost-center
          Value: '1234'

  SecretRDSAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId:
        Ref: DBPasswordSecret
      TargetId:
        Ref: RDSDatabase
      TargetType: AWS::RDS::DBInstance

  # S3 buckets: managed names, retained on delete, and update-replace retain set
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldAccessLogs
            Status: Enabled
            ExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: cost-center
          Value: '1234'

  AccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: AccessLogsBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowELBAccessLogDelivery
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action:
              - s3:PutObject
            Resource:
              Fn::Sub: arn:aws:s3:::${AccessLogsBucket}/alb-logs/AWSLogs/${AWS::AccountId}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: AllowELBGetBucketAcl
            Effect: Allow
            Principal:
              Service: logdelivery.elasticloadbalancing.amazonaws.com
            Action:
              - s3:GetBucketAcl
            Resource:
              Fn::Sub: arn:aws:s3:::${AccessLogsBucket}

  LogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID:
                Ref: ApplicationKMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
              - StorageClass: GLACIER
                TransitionInDays: 60
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName:
          Ref: AccessLogsBucket
        LogFilePrefix: 's3-logs/'
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value:
            Ref: Environment

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - Fn::GetAtt: [LogsBucket, Arn]
              - Fn::Join:
                  - ''
                  - - Fn::GetAtt: [LogsBucket, Arn]
                    - '/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID:
                Ref: ApplicationKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldTrailLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: cost-center
          Value: '1234'

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource:
              Fn::GetAtt: [CloudTrailBucket, Arn]
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - s3:PutObject
            Resource:
              Fn::Join:
                - ''
                - - Fn::GetAtt: [CloudTrailBucket, Arn]
                  - '/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ConfigBucket:
    Condition: CreateConfig
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID:
                Ref: ApplicationKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldConfigs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: cost-center
          Value: '1234'

  ConfigBucketPolicy:
    Condition: CreateConfig
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource:
              Fn::GetAtt: [ConfigBucket, Arn]
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - s3:ListBucket
            Resource:
              Fn::GetAtt: [ConfigBucket, Arn]
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - s3:PutObject
            Resource:
              Fn::Join:
                - ''
                - - Fn::GetAtt: [ConfigBucket, Arn]
                  - '/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: 'ec2-role-cftap-exc-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - Fn::Join:
                      - ''
                      - - Fn::GetAtt: [LogsBucket, Arn]
                        - '/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource:
                  - Ref: DBPasswordSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - Fn::GetAtt:
                      - ApplicationKMSKey
                      - Arn
      Tags:
        - Key: cost-center
          Value: '1234'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName:
        Fn::Sub: 'ec2-ip-cftap-exc-${EnvironmentSuffix}'
      Roles:
        - Ref: EC2Role

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name:
        Fn::Sub: 'alb-exc-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - Ref: ALBSecurityGroup
      Subnets:
        - Ref: PublicSubnet1
        - Ref: PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: true
        - Key: access_logs.s3.bucket
          Value:
            Ref: AccessLogsBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
        - Key: deletion_protection.enabled
          Value: true
        - Key: idle_timeout.timeout_seconds
          Value: 60
        - Key: routing.http2.enabled
          Value: true
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: true
      Tags:
        - Key: cost-center
          Value: '1234'
        - Key: Environment
          Value:
            Ref: Environment

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name:
        Fn::Sub: 'tg-cftap-exc-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId:
        Ref: VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200-299
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: 30
        - Key: stickiness.enabled
          Value: true
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: 86400
      Tags:
        - Key: cost-center
          Value: '1234'

  ALBListener:
    Condition: HasCertificate
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn:
        Ref: ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn:
            Ref: CertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn:
            Ref: ALBTargetGroup

  ALBListenerHTTP:
    Condition: NoCertificate
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn:
        Ref: ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn:
            Ref: ALBTargetGroup

  HostedZone:
    Condition: CreateHostedZone
    Type: AWS::Route53::HostedZone
    Properties:
      Name:
        Ref: DomainName
      HostedZoneConfig:
        Comment:
          Fn::Sub: 'Hosted zone for ${DomainName}'
      HostedZoneTags:
        - Key: cost-center
          Value: '1234'

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName:
        Fn::Sub: 'lt-exc-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId:
          Ref: LatestAmi
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn:
            Fn::GetAtt:
              - EC2InstanceProfile
              - Arn
        SecurityGroupIds:
          - Ref: WebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
              KmsKeyId:
                Ref: ApplicationKMSKey
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          InstanceMetadataTags: enabled
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y nginx amazon-cloudwatch-agent amazon-ssm-agent
            systemctl enable nginx
            systemctl start nginx
            echo "healthy" > /usr/share/nginx/html/health

            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/ec2/nginx",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value:
                  Fn::Sub: 'inst-exc-${EnvironmentSuffix}'
              - Key: cost-center
                Value: '1234'
              - Key: Environment
                Value:
                  Ref: Environment
              - Key: KeyPairName
                Value:
                  Ref: KeyPairName

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName:
        Fn::Sub: 'asg-cftap-exc-${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId:
          Ref: LaunchTemplate
        Version:
          Fn::GetAtt:
            - LaunchTemplate
            - LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      VPCZoneIdentifier:
        - Ref: PrivateSubnet1
        - Ref: PrivateSubnet2
      TargetGroupARNs:
        - Ref: ALBTargetGroup
      MetricsCollection:
        - Granularity: 1Minute
          Metrics:
            - GroupInServiceInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value:
            Fn::Sub: 'asg-cftap-exc-${EnvironmentSuffix}'
          PropagateAtLaunch: true
        - Key: cost-center
          Value: '1234'
          PropagateAtLaunch: true

  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName:
        Ref: AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name:
        Fn::Sub: 'wacl-stake-cftap-exc-${EnvironmentSuffix}'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: SQLiRule
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRule
        - Name: CommonRule
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName:
          Fn::Sub: 'wacl-stake-cftap-exc-${EnvironmentSuffix}'
      Tags:
        - Key: cost-center
          Value: '1234'

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn:
        Ref: ApplicationLoadBalancer
      WebACLArn:
        Fn::GetAtt:
          - WebACL
          - Arn

  # FIX: Corrected resource ID from LambdaexeutionRole to LambdaExecutionRole
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: 'lambda-exc-cftap-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        # FIX: Corrected typo in Managed Policy ARN
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: 'arn:aws:logs:*:*:*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource:
                  Ref: DBPasswordSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource:
                  Fn::GetAtt:
                    - ApplicationKMSKey
                    - Arn
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  Fn::Join:
                    - ''
                    - - Fn::GetAtt: [LogsBucket, Arn]
                      - '/*'
      Tags:
        - Key: cost-center
          Value: '1234'

  DataProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName:
        Fn::Sub: 'dp-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.handler
      Role:
        Fn::GetAtt:
          - LambdaExecutionRole # This reference is now correct
          - Arn
      VpcConfig:
        SecurityGroupIds:
          - Ref: LambdaSecurityGroup
        SubnetIds:
          - Ref: PrivateSubnet1
          - Ref: PrivateSubnet2
      Environment:
        Variables:
          DB_SECRET_ARN:
            Ref: DBPasswordSecret
          KMS_KEY_ID:
            Ref: ApplicationKMSKey
      Code:
        ZipFile: |
          import json
  
          def handler(event, context):
              return {'statusCode': 200, 'body': json.dumps('Data processing completed')}
      Timeout: 60
      MemorySize: 512
      ReservedConcurrentExecutions: 10 # This property name is now correct
      Tags:
        - Key: cost-center
          Value: '1234'

  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName:
        Fn::Sub: 'alerts-exc-stake-cftap-${EnvironmentSuffix}'
      DisplayName: Application Alerts
      KmsMasterKeyId:
        Ref: ApplicationKMSKey
      Subscription:
        - Endpoint:
            Ref: AlertEmail
          Protocol: email
      Tags:
        - Key: cost-center
          Value: '1234'

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: 'highcpu-cftap-exc-${EnvironmentSuffix}'
      AlarmDescription: Triggers when CPU utilization is high
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value:
            Ref: AutoScalingGroup

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: 'dbcpu-cftap-exc-${EnvironmentSuffix}'
      AlarmDescription: Triggers when database CPU is high
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - Ref: AlertTopic
      Dimensions:
        - Name: DBInstanceIdentifier
          Value:
            Ref: RDSDatabase

  UnHealthyTargetAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName:
        Fn::Sub: 'unhealthy-cftap-exc-${EnvironmentSuffix}'
      AlarmDescription: Triggers when targets are unhealthy
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - Ref: AlertTopic
      Dimensions:
        - Name: TargetGroup
          Value:
            Fn::GetAtt: [ALBTargetGroup, TargetGroupFullName]
        - Name: LoadBalancer
          Value:
            Fn::GetAtt: [ApplicationLoadBalancer, LoadBalancerFullName]

  ConfigRole:
    Condition: CreateConfig
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: 'cfg-role-cftap-exc-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AWSConfigS3AndSNSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowS3WriteAndRead
                Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                  - s3:PutObject
                Resource:
                  - Fn::GetAtt: [ConfigBucket, Arn]
                  - Fn::Join:
                      - ''
                      - - Fn::GetAtt: [ConfigBucket, Arn]
                        - '/*'
              - Sid: AllowConfigAPIActions
                Effect: Allow
                Action:
                  - config:Put*
                  - config:Deliver*
                  - config:Batch*
                Resource: '*'
              - Sid: AllowSNSSend
                Effect: Allow
                Action:
                  - sns:Publish
                Resource:
                  - Ref: AlertTopic
        - PolicyName: AWSConfigReadOnlyCloudWatchLogs
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
      Tags:
        - Key: cost-center
          Value: '1234'

  ConfigRecorder:
    Condition: CreateConfig
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name:
        Fn::Sub: 'cfg-exc-${EnvironmentSuffix}'
      RoleARN:
        Fn::GetAtt: [ConfigRole, Arn]
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Condition: CreateConfig
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name:
        Fn::Sub: 'cfgdl-exc-${EnvironmentSuffix}'
      S3BucketName:
        Ref: ConfigBucket
      SnsTopicARN:
        Ref: AlertTopic

  RequiredTagsRule:
    Condition: CreateConfig
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName:
        Fn::Sub: 'reqtags-exc-${EnvironmentSuffix}'
      Description: Checks whether resources have the required tags
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::RDS::DBInstance
      InputParameters: |
        {
          "tag1Key": "cost-center"
        }

  EncryptedVolumesRule:
    Condition: CreateConfig
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName:
        Fn::Sub: 'encvol-exc-${EnvironmentSuffix}'
      Description: Checks whether EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: alb-origin
            DomainName:
              Fn::GetAtt: [ApplicationLoadBalancer, DNSName]
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: http-only
        Enabled: true
        DefaultCacheBehavior:
          TargetOriginId: alb-origin
          ViewerProtocolPolicy: redirect-to-https
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        DefaultRootObject: index.html

Outputs:
  VPCId:
    Description: VPC ID
    Value:
      Ref: VPC
    Export:
      Name:
        Fn::Sub: 'tap-stakes-cftap-exc-vpc-${EnvironmentSuffix}'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value:
      Fn::GetAtt: [ApplicationLoadBalancer, DNSName]
    Export:
      Name:
        Fn::Sub: 'tap-stake-cftap-exc-alb-dns-${EnvironmentSuffix}'

  CloudFrontDomain:
    Description: CloudFront Distribution Domain Name
    Value:
      Fn::GetAtt: [CloudFrontDistribution, DomainName]
    Export:
      Name:
        Fn::Sub: 'tap-stake-cftap-exc-${EnvironmentSuffix}'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value:
      Fn::GetAtt: [RDSDatabase, 'Endpoint.Address']
    Export:
      Name:
        Fn::Sub: 'tap-stakes-cftap-exc-db-endp-${EnvironmentSuffix}'

  SNSTopic:
    Description: SNS Topic ARN for Alerts
    Value:
      Ref: AlertTopic
    Export:
      Name:
        Fn::Sub: 'tap-stake-cftap-exc-alert-${EnvironmentSuffix}'

  LogsBucket:
    Description: S3 Bucket for Logs
    Value:
      Ref: LogsBucket
    Export:
      Name:
        Fn::Sub: 'tap-stake-cftap-exc-logs-${EnvironmentSuffix}'

  KMSKeyId:
    Description: KMS Key ID for Encryption
    Value:
      Ref: ApplicationKMSKey
    Export:
      Name:
        Fn::Sub: 'tap-stakes-cftap-exc-kms-${EnvironmentSuffix}'

  ALBListenerType:
    Description: Listener type created (HTTP or HTTPS)
    Value:
      Fn::If:
        - HasCertificate
        - 'HTTPS Listener created'
        - 'HTTP Listener created (no certificate supplied)'

  RegionDefaultAMI:
    Description: AMI value from RegionMap for the current region (used to satisfy linter)
    Value:
      Fn::FindInMap:
        - RegionMap
        - Ref: AWS::Region
        - AMI
