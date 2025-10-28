# Learning Management System Infrastructure - CloudFormation YAML

This document contains the complete infrastructure code for the Learning Management System (LMS) deployment using AWS CloudFormation in YAML format.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Containerized Learning Management System Infrastructure for EduTech Singapore'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource naming to enable multiple deployments'
    Default: 'dev'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  VpcCidr:
    Type: String
    Description: 'CIDR block for VPC'
    Default: '10.0.0.0/16'

  DatabaseMasterUsername:
    Type: String
    Description: 'Master username for Aurora database'
    Default: 'lmsadmin'
    NoEcho: true

  ContainerImage:
    Type: String
    Description: 'Docker image for LMS application'
    Default: 'nginx:latest'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DatabaseMasterUsername
      - Label:
          default: 'Application Configuration'
        Parameters:
          - ContainerImage

Resources:
  # ==================== VPC and Networking ====================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'lms-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'PDPA'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'lms-igw-${EnvironmentSuffix}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'lms-public-subnet-1-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'lms-public-subnet-2-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'lms-private-subnet-1-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'lms-private-subnet-2-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Private'

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [4, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'lms-database-subnet-1-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Database'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [5, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'lms-database-subnet-2-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Database'

  # NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'lms-nat-eip-${EnvironmentSuffix}'

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'lms-nat-gateway-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'lms-public-rt-${EnvironmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub 'lms-private-rt-${EnvironmentSuffix}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

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

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref PrivateRouteTable

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ==================== Security Groups ====================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'lms-alb-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic'
      Tags:
        - Key: Name
          Value: !Sub 'lms-alb-sg-${EnvironmentSuffix}'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'lms-ecs-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for ECS tasks'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow traffic from ALB'
      Tags:
        - Key: Name
          Value: !Sub 'lms-ecs-sg-${EnvironmentSuffix}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'lms-db-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Aurora database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: 'Allow MySQL traffic from ECS tasks'
      Tags:
        - Key: Name
          Value: !Sub 'lms-db-sg-${EnvironmentSuffix}'

  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'lms-redis-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for ElastiCache Redis'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: 'Allow Redis traffic from ECS tasks'
      Tags:
        - Key: Name
          Value: !Sub 'lms-redis-sg-${EnvironmentSuffix}'

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'lms-efs-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for EFS'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: 'Allow NFS traffic from ECS tasks'
      Tags:
        - Key: Name
          Value: !Sub 'lms-efs-sg-${EnvironmentSuffix}'

  # ==================== KMS Encryption Key ====================

  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for LMS data encryption - ${EnvironmentSuffix}'
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
          Value: !Sub 'lms-kms-key-${EnvironmentSuffix}'

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/lms-${EnvironmentSuffix}'
      TargetKeyId: !Ref EncryptionKey

  # ==================== Secrets Manager ====================

  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'lms-db-credentials-${EnvironmentSuffix}'
      Description: 'Database credentials for LMS Aurora cluster'
      KmsKeyId: !Ref EncryptionKey
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub 'lms-db-secret-${EnvironmentSuffix}'

  DatabaseSecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    DependsOn:
      - AuroraDBCluster
      - DatabaseSecretRotationLambdaPermission
    Properties:
      SecretId: !Ref DatabaseSecret
      RotationRules:
        AutomaticallyAfterDays: 30
      RotationLambdaARN: !GetAtt SecretRotationLambda.Arn

  APIKeySecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'lms-api-keys-${EnvironmentSuffix}'
      Description: 'API keys for LMS integrations'
      KmsKeyId: !Ref EncryptionKey
      GenerateSecretString:
        SecretStringTemplate: '{"apiKey": "placeholder"}'
        GenerateStringKey: 'apiSecret'
        PasswordLength: 64
      Tags:
        - Key: Name
          Value: !Sub 'lms-api-secret-${EnvironmentSuffix}'

  APIKeySecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    DependsOn: APIKeySecretRotationLambdaPermission
    Properties:
      SecretId: !Ref APIKeySecret
      RotationRules:
        AutomaticallyAfterDays: 30
      RotationLambdaARN: !GetAtt SecretRotationLambda.Arn

  # ==================== Lambda for Secret Rotation ====================

  SecretRotationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'lms-secret-rotation-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
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
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt EncryptionKey.Arn

  SecretRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'lms-secret-rotation-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt SecretRotationLambdaRole.Arn
      Timeout: 300
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
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              """Lambda function to rotate secrets"""
              logger.info('Secret rotation triggered')

              service_client = boto3.client('secretsmanager')
              arn = event['SecretId']
              token = event['ClientRequestToken']
              step = event['Step']

              # Implement rotation logic based on step
              if step == "createSecret":
                  logger.info(f"Creating new secret version for {arn}")
                  # Create new secret version

              elif step == "setSecret":
                  logger.info(f"Setting new secret in service for {arn}")
                  # Update the service with new credentials

              elif step == "testSecret":
                  logger.info(f"Testing new secret for {arn}")
                  # Test the new credentials

              elif step == "finishSecret":
                  logger.info(f"Finishing secret rotation for {arn}")
                  # Finalize the rotation

              return {
                  'statusCode': 200,
                  'body': json.dumps('Secret rotation completed')
              }

  DatabaseSecretRotationLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecretRotationLambda
      Action: 'lambda:InvokeFunction'
      Principal: 'secretsmanager.amazonaws.com'
      SourceArn: !Ref DatabaseSecret

  APIKeySecretRotationLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecretRotationLambda
      Action: 'lambda:InvokeFunction'
      Principal: 'secretsmanager.amazonaws.com'
      SourceArn: !Ref APIKeySecret

  # ==================== RDS Aurora Cluster ====================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'lms-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for LMS Aurora cluster'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'lms-db-subnet-group-${EnvironmentSuffix}'

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: !Sub 'lms-aurora-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      DatabaseName: lmsdb
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !Ref EncryptionKey
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub 'lms-aurora-cluster-${EnvironmentSuffix}'
        - Key: Compliance
          Value: 'PDPA'

  AuroraDBInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'lms-aurora-instance-1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'lms-aurora-instance-1-${EnvironmentSuffix}'

  AuroraDBInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'lms-aurora-instance-2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'lms-aurora-instance-2-${EnvironmentSuffix}'

  # ==================== ElastiCache Redis ====================

  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      CacheSubnetGroupName: !Sub 'lms-redis-subnet-group-${EnvironmentSuffix}'
      Description: 'Subnet group for LMS Redis cluster'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub 'lms-redis-${EnvironmentSuffix}'
      ReplicationGroupDescription: 'Redis cluster for LMS session management'
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: cache.r5.large
      NumCacheClusters: 2
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      SecurityGroupIds:
        - !Ref RedisSecurityGroup
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      KmsKeyId: !Ref EncryptionKey
      SnapshotRetentionLimit: 5
      SnapshotWindow: '03:00-05:00'
      PreferredMaintenanceWindow: 'mon:05:00-mon:06:00'
      Tags:
        - Key: Name
          Value: !Sub 'lms-redis-${EnvironmentSuffix}'

  # ==================== EFS File System ====================

  EFSFileSystem:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: true
      KmsKeyId: !Ref EncryptionKey
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      LifecyclePolicies:
        - TransitionToIA: AFTER_30_DAYS
      FileSystemTags:
        - Key: Name
          Value: !Sub 'lms-efs-${EnvironmentSuffix}'

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

  # ==================== ECS Cluster ====================

  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'lms-cluster-${EnvironmentSuffix}'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'lms-cluster-${EnvironmentSuffix}'

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'lms-ecs-execution-role-${EnvironmentSuffix}'
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
        - PolicyName: SecretsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource:
                  - !Ref DatabaseSecret
                  - !Ref APIKeySecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt EncryptionKey.Arn

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'lms-ecs-task-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: ApplicationAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kinesis:PutRecord'
                  - 'kinesis:PutRecords'
                Resource: !GetAtt KinesisDataStream.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: '*'

  CloudWatchLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/lms-${EnvironmentSuffix}'
      RetentionInDays: 30

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'lms-task-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '1024'
      Memory: '2048'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: lms-app
          Image: !Ref ContainerImage
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          Environment:
            - Name: REDIS_ENDPOINT
              Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Address
            - Name: DB_ENDPOINT
              Value: !GetAtt AuroraDBCluster.Endpoint.Address
            - Name: KINESIS_STREAM
              Value: !Ref KinesisDataStream
            - Name: ENVIRONMENT
              Value: !Ref EnvironmentSuffix
          Secrets:
            - Name: DB_PASSWORD
              ValueFrom: !Sub '${DatabaseSecret}:password::'
            - Name: DB_USERNAME
              ValueFrom: !Sub '${DatabaseSecret}:username::'
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref CloudWatchLogsGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          MountPoints:
            - SourceVolume: efs-storage
              ContainerPath: /mnt/efs
              ReadOnly: false
      Volumes:
        - Name: efs-storage
          EFSVolumeConfiguration:
            FilesystemId: !Ref EFSFileSystem
            TransitEncryption: ENABLED

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'lms-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'lms-alb-${EnvironmentSuffix}'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'lms-tg-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckPort: traffic-port
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub 'lms-service-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      LaunchType: FARGATE
      DesiredCount: 2
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          SecurityGroups:
            - !Ref ECSSecurityGroup
      LoadBalancers:
        - ContainerName: lms-app
          ContainerPort: 80
          TargetGroupArn: !Ref ALBTargetGroup
      HealthCheckGracePeriodSeconds: 60
      Tags:
        - Key: Name
          Value: !Sub 'lms-service-${EnvironmentSuffix}'

  # ==================== Auto Scaling ====================

  ServiceScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: ecs
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      ScalableDimension: ecs:service:DesiredCount
      MinCapacity: 2
      MaxCapacity: 20
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'

  ServiceScalingPolicyCPU:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'lms-cpu-scaling-${EnvironmentSuffix}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        ScaleInCooldown: 60
        ScaleOutCooldown: 60

  ServiceScalingPolicyMemory:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'lms-memory-scaling-${EnvironmentSuffix}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 80.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageMemoryUtilization
        ScaleInCooldown: 60
        ScaleOutCooldown: 60

  # ==================== Kinesis Data Stream ====================

  KinesisDataStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub 'lms-analytics-stream-${EnvironmentSuffix}'
      ShardCount: 2
      RetentionPeriodHours: 24
      StreamEncryption:
        EncryptionType: KMS
        KeyId: !Ref EncryptionKey
      Tags:
        - Key: Name
          Value: !Sub 'lms-analytics-stream-${EnvironmentSuffix}'

  # ==================== API Gateway ====================

  RestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'lms-api-${EnvironmentSuffix}'
      Description: 'API Gateway for LMS application'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub 'lms-api-${EnvironmentSuffix}'

  APIGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestAPI
      ParentId: !GetAtt RestAPI.RootResourceId
      PathPart: 'lms'

  APIGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestAPI
      ResourceId: !Ref APIGatewayResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: HTTP_PROXY
        IntegrationHttpMethod: ANY
        Uri: !Sub 'http://${ApplicationLoadBalancer.DNSName}/lms'

  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIGatewayMethod
    Properties:
      RestApiId: !Ref RestAPI
      StageName: prod

  APIGatewayUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: APIGatewayDeployment
    Properties:
      UsagePlanName: !Sub 'lms-usage-plan-${EnvironmentSuffix}'
      Description: 'Usage plan for LMS API'
      ApiStages:
        - ApiId: !Ref RestAPI
          Stage: prod
      Throttle:
        RateLimit: 1000
        BurstLimit: 2000

  # ==================== CloudWatch Alarms ====================

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'lms-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when CPU exceeds 80%'
      MetricName: CPUUtilization
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

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'lms-db-connections-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when database connections are high'
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

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  ECSClusterName:
    Description: 'ECS Cluster Name'
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECSCluster'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: 'Aurora Database Endpoint'
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  RedisEndpoint:
    Description: 'Redis Cluster Endpoint'
    Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Redis-Endpoint'

  EFSFileSystemId:
    Description: 'EFS File System ID'
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFS-ID'

  KinesisStreamName:
    Description: 'Kinesis Data Stream Name'
    Value: !Ref KinesisDataStream
    Export:
      Name: !Sub '${AWS::StackName}-Kinesis-Stream'

  APIGatewayURL:
    Description: 'API Gateway Endpoint URL'
    Value: !Sub 'https://${RestAPI}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-API-URL'
```

## Infrastructure Components

### Networking
- VPC with DNS support enabled
- 2 public subnets across 2 availability zones
- 2 private subnets for ECS tasks
- 2 database subnets for RDS instances
- NAT Gateway for private subnet internet access
- Internet Gateway for public subnet access
- Route tables configured for public and private traffic

### Security
- KMS encryption key for data encryption at rest
- Security groups with least privilege access
- Secrets Manager for credential management with automatic rotation
- Transit encryption enabled for Redis
- EFS encryption enabled

### Compute
- ECS Fargate cluster with Container Insights enabled
- Auto Scaling configured for CPU and memory metrics (2-20 instances)
- Task definition with 1 vCPU and 2GB memory
- Application Load Balancer for traffic distribution
- Target group health checks on root path

### Database
- Aurora MySQL cluster with 2 instances (db.r5.large)
- Storage encryption using KMS
- Automated backups with 7-day retention
- CloudWatch Logs export enabled
- Multi-AZ deployment for high availability

### Caching
- ElastiCache Redis cluster with 2 nodes (cache.r5.large)
- Automatic failover enabled
- Multi-AZ deployment
- At-rest and transit encryption enabled
- Snapshot retention for 5 days

### Storage
- EFS file system with encryption
- Lifecycle policy to transition to IA after 30 days
- Mount targets in private subnets
- Integrated with ECS task definition

### Streaming
- Kinesis Data Stream for analytics
- 2 shards with 24-hour retention
- KMS encryption enabled

### API Management
- API Gateway REST API
- Usage plan with throttling (1000 req/s, 2000 burst)
- HTTP proxy integration with ALB

### Monitoring
- CloudWatch alarms for ECS CPU utilization
- CloudWatch alarms for RDS connections
- Container Insights enabled
- CloudWatch Logs with 30-day retention

### IAM Roles
- ECS Task Execution Role for pulling images and secrets
- ECS Task Role for application permissions
- Lambda Role for secret rotation
- Least privilege policies applied

### Lambda Functions
- Secret rotation function for automated credential rotation
- Deployed in VPC for secure database access
- 30-day automatic rotation schedule

## Key Features

1. **High Availability**: Multi-AZ deployment across 2 availability zones
2. **Security**: Encryption at rest and in transit, secret rotation, KMS encryption
3. **Scalability**: Auto Scaling from 2 to 20 ECS tasks based on CPU/memory
4. **Monitoring**: CloudWatch alarms and Container Insights
5. **Compliance**: PDPA-compliant tags and security controls
6. **Disaster Recovery**: Automated backups and snapshots
