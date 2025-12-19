### Reasoning Trace

---

This is a comprehensive request for a CloudFormation template that creates a configuration consistency and compliance monitoring system for a financial services company. Let me break down the key requirements:

1. **Multi-environment support** (Dev, Staging, Prod) in a single AWS region and account
2. **RDS Aurora MySQL cluster** with:
   - Automated backups
   - Point-in-time recovery
   - SSL/TLS connections enabled
3. **S3 buckets** for each environment with:
   - Identical lifecycle policies
   - KMS-based server-side encryption
4. **Lambda functions** (Python 3.9) for:
   - Configuration drift monitoring
   - Environment parity checking
   - Triggered via EventBridge
   - Must complete within 3 minutes
   - Reconciliation functions for auto-sync
5. **SSM Parameter Store** hierarchies:
   - Manage configuration changes
   - SecureString for sensitive values
6. **DynamoDB table** for:
   - Tracking deployment versions
   - Maintaining state records
7. **CloudWatch** components:
   - Dashboards for metrics
   - Alarms for compliance
8. **SNS topics** for alerts
9. **AWS Config rules** for:
   - Tagging strategies
   - Compliance enforcement
10. **IAM roles** following least-privilege principle
11. **Conditional resource creation** based on environment
12. **Production-grade** and **CI/CD ready**

This is quite extensive, so I'll create a comprehensive CloudFormation template that addresses all these requirements. I'll structure it with proper parameters, conditions, mappings, and resources.

### Answer

---

# Configuration Consistency & Compliance Monitoring CloudFormation Template

Below is a comprehensive, production-grade CloudFormation YAML template that implements a complete configuration consistency and compliance monitoring system for a financial services company. The template is fully parameterized and supports multiple environments with automated drift detection, compliance monitoring, and reconciliation capabilities.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Configuration Consistency and Compliance Monitoring System for Financial Services'

# ==========================================
# Parameters
# ==========================================
Parameters:
  Environment:
    Type: String
    Description: Environment name
    AllowedValues:
      - Dev
      - Staging
      - Prod
    Default: Dev

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID for RDS deployment

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Private subnet IDs for RDS deployment (minimum 2 for multi-AZ)

  DBMasterUsername:
    Type: String
    Description: Database master username
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBMasterPassword:
    Type: String
    Description: Database master password
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9!@#$%^&*()_+=-]*'

  AlertEmail:
    Type: String
    Description: Email address for receiving alerts
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'

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
    Dev:
      DBInstanceClass: db.r5.large
      BackupRetention: 7
      MultiAZ: false
      StorageEncrypted: true
      MinCapacity: 1
      MaxCapacity: 2
      S3LifecycleDays: 30
      LogRetentionDays: 7
    Staging:
      DBInstanceClass: db.r5.xlarge
      BackupRetention: 14
      MultiAZ: true
      StorageEncrypted: true
      MinCapacity: 2
      MaxCapacity: 4
      S3LifecycleDays: 90
      LogRetentionDays: 30
    Prod:
      DBInstanceClass: db.r5.2xlarge
      BackupRetention: 30
      MultiAZ: true
      StorageEncrypted: true
      MinCapacity: 4
      MaxCapacity: 8
      S3LifecycleDays: 365
      LogRetentionDays: 90

# ==========================================
# Conditions
# ==========================================
Conditions:
  IsProduction: !Equals [!Ref Environment, Prod]
  IsNotDev: !Not [!Equals [!Ref Environment, Dev]]
  EnableEnhancedMonitoring:
    !Or [!Equals [!Ref Environment, Staging], !Equals [!Ref Environment, Prod]]

