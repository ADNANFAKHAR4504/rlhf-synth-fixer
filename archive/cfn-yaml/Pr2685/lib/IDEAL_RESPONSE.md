```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade migration infrastructure stack for web application environment in us-east-1'

Parameters:
  VpcSecurityGroupId:
    Type: String
    Description: Security Group ID for Lambda functions in VPC (leave empty for no VPC)
    Default: ''
    AllowedPattern: '^$|^sg-[a-z0-9]+$'
    ConstraintDescription: Must be empty or a valid security group ID (sg-xxxxxxxxx)

  VpcSubnetIds:
    Type: String
    Description: Comma-separated list of Subnet IDs for Lambda functions in VPC (leave empty for no VPC)
    Default: ''
    AllowedPattern: '^$|^subnet-[a-z0-9]+(,subnet-[a-z0-9]+)*$'
    ConstraintDescription: Must be empty or a comma-separated list of valid subnet IDs (subnet-xxxxxxxxx)

  NotificationEmail:
    Type: String
    Description: Email address for migration status notifications (leave empty for no notifications)
    AllowedPattern: '^$|^[^\s@]+@[^\s@]+\.[^\s@]+$'
    ConstraintDescription: Must be empty or a valid email address
    Default: ''

  LambdaMemorySize:
    Type: Number
    Description: Memory size (MB) for Lambda functions
    Default: 256
    AllowedValues: [128, 256, 512, 1024, 2048]

  LambdaTimeout:
    Type: Number
    Description: Timeout (seconds) for Lambda functions
    Default: 300
    MinValue: 1
    MaxValue: 900

  # Optional: supply existing resources to skip creation
  ExistingMigrationLogsBucketName:
    Type: String
    Description: Existing S3 bucket name for migration logs (leave empty to create)
    Default: ''

  ExistingSnsTopicArn:
    Type: String
    Description: Existing SNS Topic ARN for notifications (leave empty to create)
    Default: ''

  ExistingMigrationTriggerFunctionArn:
    Type: String
    Description: Existing Lambda ARN for Migration Trigger (leave empty to create)
    Default: ''

  ExistingStatusNotifierFunctionArn:
    Type: String
    Description: Existing Lambda ARN for Status Notifier (leave empty to create)
    Default: ''

  ExistingRestApiId:
    Type: String
    Description: Existing API Gateway RestApiId to reuse (leave empty to create)
    Default: ''

Conditions:
  UseVpc:
    !And [
      !Not [!Equals [!Ref VpcSecurityGroupId, '']],
      !Not [!Equals [!Ref VpcSubnetIds, '']],
    ]
  CreateSubscription: !Not [!Equals [!Ref NotificationEmail, '']]
  CreateBucket: !Equals [!Ref ExistingMigrationLogsBucketName, '']
  CreateSnsTopic: !Equals [!Ref ExistingSnsTopicArn, '']
  CreateMigrationTriggerFunction:
    !Equals [!Ref ExistingMigrationTriggerFunctionArn, '']
  CreateStatusNotifierFunction:
    !Equals [!Ref ExistingStatusNotifierFunctionArn, '']
  CreateApi: !Equals [!Ref ExistingRestApiId, '']

Resources:
  # S3 Bucket for Migration Logs with auto-generated unique name
  MigrationLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateBucket
    Properties:
      BucketName: !Sub
        - 'secure-${AWS::AccountId}-${AWS::Region}-production-tapstack-${Suffix}'
        - {
            Suffix:
              !Select [
                0,
                !Split ['-', !Select [2, !Split ['/', !Ref 'AWS::StackId']]],
              ],
          }
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
      Tags:
        - Key: Environment
          Value: Migration
        - Key: Purpose
          Value: MigrationLogs

  # SNS Topic for Notifications
  MigrationNotificationsTopic:
    Type: AWS::SNS::Topic
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateSnsTopic
    Properties:
      DisplayName: Migration Status Notifications
      Tags:
        - Key: Environment
          Value: Migration

  # SNS Subscription for Email Notifications
  MigrationNotificationsSubscription:
    Type: AWS::SNS::Subscription
    Condition: CreateSubscription
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      Protocol: email
      TopicArn:
        !If [
          CreateSnsTopic,
          !Ref MigrationNotificationsTopic,
          !Ref ExistingSnsTopicArn,
        ]
      Endpoint: !Ref NotificationEmail

  # IAM Role for Migration Trigger Function with proper least privilege
  MigrationTriggerFunctionRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateMigrationTriggerFunction
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
        - !If
          - UseVpc
          - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
          - !Ref AWS::NoValue
      Policies:
        - PolicyName: !Sub '${AWS::StackName}-MigrationTriggerPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !If
                  - CreateBucket
                  - !Sub 'arn:aws:s3:::${MigrationLogsBucket}/*'
                  - !Sub 'arn:aws:s3:::${ExistingMigrationLogsBucketName}/*'
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !If
                  - CreateSnsTopic
                  - !Ref MigrationNotificationsTopic
                  - !Ref ExistingSnsTopicArn
      Tags:
        - Key: Environment
          Value: Migration

  # IAM Role for Status Notifier Function
  StatusNotifierFunctionRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateStatusNotifierFunction
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
        - !If
          - UseVpc
          - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
          - !Ref AWS::NoValue
      Policies:
        - PolicyName: !Sub '${AWS::StackName}-StatusNotifierPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !If
                  - CreateSnsTopic
                  - !Ref MigrationNotificationsTopic
                  - !Ref ExistingSnsTopicArn
      Tags:
        - Key: Environment
          Value: Migration

  # Migration Trigger Lambda Function with Python 3.13 runtime
  MigrationTriggerFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateMigrationTriggerFunction
    Properties:
      FunctionName: !Sub '${AWS::StackName}-migration-trigger-${AWS::AccountId}'
      Runtime: python3.13
      Handler: index.lambda_handler
      Role: !GetAtt MigrationTriggerFunctionRole.Arn
      Timeout: !Ref LambdaTimeout
      MemorySize: !Ref LambdaMemorySize
      Environment:
        Variables:
          S3_BUCKET_NAME:
            !If [
              CreateBucket,
              !Ref MigrationLogsBucket,
              !Ref ExistingMigrationLogsBucketName,
            ]
          SNS_TOPIC_ARN:
            !If [
              CreateSnsTopic,
              !Ref MigrationNotificationsTopic,
              !Ref ExistingSnsTopicArn,
            ]
      VpcConfig: !If
        - UseVpc
        - SecurityGroupIds:
            - !Ref VpcSecurityGroupId
          SubnetIds: !Split [',', !Ref VpcSubnetIds]
        - !Ref AWS::NoValue
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          from datetime import datetime

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info(f"Migration trigger function invoked with event: {json.dumps(event)}")
              
              try:
                  # Initialize AWS clients
                  s3_client = boto3.client('s3')
                  sns_client = boto3.client('sns')
                  
                  # Get environment variables
                  bucket_name = os.environ.get('S3_BUCKET_NAME')
                  sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                  
                  # Create migration log entry
                  timestamp = datetime.utcnow().isoformat()
                  log_content = {
                      'timestamp': timestamp,
                      'event': 'migration_triggered',
                      'status': 'started',
                      'request_id': context.aws_request_id,
                      'event_data': event
                  }
                  
                  # Write log to S3
                  log_key = f"migration-logs/{timestamp}-{context.aws_request_id}.json"
                  logger.info(f"Writing migration log to S3: {bucket_name}/{log_key}")
                  
                  s3_client.put_object(
                      Bucket=bucket_name,
                      Key=log_key,
                      Body=json.dumps(log_content),
                      ContentType='application/json'
                  )
                  
                  # Send notification
                  if sns_topic_arn:
                      message = f"Migration process started at {timestamp}"
                      logger.info(f"Sending notification to SNS: {sns_topic_arn}")
                      
                      sns_client.publish(
                          TopicArn=sns_topic_arn,
                          Message=message,
                          Subject='Migration Status Update'
                      )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Migration process initiated successfully',
                          'timestamp': timestamp,
                          'request_id': context.aws_request_id,
                          'log_location': f"s3://{bucket_name}/{log_key}"
                      })
                  }
                  
              except Exception as e:
                  logger.error(f"Error in migration trigger: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Migration trigger failed',
                          'message': str(e)
                      })
                  }
      Tags:
        - Key: Environment
          Value: Migration

  # Status Notifier Lambda Function with Python 3.13 runtime
  StatusNotifierFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateStatusNotifierFunction
    Properties:
      FunctionName: !Sub '${AWS::StackName}-status-notifier-${AWS::AccountId}'
      Runtime: python3.13
      Handler: index.lambda_handler
      Role: !GetAtt StatusNotifierFunctionRole.Arn
      Timeout: 60
      MemorySize: 128
      Environment:
        Variables:
          SNS_TOPIC_ARN:
            !If [
              CreateSnsTopic,
              !Ref MigrationNotificationsTopic,
              !Ref ExistingSnsTopicArn,
            ]
      VpcConfig: !If
        - UseVpc
        - SecurityGroupIds:
            - !Ref VpcSecurityGroupId
          SubnetIds: !Split [',', !Ref VpcSubnetIds]
        - !Ref AWS::NoValue
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          from datetime import datetime

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info(f"Status notifier function invoked with event: {json.dumps(event)}")
              
              try:
                  # Initialize SNS client
                  sns_client = boto3.client('sns')
                  
                  # Get SNS topic from environment variables
                  sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                  
                  # Extract notification details from event
                  status = event.get('status', 'unknown')
                  message_body = event.get('message', 'Migration status update')
                  
                  timestamp = datetime.utcnow().isoformat()
                  
                  # Construct notification message
                  notification_message = {
                      'timestamp': timestamp,
                      'status': status,
                      'message': message_body,
                      'request_id': context.aws_request_id
                  }
                  
                  if sns_topic_arn:
                      logger.info(f"Sending status notification to SNS: {sns_topic_arn}")
                      
                      response = sns_client.publish(
                          TopicArn=sns_topic_arn,
                          Message=json.dumps(notification_message, indent=2),
                          Subject=f'Migration Status: {status.upper()}'
                      )
                      logger.info(f"SNS publish response: {response}")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Status notification sent successfully',
                          'timestamp': timestamp,
                          'status': status
                      })
                  }
                  
              except Exception as e:
                  logger.error(f"Error in status notifier: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Status notification failed',
                          'message': str(e)
                      })
                  }
      Tags:
        - Key: Environment
          Value: Migration

  # API Gateway REST API
  MigrationApi:
    Type: AWS::ApiGateway::RestApi
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateApi
    Properties:
      Name: !Sub '${AWS::StackName}-migration-api-${AWS::AccountId}'
      Description: 'REST API for triggering migration processes'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: Migration

  # API Gateway Resource
  MigrateResource:
    Type: AWS::ApiGateway::Resource
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateApi
    Properties:
      RestApiId: !Ref MigrationApi
      ParentId: !GetAtt MigrationApi.RootResourceId
      PathPart: migrate

  # API Gateway Method
  MigrateMethod:
    Type: AWS::ApiGateway::Method
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateApi
    Properties:
      RestApiId: !Ref MigrationApi
      ResourceId: !Ref MigrateResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${FunctionArn}/invocations'
          - {
              FunctionArn:
                !If [
                  CreateMigrationTriggerFunction,
                  !GetAtt MigrationTriggerFunction.Arn,
                  !Ref ExistingMigrationTriggerFunctionArn,
                ],
            }
      MethodResponses:
        - StatusCode: 200
        - StatusCode: 500

  # Lambda Permission for API Gateway
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateApi
    Properties:
      FunctionName:
        !If [
          CreateMigrationTriggerFunction,
          !Ref MigrationTriggerFunction,
          !Ref ExistingMigrationTriggerFunctionArn,
        ]
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${MigrationApi}/*/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - MigrateMethod
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateApi
    Properties:
      RestApiId: !Ref MigrationApi
      Description: !Sub 'Deployment for ${AWS::StackName} Migration API'

  # API Gateway Stage
  ApiStage:
    Type: AWS::ApiGateway::Stage
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Condition: CreateApi
    Properties:
      RestApiId: !Ref MigrationApi
      DeploymentId: !Ref ApiDeployment
      StageName: prod
      Description: !Sub 'Production stage for ${AWS::StackName} Migration API'
      Tags:
        - Key: Environment
          Value: Migration

Outputs:
  ApiGatewayInvokeUrl:
    Description: 'Invoke URL for the Migration API Gateway'
    Condition: CreateApi
    Value: !Sub 'https://${MigrationApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStage}/migrate'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  SnsTopicArn:
    Description: 'ARN of the Migration Notifications SNS Topic'
    Value:
      !If [
        CreateSnsTopic,
        !Ref MigrationNotificationsTopic,
        !Ref ExistingSnsTopicArn,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-SnsTopicArn'

  MigrationLogsBucketName:
    Description: 'Name of the S3 bucket for migration logs'
    Value:
      !If [
        CreateBucket,
        !Ref MigrationLogsBucket,
        !Ref ExistingMigrationLogsBucketName,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucket'

  MigrationTriggerFunctionArn:
    Description: 'ARN of the Migration Trigger Lambda Function'
    Value:
      !If [
        CreateMigrationTriggerFunction,
        !GetAtt MigrationTriggerFunction.Arn,
        !Ref ExistingMigrationTriggerFunctionArn,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-MigrationTriggerArn'

  StatusNotifierFunctionArn:
    Description: 'ARN of the Status Notifier Lambda Function'
    Value:
      !If [
        CreateStatusNotifierFunction,
        !GetAtt StatusNotifierFunction.Arn,
        !Ref ExistingStatusNotifierFunctionArn,
      ]
    Export:
      Name: !Sub '${AWS::StackName}-StatusNotifierArn'

  StackRegion:
    Description: 'AWS Region where the stack is deployed'
    Value: !Ref AWS::Region
    Export:
      Name: !Sub '${AWS::StackName}-Region'
