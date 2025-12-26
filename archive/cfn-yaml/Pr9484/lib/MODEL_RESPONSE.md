# Multi-Region Disaster Recovery Payment Processing System

I'll create a comprehensive CloudFormation solution implementing multi-region disaster recovery for your payment processing system. This includes primary infrastructure in ap-southeast-1, DR infrastructure in ap-southeast-2, with cross-region replication and automated failover capabilities.

## File: lib/main-template.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Region Disaster Recovery Payment Processing System - Main Stack'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming
    MinLength: 3
    MaxLength: 10
    AllowedPattern: '^[a-z0-9-]+$'

  DeploymentRegion:
    Type: String
    Description: Primary or DR region
    AllowedValues:
      - primary
      - dr
    Default: primary

  PrimaryRegion:
    Type: String
    Description: Primary AWS Region
    Default: ap-southeast-1

  DRRegion:
    Type: String
    Description: DR AWS Region
    Default: ap-southeast-2

  DBSecretArn:
    Type: String
    Description: ARN of existing Secrets Manager secret for database credentials
    Default: arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:payment-db-credentials

Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/cfn-templates-${EnvironmentSuffix}/network-stack.yaml'
      Parameters:
        EnvironmentSuffix: !Ref EnvironmentSuffix
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/cfn-templates-${EnvironmentSuffix}/database-stack.yaml'
      Parameters:
        EnvironmentSuffix: !Ref EnvironmentSuffix
        VPCId: !GetAtt NetworkStack.Outputs.VPCId
        PrivateSubnet1: !GetAtt NetworkStack.Outputs.PrivateSubnet1
        PrivateSubnet2: !GetAtt NetworkStack.Outputs.PrivateSubnet2
        PrivateSubnet3: !GetAtt NetworkStack.Outputs.PrivateSubnet3
        DBSecretArn: !Ref DBSecretArn
        DeploymentRegion: !Ref DeploymentRegion
        SourceRegion: !Ref PrimaryRegion
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

  ComputeStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - NetworkStack
      - DatabaseStack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/cfn-templates-${EnvironmentSuffix}/compute-stack.yaml'
      Parameters:
        EnvironmentSuffix: !Ref EnvironmentSuffix
        VPCId: !GetAtt NetworkStack.Outputs.VPCId
        PublicSubnet1: !GetAtt NetworkStack.Outputs.PublicSubnet1
        PublicSubnet2: !GetAtt NetworkStack.Outputs.PublicSubnet2
        PrivateSubnet1: !GetAtt NetworkStack.Outputs.PrivateSubnet1
        PrivateSubnet2: !GetAtt NetworkStack.Outputs.PrivateSubnet2
        DBEndpoint: !GetAtt DatabaseStack.Outputs.DBClusterEndpoint
        TransactionQueueUrl: !GetAtt QueueStack.Outputs.TransactionQueueUrl
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

  QueueStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/cfn-templates-${EnvironmentSuffix}/queue-stack.yaml'
      Parameters:
        EnvironmentSuffix: !Ref EnvironmentSuffix
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

  MonitoringStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - DatabaseStack
      - ComputeStack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/cfn-templates-${EnvironmentSuffix}/monitoring-stack.yaml'
      Parameters:
        EnvironmentSuffix: !Ref EnvironmentSuffix
        DBClusterIdentifier: !GetAtt DatabaseStack.Outputs.DBClusterIdentifier
        ALBFullName: !GetAtt ComputeStack.Outputs.ALBFullName
        APIGatewayId: !GetAtt ComputeStack.Outputs.APIGatewayId
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

Outputs:
  VPCId:
    Description: VPC ID
    Value: !GetAtt NetworkStack.Outputs.VPCId
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  DBClusterEndpoint:
    Description: RDS Cluster Endpoint
    Value: !GetAtt DatabaseStack.Outputs.DBClusterEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-DBClusterEndpoint'

  APIEndpoint:
    Description: API Gateway Endpoint
    Value: !GetAtt ComputeStack.Outputs.APIEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-APIEndpoint'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS
    Value: !GetAtt ComputeStack.Outputs.LoadBalancerDNS
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'
```

## File: lib/network-stack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Network Infrastructure for Multi-Region DR Payment Processing'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'payment-igw-${EnvironmentSuffix}'
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
          Value: !Sub 'payment-public-subnet-1-${EnvironmentSuffix}'
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
          Value: !Sub 'payment-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.13.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-public-rt-${EnvironmentSuffix}'
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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-rt-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-rt-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-private-rt-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable3

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable3

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC

  PublicSubnet1:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1

  PublicSubnet2:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2

  PublicSubnet3:
    Description: Public Subnet 3 ID
    Value: !Ref PublicSubnet3

  PrivateSubnet1:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1

  PrivateSubnet2:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2

  PrivateSubnet3:
    Description: Private Subnet 3 ID
    Value: !Ref PrivateSubnet3
```

