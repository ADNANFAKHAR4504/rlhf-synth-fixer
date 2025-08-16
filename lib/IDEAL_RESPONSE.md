# Ideal CloudFormation SAM Template Response

## Complete Serverless Application Implementation

This ideal response provides a production-ready AWS SAM template that implements a fully functional serverless application with Lambda functions, DynamoDB tables, and API Gateway for managing items, users, and orders.

### Complete Template Code

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'Complete serverless application with Lambda functions, DynamoDB tables, and API Gateway for managing items, users, and orders'

# Global configuration to reduce redundancy across Lambda functions
Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    MemorySize: 128

Resources:
  # IAM Role for Lambda Functions
  # Single reusable role following principle of least privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      Description: 'IAM role for Lambda functions with CloudWatch Logs and DynamoDB permissions'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
        - PolicyName: DynamoDBPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Granular permissions for Items table
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Scan
                Resource: !GetAtt ItemsTable.Arn
              # Granular permissions for Users table
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Scan
                Resource: !GetAtt UsersTable.Arn
              # Granular permissions for Orders table
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Scan
                Resource: !GetAtt OrdersTable.Arn

  # DynamoDB Tables
  # Items table with on-demand billing
  ItemsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-items'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: itemId
          AttributeType: S
      KeySchema:
        - AttributeName: itemId
          KeyType: HASH
      Tags:
        - Key: Application
          Value: !Ref AWS::StackName
        - Key: Environment
          Value: !Sub '${AWS::StackName}'

  # Users table with on-demand billing
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-users'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      Tags:
        - Key: Application
          Value: !Ref AWS::StackName
        - Key: Environment
          Value: !Sub '${AWS::StackName}'

  # Orders table with on-demand billing
  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-orders'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH
      Tags:
        - Key: Application
          Value: !Ref AWS::StackName
        - Key: Environment
          Value: !Sub '${AWS::StackName}'

  # Lambda Functions
  # Items function for handling item operations
  ItemsFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-items-function'
      Description: 'Lambda function for handling items operations'
      CodeUri: ./src/items-function
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          ITEMS_TABLE_NAME: !Ref ItemsTable
      Events:
        ItemsApi:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /items
            Method: ANY
        ItemsApiWithId:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /items/{id}
            Method: ANY

  # Users function for handling user operations
  UsersFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-users-function'
      Description: 'Lambda function for handling users operations'
      CodeUri: ./src/users-function
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          USERS_TABLE_NAME: !Ref UsersTable
      Events:
        UsersApi:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /users
            Method: ANY
        UsersApiWithId:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /users/{id}
            Method: ANY

  # Orders function for handling order operations
  OrdersFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-orders-function'
      Description: 'Lambda function for handling orders operations'
      CodeUri: ./src/orders-function
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          ORDERS_TABLE_NAME: !Ref OrdersTable
      Events:
        OrdersApi:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /orders
            Method: ANY
        OrdersApiWithId:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /orders/{id}
            Method: ANY

  # API Gateway REST API
  # Single API with three endpoints for items, users, and orders
  ServerlessApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub '${AWS::StackName}-api'
      Description: 'REST API Gateway for serverless application with items, users, and orders endpoints'
      StageName: Prod
      Cors:
        AllowMethods: "'*'"
        AllowHeaders: "'*'"
        AllowOrigin: "'*'"
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

