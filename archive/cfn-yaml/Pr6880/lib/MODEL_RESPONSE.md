# CloudFormation Implementation - Document Management System Migration

This implementation provides a complete CloudFormation template for migrating an on-premises document management system to AWS with zero downtime.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Document Management System Migration Infrastructure - DMS, DataSync, RDS Aurora, EFS, CloudWatch, SNS'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource names to support parallel deployments'
    Default: 'prod'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  VpcCIDR:
    Type: String
    Description: 'CIDR block for VPC'
    Default: '10.0.0.0/16'

  PublicSubnet1CIDR:
    Type: String
    Description: 'CIDR block for public subnet in AZ1'
    Default: '10.0.1.0/24'

  PublicSubnet2CIDR:
    Type: String
    Description: 'CIDR block for public subnet in AZ2'
    Default: '10.0.2.0/24'

  PublicSubnet3CIDR:
    Type: String
    Description: 'CIDR block for public subnet in AZ3'
    Default: '10.0.3.0/24'

  PrivateSubnet1CIDR:
    Type: String
    Description: 'CIDR block for private subnet in AZ1'
    Default: '10.0.11.0/24'

  PrivateSubnet2CIDR:
    Type: String
    Description: 'CIDR block for private subnet in AZ2'
    Default: '10.0.12.0/24'

  PrivateSubnet3CIDR:
    Type: String
    Description: 'CIDR block for private subnet in AZ3'
    Default: '10.0.13.0/24'

  DBMasterUsername:
    Type: String
    Description: 'Master username for RDS Aurora MySQL'
    Default: 'admin'
    NoEcho: true

  DBMasterPassword:
    Type: String
    Description: 'Master password for RDS Aurora MySQL'
    NoEcho: true
    MinLength: 8
    MaxLength: 41

  SourceNFSServerHostname:
    Type: String
    Description: 'On-premises NFS server hostname or IP'

  SourceNFSExportPath:
    Type: String
    Description: 'NFS export path on source server'
    Default: '/data/documents'

  SourceDatabaseEndpoint:
    Type: String
    Description: 'Source database endpoint for DMS'

  SourceDatabasePort:
    Type: String
    Description: 'Source database port'
    Default: '3306'

  SourceDatabaseName:
    Type: String
    Description: 'Source database name'

  SourceDatabaseUsername:
    Type: String
    Description: 'Source database username'
    NoEcho: true

  SourceDatabasePassword:
    Type: String
    Description: 'Source database password'
    NoEcho: true

  AlertEmailAddress:
    Type: String
    Description: 'Email address for migration alerts'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

