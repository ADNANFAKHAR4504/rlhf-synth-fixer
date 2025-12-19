# Serverless Image Processing System - Infrastructure as Code

## Architecture Overview

This CloudFormation template implements a complete serverless image processing system on AWS, designed to handle 1,000 daily image uploads with secure storage, automatic processing, and comprehensive monitoring.

## Infrastructure Components

### Core Storage and Processing
- **S3 Bucket**: Secure image storage with encryption, versioning, and lifecycle policies
- **Lambda Function**: Python 3.9 runtime for automatic image processing
- **DynamoDB Table**: Metadata storage with point-in-time recovery and GSI for time-based queries
- **SNS Topic**: Email notifications for processing events

### Security and Access Control
- **IAM Roles**: Principle of least privilege for Lambda execution
- **Bucket Policies**: Enforce HTTPS and block public access
- **Encryption**: Server-side encryption for S3 and DynamoDB

### Monitoring and Observability
- **CloudWatch Alarms**: Monitor Lambda errors, throttles, and DynamoDB capacity
- **CloudWatch Dashboard**: Real-time metrics visualization
- **Log Groups**: Centralized logging with retention policies

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Image Processing System with S3, Lambda, DynamoDB, and CloudWatch'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Environment suffix to append to resource names (e.g., dev, staging, prod)'
    Default: 'dev'

  NotificationEmail:
    Type: String
    Description: 'Email address for SNS notifications'
    Default: 'admin@example.com'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

