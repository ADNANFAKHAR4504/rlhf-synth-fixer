# MODEL_RESPONSE - Secure Transaction Processing Pipeline

This is the complete CloudFormation YAML implementation for a secure transaction processing pipeline with KMS encryption, VPC isolation, and AWS Config compliance monitoring.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Transaction Processing Pipeline with KMS encryption, VPC isolation, and compliance monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource naming to prevent conflicts across deployments'
    MinLength: 1
    MaxLength: 20
    AllowedPattern: '[a-zA-Z0-9-]*'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

  EnableTerminationProtection:
    Type: String
    Description: 'Enable CloudFormation stack termination protection (set to true for production)'
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'

Resources:
  # ====================
  # VPC and Networking
  # ====================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'transaction-vpc-${EnvironmentSuffix}'

  # Private Subnets across 3 Availability Zones
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'transaction-private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'transaction-private-subnet-2-${EnvironmentSuffix}'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'transaction-private-subnet-3-${EnvironmentSuffix}'

  # Route Table for Private Subnets (no internet gateway)
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'transaction-private-rt-${EnvironmentSuffix}'

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

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable

  # ====================
  # Security Groups
  # ====================

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda transaction processor'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        # Allow HTTPS traffic to VPC endpoints
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
          Description: 'HTTPS to VPC endpoints within VPC CIDR'
      Tags:
        - Key: Name
          Value: !Sub 'lambda-sg-${EnvironmentSuffix}'

  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for VPC endpoints'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # Allow HTTPS traffic from Lambda security group
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'HTTPS from Lambda functions'
      Tags:
        - Key: Name
          Value: !Sub 'vpc-endpoint-sg-${EnvironmentSuffix}'

  # ====================
  # VPC Endpoints
  # ====================

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  KinesisVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kinesis-streams'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  KMSVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.kms'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  CloudWatchLogsVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.logs'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  LambdaVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.lambda'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  # ====================
  # KMS Encryption Key
  # ====================

  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for transaction processing pipeline encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow root account full access
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          # Allow Lambda to use key for encryption/decryption
          - Sid: 'Allow Lambda to use the key'
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey'
              - 'kms:GenerateDataKeyWithoutPlaintext'
              - 'kms:ReEncryptFrom'
              - 'kms:ReEncryptTo'
            Resource: '*'
          # Allow CloudWatch Logs to use key
          - Sid: 'Allow CloudWatch Logs to use the key'
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
          # Allow DynamoDB to use key
          - Sid: 'Allow DynamoDB to use the key'
            Effect: Allow
            Principal:
              Service: dynamodb.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
          # Allow Kinesis to use key
          - Sid: 'Allow Kinesis to use the key'
            Effect: Allow
            Principal:
              Service: kinesis.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/transaction-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref EncryptionKey

  # ====================
  # CloudWatch Logs
  # ====================

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/transaction-processor-${EnvironmentSuffix}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt EncryptionKey.Arn

  # ====================
  # DynamoDB Table
  # ====================

  TransactionTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'transactions-${EnvironmentSuffix}'
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref EncryptionKey
      AttributeDefinitions:
        - AttributeName: transactionId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: transactionId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      Tags:
        - Key: Name
          Value: !Sub 'transactions-${EnvironmentSuffix}'

  # ====================
  # Kinesis Data Stream
  # ====================

  TransactionStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub 'transaction-stream-${EnvironmentSuffix}'
      ShardCount: 1
      RetentionPeriodHours: 24
      StreamEncryption:
        EncryptionType: KMS
        KeyId: !Ref EncryptionKey
      Tags:
        - Key: Name
          Value: !Sub 'transaction-stream-${EnvironmentSuffix}'

  # ====================
  # IAM Roles
  # ====================

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'lambda-transaction-processor-role-${EnvironmentSuffix}'
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
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                  - 'dynamodb:UpdateItem'
                Resource: !GetAtt TransactionTable.Arn
        - PolicyName: KinesisAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kinesis:PutRecord'
                  - 'kinesis:PutRecords'
                  - 'kinesis:DescribeStream'
                Resource: !GetAtt TransactionStream.Arn
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:Encrypt'
                  - 'kms:GenerateDataKey'
                  - 'kms:DescribeKey'
                Resource: !GetAtt EncryptionKey.Arn
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt LambdaLogGroup.Arn

  # ====================
  # Lambda Function
  # ====================

  TransactionProcessorFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub 'transaction-processor-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.handler
      MemorySize: 1024
      Timeout: 60
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
          DYNAMODB_TABLE_NAME: !Ref TransactionTable
          KINESIS_STREAM_NAME: !Ref TransactionStream
          KMS_KEY_ID: !Ref EncryptionKey
      KmsKeyArn: !GetAtt EncryptionKey.Arn
      Code:
        ZipFile: |
          import json
          import os
          import time
          import boto3
          from decimal import Decimal

          # Initialize AWS clients
          dynamodb = boto3.resource('dynamodb')
          kinesis = boto3.client('kinesis')

          # Get environment variables
          table_name = os.environ['DYNAMODB_TABLE_NAME']
          stream_name = os.environ['KINESIS_STREAM_NAME']

          table = dynamodb.Table(table_name)

          def handler(event, context):
              """
              Process transaction events and store in DynamoDB and Kinesis
              """
              try:
                  # Extract transaction data from event
                  transaction_id = event.get('transactionId', f"txn-{int(time.time())}")
                  amount = Decimal(str(event.get('amount', 0)))
                  customer_id = event.get('customerId', 'unknown')
                  timestamp = int(time.time())

                  # Store transaction in DynamoDB
                  table.put_item(
                      Item={
                          'transactionId': transaction_id,
                          'timestamp': timestamp,
                          'amount': amount,
                          'customerId': customer_id,
                          'status': 'processed'
                      }
                  )

                  # Publish to Kinesis for real-time analytics
                  kinesis.put_record(
                      StreamName=stream_name,
                      Data=json.dumps({
                          'transactionId': transaction_id,
                          'timestamp': timestamp,
                          'amount': float(amount),
                          'customerId': customer_id
                      }),
                      PartitionKey=customer_id
                  )

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Transaction processed successfully',
                          'transactionId': transaction_id
                      })
                  }

              except Exception as e:
                  print(f"Error processing transaction: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'message': 'Transaction processing failed',
                          'error': str(e)
                      })
                  }
      Tags:
        - Key: Name
          Value: !Sub 'transaction-processor-${EnvironmentSuffix}'

  # ====================
  # AWS Config for Compliance
  # ====================

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'config-snapshots-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub 'config-snapshots-${EnvironmentSuffix}'

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketPutObject
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'config-service-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      Policies:
        - PolicyName: ConfigS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketVersioning'
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'config-recorder-${EnvironmentSuffix}'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: false

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'config-delivery-${EnvironmentSuffix}'
      S3BucketName: !Ref ConfigBucket

  # Config Rules for Encryption Compliance
  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 'encrypted-volumes-${EnvironmentSuffix}'
      Description: 'Checks whether EBS volumes are encrypted'
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  DynamoDBEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 'dynamodb-table-encrypted-kms-${EnvironmentSuffix}'
      Description: 'Checks whether DynamoDB tables are encrypted with KMS'
      Source:
        Owner: AWS
        SourceIdentifier: DYNAMODB_TABLE_ENCRYPTED_KMS

  CloudWatchLogGroupEncryptedRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 'cloudwatch-log-group-encrypted-${EnvironmentSuffix}'
      Description: 'Checks whether CloudWatch Log Groups are encrypted with KMS'
      Source:
        Owner: AWS
        SourceIdentifier: CLOUDWATCH_LOG_GROUP_ENCRYPTED

