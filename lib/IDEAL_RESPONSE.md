```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, Scalable, Fully Serverless Web Application Infrastructure'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - S3BucketName
    ParameterLabels:
      EnvironmentSuffix:
        default: 'Environment Suffix'
      S3BucketName:
        default: 'S3 Bucket Name'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  S3BucketName:
    Type: String
    Default: 'serverless-app-data'
    Description: 'Name for the S3 bucket (will be suffixed with account ID and environment)'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must be a valid S3 bucket name pattern'

Resources:
  # KMS Key for encryption - FIXED VERSION
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${EnvironmentSuffix} serverless application encryption'
      KeyPolicy:
        Version: '2012-10-17'  # Added missing Version
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
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow Lambda Service  # Added Lambda permissions
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-serverless-kms-key'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentSuffix}-serverless-app-key'
      TargetKeyId: !Ref KMSKey

  # S3 Bucket with encryption and versioning
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${S3BucketName}-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
      NotificationConfiguration:
        TopicConfigurations: []
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-serverless-app-bucket'
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  # DynamoDB Table
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'ServerlessAppTable-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
        - AttributeName: 'timestamp'
          KeyType: 'RANGE'
      BillingMode: PAY_PER_REQUEST
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS  # Added required SSEType
        KMSMasterKeyId: !Ref KMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      DeletionProtectionEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-serverless-app-table'

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${EnvironmentSuffix}-serverless-app-function'
      RetentionInDays: 14
      KmsKeyId: !GetAtt KMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-lambda-logs'

  # IAM Role for Lambda - FIXED VERSION
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
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt S3Bucket.Arn
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                  - kms:DescribeKey  # Added missing permission
                Resource: !GetAtt KMSKey.Arn
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup  # Added missing permission
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: 
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${EnvironmentSuffix}-serverless-app-function:*'  # More specific resource


  # Lambda Function - FIXED VERSION
  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: 
      - LambdaLogGroup
    Properties:
      FunctionName: !Sub '${EnvironmentSuffix}-serverless-app-function'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref DynamoDBTable
          S3_BUCKET: !Ref S3Bucket
          KMS_KEY_ID: !Ref KMSKey
          ENVIRONMENT: !Ref EnvironmentSuffix
      KmsKeyArn: !GetAtt KMSKey.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import decimal
          
          # Helper class to handle decimal serialization
          class DecimalEncoder(json.JSONEncoder):
              def default(self, o):
                  if isinstance(o, decimal.Decimal):
                      return float(o)
                  return super(DecimalEncoder, self).default(o)
          
          dynamodb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')
          
          def lambda_handler(event, context):
              table_name = os.environ['DYNAMODB_TABLE']
              table = dynamodb.Table(table_name)
              
              try:
                  # Process the request
                  if event.get('httpMethod') == 'GET':
                      response = table.scan()
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Access-Control-Allow-Origin': '*',
                              'Content-Type': 'application/json'
                          },
                          'body': json.dumps({
                              'message': 'Success',
                              'data': response.get('Items', []),
                              'environment': os.environ['ENVIRONMENT']
                          }, cls=DecimalEncoder)
                      }
                  elif event.get('httpMethod') == 'POST':
                   
```