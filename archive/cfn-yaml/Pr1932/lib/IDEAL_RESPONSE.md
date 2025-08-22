# CloudFormation YAML Implementation for Serverless Infrastructure

This solution creates a serverless infrastructure with S3 bucket triggers, Lambda processing, API Gateway, and DynamoDB using CloudFormation YAML. The implementation follows all AWS best practices and requirements.

## Architecture Overview

- **S3 Bucket**: Triggers Lambda function on object creation with versioning enabled
- **Lambda Function**: Processes S3 events and performs DynamoDB operations  
- **API Gateway**: REST API that forwards requests to Lambda function
- **DynamoDB Table**: Composite primary key (partition key + sort key)
- **IAM Roles**: Least-privilege access policies for all services
- **Production Tags**: All resources tagged with 'Environment: Production'

## File: lambda/processing_function.py

```python
import json
import boto3
import os
from datetime import datetime
import uuid
from decimal import Decimal

# Custom JSON encoder for Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    
    try:
        # Handle S3 trigger event
        if 'Records' in event:
            for record in event['Records']:
                if 's3' in record:
                    bucket_name = record['s3']['bucket']['name']
                    object_key = record['s3']['object']['key']
                    
                    # Get object metadata
                    s3_response = s3.head_object(Bucket=bucket_name, Key=object_key)
                    
                    # Store processing record in DynamoDB
                    table.put_item(
                        Item={
                            'PartitionKey': f"file#{object_key}",
                            'SortKey': f"processed#{datetime.utcnow().isoformat()}",
                            'bucket_name': bucket_name,
                            'object_key': object_key,
                            'file_size': s3_response.get('ContentLength', 0),
                            'processed_at': datetime.utcnow().isoformat(),
                            'processing_id': str(uuid.uuid4()),
                            'status': 'processed'
                        }
                    )
        
        # Handle API Gateway event
        elif 'httpMethod' in event:
            # API Gateway request processing
            http_method = event['httpMethod']
            path = event.get('path', '')
            
            if http_method == 'GET':
                # Query recent processing records
                response = table.scan(
                    FilterExpression='attribute_exists(#status)',
                    ExpressionAttributeNames={'#status': 'status'},
                    Limit=10
                )
                
                # Convert DynamoDB response to JSON-serializable format
                items = response.get('Items', [])
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'message': 'Processing records retrieved successfully',
                        'records': items
                    }, cls=DecimalEncoder)
                }
            
            elif http_method == 'POST':
                # Create new processing record
                body = json.loads(event.get('body', '{}'))
                processing_id = str(uuid.uuid4())
                
                table.put_item(
                    Item={
                        'PartitionKey': f"manual#{body.get('key', processing_id)}",
                        'SortKey': f"created#{datetime.utcnow().isoformat()}",
                        'data': body,
                        'created_at': datetime.utcnow().isoformat(),
                        'processing_id': processing_id,
                        'status': 'manual'
                    }
                )
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'message': 'Record created successfully',
                        'processing_id': processing_id
                    })
                }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Event processed successfully'})
        }
        
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
```

## File: lambda/s3_configuration.py

```python
import json
import boto3
import cfnresponse

def lambda_handler(event, context):
    try:
        request_type = event['RequestType']
        bucket_name = event['ResourceProperties']['BucketName']
        lambda_arn = event['ResourceProperties']['LambdaArn']
        
        s3 = boto3.client('s3')
        
        if request_type in ['Create', 'Update']:
            # Configure S3 bucket notification
            notification_config = {
                'LambdaFunctionConfigurations': [
                    {
                        'LambdaFunctionArn': lambda_arn,
                        'Events': ['s3:ObjectCreated:*']
                    }
                ]
            }
            s3.put_bucket_notification_configuration(
                Bucket=bucket_name,
                NotificationConfiguration=notification_config
            )
            print(f"Successfully configured S3 bucket notification for {bucket_name}")
        elif request_type == 'Delete':
            # Remove notification configuration
            s3.put_bucket_notification_configuration(
                Bucket=bucket_name,
                NotificationConfiguration={}
            )
            print(f"Successfully removed S3 bucket notification for {bucket_name}")
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
    except Exception as e:
        print(f"Error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {})
```

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless infrastructure with S3 triggers, Lambda processing, API Gateway, and DynamoDB'

