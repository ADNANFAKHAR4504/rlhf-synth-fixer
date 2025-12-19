AWSTemplateFormatVersion: '2010-09-09'
Description: 'Document Processing Pipeline - Handles 20k files/day with OCR, entity extraction, indexing, and search'

# Template Parameters for customization
Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [dev, staging, prod]
    Description: Environment name
  
  KmsKeyArn:
    Type: String
    Default: ''
    Description: Optional KMS key ARN for encryption (leave empty for AWS managed keys)
  
  OpenSearchInstanceType:
    Type: String
    Default: t3.medium.search
    Description: OpenSearch instance type
  
  OpenSearchShardCount:
    Type: Number
    Default: 3
    Description: Number of shards for OpenSearch index
  
  OpenSearchReplicaCount:
    Type: Number
    Default: 2
    Description: Number of replicas for OpenSearch index
  
  LambdaReservedConcurrency:
    Type: Number
    Default: 10
    Description: Reserved concurrent executions for Lambda (throttle control)
  
  ComprehendLanguageCode:
    Type: String
    Default: en
    AllowedValues: [en, es, fr, de, it, pt]
    Description: Language code for Amazon Comprehend
  
  ApiAuthType:
    Type: String
    Default: API_KEY
    AllowedValues: [API_KEY, COGNITO]
    Description: API Gateway authentication type
  
  AlarmEmail:
    Type: String
    Description: Email address for CloudWatch alarms
  
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID for OpenSearch and Lambda
  
  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Private subnet IDs (comma-separated, min 3 for OpenSearch)
  
  Owner:
    Type: String
    Description: Owner tag value
  
  CostCenter:
    Type: String
    Description: Cost center tag value
  
  DataClassification:
    Type: String
    Default: Confidential
    AllowedValues: [Public, Internal, Confidential, Restricted]
    Description: Data classification tag value

# Conditional logic
Conditions:
  UseCustomKmsKey: !Not [!Equals [!Ref KmsKeyArn, '']]
  UseCognitoAuth: !Equals [!Ref ApiAuthType, 'COGNITO']