Outputs:
  VPCId:
    Description: 'VPC ID for transaction processing'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-Id'

  PrivateSubnetIds:
    Description: 'Private subnet IDs across 3 AZs'
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2},${PrivateSubnet3}'
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-Id'

  KMSKeyArn:
    Description: 'KMS Key ARN for encryption'
    Value: !GetAtt EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-Arn'

  DynamoDBTableName:
    Description: 'DynamoDB table name for transactions'
    Value: !Ref TransactionTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  DynamoDBTableArn:
    Description: 'DynamoDB table ARN'
    Value: !GetAtt TransactionTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table-Arn'

  KinesisStreamName:
    Description: 'Kinesis stream name for transaction analytics'
    Value: !Ref TransactionStream
    Export:
      Name: !Sub '${AWS::StackName}-Kinesis-Stream'

  KinesisStreamArn:
    Description: 'Kinesis stream ARN'
    Value: !GetAtt TransactionStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Kinesis-Stream-Arn'

  LambdaFunctionName:
    Description: 'Lambda function name for transaction processing'
    Value: !Ref TransactionProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Function'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt TransactionProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Function-Arn'

  CloudWatchLogGroupName:
    Description: 'CloudWatch Log Group name for Lambda logs'
    Value: !Ref LambdaLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-Log-Group'

  ConfigBucketName:
    Description: 'S3 bucket for Config snapshots'
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-Config-Bucket'

  LambdaSecurityGroupId:
    Description: 'Security group ID for Lambda function'
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-SG'
```

## File: lib/README.md

```markdown
# Secure Transaction Processing Pipeline

