# Aurora Global Database - CloudFormation Implementation

This implementation provides a highly available Aurora Global Database spanning us-east-1 and us-west-2 using CloudFormation YAML.

## lib/TapStack.yml

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
    Default: 'TempPass123456'
    Description: 'Master password for Aurora cluster (min 8 characters)'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9]*$'
    ConstraintDescription: 'Must be 8-41 alphanumeric characters'

Resources:
  # Secrets Manager Secret for Aurora Database Credentials
  AuroraDatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'aurora-db-secret-${EnvironmentSuffix}'
      Description: 'Master credentials for Aurora database cluster'
      SecretString: !Sub |
        {
          "username": "${MasterUsername}",
          "password": "${MasterPassword}"
        }
      Tags:
        - Key: Name
          Value: !Sub 'aurora-db-secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # VPC Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'aurora-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'aurora-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnet 2
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnet 3
  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'aurora-private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Public Subnet for NAT Gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'aurora-public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'aurora-nat-eip-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateway
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'aurora-nat-gateway-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'aurora-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'aurora-private-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

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
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
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
      VpcId: !Ref VPC
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
      EngineVersion: '8.0.mysql_aurora.3.04.0'
      DeletionProtection: false
      StorageEncrypted: true

  # Primary Aurora DB Cluster
  PrimaryDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'aurora-primary-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '8.0.mysql_aurora.3.04.0'
      GlobalClusterIdentifier: !Ref GlobalDatabaseCluster
      MasterUsername: !Sub '{{resolve:secretsmanager:${AuroraDatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${AuroraDatabaseSecret}:SecretString:password}}'
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
      CopyTagsToSnapshot: true
      DeletionProtection: false
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

  # CloudWatch Alarm - Replication Lag
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

  # CloudWatch Alarm - Data Transfer Bytes
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
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PrivateSubnetIds:
    Description: 'Private Subnet IDs for Aurora deployment'
    Value: !Join
      - ','
      - - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

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
    Description: 'Point-in-time recovery instructions (Backtrack not available for Global Databases)'
    Value: !Sub |
      POINT-IN-TIME RECOVERY INSTRUCTIONS:
      Note: Backtrack is not supported for Aurora Global Databases.
      Alternative recovery options:
      1. Use point-in-time restore to create a new cluster: aws rds restore-db-cluster-to-point-in-time --source-db-cluster-identifier aurora-primary-cluster-${EnvironmentSuffix} --db-cluster-identifier aurora-restored-${EnvironmentSuffix} --restore-to-time "2024-01-01T12:00:00Z"
      2. Use automated backups (35-day retention configured)
      3. For immediate recovery needs, fail over to secondary region (us-west-2)
      4. Consider implementing binlog-based recovery for finer granularity

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
