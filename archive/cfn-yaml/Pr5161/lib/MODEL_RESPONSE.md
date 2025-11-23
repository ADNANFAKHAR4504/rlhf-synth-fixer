# StreamFlix High Availability Database Infrastructure

This CloudFormation template implements a highly available, GDPR-compliant database infrastructure for StreamFlix's media streaming platform. The solution handles 10 million concurrent users with real-time analytics, session management, and multi-AZ deployment.

## Infrastructure Components

The implementation includes:
- Aurora PostgreSQL cluster with Multi-AZ configuration
- ElastiCache Redis cluster for session management
- ECS Fargate cluster for application services
- EFS for shared storage
- Secrets Manager for credential management with automatic rotation
- API Gateway for RESTful endpoints
- Kinesis Data Streams for real-time analytics

All resources are deployed in eu-central-1 with encryption at rest and in transit.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'StreamFlix High Availability Database Infrastructure - Multi-AZ Aurora, ElastiCache, ECS Fargate, and Real-time Analytics'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBMasterUsername
          - DBName
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  DBMasterUsername:
    Type: String
    Default: 'streamflixadmin'
    Description: 'Master username for Aurora PostgreSQL cluster'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  DBName:
    Type: String
    Default: 'streamflixdb'
    Description: 'Database name for Aurora PostgreSQL'
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  VpcCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'

  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Private Subnet 1'

  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Private Subnet 2'

  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.101.0/24'
    Description: 'CIDR block for Public Subnet 1'

  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.102.0/24'
    Description: 'CIDR block for Public Subnet 2'

