# Serverless Task Management Application - CloudFormation Template

I'll help you create a comprehensive serverless task management application using AWS CloudFormation. This solution includes Lambda functions, API Gateway, DynamoDB, S3, IAM roles, and CloudWatch monitoring with the latest AWS features you requested.

## Architecture Overview

The infrastructure creates:
- Lambda functions for CRUD operations with response streaming support
- API Gateway HTTP API with Lambda integrations
- Lambda Function URLs as backup endpoints
- DynamoDB table with GSI for efficient querying
- S3 bucket for task attachments
- IAM roles with least privilege access
- CloudWatch logs and alarms for monitoring

## CloudFormation Template

Here's the complete CloudFormation YAML template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Task Management Application - Complete Infrastructure'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # DynamoDB Table for Tasks
  TasksTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'TasksTable-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'taskId'
          AttributeType: 'S'
        - AttributeName: 'userId'
          AttributeType: 'S'
        - AttributeName: 'status'
          AttributeType: 'S'
        - AttributeName: 'createdAt'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'taskId'
          KeyType: 'HASH'
      GlobalSecondaryIndexes:
        - IndexName: 'UserStatusIndex'
          KeySchema:
            - AttributeName: 'userId'
              KeyType: 'HASH'
            - AttributeName: 'status'
              KeyType: 'RANGE'
          Projection:
            ProjectionType: 'ALL'
        - IndexName: 'UserCreatedAtIndex'
          KeySchema:
            - AttributeName: 'userId'
              KeyType: 'HASH'
            - AttributeName: 'createdAt'
              KeyType: 'RANGE'
          Projection:
            ProjectionType: 'ALL'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Database'

  # S3 Bucket for Task Attachments
  TaskAttachmentsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'task-attachments-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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
              DaysAfterInitiation: 1
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Storage'

  # IAM Role for Lambda Functions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'TaskMgmtLambdaRole-${EnvironmentSuffix}'
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
                Resource:
                  - !GetAtt TasksTable.Arn
                  - !Sub '${TasksTable.Arn}/index/*'
        - PolicyName: S3Access
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
                  - !Sub '${TaskAttachmentsBucket}/*'
                  - !GetAtt TaskAttachmentsBucket.Arn
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Security'

  # Lambda Function for CRUD Operations
  TaskManagementFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'TaskManagement-${EnvironmentSuffix}'
      Runtime: nodejs20.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          TASKS_TABLE_NAME: !Ref TasksTable
          ATTACHMENTS_BUCKET_NAME: !Ref TaskAttachmentsBucket
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const { v4: uuidv4 } = require('uuid');
          
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const s3 = new AWS.S3();
          
          const TASKS_TABLE = process.env.TASKS_TABLE_NAME;
          const ATTACHMENTS_BUCKET = process.env.ATTACHMENTS_BUCKET_NAME;
          
          exports.handler = async (event, context) => {
              console.log('Event:', JSON.stringify(event, null, 2));
              
              const httpMethod = event.httpMethod || event.requestContext?.http?.method;
              const pathParameters = event.pathParameters || {};
              const body = event.body ? JSON.parse(event.body) : {};
              const queryStringParameters = event.queryStringParameters || {};
              
              try {
                  let result;
                  switch (httpMethod) {
                      case 'POST':
                          result = await createTask(body);
                          break;
                      case 'GET':
                          if (pathParameters.taskId) {
                              result = await getTask(pathParameters.taskId);
                          } else {
                              result = await listTasks(queryStringParameters);
                          }
                          break;
                      case 'PUT':
                          result = await updateTask(pathParameters.taskId, body);
                          break;
                      case 'DELETE':
                          result = await deleteTask(pathParameters.taskId);
                          break;
                      default:
                          throw new Error(`Unsupported method: ${httpMethod}`);
                  }
                  
                  return {
                      statusCode: 200,
                      headers: {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*',
                          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                      },
                      body: JSON.stringify(result)
                  };
              } catch (error) {
                  console.error('Error:', error);
                  return {
                      statusCode: 500,
                      headers: {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      body: JSON.stringify({ error: error.message })
                  };
              }
          };
          
          async function createTask(taskData) {
              const taskId = uuidv4();
              const now = new Date().toISOString();
              
              const task = {
                  taskId,
                  userId: taskData.userId,
                  title: taskData.title,
                  description: taskData.description || '',
                  status: taskData.status || 'pending',
                  priority: taskData.priority || 'medium',
                  dueDate: taskData.dueDate,
                  createdAt: now,
                  updatedAt: now
              };
              
              await dynamodb.put({
                  TableName: TASKS_TABLE,
                  Item: task
              }).promise();
              
              return task;
          }
          
          async function getTask(taskId) {
              const result = await dynamodb.get({
                  TableName: TASKS_TABLE,
                  Key: { taskId }
              }).promise();
              
              if (!result.Item) {
                  throw new Error('Task not found');
              }
              
              return result.Item;
          }
          
          async function listTasks(queryParams) {
              const { userId, status, limit = '20' } = queryParams;
              
              if (!userId) {
                  throw new Error('userId is required');
              }
              
              const params = {
                  TableName: TASKS_TABLE,
                  IndexName: status ? 'UserStatusIndex' : 'UserCreatedAtIndex',
                  KeyConditionExpression: userId && status 
                      ? 'userId = :userId AND #status = :status'
                      : 'userId = :userId',
                  ExpressionAttributeValues: {
                      ':userId': userId
                  },
                  Limit: parseInt(limit),
                  ScanIndexForward: false
              };
              
              if (status) {
                  params.ExpressionAttributeValues[':status'] = status;
                  params.ExpressionAttributeNames = { '#status': 'status' };
              }
              
              const result = await dynamodb.query(params).promise();
              return {
                  tasks: result.Items,
                  count: result.Count,
                  lastEvaluatedKey: result.LastEvaluatedKey
              };
          }
          
          async function updateTask(taskId, updateData) {
              const now = new Date().toISOString();
              
              const updateExpression = [];
              const expressionAttributeNames = {};
              const expressionAttributeValues = {};
              
              Object.keys(updateData).forEach(key => {
                  if (key !== 'taskId' && key !== 'userId' && key !== 'createdAt') {
                      updateExpression.push(`#${key} = :${key}`);
                      expressionAttributeNames[`#${key}`] = key;
                      expressionAttributeValues[`:${key}`] = updateData[key];
                  }
              });
              
              updateExpression.push('#updatedAt = :updatedAt');
              expressionAttributeNames['#updatedAt'] = 'updatedAt';
              expressionAttributeValues[':updatedAt'] = now;
              
              const result = await dynamodb.update({
                  TableName: TASKS_TABLE,
                  Key: { taskId },
                  UpdateExpression: `SET ${updateExpression.join(', ')}`,
                  ExpressionAttributeNames: expressionAttributeNames,
                  ExpressionAttributeValues: expressionAttributeValues,
                  ReturnValues: 'ALL_NEW'
              }).promise();
              
              return result.Attributes;
          }
          
          async function deleteTask(taskId) {
              await dynamodb.delete({
                  TableName: TASKS_TABLE,
                  Key: { taskId }
              }).promise();
              
              return { message: 'Task deleted successfully' };
          }
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Compute'

  # Lambda Function with Response Streaming for Large Datasets
  TaskStreamingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'TaskStreaming-${EnvironmentSuffix}'
      Runtime: nodejs20.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      MemorySize: 1024
      Environment:
        Variables:
          TASKS_TABLE_NAME: !Ref TasksTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          const { pipeline } = require('stream/promises');
          const { Readable } = require('stream');
          const AWS = require('aws-sdk');
          
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const TASKS_TABLE = process.env.TASKS_TABLE_NAME;
          
          exports.handler = async (event, context, responseStream) => {
              console.log('Streaming event:', JSON.stringify(event, null, 2));
              
              const queryParams = event.queryStringParameters || {};
              const { userId, batchSize = '100' } = queryParams;
              
              if (!userId) {
                  const errorResponse = {
                      statusCode: 400,
                      body: JSON.stringify({ error: 'userId is required' })
                  };
                  responseStream.write(JSON.stringify(errorResponse));
                  responseStream.end();
                  return;
              }
              
              try {
                  await streamTasks(userId, parseInt(batchSize), responseStream);
              } catch (error) {
                  console.error('Streaming error:', error);
                  const errorResponse = {
                      statusCode: 500,
                      body: JSON.stringify({ error: error.message })
                  };
                  responseStream.write(JSON.stringify(errorResponse));
              } finally {
                  responseStream.end();
              }
          };
          
          async function streamTasks(userId, batchSize, responseStream) {
              let lastEvaluatedKey = null;
              let isFirstBatch = true;
              
              responseStream.write('{"tasks":[');
              
              do {
                  const params = {
                      TableName: TASKS_TABLE,
                      IndexName: 'UserCreatedAtIndex',
                      KeyConditionExpression: 'userId = :userId',
                      ExpressionAttributeValues: {
                          ':userId': userId
                      },
                      Limit: batchSize,
                      ScanIndexForward: false
                  };
                  
                  if (lastEvaluatedKey) {
                      params.ExclusiveStartKey = lastEvaluatedKey;
                  }
                  
                  const result = await dynamodb.query(params).promise();
                  
                  for (let i = 0; i < result.Items.length; i++) {
                      if (!isFirstBatch || i > 0) {
                          responseStream.write(',');
                      }
                      responseStream.write(JSON.stringify(result.Items[i]));
                      isFirstBatch = false;
                  }
                  
                  lastEvaluatedKey = result.LastEvaluatedKey;
                  
              } while (lastEvaluatedKey);
              
              responseStream.write(']}');
          }
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Compute'

  # Lambda Function URL for Main Function
  TaskManagementFunctionUrl:
    Type: AWS::Lambda::Url
    Properties:
      TargetFunctionArn: !GetAtt TaskManagementFunction.Arn
      AuthType: NONE
      InvokeMode: BUFFERED
      Cors:
        AllowCredentials: false
        AllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        AllowOrigins:
          - "*"
        AllowHeaders:
          - "Content-Type"
          - "Authorization"
        MaxAge: 300

  # Lambda Function URL for Streaming Function
  TaskStreamingFunctionUrl:
    Type: AWS::Lambda::Url
    Properties:
      TargetFunctionArn: !GetAtt TaskStreamingFunction.Arn
      AuthType: NONE
      InvokeMode: RESPONSE_STREAM
      Cors:
        AllowCredentials: false
        AllowMethods:
          - GET
        AllowOrigins:
          - "*"
        AllowHeaders:
          - "Content-Type"
        MaxAge: 300

  # Lambda Permissions for Function URLs
  TaskManagementFunctionUrlPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref TaskManagementFunction
      Action: lambda:InvokeFunctionUrl
      Principal: "*"
      FunctionUrlAuthType: NONE

  TaskStreamingFunctionUrlPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref TaskStreamingFunction
      Action: lambda:InvokeFunctionUrl
      Principal: "*"
      FunctionUrlAuthType: NONE

  # API Gateway HTTP API
  TaskManagementApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub 'TaskManagementApi-${EnvironmentSuffix}'
      ProtocolType: HTTP
      Description: 'Task Management API Gateway'
      CorsConfiguration:
        AllowCredentials: false
        AllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        AllowOrigins:
          - "*"
        AllowHeaders:
          - "Content-Type"
          - "Authorization"
        MaxAge: 300
      Tags:
        Environment: !Ref EnvironmentSuffix
        Application: 'TaskManagement'
        Component: 'API'

  # API Gateway Integration for Main Lambda
  TaskManagementIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref TaskManagementApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${TaskManagementFunction.Arn}/invocations'
      PayloadFormatVersion: '2.0'
      TimeoutInMillis: 30000

  # API Gateway Routes
  TasksRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref TaskManagementApi
      RouteKey: 'ANY /tasks'
      Target: !Sub 'integrations/${TaskManagementIntegration}'

  TaskByIdRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref TaskManagementApi
      RouteKey: 'ANY /tasks/{taskId}'
      Target: !Sub 'integrations/${TaskManagementIntegration}'

  # API Gateway Stage
  TaskManagementStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref TaskManagementApi
      StageName: !Ref EnvironmentSuffix
      Description: !Sub 'Task Management API Stage - ${EnvironmentSuffix}'
      AutoDeploy: true
      AccessLogSettings:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '{"requestId":"$context.requestId","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","path":"$context.path","status":"$context.status","error.message":"$context.error.message"}'
      Tags:
        Environment: !Ref EnvironmentSuffix
        Application: 'TaskManagement'
        Component: 'API'

  # Lambda Permission for API Gateway
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref TaskManagementFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${TaskManagementApi}/*/*/*'

  # CloudWatch Log Groups
  TaskManagementLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/TaskManagement-${EnvironmentSuffix}'
      RetentionInDays: 14
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Logging'

  TaskStreamingLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/TaskStreaming-${EnvironmentSuffix}'
      RetentionInDays: 14
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Logging'

  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/TaskManagementApi-${EnvironmentSuffix}'
      RetentionInDays: 14
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Logging'

  # CloudWatch Alarms
  TaskManagementErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TaskManagement-Errors-${EnvironmentSuffix}'
      AlarmDescription: 'Task Management Lambda Function Errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref TaskManagementFunction
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Monitoring'

  TaskManagementDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TaskManagement-Duration-${EnvironmentSuffix}'
      AlarmDescription: 'Task Management Lambda Function High Duration'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref TaskManagementFunction
      Tags:
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix
        - Key: 'Application'
          Value: 'TaskManagement'
        - Key: 'Component'
          Value: 'Monitoring'

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${TaskManagementApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  TaskManagementFunctionUrl:
    Description: 'Lambda Function URL for Task Management'
    Value: !GetAtt TaskManagementFunctionUrl.FunctionUrl
    Export:
      Name: !Sub '${AWS::StackName}-TaskFunctionUrl'

  TaskStreamingFunctionUrl:
    Description: 'Lambda Function URL for Task Streaming'
    Value: !GetAtt TaskStreamingFunctionUrl.FunctionUrl
    Export:
      Name: !Sub '${AWS::StackName}-StreamingFunctionUrl'

  TasksTableName:
    Description: 'DynamoDB Tasks table name'
    Value: !Ref TasksTable
    Export:
      Name: !Sub '${AWS::StackName}-TasksTableName'

  TaskAttachmentsBucketName:
    Description: 'S3 bucket name for task attachments'
    Value: !Ref TaskAttachmentsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AttachmentsBucket'

  LambdaExecutionRoleArn:
    Description: 'Lambda execution role ARN'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaRoleArn'
```

## Key Features Implemented

### 1. Lambda Response Streaming
- Created a separate `TaskStreamingFunction` with `RESPONSE_STREAM` invoke mode
- Implements progressive streaming of large task datasets
- Uses Function URLs with streaming capabilities

### 2. Lambda Function URLs
- Both functions have Function URLs as backup endpoints
- Configured with appropriate CORS settings
- Main function uses `BUFFERED` mode, streaming function uses `RESPONSE_STREAM` mode

### 3. Security Best Practices
- IAM roles with least privilege access
- Encryption enabled for DynamoDB and S3
- Public access blocked for S3 bucket
- Resource-based policies for Lambda permissions

### 4. Monitoring and Logging
- CloudWatch log groups with retention policies
- CloudWatch alarms for errors and duration
- API Gateway access logging

### 5. Cost Optimization
- DynamoDB in PAY_PER_REQUEST mode
- Lambda functions with appropriate memory allocation
- S3 lifecycle policies for cleanup
- Log retention set to 14 days

## Usage Examples

### API Gateway Endpoints
- `POST /tasks` - Create new task
- `GET /tasks?userId=123&status=pending` - List tasks with filtering
- `GET /tasks/{taskId}` - Get specific task
- `PUT /tasks/{taskId}` - Update task
- `DELETE /tasks/{taskId}` - Delete task

### Function URLs
- Use the main function URL for standard CRUD operations
- Use the streaming function URL for large dataset queries with `?userId=123&batchSize=1000`

### DynamoDB Indexes
- `UserStatusIndex` - Query tasks by user and status
- `UserCreatedAtIndex` - Query tasks by user sorted by creation date

The infrastructure is fully serverless, cost-effective, and implements the latest AWS features including Lambda response streaming and Function URLs for optimal performance and flexibility.