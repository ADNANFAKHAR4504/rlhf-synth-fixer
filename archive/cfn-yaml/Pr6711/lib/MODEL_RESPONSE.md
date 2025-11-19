### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template for a financial data processing pipeline. Let me break down the requirements:

1. **Data Ingestion**:
   - Kinesis Data Streams with 10 shards
   - Handle JSON formatted market feeds (trades, order books, market depth)

2. **Storage**:
   - S3 data lake with three buckets: raw, processed, archived
   - Lifecycle policies to transition to Glacier after 90 days
   - Versioning enabled for audit trails

3. **Data Processing**:
   - AWS Glue crawlers for cataloging
   - Glue ETL jobs for JSON to Parquet transformation
   - Lambda functions for data validation
   - Dead letter queues for failed processing

4. **Metadata & Monitoring**:
   - DynamoDB tables (on-demand) for job details and data lineage
   - CloudWatch dashboards for metrics
   - SNS topics for alerts

5. **Security & Compliance**:
   - KMS encryption for data at rest
   - IAM roles with least privilege
   - Cross-account access
   - VPC endpoints for private connectivity
   - Reserved concurrent executions for Lambda

This is a complex template that will be quite large. I'll structure it properly with all the required components.
### Answer 
---

# Financial Data Processing Pipeline CloudFormation Template

Below is a comprehensive CloudFormation template that deploys a production-ready financial analytics data processing pipeline. This template implements all the specified requirements including real-time streaming, batch processing, security controls, and monitoring capabilities.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Financial Analytics Data Processing Pipeline - Real-time market data processing with comprehensive security and monitoring'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment name for resource tagging'
  
  DataConsumerAccountId:
    Type: String
    Description: 'AWS Account ID for cross-account data access'
    Default: ''
  
  AlertEmail:
    Type: String
    Description: 'Email address for pipeline alerts'
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'
  
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: 'VPC ID for VPC endpoints'
  
  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: 'Subnet IDs for VPC endpoints (minimum 2 for HA)'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - Environment
          - AlertEmail
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcId
          - SubnetIds
      - Label:
          default: "Security Configuration"
        Parameters:
          - DataConsumerAccountId

