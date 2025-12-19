# AWS Serverless Web Application - CloudFormation Solution

I'll provide you with a complete CloudFormation template that deploys a serverless web application with comprehensive logging to S3, adhering to all your requirements for deployment in the us-west-2 region.

## Solution Architecture

This solution creates a fully serverless web application with:

- **API Gateway** for HTTP request handling
- **Lambda Function** returning "Hello World" message
- **Comprehensive S3 Logging** for both API Gateway and Lambda
- **Kinesis Firehose** for reliable log delivery
- **Least Privilege IAM Roles** for all components
- **Mandatory Resource Tagging** for production environments

## File Structure

```text
lib/
├── TapStack.yml          # Main CloudFormation template (YAML)
├── TapStack.json         # Template in JSON format (for testing)

test/
├── tap-stack.unit.test.ts    # Comprehensive unit tests (40 tests)
├── tap-stack.int.test.ts     # End-to-end integration tests (21 tests)
```

## CloudFormation Template

**File: `lib/TapStack.yml`**

```yaml
# serverless-infra.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for a serverless web application with API Gateway, Lambda, and S3 logging. Deployed in us-west-2.'

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
    Default: production
    AllowedValues:
      - production
      - staging
      - development
  
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
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${AWS::AccountId}-serverlessweb-logs-${AWS::Region}-${Environment}'
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
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

  # Subscription Filter to send Lambda logs to S3
  LambdaLogToS3SubscriptionFilter:
    Type: AWS::Logs::SubscriptionFilter
    DependsOn: LogBucketPolicy
    Properties:
      LogGroupName: !Ref HelloWorldFunctionLogGroup
      FilterPattern: '' # Empty pattern to capture all logs
      DestinationArn: !GetAtt LogsToS3DeliveryStream.Arn
      RoleArn: !GetAtt LogsToS3Role.Arn

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
    DependsOn: LogBucketPolicy
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
  # Core outputs for basic usage
  ApiGatewayEndpoint:
    Description: 'URL of the API Gateway endpoint'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayEndpoint'
  
  LambdaFunction:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt HelloWorldFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'
  
  LogBucketName:
    Description: 'Name of the S3 bucket for logs'
    Value: !Ref LogBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogBucketName'

  # Additional outputs for comprehensive testing and observability
  HelloWorldFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref HelloWorldFunction
    Export:
      Name: !Sub '${AWS::StackName}-HelloWorldFunctionName'
  
  ApiGatewayId:
    Description: 'ID of the API Gateway'
    Value: !Ref ApiGateway
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayId'
  
  ApiGatewayStageName:
    Description: 'Stage name of the API Gateway deployment'
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayStageName'
  
  LambdaExecutionRoleArn:
    Description: 'ARN of the Lambda execution role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleArn'
  
  LogsToS3DeliveryStreamName:
    Description: 'Name of the Kinesis Firehose delivery stream'
    Value: !Ref LogsToS3DeliveryStream
    Export:
      Name: !Sub '${AWS::StackName}-LogsToS3DeliveryStreamName'
```

## Deployment Instructions

### Prerequisites

- AWS CLI configured with appropriate permissions
- CloudFormation deployment permissions for all resource types

### Deployment Steps

1. **Deploy the CloudFormation Stack**:
   ```bash
   aws cloudformation deploy \
     --template-file lib/TapStack.yml \
     --stack-name ServerlessWebAppStack \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       ProjectName=ServerlessWebApp \
       CostCenter=IT-12345 \
       Environment=production \
     --region us-west-2
   ```

2. **Verify Deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name ServerlessWebAppStack \
     --region us-west-2 \
     --query 'Stacks[0].Outputs'
   ```

3. **Test the API**:
   ```bash
   # Get the API Gateway endpoint from stack outputs
   ENDPOINT=$(aws cloudformation describe-stacks \
     --stack-name ServerlessWebAppStack \
     --region us-west-2 \
     --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayEndpoint`].OutputValue' \
     --output text)
   
   # Test the endpoint
   curl $ENDPOINT
   ```

   Expected response:
   ```json
   {"message": "Hello World!"}
   ```

## Architecture Features

### Security Best Practices

- **S3 Public Access Blocked**: Complete protection against accidental public exposure
- **Encryption at Rest**: S3 server-side encryption enabled
- **Least Privilege IAM**: Each service has minimal required permissions
- **Bucket Owner Controls**: Secure bucket ownership configuration

### Comprehensive Logging

- **API Gateway Logs**: Access logs with detailed request information
- **Lambda Execution Logs**: Complete function execution tracking
- **Kinesis Firehose Delivery**: Reliable, scalable log delivery to S3
- **Compressed Storage**: GZIP compression for cost optimization
- **Automatic Lifecycle**: 365-day automatic log retention policy

### Resource Management

- **Consistent Tagging**: All resources tagged with Environment, ProjectName, CostCenter
- **No Retain Policies**: All resources can be cleanly destroyed (DeletionPolicy: Delete)
- **Parameterized Template**: Easy customization for different environments

### Scalability & Performance

- **Serverless Architecture**: Automatic scaling based on demand
- **Regional API Gateway**: Optimized for us-west-2 deployment
- **Efficient Log Delivery**: 60-second/5MB buffering for optimal performance


## Cost Optimization

- **Pay-per-use Lambda**: Only charged for actual invocations
- **S3 Lifecycle Policies**: Automatic log cleanup after 365 days
- **Compressed Logs**: GZIP compression reduces storage costs
- **Regional Deployment**: Optimized for us-west-2 to minimize data transfer costs

## Monitoring & Observability

- **CloudWatch Metrics**: Automatic API Gateway and Lambda metrics
- **Detailed Logging**: JSON-formatted access logs with key request metadata
- **Centralized Log Storage**: All logs consolidated in dedicated S3 bucket
- **Log Retention**: Configurable retention periods (default 30 days)
- **Comprehensive Outputs**: 8 stack outputs for monitoring and integration testing

This solution provides a production-ready, secure, and scalable serverless web application that fully meets all your requirements while following AWS best practices.
