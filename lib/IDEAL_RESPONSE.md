```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "TAP Stack - Task Assignment Platform CloudFormation Template - Serverless Application"

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for resource naming
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters.'

Resources:
  # 1. IAM Role for Lambda Execution (no dependencies)
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "TapStackLambdaRole-${EnvironmentSuffix}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action:
              - sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub "${LambdaAssetsBucket}/*"
                  - !Ref LambdaAssetsBucket
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TAP-Stack
        - Key: ManagedBy
          Value: CloudFormation

  # 2. S3 Bucket for Lambda Assets (no dependencies)
  LambdaAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "tap-lambda-assets-${EnvironmentSuffix}-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TAP-Stack
        - Key: ManagedBy
          Value: CloudFormation

  # 3. S3 Bucket Policy for Enhanced Security (depends on bucket)
  LambdaAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LambdaAssetsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub "${LambdaAssetsBucket}/*"
              - !Ref LambdaAssetsBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # 4. Lambda Function (depends on IAM role and S3 bucket)
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "TapFunction-${EnvironmentSuffix}"
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 128
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentSuffix
          BUCKET_NAME: !Ref LambdaAssetsBucket
      Code:
        ZipFile: |
          import json
          import os
          import logging
          from datetime import datetime

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              """
              AWS Lambda handler function for the TAP serverless application.
              Handles HTTP requests from API Gateway.
              """
              
              # Log the incoming event
              logger.info(f"Received event: {json.dumps(event)}")
              
              # Extract HTTP method and path
              http_method = event.get('httpMethod', 'UNKNOWN')
              path = event.get('path', '/')
              
              # Get environment variables
              environment = os.environ.get('ENVIRONMENT', 'dev')
              bucket_name = os.environ.get('BUCKET_NAME', 'unknown')
              
              try:
                  # Basic routing based on HTTP method and path
                  if http_method == 'GET':
                      if path == '/health' or path == '/':
                          response_body = {
                              'message': 'TAP Serverless Application is running!',
                              'environment': environment,
                              'bucket': bucket_name,
                              'path': path,
                              'method': http_method,
                              'timestamp': datetime.utcnow().isoformat(),
                              'request_id': context.aws_request_id
                          }
                          status_code = 200
                      else:
                          response_body = {
                              'message': f'GET endpoint {path} not found',
                              'available_endpoints': ['/health', '/'],
                              'timestamp': datetime.utcnow().isoformat()
                          }
                          status_code = 404
                          
                  elif http_method == 'POST':
                      # Handle POST requests
                      try:
                          request_body = json.loads(event.get('body', '{}'))
                          response_body = {
                              'message': 'POST request processed successfully',
                              'received_data': request_body,
                              'environment': environment,
                              'request_id': context.aws_request_id,
                              'timestamp': datetime.utcnow().isoformat()
                          }
                          status_code = 200
                      except json.JSONDecodeError:
                          response_body = {
                              'error': 'Invalid JSON in request body',
                              'timestamp': datetime.utcnow().isoformat()
                          }
                          status_code = 400
                          
                  elif http_method == 'PUT':
                      # Handle PUT requests
                      try:
                          request_body = json.loads(event.get('body', '{}'))
                          response_body = {
                              'message': 'PUT request processed successfully',
                              'updated_data': request_body,
                              'environment': environment,
                              'request_id': context.aws_request_id,
                              'timestamp': datetime.utcnow().isoformat()
                          }
                          status_code = 200
                      except json.JSONDecodeError:
                          response_body = {
                              'error': 'Invalid JSON in request body',
                              'timestamp': datetime.utcnow().isoformat()
                          }
                          status_code = 400
                          
                  elif http_method == 'DELETE':
                      # Handle DELETE requests
                      response_body = {
                          'message': 'DELETE request processed successfully',
                          'path': path,
                          'environment': environment,
                          'request_id': context.aws_request_id,
                          'timestamp': datetime.utcnow().isoformat()
                      }
                      status_code = 200
                      
                  else:
                      # Handle other HTTP methods
                      response_body = {
                          'message': f'HTTP method {http_method} is supported',
                          'path': path,
                          'supported_methods': ['GET', 'POST', 'PUT', 'DELETE'],
                          'timestamp': datetime.utcnow().isoformat()
                      }
                      status_code = 200
                  
                  # Prepare the response
                  response = {
                      'statusCode': status_code,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*',
                          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                      },
                      'body': json.dumps(response_body)
                  }
                  
                  logger.info(f"Returning response: {json.dumps(response)}")
                  return response
                  
              except Exception as e:
                  logger.error(f"Unexpected error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'message': str(e),
                          'timestamp': datetime.utcnow().isoformat()
                      })
                  }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TAP-Stack
        - Key: ManagedBy
          Value: CloudFormation

  # 5. CloudWatch Log Group for Lambda (depends on Lambda function)
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${LambdaFunction}"
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TAP-Stack
        - Key: ManagedBy
          Value: CloudFormation

  # 6. API Gateway REST API (no dependencies)
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "TapApi-${EnvironmentSuffix}"
      Description: "TAP Stack API Gateway"
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: TAP-Stack
        - Key: ManagedBy
          Value: CloudFormation

  # 7. API Gateway Resource for proxy integration (depends on API Gateway)
  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: "{proxy+}"

  # 8. API Gateway Method for root resource (depends on API Gateway and Lambda)
  ApiGatewayMethodRoot:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !GetAtt ApiGateway.RootResourceId
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true

  # 9. API Gateway Method for proxy resource (depends on API Gateway Resource and Lambda)
  ApiGatewayMethodProxy:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true

  # 10. API Gateway OPTIONS Method for CORS (depends on API Gateway Resource)
  ApiGatewayMethodOptions:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,POST,PUT,DELETE,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
            ResponseTemplates:
              application/json: ''
        PassthroughBehavior: WHEN_NO_MATCH
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Origin: true

  # 11. API Gateway Deployment (depends on all methods)
  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiGatewayMethodRoot
      - ApiGatewayMethodProxy
      - ApiGatewayMethodOptions
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: prod

  # 12. Lambda Permission for API Gateway (depends on Lambda function and API Gateway)
  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"

Outputs:
  ApiGatewayUrl:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod"
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-ApiUrl"

  LambdaFunctionName:
    Description: "Lambda Function Name"
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-LambdaName"

  LambdaFunctionArn:
    Description: "Lambda Function ARN"
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-LambdaArn"

  S3BucketName:
    Description: "S3 Bucket for Lambda assets"
    Value: !Ref LambdaAssetsBucket
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-S3Bucket"

  LambdaExecutionRoleArn:
    Description: "Lambda Execution Role ARN"
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-RoleArn"

  ApiGatewayId:
    Description: "API Gateway ID"
    Value: !Ref ApiGateway
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-ApiId"

  Region:
    Description: "AWS Region where resources are deployed"
    Value: !Ref "AWS::Region"
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-Region"

  Environment:
    Description: "Environment suffix used for resource naming"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "TapStack-${EnvironmentSuffix}-Environment"
```