```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Data Lake Infrastructure for Analytics Company - 10TB Daily Processing'

Parameters:
  CompanyName:
    Type: String
    Default: 'dataanalytics'
    Description: 'Company name for resource naming'
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: 'Must contain only lowercase letters and numbers'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment for deployment'

  DataRetentionDays:
    Type: Number
    Default: 2555 # 7 years
    MinValue: 30
    MaxValue: 3650
    Description: 'Data retention period in days'

  EMRInstanceType:
    Type: String
    Default: 'm5.xlarge'
    AllowedValues: ['m5.large', 'm5.xlarge', 'm5.2xlarge', 'm5.4xlarge']
    Description: 'EMR cluster instance type'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'

Conditions:
  IsProduction: !Equals [!Ref Environment, 'prod']
  UseLargeInstances: !Equals [!Ref Environment, 'prod']

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Organization Settings'
        Parameters:
          - CompanyName
          - Environment
      - Label:
          default: 'Data Lake Configuration'
        Parameters:
          - DataRetentionDays
          - EMRInstanceType
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr
    ParameterLabels:
      CompanyName:
        default: 'Company Name'
      Environment:
        default: 'Environment'
      DataRetentionDays:
        default: 'Data Retention (Days)'
      EMRInstanceType:
        default: 'EMR Instance Type'
      VpcCidr:
        default: 'VPC CIDR Block'

Resources:
  # =============================================================================
  # KMS ENCRYPTION KEYS
  # =============================================================================
  RawDataKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${CompanyName} Data Lake Raw Zone Encryption Key'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Glue and Firehose Service
            Effect: Allow
            Principal:
              Service:
                - glue.amazonaws.com
                - firehose.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-raw-kms-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: DataZone
          Value: 'raw'

  RawDataKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${CompanyName}-datalake-raw-${Environment}'
      TargetKeyId: !Ref RawDataKMSKey

  ProcessedDataKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${CompanyName} Data Lake Processed Zone Encryption Key'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Glue Service
            Effect: Allow
            Principal:
              Service: glue.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-processed-kms-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: DataZone
          Value: 'processed'

  ProcessedDataKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${CompanyName}-datalake-processed-${Environment}'
      TargetKeyId: !Ref ProcessedDataKMSKey

  CuratedDataKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${CompanyName} Data Lake Curated Zone Encryption Key'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Athena Service
            Effect: Allow
            Principal:
              Service: athena.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-curated-kms-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: DataZone
          Value: 'curated'

  CuratedDataKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${CompanyName}-datalake-curated-${Environment}'
      TargetKeyId: !Ref CuratedDataKMSKey

  # =============================================================================
  # VPC AND NETWORKING
  # =============================================================================
  DataLakeVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-vpc-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DataLakeVPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-private-subnet-1-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DataLakeVPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-private-subnet-2-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # VPC Endpoints for secure service access
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref DataLakeVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway

  GlueVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref DataLakeVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.glue'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  # =============================================================================
  # S3 DATA LAKE BUCKETS
  # =============================================================================
  RawDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CompanyName}-datalake-raw-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref RawDataKMSKey
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: DataLakeLifecycle
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
              - TransitionInDays: 365
                StorageClass: DEEP_ARCHIVE
            ExpirationInDays: !Ref DataRetentionDays
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt DataValidationLambda.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-raw-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: DataZone
          Value: 'raw'

  ProcessedDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CompanyName}-datalake-processed-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ProcessedDataKMSKey
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: ProcessedDataLifecycle
            Status: Enabled
            Transitions:
              - TransitionInDays: 60
                StorageClass: STANDARD_IA
              - TransitionInDays: 180
                StorageClass: GLACIER
            ExpirationInDays: !Ref DataRetentionDays
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-processed-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: DataZone
          Value: 'processed'

  CuratedDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CompanyName}-datalake-curated-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref CuratedDataKMSKey
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: CuratedDataLifecycle
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: STANDARD_IA
              - TransitionInDays: 365
                StorageClass: GLACIER
            ExpirationInDays: !Ref DataRetentionDays
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-curated-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: DataZone
          Value: 'curated'

  AthenaQueryResultsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CompanyName}-athena-results-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref CuratedDataKMSKey
      LifecycleConfiguration:
        Rules:
          - Id: QueryResultsCleanup
            Status: Enabled
            ExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-athena-results-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  ScriptsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CompanyName}-scripts-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-scripts-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # =============================================================================
  # IAM ROLES AND POLICIES
  # =============================================================================
  GlueExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-glue-execution-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: glue.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole
      Policies:
        - PolicyName: DataLakeAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${RawDataBucket}/*'
                  - !Sub '${ProcessedDataBucket}/*'
                  - !Sub '${CuratedDataBucket}/*'
                  - !Sub '${ScriptsBucket}/*'
                  - !Ref RawDataBucket
                  - !Ref ProcessedDataBucket
                  - !Ref CuratedDataBucket
                  - !Ref ScriptsBucket
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource:
                  - !GetAtt RawDataKMSKey.Arn
                  - !GetAtt ProcessedDataKMSKey.Arn
                  - !GetAtt CuratedDataKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-glue-execution-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  EMRServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-emr-service-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: elasticmapreduce.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceRole
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-emr-service-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  EMRInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${CompanyName}-emr-instance-profile-${Environment}'
      Roles:
        - !Ref EMRInstanceRole

  EMRInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-emr-instance-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceforEC2Role
      Policies:
        - PolicyName: DataLakeAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${RawDataBucket}/*'
                  - !Sub '${ProcessedDataBucket}/*'
                  - !Sub '${CuratedDataBucket}/*'
                  - !Ref RawDataBucket
                  - !Ref ProcessedDataBucket
                  - !Ref CuratedDataBucket
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-emr-instance-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  FirehoseDeliveryRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-firehose-delivery-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: firehose.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FirehoseDeliveryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:AbortMultipartUpload
                  - s3:GetBucketLocation
                  - s3:GetObject
                  - s3:ListBucket
                  - s3:ListBucketMultipartUploads
                  - s3:PutObject
                Resource:
                  - !Ref RawDataBucket
                  - !Sub '${RawDataBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource:
                  - !GetAtt RawDataKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-firehose-delivery-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-lambda-execution-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DataValidationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub '${RawDataBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource:
                  - !GetAtt RawDataKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-lambda-execution-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  DataAnalystRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-data-analyst-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AthenaQueryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - athena:BatchGetQueryExecution
                  - athena:GetQueryExecution
                  - athena:GetQueryResults
                  - athena:GetWorkGroup
                  - athena:ListQueryExecutions
                  - athena:StartQueryExecution
                  - athena:StopQueryExecution
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetBucketLocation
                  - s3:GetObject
                  - s3:ListBucket
                  - s3:PutObject
                Resource:
                  - !Ref AthenaQueryResultsBucket
                  - !Sub '${AthenaQueryResultsBucket}/*'
                  - !Ref CuratedDataBucket
                  - !Sub '${CuratedDataBucket}/*'
              - Effect: Allow
                Action:
                  - glue:GetDatabase
                  - glue:GetDatabases
                  - glue:GetTable
                  - glue:GetTables
                  - glue:GetPartitions
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-data-analyst-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # =============================================================================
  # KINESIS DATA FIREHOSE
  # =============================================================================
  LogIngestionFirehose:
    Type: AWS::KinesisFirehose::DeliveryStream
    Properties:
      DeliveryStreamName: !Sub '${CompanyName}-log-ingestion-${Environment}'
      DeliveryStreamType: DirectPut
      S3DestinationConfiguration:
        BucketARN: !GetAtt RawDataBucket.Arn
        BufferingHints:
          SizeInMBs: 128
          IntervalInSeconds: 60
        CompressionFormat: GZIP
        EncryptionConfiguration:
          KMSEncryptionConfig:
            AWSKMSKeyARN: !GetAtt RawDataKMSKey.Arn
        Prefix: 'logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/'
        ErrorOutputPrefix: 'errors/'
        RoleARN: !GetAtt FirehoseDeliveryRole.Arn
        ProcessingConfiguration:
          Enabled: false
        CloudWatchLoggingOptions:
          Enabled: true
          LogGroupName: !Sub '/aws/kinesisfirehose/${CompanyName}-log-ingestion-${Environment}'

  # =============================================================================
  # LAMBDA FUNCTIONS
  # =============================================================================
  DataValidationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${CompanyName}-data-validation-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      MemorySize: 512
      Code:
        ZipFile: |
          import json
          import boto3
          import csv
          from io import StringIO

          s3 = boto3.client('s3')

          def lambda_handler(event, context):
              """
              Data validation function for incoming data
              """
              for record in event['Records']:
                  bucket = record['s3']['bucket']['name']
                  key = record['s3']['object']['key']
                  
                  try:
                      # Get object from S3
                      response = s3.get_object(Bucket=bucket, Key=key)
                      content = response['Body'].read().decode('utf-8')
                      
                      # Basic validation - check if it's valid CSV/JSON
                      if key.endswith('.csv'):
                          csv_reader = csv.reader(StringIO(content))
                          row_count = sum(1 for row in csv_reader)
                          print(f"Validated CSV file {key} with {row_count} rows")
                      elif key.endswith('.json'):
                          json_data = json.loads(content)
                          print(f"Validated JSON file {key}")
                      
                      # Tag object as validated
                      s3.put_object_tagging(
                          Bucket=bucket,
                          Key=key,
                          Tagging={
                              'TagSet': [
                                  {'Key': 'ValidationStatus', 'Value': 'PASSED'},
                                  {'Key': 'ProcessedTimestamp', 'Value': str(context.aws_request_id)}
                              ]
                          }
                      )
                      
                  except Exception as e:
                      print(f"Validation failed for {key}: {str(e)}")
                      # Tag object as failed validation
                      s3.put_object_tagging(
                          Bucket=bucket,
                          Key=key,
                          Tagging={
                              'TagSet': [
                                  {'Key': 'ValidationStatus', 'Value': 'FAILED'},
                                  {'Key': 'Error', 'Value': str(e)[:256]}
                              ]
                          }
                      )
              
              return {'statusCode': 200, 'body': json.dumps('Data validation completed')}
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-data-validation-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  DataValidationLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DataValidationLambda
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !GetAtt RawDataBucket.Arn

  # =============================================================================
  # GLUE DATA CATALOG AND CRAWLERS
  # =============================================================================
  RawDataDatabase:
    Type: AWS::Glue::Database
    Properties:
      CatalogId: !Ref AWS::AccountId
      DatabaseInput:
        Name: !Sub '${CompanyName}_raw_data_${Environment}'
        Description: 'Raw data zone database for data lake'
        Parameters:
          classification: 'datalake'
          environment: !Ref Environment

  ProcessedDataDatabase:
    Type: AWS::Glue::Database
    Properties:
      CatalogId: !Ref AWS::AccountId
      DatabaseInput:
        Name: !Sub '${CompanyName}_processed_data_${Environment}'
        Description: 'Processed data zone database for data lake'
        Parameters:
          classification: 'datalake'
          environment: !Ref Environment

  CuratedDataDatabase:
    Type: AWS::Glue::Database
    Properties:
      CatalogId: !Ref AWS::AccountId
      DatabaseInput:
        Name: !Sub '${CompanyName}_curated_data_${Environment}'
        Description: 'Curated data zone database for data lake'
        Parameters:
          classification: 'datalake'
          environment: !Ref Environment

  RawDataCrawler:
    Type: AWS::Glue::Crawler
    Properties:
      Name: !Sub '${CompanyName}-raw-data-crawler-${Environment}'
      Role: !GetAtt GlueExecutionRole.Arn
      DatabaseName: !Ref RawDataDatabase
      Targets:
        S3Targets:
          - Path: !Sub 's3://${RawDataBucket}/'
            Exclusions:
              - '**/_temporary/**'
              - '**/_SUCCESS'
      SchemaChangePolicy:
        UpdateBehavior: UPDATE_IN_DATABASE
        DeleteBehavior: DELETE_FROM_DATABASE
      Schedule:
        ScheduleExpression: 'cron(0 2 * * ? *)' # Daily at 2 AM
      Tags:
        Name: !Sub '${CompanyName}-raw-data-crawler-${Environment}'
        Environment: !Ref Environment

  ProcessedDataCrawler:
    Type: AWS::Glue::Crawler
    Properties:
      Name: !Sub '${CompanyName}-processed-data-crawler-${Environment}'
      Role: !GetAtt GlueExecutionRole.Arn
      DatabaseName: !Ref ProcessedDataDatabase
      Targets:
        S3Targets:
          - Path: !Sub 's3://${ProcessedDataBucket}/'
            Exclusions:
              - '**/_temporary/**'
              - '**/_SUCCESS'
      SchemaChangePolicy:
        UpdateBehavior: UPDATE_IN_DATABASE
        DeleteBehavior: DELETE_FROM_DATABASE
      Schedule:
        ScheduleExpression: 'cron(0 3 * * ? *)' # Daily at 3 AM
      Tags:
        Name: !Sub '${CompanyName}-processed-data-crawler-${Environment}'
        Environment: !Ref Environment

  # =============================================================================
  # GLUE ETL JOBS
  # =============================================================================
  RawToProcessedETLJob:
    Type: AWS::Glue::Job
    Properties:
      Name: !Sub '${CompanyName}-raw-to-processed-etl-${Environment}'
      Role: !GetAtt GlueExecutionRole.Arn
      Command:
        Name: glueetl
        ScriptLocation: !Sub 's3://${ScriptsBucket}/etl-scripts/raw-to-processed.py'
        PythonVersion: '3'
      DefaultArguments:
        '--job-language': 'python'
        '--job-bookmark-option': 'job-bookmark-enable'
        '--enable-metrics': 'true'
        '--enable-continuous-cloudwatch-log': 'true'
        '--source-database': !Ref RawDataDatabase
        '--target-database': !Ref ProcessedDataDatabase
        '--source-bucket': !Ref RawDataBucket
        '--target-bucket': !Ref ProcessedDataBucket
      ExecutionProperty:
        MaxConcurrentRuns: 3
      MaxRetries: 3
      GlueVersion: '3.0'
      WorkerType: 'G.1X'
      NumberOfWorkers: !If [IsProduction, 10, 2]
      Timeout: 480 # 8 hours
      Tags:
        Name: !Sub '${CompanyName}-raw-to-processed-etl-${Environment}'
        Environment: !Ref Environment

  ProcessedToCuratedETLJob:
    Type: AWS::Glue::Job
    Properties:
      Name: !Sub '${CompanyName}-processed-to-curated-etl-${Environment}'
      Role: !GetAtt GlueExecutionRole.Arn
      Command:
        Name: glueetl
        ScriptLocation: !Sub 's3://${ScriptsBucket}/etl-scripts/processed-to-curated.py'
        PythonVersion: '3'
      DefaultArguments:
        '--job-language': 'python'
        '--job-bookmark-option': 'job-bookmark-enable'
        '--enable-metrics': 'true'
        '--enable-continuous-cloudwatch-log': 'true'
        '--source-database': !Ref ProcessedDataDatabase
        '--target-database': !Ref CuratedDataDatabase
        '--source-bucket': !Ref ProcessedDataBucket
        '--target-bucket': !Ref CuratedDataBucket
      ExecutionProperty:
        MaxConcurrentRuns: 2
      MaxRetries: 3
      GlueVersion: '3.0'
      WorkerType: 'G.1X'
      NumberOfWorkers: !If [IsProduction, 5, 2]
      Timeout: 240 # 4 hours
      Tags:
        Name: !Sub '${CompanyName}-processed-to-curated-etl-${Environment}'
        Environment: !Ref Environment

  # =============================================================================
  # EMR CLUSTER
  # =============================================================================
  EMRCluster:
    Type: AWS::EMR::Cluster
    Properties:
      Name: !Sub '${CompanyName}-analytics-cluster-${Environment}'
      ReleaseLabel: 'emr-6.9.0'
      Applications:
        - Name: Spark
        - Name: Hadoop
        - Name: Hive
        - Name: Jupyter
      ServiceRole: !Ref EMRServiceRole
      JobFlowRole: !Ref EMRInstanceProfile
      LogUri: !Sub 's3://${ScriptsBucket}/emr-logs/'
      Instances:
        MasterInstanceGroup:
          InstanceCount: 1
          InstanceType: !Ref EMRInstanceType
          Market: ON_DEMAND
        CoreInstanceGroup:
          InstanceCount: !If [IsProduction, 3, 1]
          InstanceType: !Ref EMRInstanceType
          Market: ON_DEMAND
        Ec2SubnetId: !Ref PrivateSubnet1
        AdditionalMasterSecurityGroups:
          - !Ref EMRMasterSecurityGroup
        AdditionalSlaveSecurityGroups:
          - !Ref EMRSlaveSecurityGroup
      Configurations:
        - Classification: spark-defaults
          ConfigurationProperties:
            spark.sql.adaptive.enabled: 'true'
            spark.sql.adaptive.coalescePartitions.enabled: 'true'
            spark.serializer: 'org.apache.spark.serializer.KryoSerializer'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-analytics-cluster-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  EMRMasterSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${CompanyName}-emr-master-sg-${Environment}'
      GroupDescription: 'Security group for EMR master node'
      VpcId: !Ref DataLakeVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref EMRSlaveSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-emr-master-sg-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  EMRSlaveSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${CompanyName}-emr-slave-sg-${Environment}'
      GroupDescription: 'Security group for EMR slave nodes'
      VpcId: !Ref DataLakeVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 0
          ToPort: 65535
          SourceSecurityGroupId: !Ref EMRMasterSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-emr-slave-sg-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # =============================================================================
  # ATHENA WORKGROUP
  # =============================================================================
  AthenaWorkGroup:
    Type: AWS::Athena::WorkGroup
    Properties:
      Name: !Sub '${CompanyName}-analytics-workgroup-${Environment}'
      Description: 'Workgroup for data analytics queries'
      State: ENABLED
      WorkGroupConfiguration:
        ResultConfiguration:
          OutputLocation: !Sub 's3://${AthenaQueryResultsBucket}/'
          EncryptionConfiguration:
            EncryptionOption: SSE_KMS
            KmsKey: !Ref CuratedDataKMSKey
        EnforceWorkGroupConfiguration: true
        PublishCloudWatchMetrics: true
        BytesScannedCutoffPerQuery: 1073741824 # 1GB limit
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-analytics-workgroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # =============================================================================
  # LAKE FORMATION PERMISSIONS
  # =============================================================================
  DataAnalystPermissions:
    Type: AWS::LakeFormation::Permissions
    Properties:
      DataLakePrincipal:
        DataLakePrincipalIdentifier: !GetAtt DataAnalystRole.Arn
      Resource:
        DatabaseResource:
          Name: !Ref CuratedDataDatabase
      Permissions:
        - SELECT
        - DESCRIBE

  # =============================================================================
  # CLOUDWATCH MONITORING
  # =============================================================================
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${CompanyName}-datalake-alerts-${Environment}'
      DisplayName: 'Data Lake Monitoring Alerts'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-datalake-alerts-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  GlueJobFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${CompanyName}-glue-job-failures-${Environment}'
      AlarmDescription: 'Alert when Glue jobs fail'
      MetricName: glue.driver.aggregate.numFailedTasks
      Namespace: AWS/Glue
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: JobName
          Value: !Ref RawToProcessedETLJob

  S3DataIngestionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${CompanyName}-s3-ingestion-rate-${Environment}'
      AlarmDescription: 'Alert on unusual data ingestion patterns'
      MetricName: NumberOfObjects
      Namespace: AWS/S3
      Statistic: Average
      Period: 3600
      EvaluationPeriods: 2
      Threshold: 100
      ComparisonOperator: LessThanThreshold
      AlarmActions:
        - !Ref AlertTopic
      Dimensions:
        - Name: BucketName
          Value: !Ref RawDataBucket
        - Name: StorageType
          Value: AllStorageTypes

  DataLakeDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${CompanyName}-DataLake-Dashboard-${Environment}'
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
                  ["AWS/S3", "BucketSizeBytes", "BucketName", "${RawDataBucket}", "StorageType", "StandardStorage"],
                  [".", ".", ".", "${ProcessedDataBucket}", ".", "."],
                  [".", ".", ".", "${CuratedDataBucket}", ".", "."]
                ],
                "period": 86400,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Data Lake Storage Usage",
                "yAxis": {
                  "left": {
                    "min": 0
                  }
                }
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
                  ["AWS/Glue", "glue.driver.aggregate.numCompletedTasks", "JobName", "${RawToProcessedETLJob}"],
                  [".", "glue.driver.aggregate.numFailedTasks", ".", "."]
                ],
                "period": 3600,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Glue Job Performance"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Athena", "QueryExecutionTime", "WorkGroup", "${AthenaWorkGroup}"],
                  [".", "ProcessedBytes", ".", "."]
                ],
                "period": 3600,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Athena Query Performance"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/KinesisFirehose", "DeliveryToS3.Records", "DeliveryStreamName", "${LogIngestionFirehose}"],
                  [".", "DeliveryToS3.Success", ".", "."]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Data Ingestion via Firehose"
              }
            }
          ]
        }

Outputs:
  # VPC and Networking
  VPCId:
    Description: 'Data Lake VPC ID'
    Value: !Ref DataLakeVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  # S3 Buckets
  RawDataBucketName:
    Description: 'Raw data bucket name'
    Value: !Ref RawDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-RawDataBucket-Name'

  ProcessedDataBucketName:
    Description: 'Processed data bucket name'
    Value: !Ref ProcessedDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-ProcessedDataBucket-Name'

  CuratedDataBucketName:
    Description: 'Curated data bucket name'
    Value: !Ref CuratedDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-CuratedDataBucket-Name'

  AthenaQueryResultsBucketName:
    Description: 'Athena query results bucket name'
    Value: !Ref AthenaQueryResultsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AthenaResults-Name'

  ScriptsBucketName:
    Description: 'Scripts bucket name'
    Value: !Ref ScriptsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ScriptsBucket-Name'

  # KMS Keys
  RawDataKMSKeyId:
    Description: 'Raw data KMS key ID'
    Value: !Ref RawDataKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-RawDataKMS-KeyId'

  ProcessedDataKMSKeyId:
    Description: 'Processed data KMS key ID'
    Value: !Ref ProcessedDataKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-ProcessedDataKMS-KeyId'

  CuratedDataKMSKeyId:
    Description: 'Curated data KMS key ID'
    Value: !Ref CuratedDataKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-CuratedDataKMS-KeyId'

  # Glue Resources
  RawDataDatabaseName:
    Description: 'Raw data Glue database name'
    Value: !Ref RawDataDatabase
    Export:
      Name: !Sub '${AWS::StackName}-RawDatabase-Name'

  ProcessedDataDatabaseName:
    Description: 'Processed data Glue database name'
    Value: !Ref ProcessedDataDatabase
    Export:
      Name: !Sub '${AWS::StackName}-ProcessedDatabase-Name'

  CuratedDataDatabaseName:
    Description: 'Curated data Glue database name'
    Value: !Ref CuratedDataDatabase
    Export:
      Name: !Sub '${AWS::StackName}-CuratedDatabase-Name'

  RawToProcessedETLJobName:
    Description: 'Raw to processed ETL job name'
    Value: !Ref RawToProcessedETLJob
    Export:
      Name: !Sub '${AWS::StackName}-RawToProcessedETL-Name'

  ProcessedToCuratedETLJobName:
    Description: 'Processed to curated ETL job name'
    Value: !Ref ProcessedToCuratedETLJob
    Export:
      Name: !Sub '${AWS::StackName}-ProcessedToCuratedETL-Name'

  # EMR Cluster
  EMRClusterId:
    Description: 'EMR cluster ID'
    Value: !Ref EMRCluster
    Export:
      Name: !Sub '${AWS::StackName}-EMRCluster-ID'

  # Athena
  AthenaWorkGroupName:
    Description: 'Athena workgroup name'
    Value: !Ref AthenaWorkGroup
    Export:
      Name: !Sub '${AWS::StackName}-AthenaWorkGroup-Name'

  # Kinesis Firehose
  LogIngestionFirehoseName:
    Description: 'Log ingestion Firehose delivery stream name'
    Value: !Ref LogIngestionFirehose
    Export:
      Name: !Sub '${AWS::StackName}-LogIngestionFirehose-Name'

  # Lambda Functions
  DataValidationLambdaArn:
    Description: 'Data validation Lambda function ARN'
    Value: !GetAtt DataValidationLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataValidationLambda-Arn'

  # IAM Roles
  GlueExecutionRoleArn:
    Description: 'Glue execution role ARN'
    Value: !GetAtt GlueExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-GlueExecutionRole-Arn'

  DataAnalystRoleArn:
    Description: 'Data analyst role ARN'
    Value: !GetAtt DataAnalystRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataAnalystRole-Arn'

  # Monitoring
  AlertTopicArn:
    Description: 'SNS topic ARN for alerts'
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopic-Arn'

  DashboardURL:
    Description: 'CloudWatch Dashboard URL'
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${CompanyName}-DataLake-Dashboard-${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-Dashboard-URL'
```
