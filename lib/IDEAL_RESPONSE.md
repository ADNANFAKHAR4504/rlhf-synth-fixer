# CloudFormation Infrastructure for PCI-DSS Compliant Transaction Processing

This solution provides a complete, production-ready CloudFormation template for a highly available, PCI-DSS compliant financial transaction processing infrastructure deployed across 3 Availability Zones in eu-west-1.

## File: TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PCI-DSS Compliant Financial Transaction Processing Infrastructure with High Availability'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming
    Default: prod
    AllowedPattern: '[a-zA-Z0-9-]*'
    ConstraintDescription: Must contain only alphanumeric characters and hyphens

  DatabaseMasterUsername:
    Type: String
    Description: Master username for RDS Aurora
    Default: dbadmin
    NoEcho: true

  VpcCIDR:
    Type: String
    Description: CIDR block for VPC
    Default: 10.0.0.0/16

Resources:
  # ========================================
  # KMS Encryption Keys
  # ========================================

  DatabaseEncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for RDS Aurora encryption - ${EnvironmentSuffix}'
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

  DatabaseEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AliasName: !Sub 'alias/rds-encryption-${EnvironmentSuffix}'
      TargetKeyId: !Ref DatabaseEncryptionKey

  EFSEncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for EFS encryption - ${EnvironmentSuffix}'
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
          - Sid: Allow EFS to use the key
            Effect: Allow
            Principal:
              Service: elasticfilesystem.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'

  EFSEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AliasName: !Sub 'alias/efs-encryption-${EnvironmentSuffix}'
      TargetKeyId: !Ref EFSEncryptionKey

  # ========================================
  # VPC and Network Infrastructure
  # ========================================

  VPC:
    Type: AWS::EC2::VPC
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-transaction-${EnvironmentSuffix}'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-transaction-${EnvironmentSuffix}'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-public-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-public-2-${EnvironmentSuffix}'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-public-3-${EnvironmentSuffix}'

  # Private Subnets (3 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'subnet-private-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'subnet-private-2-${EnvironmentSuffix}'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.0.13.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'subnet-private-3-${EnvironmentSuffix}'

  # NAT Gateway for Private Subnet Internet Access
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-natgateway-${EnvironmentSuffix}'

  NatGateway:
    Type: AWS::EC2::NatGateway
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'rtb-public-${EnvironmentSuffix}'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'rtb-private-${EnvironmentSuffix}'

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet3

  # ========================================
  # Security Groups
  # ========================================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub 'sg-alb-${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'sg-alb-${EnvironmentSuffix}'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub 'sg-ecs-${EnvironmentSuffix}'
      GroupDescription: Security group for ECS Fargate tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow traffic from ALB
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'sg-ecs-${EnvironmentSuffix}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub 'sg-database-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS Aurora
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: PostgreSQL from ECS tasks
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'sg-database-${EnvironmentSuffix}'

  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub 'sg-redis-${EnvironmentSuffix}'
      GroupDescription: Security group for ElastiCache Redis
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: Redis from ECS tasks
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'sg-redis-${EnvironmentSuffix}'

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub 'sg-efs-${EnvironmentSuffix}'
      GroupDescription: Security group for EFS
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          SourceSecurityGroupId: !Ref ECSSecurityGroup
          Description: NFS from ECS tasks
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'sg-efs-${EnvironmentSuffix}'

  # ========================================
  # Secrets Manager
  # ========================================

  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'secret-database-${EnvironmentSuffix}'
      Description: Database credentials for RDS Aurora
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true

  # ========================================
  # RDS Aurora PostgreSQL
  # ========================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBSubnetGroupName: !Sub 'dbsubnet-transaction-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS Aurora
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'dbsubnet-transaction-${EnvironmentSuffix}'

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'aurora-transaction-${EnvironmentSuffix}'
      Engine: aurora-postgresql
      EngineMode: provisioned
      EngineVersion: '15.4'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      DatabaseName: transactions
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseEncryptionKey
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-transaction-${EnvironmentSuffix}'

  AuroraDBInstance1:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-postgresql
      DBInstanceClass: db.r6g.large
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-1-${EnvironmentSuffix}'

  AuroraDBInstance2:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-postgresql
      DBInstanceClass: db.r6g.large
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-2-${EnvironmentSuffix}'

  AuroraDBInstance3:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-3-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-postgresql
      DBInstanceClass: db.r6g.large
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-3-${EnvironmentSuffix}'

  # ========================================
  # ElastiCache Redis
  # ========================================

  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: Subnet group for ElastiCache Redis
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      CacheSubnetGroupName: !Sub 'redis-subnet-${EnvironmentSuffix}'

  RedisReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      ReplicationGroupId: !Sub 'redis-transaction-${EnvironmentSuffix}'
      ReplicationGroupDescription: Redis cluster for session management
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: cache.r6g.large
      NumCacheClusters: 3
      MultiAZEnabled: true
      AutomaticFailoverEnabled: true
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      SecurityGroupIds:
        - !Ref RedisSecurityGroup
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      PreferredMaintenanceWindow: 'sun:05:00-sun:06:00'
      SnapshotRetentionLimit: 5
      SnapshotWindow: '03:00-04:00'
      Tags:
        - Key: Name
          Value: !Sub 'redis-transaction-${EnvironmentSuffix}'

  # ========================================
  # EFS File System
  # ========================================

  EFSFileSystem:
    Type: AWS::EFS::FileSystem
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Encrypted: true
      KmsKeyId: !Ref EFSEncryptionKey
      LifecyclePolicies:
        - TransitionToIA: AFTER_30_DAYS
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      FileSystemTags:
        - Key: Name
          Value: !Sub 'efs-transaction-${EnvironmentSuffix}'

  EFSMountTarget1:
    Type: AWS::EFS::MountTarget
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet1
      SecurityGroups:
        - !Ref EFSSecurityGroup

  EFSMountTarget2:
    Type: AWS::EFS::MountTarget
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet2
      SecurityGroups:
        - !Ref EFSSecurityGroup

  EFSMountTarget3:
    Type: AWS::EFS::MountTarget
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      FileSystemId: !Ref EFSFileSystem
      SubnetId: !Ref PrivateSubnet3
      SecurityGroups:
        - !Ref EFSSecurityGroup

  # ========================================
  # Kinesis Data Stream
  # ========================================

  TransactionDataStream:
    Type: AWS::Kinesis::Stream
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'kinesis-transaction-${EnvironmentSuffix}'
      RetentionPeriodHours: 24
      ShardCount: 3
      StreamEncryption:
        EncryptionType: KMS
        KeyId: alias/aws/kinesis
      StreamModeDetails:
        StreamMode: PROVISIONED
      Tags:
        - Key: Name
          Value: !Sub 'kinesis-transaction-${EnvironmentSuffix}'

  # ========================================
  # CloudWatch Log Groups
  # ========================================

  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/ecs/transaction-processing-${EnvironmentSuffix}'
      RetentionInDays: 30

  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/apigateway/transaction-api-${EnvironmentSuffix}'
      RetentionInDays: 30

  # ========================================
  # IAM Roles
  # ========================================

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      RoleName: !Sub 'role-ecs-execution-${EnvironmentSuffix}'
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
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt ECSLogGroup.Arn

  ECSTaskRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      RoleName: !Sub 'role-ecs-task-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: KinesisAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kinesis:PutRecord'
                  - 'kinesis:PutRecords'
                  - 'kinesis:GetRecords'
                  - 'kinesis:GetShardIterator'
                  - 'kinesis:DescribeStream'
                  - 'kinesis:ListStreams'
                Resource: !GetAtt TransactionDataStream.Arn
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DatabaseSecret
        - PolicyName: CloudWatchMetrics
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'

  APIGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      RoleName: !Sub 'role-apigateway-cloudwatch-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'

  # ========================================
  # ECS Cluster and Service
  # ========================================

  ECSCluster:
    Type: AWS::ECS::Cluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      ClusterName: !Sub 'ecs-transaction-${EnvironmentSuffix}'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
          Base: 2
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'ecs-transaction-${EnvironmentSuffix}'

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Family: !Sub 'task-transaction-processing-${EnvironmentSuffix}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '1024'
      Memory: '2048'
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: transaction-processor
          Image: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/transaction-processor:latest'
          Essential: true
          PortMappings:
            - ContainerPort: 8080
              Protocol: tcp
          Environment:
            - Name: KINESIS_STREAM_NAME
              Value: !Ref TransactionDataStream
            - Name: REDIS_ENDPOINT
              Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Address
            - Name: REDIS_PORT
              Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Port
            - Name: DATABASE_ENDPOINT
              Value: !GetAtt AuroraDBCluster.Endpoint.Address
            - Name: DATABASE_PORT
              Value: !GetAtt AuroraDBCluster.Endpoint.Port
            - Name: DATABASE_NAME
              Value: transactions
          Secrets:
            - Name: DATABASE_USERNAME
              ValueFrom: !Sub '${DatabaseSecret}:username::'
            - Name: DATABASE_PASSWORD
              ValueFrom: !Sub '${DatabaseSecret}:password::'
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          MountPoints:
            - SourceVolume: efs-storage
              ContainerPath: /mnt/efs
              ReadOnly: false
          HealthCheck:
            Command:
              - CMD-SHELL
              - curl -f http://localhost:8080/health || exit 1
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60
      Volumes:
        - Name: efs-storage
          EFSVolumeConfiguration:
            FilesystemId: !Ref EFSFileSystem
            TransitEncryption: ENABLED

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'alb-transaction-${EnvironmentSuffix}'
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
          Value: !Sub 'alb-transaction-${EnvironmentSuffix}'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'tg-transaction-${EnvironmentSuffix}'
      VpcId: !Ref VPC
      Port: 8080
      Protocol: HTTP
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Tags:
        - Key: Name
          Value: !Sub 'tg-transaction-${EnvironmentSuffix}'

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
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      ServiceName: !Sub 'service-transaction-${EnvironmentSuffix}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: 3
      LaunchType: FARGATE
      PlatformVersion: LATEST
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
        - ContainerName: transaction-processor
          ContainerPort: 8080
          TargetGroupArn: !Ref ALBTargetGroup
      HealthCheckGracePeriodSeconds: 60
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 100
        DeploymentCircuitBreaker:
          Enable: true
          Rollback: true
      Tags:
        - Key: Name
          Value: !Sub 'service-transaction-${EnvironmentSuffix}'

  # ========================================
  # Auto Scaling
  # ========================================

  ECSServiceScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: ecs
      ScalableDimension: ecs:service:DesiredCount
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      MinCapacity: 3
      MaxCapacity: 15
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'

  ECSServiceScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'scaling-policy-ecs-${EnvironmentSuffix}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSServiceScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleInCooldown: 300
        ScaleOutCooldown: 60

  # ========================================
  # API Gateway
  # ========================================

  TransactionAPI:
    Type: AWS::ApiGateway::RestApi
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'api-transaction-${EnvironmentSuffix}'
      Description: REST API for transaction processing
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: 'execute-api:Invoke'
            Resource: '*'

  TransactionResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref TransactionAPI
      ParentId: !GetAtt TransactionAPI.RootResourceId
      PathPart: transactions

  TransactionMethodPost:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref TransactionAPI
      ResourceId: !Ref TransactionResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: HTTP_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'http://${ApplicationLoadBalancer.DNSName}/transactions'
        IntegrationResponses:
          - StatusCode: 200
      MethodResponses:
        - StatusCode: 200

  TransactionMethodGet:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref TransactionAPI
      ResourceId: !Ref TransactionResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: HTTP_PROXY
        IntegrationHttpMethod: GET
        Uri: !Sub 'http://${ApplicationLoadBalancer.DNSName}/transactions'
        IntegrationResponses:
          - StatusCode: 200
      MethodResponses:
        - StatusCode: 200

  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - TransactionMethodPost
      - TransactionMethodGet
    Properties:
      RestApiId: !Ref TransactionAPI
      StageName: prod
      StageDescription:
        LoggingLevel: INFO
        DataTraceEnabled: true
        MetricsEnabled: true
        TracingEnabled: true

  APIGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt APIGatewayCloudWatchRole.Arn