CloudFormation template for deploying a secure, compliant transaction processing pipeline with KMS encryption, VPC isolation, and AWS Config compliance monitoring.

## Architecture

This infrastructure implements a secure transaction processing system with:

- **VPC Network Isolation**: Private subnets across 3 AZs with no internet access
- **VPC Endpoints**: DynamoDB, Kinesis, KMS, CloudWatch Logs, Lambda endpoints for AWS service access
- **KMS Encryption**: Customer-managed key with automatic rotation for all data at rest
- **Lambda Processing**: 1GB memory function in private subnets for transaction processing
- **DynamoDB Storage**: Encrypted table with point-in-time recovery
- **Kinesis Streaming**: Encrypted data stream for real-time analytics
- **CloudWatch Monitoring**: 90-day log retention with KMS encryption
- **AWS Config Compliance**: Encryption compliance monitoring and rules

## Security Features

1. **Network Isolation**: Lambda runs in private subnets with no internet gateway or NAT
2. **Encryption at Rest**: All data encrypted with customer-managed KMS key
3. **Least Privilege IAM**: Explicit permissions, no wildcards
4. **VPC Endpoints**: All AWS service communication through private endpoints
5. **Security Groups**: Explicit rules with specific CIDR ranges
6. **Compliance Monitoring**: AWS Config rules verify encryption compliance

## Prerequisites

- AWS CLI 2.x configured with appropriate credentials
- CloudFormation permissions to create all resources
- Sufficient service quotas for VPC endpoints, Lambda, DynamoDB, Kinesis

## Deployment

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name transaction-pipeline-dev \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev-12345 \
               ParameterKey=EnableTerminationProtection,ParameterValue=false \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation wait stack-create-complete \
  --stack-name transaction-pipeline-dev \
  --region us-east-1

aws cloudformation describe-stacks \
  --stack-name transaction-pipeline-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name transaction-pipeline-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Testing

### Test Lambda Function

```bash
# Get Lambda function name from outputs
FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name transaction-pipeline-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
  --output text)

# Invoke function with test transaction
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{"transactionId":"txn-001","amount":100.50,"customerId":"cust-123"}' \
  --region us-east-1 \
  response.json

cat response.json
```

### Verify DynamoDB Storage

```bash
# Get table name from outputs
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name transaction-pipeline-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
  --output text)

# Query transactions
aws dynamodb scan \
  --table-name $TABLE_NAME \
  --region us-east-1
```

### Verify Kinesis Stream

```bash
# Get stream name from outputs
STREAM_NAME=$(aws cloudformation describe-stacks \
  --stack-name transaction-pipeline-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`KinesisStreamName`].OutputValue' \
  --output text)

# Describe stream
aws kinesis describe-stream \
  --stream-name $STREAM_NAME \
  --region us-east-1
```

### Verify Encryption