## File: lib/database-stack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Database Infrastructure for Multi-Region DR Payment Processing'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming

  VPCId:
    Type: String
    Description: VPC ID

  PrivateSubnet1:
    Type: String
    Description: Private Subnet 1 ID

  PrivateSubnet2:
    Type: String
    Description: Private Subnet 2 ID

  PrivateSubnet3:
    Type: String
    Description: Private Subnet 3 ID

  DBSecretArn:
    Type: String
    Description: ARN of existing Secrets Manager secret

  DeploymentRegion:
    Type: String
    Description: Primary or DR region
    AllowedValues:
      - primary
      - dr
    Default: primary

  SourceRegion:
    Type: String
    Description: Source region for read replica
    Default: ap-southeast-1

Conditions:
  IsPrimaryRegion: !Equals [!Ref DeploymentRegion, 'primary']

Resources:
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for payment processing encryption - ${EnvironmentSuffix}'
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
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'payment-kms-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/payment-processing-${EnvironmentSuffix}'
      TargetKeyId: !Ref KMSKey

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'payment-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for payment processing database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'payment-db-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for payment processing database
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/16
          Description: Allow MySQL access from VPC
      Tags:
        - Key: Name
          Value: !Sub 'payment-db-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Aurora MySQL cluster parameter group for payment processing
      Family: aurora-mysql8.0
      Parameters:
        character_set_server: utf8mb4
        collation_server: utf8mb4_unicode_ci
        max_connections: 1000
      Tags:
        - Key: Name
          Value: !Sub 'payment-cluster-params-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBCluster:
    Type: AWS::RDS::DBCluster
    Condition: IsPrimaryRegion
    Properties:
      Engine: aurora-mysql
      EngineVersion: 8.0.mysql_aurora.3.04.0
      DatabaseName: payments
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecretArn}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecretArn}:SecretString:password}}'
      DBClusterIdentifier: !Sub 'payment-cluster-${EnvironmentSuffix}'
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - audit
        - error
        - general
        - slowquery
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

  DBInstance1:
    Type: AWS::RDS::DBInstance
    Condition: IsPrimaryRegion
    Properties:
      DBInstanceIdentifier: !Sub 'payment-instance-1-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref DBCluster
      Engine: aurora-mysql
      EngineVersion: 8.0.mysql_aurora.3.04.0
      DBInstanceClass: db.t4g.medium
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-instance-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBInstance2:
    Type: AWS::RDS::DBInstance
    Condition: IsPrimaryRegion
    Properties:
      DBInstanceIdentifier: !Sub 'payment-instance-2-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref DBCluster
      Engine: aurora-mysql
      EngineVersion: 8.0.mysql_aurora.3.04.0
      DBInstanceClass: db.t4g.medium
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'payment-instance-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SessionTable:
    Type: AWS::DynamoDB::GlobalTable
    Properties:
      TableName: !Sub 'payment-sessions-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: session_id
          AttributeType: S
        - AttributeName: user_id
          AttributeType: S
      KeySchema:
        - AttributeName: session_id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: user-index
          KeySchema:
            - AttributeName: user_id
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref KMSKey
      Replicas:
        - Region: ap-southeast-1
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
          Tags:
            - Key: Environment
              Value: !Ref EnvironmentSuffix
        - Region: ap-southeast-2
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
          Tags:
            - Key: Environment
              Value: !Ref EnvironmentSuffix

  TransactionLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'payment-transaction-logs-${AWS::Region}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: !Sub 'payment-transaction-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ReplicationRole:
    Type: AWS::IAM::Role
    Condition: IsPrimaryRegion
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: S3ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetReplicationConfiguration'
                  - 's3:ListBucket'
                Resource: !GetAtt TransactionLogBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObjectVersionForReplication'
                  - 's3:GetObjectVersionAcl'
                Resource: !Sub '${TransactionLogBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ReplicateObject'
                  - 's3:ReplicateDelete'
                Resource: !Sub 'arn:aws:s3:::payment-transaction-logs-ap-southeast-2-${EnvironmentSuffix}/*'

