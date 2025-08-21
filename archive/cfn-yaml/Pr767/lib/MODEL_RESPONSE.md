```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade serverless architecture with API Gateway v2, Lambda, and S3 following AWS Well-Architected Framework'

Parameters:
  Environment:
    Type: String
    Default: prod
    Description: Environment name
    AllowedValues:
      - prod
      - staging
      - dev
  
  OutputBucketNameSuffix:
    Type: String
    Default: ''
    Description: Optional suffix for S3 bucket name to ensure global uniqueness
  
  UseKms:
    Type: String
    Default: 'false'
    Description: Use KMS encryption for S3 bucket
    AllowedValues:
      - 'true'
      - 'false'
  
  KmsKeyArn:
    Type: String
    Default: ''
    Description: KMS Key ARN for S3 encryption (required if UseKms is true)

Conditions:
  UseKmsEncryption: !Equals [!Ref UseKms, 'true']
  HasBucketSuffix: !Not [!Equals [!Ref OutputBucketNameSuffix, '']]

Mappings:
  EnvironmentConfig:
    prod:
      LogRetentionDays: 30
    staging:
      LogRetentionDays: 14
    dev:
      LogRetentionDays: 7

Resources:
  # S3 Bucket for Lambda output
  OutputBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 
        - '${Environment}-s3-app-output${Suffix}'
        - Suffix: !If [HasBucketSuffix, !Sub '-${OutputBucketNameSuffix}', !Sub '-${AWS::StackId}']
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: !If [UseKmsEncryption, 'aws:kms', 'AES256']
              KMSMasterKeyID: !If [UseKmsEncryption, !Ref KmsKeyArn, !Ref 'AWS::NoValue']
            BucketKeyEnabled: !If [UseKmsEncryption, true, !Ref 'AWS::NoValue']
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-s3-app-output'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Sub '${Environment}-serverless-app'

  # S3 Bucket Policy
  OutputBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref OutputBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${OutputBucket}/*'
              - !Ref OutputBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - !If
            - UseKmsEncryption
            - Sid: DenyUnencryptedObjectUploads
              Effect: Deny
              Principal: '*'
              Action: 's3:PutObject'
              Resource: !Sub '${OutputBucket}/*'
              Condition:
                StringNotEquals:
                  's3:x-amz-server-side-encryption': 'aws:kms'
            - Sid: DenyUnencryptedObjectUploads
              Effect: Deny
              Principal: '*'
              Action: 's3:PutObject'
              Resource: !Sub '${OutputBucket}/*'
              Condition:
                StringNotEquals:
                  's3:x-amz-server-side-encryption': 'AES256'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-lambda-processor-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${Environment}-lambda-processor-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Environment}-lambda-processor*'
              - Effect: Allow
                Action:
                  - xray:PutTraceSegments
                  - xray:PutTelemetryRecords
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${OutputBucket}/processed/*'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-lambda-processor-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Sub '${Environment}-serverless-app'

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-lambda-processor'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetentionDays]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-lambda-processor-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Sub '${Environment}-serverless-app'

  # Lambda Function
  ProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-lambda-processor'
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          BUCKET_NAME: !Ref OutputBucket
          BUCKET_PREFIX: 'processed/'
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          from datetime import datetime
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          s3_client = boto3.client('s3')

          def handler(event, context):
              try:
                  # Parse request
                  if 'body' not in event:
                      return {
                          'statusCode': 400,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps({'error': 'Missing request body'})
                      }
                  
                  # Parse JSON body
                  try:
                      if isinstance(event['body'], str):
                          body = json.loads(event['body'])
                      else:
                          body = event['body']
                  except json.JSONDecodeError:
                      return {
                          'statusCode': 400,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps({'error': 'Invalid JSON in request body'})
                      }
                  
                  # Basic input validation
                  if not isinstance(body, dict):
                      return {
                          'statusCode': 400,
                          'headers': {'Content-Type': 'application/json'},
                          'body': json.dumps({'error': 'Request body must be a JSON object'})
                      }
                  
                  # Process the data (example: add metadata)
                  processed_data = {
                      'original_data': body,
                      'processed_at': datetime.utcnow().isoformat(),
                      'request_id': context.aws_request_id,
                      'environment': os.environ.get('ENVIRONMENT', 'unknown')
                  }
                  
                  # Generate S3 object key
                  object_key = f"{os.environ['BUCKET_PREFIX']}{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid.uuid4()}.json"
                  
                  # Write to S3
                  s3_client.put_object(
                      Bucket=os.environ['BUCKET_NAME'],
                      Key=object_key,
                      Body=json.dumps(processed_data, indent=2),
                      ContentType='application/json',
                      ServerSideEncryption='AES256'
                  )
                  
                  logger.info(f"Successfully processed and stored object: {object_key}")
                  
                  # Return success response
                  return {
                      'statusCode': 200,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          'object_key': object_key,
                          'request_id': context.aws_request_id
                      })
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing request: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'request_id': context.aws_request_id
                      })
                  }
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-lambda-processor'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Sub '${Environment}-serverless-app'

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${Environment}-apigw-http'
      RetentionInDays: !FindInMap [EnvironmentConfig, !Ref Environment, LogRetentionDays]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-apigw-http-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Sub '${Environment}-serverless-app'

  # API Gateway HTTP API
  HttpApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub '${Environment}-apigw-http'
      Description: !Sub 'HTTP API for ${Environment} serverless application'
      ProtocolType: HTTP
      CorsConfiguration:
        AllowCredentials: false
        AllowHeaders:
          - Content-Type
          - X-Amz-Date
          - Authorization
          - X-Api-Key
        AllowMethods:
          - POST
          - OPTIONS
        AllowOrigins:
          - '*'
        MaxAge: 300
      Tags:
        Name: !Sub '${Environment}-apigw-http'
        Environment: !Ref Environment
        Application: !Sub '${Environment}-serverless-app'

  # Lambda Integration
  LambdaIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref HttpApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProcessorFunction.Arn}/invocations'
      PayloadFormatVersion: '2.0'
      TimeoutInMillis: 30000

  # API Route
  ProcessRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref HttpApi
      RouteKey: 'POST /process'
      Target: !Sub 'integrations/${LambdaIntegration}'

  # API Stage
  ApiStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref HttpApi
      StageName: !Ref Environment
      Description: !Sub '${Environment} stage for serverless API'
      AutoDeploy: true
      AccessLogSettings:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","routeKey":"$context.routeKey","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength","error.message":"$context.error.message","error.messageString":"$context.error.messageString","integration.error":"$context.integration.error","integration.integrationStatus":"$context.integration.integrationStatus"}'
      Tags:
        Name: !Sub '${Environment}-apigw-http-stage'
        Environment: !Ref Environment
        Application: !Sub '${Environment}-serverless-app'

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProcessorFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${HttpApi}/*/*'

Outputs:
  ApiEndpoint:
    Description: API Gateway HTTP API endpoint URL
    Value: !Sub 'https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'

  LambdaFunctionArn:
    Description: Lambda function ARN
    Value: !GetAtt ProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  OutputBucketName:
    Description: S3 bucket name for processed output
    Value: !Ref OutputBucket
    Export:
      Name: !Sub '${AWS::StackName}-OutputBucketName'

  LambdaFunctionName:
    Description: Lambda function name
    Value: !Ref ProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'
```