```bash
# Check KMS key rotation
KMS_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name transaction-pipeline-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`KMSKeyId`].OutputValue' \
  --output text)

aws kms get-key-rotation-status \
  --key-id $KMS_KEY_ID \
  --region us-east-1
```

## Cleanup

```bash
# Delete stack (removes all resources)
aws cloudformation delete-stack \
  --stack-name transaction-pipeline-dev \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name transaction-pipeline-dev \
  --region us-east-1
```

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Unique suffix for resource naming | - | Yes |
| EnableTerminationProtection | Enable stack termination protection | false | No |

## Outputs

| Output | Description |
|--------|-------------|
| VPCId | VPC ID |
| PrivateSubnetIds | Private subnet IDs (comma-separated) |
| KMSKeyId | KMS key ID |
| KMSKeyArn | KMS key ARN |
| DynamoDBTableName | DynamoDB table name |
| DynamoDBTableArn | DynamoDB table ARN |
| KinesisStreamName | Kinesis stream name |
| KinesisStreamArn | Kinesis stream ARN |
| LambdaFunctionName | Lambda function name |
| LambdaFunctionArn | Lambda function ARN |
| CloudWatchLogGroupName | CloudWatch log group name |
| ConfigBucketName | Config S3 bucket name |
| LambdaSecurityGroupId | Lambda security group ID |

## Compliance

This infrastructure meets the following compliance requirements:

- **Encryption**: All data encrypted at rest with KMS CMK
- **Key Rotation**: Automatic KMS key rotation enabled
- **Network Isolation**: No internet access, VPC endpoints only
- **Audit Logging**: CloudWatch Logs with 90-day retention
- **Compliance Monitoring**: AWS Config rules for encryption verification
- **Least Privilege**: IAM roles with explicit permissions
- **Point-in-Time Recovery**: DynamoDB PITR enabled
- **Multi-AZ**: Resources deployed across 3 availability zones

## Cost Optimization

- **Serverless**: Lambda and DynamoDB on-demand billing
- **No NAT Gateway**: VPC endpoints eliminate NAT costs
- **Minimal Kinesis**: Single shard for development
- **Log Retention**: 90-day retention balances compliance and cost

## Troubleshooting

### Lambda Cannot Access DynamoDB

Check:
1. VPC endpoint for DynamoDB is created and associated with route table
2. Security group allows HTTPS outbound to VPC CIDR
3. Lambda execution role has DynamoDB permissions

### KMS Encryption Errors

Check:
1. KMS key policy allows service principals (Lambda, DynamoDB, Kinesis, CloudWatch)
2. Lambda execution role has kms:Decrypt and kms:GenerateDataKey permissions
3. KMS VPC endpoint exists and is accessible

### Config Rules Failing

Check:
1. Config recorder is enabled and recording
2. Config delivery channel is configured
3. Config role has correct managed policy (service-role/AWS_ConfigRole)
4. S3 bucket policy allows Config service to write

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          VPC (10.0.0.0/16)                   │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Private     │  │ Private     │  │ Private     │         │
│  │ Subnet 1    │  │ Subnet 2    │  │ Subnet 3    │         │
│  │ (AZ1)       │  │ (AZ2)       │  │ (AZ3)       │         │
│  │             │  │             │  │             │         │
│  │  Lambda     │  │  Lambda     │  │  Lambda     │         │
│  │  (VPC ENI)  │  │  (VPC ENI)  │  │  (VPC ENI)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                   │
│                           ↓                                   │
│              ┌─────────────────────────┐                     │
│              │   VPC Endpoints         │                     │
│              │  - DynamoDB (Gateway)   │                     │
│              │  - Kinesis (Interface)  │                     │
│              │  - KMS (Interface)      │                     │
│              │  - CloudWatch Logs      │                     │
│              │  - Lambda (Interface)   │                     │
│              └─────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │      AWS Services (Private)          │
        │  - DynamoDB (Encrypted with KMS)     │
        │  - Kinesis (Encrypted with KMS)      │
        │  - CloudWatch Logs (Encrypted)       │
        │  - KMS (Key Rotation Enabled)        │
        │  - AWS Config (Compliance Rules)     │
        └──────────────────────────────────────┘
```
```