# Outputs section for easy access to deployed resources
Outputs:
  # API Gateway URL for easy access after deployment
  ApiGatewayUrl:
    Description: 'URL of the deployed API Gateway'
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/Prod'
    Export:
      Name: !Sub '${AWS::StackName}-api-url'

  # Additional outputs for reference
  ItemsTableName:
    Description: 'Name of the Items DynamoDB table'
    Value: !Ref ItemsTable
    Export:
      Name: !Sub '${AWS::StackName}-items-table'

  UsersTableName:
    Description: 'Name of the Users DynamoDB table'
    Value: !Ref UsersTable
    Export:
      Name: !Sub '${AWS::StackName}-users-table'

  OrdersTableName:
    Description: 'Name of the Orders DynamoDB table'
    Value: !Ref OrdersTable
    Export:
      Name: !Sub '${AWS::StackName}-orders-table'

  ItemsFunctionArn:
    Description: 'ARN of the Items Lambda function'
    Value: !GetAtt ItemsFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-items-function-arn'

  UsersFunctionArn:
    Description: 'ARN of the Users Lambda function'
    Value: !GetAtt UsersFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-users-function-arn'

  OrdersFunctionArn:
    Description: 'ARN of the Orders Lambda function'
    Value: !GetAtt OrdersFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-orders-function-arn'
```

### Lambda Function Implementation

Each Lambda function includes comprehensive CRUD operations with proper error handling:

```javascript
// index.js for each function (items/users/orders)
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.[ENTITY]_TABLE_NAME; // ITEMS/USERS/ORDERS
    
    if (!tableName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Table name not configured' })
        };
    }
    
    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '/[entity]';
    
    try {
        switch (method) {
            case 'GET':
                // Get by ID or list all
                if (event.pathParameters?.id) {
                    const result = await dynamodb.get({
                        TableName: tableName,
                        Key: { [entityId]: event.pathParameters.id }
                    }).promise();
                    
                    return {
                        statusCode: result.Item ? 200 : 404,
                        body: JSON.stringify(result.Item || { message: 'Not found' })
                    };
                } else {
                    const result = await dynamodb.scan({
                        TableName: tableName
                    }).promise();
                    
                    return {
                        statusCode: 200,
                        body: JSON.stringify(result.Items || [])
                    };
                }
                
            case 'POST':
                // Create new entity
                const newEntity = JSON.parse(event.body || '{}');
                newEntity.[entityId] = newEntity.[entityId] || Date.now().toString();
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: newEntity
                }).promise();
                
                return {
                    statusCode: 201,
                    body: JSON.stringify(newEntity)
                };
                
            case 'PUT':
                // Update existing entity
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'ID required for update' })
                    };
                }
                
                const updateEntity = JSON.parse(event.body || '{}');
                updateEntity.[entityId] = event.pathParameters.id;
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: updateEntity
                }).promise();
                
                return {
                    statusCode: 200,
                    body: JSON.stringify(updateEntity)
                };
                
            case 'DELETE':
                // Delete entity
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'ID required for deletion' })
                    };
                }
                
                await dynamodb.delete({
                    TableName: tableName,
                    Key: { [entityId]: event.pathParameters.id }
                }).promise();
                
                return {
                    statusCode: 204,
                    body: ''
                };
                
            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### Key Improvements in Ideal Response

1. **Complete CRUD Operations**: Added DeleteItem and Scan permissions to DynamoDB policies for full functionality
2. **Resource Tagging**: Added tags to all DynamoDB tables for better resource management
3. **API Path Parameters**: Added separate API events for paths with IDs (e.g., `/items/{id}`)
4. **Enhanced API Gateway**: Added tracing, logging, and metrics for better observability
5. **Comprehensive Error Handling**: Proper status codes and error messages for all scenarios
6. **Production-Ready Code**: Includes logging, error handling, and input validation

### Deployment Requirements

1. **AWS SAM CLI**: Required for packaging and deploying the template
2. **S3 Bucket**: For storing packaged Lambda function code
3. **IAM Permissions**: Sufficient permissions to create all resources
4. **Node.js Dependencies**: AWS SDK included in Lambda runtime

### Best Practices Implemented

- **Security**: Least privilege IAM policies with specific resource ARNs
- **Cost Optimization**: On-demand DynamoDB billing mode
- **Scalability**: Serverless architecture with automatic scaling
- **Maintainability**: Shared IAM role and global configuration
- **Observability**: CloudWatch logging and API Gateway metrics
- **Reliability**: Proper error handling and status codes