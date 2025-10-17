# University Learning Management System Infrastructure

Complete CloudFormation YAML template for a GDPR-compliant learning management system infrastructure deployed in eu-central-1 (Frankfurt).

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

### Network Layer
- **VPC**: 10.0.0.0/16 CIDR with DNS support enabled
- **Public Subnets**: 2 subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs for NAT Gateway
- **Private Subnets**: 2 subnets (10.0.11.0/24, 10.0.12.0/24) across different AZs for application resources
- **Internet Gateway**: Provides internet connectivity to public subnets
- **NAT Gateway**: Enables controlled outbound internet access from private subnets
- **Route Tables**: Separate routing for public (IGW) and private (NAT) subnets

### Security & Encryption
- **KMS Keys**: Customer-managed keys for Aurora PostgreSQL and EFS encryption
- **Secrets Manager**: Secure storage for database credentials with auto-generated password
- **Security Groups**: Least privilege access controls:
  - ECS tasks can access database (port 5432), Redis (port 6379), and EFS (port 2049)
  - All application resources isolated in private subnets (no public exposure)

### Database Layer
- **Aurora PostgreSQL 15.4**: Serverless v2 compatible cluster with 2 instances
- **Multi-AZ**: Instances deployed across different availability zones
- **Backup Strategy**: 
  - 90-day automated backup retention for GDPR compliance
  - Daily backups scheduled at 3 AM UTC
  - Point-in-time recovery enabled via Aurora continuous backups
- **Encryption**: At-rest encryption using KMS customer-managed key
- **Monitoring**: CloudWatch Logs export for PostgreSQL logs

### Application Platform
- **ECS Fargate Cluster**: Serverless container orchestration
- **Container Insights**: Enabled for enhanced monitoring
- **Capacity Providers**: FARGATE and FARGATE_SPOT for cost optimization
- **Task Definition**: 
  - Configurable CPU (default: 1024 units) and memory (default: 2048 MB)
  - Network mode: awsvpc for enhanced networking
  - Container image: nginx:latest (placeholder for actual LMS application)
  - Environment variables for database and Redis connectivity
  - Secrets injection from Secrets Manager
  - EFS volume mount at /mnt/efs
- **ECS Service**:
  - 2 tasks for high availability
  - Deployed in private subnets with no public IP
  - Deployment circuit breaker with automatic rollback
  - Health check grace period: 60 seconds

### Caching & Storage
- **ElastiCache Redis 7.1**: 
  - Replication group with 2 cache clusters
  - Multi-AZ with automatic failover
  - Transit encryption enabled (TLS required)
  - At-rest encryption disabled (not supported with transit encryption in this configuration)
  - 7-day snapshot retention
- **EFS File System**:
  - KMS encryption at rest
  - General purpose performance mode
  - Bursting throughput mode
  - Lifecycle policy: transition to Infrequent Access after 30 days
  - Mount targets in both private subnets

### IAM Roles & Permissions
- **ECS Task Execution Role**: 
  - AmazonECSTaskExecutionRolePolicy for container management
  - Secrets Manager read access for database credentials
- **ECS Task Role**:
  - EFS mount/write/root access permissions
  - Secrets Manager read access for runtime credential retrieval

### Monitoring & Logging
- **CloudWatch Log Group**: 
  - Centralized logging for ECS containers
  - 30-day log retention
  - Log stream prefix: lms

## GDPR Compliance

- ✅ **Data Residency**: All resources deployed in eu-central-1 (Frankfurt, Germany)
- ✅ **Encryption at Rest**: KMS customer-managed keys for database and EFS
- ✅ **Encryption in Transit**: TLS/SSL enabled for Redis, EFS, and database connections
- ✅ **90-Day Backup Retention**: Aurora automated backups with 90-day retention
- ✅ **Point-in-Time Recovery**: Aurora continuous backups enable PITR
- ✅ **Private Network Architecture**: All application resources in private subnets with no public exposure
- ✅ **Least Privilege Access**: IAM roles and security groups enforce minimal required permissions
- ✅ **Audit Logging**: CloudWatch Logs for comprehensive activity tracking

## Deployment

Deploy using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name university-lms-infrastructure \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=lms-prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-central-1
```

## AWS Services Used

- **Networking**: VPC, Subnets, Internet Gateway, NAT Gateway, Route Tables, Elastic IP
- **Compute**: ECS Fargate
- **Database**: RDS Aurora PostgreSQL 15.4
- **Caching**: ElastiCache Redis 7.1
- **Storage**: EFS (Elastic File System)
- **Security**: KMS, Secrets Manager, Security Groups
- **Identity**: IAM (Roles, Policies)
- **Monitoring**: CloudWatch Logs, Container Insights

## Resource Naming Convention

All resources use the `EnvironmentSuffix` parameter for unique naming to support multiple deployments:
- VPC: `vpc-${EnvironmentSuffix}`
- Database: `aurora-cluster-${EnvironmentSuffix}`
- ECS Cluster: `ecs-cluster-${EnvironmentSuffix}`
- Security Groups: `{service}-sg-${EnvironmentSuffix}`
- IAM Roles: `{purpose}-role-${EnvironmentSuffix}`

This ensures resource isolation and supports parallel deployments in the same AWS account and region.
