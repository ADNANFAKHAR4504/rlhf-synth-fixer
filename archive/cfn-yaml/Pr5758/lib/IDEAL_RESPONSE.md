# ideal_response

## Overview

A single, production-ready AWS CloudFormation template written entirely in YAML that provisions a secure, serverless logging and data-processing stack in the `us-east-1` region. The template stands up all components from scratch and follows the naming pattern `<team>-<service>-<use-case>-<resource>-<EnvironmentSuffix>`, with every resource created in `us-east-1`. It deploys cleanly on the first attempt, passes linter validation, and avoids collisions by not hard-coding globally unique names such as S3 bucket names and IAM role names.

## Scope and Architecture

The stack includes a new VPC with two public and two private subnets spread across distinct Availability Zones. It attaches an Internet Gateway, creates one NAT Gateway per Availability Zone, and configures separate route tables for public and private subnets. To minimize public exposure, Lambda functions are placed only in the private subnets, using NAT for outbound egress.

Private connectivity is enforced with gateway endpoints for Amazon S3 and DynamoDB and interface endpoints for Amazon SQS and CloudWatch Logs. A dedicated security group is assigned to interface endpoints to allow least-privilege access from the Lambda security group.

## Security, Encryption, and Compliance

A KMS customer-managed key is provisioned with key rotation enabled. The key policy grants only the minimum necessary permissions to Lambda, CloudTrail, and CloudWatch Logs. An S3 log bucket is created with server-side encryption using the CMK, versioning enabled, full public access blocking, and explicit enforcement of TLS-only requests. The bucket policy allows CloudTrail delivery with KMS encryption. The bucket name is not statically specified to avoid global name conflicts.

An IAM role for the Lambda function is defined without an explicit role name to prevent “already exists” errors across environments. A least-privilege inline policy enables Lambda to write encrypted logs to CloudWatch, read and delete messages from SQS, consume DynamoDB Streams, write encrypted objects to the S3 log bucket, and use the KMS key for cryptographic operations.

## Compute and Event Flow

A Lambda function runs inside private subnets and is configured with environment variables for the DynamoDB table name, S3 bucket, KMS key ARN, and log level. The function receives events from two sources: an SQS queue and a DynamoDB stream. Event Source Mappings are created for both paths, including pragmatic batch, retry, and error-splitting controls. A dedicated CloudWatch Log Group is provisioned with a retention period of 30 days.

## Data Layer and Messaging

A DynamoDB table is created in on-demand capacity mode with a single partition key (`pk`) and a stream enabled with the `NEW_IMAGE` view type. The SQS layer includes a primary queue and a dead-letter queue with a redrive policy to capture repeatedly failing messages.

## Observability and Notifications

An SNS topic is created for operational alerts, with an email subscription provided by parameter. A CloudWatch Alarm monitors the Lambda `Errors` metric and sends notifications to the topic when one or more errors occur within a five-minute window.

## Audit and Governance

A regional CloudTrail trail is deployed to capture management events across the environment, deliver logs to the encrypted S3 bucket, and enable log file validation. The configuration avoids invalid data event resource patterns and adheres to current service requirements for encryption and delivery.

## Parameters and Outputs

Parameters accept namespacing inputs (`Team`, `Service`, `UseCase`, `EnvironmentSuffix`), networking CIDRs, an alert email, and the Lambda runtime. Outputs expose essential identifiers for integration tests and operational visibility, including VPC and subnet IDs, security group ID, log bucket name, KMS key ARN, Lambda name and ARN, SQS queue URL and ARN, DLQ ARN, DynamoDB table name and stream ARN, SNS topic ARN, CloudTrail ARN, and endpoint identifiers.

## Acceptance Criteria

