```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Financial Services Disaster Recovery Infrastructure - Main Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - Environment
          - CompanyName
          - CostCenter
      - Label:
          default: 'Regional Configuration'
        Parameters:
          - PrimaryRegion
          - SecondaryRegion
          - PrimaryVpcCidr
          - SecondaryVpcCidr
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DatabaseMasterUsername
          - DatabaseMasterPassword
          - AuroraEngineVersion
      - Label:
          default: 'Backup and Recovery'
        Parameters:
          - BackupRetentionDays
          - BackupWindow
          - MaintenanceWindow
      - Label:
          default: 'Monitoring and Alerting'
        Parameters:
          - AlertEmail
          - HealthCheckUrl

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource tagging and naming'

  CompanyName:
    Type: String
    Default: 'finserv'
    Description: 'Company name for resource naming'

  CostCenter:
    Type: String
    Default: 'trading'
    Description: 'Cost center for billing allocation'

  PrimaryRegion:
    Type: String
    Default: 'us-east-1'
    Description: 'Primary AWS region for deployment'

  SecondaryRegion:
    Type: String
    Default: 'us-west-2'
    Description: 'Secondary AWS region for disaster recovery'

  PrimaryVpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for primary VPC'

  SecondaryVpcCidr:
    Type: String
    Default: '10.1.0.0/16'
    Description: 'CIDR block for secondary VPC'

  DatabaseMasterUsername:
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    Description: 'Master username for Aurora database'

  DatabaseMasterPassword:
    Type: String
    NoEcho: true
    MinLength: 12
    MaxLength: 64
    AllowedPattern: '[a-zA-Z0-9!@#$%^&*()_+=-]*'
    Description: 'Master password for Aurora database (12-64 characters)'

  AuroraEngineVersion:
    Type: String
    Default: '13.7'
    Description: 'Aurora PostgreSQL engine version'

  BackupRetentionDays:
    Type: Number
    Default: 35
    MinValue: 7
    MaxValue: 35
    Description: 'Database backup retention period in days'

  BackupWindow:
    Type: String
    Default: '03:00-04:00'
    Description: 'Daily backup window (UTC)'

  MaintenanceWindow:
    Type: String
    Default: 'sun:04:00-sun:05:00'
    Description: 'Weekly maintenance window (UTC)'

  AlertEmail:
    Type: String
    Description: 'Email address for DR alerts and notifications'

  HealthCheckUrl:
    Type: String
    Default: 'https://api.example.com/health'
    Description: 'Application health check URL for Route 53'

Conditions:
  IsProduction: !Equals [!Ref Environment, 'prod']
  IsPrimaryRegion: !Equals [!Ref 'AWS::Region', !Ref PrimaryRegion]

Resources:
  # KMS Keys for Encryption
  PrimaryKMSKey:
    Type: AWS::KMS::Key
    Condition: IsPrimaryRegion
    Properties:
      Description: !Sub '${CompanyName} Primary Region KMS Key for DR Infrastructure'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow Cross Region Access
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'

  PrimaryKMSKeyAlias:
    Type: AWS::KMS::Alias
    Condition: IsPrimaryRegion
    Properties:
      AliasName: !Sub 'alias/${CompanyName}-${Environment}-primary-dr-key'
      TargetKeyId: !Ref PrimaryKMSKey

  # VPC Infrastructure
  PrimaryVPC:
    Type: AWS::EC2::VPC
    Condition: IsPrimaryRegion
    Properties:
      CidrBlock: !Ref PrimaryVpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Purpose
          Value: 'Primary Region VPC for DR'

  # Internet Gateway
  PrimaryInternetGateway:
    Type: AWS::EC2::InternetGateway
    Condition: IsPrimaryRegion
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-igw'

  PrimaryInternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Condition: IsPrimaryRegion
    Properties:
      InternetGatewayId: !Ref PrimaryInternetGateway
      VpcId: !Ref PrimaryVPC

  # Public Subnets for Load Balancers
  PrimaryPublicSubnet1:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: !Select [0, !Cidr [!Ref PrimaryVpcCidr, 8, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-public-1'
        - Key: Type
          Value: 'Public'

  PrimaryPublicSubnet2:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: !Select [1, !Cidr [!Ref PrimaryVpcCidr, 8, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-public-2'
        - Key: Type
          Value: 'Public'

  # Private Subnets for Applications and Databases
  PrimaryPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: !Select [2, !Cidr [!Ref PrimaryVpcCidr, 8, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-private-1'
        - Key: Type
          Value: 'Private'

  PrimaryPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: !Select [3, !Cidr [!Ref PrimaryVpcCidr, 8, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-private-2'
        - Key: Type
          Value: 'Private'

  # Database Subnets
  PrimaryDatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: !Select [4, !Cidr [!Ref PrimaryVpcCidr, 8, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-db-1'
        - Key: Type
          Value: 'Database'

  PrimaryDatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: !Select [5, !Cidr [!Ref PrimaryVpcCidr, 8, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-db-2'
        - Key: Type
          Value: 'Database'

  # Route Tables
  PrimaryPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-public-rt'

  PrimaryPublicRoute:
    Type: AWS::EC2::Route
    Condition: IsPrimaryRegion
    DependsOn: PrimaryInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PrimaryPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref PrimaryInternetGateway

  PrimaryPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsPrimaryRegion
    Properties:
      RouteTableId: !Ref PrimaryPublicRouteTable
      SubnetId: !Ref PrimaryPublicSubnet1

  PrimaryPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsPrimaryRegion
    Properties:
      RouteTableId: !Ref PrimaryPublicRouteTable
      SubnetId: !Ref PrimaryPublicSubnet2

  # NAT Gateways
  PrimaryNATGateway1EIP:
    Type: AWS::EC2::EIP
    Condition: IsPrimaryRegion
    DependsOn: PrimaryInternetGatewayAttachment
    Properties:
      Domain: vpc

  PrimaryNATGateway1:
    Type: AWS::EC2::NatGateway
    Condition: IsPrimaryRegion
    Properties:
      AllocationId: !GetAtt PrimaryNATGateway1EIP.AllocationId
      SubnetId: !Ref PrimaryPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-nat-1'

  PrimaryPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Condition: IsPrimaryRegion
    Properties:
      VpcId: !Ref PrimaryVPC
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-private-rt-1'

  PrimaryPrivateRoute1:
    Type: AWS::EC2::Route
    Condition: IsPrimaryRegion
    Properties:
      RouteTableId: !Ref PrimaryPrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref PrimaryNATGateway1

  PrimaryPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsPrimaryRegion
    Properties:
      RouteTableId: !Ref PrimaryPrivateRouteTable1
      SubnetId: !Ref PrimaryPrivateSubnet1

  PrimaryDatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsPrimaryRegion
    Properties:
      RouteTableId: !Ref PrimaryPrivateRouteTable1
      SubnetId: !Ref PrimaryDatabaseSubnet1

  # Security Groups
  ApplicationLoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: IsPrimaryRegion
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref PrimaryVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS traffic'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-alb-sg'

  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: IsPrimaryRegion
    Properties:
      GroupDescription: 'Security group for application tier'
      VpcId: !Ref PrimaryVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ApplicationLoadBalancerSecurityGroup
          Description: 'Application port from ALB'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-app-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: IsPrimaryRegion
    Properties:
      GroupDescription: 'Security group for database tier'
      VpcId: !Ref PrimaryVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
          Description: 'PostgreSQL from application'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-db-sg'

  # Aurora DB Subnet Group
  AuroraDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Condition: IsPrimaryRegion
    Properties:
      DBSubnetGroupDescription: 'Subnet group for Aurora Global Database'
      SubnetIds:
        - !Ref PrimaryDatabaseSubnet1
        - !Ref PrimaryDatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-aurora-subnet-group'

  # Aurora Global Database Cluster
  AuroraGlobalCluster:
    Type: AWS::RDS::GlobalCluster
    Condition: IsPrimaryRegion
    Properties:
      GlobalClusterIdentifier: !Sub '${CompanyName}-${Environment}-global-cluster'
      Engine: aurora-postgresql
      EngineVersion: !Ref AuroraEngineVersion
      StorageEncrypted: true

  AuroraPrimaryCluster:
    Type: AWS::RDS::DBCluster
    Condition: IsPrimaryRegion
    Properties:
      DBClusterIdentifier: !Sub '${CompanyName}-${Environment}-primary-cluster'
      GlobalClusterIdentifier: !Ref AuroraGlobalCluster
      Engine: aurora-postgresql
      EngineVersion: !Ref AuroraEngineVersion
      MasterUsername: !Ref DatabaseMasterUsername
      MasterUserPassword: !Ref DatabaseMasterPassword
      DatabaseName: 'tradingapp'
      BackupRetentionPeriod: !Ref BackupRetentionDays
      PreferredBackupWindow: !Ref BackupWindow
      PreferredMaintenanceWindow: !Ref MaintenanceWindow
      StorageEncrypted: true
      KmsKeyId: !Ref PrimaryKMSKey
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref AuroraDBSubnetGroup
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-aurora'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  AuroraPrimaryInstance1:
    Type: AWS::RDS::DBInstance
    Condition: IsPrimaryRegion
    Properties:
      DBInstanceIdentifier: !Sub '${CompanyName}-${Environment}-primary-db-1'
      DBClusterIdentifier: !Ref AuroraPrimaryCluster
      DBInstanceClass: !If [IsProduction, 'db.r6g.2xlarge', 'db.r6g.large']
      Engine: aurora-postgresql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-db-instance-1'

  AuroraPrimaryInstance2:
    Type: AWS::RDS::DBInstance
    Condition: IsPrimaryRegion
    Properties:
      DBInstanceIdentifier: !Sub '${CompanyName}-${Environment}-primary-db-2'
      DBClusterIdentifier: !Ref AuroraPrimaryCluster
      DBInstanceClass: !If [IsProduction, 'db.r6g.2xlarge', 'db.r6g.large']
      Engine: aurora-postgresql
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-primary-db-instance-2'

  # RDS Enhanced Monitoring Role
  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Condition: IsPrimaryRegion
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-rds-monitoring-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  # DynamoDB Global Tables
  TradingDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${CompanyName}-${Environment}-trading-data'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !If
          - IsPrimaryRegion
          - !Ref PrimaryKMSKey
          - !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      AttributeDefinitions:
        - AttributeName: 'trade_id'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'trade_id'
          KeyType: 'HASH'
        - AttributeName: 'timestamp'
          KeyType: 'RANGE'
      GlobalSecondaryIndexes:
        - IndexName: 'TimestampIndex'
          KeySchema:
            - AttributeName: 'timestamp'
              KeyType: 'HASH'
          Projection:
            ProjectionType: 'ALL'
      Replicas:
        - Region: !Ref SecondaryRegion
          GlobalSecondaryIndexes:
            - IndexName: 'TimestampIndex'
              Projection:
                ProjectionType: 'ALL'
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-trading-data-table'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # S3 Buckets for Document Storage
  DocumentsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CompanyName}-${Environment}-documents-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !If
                - IsPrimaryRegion
                - !Ref PrimaryKMSKey
                - !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      IntelligentTieringConfigurations:
        - Id: 'CostOptimization'
          Status: Enabled
          Prefix: 'documents/'
      ReplicationConfiguration: !If
        - IsPrimaryRegion
        - Role: !GetAtt S3ReplicationRole.Arn
          Rules:
            - Id: 'DocumentReplication'
              Status: Enabled
              Prefix: 'documents/'
              Destination:
                Bucket: !Sub 'arn:aws:s3:::${CompanyName}-${Environment}-documents-${AWS::AccountId}-${SecondaryRegion}'
                StorageClass: STANDARD_IA
                EncryptionConfiguration:
                  ReplicaKmsKeyID: !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key'
        - !Ref 'AWS::NoValue'
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt S3ProcessingFunction.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-documents-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # S3 Replication Role
  S3ReplicationRole:
    Type: AWS::IAM::Role
    Condition: IsPrimaryRegion
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-s3-replication-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: 'S3ReplicationPolicy'
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObjectVersionForReplication
                  - s3:GetObjectVersionAcl
                Resource: !Sub '${DocumentsBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref DocumentsBucket
              - Effect: Allow
                Action:
                  - s3:ReplicateObject
                  - s3:ReplicateDelete
                Resource: !Sub 'arn:aws:s3:::${CompanyName}-${Environment}-documents-${AWS::AccountId}-${SecondaryRegion}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource:
                  - !GetAtt PrimaryKMSKey.Arn
                  - !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key'

  # Lambda Functions for DR Orchestration
  DROrchestrationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${CompanyName}-${Environment}-dr-orchestration'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt DROrchestrationRole.Arn
      Timeout: 300
      Environment:
        Variables:
          PRIMARY_REGION: !Ref PrimaryRegion
          SECONDARY_REGION: !Ref SecondaryRegion
          SNS_TOPIC_ARN: !Ref DRNotificationTopic
          AURORA_CLUSTER_ID:
            !If [IsPrimaryRegion, !Ref AuroraPrimaryCluster, '']
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          def lambda_handler(event, context):
              """
              DR Orchestration function for automated failover procedures
              """
              try:
                  # Initialize AWS clients
                  rds_client = boto3.client('rds')
                  route53_client = boto3.client('route53')
                  sns_client = boto3.client('sns')
                  
                  # Get environment variables
                  primary_region = os.environ['PRIMARY_REGION']
                  secondary_region = os.environ['SECONDARY_REGION']
                  sns_topic_arn = os.environ['SNS_TOPIC_ARN']
                  
                  # Determine failover action based on event
                  action = event.get('action', 'health_check')
                  
                  if action == 'failover':
                      # Perform automated failover procedures
                      result = perform_failover(rds_client, route53_client)
                  elif action == 'health_check':
                      # Perform health checks
                      result = perform_health_check(rds_client)
                  elif action == 'test_dr':
                      # Perform DR testing
                      result = perform_dr_test()
                  else:
                      result = {'status': 'error', 'message': 'Unknown action'}
                  
                  # Send notification
                  sns_client.publish(
                      TopicArn=sns_topic_arn,
                      Subject=f'DR Operation: {action}',
                      Message=json.dumps(result, indent=2)
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps(result)
                  }
                  
              except Exception as e:
                  error_msg = f'DR orchestration failed: {str(e)}'
                  print(error_msg)
                  
                  # Send error notification
                  try:
                      sns_client.publish(
                          TopicArn=sns_topic_arn,
                          Subject='DR Operation Failed',
                          Message=error_msg
                      )
                  except:
                      pass
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': error_msg})
                  }

          def perform_failover(rds_client, route53_client):
              """Perform automated failover to secondary region"""
              # Implementation for failover logic
              return {'status': 'success', 'message': 'Failover initiated'}

          def perform_health_check(rds_client):
              """Perform health checks on primary resources"""
              # Implementation for health check logic
              return {'status': 'healthy', 'message': 'All systems operational'}

          def perform_dr_test():
              """Perform DR testing procedures"""
              # Implementation for DR testing logic
              return {'status': 'success', 'message': 'DR test completed'}
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-dr-orchestration-function'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # S3 Processing Function
  S3ProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${CompanyName}-${Environment}-s3-processing'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt S3ProcessingRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3

          def lambda_handler(event, context):
              """
              Process S3 events for document uploads and modifications
              """
              try:
                  for record in event['Records']:
                      bucket = record['s3']['bucket']['name']
                      key = record['s3']['object']['key']
                      event_name = record['eventName']
                      
                      print(f'Processing {event_name} for {key} in bucket {bucket}')
                      
                      # Add your document processing logic here
                      # For example: virus scanning, metadata extraction, etc.
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Successfully processed S3 events')
                  }
                  
              except Exception as e:
                  print(f'Error processing S3 events: {str(e)}')
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': str(e)})
                  }

  # IAM Roles for Lambda Functions
  DROrchestrationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-dr-orchestration-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: 'DROrchestrationPolicy'
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - rds:DescribeDBClusters
                  - rds:FailoverGlobalCluster
                  - rds:ModifyGlobalCluster
                  - route53:GetHealthCheck
                  - route53:ChangeResourceRecordSets
                  - route53:ListResourceRecordSets
                  - sns:Publish
                  - ec2:DescribeInstances
                  - autoscaling:DescribeAutoScalingGroups
                  - autoscaling:UpdateAutoScalingGroup
                Resource: '*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource:
                  - !If [
                      IsPrimaryRegion,
                      !GetAtt PrimaryKMSKey.Arn,
                      !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key',
                    ]

  S3ProcessingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-s3-processing-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: 'S3ProcessingPolicy'
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${DocumentsBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !If
                  - IsPrimaryRegion
                  - !GetAtt PrimaryKMSKey.Arn
                  - !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key'

  # Lambda Permissions for S3
  S3ProcessingFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref S3ProcessingFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub 'arn:aws:s3:::${DocumentsBucket}'

  # SNS Topic for DR Notifications
  DRNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${CompanyName}-${Environment}-dr-notifications'
      DisplayName: 'Disaster Recovery Notifications'
      KmsMasterKeyId: !If
        - IsPrimaryRegion
        - !Ref PrimaryKMSKey
        - !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key'

  DRNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref DRNotificationTopic
      Protocol: email
      Endpoint: !Ref AlertEmail

  # EventBridge Rules for Failover Triggers
  DatabaseFailureRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${CompanyName}-${Environment}-database-failure-rule'
      Description: 'Trigger DR orchestration on database failures'
      EventPattern:
        source:
          - aws.rds
        detail-type:
          - 'RDS DB Instance Event'
          - 'RDS DB Cluster Event'
        detail:
          EventCategories:
            - failure
            - failover
      Targets:
        - Arn: !GetAtt DROrchestrationFunction.Arn
          Id: 'DROrchestrationTarget'
          Input: '{"action": "failover", "source": "rds"}'

  DatabaseFailureRulePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DROrchestrationFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DatabaseFailureRule.Arn

  # Route 53 Health Check and DNS Failover
  ApplicationHealthCheck:
    Type: AWS::Route53::HealthCheck
    Condition: IsPrimaryRegion
    Properties:
      Type: HTTPS
      ResourcePath: '/health'
      FullyQualifiedDomainName: !Ref HealthCheckUrl
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-app-health-check'

  # CloudWatch Dashboards
  DRDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${CompanyName}-${Environment}-dr-dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", "${AuroraPrimaryCluster}"],
                  [".", "CPUUtilization", ".", "."],
                  [".", "ReadLatency", ".", "."],
                  [".", "WriteLatency", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Aurora Database Metrics"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${TradingDataTable}"],
                  [".", "ConsumedWriteCapacityUnits", ".", "."],
                  [".", "UserErrors", ".", "."],
                  [".", "SystemErrors", ".", "."]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "DynamoDB Metrics"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 24,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Duration", "FunctionName", "${DROrchestrationFunction}"],
                  [".", "Errors", ".", "."],
                  [".", "Invocations", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "DR Orchestration Lambda Metrics"
              }
            }
          ]
        }

  # CloudWatch Alarms for DR Metrics
  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: IsPrimaryRegion
    Properties:
      AlarmName: !Sub '${CompanyName}-${Environment}-database-connection-alarm'
      AlarmDescription: 'Monitor Aurora database connections'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraPrimaryCluster
      AlarmActions:
        - !Ref DRNotificationTopic

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: IsPrimaryRegion
    Properties:
      AlarmName: !Sub '${CompanyName}-${Environment}-database-cpu-alarm'
      AlarmDescription: 'Monitor Aurora database CPU utilization'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraPrimaryCluster
      AlarmActions:
        - !Ref DRNotificationTopic

  # Systems Manager Automation Document
  DRRunbookDocument:
    Type: AWS::SSM::Document
    Properties:
      DocumentType: Automation
      Name: !Sub '${CompanyName}-${Environment}-dr-runbook'
      Content:
        schemaVersion: '0.3'
        description: 'Disaster Recovery Automation Runbook'
        assumeRole: !GetAtt SSMAutomationRole.Arn
        parameters:
          FailoverType:
            type: String
            description: 'Type of failover to perform'
            allowedValues:
              - database
              - application
              - full
        mainSteps:
          - name: ValidatePrerequisites
            action: 'aws:executeAwsApi'
            inputs:
              Service: rds
              Api: DescribeDBClusters
              DBClusterIdentifier:
                !If [IsPrimaryRegion, !Ref AuroraPrimaryCluster, '']
          - name: InitiateFailover
            action: 'aws:invokeLambdaFunction'
            inputs:
              FunctionName: !Ref DROrchestrationFunction
              Payload: |
                {
                  "action": "failover",
                  "type": "{{ FailoverType }}"
                }
          - name: ValidateFailover
            action: 'aws:waitForAwsResourceProperty'
            inputs:
              Service: rds
              Api: DescribeDBClusters
              DBClusterIdentifier:
                !If [IsPrimaryRegion, !Ref AuroraPrimaryCluster, '']
              PropertySelector: '$.DBClusters[0].Status'
              DesiredValues:
                - available

  # SSM Automation Role
  SSMAutomationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-ssm-automation-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ssm.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonSSMAutomationRole
      Policies:
        - PolicyName: 'DRAutomationPolicy'
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - rds:*
                  - lambda:InvokeFunction
                  - sns:Publish
                Resource: '*'

  # AWS Backup Plan
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${CompanyName}-${Environment}-dr-backup-plan'
        BackupPlanRule:
          - RuleName: 'DailyBackups'
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 2 * * ? *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 35
              MoveToColdStorageAfterDays: 30
            CopyActions:
              - DestinationBackupVaultArn: !Sub 'arn:aws:backup:${SecondaryRegion}:${AWS::AccountId}:backup-vault:${CompanyName}-${Environment}-dr-backup-vault-${SecondaryRegion}'
                Lifecycle:
                  DeleteAfterDays: 35
                  MoveToColdStorageAfterDays: 30

  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${CompanyName}-${Environment}-dr-backup-vault'
      EncryptionKeyArn: !If
        - IsPrimaryRegion
        - !GetAtt PrimaryKMSKey.Arn
        - !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key'

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${CompanyName}-${Environment}-dr-resources'
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !If [
              IsPrimaryRegion,
              !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraPrimaryCluster}',
              '',
            ]
          - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${TradingDataTable}'

  # Backup Role
  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-backup-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Condition: IsPrimaryRegion
    Properties:
      Name: !Sub '${CompanyName}-${Environment}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ApplicationLoadBalancerSecurityGroup
      Subnets:
        - !Ref PrimaryPublicSubnet1
        - !Ref PrimaryPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-application-load-balancer'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Condition: IsPrimaryRegion
    Properties:
      LaunchTemplateName: !Sub '${CompanyName}-${Environment}-launch-template'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !If [IsProduction, 'c5.xlarge', 'c5.large']
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId:
                !If [
                  IsPrimaryRegion,
                  !Ref PrimaryKMSKey,
                  !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/${CompanyName}-${Environment}-secondary-dr-key',
                ]
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "${CompanyName}/${Environment}/EC2",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/${CompanyName}-${Environment}",
                        "log_stream_name": "{instance_id}/var/log/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${CompanyName}-${Environment}-application-server'
              - Key: Environment
                Value: !Ref Environment
              - Key: CostCenter
                Value: !Ref CostCenter

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Condition: IsPrimaryRegion
    Properties:
      AutoScalingGroupName: !Sub '${CompanyName}-${Environment}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !If [IsProduction, 2, 1]
      MaxSize: !If [IsProduction, 10, 3]
      DesiredCapacity: !If [IsProduction, 2, 1]
      VPCZoneIdentifier:
        - !Ref PrimaryPrivateSubnet1
        - !Ref PrimaryPrivateSubnet2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-asg'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true

  # ALB Target Group
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Condition: IsPrimaryRegion
    Properties:
      Name: !Sub '${CompanyName}-${Environment}-tg'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref PrimaryVPC
      HealthCheckPath: '/health'
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-target-group'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: IsPrimaryRegion
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # EC2 Instance Profile and Role
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Condition: IsPrimaryRegion
    Properties:
      InstanceProfileName: !Sub '${CompanyName}-${Environment}-ec2-profile'
      Roles:
        - !Ref EC2InstanceRole

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Condition: IsPrimaryRegion
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-ec2-role'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: 'ApplicationPermissions'
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt TradingDataTable.Arn
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${DocumentsBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt PrimaryKMSKey.Arn

Outputs:
  # VPC Outputs
  PrimaryVPCId:
    Description: 'Primary VPC ID'
    Value: !If [IsPrimaryRegion, !Ref PrimaryVPC, '']
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryVPCId'

  PrimaryPrivateSubnet1Id:
    Description: 'Primary Private Subnet 1 ID'
    Value: !If [IsPrimaryRegion, !Ref PrimaryPrivateSubnet1, '']
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryPrivateSubnet1Id'

  PrimaryPrivateSubnet2Id:
    Description: 'Primary Private Subnet 2 ID'
    Value: !If [IsPrimaryRegion, !Ref PrimaryPrivateSubnet2, '']
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryPrivateSubnet2Id'

  # Database Outputs
  AuroraGlobalClusterIdentifier:
    Description: 'Aurora Global Cluster Identifier'
    Value: !If [IsPrimaryRegion, !Ref AuroraGlobalCluster, '']
    Export:
      Name: !Sub '${AWS::StackName}-AuroraGlobalClusterIdentifier'

  AuroraPrimaryClusterEndpoint:
    Description: 'Aurora Primary Cluster Endpoint'
    Value:
      !If [IsPrimaryRegion, !GetAtt AuroraPrimaryCluster.Endpoint.Address, '']
    Export:
      Name: !Sub '${AWS::StackName}-AuroraPrimaryClusterEndpoint'

  AuroraPrimaryClusterReadEndpoint:
    Description: 'Aurora Primary Cluster Read Endpoint'
    Value:
      !If [
        IsPrimaryRegion,
        !GetAtt AuroraPrimaryCluster.ReadEndpoint.Address,
        '',
      ]
    Export:
      Name: !Sub '${AWS::StackName}-AuroraPrimaryClusterReadEndpoint'

  # DynamoDB Outputs
  TradingDataTableName:
    Description: 'Trading Data Table Name'
    Value: !Ref TradingDataTable
    Export:
      Name: !Sub '${AWS::StackName}-TradingDataTableName'

  TradingDataTableArn:
    Description: 'Trading Data Table ARN'
    Value: !GetAtt TradingDataTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TradingDataTableArn'

  # S3 Outputs
  DocumentsBucketName:
    Description: 'Documents Bucket Name'
    Value: !Ref DocumentsBucket
    Export:
      Name: !Sub '${AWS::StackName}-DocumentsBucketName'

  DocumentsBucketArn:
    Description: 'Documents Bucket ARN'
    Value: !GetAtt DocumentsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DocumentsBucketArn'

  # Lambda Outputs
  DROrchestrationFunctionArn:
    Description: 'DR Orchestration Lambda Function ARN'
    Value: !GetAtt DROrchestrationFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DROrchestrationFunctionArn'

  # SNS Outputs
  DRNotificationTopicArn:
    Description: 'DR Notification Topic ARN'
    Value: !Ref DRNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-DRNotificationTopicArn'

  # Load Balancer Outputs
  ApplicationLoadBalancerDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !If [IsPrimaryRegion, !GetAtt ApplicationLoadBalancer.DNSName, '']
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLoadBalancerDNSName'

  ApplicationLoadBalancerArn:
    Description: 'Application Load Balancer ARN'
    Value: !If [IsPrimaryRegion, !Ref ApplicationLoadBalancer, '']
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLoadBalancerArn'

  # KMS Outputs
  PrimaryKMSKeyId:
    Description: 'Primary KMS Key ID'
    Value: !If [IsPrimaryRegion, !Ref PrimaryKMSKey, '']
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryKMSKeyId'

  PrimaryKMSKeyArn:
    Description: 'Primary KMS Key ARN'
    Value: !If [IsPrimaryRegion, !GetAtt PrimaryKMSKey.Arn, '']
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryKMSKeyArn'

  # Backup Outputs
  BackupPlanId:
    Description: 'Backup Plan ID'
    Value: !Ref BackupPlan
    Export:
      Name: !Sub '${AWS::StackName}-BackupPlanId'

  BackupVaultName:
    Description: 'Backup Vault Name'
    Value: !Ref BackupVault
    Export:
      Name: !Sub '${AWS::StackName}-BackupVaultName'

  # Health Check Outputs
  ApplicationHealthCheckId:
    Description: 'Application Health Check ID'
    Value: !If [IsPrimaryRegion, !Ref ApplicationHealthCheck, '']
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationHealthCheckId'

  # Systems Manager Outputs
  DRRunbookDocumentName:
    Description: 'DR Runbook Document Name'
    Value: !Ref DRRunbookDocument
    Export:
      Name: !Sub '${AWS::StackName}-DRRunbookDocumentName'
```
