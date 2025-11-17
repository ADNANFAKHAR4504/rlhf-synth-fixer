# CloudFormation Implementation - Aurora Global Database

This implementation provides a highly available Aurora Global Database spanning two regions (us-east-1 and us-west-2) with automated backups, encryption, and enhanced monitoring.

## Architecture Overview

Due to CloudFormation's limitation of deploying resources in a single region per stack, this solution uses a coordinated deployment approach:

1. **Primary Stack** (us-east-1): Deploys the primary Aurora cluster with KMS encryption
2. **Secondary Stack** (us-west-2): Deploys the secondary Aurora cluster connected to the global database

Both stacks are deployed separately but reference the same global database cluster identifier.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Aurora Global Database - Primary Region (us-east-1) - Highly Available Transaction Processing Database'

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
          - DatabaseName
          - MasterUsername
          - MasterPassword
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcId
          - PrivateSubnetIds

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  DatabaseName:
    Type: String
    Default: 'transactionsdb'
    Description: 'Initial database name'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  MasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Master username for Aurora cluster'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  MasterPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for Aurora cluster (min 8 characters)'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9]*$'
    ConstraintDescription: 'Must be 8-41 alphanumeric characters'

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: 'VPC ID for Aurora cluster deployment'

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: 'List of private subnet IDs across 3 AZs for Aurora deployment'

Resources:
  # KMS Key for Aurora Encryption
  AuroraKmsKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for Aurora Global Database encryption - ${EnvironmentSuffix}'
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
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'rds.${AWS::Region}.amazonaws.com'

  AuroraKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/aurora-global-${EnvironmentSuffix}'
      TargetKeyId: !Ref AuroraKmsKey

  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'aurora-global-subnet-${EnvironmentSuffix}'
      DBSubnetGroupDescription: !Sub 'Subnet group for Aurora Global Database - ${EnvironmentSuffix}'
      SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Name
          Value: !Sub 'aurora-global-subnet-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Security Group for Aurora Cluster
  AuroraSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'aurora-global-sg-${EnvironmentSuffix}'
      GroupDescription: !Sub 'Security group for Aurora Global Database - ${EnvironmentSuffix}'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/8
          Description: 'Allow MySQL traffic from VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'aurora-global-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Role for Enhanced Monitoring
  EnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'aurora-monitoring-role-${EnvironmentSuffix}'
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
          Value: !Sub 'aurora-monitoring-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Aurora Global Database Cluster
  GlobalDatabaseCluster:
    Type: AWS::RDS::GlobalCluster
    Properties:
      GlobalClusterIdentifier: !Sub 'aurora-global-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '5.7.mysql_aurora.2.11.2'
      DeletionProtection: true
      StorageEncrypted: true

  # Primary Aurora DB Cluster
  PrimaryDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'aurora-primary-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '5.7.mysql_aurora.2.11.2'
      GlobalClusterIdentifier: !Ref GlobalDatabaseCluster
      MasterUsername: !Ref MasterUsername
      MasterUserPassword: !Ref MasterPassword
      DatabaseName: !Ref DatabaseName
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref AuroraSecurityGroup
      BackupRetentionPeriod: 35
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      KmsKeyId: !GetAtt AuroraKmsKey.Arn
      StorageEncrypted: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
        - audit
      BacktrackWindow: 86400
      CopyTagsToSnapshot: true
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub 'aurora-primary-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: 'Primary'

  # Primary Writer Instance
  PrimaryWriterInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-primary-writer-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref PrimaryDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      MonitoringInterval: 10
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      PerformanceInsightsKMSKeyId: !GetAtt AuroraKmsKey.Arn
      PromotionTier: 0
      Tags:
        - Key: Name
          Value: !Sub 'aurora-primary-writer-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: 'Writer'

  # Primary Reader Instance 1
  PrimaryReaderInstance1:
    Type: AWS::RDS::DBInstance
    DependsOn: PrimaryWriterInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-primary-reader1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref PrimaryDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      MonitoringInterval: 10
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      PerformanceInsightsKMSKeyId: !GetAtt AuroraKmsKey.Arn
      PromotionTier: 1
      Tags:
        - Key: Name
          Value: !Sub 'aurora-primary-reader1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: 'Reader'

  # Primary Reader Instance 2
  PrimaryReaderInstance2:
    Type: AWS::RDS::DBInstance
    DependsOn: PrimaryReaderInstance1
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-primary-reader2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref PrimaryDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      MonitoringInterval: 10
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      PerformanceInsightsKMSKeyId: !GetAtt AuroraKmsKey.Arn
      PromotionTier: 2
      Tags:
        - Key: Name
          Value: !Sub 'aurora-primary-reader2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: 'Reader'

  # CloudWatch Alarm - High CPU on Writer
  WriterHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'aurora-writer-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when writer instance CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PrimaryWriterInstance
      TreatMissingData: notBreaching

  # CloudWatch Alarm - Database Connections
  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'aurora-high-connections-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when database connections exceed 80% of max'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 800
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref PrimaryDBCluster
      TreatMissingData: notBreaching

  # CloudWatch Alarm - Replication Lag (for Global Database)
  ReplicationLagAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'aurora-replication-lag-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when global database replication lag exceeds 1 second'
      MetricName: AuroraGlobalDBReplicationLag
      Namespace: AWS/RDS
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 3
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref PrimaryDBCluster
      TreatMissingData: notBreaching

  # CloudWatch Alarm - Data Transfer Bytes (Global DB)
  DataTransferBytesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'aurora-data-transfer-${EnvironmentSuffix}'
      AlarmDescription: 'Monitor data transfer volume for global database'
      MetricName: AuroraGlobalDBDataTransferBytes
      Namespace: AWS/RDS
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10737418240
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref PrimaryDBCluster
      TreatMissingData: notBreaching

