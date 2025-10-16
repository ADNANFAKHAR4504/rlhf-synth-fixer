AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Image Processing Pipeline with S3, Lambda, DynamoDB, and CloudWatch'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues:
      - development
      - staging
      - production
    Description: 'Environment name for resource tagging'
  
  SourceBucketName:
    Type: String
    Description: 'Name for the source image bucket (must be globally unique)'
    MinLength: 3
    MaxLength: 63
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must be a valid S3 bucket name'
  
  ThumbnailBucketName:
    Type: String
    Description: 'Name for the thumbnail bucket (must be globally unique)'
    MinLength: 3
    MaxLength: 63
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must be a valid S3 bucket name'
  
  ThumbnailSize:
    Type: Number
    Default: 128
    MinValue: 64
    MaxValue: 512
    Description: 'Thumbnail size in pixels (width and height)'

Resources:
  # S3 Bucket for Source Images
  SourceBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref SourceBucketName
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
          - Id: DeleteOldImages
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ImageProcessorFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: .jpg
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ImageProcessorFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: .jpeg
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ImageProcessorFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: .png
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: SourceImageStorage

  # S3 Bucket for Thumbnails
  ThumbnailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref ThumbnailBucketName
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
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: ThumbnailStorage

  # DynamoDB Table for Image Metadata
  ImageMetadataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-ImageMetadata'
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      AttributeDefinitions:
        - AttributeName: ImageID
          AttributeType: S
        - AttributeName: UploadTimestamp
          AttributeType: S
      KeySchema:
        - AttributeName: ImageID
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: TimestampIndex
          KeySchema:
            - AttributeName: UploadTimestamp
              KeyType: HASH
            - AttributeName: ImageID
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: ImageMetadataStorage

  # IAM Role for Lambda Function
  ImageProcessorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ImageProcessorRole'
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
        - PolicyName: ImageProcessorPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource: !Sub '${SourceBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                Resource: !Sub '${ThumbnailBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:GetItem'
                Resource: !GetAtt ImageMetadataTable.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'ImageProcessing'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda Permission for S3 to Invoke
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ImageProcessorFunction
      Action: 'lambda:InvokeFunction'
      Principal: s3.amazonaws.com
      SourceAccount: !Ref 'AWS::AccountId'
      SourceArn: !GetAtt SourceBucket.Arn

  # CloudWatch Log Group for Lambda
  ImageProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${AWS::StackName}-ImageProcessor'
      RetentionInDays: 7

  # Lambda Layer for Pillow (Python imaging library)
  PillowLayer:
    Type: AWS::Lambda::LayerVersion
    Properties:
      LayerName: !Sub '${AWS::StackName}-pillow-layer'
      Description: 'Pillow library for image processing'
      Content:
        S3Bucket: !Sub '${AWS::Region}-lambda-layers'
        S3Key: 'pillow-layer.zip'
      CompatibleRuntimes:
        - python3.9

  # Lambda Function for Image Processing
  ImageProcessorFunction:
    Type: AWS::Lambda::Function
    DependsOn: ImageProcessorLogGroup
    Properties:
      FunctionName: !Sub '${AWS::StackName}-ImageProcessor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt ImageProcessorRole.Arn
      Timeout: 60
      MemorySize: 512
      ReservedConcurrentExecutions: 10
      Environment:
        Variables:
          THUMBNAIL_BUCKET: !Ref ThumbnailBucket
          METADATA_TABLE: !Ref ImageMetadataTable
          THUMBNAIL_SIZE: !Ref ThumbnailSize
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          from datetime import datetime
          from urllib.parse import unquote_plus
          from PIL import Image
          import io

          # Initialize AWS clients
          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')

          # Environment variables
          THUMBNAIL_BUCKET = os.environ['THUMBNAIL_BUCKET']
          METADATA_TABLE = os.environ['METADATA_TABLE']
          THUMBNAIL_SIZE = int(os.environ.get('THUMBNAIL_SIZE', '128'))
          ENVIRONMENT = os.environ.get('ENVIRONMENT', 'production')

          def lambda_handler(event, context):
              """Process uploaded images and generate thumbnails"""
              
              # Get DynamoDB table
              table = dynamodb.Table(METADATA_TABLE)
              
              for record in event['Records']:
                  # Get bucket and key from the S3 event
                  bucket = record['s3']['bucket']['name']
                  key = unquote_plus(record['s3']['object']['key'])
                  
                  print(f"Processing image: {bucket}/{key}")
                  
                  try:
                      # Generate unique image ID
                      image_id = str(uuid.uuid4())
                      
                      # Get the image from S3
                      response = s3_client.get_object(Bucket=bucket, Key=key)
                      image_content = response['Body'].read()
                      
                      # Open image with Pillow
                      image = Image.open(io.BytesIO(image_content))
                      
                      # Generate thumbnail
                      image.thumbnail((THUMBNAIL_SIZE, THUMBNAIL_SIZE), Image.Resampling.LANCZOS)
                      
                      # Save thumbnail to bytes
                      thumbnail_buffer = io.BytesIO()
                      
                      # Determine format
                      format = 'JPEG' if image.mode == 'RGB' else 'PNG'
                      image.save(thumbnail_buffer, format=format)
                      thumbnail_buffer.seek(0)
                      
                      # Create thumbnail key
                      file_name = os.path.basename(key)
                      thumbnail_key = f"thumbnails/{image_id}/{file_name}"
                      
                      # Upload thumbnail to S3
                      s3_client.put_object(
                          Bucket=THUMBNAIL_BUCKET,
                          Key=thumbnail_key,
                          Body=thumbnail_buffer.getvalue(),
                          ContentType=f'image/{format.lower()}',
                          Metadata={
                              'original-image': f"{bucket}/{key}",
                              'processed-date': datetime.utcnow().isoformat()
                          }
                      )
                      
                      # Store metadata in DynamoDB
                      metadata_item = {
                          'ImageID': image_id,
                          'OriginalBucket': bucket,
                          'OriginalKey': key,
                          'OriginalSize': len(image_content),
                          'ThumbnailBucket': THUMBNAIL_BUCKET,
                          'ThumbnailKey': thumbnail_key,
                          'ThumbnailSize': len(thumbnail_buffer.getvalue()),
                          'UploadTimestamp': datetime.utcnow().isoformat(),
                          'ProcessedTimestamp': datetime.utcnow().isoformat(),
                          'ImageDimensions': f"{image.width}x{image.height}",
                          'ThumbnailDimensions': f"{THUMBNAIL_SIZE}x{THUMBNAIL_SIZE}",
                          'Environment': ENVIRONMENT,
                          'ProcessingStatus': 'SUCCESS'
                      }
                      
                      table.put_item(Item=metadata_item)
                      
                      # Send success metric to CloudWatch
                      send_metric('ProcessedImages', 1, 'Count')
                      
                      print(f"Successfully processed image: {image_id}")
                      
                  except Exception as e:
                      print(f"Error processing image {key}: {str(e)}")
                      
                      # Log error to DynamoDB
                      error_item = {
                          'ImageID': str(uuid.uuid4()),
                          'OriginalBucket': bucket,
                          'OriginalKey': key,
                          'UploadTimestamp': datetime.utcnow().isoformat(),
                          'ProcessedTimestamp': datetime.utcnow().isoformat(),
                          'ProcessingStatus': 'FAILED',
                          'ErrorMessage': str(e),
                          'Environment': ENVIRONMENT
                      }
                      
                      table.put_item(Item=error_item)
                      
                      # Send error metric to CloudWatch
                      send_metric('ProcessingErrors', 1, 'Count')
                      
                      # Re-raise the exception
                      raise

          def send_metric(metric_name, value, unit):
              """Send custom metric to CloudWatch"""
              try:
                  cloudwatch.put_metric_data(
                      Namespace='ImageProcessing',
                      MetricData=[
                          {
                              'MetricName': metric_name,
                              'Value': value,
                              'Unit': unit,
                              'Dimensions': [
                                  {
                                      'Name': 'Environment',
                                      'Value': ENVIRONMENT
                                  }
                              ]
                          }
                      ]
                  )
              except Exception as e:
                  print(f"Error sending metric: {str(e)}")

      Layers:
        - !Ref PillowLayer
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: ImageProcessing

  # CloudWatch Alarms
  ProcessingErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ProcessingErrors'
      AlarmDescription: 'Alarm when image processing errors occur'
      MetricName: ProcessingErrors
      Namespace: ImageProcessing
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: Environment
          Value: !Ref Environment

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-LambdaDuration'
      AlarmDescription: 'Alarm when Lambda execution duration is high'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30000
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: FunctionName
          Value: !Ref ImageProcessorFunction

  LambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-LambdaThrottles'
      AlarmDescription: 'Alarm when Lambda throttling occurs'
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: FunctionName
          Value: !Ref ImageProcessorFunction

Outputs:
  SourceBucketName:
    Description: 'Name of the source image bucket'
    Value: !Ref SourceBucket
    Export:
      Name: !Sub '${AWS::StackName}-SourceBucket'

  ThumbnailBucketName:
    Description: 'Name of the thumbnail bucket'
    Value: !Ref ThumbnailBucket
    Export:
      Name: !Sub '${AWS::StackName}-ThumbnailBucket'

  ImageMetadataTableName:
    Description: 'Name of the DynamoDB table for image metadata'
    Value: !Ref ImageMetadataTable
    Export:
      Name: !Sub '${AWS::StackName}-MetadataTable'

  ImageProcessorFunctionArn:
    Description: 'ARN of the image processor Lambda function'
    Value: !GetAtt ImageProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ProcessorFunctionArn'

  ImageProcessorFunctionName:
    Description: 'Name of the image processor Lambda function'
    Value: !Ref ImageProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-ProcessorFunctionName'

  CloudWatchDashboardURL:
    Description: 'URL to CloudWatch dashboard for monitoring'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}'