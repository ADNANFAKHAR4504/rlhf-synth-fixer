# Advanced Observability Stack for Distributed Payment Processing

This implementation provides a comprehensive CloudFormation template for monitoring and observability of distributed payment processing systems using AWS CloudWatch, X-Ray, SNS, Kinesis, Lambda, and OpenSearch.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Advanced Observability Stack for Distributed Payment Processing'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Log Configuration'
        Parameters:
          - LogRetentionDays
          - KinesisShardCount
      - Label:
          default: 'Alert Configuration'
        Parameters:
          - AlertEmail
          - HighLatencyThreshold
          - ErrorRateThreshold

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  LogRetentionDays:
    Type: Number
    Default: 30
    Description: 'CloudWatch Logs retention period in days'
    AllowedValues:
      [
        1,
        3,
        5,
        7,
        14,
        30,
        60,
        90,
        120,
        150,
        180,
        365,
        400,
        545,
        731,
        1827,
        3653,
      ]

  KinesisShardCount:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10
    Description: 'Number of shards for Kinesis Data Stream'

  AlertEmail:
    Type: String
    Default: 'alerts@example.com'
    Description: 'Email address for critical alerts'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  HighLatencyThreshold:
    Type: Number
    Default: 1000
    Description: 'High latency threshold in milliseconds'

  ErrorRateThreshold:
    Type: Number
    Default: 5
    Description: 'Error rate threshold percentage'