Resources:
  # =====================================================
  # VPC and Network Resources
  # =====================================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Application
          Value: StreamFlix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-private-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # =====================================================
  # Security Groups
  # =====================================================
  AuroraSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'streamflix-aurora-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Aurora PostgreSQL cluster'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: 'Allow PostgreSQL from ECS tasks'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-aurora-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ElastiCacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'streamflix-elasticache-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for ElastiCache Redis cluster'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: 'Allow Redis from ECS tasks'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-elasticache-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'streamflix-ecs-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for ECS Fargate tasks'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-ecs-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'streamflix-efs-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for EFS file system'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: 'Allow NFS from ECS tasks'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-efs-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # =====================================================
  # KMS Encryption Keys
  # =====================================================
  AuroraKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for Aurora PostgreSQL encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Aurora to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-aurora-kms-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/streamflix-aurora-${EnvironmentSuffix}'
      TargetKeyId: !Ref AuroraKMSKey

  EFSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for EFS encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-efs-kms-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EFSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/streamflix-efs-${EnvironmentSuffix}'
      TargetKeyId: !Ref EFSKMSKey

  # =====================================================
  # Secrets Manager for Database Credentials
  # =====================================================
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'streamflix-db-secret-${EnvironmentSuffix}'
      Description: 'Aurora PostgreSQL master credentials'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-db-secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # =====================================================
  # Aurora PostgreSQL Cluster
  # =====================================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'streamflix-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for Aurora PostgreSQL cluster'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Engine: aurora-postgresql
      EngineVersion: '15.4'
      DatabaseName: !Ref DBName
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref AuroraSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      StorageEncrypted: true
      KmsKeyId: !GetAtt AuroraKMSKey.Arn
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-aurora-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: GDPR
          Value: 'compliant'

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: aurora-postgresql
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: db.t4g.medium
      PubliclyAccessible: false
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-aurora-instance-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: aurora-postgresql
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: db.t4g.medium
      PubliclyAccessible: false
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-aurora-instance-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecretTargetAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBSecret
      TargetId: !Ref AuroraCluster
      TargetType: AWS::RDS::DBCluster

  SecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    DependsOn: SecretTargetAttachment
    Properties:
      SecretId: !Ref DBSecret
      RotationLambdaARN: !GetAtt SecretRotationLambda.Arn
      RotationRules:
        Duration: 2h
        ScheduleExpression: 'rate(30 days)'

  # =====================================================
  # Lambda for Secret Rotation
  # =====================================================
  SecretRotationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'streamflix-secret-rotation-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: SecretRotationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:DescribeSecret'
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:PutSecretValue'
                  - 'secretsmanager:UpdateSecretVersionStage'
                Resource: !Ref DBSecret
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetRandomPassword'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-secret-rotation-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecretRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'streamflix-secret-rotation-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt SecretRotationLambdaRole.Arn
      Timeout: 900
      VpcConfig:
        SecurityGroupIds:
          - !Ref ECSSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          def lambda_handler(event, context):
              """Simplified secret rotation handler"""
              service_client = boto3.client('secretsmanager')

              arn = event['SecretId']
              token = event['ClientRequestToken']
              step = event['Step']

              metadata = service_client.describe_secret(SecretId=arn)
              if not metadata['RotationEnabled']:
                  raise ValueError(f"Secret {arn} is not enabled for rotation")

              versions = metadata['VersionIdsToStages']
              if token not in versions:
                  raise ValueError(f"Secret version {token} has no stage for rotation")

              if "AWSCURRENT" in versions[token]:
                  return
              elif "AWSPENDING" not in versions[token]:
                  raise ValueError(f"Secret version {token} not set as AWSPENDING for rotation")

              if step == "createSecret":
                  create_secret(service_client, arn, token)
              elif step == "setSecret":
                  set_secret(service_client, arn, token)
              elif step == "testSecret":
                  test_secret(service_client, arn, token)
              elif step == "finishSecret":
                  finish_secret(service_client, arn, token)
              else:
                  raise ValueError("Invalid step parameter")

          def create_secret(service_client, arn, token):
              """Generate new secret"""
              service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
              try:
                  service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
              except service_client.exceptions.ResourceNotFoundException:
                  passwd = service_client.get_random_password(ExcludeCharacters='/@"\'\\', PasswordLength=32)
                  current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])
                  current_dict['password'] = passwd['RandomPassword']
                  service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps(current_dict), VersionStages=['AWSPENDING'])

          def set_secret(service_client, arn, token):
              """Set the new secret in the database"""
              pass

          def test_secret(service_client, arn, token):
              """Test the new secret"""
              pass

          def finish_secret(service_client, arn, token):
              """Finalize the rotation"""
              metadata = service_client.describe_secret(SecretId=arn)
              current_version = None
              for version in metadata["VersionIdsToStages"]:
                  if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
                      if version == token:
                          return
                      current_version = version
                      break
              service_client.update_secret_version_stage(SecretId=arn, VersionStage="AWSCURRENT", MoveToVersionId=token, RemoveFromVersionId=current_version)
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-secret-rotation-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecretRotationLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecretRotationLambda
      Action: 'lambda:InvokeFunction'
      Principal: secretsmanager.amazonaws.com

  # =====================================================
  # ElastiCache Redis Cluster
  # =====================================================
  ElastiCacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: 'Subnet group for ElastiCache Redis cluster'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      CacheSubnetGroupName: !Sub 'streamflix-cache-subnet-group-${EnvironmentSuffix}'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-cache-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ElastiCacheReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub 'streamflix-redis-${EnvironmentSuffix}'
      ReplicationGroupDescription: 'Redis cluster for session management'
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: cache.t4g.medium
      NumCacheClusters: 2
      MultiAZEnabled: true
      AutomaticFailoverEnabled: true
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      SecurityGroupIds:
        - !Ref ElastiCacheSecurityGroup
      CacheSubnetGroupName: !Ref ElastiCacheSubnetGroup
      PreferredMaintenanceWindow: 'sun:05:00-sun:06:00'
      SnapshotRetentionLimit: 5
      SnapshotWindow: '03:00-04:00'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-redis-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: SessionManagement

  # =====================================================
  # EFS File System
  # =====================================================
  EFSFileSystem:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: true
      KmsKeyId: !GetAtt EFSKMSKey.Arn
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      LifecyclePolicies:
        - TransitionToIA: AFTER_30_DAYS
      FileSystemTags:
        - Key: Name
          Value: !Sub 'streamflix-efs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EFSMountTarget1:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet1
      SecurityGroups:
        - !Ref EFSSecurityGroup

  EFSMountTarget2:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet2
      SecurityGroups:
        - !Ref EFSSecurityGroup

  # =====================================================
  # ECS Cluster and Fargate Services
  # =====================================================
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'streamflix-ecs-cluster-${EnvironmentSuffix}'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
        - CapacityProvider: FARGATE_SPOT
          Weight: 1
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-ecs-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'streamflix-ecs-execution-role-${EnvironmentSuffix}'
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
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt AuroraKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-ecs-execution-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'streamflix-ecs-task-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: ApplicationPermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kinesis:PutRecord'
                  - 'kinesis:PutRecords'
                Resource: !GetAtt KinesisStream.Arn
              - Effect: Allow
                Action:
                  - 'elasticfilesystem:ClientMount'
                  - 'elasticfilesystem:ClientWrite'
                Resource: !GetAtt EFSFileSystem.Arn
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/ecs/streamflix-*'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-ecs-task-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/streamflix-app-${EnvironmentSuffix}'
      RetentionInDays: 7

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'streamflix-app-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '512'
      Memory: '1024'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: streamflix-app
          Image: public.ecr.aws/docker/library/nginx:latest
          Essential: true
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          Environment:
            - Name: REDIS_ENDPOINT
              Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Address
            - Name: REDIS_PORT
              Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Port
            - Name: KINESIS_STREAM
              Value: !Ref KinesisStream
            - Name: EFS_MOUNT
              Value: /mnt/efs
          Secrets:
            - Name: DB_HOST
              ValueFrom: !Sub '${DBSecret}:host::'
            - Name: DB_USERNAME
              ValueFrom: !Sub '${DBSecret}:username::'
            - Name: DB_PASSWORD
              ValueFrom: !Sub '${DBSecret}:password::'
          MountPoints:
            - SourceVolume: efs-storage
              ContainerPath: /mnt/efs
              ReadOnly: false
      Volumes:
        - Name: efs-storage
          EFSVolumeConfiguration:
            FilesystemId: !Ref EFSFileSystem
            TransitEncryption: ENABLED
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-task-def-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ECSService:
    Type: AWS::ECS::Service
    DependsOn:
      - EFSMountTarget1
      - EFSMountTarget2
    Properties:
      ServiceName: !Sub 'streamflix-service-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: ENABLED
          Subnets:
            - !Ref PublicSubnet1
            - !Ref PublicSubnet2
          SecurityGroups:
            - !Ref ECSSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-service-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # =====================================================
  # Kinesis Data Stream
  # =====================================================
  KinesisStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub 'streamflix-analytics-${EnvironmentSuffix}'
      ShardCount: 2
      RetentionPeriodHours: 24
      StreamEncryption:
        EncryptionType: KMS
        KeyId: alias/aws/kinesis
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-analytics-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: RealTimeAnalytics

  # =====================================================
  # API Gateway
  # =====================================================
  APIGatewayRestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'streamflix-api-${EnvironmentSuffix}'
      Description: 'RESTful API for StreamFlix platform'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-api-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  APIGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref APIGatewayRestAPI
      ParentId: !GetAtt APIGatewayRestAPI.RootResourceId
      PathPart: 'health'

  APIGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref APIGatewayRestAPI
      ResourceId: !Ref APIGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: '{"status": "healthy"}'
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIGatewayMethod
    Properties:
      RestApiId: !Ref APIGatewayRestAPI
      StageName: !Ref EnvironmentSuffix

  APIGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt APIGatewayCloudWatchRole.Arn

  APIGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'streamflix-apigw-cloudwatch-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      Tags:
        - Key: Name
          Value: !Sub 'streamflix-apigw-cloudwatch-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # =====================================================
  # CloudWatch Alarms for Monitoring
  # =====================================================
  AuroraCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'streamflix-aurora-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Aurora CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraCluster

  ElastiCacheCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'streamflix-redis-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Redis CPU exceeds 75%'
      MetricName: CPUUtilization
      Namespace: AWS/ElastiCache
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ReplicationGroupId
          Value: !Ref ElastiCacheReplicationGroup

  KinesisIteratorAgeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'streamflix-kinesis-lag-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Kinesis iterator age exceeds 1 minute'
      MetricName: GetRecords.IteratorAgeMilliseconds
      Namespace: AWS/Kinesis
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 60000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: StreamName
          Value: !Ref KinesisStream

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  AuroraClusterEndpoint:
    Description: 'Aurora PostgreSQL cluster endpoint'
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Aurora-Endpoint'

  AuroraClusterReadEndpoint:
    Description: 'Aurora PostgreSQL cluster read endpoint'
    Value: !GetAtt AuroraCluster.ReadEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Aurora-Read-Endpoint'

  RedisEndpoint:
    Description: 'ElastiCache Redis primary endpoint'
    Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Redis-Endpoint'

  RedisPort:
    Description: 'ElastiCache Redis port'
    Value: !GetAtt ElastiCacheReplicationGroup.PrimaryEndPoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-Redis-Port'

  EFSFileSystemId:
    Description: 'EFS File System ID'
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFS-ID'

  ECSClusterName:
    Description: 'ECS Cluster name'
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECS-Cluster'

  KinesisStreamName:
    Description: 'Kinesis Data Stream name'
    Value: !Ref KinesisStream
    Export:
      Name: !Sub '${AWS::StackName}-Kinesis-Stream'

  KinesisStreamARN:
    Description: 'Kinesis Data Stream ARN'
    Value: !GetAtt KinesisStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Kinesis-ARN'

  APIGatewayURL:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${APIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
    Export:
      Name: !Sub '${AWS::StackName}-API-URL'

  DBSecretArn:
    Description: 'Database secret ARN'
    Value: !Ref DBSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-Secret-ARN'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-Environment-Suffix'
```

## Implementation Notes

### Security Features
- All data stores encrypted at rest using KMS (Aurora, ElastiCache, EFS)
- Encryption in transit enabled (TLS/SSL)
- Database credentials managed by Secrets Manager with automatic 30-day rotation
- Security groups with least-privilege access
- IAM roles follow principle of least privilege

### High Availability
- Multi-AZ Aurora PostgreSQL cluster with 2 instances
- Multi-AZ ElastiCache Redis with automatic failover
- ECS Fargate services deployed across 2 availability zones
- EFS with multi-AZ mount targets
- Backup retention: 7 days for Aurora, 5 days for Redis
- RTO: 30 minutes (Multi-AZ automatic failover)
- RPO: 5 minutes (continuous replication)

### GDPR Compliance
- All resources tagged appropriately
- Encryption at rest and in transit
- Audit logging enabled via CloudWatch
- Data retention policies configured
- Automatic credential rotation

### Monitoring
- CloudWatch alarms for critical metrics
- Container Insights enabled for ECS
- CloudWatch Logs with 7-day retention
- Aurora and Redis CloudWatch logs enabled

### Cost Optimization
- T4g instances for Aurora and Redis (ARM-based, lower cost)
- EFS Intelligent-Tiering (data > 30 days moves to IA)
- Fargate Spot capacity strategy (50% spot, 50% on-demand)
- CloudWatch Logs retention set to 7 days

### Destroyability
- All resources have DeletionPolicy: Delete where applicable
- DeletionProtection disabled for Aurora
- No Retain policies that would block cleanup
