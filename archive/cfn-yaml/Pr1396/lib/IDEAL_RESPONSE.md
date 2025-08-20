# AWS SAM Serverless Application Template

## Overview

This document describes the implementation of a comprehensive AWS SAM (Serverless Application Model) template that creates a serverless application with three Lambda functions, three DynamoDB tables, and API Gateway endpoints. The template is designed to be deployed using the `sam deploy` command and follows AWS best practices for serverless architecture.

## Architecture

The serverless application consists of the following AWS resources:

- **3 Lambda Functions** (Items, Users, Orders) with Node.js 20.x runtime
- **3 DynamoDB Tables** with on-demand capacity (PAY_PER_REQUEST)
- **1 API Gateway REST API** with three endpoints (/items, /users, /orders)
- **IAM Policies** using SAM's built-in DynamoDBCrudPolicy for least privilege access
- **Environment Variables** for table name references
- **CORS Configuration** for cross-origin requests

## Template Structure

### Template Headers

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'AWS SAM template for a serverless application with three Lambda functions (items, users, orders), DynamoDB tables, and API Gateway endpoints'
```

### Global Configuration

```yaml
Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    MemorySize: 128
    Environment:
      Variables:
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: 1
```

The Globals section establishes common properties for all Lambda functions, including the Node.js 20.x runtime, 30-second timeout, and connection reuse optimization.

### Parameters

```yaml
Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'
```

The EnvironmentSuffix parameter enables multi-environment deployments by allowing resource name differentiation across environments (dev, test, prod).

## Resources

### DynamoDB Tables

Three DynamoDB tables are created with identical configuration patterns:

#### Items Table

- **Primary Key**: itemId (String)
- **Billing Mode**: PAY_PER_REQUEST for automatic scaling
- **Table Name**: `${AWS::StackName}-items-table-${EnvironmentSuffix}`

#### Users Table

- **Primary Key**: userId (String)
- **Billing Mode**: PAY_PER_REQUEST for automatic scaling
- **Table Name**: `${AWS::StackName}-users-table-${EnvironmentSuffix}`

#### Orders Table

- **Primary Key**: orderId (String)
- **Billing Mode**: PAY_PER_REQUEST for automatic scaling
- **Table Name**: `${AWS::StackName}-orders-table-${EnvironmentSuffix}`

### Lambda Functions

All three Lambda functions follow a consistent pattern using AWS SAM's `AWS::Serverless::Function` resource type.

#### Common Features

- **Runtime**: nodejs20.x (inherited from Globals)
- **Handler**: index.handler
- **Inline Code**: Complete Node.js implementation included
- **Environment Variables**: Table name passed via environment variable
- **Policies**: DynamoDBCrudPolicy scoped to specific table
- **Events**: API Gateway integration with ANY method

#### Items Function

```yaml
ItemsFunction:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: !Sub '${AWS::StackName}-items-function-${EnvironmentSuffix}'
    Handler: index.handler
    Environment:
      Variables:
        ITEMS_TABLE_NAME: !Ref ItemsTable
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref ItemsTable
    Events:
      ItemsApi:
        Type: Api
        Properties:
          Path: /items
          Method: ANY
```

**Functionality**:

- Handles POST requests to create new items
- Handles GET requests with itemId query parameter to retrieve items
- Returns appropriate HTTP status codes (200, 201, 400, 404, 405, 500)
- Includes CORS headers for cross-origin requests

#### Users Function

Similar structure to ItemsFunction but handles user-related operations:

- POST: Create new users
- GET: Retrieve users by userId query parameter
- Environment variable: USERS_TABLE_NAME
- API endpoint: /users

#### Orders Function

Enhanced functionality compared to Items and Users functions:

- POST: Create new orders with auto-generated orderId and timestamps
- GET: Retrieve orders by orderId query parameter
- Automatic status assignment (defaults to 'PENDING')
- Enhanced response includes orderId and status
- Environment variable: ORDERS_TABLE_NAME
- API endpoint: /orders

## Lambda Function Implementation

### Dependencies

All functions use the AWS SDK v3 for DynamoDB operations:

```javascript
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
```

### HTTP Method Handling

Each function implements a switch statement to handle different HTTP methods:

- **POST**: Creates new records in DynamoDB
- **GET**: Retrieves records by ID from query parameters
- **Default**: Returns 405 Method Not Allowed

### Error Handling

Comprehensive error handling includes:

- 400 Bad Request for missing required parameters
- 404 Not Found for non-existent resources
- 405 Method Not Allowed for unsupported HTTP methods
- 500 Internal Server Error for unexpected failures

### CORS Configuration

All functions include CORS headers:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

## API Gateway Integration

SAM automatically creates an API Gateway REST API (`ServerlessRestApi`) through the Events configuration in each Lambda function. The API includes:

- **Base URL**: `https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod`
- **Endpoints**:
  - `/items` - Routes to ItemsFunction
  - `/users` - Routes to UsersFunction
  - `/orders` - Routes to OrdersFunction
- **Method**: ANY (supports all HTTP methods)
- **Stage**: Prod (default SAM stage)

## Security and IAM

### DynamoDB Permissions

Each Lambda function uses SAM's built-in `DynamoDBCrudPolicy` which provides:

- dynamodb:GetItem
- dynamodb:PutItem
- dynamodb:UpdateItem
- dynamodb:DeleteItem
- dynamodb:Query
- dynamodb:Scan

Permissions are scoped to the specific table for each function, following the principle of least privilege.

### CloudWatch Logs

Lambda functions automatically receive CloudWatch Logs permissions for:

- logs:CreateLogGroup
- logs:CreateLogStream
- logs:PutLogEvents

## Outputs

The template provides comprehensive outputs for integration and monitoring:

### API Gateway URL

```yaml
ApiGatewayUrl:
  Description: 'URL of the deployed API Gateway'
  Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod'
  Export:
    Name: !Sub '${AWS::StackName}-api-url-${EnvironmentSuffix}'