# ==========================================
# Resources
# ==========================================
Resources:
  # ==========================================
  # KMS Keys
  # ==========================================
  ConfigKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Environment} configuration encryption'
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
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'

  ConfigKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-${Environment}-config'
      TargetKeyId: !Ref ConfigKMSKey

  # ==========================================
  # S3 Buckets
  # ==========================================
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${OrganizationId}-${Environment}-config-${AWS::AccountId}'
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
            NoncurrentVersionExpirationInDays:
              !FindInMap [EnvironmentConfig, !Ref Environment, S3LifecycleDays]
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
        - Key: Environment
          Value: !Ref Environment
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
    Properties:
      BucketName: !Sub '${OrganizationId}-${Environment}-compliance-reports-${AWS::AccountId}'
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
            ExpirationInDays: !If [IsProduction, 2555, 365] # 7 years for prod, 1 year for others
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Organization
          Value: !Ref OrganizationId
        - Key: Purpose
          Value: ComplianceReporting

  # ==========================================
  # RDS Aurora MySQL Cluster
  # ==========================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for Aurora cluster
      SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: !Sub 'Aurora cluster parameter group for ${Environment}'
      Family: aurora-mysql5.7
      Parameters:
        require_secure_transport: 'ON'
        slow_query_log: '1'
        general_log: '1'
        log_output: 'FILE'

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${Environment}-db-sg'
      GroupDescription: Security group for Aurora cluster
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBClusterIdentifier: !Sub '${AWS::StackName}-${Environment}-aurora-cluster'
      Engine: aurora-mysql
      EngineMode: provisioned
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DatabaseName: configdb
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      StorageEncrypted: true
      KmsKeyId: !Ref ConfigKMSKey
      BackupRetentionPeriod:
        !FindInMap [EnvironmentConfig, !Ref Environment, BackupRetention]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
        - audit
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Organization
          Value: !Ref OrganizationId
        - Key: DataClassification
          Value: !Ref DataClassification

  AuroraInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${Environment}-aurora-instance-1'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass:
        !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      Engine: aurora-mysql
      MonitoringInterval: !If [EnableEnhancedMonitoring, 60, 0]
      MonitoringRoleArn:
        !If [
          EnableEnhancedMonitoring,
          !GetAtt DBMonitoringRole.Arn,
          !Ref 'AWS::NoValue',
        ]
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AuroraInstance2:
    Type: AWS::RDS::DBInstance
    Condition: IsNotDev
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${Environment}-aurora-instance-2'
      DBClusterIdentifier: !Ref AuroraCluster
      DBInstanceClass:
        !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      Engine: aurora-mysql
      MonitoringInterval: !If [EnableEnhancedMonitoring, 60, 0]
      MonitoringRoleArn:
        !If [
          EnableEnhancedMonitoring,
          !GetAtt DBMonitoringRole.Arn,
          !Ref 'AWS::NoValue',
        ]
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DBMonitoringRole:
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

  # ==========================================
  # DynamoDB Table for State Tracking
  # ==========================================
  StateTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-${Environment}-state'
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
        - Key: Environment
          Value: !Ref Environment
        - Key: Organization
          Value: !Ref OrganizationId

  # ==========================================
  # SSM Parameter Store Hierarchy
  # ==========================================
  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${Environment}/database/endpoint'
      Description: Aurora cluster endpoint
      Type: String
      Value: !GetAtt AuroraCluster.Endpoint.Address
      Tags:
        Environment: !Ref Environment

  DBPasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${Environment}/database/password'
      Description: Aurora cluster master password
      Type: SecureString
      Value: !Ref DBMasterPassword
      KeyId: !Ref ConfigKMSKey
      Tags:
        Environment: !Ref Environment

  ConfigBucketParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${Environment}/s3/config-bucket'
      Description: Configuration S3 bucket name
      Type: String
      Value: !Ref ConfigBucket
      Tags:
        Environment: !Ref Environment

  ComplianceBucketParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${OrganizationId}/${Environment}/s3/compliance-bucket'
      Description: Compliance reports S3 bucket name
      Type: String
      Value: !Ref ComplianceReportsBucket
      Tags:
        Environment: !Ref Environment

  # ==========================================
  # Lambda Security Group
  # ==========================================
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${Environment}-lambda-sg'
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==========================================
  # IAM Roles for Lambda Functions
  # ==========================================
  DriftDetectionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${Environment}-drift-detection-role'
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
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                  - 's3:GetBucketVersioning'
                  - 's3:GetBucketEncryption'
                  - 's3:GetBucketLifecycleConfiguration'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
                  - !GetAtt ComplianceReportsBucket.Arn
                  - !Sub '${ComplianceReportsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:Query'
                Resource:
                  - !GetAtt StateTable.Arn
                  - !Sub '${StateTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParametersByPath'
                  - 'ssm:DescribeParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${OrganizationId}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt ConfigKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AlertTopic
              - Effect: Allow
                Action:
                  - 'rds:DescribeDBClusters'
                  - 'rds:DescribeDBInstances'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'config:DescribeConfigurationRecorders'
                  - 'config:DescribeConfigurationRecorderStatus'
                  - 'config:GetComplianceDetailsByConfigRule'
                  - 'config:GetComplianceDetailsByResource'
                Resource: '*'

  ReconciliationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${Environment}-reconciliation-role'
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
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:Query'
                Resource:
                  - !GetAtt StateTable.Arn
                  - !Sub '${StateTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:PutParameter'
                  - 'ssm:GetParametersByPath'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${OrganizationId}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ConfigKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AlertTopic

  # ==========================================
  # Lambda Functions
  # ==========================================
  DriftDetectionFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${Environment}-drift-detection'
      Description: Monitors configuration drift across environments
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt DriftDetectionRole.Arn
      Timeout: 180
      MemorySize: 512
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          STATE_TABLE: !Ref StateTable
          CONFIG_BUCKET: !Ref ConfigBucket
          ALERT_TOPIC: !Ref AlertTopic
          ORG_ID: !Ref OrganizationId
          KMS_KEY_ID: !Ref ConfigKMSKey
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
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
                  # Get all parameters for this environment
                  parameters = get_parameters(f'/{org_id}/{environment}')
                  
                  # Calculate configuration hash
                  config_hash = calculate_hash(parameters)
                  
                  # Compare with other environments
                  drift_detected = check_environment_drift(state_table, environment, config_hash)
                  
                  # Store current state
                  store_state(state_table, environment, config_hash, parameters)
                  
                  # Send metrics
                  send_metrics(environment, drift_detected)
                  
                  # Alert if drift detected
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
                      # Don't include sensitive parameters in comparison
                      if param['Type'] != 'SecureString':
                          params[param['Name']] = param['Value']
              
              return params

          def calculate_hash(parameters):
              sorted_params = json.dumps(parameters, sort_keys=True)
              return hashlib.sha256(sorted_params.encode()).hexdigest()

          def check_environment_drift(table, environment, current_hash):
              drift_info = []
              
              # Get configurations from other environments
              response = table.query(
                  IndexName='GSI1',
                  KeyConditionExpression='GSI1PK = :pk',
                  ExpressionAttributeValues={
                      ':pk': 'CONFIG_HASH'
                  }
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
              
              # Store configuration hash
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
              
              # Store parameter details
              table.put_item(
                  Item={
                      'PK': f'ENV#{environment}',
                      'SK': f'PARAMS#{timestamp}',
                      'Parameters': parameters,
                      'Timestamp': timestamp
                  }
              )

          def send_metrics(environment, drift_detected):
              metric_data = [
                  {
                      'MetricName': 'ConfigurationDrift',
                      'Value': 1 if drift_detected else 0,
                      'Unit': 'Count',
                      'Dimensions': [
                          {'Name': 'Environment', 'Value': environment}
                      ]
                  }
              ]
              
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
                  MetricData=[
                      {
                          'MetricName': 'DriftDetectionErrors',
                          'Value': 1,
                          'Unit': 'Count',
                          'Dimensions': [
                              {'Name': 'Environment', 'Value': environment}
                          ]
                      }
                  ]
              )

  ReconciliationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${Environment}-reconciliation'
      Description: Automatically synchronizes non-sensitive configuration differences
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt ReconciliationRole.Arn
      Timeout: 300
      MemorySize: 1024
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          STATE_TABLE: !Ref StateTable
          CONFIG_BUCKET: !Ref ConfigBucket
          ALERT_TOPIC: !Ref AlertTopic
          ORG_ID: !Ref OrganizationId
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
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
                  # Get drift information from DynamoDB
                  drift_info = get_latest_drift(state_table, environment)
                  
                  if not drift_info:
                      print("No drift detected")
                      return {
                          'statusCode': 200,
                          'body': json.dumps({'message': 'No drift to reconcile'})
                      }
                  
                  # Determine source of truth (Production is always source)
                  source_env = 'Prod' if environment != 'Prod' else None
                  
                  if source_env:
                      # Get production configuration
                      source_params = get_parameters(f'/{org_id}/{source_env}')
                      
                      # Synchronize non-sensitive parameters
                      sync_results = sync_parameters(environment, source_params, org_id)
                      
                      # Log synchronization results
                      log_sync_results(state_table, environment, sync_results)
                      
                      # Send metrics
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
                      return {
                          'statusCode': 200,
                          'body': json.dumps({
                              'message': 'Production environment is source of truth'
                          })
                      }
                  
              except Exception as e:
                  print(f"Error in reconciliation: {str(e)}")
                  send_error_metric(environment)
                  raise

          def get_latest_drift(table, environment):
              response = table.query(
                  KeyConditionExpression='PK = :pk',
                  ExpressionAttributeValues={
                      ':pk': f'ENV#{environment}'
                  },
                  ScanIndexForward=False,
                  Limit=1
              )
              
              if response['Items']:
                  return response['Items'][0]
              return None

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
                  # Only sync non-sensitive parameters
                  if param_info['type'] != 'SecureString':
                      # Transform parameter name for target environment
                      target_name = param_name.replace('/Prod/', f'/{target_env}/')
                      
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
                      'Dimensions': [
                          {'Name': 'Environment', 'Value': environment}
                      ]
                  },
                  {
                      'MetricName': 'ParametersSkipped',
                      'Value': len(results['skipped']),
                      'Unit': 'Count',
                      'Dimensions': [
                          {'Name': 'Environment', 'Value': environment}
                      ]
                  }
              ]
              
              cloudwatch.put_metric_data(
                  Namespace='ConfigCompliance',
                  MetricData=metric_data
              )

          def send_error_metric(environment):
              cloudwatch.put_metric_data(
                  Namespace='ConfigCompliance',
                  MetricData=[
                      {
                          'MetricName': 'ReconciliationErrors',
                          'Value': 1,
                          'Unit': 'Count',
                          'Dimensions': [
                              {'Name': 'Environment', 'Value': environment}
                          ]
                      }
                  ]
              )

  # ==========================================
  # EventBridge Rules
  # ==========================================
  DriftDetectionSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-${Environment}-drift-detection-schedule'
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
      Name: !Sub '${AWS::StackName}-${Environment}-reconciliation-schedule'
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
    Properties:
      TopicName: !Sub '${AWS::StackName}-${Environment}-alerts'
      DisplayName: Configuration Compliance Alerts
      KmsMasterKeyId: !Ref ConfigKMSKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment

  CriticalAlertTopic:
    Type: AWS::SNS::Topic
    Condition: IsProduction
    Properties:
      TopicName: !Sub '${AWS::StackName}-${Environment}-critical-alerts'
      DisplayName: Critical Compliance Alerts
      KmsMasterKeyId: !Ref ConfigKMSKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==========================================
  # AWS Config
  # ==========================================
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${AWS::StackName}-${Environment}-recorder'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
        ResourceTypes:
          - AWS::RDS::DBCluster
          - AWS::RDS::DBInstance
          - AWS::S3::Bucket
          - AWS::Lambda::Function
          - AWS::DynamoDB::Table
          - AWS::IAM::Role

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${AWS::StackName}-${Environment}-delivery'
      S3BucketName: !Ref ComplianceReportsBucket
      SnsTopicARN: !Ref AlertTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${Environment}-config-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Policies:
        - PolicyName: ConfigBucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetBucketAcl'
                Resource:
                  - !GetAtt ComplianceReportsBucket.Arn
                  - !Sub '${ComplianceReportsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref AlertTopic

  # Required Tagging Rule
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-${Environment}-required-tags'
      Description: Ensures all resources have required tags
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters: !Sub |
        {
          "tag1Key": "Environment",
          "tag1Value": "${Environment}",
          "tag2Key": "Organization",
          "tag3Key": "CostCenter"
        }

  # S3 Encryption Rule
  S3EncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-${Environment}-s3-encryption'
      Description: Ensures S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  # RDS Encryption Rule
  RDSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${AWS::StackName}-${Environment}-rds-encryption'
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
      DashboardName: !Sub '${AWS::StackName}-${Environment}-compliance'
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
                  ["AWS/Lambda", "Duration", {"dimension": {"FunctionName": "${DriftDetectionFunction}"}}],
                  [".", ".", {"dimension": {"FunctionName": "${ReconciliationFunction}"}}],
                  [".", "Errors", {"dimension": {"FunctionName": "${DriftDetectionFunction}"}, "stat": "Sum"}],
                  [".", ".", {"dimension": {"FunctionName": "${ReconciliationFunction}"}, "stat": "Sum"}]
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
                  ["AWS/RDS", "DatabaseConnections", {"dimension": {"DBClusterIdentifier": "${AuroraCluster}"}}],
                  [".", "CPUUtilization", {"dimension": {"DBClusterIdentifier": "${AuroraCluster}"}}],
                  [".", "FreeableMemory", {"dimension": {"DBClusterIdentifier": "${AuroraCluster}"}}]
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
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"dimension": {"TableName": "${StateTable}"}}],
                  [".", "ConsumedWriteCapacityUnits", {"dimension": {"TableName": "${StateTable}"}}],
                  [".", "UserErrors", {"dimension": {"TableName": "${StateTable}"}}]
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
      AlarmName: !Sub '${AWS::StackName}-${Environment}-drift-detected'
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
          Value: !Ref Environment

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${Environment}-lambda-errors'
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
      AlarmName: !Sub '${AWS::StackName}-${Environment}-db-connections'
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
      AlarmName: !Sub '${AWS::StackName}-${Environment}-db-cpu'
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
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}-${Environment}-compliance'

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

  ParameterStorePrefix:
    Description: SSM Parameter Store prefix for this environment
    Value: !Sub '/${OrganizationId}/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-parameter-prefix'