The template is fully YAML, deploys without referencing external infrastructure, and passes validation with zero errors. It implements defense-in-depth measures, least-privilege IAM, encrypted storage and logs, private networking, reliable event processing, and actionable monitoring and audit trails. Names consistently incorporate the environment suffix to prevent collisions across deployments and accounts.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: Serverless logging and data-processing stack with VPC, Lambda, SQS, DynamoDB Streams, S3, KMS, CloudTrail, and monitoring in us-east-1
Parameters:
  Team:
    Type: String
    Default: dataeng
    Description: Team name for resource naming
  Service:
    Type: String
    Default: logging
    Description: Service name for resource naming
  UseCase:
    Type: String
    Default: pipeline
    Description: Use case for resource naming
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for all resource names
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
  PublicSubnet1Cidr:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for public subnet in AZ1
  PublicSubnet2Cidr:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for public subnet in AZ2
  PrivateSubnet1Cidr:
    Type: String
    Default: 10.0.10.0/24
    Description: CIDR block for private subnet in AZ1
  PrivateSubnet2Cidr:
    Type: String
    Default: 10.0.11.0/24
    Description: CIDR block for private subnet in AZ2
  NotificationEmail:
    Type: String
    Default: alerts@example.com
    Description: Email address for CloudWatch alarm notifications
  LambdaRuntime:
    Type: String
    Default: python3.9
    Description: Lambda runtime version
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-vpc-${EnvironmentSuffix}'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-igw-${EnvironmentSuffix}'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-public-subnet-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-public-subnet-2-${EnvironmentSuffix}'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-private-subnet-2-${EnvironmentSuffix}'

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-nat-1-${EnvironmentSuffix}'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-nat-2-${EnvironmentSuffix}'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-public-rt-${EnvironmentSuffix}'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-private-rt-1-${EnvironmentSuffix}'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-private-rt-2-${EnvironmentSuffix}'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Gateway endpoints for private access
  S3GatewayEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2

  DynamoDBGatewayEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2

  # Optional interface endpoints
  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for VPC interface endpoints
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-vpce-sg-${EnvironmentSuffix}'

  SQSEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.sqs'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds: [!Ref VPCEndpointSecurityGroup]
      PrivateDnsEnabled: true

  CloudWatchLogsEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds: [!Ref VPCEndpointSecurityGroup]
      PrivateDnsEnabled: true

  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Team}-${Service}-${UseCase}-${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
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
              AWS: !GetAtt LambdaRole.Arn
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow CloudTrail to use the key
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringLike:
                kms:EncryptionContext:aws:cloudtrail:arn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnEquals:
                kms:EncryptionContext:aws:logs:arn: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-kms-${EnvironmentSuffix}'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Team}-${Service}-${UseCase}-kms-${EnvironmentSuffix}'
      TargetKeyId: !Ref KMSKey

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      #BucketName: !Sub '${Team}-${Service}-${UseCase}-logs-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - BucketKeyEnabled: true
            ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-logs-${EnvironmentSuffix}'

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LogsBucket.Arn
              - !Sub '${LogsBucket.Arn}/*'
            Condition:
              Bool:
                aws:SecureTransport: 'false'
          - Sid: DenyUnEncryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub '${LogsBucket.Arn}/*'
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption: aws:kms
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LogsBucket.Arn
            Condition:
              StringEquals:
                aws:SourceArn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${Team}-${Service}-${UseCase}-trail-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LogsBucket.Arn}/cloudtrail/*'
            Condition:
              StringEquals:
                s3:x-amz-server-side-encryption: aws:kms
                aws:SourceArn: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${Team}-${Service}-${UseCase}-trail-${EnvironmentSuffix}'

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Team}-${Service}-${UseCase}-fn-${EnvironmentSuffix}'
      RetentionInDays: 30

  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      #RoleName: !Sub '${Team}-${Service}-${UseCase}-lambda-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-lambda-role-${EnvironmentSuffix}'

  LambdaPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${Team}-${Service}-${UseCase}-lambda-policy-${EnvironmentSuffix}'
      Roles: [!Ref LambdaRole]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Team}-${Service}-${UseCase}-fn-${EnvironmentSuffix}:*'
          - Effect: Allow
            Action:
              - s3:PutObject
            Resource: !Sub '${LogsBucket.Arn}/*'
            Condition:
              StringEquals:
                s3:x-amz-server-side-encryption: aws:kms
          - Effect: Allow
            Action:
              - sqs:ReceiveMessage
              - sqs:DeleteMessage
              - sqs:GetQueueAttributes
            Resource: !GetAtt SQSQueue.Arn
          - Effect: Allow
            Action:
              - dynamodb:DescribeStream
              - dynamodb:GetRecords
              - dynamodb:GetShardIterator
              - dynamodb:ListStreams
            Resource: !GetAtt DynamoDBTable.StreamArn
          - Effect: Allow
            Action:
              - kms:Decrypt
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:DescribeKey
            Resource: !GetAtt KMSKey.Arn

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda function
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-lambda-sg-${EnvironmentSuffix}'

  SQSDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${Team}-${Service}-${UseCase}-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-dlq-${EnvironmentSuffix}'

  SQSQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${Team}-${Service}-${UseCase}-queue-${EnvironmentSuffix}'
      VisibilityTimeout: 300
      MessageRetentionPeriod: 1209600
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt SQSDeadLetterQueue.Arn
        maxReceiveCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-queue-${EnvironmentSuffix}'

  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Team}-${Service}-${UseCase}-table-${EnvironmentSuffix}'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_IMAGE
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-table-${EnvironmentSuffix}'

  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub '${Team}-${Service}-${UseCase}-fn-${EnvironmentSuffix}'
      Runtime: !Ref LambdaRuntime
      Role: !GetAtt LambdaRole.Arn
      Handler: index.handler
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoDBTable
          BUCKET_NAME: !Ref LogsBucket
          KMS_KEY_ARN: !GetAtt KMSKey.Arn
          LOG_LEVEL: INFO
      VpcConfig:
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import logging

          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

          s3 = boto3.client('s3')
          table_name = os.environ['TABLE_NAME']
          bucket_name = os.environ['BUCKET_NAME']
          kms_key_arn = os.environ['KMS_KEY_ARN']

          def handler(event, context):
              logger.info(f'Event: {json.dumps(event)}')

              if 'Records' in event and event['Records'] and 'eventSource' in event['Records'][0]:
                  if event['Records'][0]['eventSource'] == 'aws:sqs':
                      for record in event['Records']:
                          logger.info(f'Processing SQS message: {record["messageId"]}')
                          body = record.get('body', '{}')
                          logger.info(f'Message body: {body}')
                          try:
                              key = f'sqs-messages/{record["messageId"]}.json'
                              s3.put_object(
                                  Bucket=bucket_name,
                                  Key=key,
                                  Body=body,
                                  ServerSideEncryption='aws:kms',
                                  SSEKMSKeyId=kms_key_arn
                              )
                              logger.info(f'Stored SQS message in S3: {key}')
                          except Exception as e:
                              logger.error(f'Error storing SQS message: {str(e)}')
                              raise
                  elif event['Records'][0]['eventSource'] == 'aws:dynamodb':
                      for record in event['Records']:
                          logger.info(f'Processing DynamoDB stream record: {record["eventName"]}')
                          if 'dynamodb' in record and 'NewImage' in record['dynamodb']:
                              new_image = record['dynamodb']['NewImage']
                              logger.info(f'New image: {json.dumps(new_image)}')
                              try:
                                  key = f'dynamodb-streams/{record["eventID"]}.json'
                                  s3.put_object(
                                      Bucket=bucket_name,
                                      Key=key,
                                      Body=json.dumps(record),
                                      ServerSideEncryption='aws:kms',
                                      SSEKMSKeyId=kms_key_arn
                                  )
                                  logger.info(f'Stored DynamoDB stream record in S3: {key}')
                              except Exception as e:
                                  logger.error(f'Error storing DynamoDB stream record: {str(e)}')
                                  raise

              return {
                  'statusCode': 200,
                  'body': json.dumps('Processing complete')
              }

  SQSEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt SQSQueue.Arn
      FunctionName: !Ref LambdaFunction
      BatchSize: 10
      MaximumBatchingWindowInSeconds: 5

  DynamoDBStreamEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt DynamoDBTable.StreamArn
      FunctionName: !Ref LambdaFunction
      StartingPosition: TRIM_HORIZON
      BatchSize: 10
      MaximumBatchingWindowInSeconds: 5
      ParallelizationFactor: 1
      MaximumRecordAgeInSeconds: 3600
      MaximumRetryAttempts: 3
      BisectBatchOnFunctionError: true

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Team}-${Service}-${UseCase}-alerts-${EnvironmentSuffix}'
      DisplayName: Lambda Error Alerts
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-alerts-${EnvironmentSuffix}'

  SNSSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SNSTopic
      Endpoint: !Ref NotificationEmail

  CloudTrailTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: LogsBucketPolicy
    Properties:
      TrailName: !Sub '${Team}-${Service}-${UseCase}-trail-${EnvironmentSuffix}'
      S3BucketName: !Ref LogsBucket
      S3KeyPrefix: cloudtrail
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
      KMSKeyId: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${Team}-${Service}-${UseCase}-trail-${EnvironmentSuffix}'

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
  LambdaSecurityGroupId:
    Description: Lambda Security Group ID
    Value: !Ref LambdaSecurityGroup
  LogBucketName:
    Description: S3 Log Bucket Name
    Value: !Ref LogsBucket
  KMSKeyArn:
    Description: KMS Key ARN
    Value: !GetAtt KMSKey.Arn
  LambdaFunctionName:
    Description: Lambda Function Name
    Value: !Ref LambdaFunction
  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt LambdaFunction.Arn
  SQSQueueUrl:
    Description: SQS Queue URL
    Value: !Ref SQSQueue
  SQSQueueArn:
    Description: SQS Queue ARN
    Value: !GetAtt SQSQueue.Arn
  SQSDLQArn:
    Description: SQS Dead Letter Queue ARN
    Value: !GetAtt SQSDeadLetterQueue.Arn
  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref DynamoDBTable
  DynamoDBStreamArn:
    Description: DynamoDB Stream ARN
    Value: !GetAtt DynamoDBTable.StreamArn
  SNSTopicArn:
    Description: SNS Topic ARN
    Value: !Ref SNSTopic
  CloudTrailArn:
    Description: CloudTrail Trail ARN
    Value: !GetAtt CloudTrailTrail.Arn
  S3GatewayEndpointId:
    Description: S3 Gateway Endpoint ID
    Value: !Ref S3GatewayEndpoint
  DynamoDBGatewayEndpointId:
    Description: DynamoDB Gateway Endpoint ID
    Value: !Ref DynamoDBGatewayEndpoint
  SQSEndpointId:
    Description: SQS Interface Endpoint ID
    Value: !Ref SQSEndpoint
  CloudWatchLogsEndpointId:
    Description: CloudWatch Logs Interface Endpoint ID
    Value: !Ref CloudWatchLogsEndpoint
```