```

### Table Names

Each DynamoDB table name is exported:

- ItemsTableName
- UsersTableName
- OrdersTableName

### Function ARNs

Lambda function ARNs are provided for reference:

- ItemsFunctionArn
- UsersFunctionArn
- OrdersFunctionArn

## Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- SAM CLI installed
- Node.js runtime available in target region

### Deployment Command

```bash
sam deploy --guided
```

For subsequent deployments:

```bash
sam deploy
```

### Parameters

During guided deployment, you can specify:

- **Stack Name**: Choose a descriptive name for your stack
- **AWS Region**: Target deployment region (defaults to us-east-1)
- **EnvironmentSuffix**: Environment identifier for resource naming

## Testing the API

### Create an Item

```bash
curl -X POST https://{api-gateway-url}/items \
  -H "Content-Type: application/json" \
  -d '{"itemId": "item-001", "name": "Test Item", "price": 29.99}'
```

### Retrieve an Item

```bash
curl "https://{api-gateway-url}/items?itemId=item-001"
```

### Create a User

```bash
curl -X POST https://{api-gateway-url}/users \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "name": "John Doe", "email": "john@example.com"}'
```

### Retrieve a User

```bash
curl "https://{api-gateway-url}/users?userId=user-001"
```

### Create an Order

```bash
curl -X POST https://{api-gateway-url}/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "items": ["item-001"], "total": 29.99}'
```

### Retrieve an Order

```bash
curl "https://{api-gateway-url}/orders?orderId=order-{timestamp}-{random}"
```

## Advanced Features

### Environment Suffix Usage

The EnvironmentSuffix parameter enables multiple deployments of the same template:

- **Development**: `EnvironmentSuffix=dev`
- **Testing**: `EnvironmentSuffix=test`
- **Production**: `EnvironmentSuffix=prod`

Each deployment creates isolated resources with unique names.

### Monitoring and Logging

All Lambda functions automatically log to CloudWatch with log groups:

- `/aws/lambda/${AWS::StackName}-items-function-${EnvironmentSuffix}`
- `/aws/lambda/${AWS::StackName}-users-function-${EnvironmentSuffix}`
- `/aws/lambda/${AWS::StackName}-orders-function-${EnvironmentSuffix}`

### Scaling

- **DynamoDB**: Automatic scaling with PAY_PER_REQUEST billing
- **Lambda**: Automatic concurrency scaling up to account limits
- **API Gateway**: Handles up to 10,000 requests per second by default

## Best Practices Implemented

1. **Infrastructure as Code**: Complete infrastructure defined in SAM template
2. **Least Privilege**: Granular IAM permissions per function
3. **Environment Isolation**: Parameterized resource naming
4. **Error Handling**: Comprehensive error responses
5. **Logging**: Structured logging for debugging
6. **CORS Support**: Cross-origin request handling
7. **Resource Naming**: Consistent and logical naming conventions
8. **Documentation**: Comprehensive resource descriptions

## Cost Optimization

- **On-Demand DynamoDB**: Pay only for actual usage
- **Lambda**: Pay per invocation and duration
- **API Gateway**: Pay per API call
- **CloudWatch Logs**: Retention can be configured to control costs

## Cleanup

To remove all resources:

```bash
sam delete
```

This command removes the entire CloudFormation stack and all associated AWS resources.
