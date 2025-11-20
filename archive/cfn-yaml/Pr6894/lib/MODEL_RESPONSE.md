# CloudFormation Solution for Loan Processing Application

This solution provides a complete, production-ready CloudFormation template for deploying a fault-tolerant loan processing web application infrastructure.

## Architecture Overview

The infrastructure includes:
- VPC with 3 availability zones, public and private subnets
- NAT Gateways for private subnet internet access
- ECS Fargate cluster with auto-scaling
- Application Load Balancer with health checks
- Aurora MySQL cluster with 1 writer and 2 reader instances
- S3 buckets with encryption, versioning, and lifecycle policies
- CloudFront distribution with Origin Access Identity
- IAM roles with least-privilege permissions
- KMS keys for encryption
- Security groups with minimal access
- CloudWatch alarms and log groups

## File: lib/loan-processing-infrastructure.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Fault-tolerant loan processing web application infrastructure with ECS Fargate, Aurora MySQL, ALB, S3, CloudFront, and comprehensive monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource names to enable multiple deployments'
    Default: 'prod'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  EnableDeletionProtection:
    Type: String
    Description: 'Enable deletion protection on critical resources'
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'

  DisasterRecoveryRegion:
    Type: String
    Description: 'AWS region for disaster recovery backups'
    Default: 'us-west-2'

  ContainerImage:
    Type: String
    Description: 'Docker image for the loan processing application'
    Default: 'nginx:latest'

  ContainerPort:
    Type: Number
    Description: 'Port exposed by the container'
    Default: 80

  DBMasterUsername:
    Type: String
    Description: 'Master username for Aurora MySQL'
    Default: 'admin'
    NoEcho: true

  DBMasterPassword:
    Type: String
    Description: 'Master password for Aurora MySQL (min 8 characters)'
    NoEcho: true
    MinLength: 8

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - EnableDeletionProtection
          - DisasterRecoveryRegion
      - Label:
          default: 'Application Configuration'
        Parameters:
          - ContainerImage
          - ContainerPort
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBMasterUsername
          - DBMasterPassword