Outputs:
  GlobalClusterIdentifier:
    Description: 'Aurora Global Database Cluster Identifier'
    Value: !Ref GlobalDatabaseCluster
    Export:
      Name: !Sub '${AWS::StackName}-GlobalClusterIdentifier'

  PrimaryClusterIdentifier:
    Description: 'Primary Aurora Cluster Identifier (us-east-1)'
    Value: !Ref PrimaryDBCluster
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryClusterIdentifier'

  PrimaryClusterEndpoint:
    Description: 'Primary cluster writer endpoint'
    Value: !GetAtt PrimaryDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryClusterEndpoint'

  PrimaryClusterReaderEndpoint:
    Description: 'Primary cluster reader endpoint'
    Value: !GetAtt PrimaryDBCluster.ReadEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryClusterReaderEndpoint'

  PrimaryClusterPort:
    Description: 'Primary cluster port'
    Value: !GetAtt PrimaryDBCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryClusterPort'

  PrimaryKmsKeyId:
    Description: 'KMS Key ID for primary region encryption'
    Value: !GetAtt AuroraKmsKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryKmsKeyId'

  DatabaseName:
    Description: 'Initial database name'
    Value: !Ref DatabaseName
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseName'

  WriterInstanceId:
    Description: 'Writer instance identifier'
    Value: !Ref PrimaryWriterInstance
    Export:
      Name: !Sub '${AWS::StackName}-WriterInstanceId'

  ReaderInstance1Id:
    Description: 'Reader instance 1 identifier'
    Value: !Ref PrimaryReaderInstance1
    Export:
      Name: !Sub '${AWS::StackName}-ReaderInstance1Id'

  ReaderInstance2Id:
    Description: 'Reader instance 2 identifier'
    Value: !Ref PrimaryReaderInstance2
    Export:
      Name: !Sub '${AWS::StackName}-ReaderInstance2Id'

  EnhancedMonitoringRoleArn:
    Description: 'IAM role ARN for enhanced monitoring'
    Value: !GetAtt EnhancedMonitoringRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EnhancedMonitoringRoleArn'

  SecurityGroupId:
    Description: 'Security group ID for Aurora cluster'
    Value: !Ref AuroraSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'

  ConnectionString:
    Description: 'MySQL connection string for applications'
    Value: !Sub 'mysql://${MasterUsername}@${PrimaryDBCluster.Endpoint.Address}:${PrimaryDBCluster.Endpoint.Port}/${DatabaseName}'

  FailoverInstructions:
    Description: 'Manual failover instructions for operations team'
    Value: !Sub |
      FAILOVER INSTRUCTIONS:
      1. Verify secondary cluster health in us-west-2
      2. Remove secondary cluster from global database: aws rds remove-from-global-cluster --region us-west-2 --db-cluster-identifier aurora-secondary-cluster-${EnvironmentSuffix} --global-cluster-identifier aurora-global-cluster-${EnvironmentSuffix}
      3. Promote secondary cluster: This happens automatically when removed from global database
      4. Update application connection strings to point to us-west-2 endpoint
      5. Monitor replication lag and cluster health
      6. After regional recovery, recreate global database and add original primary as secondary

  BacktrackInstructions:
    Description: 'Instructions for using backtrack capability'
    Value: !Sub |
      BACKTRACK INSTRUCTIONS:
      1. Identify target timestamp (within last 24 hours): aws rds describe-db-cluster-backtracks --db-cluster-identifier aurora-primary-cluster-${EnvironmentSuffix}
      2. Execute backtrack: aws rds backtrack-db-cluster --db-cluster-identifier aurora-primary-cluster-${EnvironmentSuffix} --backtrack-to "2024-01-01T12:00:00Z"
      3. Verify data integrity after backtrack completes
      4. Note: Backtrack causes brief interruption of database operations

  MonitoringDashboard:
    Description: 'CloudWatch dashboard URL for monitoring'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=aurora-global-${EnvironmentSuffix}'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## File: lib/TapStack-Secondary.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Aurora Global Database - Secondary Region (us-west-2) - Disaster Recovery Cluster'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Global Database Configuration'
        Parameters:
          - GlobalClusterIdentifier
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcId
          - PrivateSubnetIds

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (must match primary stack)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  GlobalClusterIdentifier:
    Type: String
    Description: 'Global cluster identifier from primary stack'
    Default: 'aurora-global-cluster-dev'

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: 'VPC ID for Aurora cluster deployment in us-west-2'

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: 'List of private subnet IDs across 3 AZs for Aurora deployment in us-west-2'