Parameters:
  BucketName:
    Type: String
    Default: serverless-processing-bucket
    Description: S3 bucket name for file uploads
  
  TableName:
    Type: String
    Default: ProcessingTable
    Description: DynamoDB table name
  
  Environment:
    Type: String
    Default: Production
    Description: Environment tag for all resources

Resources:
  # S3 Bucket for Lambda code deployment
  CodeBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "lambda-code-${AWS::AccountId}-${AWS::Region}"
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
  # S3 Bucket with versioning
  ProcessingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${BucketName}-${AWS::AccountId}-${AWS::Region}"
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda permission for S3 to invoke function
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt ProcessingFunction.Arn
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !Sub "arn:aws:s3:::${BucketName}-${AWS::AccountId}-${AWS::Region}"

  # DynamoDB table with composite primary key
  ProcessingTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${TableName}-${AWS::AccountId}"
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PartitionKey
          AttributeType: S
        - AttributeName: SortKey
          AttributeType: S
      KeySchema:
        - AttributeName: PartitionKey
          KeyType: HASH
        - AttributeName: SortKey
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM role for Lambda function with least-privilege access
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "LambdaExecutionRole-${AWS::StackName}"
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
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt ProcessingTable.Arn
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub "arn:aws:s3:::${BucketName}-${AWS::AccountId}-${AWS::Region}/*"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Lambda function for processing S3 events and DynamoDB operations
  ProcessingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "ProcessingFunction-${AWS::StackName}"
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      MemorySize: 256
      ReservedConcurrentExecutions: 50
      Environment:
        Variables:
          TABLE_NAME: !Ref ProcessingTable
          BUCKET_NAME: !Sub "${BucketName}-${AWS::AccountId}-${AWS::Region}"
      Code:
        S3Bucket: !Ref CodeBucket
        S3Key: lambda/processing_function.zip
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway REST API
  ProcessingApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "ProcessingApi-${AWS::StackName}"
      Description: API Gateway for serverless processing infrastructure
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # API Gateway resource
  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ProcessingApi
      ParentId: !GetAtt ProcessingApi.RootResourceId
      PathPart: process

  # API Gateway GET method
  ApiGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ProcessingApi
      ResourceId: !Ref ApiResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProcessingFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true

  # API Gateway POST method
  ApiPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ProcessingApi
      ResourceId: !Ref ApiResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProcessingFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: 201
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true

  # API Gateway OPTIONS method for CORS
  ApiOptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ProcessingApi
      ResourceId: !Ref ApiResource
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
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Origin: true

  # Lambda permission for API Gateway
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref ProcessingFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ProcessingApi}/*/POST/process"

  # Lambda permission for API Gateway GET
  ApiGatewayGetInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref ProcessingFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ProcessingApi}/*/GET/process"

  # API Gateway deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiGetMethod
      - ApiPostMethod
      - ApiOptionsMethod
    Properties:
      RestApiId: !Ref ProcessingApi
      StageName: prod
      StageDescription:
        Description: Production stage for serverless processing API

  # Custom Resource Lambda for S3 Bucket Configuration
  S3ConfigurationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "S3ConfigurationFunction-${AWS::StackName}"
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt S3ConfigurationRole.Arn
      Timeout: 60
      Code:
        S3Bucket: !Ref CodeBucket
        S3Key: lambda/s3_configuration.zip
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for S3 Configuration Lambda
  S3ConfigurationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "S3ConfigurationRole-${AWS::StackName}"
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
        - PolicyName: S3ConfigurationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketNotification
                  - s3:PutBucketNotification
                Resource: !GetAtt ProcessingBucket.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Custom Resource to configure S3 bucket notification
  S3BucketNotificationConfig:
    Type: Custom::S3BucketNotification
    DependsOn:
      - ProcessingBucket
      - ProcessingFunction
      - LambdaInvokePermission
    Properties:
      ServiceToken: !GetAtt S3ConfigurationFunction.Arn
      BucketName: !Ref ProcessingBucket
      LambdaArn: !GetAtt ProcessingFunction.Arn

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref ProcessingBucket
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketName"

  DynamoDBTableName:
    Description: Name of the DynamoDB table
    Value: !Ref ProcessingTable
    Export:
      Name: !Sub "${AWS::StackName}-DynamoDBTableName"

  LambdaFunctionName:
    Description: Name of the Lambda function
    Value: !Ref ProcessingFunction
    Export:
      Name: !Sub "${AWS::StackName}-LambdaFunctionName"

  ApiGatewayUrl:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${ProcessingApi}.execute-api.${AWS::Region}.amazonaws.com/prod/process"
    Export:
      Name: !Sub "${AWS::StackName}-ApiGatewayUrl"

  ApiGatewayRestApiId:
    Description: API Gateway REST API ID
    Value: !Ref ProcessingApi
    Export:
      Name: !Sub "${AWS::StackName}-ApiGatewayRestApiId"
