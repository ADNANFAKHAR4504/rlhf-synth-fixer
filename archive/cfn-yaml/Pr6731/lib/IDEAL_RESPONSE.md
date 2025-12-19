```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-Grade Distributed Event Processing System for Financial Services Platform with Exactly-Once Processing'

# =================== Parameters ===================
Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Deployment environment

  SecondaryRegion:
    Type: String
    Default: eu-west-1
    AllowedValues:
      - eu-west-1
      - eu-central-1
      - ap-southeast-1
      - ap-northeast-1
    Description: Secondary region for cross-region replication

  EventProcessingCapacity:
    Type: Number
    Default: 100000
    MinValue: 10000
    MaxValue: 1000000
    Description: Target events per minute processing capacity

  LambdaMemorySize:
    Type: Number
    Default: 1024
    AllowedValues: [128, 256, 512, 1024, 2048, 3072]
    Description: Memory allocation for Lambda functions in MB

  RetentionDays:
    Type: Number
    Default: 30
    MinValue: 7
    MaxValue: 90
    Description: Event archive retention period in days

  AlertEmail:
    Type: String
    Default: ops-team@company.com
    Description: Email address for CloudWatch alerts

  GlobalEndpointHealthCheckArn:
    Type: String
    Default: ''
    Description: Existing Route53 Recovery Control health check ARN used for EventBridge global endpoint failover routing

# =================== Mappings ===================
Mappings:
  RegionConfig:
    us-east-1:
      VpcCidr: 10.0.0.0/16
      PrivateSubnet1Cidr: 10.0.1.0/24
      PrivateSubnet2Cidr: 10.0.2.0/24
      AvailabilityZones: 2
    eu-west-1:
      VpcCidr: 10.1.0.0/16
      PrivateSubnet1Cidr: 10.1.1.0/24
      PrivateSubnet2Cidr: 10.1.2.0/24
      AvailabilityZones: 2
    eu-central-1:
      VpcCidr: 10.2.0.0/16
      PrivateSubnet1Cidr: 10.2.1.0/24
      PrivateSubnet2Cidr: 10.2.2.0/24
      AvailabilityZones: 2
    ap-southeast-1:
      VpcCidr: 10.3.0.0/16
      PrivateSubnet1Cidr: 10.3.1.0/24
      PrivateSubnet2Cidr: 10.3.2.0/24
      AvailabilityZones: 2
    ap-northeast-1:
      VpcCidr: 10.4.0.0/16
      PrivateSubnet1Cidr: 10.4.1.0/24
      PrivateSubnet2Cidr: 10.4.2.0/24
      AvailabilityZones: 2

# =================== Conditions ===================
Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  IsUSEast1: !Equals [!Ref 'AWS::Region', us-east-1]
  CreateSecondaryResources: !And
    - !Condition IsProduction
    - !Condition IsUSEast1
  HasGlobalEndpointHealthCheck: !Not [!Equals [!Ref GlobalEndpointHealthCheckArn, '']]
  CreateGlobalEndpoint: !And
    - !Condition CreateSecondaryResources
    - !Condition HasGlobalEndpointHealthCheck

# =================== Resources ===================
Resources:
  # =================== VPC and Networking ===================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [RegionConfig, !Ref 'AWS::Region', VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [RegionConfig, !Ref 'AWS::Region', PrivateSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [RegionConfig, !Ref 'AWS::Region', PrivateSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # VPC Endpoints for AWS Services
  DynamoDBEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      RouteTableIds:
        - !Ref PrivateRouteTable

  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable

  EventBridgeEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.events'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref EndpointSecurityGroup

  StepFunctionsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.states'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref EndpointSecurityGroup

  SQSEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.sqs'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref EndpointSecurityGroup

  XRayEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.xray'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref EndpointSecurityGroup

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable'
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  EndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EndpointSG'
        - Key: iac-rlhf-amazon
          Value: 'true'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-LambdaSG'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # =================== KMS Keys ===================
  MasterKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Master KMS key for all service encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: kms:*
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - dynamodb.amazonaws.com
                - sqs.amazonaws.com
                - logs.amazonaws.com
                - lambda.amazonaws.com
                - events.amazonaws.com
                - states.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-MasterKey'
        - Key: iac-rlhf-amazon
          Value: 'true'

  MasterKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-master'
      TargetKeyId: !Ref MasterKMSKey

  # =================== SNS Topic for Alerts ===================
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Alerts'
      DisplayName: Event Processing System Alerts
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  # =================== DynamoDB Global Tables ===================
  TransactionStateTable:
    Type: AWS::DynamoDB::GlobalTable
    Properties:
      TableName: !Sub '${AWS::StackName}-TransactionState'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
      AttributeDefinitions:
        - AttributeName: transactionId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
        - AttributeName: lockId
          AttributeType: S
        - AttributeName: partitionKey
          AttributeType: S
      KeySchema:
        - AttributeName: transactionId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: LockIndex
          KeySchema:
            - AttributeName: lockId
              KeyType: HASH
          Projection:
            ProjectionType: ALL
        - IndexName: PartitionIndex
          KeySchema:
            - AttributeName: partitionKey
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      Replicas:
        - Region: !Ref 'AWS::Region'
          GlobalSecondaryIndexes:
            - IndexName: LockIndex
              ContributorInsightsSpecification:
                Enabled: true
            - IndexName: PartitionIndex
              ContributorInsightsSpecification:
                Enabled: true
          ContributorInsightsSpecification:
            Enabled: true
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
          Tags:
            - Key: Environment
              Value: !Ref Environment
            - Key: iac-rlhf-amazon
              Value: 'true'
        - Region: !Ref SecondaryRegion
          GlobalSecondaryIndexes:
            - IndexName: LockIndex
              ContributorInsightsSpecification:
                Enabled: true
            - IndexName: PartitionIndex
              ContributorInsightsSpecification:
                Enabled: true
          ContributorInsightsSpecification:
            Enabled: true
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
          Tags:
            - Key: Environment
              Value: !Ref Environment
            - Key: iac-rlhf-amazon
              Value: 'true'

  IdempotencyTable:
    Type: AWS::DynamoDB::GlobalTable
    Properties:
      TableName: !Sub '${AWS::StackName}-Idempotency'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
      AttributeDefinitions:
        - AttributeName: idempotencyKey
          AttributeType: S
      KeySchema:
        - AttributeName: idempotencyKey
          KeyType: HASH
      TimeToLiveSpecification:
        AttributeName: expiryTime
        Enabled: true
      Replicas:
        - Region: !Ref 'AWS::Region'
          ContributorInsightsSpecification:
            Enabled: true
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
          Tags:
            - Key: iac-rlhf-amazon
              Value: 'true'
        - Region: !Ref SecondaryRegion
          ContributorInsightsSpecification:
            Enabled: true
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
          Tags:
            - Key: iac-rlhf-amazon
              Value: 'true'

  # =================== SQS FIFO Queues ===================
  OrderProcessingQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-OrderProcessing.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      DeduplicationScope: messageGroup
      FifoThroughputLimit: perMessageGroupId
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeout: 300
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt OrderProcessingDLQ.Arn
        maxReceiveCount: 3
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: Purpose
          Value: OrderProcessing
        - Key: iac-rlhf-amazon
          Value: 'true'

  OrderProcessingDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-OrderProcessing-DLQ.fifo'
      FifoQueue: true
      MessageRetentionPeriod: 1209600
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  PaymentValidationQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-PaymentValidation.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      DeduplicationScope: messageGroup
      FifoThroughputLimit: perMessageGroupId
      MessageRetentionPeriod: 1209600
      VisibilityTimeout: 300
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt PaymentValidationDLQ.Arn
        maxReceiveCount: 3
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: Purpose
          Value: PaymentValidation
        - Key: iac-rlhf-amazon
          Value: 'true'

  PaymentValidationDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-PaymentValidation-DLQ.fifo'
      FifoQueue: true
      MessageRetentionPeriod: 1209600
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  FraudDetectionQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-FraudDetection.fifo'
      FifoQueue: true
      ContentBasedDeduplication: true
      DeduplicationScope: messageGroup
      FifoThroughputLimit: perMessageGroupId
      MessageRetentionPeriod: 1209600
      VisibilityTimeout: 300
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt FraudDetectionDLQ.Arn
        maxReceiveCount: 3
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: Purpose
          Value: FraudDetection
        - Key: iac-rlhf-amazon
          Value: 'true'

  FraudDetectionDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-FraudDetection-DLQ.fifo'
      FifoQueue: true
      MessageRetentionPeriod: 1209600
      KmsMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  DeploymentArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  # =================== Lambda Functions ===================
  EventTransformerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-EventTransformer'
      Runtime: python3.11  # Fixed from provided.al2
      Handler: index.lambda_handler
      Code:
        ZipFile: |
          import json
          import boto3
          import uuid
          import os
          import time
          from datetime import datetime
          try:
              from aws_xray_sdk.core import xray_recorder  # type: ignore
              from aws_xray_sdk.core import patch_all  # type: ignore
          except ImportError:
              class _DummySubsegment:
                  def add_exception(self, *_args, **_kwargs):
                      pass
              
              class _DummyRecorder:
                  def capture(self, *_args, **_kwargs):
                      def decorator(func):
                          return func
                      return decorator
                  
                  def begin_subsegment(self, *_args, **_kwargs):
                      pass
                  
                  def end_subsegment(self):
                      pass
                  
                  def current_subsegment(self):
                      return _DummySubsegment()
              
              def patch_all():
                  pass
              
              xray_recorder = _DummyRecorder()
          
          # Patch boto3 for X-Ray tracing when available
          patch_all()
          
          dynamodb = boto3.resource('dynamodb')
          sqs = boto3.client('sqs')
          
          IDEMPOTENCY_TABLE = os.environ['IDEMPOTENCY_TABLE']
          TRANSACTION_TABLE = os.environ['DYNAMODB_TABLE']
          
          @xray_recorder.capture('transform_event')
          def transform_event(raw_event):
              """Transform raw event into standardized format with validation"""
              # Generate unique transaction ID if not present
              transaction_id = raw_event.get('transactionId', str(uuid.uuid4()))
              
              # Validate required fields
              required_fields = ['amount', 'type']
              for field in required_fields:
                  if field not in raw_event:
                      raise ValueError(f'Missing required field: {field}')
              
              # Apply transformation logic
              transformed = {
                  'transactionId': transaction_id,
                  'timestamp': raw_event.get('timestamp', int(time.time() * 1000)),
                  'amount': float(raw_event.get('amount')),
                  'currency': raw_event.get('currency', 'USD'),
                  'type': raw_event.get('type'),
                  'customerId': raw_event.get('customerId'),
                  'merchantId': raw_event.get('merchantId'),
                  'metadata': raw_event.get('metadata', {}),
                  'processingTime': datetime.utcnow().isoformat(),
                  'region': os.environ['AWS_REGION']
              }
              
              # Add partition key for even distribution
              transformed['partitionKey'] = f"tx-{transaction_id[:8]}"
              
              return transformed
          
          @xray_recorder.capture('check_idempotency')
          def check_idempotency(transaction_id):
              """Check if this transaction has already been processed"""
              table = dynamodb.Table(IDEMPOTENCY_TABLE)
              
              try:
                  # Try to insert with conditional check
                  table.put_item(
                      Item={
                          'idempotencyKey': transaction_id,
                          'processedAt': int(time.time()),
                          'expiryTime': int(time.time()) + 86400  # 24 hour TTL
                      },
                      ConditionExpression='attribute_not_exists(idempotencyKey)'
                  )
                  return False  # Not a duplicate
              except table.meta.client.exceptions.ConditionalCheckFailedException:
                  return True  # Duplicate transaction
          
          def lambda_handler(event, context):
              """Main handler for event transformation with idempotency check"""
              xray_recorder.begin_subsegment('event_processing')
              
              try:
                  # Handle both direct invocation and SQS events
                  if 'Records' in event:
                      # SQS event
                      results = []
                      for record in event['Records']:
                          body = json.loads(record['body'])
                          transaction_id = body.get('transactionId', str(uuid.uuid4()))
                          
                          # Check idempotency
                          if check_idempotency(transaction_id):
                              print(f"Duplicate transaction detected: {transaction_id}")
                              continue
                          
                          transformed = transform_event(body)
                          results.append(transformed)
                          
                          # Store in DynamoDB for state tracking
                          table = dynamodb.Table(TRANSACTION_TABLE)
                          table.put_item(Item=transformed)
                      
                      return {
                          'statusCode': 200,
                          'processedCount': len(results),
                          'results': results
                      }
                  else:
                      # Direct invocation
                      transaction_id = event.get('transactionId', str(uuid.uuid4()))
                      
                      # Check idempotency
                      if check_idempotency(transaction_id):
                          return {
                              'statusCode': 200,
                              'duplicate': True,
                              'transactionId': transaction_id
                          }
                      
                      transformed = transform_event(event)
                      
                      # Store in DynamoDB
                      table = dynamodb.Table(TRANSACTION_TABLE)
                      table.put_item(Item=transformed)
                      
                      return {
                          'statusCode': 200,
                          'body': json.dumps(transformed)
                      }
              
              except Exception as e:
                  xray_recorder.current_subsegment().add_exception(e)
                  print(f"Error processing event: {str(e)}")
                  raise
              finally:
                  xray_recorder.end_subsegment()
      MemorySize: !Ref LambdaMemorySize
      Timeout: 60
      ReservedConcurrentExecutions: 100
      Architectures:
        - arm64
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref TransactionStateTable
          IDEMPOTENCY_TABLE: !Ref IdempotencyTable
          XRAY_ENABLED: 'true'
          ENVIRONMENT: !Ref Environment
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      TracingConfig:
        Mode: Active
      Tags:
        - Key: Purpose
          Value: EventTransformation
        - Key: iac-rlhf-amazon
          Value: 'true'
      Role: !GetAtt LambdaExecutionRole.Arn

  DistributedLockFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-DistributedLock'
      Runtime: python3.11  # Fixed from provided.al2
      Handler: index.lambda_handler
      Code:
        ZipFile: |
          import json
          import boto3
          import time
          import os
          from datetime import datetime, timedelta
          try:
              from aws_xray_sdk.core import xray_recorder  # type: ignore
              from aws_xray_sdk.core import patch_all  # type: ignore
          except ImportError:
              class _DummySubsegment:
                  def add_exception(self, *_args, **_kwargs):
                      pass
              
              class _DummyRecorder:
                  def capture(self, *_args, **_kwargs):
                      def decorator(func):
                          return func
                      return decorator
                  
                  def begin_subsegment(self, *_args, **_kwargs):
                      pass
                  
                  def end_subsegment(self):
                      pass
                  
                  def current_subsegment(self):
                      return _DummySubsegment()
              
              def patch_all():
                  pass
              
              xray_recorder = _DummyRecorder()
          
          patch_all()
          
          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')
          
          LOCK_TABLE = os.environ['LOCK_TABLE']
          LOCK_TTL_SECONDS = int(os.environ.get('LOCK_TTL', '300'))
          
          @xray_recorder.capture('acquire_lock')
          def acquire_lock(lock_id, owner_id, ttl_seconds=None):
              """Acquire distributed lock with automatic expiry"""
              table = dynamodb.Table(LOCK_TABLE)
              ttl = ttl_seconds or LOCK_TTL_SECONDS
              expiry_time = int(time.time()) + ttl
              
              try:
                  # Attempt to acquire lock with conditional write
                  response = table.put_item(
                      Item={
                          'lockId': lock_id,
                          'transactionId': lock_id,  # Required for table schema
                          'timestamp': int(time.time() * 1000),
                          'ownerId': owner_id,
                          'acquiredAt': datetime.utcnow().isoformat(),
                          'expiryTime': expiry_time,
                          'lockType': 'DISTRIBUTED',
                          'partitionKey': f"lock-{lock_id[:8]}"
                      },
                      ConditionExpression='attribute_not_exists(lockId) OR expiryTime < :now',
                      ExpressionAttributeValues={
                          ':now': int(time.time())
                      }
                  )
                  
                  # Log metric for successful lock acquisition
                  cloudwatch.put_metric_data(
                      Namespace='DistributedLocking',
                      MetricData=[
                          {
                              'MetricName': 'LocksAcquired',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': os.environ['ENVIRONMENT']}
                              ]
                          }
                      ]
                  )
                  
                  return {
                      'locked': True,
                      'lockId': lock_id,
                      'ownerId': owner_id,
                      'expiryTime': expiry_time
                  }
                  
              except table.meta.client.exceptions.ConditionalCheckFailedException:
                  # Lock is already held, check if we can steal expired lock
                  existing_lock = table.get_item(Key={'lockId': lock_id, 'timestamp': 0})
                  
                  if 'Item' in existing_lock:
                      current_expiry = existing_lock['Item'].get('expiryTime', 0)
                      if current_expiry < int(time.time()):
                          # Lock has expired, try to steal it
                          return acquire_lock(lock_id, owner_id, ttl_seconds)
                  
                  # Log metric for failed lock acquisition
                  cloudwatch.put_metric_data(
                      Namespace='DistributedLocking',
                      MetricData=[
                          {
                              'MetricName': 'LocksFailed',
                              'Value': 1,
                              'Unit': 'Count'
                          }
                      ]
                  )
                  
                  return {
                      'locked': False,
                      'message': 'Lock already held',
                      'currentOwner': existing_lock.get('Item', {}).get('ownerId', 'unknown')
                  }
          
          @xray_recorder.capture('release_lock')
          def release_lock(lock_id, owner_id):
              """Release a distributed lock"""
              table = dynamodb.Table(LOCK_TABLE)
              
              try:
                  # Delete lock only if we own it
                  table.delete_item(
                      Key={
                          'lockId': lock_id,
                          'timestamp': 0  # Use 0 for lock entries
                      },
                      ConditionExpression='ownerId = :owner',
                      ExpressionAttributeValues={
                          ':owner': owner_id
                      }
                  )
                  return {'released': True, 'lockId': lock_id}
                  
              except table.meta.client.exceptions.ConditionalCheckFailedException:
                  return {'released': False, 'message': 'Lock not owned by caller'}
          
          @xray_recorder.capture('extend_lock')
          def extend_lock(lock_id, owner_id, extension_seconds=None):
              """Extend the TTL of an existing lock"""
              table = dynamodb.Table(LOCK_TABLE)
              extension = extension_seconds or LOCK_TTL_SECONDS
              new_expiry = int(time.time()) + extension
              
              try:
                  table.update_item(
                      Key={
                          'lockId': lock_id,
                          'timestamp': 0
                      },
                      UpdateExpression='SET expiryTime = :new_expiry',
                      ConditionExpression='ownerId = :owner AND expiryTime > :now',
                      ExpressionAttributeValues={
                          ':new_expiry': new_expiry,
                          ':owner': owner_id,
                          ':now': int(time.time())
                      }
                  )
                  return {'extended': True, 'newExpiry': new_expiry}
                  
              except table.meta.client.exceptions.ConditionalCheckFailedException:
                  return {'extended': False, 'message': 'Lock expired or not owned'}
          
          def lambda_handler(event, context):
              """Main handler for distributed lock operations"""
              operation = event.get('operation', 'acquire')
              lock_id = event['lockId']
              owner_id = event['ownerId']
              
              if operation == 'acquire':
                  ttl = event.get('ttlSeconds')
                  return acquire_lock(lock_id, owner_id, ttl)
              elif operation == 'release':
                  return release_lock(lock_id, owner_id)
              elif operation == 'extend':
                  extension = event.get('extensionSeconds')
                  return extend_lock(lock_id, owner_id, extension)
              else:
                  return {'error': f'Unknown operation: {operation}'}
      MemorySize: 512
      Timeout: 30
      Architectures:
        - arm64
      Environment:
        Variables:
          LOCK_TABLE: !Ref TransactionStateTable
          LOCK_TTL: '300'
          ENVIRONMENT: !Ref Environment
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      TracingConfig:
        Mode: Active
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'
      Role: !GetAtt LambdaExecutionRole.Arn

  SagaCoordinatorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-SagaCoordinator'
      Runtime: python3.11  # Fixed from provided.al2
      Handler: index.lambda_handler
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          try:
              from aws_xray_sdk.core import xray_recorder  # type: ignore
              from aws_xray_sdk.core import patch_all  # type: ignore
          except ImportError:
              class _DummySubsegment:
                  def add_exception(self, *_args, **_kwargs):
                      pass
              
              class _DummyRecorder:
                  def capture(self, *_args, **_kwargs):
                      def decorator(func):
                          return func
                      return decorator
                  
                  def begin_subsegment(self, *_args, **_kwargs):
                      pass
                  
                  def end_subsegment(self):
                      pass
                  
                  def current_subsegment(self):
                      return _DummySubsegment()
              
              def patch_all():
                  pass
              
              xray_recorder = _DummyRecorder()
          
          patch_all()
          
          stepfunctions = boto3.client('stepfunctions')
          dynamodb = boto3.resource('dynamodb')
          events = boto3.client('events')
          
          STATE_TABLE = os.environ['STATE_TABLE']
          EVENT_BUS = os.environ['EVENT_BUS']
          
          table = dynamodb.Table(STATE_TABLE)
          
          def load_saga_state(transaction_id, timestamp):
              if not transaction_id:
                  return None
              try:
                  response = table.get_item(
                      Key={
                          'transactionId': transaction_id,
                          'timestamp': timestamp
                      }
                  )
                  return response.get('Item')
              except Exception:
                  return None
          
          def persist_saga_state(state, status='IN_PROGRESS'):
              transaction_id = state.get('transactionId')
              timestamp = state.get('timestamp', 0)
              if not transaction_id:
                  return
              
              merged_state = dict(state)
              merged_state.setdefault('completedSteps', [])
              merged_state['sagaStatus'] = status
              
              table.put_item(
                  Item={
                      'transactionId': transaction_id,
                      'timestamp': timestamp,
                      'completedSteps': merged_state.get('completedSteps', []),
                      'sagaStatus': merged_state['sagaStatus'],
                      'sagaState': merged_state
                  }
              )
          
          @xray_recorder.capture('handle_rollback')
          def handle_rollback(saga_state, compensation_type):
              """Handle rollback for failed saga transactions"""
              transaction_id = saga_state.get('transactionId')
              
              compensation_steps = {
                  'ORDER': ['cancel_order', 'release_inventory', 'notify_customer'],
                  'PAYMENT': ['reverse_payment', 'update_balance', 'log_reversal'],
                  'FRAUD': ['unblock_account', 'reset_risk_score', 'notify_security']
              }
              
              steps = compensation_steps.get(compensation_type, [])
              rollback_results = []
              
              for step in steps:
                  try:
                      # Execute compensation step
                      result = execute_compensation_step(step, saga_state)
                      rollback_results.append({
                          'step': step,
                          'status': 'SUCCESS',
                          'timestamp': datetime.utcnow().isoformat()
                      })
                      
                      # Update state table
                      table.update_item(
                          Key={
                              'transactionId': transaction_id,
                              'timestamp': saga_state.get('timestamp', 0)
                          },
                          UpdateExpression='SET compensationStatus = :status, compensationSteps = :steps',
                          ExpressionAttributeValues={
                              ':status': f'COMPENSATED_{compensation_type}',
                              ':steps': rollback_results
                          }
                      )
                      
                  except Exception as e:
                      rollback_results.append({
                          'step': step,
                          'status': 'FAILED',
                          'error': str(e),
                          'timestamp': datetime.utcnow().isoformat()
                      })
                      
                      # Send compensation failure event
                      events.put_events(
                          Entries=[
                              {
                                  'Source': 'saga.coordinator',
                                  'DetailType': 'CompensationFailed',
                                  'Detail': json.dumps({
                                      'transactionId': transaction_id,
                                      'compensationType': compensation_type,
                                      'failedStep': step,
                                      'error': str(e)
                                  }),
                                  'EventBusName': EVENT_BUS
                              }
                          ]
                      )
              
              return {
                  'compensationType': compensation_type,
                  'transactionId': transaction_id,
                  'rollbackResults': rollback_results,
                  'status': 'COMPLETED'
              }
          
          def execute_compensation_step(step, saga_state):
              """Execute individual compensation step"""
              # Implementation would include actual compensation logic
              # For now, return success
              return {'step': step, 'executed': True}
          
          @xray_recorder.capture('determine_next_step')
          def determine_next_step(saga_state):
              """Determine the next step in the saga"""
              completed_steps = saga_state.get('completedSteps', [])
              
              saga_flow = [
                  'validate_order',
                  'reserve_inventory',
                  'process_payment',
                  'check_fraud',
                  'confirm_order',
                  'notify_customer'
              ]
              
              for step in saga_flow:
                  if step not in completed_steps:
                      return step
              
              return 'saga_complete'
          
          @xray_recorder.capture('coordinate_saga')
          def lambda_handler(event, context):
              """Main saga coordinator handler"""
              saga_state = event.get('sagaState', {})
              saga_state.setdefault('completedSteps', [])
              
              transaction_id = saga_state.get('transactionId')
              saga_timestamp = saga_state.get('timestamp', 0)
              
              persisted = load_saga_state(transaction_id, saga_timestamp)
              if persisted:
                  stored_state = persisted.get('sagaState', {})
                  stored_steps = stored_state.get('completedSteps', [])
                  incoming_steps = saga_state.get('completedSteps', [])
                  saga_state = {**stored_state, **saga_state}
                  saga_state['completedSteps'] = list({step: None for step in stored_steps + incoming_steps}.keys())
              else:
                  saga_state.setdefault('timestamp', saga_timestamp)
                  persist_saga_state(saga_state)
              
              # Handle rollback if requested
              if event.get('rollback'):
                  compensation_type = event.get('compensationType')
                  result = handle_rollback(saga_state, compensation_type)
                  persist_saga_state(saga_state, status=f"COMPENSATING_{compensation_type}")
                  return result
              
              # Continue with next saga step
              next_step = determine_next_step(saga_state)
              
              if next_step == 'saga_complete':
                  # Update final state
                  table = dynamodb.Table(STATE_TABLE)
                  table.update_item(
                      Key={
                          'transactionId': saga_state.get('transactionId'),
                          'timestamp': saga_state.get('timestamp', 0)
                      },
                      UpdateExpression='SET sagaStatus = :status, completedAt = :time',
                      ExpressionAttributeValues={
                          ':status': 'COMPLETED',
                          ':time': datetime.utcnow().isoformat()
                      }
                  )
                  
                  # Send completion event
                  events.put_events(
                      Entries=[
                          {
                              'Source': 'saga.coordinator',
                              'DetailType': 'SagaCompleted',
                              'Detail': json.dumps(saga_state),
                              'EventBusName': EVENT_BUS
                          }
                      ]
                  )
                  persist_saga_state(saga_state, status='COMPLETED')
              else:
                  persist_saga_state(saga_state)
              
              return {
                  'statusCode': 200,
                  'sagaState': saga_state,
                  'nextStep': next_step,
                  'timestamp': datetime.utcnow().isoformat()
              }
      MemorySize: !Ref LambdaMemorySize
      Timeout: 120
      Architectures:
        - arm64
      Environment:
        Variables:
          STATE_TABLE: !Ref TransactionStateTable
          EVENT_BUS: !Ref MainEventBus
          ENVIRONMENT: !Ref Environment
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      TracingConfig:
        Mode: Active
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'
      Role: !GetAtt LambdaExecutionRole.Arn

  VisibilityTimeoutAdjusterFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-VisibilityTimeoutAdjuster'
      Runtime: python3.11  # Fixed from provided.al2
      Handler: index.lambda_handler
      Code:
        ZipFile: |
          import boto3
          import json
          import os
          from datetime import datetime, timedelta
          try:
              from aws_xray_sdk.core import xray_recorder  # type: ignore
              from aws_xray_sdk.core import patch_all  # type: ignore
          except ImportError:
              class _DummySubsegment:
                  def add_exception(self, *_args, **_kwargs):
                      pass
              
              class _DummyRecorder:
                  def capture(self, *_args, **_kwargs):
                      def decorator(func):
                          return func
                      return decorator
                  
                  def begin_subsegment(self, *_args, **_kwargs):
                      pass
                  
                  def end_subsegment(self):
                      pass
                  
                  def current_subsegment(self):
                      return _DummySubsegment()
              
              def patch_all():
                  pass
              
              xray_recorder = _DummyRecorder()
          
          patch_all()
          
          sqs = boto3.client('sqs')
          cloudwatch = boto3.client('cloudwatch')
          
          @xray_recorder.capture('calculate_optimal_timeout')
          def calculate_optimal_timeout(function_name, queue_name):
              """Calculate optimal visibility timeout based on processing metrics"""
              
              # Get average processing time from CloudWatch
              end_time = datetime.utcnow()
              start_time = end_time - timedelta(minutes=15)
              
              response = cloudwatch.get_metric_statistics(
                  Namespace='AWS/Lambda',
                  MetricName='Duration',
                  Dimensions=[
                      {'Name': 'FunctionName', 'Value': function_name}
                  ],
                  StartTime=start_time,
                  EndTime=end_time,
                  Period=300,
                  Statistics=['Average', 'Maximum']
              )
              
              if response['Datapoints']:
                  # Sort by timestamp to get most recent
                  datapoints = sorted(response['Datapoints'], key=lambda x: x['Timestamp'], reverse=True)
                  avg_duration = datapoints[0]['Average'] / 1000  # Convert to seconds
                  max_duration = datapoints[0]['Maximum'] / 1000
                  
                  # Calculate timeout with buffer (1.5x max or 2x average, whichever is higher)
                  optimal_timeout = max(int(max_duration * 1.5), int(avg_duration * 2))
                  
                  # Enforce min/max boundaries
                  optimal_timeout = min(max(optimal_timeout, 30), 43200)  # Min 30s, Max 12 hours
              else:
                  # Default timeout if no metrics available
                  optimal_timeout = 300
              
              return optimal_timeout
          
          @xray_recorder.capture('adjust_visibility')
          def lambda_handler(event, context):
              """Dynamically adjust SQS visibility timeout based on processing patterns"""
              
              # This can be triggered by CloudWatch Events or direct invocation
              queues = event.get('queues', [
                  {
                      'queueUrl': os.environ.get('ORDER_QUEUE_URL'),
                      'processingFunction': os.environ.get('ORDER_PROCESSOR_FUNCTION')
                  },
                  {
                      'queueUrl': os.environ.get('PAYMENT_QUEUE_URL'),
                      'processingFunction': os.environ.get('PAYMENT_PROCESSOR_FUNCTION')
                  },
                  {
                      'queueUrl': os.environ.get('FRAUD_QUEUE_URL'),
                      'processingFunction': os.environ.get('FRAUD_PROCESSOR_FUNCTION')
                  }
              ])
              
              results = []
              
              for queue_config in queues:
                  if not queue_config.get('queueUrl'):
                      continue
                      
                  queue_url = queue_config['queueUrl']
                  function_name = queue_config['processingFunction']
                  
                  # Calculate optimal timeout
                  optimal_timeout = calculate_optimal_timeout(
                      function_name,
                      queue_url.split('/')[-1]
                  )
                  
                  # Update queue attributes
                  try:
                      sqs.set_queue_attributes(
                          QueueUrl=queue_url,
                          Attributes={
                              'VisibilityTimeout': str(optimal_timeout)
                          }
                      )
                      
                      results.append({
                          'queue': queue_url,
                          'newTimeout': optimal_timeout,
                          'status': 'SUCCESS'
                      })
                      
                      # Log metric
                      cloudwatch.put_metric_data(
                          Namespace='SQSOptimization',
                          MetricData=[
                              {
                                  'MetricName': 'VisibilityTimeout',
                                  'Value': optimal_timeout,
                                  'Unit': 'Seconds',
                                  'Dimensions': [
                                      {'Name': 'QueueName', 'Value': queue_url.split('/')[-1]}
                                  ]
                              }
                          ]
                      )
                      
                  except Exception as e:
                      results.append({
                          'queue': queue_url,
                          'error': str(e),
                          'status': 'FAILED'
                      })
              
              # Handle individual message visibility timeout adjustments if needed
              if 'receiptHandle' in event and 'queueUrl' in event:
                  try:
                      new_timeout = event.get('visibilityTimeout', optimal_timeout)
                      sqs.change_message_visibility(
                          QueueUrl=event['queueUrl'],
                          ReceiptHandle=event['receiptHandle'],
                          VisibilityTimeout=new_timeout
                      )
                      
                      return {
                          'statusCode': 200,
                          'adjustedTimeout': new_timeout,
                          'message': 'Individual message visibility updated'
                      }
                  except Exception as e:
                      return {
                          'statusCode': 500,
                          'error': str(e)
                      }
              
              return {
                  'statusCode': 200,
                  'adjustments': results,
                  'timestamp': datetime.utcnow().isoformat()
              }
      MemorySize: 512
      Timeout: 30
      Architectures:
        - arm64
      Environment:
        Variables:
          ORDER_QUEUE_URL: !Ref OrderProcessingQueue
          PAYMENT_QUEUE_URL: !Ref PaymentValidationQueue
          FRAUD_QUEUE_URL: !Ref FraudDetectionQueue
          ORDER_PROCESSOR_FUNCTION: !Ref EventTransformerFunction
          PAYMENT_PROCESSOR_FUNCTION: !Ref EventTransformerFunction
          FRAUD_PROCESSOR_FUNCTION: !Ref EventTransformerFunction
      TracingConfig:
        Mode: Active
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'
      Role: !GetAtt LambdaExecutionRole.Arn

  # =================== IAM Roles ===================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-LambdaExecutionRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
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
                  - dynamodb:ConditionCheckItem
                Resource:
                  - !GetAtt TransactionStateTable.Arn
                  - !GetAtt IdempotencyTable.Arn
                  - !Sub '${TransactionStateTable.Arn}/index/*'
                  - !Sub '${IdempotencyTable.Arn}/index/*'
        - PolicyName: SQSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:ChangeMessageVisibility
                  - sqs:GetQueueAttributes
                  - sqs:SetQueueAttributes
                Resource:
                  - !GetAtt OrderProcessingQueue.Arn
                  - !GetAtt PaymentValidationQueue.Arn
                  - !GetAtt FraudDetectionQueue.Arn
                  - !GetAtt OrderProcessingDLQ.Arn
                  - !GetAtt PaymentValidationDLQ.Arn
                  - !GetAtt FraudDetectionDLQ.Arn
        - PolicyName: CloudWatchMetrics
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - cloudwatch:GetMetricStatistics
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt MasterKMSKey.Arn
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  StepFunctionsExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-StepFunctionsRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: StepFunctionsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource:
                  - !GetAtt EventTransformerFunction.Arn
                  - !GetAtt DistributedLockFunction.Arn
                  - !GetAtt SagaCoordinatorFunction.Arn
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource:
                  - !GetAtt OrderProcessingQueue.Arn
                  - !GetAtt PaymentValidationQueue.Arn
                  - !GetAtt FraudDetectionQueue.Arn
                  - !GetAtt OrderProcessingDLQ.Arn
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource:
                  - !GetAtt TransactionStateTable.Arn
                  - !GetAtt IdempotencyTable.Arn
              - Effect: Allow
                Action:
                  - events:PutEvents
                Resource: !GetAtt MainEventBus.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogDelivery
                  - logs:GetLogDelivery
                  - logs:UpdateLogDelivery
                  - logs:DeleteLogDelivery
                  - logs:ListLogDeliveries
                  - logs:PutResourcePolicy
                  - logs:DescribeResourcePolicies
                  - logs:DescribeLogGroups
                Resource: '*'
              - Effect: Allow
                Action:
                  - xray:PutTraceSegments
                  - xray:PutTelemetryRecords
                Resource: '*'
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  EventBridgeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EventBridgeRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: EventBridgePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - states:StartExecution
                Resource:
                  - !Ref OrderProcessingStateMachine
                  - !Ref PaymentValidationStateMachine
                  - !Ref FraudDetectionStateMachine
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource:
                  - !GetAtt OrderProcessingQueue.Arn
                  - !GetAtt PaymentValidationQueue.Arn
                  - !GetAtt FraudDetectionQueue.Arn
              - Effect: Allow
                Action:
                  - events:PutEvents
                Resource: !Sub 'arn:aws:events:${SecondaryRegion}:${AWS::AccountId}:event-bus/${AWS::StackName}-MainBus'
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'

  # =================== Step Functions State Machines ===================
  OrderProcessingStateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub '${AWS::StackName}-OrderProcessing'
      RoleArn: !GetAtt StepFunctionsExecutionRole.Arn
      TracingConfiguration:
        Enabled: true
      LoggingConfiguration:
        Level: ALL
        IncludeExecutionData: true
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt OrderProcessingLogGroup.Arn
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'
      DefinitionString: !Sub |
        {
          "Comment": "Order Processing State Machine with Saga Pattern and Circuit Breaker",
          "StartAt": "AcquireLock",
          "States": {
            "AcquireLock": {
              "Type": "Task",
              "Resource": "${DistributedLockFunction.Arn}",
              "Parameters": {
                "operation": "acquire",
                "lockId.$": "$.transactionId",
                "ownerId.$": "$$.Execution.Name",
                "ttlSeconds": 300
              },
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0,
                  "MaxDelaySeconds": 30
                }
              ],
              "Next": "CheckLockStatus",
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "HandleError",
                  "ResultPath": "$.error"
                }
              ],
              "ResultPath": "$.lockResult"
            },
            "CheckLockStatus": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.lockResult.locked",
                  "BooleanEquals": true,
                  "Next": "ValidateOrder"
                }
              ],
              "Default": "WaitAndRetry"
            },
            "WaitAndRetry": {
              "Type": "Wait",
              "Seconds": 5,
              "Next": "AcquireLock"
            },
            "ValidateOrder": {
              "Type": "Task",
              "Resource": "arn:aws:states:::lambda:invoke",
              "Parameters": {
                "FunctionName": "${EventTransformerFunction.Arn}",
                "Payload.$": "$"
              },
              "Retry": [
                {
                  "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0
                }
              ],
              "Next": "ProcessPayment",
              "Catch": [
                {
                  "ErrorEquals": ["ValidationError"],
                  "Next": "CompensateOrder",
                  "ResultPath": "$.validationError"
                }
              ],
              "ResultPath": "$.validationResult"
            },
            "ProcessPayment": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sqs:sendMessage",
              "Parameters": {
                "QueueUrl": "${PaymentValidationQueue}",
                "MessageBody.$": "$",
                "MessageGroupId.$": "$.transactionId",
                "MessageDeduplicationId.$": "$.transactionId"
              },
              "Next": "CheckFraud",
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "CompensatePayment",
                  "ResultPath": "$.paymentError"
                }
              ],
              "ResultPath": "$.paymentResult"
            },
            "CheckFraud": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sqs:sendMessage",
              "Parameters": {
                "QueueUrl": "${FraudDetectionQueue}",
                "MessageBody.$": "$",
                "MessageGroupId.$": "$.transactionId",
                "MessageDeduplicationId.$": "States.UUID()"
              },
              "Next": "CompleteOrder",
              "Catch": [
                {
                  "ErrorEquals": ["FraudDetected"],
                  "Next": "CompensateFraud",
                  "ResultPath": "$.fraudError"
                }
              ],
              "ResultPath": "$.fraudResult"
            },
            "CompleteOrder": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:updateItem",
              "Parameters": {
                "TableName": "${TransactionStateTable}",
                "Key": {
                  "transactionId": {"S.$": "$.transactionId"},
                  "timestamp": {"N.$": "States.JsonToString($.timestamp)"}
                },
                "UpdateExpression": "SET orderStatus = :status, completedAt = :completedAt",
                "ExpressionAttributeValues": {
                  ":status": {"S": "COMPLETED"},
                  ":completedAt": {"S.$": "$$.State.EnteredTime"}
                }
              },
              "Next": "ReleaseLock",
              "ResultPath": "$.completionResult"
            },
            "ReleaseLock": {
              "Type": "Task",
              "Resource": "${DistributedLockFunction.Arn}",
              "Parameters": {
                "operation": "release",
                "lockId.$": "$.transactionId",
                "ownerId.$": "$$.Execution.Name"
              },
              "End": true,
              "ResultPath": "$.releaseResult"
            },
            "CompensateOrder": {
              "Type": "Task",
              "Resource": "${SagaCoordinatorFunction.Arn}",
              "Parameters": {
                "rollback": true,
                "sagaState.$": "$",
                "compensationType": "ORDER"
              },
              "Next": "ReleaseLock",
              "ResultPath": "$.compensationResult"
            },
            "CompensatePayment": {
              "Type": "Task",
              "Resource": "${SagaCoordinatorFunction.Arn}",
              "Parameters": {
                "rollback": true,
                "sagaState.$": "$",
                "compensationType": "PAYMENT"
              },
              "Next": "CompensateOrder",
              "ResultPath": "$.compensationResult"
            },
            "CompensateFraud": {
              "Type": "Task",
              "Resource": "${SagaCoordinatorFunction.Arn}",
              "Parameters": {
                "rollback": true,
                "sagaState.$": "$",
                "compensationType": "FRAUD"
              },
              "Next": "CompensatePayment",
              "ResultPath": "$.compensationResult"
            },
            "HandleError": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sqs:sendMessage",
              "Parameters": {
                "QueueUrl": "${OrderProcessingDLQ}",
                "MessageBody.$": "$",
                "MessageGroupId": "error"
              },
              "End": true,
              "ResultPath": "$.errorHandled"
            }
          }
        }

  PaymentValidationStateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub '${AWS::StackName}-PaymentValidation'
      RoleArn: !GetAtt StepFunctionsExecutionRole.Arn
      TracingConfiguration:
        Enabled: true
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'
      DefinitionString: !Sub |
        {
          "Comment": "Payment Validation with Circuit Breaker Pattern",
          "StartAt": "CheckCircuitBreaker",
          "States": {
            "CheckCircuitBreaker": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:getItem",
              "Parameters": {
                "TableName": "${TransactionStateTable}",
                "Key": {
                  "transactionId": {"S": "circuit-breaker-payment"},
                  "timestamp": {"N": "0"}
                }
              },
              "ResultPath": "$.circuitBreaker",
              "Next": "EvaluateCircuit",
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "InitializeCircuitBreaker",
                  "ResultPath": "$.error"
                }
              ]
            },
            "InitializeCircuitBreaker": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:putItem",
              "Parameters": {
                "TableName": "${TransactionStateTable}",
                "Item": {
                  "transactionId": {"S": "circuit-breaker-payment"},
                  "timestamp": {"N": "0"},
                  "status": {"S": "CLOSED"},
                  "failureCount": {"N": "0"},
                  "lastFailure": {"S": ""},
                  "partitionKey": {"S": "circuit-breaker"}
                }
              },
              "Next": "ValidatePayment"
            },
            "EvaluateCircuit": {
              "Type": "Choice",
              "Choices": [
                {
                  "And": [
                    {
                      "Variable": "$.circuitBreaker.Item.status.S",
                      "StringEquals": "OPEN"
                    },
                    {
                      "Variable": "$.circuitBreaker.Item.failureCount.N",
                      "NumericGreaterThan": 5
                    }
                  ],
                  "Next": "CircuitOpen"
                },
                {
                  "Variable": "$.circuitBreaker.Item.status.S",
                  "StringEquals": "HALF_OPEN",
                  "Next": "ValidatePaymentWithCaution"
                }
              ],
              "Default": "ValidatePayment"
            },
            "CircuitOpen": {
              "Type": "Fail",
              "Error": "CircuitBreakerOpen",
              "Cause": "Payment validation circuit breaker is open due to excessive failures"
            },
            "ValidatePayment": {
              "Type": "Task",
              "Resource": "${EventTransformerFunction.Arn}",
              "Retry": [
                {
                  "ErrorEquals": ["States.TaskFailed"],
                  "IntervalSeconds": 1,
                  "MaxAttempts": 3,
                  "BackoffRate": 2.0
                },
                {
                  "ErrorEquals": ["States.Timeout"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 2,
                  "BackoffRate": 2.5
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "UpdateCircuitBreaker"
                }
              ],
              "Next": "ResetCircuitBreaker"
            },
            "ValidatePaymentWithCaution": {
              "Type": "Task",
              "Resource": "${EventTransformerFunction.Arn}",
              "TimeoutSeconds": 10,
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "OpenCircuitBreaker"
                }
              ],
              "Next": "ResetCircuitBreaker"
            },
            "ResetCircuitBreaker": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:updateItem",
              "Parameters": {
                "TableName": "${TransactionStateTable}",
                "Key": {
                  "transactionId": {"S": "circuit-breaker-payment"},
                  "timestamp": {"N": "0"}
                },
                "UpdateExpression": "SET #status = :status, failureCount = :zero",
                "ExpressionAttributeNames": {
                  "#status": "status"
                },
                "ExpressionAttributeValues": {
                  ":status": {"S": "CLOSED"},
                  ":zero": {"N": "0"}
                }
              },
              "Next": "PaymentSuccess"
            },
            "UpdateCircuitBreaker": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:updateItem",
              "Parameters": {
                "TableName": "${TransactionStateTable}",
                "Key": {
                  "transactionId": {"S": "circuit-breaker-payment"},
                  "timestamp": {"N": "0"}
                },
                "UpdateExpression": "SET #status = :status, failureCount = failureCount + :inc, lastFailure = :time",
                "ExpressionAttributeNames": {
                  "#status": "status"
                },
                "ExpressionAttributeValues": {
                  ":status": {"S": "HALF_OPEN"},
                  ":inc": {"N": "1"},
                  ":time": {"S.$": "$$.State.EnteredTime"}
                }
              },
              "End": true
            },
            "OpenCircuitBreaker": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:updateItem",
              "Parameters": {
                "TableName": "${TransactionStateTable}",
                "Key": {
                  "transactionId": {"S": "circuit-breaker-payment"},
                  "timestamp": {"N": "0"}
                },
                "UpdateExpression": "SET #status = :status, lastFailure = :time",
                "ExpressionAttributeNames": {
                  "#status": "status"
                },
                "ExpressionAttributeValues": {
                  ":status": {"S": "OPEN"},
                  ":time": {"S.$": "$$.State.EnteredTime"}
                }
              },
              "Next": "CircuitOpen"
            },
            "PaymentSuccess": {
              "Type": "Succeed"
            }
          }
        }

  FraudDetectionStateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub '${AWS::StackName}-FraudDetection'
      RoleArn: !GetAtt StepFunctionsExecutionRole.Arn
      TracingConfiguration:
        Enabled: true
      Tags:
        - Key: iac-rlhf-amazon
          Value: 'true'
      DefinitionString: !Sub |
        {
          "Comment": "Fraud Detection with Parallel Checks",
          "StartAt": "EnrichTransaction",
          "States": {
            "EnrichTransaction": {
              "Type": "Task",
              "Resource": "${EventTransformerFunction.Arn}",
              "Next": "ParallelFraudChecks",
              "ResultPath": "$.enrichedData"
            },
            "ParallelFraudChecks": {
              "Type": "Parallel",
              "Branches": [
                {
                  "StartAt": "VelocityCheck",
                  "States": {
                    "VelocityCheck": {
                      "Type": "Task",
                      "Resource": "arn:aws:states:::lambda:invoke",
                      "Parameters": {
                        "FunctionName": "${EventTransformerFunction.Arn}",
                        "Payload": {
                          "checkType": "velocity",
                          "transaction.$": "$"
                        }
                      },
                      "End": true
                    }
                  }
                },
                {
                  "StartAt": "PatternAnalysis",
                  "States": {
                    "PatternAnalysis": {
                      "Type": "Task",
                      "Resource": "arn:aws:states:::lambda:invoke",
                      "Parameters": {
                        "FunctionName": "${EventTransformerFunction.Arn}",
                        "Payload": {
                          "checkType": "pattern",
                          "transaction.$": "$"
                        }
                      },
                      "End": true
                    }
                  }
                },
                {
                  "StartAt": "BlacklistCheck",
                  "States": {
                    "BlacklistCheck": {
                      "Type": "Task",
                      "Resource": "arn:aws:states:::lambda:invoke",
                      "Parameters": {
                        "FunctionName": "${EventTransformerFunction.Arn}",
                        "Payload": {
                          "checkType": "blacklist",
                          "transaction.$": "$"
                        }
                      },
                      "End": true
                    }
                  }
                }
              ],
              "Next": "EvaluateRiskScore",
              "ResultPath": "$.fraudChecks"
            },
            "EvaluateRiskScore": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.fraudChecks[0].Payload.riskScore",
                  "NumericGreaterThan": 80,
                  "Next": "FraudDetected"
                },
                {
                  "Variable": "$.fraudChecks[1].Payload.riskScore",
                  "NumericGreaterThan": 80,
                  "Next": "FraudDetected"
                },
                {
                  "Variable": "$.fraudChecks[2].Payload.riskScore",
                  "NumericGreaterThan": 80,
                  "Next": "FraudDetected"
                }
              ],
              "Default": "TransactionClean"
            },
            "FraudDetected": {
              "Type": "Task",
              "Resource": "arn:aws:states:::events:putEvents",
              "Parameters": {
                "Entries": [
                  {
                    "Source": "fraud.detection",
                    "DetailType": "Fraud Alert",
                    "Detail.$": "States.JsonToString($)",
                    "EventBusName": "${MainEventBus}"
                  }
                ]
              },
              "Next": "BlockTransaction"
            },
            "BlockTransaction": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:updateItem",
              "Parameters": {
                "TableName": "${TransactionStateTable}",
                "Key": {
                  "transactionId": {"S.$": "$.transactionId"},
                  "timestamp": {"N.$": "States.JsonToString($.timestamp)"}
                },
                "UpdateExpression": "SET fraudStatus = :status, blockedAt = :time",
                "ExpressionAttributeValues": {
                  ":status": {"S": "BLOCKED"},
                  ":time": {"S.$": "$$.State.EnteredTime"}
                }
              },
              "End": true
            },
            "TransactionClean": {
              "Type": "Succeed"
            }
          }
        }

  # =================== EventBridge Configuration ===================
  MainEventBus:
    Type: AWS::Events::EventBus
    Properties:
      Name: !Sub '${AWS::StackName}-MainBus'
      Tags:
        - Key: Purpose
          Value: MainEventRouter
        - Key: iac-rlhf-amazon
          Value: 'true'

  EventArchive:
    Type: AWS::Events::Archive
    Properties:
      ArchiveName: !Sub '${AWS::StackName}-EventArchive'
      Description: Event archive with configurable retention for replay capability
      EventPattern:
        source:
          - transaction.processing
          - payment.validation
          - fraud.detection
          - saga.coordinator
      RetentionDays: !Ref RetentionDays
      SourceArn: !GetAtt MainEventBus.Arn

  # Content-based routing rules with JSON Path expressions
  OrderRoutingRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-OrderRouting'
      Description: Route order events to processing workflow using content-based filtering
      EventBusName: !Ref MainEventBus
      EventPattern:
        source:
          - transaction.processing
        detail-type:
          - ORDER
        detail:
          currency:
            - exists: true
          type:
            - anything-but: ["REVERSAL", "CANCEL"]
      State: ENABLED
      Targets:
        - Id: OrderProcessingStateMachineTarget
          Arn: !Ref OrderProcessingStateMachine
          RoleArn: !GetAtt EventBridgeRole.Arn
          RetryPolicy:
            MaximumRetryAttempts: 2
            MaximumEventAgeInSeconds: 86400
          InputTransformer:
            InputPathsMap:
              transactionId: $.detail.transactionId
              amount: $.detail.amount
              timestamp: $.time
            InputTemplate: |
              {
                "transactionId": "<transactionId>",
                "amount": <amount>,
                "timestamp": "<timestamp>"
              }

  PaymentRoutingRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-PaymentRouting'
      Description: Route payment events using JSONPath expressions
      EventBusName: !Ref MainEventBus
      EventPattern:
        source:
          - payment.validation
        detail:
          paymentMethod:
            - prefix: CARD
          currency:
            - USD
            - EUR
            - GBP
      State: ENABLED
      Targets:
        - Id: PaymentValidationQueueTarget
          Arn: !GetAtt PaymentValidationQueue.Arn
          SqsParameters:
            MessageGroupId: $.detail.transactionId
        - Id: PaymentValidationStateMachineTarget
          Arn: !Ref PaymentValidationStateMachine
          RoleArn: !GetAtt EventBridgeRole.Arn

  FraudRoutingRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-FraudRouting'
      Description: High-risk transaction routing with advanced filtering
      EventBusName: !Ref MainEventBus
      EventPattern:
        source:
          - fraud.detection
        detail:
          transactionType:
            - anything-but: ["REVERSAL", "ADJUSTMENT"]
      State: ENABLED
      Targets:
        - Id: FraudDetectionQueueTarget
          Arn: !GetAtt FraudDetectionQueue.Arn
          SqsParameters:
            MessageGroupId: $.detail.customerId
        - Id: FraudDetectionStateMachineTarget
          Arn: !Ref FraudDetectionStateMachine
          RoleArn: !GetAtt EventBridgeRole.Arn
          InputTransformer:
            InputPathsMap:
              transactionId: $.detail.transactionId
              amount: $.detail.amount
              riskFactors: $.detail.riskFactors
            InputTemplate: |
              {
                "transactionId": "<transactionId>",
                "amount": <amount>,
                "riskFactors": <riskFactors>,
                "timestamp": <aws.events.event.ingestion-time>
              }

  # Cross-region replication rule (only for primary region)
  CrossRegionReplicationRule:
    Type: AWS::Events::Rule
    Condition: CreateSecondaryResources
    Properties:
      Name: !Sub '${AWS::StackName}-CrossRegionReplication'
      Description: Replicate critical events to secondary region
      EventBusName: !Ref MainEventBus
      EventPattern:
        source:
          - transaction.processing
          - payment.validation
        detail:
          priority:
            - HIGH
            - CRITICAL
      State: ENABLED
      Targets:
        - Id: CrossRegionEventBusTarget
          Arn: !Sub 'arn:aws:events:${SecondaryRegion}:${AWS::AccountId}:event-bus/${AWS::StackName}-MainBus'
          RoleArn: !GetAtt EventBridgeRole.Arn

  GlobalEventBridgeEndpoint:
    Type: AWS::Events::Endpoint
    Condition: CreateGlobalEndpoint
    Properties:
      Name: !Sub '${AWS::StackName}-GlobalEndpoint'
      Description: Global endpoint for failover between primary and secondary EventBridge buses
      EventBuses:
        - EventBusArn: !GetAtt MainEventBus.Arn
        - EventBusArn: !Sub 'arn:aws:events:${SecondaryRegion}:${AWS::AccountId}:event-bus/${AWS::StackName}-MainBus'
      RoutingConfig:
        FailoverConfig:
          Primary:
            HealthCheck: !Ref GlobalEndpointHealthCheckArn
          Secondary:
            Route: secondary

  # Scheduled rule for visibility timeout adjustment
  VisibilityTimeoutSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-VisibilityTimeoutSchedule'
      Description: Periodically adjust SQS visibility timeouts
      ScheduleExpression: 'rate(5 minutes)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt VisibilityTimeoutAdjusterFunction.Arn
          Id: VisibilityTimeoutAdjuster

  VisibilityTimeoutPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref VisibilityTimeoutAdjusterFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt VisibilityTimeoutSchedule.Arn

  # =================== CloudWatch Logs ===================
  OrderProcessingLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/stepfunctions/${AWS::StackName}-OrderProcessing'
      RetentionInDays: !Ref RetentionDays

  PaymentValidationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/stepfunctions/${AWS::StackName}-PaymentValidation'
      RetentionInDays: !Ref RetentionDays

  FraudDetectionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/stepfunctions/${AWS::StackName}-FraudDetection'
      RetentionInDays: !Ref RetentionDays

  # =================== CloudWatch Alarms ===================
  HighEventVolumeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighEventVolume'
      AlarmDescription: Alert when event processing exceeds threshold
      MetricName: InvocationAttempts
      Namespace: AWS/Events
      Dimensions:
        - Name: Rule
          Value: !Ref OrderRoutingRule
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: !Ref EventProcessingCapacity
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref AlertTopic

  DLQMessageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DLQMessages'
      AlarmDescription: Alert when messages arrive in DLQ
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Dimensions:
        - Name: QueueName
          Value: !GetAtt OrderProcessingDLQ.QueueName
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlertTopic

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DynamoDBThrottle'
      AlarmDescription: Alert on DynamoDB throttling
      MetricName: UserErrors
      Namespace: AWS/DynamoDB
      Dimensions:
        - Name: TableName
          Value: !Ref TransactionStateTable
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-LambdaErrors'
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref EventTransformerFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  StepFunctionsFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-StepFunctionsFailures'
      AlarmDescription: Alert on Step Functions execution failures
      MetricName: ExecutionsFailed
      Namespace: AWS/States
      Dimensions:
        - Name: StateMachineArn
          Value: !Ref OrderProcessingStateMachine
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 3
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  # =================== CloudWatch Dashboard ===================
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-Monitoring'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "title": "Event Processing Rate",
                "metrics": [
                  ["AWS/Events", "InvocationAttempts", {"stat": "Sum"}],
                  [".", "SuccessfulRuleMatches", {"stat": "Sum"}]
                ],
                "period": 60,
                "stat": "Sum",
                "region": "${AWS::Region}",
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
                "title": "Lambda Function Performance",
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                  [".", "Errors", {"stat": "Sum"}],
                  [".", "Duration", {"stat": "Average"}]
                ],
                "period": 300,
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "SQS Queue Metrics",
                "metrics": [
                  ["AWS/SQS", "NumberOfMessagesSent", {"stat": "Sum"}],
                  [".", "ApproximateNumberOfMessagesVisible", {"stat": "Average"}],
                  [".", "ApproximateAgeOfOldestMessage", {"stat": "Maximum"}]
                ],
                "period": 300,
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "DynamoDB Performance",
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                  [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}],
                  [".", "UserErrors", {"stat": "Sum"}],
                  [".", "SystemErrors", {"stat": "Sum"}]
                ],
                "period": 300,
                "region": "${AWS::Region}"
              }
            }
          ]
        }

# =================== Outputs ===================
Outputs:
  MainEventBusArn:
    Description: ARN of the main EventBridge bus
    Value: !GetAtt MainEventBus.Arn
    Export:
      Name: !Sub '${AWS::StackName}-MainEventBus'

  MainEventBusName:
    Description: Name of the main EventBridge bus
    Value: !Ref MainEventBus
    Export:
      Name: !Sub '${AWS::StackName}-MainEventBusName'

  OrderProcessingQueueUrl:
    Description: URL of the order processing FIFO queue
    Value: !Ref OrderProcessingQueue
    Export:
      Name: !Sub '${AWS::StackName}-OrderQueue'

  PaymentValidationQueueUrl:
    Description: URL of the payment validation FIFO queue
    Value: !Ref PaymentValidationQueue
    Export:
      Name: !Sub '${AWS::StackName}-PaymentQueue'

  FraudDetectionQueueUrl:
    Description: URL of the fraud detection FIFO queue
    Value: !Ref FraudDetectionQueue
    Export:
      Name: !Sub '${AWS::StackName}-FraudQueue'

  TransactionStateTableName:
    Description: Name of the transaction state global table
    Value: !Ref TransactionStateTable
    Export:
      Name: !Sub '${AWS::StackName}-StateTable'

  TransactionStateTableArn:
    Description: ARN of the transaction state global table
    Value: !GetAtt TransactionStateTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-StateTableArn'

  IdempotencyTableName:
    Description: Name of the idempotency global table
    Value: !Ref IdempotencyTable
    Export:
      Name: !Sub '${AWS::StackName}-IdempotencyTable'

  OrderProcessingStateMachineArn:
    Description: ARN of the order processing state machine
    Value: !Ref OrderProcessingStateMachine
    Export:
      Name: !Sub '${AWS::StackName}-OrderStateMachine'

  PaymentValidationStateMachineArn:
    Description: ARN of the payment validation state machine
    Value: !Ref PaymentValidationStateMachine
    Export:
      Name: !Sub '${AWS::StackName}-PaymentStateMachine'

  FraudDetectionStateMachineArn:
    Description: ARN of the fraud detection state machine
    Value: !Ref FraudDetectionStateMachine
    Export:
      Name: !Sub '${AWS::StackName}-FraudStateMachine'

  EventTransformerFunctionArn:
    Description: ARN of the event transformer Lambda function
    Value: !GetAtt EventTransformerFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EventTransformer'

  DistributedLockFunctionArn:
    Description: ARN of the distributed lock Lambda function
    Value: !GetAtt DistributedLockFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DistributedLock'

  SagaCoordinatorFunctionArn:
    Description: ARN of the saga coordinator Lambda function
    Value: !GetAtt SagaCoordinatorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SagaCoordinator'

  DashboardUrl:
    Description: URL to CloudWatch Dashboard
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}-Monitoring'

  AlertTopicArn:
    Description: ARN of the SNS topic for alerts
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopic'

  EventArchiveName:
    Description: Name of the event archive
    Value: !Ref EventArchive
    Export:
      Name: !Sub '${AWS::StackName}-EventArchive'

  VPCId:
    Description: VPC ID for the infrastructure
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  PrivateSubnet1Id:
    Description: ID of private subnet 1
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2Id:
    Description: ID of private subnet 2
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2'

  LambdaSecurityGroupId:
    Description: Security group ID for Lambda functions
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-LambdaSG'

  MasterKMSKeyId:
    Description: ID of the master KMS key
    Value: !Ref MasterKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-MasterKey'

  MasterKMSKeyArn:
    Description: ARN of the master KMS key
    Value: !GetAtt MasterKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-MasterKeyArn'

  StackRegion:
    Description: AWS Region where stack is deployed
    Value: !Ref 'AWS::Region'

  SecondaryRegionConfig:
    Description: Secondary region for disaster recovery
    Value: !Ref SecondaryRegion

  Environment:
    Description: Deployment environment
    Value: !Ref Environment

  ProcessingCapacity:
    Description: Configured event processing capacity per minute
    Value: !Ref EventProcessingCapacity
```