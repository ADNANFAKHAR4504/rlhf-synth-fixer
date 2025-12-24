Here's a comprehensive CloudFormation template for your serverless image processing service:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless image processing service with S3, Lambda, DynamoDB, and API Gateway - Enhanced with security and performance best practices'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Logging Configuration'
        Parameters:
          - LogRetentionInDays
      - Label:
          default: 'Performance Configuration'
        Parameters:
          - LambdaMemorySize
          - LambdaTimeout
    ParameterLabels:
      EnvironmentSuffix:
        default: 'Environment Suffix (e.g., dev, staging, prod)'
      LogRetentionInDays:
        default: 'CloudWatch Logs Retention Period'
      LambdaMemorySize:
        default: 'Lambda Memory Allocation'
      LambdaTimeout:
        default: 'Lambda Timeout'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming and tagging'

  LogRetentionInDays:
    Type: Number
    Default: 30
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
    Description: 'CloudWatch Logs retention period in days for compliance'

  LambdaMemorySize:
    Type: Number
    Default: 1024
    MinValue: 128
    MaxValue: 10240
    Description: 'Memory allocation for Lambda function (MB)'

  LambdaTimeout:
    Type: Number
    Default: 300
    MinValue: 1
    MaxValue: 900
    Description: 'Lambda function timeout in seconds'

