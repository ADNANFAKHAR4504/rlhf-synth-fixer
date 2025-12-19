# AWS CloudFormation Template for Serverless Web Application

Below is a complete CloudFormation YAML template that deploys a serverless web application according to your requirements. The template includes API Gateway, Lambda function, S3 bucket for logs, and all necessary IAM roles with least privilege permissions.

```yaml
# serverless-infra.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for a serverless web application with API Gateway, Lambda, and S3 logging'

Parameters:
  # Parameters for resource tagging
  ProjectName:
    Type: String
    Description: Name of the project
    Default: ServerlessWebApp
  
  CostCenter:
    Type: String
    Description: Cost center for billing purposes
    Default: IT-12345
  
  Environment:
    Type: String
    Description: Deployment environment
    Default: Production
    AllowedValues:
      - Production
      - Staging
      - Development
  
  # Parameters for log retention
  LogRetentionInDays:
    Type: Number
    Description: Number of days to retain logs in CloudWatch
    Default: 30
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]

Resources:
  #############################################
  # S3 Bucket for Logs
  #############################################
  LogBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${ProjectName}-logs-${AWS::Region}-${Environment}'
      AccessControl: LogDeliveryWrite
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: LogRetention
            Status: Enabled
            ExpirationInDays: 365
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  LogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudWatchLogsToWriteToS3
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LogBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AllowAPIGatewayToWriteToS3
            Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LogBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  #############################################
  # Lambda Function
  #############################################
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
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  HelloWorldFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-HelloWorldFunction-${Environment}'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log('Received event:', JSON.stringify(event, null, 2));
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'Hello World!'
              })
            };
          };
      Description: 'Lambda function that returns a Hello World message'
      Timeout: 10
      MemorySize: 128
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Log Group for Lambda
  HelloWorldFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${HelloWorldFunction}'
      RetentionInDays: !Ref LogRetentionInDays
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Subscription Filter to send Lambda logs to S3
  LambdaLogToS3SubscriptionFilter:
    Type: AWS::Logs::SubscriptionFilter
    DependsOn: 
      - LogBucketPolicy
      - HelloWorldFunctionLogGroup
    Properties:
      LogGroupName: !Ref HelloWorldFunctionLogGroup
      FilterPattern: '' # Empty pattern to capture all logs
      DestinationArn: !GetAtt LogsToS3DeliveryStream.Arn
      RoleArn: !GetAtt LogsToS3Role.Arn

  #############################################
  # Kinesis Firehose for Log Delivery to S3
  #############################################
  LogsToS3Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: AllowPutRecordToFirehose
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'firehose:PutRecord'
                  - 'firehose:PutRecordBatch'
                Resource: !GetAtt LogsToS3DeliveryStream.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  FirehoseDeliveryRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: firehose.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: S3DeliveryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:AbortMultipartUpload'
                  - 's3:GetBucketLocation'
                  - 's3:GetObject'
                  - 's3:ListBucket'
                  - 's3:ListBucketMultipartUploads'
                  - 's3:PutObject'
                Resource:
                  - !GetAtt LogBucket.Arn
                  - !Sub '${LogBucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  LogsToS3DeliveryStream:
    Type: AWS::KinesisFirehose::DeliveryStream
    Properties:
      DeliveryStreamName: !Sub '${ProjectName}-LogsToS3-${Environment}'
      DeliveryStreamType: DirectPut
      S3DestinationConfiguration:
        BucketARN: !GetAtt LogBucket.Arn
        BufferingHints:
          IntervalInSeconds: 60
          SizeInMBs: 5
        CompressionFormat: GZIP
        Prefix: 'lambda-logs/'
        RoleARN: !GetAtt FirehoseDeliveryRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  #############################################
  # API Gateway
  #############################################
  ApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCloudWatchRole.Arn

  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-API-${Environment}'
      Description: 'API Gateway for serverless web application'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  ApiGatewayRootMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !GetAtt ApiGateway.RootResourceId
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${HelloWorldFunction.Arn}/invocations'

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiGatewayRootMethod
    Properties:
      RestApiId: !Ref ApiGateway
      Description: 'Deployment for the serverless web application'

  ApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref ApiGateway
      DeploymentId: !Ref ApiGatewayDeployment
      StageName: !Ref Environment
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '{"requestId":"$context.requestId", "ip":"$context.identity.sourceIp", "requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod", "routeKey":"$context.routeKey", "status":"$context.status", "protocol":"$context.protocol", "responseLength":"$context.responseLength", "userAgent":"$context.identity.userAgent"}'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ApiGateway}/${Environment}'
      RetentionInDays: !Ref LogRetentionInDays
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  # Subscription Filter to send API Gateway logs to S3
  ApiGatewayLogToS3SubscriptionFilter:
    Type: AWS::Logs::SubscriptionFilter
    DependsOn: 
      - LogBucketPolicy
      - ApiGatewayLogGroup
    Properties:
      LogGroupName: !Ref ApiGatewayLogGroup
      FilterPattern: '' # Empty pattern to capture all logs
      DestinationArn: !GetAtt LogsToS3DeliveryStream.Arn
      RoleArn: !GetAtt LogsToS3Role.Arn

  # Permission for API Gateway to invoke Lambda
  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: 'lambda:InvokeFunction'
      FunctionName: !Ref HelloWorldFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*/*'

Outputs:
  ApiGatewayEndpoint:
    Description: 'URL of the API Gateway endpoint'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
  
  LambdaFunction:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt HelloWorldFunction.Arn
  
  LogBucketName:
    Description: 'Name of the S3 bucket for logs'
    Value: !Ref LogBucket
```

