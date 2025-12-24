```
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready serverless infrastructure with S3, Lambda, and API Gateway'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource tagging'
  
  ProjectName:
    Type: String
    Default: 'serverless-app'
    Description: 'Project name for resource naming and tagging'

Mappings:
  RegionMap:
    us-east-1:
      RegionName: 'us-east-1'

Conditions:
  IsUsEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']

Resources:
  # S3 Bucket with versioning enabled
  ServerlessS3Bucket:
    Type: AWS::S3::Bucket
    Condition: IsUsEast1
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-bucket-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
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
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt ServerlessLambdaFunction.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # S3 Bucket Policy
  ServerlessS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: IsUsEast1
    Properties:
      Bucket: !Ref ServerlessS3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ServerlessS3Bucket}/*'
              - !Ref ServerlessS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # IAM Role for Lambda Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Condition: IsUsEast1
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-role'
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
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${ServerlessS3Bucket}/*'
                  - !Ref ServerlessS3Bucket
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # Lambda Function
  ServerlessLambdaFunction:
    Type: AWS::Lambda::Function
    Condition: IsUsEast1
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 128
      Environment:
        Variables:
          S3_BUCKET: !Ref ServerlessS3Bucket
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          def lambda_handler(event, context):
              """
              Basic Lambda function that processes API Gateway requests
              and interacts with S3 bucket
              """
              s3_bucket = os.environ.get('S3_BUCKET')
              environment = os.environ.get('ENVIRONMENT')
              
              # Handle different HTTP methods
              http_method = event.get('httpMethod', 'GET')
              
              try:
                  if http_method == 'GET':
                      # Return basic information
                      response_body = {
                          'message': 'Hello from serverless Lambda!',
                          'timestamp': datetime.utcnow().isoformat(),
                          'environment': environment,
                          's3_bucket': s3_bucket,
                          'method': http_method
                      }
                  elif http_method == 'POST':
                      # Process POST data
                      body = json.loads(event.get('body', '{}'))
                      response_body = {
                          'message': 'Data received successfully',
                          'received_data': body,
                          'timestamp': datetime.utcnow().isoformat(),
                          'environment': environment
                      }
                  else:
                      response_body = {
                          'message': f'Method {http_method} not supported',
                          'timestamp': datetime.utcnow().isoformat()
                      }
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*',
                          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                      },
                      'body': json.dumps(response_body)
                  }
              
              except Exception as e:
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
        - Key: ManagedBy
          Value: CloudFormation

  # Lambda Permission for S3
  LambdaInvokePermissionS3:
    Type: AWS::Lambda::Permission
    Condition: IsUsEast1
    Properties:
      FunctionName: !Ref ServerlessLambdaFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub '${ServerlessS3Bucket}/*'

  # Lambda Permission for API Gateway
  LambdaInvokePermissionAPI:
    Type: AWS::Lambda::Permission
    Condition: IsUsEast1
    Properties:
      FunctionName: !Ref ServerlessLambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessAPIGateway}/*/*'

  # API Gateway REST API
  ServerlessAPIGateway:
    Type: AWS::ApiGateway::RestApi
    Condition: IsUsEast1
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-api'
      Description: 'Serverless API Gateway for Lambda function'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # API Gateway Resource
  APIGatewayResource:
    Type: AWS::ApiGateway::Resource
    Condition: IsUsEast1
    Properties:
      RestApiId: !Ref ServerlessAPIGateway
      ParentId: !GetAtt ServerlessAPIGateway.RootResourceId
      PathPart: 'serverless'

  # API Gateway Method - GET
  APIGatewayMethodGET:
    Type: AWS::ApiGateway::Method
    Condition: IsUsEast1
    Properties:
      RestApiId: !Ref ServerlessAPIGateway
      ResourceId: !Ref APIGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ServerlessLambdaFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseHeaders:
            Access-Control-Allow-Origin: true
            Access-Control-Allow-Headers: true
            Access-Control-Allow-Methods: true

  # API Gateway Method - POST
  APIGatewayMethodPOST:
    Type: AWS::ApiGateway::Method
    Condition: IsUsEast1
    Properties:
      RestApiId: !Ref ServerlessAPIGateway
      ResourceId: !Ref APIGatewayResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ServerlessLambdaFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseHeaders:
            Access-Control-Allow-Origin: true
            Access-Control-Allow-Headers: true
            Access-Control-Allow-Methods: true

  # API Gateway Method - OPTIONS (for CORS)
  APIGatewayMethodOPTIONS:
    Type: AWS::ApiGateway::Method
    Condition: IsUsEast1
    Properties:
      RestApiId: !Ref ServerlessAPIGateway
      ResourceId: !Ref APIGatewayResource
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
            ResponseTemplates:
              application/json: ''
        PassthroughBehavior: WHEN_NO_MATCH
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseHeaders:
            Access-Control-Allow-Headers: true
            Access-Control-Allow-Methods: true
            Access-Control-Allow-Origin: true

  # API Gateway Deployment
  APIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    Condition: IsUsEast1
    DependsOn:
      - APIGatewayMethodGET
      - APIGatewayMethodPOST
      - APIGatewayMethodOPTIONS
    Properties:
      RestApiId: !Ref ServerlessAPIGateway
      StageName: !Ref Environment
      StageDescription: !Sub 'Deployment for ${Environment} environment'

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Condition: IsUsEast1
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ServerlessLambdaFunction}'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

Outputs:
  S3BucketName:
    Description: 'Name of the created S3 bucket'
    Value: !Ref ServerlessS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  LambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref ServerlessLambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt ServerlessLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  APIGatewayURL:
    Description: 'URL of the API Gateway endpoint'
    Value: !Sub 'https://${ServerlessAPIGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/serverless'
    Export:
      Name: !Sub '${AWS::StackName}-APIGatewayURL'

  APIGatewayId:
    Description: 'ID of the API Gateway'
    Value: !Ref ServerlessAPIGateway
    Export:
      Name: !Sub '${AWS::StackName}-APIGatewayId'

  Region:
    Description: 'AWS Region where resources are deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-Region'

```