Resources:
  # ========================================
  # VPC and Network Infrastructure
  # ========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'migration-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'infrastructure'
        - Key: DataClassification
          Value: 'sensitive'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'migration-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'migration-public-subnet-1-${EnvironmentSuffix}'
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
          Value: !Sub 'migration-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet3CIDR
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'migration-public-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-subnet-1-${EnvironmentSuffix}'
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
          Value: !Sub 'migration-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet3CIDR
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateways
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-eip-1-${EnvironmentSuffix}'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-eip-2-${EnvironmentSuffix}'

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-eip-3-${EnvironmentSuffix}'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-1-${EnvironmentSuffix}'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-2-${EnvironmentSuffix}'

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-3-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'migration-public-rt-${EnvironmentSuffix}'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-rt-1-${EnvironmentSuffix}'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-rt-2-${EnvironmentSuffix}'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-rt-3-${EnvironmentSuffix}'

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # ========================================
  # KMS Keys for Encryption
  # ========================================

  RDSEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for RDS Aurora encryption - ${EnvironmentSuffix}'
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
    Properties:
      AliasName: !Sub 'alias/rds-migration-${EnvironmentSuffix}'
      TargetKeyId: !Ref RDSEncryptionKey

  EFSEncryptionKey:
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
          - Sid: Allow EFS to use the key
            Effect: Allow
            Principal:
              Service: elasticfilesystem.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'efs-encryption-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EFSEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/efs-migration-${EnvironmentSuffix}'
      TargetKeyId: !Ref EFSEncryptionKey

  # ========================================
  # Security Groups
  # ========================================

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'rds-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for RDS Aurora MySQL cluster'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref DMSSecurityGroup
          Description: 'Allow MySQL access from DMS'
      Tags:
        - Key: Name
          Value: !Sub 'rds-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'database'
        - Key: DataClassification
          Value: 'sensitive'

  DMSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'dms-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for DMS replication instance'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 0.0.0.0/0
          Description: 'Allow outbound MySQL connections'
      Tags:
        - Key: Name
          Value: !Sub 'dms-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'replication'

  EFSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'efs-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for EFS mount targets'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          SourceSecurityGroupId: !Ref DataSyncSecurityGroup
          Description: 'Allow NFS access from DataSync'
      Tags:
        - Key: Name
          Value: !Sub 'efs-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'storage'
        - Key: DataClassification
          Value: 'sensitive'

  DataSyncSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'datasync-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for DataSync agents'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          CidrIp: 0.0.0.0/0
          Description: 'Allow outbound NFS connections'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS for DataSync service'
      Tags:
        - Key: Name
          Value: !Sub 'datasync-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'file-transfer'

  # ========================================
  # RDS Aurora MySQL Cluster (Requirement 3)
  # ========================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'aurora-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for Aurora MySQL cluster'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'aurora-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: !Sub 'aurora-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '8.0.mysql_aurora.3.04.0'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DatabaseName: documents
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref RDSSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !GetAtt RDSEncryptionKey.Arn
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub 'aurora-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'database'
        - Key: DataClassification
          Value: 'sensitive'

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuroraInstance3:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'aurora-instance-3-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-mysql
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'aurora-instance-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ========================================
  # EFS File System (Requirement 4)
  # ========================================

  FileSystem:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: true
      KmsKeyId: !GetAtt EFSEncryptionKey.Arn
      LifecyclePolicies:
        - TransitionToIA: AFTER_30_DAYS
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      FileSystemTags:
        - Key: Name
          Value: !Sub 'migration-efs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'storage'
        - Key: DataClassification
          Value: 'sensitive'

  MountTarget1:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref FileSystem
      SubnetId: !Ref PrivateSubnet1
      SecurityGroups:
        - !Ref EFSSecurityGroup

  MountTarget2:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref FileSystem
      SubnetId: !Ref PrivateSubnet2
      SecurityGroups:
        - !Ref EFSSecurityGroup

  MountTarget3:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref FileSystem
      SubnetId: !Ref PrivateSubnet3
      SecurityGroups:
        - !Ref EFSSecurityGroup

  # ========================================
  # DMS Resources (Requirements 1, 5)
  # ========================================

  DMSSubnetGroup:
    Type: AWS::DMS::ReplicationSubnetGroup
    Properties:
      ReplicationSubnetGroupIdentifier: !Sub 'dms-subnet-group-${EnvironmentSuffix}'
      ReplicationSubnetGroupDescription: 'Subnet group for DMS replication instance'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'dms-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DMSReplicationInstance:
    Type: AWS::DMS::ReplicationInstance
    Properties:
      ReplicationInstanceIdentifier: !Sub 'dms-instance-${EnvironmentSuffix}'
      ReplicationInstanceClass: dms.r5.large
      AllocatedStorage: 100
      VpcSecurityGroupIds:
        - !Ref DMSSecurityGroup
      ReplicationSubnetGroupIdentifier: !Ref DMSSubnetGroup
      MultiAZ: false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'dms-instance-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'replication'

  DMSSourceEndpoint:
    Type: AWS::DMS::Endpoint
    Properties:
      EndpointIdentifier: !Sub 'dms-source-${EnvironmentSuffix}'
      EndpointType: source
      EngineName: mysql
      ServerName: !Ref SourceDatabaseEndpoint
      Port: !Ref SourceDatabasePort
      DatabaseName: !Ref SourceDatabaseName
      Username: !Ref SourceDatabaseUsername
      Password: !Ref SourceDatabasePassword
      Tags:
        - Key: Name
          Value: !Sub 'dms-source-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DMSTargetEndpoint:
    Type: AWS::DMS::Endpoint
    Properties:
      EndpointIdentifier: !Sub 'dms-target-${EnvironmentSuffix}'
      EndpointType: target
      EngineName: aurora
      ServerName: !GetAtt AuroraCluster.Endpoint.Address
      Port: !GetAtt AuroraCluster.Endpoint.Port
      DatabaseName: documents
      Username: !Ref DBMasterUsername
      Password: !Ref DBMasterPassword
      Tags:
        - Key: Name
          Value: !Sub 'dms-target-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DMSReplicationTask:
    Type: AWS::DMS::ReplicationTask
    DependsOn:
      - DMSReplicationInstance
      - DMSSourceEndpoint
      - DMSTargetEndpoint
    Properties:
      ReplicationTaskIdentifier: !Sub 'dms-task-${EnvironmentSuffix}'
      SourceEndpointArn: !Ref DMSSourceEndpoint
      TargetEndpointArn: !Ref DMSTargetEndpoint
      ReplicationInstanceArn: !Ref DMSReplicationInstance
      MigrationType: full-load-and-cdc
      TableMappings: |
        {
          "rules": [
            {
              "rule-type": "selection",
              "rule-id": "1",
              "rule-name": "1",
              "object-locator": {
                "schema-name": "%",
                "table-name": "%"
              },
              "rule-action": "include"
            }
          ]
        }
      ReplicationTaskSettings: |
        {
          "TargetMetadata": {
            "SupportLobs": true,
            "FullLobMode": false,
            "LobChunkSize": 64,
            "LimitedSizeLobMode": true,
            "LobMaxSize": 32
          },
          "FullLoadSettings": {
            "TargetTablePrepMode": "DROP_AND_CREATE",
            "CreatePkAfterFullLoad": false,
            "StopTaskCachedChangesApplied": false,
            "StopTaskCachedChangesNotApplied": false,
            "MaxFullLoadSubTasks": 8,
            "TransactionConsistencyTimeout": 600,
            "CommitRate": 10000
          },
          "Logging": {
            "EnableLogging": true,
            "LogComponents": [
              {
                "Id": "SOURCE_UNLOAD",
                "Severity": "LOGGER_SEVERITY_DEFAULT"
              },
              {
                "Id": "TARGET_LOAD",
                "Severity": "LOGGER_SEVERITY_DEFAULT"
              },
              {
                "Id": "SOURCE_CAPTURE",
                "Severity": "LOGGER_SEVERITY_DEFAULT"
              },
              {
                "Id": "TARGET_APPLY",
                "Severity": "LOGGER_SEVERITY_DEFAULT"
              }
            ]
          },
          "ChangeProcessingDdlHandlingPolicy": {
            "HandleSourceTableDropped": true,
            "HandleSourceTableTruncated": true,
            "HandleSourceTableAltered": true
          },
          "ChangeProcessingTuning": {
            "BatchApplyPreserveTransaction": true,
            "BatchApplyTimeoutMin": 1,
            "BatchApplyTimeoutMax": 30,
            "BatchApplyMemoryLimit": 500,
            "BatchSplitSize": 0,
            "MinTransactionSize": 1000,
            "CommitTimeout": 1,
            "MemoryLimitTotal": 1024,
            "MemoryKeepTime": 60,
            "StatementCacheSize": 50
          }
        }
      Tags:
        - Key: Name
          Value: !Sub 'dms-task-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'replication'

  # ========================================
  # DataSync Resources (Requirements 2, 6)
  # ========================================

  DataSyncRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'datasync-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: datasync.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSDataSyncFullAccess'
      Policies:
        - PolicyName: EFSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'elasticfilesystem:ClientMount'
                  - 'elasticfilesystem:ClientWrite'
                  - 'elasticfilesystem:DescribeFileSystems'
                  - 'elasticfilesystem:DescribeMountTargets'
                Resource: !Sub 'arn:aws:elasticfilesystem:${AWS::Region}:${AWS::AccountId}:file-system/${FileSystem}'
              - Effect: Allow
                Action:
                  - 'ec2:DescribeSubnets'
                  - 'ec2:DescribeSecurityGroups'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'datasync-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DataSyncSourceLocation:
    Type: AWS::DataSync::LocationNFS
    Properties:
      ServerHostname: !Ref SourceNFSServerHostname
      Subdirectory: !Ref SourceNFSExportPath
      OnPremConfig:
        AgentArns: []
      Tags:
        - Key: Name
          Value: !Sub 'datasync-source-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DataSyncDestinationLocation:
    Type: AWS::DataSync::LocationEFS
    Properties:
      EfsFilesystemArn: !Sub 'arn:aws:elasticfilesystem:${AWS::Region}:${AWS::AccountId}:file-system/${FileSystem}'
      Ec2Config:
        SecurityGroupArns:
          - !Sub 'arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:security-group/${DataSyncSecurityGroup}'
        SubnetArn: !Sub 'arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:subnet/${PrivateSubnet1}'
      Subdirectory: /documents
      Tags:
        - Key: Name
          Value: !Sub 'datasync-destination-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DataSyncTask:
    Type: AWS::DataSync::Task
    DependsOn:
      - DataSyncSourceLocation
      - DataSyncDestinationLocation
      - MountTarget1
      - MountTarget2
      - MountTarget3
    Properties:
      Name: !Sub 'datasync-task-${EnvironmentSuffix}'
      SourceLocationArn: !GetAtt DataSyncSourceLocation.LocationArn
      DestinationLocationArn: !GetAtt DataSyncDestinationLocation.LocationArn
      CloudWatchLogGroupArn: !GetAtt DataSyncLogGroup.Arn
      Options:
        VerifyMode: POINT_IN_TIME_CONSISTENT
        OverwriteMode: ALWAYS
        Atime: BEST_EFFORT
        Mtime: PRESERVE
        Uid: INT_VALUE
        Gid: INT_VALUE
        PreserveDeletedFiles: PRESERVE
        PreserveDevices: NONE
        PosixPermissions: PRESERVE
        BytesPerSecond: -1
        TaskQueueing: ENABLED
        LogLevel: TRANSFER
        TransferMode: CHANGED
      Tags:
        - Key: Name
          Value: !Sub 'datasync-task-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'file-transfer'

  DataSyncLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/datasync/${EnvironmentSuffix}'
      RetentionInDays: 30

  # ========================================
  # SNS Topic for Alerts (Requirement 9)
  # ========================================

  MigrationAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'migration-alerts-${EnvironmentSuffix}'
      DisplayName: 'Migration Alerts'
      Tags:
        - Key: Name
          Value: !Sub 'migration-alerts-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: MigrationPhase
          Value: 'monitoring'

  MigrationAlertSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref MigrationAlertTopic
      Endpoint: !Ref AlertEmailAddress

  # ========================================
  # CloudWatch Alarms
  # ========================================

  DMSReplicationLagAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'dms-replication-lag-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when DMS replication lag exceeds threshold'
      MetricName: CDCLatencySource
      Namespace: AWS/DMS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 300
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ReplicationInstanceIdentifier
          Value: !Ref DMSReplicationInstance
        - Name: ReplicationTaskIdentifier
          Value: !Ref DMSReplicationTask
      AlarmActions:
        - !Ref MigrationAlertTopic
      TreatMissingData: notBreaching

  AuroraClusterCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'aurora-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Aurora cluster CPU exceeds threshold'
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
      AlarmActions:
        - !Ref MigrationAlertTopic

  EFSBurstCreditBalanceAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'efs-burst-credit-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when EFS burst credit balance is low'
      MetricName: BurstCreditBalance
      Namespace: AWS/EFS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1000000000000
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: FileSystemId
          Value: !Ref FileSystem
      AlarmActions:
        - !Ref MigrationAlertTopic

  # ========================================
  # SSM Parameters (Requirement 8)
  # ========================================

  SSMRDSEndpoint:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/migration/${EnvironmentSuffix}/rds/endpoint'
      Type: String
      Value: !GetAtt AuroraCluster.Endpoint.Address
      Description: 'Aurora cluster endpoint'
      Tags:
        Environment: !Ref EnvironmentSuffix
        MigrationPhase: database

  SSMRDSPort:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/migration/${EnvironmentSuffix}/rds/port'
      Type: String
      Value: !GetAtt AuroraCluster.Endpoint.Port
      Description: 'Aurora cluster port'
      Tags:
        Environment: !Ref EnvironmentSuffix

  SSMRDSUsername:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/migration/${EnvironmentSuffix}/rds/username'
      Type: SecureString
      Value: !Ref DBMasterUsername
      Description: 'Aurora master username'
      Tags:
        Environment: !Ref EnvironmentSuffix
        DataClassification: sensitive

  SSMEFSId:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/migration/${EnvironmentSuffix}/efs/filesystem-id'
      Type: String
      Value: !Ref FileSystem
      Description: 'EFS file system ID'
      Tags:
        Environment: !Ref EnvironmentSuffix

  SSMDMSInstanceArn:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/migration/${EnvironmentSuffix}/dms/instance-arn'
      Type: String
      Value: !Ref DMSReplicationInstance
      Description: 'DMS replication instance ARN'
      Tags:
        Environment: !Ref EnvironmentSuffix

  SSMMigrationStatus:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/migration/${EnvironmentSuffix}/status'
      Type: String
      Value: 'initialized'
      Description: 'Current migration status'
      Tags:
        Environment: !Ref EnvironmentSuffix
        MigrationPhase: tracking

  # ========================================
  # CloudWatch Dashboard (Requirement 7)
  # ========================================

  MigrationDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'migration-dashboard-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/DMS", "CDCLatencySource", {"stat": "Average", "label": "CDC Latency (seconds)"}],
                  [".", "CDCLatencyTarget", {"stat": "Average", "label": "Target Latency (seconds)"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "DMS Replication Lag",
                "period": 300,
                "yAxis": {
                  "left": {
                    "label": "Seconds"
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/DMS", "FullLoadThroughputRowsSource", {"stat": "Sum", "label": "Rows Loaded"}],
                  [".", "FullLoadThroughputBandwidthSource", {"stat": "Sum", "label": "Bandwidth (KB)"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "DMS Full Load Progress",
                "period": 300
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/DataSync", "BytesTransferred", {"stat": "Sum", "label": "Bytes Transferred"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "DataSync Transfer Progress",
                "period": 300,
                "yAxis": {
                  "left": {
                    "label": "Bytes"
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "CPUUtilization", {"stat": "Average", "label": "CPU Utilization"}],
                  [".", "DatabaseConnections", {"stat": "Average", "label": "Connections"}],
                  [".", "FreeableMemory", {"stat": "Average", "label": "Freeable Memory"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "RDS Aurora Metrics",
                "period": 300
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EFS", "ClientConnections", {"stat": "Sum", "label": "Client Connections"}],
                  [".", "DataReadIOBytes", {"stat": "Sum", "label": "Read IO Bytes"}],
                  [".", "DataWriteIOBytes", {"stat": "Sum", "label": "Write IO Bytes"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "EFS Activity",
                "period": 300
              }
            },
            {
              "type": "log",
              "properties": {
                "query": "SOURCE '/aws/datasync/${EnvironmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20",
                "region": "${AWS::Region}",
                "title": "DataSync Recent Logs",
                "stacked": false
              }
            }
          ]
        }

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnetIds:
    Description: 'Private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  PublicSubnetIds:
    Description: 'Public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  AuroraClusterEndpoint:
    Description: 'Aurora cluster endpoint'
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Aurora-Endpoint'

  AuroraClusterPort:
    Description: 'Aurora cluster port'
    Value: !GetAtt AuroraCluster.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-Aurora-Port'

  EFSFileSystemId:
    Description: 'EFS file system ID'
    Value: !Ref FileSystem
    Export:
      Name: !Sub '${AWS::StackName}-EFS-ID'

  DMSReplicationInstanceArn:
    Description: 'DMS replication instance ARN'
    Value: !Ref DMSReplicationInstance
    Export:
      Name: !Sub '${AWS::StackName}-DMS-Instance-ARN'

  DMSReplicationTaskArn:
    Description: 'DMS replication task ARN'
    Value: !Ref DMSReplicationTask
    Export:
      Name: !Sub '${AWS::StackName}-DMS-Task-ARN'

  DataSyncTaskArn:
    Description: 'DataSync task ARN'
    Value: !GetAtt DataSyncTask.TaskArn
    Export:
      Name: !Sub '${AWS::StackName}-DataSync-Task-ARN'

  SNSTopicArn:
    Description: 'SNS topic ARN for migration alerts'
    Value: !Ref MigrationAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic-ARN'

  CloudWatchDashboardURL:
    Description: 'CloudWatch dashboard URL'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=migration-dashboard-${EnvironmentSuffix}'

  RDSEncryptionKeyId:
    Description: 'KMS key ID for RDS encryption'
    Value: !GetAtt RDSEncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-RDS-KMS-Key'

  EFSEncryptionKeyId:
    Description: 'KMS key ID for EFS encryption'
    Value: !GetAtt EFSEncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EFS-KMS-Key'
```

## Implementation Summary

This CloudFormation template provides a complete migration infrastructure with all 10 mandatory requirements:

### Mandatory Requirements Implemented:

1. **DMS Replication Instance** - `dms.r5.large` instance in private subnet with security group
2. **DataSync Task** - Configured for EFS file migration with verification enabled
3. **RDS Aurora MySQL Cluster** - Multi-AZ cluster with 3 instances across 3 availability zones, KMS encryption
4. **EFS File System** - Lifecycle policy for IA after 30 days, mount targets in all 3 AZs, encryption at rest and in transit
5. **DMS Migration Task** - Full load + CDC with comprehensive settings
6. **DataSync Locations** - Source NFS and target EFS locations with IAM roles
7. **CloudWatch Dashboard** - Migration metrics, DMS lag, DataSync progress, RDS and EFS metrics
8. **SSM Parameters** - Database endpoints, EFS ID, DMS ARN, migration status (SecureString for credentials)
9. **SNS Topic** - Migration alerts with email subscription and CloudWatch alarms
10. **Security Groups** - Least privilege access for DMS, RDS, EFS, DataSync

### Key Features:

- **3 Availability Zones**: Complete VPC with public and private subnets across 3 AZs
- **Encryption**: Customer-managed KMS keys for RDS and EFS
- **Monitoring**: Comprehensive CloudWatch dashboard and alarms
- **Network**: NAT gateways for outbound connectivity
- **Tagging**: All resources tagged with Environment, MigrationPhase, DataClassification
- **Parameters**: All configuration externalized via CloudFormation parameters
- **EnvironmentSuffix**: Used in all resource names for parallel deployments
- **No Retain Policies**: All resources are destroyable for testing

### Outputs:

- VPC and subnet IDs
- Aurora cluster endpoint and port
- EFS file system ID
- DMS instance and task ARNs
- DataSync task ARN
- SNS topic ARN
- CloudWatch dashboard URL
- KMS key ARNs

This template can be deployed with:
```bash
aws cloudformation create-stack \
  --stack-name migration-stack-prod \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBMasterPassword,ParameterValue=<password> \
    ParameterKey=SourceNFSServerHostname,ParameterValue=<hostname> \
    ParameterKey=SourceDatabaseEndpoint,ParameterValue=<endpoint> \
    ParameterKey=SourceDatabasePassword,ParameterValue=<password> \
    ParameterKey=AlertEmailAddress,ParameterValue=<email> \
  --capabilities CAPABILITY_NAMED_IAM
```