Resources:
  # KMS Key for Secondary Region Aurora Encryption
  SecondaryAuroraKmsKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for Aurora Global Database encryption - Secondary Region - ${EnvironmentSuffix}'
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
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'rds.${AWS::Region}.amazonaws.com'

  SecondaryAuroraKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/aurora-global-secondary-${EnvironmentSuffix}'
      TargetKeyId: !Ref SecondaryAuroraKmsKey

  # DB Subnet Group for Secondary Region
  SecondaryDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'aurora-global-subnet-secondary-${EnvironmentSuffix}'
      DBSubnetGroupDescription: !Sub 'Subnet group for Aurora Global Database Secondary - ${EnvironmentSuffix}'
      SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Name
          Value: !Sub 'aurora-global-subnet-secondary-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Security Group for Secondary Aurora Cluster
  SecondaryAuroraSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'aurora-global-sg-secondary-${EnvironmentSuffix}'
      GroupDescription: !Sub 'Security group for Aurora Global Database Secondary - ${EnvironmentSuffix}'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/8
          Description: 'Allow MySQL traffic from VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'aurora-global-sg-secondary-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Role for Enhanced Monitoring (Secondary Region)
  SecondaryEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'aurora-monitoring-role-secondary-${EnvironmentSuffix}'
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
          Value: !Sub 'aurora-monitoring-role-secondary-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Secondary Aurora DB Cluster
  SecondaryDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'aurora-secondary-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '5.7.mysql_aurora.2.11.2'
      GlobalClusterIdentifier: !Ref GlobalClusterIdentifier
      DBSubnetGroupName: !Ref SecondaryDBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref SecondaryAuroraSecurityGroup
      KmsKeyId: !GetAtt SecondaryAuroraKmsKey.Arn
      StorageEncrypted: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
        - audit
      CopyTagsToSnapshot: true
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub 'aurora-secondary-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: 'Secondary'

  # Secondary Reader Instance 1
  SecondaryReaderInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-secondary-reader1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref SecondaryDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      MonitoringInterval: 10
      MonitoringRoleArn: !GetAtt SecondaryEnhancedMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      PerformanceInsightsKMSKeyId: !GetAtt SecondaryAuroraKmsKey.Arn
      PromotionTier: 0
      Tags:
        - Key: Name
          Value: !Sub 'aurora-secondary-reader1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: 'Reader-Secondary'

  # Secondary Reader Instance 2
  SecondaryReaderInstance2:
    Type: AWS::RDS::DBInstance
    DependsOn: SecondaryReaderInstance1
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-secondary-reader2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref SecondaryDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      MonitoringInterval: 10
      MonitoringRoleArn: !GetAtt SecondaryEnhancedMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      PerformanceInsightsKMSKeyId: !GetAtt SecondaryAuroraKmsKey.Arn
      PromotionTier: 1
      Tags:
        - Key: Name
          Value: !Sub 'aurora-secondary-reader2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Role
          Value: 'Reader-Secondary'

  # CloudWatch Alarm - Secondary Cluster CPU
  SecondaryHighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'aurora-secondary-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when secondary cluster CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref SecondaryDBCluster
      TreatMissingData: notBreaching

  # CloudWatch Alarm - Replication Lag (Secondary)
  SecondaryReplicationLagAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'aurora-secondary-replication-lag-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when secondary cluster replication lag exceeds 1 second'
      MetricName: AuroraGlobalDBReplicationLag
      Namespace: AWS/RDS
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 3
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref SecondaryDBCluster
      TreatMissingData: notBreaching

