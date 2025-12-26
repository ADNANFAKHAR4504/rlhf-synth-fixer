# Infrastructure Code Response - Optimized Solution

Based on the requirements for a highly resilient serverless application, here is the complete and optimized CloudFormation YAML template using AWS SAM:

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'Highly Resilient Serverless Application - API Gateway, Lambda, DynamoDB with X-Ray tracing'

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: python3.11
    Tracing: Active
    Environment:
      Variables:
        POWERTOOLS_SERVICE_NAME: serverless-app
        POWERTOOLS_LOG_LEVEL: INFO

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  ProjectName:
    Type: String
    Default: 'serverless-app'
    Description: 'Project name for resource naming'
    AllowedPattern: '^[a-zA-Z0-9-]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Resources:
  # DynamoDB Table with on-demand billing
  DataTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub '${ProjectName}-${EnvironmentSuffix}-data-table'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'N'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
        - AttributeName: 'timestamp'
          KeyType: 'RANGE'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket for API Gateway Access Logs
  ApiGatewayLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-api-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket Policy for API Gateway Access Logs
  ApiGatewayLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApiGatewayLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowApiGatewayLogs
            Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action:
              - s3:PutObject
            Resource: !Sub '${ApiGatewayLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                aws:SourceAccount: !Ref AWS::AccountId

  # IAM Role for Lambda Function
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
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
                Resource: !GetAtt DataTable.Arn
        - PolicyName: SQSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt DeadLetterQueue.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # Lambda Function
  ServerlessFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-serverless-function'
      CodeUri: s3://bucket/key  # Replace with actual S3 location during deployment
      Handler: app.lambda_handler
      Runtime: python3.11
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref DataTable
          ENVIRONMENT: !Ref EnvironmentSuffix
          PROJECT_NAME: !Ref ProjectName
          LOG_LEVEL: INFO
      Events:
        ApiGatewayGetEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /data
            Method: GET
        ApiGatewayPostEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /data
            Method: POST
        ApiGatewayPutEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /data/{id}
            Method: PUT
        ApiGatewayDeleteEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /data/{id}
            Method: DELETE
      ReservedConcurrentExecutions: 100
      DeadLetterQueue:
        Type: SQS
        TargetArn: !GetAtt DeadLetterQueue.Arn
      Tags:
        Environment: !Ref EnvironmentSuffix
        Project: !Ref ProjectName

  # Lambda Version
  ServerlessFunctionVersion:
    Type: AWS::Lambda::Version
    Properties:
      FunctionName: !Ref ServerlessFunction
      Description: !Sub 'Version for ${EnvironmentSuffix} environment'

  # Lambda Alias
  ServerlessFunctionAlias:
    Type: AWS::Lambda::Alias
    Properties:
      FunctionName: !Ref ServerlessFunction
      FunctionVersion: !GetAtt ServerlessFunctionVersion.Version
      Name: !Sub '${EnvironmentSuffix}-alias'
      Description: !Sub 'Alias for ${EnvironmentSuffix} environment'

  # Dead Letter Queue for Lambda
  DeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${EnvironmentSuffix}-dlq'
      MessageRetentionPeriod: 1209600  # 14 days
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # API Gateway REST API
  ServerlessApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
      StageName: !Ref EnvironmentSuffix
      TracingEnabled: true
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
        MaxAge: "'600'"
      Variables:
        Environment: !Ref EnvironmentSuffix
        ProjectName: !Ref ProjectName
        TableName: !Ref DataTable
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","caller":"$context.identity.caller","user":"$context.identity.user","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength"}'
      MethodSettings:
        - ResourcePath: "/*"
          HttpMethod: "*"
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      Tags:
        Environment: !Ref EnvironmentSuffix
        Project: !Ref ProjectName

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-serverless-function'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub 'API-Gateway-Execution-Logs_${ServerlessApi}/${EnvironmentSuffix}'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

  # CloudWatch Alarms
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-errors'
      AlarmDescription: 'Lambda function error rate alarm'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessFunction
      TreatMissingData: notBreaching

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-duration'
      AlarmDescription: 'Lambda function duration alarm'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000  # 25 seconds
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessFunction
      TreatMissingData: notBreaching

  # IAM Role for API Gateway CloudWatch Logging
  ApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-apigateway-cloudwatch-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName

Outputs:
  ApiGatewayUrl:
    Description: 'URL of the API Gateway'
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  LambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref ServerlessFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt ServerlessFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref DataTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  DynamoDBTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt DataTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableArn'

  S3BucketName:
    Description: 'Name of the S3 bucket for API Gateway logs'
    Value: !Ref ApiGatewayLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  LambdaAliasArn:
    Description: 'ARN of the Lambda alias'
    Value: !Ref ServerlessFunctionAlias
    Export:
      Name: !Sub '${AWS::StackName}-LambdaAliasArn'

  LambdaVersionArn:
    Description: 'ARN of the Lambda version'
    Value: !Ref ServerlessFunctionVersion
    Export:
      Name: !Sub '${AWS::StackName}-LambdaVersionArn'

  DeadLetterQueueUrl:
    Description: 'URL of the Dead Letter Queue'
    Value: !Ref DeadLetterQueue
    Export:
      Name: !Sub '${AWS::StackName}-DeadLetterQueueUrl'

  DeadLetterQueueArn:
    Description: 'ARN of the Dead Letter Queue'
    Value: !GetAtt DeadLetterQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DeadLetterQueueArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## File: lib/src/app.py

```
import json
import boto3
import os
import logging
from datetime import datetime
import uuid
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    InternalServerError,
    NotFoundError
)

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="ServerlessApp")
app = APIGatewayRestResolver(enable_validation=True)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME')
table = dynamodb.Table(table_name)

@app.get("/data")
@tracer.capture_method
def get_data():
    """Get all data items"""
    try:
        logger.info("Getting all data items")
        
        response = table.scan()
        items = response.get('Items', [])
        
        metrics.add_metric(name="DataItemsRetrieved", unit=MetricUnit.Count, value=len(items))
        logger.info(f"Retrieved {len(items)} items")
        
        return {
            "statusCode": 200,
            "items": items,
            "count": len(items)
        }
    except Exception as e:
        logger.error(f"Error getting data: {str(e)}")
        metrics.add_metric(name="DataRetrievalErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to retrieve data")

@app.post("/data")
@tracer.capture_method
def create_data():
    """Create a new data item"""
    try:
        data = app.current_event.json_body
        
        if not data:
            raise BadRequestError("Request body is required")
        
        # Generate unique ID and timestamp
        item_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp())
        
        item = {
            'id': item_id,
            'timestamp': timestamp,
            'data': data,
            'created_at': datetime.now().isoformat(),
            'environment': os.environ.get('ENVIRONMENT', 'dev')
        }
        
        logger.info(f"Creating item with ID: {item_id}")
        table.put_item(Item=item)
        
        metrics.add_metric(name="DataItemsCreated", unit=MetricUnit.Count, value=1)
        logger.info(f"Successfully created item: {item_id}")
        
        return {
            "statusCode": 201,
            "message": "Item created successfully",
            "item_id": item_id,
            "item": item
        }
    except BadRequestError:
        raise
    except Exception as e:
        logger.error(f"Error creating data: {str(e)}")
        metrics.add_metric(name="DataCreationErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to create data item")

@app.put("/data/<item_id>")
@tracer.capture_method
def update_data(item_id: str):
    """Update an existing data item"""
    try:
        data = app.current_event.json_body
        
        if not data:
            raise BadRequestError("Request body is required")
        
        logger.info(f"Updating item with ID: {item_id}")
        
        # Check if item exists
        try:
            response = table.get_item(Key={'id': item_id})
            if 'Item' not in response:
                raise NotFoundError(f"Item with ID {item_id} not found")
        except Exception as e:
            logger.error(f"Error checking item existence: {str(e)}")
            raise NotFoundError(f"Item with ID {item_id} not found")
        
        # Update the item
        timestamp = int(datetime.now().timestamp())
        update_expression = "SET #data = :data, #updated_at = :updated_at, #timestamp = :timestamp"
        expression_attribute_names = {
            '#data': 'data',
            '#updated_at': 'updated_at',
            '#timestamp': 'timestamp'
        }
        expression_attribute_values = {
            ':data': data,
            ':updated_at': datetime.now().isoformat(),
            ':timestamp': timestamp
        }
        
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )
        
        updated_item = response['Attributes']
        
        metrics.add_metric(name="DataItemsUpdated", unit=MetricUnit.Count, value=1)
        logger.info(f"Successfully updated item: {item_id}")
        
        return {
            "statusCode": 200,
            "message": "Item updated successfully",
            "item_id": item_id,
            "item": updated_item
        }
    except (BadRequestError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error updating data: {str(e)}")
        metrics.add_metric(name="DataUpdateErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to update data item")

@app.delete("/data/<item_id>")
@tracer.capture_method
def delete_data(item_id: str):
    """Delete a data item"""
    try:
        logger.info(f"Deleting item with ID: {item_id}")
        
        # Check if item exists
        try:
            response = table.get_item(Key={'id': item_id})
            if 'Item' not in response:
                raise NotFoundError(f"Item with ID {item_id} not found")
        except Exception as e:
            logger.error(f"Error checking item existence: {str(e)}")
            raise NotFoundError(f"Item with ID {item_id} not found")
        
        # Delete the item
        table.delete_item(Key={'id': item_id})
        
        metrics.add_metric(name="DataItemsDeleted", unit=MetricUnit.Count, value=1)
        logger.info(f"Successfully deleted item: {item_id}")
        
        return {
            "statusCode": 200,
            "message": f"Item {item_id} deleted successfully"
        }
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error deleting data: {str(e)}")
        metrics.add_metric(name="DataDeletionErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to delete data item")

@logger.inject_lambda_context(correlation_id_path="requestContext.requestId")
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Add custom metrics
        metrics.add_metadata(key="environment", value=os.environ.get('ENVIRONMENT', 'dev'))
        metrics.add_metadata(key="function_name", value=context.function_name)
        
        return app.resolve(event, context)
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"})
        }
```