Resources:
  # S3 Bucket for Image Storage
  ImageStorageBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub 'image-storage-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      VersioningConfiguration:
        Status: 'Enabled'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldVersions'
            Status: 'Enabled'
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Purpose'
          Value: 'ImageStorage'

  # S3 Bucket Policy
  ImageStorageBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref ImageStorageBucket
      PolicyDocument:
        Statement:
          - Sid: 'DenyInsecureTransport'
            Effect: 'Deny'
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ImageStorageBucket.Arn
              - !Sub '${ImageStorageBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # DynamoDB Table for Metadata
  ImageMetadataTable:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: !Sub 'ImageMetadata-${EnvironmentSuffix}'
      BillingMode: 'PAY_PER_REQUEST'
      AttributeDefinitions:
        - AttributeName: 'ImageId'
          AttributeType: 'S'
        - AttributeName: 'UploadTimestamp'
          AttributeType: 'N'
      KeySchema:
        - AttributeName: 'ImageId'
          KeyType: 'HASH'
      GlobalSecondaryIndexes:
        - IndexName: 'UploadTimestampIndex'
          KeySchema:
            - AttributeName: 'UploadTimestamp'
              KeyType: 'HASH'
          Projection:
            ProjectionType: 'ALL'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Purpose'
          Value: 'ImageMetadata'

  # SNS Topic for Notifications
  ProcessingNotificationTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      TopicName: !Sub 'ImageProcessingNotifications-${EnvironmentSuffix}'
      DisplayName: 'Image Processing Notifications'
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: 'email'
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # IAM Role for Lambda
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: !Sub 'ImageProcessorPolicy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                Resource: !Sub 'arn:aws:s3:::image-storage-bucket-${EnvironmentSuffix}-${AWS::AccountId}/*'
              - Effect: 'Allow'
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:GetItem'
                Resource: !GetAtt ImageMetadataTable.Arn
              - Effect: 'Allow'
                Action:
                  - 'sns:Publish'
                Resource: !Ref ProcessingNotificationTopic
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # Lambda Function for Image Processing
  ImageProcessorLambda:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub 'ImageProcessor-${EnvironmentSuffix}'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      MemorySize: 512
      Environment:
        Variables:
          METADATA_TABLE: !Ref ImageMetadataTable
          SNS_TOPIC_ARN: !Ref ProcessingNotificationTopic
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          from urllib.parse import unquote_plus
          import hashlib

          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          sns_client = boto3.client('sns')

          table_name = os.environ['METADATA_TABLE']
          sns_topic = os.environ['SNS_TOPIC_ARN']
          table = dynamodb.Table(table_name)

          def lambda_handler(event, context):
              print(f"Received event: {json.dumps(event)}")
              
              processed_count = 0
              failed_count = 0
              
              for record in event['Records']:
                  try:
                      bucket = record['s3']['bucket']['name']
                      key = unquote_plus(record['s3']['object']['key'])
                      size = record['s3']['object']['size']
                      
                      # Get object metadata
                      response = s3_client.head_object(Bucket=bucket, Key=key)
                      content_type = response.get('ContentType', 'unknown')
                      last_modified = response.get('LastModified')
                      
                      # Generate unique image ID
                      image_id = hashlib.md5(f"{bucket}/{key}".encode()).hexdigest()
                      
                      # Store metadata in DynamoDB
                      timestamp = int(datetime.now().timestamp())
                      
                      item = {
                          'ImageId': image_id,
                          'BucketName': bucket,
                          'ObjectKey': key,
                          'FileSize': size,
                          'ContentType': content_type,
                          'UploadTimestamp': timestamp,
                          'UploadDate': datetime.now().isoformat(),
                          'ProcessedAt': datetime.now().isoformat(),
                          'Status': 'processed'
                      }
                      
                      table.put_item(Item=item)
                      
                      print(f"Successfully processed image: {key}")
                      processed_count += 1
                      
                  except Exception as e:
                      print(f"Error processing {key}: {str(e)}")
                      failed_count += 1
                      continue
              
              # Send SNS notification
              message = f"""
              Image Processing Summary:
              - Successfully processed: {processed_count}
              - Failed: {failed_count}
              - Environment: {os.environ['ENVIRONMENT']}
              """
              
              try:
                  sns_client.publish(
                      TopicArn=sns_topic,
                      Subject='Image Processing Report',
                      Message=message
                  )
              except Exception as e:
                  print(f"Error sending SNS notification: {str(e)}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'processed': processed_count,
                      'failed': failed_count
                  })
              }
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # Lambda Permission for S3 to Invoke
  LambdaInvokePermission:
    Type: 'AWS::Lambda::Permission'
    Properties:
      FunctionName: !Ref ImageProcessorLambda
      Action: 'lambda:InvokeFunction'
      Principal: 's3.amazonaws.com'
      SourceAccount: !Ref 'AWS::AccountId'
      SourceArn: !Sub 'arn:aws:s3:::image-storage-bucket-${EnvironmentSuffix}-${AWS::AccountId}'

  # S3 Bucket Notification Configuration
  S3BucketNotification:
    Type: 'Custom::S3BucketNotification'
    DependsOn:
      - LambdaInvokePermission
    Properties:
      ServiceToken: !GetAtt S3NotificationLambda.Arn
      BucketName: !Ref ImageStorageBucket
      LambdaFunctionArn: !GetAtt ImageProcessorLambda.Arn
      NotificationConfiguration:
        LambdaConfigurations:
          - Events:
              - 's3:ObjectCreated:*'
            LambdaFunctionArn: !GetAtt ImageProcessorLambda.Arn
            Filter:
              Key:
                FilterRules:
                  - Name: 'suffix'
                    Value: '.jpg'
          - Events:
              - 's3:ObjectCreated:*'
            LambdaFunctionArn: !GetAtt ImageProcessorLambda.Arn
            Filter:
              Key:
                FilterRules:
                  - Name: 'suffix'
                    Value: '.jpeg'
          - Events:
              - 's3:ObjectCreated:*'
            LambdaFunctionArn: !GetAtt ImageProcessorLambda.Arn
            Filter:
              Key:
                FilterRules:
                  - Name: 'suffix'
                    Value: '.png'

  # Custom Resource Lambda Role for S3 Notification
  S3NotificationLambdaRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: !Sub 'S3NotificationPolicy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 's3:PutBucketNotification'
                  - 's3:GetBucketNotification'
                Resource: !Sub 'arn:aws:s3:::image-storage-bucket-${EnvironmentSuffix}-${AWS::AccountId}'

  # Custom Resource Lambda for S3 Notification
  S3NotificationLambda:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub 'S3NotificationManager-${EnvironmentSuffix}'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt S3NotificationLambdaRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3
          import cfnresponse

          s3 = boto3.client('s3')

          def lambda_handler(event, context):
              try:
                  bucket = event['ResourceProperties']['BucketName']
                  lambda_configs = event['ResourceProperties']['NotificationConfiguration']['LambdaConfigurations']
                  
                  if event['RequestType'] == 'Delete':
                      s3.put_bucket_notification_configuration(
                          Bucket=bucket,
                          NotificationConfiguration={}
                      )
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                      return
                  
                  notification_config = {
                      'LambdaFunctionConfigurations': [
                          {
                              'LambdaFunctionArn': config['LambdaFunctionArn'],
                              'Events': config['Events'],
                              'Filter': {
                                  'Key': {
                                      'FilterRules': config['Filter']['Key']['FilterRules']
                                  }
                              }
                          }
                          for config in lambda_configs
                      ]
                  }
                  
                  s3.put_bucket_notification_configuration(
                      Bucket=bucket,
                      NotificationConfiguration=notification_config
                  )
                  
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/lambda/ImageProcessor-${EnvironmentSuffix}'
      RetentionInDays: 30

  # CloudWatch Alarms
  LambdaErrorAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub 'ImageProcessor-Errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when Lambda function errors exceed threshold'
      MetricName: 'Errors'
      Namespace: 'AWS/Lambda'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'FunctionName'
          Value: !Ref ImageProcessorLambda
      AlarmActions:
        - !Ref ProcessingNotificationTopic
      TreatMissingData: 'notBreaching'

  LambdaThrottleAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub 'ImageProcessor-Throttles-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when Lambda function is throttled'
      MetricName: 'Throttles'
      Namespace: 'AWS/Lambda'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'FunctionName'
          Value: !Ref ImageProcessorLambda
      AlarmActions:
        - !Ref ProcessingNotificationTopic
      TreatMissingData: 'notBreaching'

  DynamoDBThrottleAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub 'DynamoDB-WriteThrottle-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when DynamoDB write requests are throttled'
      MetricName: 'WriteThrottleEvents'
      Namespace: 'AWS/DynamoDB'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'TableName'
          Value: !Ref ImageMetadataTable
      AlarmActions:
        - !Ref ProcessingNotificationTopic
      TreatMissingData: 'notBreaching'

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: 'AWS::CloudWatch::Dashboard'
    Properties:
      DashboardName: !Sub 'ImageProcessing-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
                  [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                  [".", "Throttles", {"stat": "Sum", "label": "Throttles"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Metrics",
                "period": 300,
                "dimensions": {
                  "FunctionName": "${ImageProcessorLambda}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Avg Duration"}],
                  ["...", {"stat": "Maximum", "label": "Max Duration"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Duration",
                "period": 300,
                "yAxis": {
                  "left": {
                    "label": "Milliseconds"
                  }
                },
                "dimensions": {
                  "FunctionName": "${ImageProcessorLambda}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", {"stat": "Sum"}],
                  [".", "ConsumedReadCapacityUnits", {"stat": "Sum"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "DynamoDB Capacity",
                "period": 300,
                "dimensions": {
                  "TableName": "${ImageMetadataTable}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/S3", "NumberOfObjects", {"stat": "Average", "label": "Object Count"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "S3 Objects",
                "period": 86400,
                "dimensions": {
                  "BucketName": "${ImageStorageBucket}",
                  "StorageType": "AllStorageTypes"
                }
              }
            }
          ]
        }

Outputs:
  S3BucketName:
    Description: 'Name of the S3 bucket for image storage'
    Value: !Ref ImageStorageBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table for metadata'
    Value: !Ref ImageMetadataTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTable'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt ImageProcessorLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  SNSTopicArn:
    Description: 'ARN of the SNS topic for notifications'
    Value: !Ref ProcessingNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopic'

  DashboardURL:
    Description: 'URL to CloudWatch Dashboard'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=ImageProcessing-${EnvironmentSuffix}'
```

## Key Features

### Security Best Practices
- All S3 traffic enforced over HTTPS
- Public access blocked on S3 bucket
- Server-side encryption enabled
- IAM roles with minimal required permissions
- DynamoDB encryption at rest

### Scalability and Performance
- Pay-per-request pricing for DynamoDB
- Lambda memory optimized at 512MB
- S3 versioning with lifecycle management
- Global Secondary Index for time-based queries

### Monitoring and Alerting
- Comprehensive CloudWatch alarms for errors and throttling
- Real-time dashboard for system health
- SNS notifications for critical events
- Centralized logging with retention policies

### Cost Optimization
- Serverless architecture with pay-per-use billing
- S3 lifecycle policies to manage storage costs
- DynamoDB on-demand pricing
- Log retention policies to control storage costs

## Deployment Considerations

1. **Email Subscription**: Update the NotificationEmail parameter with a valid email address
2. **Environment Suffix**: Use appropriate suffix for environment isolation
3. **Region Selection**: Deploy in region closest to users for optimal performance
4. **Monitoring**: Subscribe to SNS topic for proactive issue resolution

This infrastructure provides a production-ready, scalable solution for serverless image processing with comprehensive monitoring and security controls.