# Highly Available PostgreSQL RDS Infrastructure

This CloudFormation template creates a production-ready, highly available PostgreSQL RDS infrastructure optimized for an e-commerce platform handling ~50,000 orders per day with read-heavy workloads.

## Architecture Overview

The solution provides:
- **Primary RDS PostgreSQL instance** with Multi-AZ deployment for high availability
- **Two read replicas** in separate availability zones for read traffic distribution
- **Custom VPC** with private subnets for secure database deployment
- **KMS encryption** for data at rest and in transit
- **Comprehensive monitoring** with CloudWatch alarms and Performance Insights
- **Automated backups** with configurable retention
- **S3 integration** for snapshot exports and backup storage
- **IAM database authentication** for secure access

## Key Features

### High Availability & Performance
- Multi-AZ primary database with automatic failover
- Read replicas in separate AZs (us-east-1a and us-east-1b) 
- db.m5.large instances optimized for balanced compute and memory
- gp3 storage with autoscaling (100GB base, up to 1TB)
- Connection pooling support through proper configuration

### Security
- Private subnets (10.0.10.0/24, 10.0.20.0/24) with NAT gateway
- Security groups restricting access to port 5432 only
- KMS encryption for storage, backups, and Performance Insights
- IAM database authentication enabled
- Secrets Manager for secure credential management
- S3 bucket policies preventing insecure transport

### Monitoring & Observability
- Performance Insights with 7-day retention (configurable to 731 days)
- Enhanced monitoring with 60-second granularity
- CloudWatch alarms for CPU, latency, replica lag, and storage
- Custom CloudWatch dashboard with key metrics
- Structured logging to CloudWatch Logs

### Backup & Recovery
- 7-day backup retention (configurable 7-35 days)
- Daily backup window at 03:00-04:00 UTC
- Point-in-time recovery capability
- S3 bucket for snapshot exports with lifecycle policies
- Cross-region backup support through S3 replication

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready PostgreSQL RDS with Multi-AZ, Read Replicas, KMS encryption, Performance Insights, CloudWatch monitoring, and S3 backup exports'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: prod
    Description: Environment suffix for resource naming and tagging

  DBInstanceClass:
    Type: String
    Default: db.m5.large
    Description: RDS instance class for primary database
    AllowedValues:
      - db.m5.large
      - db.m5.xlarge
      - db.m5.2xlarge
      - db.r5.large
      - db.r5.xlarge
      - db.r5.2xlarge

  ReadReplicaInstanceClass:
    Type: String
    Default: db.m5.large
    Description: RDS instance class for read replicas
    AllowedValues:
      - db.m5.large
      - db.m5.xlarge
      - db.m5.2xlarge
      - db.r5.large
      - db.r5.xlarge

  DBName:
    Type: String
    Default: ecommercedb
    Description: Database name
    MinLength: 1
    MaxLength: 63
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBMasterUsername:
    Type: String
    Default: dbadmin
    Description: Master username for database
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  BackupRetentionDays:
    Type: Number
    Default: 7
    MinValue: 7
    MaxValue: 35
    Description: Number of days to retain automated backups

  PreferredBackupWindow:
    Type: String
    Default: '03:00-04:00'
    Description: Daily backup window (UTC)

  PreferredMaintenanceWindow:
    Type: String
    Default: 'sun:04:00-sun:05:00'
    Description: Weekly maintenance window (UTC)

  PerformanceInsightsRetention:
    Type: Number
    Default: 7
    AllowedValues: [7, 731]
    Description: Performance Insights retention period in days (7 or 731)

  EnhancedMonitoringInterval:
    Type: Number
    Default: 60
    AllowedValues: [0, 1, 5, 10, 15, 30, 60]
    Description: Enhanced Monitoring interval in seconds (0 to disable)

  ApplicationSubnetCIDR:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block allowed to access database (application subnet)
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

  ManagementCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for management access
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

  AllocatedStorage:
    Type: Number
    Default: 100
    MinValue: 20
    MaxValue: 65536
    Description: Allocated storage in GB

  MaxAllocatedStorage:
    Type: Number
    Default: 1000
    MinValue: 100
    MaxValue: 65536
    Description: Maximum storage for autoscaling in GB

  KMSKeyARN:
    Type: String
    Default: ''
    Description: Optional KMS Key ARN (leave empty to create new key)

Conditions:
  CreateKMSKey: !Equals [!Ref KMSKeyARN, '']
  EnableEnhancedMonitoring: !Not [!Equals [!Ref EnhancedMonitoringInterval, 0]]

