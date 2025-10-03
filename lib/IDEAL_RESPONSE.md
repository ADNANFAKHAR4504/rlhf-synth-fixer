# AWS CloudFormation Template for SaaS Staging Environment

Complete YAML CloudFormation template (TapStack.yml) that implements the SaaS staging environment with data masking capabilities in us-west-1 region:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'SaaS staging environment mirroring production in us-west-1 region'

Parameters:
  ProductionDBSnapshotIdentifier:
    Type: String
    Description: The ARN of the production database snapshot to clone

  VPNCidr:
    Type: String
    Description: CIDR block for VPN access
    Default: '172.16.0.0/16'

  NotificationEmail:
    Type: String
    Description: Email address for cost control alarm notifications
    Default: 'admin@example.com'

  MonthlyCostThreshold:
    Type: Number
    Description: Threshold for monthly cost alarm in USD
    Default: 1000

Resources:
  # ========================================================================
  # NETWORK CONFIGURATION
  # ========================================================================
  StagingVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.25.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: staging-vpc
        - Key: Environment
          Value: staging

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVPC
      AvailabilityZone: !Select [0, !GetAZs us-west-1]
      CidrBlock: 10.25.10.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: staging-private-subnet-1
        - Key: Environment
          Value: staging

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref StagingVPC
      AvailabilityZone: !Select [1, !GetAZs us-west-1]
      CidrBlock: 10.25.20.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: staging-private-subnet-2
        - Key: Environment
          Value: staging

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref StagingVPC
      Tags:
        - Key: Name
          Value: staging-private-route-table
        - Key: Environment
          Value: staging

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

  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      ServiceName: !Sub com.amazonaws.us-west-1.s3
      VpcId: !Ref StagingVPC
      RouteTableIds:
        - !Ref PrivateRouteTable
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket']
            Resource: '*'

  # ========================================================================
  # SECURITY GROUPS
  # ========================================================================
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS Aurora MySQL
      VpcId: !Ref StagingVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: !Ref VPNCidr
      Tags:
        - Key: Name
          Value: staging-db-sg
        - Key: Environment
          Value: staging

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref StagingVPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: staging-lambda-sg
        - Key: Environment
          Value: staging

  # ========================================================================
  # DATABASE CONFIGURATION
  # ========================================================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for Aurora MySQL
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: staging-db-subnet-group
        - Key: Environment
          Value: staging

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: staging/db/credentials
      Description: RDS Aurora MySQL credentials for staging
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: staging

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-mysql
      EngineMode: provisioned
      EngineVersion: 8.0.mysql_aurora.3.03.1
      DBClusterIdentifier: staging-aurora-cluster
      MasterUsername:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref DBSecret,
            ':SecretString:username}}',
          ],
        ]
      MasterUserPassword:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref DBSecret,
            ':SecretString:password}}',
          ],
        ]
      DatabaseName: saasapp
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '02:00-03:00'
      PreferredMaintenanceWindow: 'sun:05:00-sun:06:00'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      StorageEncrypted: true
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: staging-aurora-cluster
        - Key: Environment
          Value: staging

  AuroraDBInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: aurora-mysql
      DBInstanceIdentifier: staging-aurora-instance1
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: db.r5.large
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: staging-aurora-instance1
        - Key: Environment
          Value: staging

  # ========================================================================
  # STORAGE CONFIGURATION
  # ========================================================================
  TestDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub staging-test-data-${AWS::AccountId}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldTestData
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: staging-test-data
        - Key: Environment
          Value: staging

  TestDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TestDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt TestDataBucket.Arn
              - !Sub ${TestDataBucket.Arn}/*
            Condition:
              Bool:
                aws:SecureTransport: false

  # ========================================================================
  # DATA MASKING CONFIGURATION
  # ========================================================================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaRDSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:DescribeDBSnapshots
                  - rds:RestoreDBClusterFromSnapshot
                  - rds:ModifyDBCluster
                  - rds:CreateDBInstance
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                  - rds:DeleteDBInstance
                  - rds:DeleteDBCluster
                  - rds:CreateDBClusterSnapshot
                  - rds:DescribeDBClusterSnapshots
                Resource: '*'
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DBSecret
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt TestDataBucket.Arn
                  - !Sub ${TestDataBucket.Arn}/*
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: 'arn:aws:logs:*:*:*'

  DataMaskingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: staging-data-masking
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import boto3
          import json
          import logging
          import os
          import time
          import pymysql

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def handler(event, context):
              logger.info("Data masking process started")
              
              snapshot_identifier = event.get('snapshot_identifier') or os.environ.get('PRODUCTION_SNAPSHOT_ID')
              if not snapshot_identifier:
                  raise Exception("No snapshot identifier provided")
                  
              try:
                  secrets_client = boto3.client('secretsmanager')
                  secret_name = os.environ['DB_SECRET_NAME']
                  secret_response = secrets_client.get_secret_value(SecretId=secret_name)
                  credentials = json.loads(secret_response['SecretString'])
                  
                  rds_client = boto3.client('rds')
                  temp_cluster_id = f"staging-temp-{int(time.time())}"
                  
                  logger.info(f"Restoring snapshot {snapshot_identifier} to {temp_cluster_id}")
                  response = rds_client.restore_db_cluster_from_snapshot(
                      DBClusterIdentifier=temp_cluster_id,
                      SnapshotIdentifier=snapshot_identifier,
                      Engine='aurora-mysql',
                      VpcSecurityGroupIds=[os.environ['SECURITY_GROUP_ID']],
                      DBSubnetGroupName=os.environ['DB_SUBNET_GROUP_NAME']
                  )
                  
                  temp_instance_id = f"{temp_cluster_id}-instance"
                  rds_client.create_db_instance(
                      DBInstanceIdentifier=temp_instance_id,
                      DBClusterIdentifier=temp_cluster_id,
                      Engine='aurora-mysql',
                      DBInstanceClass='db.r5.large'
                  )
                  
                  logger.info(f"Waiting for DB instance {temp_instance_id} to be available")
                  waiter = rds_client.get_waiter('db_instance_available')
                  waiter.wait(DBInstanceIdentifier=temp_instance_id)
                  
                  cluster_info = rds_client.describe_db_clusters(DBClusterIdentifier=temp_cluster_id)
                  endpoint = cluster_info['DBClusters'][0]['Endpoint']
                  
                  # Connect and perform data masking
                  try:
                      conn = pymysql.connect(
                          host=endpoint,
                          user=credentials['username'],
                          password=credentials['password'],
                          database='saasapp',
                          connect_timeout=10
                      )
                      
                      logger.info("Connected to DB, performing data masking")
                      with conn.cursor() as cur:
                          # Mask email addresses
                          cur.execute("UPDATE users SET email = CONCAT('masked_', MD5(email), '@example.com')")
                          # Mask phone numbers
                          cur.execute("UPDATE users SET phone = CONCAT('+1555', FLOOR(RAND() * 1000000))")
                          # Mask addresses
                          cur.execute("UPDATE users SET address = '123 Test Street, Test City, TS 12345'")
                          # Mask credit card information
                          cur.execute("UPDATE payment_info SET card_number = CONCAT('XXXX-XXXX-XXXX-', RIGHT(card_number, 4))")
                          conn.commit()
                      
                      logger.info("Data masking completed successfully")
                  finally:
                      if 'conn' in locals() and conn:
                          conn.close()
                  
                  # Create masked snapshot
                  masked_snapshot_id = f"staging-masked-{int(time.time())}"
                  logger.info(f"Creating snapshot {masked_snapshot_id} of masked database")
                  rds_client.create_db_cluster_snapshot(
                      DBClusterSnapshotIdentifier=masked_snapshot_id,
                      DBClusterIdentifier=temp_cluster_id
                  )
                  
                  # Wait for snapshot
                  waiter = rds_client.get_waiter('db_cluster_snapshot_available')
                  waiter.wait(DBClusterSnapshotIdentifier=masked_snapshot_id)
                  
                  # Cleanup
                  logger.info(f"Cleaning up temporary database resources")
                  rds_client.delete_db_instance(
                      DBInstanceIdentifier=temp_instance_id,
                      SkipFinalSnapshot=True
                  )
                  
                  waiter = rds_client.get_waiter('db_instance_deleted')
                  waiter.wait(DBInstanceIdentifier=temp_instance_id)
                  
                  rds_client.delete_db_cluster(
                      DBClusterIdentifier=temp_cluster_id,
                      SkipFinalSnapshot=True
                  )
                  
                  return {
                      'status': 'success',
                      'masked_snapshot_id': masked_snapshot_id
                  }
                      
              except Exception as e:
                  logger.error(f"Error during data masking: {str(e)}")
                  raise
      Runtime: python3.10
      Timeout: 900
      MemorySize: 1024
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          DB_SECRET_NAME: !Ref DBSecret
          PRODUCTION_SNAPSHOT_ID: !Ref ProductionDBSnapshotIdentifier
          SECURITY_GROUP_ID: !Ref DBSecurityGroup
          DB_SUBNET_GROUP_NAME: !Ref DBSubnetGroup
      Tags:
        - Key: Name
          Value: staging-data-masking-function
        - Key: Environment
          Value: staging

  # ========================================================================
  # ACCESS CONTROL
  # ========================================================================
  StagingAdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: StagingAdminRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: sts:AssumeRole
            Condition:
              Bool:
                aws:MultiFactorAuthPresent: true
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/ReadOnlyAccess
      Policies:
        - PolicyName: StagingAdminPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:ModifyDBCluster
                  - rds:ModifyDBInstance
                  - rds:RebootDBInstance
                Resource:
                  - !Sub arn:aws:rds:us-west-1:${AWS::AccountId}:cluster:staging-aurora-cluster
                  - !Sub arn:aws:rds:us-west-1:${AWS::AccountId}:db:staging-aurora-instance1
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                  - lambda:GetFunction
                Resource: !GetAtt DataMaskingFunction.Arn
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt TestDataBucket.Arn
                  - !Sub ${TestDataBucket.Arn}/*

  # ========================================================================
  # MONITORING
  # ========================================================================
  CostAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: staging-cost-alarm-topic
      Subscription:
        - Protocol: email
          Endpoint: !Ref NotificationEmail

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: staging-db-high-cpu
      AlarmDescription: Alarm for high CPU utilization in staging database
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref AuroraDBInstance
      AlarmActions:
        - !Ref CostAlarmTopic
      TreatMissingData: notBreaching

  MonthlySpendingAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: staging-monthly-cost-alarm
      AlarmDescription: Alarm if monthly costs exceed threshold
      MetricName: EstimatedCharges
      Namespace: AWS/Billing
      Statistic: Maximum
      Period: 21600
      EvaluationPeriods: 1
      Threshold: !Ref MonthlyCostThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Currency
          Value: USD
      AlarmActions:
        - !Ref CostAlarmTopic
      TreatMissingData: notBreaching

  DailyTransactionsMetricAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: staging-daily-transactions-alarm
      AlarmDescription: Alarm if daily transactions exceed threshold
      MetricName: Transactions
      Namespace: SaaS/Application
      Statistic: Sum
      Period: 86400
      EvaluationPeriods: 1
      Threshold: 6000
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref CostAlarmTopic
      TreatMissingData: notBreaching

Outputs:
  VpcId:
    Description: VPC ID of the staging environment
    Value: !Ref StagingVPC

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2

  AuroraClusterId:
    Description: Aurora MySQL Cluster Identifier
    Value: !Ref AuroraDBCluster

  AuroraClusterEndpoint:
    Description: Aurora MySQL Cluster Endpoint
    Value: !GetAtt AuroraDBCluster.Endpoint.Address

  TestDataBucketName:
    Description: S3 Bucket for test data
    Value: !Ref TestDataBucket

  DataMaskingFunctionName:
    Description: Lambda function for data masking
    Value: !Ref DataMaskingFunction

  DBSecretARN:
    Description: ARN of the secret containing database credentials
    Value: !Ref DBSecret

  StagingAdminRoleARN:
    Description: ARN of the staging admin role requiring MFA
    Value: !GetAtt StagingAdminRole.Arn
```

## Key Implementation Features

### Network Configuration
- VPC with CIDR block 10.25.0.0/16 as specified
- Two private subnets (10.25.10.0/24, 10.25.20.0/24) in different availability zones
- VPC endpoint for S3 to allow secure access from private subnets

### Database and Security
- RDS Aurora MySQL configured to be cloned from production snapshot
- Python 3.10 Lambda function for data masking before restore
- Database credentials securely managed through AWS Secrets Manager
- Comprehensive data masking including email, phone, address, and credit card data

### Access Control
- Security groups restricting database access to VPN CIDR range only
- IAM role with MFA enforcement for privileged operations
- S3 bucket policy enforcing HTTPS-only connections

### Storage and Monitoring
- S3 bucket for test data with versioning, encryption, and lifecycle policies
- CloudWatch alarms for database CPU utilization, monthly cost control, and daily transaction monitoring
- SNS notifications for all alerts

### Data Masking Process
The Lambda function performs these operations:
1. Restores production snapshot to temporary cluster
2. Connects and applies comprehensive data masking transformations
3. Creates masked snapshot for staging use
4. Cleans up temporary resources automatically

This template provides a complete, secure staging environment that mirrors production while protecting sensitive data through automated masking.