Resources:
  # ======================
  # KMS Encryption Keys
  # ======================
  DataEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for encrypting financial data at rest'
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
                - kinesis.amazonaws.com
                - glue.amazonaws.com
                - lambda.amazonaws.com
                - dynamodb.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
          - Sid: Allow cross-account access if configured
            Effect: Allow
            Principal:
              AWS: !If 
                - HasDataConsumerAccount
                - !Sub 'arn:aws:iam::${DataConsumerAccountId}:root'
                - !Ref AWS::NoValue
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition: !If
              - HasDataConsumerAccount
              - StringEquals:
                  'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
              - !Ref AWS::NoValue
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Financial Data Encryption'

  DataEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/financial-pipeline-${Environment}'
      TargetKeyId: !Ref DataEncryptionKey

  # ======================
  # S3 Buckets
  # ======================
  RawDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'financial-raw-data-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 365
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt DataValidationFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: 'market-data/'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: DataClassification
          Value: 'Confidential'

  ProcessedDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'financial-processed-data-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: DataClassification
          Value: 'Confidential'

  ArchivedDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'financial-archived-data-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: GlacierDeepArchive
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
              - StorageClass: DEEP_ARCHIVE
                TransitionInDays: 365
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: DataClassification
          Value: 'Archive'

  # S3 Bucket Policies for Cross-Account Access
  ProcessedDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: HasDataConsumerAccount
    Properties:
      Bucket: !Ref ProcessedDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: CrossAccountReadAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${DataConsumerAccountId}:root'
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt ProcessedDataBucket.Arn
              - !Sub '${ProcessedDataBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  # ======================
  # Kinesis Data Stream
  # ======================
  MarketDataStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub 'financial-market-stream-${Environment}'
      ShardCount: 10
      RetentionPeriodHours: 168  # 7 days
      StreamEncryption:
        EncryptionType: KMS
        KeyId: !Ref DataEncryptionKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Real-time Market Data Ingestion'

  # ======================
  # DynamoDB Tables
  # ======================
  ProcessingJobTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'processing-jobs-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: JobId
          AttributeType: S
        - AttributeName: Timestamp
          AttributeType: N
        - AttributeName: Status
          AttributeType: S
      KeySchema:
        - AttributeName: JobId
          KeyType: HASH
        - AttributeName: Timestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: StatusIndex
          KeySchema:
            - AttributeName: Status
              KeyType: HASH
            - AttributeName: Timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref DataEncryptionKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DataLineageTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'data-lineage-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: DatasetId
          AttributeType: S
        - AttributeName: ProcessingTimestamp
          AttributeType: N
        - AttributeName: SourceLocation
          AttributeType: S
      KeySchema:
        - AttributeName: DatasetId
          KeyType: HASH
        - AttributeName: ProcessingTimestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: SourceIndex
          KeySchema:
            - AttributeName: SourceLocation
              KeyType: HASH
            - AttributeName: ProcessingTimestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref DataEncryptionKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ======================
  # IAM Roles
  # ======================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'financial-lambda-role-${Environment}'
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
        - PolicyName: DataProcessingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3Access
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource:
                  - !Sub '${RawDataBucket.Arn}/*'
                  - !Sub '${ProcessedDataBucket.Arn}/*'
              - Sid: S3ListBucket
                Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt RawDataBucket.Arn
                  - !GetAtt ProcessedDataBucket.Arn
              - Sid: DynamoDBAccess
                Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:Query'
                Resource:
                  - !GetAtt ProcessingJobTable.Arn
                  - !GetAtt DataLineageTable.Arn
                  - !Sub '${ProcessingJobTable.Arn}/index/*'
                  - !Sub '${DataLineageTable.Arn}/index/*'
              - Sid: KinesisAccess
                Effect: Allow
                Action:
                  - 'kinesis:GetRecords'
                  - 'kinesis:GetShardIterator'
                  - 'kinesis:DescribeStream'
                  - 'kinesis:ListStreams'
                Resource: !GetAtt MarketDataStream.Arn
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt DataEncryptionKey.Arn
              - Sid: SQSAccess
                Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:ReceiveMessage'
                  - 'sqs:DeleteMessage'
                Resource: !GetAtt ValidationDeadLetterQueue.Arn
              - Sid: CloudWatchMetrics
                Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
              - Sid: ExplicitDenyUnencryptedUploads
                Effect: Deny
                Action:
                  - 's3:PutObject'
                Resource:
                  - !Sub '${RawDataBucket.Arn}/*'
                  - !Sub '${ProcessedDataBucket.Arn}/*'
                  - !Sub '${ArchivedDataBucket.Arn}/*'
                Condition:
                  StringNotEquals:
                    's3:x-amz-server-side-encryption': 'aws:kms'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  GlueServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'financial-glue-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: glue.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole'
      Policies:
        - PolicyName: GlueDataAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3DataAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource:
                  - !Sub '${RawDataBucket.Arn}/*'
                  - !Sub '${ProcessedDataBucket.Arn}/*'
                  - !Sub '${ArchivedDataBucket.Arn}/*'
              - Sid: S3ListAccess
                Effect: Allow
                Action:
                  - 's3:ListBucket'
                  - 's3:GetBucketLocation'
                Resource:
                  - !GetAtt RawDataBucket.Arn
                  - !GetAtt ProcessedDataBucket.Arn
                  - !GetAtt ArchivedDataBucket.Arn
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                  - 'kms:CreateGrant'
                Resource: !GetAtt DataEncryptionKey.Arn
              - Sid: DynamoDBLogging
                Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                Resource:
                  - !GetAtt ProcessingJobTable.Arn
                  - !GetAtt DataLineageTable.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  KinesisAnalyticsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'financial-kinesis-analytics-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: kinesisanalytics.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: KinesisAnalyticsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: KinesisStreamAccess
                Effect: Allow
                Action:
                  - 'kinesis:DescribeStream'
                  - 'kinesis:GetShardIterator'
                  - 'kinesis:GetRecords'
                  - 'kinesis:ListShards'
                Resource: !GetAtt MarketDataStream.Arn
              - Sid: S3OutputAccess
                Effect: Allow
                Action:
                  - 's3:PutObject'
                Resource: !Sub '${RawDataBucket.Arn}/*'
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt DataEncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ======================
  # Lambda Functions
  # ======================
  DataValidationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'data-validation-${Environment}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      ReservedConcurrentExecutions: 50
      Timeout: 300
      MemorySize: 1024
      Environment:
        Variables:
          PROCESSING_TABLE: !Ref ProcessingJobTable
          LINEAGE_TABLE: !Ref DataLineageTable
          DLQ_URL: !Ref ValidationDeadLetterQueue
          PROCESSED_BUCKET: !Ref ProcessedDataBucket
      DeadLetterConfig:
        TargetArn: !GetAtt ValidationDeadLetterQueue.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import uuid
          from decimal import Decimal
          
          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          sqs = boto3.client('sqs')
          cloudwatch = boto3.client('cloudwatch')
          
          def validate_market_data_schema(data):
              """Validate market data against predefined schema"""
              required_fields = ['symbol', 'price', 'volume', 'timestamp', 'exchange']
              
              for field in required_fields:
                  if field not in data:
                      return False, f"Missing required field: {field}"
              
              # Validate data types and ranges
              if not isinstance(data['price'], (int, float)) or data['price'] <= 0:
                  return False, "Invalid price value"
              
              if not isinstance(data['volume'], (int, float)) or data['volume'] < 0:
                  return False, "Invalid volume value"
              
              return True, "Valid"
          
          def handler(event, context):
              processing_table = dynamodb.Table(os.environ['PROCESSING_TABLE'])
              lineage_table = dynamodb.Table(os.environ['LINEAGE_TABLE'])
              
              for record in event['Records']:
                  bucket = record['s3']['bucket']['name']
                  key = record['s3']['object']['key']
                  job_id = str(uuid.uuid4())
                  
                  try:
                      # Get object from S3
                      response = s3_client.get_object(Bucket=bucket, Key=key)
                      data = json.loads(response['Body'].read())
                      
                      # Validate schema
                      is_valid, message = validate_market_data_schema(data)
                      
                      if is_valid:
                          # Process valid data
                          processing_table.put_item(
                              Item={
                                  'JobId': job_id,
                                  'Timestamp': Decimal(str(datetime.now().timestamp())),
                                  'Status': 'SUCCESS',
                                  'SourceFile': f"s3://{bucket}/{key}",
                                  'Message': message
                              }
                          )
                          
                          # Update lineage
                          lineage_table.put_item(
                              Item={
                                  'DatasetId': job_id,
                                  'ProcessingTimestamp': Decimal(str(datetime.now().timestamp())),
                                  'SourceLocation': f"s3://{bucket}/{key}",
                                  'TargetLocation': f"s3://{os.environ['PROCESSED_BUCKET']}/{key}",
                                  'TransformationType': 'VALIDATION'
                              }
                          )
                          
                          # Send success metric
                          cloudwatch.put_metric_data(
                              Namespace='FinancialPipeline',
                              MetricData=[
                                  {
                                      'MetricName': 'ValidatedRecords',
                                      'Value': 1,
                                      'Unit': 'Count'
                                  }
                              ]
                          )
                      else:
                          # Send to DLQ for invalid data
                          sqs.send_message(
                              QueueUrl=os.environ['DLQ_URL'],
                              MessageBody=json.dumps({
                                  'jobId': job_id,
                                  'source': f"s3://{bucket}/{key}",
                                  'error': message,
                                  'timestamp': datetime.now().isoformat()
                              })
                          )
                          
                          # Send failure metric
                          cloudwatch.put_metric_data(
                              Namespace='FinancialPipeline',
                              MetricData=[
                                  {
                                      'MetricName': 'ValidationFailures',
                                      'Value': 1,
                                      'Unit': 'Count'
                                  }
                              ]
                          )
                          
                  except Exception as e:
                      print(f"Error processing {key}: {str(e)}")
                      
                      # Log error to DynamoDB
                      processing_table.put_item(
                          Item={
                              'JobId': job_id,
                              'Timestamp': Decimal(str(datetime.now().timestamp())),
                              'Status': 'ERROR',
                              'SourceFile': f"s3://{bucket}/{key}",
                              'Message': str(e)
                          }
                      )
                      
                      raise
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Processing complete')
              }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda permission for S3 to invoke
  DataValidationFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt DataValidationFunction.Arn
      Action: 'lambda:InvokeFunction'
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !GetAtt RawDataBucket.Arn

  # Kinesis Consumer Lambda
  KinesisConsumerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'kinesis-consumer-${Environment}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      ReservedConcurrentExecutions: 100
      Timeout: 60
      MemorySize: 512
      Environment:
        Variables:
          RAW_BUCKET: !Ref RawDataBucket
          PROCESSING_TABLE: !Ref ProcessingJobTable
      Code:
        ZipFile: |
          import json
          import boto3
          import base64
          import os
          from datetime import datetime
          import uuid
          
          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          
          def handler(event, context):
              processing_table = dynamodb.Table(os.environ['PROCESSING_TABLE'])
              
              for record in event['Records']:
                  try:
                      # Decode Kinesis data
                      payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
                      data = json.loads(payload)
                      
                      # Generate S3 key with partitioning
                      now = datetime.now()
                      partition_key = f"market-data/year={now.year}/month={now.month:02d}/day={now.day:02d}/hour={now.hour:02d}"
                      file_name = f"{uuid.uuid4()}.json"
                      s3_key = f"{partition_key}/{file_name}"
                      
                      # Write to S3
                      s3_client.put_object(
                          Bucket=os.environ['RAW_BUCKET'],
                          Key=s3_key,
                          Body=json.dumps(data),
                          ServerSideEncryption='aws:kms'
                      )
                      
                      # Log processing
                      processing_table.put_item(
                          Item={
                              'JobId': str(uuid.uuid4()),
                              'Timestamp': int(now.timestamp()),
                              'Status': 'INGESTED',
                              'SourceFile': f"kinesis://{record['kinesis']['sequenceNumber']}",
                              'Message': f"Written to s3://{os.environ['RAW_BUCKET']}/{s3_key}"
                          }
                      )
                      
                  except Exception as e:
                      print(f"Error processing record: {str(e)}")
                      raise
              
              return {'statusCode': 200}
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Event Source Mapping for Kinesis
  KinesisEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt MarketDataStream.Arn
      FunctionName: !GetAtt KinesisConsumerFunction.Arn
      StartingPosition: LATEST
      MaximumBatchingWindowInSeconds: 10
      ParallelizationFactor: 10
      MaximumRecordAgeInSeconds: 3600
      BisectBatchOnFunctionError: true
      MaximumRetryAttempts: 3

  # ======================
  # SQS Dead Letter Queue
  # ======================
  ValidationDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'validation-dlq-${Environment}'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: !Ref DataEncryptionKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Failed Data Validation'

  # ======================
  # Glue Resources
  # ======================
  GlueDatabase:
    Type: AWS::Glue::Database
    Properties:
      CatalogId: !Ref AWS::AccountId
      DatabaseInput:
        Name: !Sub 'financial_data_${Environment}'
        Description: 'Financial market data catalog'

  RawDataCrawler:
    Type: AWS::Glue::Crawler
    Properties:
      Name: !Sub 'raw-data-crawler-${Environment}'
      Role: !GetAtt GlueServiceRole.Arn
      DatabaseName: !Ref GlueDatabase
      Targets:
        S3Targets:
          - Path: !Sub 's3://${RawDataBucket}/market-data/'
      SchemaChangePolicy:
        UpdateBehavior: UPDATE_IN_DATABASE
        DeleteBehavior: LOG
      Schedule:
        ScheduleExpression: 'rate(1 hour)'
      Tags:
        Environment: !Ref Environment

  ProcessedDataCrawler:
    Type: AWS::Glue::Crawler
    Properties:
      Name: !Sub 'processed-data-crawler-${Environment}'
      Role: !GetAtt GlueServiceRole.Arn
      DatabaseName: !Ref GlueDatabase
      Targets:
        S3Targets:
          - Path: !Sub 's3://${ProcessedDataBucket}/parquet/'
      SchemaChangePolicy:
        UpdateBehavior: UPDATE_IN_DATABASE
        DeleteBehavior: LOG
      Schedule:
        ScheduleExpression: 'rate(1 hour)'
      Tags:
        Environment: !Ref Environment

  JsonToParquetJob:
    Type: AWS::Glue::Job
    Properties:
      Name: !Sub 'json-to-parquet-${Environment}'
      Role: !GetAtt GlueServiceRole.Arn
      Command:
        Name: glueetl
        ScriptLocation: !Sub 's3://${GlueScriptsBucket}/json_to_parquet.py'
        PythonVersion: '3'
      DefaultArguments:
        '--job-bookmark-option': 'job-bookmark-enable'
        '--enable-metrics': ''
        '--enable-continuous-cloudwatch-log': 'true'
        '--enable-spark-ui': 'true'
        '--spark-event-logs-path': !Sub 's3://${GlueScriptsBucket}/spark-logs/'
        '--TempDir': !Sub 's3://${GlueScriptsBucket}/temp/'
        '--source_database': !Ref GlueDatabase
        '--source_table': 'market_data'
        '--target_path': !Sub 's3://${ProcessedDataBucket}/parquet/'
        '--encryption-type': 'sse-kms'
        '--kms-key-id': !Ref DataEncryptionKey
      ExecutionProperty:
        MaxConcurrentRuns: 2
      GlueVersion: '3.0'
      MaxRetries: 1
      Timeout: 2880  # 48 hours
      NumberOfWorkers: 10
      WorkerType: G.2X
      Tags:
        Environment: !Ref Environment

  # Glue Scripts Bucket
  GlueScriptsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub 'glue-scripts-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ======================
  # VPC Endpoints
  # ======================
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds: []  # Add route table IDs as needed

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      VpcEndpointType: Gateway
      RouteTableIds: []  # Add route table IDs as needed

  KinesisVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kinesis-streams'
      VpcEndpointType: Interface
      SubnetIds: !Ref SubnetIds
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  GlueVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.glue'
      VpcEndpointType: Interface
      SubnetIds: !Ref SubnetIds
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/8  # Adjust based on your VPC CIDR
      Tags:
        - Key: Name
          Value: !Sub 'vpc-endpoints-sg-${Environment}'

  # ======================
  # SNS Topics
  # ======================
  PipelineAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'pipeline-alerts-${Environment}'
      DisplayName: Financial Pipeline Alerts
      KmsMasterKeyId: !Ref DataEncryptionKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DataQualityAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'data-quality-alerts-${Environment}'
      DisplayName: Data Quality Alerts
      KmsMasterKeyId: !Ref DataEncryptionKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ======================
  # CloudWatch Alarms
  # ======================
  KinesisShardIteratorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'kinesis-iterator-age-${Environment}'
      AlarmDescription: Alert when Kinesis iterator age is too high
      MetricName: GetRecords.IteratorAgeMilliseconds
      Namespace: AWS/Kinesis
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 60000  # 60 seconds
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: StreamName
          Value: !Ref MarketDataStream
      AlarmActions:
        - !Ref PipelineAlertTopic
      TreatMissingData: notBreaching

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'lambda-errors-${Environment}'
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataValidationFunction
      AlarmActions:
        - !Ref PipelineAlertTopic
      TreatMissingData: notBreaching

  LambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'lambda-throttles-${Environment}'
      AlarmDescription: Alert on Lambda throttling
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataValidationFunction
      AlarmActions:
        - !Ref PipelineAlertTopic
      TreatMissingData: notBreaching

  DLQMessageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'dlq-messages-${Environment}'
      AlarmDescription: Alert when messages in DLQ
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: QueueName
          Value: !GetAtt ValidationDeadLetterQueue.QueueName
      AlarmActions:
        - !Ref DataQualityAlertTopic
      TreatMissingData: notBreaching

  DataQualityMetricAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'data-quality-failures-${Environment}'
      AlarmDescription: Alert on high validation failure rate
      MetricName: ValidationFailures
      Namespace: FinancialPipeline
      Statistic: Sum
      Period: 900
      EvaluationPeriods: 2
      Threshold: 100
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref DataQualityAlertTopic
      TreatMissingData: notBreaching

  # ======================
  # CloudWatch Dashboard
  # ======================
  PipelineDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'financial-pipeline-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "title": "Data Ingestion Rate",
                "metrics": [
                  ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum", "label": "Records/min"}],
                  [".", "IncomingBytes", {"stat": "Sum", "label": "Bytes/min", "yAxis": "right"}]
                ],
                "period": 60,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "Processing Latency",
                "metrics": [
                  ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Avg Duration"}],
                  [".", ".", {"stat": "Maximum", "label": "Max Duration"}]
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "Error Counts",
                "metrics": [
                  ["AWS/Lambda", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                  ["FinancialPipeline", "ValidationFailures", {"stat": "Sum", "label": "Validation Failures"}]
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "S3 Storage",
                "metrics": [
                  ["AWS/S3", "BucketSizeBytes", {"dimensions": {"BucketName": "${RawDataBucket}"}, "stat": "Average"}],
                  [".", ".", {"dimensions": {"BucketName": "${ProcessedDataBucket}"}, "stat": "Average"}]
                ],
                "period": 86400,
                "region": "${AWS::Region}",
                "view": "singleValue"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "DynamoDB Performance",
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"dimensions": {"TableName": "${ProcessingJobTable}"}}],
                  [".", "ConsumedWriteCapacityUnits", {"dimensions": {"TableName": "${ProcessingJobTable}"}}]
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "Glue Job Status",
                "metrics": [
                  ["AWS/Glue", "glue.driver.aggregate.numCompletedTasks", {"dimensions": {"JobName": "${JsonToParquetJob}", "JobRunId": "ALL"}}],
                  [".", "glue.driver.aggregate.numFailedTasks", {"dimensions": {"JobName": "${JsonToParquetJob}", "JobRunId": "ALL"}}]
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            }
          ]
        }

