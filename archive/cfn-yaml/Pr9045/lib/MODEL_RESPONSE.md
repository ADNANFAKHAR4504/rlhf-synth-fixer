AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated Daily Backup System with S3, Lambda, and EventBridge'

Parameters:
  Environment:
    Type: String
    Description: Environment name (dev, staging, prod)
    Default: prod
    AllowedValues:
      - dev
      - staging
      - prod
    
  BackupBucketName:
    Type: String
    Description: Name for the S3 backup bucket (must be globally unique)
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: Must be a valid S3 bucket name
    MinLength: 3
    MaxLength: 63

Mappings:
  EnvironmentConfig:
    dev:
      RetentionDays: 7
    staging:
      RetentionDays: 14
    prod:
      RetentionDays: 30

Resources:
  # KMS Key for S3 Encryption
  BackupKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Environment} backup encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Id: backup-key-policy
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupEncryption

  BackupKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-backup-key'
      TargetKeyId: !Ref BackupKMSKey

  # S3 Backup Bucket
  BackupS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BackupBucketName
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref BackupKMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldBackups
            Status: Enabled
            ExpirationInDays: !FindInMap [EnvironmentConfig, !Ref Environment, RetentionDays]
            NoncurrentVersionExpirationInDays: 1
          - Id: AbortIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      MetricsConfigurations:
        - Id: BackupMetrics
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: backup-access-logs/
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: DailyBackups

  # S3 Bucket for Access Logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${BackupBucketName}-logs'
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
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupLogs

  # IAM Role for Lambda
  BackupLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-backup-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: BackupS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource:
                  - !Sub '${BackupS3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt BackupS3Bucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                  - 'kms:CreateGrant'
                  - 'kms:DescribeKey'
                Resource:
                  - !GetAtt BackupKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'BackupSystem'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupLambdaExecution

  # CloudWatch Log Group for Lambda
  BackupLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-backup-function'
      RetentionInDays: 30
      KmsKeyId: !GetAtt BackupKMSKey.Arn

  # Lambda Function for Backups
  BackupLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-backup-function'
      Description: 'Daily backup function to upload documents to S3'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt BackupLambdaRole.Arn
      Timeout: 900  # 15 minutes
      MemorySize: 512
      Environment:
        Variables:
          BACKUP_BUCKET: !Ref BackupS3Bucket
          ENVIRONMENT: !Ref Environment
          KMS_KEY_ID: !Ref BackupKMSKey
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import logging
          from botocore.exceptions import ClientError

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          s3_client = boto3.client('s3')
          cloudwatch = boto3.client('cloudwatch')

          def send_metric(metric_name, value, unit='Count'):
              """Send custom metric to CloudWatch"""
              try:
                  cloudwatch.put_metric_data(
                      Namespace='BackupSystem',
                      MetricData=[
                          {
                              'MetricName': metric_name,
                              'Value': value,
                              'Unit': unit,
                              'Dimensions': [
                                  {
                                      'Name': 'Environment',
                                      'Value': os.environ['ENVIRONMENT']
                                  }
                              ]
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f"Failed to send metric: {e}")

          def lambda_handler(event, context):
              """Main handler for backup processing"""
              bucket_name = os.environ['BACKUP_BUCKET']
              kms_key_id = os.environ['KMS_KEY_ID']
              
              backup_date = datetime.utcnow().strftime('%Y-%m-%d')
              documents_uploaded = 0
              documents_failed = 0
              
              try:
                  # In a real scenario, this would fetch documents from a source
                  # For this example, we'll create sample backup data
                  sample_documents = []
                  for i in range(500):  # Simulating 500 documents
                      sample_documents.append({
                          'id': f'doc_{i}',
                          'content': f'Sample document content {i}',
                          'timestamp': datetime.utcnow().isoformat()
                      })
                  
                  # Create a daily backup manifest
                  manifest = {
                      'backup_date': backup_date,
                      'total_documents': len(sample_documents),
                      'documents': sample_documents,
                      'backup_timestamp': datetime.utcnow().isoformat()
                  }
                  
                  # Upload manifest to S3
                  key = f'backups/{backup_date}/manifest.json'
                  
                  s3_client.put_object(
                      Bucket=bucket_name,
                      Key=key,
                      Body=json.dumps(manifest, indent=2),
                      ServerSideEncryption='aws:kms',
                      SSEKMSKeyId=kms_key_id,
                      ContentType='application/json',
                      Metadata={
                          'backup-date': backup_date,
                          'document-count': str(len(sample_documents))
                      }
                  )
                  
                  documents_uploaded = len(sample_documents)
                  logger.info(f"Successfully uploaded backup for {backup_date} with {documents_uploaded} documents")
                  
                  # Send success metrics
                  send_metric('BackupSuccess', 1)
                  send_metric('DocumentsBackedUp', documents_uploaded)
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Backup completed successfully',
                          'backup_date': backup_date,
                          'documents_uploaded': documents_uploaded
                      })
                  }
                  
              except ClientError as e:
                  logger.error(f"AWS Client Error: {e}")
                  send_metric('BackupFailure', 1)
                  raise e
              except Exception as e:
                  logger.error(f"Unexpected error: {e}")
                  send_metric('BackupFailure', 1)
                  raise e

      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: DailyBackupProcessor

  # EventBridge Rule for Daily Trigger
  DailyBackupRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${Environment}-daily-backup-trigger'
      Description: 'Triggers daily backup at 2 AM UTC'
      ScheduleExpression: 'cron(0 2 * * ? *)'  # Daily at 2 AM UTC
      State: ENABLED
      Targets:
        - Arn: !GetAtt BackupLambdaFunction.Arn
          Id: '1'
          RetryPolicy:
            MaximumRetryAttempts: 2
            MaximumEventAge: 3600  # 1 hour

  # Permission for EventBridge to invoke Lambda
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref BackupLambdaFunction
      Action: 'lambda:InvokeFunction'
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DailyBackupRule.Arn

  # CloudWatch Alarms
  BackupFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-backup-failures'
      AlarmDescription: 'Alert when backup fails'
      MetricName: BackupFailure
      Namespace: BackupSystem
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: Environment
          Value: !Ref Environment
      TreatMissingData: notBreaching

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-backup-duration-high'
      AlarmDescription: 'Alert when backup takes too long'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 600000  # 10 minutes in milliseconds
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref BackupLambdaFunction
      TreatMissingData: notBreaching

Outputs:
  BackupBucketName:
    Description: 'Name of the S3 backup bucket'
    Value: !Ref BackupS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-backup-bucket'

  BackupLambdaArn:
    Description: 'ARN of the backup Lambda function'
    Value: !GetAtt BackupLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-backup-lambda-arn'

  EventBridgeRuleName:
    Description: 'Name of the EventBridge rule for daily backups'
    Value: !Ref DailyBackupRule
    Export:
      Name: !Sub '${AWS::StackName}-daily-backup-rule'

  KMSKeyId:
    Description: 'ID of the KMS key used for encryption'
    Value: !Ref BackupKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-kms-key-id'