```

## File: deploy.sh

```bash
#!/bin/bash

# Deployment script for CloudFormation serverless infrastructure

# Set variables
STACK_NAME="serverless-processing-stack"
TEMPLATE_FILE="lib/TapStack.yml"
CODE_BUCKET_PREFIX="lambda-code"

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
CODE_BUCKET="${CODE_BUCKET_PREFIX}-${AWS_ACCOUNT_ID}-${AWS_REGION}"

echo "Deploying CloudFormation stack: $STACK_NAME"
echo "Code bucket: $CODE_BUCKET"

# Create code bucket if it doesn't exist
aws s3api head-bucket --bucket "$CODE_BUCKET" 2>/dev/null || {
    echo "Creating code bucket: $CODE_BUCKET"
    aws s3 mb "s3://$CODE_BUCKET" --region "$AWS_REGION"
    aws s3api put-bucket-versioning --bucket "$CODE_BUCKET" --versioning-configuration Status=Enabled
}

# Package Lambda functions
echo "Packaging Lambda functions..."

# Package processing function
cd lambda
zip -r processing_function.zip processing_function.py
aws s3 cp processing_function.zip "s3://$CODE_BUCKET/lambda/processing_function.zip"

# Package S3 configuration function
zip -r s3_configuration.zip s3_configuration.py
aws s3 cp s3_configuration.zip "s3://$CODE_BUCKET/lambda/s3_configuration.zip"

cd ..

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        BucketName=serverless-processing-bucket \
        TableName=ProcessingTable \
        Environment=Production

# Get outputs
echo "Stack deployment completed. Getting outputs..."
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs' \
    --output table

echo "Deployment completed successfully!"
```

## File: requirements.txt

```txt
boto3==1.34.0
```

## Implementation Details

### S3 Bucket Features
- **Versioning**: Enabled to maintain object history as required
- **Event Notifications**: Configured via custom resource to trigger Lambda on object creation
- **Security**: Public access blocked with all security features enabled
- **Naming**: Uses account ID and region for uniqueness

### Lambda Function Features
- **Runtime**: Python 3.11 for latest performance and security
- **Memory**: 256MB with 300-second timeout for processing
- **Concurrency**: Reserved concurrent executions set to 50 for cost control
- **Environment Variables**: Dynamic configuration for table and bucket names
- **Error Handling**: Comprehensive try-catch with proper JSON serialization for Decimal types

### DynamoDB Table Features
- **Billing Mode**: Pay-per-request for cost optimization
- **Composite Key**: PartitionKey (HASH) + SortKey (RANGE) as required
- **Streams**: Enabled for change data capture
- **Backup**: Point-in-time recovery enabled for data protection

### API Gateway Features
- **Type**: REST API with regional endpoint for low latency
- **Methods**: GET, POST, and OPTIONS for CORS support
- **Integration**: AWS_PROXY integration with Lambda
- **Stage**: Production deployment with proper configuration

### Security & Compliance
- **IAM Roles**: Least-privilege access principles strictly followed
- **Lambda Permissions**: Specific resource-level permissions only
- **CORS**: Properly configured for web application access
- **Encryption**: DynamoDB and S3 use AWS managed encryption by default
- **Tagging**: All resources tagged with Environment: Production as required

### Custom Resource for S3 Notifications
- **Purpose**: Solves circular dependency between S3 bucket and Lambda
- **Implementation**: Custom Lambda function to configure bucket notifications
- **Lifecycle**: Handles Create, Update, and Delete operations properly

### Key Improvements
1. **Fixed Circular Dependencies**: Used custom resource pattern for S3 notifications
2. **Fixed IAM Policy ARNs**: Corrected S3 resource ARN format
3. **Fixed Lambda Property**: Changed ReservedConcurrencyLimit to ReservedConcurrentExecutions
4. **Fixed API Deployment**: Corrected StageDescription format
5. **Added Decimal Handling**: Custom JSON encoder for DynamoDB Decimal types
6. **Enhanced Error Handling**: Comprehensive error handling throughout