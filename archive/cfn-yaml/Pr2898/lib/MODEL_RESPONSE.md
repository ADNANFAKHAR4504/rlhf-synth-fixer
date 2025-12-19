```yml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Production-ready serverless web application infrastructure"

Parameters:
  ApplicationName:
    Type: String
    Default: "ServerlessWebApp"
    Description: "Name of the application"

  Environment:
    Type: String
    Default: "Production"
    AllowedValues: [Development, Staging, Production]
    Description: "Environment name"

  DynamoDBReadCapacity:
    Type: Number
    Default: 5
    MinValue: 1
    MaxValue: 10000
    Description: "DynamoDB table read capacity units"

  DynamoDBWriteCapacity:
    Type: Number
    Default: 5
    MinValue: 1
    MaxValue: 10000
    Description: "DynamoDB table write capacity units"

  AllowedOrigins:
    Type: CommaDelimitedList
    Default: "https://example.com,https://www.example.com"
    Description: "Comma-delimited list of allowed CORS origins"

Resources:
  # ============================================================================
  # S3 BUCKET FOR STATIC WEBSITE HOSTING
  # ============================================================================
  WebsiteS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ApplicationName}-${Environment}-website-${AWS::AccountId}"
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref WebsiteS3BucketKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # KMS Key for S3 Bucket Encryption
  WebsiteS3BucketKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "KMS Key for S3 bucket encryption"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  WebsiteS3BucketKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${ApplicationName}-${Environment}-s3-key"
      TargetKeyId: !Ref WebsiteS3BucketKMSKey

  # S3 Bucket Policy for Website Access
  WebsiteS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteS3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: PublicReadGetObject
            Effect: Allow
            Principal: "*"
            Action: "s3:GetObject"
            Resource: !Sub "${WebsiteS3Bucket}/*"

  # ============================================================================
  # DYNAMODB TABLE WITH STREAMS
  # ============================================================================
  ApplicationDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${ApplicationName}-${Environment}-data"
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      AttributeDefinitions:
        - AttributeName: "id"
          AttributeType: "S"
      KeySchema:
        - AttributeName: "id"
          KeyType: "HASH"
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # ============================================================================
  # IAM ROLES AND POLICIES
  # ============================================================================

  # Lambda Execution Role for Main Application Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ApplicationName}-${Environment}-lambda-role"
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
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt ApplicationDataTable.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # Lambda Execution Role for DynamoDB Stream Processing
  StreamProcessorLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ApplicationName}-${Environment}-stream-processor-role"
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
        - PolicyName: DynamoDBStreamAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:DescribeStream
                  - dynamodb:GetRecords
                  - dynamodb:GetShardIterator
                  - dynamodb:ListStreams
                Resource: !GetAtt ApplicationDataTable.StreamArn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # API Gateway Execution Role
  ApiGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ApplicationName}-${Environment}-apigateway-role"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # ============================================================================
  # LAMBDA FUNCTIONS
  # ============================================================================

  # CloudWatch Log Group for Main Lambda Function
  MainLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${ApplicationName}-${Environment}-main"
      RetentionInDays: 14

  # Main Application Lambda Function
  MainLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${ApplicationName}-${Environment}-main"
      Runtime: nodejs16.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          DYNAMODB_TABLE: !Ref ApplicationDataTable
          REGION: !Ref AWS::Region
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();

          exports.handler = async (event) => {
              console.log('Event:', JSON.stringify(event, null, 2));
              
              const response = {
                  statusCode: 200,
                  headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Headers': 'Content-Type',
                      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
                  },
                  body: JSON.stringify({
                      message: 'Hello from Lambda!',
                      environment: process.env.ENVIRONMENT,
                      timestamp: new Date().toISOString()
                  })
              };
              
              return response;
          };
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
    DependsOn: MainLambdaLogGroup

  # CloudWatch Log Group for Stream Processor Lambda Function
  StreamProcessorLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${ApplicationName}-${Environment}-stream-processor"
      RetentionInDays: 14

  # DynamoDB Stream Processor Lambda Function
  StreamProcessorLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${ApplicationName}-${Environment}-stream-processor"
      Runtime: nodejs16.x
      Handler: index.handler
      Role: !GetAtt StreamProcessorLambdaRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          REGION: !Ref AWS::Region
      Code:
        ZipFile: |
          exports.handler = async (event) => {
              console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));
              
              for (const record of event.Records) {
                  console.log('Event Name:', record.eventName);
                  console.log('DynamoDB Record:', JSON.stringify(record.dynamodb, null, 2));
                  
                  // Process the stream record here
                  // Add your business logic for handling data changes
              }
              
              return { message: 'Stream processed successfully' };
          };
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
    DependsOn: StreamProcessorLambdaLogGroup

  # Event Source Mapping for DynamoDB Stream
  DynamoDBStreamEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt ApplicationDataTable.StreamArn
      FunctionName: !Ref StreamProcessorLambdaFunction
      StartingPosition: LATEST
      BatchSize: 10
      MaximumBatchingWindowInSeconds: 5

  # ============================================================================
  # API GATEWAY
  # ============================================================================

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/apigateway/${ApplicationName}-${Environment}"
      RetentionInDays: 14

  # API Gateway Account Configuration
  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayRole.Arn

  # REST API
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "${ApplicationName}-${Environment}-api"
      Description: "REST API for serverless web application"
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

  # API Gateway Resource
  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: "api"

  # OPTIONS Method for CORS
  ApiOptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: "200"
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,POST,PUT,DELETE,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: !Sub
                - "'${origins}'"
                - origins: !Join ["','", !Ref AllowedOrigins]
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: "200"
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: false
            method.response.header.Access-Control-Allow-Methods: false
            method.response.header.Access-Control-Allow-Origin: false

  # POST Method
  ApiPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${MainLambdaFunction.Arn}/invocations"
        IntegrationResponses:
          - StatusCode: "200"

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref MainLambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "${RestApi}/*/POST/api"

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiPostMethod
      - ApiOptionsMethod
    Properties:
      RestApiId: !Ref RestApi
      Description: "Production deployment"

  # API Gateway Stage
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestApi
      DeploymentId: !Ref ApiDeployment
      StageName: !Ref Environment
      Description: !Sub "${Environment} stage"
      Variables:
        Environment: !Ref Environment
        LambdaFunction: !Ref MainLambdaFunction
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '$context.requestId $context.identity.sourceIp $context.identity.caller $context.identity.user [$context.requestTime] "$context.httpMethod $context.resourcePath $context.protocol" $context.status $context.error.message $context.error.messageString'
      MethodSettings:
        - ResourcePath: "/*"
          HttpMethod: "*"
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
    DependsOn: ApiGatewayAccount

# ============================================================================
# OUTPUTS
# ============================================================================
Outputs:
  WebsiteURL:
    Description: "Website URL"
    Value: !GetAtt WebsiteS3Bucket.WebsiteURL
    Export:
      Name: !Sub "${ApplicationName}-${Environment}-WebsiteURL"

  S3BucketName:
    Description: "S3 Bucket Name for static website hosting"
    Value: !Ref WebsiteS3Bucket
    Export:
      Name: !Sub "${ApplicationName}-${Environment}-S3Bucket"

  ApiGatewayURL:
    Description: "API Gateway URL"
    Value: !Sub "https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/api"
    Export:
      Name: !Sub "${ApplicationName}-${Environment}-ApiURL"

  DynamoDBTableName:
    Description: "DynamoDB Table Name"
    Value: !Ref ApplicationDataTable
    Export:
      Name: !Sub "${ApplicationName}-${Environment}-DynamoDBTable"

  MainLambdaFunctionArn:
    Description: "Main Lambda Function ARN"
    Value: !GetAtt MainLambdaFunction.Arn
    Export:
      Name: !Sub "${ApplicationName}-${Environment}-MainLambdaArn"

  StreamProcessorLambdaFunctionArn:
    Description: "Stream Processor Lambda Function ARN"
    Value: !GetAtt StreamProcessorLambdaFunction.Arn
    Export:
      Name: !Sub "${ApplicationName}-${Environment}-StreamProcessorArn"

  RestApiId:
    Description: "REST API ID"
    Value: !Ref RestApi
    Export:
      Name: !Sub "${ApplicationName}-${Environment}-RestApiId"
```