```

## Deployment Instructions

### Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Valid VPC** with at least 2 private subnets
3. **Email address** for alert notifications
4. **S3 bucket** for CloudFormation templates (if using nested stacks)

### Deployment Steps

1. **Validate the template:**

```bash
aws cloudformation validate-template \
  --template-body file://config-compliance-stack.yaml
```

2. **Deploy to Development environment:**

```bash
aws cloudformation create-stack \
  --stack-name config-compliance-dev \
  --template-body file://config-compliance-stack.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=Dev \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue=\"subnet-xxxxx,subnet-yyyyy\" \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=AlertEmail,ParameterValue=alerts@yourcompany.com \
  --capabilities CAPABILITY_NAMED_IAM
```

3. **Deploy to Staging environment:**

```bash
aws cloudformation create-stack \
  --stack-name config-compliance-staging \
  --template-body file://config-compliance-stack.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=Staging \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue=\"subnet-xxxxx,subnet-yyyyy\" \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword456! \
    ParameterKey=AlertEmail,ParameterValue=alerts@yourcompany.com \
  --capabilities CAPABILITY_NAMED_IAM
```

4. **Deploy to Production environment:**

```bash
aws cloudformation create-stack \
  --stack-name config-compliance-prod \
  --template-body file://config-compliance-stack.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=Prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue=\"subnet-xxxxx,subnet-yyyyy\" \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword789! \
    ParameterKey=AlertEmail,ParameterValue=alerts@yourcompany.com \
    ParameterKey=DriftCheckInterval,ParameterValue=30 \
  --capabilities CAPABILITY_NAMED_IAM