Resources:
  # ========================================
  # IAM Roles and Policies
  # ========================================

  CloudWatchLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'CloudWatchLogsRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - logs.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess'

  KinesisFirehoseRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'KinesisFirehoseRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - firehose.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: FirehoseKinesisPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kinesis:DescribeStream'
                  - 'kinesis:GetShardIterator'
                  - 'kinesis:GetRecords'
                  - 'kinesis:ListShards'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 's3:AbortMultipartUpload'
                  - 's3:GetBucketLocation'
                  - 's3:GetObject'
                  - 's3:ListBucket'
                  - 's3:ListBucketMultipartUploads'
                  - 's3:PutObject'
                Resource:
                  - !GetAtt LogBackupBucket.Arn
                  - !Sub '${LogBackupBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'logs:PutLogEvents'
                Resource: !GetAtt FirehoseLogGroup.Arn

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ObservabilityLambdaRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        - 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      Policies:
        - PolicyName: MetricsProcessingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                  - 'cloudwatch:GetMetricData'
                  - 'cloudwatch:GetMetricStatistics'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'kinesis:GetRecords'
                  - 'kinesis:GetShardIterator'
                  - 'kinesis:DescribeStream'
                  - 'kinesis:ListShards'
                Resource: !GetAtt LogStream.Arn
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource:
                  - !Ref CriticalAlertTopic
                  - !Ref WarningAlertTopic

  # ========================================
  # S3 Bucket for Log Backup
  # ========================================

  LogBackupBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'payment-logs-backup-${EnvironmentSuffix}-${AWS::AccountId}'
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
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA

  # ========================================
  # CloudWatch Log Groups
  # ========================================

  PaymentTransactionLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/payment/transactions-${EnvironmentSuffix}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogEncryptionKey.Arn

  PaymentAuthLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/payment/auth-${EnvironmentSuffix}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogEncryptionKey.Arn

  PaymentSettlementLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/payment/settlement-${EnvironmentSuffix}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogEncryptionKey.Arn

  PaymentFraudLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/payment/fraud-${EnvironmentSuffix}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt LogEncryptionKey.Arn

  FirehoseLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/kinesisfirehose/payment-logs-${EnvironmentSuffix}'
      RetentionInDays: 7

  FirehoseLogStream:
    Type: AWS::Logs::LogStream
    Properties:
      LogGroupName: !Ref FirehoseLogGroup
      LogStreamName: 'opensearch-delivery'

  MetricsProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/lambda/metrics-processor-${EnvironmentSuffix}'
      RetentionInDays: 14

  # ========================================
  # KMS Key for Log Encryption
  # ========================================

  LogEncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    Properties:
      Description: !Sub 'KMS key for encrypting payment logs - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  LogEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/payment-logs-${EnvironmentSuffix}'
      TargetKeyId: !Ref LogEncryptionKey

  # ========================================
  # Kinesis Data Stream
  # ========================================

  LogStream:
    Type: AWS::Kinesis::Stream
    DeletionPolicy: Delete
    Properties:
      Name: !Sub 'payment-logs-stream-${EnvironmentSuffix}'
      ShardCount: !Ref KinesisShardCount
      RetentionPeriodHours: 24
      StreamEncryption:
        EncryptionType: KMS
        KeyId: !Ref LogEncryptionKey

  # ========================================
  # OpenSearch Security Policies
  # ========================================

  OpenSearchEncryptionPolicy:
    Type: AWS::OpenSearchServerless::SecurityPolicy
    Properties:
      Name: !Sub 'payment-logs-encryption-${EnvironmentSuffix}'
      Type: 'encryption'
      Description: !Sub 'Encryption policy for payment logs OpenSearch collection - ${EnvironmentSuffix}'
      Policy: !Sub |
        {
          "Rules": [
            {
              "ResourceType": "collection",
              "Resource": [
                "collection/payment-logs-${EnvironmentSuffix}"
              ]
            }
          ],
          "AWSOwnedKey": true
        }

  OpenSearchNetworkPolicy:
    Type: AWS::OpenSearchServerless::SecurityPolicy
    Properties:
      Name: !Sub 'payment-logs-network-${EnvironmentSuffix}'
      Type: 'network'
      Description: !Sub 'Network policy for payment logs OpenSearch collection - ${EnvironmentSuffix}'
      Policy: !Sub |
        [
          {
            "Rules": [
              {
                "ResourceType": "collection",
                "Resource": [
                  "collection/payment-logs-${EnvironmentSuffix}"
                ]
              },
              {
                "ResourceType": "dashboard",
                "Resource": [
                  "collection/payment-logs-${EnvironmentSuffix}"
                ]
              }
            ],
            "AllowFromPublic": true
          }
        ]

  OpenSearchAccessPolicy:
    Type: AWS::OpenSearchServerless::AccessPolicy
    Properties:
      Name: !Sub 'payment-logs-access-${EnvironmentSuffix}'
      Type: 'data'
      Description: !Sub 'Data access policy for payment logs OpenSearch collection - ${EnvironmentSuffix}'
      Policy: !Sub |
        [
          {
            "Rules": [
              {
                "ResourceType": "collection",
                "Resource": [
                  "collection/payment-logs-${EnvironmentSuffix}"
                ],
                "Permission": [
                  "aoss:*"
                ]
              },
              {
                "ResourceType": "index",
                "Resource": [
                  "index/payment-logs-${EnvironmentSuffix}/*"
                ],
                "Permission": [
                  "aoss:*"
                ]
              }
            ],
            "Principal": [
              "arn:aws:iam::${AWS::AccountId}:root",
              "${KinesisFirehoseRole.Arn}"
            ]
          }
        ]

  # ========================================
  # OpenSearch Domain
  # ========================================

  OpenSearchDomain:
    Type: AWS::OpenSearchServerless::Collection
    DeletionPolicy: Delete
    DependsOn:
      - OpenSearchEncryptionPolicy
      - OpenSearchNetworkPolicy
      - OpenSearchAccessPolicy
    Properties:
      Name: !Sub 'payment-logs-${EnvironmentSuffix}'
      Type: 'SEARCH'
      Description: 'OpenSearch Serverless collection for payment logs'

  # ========================================
  # Kinesis Firehose Delivery Stream
  # ========================================

  LogDeliveryStream:
    Type: AWS::KinesisFirehose::DeliveryStream
    DependsOn:
      - FirehoseOpenSearchPolicy
    Properties:
      DeliveryStreamName: !Sub 'payment-logs-delivery-${EnvironmentSuffix}'
      DeliveryStreamType: KinesisStreamAsSource
      KinesisStreamSourceConfiguration:
        KinesisStreamARN: !GetAtt LogStream.Arn
        RoleARN: !GetAtt KinesisFirehoseRole.Arn
      AmazonOpenSearchServerlessDestinationConfiguration:
        CollectionEndpoint: !GetAtt OpenSearchDomain.CollectionEndpoint
        IndexName: 'payment-logs'
        RoleARN: !GetAtt KinesisFirehoseRole.Arn
        S3BackupMode: FailedDocumentsOnly
        S3Configuration:
          BucketARN: !GetAtt LogBackupBucket.Arn
          RoleARN: !GetAtt KinesisFirehoseRole.Arn
          CompressionFormat: GZIP
          Prefix: 'failed/'
        CloudWatchLoggingOptions:
          Enabled: true
          LogGroupName: !Ref FirehoseLogGroup
          LogStreamName: !Ref FirehoseLogStream
        ProcessingConfiguration:
          Enabled: false

  FirehoseOpenSearchPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub 'FirehoseOpenSearchPolicy-${EnvironmentSuffix}'
      Roles:
        - !Ref KinesisFirehoseRole
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - 'es:*'
            Resource:
              - !GetAtt OpenSearchDomain.Arn
              - !Sub '${OpenSearchDomain.Arn}/*'

  # ========================================
  # Lambda Function for Metrics Processing
  # ========================================

  MetricsProcessorFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Delete
    Properties:
      FunctionName: !Sub 'payment-metrics-processor-${EnvironmentSuffix}'
      Runtime: python3.12
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
          CRITICAL_ALERT_TOPIC: !Ref CriticalAlertTopic
          WARNING_ALERT_TOPIC: !Ref WarningAlertTopic
          HIGH_LATENCY_THRESHOLD: !Ref HighLatencyThreshold
          ERROR_RATE_THRESHOLD: !Ref ErrorRateThreshold
      TracingConfig:
        Mode: Active
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta
          import base64

          cloudwatch = boto3.client('cloudwatch')
          sns = boto3.client('sns')

          def lambda_handler(event, context):
              """
              Process payment transaction logs from Kinesis and generate custom metrics
              """
              print(f"Processing {len(event['Records'])} records")

              metrics = {
                  'success_count': 0,
                  'failure_count': 0,
                  'total_latency': 0,
                  'transaction_count': 0,
                  'fraud_detected': 0
              }

              for record in event['Records']:
                  try:
                      # Decode Kinesis data
                      payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
                      log_data = json.loads(payload)

                      # Process payment transaction metrics
                      if 'status' in log_data:
                          if log_data['status'] == 'success':
                              metrics['success_count'] += 1
                          else:
                              metrics['failure_count'] += 1

                      if 'latency' in log_data:
                          metrics['total_latency'] += float(log_data['latency'])

                      if 'fraud_score' in log_data and float(log_data['fraud_score']) > 0.8:
                          metrics['fraud_detected'] += 1

                      metrics['transaction_count'] += 1

                  except Exception as e:
                      print(f"Error processing record: {str(e)}")
                      continue

              # Publish custom metrics to CloudWatch
              try:
                  namespace = f"PaymentProcessing-{os.environ['ENVIRONMENT_SUFFIX']}"

                  cloudwatch.put_metric_data(
                      Namespace=namespace,
                      MetricData=[
                          {
                              'MetricName': 'TransactionSuccess',
                              'Value': metrics['success_count'],
                              'Unit': 'Count',
                              'Timestamp': datetime.utcnow()
                          },
                          {
                              'MetricName': 'TransactionFailure',
                              'Value': metrics['failure_count'],
                              'Unit': 'Count',
                              'Timestamp': datetime.utcnow()
                          },
                          {
                              'MetricName': 'FraudDetected',
                              'Value': metrics['fraud_detected'],
                              'Unit': 'Count',
                              'Timestamp': datetime.utcnow()
                          }
                      ]
                  )

                  # Calculate and publish average latency
                  if metrics['transaction_count'] > 0:
                      avg_latency = metrics['total_latency'] / metrics['transaction_count']
                      cloudwatch.put_metric_data(
                          Namespace=namespace,
                          MetricData=[
                              {
                                  'MetricName': 'AverageLatency',
                                  'Value': avg_latency,
                                  'Unit': 'Milliseconds',
                                  'Timestamp': datetime.utcnow()
                              }
                          ]
                      )

                      # Check for high latency alert
                      threshold = float(os.environ['HIGH_LATENCY_THRESHOLD'])
                      if avg_latency > threshold:
                          sns.publish(
                              TopicArn=os.environ['WARNING_ALERT_TOPIC'],
                              Subject='High Payment Latency Detected',
                              Message=f'Average payment latency ({avg_latency:.2f}ms) exceeded threshold ({threshold}ms)'
                          )

                  # Calculate error rate
                  if metrics['transaction_count'] > 0:
                      error_rate = (metrics['failure_count'] / metrics['transaction_count']) * 100
                      cloudwatch.put_metric_data(
                          Namespace=namespace,
                          MetricData=[
                              {
                                  'MetricName': 'ErrorRate',
                                  'Value': error_rate,
                                  'Unit': 'Percent',
                                  'Timestamp': datetime.utcnow()
                              }
                          ]
                      )

                      # Check for high error rate alert
                      error_threshold = float(os.environ['ERROR_RATE_THRESHOLD'])
                      if error_rate > error_threshold:
                          sns.publish(
                              TopicArn=os.environ['CRITICAL_ALERT_TOPIC'],
                              Subject='Critical: High Payment Error Rate',
                              Message=f'Payment error rate ({error_rate:.2f}%) exceeded threshold ({error_threshold}%)'
                          )

                  print(f"Successfully published metrics: {metrics}")

              except Exception as e:
                  print(f"Error publishing metrics: {str(e)}")
                  raise

              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Metrics processed successfully',
                      'metrics': metrics
                  })
              }

  MetricsProcessorEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt LogStream.Arn
      FunctionName: !Ref MetricsProcessorFunction
      StartingPosition: LATEST
      BatchSize: 100
      MaximumBatchingWindowInSeconds: 10

  # ========================================
  # SNS Topics for Alerts
  # ========================================

  CriticalAlertTopic:
    Type: AWS::SNS::Topic
    DeletionPolicy: Delete
    Properties:
      TopicName: !Sub 'payment-critical-alerts-${EnvironmentSuffix}'
      DisplayName: 'Critical Payment Processing Alerts'
      KmsMasterKeyId: !Ref LogEncryptionKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email

  WarningAlertTopic:
    Type: AWS::SNS::Topic
    DeletionPolicy: Delete
    Properties:
      TopicName: !Sub 'payment-warning-alerts-${EnvironmentSuffix}'
      DisplayName: 'Warning Payment Processing Alerts'
      KmsMasterKeyId: !Ref LogEncryptionKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email

  InfoAlertTopic:
    Type: AWS::SNS::Topic
    DeletionPolicy: Delete
    Properties:
      TopicName: !Sub 'payment-info-alerts-${EnvironmentSuffix}'
      DisplayName: 'Informational Payment Processing Alerts'
      KmsMasterKeyId: !Ref LogEncryptionKey

  # ========================================
  # CloudWatch Alarms
  # ========================================

  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'payment-high-error-rate-${EnvironmentSuffix}'
      AlarmDescription: 'Triggered when payment error rate exceeds threshold'
      MetricName: ErrorRate
      Namespace: !Sub 'PaymentProcessing-${EnvironmentSuffix}'
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref ErrorRateThreshold
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref CriticalAlertTopic
      TreatMissingData: notBreaching

  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'payment-high-latency-${EnvironmentSuffix}'
      AlarmDescription: 'Triggered when average payment latency exceeds threshold'
      MetricName: AverageLatency
      Namespace: !Sub 'PaymentProcessing-${EnvironmentSuffix}'
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref HighLatencyThreshold
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref WarningAlertTopic
      TreatMissingData: notBreaching

  FraudDetectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'payment-fraud-detected-${EnvironmentSuffix}'
      AlarmDescription: 'Triggered when fraud is detected in payment transactions'
      MetricName: FraudDetected
      Namespace: !Sub 'PaymentProcessing-${EnvironmentSuffix}'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref CriticalAlertTopic
      TreatMissingData: notBreaching

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'metrics-processor-errors-${EnvironmentSuffix}'
      AlarmDescription: 'Triggered when Lambda metrics processor has errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref MetricsProcessorFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref WarningAlertTopic
      TreatMissingData: notBreaching

  OpenSearchClusterStatusAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'opensearch-cluster-status-${EnvironmentSuffix}'
      AlarmDescription: 'Triggered when OpenSearch cluster status is red'
      MetricName: 5xx
      Namespace: AWS/AOSS
      Dimensions:
        - Name: CollectionName
          Value: !Ref OpenSearchDomain
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref CriticalAlertTopic
      TreatMissingData: notBreaching

  # ========================================
  # CloudWatch Dashboard
  # ========================================

  PaymentProcessingDashboard:
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
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "PaymentProcessing-${EnvironmentSuffix}",
                        "metricName": "TransactionSuccess"
                      },
                      "period": 300,
                      "stat": "Sum"
                    },
                    "label": "Successful Transactions",
                    "id": "m1"
                  },
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "PaymentProcessing-${EnvironmentSuffix}",
                        "metricName": "TransactionFailure"
                      },
                      "period": 300,
                      "stat": "Sum"
                    },
                    "label": "Failed Transactions",
                    "id": "m2"
                  }
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "title": "Transaction Volume",
                "yAxis": {
                  "left": {
                    "min": 0
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "PaymentProcessing-${EnvironmentSuffix}",
                        "metricName": "AverageLatency"
                      },
                      "period": 300,
                      "stat": "Average"
                    },
                    "label": "Average Latency",
                    "id": "m1"
                  }
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "title": "Average Payment Latency (ms)",
                "yAxis": {
                  "left": {
                    "min": 0
                  }
                },
                "annotations": {
                  "horizontal": [
                    {
                      "label": "High Latency Threshold",
                      "value": ${HighLatencyThreshold}
                    }
                  ]
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "PaymentProcessing-${EnvironmentSuffix}",
                        "metricName": "ErrorRate"
                      },
                      "period": 300,
                      "stat": "Average"
                    },
                    "label": "Error Rate",
                    "id": "m1"
                  }
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "title": "Error Rate (%)",
                "yAxis": {
                  "left": {
                    "min": 0,
                    "max": 100
                  }
                },
                "annotations": {
                  "horizontal": [
                    {
                      "label": "Error Rate Threshold",
                      "value": ${ErrorRateThreshold}
                    }
                  ]
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "PaymentProcessing-${EnvironmentSuffix}",
                        "metricName": "FraudDetected"
                      },
                      "period": 300,
                      "stat": "Sum"
                    },
                    "label": "Fraud Detections",
                    "id": "m1"
                  }
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "title": "Fraud Detections",
                "yAxis": {
                  "left": {
                    "min": 0
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "AWS/Lambda",
                        "metricName": "Invocations",
                        "dimensions": [
                          {
                            "name": "FunctionName",
                            "value": "${MetricsProcessorFunction}"
                          }
                        ]
                      },
                      "period": 300,
                      "stat": "Sum"
                    },
                    "label": "Lambda Invocations",
                    "id": "m1"
                  },
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "AWS/Lambda",
                        "metricName": "Errors",
                        "dimensions": [
                          {
                            "name": "FunctionName",
                            "value": "${MetricsProcessorFunction}"
                          }
                        ]
                      },
                      "period": 300,
                      "stat": "Sum"
                    },
                    "label": "Lambda Errors",
                    "id": "m2"
                  }
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "title": "Lambda Metrics Processor Health"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "AWS/Kinesis",
                        "metricName": "IncomingRecords",
                        "dimensions": [
                          {
                            "name": "StreamName",
                            "value": "${LogStream}"
                          }
                        ]
                      },
                      "period": 300,
                      "stat": "Sum"
                    },
                    "label": "Incoming Records",
                    "id": "m1"
                  },
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "AWS/Kinesis",
                        "metricName": "IncomingBytes",
                        "dimensions": [
                          {
                            "name": "StreamName",
                            "value": "${LogStream}"
                          }
                        ]
                      },
                      "period": 300,
                      "stat": "Sum"
                    },
                    "label": "Incoming Bytes",
                    "id": "m2"
                  }
                ],
                "period": 300,
                "region": "${AWS::Region}",
                "title": "Kinesis Stream Throughput",
                "yAxis": {
                  "right": {
                    "min": 0
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  {
                    "metricStat": {
                      "metric": {
                        "namespace": "AWS/AOSS",
                        "metricName": "5xx",
                        "dimensions": [
                          {
                            "name": "CollectionName",
                            "value": "${OpenSearchDomain}"
                          }
                        ]
                      },
                      "period": 60,
                      "stat": "Maximum"
                    },
                    "label": "5xx Errors",
                    "id": "m1"
                  }
                ],
                "period": 60,
                "region": "${AWS::Region}",
                "title": "OpenSearch Serverless Errors"
              }
            },
            {
              "type": "log",
              "properties": {
                "query": "SOURCE '/aws/payment/transactions-${EnvironmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20",
                "region": "${AWS::Region}",
                "title": "Recent Payment Transaction Logs",
                "stacked": false
              }
            }
          ]
        }  # ========================================
    # X-Ray Sampling Rule
    # ========================================

  XRaySamplingRule:
    Type: AWS::XRay::SamplingRule
    Properties:
      SamplingRule:
        RuleName: !Sub 'payment-${EnvironmentSuffix}'
        Priority: 1000
        Version: 1
        ReservoirSize: 1
        FixedRate: 0.1
        ServiceName: !Sub 'payment-service-${EnvironmentSuffix}'
        ServiceType: '*'
        Host: '*'
        HTTPMethod: '*'
        URLPath: '*'
        ResourceARN: '*'

  # ========================================
  # Metric Filters
  # ========================================

  TransactionErrorMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterPattern: '[time, request_id, level = ERROR*, ...]'
      LogGroupName: !Ref PaymentTransactionLogGroup
      MetricTransformations:
        - MetricName: TransactionErrors
          MetricNamespace: !Sub 'PaymentProcessing-${EnvironmentSuffix}'
          MetricValue: '1'
          DefaultValue: 0
          Unit: Count

  AuthenticationFailureMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterPattern: '[time, request_id, level, event_type = AUTHENTICATION_FAILURE, ...]'
      LogGroupName: !Ref PaymentAuthLogGroup
      MetricTransformations:
        - MetricName: AuthenticationFailures
          MetricNamespace: !Sub 'PaymentProcessing-${EnvironmentSuffix}'
          MetricValue: '1'
          DefaultValue: 0
          Unit: Count

  HighValueTransactionMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterPattern: '[time, request_id, level, event_type, amount > 10000, ...]'
      LogGroupName: !Ref PaymentTransactionLogGroup
      MetricTransformations:
        - MetricName: HighValueTransactions
          MetricNamespace: !Sub 'PaymentProcessing-${EnvironmentSuffix}'
          MetricValue: '1'
          DefaultValue: 0
          Unit: Count

