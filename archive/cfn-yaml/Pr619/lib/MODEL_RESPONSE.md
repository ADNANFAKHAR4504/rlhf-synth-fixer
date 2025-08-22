# Serverless Application Infrastructure - CloudFormation Template

Here's a comprehensive AWS CloudFormation YAML template that deploys a serverless application infrastructure with Lambda, API Gateway, DynamoDB, and essential security, logging, and monitoring components.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless application infrastructure with Lambda, API Gateway, and DynamoDB'

# Template Parameters
Parameters:
  Environment:
    Type: String
    AllowedValues:
      - dev
      - stage
      - prod
    Default: dev
    Description: 'Deployment environment'

  LogLevel:
    Type: String
    AllowedValues:
      - INFO
      - WARN
      - ERROR
    Default: INFO
    Description: 'Lambda function log level'

  SNSEmail:
    Type: String
    Default: 'no-reply@example.com'
    Description: 'Email address for SNS notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

# Template Resources
Resources:
  # KMS Key for DynamoDB encryption
  DynamoDBEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for DynamoDB table encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow root user full permissions
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          # Allow DynamoDB service to use the key
          - Sid: 'Allow DynamoDB Service'
            Effect: Allow
            Principal:
              Service: dynamodb.amazonaws.com
            Action:
              - 'kms:GenerateDataKey'
              - 'kms:Decrypt'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'DynamoDB Encryption'

  # KMS Key Alias for easy reference
  DynamoDBEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-dynamodb-key'
      TargetKeyId: !Ref DynamoDBEncryptionKey

  # DynamoDB Table with KMS encryption
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-data-table'
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      # Enable server-side encryption with custom KMS key
      SSESpecification:
        SSEEnabled: true
        SSEType: 'KMS'
        KMSMasterKeyId: !GetAtt DynamoDBEncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Application Data Storage'

  # CloudWatch Log Group for Lambda function
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${AWS::StackName}-data-processor'
      RetentionInDays: 14

  # CloudWatch Log Group for API Gateway access logs
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${AWS::StackName}-api-access-logs'
      RetentionInDays: 14

  # IAM Role for Lambda function with least privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      # Inline policy for CloudWatch Logs
      Policies:
        - PolicyName: 'CloudWatchLogsPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:us-east-1:${AWS::AccountId}:log-group:/aws/lambda/${AWS::StackName}-data-processor:*'
        # Inline policy for DynamoDB access (least privilege)
        - PolicyName: 'DynamoDBPutItemPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                Resource: !GetAtt DataTable.Arn
        - PolicyName: 'KMSAccessPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt DynamoDBEncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda Function
  DataProcessorFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub '${AWS::StackName}-data-processor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 128
      Environment:
        Variables:
          STAGE: !Ref Environment
          DYNAMODB_TABLE_NAME: !Ref DataTable
          LOG_LEVEL: !Ref LogLevel
      # Inline Lambda function code
      Code:
        ZipFile: |
          import json
          import boto3
          import uuid
          import os
          from datetime import datetime
          import logging

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

          # Initialize DynamoDB client
          dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
          table_name = os.environ['DYNAMODB_TABLE_NAME']
          table = dynamodb.Table(table_name)

          def lambda_handler(event, context):
              """
              Lambda handler for processing HTTP POST requests
              Generates unique ID, stores data in DynamoDB, returns success response
              """
              try:
                  logger.info(f"Processing request: {event}")
                  
                  # Parse request body
                  if 'body' not in event or not event['body']:
                      return {
                          'statusCode': 400,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'error': 'Request body is required'
                          })
                      }
                  
                  # Generate unique ID and timestamp
                  unique_id = str(uuid.uuid4())
                  timestamp = datetime.utcnow().isoformat() + 'Z'
                  
                  # Parse request body (handle both string and dict)
                  request_body = event['body']
                  if isinstance(request_body, str):
                      try:
                          request_data = json.loads(request_body)
                      except json.JSONDecodeError:
                          request_data = {'raw_data': request_body}
                  else:
                      request_data = request_body
                  
                  # Prepare item for DynamoDB
                  item = {
                      'id': unique_id,
                      'timestamp': timestamp,
                      'data': request_data,
                      'stage': os.environ['STAGE']
                  }
                  
                  # Store in DynamoDB
                  table.put_item(Item=item)
                  
                  logger.info(f"Successfully stored item with ID: {unique_id}")
                  
                  # Return success response
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          'id': unique_id,
                          'timestamp': timestamp
                      })
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing request: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'message': str(e)
                      })
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DataProcessorFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:us-east-1:${AWS::AccountId}:${DataApi}/*/*'

  # API Gateway REST API
  DataApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${AWS::StackName}-data-api'
      Description: 'REST API for serverless data processing application'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Resource (/data)
  DataResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref DataApi
      ParentId: !GetAtt DataApi.RootResourceId
      PathPart: 'data'

  # API Gateway Method (POST /data)
  DataPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref DataApi
      ResourceId: !Ref DataResource
      HttpMethod: POST
      AuthorizationType: NONE
      # AWS_PROXY integration with Lambda
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${DataProcessorFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
        - StatusCode: 400
          ResponseModels:
            application/json: Empty
        - StatusCode: 500
          ResponseModels:
            application/json: Empty

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - DataPostMethod
    Properties:
      RestApiId: !Ref DataApi
      Description: !Sub 'Deployment for ${Environment} environment'

  # API Gateway Stage with throttling and logging
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref DataApi
      DeploymentId: !Ref ApiDeployment
      StageName: !Ref Environment
      Description: !Sub 'API Gateway stage for ${Environment} environment'
      # Configure throttling and logging for all methods
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          # Configure throttling for all methods
          ThrottlingBurstLimit: 50
          ThrottlingRateLimit: 100
          # Enable access logging and metrics
          MetricsEnabled: true
          DataTraceEnabled: false
          LoggingLevel: INFO
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '$context.requestId $requestTime $httpMethod $resourcePath $status $responseLength $responseTime'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # SNS Topic for CloudWatch Alarm notifications
  AlarmNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-lambda-error-alerts'
      DisplayName: 'Lambda Error Alerts'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # SNS Subscription for email notifications
  AlarmNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref AlarmNotificationTopic
      Protocol: email
      Endpoint: !Ref SNSEmail

  # CloudWatch Alarm for Lambda errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-lambda-errors'
      AlarmDescription: 'Alarm for Lambda function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300 # 5 minutes
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataProcessorFunction
      AlarmActions:
        - !Ref AlarmNotificationTopic
      Tags:
        - Key: Environment
          Value: !Ref Environment

# Template Outputs
Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${DataApi}.execute-api.us-east-1.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt DataProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  DynamoDBTableName:
    Description: 'DynamoDB table name'
    Value: !Ref DataTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  CloudWatchAlarmName:
    Description: 'CloudWatch alarm name for Lambda errors'
    Value: !Ref LambdaErrorAlarm
    Export:
      Name: !Sub '${AWS::StackName}-CloudWatchAlarmName'

  KMSKeyId:
    Description: 'KMS Key ID for DynamoDB encryption'
    Value: !Ref DynamoDBEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  SNSTopicArn:
    Description: 'SNS Topic ARN for alarm notifications'
    Value: !Ref AlarmNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'
```

## Key Features

This CloudFormation template provides a comprehensive serverless application infrastructure with:

### Core Serverless Components
- **AWS Lambda Function**: Python 3.9 runtime with inline code for data processing
- **Amazon API Gateway**: REST API with `/data` resource and POST method
- **Amazon DynamoDB**: Table with composite key (id + timestamp) and provisioned throughput
- **AWS_PROXY Integration**: Direct Lambda invocation from API Gateway

### Security and Encryption
- **AWS KMS Key**: Custom key with automatic rotation enabled
- **Key Policy**: Root user permissions + DynamoDB service permissions
- **DynamoDB Encryption**: Server-side encryption with customer-managed KMS key
- **IAM Least Privilege**: Lambda role with minimal required permissions (only dynamodb:PutItem)

### Logging and Monitoring
- **API Gateway Access Logs**: Dedicated CloudWatch Log Group
- **Lambda Logs**: Separate log group with 14-day retention
- **CloudWatch Alarm**: Monitors Lambda errors with 5-minute evaluation
- **SNS Notifications**: Email alerts for Lambda errors

### API Gateway Configuration
- **Rate Limits**: 100 requests per second
- **Burst Limits**: 50 requests
- **Regional Endpoints**: REGIONAL endpoint configuration
- **Access Logging**: Comprehensive request logging

### Template Structure
- **Parameters**: Environment (dev/stage/prod), LogLevel (INFO/WARN/ERROR), SNSEmail
- **Outputs**: ApiGatewayUrl, LambdaFunctionArn, DynamoDBTableName, CloudWatchAlarmName, KMSKeyId, SNSTopicArn
- **Region**: All resources deployed in us-east-1
- **Tagging**: Consistent environment tagging across all resources

This template follows AWS best practices for serverless architecture, security, and monitoring, providing a production-ready infrastructure that can be easily deployed and maintained.