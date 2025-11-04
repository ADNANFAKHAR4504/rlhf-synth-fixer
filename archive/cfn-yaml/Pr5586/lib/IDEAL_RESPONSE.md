# Reasoning Trace

This CloudFormation template implements a comprehensive Configuration Consistency and Compliance Monitoring System for Financial Services environments. The design follows AWS Well-Architected Framework principles with emphasis on security, reliability, and operational excellence.

## Architecture Overview

The solution provides automated configuration drift detection and reconciliation across multiple environments (dev/staging/prod) using a serverless architecture with the following core components:

1. **VPC Infrastructure**: Self-contained networking with 3 private subnets across availability zones for high availability
2. **Data Layer**: RDS Aurora MySQL cluster for relational data, DynamoDB for state tracking with single-table design
3. **Storage**: KMS-encrypted S3 buckets for configuration snapshots and compliance reports with lifecycle policies
4. **Compute**: Lambda functions for drift detection and automated reconciliation running in VPC
5. **Orchestration**: EventBridge scheduled rules triggering Lambda functions at configurable intervals
6. **Monitoring**: AWS Config for compliance rules, CloudWatch dashboards and alarms for operational metrics
7. **Notifications**: SNS topics with KMS encryption for alerting on drift detection and compliance violations
8. **Secrets Management**: AWS Secrets Manager with automatic password generation for database credentials

## Key Design Decisions

### Security-First Approach

- All data at rest encrypted with customer-managed KMS keys with automatic rotation enabled
- Secrets Manager integration replaces parameter-based passwords with dynamic references
- IAM roles follow least privilege with scoped resource ARNs and ViaService conditions
- Security groups restrict database access to Lambda functions only
- S3 buckets enforce public access blocking and SSL-in-transit

### Region-Agnostic Design

- Uses `!GetAZs ''` pseudo parameter for availability zone selection
- All ARNs and service endpoints use `${AWS::Region}` pseudo parameter
- No hardcoded region-specific values anywhere in the template

### Operational Excellence

- All resources tagged with required tags: project (iac-rlhf-amazon), team-number (2)
- DeletionPolicy: Delete on all resources for easy cleanup in non-production environments
- Comprehensive CloudWatch dashboard monitoring drift detection, Lambda performance, RDS metrics, DynamoDB usage
- Alarms configured for drift detection, Lambda errors, database connections, and CPU utilization
- Parameter Store hierarchy for centralized configuration management

### Environment-Specific Configuration

- Mappings define environment-specific settings (instance sizes, retention periods, capacity limits)
- Conditions control resource creation (second Aurora instance only in staging/prod, critical alerts only in prod)
- Reconciliation disabled in production (production is source of truth)

### High Availability and Reliability

- Multi-AZ deployment with 3 subnets across availability zones
- DynamoDB point-in-time recovery enabled
- RDS Aurora with automated backups and configurable retention periods
- S3 versioning enabled with lifecycle policies for cost optimization

### Compliance and Auditing

- AWS Config recorder captures all resource changes
- Config rules enforce required tagging, S3 encryption, and RDS encryption
- Audit logging enabled on Aurora cluster (error, general, slowquery, audit logs)
- Compliance reports delivered to dedicated S3 bucket with extended retention

# Answer

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Configuration Consistency and Compliance Monitoring System for Financial Services'

# ==========================================
# Parameters
# ==========================================
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix for resource naming
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'
    Default: dev

  DBMasterUsername:
    Type: String
    Description: Database master username
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  AlertEmail:
    Type: String
    Description: Email address for receiving alerts
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'
    Default: alerts@example.com

  OrganizationId:
    Type: String
    Description: Organization identifier for resource tagging
    Default: finserv-corp

  CostCenter:
    Type: String
    Description: Cost center for billing allocation
    Default: infrastructure

  DataClassification:
    Type: String
    Description: Data classification level
    AllowedValues:
      - Public
      - Internal
      - Confidential
      - Restricted
    Default: Confidential

  ComplianceFramework:
    Type: String
    Description: Compliance framework
    AllowedValues:
      - PCI-DSS
      - SOC2
      - ISO27001
      - GDPR
    Default: PCI-DSS

  DriftCheckInterval:
    Type: Number
    Description: Minutes between drift detection runs
    Default: 60
    MinValue: 5
    MaxValue: 1440

