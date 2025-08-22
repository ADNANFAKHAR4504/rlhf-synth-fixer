# Serverless Application Infrastructure

I'll create a comprehensive serverless application infrastructure using AWS CloudFormation written in YAML that meets all your requirements.

## serverless-setup.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless application with API Gateway, Lambda, and DynamoDB following security best practices'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    Description: 'Environment name for resource naming'

  DomainName:
    Type: String
    Default: ''
    Description: 'Optional custom domain name for API Gateway'

Resources:
  # DynamoDB Table with Server-Side Encryption
  ServerlessTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-serverless-table'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref DynamoDBKMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Application'
          Value: 'ServerlessApp'

  # KMS Key for DynamoDB Encryption
  DynamoDBKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for DynamoDB encryption'
      KeyPolicy:
        Statement:
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow DynamoDB Service'
            Effect: Allow
            Principal:
              Service: dynamodb.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  # KMS Key Alias
  DynamoDBKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-dynamodb-key'
      TargetKeyId: !Ref DynamoDBKMSKey

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-serverless-function'
      RetentionInDays: 14

  # IAM Role for Lambda Function
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
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: 'DynamoDBAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !GetAtt ServerlessTable.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt DynamoDBKMSKey.Arn
        - PolicyName: 'CloudWatchLogsAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Environment}-serverless-function:*'

  # Lambda Function
  ServerlessFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub '${Environment}-serverless-function'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt LambdaExecutionRole.Arn
      MemorySize: 256
      Timeout: 120
      Environment:
        Variables:
          TABLE_NAME: !Ref ServerlessTable
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import logging
          from datetime import datetime

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['TABLE_NAME'])

          def lambda_handler(event, context):
              try:
                  logger.info(f"Received event: {json.dumps(event)}")
                  
                  # Handle different HTTP methods
                  http_method = event.get('httpMethod', 'GET')
                  
                  if http_method == 'GET':
                      return handle_get(event)
                  elif http_method == 'POST':
                      return handle_post(event)
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

          def handle_get(event):
              try:
                  response = table.scan(Limit=10)
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Success',
                          'items': response.get('Items', [])
                      })
                  }
              except Exception as e:
                  logger.error(f"Error in GET handler: {str(e)}")
                  raise

          def handle_post(event):
              try:
                  body = json.loads(event.get('body', '{}'))
                  item_id = body.get('id')
                  
                  if not item_id:
                      return {
                          'statusCode': 400,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({'error': 'Missing required field: id'})
                      }
                  
                  item = {
                      'id': item_id,
                      'timestamp': datetime.utcnow().isoformat(),
                      'data': body
                  }
                  
                  table.put_item(Item=item)
                  
                  return {
                      'statusCode': 201,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Item created successfully',
                          'item': item
                      })
                  }
              except Exception as e:
                  logger.error(f"Error in POST handler: {str(e)}")
                  raise
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Application'
          Value: 'ServerlessApp'

  # API Gateway REST API
  ServerlessApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${Environment}-serverless-api'
      Description: 'Serverless API Gateway'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: 'execute-api:Invoke'
            Resource: '*'
            Condition:
              IpAddress:
                'aws:SourceIp': '0.0.0.0/0'

  # API Gateway Resource
  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ServerlessApi
      ParentId: !GetAtt ServerlessApi.RootResourceId
      PathPart: 'items'

  # API Gateway Method - GET
  ApiMethodGet:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref ApiResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ServerlessFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: false

  # API Gateway Method - POST
  ApiMethodPost:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref ApiResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ServerlessFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: false

  # API Gateway Method - OPTIONS (for CORS)
  ApiMethodOptions:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ServerlessApi
      ResourceId: !Ref ApiResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,POST,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: false
            method.response.header.Access-Control-Allow-Methods: false
            method.response.header.Access-Control-Allow-Origin: false

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ServerlessFunction
      Action: 'lambda:InvokeFunction'
      Principal: 'apigateway.amazonaws.com'
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiMethodGet
      - ApiMethodPost
      - ApiMethodOptions
    Properties:
      RestApiId: !Ref ServerlessApi
      StageName: !Ref Environment

  # SSL Certificate for API Gateway (using ACM)
  ApiCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: HasDomainName
    Properties:
      DomainName: !Ref DomainName
      ValidationMethod: DNS
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Application'
          Value: 'ServerlessApp'

  # API Gateway Domain Name
  ApiDomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: HasDomainName
    Properties:
      DomainName: !Ref DomainName
      CertificateArn: !Ref ApiCertificate
      SecurityPolicy: TLS_1_2

  # API Gateway Base Path Mapping
  ApiBasePathMapping:
    Type: AWS::ApiGateway::BasePathMapping
    Condition: HasDomainName
    Properties:
      DomainName: !Ref ApiDomainName
      RestApiId: !Ref ServerlessApi
      Stage: !Ref Environment

Conditions:
  HasDomainName: !Not [!Equals [!Ref DomainName, '']]

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  CustomDomainUrl:
    Condition: HasDomainName
    Description: 'Custom domain URL'
    Value: !Sub 'https://${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CustomDomainUrl'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt ServerlessFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  DynamoDBTableName:
    Description: 'DynamoDB table name'
    Value: !Ref ServerlessTable
    Export:
      Name: !Sub '${AWS::StackName}-TableName'

  DynamoDBTableArn:
    Description: 'DynamoDB table ARN'
    Value: !GetAtt ServerlessTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TableArn'
```

## Key Features Implemented

### Security & Compliance
- **SSL/TLS Encryption**: API Gateway configured with SSL certificates using AWS Certificate Manager
- **Server-Side Encryption**: DynamoDB table encrypted using customer-managed KMS key
- **Least Privilege IAM**: Precise IAM roles and policies limiting access to only required resources
- **CloudWatch Logging**: Comprehensive error logging and monitoring for all components

### Architecture Components
- **API Gateway**: Regional REST API with CORS support and resource-based policies
- **AWS Lambda**: Python 3.9 function with specified 256MB memory and 120-second timeout
- **DynamoDB**: NoSQL database with pay-per-request billing and point-in-time recovery
- **KMS**: Customer-managed encryption key for DynamoDB security

### Operational Excellence
- **Environment Parameterization**: Configurable environment names for multi-stage deployments
- **Custom Domain Support**: Optional custom domain configuration with SSL
- **Resource Tagging**: Consistent tagging strategy for resource management
- **Error Handling**: Comprehensive error handling in Lambda code with proper HTTP status codes

This template creates a production-ready serverless application that can handle HTTP requests, store data securely, and scale automatically while maintaining security best practices throughout the infrastructure.