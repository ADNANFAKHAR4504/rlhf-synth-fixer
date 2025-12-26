### Model provided response is as below:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure event-driven data processing pipeline with S3, Lambda, DynamoDB, and Secrets Manager'

Resources:
  # KMS Key for S3 Bucket Encryption
  ApplicationDataBucketKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for ApplicationDataBucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda to decrypt
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  # KMS Key Alias
  ApplicationDataBucketKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/application-data-bucket-key
      TargetKeyId: !Ref ApplicationDataBucketKMSKey

  # S3 Bucket for Application Data
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'application-data-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ApplicationDataBucketKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: Production

  # DynamoDB Table for Processed Results
  ProcessedResultsDB:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ProcessedResultsDB
      AttributeDefinitions:
        - AttributeName: recordId
          AttributeType: S
      KeySchema:
        - AttributeName: recordId
          KeyType: HASH
      BillingMode: ON_DEMAND
      Tags:
        - Key: Environment
          Value: Production

  # Secrets Manager Secret
  ApplicationSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: ApplicationSecret
      Description: 'Secret for storing sensitive application data'
      SecretString: !Sub |
        {
          "ApiKey": "your-placeholder-api-key"
        }
      Tags:
        - Key: Environment
          Value: Production

  # IAM Role for Lambda Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'S3DataProcessor-ExecutionRole-${AWS::Region}'
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
        - PolicyName: S3DataProcessorPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub '${ApplicationDataBucket}/*'
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                Resource: !GetAtt ProcessedResultsDB.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/S3DataProcessor:*'
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref ApplicationSecret
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt ApplicationDataBucketKMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  # MFA Enforcement Policy (for attachment to users/groups)
  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: MFAEnforcementPolicy
      Description: 'Policy that denies all actions if MFA is not present'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyAllActionsWithoutMFA
            Effect: Deny
            Action: '*'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/S3DataProcessor
      RetentionInDays: 14

  # Lambda Function for S3 Data Processing
  S3DataProcessor:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: S3DataProcessor
      Runtime: python3.8
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref ProcessedResultsDB
          SECRET_NAME: !Ref ApplicationSecret
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          from urllib.parse import unquote_plus
          
          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          # Initialize AWS clients
          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          secrets_client = boto3.client('secretsmanager')
          
          def lambda_handler(event, context):
              try:
                  logger.info(f"Received event: {json.dumps(event)}")
                  
                  # Process each record in the event
                  for record in event['Records']:
                      # Extract S3 bucket and object key from the event
                      bucket_name = record['s3']['bucket']['name']
                      object_key = unquote_plus(record['s3']['object']['key'])
                      
                      logger.info(f"Processing object: {object_key} from bucket: {bucket_name}")
                      
                      # Retrieve secret from AWS Secrets Manager
                      try:
                          secret_name = os.environ['SECRET_NAME']
                          secret_response = secrets_client.get_secret_value(SecretId=secret_name)
                          secret_data = json.loads(secret_response['SecretString'])
                          logger.info("Successfully retrieved secret from Secrets Manager")
                      except Exception as e:
                          logger.error(f"Error retrieving secret: {str(e)}")
                          raise
                      
                      # Get the S3 object (optional - demonstrates s3:GetObject permission)
                      try:
                          s3_response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                          logger.info(f"S3 object metadata retrieved. Size: {s3_response.get('ContentLength', 'Unknown')}")
                      except Exception as e:
                          logger.error(f"Error accessing S3 object: {str(e)}")
                          raise
                      
                      # Write to DynamoDB
                      try:
                          table_name = os.environ['DYNAMODB_TABLE']
                          table = dynamodb.Table(table_name)
                          
                          # Create a sample item using the object key as recordId
                          item = {
                              'recordId': object_key,
                              'bucketName': bucket_name,
                              'processedAt': context.aws_request_id,
                              'status': 'processed'
                          }
                          
                          table.put_item(Item=item)
                          logger.info(f"Successfully wrote item to DynamoDB: {object_key}")
                          
                      except Exception as e:
                          logger.error(f"Error writing to DynamoDB: {str(e)}")
                          raise
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Successfully processed S3 event')
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing event: {str(e)}")
                  raise
      Tags:
        - Key: Environment
          Value: Production

  # S3 Bucket Notification Configuration
  S3BucketNotification:
    Type: AWS::S3::Bucket
    DependsOn: LambdaInvokePermission
    Properties:
      BucketName: !Ref ApplicationDataBucket
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt S3DataProcessor.Arn

  # Permission for S3 to invoke Lambda
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref S3DataProcessor
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub '${ApplicationDataBucket}/*'

Outputs:
  S3BucketName:
    Description: 'Name of the S3 bucket for application data'
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table for processed results'
    Value: !Ref ProcessedResultsDB
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  LambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref S3DataProcessor
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'

  SecretName:
    Description: 'Name of the Secrets Manager secret'
    Value: !Ref ApplicationSecret
    Export:
      Name: !Sub '${AWS::StackName}-SecretName'

  KMSKeyId:
    Description: 'ID of the KMS key used for S3 encryption'
    Value: !Ref ApplicationDataBucketKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  MFAEnforcementPolicyArn:
    Description: 'ARN of the MFA enforcement policy'
    Value: !Ref MFAEnforcementPolicy
    Export:
      Name: !Sub '${AWS::StackName}-MFAEnforcementPolicyArn'
```