Outputs:
  DBClusterEndpoint:
    Description: RDS Cluster Endpoint
    Value: !If [IsPrimaryRegion, !GetAtt DBCluster.Endpoint.Address, '']

  DBClusterReadEndpoint:
    Description: RDS Cluster Read Endpoint
    Value: !If [IsPrimaryRegion, !GetAtt DBCluster.ReadEndpoint.Address, '']

  DBClusterIdentifier:
    Description: RDS Cluster Identifier
    Value: !If [IsPrimaryRegion, !Ref DBCluster, '']

  SessionTableName:
    Description: DynamoDB Session Table Name
    Value: !Ref SessionTable

  TransactionLogBucketName:
    Description: S3 Bucket for Transaction Logs
    Value: !Ref TransactionLogBucket

  KMSKeyId:
    Description: KMS Key ID
    Value: !Ref KMSKey
```

## File: lib/queue-stack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Queue Infrastructure for Payment Processing'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming

Resources:
  TransactionDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'payment-transaction-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Name
          Value: !Sub 'payment-transaction-dlq-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  TransactionQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'payment-transaction-queue-${EnvironmentSuffix}'
      VisibilityTimeout: 300
      MessageRetentionPeriod: 345600
      ReceiveMessageWaitTimeSeconds: 20
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt TransactionDLQ.Arn
        maxReceiveCount: 3
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Name
          Value: !Sub 'payment-transaction-queue-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: payment-processing-dr
        - Key: CostCenter
          Value: engineering

  NotificationDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'payment-notification-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Name
          Value: !Sub 'payment-notification-dlq-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NotificationQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'payment-notification-queue-${EnvironmentSuffix}'
      VisibilityTimeout: 60
      MessageRetentionPeriod: 345600
      ReceiveMessageWaitTimeSeconds: 20
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt NotificationDLQ.Arn
        maxReceiveCount: 5
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Name
          Value: !Sub 'payment-notification-queue-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  TransactionQueueUrl:
    Description: Transaction Queue URL
    Value: !Ref TransactionQueue

  TransactionQueueArn:
    Description: Transaction Queue ARN
    Value: !GetAtt TransactionQueue.Arn

  NotificationQueueUrl:
    Description: Notification Queue URL
    Value: !Ref NotificationQueue

  NotificationQueueArn:
    Description: Notification Queue ARN
    Value: !GetAtt NotificationQueue.Arn
```

## File: lib/compute-stack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Compute Infrastructure for Multi-Region DR Payment Processing'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming

  VPCId:
    Type: String
    Description: VPC ID

  PublicSubnet1:
    Type: String
    Description: Public Subnet 1 ID

  PublicSubnet2:
    Type: String
    Description: Public Subnet 2 ID

  PrivateSubnet1:
    Type: String
    Description: Private Subnet 1 ID

  PrivateSubnet2:
    Type: String
    Description: Private Subnet 2 ID

  DBEndpoint:
    Type: String
    Description: Database Cluster Endpoint

  TransactionQueueUrl:
    Type: String
    Description: Transaction Queue URL