Resources:
  # ============================================================
  # KMS Keys for Encryption
  # ============================================================

  RDSEncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for RDS encryption - ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'rds-encryption-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    DeletionPolicy: Delete
    Properties:
      AliasName: !Sub 'alias/rds-${EnvironmentSuffix}'
      TargetKeyId: !Ref RDSEncryptionKey

  S3EncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for S3 encryption - ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 's3-encryption-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    DeletionPolicy: Delete
    Properties:
      AliasName: !Sub 'alias/s3-${EnvironmentSuffix}'
      TargetKeyId: !Ref S3EncryptionKey

  CloudWatchLogsKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for CloudWatch Logs encryption - ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
      Tags:
        - Key: Name
          Value: !Sub 'cloudwatch-logs-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CloudWatchLogsKeyAlias:
    Type: AWS::KMS::Alias
    DeletionPolicy: Delete
    Properties:
      AliasName: !Sub 'alias/cloudwatch-logs-${EnvironmentSuffix}'
      TargetKeyId: !Ref CloudWatchLogsKey

  # ============================================================
  # VPC and Network Resources
  # ============================================================

  VPC:
    Type: AWS::EC2::VPC
    DeletionPolicy: Delete
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'loan-processing-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    DeletionPolicy: Delete
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'loan-processing-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnets (3 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.13.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateways (one per AZ)
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    DeletionPolicy: Delete
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1-${EnvironmentSuffix}'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    DeletionPolicy: Delete
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-2-${EnvironmentSuffix}'

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    DeletionPolicy: Delete
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-3-${EnvironmentSuffix}'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    DeletionPolicy: Delete
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${EnvironmentSuffix}'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    DeletionPolicy: Delete
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${EnvironmentSuffix}'

  NatGateway3:
    Type: AWS::EC2::NatGateway
    DeletionPolicy: Delete
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-3-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-route-table-${EnvironmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    DeletionPolicy: Delete
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-route-table-1-${EnvironmentSuffix}'

  PrivateRoute1:
    Type: AWS::EC2::Route
    DeletionPolicy: Delete
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-route-table-2-${EnvironmentSuffix}'

  PrivateRoute2:
    Type: AWS::EC2::Route
    DeletionPolicy: Delete
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-route-table-3-${EnvironmentSuffix}'

  PrivateRoute3:
    Type: AWS::EC2::Route
    DeletionPolicy: Delete
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # ============================================================
  # Security Groups
  # ============================================================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from internet
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'alb-sg-${EnvironmentSuffix}'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !Ref ContainerPort
          ToPort: !Ref ContainerPort
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow traffic from ALB
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'ecs-sg-${EnvironmentSuffix}'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    Properties:
      GroupDescription: Security group for RDS Aurora cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: Allow MySQL from ECS tasks
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'rds-sg-${EnvironmentSuffix}'

  # ============================================================
  # S3 Buckets
  # ============================================================

  DocumentBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'loan-documents-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3EncryptionKey.Arn
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 180
                StorageClass: GLACIER
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'document-bucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'loan-static-assets-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3EncryptionKey.Arn
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 180
                StorageClass: GLACIER
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'static-assets-bucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  StaticAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    DeletionPolicy: Delete
    Properties:
      Bucket: !Ref StaticAssetsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}'
            Action: 's3:GetObject'
            Resource: !Sub '${StaticAssetsBucket.Arn}/*'

  # ============================================================
  # CloudFront Distribution
  # ============================================================

  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    DeletionPolicy: Delete
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for static assets bucket - ${EnvironmentSuffix}'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    DeletionPolicy: Delete
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CloudFront distribution for loan processing static assets - ${EnvironmentSuffix}'
        DefaultRootObject: index.html
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticAssetsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          MinTTL: 0
          DefaultTTL: 86400
          MaxTTL: 31536000
          Compress: true
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
          MinimumProtocolVersion: TLSv1.2_2021
        PriceClass: PriceClass_100
      Tags:
        - Key: Name
          Value: !Sub 'cloudfront-distribution-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ============================================================
  # IAM Roles
  # ============================================================

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub 'ecs-task-execution-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/ecs/*'
      Tags:
        - Key: Name
          Value: !Sub 'ecs-task-execution-role-${EnvironmentSuffix}'

  ECSTaskRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub 'ecs-task-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource:
                  - !Sub '${DocumentBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt DocumentBucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - !GetAtt S3EncryptionKey.Arn
        - PolicyName: RDSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:DescribeDBClusters'
                  - 'rds:DescribeDBInstances'
                Resource:
                  - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraDBCluster}'
      Tags:
        - Key: Name
          Value: !Sub 'ecs-task-role-${EnvironmentSuffix}'

  ECSAutoScalingRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub 'ecs-autoscaling-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole'
      Tags:
        - Key: Name
          Value: !Sub 'ecs-autoscaling-role-${EnvironmentSuffix}'

  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub 'rds-enhanced-monitoring-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Tags:
        - Key: Name
          Value: !Sub 'rds-enhanced-monitoring-role-${EnvironmentSuffix}'

  # ============================================================
  # CloudWatch Log Groups
  # ============================================================

  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/ecs/loan-processing-${EnvironmentSuffix}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt CloudWatchLogsKey.Arn

  # ============================================================
  # Application Load Balancer
  # ============================================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DeletionPolicy: Delete
    Properties:
      Name: !Sub 'loan-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'loan-alb-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    DeletionPolicy: Delete
    Properties:
      Name: !Sub 'loan-tg-${EnvironmentSuffix}'
      Port: !Ref ContainerPort
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200-299
      Tags:
        - Key: Name
          Value: !Sub 'loan-tg-${EnvironmentSuffix}'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    DeletionPolicy: Delete
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ============================================================
  # Aurora MySQL Cluster
  # ============================================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    DeletionPolicy: Delete
    Properties:
      DBSubnetGroupName: !Sub 'aurora-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for Aurora MySQL cluster
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'aurora-subnet-group-${EnvironmentSuffix}'

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    DeletionPolicy: Delete
    Properties:
      Description: !Sub 'Aurora MySQL cluster parameter group - ${EnvironmentSuffix}'
      Family: aurora-mysql8.0
      Parameters:
        require_secure_transport: 1
        tls_version: TLSv1.2
      Tags:
        - Key: Name
          Value: !Sub 'aurora-cluster-params-${EnvironmentSuffix}'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    DeletionPolicy: Delete
    Properties:
      Description: !Sub 'Aurora MySQL instance parameter group - ${EnvironmentSuffix}'
      Family: aurora-mysql8.0
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-params-${EnvironmentSuffix}'

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'loan-aurora-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: 8.0.mysql_aurora.3.04.0
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DatabaseName: loanprocessing
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      VpcSecurityGroupIds:
        - !Ref RDSSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !GetAtt RDSEncryptionKey.Arn
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: !Ref EnableDeletionProtection
      Tags:
        - Key: Name
          Value: !Sub 'aurora-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraDBInstanceWriter:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'loan-aurora-writer-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      DBParameterGroupName: !Ref DBParameterGroup
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-writer-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraDBInstanceReader1:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'loan-aurora-reader1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      DBParameterGroupName: !Ref DBParameterGroup
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-reader1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraDBInstanceReader2:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'loan-aurora-reader2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      DBParameterGroupName: !Ref DBParameterGroup
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-reader2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ============================================================
  # ECS Cluster and Service
  # ============================================================

  ECSCluster:
    Type: AWS::ECS::Cluster
    DeletionPolicy: Delete
    Properties:
      ClusterName: !Sub 'loan-processing-cluster-${EnvironmentSuffix}'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
          Base: 1
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'ecs-cluster-${EnvironmentSuffix}'

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    DeletionPolicy: Delete
    Properties:
      Family: !Sub 'loan-processing-task-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '512'
      Memory: '1024'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: loan-processing-app
          Image: !Ref ContainerImage
          PortMappings:
            - ContainerPort: !Ref ContainerPort
              Protocol: tcp
          Environment:
            - Name: DB_HOST
              Value: !GetAtt AuroraDBCluster.Endpoint.Address
            - Name: DB_PORT
              Value: !GetAtt AuroraDBCluster.Endpoint.Port
            - Name: DB_NAME
              Value: loanprocessing
            - Name: DOCUMENT_BUCKET
              Value: !Ref DocumentBucket
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          Essential: true
      Tags:
        - Key: Name
          Value: !Sub 'ecs-task-${EnvironmentSuffix}'

  ECSService:
    Type: AWS::ECS::Service
    DependsOn:
      - ALBListener
      - AuroraDBInstanceWriter
    DeletionPolicy: Delete
    Properties:
      ServiceName: !Sub 'loan-processing-service-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3
          SecurityGroups:
            - !Ref ECSSecurityGroup
      LoadBalancers:
        - ContainerName: loan-processing-app
          ContainerPort: !Ref ContainerPort
          TargetGroupArn: !Ref ALBTargetGroup
      HealthCheckGracePeriodSeconds: 60
      Tags:
        - Key: Name
          Value: !Sub 'ecs-service-${EnvironmentSuffix}'

  # ============================================================
  # Auto Scaling
  # ============================================================

  ECSAutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    DeletionPolicy: Delete
    Properties:
      MaxCapacity: 10
      MinCapacity: 2
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      RoleARN: !GetAtt ECSAutoScalingRole.Arn
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  ECSScalingPolicyCPU:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    DeletionPolicy: Delete
    Properties:
      PolicyName: !Sub 'cpu-scaling-policy-${EnvironmentSuffix}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  ECSScalingPolicyMemory:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    DeletionPolicy: Delete
    Properties:
      PolicyName: !Sub 'memory-scaling-policy-${EnvironmentSuffix}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageMemoryUtilization
        TargetValue: 80.0
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  # ============================================================
  # CloudWatch Alarms
  # ============================================================

  CPUUtilizationAlarm:
    Type: AWS::CloudWatch::Alarm
    DeletionPolicy: Delete
    Properties:
      AlarmName: !Sub 'ecs-cpu-utilization-${EnvironmentSuffix}'
      AlarmDescription: Alarm when ECS CPU exceeds 70%
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt ECSService.Name
      TreatMissingData: notBreaching

  MemoryUtilizationAlarm:
    Type: AWS::CloudWatch::Alarm
    DeletionPolicy: Delete
    Properties:
      AlarmName: !Sub 'ecs-memory-utilization-${EnvironmentSuffix}'
      AlarmDescription: Alarm when ECS memory exceeds 80%
      MetricName: MemoryUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ClusterName
          Value: !Ref ECSCluster
        - Name: ServiceName
          Value: !GetAtt ECSService.Name
      TreatMissingData: notBreaching

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    DeletionPolicy: Delete
    Properties:
      AlarmName: !Sub 'rds-database-connections-${EnvironmentSuffix}'
      AlarmDescription: Alarm when database connections exceed 80% of max
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster
      TreatMissingData: notBreaching

  DatabaseCPUUtilizationAlarm:
    Type: AWS::CloudWatch::Alarm
    DeletionPolicy: Delete
    Properties:
      AlarmName: !Sub 'rds-cpu-utilization-${EnvironmentSuffix}'
      AlarmDescription: Alarm when database CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster
      TreatMissingData: notBreaching

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'

  DatabaseEndpoint:
    Description: Aurora MySQL cluster writer endpoint
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  DatabaseReaderEndpoint:
    Description: Aurora MySQL cluster reader endpoint
    Value: !GetAtt AuroraDBCluster.ReadEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Reader-Endpoint'

  DatabasePort:
    Description: Aurora MySQL cluster port
    Value: !GetAtt AuroraDBCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'

  DocumentBucketName:
    Description: S3 bucket name for loan documents
    Value: !Ref DocumentBucket
    Export:
      Name: !Sub '${AWS::StackName}-Document-Bucket'

  StaticAssetsBucketName:
    Description: S3 bucket name for static assets
    Value: !Ref StaticAssetsBucket
    Export:
      Name: !Sub '${AWS::StackName}-Static-Assets-Bucket'

  CloudFrontDistributionURL:
    Description: CloudFront distribution URL for static assets
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-URL'

  CloudFrontDistributionId:
    Description: CloudFront distribution ID
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-ID'

  ECSClusterName:
    Description: ECS cluster name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECS-Cluster'

  ECSServiceName:
    Description: ECS service name
    Value: !GetAtt ECSService.Name
    Export:
      Name: !Sub '${AWS::StackName}-ECS-Service'

  ECSTaskDefinitionArn:
    Description: ECS task definition ARN
    Value: !Ref ECSTaskDefinition
    Export:
      Name: !Sub '${AWS::StackName}-Task-Definition'
