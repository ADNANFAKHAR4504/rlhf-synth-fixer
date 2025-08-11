```
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Backend Infrastructure - Production-grade architecture with API Gateway, Lambda, DynamoDB, S3, and CloudWatch monitoring'

Parameters:
  Environment:
    Type: String
    Default: dev
    Description: Environment name for resource naming
    AllowedValues:
      - dev
      - staging
      - prod

  ProjectName:
    Type: String
    Default: myProject
    Description: Project name for resource naming

Resources:
  # ===================================
  # IAM ROLES AND POLICIES
  # ===================================
  
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambdaExecutionRole-${Environment}'
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
                  - dynamodb:Query
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${S3Bucket}/*'
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-myLambdaFunction-${Environment}:*'

  ApiGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-apiGatewayRole-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaInvokeAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource: !GetAtt LambdaFunction.Arn

  # ===================================
  # DYNAMODB TABLE
  # ===================================
  
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-myDynamoDbTable-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: createdAt
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: createdAt
          KeyType: RANGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ===================================
  # S3 BUCKET
  # ===================================
  
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-mystoragebuket-${Environment}-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ===================================
  # LAMBDA FUNCTION
  # ===================================
  
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-myLambdaFunction-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          DYNAMODB_TABLE_NAME: !Ref DynamoDBTable
          S3_BUCKET_NAME: !Ref S3Bucket
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import logging

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          # Initialize AWS clients
          dynamodb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')

          def lambda_handler(event, context):
              try:
                  logger.info(f"Received event: {json.dumps(event)}")
                  
                  # Get environment variables
                  table_name = os.environ['DYNAMODB_TABLE_NAME']
                  bucket_name = os.environ['S3_BUCKET_NAME']
                  
                  # Get DynamoDB table
                  table = dynamodb.Table(table_name)
                  
                  # Parse request body
                  if event.get('body'):
                      body = json.loads(event['body'])
                  else:
                      body = event
                  
                  # Extract data
                  user_id = body.get('userId', 'default-user')
                  data = body.get('data', {})
                  
                  # Create timestamp
                  created_at = datetime.utcnow().isoformat()
                  
                  # Write to DynamoDB
                  response = table.put_item(
                      Item={
                          'userId': user_id,
                          'createdAt': created_at,
                          'data': data,
                          'timestamp': int(datetime.utcnow().timestamp())
                      }
                  )
                  
                  logger.info(f"Successfully wrote to DynamoDB: {response}")
                  
                  # Return success response
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          'userId': user_id,
                          'createdAt': created_at
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
        - Key: Project
          Value: !Ref ProjectName

  # ===================================
  # CLOUDWATCH LOG GROUP
  # ===================================
  
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-myLambdaFunction-${Environment}'
      RetentionInDays: 14

  # ===================================
  # API GATEWAY
  # ===================================
  
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-myApiGateway-${Environment}'
      Description: 'Serverless API for backend operations'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: 'data'

  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
        Credentials: !GetAtt ApiGatewayRole.Arn
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
        - StatusCode: 500
          ResponseModels:
            application/json: Empty

  ApiGatewayGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
        Credentials: !GetAtt ApiGatewayRole.Arn
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiGatewayMethod
      - ApiGatewayGetMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: !Ref Environment
      StageDescription: !Sub 'Deployment for ${Environment} environment'

  # ===================================
  # LAMBDA PERMISSIONS
  # ===================================
  
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*/*'

  # ===================================
  # CLOUDWATCH ALARMS
  # ===================================
  
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-Lambda-ErrorRate-${Environment}'
      AlarmDescription: 'Lambda function error rate is too high'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-Lambda-Duration-${Environment}'
      AlarmDescription: 'Lambda function duration is too high'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

  LambdaInvocationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-Lambda-Invocations-${Environment}'
      AlarmDescription: 'Lambda function invocation count monitoring'
      MetricName: Invocations
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

  # ===================================
  # API GATEWAY ALARMS
  # ===================================
  
  ApiGateway4XXErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-ApiGateway-4XXError-${Environment}'
      AlarmDescription: 'API Gateway 4XX error rate is too high'
      MetricName: 4XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Sub '${ProjectName}-myApiGateway-${Environment}'
        - Name: Stage
          Value: !Ref Environment
      TreatMissingData: notBreaching

  ApiGateway5XXErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-ApiGateway-5XXError-${Environment}'
      AlarmDescription: 'API Gateway 5XX error rate is too high'
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Sub '${ProjectName}-myApiGateway-${Environment}'
        - Name: Stage
          Value: !Ref Environment
      TreatMissingData: notBreaching

# ===================================
# OUTPUTS
# ===================================

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-ApiGatewayUrl-${Environment}'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-LambdaFunctionArn-${Environment}'

  DynamoDBTableName:
    Description: 'DynamoDB table name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${ProjectName}-DynamoDBTableName-${Environment}'

  S3BucketName:
    Description: 'S3 bucket name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${ProjectName}-S3BucketName-${Environment}'

  ApiGatewayPostEndpoint:
    Description: 'API Gateway POST endpoint for data operations'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/data'

  ApiGatewayGetEndpoint:
    Description: 'API Gateway GET endpoint for data operations'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/data'

```