Resources:
  # DynamoDB Table for tracking processed images with enhanced features
  ImageProcessingTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'image-processing-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: ImageID
          AttributeType: S
        - AttributeName: ProcessedAt
          AttributeType: S
      KeySchema:
        - AttributeName: ImageID
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: ProcessedAtIndex
          KeySchema:
            - AttributeName: ProcessedAt
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      DeletionProtectionEnabled: false
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # IAM Role for Lambda Function with least privilege principle
  ImageProcessorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'image-processor-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: ImageProcessorPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 permissions - scoped to image upload buckets only
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:GetObjectTagging
                Resource: !Sub 'arn:aws:s3:::image-uploads-${AWS::AccountId}-${EnvironmentSuffix}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::image-uploads-${AWS::AccountId}-${EnvironmentSuffix}'
                Condition:
                  StringLike:
                    's3:prefix': ['*.jpg', '*.jpeg', '*.png', '*.gif']
              # DynamoDB permissions - scoped to specific table and indexes
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:GetItem
                Resource:
                  - !GetAtt ImageProcessingTable.Arn
                  - !Sub '${ImageProcessingTable.Arn}/index/*'
              # CloudWatch Logs permissions - scoped to function's log group
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/image-processor-${EnvironmentSuffix}:*'
              # X-Ray permissions for tracing
              - Effect: Allow
                Action:
                  - xray:PutTraceSegments
                  - xray:PutTelemetryRecords
                Resource: '*'
              # SQS permissions for Dead Letter Queue
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt ImageProcessorDLQ.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # CloudWatch Log Group for Lambda
  ImageProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/image-processor-${EnvironmentSuffix}'
      RetentionInDays: !Ref LogRetentionInDays
      KmsKeyId: !GetAtt LogGroupKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # KMS Key for CloudWatch Logs encryption
  LogGroupKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for encrypting CloudWatch Logs - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/image-processor-${EnvironmentSuffix}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  LogGroupKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/logs-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref LogGroupKMSKey

  # Dead Letter Queue for Lambda failures
  ImageProcessorDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'image-processor-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600 # 14 days
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # Lambda Function for image processing with enhanced features
  ImageProcessorFunction:
    Type: AWS::Lambda::Function
    DependsOn: ImageProcessorLogGroup
    Properties:
      FunctionName: !Sub 'image-processor-${EnvironmentSuffix}'
      Runtime: python3.12
      Handler: index.lambda_handler
      Role: !GetAtt ImageProcessorRole.Arn
      Timeout: !Ref LambdaTimeout
      MemorySize: !Ref LambdaMemorySize
      TracingConfig:
        Mode: Active
      DeadLetterConfig:
        TargetArn: !GetAtt ImageProcessorDLQ.Arn
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref ImageProcessingTable
          LOG_LEVEL: INFO
          POWERTOOLS_SERVICE_NAME: image-processor
          POWERTOOLS_METRICS_NAMESPACE: ServerlessApp
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          import hashlib
          from datetime import datetime, timezone
          from urllib.parse import unquote_plus
          import logging
          from botocore.exceptions import ClientError, BotoCoreError
          import re

          # Configure logging
          log_level = os.environ.get('LOG_LEVEL', 'INFO')
          logger = logging.getLogger()
          logger.setLevel(getattr(logging, log_level))

          # Initialize AWS clients with retry configuration
          config = boto3.session.Config(
              region_name=os.environ.get('AWS_REGION', 'us-west-2'),
              retries={'max_attempts': 3, 'mode': 'adaptive'}
          )
          s3_client = boto3.client('s3', config=config)
          dynamodb = boto3.resource('dynamodb', config=config)
          table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

          # Supported image types
          SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}
          MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

          def lambda_handler(event, context):
              try:
                  logger.info(f"Processing event with request ID: {context.aws_request_id}")
                  
                  # Handle S3 event
                  if 'Records' in event and event['Records']:
                      results = []
                      for record in event['Records']:
                          if 's3' in record:
                              bucket = record['s3']['bucket']['name']
                              key = unquote_plus(record['s3']['object']['key'])
                              result = process_image_from_s3(bucket, key, context.aws_request_id)
                              results.append(result)
                      return {'processed_images': results}
                  
                  # Handle API Gateway event
                  elif 'httpMethod' in event and event['httpMethod'] == 'POST':
                      body = json.loads(event.get('body', '{}'))
                      bucket = body.get('bucket')
                      key = body.get('key')
                      
                      if not key:
                          return {
                              'statusCode': 400,
                              'headers': {'Content-Type': 'application/json'},
                              'body': json.dumps({'error': 'Missing required parameter: key'})
                          }
                      
                      if not bucket:
                          return {
                              'statusCode': 400,
                              'headers': {'Content-Type': 'application/json'},
                              'body': json.dumps({'error': 'Missing required parameter: bucket'})
                          }
                      
                      # Validate input
                      if not is_valid_s3_key(key):
                          return {
                              'statusCode': 400,
                              'headers': {'Content-Type': 'application/json'},
                              'body': json.dumps({'error': 'Invalid key format'})
                          }
                      
                      result = process_image_from_s3(bucket, key, context.aws_request_id)
                      return {
                          'statusCode': 200,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps(result)
                      }
                  
                  return {
                      'statusCode': 200,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'message': 'Processing completed'})
                  }
                  
              except json.JSONDecodeError as e:
                  logger.error(f"Invalid JSON in request body: {str(e)}")
                  return {
                      'statusCode': 400,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': 'Invalid JSON format'})
                  }
              except Exception as e:
                  logger.error(f"Unexpected error: {str(e)}", exc_info=True)
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': 'Internal server error'})
                  }

          def is_valid_s3_key(key):
              """Validate S3 key format and check for supported extensions"""
              if not key or len(key) > 1024:
                  return False
              
              # Check for path traversal attempts
              if '..' in key or key.startswith('/'):
                  return False
              
              # Check file extension
              extension = os.path.splitext(key.lower())[1]
              return extension in SUPPORTED_EXTENSIONS

          def process_image_from_s3(bucket, key, request_id):
              logger.info(f"Processing image: {bucket}/{key} (Request: {request_id})")
              
              try:
                  # Validate file extension
                  if not is_valid_s3_key(key):
                      raise ValueError(f"Unsupported file type: {key}")
                  
                  # Check object exists and get metadata
                  try:
                      response = s3_client.head_object(Bucket=bucket, Key=key)
                      file_size = response['ContentLength']
                      
                      if file_size > MAX_FILE_SIZE:
                          raise ValueError(f"File too large: {file_size} bytes")
                      
                      # Get file hash for deduplication
                      file_hash = response.get('ETag', '').strip('"')
                      
                  except ClientError as e:
                      error_code = e.response['Error']['Code']
                      if error_code == 'NoSuchKey':
                          raise ValueError(f"File not found: {key}")
                      elif error_code == 'Forbidden':
                          raise ValueError(f"Access denied to file: {key}")
                      else:
                          raise ValueError(f"S3 error: {error_code}")
                  
                  # Generate deterministic ImageID based on content
                  content_hash = hashlib.sha256(f"{bucket}/{key}/{file_hash}".encode()).hexdigest()
                  image_id = f"img_{content_hash[:12]}"
                  
                  # Check if already processed (deduplication)
                  try:
                      existing_item = table.get_item(Key={'ImageID': image_id})
                      if 'Item' in existing_item:
                          logger.info(f"Image already processed: {image_id}")
                          return existing_item['Item']
                  except ClientError as e:
                      logger.warning(f"Error checking existing item: {str(e)}")
                  
                  # Record processing in DynamoDB with enhanced metadata
                  current_time = datetime.now(timezone.utc).isoformat()
                  
                  item = {
                      'ImageID': image_id,
                      'OriginalBucket': bucket,
                      'OriginalKey': key,
                      'ProcessedAt': current_time,
                      'Status': 'Processed',
                      'FileSize': file_size,
                      'FileHash': file_hash,
                      'RequestId': request_id,
                      'TTL': int((datetime.now(timezone.utc).timestamp() + (365 * 24 * 3600)))  # 1 year TTL
                  }
                  
                  table.put_item(Item=item)
                  
                  logger.info(f"Successfully processed image {key} with ID {image_id}")
                  
                  return {
                      'imageId': image_id,
                      'bucket': bucket,
                      'key': key,
                      'status': 'processed',
                      'fileSize': file_size,
                      'processedAt': current_time
                  }
                  
              except ValueError as e:
                  logger.error(f"Validation error for {key}: {str(e)}")
                  raise e
              except (ClientError, BotoCoreError) as e:
                  logger.error(f"AWS service error processing {key}: {str(e)}")
                  raise ValueError(f"Service error: {str(e)}")
              except Exception as e:
                  logger.error(f"Unexpected error processing {key}: {str(e)}", exc_info=True)
                  raise ValueError(f"Processing failed: {str(e)}")
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # S3 Bucket for image uploads with enhanced security
  ImageUploadBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'image-uploads-${AWS::AccountId}-${EnvironmentSuffix}'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionNonCurrentVersions
            Status: Enabled
            NoncurrentVersionTransitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 90
              - StorageClass: GLACIER
                TransitionInDays: 365
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # EventBridge Rule for S3 Object Created Events
  S3ObjectCreatedRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 's3-object-created-${EnvironmentSuffix}'
      Description: !Sub 'Triggers Lambda when images are uploaded to S3 - ${EnvironmentSuffix}'
      EventPattern:
        source:
          - aws.s3
        detail-type:
          - Object Created
        detail:
          bucket:
            name:
              - !Ref ImageUploadBucket
          object:
            key:
              - suffix: .jpg
              - suffix: .jpeg
              - suffix: .png
              - suffix: .gif
      State: ENABLED
      Targets:
        - Arn: !GetAtt ImageProcessorFunction.Arn
          Id: ImageProcessorTarget

  # EventBridge Permission for Lambda
  EventBridgeInvokeLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref ImageProcessorFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt S3ObjectCreatedRule.Arn

  # API Gateway REST API with enhanced security
  ImageProcessingApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'image-processing-api-${EnvironmentSuffix}'
      Description: !Sub 'API for manual image processing triggers with enhanced security - ${EnvironmentSuffix}'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: execute-api:Invoke
            Resource: '*'
            Condition:
              IpAddress:
                'aws:SourceIp':
                  - '0.0.0.0/0' # Restrict to specific IPs in production
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # API Gateway Request Validator
  ApiRequestValidator:
    Type: AWS::ApiGateway::RequestValidator
    Properties:
      RestApiId: !Ref ImageProcessingApi
      ValidateRequestBody: true
      ValidateRequestParameters: true

  # API Gateway Model for request validation
  ImageProcessingModel:
    Type: AWS::ApiGateway::Model
    Properties:
      RestApiId: !Ref ImageProcessingApi
      ContentType: application/json
      Schema:
        type: object
        properties:
          key:
            type: string
            pattern: '^[a-zA-Z0-9._/-]+\.(jpg|jpeg|png|gif)$'
            maxLength: 1024
          bucket:
            type: string
            pattern: '^[a-z0-9.-]+$'
            maxLength: 63
        required:
          - key

  # API Gateway Resource
  ProcessImageResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ImageProcessingApi
      ParentId: !GetAtt ImageProcessingApi.RootResourceId
      PathPart: 'process-image'

  # API Gateway Method with validation and rate limiting
  ProcessImageMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ImageProcessingApi
      ResourceId: !Ref ProcessImageResource
      HttpMethod: POST
      AuthorizationType: NONE
      RequestValidatorId: !Ref ApiRequestValidator
      RequestModels:
        application/json: !Ref ImageProcessingModel
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ImageProcessorFunction.Arn}/invocations'
        IntegrationResponses:
          - StatusCode: 200
          - StatusCode: 400
          - StatusCode: 500
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
        - StatusCode: 400
          ResponseModels:
            application/json: Error
        - StatusCode: 500
          ResponseModels:
            application/json: Error

  # Usage Plan for rate limiting
  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: ApiDeployment
    Properties:
      UsagePlanName: !Sub 'usage-plan-${EnvironmentSuffix}'
      Description: !Sub 'Usage plan for image processing API - ${EnvironmentSuffix}'
      ApiStages:
        - ApiId: !Ref ImageProcessingApi
          Stage: prod
      Throttle:
        RateLimit: 100
        BurstLimit: 200
      Quota:
        Limit: 10000
        Period: DAY
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # API Key for usage plan
  ApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub 'api-key-${EnvironmentSuffix}'
      Description: !Sub 'API key for image processing service - ${EnvironmentSuffix}'
      Enabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: ServerlessApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: StackName
          Value: !Ref AWS::StackName

  # Link API key to usage plan
  ApiUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref ApiUsagePlan

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ProcessImageMethod
    Properties:
      RestApiId: !Ref ImageProcessingApi
      StageName: prod

  # Lambda Permission for API Gateway
  ApiGatewayInvokeLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref ImageProcessorFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ImageProcessingApi}/*/POST/process-image'

Outputs:
  # Core Infrastructure Outputs
  S3BucketName:
    Description: 'Name of the S3 bucket for image uploads'
    Value: !Ref ImageUploadBucket
    Export:
      Name: !Sub 'S3Bucket-${EnvironmentSuffix}'

  S3BucketArn:
    Description: 'ARN of the S3 bucket for image uploads'
    Value: !GetAtt ImageUploadBucket.Arn
    Export:
      Name: !Sub 'S3BucketArn-${EnvironmentSuffix}'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table for tracking processed images'
    Value: !Ref ImageProcessingTable
    Export:
      Name: !Sub 'DynamoDBTable-${EnvironmentSuffix}'

  DynamoDBTableArn:
    Description: 'ARN of the DynamoDB table for tracking processed images'
    Value: !GetAtt ImageProcessingTable.Arn
    Export:
      Name: !Sub 'DynamoDBTableArn-${EnvironmentSuffix}'

  # Lambda Function Outputs
  LambdaFunctionName:
    Description: 'Name of the Lambda function for image processing'
    Value: !Ref ImageProcessorFunction
    Export:
      Name: !Sub 'LambdaFunction-${EnvironmentSuffix}'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function for image processing'
    Value: !GetAtt ImageProcessorFunction.Arn
    Export:
      Name: !Sub 'LambdaFunctionArn-${EnvironmentSuffix}'

  LambdaRoleArn:
    Description: 'ARN of the Lambda execution role'
    Value: !GetAtt ImageProcessorRole.Arn
    Export:
      Name: !Sub 'LambdaRoleArn-${EnvironmentSuffix}'

  # API Gateway Outputs
  ApiGatewayEndpoint:
    Description: 'API Gateway endpoint for manual image processing'
    Value: !Sub 'https://${ImageProcessingApi}.execute-api.${AWS::Region}.amazonaws.com/prod/process-image'
    Export:
      Name: !Sub 'ApiEndpoint-${EnvironmentSuffix}'

  ApiGatewayId:
    Description: 'API Gateway REST API ID'
    Value: !Ref ImageProcessingApi
    Export:
      Name: !Sub 'ApiId-${EnvironmentSuffix}'

  ApiKeyId:
    Description: 'API Key ID for accessing the API'
    Value: !Ref ApiKey
    Export:
      Name: !Sub 'ApiKeyId-${EnvironmentSuffix}'

  # Security and Monitoring Outputs
  CloudWatchLogGroup:
    Description: 'CloudWatch Log Group for Lambda function'
    Value: !Ref ImageProcessorLogGroup
    Export:
      Name: !Sub 'LogGroup-${EnvironmentSuffix}'

  DeadLetterQueueUrl:
    Description: 'URL of the Dead Letter Queue for failed Lambda executions'
    Value: !Ref ImageProcessorDLQ
    Export:
      Name: !Sub 'DLQUrl-${EnvironmentSuffix}'

  DeadLetterQueueArn:
    Description: 'ARN of the Dead Letter Queue for failed Lambda executions'
    Value: !GetAtt ImageProcessorDLQ.Arn
    Export:
      Name: !Sub 'DLQArn-${EnvironmentSuffix}'

  KMSKeyArn:
    Description: 'ARN of the KMS key used for CloudWatch Logs encryption'
    Value: !GetAtt LogGroupKMSKey.Arn
    Export:
      Name: !Sub 'KMSKeyArn-${EnvironmentSuffix}'

  # Stack Information
  StackRegion:
    Description: 'AWS Region where the stack is deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub 'Region-${EnvironmentSuffix}'

  StackId:
    Description: 'CloudFormation Stack ID'
    Value: !Ref 'AWS::StackId'
    Export:
      Name: !Sub 'StackId-${EnvironmentSuffix}'

  # Configuration Outputs
  EnvironmentSuffixOutput:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub 'Environment-${EnvironmentSuffix}'

  LogRetentionDays:
    Description: 'CloudWatch Logs retention period in days'
    Value: !Ref LogRetentionInDays
    Export:
      Name: !Sub 'LogRetention-${EnvironmentSuffix}'

  LambdaMemoryConfiguration:
    Description: 'Lambda function memory configuration (MB)'
    Value: !Ref LambdaMemorySize
    Export:
      Name: !Sub 'LambdaMemory-${EnvironmentSuffix}'

  LambdaTimeoutConfiguration:
    Description: 'Lambda function timeout configuration (seconds)'
    Value: !Ref LambdaTimeout
    Export:
      Name: !Sub 'LambdaTimeout-${EnvironmentSuffix}'
```