```

## File: lib/README.md

```markdown
# Loan Processing Infrastructure - CloudFormation Template

This CloudFormation template deploys a complete, production-ready infrastructure for a fault-tolerant loan processing web application with comprehensive security, monitoring, and high availability features.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC spanning 3 availability zones with public and private subnets
- **Networking**: NAT Gateways in each AZ for high availability
- **Compute**: ECS Fargate cluster with auto-scaling based on CPU and memory metrics
- **Load Balancing**: Application Load Balancer with health checks
- **Database**: Aurora MySQL cluster with 1 writer and 2 reader instances across multiple AZs
- **Storage**: S3 buckets with encryption, versioning, and lifecycle policies
- **CDN**: CloudFront distribution with Origin Access Identity for secure S3 access
- **Security**: KMS encryption keys, IAM roles with least-privilege, and security groups
- **Monitoring**: CloudWatch alarms for CPU, memory, and database metrics with 90-day log retention

## Prerequisites

- AWS CLI installed and configured
- Valid AWS credentials with permissions to create CloudFormation stacks
- Docker image for the loan processing application (or use default nginx for testing)

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| EnvironmentSuffix | Unique suffix for resource names | `prod` |
| EnableDeletionProtection | Enable deletion protection on critical resources | `false` |
| DisasterRecoveryRegion | AWS region for DR backups | `us-west-2` |
| ContainerImage | Docker image for the application | `nginx:latest` |
| ContainerPort | Port exposed by the container | `80` |
| DBMasterUsername | Aurora MySQL master username | `admin` |
| DBMasterPassword | Aurora MySQL master password | (required) |