```

## Key Features Implemented

### 1. **Multi-Environment Support**

- Conditional resource creation based on environment
- Environment-specific configurations via mappings
- Separate resource naming conventions

### 2. **Security & Compliance**

- KMS encryption for all data at rest
- SSL/TLS enforced for RDS connections
- SecureString parameters in SSM
- Least-privilege IAM roles
- AWS Config rules for compliance checking

### 3. **Drift Detection & Reconciliation**

- Automated configuration drift detection
- Environment parity monitoring
- Automatic reconciliation for non-sensitive configs
- Version tracking in DynamoDB

### 4. **Monitoring & Alerting**

- CloudWatch dashboards for visibility
- Multiple alarms for proactive monitoring
- SNS notifications for critical events
- Metrics for all key operations

### 5. **High Availability & Resilience**

- Multi-AZ RDS deployment (Staging/Prod)
- Automated backups with retention policies
- Point-in-time recovery enabled
- DynamoDB with streams and PITR

### 6. **CI/CD Integration Ready**

- Fully parameterized template
- Stack outputs for cross-stack references
- Consistent naming conventions
- Version tracking capabilities

## Post-Deployment Configuration

1. **Confirm SNS subscription** via email
2. **Review CloudWatch dashboard** for initial metrics
3. **Test drift detection** by manually changing a parameter
4. **Verify AWS Config rules** are evaluating resources
5. **Check Lambda function logs** for successful executions

## Maintenance & Operations

### Regular Tasks

- Review CloudWatch alarms and metrics
- Monitor compliance dashboard
- Audit reconciliation logs
- Update parameter store values as needed

### Backup & Recovery

- RDS automated backups occur daily
- DynamoDB PITR enabled for state recovery
- S3 versioning preserves configuration history

This solution provides a comprehensive, secure, and automated configuration consistency and compliance monitoring system that meets financial services requirements while maintaining operational excellence.
