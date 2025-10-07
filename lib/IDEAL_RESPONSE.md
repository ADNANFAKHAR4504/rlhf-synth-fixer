# Serverless Video Processing System - CloudFormation Template

This document contains the complete, production-ready CloudFormation YAML template for a serverless video processing system that handles 1,500+ daily video uploads.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Video Processing System with S3, Lambda, SNS, and CloudWatch for handling 1,500+ daily video uploads'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix to append to resource names
    Default: dev

  NotificationEmail:
    Type: String
    Description: Email address for SNS notifications
    Default: admin@example.com
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: Must be a valid email address

Resources:
  # SNS Topic for Notifications
  VideoProcessingTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'video-processing-notifications-${EnvironmentSuffix}'
      DisplayName: Video Processing Notifications
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # SNS Topic Policy
  VideoProcessingTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref VideoProcessingTopic
      PolicyDocument:
        Statement:
          - Sid: AllowLambdaPublish
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - SNS:Publish
            Resource: !Ref VideoProcessingTopic
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref AWS::AccountId

  # IAM Role for Lambda Function
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
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: !Sub 'VideoProcessingPolicy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                  - s3:PutObjectTagging
                Resource: !Sub 'arn:aws:s3:::video-uploads-${EnvironmentSuffix}-${AWS::AccountId}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::video-uploads-${EnvironmentSuffix}-${AWS::AccountId}'
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref VideoProcessingTopic
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudWatch Log Group
  VideoProcessingLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/video-processor-${EnvironmentSuffix}'
      RetentionInDays: 14

  # Lambda Function for Video Processing
  VideoProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'video-processor-${EnvironmentSuffix}'
      Runtime: nodejs22.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      MemorySize: 1024
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref VideoProcessingTopic
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          const { S3Client, HeadObjectCommand, PutObjectTaggingCommand } = require('@aws-sdk/client-s3');
          const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
          const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

          const s3Client = new S3Client();
          const snsClient = new SNSClient();
          const cloudwatchClient = new CloudWatchClient();

          exports.handler = async (event) => {
            console.log('Event received:', JSON.stringify(event, null, 2));
            
            const startTime = Date.now();
            const results = [];

            for (const record of event.Records) {
              try {
                const bucket = record.s3.bucket.name;
                const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
                const size = record.s3.object.size;

                console.log(`Processing video: ${key} from bucket: ${bucket}`);

                // Get object metadata
                const headCommand = new HeadObjectCommand({
                  Bucket: bucket,
                  Key: key
                });
                const metadata = await s3Client.send(headCommand);

                // Process video (simulate processing logic)
                const processingResult = {
                  bucket,
                  key,
                  size,
                  sizeInMB: (size / (1024 * 1024)).toFixed(2),
                  contentType: metadata.ContentType,
                  uploadTime: record.eventTime,
                  status: 'success'
                };

                // Tag the object as processed
                const taggingCommand = new PutObjectTaggingCommand({
                  Bucket: bucket,
                  Key: key,
                  Tagging: {
                    TagSet: [
                      { Key: 'ProcessingStatus', Value: 'Completed' },
                      { Key: 'ProcessedAt', Value: new Date().toISOString() }
                    ]
                  }
                });
                await s3Client.send(taggingCommand);

                // Send SNS notification
                const snsParams = {
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: `Video Upload Successful - ${key}`,
                  Message: `
                    Video Processing Completed Successfully

                    Details:
                    - File Name: ${key}
                    - File Size: ${processingResult.sizeInMB} MB
                    - Content Type: ${metadata.ContentType}
                    - Upload Time: ${record.eventTime}
                    - Processing Status: Completed
                    - Environment: ${process.env.ENVIRONMENT}

                    The video has been successfully uploaded and processed.
                  `
                };

                await snsClient.send(new PublishCommand(snsParams));
                console.log(`Notification sent for: ${key}`);

                results.push(processingResult);

              } catch (error) {
                console.error('Error processing video:', error);
                
                // Send error notification
                const errorSnsParams = {
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: `Video Processing Failed - ${record.s3.object.key}`,
                  Message: `
                    Video Processing Failed

                    Error Details:
                    - File: ${record.s3.object.key}
                    - Error: ${error.message}
                    - Environment: ${process.env.ENVIRONMENT}

                    Please check the logs for more details.
                  `
                };

                await snsClient.send(new PublishCommand(errorSnsParams));
                
                results.push({
                  key: record.s3.object.key,
                  status: 'failed',
                  error: error.message
                });
              }
            }

            // Publish CloudWatch metrics
            const processingTime = Date.now() - startTime;
            const metricParams = {
              Namespace: 'VideoProcessing',
              MetricData: [
                {
                  MetricName: 'VideosProcessed',
                  Value: results.length,
                  Unit: 'Count',
                  Timestamp: new Date(),
                  Dimensions: [
                    {
                      Name: 'Environment',
                      Value: process.env.ENVIRONMENT
                    }
                  ]
                },
                {
                  MetricName: 'ProcessingDuration',
                  Value: processingTime,
                  Unit: 'Milliseconds',
                  Timestamp: new Date(),
                  Dimensions: [
                    {
                      Name: 'Environment',
                      Value: process.env.ENVIRONMENT
                    }
                  ]
                },
                {
                  MetricName: 'SuccessfulProcessing',
                  Value: results.filter(r => r.status === 'success').length,
                  Unit: 'Count',
                  Timestamp: new Date(),
                  Dimensions: [
                    {
                      Name: 'Environment',
                      Value: process.env.ENVIRONMENT
                    }
                  ]
                }
              ]
            };

            await cloudwatchClient.send(new PutMetricDataCommand(metricParams));

            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Video processing completed',
                processed: results.length,
                results: results
              })
            };
          };
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda Permission for S3 to Invoke
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref VideoProcessingFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !Sub 'arn:aws:s3:::video-uploads-${EnvironmentSuffix}-${AWS::AccountId}'

  # S3 Bucket for Video Uploads
  VideoUploadBucket:
    Type: AWS::S3::Bucket
    DependsOn: LambdaInvokePermission
    Properties:
      BucketName: !Sub 'video-uploads-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt VideoProcessingFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: .mp4
          - Event: s3:ObjectCreated:*
            Function: !GetAtt VideoProcessingFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: .mov
          - Event: s3:ObjectCreated:*
            Function: !GetAtt VideoProcessingFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: .avi
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: VideoProcessing

  # S3 Bucket Policy
  VideoUploadBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref VideoUploadBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt VideoUploadBucket.Arn
              - !Sub '${VideoUploadBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # CloudWatch Dashboard
  VideoProcessingDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'video-processing-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["VideoProcessing", "VideosProcessed", {"stat": "Sum", "label": "Total Videos Processed"}],
                  [".", "SuccessfulProcessing", {"stat": "Sum", "label": "Successful"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Video Processing Volume",
                "period": 300,
                "yAxis": {
                  "left": {
                    "label": "Count"
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["VideoProcessing", "ProcessingDuration", {"stat": "Average", "label": "Avg Duration"}],
                  ["...", {"stat": "Maximum", "label": "Max Duration"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Processing Duration",
                "period": 300,
                "yAxis": {
                  "left": {
                    "label": "Milliseconds"
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Lambda Invocations"}],
                  [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                  [".", "Throttles", {"stat": "Sum", "label": "Throttles"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Metrics",
                "period": 300,
                "dimensions": {
                  "FunctionName": ["video-processor-${EnvironmentSuffix}"]
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/S3", "NumberOfObjects", {"stat": "Average", "label": "Objects in Bucket"}],
                  [".", "BucketSizeBytes", {"stat": "Average", "label": "Bucket Size"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "S3 Storage Metrics",
                "period": 86400,
                "dimensions": {
                  "BucketName": ["video-uploads-${EnvironmentSuffix}-${AWS::AccountId}"],
                  "StorageType": ["AllStorageTypes"]
                }
              }
            }
          ]
        }

  # CloudWatch Alarm for Lambda Errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'video-processing-errors-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda function encounters errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref VideoProcessingFunction
      AlarmActions:
        - !Ref VideoProcessingTopic
      TreatMissingData: notBreaching

  # CloudWatch Alarm for Lambda Throttles
  LambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'video-processing-throttles-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda function is throttled
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref VideoProcessingFunction
      AlarmActions:
        - !Ref VideoProcessingTopic
      TreatMissingData: notBreaching

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket for video uploads
    Value: !Ref VideoUploadBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  S3BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt VideoUploadBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BucketArn'

  LambdaFunctionName:
    Description: Name of the Lambda function
    Value: !Ref VideoProcessingFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt VideoProcessingFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  SNSTopicArn:
    Description: ARN of the SNS topic for notifications
    Value: !Ref VideoProcessingTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopic'

  CloudWatchDashboardURL:
    Description: URL to the CloudWatch Dashboard
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=video-processing-${EnvironmentSuffix}'

  Environment:
    Description: Environment suffix used
    Value: !Ref EnvironmentSuffix
```

## Key Features

1. **Serverless Architecture**: Uses AWS Lambda for video processing with automatic scaling
2. **Event-Driven Processing**: S3 events trigger Lambda functions when videos are uploaded
3. **Multi-Format Support**: Handles .mp4, .mov, and .avi video files
4. **Notification System**: SNS notifications for successful and failed processing
5. **Monitoring and Metrics**: Custom CloudWatch metrics and dashboard
6. **Security Best Practices**: Encrypted S3 bucket, secure transport enforcement
7. **Cost Optimization**: Lifecycle policies for old object versions

## Architecture Components

- **Amazon S3**: Secure video upload and storage bucket with encryption
- **AWS Lambda**: Video processing function with Node.js 22 runtime
- **Amazon SNS**: Email notifications for processing status
- **Amazon CloudWatch**: Monitoring, logging, metrics, and alerting
- **AWS IAM**: Role-based access control with least privilege

The system is designed to handle 1,500+ daily video uploads with automatic scaling, comprehensive monitoring, and cost-effective storage management.