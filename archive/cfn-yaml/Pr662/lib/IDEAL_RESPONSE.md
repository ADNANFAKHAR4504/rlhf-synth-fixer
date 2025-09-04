# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Serverless Infrastructure Deployment with API Gateway, Lambda, and DynamoDB"

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming"

Resources:
  # DynamoDB Table
  UserDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "UserData-${EnvironmentSuffix}"
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Role for Lambda
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
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
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                Resource: !GetAtt UserDataTable.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:us-east-1:${AWS::AccountId}:log-group:/aws/lambda/*"

  # Lambda Function
  UserDataLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "UserDataHandler${EnvironmentSuffix}"
      Runtime: python3.12
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['TABLE_NAME'])

          def lambda_handler(event, context):
              try:
                  print(f"Received event: {json.dumps(event)}")
                  
                  http_method = event.get('httpMethod', '')
                  
                  if http_method == 'POST':
                      # Handle POST request - store data
                      body = json.loads(event.get('body', '{}'))
                      user_id = body.get('userId')
                      user_data = body.get('data', {})
                      
                      if not user_id:
                          return {
                              'statusCode': 400,
                              'headers': {
                                  'Content-Type': 'application/json',
                                  'Access-Control-Allow-Origin': '*'
                              },
                              'body': json.dumps({'error': 'userId is required'})
                          }
                      
                      # Store data in DynamoDB
                      table.put_item(
                          Item={
                              'userId': user_id,
                              'data': user_data,
                              'timestamp': datetime.utcnow().isoformat()
                          }
                      )
                      
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({'message': 'Data stored successfully', 'userId': user_id})
                      }
                  
                  elif http_method == 'GET':
                      # Handle GET request - retrieve data
                      query_params = event.get('queryStringParameters', {})
                      print(f"Query parameters: {query_params}")
                      
                      user_id = None
                      if query_params:
                          user_id = query_params.get('userId')
                      
                      print(f"Extracted user_id: '{user_id}'")
                      
                      if not user_id:
                          return {
                              'statusCode': 400,
                              'headers': {
                                  'Content-Type': 'application/json',
                                  'Access-Control-Allow-Origin': '*'
                              },
                              'body': json.dumps({'error': 'userId query parameter is required'})
                          }
                      
                      # Retrieve data from DynamoDB
                      print(f"Querying DynamoDB for userId: '{user_id}'")
                      response = table.get_item(Key={'userId': user_id})
                      print(f"DynamoDB response: {response}")
                      
                      if 'Item' in response:
                          return {
                              'statusCode': 200,
                              'headers': {
                                  'Content-Type': 'application/json',
                                  'Access-Control-Allow-Origin': '*'
                              },
                              'body': json.dumps(response['Item'], default=str)
                          }
                      else:
                          return {
                              'statusCode': 404,
                              'headers': {
                                  'Content-Type': 'application/json',
                                  'Access-Control-Allow-Origin': '*'
                              },
                              'body': json.dumps({'error': f'User not found for userId: {user_id}'})
                          }
                  
                  else:
                      return {
                          'statusCode': 405,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({'error': 'Method not allowed'})
                      }
                      
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': 'Internal server error'})
                  }
      Environment:
        Variables:
          TABLE_NAME: !Ref UserDataTable
      Timeout: 30
      MemorySize: 128
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/UserDataHandler${EnvironmentSuffix}"
      RetentionInDays: 7

  # API Gateway REST API
  UserDataApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "UserDataAPI${EnvironmentSuffix}"
      Description: "REST API for user data storage and retrieval"
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # API Gateway Resource
  UserDataResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref UserDataApi
      ParentId: !GetAtt UserDataApi.RootResourceId
      PathPart: "userdata"

  # API Gateway GET Method
  GetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref UserDataApi
      ResourceId: !Ref UserDataResource
      HttpMethod: GET
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${UserDataLambda.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
        - StatusCode: 400
          ResponseModels:
            application/json: Empty
        - StatusCode: 404
          ResponseModels:
            application/json: Empty

  # API Gateway POST Method
  PostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref UserDataApi
      ResourceId: !Ref UserDataResource
      HttpMethod: POST
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${UserDataLambda.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
        - StatusCode: 400
          ResponseModels:
            application/json: Empty

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref UserDataLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${UserDataApi}/*/*"

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - GetMethod
      - PostMethod
    Properties:
      RestApiId: !Ref UserDataApi
      StageName: prod
      StageDescription:
        AccessLogSetting:
          DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
          Format: "$context.requestId $context.requestTime $context.httpMethod $context.resourcePath $context.status $context.responseLength $context.requestTime"
        LoggingLevel: INFO
        DataTraceEnabled: true
        MetricsEnabled: true

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/apigateway/UserDataAPI${EnvironmentSuffix}"
      RetentionInDays: 7

  # API Gateway Account Configuration for CloudWatch Logs
  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCloudWatchRole.Arn

  # IAM Role for API Gateway CloudWatch Logs
  ApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs

  # API Key
  ApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub "UserDataAPIKey${EnvironmentSuffix}"
      Description: "API Key for User Data API"
      Enabled: true

  # Usage Plan
  UsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: ApiDeployment
    Properties:
      UsagePlanName: !Sub "UserDataUsagePlan${EnvironmentSuffix}"
      Description: "Usage plan with 1000 requests per month limit"
      Quota:
        Limit: 1000
        Period: MONTH
      Throttle:
        BurstLimit: 10
        RateLimit: 5
      ApiStages:
        - ApiId: !Ref UserDataApi
          Stage: prod

  # Usage Plan Key
  UsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref UsagePlan

Outputs:
  ApiGatewayEndpoint:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${UserDataApi}.execute-api.us-east-1.amazonaws.com/prod/userdata"
    Export:
      Name: !Sub "${AWS::StackName}-ApiGatewayEndpoint"

  ApiKey:
    Description: "API Key for accessing the API"
    Value: !Ref ApiKey
    Export:
      Name: !Sub "${AWS::StackName}-ApiKey"

  DynamoDBTableName:
    Description: "DynamoDB Table Name"
    Value: !Ref UserDataTable
    Export:
      Name: !Sub "${AWS::StackName}-DynamoDBTableName"

  LambdaFunctionName:
    Description: "Lambda Function Name"
    Value: !Ref UserDataLambda
    Export:
      Name: !Sub "${AWS::StackName}-LambdaFunctionName"

```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
