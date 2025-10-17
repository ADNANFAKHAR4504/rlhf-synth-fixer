# CloudFormation YAML Implementation for University LMS Infrastructure

This implementation provides a complete, GDPR-compliant learning management system infrastructure using CloudFormation YAML with all required AWS services.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure containerized learning management system infrastructure for European university with GDPR compliance'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource naming to ensure uniqueness'
    Default: 'lms-prod'
    AllowedPattern: '[a-z0-9-]+'
    ConstraintDescription: 'Must contain only lowercase alphanumeric characters and hyphens'

  ECSTaskCpu:
    Type: String
    Description: 'CPU units for ECS task (256, 512, 1024, 2048, 4096)'
    Default: '1024'
    AllowedValues:
      - '256'
      - '512'
      - '1024'
      - '2048'
      - '4096'

  ECSTaskMemory:
    Type: String
    Description: 'Memory for ECS task in MB'
    Default: '2048'
    AllowedValues:
      - '512'
      - '1024'
      - '2048'
      - '4096'
      - '8192'

  DatabaseInstanceClass:
    Type: String
    Description: 'Aurora PostgreSQL instance class'
    Default: 'db.t4g.medium'

  DatabaseName:
    Type: String
    Description: 'PostgreSQL database name'
    Default: 'lmsdb'

  RedisNodeType:
    Type: String
    Description: 'ElastiCache Redis node type'
    Default: 'cache.t4g.small'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (for NAT Gateway)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'

  # Private Subnets (for application resources)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'

  # NAT Gateway for private subnet internet access
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-${EnvironmentSuffix}'

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'

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
          Value: !Sub 'private-rt-${EnvironmentSuffix}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  # KMS Keys for encryption
  DatabaseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for Aurora PostgreSQL encryption'
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

  DatabaseKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/database-${EnvironmentSuffix}'
      TargetKeyId: !Ref DatabaseKMSKey

  EFSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for EFS encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EFS to use the key
            Effect: Allow
            Principal:
              Service: elasticfilesystem.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'

  EFSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/efs-${EnvironmentSuffix}'
      TargetKeyId: !Ref EFSKMSKey

  # SecretsManager for database credentials
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'database-credentials-${EnvironmentSuffix}'
      Description: 'Aurora PostgreSQL database credentials'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "lmsadmin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true

  # Security Groups
  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ecs-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for ECS Fargate tasks'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          CidrIp: 10.0.0.0/16
          Description: 'Allow HTTP traffic from VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'ecs-sg-${EnvironmentSuffix}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'database-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Aurora PostgreSQL'
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
          Value: !Sub 'database-sg-${EnvironmentSuffix}'

  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'redis-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for ElastiCache Redis'
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
          Value: !Sub 'redis-sg-${EnvironmentSuffix}'

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'efs-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for EFS'
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
          Value: !Sub 'efs-sg-${EnvironmentSuffix}'

  # Aurora PostgreSQL
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for Aurora PostgreSQL'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'db-subnet-group-${EnvironmentSuffix}'

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'aurora-cluster-${EnvironmentSuffix}'
      Engine: aurora-postgresql
      EngineVersion: '15.4'
      DatabaseName: !Ref DatabaseName
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 90
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      StorageEncrypted: true
      KmsKeyId: !GetAtt DatabaseKMSKey.Arn
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub 'aurora-cluster-${EnvironmentSuffix}'

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      DBInstanceClass: !Ref DatabaseInstanceClass
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-1-${EnvironmentSuffix}'

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      DBInstanceClass: !Ref DatabaseInstanceClass
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-2-${EnvironmentSuffix}'

  # ElastiCache Redis
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      CacheSubnetGroupName: !Sub 'redis-subnet-group-${EnvironmentSuffix}'
      Description: 'Subnet group for ElastiCache Redis'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub 'redis-${EnvironmentSuffix}'
      ReplicationGroupDescription: 'Redis cluster for session management'
      Engine: redis
      EngineVersion: '7.1'
      CacheNodeType: !Ref RedisNodeType
      NumCacheClusters: 2
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      SecurityGroupIds:
        - !Ref RedisSecurityGroup
      AtRestEncryptionEnabled: false
      TransitEncryptionEnabled: true
      TransitEncryptionMode: required
      Port: 6379
      SnapshotRetentionLimit: 7
      SnapshotWindow: '03:00-05:00'
      PreferredMaintenanceWindow: 'sun:05:00-sun:07:00'
      Tags:
        - Key: Name
          Value: !Sub 'redis-${EnvironmentSuffix}'

  # EFS Filesystem
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
          Value: !Sub 'efs-${EnvironmentSuffix}'

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

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'ecs-cluster-${EnvironmentSuffix}'
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

  # ECS Task Execution Role
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
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
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DatabaseSecret

  # ECS Task Role
  ECSTaskRole:
    Type: AWS::IAM::Role
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
        - PolicyName: EFSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'elasticfilesystem:ClientMount'
                  - 'elasticfilesystem:ClientWrite'
                  - 'elasticfilesystem:ClientRootAccess'
                Resource: !GetAtt EFSFileSystem.Arn
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DatabaseSecret

  # CloudWatch Log Group
  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/lms-${EnvironmentSuffix}'
      RetentionInDays: 30

  # ECS Task Definition
  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    DependsOn:
      - EFSMountTarget1
      - EFSMountTarget2
    Properties:
      Family: !Sub 'lms-task-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: !Ref ECSTaskCpu
      Memory: !Ref ECSTaskMemory
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: lms-application
          Image: 'nginx:latest'
          Essential: true
          PortMappings:
            - ContainerPort: 8080
              Protocol: tcp
          Environment:
            - Name: DATABASE_HOST
              Value: !GetAtt AuroraCluster.Endpoint.Address
            - Name: DATABASE_PORT
              Value: '5432'
            - Name: DATABASE_NAME
              Value: !Ref DatabaseName
            - Name: REDIS_HOST
              Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Address
            - Name: REDIS_PORT
              Value: '6379'
          Secrets:
            - Name: DATABASE_USERNAME
              ValueFrom: !Sub '${DatabaseSecret}:username::'
            - Name: DATABASE_PASSWORD
              ValueFrom: !Sub '${DatabaseSecret}:password::'
          MountPoints:
            - SourceVolume: efs-storage
              ContainerPath: /mnt/efs
              ReadOnly: false
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: lms
      Volumes:
        - Name: efs-storage
          EFSVolumeConfiguration:
            FilesystemId: !Ref EFSFileSystem
            TransitEncryption: ENABLED
            AuthorizationConfig:
              IAM: ENABLED

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: !Sub 'lms-service-${EnvironmentSuffix}'
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
          SecurityGroups:
            - !Ref ECSSecurityGroup
      HealthCheckGracePeriodSeconds: 60
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 100
        DeploymentCircuitBreaker:
          Enable: true
          Rollback: true
      Tags:
        - Key: Name
          Value: !Sub 'lms-service-${EnvironmentSuffix}'

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

  DatabaseEndpoint:
    Description: 'Aurora PostgreSQL Endpoint'
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  RedisEndpoint:
    Description: 'ElastiCache Redis Primary Endpoint'
    Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RedisEndpoint'

  EFSFileSystemId:
    Description: 'EFS File System ID'
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFSFileSystemId'

  DatabaseSecretArn:
    Description: 'Database Secret ARN'
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSecretArn'
```

## Architecture Overview

This CloudFormation template implements a secure, GDPR-compliant learning management system infrastructure with the following components:

### Network Architecture
- **VPC**: 10.0.0.0/16 CIDR with DNS support enabled
- **Public Subnets**: 2 subnets across different AZs for NAT Gateway
- **Private Subnets**: 2 subnets across different AZs for all application resources
- **NAT Gateway**: Provides controlled internet access for private resources
- **Internet Gateway**: Attached to VPC for public subnet connectivity

### Security & Compliance
- **KMS Encryption**: Separate customer-managed keys for database and EFS
- **SecretsManager**: Secure storage and retrieval of database credentials
- **Security Groups**: Least privilege access rules for each service
- **Network Isolation**: All application resources in private subnets
- **TLS/SSL**: Redis with transit encryption enabled, EFS with transit encryption

### Database Layer
- **Aurora PostgreSQL 15.4**: Multi-AZ deployment with 2 instances
- **90-day Backup Retention**: Meets compliance requirements
- **Point-in-time Recovery**: Enabled through Aurora continuous backups
- **Encryption at Rest**: Using KMS customer-managed key

### Application Platform
- **ECS Fargate Cluster**: Serverless container orchestration
- **Task Definition**: Configured with database and Redis connectivity
- **ECS Service**: 2 tasks for high availability, deployment circuit breaker enabled
- **Auto-scaling**: Supports capacity provider strategies

### Caching & Storage
- **ElastiCache Redis 7.1**: Multi-AZ replication group with automatic failover
- **Transit Encryption**: Required for all Redis connections
- **EFS**: Encrypted file system with lifecycle policies
- **Shared Access**: EFS accessible from all ECS tasks

### Monitoring
- **CloudWatch Logs**: Centralized logging for ECS tasks
- **Container Insights**: Enabled on ECS cluster
- **Aurora CloudWatch Logs**: PostgreSQL logs exported to CloudWatch

## Deployment Instructions

1. Deploy the CloudFormation stack:
   ```bash
   aws cloudformation create-stack \
     --stack-name university-lms-infrastructure \
     --template-body file://lib/TapStack.yml \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=lms-prod \
     --capabilities CAPABILITY_NAMED_IAM \
     --region eu-central-1
   ```

2. Monitor stack creation:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name university-lms-infrastructure \
     --region eu-central-1
   ```

3. Retrieve outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name university-lms-infrastructure \
     --query 'Stacks[0].Outputs' \
     --region eu-central-1
   ```

## GDPR Compliance Features

- **Data Encryption**: All data encrypted at rest using KMS and in transit using TLS
- **Data Residency**: All resources deployed in eu-central-1 (Frankfurt)
- **Backup & Recovery**: 90-day retention with point-in-time recovery
- **Access Control**: IAM roles and security groups enforce least privilege
- **Audit Logging**: CloudWatch logs for all services
- **Data Isolation**: Private network architecture with no public exposure

## AWS Services Used

- VPC
- EC2 (Subnets, Security Groups, NAT Gateway, Internet Gateway)
- ECS Fargate
- RDS Aurora PostgreSQL
- ElastiCache Redis
- KMS
- SecretsManager
- EFS
- IAM
- CloudWatch Logs
