# Secure Web Application Infrastructure - CloudFormation Template

This CloudFormation YAML template creates a secure, resilient, and compliant web application infrastructure that meets all the specified requirements for AWS security best practices and operational compliance.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless infrastructure with Lambda, API Gateway, S3, and CloudWatch monitoring'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    Description: 'Environment name for resource naming'
    AllowedValues:
      - dev
      - staging
      - prod

Resources:
  # Customer-managed KMS key for S3 encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

  # KMS key alias for easier reference
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-s3-encryption-key'
      TargetKeyId: !GetAtt S3EncryptionKey.KeyId

  # S3 bucket for processed data with encryption
  ProcessedDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
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
              DaysAfterInitiation: 7
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpiration:
              NoncurrentDays: 30

  # CloudWatch Log Group for Lambda function
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${AWS::StackName}-processor-function'
      RetentionInDays: 14

  # IAM execution role for Lambda with least privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-lambda-execution-role'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub 'arn:aws:s3:::${ProcessedDataBucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::${ProcessedDataBucket}'
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                  - 'kms:DescribeKey'
                Resource: !GetAtt S3EncryptionKey.Arn

  # Lambda function
  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub '${AWS::StackName}-processor-function'
      Runtime: python3.12
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          S3_BUCKET_NAME: !Ref ProcessedDataBucket
          KMS_KEY_ID: !Ref S3EncryptionKey
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          from datetime import datetime

          def lambda_handler(event, context):
              print(f"Received event: {json.dumps(event)}")
              
              # Initialize S3 client
              s3_client = boto3.client('s3')
              bucket_name = os.environ['S3_BUCKET_NAME']
              
              try:
                  # Extract request data
                  http_method = event.get('httpMethod', 'UNKNOWN')
                  path = event.get('path', '/')
                  query_params = event.get('queryStringParameters') or {}
                  body = event.get('body', '')
                  
                  # Process the request (example: store request data in S3)
                  request_id = str(uuid.uuid4())
                  timestamp = datetime.utcnow().isoformat()
                  
                  processed_data = {
                      'request_id': request_id,
                      'timestamp': timestamp,
                      'method': http_method,
                      'path': path,
                      'query_params': query_params,
                      'body': body,
                      'status': 'processed'
                  }
                  
                  # Store processed data in S3
                  s3_key = f"processed/{timestamp[:10]}/{request_id}.json"
                  s3_client.put_object(
                      Bucket=bucket_name,
                      Key=s3_key,
                      Body=json.dumps(processed_data),
                      ContentType='application/json'
                  )
                  
                  response_body = {
                      'message': 'Request processed successfully',
                      'request_id': request_id,
                      's3_location': f"s3://{bucket_name}/{s3_key}",
                      'timestamp': timestamp
                  }
                  
                  print(f"Response: {json.dumps(response_body)}")
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps(response_body)
                  }
                  
              except Exception as e:
                  error_message = f"Error processing request: {str(e)}"
                  print(f"Error: {error_message}")
                  
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': error_message,
                          'request_id': str(uuid.uuid4())
                      })
                  }

  # API Gateway REST API
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${AWS::StackName}-api'
      Description: 'REST API for Lambda function'
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Gateway resource (proxy resource to catch all paths)
  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: '{proxy+}'

  # API Gateway method for proxy resource
  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'

  # API Gateway method for root resource
  ApiGatewayRootMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !GetAtt ApiGateway.RootResourceId
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'

  # API Gateway deployment
  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiGatewayMethod
      - ApiGatewayRootMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: !Ref Environment

  # Lambda permission for API Gateway to invoke the function
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/${Environment}/ANY/*'

  # Lambda permission for API Gateway root resource
  LambdaApiGatewayRootPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/${Environment}/ANY'

  # CloudWatch alarm for Lambda errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-lambda-errors'
      AlarmDescription: 'Alarm for Lambda function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

  # CloudWatch alarm for Lambda duration
  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-lambda-duration'
      AlarmDescription: 'Alarm for Lambda function duration'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000 # 25 seconds (function timeout is 30 seconds)
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

  # CloudWatch alarm for Lambda invocations
  LambdaInvocationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-lambda-invocations'
      AlarmDescription: 'Alarm for Lambda function invocations'
      MetricName: Invocations
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway invocation URL for testing and consuming the API'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-api-url'

  LambdaFunctionArn:
    Description: 'Lambda function Amazon Resource Name (ARN)'
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-arn'

  S3BucketName:
    Description: 'S3 bucket name for processed data'
    Value: !Ref ProcessedDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-s3-bucket'

  KMSKeyId:
    Description: 'KMS key ID used for S3 encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-kms-key'

  KMSKeyAlias:
    Description: 'KMS key alias for easier reference'
    Value: !Ref S3EncryptionKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-kms-alias'
```