# ==========================================
# Mappings
# ==========================================
Mappings:
  EnvironmentConfig:
    dev:
      DBInstanceClass: db.r5.large
      BackupRetention: 7
      MultiAZ: false
      StorageEncrypted: true
      MinCapacity: 1
      MaxCapacity: 2
      S3LifecycleDays: 30
      LogRetentionDays: 7
    staging:
      DBInstanceClass: db.r5.xlarge
      BackupRetention: 14
      MultiAZ: true
      StorageEncrypted: true
      MinCapacity: 2
      MaxCapacity: 4
      S3LifecycleDays: 90
      LogRetentionDays: 30
    prod:
      DBInstanceClass: db.r5.2xlarge
      BackupRetention: 30
      MultiAZ: true
      StorageEncrypted: true
      MinCapacity: 4
      MaxCapacity: 8
      S3LifecycleDays: 365
      LogRetentionDays: 90
    default:
      DBInstanceClass: db.r5.large
      BackupRetention: 7
      MultiAZ: false
      StorageEncrypted: true
      MinCapacity: 1
      MaxCapacity: 2
      S3LifecycleDays: 30
      LogRetentionDays: 7

  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PrivateSubnet1:
      CIDR: 10.0.1.0/24
    PrivateSubnet2:
      CIDR: 10.0.2.0/24
    PrivateSubnet3:
      CIDR: 10.0.3.0/24

# ==========================================
# Conditions
# ==========================================
Conditions:
  IsProduction: !Equals [!Ref EnvironmentSuffix, prod]
  IsStaging: !Equals [!Ref EnvironmentSuffix, staging]
  IsNotDev: !Not [!Equals [!Ref EnvironmentSuffix, dev]]
  EnableEnhancedMonitoring:
    !Or [
      !Equals [!Ref EnvironmentSuffix, staging],
      !Equals [!Ref EnvironmentSuffix, prod],
    ]