Outputs:
  SecondaryClusterIdentifier:
    Description: 'Secondary Aurora Cluster Identifier (us-west-2)'
    Value: !Ref SecondaryDBCluster
    Export:
      Name: !Sub '${AWS::StackName}-SecondaryClusterIdentifier'

  SecondaryClusterEndpoint:
    Description: 'Secondary cluster endpoint (read-only until promoted)'
    Value: !GetAtt SecondaryDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-SecondaryClusterEndpoint'

  SecondaryClusterReaderEndpoint:
    Description: 'Secondary cluster reader endpoint'
    Value: !GetAtt SecondaryDBCluster.ReadEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-SecondaryClusterReaderEndpoint'

  SecondaryClusterPort:
    Description: 'Secondary cluster port'
    Value: !GetAtt SecondaryDBCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-SecondaryClusterPort'

  SecondaryKmsKeyId:
    Description: 'KMS Key ID for secondary region encryption'
    Value: !GetAtt SecondaryAuroraKmsKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SecondaryKmsKeyId'

  SecondaryReaderInstance1Id:
    Description: 'Secondary reader instance 1 identifier'
    Value: !Ref SecondaryReaderInstance1
    Export:
      Name: !Sub '${AWS::StackName}-SecondaryReaderInstance1Id'

  SecondaryReaderInstance2Id:
    Description: 'Secondary reader instance 2 identifier'
    Value: !Ref SecondaryReaderInstance2
    Export:
      Name: !Sub '${AWS::StackName}-SecondaryReaderInstance2Id'

  SecondarySecurityGroupId:
    Description: 'Security group ID for secondary Aurora cluster'
    Value: !Ref SecondaryAuroraSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecondarySecurityGroupId'

  PromotionInstructions:
    Description: 'Instructions to promote secondary cluster to primary'
    Value: !Sub |
      PROMOTION INSTRUCTIONS (Secondary to Primary):
      1. Verify primary region is unavailable or experiencing issues
      2. Remove from global cluster: aws rds remove-from-global-cluster --region us-west-2 --db-cluster-identifier aurora-secondary-cluster-${EnvironmentSuffix} --global-cluster-identifier ${GlobalClusterIdentifier}
      3. Secondary cluster automatically becomes standalone with write capability
      4. Update application DNS/connection strings to: ${SecondaryDBCluster.Endpoint.Address}
      5. Verify write operations are functioning
      6. Update Route 53 records if using DNS-based failover
      7. Document promotion time and reason for post-mortem

  StackName:
    Description: 'Name of this CloudFormation stack (Secondary Region)'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Implementation Notes

### Key Design Decisions

1. **Multi-Region Deployment**: CloudFormation doesn't support deploying resources across multiple regions in a single stack, so we use two separate stacks that reference the same Global Database Cluster.

2. **KMS Keys**: Separate KMS keys are created in each region as required by Aurora Global Database encryption.

3. **Enhanced Monitoring**: Configured at 10-second intervals for granular visibility into database performance.

4. **Deletion Protection**: Set to `true` on all database resources to prevent accidental deletion in production.

5. **Backtrack**: Enabled with 86400 seconds (24 hours) window for point-in-time recovery.

6. **CloudWatch Alarms**: Configured for CPU, connections, replication lag, and data transfer monitoring.

7. **Promotion Tiers**: Instances have different promotion tiers (0, 1, 2) to control failover order.

### Best Practices Implemented

- Customer-managed KMS encryption in both regions
- Enhanced monitoring with 10-second granularity
- 35-day backup retention period
- 24-hour backtrack window
- Multi-AZ deployment with 3 instances in primary region
- Deletion protection enabled
- CloudWatch alarms for critical metrics
- Performance Insights enabled
- All CloudWatch log types exported
- EnvironmentSuffix parameter for resource uniqueness
- Comprehensive outputs with connection strings and failover instructions