Resources:
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'payment-lambda-role-${EnvironmentSuffix}'
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
        - PolicyName: PaymentProcessingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:ReceiveMessage'
                  - 'sqs:DeleteMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !Sub 'arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:payment-*-${EnvironmentSuffix}'
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:Query'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/payment-*-${EnvironmentSuffix}'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:payment-*'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'payment-lambda-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPCId
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'payment-lambda-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  TransactionProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'payment-transaction-processor-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      MemorySize: 512
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          DB_ENDPOINT: !Ref DBEndpoint
          TRANSACTION_QUEUE_URL: !Ref TransactionQueueUrl
          REGION: !Ref AWS::Region
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          from datetime import datetime

          def lambda_handler(event, context):
              """Process payment transactions"""
              print(f"Processing transaction: {json.dumps(event)}")

              try:
                  # Extract transaction data
                  if 'Records' in event:
                      for record in event['Records']:
                          body = json.loads(record['body'])
                          process_transaction(body)
                  else:
                      process_transaction(event)

                  return {
                      'statusCode': 200,
                      'body': json.dumps({'message': 'Transaction processed successfully'})
                  }
              except Exception as e:
                  print(f"Error processing transaction: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': str(e)})
                  }

          def process_transaction(transaction_data):
              """Process individual transaction"""
              transaction_id = transaction_data.get('transaction_id')
              amount = transaction_data.get('amount')
              print(f"Processing transaction {transaction_id} for amount {amount}")

              # Store in DynamoDB (placeholder)
              dynamodb = boto3.resource('dynamodb')
              # Additional processing logic here

              return True
      Tags:
        - Key: Name
          Value: !Sub 'payment-transaction-processor-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PaymentGatewayFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'payment-gateway-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          TRANSACTION_QUEUE_URL: !Ref TransactionQueueUrl
          REGION: !Ref AWS::Region
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import uuid
          from datetime import datetime

          sqs = boto3.client('sqs')

          def lambda_handler(event, context):
              """API Gateway integration for payment processing"""
              print(f"Received payment request: {json.dumps(event)}")

              try:
                  # Parse request body
                  if isinstance(event.get('body'), str):
                      body = json.loads(event['body'])
                  else:
                      body = event.get('body', {})

                  transaction_id = str(uuid.uuid4())

                  # Send to SQS for processing
                  message = {
                      'transaction_id': transaction_id,
                      'amount': body.get('amount'),
                      'currency': body.get('currency', 'USD'),
                      'timestamp': datetime.utcnow().isoformat()
                  }

                  sqs.send_message(
                      QueueUrl=os.environ['TRANSACTION_QUEUE_URL'],
                      MessageBody=json.dumps(message)
                  )

                  return {
                      'statusCode': 202,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'transaction_id': transaction_id,
                          'status': 'accepted'
                      })
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': str(e)})
                  }
      Tags:
        - Key: Name
          Value: !Sub 'payment-gateway-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SQSEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !Sub 'arn:aws:sqs:${AWS::Region}:${AWS::AccountId}:payment-transaction-queue-${EnvironmentSuffix}'
      FunctionName: !Ref TransactionProcessorFunction
      BatchSize: 10
      Enabled: true

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'payment-alb-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS
      Tags:
        - Key: Name
          Value: !Sub 'payment-alb-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'payment-alb-${EnvironmentSuffix}'
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
          Value: !Sub 'payment-alb-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'payment-tg-${EnvironmentSuffix}'
      TargetType: lambda
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub 'payment-tg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  PaymentAPI:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub 'payment-api-${EnvironmentSuffix}'
      ProtocolType: HTTP
      Description: Payment Processing API
      CorsConfiguration:
        AllowOrigins:
          - '*'
        AllowMethods:
          - GET
          - POST
          - OPTIONS
        AllowHeaders:
          - '*'
      Tags:
        Environment: !Ref EnvironmentSuffix
        Project: payment-processing-dr

  PaymentAPIIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref PaymentAPI
      IntegrationType: AWS_PROXY
      IntegrationUri: !GetAtt PaymentGatewayFunction.Arn
      PayloadFormatVersion: '2.0'

  PaymentAPIRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref PaymentAPI
      RouteKey: 'POST /transactions'
      Target: !Sub 'integrations/${PaymentAPIIntegration}'

  PaymentAPIStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref PaymentAPI
      StageName: prod
      AutoDeploy: true
      Tags:
        Environment: !Ref EnvironmentSuffix

  APIGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref PaymentGatewayFunction
      Action: 'lambda:InvokeFunction'
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${PaymentAPI}/*'

Outputs:
  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  ALBFullName:
    Description: ALB Full Name for CloudWatch
    Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  APIEndpoint:
    Description: API Gateway Endpoint
    Value: !Sub 'https://${PaymentAPI}.execute-api.${AWS::Region}.amazonaws.com/prod'

  APIGatewayId:
    Description: API Gateway ID
    Value: !Ref PaymentAPI

  TransactionProcessorArn:
    Description: Transaction Processor Lambda ARN
    Value: !GetAtt TransactionProcessorFunction.Arn
```

## File: lib/monitoring-stack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Monitoring and Alerting for Multi-Region DR Payment Processing'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming

  DBClusterIdentifier:
    Type: String
    Description: RDS Cluster Identifier

  ALBFullName:
    Type: String
    Description: ALB Full Name

  APIGatewayId:
    Type: String
    Description: API Gateway ID

Conditions:
  HasDBCluster: !Not [!Equals [!Ref DBClusterIdentifier, '']]

Resources:
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'payment-alerts-${EnvironmentSuffix}'
      DisplayName: Payment Processing Alerts
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBConnectionCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: HasDBCluster
    Properties:
      AlarmName: !Sub 'payment-db-connections-high-${EnvironmentSuffix}'
      AlarmDescription: Alert when database connections are high
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref DBClusterIdentifier
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  DBCPUUtilizationAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: HasDBCluster
    Properties:
      AlarmName: !Sub 'payment-db-cpu-high-${EnvironmentSuffix}'
      AlarmDescription: Alert when database CPU is high
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref DBClusterIdentifier
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  ALBResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'payment-alb-response-time-high-${EnvironmentSuffix}'
      AlarmDescription: Alert when ALB response time is high
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !Ref ALBFullName
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  ALBHealthyHostCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'payment-alb-healthy-hosts-low-${EnvironmentSuffix}'
      AlarmDescription: Alert when healthy host count is low
      MetricName: HealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !Ref ALBFullName
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: breaching

  API5XXErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'payment-api-5xx-errors-${EnvironmentSuffix}'
      AlarmDescription: Alert when API 5XX error rate is high
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiId
          Value: !Ref APIGatewayId
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  APILatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'payment-api-latency-high-${EnvironmentSuffix}'
      AlarmDescription: Alert when API latency is high
      MetricName: Latency
      Namespace: AWS/ApiGateway
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 500
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiId
          Value: !Ref APIGatewayId
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/payment-processing/${EnvironmentSuffix}'
      RetentionInDays: 30

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub 'payment-audit-trail-${EnvironmentSuffix}'
      S3BucketName: !Ref AuditLogBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuditLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'payment-audit-logs-${AWS::Region}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AuditLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AuditLogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt AuditLogBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${AuditLogBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  DashboardMain:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'payment-processing-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "DatabaseConnections", {"stat": "Average", "label": "DB Connections"}],
                  [".", "CPUUtilization", {"stat": "Average", "label": "DB CPU"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Database Metrics",
                "yAxis": {"left": {"min": 0}}
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                  [".", "RequestCount", {"stat": "Sum"}]
                ],
                "period": 60,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Load Balancer Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "API Requests"}],
                  [".", "Latency", {"stat": "Average", "label": "Latency (ms)"}],
                  [".", "5XXError", {"stat": "Sum", "label": "5XX Errors"}],
                  [".", "4XXError", {"stat": "Sum", "label": "4XX Errors"}]
                ],
                "period": 60,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "API Gateway Metrics"
              }
            }
          ]
        }

Outputs:
  SNSTopicArn:
    Description: SNS Topic ARN for Alerts
    Value: !Ref SNSTopic

  CloudWatchLogGroupName:
    Description: CloudWatch Log Group Name
    Value: !Ref CloudWatchLogGroup

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${DashboardMain}'
```

## File: lib/route53-failover.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Route53 Failover Configuration for Multi-Region DR'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming

  DomainName:
    Type: String
    Description: Domain name for the application
    Default: payment-api.example.com

  PrimaryALBDNS:
    Type: String
    Description: Primary region ALB DNS name

  DRALBName:
    Type: String
    Description: DR region ALB DNS name

  HostedZoneId:
    Type: String
    Description: Route53 Hosted Zone ID

Resources:
  PrimaryHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Type: HTTPS
        ResourcePath: /health
        FullyQualifiedDomainName: !Ref PrimaryALBDNS
        Port: 443
        RequestInterval: 30
        FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub 'payment-primary-health-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DRHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Type: HTTPS
        ResourcePath: /health
        FullyQualifiedDomainName: !Ref DRALBName
        Port: 443
        RequestInterval: 30
        FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub 'payment-dr-health-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrimaryRecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      SetIdentifier: primary
      Failover: PRIMARY
      HealthCheckId: !Ref PrimaryHealthCheck
      AliasTarget:
        HostedZoneId: Z1234567890ABC
        DNSName: !Ref PrimaryALBDNS
        EvaluateTargetHealth: true

  DRRecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      SetIdentifier: dr
      Failover: SECONDARY
      HealthCheckId: !Ref DRHealthCheck
      AliasTarget:
        HostedZoneId: Z0987654321XYZ
        DNSName: !Ref DRALBName
        EvaluateTargetHealth: true

Outputs:
  PrimaryHealthCheckId:
    Description: Primary Region Health Check ID
    Value: !Ref PrimaryHealthCheck

  DRHealthCheckId:
    Description: DR Region Health Check ID
    Value: !Ref DRHealthCheck

  DomainEndpoint:
    Description: Failover Domain Endpoint
    Value: !Ref DomainName
```