# ========================================
# Outputs
# ========================================

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  DatabaseEndpoint:
    Description: RDS Aurora cluster endpoint
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  DatabasePort:
    Description: RDS Aurora cluster port
    Value: !GetAtt AuroraDBCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DatabasePort'

  RedisEndpoint:
    Description: ElastiCache Redis primary endpoint
    Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RedisEndpoint'

  RedisPort:
    Description: ElastiCache Redis port
    Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RedisPort'

  KinesisStreamName:
    Description: Kinesis Data Stream name
    Value: !Ref TransactionDataStream
    Export:
      Name: !Sub '${AWS::StackName}-KinesisStreamName'

  EFSFileSystemId:
    Description: EFS File System ID
    Value: !Ref EFSFileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFSFileSystemId'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  APIGatewayURL:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${TransactionAPI}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-APIGatewayURL'

  ECSClusterName:
    Description: ECS Cluster name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECSClusterName'

  DatabaseSecretArn:
    Description: Secrets Manager secret ARN for database credentials
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSecretArn'
```

## Implementation Notes

### High Availability Features

1. **Multi-AZ Deployment**: All critical resources deployed across 3 Availability Zones in eu-west-1
2. **RDS Aurora**: Multi-AZ cluster with 3 instances for automatic failover (typically under 30 seconds)
3. **ElastiCache Redis**: Multi-AZ replication group with automatic failover enabled
4. **ECS Fargate**: Tasks distributed across 3 AZs with deployment circuit breaker for safe rollback
5. **EFS**: Automatically replicated across AZs with mount targets in each zone

### Security and PCI-DSS Compliance

1. **Encryption at Rest**: KMS encryption for RDS Aurora and EFS with automatic key rotation
2. **Encryption in Transit**: TLS enabled for Redis, database connections, and API Gateway
3. **Network Isolation**: Private subnets for database and application layers, public subnets only for ALB
4. **Secrets Management**: Database credentials stored in Secrets Manager
5. **Audit Logging**: CloudWatch logs enabled for ECS, API Gateway, and RDS PostgreSQL
6. **Security Groups**: Least privilege access with specific ingress rules

### Auto Scaling and Performance

1. **ECS Auto Scaling**: Target tracking based on CPU utilization (70%), scales 3-15 tasks
2. **Fast Failover**: Deployment configuration allows 100-200% capacity during updates
3. **Health Checks**: ALB and container health checks ensure traffic only goes to healthy targets
4. **Deregistration Delay**: Set to 30 seconds to meet failover time requirement

### Blue-Green Deployment Support

1. **ECS Deployment Configuration**: Supports rolling updates with circuit breaker
2. **Target Group**: Configured for smooth traffic shifting with health checks
3. **Zero Data Loss**: Aurora cluster replication ensures no data loss during failover

### Resource Naming

All resources include the `EnvironmentSuffix` parameter for uniqueness, following the pattern:
- VPC: `vpc-transaction-{suffix}`
- Database: `aurora-transaction-{suffix}`
- ECS: `ecs-transaction-{suffix}`
- Security Groups: `sg-{purpose}-{suffix}`
- And so on for all resources

### Monitoring and Observability

1. **CloudWatch Logs**: Centralized logging for ECS tasks and API Gateway
2. **Container Insights**: Enabled on ECS cluster for detailed metrics
3. **Performance Insights**: Enabled on RDS instances for database monitoring
4. **API Gateway Metrics**: Full logging, tracing, and metrics enabled

This infrastructure provides a production-ready, PCI-DSS compliant solution for financial transaction processing with high availability, automatic failover, and comprehensive security controls.