Conditions:
  HasDataConsumerAccount: !Not [!Equals [!Ref DataConsumerAccountId, '']]

Outputs:
  KinesisStreamArn:
    Description: 'ARN of the Kinesis Data Stream for market data ingestion'
    Value: !GetAtt MarketDataStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KinesisStreamArn'

  RawDataBucketName:
    Description: 'S3 bucket for raw market data'
    Value: !Ref RawDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-RawDataBucket'

  ProcessedDataBucketName:
    Description: 'S3 bucket for processed data'
    Value: !Ref ProcessedDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-ProcessedDataBucket'

  GlueDatabaseName:
    Description: 'Glue database for data catalog'
    Value: !Ref GlueDatabase
    Export:
      Name: !Sub '${AWS::StackName}-GlueDatabase'

  DashboardURL:
    Description: 'CloudWatch Dashboard URL'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${PipelineDashboard}'

  PipelineAlertTopicArn:
    Description: 'SNS Topic for pipeline alerts'
    Value: !Ref PipelineAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopic'

  DataEncryptionKeyArn:
    Description: 'KMS key ARN for data encryption'
    Value: !GetAtt DataEncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'
```

## Key Features and Implementation Details

### 1. **Security & Compliance**
- **KMS Encryption**: All data at rest is encrypted using AWS KMS with customer-managed keys
- **IAM Roles**: Least privilege access with explicit deny policies for unencrypted uploads
- **S3 Versioning**: Enabled on all buckets for regulatory audit trails
- **Cross-Account Access**: Conditional policies for secure data sharing
- **VPC Endpoints**: Private connectivity to AWS services without internet exposure

### 2. **High Availability & Performance**
- **Reserved Concurrent Executions**: Lambda functions configured with reserved capacity (50-100) to prevent throttling
- **Kinesis Sharding**: 10 shards configured for handling peak trading volumes
- **DynamoDB On-Demand**: Automatic scaling for unpredictable workloads
- **Parallelization Factor**: Set to 10 for Kinesis event source mapping

### 3. **Data Processing Pipeline**
- **Real-time Ingestion**: Kinesis Data Streams for continuous market data feeds
- **Batch Processing**: Glue ETL jobs for JSON to Parquet transformation
- **Data Validation**: Lambda functions with schema validation and DLQ for failed records
- **Data Partitioning**: Time-based partitioning for efficient querying

### 4. **Monitoring & Alerting**
- **CloudWatch Dashboard**: Comprehensive metrics for data ingestion, processing latency, and errors
- **SNS Notifications**: Email alerts for pipeline failures and data quality issues
- **Custom Metrics**: Application-specific metrics for validation failures
- **Alarms**: Configured for iterator age, Lambda errors, throttles, and DLQ messages

### 5. **Data Lifecycle Management**
- **S3 Lifecycle Policies**: Automatic transition to Glacier after 90 days
- **Deep Archive**: Long-term storage for compliance (365+ days)
- **Point-in-Time Recovery**: Enabled for DynamoDB tables

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Set up AWS CLI profile
   aws configure --profile financial-pipeline
   
   # Create parameter file
   cat > parameters.json <<EOF
   [
     {"ParameterKey": "Environment", "ParameterValue": "production"},
     {"ParameterKey": "AlertEmail", "ParameterValue": "alerts@example.com"},
     {"ParameterKey": "VpcId", "ParameterValue": "vpc-xxxxx"},
     {"ParameterKey": "SubnetIds", "ParameterValue": "subnet-xxxxx,subnet-yyyyy"}
   ]
   EOF
   ```

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name financial-data-pipeline \
     --template-body file://financial-pipeline.yaml \
     --parameters file://parameters.json \
     --capabilities CAPABILITY_NAMED_IAM \
     --profile financial-pipeline
   ```

3. **Post-deployment configuration**:
   - Upload Glue ETL scripts to the Glue scripts bucket
   - Configure data producers to write to Kinesis stream
   - Set up cross-account permissions if needed
   - Verify CloudWatch dashboard and alarms

## Cost Optimization Tips

1. **S3 Intelligent-Tiering**: Consider using S3 Intelligent-Tiering for automatic cost optimization
2. **Spot Instances**: Use Spot instances for Glue jobs when possible
3. **Reserved Capacity**: Consider reserved capacity for DynamoDB if usage patterns are predictable
4. **Lambda Memory**: Right-size Lambda memory allocation based on actual usage
5. **Kinesis Scaling**: Implement auto-scaling for Kinesis shards based on incoming data volume

This template provides a robust, secure, and scalable foundation for processing financial market data with comprehensive monitoring and compliance features suitable for production environments.