## Template Explanation

This CloudFormation template creates a complete serverless web application with the following components:

### 1. Parameters Section
- Configurable parameters for `ProjectName`, `CostCenter`, `Environment`, and `LogRetentionInDays`
- These parameters allow the template to be reused across different environments

### 2. S3 Bucket for Logs
- Creates a secure S3 bucket with appropriate access controls and encryption
- Includes a bucket policy that allows CloudWatch Logs and API Gateway to write logs to the bucket
- Configures lifecycle rules for log retention

### 3. Lambda Function
- Deploys a simple Node.js Lambda function that returns a "Hello World" message
- Creates a CloudWatch Log Group for Lambda logs with configurable retention
- Sets up a subscription filter to send Lambda logs to S3 via Kinesis Firehose

### 4. Kinesis Firehose for Log Delivery
- Creates a Kinesis Firehose delivery stream to transport logs from CloudWatch to S3
- Includes IAM roles with least privilege permissions for the log delivery process

### 5. API Gateway
- Deploys a REST API with a root method that integrates with the Lambda function
- Configures detailed access logging to CloudWatch
- Sets up a subscription filter to send API Gateway logs to S3 via Kinesis Firehose

### 6. IAM Roles and Permissions
- Creates IAM roles with least privilege permissions for each service:
  - Lambda execution role with basic execution permissions
  - CloudWatch Logs role for sending logs to Firehose
  - Firehose role for writing to S3
  - API Gateway role for CloudWatch logging

### 7. Resource Tagging
- All resources are consistently tagged with `Environment`, `ProjectName`, and `CostCenter` tags
- The `Environment` tag is explicitly set to the value from the parameter (defaulting to "Production")

### 8. Outputs
- Provides useful outputs like the API Gateway endpoint URL, Lambda function ARN, and S3 bucket name

## Best Practices Implemented

1. **Security**:
   - Least privilege IAM roles for all services
   - S3 bucket with public access blocked
   - Server-side encryption for S3 bucket

2. **Logging and Monitoring**:
   - Comprehensive logging for both API Gateway and Lambda
   - Log consolidation in S3 for long-term storage and analysis

3. **Resource Management**:
   - Consistent tagging across all resources
   - Configurable parameters for reusability

4. **Scalability**:
   - Serverless architecture that scales automatically with demand
   - No infrastructure management required

This template provides a complete solution that meets all the specified requirements while following AWS best practices for serverless applications.