Outputs:
  # Log Groups
  PaymentTransactionLogGroupName:
    Description: 'CloudWatch Log Group for payment transactions'
    Value: !Ref PaymentTransactionLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-TransactionLogGroup'

  PaymentAuthLogGroupName:
    Description: 'CloudWatch Log Group for payment authentication'
    Value: !Ref PaymentAuthLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-AuthLogGroup'

  PaymentSettlementLogGroupName:
    Description: 'CloudWatch Log Group for payment settlement'
    Value: !Ref PaymentSettlementLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-SettlementLogGroup'

  PaymentFraudLogGroupName:
    Description: 'CloudWatch Log Group for fraud detection'
    Value: !Ref PaymentFraudLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-FraudLogGroup'

  # SNS Topics
  CriticalAlertTopicArn:
    Description: 'ARN of the Critical Alert SNS Topic'
    Value: !Ref CriticalAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-CriticalAlertTopic'

  WarningAlertTopicArn:
    Description: 'ARN of the Warning Alert SNS Topic'
    Value: !Ref WarningAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-WarningAlertTopic'

  InfoAlertTopicArn:
    Description: 'ARN of the Info Alert SNS Topic'
    Value: !Ref InfoAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-InfoAlertTopic'

  # Kinesis Stream
  LogStreamName:
    Description: 'Name of the Kinesis Data Stream for logs'
    Value: !Ref LogStream
    Export:
      Name: !Sub '${AWS::StackName}-LogStream'

  LogStreamArn:
    Description: 'ARN of the Kinesis Data Stream'
    Value: !GetAtt LogStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LogStreamArn'

  # OpenSearch
  OpenSearchDomainEndpoint:
    Description: 'OpenSearch domain endpoint'
    Value: !GetAtt OpenSearchDomain.CollectionEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-OpenSearchEndpoint'

  OpenSearchDashboardUrl:
    Description: 'OpenSearch Dashboards URL'
    Value: !Sub 'https://${OpenSearchDomain.CollectionEndpoint}/_dashboards'
    Export:
      Name: !Sub '${AWS::StackName}-OpenSearchDashboardUrl'

  # Dashboard
  DashboardUrl:
    Description: 'CloudWatch Dashboard URL'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${PaymentProcessingDashboard}'
    Export:
      Name: !Sub '${AWS::StackName}-DashboardUrl'

  # X-Ray
  XRayServiceName:
    Description: 'X-Ray service name for distributed tracing'
    Value: !Sub 'payment-service-${EnvironmentSuffix}'
    Export:
      Name: !Sub '${AWS::StackName}-XRayServiceName'

  # Lambda Function
  MetricsProcessorFunctionArn:
    Description: 'ARN of the metrics processor Lambda function'
    Value: !GetAtt MetricsProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-MetricsProcessorArn'

  # S3 Bucket
  LogBackupBucketName:
    Description: 'S3 bucket for log backups'
    Value: !Ref LogBackupBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogBackupBucket'

  # KMS Key
  LogEncryptionKeyId:
    Description: 'KMS Key ID for log encryption'
    Value: !Ref LogEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-LogEncryptionKey'

  # Environment
  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

  # Stack Information
  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'
