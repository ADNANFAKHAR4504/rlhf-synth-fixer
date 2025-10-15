```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Multi-AZ Real-time Data Analytics Pipeline for Financial Technology Payment Processing

Parameters:
  EnvironmentName:
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production
    Description: Environment name for resource tagging

  KinesisShardCount:
    Type: Number
    Default: 3
    MinValue: 1
    MaxValue: 100
    Description: Number of shards for Kinesis Data Stream

  DynamoDBReadCapacity:
    Type: Number
    Default: 100
    MinValue: 5
    MaxValue: 40000
    Description: Read capacity units for DynamoDB table

  DynamoDBWriteCapacity:
    Type: Number
    Default: 100
    MinValue: 5
    MaxValue: 40000
    Description: Write capacity units for DynamoDB table

  LambdaMemorySize:
    Type: Number
    Default: 1024
    MinValue: 128
    MaxValue: 10240
    Description: Memory size for Lambda function in MB

  DataRetentionDays:
    Type: Number
    Default: 7
    MinValue: 1
    MaxValue: 365
    Description: Data retention period in days for Kinesis stream

Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PrivateSubnet1:
      CIDR: 10.0.1.0/24
    PrivateSubnet2:
      CIDR: 10.0.2.0/24
    PrivateSubnet3:
      CIDR: 10.0.3.0/24

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-analytics-vpc
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-1
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-2
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet3, CIDR]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-subnet-3
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-private-routes
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet3

  NetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-network-acl
        - Key: Environment
          Value: !Ref EnvironmentName

  NetworkAclEntryInbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 10.0.0.0/16

  NetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  SubnetNetworkAclAssociation1:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref NetworkAcl

  SubnetNetworkAclAssociation2:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref NetworkAcl

  SubnetNetworkAclAssociation3:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      NetworkAclId: !Ref NetworkAcl

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC endpoints
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-vpc-endpoint-sg
        - Key: Environment
          Value: !Ref EnvironmentName

  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub com.amazonaws.${AWS::Region}.s3
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  KinesisVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub com.amazonaws.${AWS::Region}.kinesis-streams
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub com.amazonaws.${AWS::Region}.dynamodb
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  LambdaVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub com.amazonaws.${AWS::Region}.lambda
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  KinesisDataStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub ${EnvironmentName}-payment-transactions-stream
      ShardCount: !Ref KinesisShardCount
      RetentionPeriodHours: !Ref DataRetentionDays
      StreamModeDetails:
        StreamMode: PROVISIONED
      StreamEncryption:
        EncryptionType: KMS
        KeyId: alias/aws/kinesis
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-payment-stream
        - Key: Environment
          Value: !Ref EnvironmentName

  TransactionMetadataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${EnvironmentName}-transaction-metadata
      AttributeDefinitions:
        - AttributeName: transactionId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
        - AttributeName: merchantId
          AttributeType: S
      KeySchema:
        - AttributeName: transactionId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: MerchantIndex
          KeySchema:
            - AttributeName: merchantId
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: !Ref DynamoDBReadCapacity
            WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: alias/aws/dynamodb
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-metadata-table
        - Key: Environment
          Value: !Ref EnvironmentName

  ProcessedDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${EnvironmentName}-processed-transactions-${AWS::AccountId}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: alias/aws/s3
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: INTELLIGENT_TIERING
              - TransitionInDays: 365
                StorageClass: GLACIER
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-data-bucket
        - Key: Environment
          Value: !Ref EnvironmentName

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda function
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-lambda-sg
        - Key: Environment
          Value: !Ref EnvironmentName

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-lambda-execution-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: KinesisAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kinesis:DescribeStream
                  - kinesis:GetShardIterator
                  - kinesis:GetRecords
                  - kinesis:ListShards
                  - kinesis:DescribeStreamSummary
                  - kinesis:ListStreams
                Resource: !GetAtt KinesisDataStream.Arn
        - PolicyName: DynamoDBAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:BatchWriteItem
                Resource:
                  - !GetAtt TransactionMetadataTable.Arn
                  - !Sub ${TransactionMetadataTable.Arn}/index/*
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub ${ProcessedDataBucket.Arn}/*
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-lambda-role
        - Key: Environment
          Value: !Ref EnvironmentName

  ProcessorLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-transaction-processor
      Runtime: python3.9
      Handler: index.handler
      MemorySize: !Ref LambdaMemorySize
      Timeout: 60
      ReservedConcurrentExecutions: 100
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref TransactionMetadataTable
          S3_BUCKET: !Ref ProcessedDataBucket
          ENVIRONMENT: !Ref EnvironmentName
      DeadLetterConfig:
        TargetArn: !GetAtt ProcessorDLQ.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import base64

          dynamodb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')

          def handler(event, context):
              table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
              bucket = os.environ['S3_BUCKET']
              
              for record in event['Records']:
                  try:
                      payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
                      transaction = json.loads(payload)
                      
                      transaction_id = transaction.get('transactionId')
                      timestamp = int(datetime.now().timestamp())
                      
                      table.put_item(
                          Item={
                              'transactionId': transaction_id,
                              'timestamp': timestamp,
                              'merchantId': transaction.get('merchantId', 'unknown'),
                              'amount': transaction.get('amount', 0),
                              'status': 'processed'
                          }
                      )
                      
                      s3_key = f"transactions/{datetime.now().strftime('%Y/%m/%d')}/{transaction_id}.json"
                      s3.put_object(
                          Bucket=bucket,
                          Key=s3_key,
                          Body=json.dumps(transaction),
                          ContentType='application/json'
                      )
                      
                  except Exception as e:
                      print(f"Error processing record: {str(e)}")
                      raise
              
              return {'statusCode': 200, 'body': json.dumps('Success')}
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-processor
        - Key: Environment
          Value: !Ref EnvironmentName

  ProcessorDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub ${EnvironmentName}-processor-dlq
      MessageRetentionPeriod: 1209600
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-dlq
        - Key: Environment
          Value: !Ref EnvironmentName

  KinesisEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt KinesisDataStream.Arn
      FunctionName: !GetAtt ProcessorLambdaFunction.Arn
      StartingPosition: LATEST
      BatchSize: 100
      MaximumBatchingWindowInSeconds: 5
      ParallelizationFactor: 10
      MaximumRecordAgeInSeconds: 3600
      BisectBatchOnFunctionError: true
      MaximumRetryAttempts: 3
      DestinationConfig:
        OnFailure:
          Destination: !GetAtt ProcessorDLQ.Arn

  KinesisReadThroughputAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-kinesis-read-throughput
      AlarmDescription: Alert when Kinesis read throughput is exceeded
      MetricName: GetRecords.Success
      Namespace: AWS/Kinesis
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 10000
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: StreamName
          Value: !Ref KinesisDataStream
      TreatMissingData: breaching

  KinesisWriteThroughputAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-kinesis-write-throughput
      AlarmDescription: Alert when Kinesis write throughput is exceeded
      MetricName: IncomingRecords
      Namespace: AWS/Kinesis
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 60000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: StreamName
          Value: !Ref KinesisDataStream
      TreatMissingData: notBreaching

  KinesisIteratorAgeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-kinesis-iterator-age
      AlarmDescription: Alert when Kinesis iterator age is too high
      MetricName: GetRecords.IteratorAgeMilliseconds
      Namespace: AWS/Kinesis
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 60000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: StreamName
          Value: !Ref KinesisDataStream
      TreatMissingData: notBreaching

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-lambda-errors
      AlarmDescription: Alert when Lambda function has errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ProcessorLambdaFunction
      TreatMissingData: notBreaching

  LambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-lambda-throttles
      AlarmDescription: Alert when Lambda function is throttled
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ProcessorLambdaFunction
      TreatMissingData: notBreaching

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-lambda-duration
      AlarmDescription: Alert when Lambda function duration is too high
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 30000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ProcessorLambdaFunction
      TreatMissingData: notBreaching

  DynamoDBReadCapacityAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-dynamodb-read-capacity
      AlarmDescription: Alert when DynamoDB read capacity is exceeded
      MetricName: ConsumedReadCapacityUnits
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: !Ref DynamoDBReadCapacity
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref TransactionMetadataTable
      TreatMissingData: notBreaching

  DynamoDBWriteCapacityAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-dynamodb-write-capacity
      AlarmDescription: Alert when DynamoDB write capacity is exceeded
      MetricName: ConsumedWriteCapacityUnits
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: !Ref DynamoDBWriteCapacity
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref TransactionMetadataTable
      TreatMissingData: notBreaching

  DynamoDBThrottledRequestsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-dynamodb-throttled-requests
      AlarmDescription: Alert when DynamoDB requests are throttled
      MetricName: SystemErrors
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref TransactionMetadataTable
      TreatMissingData: notBreaching

  DLQMessagesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-dlq-messages
      AlarmDescription: Alert when messages are in DLQ
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: QueueName
          Value: !GetAtt ProcessorDLQ.QueueName
      TreatMissingData: notBreaching

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC-ID

  KinesisStreamArn:
    Description: Kinesis Data Stream ARN
    Value: !GetAtt KinesisDataStream.Arn
    Export:
      Name: !Sub ${EnvironmentName}-KinesisStream-ARN

  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref TransactionMetadataTable
    Export:
      Name: !Sub ${EnvironmentName}-DynamoDB-TableName

  S3BucketName:
    Description: S3 Bucket Name for processed data
    Value: !Ref ProcessedDataBucket
    Export:
      Name: !Sub ${EnvironmentName}-S3-BucketName

  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt ProcessorLambdaFunction.Arn
    Export:
      Name: !Sub ${EnvironmentName}-Lambda-ARN

  DLQUrl:
    Description: Dead Letter Queue URL
    Value: !Ref ProcessorDLQ
    Export:
      Name: !Sub ${EnvironmentName}-DLQ-URL
```