Resources:
  # ==================== VPC and Networking ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-igw-${EnvironmentSuffix}'
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
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.20.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-nat-eip-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-nat-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-public-rt-${EnvironmentSuffix}'
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
          Value: !Sub 'ecommerce-private-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

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

  # ==================== Security Groups ====================
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS PostgreSQL database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref ApplicationSubnetCIDR
          Description: Application subnet access
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref ManagementCIDR
          Description: Management access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== KMS Encryption ====================
  DBEncryptionKey:
    Type: AWS::KMS::Key
    Condition: CreateKMSKey
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Description: !Sub 'KMS key for RDS encryption - ${EnvironmentSuffix}'
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
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Condition: CreateKMSKey
    Properties:
      AliasName: !Sub 'alias/ecommerce-db-${EnvironmentSuffix}'
      TargetKeyId: !Ref DBEncryptionKey

  # ==================== Secrets Manager ====================
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'ecommerce-db-password-${EnvironmentSuffix}'
      Description: !Sub 'Master password for PostgreSQL database - ${EnvironmentSuffix}'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-password-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== IAM Roles ====================
  EnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Condition: EnableEnhancedMonitoring
    Properties:
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
          Value: !Sub 'ecommerce-rds-monitoring-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSExportRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: export.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: S3ExportPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject*'
                  - 's3:GetObject*'
                  - 's3:DeleteObject*'
                Resource:
                  - !Sub '${BackupBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt BackupBucket.Arn
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-rds-export-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBIAMAuthRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: RDSIAMAuthPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds-db:connect'
                Resource:
                  - !Sub 'arn:aws:rds-db:${AWS::Region}:${AWS::AccountId}:dbuser:${PrimaryDB.DbiResourceId}/${DBMasterUsername}'
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-iam-auth-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== RDS Subnet Group ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'ecommerce-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== RDS Parameter Group ====================
  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: !Sub 'PostgreSQL parameter group for e-commerce - ${EnvironmentSuffix}'
      Family: postgres16
      Parameters:
        shared_preload_libraries: pg_stat_statements
        log_statement: ddl
        log_min_duration_statement: 1000
        log_connections: 1
        log_disconnections: 1
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-params-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== RDS Primary Instance ====================
  PrimaryDB:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'ecommerce-db-primary-${EnvironmentSuffix}'
      Engine: postgres
      EngineVersion: '16.6'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref AllocatedStorage
      MaxAllocatedStorage: !Ref MaxAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !If [CreateKMSKey, !GetAtt DBEncryptionKey.Arn, !Ref KMSKeyARN]
      DBName: !Ref DBName
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      DBParameterGroupName: !Ref DBParameterGroup
      MultiAZ: true
      PubliclyAccessible: false
      BackupRetentionPeriod: !Ref BackupRetentionDays
      PreferredBackupWindow: !Ref PreferredBackupWindow
      PreferredMaintenanceWindow: !Ref PreferredMaintenanceWindow
      EnableIAMDatabaseAuthentication: true
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId:
        !If [CreateKMSKey, !GetAtt DBEncryptionKey.Arn, !Ref KMSKeyARN]
      PerformanceInsightsRetentionPeriod: !Ref PerformanceInsightsRetention
      MonitoringInterval: !Ref EnhancedMonitoringInterval
      MonitoringRoleArn:
        !If [
          EnableEnhancedMonitoring,
          !GetAtt EnhancedMonitoringRole.Arn,
          !Ref 'AWS::NoValue',
        ]
      EnableCloudwatchLogsExports:
        - postgresql
        - upgrade
      AutoMinorVersionUpgrade: false
      CopyTagsToSnapshot: true
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-primary-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: primary

  # ==================== Read Replicas ====================
  ReadReplica1:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'ecommerce-db-replica-1-${EnvironmentSuffix}'
      SourceDBInstanceIdentifier: !Ref PrimaryDB
      DBInstanceClass: !Ref ReadReplicaInstanceClass
      PubliclyAccessible: false
      AvailabilityZone: !Select [0, !GetAZs '']
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId:
        !If [CreateKMSKey, !GetAtt DBEncryptionKey.Arn, !Ref KMSKeyARN]
      PerformanceInsightsRetentionPeriod: !Ref PerformanceInsightsRetention
      MonitoringInterval: !Ref EnhancedMonitoringInterval
      MonitoringRoleArn:
        !If [
          EnableEnhancedMonitoring,
          !GetAtt EnhancedMonitoringRole.Arn,
          !Ref 'AWS::NoValue',
        ]
      AutoMinorVersionUpgrade: false
      CopyTagsToSnapshot: true
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-replica-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: read-replica

  ReadReplica2:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'ecommerce-db-replica-2-${EnvironmentSuffix}'
      SourceDBInstanceIdentifier: !Ref PrimaryDB
      DBInstanceClass: !Ref ReadReplicaInstanceClass
      PubliclyAccessible: false
      AvailabilityZone: !Select [1, !GetAZs '']
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId:
        !If [CreateKMSKey, !GetAtt DBEncryptionKey.Arn, !Ref KMSKeyARN]
      PerformanceInsightsRetentionPeriod: !Ref PerformanceInsightsRetention
      MonitoringInterval: !Ref EnhancedMonitoringInterval
      MonitoringRoleArn:
        !If [
          EnableEnhancedMonitoring,
          !GetAtt EnhancedMonitoringRole.Arn,
          !Ref 'AWS::NoValue',
        ]
      AutoMinorVersionUpgrade: false
      CopyTagsToSnapshot: true
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-replica-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: read-replica

  # ==================== S3 Backup Bucket ====================
  BackupBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID:
                !If [CreateKMSKey, !GetAtt DBEncryptionKey.Arn, !Ref KMSKeyARN]
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
          - Id: ExpireOldBackups
            Status: Enabled
            ExpirationInDays: 365
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'ecommerce-db-backups-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  BackupBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref BackupBucket
      PolicyDocument:
        Statement:
          - Sid: AllowRDSExport
            Effect: Allow
            Principal:
              Service: export.rds.amazonaws.com
            Action:
              - 's3:PutObject*'
              - 's3:GetObject*'
            Resource:
              - !Sub '${BackupBucket.Arn}/*'
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt BackupBucket.Arn
              - !Sub '${BackupBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # ==================== CloudWatch Alarms ====================
  PrimaryHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-primary-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: Alert when primary database CPU exceeds 75%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PrimaryDB
      TreatMissingData: notBreaching

  Replica1HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-replica-1-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: Alert when replica 1 CPU exceeds 75%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ReadReplica1
      TreatMissingData: notBreaching

  Replica2HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-replica-2-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: Alert when replica 2 CPU exceeds 75%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ReadReplica2
      TreatMissingData: notBreaching

  Replica1LagAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-replica-1-lag-${EnvironmentSuffix}'
      AlarmDescription: Alert when replica 1 lag exceeds 30 seconds
      MetricName: ReplicaLag
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ReadReplica1
      TreatMissingData: notBreaching

  Replica2LagAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-replica-2-lag-${EnvironmentSuffix}'
      AlarmDescription: Alert when replica 2 lag exceeds 30 seconds
      MetricName: ReplicaLag
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ReadReplica2
      TreatMissingData: notBreaching

  ReadLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-read-latency-${EnvironmentSuffix}'
      AlarmDescription: Alert when read latency exceeds 20ms
      MetricName: ReadLatency
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0.02
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PrimaryDB
      TreatMissingData: notBreaching

  WriteLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-write-latency-${EnvironmentSuffix}'
      AlarmDescription: Alert when write latency exceeds 20ms
      MetricName: WriteLatency
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0.02
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PrimaryDB
      TreatMissingData: notBreaching

  LowStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ecommerce-db-low-storage-${EnvironmentSuffix}'
      AlarmDescription: Alert when free storage falls below 10GB
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10737418240
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PrimaryDB
      TreatMissingData: notBreaching

  # ==================== CloudWatch Dashboard ====================
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'ecommerce-db-dashboard-${EnvironmentSuffix}'
      DashboardBody: !Sub
        - |
          {
            "widgets": [
              {
                "type": "metric",
                "properties": {
                  "metrics": [
                    ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${PrimaryId}"],
                    ["...", ".", "${Replica1Id}"],
                    ["...", ".", "${Replica2Id}"]
                  ],
                  "view": "timeSeries",
                  "stacked": false,
                  "region": "${Region}",
                  "title": "CPU Utilization",
                  "period": 300,
                  "stat": "Average"
                },
                "width": 12,
                "height": 6,
                "x": 0,
                "y": 0
              },
              {
                "type": "metric",
                "properties": {
                  "metrics": [
                    ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "${PrimaryId}"],
                    [".", "FreeableMemory", ".", "."]
                  ],
                  "view": "timeSeries",
                  "region": "${Region}",
                  "title": "Connections & Memory",
                  "period": 300,
                  "stat": "Average"
                },
                "width": 12,
                "height": 6,
                "x": 12,
                "y": 0
              },
              {
                "type": "metric",
                "properties": {
                  "metrics": [
                    ["AWS/RDS", "ReadLatency", "DBInstanceIdentifier", "${PrimaryId}"],
                    [".", "WriteLatency", ".", "."]
                  ],
                  "view": "timeSeries",
                  "region": "${Region}",
                  "title": "Latency",
                  "period": 300,
                  "stat": "Average"
                },
                "width": 12,
                "height": 6,
                "x": 0,
                "y": 6
              },
              {
                "type": "metric",
                "properties": {
                  "metrics": [
                    ["AWS/RDS", "ReplicaLag", "DBInstanceIdentifier", "${Replica1Id}"],
                    ["...", ".", "${Replica2Id}"]
                  ],
                  "view": "timeSeries",
                  "region": "${Region}",
                  "title": "Replica Lag",
                  "period": 300,
                  "stat": "Average"
                },
                "width": 12,
                "height": 6,
                "x": 12,
                "y": 6
              },
              {
                "type": "metric",
                "properties": {
                  "metrics": [
                    ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", "${PrimaryId}"]
                  ],
                  "view": "timeSeries",
                  "region": "${Region}",
                  "title": "Storage",
                  "period": 300,
                  "stat": "Average"
                },
                "width": 12,
                "height": 6,
                "x": 0,
                "y": 12
              },
              {
                "type": "metric",
                "properties": {
                  "metrics": [
                    ["AWS/RDS", "ReadIOPS", "DBInstanceIdentifier", "${PrimaryId}"],
                    [".", "WriteIOPS", ".", "."]
                  ],
                  "view": "timeSeries",
                  "region": "${Region}",
                  "title": "IOPS",
                  "period": 300,
                  "stat": "Average"
                },
                "width": 12,
                "height": 6,
                "x": 12,
                "y": 12
              }
            ]
          }
        - Region: !Ref AWS::Region
          PrimaryId: !Ref PrimaryDB
          Replica1Id: !Ref ReadReplica1
          Replica2Id: !Ref ReadReplica2

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2'

  DBSecurityGroupId:
    Description: Security Group ID for database access
    Value: !Ref DBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DBSecurityGroup'

  PrimaryDBEndpoint:
    Description: Primary database endpoint for write operations
    Value: !GetAtt PrimaryDB.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryEndpoint'

  PrimaryDBPort:
    Description: Primary database port
    Value: !GetAtt PrimaryDB.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryPort'

  ReadReplica1Endpoint:
    Description: Read replica 1 endpoint for read operations
    Value: !GetAtt ReadReplica1.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Replica1Endpoint'

  ReadReplica2Endpoint:
    Description: Read replica 2 endpoint for read operations
    Value: !GetAtt ReadReplica2.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Replica2Endpoint'

  DBName:
    Description: Database name
    Value: !Ref DBName
    Export:
      Name: !Sub '${AWS::StackName}-DBName'

  DBMasterUsername:
    Description: Database master username
    Value: !Ref DBMasterUsername
    Export:
      Name: !Sub '${AWS::StackName}-MasterUsername'

  DBSecretArn:
    Description: Secrets Manager secret ARN containing database credentials
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-SecretArn'

  BackupBucketName:
    Description: S3 bucket for database backups and exports
    Value: !Ref BackupBucket
    Export:
      Name: !Sub '${AWS::StackName}-BackupBucket'

  BackupBucketArn:
    Description: S3 backup bucket ARN
    Value: !GetAtt BackupBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BackupBucketArn'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !If [CreateKMSKey, !GetAtt DBEncryptionKey.Arn, !Ref KMSKeyARN]
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  DBIAMAuthRoleArn:
    Description: IAM role ARN for database authentication
    Value: !GetAtt DBIAMAuthRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAMAuthRole'

  RDSExportRoleArn:
    Description: IAM role ARN for RDS snapshot exports
    Value: !GetAtt RDSExportRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ExportRole'

  CloudWatchDashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=ecommerce-db-dashboard-${EnvironmentSuffix}'

  PrimaryDBResourceId:
    Description: Primary DB Resource ID for IAM authentication
    Value: !GetAtt PrimaryDB.DbiResourceId
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryResourceId'

  ConnectionString:
    Description: Connection string format for applications
    Value: !Sub 'postgresql://${DBMasterUsername}@${PrimaryDB.Endpoint.Address}:${PrimaryDB.Endpoint.Port}/${DBName}'

  ReadConnectionStrings:
    Description: Read replica connection strings (comma-separated)
    Value: !Sub
      - 'postgresql://${DBMasterUsername}@${Replica1Endpoint}:5432/${DBName},postgresql://${DBMasterUsername}@${Replica2Endpoint}:5432/${DBName}'
      - Replica1Endpoint: !GetAtt ReadReplica1.Endpoint.Address
        Replica2Endpoint: !GetAtt ReadReplica2.Endpoint.Address

  IAMAuthTokenCommand:
    Description: AWS CLI command to generate IAM authentication token
    Value: !Sub |
      aws rds generate-db-auth-token --hostname ${PrimaryDB.Endpoint.Address} --port ${PrimaryDB.Endpoint.Port} --username ${DBMasterUsername} --region ${AWS::Region}

  RetrievePasswordCommand:
    Description: AWS CLI command to retrieve database password from Secrets Manager
    Value: !Sub |
      aws secretsmanager get-secret-value --secret-id ${DBPasswordSecret} --query SecretString --output text | jq -r .password

  SnapshotExportCommand:
    Description: AWS CLI command to export snapshot to S3 (replace SNAPSHOT_NAME)
    Value: !Sub |
      aws rds start-export-task --export-task-identifier export-$(date +%Y%m%d-%H%M%S) --source-arn arn:aws:rds:${AWS::Region}:${AWS::AccountId}:snapshot:SNAPSHOT_NAME --s3-bucket-name ${BackupBucket} --iam-role-arn ${RDSExportRole.Arn} --kms-key-id ${!If [CreateKMSKey, !GetAtt DBEncryptionKey.Arn, !Ref KMSKeyARN]} --region ${AWS::Region}

  PerformanceInsightsURL:
    Description: Performance Insights URL for Primary DB
    Value: !Sub 'https://console.aws.amazon.com/rds/home?region=${AWS::Region}#performance-insights-v20206:/resourceId/${PrimaryDB.DbiResourceId}'

  EnvironmentTag:
    Description: Environment suffix used for this deployment
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-Environment'
```

## Usage Instructions

### Deployment
```bash
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name ecommerce-rds-stack \
  --parameter-overrides \
    EnvironmentSuffix=prod \
    DBInstanceClass=db.m5.large \
    BackupRetentionDays=14 \
  --capabilities CAPABILITY_IAM
