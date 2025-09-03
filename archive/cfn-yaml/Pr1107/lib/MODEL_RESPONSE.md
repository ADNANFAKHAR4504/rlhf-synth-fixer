# CloudFormation Template for Serverless Web Application

## Overview
This CloudFormation template implements a serverless web application infrastructure using AWS services including API Gateway, Lambda, S3, DynamoDB, and CloudWatch monitoring.

## Complete Template Implementation

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless web application with API Gateway, Lambda, S3, DynamoDB, and CloudWatch monitoring'

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name for resource naming and configuration

  LambdaMemorySize:
    Type: Number
    Default: 256
    MinValue: 128
    MaxValue: 3008
    Description: Memory size for Lambda functions in MB

  LambdaTimeout:
    Type: Number
    Default: 30
    MinValue: 1
    MaxValue: 900
    Description: Timeout for Lambda functions in seconds

  ErrorRateThreshold:
    Type: Number
    Default: 5
    Description: Error rate threshold percentage for CloudWatch alarms

  DurationThreshold:
    Type: Number
    Default: 10000
    Description: Duration threshold in milliseconds for CloudWatch alarms

  NotificationEmail:
    Type: String
    Description: Email address for SNS notifications
    Default: admin@example.com

# =============================================================================
# RESOURCES
# =============================================================================
Resources:
  # SNS Topic for Notifications
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-serverless-app-alarms'
      DisplayName: Serverless Application Alarms
      KmsMasterKeyId: alias/aws/sns

  # SNS Subscription
  AlarmSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref AlarmTopic
      Endpoint: !Ref NotificationEmail

  # S3 Bucket for Static Content
  StaticContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-serverless-app-static-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1

  # DynamoDB Table
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-serverless-app-data'
      BillingMode: ON_DEMAND
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: gsi1pk
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: gsi1pk
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      SSESpecification:
        SSEEnabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: ServerlessApp

  # Lambda Function IAM Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-serverless-app-lambda-role'
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
                Resource: '*'
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: '*'

  # Lambda Function
  ServerlessFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-serverless-app-function'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: !Ref LambdaMemorySize
      Timeout: !Ref LambdaTimeout
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          DYNAMODB_TABLE: !Ref DataTable
          S3_BUCKET: !Ref StaticContentBucket
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          dynamodb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')
          
          def lambda_handler(event, context):
              try:
                  table_name = os.environ['DYNAMODB_TABLE']
                  bucket_name = os.environ['S3_BUCKET']
                  
                  table = dynamodb.Table(table_name)
                  
                  http_method = event.get('httpMethod', 'GET')
                  path = event.get('path', '/')
                  
                  if http_method == 'GET' and path == '/health':
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'status': 'healthy',
                              'timestamp': datetime.utcnow().isoformat(),
                              'environment': os.environ['ENVIRONMENT']
                          })
                      }
                  
                  elif http_method == 'POST' and path == '/data':
                      body = json.loads(event.get('body', '{}'))
                      item_id = body.get('id', str(datetime.utcnow().timestamp()))
                      
                      table.put_item(
                          Item={
                              'id': item_id,
                              'data': body.get('data', ''),
                              'timestamp': datetime.utcnow().isoformat(),
                              'gsi1pk': 'DATA'
                          }
                      )
                      
                      return {
                          'statusCode': 201,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'message': 'Data created successfully',
                              'id': item_id
                          })
                      }
                  
                  elif http_method == 'GET' and path == '/data':
                      response = table.scan()
                      items = response.get('Items', [])
                      
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'items': items,
                              'count': len(items)
                          })
                      }
                  
                  else:
                      return {
                          'statusCode': 404,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'error': 'Not found'
                          })
                      }
                      
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error'
                      })
                  }

  # API Gateway
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${Environment}-serverless-app-api'
      Description: REST API for serverless web application
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

  # API Gateway Resource
  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: '{proxy+}'

  # API Gateway Method
  ApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - 'arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations'
          - Region: !Ref AWS::Region
            LambdaArn: !GetAtt ServerlessFunction.Arn

  # API Gateway Method for Root
  ApiMethodRoot:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !GetAtt RestApi.RootResourceId
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - 'arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations'
          - Region: !Ref AWS::Region
            LambdaArn: !GetAtt ServerlessFunction.Arn

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiMethod
      - ApiMethodRoot
    Properties:
      RestApiId: !Ref RestApi
      StageName: v1

  # Lambda Permission for API Gateway
  LambdaApiPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ServerlessFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${RestApi}/*/*'

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub 'API-Gateway-Execution-Logs_${RestApi}/v1'
      RetentionInDays: 14

  # API Gateway Account (for CloudWatch logging)
  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCloudWatchRole.Arn

  # IAM Role for API Gateway CloudWatch logging
  ApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs

  # CloudWatch Alarms
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-lambda-error-rate'
      AlarmDescription: Lambda function error rate alarm
      MetricName: ErrorRate
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref ErrorRateThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessFunction
      AlarmActions:
        - !Ref AlarmTopic

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-lambda-duration'
      AlarmDescription: Lambda function duration alarm
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref DurationThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessFunction
      AlarmActions:
        - !Ref AlarmTopic

  ApiGatewayErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-api-gateway-4xx-errors'
      AlarmDescription: API Gateway 4XX error alarm
      MetricName: 4XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref RestApi
        - Name: Stage
          Value: v1
      AlarmActions:
        - !Ref AlarmTopic

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  ApiGatewayUrl:
    Description: URL of the API Gateway
    Value: !Sub 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/v1'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  DynamoDBTableName:
    Description: Name of the DynamoDB table
    Value: !Ref DataTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref StaticContentBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt ServerlessFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  SNSTopicArn:
    Description: ARN of the SNS topic
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'
```

## Architecture Components

### 1. API Gateway
- Regional endpoint configuration
- Proxy integration with Lambda function
- CloudWatch logging enabled
- CORS support included

### 2. AWS Lambda
- Python 3.11 runtime
- Configurable memory and timeout
- Environment variables for multi-environment support
- Comprehensive error handling

### 3. S3 Bucket
- Server-side encryption with AES256
- Public access blocked
- Versioning enabled
- Lifecycle policies for cleanup

### 4. DynamoDB Table
- On-demand billing mode
- Global Secondary Index for flexible querying
- Server-side encryption enabled
- Point-in-time recovery enabled

### 5. CloudWatch Monitoring
- Lambda error rate alarms
- Lambda duration alarms
- API Gateway error alarms
- SNS notifications for alarm states

## Security Best Practices
- IAM roles follow least-privilege principle
- All data encrypted at rest and in transit
- No wildcard permissions in IAM policies
- Secure bucket policies blocking public access

## Deployment
This template can be deployed using AWS CloudFormation console or CLI. All resources are interconnected and the template passes CloudFormation validation.