# CloudFormation Resources
Resources:
  # S3 Buckets
  RawDocumentsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'doc-pipeline-raw-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: !If [UseCustomKmsKey, 'aws:kms', 'AES256']
              KMSMasterKeyID: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        QueueConfigurations:
          - Event: s3:ObjectCreated:*
            Queue: !GetAtt IngestQueue.Arn
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            NoncurrentVersionExpirationInDays: 90
            Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: DataClassification
          Value: !Ref DataClassification

  ProcessedDocumentsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'doc-pipeline-processed-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: !If [UseCustomKmsKey, 'aws:kms', 'AES256']
              KMSMasterKeyID: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: ArchiveOldVersions
            NoncurrentVersionTransitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: DataClassification
          Value: !Ref DataClassification

  # S3 Bucket Policies
  RawBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref RawDocumentsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt RawDocumentsBucket.Arn
              - !Sub '${RawDocumentsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false
          - Sid: AllowLambdaAccess
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 's3:GetObject'
              - 's3:GetObjectVersion'
            Resource: !Sub '${RawDocumentsBucket.Arn}/*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'

  ProcessedBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProcessedDocumentsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ProcessedDocumentsBucket.Arn
              - !Sub '${ProcessedDocumentsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # SQS Queues
  IngestQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'doc-pipeline-ingest-${Environment}'
      VisibilityTimeout: 900  # 15 minutes (max Lambda + Textract time)
      MessageRetentionPeriod: 1209600  # 14 days
      ReceiveMessageWaitTimeSeconds: 20  # Long polling
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt IngestDLQ.Arn
        maxReceiveCount: 3
      KmsMasterKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, 'alias/aws/sqs']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  IngestDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'doc-pipeline-ingest-dlq-${Environment}'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, 'alias/aws/sqs']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  StateMachineDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'doc-pipeline-statemachine-dlq-${Environment}'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, 'alias/aws/sqs']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # SQS Queue Policy for S3 notifications
  IngestQueuePolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref IngestQueue
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sqs:SendMessage'
            Resource: !GetAtt IngestQueue.Arn
            Condition:
              ArnEquals:
                'aws:SourceArn': !GetAtt RawDocumentsBucket.Arn

  # VPC Security Groups
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS for AWS APIs
      Tags:
        - Key: Name
          Value: !Sub 'doc-pipeline-lambda-sg-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  OpenSearchSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for OpenSearch domain
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: HTTPS from Lambda
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'doc-pipeline-opensearch-sg-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Secrets Manager for OpenSearch master user
  OpenSearchMasterUserSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'doc-pipeline-opensearch-master-${Environment}'
      Description: Master user credentials for OpenSearch fine-grained access control
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@\\'
      KmsKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # OpenSearch Domain
  OpenSearchDomain:
    Type: AWS::OpenSearchService::Domain
    Properties:
      DomainName: !Sub 'doc-pipeline-${Environment}'
      EngineVersion: 'OpenSearch_2.11'
      ClusterConfig:
        InstanceType: !Ref OpenSearchInstanceType
        InstanceCount: 3
        ZoneAwarenessEnabled: true
        ZoneAwarenessConfig:
          AvailabilityZoneCount: 3
        DedicatedMasterEnabled: false
      EBSOptions:
        EBSEnabled: true
        VolumeType: gp3
        VolumeSize: 100
        Iops: 3000
        Throughput: 125
      VPCOptions:
        SubnetIds: !Ref PrivateSubnetIds
        SecurityGroupIds:
          - !Ref OpenSearchSecurityGroup
      NodeToNodeEncryptionOptions:
        Enabled: true
      EncryptionAtRestOptions:
        Enabled: true
        KmsKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']
      AdvancedSecurityOptions:
        Enabled: true
        InternalUserDatabaseEnabled: true
        MasterUserOptions:
          MasterUserName: !Sub '{{resolve:secretsmanager:${OpenSearchMasterUserSecret}:SecretString:username}}'
          MasterUserPassword: !Sub '{{resolve:secretsmanager:${OpenSearchMasterUserSecret}:SecretString:password}}'
      DomainEndpointOptions:
        EnforceHTTPS: true
        TLSSecurityPolicy: 'Policy-Min-TLS-1-2-2019-07'
      AdvancedOptions:
        'rest.action.multi.allow_explicit_index': 'true'
        'indices.fielddata.cache.size': '20'
        'indices.query.bool.max_clause_count': '1024'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: DataClassification
          Value: !Ref DataClassification

  # DynamoDB Table
  DocumentsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'doc-pipeline-documents-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: DocumentId
          AttributeType: S
        - AttributeName: Version
          AttributeType: N
        - AttributeName: OwnerId
          AttributeType: S
        - AttributeName: UploadDate
          AttributeType: S
        - AttributeName: Status
          AttributeType: S
      KeySchema:
        - AttributeName: DocumentId
          KeyType: HASH
        - AttributeName: Version
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: OwnerIdIndex
          KeySchema:
            - AttributeName: OwnerId
              KeyType: HASH
            - AttributeName: UploadDate
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: StatusIndex
          KeySchema:
            - AttributeName: Status
              KeyType: HASH
            - AttributeName: UploadDate
              KeyType: RANGE
          Projection:
            ProjectionType: KEYS_ONLY
      TimeToLiveSpecification:
        AttributeName: TTL
        Enabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
        SSEType: !If [UseCustomKmsKey, 'KMS', 'AES256']
        KMSMasterKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: DataClassification
          Value: !Ref DataClassification

  # IAM Roles
  PreprocessLambdaRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: PreprocessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource: !Sub '${RawDocumentsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'sqs:ReceiveMessage'
                  - 'sqs:DeleteMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !GetAtt IngestQueue.Arn
              - Effect: Allow
                Action:
                  - 'states:StartExecution'
                Resource: !Ref DocumentProcessingStateMachine
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              - !If
                - UseCustomKmsKey
                - Effect: Allow
                  Action:
                    - 'kms:Decrypt'
                  Resource: !Ref KmsKeyArn
                  Condition:
                    StringEquals:
                      'kms:ViaService': 
                        - !Sub 's3.${AWS::Region}.amazonaws.com'
                        - !Sub 'sqs.${AWS::Region}.amazonaws.com'
                - !Ref 'AWS::NoValue'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PostprocessLambdaRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: PostprocessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource: !Sub '${RawDocumentsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                Resource: !Sub '${ProcessedDocumentsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:GetItem'
                Resource:
                  - !GetAtt DocumentsTable.Arn
                  - !Sub '${DocumentsTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - 'es:ESHttpPost'
                  - 'es:ESHttpPut'
                Resource:
                  - !Sub '${OpenSearchDomain.Arn}/*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref ProcessingCompleteTopic
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref OpenSearchMasterUserSecret
              - !If
                - UseCustomKmsKey
                - Effect: Allow
                  Action:
                    - 'kms:Decrypt'
                    - 'kms:GenerateDataKey'
                  Resource: !Ref KmsKeyArn
                - !Ref 'AWS::NoValue'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  SearchLambdaRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: SearchPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'es:ESHttpGet'
                  - 'es:ESHttpPost'
                Resource:
                  - !Sub '${OpenSearchDomain.Arn}/*'
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                Resource:
                  - !GetAtt DocumentsTable.Arn
                  - !Sub '${DocumentsTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref OpenSearchMasterUserSecret
              - !If
                - UseCustomKmsKey
                - Effect: Allow
                  Action:
                    - 'kms:Decrypt'
                  Resource: !Ref KmsKeyArn
                - !Ref 'AWS::NoValue'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  StepFunctionsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: StepFunctionsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'lambda:InvokeFunction'
                Resource:
                  - !GetAtt PreprocessFunction.Arn
                  - !GetAtt PostprocessFunction.Arn
              - Effect: Allow
                Action:
                  - 'textract:StartDocumentTextDetection'
                  - 'textract:StartDocumentAnalysis'
                  - 'textract:GetDocumentTextDetection'
                  - 'textract:GetDocumentAnalysis'
                  - 'textract:DetectDocumentText'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'comprehend:DetectEntities'
                  - 'comprehend:DetectKeyPhrases'
                  - 'comprehend:DetectPiiEntities'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                Resource: !Sub '${RawDocumentsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                Resource: !GetAtt StateMachineDLQ.Arn
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref ProcessingFailureTopic
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'DocumentPipeline'
              - !If
                - UseCustomKmsKey
                - Effect: Allow
                  Action:
                    - 'kms:Decrypt'
                  Resource: !Ref KmsKeyArn
                - !Ref 'AWS::NoValue'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Lambda Functions
  PreprocessFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'doc-pipeline-preprocess-${Environment}'
      Runtime: python3.11
      Handler: index.handler
      Architectures: [arm64]
      Timeout: 60
      MemorySize: 512
      ReservedConcurrentExecutions: !Ref LambdaReservedConcurrency
      Role: !GetAtt PreprocessLambdaRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
      Environment:
        Variables:
          STATE_MACHINE_ARN: !Ref DocumentProcessingStateMachine
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import logging
          from urllib.parse import unquote_plus
          import hashlib
          import uuid
          from datetime import datetime
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          s3_client = boto3.client('s3')
          sfn_client = boto3.client('stepfunctions')
          
          STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']
          
          def handler(event, context):
              """
              Preprocesses S3 upload events from SQS and starts Step Functions workflow
              """
              for record in event['Records']:
                  try:
                      # Parse SQS message
                      message_body = json.loads(record['body'])
                      
                      # Extract S3 event details
                      for s3_record in message_body['Records']:
                          bucket = s3_record['s3']['bucket']['name']
                          key = unquote_plus(s3_record['s3']['object']['key'])
                          size = s3_record['s3']['object']['size']
                          
                          logger.info(json.dumps({
                              'event': 'document_received',
                              'bucket': bucket,
                              'key': key,
                              'size': size
                          }))
                          
                          # Validate document
                          if size > 50 * 1024 * 1024:  # 50MB limit
                              raise ValueError(f"File too large: {size} bytes")
                          
                          # Get content type
                          head_response = s3_client.head_object(Bucket=bucket, Key=key)
                          content_type = head_response.get('ContentType', '')
                          
                          # Generate document ID
                          doc_id = hashlib.sha256(key.encode()).hexdigest()[:16]
                          
                          # Prepare Step Functions input
                          sfn_input = {
                              'documentId': doc_id,
                              'bucket': bucket,
                              'key': key,
                              'size': size,
                              'contentType': content_type,
                              'uploadTimestamp': datetime.utcnow().isoformat(),
                              'executionId': str(uuid.uuid4())
                          }
                          
                          # Start Step Functions execution
                          response = sfn_client.start_execution(
                              stateMachineArn=STATE_MACHINE_ARN,
                              name=f"{doc_id}-{int(datetime.utcnow().timestamp())}",
                              input=json.dumps(sfn_input)
                          )
                          
                          logger.info(json.dumps({
                              'event': 'workflow_started',
                              'executionArn': response['executionArn'],
                              'documentId': doc_id
                          }))
                          
                  except Exception as e:
                      logger.error(json.dumps({
                          'event': 'preprocessing_error',
                          'error': str(e),
                          'record': record
                      }))
                      raise
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  PostprocessFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'doc-pipeline-postprocess-${Environment}'
      Runtime: python3.11
      Handler: index.handler
      Architectures: [arm64]
      Timeout: 300
      MemorySize: 1024
      ReservedConcurrentExecutions: !Ref LambdaReservedConcurrency
      Role: !GetAtt PostprocessLambdaRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
      Environment:
        Variables:
          PROCESSED_BUCKET: !Ref ProcessedDocumentsBucket
          TABLE_NAME: !Ref DocumentsTable
          OPENSEARCH_ENDPOINT: !GetAtt OpenSearchDomain.DomainEndpoint
          SNS_TOPIC_ARN: !Ref ProcessingCompleteTopic
          OPENSEARCH_SECRET_ARN: !Ref OpenSearchMasterUserSecret
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import logging
          from datetime import datetime
          import hashlib
          import base64
          from botocore.auth import SigV4Auth
          from botocore.awsrequest import AWSRequest
          import requests
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          sns_client = boto3.client('sns')
          secrets_client = boto3.client('secretsmanager')
          
          PROCESSED_BUCKET = os.environ['PROCESSED_BUCKET']
          TABLE_NAME = os.environ['TABLE_NAME']
          OPENSEARCH_ENDPOINT = os.environ['OPENSEARCH_ENDPOINT']
          SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
          OPENSEARCH_SECRET_ARN = os.environ['OPENSEARCH_SECRET_ARN']
          
          table = dynamodb.Table(TABLE_NAME)
          
          def get_opensearch_credentials():
              response = secrets_client.get_secret_value(SecretId=OPENSEARCH_SECRET_ARN)
              return json.loads(response['SecretString'])
          
          def index_to_opensearch(document, credentials):
              """Index document to OpenSearch with authentication"""
              url = f"https://{OPENSEARCH_ENDPOINT}/documents/_doc/{document['documentId']}"
              
              # Basic auth with master user credentials
              auth = (credentials['username'], credentials['password'])
              
              response = requests.put(
                  url,
                  json=document,
                  auth=auth,
                  headers={'Content-Type': 'application/json'},
                  timeout=30
              )
              
              if response.status_code not in [200, 201]:
                  raise Exception(f"OpenSearch indexing failed: {response.status_code} - {response.text}")
              
              return response.json()
          
          def handler(event, context):
              """
              Postprocess Textract/Comprehend results and index to OpenSearch/DynamoDB
              """
              try:
                  logger.info(json.dumps({
                      'event': 'postprocessing_started',
                      'input': event
                  }))
                  
                  # Extract results from Step Functions event
                  document_id = event['documentId']
                  textract_result = event.get('textractResult', {})
                  comprehend_result = event.get('comprehendResult', {})
                  
                  # Build processed document
                  processed_doc = {
                      'documentId': document_id,
                      'version': int(datetime.utcnow().timestamp()),
                      'originalBucket': event['bucket'],
                      'originalKey': event['key'],
                      'processedAt': datetime.utcnow().isoformat(),
                      'ocrText': ' '.join([block['Text'] for block in textract_result.get('Blocks', []) 
                                          if block['BlockType'] == 'LINE']),
                      'entities': comprehend_result.get('Entities', []),
                      'keyPhrases': comprehend_result.get('KeyPhrases', []),
                      'piiEntities': comprehend_result.get('PiiEntities', []),
                      'contentType': event['contentType'],
                      'size': event['size']
                  }
                  
                  # Save to processed bucket
                  processed_key = f"processed/{document_id}/v{processed_doc['version']}/document.json"
                  s3_client.put_object(
                      Bucket=PROCESSED_BUCKET,
                      Key=processed_key,
                      Body=json.dumps(processed_doc),
                      ContentType='application/json',
                      ServerSideEncryption='AES256'
                  )
                  
                  # Update DynamoDB
                  table.put_item(
                      Item={
                          'DocumentId': document_id,
                          'Version': processed_doc['version'],
                          'Status': 'COMPLETED',
                          'OwnerId': event.get('ownerId', 'system'),
                          'UploadDate': event['uploadTimestamp'],
                          'ProcessedDate': processed_doc['processedAt'],
                          'ProcessedS3Key': processed_key,
                          'OriginalS3Bucket': event['bucket'],
                          'OriginalS3Key': event['key'],
                          'EntityCount': len(processed_doc['entities']),
                          'Size': event['size']
                      }
                  )
                  
                  # Index to OpenSearch
                  credentials = get_opensearch_credentials()
                  opensearch_response = index_to_opensearch(processed_doc, credentials)
                  
                  # Send SNS notification
                  sns_client.publish(
                      TopicArn=SNS_TOPIC_ARN,
                      Subject=f'Document Processing Complete: {document_id}',
                      Message=json.dumps({
                          'documentId': document_id,
                          'version': processed_doc['version'],
                          'status': 'COMPLETED',
                          'processedAt': processed_doc['processedAt'],
                          'entityCount': len(processed_doc['entities']),
                          'opensearchId': opensearch_response['_id']
                      })
                  )
                  
                  logger.info(json.dumps({
                      'event': 'postprocessing_completed',
                      'documentId': document_id,
                      'version': processed_doc['version']
                  }))
                  
                  return {
                      'statusCode': 200,
                      'documentId': document_id,
                      'version': processed_doc['version'],
                      'status': 'COMPLETED'
                  }
                  
              except Exception as e:
                  logger.error(json.dumps({
                      'event': 'postprocessing_error',
                      'error': str(e),
                      'input': event
                  }))
                  raise
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  SearchFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'doc-pipeline-search-${Environment}'
      Runtime: python3.11
      Handler: index.handler
      Architectures: [arm64]
      Timeout: 30
      MemorySize: 512
      Role: !GetAtt SearchLambdaRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
      Environment:
        Variables:
          TABLE_NAME: !Ref DocumentsTable
          OPENSEARCH_ENDPOINT: !GetAtt OpenSearchDomain.DomainEndpoint
          OPENSEARCH_SECRET_ARN: !Ref OpenSearchMasterUserSecret
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import logging
          import requests
          from decimal import Decimal
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          dynamodb = boto3.resource('dynamodb')
          secrets_client = boto3.client('secretsmanager')
          
          TABLE_NAME = os.environ['TABLE_NAME']
          OPENSEARCH_ENDPOINT = os.environ['OPENSEARCH_ENDPOINT']
          OPENSEARCH_SECRET_ARN = os.environ['OPENSEARCH_SECRET_ARN']
          
          table = dynamodb.Table(TABLE_NAME)
          
          class DecimalEncoder(json.JSONEncoder):
              def default(self, o):
                  if isinstance(o, Decimal):
                      return int(o)
                  return super(DecimalEncoder, self).default(o)
          
          def get_opensearch_credentials():
              response = secrets_client.get_secret_value(SecretId=OPENSEARCH_SECRET_ARN)
              return json.loads(response['SecretString'])
          
          def search_opensearch(query_params, credentials):
              """Search OpenSearch with query parameters"""
              url = f"https://{OPENSEARCH_ENDPOINT}/documents/_search"
              
              # Build query
              query_body = {
                  'size': int(query_params.get('size', 10)),
                  'from': int(query_params.get('from', 0))
              }
              
              # Text search
              if query_params.get('q'):
                  query_body['query'] = {
                      'multi_match': {
                          'query': query_params['q'],
                          'fields': ['ocrText', 'entities.Text', 'keyPhrases.Text']
                      }
                  }
              
              # Entity filter
              if query_params.get('entity'):
                  if 'query' not in query_body:
                      query_body['query'] = {'bool': {'must': []}}
                  query_body['query']['bool']['must'].append({
                      'match': {'entities.Text': query_params['entity']}
                  })
              
              auth = (credentials['username'], credentials['password'])
              
              response = requests.post(
                  url,
                  json=query_body,
                  auth=auth,
                  headers={'Content-Type': 'application/json'},
                  timeout=30
              )
              
              if response.status_code != 200:
                  raise Exception(f"OpenSearch search failed: {response.status_code}")
              
              return response.json()
          
          def get_document_details(document_id):
              """Get document details from DynamoDB"""
              response = table.query(
                  KeyConditionExpression='DocumentId = :id',
                  ExpressionAttributeValues={':id': document_id},
                  ScanIndexForward=False,
                  Limit=1
              )
              
              if response['Items']:
                  return response['Items'][0]
              return None
          
          def handler(event, context):
              """
              Handle search and document retrieval requests
              """
              try:
                  logger.info(json.dumps({
                      'event': 'search_request',
                      'path': event['path'],
                      'parameters': event.get('queryStringParameters')
                  }))
                  
                  path = event['path']
                  http_method = event['httpMethod']
                  
                  # Get credentials
                  credentials = get_opensearch_credentials()
                  
                  if path == '/search' and http_method == 'GET':
                      # Search documents
                      query_params = event.get('queryStringParameters', {})
                      search_results = search_opensearch(query_params, credentials)
                      
                      # Enrich with DynamoDB data
                      hits = search_results['hits']['hits']
                      for hit in hits:
                          doc_id = hit['_source']['documentId']
                          dynamo_data = get_document_details(doc_id)
                          if dynamo_data:
                              hit['_source']['metadata'] = {
                                  'status': dynamo_data.get('Status'),
                                  'uploadDate': dynamo_data.get('UploadDate'),
                                  'processedDate': dynamo_data.get('ProcessedDate')
                              }
                      
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'total': search_results['hits']['total']['value'],
                              'documents': [hit['_source'] for hit in hits]
                          }, cls=DecimalEncoder)
                      }
                  
                  elif path.startswith('/documents/') and http_method == 'GET':
                      # Get specific document
                      document_id = path.split('/')[-1]
                      
                      # Get from DynamoDB
                      dynamo_data = get_document_details(document_id)
                      if not dynamo_data:
                          return {
                              'statusCode': 404,
                              'body': json.dumps({'error': 'Document not found'})
                          }
                      
                      # Get from OpenSearch
                      url = f"https://{OPENSEARCH_ENDPOINT}/documents/_doc/{document_id}"
                      auth = (credentials['username'], credentials['password'])
                      
                      response = requests.get(url, auth=auth, timeout=30)
                      
                      if response.status_code == 200:
                          opensearch_data = response.json()['_source']
                          opensearch_data['metadata'] = dynamo_data
                          
                          return {
                              'statusCode': 200,
                              'headers': {
                                  'Content-Type': 'application/json',
                                  'Access-Control-Allow-Origin': '*'
                              },
                              'body': json.dumps(opensearch_data, cls=DecimalEncoder)
                          }
                      else:
                          return {
                              'statusCode': 404,
                              'body': json.dumps({'error': 'Document not found in search index'})
                          }
                  
                  else:
                      return {
                          'statusCode': 404,
                          'body': json.dumps({'error': 'Not found'})
                      }
                      
              except Exception as e:
                  logger.error(json.dumps({
                      'event': 'search_error',
                      'error': str(e)
                  }))
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': 'Internal server error'})
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Lambda Event Source Mapping
  PreprocessEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      BatchSize: 5
      EventSourceArn: !GetAtt IngestQueue.Arn
      FunctionName: !Ref PreprocessFunction
      MaximumBatchingWindowInSeconds: 5

  # Step Functions State Machine
  DocumentProcessingStateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub 'doc-pipeline-processing-${Environment}'
      StateMachineType: STANDARD  # Standard for long-running Textract async operations
      RoleArn: !GetAtt StepFunctionsRole.Arn
      DefinitionString: !Sub |
        {
          "Comment": "Document processing pipeline with OCR and entity extraction",
          "StartAt": "DetermineProcessingType",
          "States": {
            "DetermineProcessingType": {
              "Type": "Task",
              "Resource": "arn:aws:states:::lambda:invoke",
              "Parameters": {
                "FunctionName": "${PreprocessFunction.Arn}",
                "Payload.$": "$"
              },
              "ResultSelector": {
                "documentId.$": "$.Payload.documentId",
                "bucket.$": "$.Payload.bucket", 
                "key.$": "$.Payload.key",
                "size.$": "$.Payload.size",
                "contentType.$": "$.Payload.contentType",
                "uploadTimestamp.$": "$.Payload.uploadTimestamp",
                "processingType.$": "$.Payload.processingType"
              },
              "ResultPath": "$.preprocessResult",
              "Retry": [
                {
                  "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "SendToDLQ",
                  "ResultPath": "$.error"
                }
              ],
              "Next": "CheckDocumentSize"
            },
            "CheckDocumentSize": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.size",
                  "NumericLessThan": 5242880,
                  "Next": "SyncTextractProcessing"
                }
              ],
              "Default": "AsyncTextractProcessing"
            },
            "SyncTextractProcessing": {
              "Type": "Task",
              "Resource": "arn:aws:states:::aws-sdk:textract:detectDocumentText",
              "Parameters": {
                "Document": {
                  "S3Object": {
                    "Bucket.$": "$.bucket",
                    "Name.$": "$.key"
                  }
                }
              },
              "ResultPath": "$.textractResult",
              "Retry": [
                {
                  "ErrorEquals": ["Textract.ThrottlingException"],
                  "IntervalSeconds": 10,
                  "MaxAttempts": 5,
                  "BackoffRate": 2,
                  "MaxDelaySeconds": 120
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "SendToDLQ",
                  "ResultPath": "$.error"
                }
              ],
              "Next": "ComprehendEntityDetection"
            },
            "AsyncTextractProcessing": {
              "Type": "Task",
              "Resource": "arn:aws:states:::aws-sdk:textract:startDocumentTextDetection",
              "Parameters": {
                "DocumentLocation": {
                  "S3Object": {
                    "Bucket.$": "$.bucket",
                    "Name.$": "$.key"
                  }
                },
                "NotificationChannel": {
                  "SNSTopicArn": "${ProcessingCompleteTopic}"
                }
              },
              "ResultPath": "$.textractJob",
              "Retry": [
                {
                  "ErrorEquals": ["Textract.ThrottlingException"],
                  "IntervalSeconds": 10,
                  "MaxAttempts": 5,
                  "BackoffRate": 2
                }
              ],
              "Next": "WaitForTextractJob"
            },
            "WaitForTextractJob": {
              "Type": "Wait",
              "Seconds": 30,
              "Next": "GetTextractJobStatus"
            },
            "GetTextractJobStatus": {
              "Type": "Task",
              "Resource": "arn:aws:states:::aws-sdk:textract:getDocumentTextDetection",
              "Parameters": {
                "JobId.$": "$.textractJob.JobId",
                "MaxResults": 1000
              },
              "ResultPath": "$.textractResult",
              "Next": "CheckTextractJobStatus"
            },
            "CheckTextractJobStatus": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.textractResult.JobStatus",
                  "StringEquals": "SUCCEEDED",
                  "Next": "ComprehendEntityDetection"
                },
                {
                  "Variable": "$.textractResult.JobStatus",
                  "StringEquals": "FAILED",
                  "Next": "SendToDLQ"
                }
              ],
              "Default": "WaitForTextractJob"
            },
            "ComprehendEntityDetection": {
              "Type": "Task",
              "Resource": "arn:aws:states:::aws-sdk:comprehend:detectEntities",
              "Parameters": {
                "Text.$": "$.textractResult.Blocks[?(@.BlockType == 'LINE')].Text",
                "LanguageCode": "${ComprehendLanguageCode}"
              },
              "ResultPath": "$.comprehendResult.Entities",
              "Retry": [
                {
                  "ErrorEquals": ["Comprehend.ThrottlingException"],
                  "IntervalSeconds": 5,
                  "MaxAttempts": 3,
                  "BackoffRate": 2
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "PostprocessDocument",
                  "ResultPath": "$.comprehendError"
                }
              ],
              "Next": "ComprehendKeyPhrases"
            },
            "ComprehendKeyPhrases": {
              "Type": "Task",
              "Resource": "arn:aws:states:::aws-sdk:comprehend:detectKeyPhrases",
              "Parameters": {
                "Text.$": "$.textractResult.Blocks[?(@.BlockType == 'LINE')].Text",
                "LanguageCode": "${ComprehendLanguageCode}"
              },
              "ResultPath": "$.comprehendResult.KeyPhrases",
              "Retry": [
                {
                  "ErrorEquals": ["Comprehend.ThrottlingException"],
                  "IntervalSeconds": 5,
                  "MaxAttempts": 3,
                  "BackoffRate": 2
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "PostprocessDocument",
                  "ResultPath": "$.comprehendError"
                }
              ],
              "Next": "PostprocessDocument"
            },
            "PostprocessDocument": {
              "Type": "Task",
              "Resource": "arn:aws:states:::lambda:invoke",
              "Parameters": {
                "FunctionName": "${PostprocessFunction.Arn}",
                "Payload.$": "$"
              },
              "ResultPath": "$.postprocessResult",
              "Retry": [
                {
                  "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "SendToDLQ",
                  "ResultPath": "$.error"
                }
              ],
              "Next": "EmitSuccessMetrics"
            },
            "EmitSuccessMetrics": {
              "Type": "Task",
              "Resource": "arn:aws:states:::aws-sdk:cloudwatch:putMetricData",
              "Parameters": {
                "Namespace": "DocumentPipeline",
                "MetricData": [
                  {
                    "MetricName": "DocumentsProcessed",
                    "Value": 1,
                    "Unit": "Count",
                    "Dimensions": [
                      {
                        "Name": "Environment",
                        "Value": "${Environment}"
                      }
                    ]
                  }
                ]
              },
              "End": true
            },
            "SendToDLQ": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sqs:sendMessage",
              "Parameters": {
                "QueueUrl": "${StateMachineDLQ}",
                "MessageBody.$": "$"
              },
              "Next": "NotifyFailure"
            },
            "NotifyFailure": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "${ProcessingFailureTopic}",
                "Subject": "Document Processing Failed",
                "Message.$": "$"
              },
              "Next": "EmitFailureMetrics"
            },
            "EmitFailureMetrics": {
              "Type": "Task",
              "Resource": "arn:aws:states:::aws-sdk:cloudwatch:putMetricData",
              "Parameters": {
                "Namespace": "DocumentPipeline",
                "MetricData": [
                  {
                    "MetricName": "DocumentsFailed",
                    "Value": 1,
                    "Unit": "Count",
                    "Dimensions": [
                      {
                        "Name": "Environment",
                        "Value": "${Environment}"
                      }
                    ]
                  }
                ]
              },
              "End": true
            }
          }
        }
      LoggingConfiguration:
        Level: ERROR
        IncludeExecutionData: true
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt StateMachineLogGroup.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Log Groups
  StateMachineLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/stepfunctions/doc-pipeline-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']

  PreprocessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${PreprocessFunction}'
      RetentionInDays: 30
      KmsKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']

  PostprocessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${PostprocessFunction}'
      RetentionInDays: 30
      KmsKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']

  SearchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${SearchFunction}'
      RetentionInDays: 30
      KmsKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, !Ref 'AWS::NoValue']

  # SNS Topics
  ProcessingCompleteTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'doc-pipeline-complete-${Environment}'
      DisplayName: Document Processing Completion Notifications
      KmsMasterKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, 'alias/aws/sns']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  ProcessingFailureTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'doc-pipeline-failure-${Environment}'
      DisplayName: Document Processing Failure Notifications
      KmsMasterKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, 'alias/aws/sns']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  AlarmNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'doc-pipeline-alarms-${Environment}'
      DisplayName: Document Pipeline Alarms
      Subscription:
        - Endpoint: !Ref AlarmEmail
          Protocol: email
      KmsMasterKeyId: !If [UseCustomKmsKey, !Ref KmsKeyArn, 'alias/aws/sns']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # API Gateway
  SearchApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'doc-pipeline-search-${Environment}'
      Description: Document search and retrieval API
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  SearchResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SearchApi
      ParentId: !GetAtt SearchApi.RootResourceId
      PathPart: search

  DocumentsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SearchApi
      ParentId: !GetAtt SearchApi.RootResourceId
      PathPart: documents

  DocumentIdResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SearchApi
      ParentId: !Ref DocumentsResource
      PathPart: '{id}'

  SearchMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SearchApi
      ResourceId: !Ref SearchResource
      HttpMethod: GET
      AuthorizationType: !If [UseCognitoAuth, 'COGNITO_USER_POOLS', 'AWS_IAM']
      ApiKeyRequired: !If [UseCognitoAuth, false, true]
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SearchFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  DocumentGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SearchApi
      ResourceId: !Ref DocumentIdResource
      HttpMethod: GET
      AuthorizationType: !If [UseCognitoAuth, 'COGNITO_USER_POOLS', 'AWS_IAM']
      ApiKeyRequired: !If [UseCognitoAuth, false, true]
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SearchFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - SearchMethod
      - DocumentGetMethod
    Properties:
      RestApiId: !Ref SearchApi
      StageName: !Ref Environment

  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Condition: !Not