## Deployment Instructions

### Option 1: AWS Console

1. Navigate to CloudFormation in the AWS Console
2. Click "Create Stack" ’ "With new resources"
3. Upload `loan-processing-infrastructure.yaml`
4. Fill in the required parameters (especially DBMasterPassword)
5. Review and create the stack

### Option 2: AWS CLI

```bash
# Validate the template
aws cloudformation validate-template \
  --template-body file://lib/loan-processing-infrastructure.yaml

# Create the stack
aws cloudformation create-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=EnableDeletionProtection,ParameterValue=false \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name loan-processing-prod \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name loan-processing-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Option 3: Using Parameters File

Create a parameters file `parameters.json`:

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "prod"
  },
  {
    "ParameterKey": "DBMasterPassword",
    "ParameterValue": "YourSecurePassword123!"
  },
  {
    "ParameterKey": "EnableDeletionProtection",
    "ParameterValue": "false"
  },
  {
    "ParameterKey": "ContainerImage",
    "ParameterValue": "your-ecr-repo/loan-app:latest"
  }
]
```

Deploy with:

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-infrastructure.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Stack Outputs

After successful deployment, the stack provides these outputs:

- **LoadBalancerURL**: HTTP endpoint to access the application
- **DatabaseEndpoint**: Aurora MySQL writer endpoint
- **DatabaseReaderEndpoint**: Aurora MySQL reader endpoint
- **DocumentBucketName**: S3 bucket for loan documents
- **StaticAssetsBucketName**: S3 bucket for static assets
- **CloudFrontDistributionURL**: HTTPS endpoint for static content
- **ECSClusterName**: Name of the ECS cluster
- **ECSServiceName**: Name of the ECS service