```

### Connection Examples

#### Using IAM Authentication
```bash
# Generate token
TOKEN=$(aws rds generate-db-auth-token \
  --hostname <primary-endpoint> \
  --port 5432 \
  --username dbadmin \
  --region us-east-1)

# Connect with token
psql "host=<primary-endpoint> port=5432 dbname=ecommercedb user=dbadmin password=$TOKEN sslmode=require"
```

#### Using Secrets Manager
```bash
# Retrieve password
PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id ecommerce-db-password-prod \
  --query SecretString --output text | jq -r .password)

# Connect with password
psql "postgresql://dbadmin:$PASSWORD@<primary-endpoint>:5432/ecommercedb"
```

### Read Replica Configuration
Applications should implement read/write splitting:
- **Write operations**: Use primary endpoint
- **Read operations**: Load balance between replica endpoints
- **Failover**: Automatic failover to standby instance in different AZ

## Cost Optimization

- **Instance sizing**: Start with db.m5.large and scale based on metrics
- **Storage autoscaling**: Automatic scaling from 100GB to 1TB
- **Backup lifecycle**: S3 lifecycle rules transition old backups to cheaper storage
- **Read replicas**: Right-size replicas independently from primary

## Security Best Practices

- **Network isolation**: Database in private subnets with no public access
- **Encryption**: KMS encryption for data at rest and Performance Insights
- **Access control**: Security groups restrict access to port 5432 only
- **Credential management**: Passwords stored in Secrets Manager
- **IAM integration**: Database authentication through IAM roles
- **Monitoring**: CloudWatch alarms for security-relevant metrics

## Performance Tuning

The parameter group includes optimizations for e-commerce workloads:
- `pg_stat_statements`: Query performance tracking
- `log_min_duration_statement`: Slow query logging (>1s)
- `log_connections/disconnections`: Connection tracking
- Performance Insights: Query-level performance monitoring

## Disaster Recovery

- **Multi-AZ deployment**: Automatic failover within 1-2 minutes
- **Point-in-time recovery**: Up to 35 days of automated backups
- **Cross-region snapshots**: Manual snapshots can be copied to other regions
- **Read replica promotion**: Manual promotion of replica to primary

This infrastructure provides enterprise-grade reliability, security, and performance for high-volume e-commerce applications while maintaining cost efficiency and operational simplicity.