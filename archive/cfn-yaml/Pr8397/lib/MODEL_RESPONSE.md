```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, highly available serverless infrastructure with blue/green deployments'

Parameters:
  ProjectName:
    Type: String
    Default: 'nova-serverless'
    Description: 'Project name for resource naming convention'
  
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'

Resources:
  # KMS Key for encryption
  NovaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for Nova Serverless Infrastructure'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'

  NovaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-key'
      TargetKeyId: !Ref NovaKMSKey

  # S3 Bucket for Lambda Logs
  NovaLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-lambda-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteLogsAfter7Days
            Status: Enabled
            ExpirationInDays: 7
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref NovaLogGroup

  # CloudWatch Log Group
  NovaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${Environment}-function'
      RetentionInDays: 7
      KmsKeyId: !GetAtt NovaKMSKey.Arn

  # IAM Role for Lambda
  NovaLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-execution-role'
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
        - PolicyName: NovaLambdaS3LogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                  - s3:GetObject
                Resource: !Sub '${NovaLogsBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt NovaKMSKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt NovaLogGroup.Arn

  # Lambda Function
  NovaLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt NovaLambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          LOG_BUCKET: !Ref NovaLogsBucket
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT: !Ref Environment
      KMSKeyArn: !GetAtt NovaKMSKey.Arn
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
          
          # Initialize S3 client
          s3_client = boto3.client('s3')
          
          def lambda_handler(event, context):
              try:
                  # Log request details
                  logger.info(f"Received event: {json.dumps(event)}")
                  
                  # Extract HTTP method and path
                  http_method = event.get('httpMethod', 'UNKNOWN')
                  path = event.get('path', '/')
                  
                  # Create response based on path
                  if path == '/health':
                      response_body = {
                          'status': 'healthy',
                          'timestamp': datetime.utcnow().isoformat(),
                          'version': '1.0.0'
                      }
                  elif path == '/info':
                      response_body = {
                          'project': os.environ.get('PROJECT_NAME', 'nova-serverless'),
                          'environment': os.environ.get('ENVIRONMENT', 'dev'),
                          'method': http_method,
                          'timestamp': datetime.utcnow().isoformat()
                      }
                  else:
                      response_body = {
                          'message': f'Hello from Nova Serverless! Path: {path}',
                          'method': http_method,
                          'timestamp': datetime.utcnow().isoformat()
                      }
                  
                  # Log to S3 bucket
                  log_entry = {
                      'timestamp': datetime.utcnow().isoformat(),
                      'method': http_method,
                      'path': path,
                      'response': response_body
                  }
                  
                  try:
                      s3_key = f"logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.aws_request_id}.json"
                      s3_client.put_object(
                          Bucket=os.environ.get('LOG_BUCKET'),
                          Key=s3_key,
                          Body=json.dumps(log_entry),
                          ContentType='application/json'
                      )
                  except Exception as s3_error:
                      logger.error(f"Failed to write to S3: {str(s3_error)}")
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*',
                          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                      },
                      'body': json.dumps(response_body)
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing request: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'timestamp': datetime.utcnow().isoformat()
                      })
                  }

  # Lambda Version for Blue/Green Deployment
  NovaLambdaVersion:
    Type: AWS::Lambda::Version
    Properties:
      FunctionName: !Ref NovaLambdaFunction
      Description: 'Initial version for blue/green deployment'

  # Lambda Alias for Blue/Green Deployment
  NovaLambdaAlias:
    Type: AWS::Lambda::Alias
    Properties:
      FunctionName: !Ref NovaLambdaFunction
      FunctionVersion: !GetAtt NovaLambdaVersion.Version
      Name: 'LIVE'
      Description: 'Live alias for blue/green deployments'

  # CodeDeploy Application for Blue/Green Deployments
  NovaCodeDeployApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub '${ProjectName}-${Environment}-lambda-app'
      ComputePlatform: Lambda

  # IAM Role for CodeDeploy
  NovaCodeDeployRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-codedeploy-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codedeploy.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda

  # CodeDeploy Deployment Group
  NovaCodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref NovaCodeDeployApplication
      DeploymentGroupName: !Sub '${ProjectName}-${Environment}-deployment-group'
      ServiceRoleArn: !GetAtt NovaCodeDeployRole.Arn
      DeploymentConfigName: CodeDeployDefault.LambdaCanary10Percent5Minutes
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM

  # API Gateway REST API
  NovaApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-api'
      Description: 'Nova Serverless API Gateway'
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

  # API Gateway Resource (Proxy)
  NovaApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref NovaApiGateway
      ParentId: !GetAtt NovaApiGateway.RootResourceId
      PathPart: '{proxy+}'

  # API Gateway Method (ANY for proxy integration)
  NovaApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref NovaApiGateway
      ResourceId: !Ref NovaApiGatewayResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${NovaLambdaAlias}/invocations'
        IntegrationResponses:
          - StatusCode: 200

  # API Gateway Method for Root Resource
  NovaApiGatewayRootMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref NovaApiGateway
      ResourceId: !GetAtt NovaApiGateway.RootResourceId
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${NovaLambdaAlias}/invocations'

  # Lambda Permission for API Gateway
  NovaLambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref NovaLambdaAlias
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${NovaApiGateway}/*/*'

  # API Gateway Deployment
  NovaApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - NovaApiGatewayMethod
      - NovaApiGatewayRootMethod
    Properties:
      RestApiId: !Ref NovaApiGateway
      Description: 'Nova Serverless API Deployment'

  # API Gateway Stage
  NovaApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref NovaApiGateway
      DeploymentId: !Ref NovaApiGatewayDeployment
      StageName: !Ref Environment
      Description: !Sub 'Nova Serverless API ${Environment} Stage'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt NovaApiLogGroup.Arn
        Format: '$context.requestId $context.identity.sourceIp $context.identity.caller $context.identity.user [$context.requestTime] "$context.httpMethod $context.resourcePath $context.protocol" $context.status $context.error.message $context.error.messageString'

  # CloudWatch Log Group for API Gateway
  NovaApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}'
      RetentionInDays: 7
      KmsKeyId: !GetAtt NovaKMSKey.Arn

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${NovaApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-url'

  LambdaFunctionName:
    Description: 'Lambda function name'
    Value: !Ref NovaLambdaFunction
    Export:
      Name: !Sub '${ProjectName}-${Environment}-lambda-name'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt NovaLambdaFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-lambda-arn'

  S3LogsBucket:
    Description: 'S3 bucket for Lambda logs'
    Value: !Ref NovaLogsBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-logs-bucket'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref NovaKMSKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-key'

  CodeDeployApplication:
    Description: 'CodeDeploy application for blue/green deployments'
    Value: !Ref NovaCodeDeployApplication
    Export:
      Name: !Sub '${ProjectName}-${Environment}-codedeploy-app'
```