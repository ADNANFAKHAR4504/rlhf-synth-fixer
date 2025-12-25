```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless infrastructure with API Gateway, Lambda, and DynamoDB for user data management'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    Description: 'Environment name for resource naming'
    AllowedValues:
      - dev
      - staging
      - prod

Resources:
  # DynamoDB Table
  UserDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: UserData
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'IaC-AWS-Nova-Model-Breaking'

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunction}'
      RetentionInDays: 14

  # IAM Role for Lambda Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'UserDataLambdaRole-${Environment}'
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
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt UserDataTable.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'

  # Lambda Function
  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub 'UserDataHandler-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 128
      Environment:
        Variables:
          DYNAMODB_TABLE_NAME: !Ref UserDataTable
          LOG_LEVEL: INFO
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import logging
          from datetime import datetime
          
          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
          
          # Initialize DynamoDB client
          dynamodb = boto3.resource('dynamodb')
          table_name = os.environ['DYNAMODB_TABLE_NAME']
          table = dynamodb.Table(table_name)
          
          def lambda_handler(event, context):
              logger.info(f"Received event: {json.dumps(event)}")
              
              try:
                  http_method = event['httpMethod']
                  
                  if http_method == 'POST':
                      return handle_post(event)
                  elif http_method == 'GET':
                      return handle_get(event)
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
                  logger.error(f"Error processing request: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': 'Internal server error'})
                  }
          
          def handle_post(event):
              try:
                  body = json.loads(event['body'])
                  user_id = body.get('userId')
                  user_data = body.get('userData', {})
                  
                  if not user_id:
                      return {
                          'statusCode': 400,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({'error': 'userId is required'})
                      }
                  
                  # Add timestamp
                  user_data['timestamp'] = datetime.utcnow().isoformat()
                  
                  # Store in DynamoDB
                  table.put_item(
                      Item={
                          'userId': user_id,
                          'userData': user_data
                      }
                  )
                  
                  logger.info(f"Successfully stored data for user: {user_id}")
                  
                  return {
                      'statusCode': 201,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'User data stored successfully',
                          'userId': user_id
                      })
                  }
              
              except json.JSONDecodeError:
                  return {
                      'statusCode': 400,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': 'Invalid JSON in request body'})
                  }
          
          def handle_get(event):
              try:
                  user_id = event['queryStringParameters'].get('userId') if event['queryStringParameters'] else None
                  
                  if not user_id:
                      return {
                          'statusCode': 400,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({'error': 'userId query parameter is required'})
                      }
                  
                  # Retrieve from DynamoDB
                  response = table.get_item(
                      Key={'userId': user_id}
                  )
                  
                  if 'Item' in response:
                      logger.info(f"Successfully retrieved data for user: {user_id}")
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps(response['Item'])
                      }
                  else:
                      return {
                          'statusCode': 404,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({'error': 'User not found'})
                      }
              
              except Exception as e:
                  logger.error(f"Error retrieving user data: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': 'Internal server error'})
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'IaC-AWS-Nova-Model-Breaking'

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${RestApi}/*/*'

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${RestApi}'
      RetentionInDays: 14

  # IAM Role for API Gateway CloudWatch Logging
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

  # API Gateway Account Configuration
  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCloudWatchRole.Arn

  # REST API
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'UserDataAPI-${Environment}'
      Description: 'REST API for user data management'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'IaC-AWS-Nova-Model-Breaking'

  # API Gateway Resource
  UserDataResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: 'userdata'

  # GET Method
  GetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref UserDataResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
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

  # POST Method
  PostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref UserDataResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 201
          ResponseModels:
            application/json: Empty
        - StatusCode: 400
          ResponseModels:
            application/json: Empty

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - GetMethod
      - PostMethod
    Properties:
      RestApiId: !Ref RestApi
      StageName: !Ref Environment
      StageDescription:
        LoggingLevel: INFO
        DataTraceEnabled: true
        MetricsEnabled: true
        ThrottlingRateLimit: 100
        ThrottlingBurstLimit: 200

  # API Gateway Stage (explicit for better control)
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestApi
      DeploymentId: !Ref ApiDeployment
      StageName: !Sub '${Environment}-stage'
      Description: !Sub 'Stage for ${Environment} environment'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
          ThrottlingRateLimit: 100
          ThrottlingBurstLimit: 200
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '$requestId $requestTime $httpMethod $resourcePath $status $responseLength $responseTime'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Usage Plan
  UsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: !Sub 'UserDataAPI-UsagePlan-${Environment}'
      Description: 'Usage plan limiting requests to 1000 per month'
      Quota:
        Limit: 1000
        Period: MONTH
      Throttle:
        RateLimit: 10
        BurstLimit: 20
      ApiStages:
        - ApiId: !Ref RestApi
          Stage: !Ref ApiStage

  # API Key
  ApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub 'UserDataAPI-Key-${Environment}'
      Description: 'API Key for User Data API'
      Enabled: true

  # Usage Plan Key (Associate API Key with Usage Plan)
  UsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref UsagePlan

Outputs:
  ApiGatewayEndpoint:
    Description: 'API Gateway endpoint URL for the REST API'
    Value: !Sub 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStage}/userdata'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'

  ApiKey:
    Description: 'API Key for accessing the REST API'
    Value: !Ref ApiKey
    Export:
      Name: !Sub '${AWS::StackName}-ApiKey'

  DynamoDBTableName:
    Description: 'DynamoDB table name for user data'
    Value: !Ref UserDataTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTable'

  LambdaFunctionName:
    Description: 'Lambda function name for user data processing'
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'

  Region:
    Description: 'AWS Region where resources are deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-Region'
```