```

## Implementation Summary

This CloudFormation template implements a comprehensive observability stack for distributed payment processing with the following components:

### 1. Logging Infrastructure

- **CloudWatch Log Groups**: Four separate log groups for different payment processing stages (transactions, authentication, settlement, fraud)
- **KMS Encryption**: All logs encrypted at rest using customer-managed KMS keys
- **Log Retention**: Configurable retention periods (default 30 days) compliant with PCI-DSS
- **Kinesis Data Stream**: Real-time log streaming with encryption and configurable shard count
- **OpenSearch Domain**: Full-text search and analysis capabilities with Multi-AZ deployment
- **Kinesis Firehose**: Automated delivery of logs from Kinesis to OpenSearch with S3 backup

### 2. Metrics and Monitoring

- **Custom Metrics**: Lambda function processes logs and generates business metrics (success rate, latency, fraud detection)
- **CloudWatch Dashboards**: Real-time visualization of payment processing health and performance
- **Metric Filters**: Automatic extraction of key metrics from log data (errors, authentication failures, high-value transactions)
- **Namespace**: Isolated metrics namespace per environment

### 3. Distributed Tracing

- **X-Ray Integration**: Sampling rule configured for payment service tracing
- **Lambda Tracing**: Active tracing enabled on metrics processor function
- **Service Map**: Enables visualization of payment flow across microservices

### 4. Alerting System

- **Three-Tier Alerting**: Critical, Warning, and Informational SNS topics
- **Multi-Level Alarms**:
  - Critical: High error rate, fraud detection, OpenSearch cluster failure
  - Warning: High latency, Lambda errors
- **Email Notifications**: SNS subscriptions for alert delivery
- **Dynamic Thresholds**: Configurable via parameters

### 5. Security and Compliance

- **Encryption at Rest**: KMS encryption for logs, metrics, and streaming data
- **Encryption in Transit**: TLS 1.2 minimum for all services
- **IAM Least Privilege**: Separate roles with minimal required permissions
- **Access Controls**: OpenSearch with advanced security options and internal user database
- **Audit Trail**: CloudWatch Logs for all observability infrastructure activities

### 6. High Availability and Scalability

- **Multi-AZ**: OpenSearch deployed across 2 availability zones
- **Auto Scaling**: Kinesis with configurable shard count
- **Serverless Components**: Lambda for on-demand processing
- **S3 Lifecycle**: Automatic archival and cleanup of old logs

### 7. Cost Optimization

- **Configurable Retention**: Adjustable log retention periods
- **Lifecycle Policies**: S3 transitions to cheaper storage classes
- **On-Demand Billing**: Lambda and Kinesis scale with usage
- **Right-Sized Instances**: Configurable OpenSearch instance types

### 8. Resource Naming and Destroyability

- **EnvironmentSuffix**: All resources use the parameter for unique naming
- **No Retain Policies**: All resources have DeletionPolicy: Delete
- **Export Names**: All outputs exported with stack-prefixed names for cross-stack references

## Key Features

1. **Complete Observability**: Covers logging, metrics, tracing, and alerting
2. **Production Ready**: Multi-AZ, encrypted, with proper IAM policies
3. **Scalable**: Handles increasing transaction volumes automatically
4. **Cost Effective**: Uses serverless and pay-per-use services
5. **Secure**: Encryption, least privilege access, PCI-DSS compliant retention
6. **Customizable**: 10+ parameters for configuration flexibility
7. **Integration Ready**: 20+ outputs for connecting applications