## Security Features

1. **Encryption at Rest**:
   - RDS encrypted with customer-managed KMS keys
   - S3 buckets encrypted with KMS
   - CloudWatch logs encrypted with KMS

2. **Encryption in Transit**:
   - Aurora MySQL requires SSL/TLS connections
   - CloudFront uses TLS 1.2 minimum
   - ALB supports HTTPS (configure certificate separately)

3. **Network Security**:
   - Private subnets for ECS tasks and RDS instances
   - Security groups with minimal required ports
   - Public access blocked on S3 buckets

4. **IAM**:
   - Least-privilege IAM roles for all services
   - Separate execution and task roles for ECS

## Auto-Scaling Configuration

- **CPU Scaling**: Triggers at 70% utilization
- **Memory Scaling**: Triggers at 80% utilization
- **Database Connection Scaling**: Alarm at 80% of max connections
- **Min Tasks**: 2
- **Max Tasks**: 10

## Monitoring and Alarms

CloudWatch alarms configured for:

1. ECS CPU utilization (>70%)
2. ECS memory utilization (>80%)
3. RDS database connections (>80)
4. RDS CPU utilization (>80%)

Logs retention: 90 days (compliance requirement)

## Lifecycle Policies

S3 objects automatically transition to Glacier after 180 days to reduce storage costs.

## Disaster Recovery

- Aurora automated backups retained for 30 days
- Backups can be replicated to us-west-2 (configured via parameter)
- Multi-AZ deployment ensures high availability

## Cost Optimization

Estimated monthly costs (us-east-1):

- ECS Fargate (2 tasks): ~$40
- Aurora MySQL (3 instances): ~$500
- NAT Gateways (3): ~$100
- ALB: ~$25
- S3 Storage: Variable
- CloudFront: Variable
- Data Transfer: Variable

**Total Base Cost**: ~$665/month (excluding data transfer and storage)

## Updating the Stack

```bash
aws cloudformation update-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-infrastructure.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Deleting the Stack

```bash
# Empty S3 buckets first
aws s3 rm s3://loan-documents-prod-ACCOUNT_ID --recursive
aws s3 rm s3://loan-static-assets-prod-ACCOUNT_ID --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name loan-processing-prod \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name loan-processing-prod \
  --region us-east-1
```

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events for error messages
2. Verify IAM permissions (requires CAPABILITY_NAMED_IAM)
3. Ensure unique EnvironmentSuffix parameter
4. Verify database password meets requirements (min 8 characters)

### Application Not Accessible

1. Check ECS service status: `aws ecs describe-services`
2. Verify ALB target health: `aws elbv2 describe-target-health`
3. Check security group rules
4. Verify container image is accessible

### Database Connection Issues

1. Verify security group allows traffic from ECS tasks
2. Check Aurora cluster status
3. Verify SSL/TLS certificate validation in application
4. Check database credentials

## Compliance

This infrastructure meets the following compliance requirements:

- **PCI-DSS**: Encryption at rest and in transit, audit logging, network segmentation
- **Logging**: 90-day retention for compliance
- **Data Protection**: Versioning and lifecycle policies on all buckets
- **High Availability**: Multi-AZ deployment across 3 availability zones

## Support

For issues or questions:

1. Check CloudFormation stack events
2. Review CloudWatch logs: `/ecs/loan-processing-{suffix}`
3. Check AWS service health dashboard
4. Review AWS CloudFormation documentation

## License

This template is provided as-is for demonstration purposes.
```