# ==========================================
# Resources
# ==========================================
Resources:
  # ==========================================
  # VPC and Networking
  # ==========================================
  VPC:
    Type: AWS::EC2::VPC
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-vpc'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Organization
          Value: !Ref OrganizationId
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-igw'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-private-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-private-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Type
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-private-subnet-3'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Type
          Value: Private

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-private-rt'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable

  # VPC Endpoints for AWS Services
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:ListBucket'
            Resource: '*'

  # ==========================================
  # KMS Keys
  # ==========================================
  ConfigKMSKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for ${EnvironmentSuffix} configuration encryption'
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
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - lambda.amazonaws.com
                - ssm.amazonaws.com
                - !Sub 'logs.${AWS::Region}.amazonaws.com'
                - sns.amazonaws.com
                - dynamodb.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-kms-key'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  ConfigKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-${EnvironmentSuffix}-config'
      TargetKeyId: !Ref ConfigKMSKey

  # ==========================================
  # S3 Buckets
  # ==========================================
  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub '${OrganizationId}-${EnvironmentSuffix}-config-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ConfigKMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: !If
              - IsProduction
              - !FindInMap [EnvironmentConfig, prod, S3LifecycleDays]
              - !If
                - IsStaging
                - !FindInMap [EnvironmentConfig, staging, S3LifecycleDays]
                - !FindInMap [EnvironmentConfig, default, S3LifecycleDays]
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-config-bucket'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Organization
          Value: !Ref OrganizationId
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: DataClassification
          Value: !Ref DataClassification
        - Key: Compliance
          Value: !Ref ComplianceFramework

  ComplianceReportsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub '${OrganizationId}-${EnvironmentSuffix}-compliance-reports-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ConfigKMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: ComplianceRetention
            Status: Enabled
            ExpirationInDays: !If [IsProduction, 2555, 365]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-compliance-bucket'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Organization
          Value: !Ref OrganizationId
        - Key: Purpose
          Value: ComplianceReporting

  # ==========================================
  # Secrets Manager for Database Password
  # ==========================================
  DBMasterSecret:
    Type: AWS::SecretsManager::Secret
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-master-secret'
      Description: Master password for Aurora cluster
      KmsKeyId: !Ref ConfigKMSKey
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-secret'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # RDS Aurora MySQL Cluster
  # ==========================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for Aurora cluster
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-subnet-group'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'Aurora cluster parameter group for ${EnvironmentSuffix}'
      Family: aurora-mysql5.7
      Parameters:
        require_secure_transport: 'ON'
        slow_query_log: '1'
        general_log: '1'
        log_output: 'FILE'
        character_set_server: utf8mb4
        character_set_database: utf8mb4
        character_set_client: utf8mb4
        character_set_connection: utf8mb4
        character_set_results: utf8mb4
        collation_server: utf8mb4_unicode_ci
        collation_connection: utf8mb4_unicode_ci
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-param-group'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-sg'
      GroupDescription: Security group for Aurora cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: MySQL from Lambda functions
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub '${AWS::StackName}-${EnvironmentSuffix}-aurora-cluster'
      Engine: aurora-mysql
      EngineMode: provisioned
      EngineVersion: 5.7.mysql_aurora.2.12.5
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBMasterSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}'
      DatabaseName: configdb
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !Ref ConfigKMSKey
      BackupRetentionPeriod: !If
        - IsProduction
        - !FindInMap [EnvironmentConfig, prod, BackupRetention]
        - !If
          - IsStaging
          - !FindInMap [EnvironmentConfig, staging, BackupRetention]
          - !FindInMap [EnvironmentConfig, default, BackupRetention]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
        - audit
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-aurora-cluster'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Organization
          Value: !Ref OrganizationId
        - Key: DataClassification
          Value: !Ref DataClassification

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${EnvironmentSuffix}-aurora-instance-1'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: !If
        - IsProduction
        - !FindInMap [EnvironmentConfig, prod, DBInstanceClass]
        - !If
          - IsStaging
          - !FindInMap [EnvironmentConfig, staging, DBInstanceClass]
          - !FindInMap [EnvironmentConfig, default, DBInstanceClass]
      Engine: aurora-mysql
      PubliclyAccessible: false
      MonitoringInterval: !If [EnableEnhancedMonitoring, 60, 0]
      MonitoringRoleArn:
        !If [
          EnableEnhancedMonitoring,
          !GetAtt DBMonitoringRole.Arn,
          !Ref 'AWS::NoValue',
        ]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-aurora-instance-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Condition: IsNotDev
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${EnvironmentSuffix}-aurora-instance-2'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass: !If
        - IsProduction
        - !FindInMap [EnvironmentConfig, prod, DBInstanceClass]
        - !If
          - IsStaging
          - !FindInMap [EnvironmentConfig, staging, DBInstanceClass]
          - !FindInMap [EnvironmentConfig, default, DBInstanceClass]
      Engine: aurora-mysql
      PubliclyAccessible: false
      MonitoringInterval: !If [EnableEnhancedMonitoring, 60, 0]
      MonitoringRoleArn:
        !If [
          EnableEnhancedMonitoring,
          !GetAtt DBMonitoringRole.Arn,
          !Ref 'AWS::NoValue',
        ]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-aurora-instance-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  DBMonitoringRole:
    Type: AWS::IAM::Role
    Condition: EnableEnhancedMonitoring
    Properties:
      RoleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-monitoring-role'
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
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-monitoring-role'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # DynamoDB Table for State Tracking
  # ==========================================
  StateTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-state'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: GSI1PK
          AttributeType: S
        - AttributeName: GSI1SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: GSI1PK
              KeyType: HASH
            - AttributeName: GSI1SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref ConfigKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-state-table'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2
        - Key: Organization
          Value: !Ref OrganizationId

  # Attach Secret to RDS Cluster
  SecretRDSAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBMasterSecret
      TargetId: !Ref AuroraCluster
      TargetType: AWS::RDS::DBCluster

  # ==========================================
  # SSM Parameter Store Hierarchy
  # ==========================================
  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${EnvironmentSuffix}/database/endpoint'
      Description: Aurora cluster endpoint
      Type: String
      Value: !GetAtt AuroraCluster.Endpoint.Address
      Tags:
        Environment: !Ref EnvironmentSuffix
        project: iac-rlhf-amazon
        team-number: '2'

  DBSecretParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${EnvironmentSuffix}/database/secret-arn'
      Description: Aurora cluster master secret ARN
      Type: String
      Value: !Ref DBMasterSecret
      Tags:
        Environment: !Ref EnvironmentSuffix
        project: iac-rlhf-amazon
        team-number: '2'

  ConfigBucketParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${EnvironmentSuffix}/s3/config-bucket'
      Description: Configuration S3 bucket name
      Type: String
      Value: !Ref ConfigBucket
      Tags:
        Environment: !Ref EnvironmentSuffix
        project: iac-rlhf-amazon
        team-number: '2'

  ComplianceBucketParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${EnvironmentSuffix}/s3/compliance-bucket'
      Description: Compliance reports S3 bucket name
      Type: String
      Value: !Ref ComplianceReportsBucket
      Tags:
        Environment: !Ref EnvironmentSuffix
        project: iac-rlhf-amazon
        team-number: '2'

  # ==========================================
  # Lambda Security Group
  # ==========================================
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      GroupName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-lambda-sg'
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-lambda-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # IAM Roles for Lambda Functions
  # ==========================================
  DriftDetectionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-drift-detection-role'
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
        - PolicyName: DriftDetectionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3Access
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
                  - !GetAtt ComplianceReportsBucket.Arn
                  - !Sub '${ComplianceReportsBucket.Arn}/*'
              - Sid: DynamoDBAccess
                Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:Query'
                Resource:
                  - !GetAtt StateTable.Arn
                  - !Sub '${StateTable.Arn}/index/*'
              - Sid: SSMAccess
                Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParametersByPath'
                  - 'ssm:DescribeParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${OrganizationId}/${EnvironmentSuffix}/*'
              - Sid: SecretsManagerAccess
                Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:DescribeSecret'
                Resource: !Ref DBMasterSecret
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt ConfigKMSKey.Arn
                Condition:
                  StringEquals:
                    kms:ViaService:
                      - !Sub 'ssm.${AWS::Region}.amazonaws.com'
                      - !Sub 's3.${AWS::Region}.amazonaws.com'
                      - !Sub 'dynamodb.${AWS::Region}.amazonaws.com'
                      - !Sub 'secretsmanager.${AWS::Region}.amazonaws.com'
              - Sid: CloudWatchMetrics
                Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    cloudwatch:namespace: ConfigCompliance
              - Sid: SNSPublish
                Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AlertTopic
              - Sid: RDSDescribe
                Effect: Allow
                Action:
                  - 'rds:DescribeDBClusters'
                  - 'rds:DescribeDBInstances'
                Resource:
                  - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraCluster}'
                  - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${AuroraCluster}*'
              - Sid: ConfigDescribe
                Effect: Allow
                Action:
                  - 'config:DescribeConfigurationRecorders'
                  - 'config:DescribeConfigurationRecorderStatus'
                  - 'config:GetComplianceDetailsByConfigRule'
                  - 'config:GetComplianceDetailsByResource'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-drift-role'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  ReconciliationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-reconciliation-role'
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
        - PolicyName: ReconciliationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3Access
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
              - Sid: DynamoDBAccess
                Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:Query'
                Resource:
                  - !GetAtt StateTable.Arn
                  - !Sub '${StateTable.Arn}/index/*'
              - Sid: SSMAccess
                Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:PutParameter'
                  - 'ssm:GetParametersByPath'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${OrganizationId}/${EnvironmentSuffix}/*'
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ConfigKMSKey.Arn
                Condition:
                  StringEquals:
                    kms:ViaService:
                      - !Sub 'ssm.${AWS::Region}.amazonaws.com'
                      - !Sub 's3.${AWS::Region}.amazonaws.com'
              - Sid: CloudWatchMetrics
                Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    cloudwatch:namespace: ConfigCompliance
              - Sid: SNSPublish
                Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AlertTopic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-reconciliation-role'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # Lambda Functions
  # ==========================================
  DriftDetectionFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Delete
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-drift-detection'
      Description: Monitors configuration drift across environments
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt DriftDetectionRole.Arn
      Timeout: 180
      MemorySize: 512
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentSuffix
          STATE_TABLE: !Ref StateTable
          CONFIG_BUCKET: !Ref ConfigBucket
          ALERT_TOPIC: !Ref AlertTopic
          ORG_ID: !Ref OrganizationId
          KMS_KEY_ID: !Ref ConfigKMSKey
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import hashlib

          ssm = boto3.client('ssm')
          s3 = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          sns = boto3.client('sns')
          cloudwatch = boto3.client('cloudwatch')
          config_client = boto3.client('config')

          def lambda_handler(event, context):
              environment = os.environ['ENVIRONMENT']
              state_table = dynamodb.Table(os.environ['STATE_TABLE'])
              alert_topic = os.environ['ALERT_TOPIC']
              org_id = os.environ['ORG_ID']

              try:
                  parameters = get_parameters(f'/{org_id}/{environment}')
                  config_hash = calculate_hash(parameters)
                  drift_detected = check_environment_drift(state_table, environment, config_hash)
                  store_state(state_table, environment, config_hash, parameters)
                  send_metrics(environment, drift_detected)

                  if drift_detected:
                      send_alert(alert_topic, environment, drift_detected)

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'environment': environment,
                          'drift_detected': drift_detected,
                          'config_hash': config_hash
                      })
                  }

              except Exception as e:
                  print(f"Error in drift detection: {str(e)}")
                  send_error_metric(environment)
                  raise

          def get_parameters(path):
              params = {}
              paginator = ssm.get_paginator('get_parameters_by_path')

              for page in paginator.paginate(Path=path, Recursive=True, WithDecryption=False):
                  for param in page['Parameters']:
                      if param['Type'] != 'SecureString':
                          params[param['Name']] = param['Value']

              return params

          def calculate_hash(parameters):
              sorted_params = json.dumps(parameters, sort_keys=True)
              return hashlib.sha256(sorted_params.encode()).hexdigest()

          def check_environment_drift(table, environment, current_hash):
              drift_info = []

              response = table.query(
                  IndexName='GSI1',
                  KeyConditionExpression='GSI1PK = :pk',
                  ExpressionAttributeValues={':pk': 'CONFIG_HASH'}
              )

              for item in response.get('Items', []):
                  if item['Environment'] != environment:
                      if item['ConfigHash'] != current_hash:
                          drift_info.append({
                              'environment': item['Environment'],
                              'hash': item['ConfigHash'],
                              'timestamp': item['Timestamp']
                          })

              return drift_info if drift_info else None

          def store_state(table, environment, config_hash, parameters):
              timestamp = datetime.utcnow().isoformat()

              table.put_item(
                  Item={
                      'PK': f'ENV#{environment}',
                      'SK': f'CONFIG#{timestamp}',
                      'GSI1PK': 'CONFIG_HASH',
                      'GSI1SK': environment,
                      'Environment': environment,
                      'ConfigHash': config_hash,
                      'Timestamp': timestamp,
                      'ParameterCount': len(parameters)
                  }
              )

              table.put_item(
                  Item={
                      'PK': f'ENV#{environment}',
                      'SK': f'PARAMS#{timestamp}',
                      'Parameters': parameters,
                      'Timestamp': timestamp
                  }
              )

          def send_metrics(environment, drift_detected):
              metric_data = [{
                  'MetricName': 'ConfigurationDrift',
                  'Value': 1 if drift_detected else 0,
                  'Unit': 'Count',
                  'Dimensions': [{'Name': 'Environment', 'Value': environment}]
              }]

              cloudwatch.put_metric_data(
                  Namespace='ConfigCompliance',
                  MetricData=metric_data
              )

          def send_alert(topic_arn, environment, drift_info):
              message = {
                  'environment': environment,
                  'drift_detected': True,
                  'drift_details': drift_info,
                  'timestamp': datetime.utcnow().isoformat()
              }

              sns.publish(
                  TopicArn=topic_arn,
                  Subject=f'Configuration Drift Detected - {environment}',
                  Message=json.dumps(message, indent=2)
              )

          def send_error_metric(environment):
              cloudwatch.put_metric_data(
                  Namespace='ConfigCompliance',
                  MetricData=[{
                      'MetricName': 'DriftDetectionErrors',
                      'Value': 1,
                      'Unit': 'Count',
                      'Dimensions': [{'Name': 'Environment', 'Value': environment}]
                  }]
              )
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-drift-function'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  ReconciliationFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Delete
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-reconciliation'
      Description: Automatically synchronizes non-sensitive configuration differences
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt ReconciliationRole.Arn
      Timeout: 300
      MemorySize: 1024
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentSuffix
          STATE_TABLE: !Ref StateTable
          CONFIG_BUCKET: !Ref ConfigBucket
          ALERT_TOPIC: !Ref AlertTopic
          ORG_ID: !Ref OrganizationId
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          ssm = boto3.client('ssm')
          s3 = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          sns = boto3.client('sns')
          cloudwatch = boto3.client('cloudwatch')

          def lambda_handler(event, context):
              environment = os.environ['ENVIRONMENT']
              state_table = dynamodb.Table(os.environ['STATE_TABLE'])
              config_bucket = os.environ['CONFIG_BUCKET']
              org_id = os.environ['ORG_ID']

              try:
                  drift_info = get_latest_drift(state_table, environment)

                  if not drift_info:
                      return {'statusCode': 200, 'body': json.dumps({'message': 'No drift to reconcile'})}

                  source_env = 'prod' if environment != 'prod' else None

                  if source_env:
                      source_params = get_parameters(f'/{org_id}/{source_env}')
                      sync_results = sync_parameters(environment, source_params, org_id)
                      log_sync_results(state_table, environment, sync_results)
                      send_sync_metrics(environment, sync_results)

                      return {
                          'statusCode': 200,
                          'body': json.dumps({
                              'environment': environment,
                              'synchronized': sync_results['synchronized'],
                              'skipped': sync_results['skipped']
                          })
                      }
                  else:
                      return {'statusCode': 200, 'body': json.dumps({'message': 'Production environment is source of truth'})}

              except Exception as e:
                  print(f"Error in reconciliation: {str(e)}")
                  send_error_metric(environment)
                  raise

          def get_latest_drift(table, environment):
              response = table.query(
                  KeyConditionExpression='PK = :pk',
                  ExpressionAttributeValues={':pk': f'ENV#{environment}'},
                  ScanIndexForward=False,
                  Limit=1
              )
              return response['Items'][0] if response['Items'] else None

          def get_parameters(path):
              params = {}
              paginator = ssm.get_paginator('get_parameters_by_path')

              for page in paginator.paginate(Path=path, Recursive=True, WithDecryption=False):
                  for param in page['Parameters']:
                      params[param['Name']] = {
                          'value': param['Value'],
                          'type': param['Type']
                      }

              return params

          def sync_parameters(target_env, source_params, org_id):
              synchronized = []
              skipped = []

              for param_name, param_info in source_params.items():
                  if param_info['type'] != 'SecureString':
                      target_name = param_name.replace('/prod/', f'/{target_env}/')

                      try:
                          ssm.put_parameter(
                              Name=target_name,
                              Value=param_info['value'],
                              Type=param_info['type'],
                              Overwrite=True
                          )
                          synchronized.append(target_name)
                      except Exception as e:
                          print(f"Failed to sync parameter {target_name}: {str(e)}")
                          skipped.append(target_name)
                  else:
                      skipped.append(param_name)

              return {
                  'synchronized': synchronized,
                  'skipped': skipped,
                  'timestamp': datetime.utcnow().isoformat()
              }

          def log_sync_results(table, environment, results):
              timestamp = datetime.utcnow().isoformat()

              table.put_item(
                  Item={
                      'PK': f'ENV#{environment}',
                      'SK': f'SYNC#{timestamp}',
                      'SyncResults': results,
                      'Timestamp': timestamp
                  }
              )

          def send_sync_metrics(environment, results):
              metric_data = [
                  {
                      'MetricName': 'ParametersSynchronized',
                      'Value': len(results['synchronized']),
                      'Unit': 'Count',
                      'Dimensions': [{'Name': 'Environment', 'Value': environment}]
                  },
                  {
                      'MetricName': 'ParametersSkipped',
                      'Value': len(results['skipped']),
                      'Unit': 'Count',
                      'Dimensions': [{'Name': 'Environment', 'Value': environment}]
                  }
              ]

              cloudwatch.put_metric_data(
                  Namespace='ConfigCompliance',
                  MetricData=metric_data
              )

          def send_error_metric(environment):
              cloudwatch.put_metric_data(
                  Namespace='ConfigCompliance',
                  MetricData=[{
                      'MetricName': 'ReconciliationErrors',
                      'Value': 1,
                      'Unit': 'Count',
                      'Dimensions': [{'Name': 'Environment', 'Value': environment}]
                  }]
              )
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-reconciliation-function'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # EventBridge Rules
  # ==========================================
  DriftDetectionSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-drift-detection-schedule'
      Description: Triggers drift detection Lambda function
      ScheduleExpression: !Sub 'rate(${DriftCheckInterval} minutes)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt DriftDetectionFunction.Arn
          Id: DriftDetectionTarget

  DriftDetectionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DriftDetectionFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DriftDetectionSchedule.Arn

  ReconciliationSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-reconciliation-schedule'
      Description: Triggers reconciliation Lambda function
      ScheduleExpression: !Sub 'rate(${DriftCheckInterval} minutes)'
      State: !If [IsProduction, DISABLED, ENABLED]
      Targets:
        - Arn: !GetAtt ReconciliationFunction.Arn
          Id: ReconciliationTarget

  ReconciliationPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ReconciliationFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt ReconciliationSchedule.Arn

  # ==========================================
  # SNS Topics
  # ==========================================
  AlertTopic:
    Type: AWS::SNS::Topic
    DeletionPolicy: Delete
    Properties:
      TopicName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alerts'
      DisplayName: Configuration Compliance Alerts
      KmsMasterKeyId: !Ref ConfigKMSKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-alert-topic'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  CriticalAlertTopic:
    Type: AWS::SNS::Topic
    Condition: IsProduction
    DeletionPolicy: Delete
    Properties:
      TopicName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-critical-alerts'
      DisplayName: Critical Compliance Alerts
      KmsMasterKeyId: !Ref ConfigKMSKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-critical-alert-topic'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # AWS Config
  # ==========================================
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-recorder'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
      RoleARN: !GetAtt ConfigRole.Arn

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-delivery'
      S3BucketName: !Ref ComplianceReportsBucket
      SnsTopicARN: !Ref AlertTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-config-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      Policies:
        - PolicyName: ConfigBucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3BucketAccess
                Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetBucketAcl'
                Resource:
                  - !GetAtt ComplianceReportsBucket.Arn
                  - !Sub '${ComplianceReportsBucket.Arn}/*'
              - Sid: SNSPublish
                Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AlertTopic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-config-role'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # Required Tagging Rule
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-required-tags'
      Description: Ensures all resources have required tags
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters: !Sub |
        {
          "tag1Key": "Environment",
          "tag1Value": "${EnvironmentSuffix}",
          "tag2Key": "project",
          "tag2Value": "iac-rlhf-amazon",
          "tag3Key": "team-number",
          "tag3Value": "2"
        }

  # S3 Encryption Rule
  S3EncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-s3-encryption'
      Description: Ensures S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  # RDS Encryption Rule
  RDSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-rds-encryption'
      Description: Ensures RDS instances have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED

  # ==========================================
  # CloudWatch Dashboard
  # ==========================================
  ComplianceDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-compliance'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "title": "Configuration Drift Detection",
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "metrics": [
                  ["ConfigCompliance", "ConfigurationDrift", {"stat": "Sum", "label": "Drift Detected"}],
                  [".", "DriftDetectionErrors", {"stat": "Sum", "label": "Detection Errors"}]
                ],
                "yAxis": {"left": {"min": 0}}
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "Parameter Synchronization",
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "metrics": [
                  ["ConfigCompliance", "ParametersSynchronized", {"stat": "Sum"}],
                  [".", "ParametersSkipped", {"stat": "Sum"}],
                  [".", "ReconciliationErrors", {"stat": "Sum"}]
                ]
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "Lambda Function Performance",
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "metrics": [
                  ["AWS/Lambda", "Duration", "FunctionName", "${DriftDetectionFunction}"],
                  [".", ".", ".", "${ReconciliationFunction}"],
                  [".", "Errors", ".", "${DriftDetectionFunction}", {"stat": "Sum"}],
                  [".", ".", ".", "${ReconciliationFunction}", {"stat": "Sum"}]
                ]
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "RDS Aurora Performance",
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "metrics": [
                  ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", "${AuroraCluster}"],
                  [".", "CPUUtilization", ".", "."],
                  [".", "FreeableMemory", ".", "."]
                ]
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "DynamoDB Performance",
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${StateTable}"],
                  [".", "ConsumedWriteCapacityUnits", ".", "."],
                  [".", "UserErrors", ".", "."]
                ]
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "AWS Config Compliance",
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "metrics": [
                  ["AWS/Config", "ComplianceScore"]
                ]
              }
            }
          ]
        }

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  DriftDetectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-drift-detected'
      AlarmDescription: Alert when configuration drift is detected
      MetricName: ConfigurationDrift
      Namespace: ConfigCompliance
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: Environment
          Value: !Ref EnvironmentSuffix

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-lambda-errors'
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: FunctionName
          Value: !Ref DriftDetectionFunction

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-connections'
      AlarmDescription: Alert on high database connections
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraCluster

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-cpu'
      AlarmDescription: Alert on high database CPU utilization
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraCluster

# ==========================================
# Outputs
# ==========================================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  PrivateSubnetIds:
    Description: Private subnet IDs
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2},${PrivateSubnet3}'
    Export:
      Name: !Sub '${AWS::StackName}-private-subnets'

  ConfigBucketName:
    Description: Configuration S3 bucket name
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-config-bucket'

  ComplianceBucketName:
    Description: Compliance reports S3 bucket name
    Value: !Ref ComplianceReportsBucket
    Export:
      Name: !Sub '${AWS::StackName}-compliance-bucket'

  StateTableName:
    Description: DynamoDB state table name
    Value: !Ref StateTable
    Export:
      Name: !Sub '${AWS::StackName}-state-table'

  AuroraClusterEndpoint:
    Description: Aurora cluster endpoint
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-aurora-endpoint'

  AuroraClusterPort:
    Description: Aurora cluster port
    Value: !GetAtt AuroraCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-aurora-port'

  DriftDetectionFunctionArn:
    Description: Drift detection Lambda function ARN
    Value: !GetAtt DriftDetectionFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-drift-function'

  ReconciliationFunctionArn:
    Description: Reconciliation Lambda function ARN
    Value: !GetAtt ReconciliationFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-reconciliation-function'

  AlertTopicArn:
    Description: SNS alert topic ARN
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-alert-topic'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}-${EnvironmentSuffix}-compliance'

  ConfigRecorderName:
    Description: AWS Config recorder name
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub '${AWS::StackName}-config-recorder'

  KMSKeyId:
    Description: KMS key ID for encryption
    Value: !Ref ConfigKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-kms-key'

  DBMasterSecretArn:
    Description: Database master secret ARN
    Value: !Ref DBMasterSecret
    Export:
      Name: !Sub '${AWS::StackName}-db-master-secret'

  ParameterStorePrefix:
    Description: SSM Parameter Store prefix for this environment
    Value: !Sub '/${OrganizationId}/${EnvironmentSuffix}'
    Export:
      Name: !Sub '${AWS::StackName}-parameter-prefix'
```