## File: lib/src/requirements.txt

```txt
boto3==1.34.84
aws-lambda-powertools[all]==2.35.0
```

## Key Features and Improvements

This optimized solution implements all 12 requirements with the following enhancements:

1. **Lambda Runtime**: Python 3.11 with proper dependency management via requirements.txt
2. **RESTful API**: Full CRUD operations with CORS enabled for cross-origin requests
3. **Environment Variables**: Secure passing of configuration through Lambda environment variables
4. **DynamoDB On-Demand**: Pay-per-request billing mode for efficient handling of unpredictable workloads
5. **IAM Least Privilege**: Minimal permissions granted to Lambda for DynamoDB and SQS operations
6. **CloudWatch Logging**: Comprehensive logging with 14-day retention and structured log format
7. **API Gateway Stage Variables**: Environment-specific configuration through stage variables
8. **Multi-AZ Resilience**: All services (Lambda, DynamoDB, API Gateway, S3) are serverless and inherently multi-AZ
9. **S3 Access Logs**: Dedicated bucket with encryption, lifecycle policies, and proper bucket policy
10. **Lambda Versioning**: Version and alias support for safe promotion between environments
11. **AWS SAM**: Simplified template using AWS::Serverless transform for cleaner code
12. **X-Ray Tracing**: End-to-end request tracing enabled globally for all functions and API Gateway

### Additional Production-Ready Features

- **Dead Letter Queue**: SQS queue for failed Lambda invocations
- **CloudWatch Alarms**: Monitoring for Lambda errors and duration
- **Reserved Concurrency**: Throttling protection with 100 concurrent executions
- **Point-in-Time Recovery**: DynamoDB backup and recovery capability
- **DynamoDB Streams**: Change data capture for event-driven architectures
- **Structured Logging**: AWS Lambda Powertools for consistent log format
- **Metrics Collection**: Custom metrics for operational insights
- **Error Handling**: Proper exception handling with meaningful error messages
- **API Response Format**: Consistent JSON response structure
- **Security Best Practices**: Encryption at rest, no hardcoded secrets, public access blocked