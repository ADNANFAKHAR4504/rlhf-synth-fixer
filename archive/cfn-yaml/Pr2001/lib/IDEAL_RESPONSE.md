# CloudFormation Template for Serverless Infrastructure

This CloudFormation template creates a complete serverless architecture with API Gateway, Lambda function, S3 bucket, and proper IAM roles following AWS best practices and security guidelines.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless infrastructure with API Gateway, Lambda, and S3'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for unique resource naming

Resources:
  # S3 Bucket for data storage
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tapstack-${EnvironmentSuffix}-data-bucket-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

  # IAM Role for Lambda function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-lambda-execution-role'
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
                Resource: !Sub '${DataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt DataBucket.Arn

  # Lambda function
  ProcessingLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${EnvironmentSuffix}-processing-function'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import datetime
          from botocore.exceptions import ClientError
          
          s3_client = boto3.client('s3')
          
          def lambda_handler(event, context):
              try:
                  # Get bucket name from environment
                  import os
                  bucket_name = os.environ.get('BUCKET_NAME', 'default-bucket')
                  
                  # Process the incoming request
                  body = json.loads(event.get('body', '{}')) if event.get('body') else {}
                  
                  # Create a timestamp for the file
                  timestamp = datetime.datetime.now().isoformat()
                  
                  # Prepare data to store
                  processed_data = {
                      'timestamp': timestamp,
                      'input_data': body,
                      'processed_by': 'serverless-lambda',
                      'request_id': context.aws_request_id
                  }
                  
                  # Store data in S3
                  object_key = f'processed-data/{timestamp}-{context.aws_request_id}.json'
                  
                  s3_client.put_object(
                      Bucket=bucket_name,
                      Key=object_key,
                      Body=json.dumps(processed_data, indent=2),
                      ContentType='application/json'
                  )
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          's3_location': f's3://{bucket_name}/{object_key}',
                          'timestamp': timestamp
                      })
                  }
                  
              except ClientError as e:
                  print(f"S3 Error: {e}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Failed to process data',
                          'message': str(e)
                      })
                  }
              except Exception as e:
                  print(f"General Error: {e}")
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
      Environment:
        Variables:
          BUCKET_NAME: !Ref DataBucket
      Timeout: 30
      MemorySize: 128

  # Lambda permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProcessingLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/*'

  # API Gateway HTTP API
  ServerlessApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-serverless-api'
      Description: HTTP API for serverless processing
      ProtocolType: HTTP
      CorsConfiguration:
        AllowOrigins:
          - '*'
        AllowMethods:
          - GET
          - POST
          - OPTIONS
        AllowHeaders:
          - Content-Type
          - Authorization

  # API Gateway Integration
  LambdaIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref ServerlessApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProcessingLambda.Arn}/invocations'
      PayloadFormatVersion: '2.0'

  # API Gateway Route
  ProcessRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref ServerlessApi
      RouteKey: 'POST /process'
      Target: !Sub 'integrations/${LambdaIntegration}'

  # API Gateway Stage
  ApiStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref ServerlessApi
      StageName: prod
      Description: Production stage
      AutoDeploy: true

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-api-endpoint'

  S3BucketName:
    Description: Name of the S3 bucket for data storage
    Value: !Ref DataBucket
    Export:
      Name: !Sub '${AWS::StackName}-s3-bucket'

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt ProcessingLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-arn'

  LambdaFunctionName:
    Description: Name of the Lambda function
    Value: !Ref ProcessingLambda
    Export:
      Name: !Sub '${AWS::StackName}-lambda-name'
```

## Key Features

### Security Best Practices
- **S3 Bucket Security**: All public access is blocked, versioning enabled, and AES256 encryption at rest
- **IAM Least Privilege**: Lambda role has only the minimum permissions needed to operate
- **Network Security**: API Gateway handles external access with proper CORS configuration

### Operational Excellence
- **Resource Naming**: All resources use environment suffix for unique identification
- **CloudFormation Exports**: All outputs are exported for cross-stack references
- **Error Handling**: Comprehensive error handling in Lambda function
- **Monitoring**: CloudWatch Logs automatically enabled through Lambda execution role

### Scalability & Performance
- **Serverless Architecture**: Automatically scales based on demand
- **Optimized Memory**: Lambda configured with appropriate memory (128MB)
- **Timeout Configuration**: 30-second timeout for processing operations

### Cost Optimization
- **Pay-per-use Model**: Only charged for actual usage
- **Minimal Resource Allocation**: Right-sized Lambda memory and timeout
- **S3 Standard Storage**: Appropriate for frequently accessed data

## Deployment Instructions

1. **Deploy the stack**:
```bash
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

2. **Test the API endpoint**:
```bash
# Get the API endpoint from stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Send a test request
curl -X POST ${API_ENDPOINT}/process \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "message": "Hello Serverless"}'
```

3. **Verify S3 storage**:
```bash
# Get bucket name from stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text)

# List processed files
aws s3 ls s3://${BUCKET_NAME}/processed-data/
```

## Clean Up

To destroy all resources:
```bash
# Empty the S3 bucket first
aws s3 rm s3://${BUCKET_NAME} --recursive

# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name TapStack${ENVIRONMENT_SUFFIX}
```

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌────────────┐
│   Client    │─────▶│ API Gateway  │─────▶│   Lambda    │─────▶│  S3 Bucket │
└─────────────┘      └──────────────┘      └─────────────┘      └────────────┘
                           HTTP                   Invoke              Store
                         Endpoint                Function             Data
```

The architecture provides a simple yet powerful serverless data processing pipeline that accepts HTTP requests, processes them through Lambda, and stores results in S3.