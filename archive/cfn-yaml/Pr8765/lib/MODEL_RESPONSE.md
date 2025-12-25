# AWS SAM Serverless Application Infrastructure

## Overview

This solution provides a complete serverless application infrastructure using AWS SAM (Serverless Application Model). The template creates a REST API with three Lambda functions for managing items, users, and orders, each backed by dedicated DynamoDB tables with on-demand scaling.

## Architecture Components

### Core Resources

1. **Three Lambda Functions**:
   - Items Function: Handles CRUD operations for items catalog
   - Users Function: Manages user registration and retrieval
   - Orders Function: Processes order creation and queries with enhanced features

2. **Three DynamoDB Tables**:
   - Items Table: Stores product catalog with itemId as primary key
   - Users Table: Stores user accounts with userId as primary key
   - Orders Table: Stores order records with orderId as primary key

3. **API Gateway**: Single REST API with three resource endpoints (/items, /users, /orders)

4. **IAM Policies**: SAM built-in DynamoDBCrudPolicy for least privilege access per function

## Template Structure

### TapStack.json - SAM Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Transform": "AWS::Serverless-2016-10-31",
  "Description": "AWS SAM template for a serverless application with three Lambda functions (items, users, orders), DynamoDB tables, and API Gateway endpoints",
  "Globals": {
    "Function": {
      "Runtime": "nodejs20.x",
      "Timeout": 30,
      "MemorySize": 128,
      "Environment": {
        "Variables": {
          "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1"
        }
      }
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming"
    }
  },
  "Resources": {
    "ItemsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-items-table-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "itemId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "itemId",
            "KeyType": "HASH"
          }
        ]
      }
    },
    "UsersTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-users-table-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "userId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "userId",
            "KeyType": "HASH"
          }
        ]
      }
    },
    "OrdersTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-orders-table-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "orderId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "orderId",
            "KeyType": "HASH"
          }
        ]
      }
    },
    "ItemsFunction": {
      "Type": "AWS::Serverless::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-items-function-${EnvironmentSuffix}"
        },
        "Handler": "index.handler",
        "InlineCode": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n  const itemsTableName = process.env.ITEMS_TABLE_NAME;\n  \n  const headers = {\n    'Content-Type': 'application/json',\n    'Access-Control-Allow-Origin': '*',\n    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',\n    'Access-Control-Allow-Headers': 'Content-Type'\n  };\n  \n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const item = JSON.parse(event.body);\n        const putParams = {\n          TableName: itemsTableName,\n          Item: marshall(item)\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          headers,\n          body: JSON.stringify({ message: 'Item created successfully' })\n        };\n      \n      case 'GET':\n        const itemId = event.queryStringParameters?.itemId;\n        if (!itemId) {\n          return {\n            statusCode: 400,\n            headers,\n            body: JSON.stringify({ message: 'Missing itemId query parameter' })\n          };\n        }\n        const getParams = {\n          TableName: itemsTableName,\n          Key: marshall({ itemId })\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            headers,\n            body: JSON.stringify({ message: 'Item not found' })\n          };\n        }\n        return {\n          statusCode: 200,\n          headers,\n          body: JSON.stringify(unmarshall(Item))\n        };\n      \n      default:\n        return {\n          statusCode: 405,\n          headers,\n          body: JSON.stringify({ message: 'Method Not Allowed' })\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      headers,\n      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })\n    };\n  }\n};",
        "Environment": {
          "Variables": {
            "ITEMS_TABLE_NAME": {
              "Ref": "ItemsTable"
            }
          }
        },
        "Policies": [
          {
            "DynamoDBCrudPolicy": {
              "TableName": {
                "Ref": "ItemsTable"
              }
            }
          }
        ],
        "Events": {
          "ItemsApi": {
            "Type": "Api",
            "Properties": {
              "Path": "/items",
              "Method": "ANY"
            }
          }
        }
      }
    },
    "UsersFunction": {
      "Type": "AWS::Serverless::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-users-function-${EnvironmentSuffix}"
        },
        "Handler": "index.handler",
        "InlineCode": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n  const usersTableName = process.env.USERS_TABLE_NAME;\n  \n  const headers = {\n    'Content-Type': 'application/json',\n    'Access-Control-Allow-Origin': '*',\n    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',\n    'Access-Control-Allow-Headers': 'Content-Type'\n  };\n  \n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const user = JSON.parse(event.body);\n        const putParams = {\n          TableName: usersTableName,\n          Item: marshall(user)\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          headers,\n          body: JSON.stringify({ message: 'User created successfully' })\n        };\n      \n      case 'GET':\n        const userId = event.queryStringParameters?.userId;\n        if (!userId) {\n          return {\n            statusCode: 400,\n            headers,\n            body: JSON.stringify({ message: 'Missing userId query parameter' })\n          };\n        }\n        const getParams = {\n          TableName: usersTableName,\n          Key: marshall({ userId })\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            headers,\n            body: JSON.stringify({ message: 'User not found' })\n          };\n        }\n        return {\n          statusCode: 200,\n          headers,\n          body: JSON.stringify(unmarshall(Item))\n        };\n      \n      default:\n        return {\n          statusCode: 405,\n          headers,\n          body: JSON.stringify({ message: 'Method Not Allowed' })\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      headers,\n      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })\n    };\n  }\n};",
        "Environment": {
          "Variables": {
            "USERS_TABLE_NAME": {
              "Ref": "UsersTable"
            }
          }
        },
        "Policies": [
          {
            "DynamoDBCrudPolicy": {
              "TableName": {
                "Ref": "UsersTable"
              }
            }
          }
        ],
        "Events": {
          "UsersApi": {
            "Type": "Api",
            "Properties": {
              "Path": "/users",
              "Method": "ANY"
            }
          }
        }
      }
    },
    "OrdersFunction": {
      "Type": "AWS::Serverless::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-orders-function-${EnvironmentSuffix}"
        },
        "Handler": "index.handler",
        "InlineCode": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n  const ordersTableName = process.env.ORDERS_TABLE_NAME;\n  \n  const headers = {\n    'Content-Type': 'application/json',\n    'Access-Control-Allow-Origin': '*',\n    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',\n    'Access-Control-Allow-Headers': 'Content-Type'\n  };\n  \n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const order = JSON.parse(event.body);\n        // Auto-generate orderId if not provided\n        if (!order.orderId) {\n          order.orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;\n        }\n        order.createdAt = new Date().toISOString();\n        order.status = order.status || 'PENDING';\n        \n        const putParams = {\n          TableName: ordersTableName,\n          Item: marshall(order)\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          headers,\n          body: JSON.stringify({ \n            message: 'Order created successfully',\n            orderId: order.orderId,\n            status: order.status\n          })\n        };\n      \n      case 'GET':\n        const orderId = event.queryStringParameters?.orderId;\n        if (!orderId) {\n          return {\n            statusCode: 400,\n            headers,\n            body: JSON.stringify({ message: 'Missing orderId query parameter' })\n          };\n        }\n        const getParams = {\n          TableName: ordersTableName,\n          Key: marshall({ orderId })\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            headers,\n            body: JSON.stringify({ message: 'Order not found' })\n          };\n        }\n        return {\n          statusCode: 200,\n          headers,\n          body: JSON.stringify(unmarshall(Item))\n        };\n      \n      default:\n        return {\n          statusCode: 405,\n          headers,\n          body: JSON.stringify({ message: 'Method Not Allowed' })\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      headers,\n      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })\n    };\n  }\n};",
        "Environment": {
          "Variables": {
            "ORDERS_TABLE_NAME": {
              "Ref": "OrdersTable"
            }
          }
        },
        "Policies": [
          {
            "DynamoDBCrudPolicy": {
              "TableName": {
                "Ref": "OrdersTable"
              }
            }
          }
        ],
        "Events": {
          "OrdersApi": {
            "Type": "Api",
            "Properties": {
              "Path": "/orders",
              "Method": "ANY"
            }
          }
        }
      }
    }
  },
  "Outputs": {
    "ApiGatewayUrl": {
      "Description": "URL of the deployed API Gateway",
      "Value": {
        "Fn::Sub": "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-api-url-${EnvironmentSuffix}"
        }
      }
    },
    "ItemsTableName": {
      "Description": "Name of the Items DynamoDB table",
      "Value": {
        "Ref": "ItemsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-items-table-${EnvironmentSuffix}"
        }
      }
    },
    "UsersTableName": {
      "Description": "Name of the Users DynamoDB table",
      "Value": {
        "Ref": "UsersTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-users-table-${EnvironmentSuffix}"
        }
      }
    },
    "OrdersTableName": {
      "Description": "Name of the Orders DynamoDB table",
      "Value": {
        "Ref": "OrdersTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-orders-table-${EnvironmentSuffix}"
        }
      }
    },
    "ItemsFunctionArn": {
      "Description": "ARN of the Items Lambda function",
      "Value": {
        "Fn::GetAtt": ["ItemsFunction", "Arn"]
      }
    },
    "UsersFunctionArn": {
      "Description": "ARN of the Users Lambda function",
      "Value": {
        "Fn::GetAtt": ["UsersFunction", "Arn"]
      }
    },
    "OrdersFunctionArn": {
      "Description": "ARN of the Orders Lambda function",
      "Value": {
        "Fn::GetAtt": ["OrdersFunction", "Arn"]
      }
    }
  }
}
```

## Key Features

### SAM Template Benefits

- **Transform Directive**: AWS::Serverless-2016-10-31 enables SAM functionality
- **Globals Section**: Common Lambda properties defined once and inherited
- **Simplified Resources**: AWS::Serverless::Function reduces configuration complexity
- **Automatic API Gateway**: ServerlessRestApi created implicitly through Events

### Security & IAM

- **SAM Built-in Policies**: DynamoDBCrudPolicy provides least privilege access
- **Scoped Permissions**: Each function has access only to its specific table
- **CloudWatch Integration**: Logging permissions automatically included by SAM

### Scalability

- **On-Demand DynamoDB**: PAY_PER_REQUEST billing mode for automatic scaling
- **Lambda Optimization**: 30s timeout and 128MB memory configured globally
- **Connection Reuse**: AWS SDK connection reuse enabled for performance

### Error Handling

- **Comprehensive HTTP Status Codes**: 200, 201, 400, 404, 405, 500 responses
- **Input Validation**: Query parameter validation for GET requests
- **CORS Support**: Cross-origin headers included in all responses
- **Exception Handling**: Try-catch blocks with detailed error logging

### Deployment Features

- **Environment Isolation**: EnvironmentSuffix parameter for multi-environment support
- **Stack Outputs**: API URL, table names, and function ARNs exported
- **Resource Naming**: Consistent naming with stack name and environment suffix
- **SAM CLI Compatible**: Template ready for `sam deploy` command

## API Endpoints

### POST Operations

- `POST /items` - Create new item with JSON payload
- `POST /users` - Create new user with JSON payload
- `POST /orders` - Create new order with auto-generated ID and timestamps

### GET Operations

- `GET /items?itemId=<id>` - Retrieve specific item by ID
- `GET /users?userId=<id>` - Retrieve specific user by ID
- `GET /orders?orderId=<id>` - Retrieve specific order by ID

## Enhanced Orders Function

The Orders function includes additional business logic:

- **Auto-ID Generation**: Creates unique orderId if not provided
- **Timestamps**: Automatically adds createdAt timestamp
- **Status Management**: Sets default status to 'PENDING'
- **Enhanced Response**: Returns orderId and status in creation response

## Lambda Function Implementation

### Dependencies

All functions use AWS SDK v3 for modern DynamoDB operations:

- `@aws-sdk/client-dynamodb` for DynamoDB operations
- `@aws-sdk/util-dynamodb` for data marshalling/unmarshalling

### CORS Configuration

Every function includes comprehensive CORS headers:

- Access-Control-Allow-Origin: '\*' (configurable)
- Access-Control-Allow-Methods: 'GET, POST, OPTIONS'
- Access-Control-Allow-Headers: 'Content-Type'

### Environment Variables

Each function receives its table name via environment variables:

- Items Function: ITEMS_TABLE_NAME
- Users Function: USERS_TABLE_NAME
- Orders Function: ORDERS_TABLE_NAME

## Deployment Instructions

### Prerequisites

- AWS CLI configured with appropriate permissions
- SAM CLI installed (`pip install aws-sam-cli`)

### Deployment Commands

```bash
# Guided deployment (first time)
sam deploy --guided --template-file TapStack.json

# Subsequent deployments
sam deploy
```

### Parameter Configuration

During guided deployment, specify:

- **Stack Name**: Choose descriptive name for your stack
- **AWS Region**: Target deployment region
- **EnvironmentSuffix**: Environment identifier (dev, test, prod)

## Monitoring and Debugging

### CloudWatch Logs

SAM automatically creates log groups:

- `/aws/lambda/{StackName}-items-function-{EnvironmentSuffix}`
- `/aws/lambda/{StackName}-users-function-{EnvironmentSuffix}`
- `/aws/lambda/{StackName}-orders-function-{EnvironmentSuffix}`

### API Gateway Logs

API Gateway automatically logs requests and responses for debugging.

## Testing the Deployed API

### Create and Retrieve Items

```bash
# Create item
curl -X POST https://{api-url}/items \
  -H "Content-Type: application/json" \
  -d '{"itemId": "item-001", "name": "Test Item", "price": 29.99}'

# Get item
curl "https://{api-url}/items?itemId=item-001"
```

### Create and Retrieve Users

```bash
# Create user
curl -X POST https://{api-url}/users \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "name": "John Doe", "email": "john@example.com"}'

# Get user
curl "https://{api-url}/users?userId=user-001"
```

### Create and Retrieve Orders

```bash
# Create order (ID auto-generated)
curl -X POST https://{api-url}/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "items": ["item-001"], "total": 29.99}'

# Get order (use ID from creation response)
curl "https://{api-url}/orders?orderId=order-{timestamp}-{random}"
```

## Cleanup

Remove all resources:

```bash
sam delete --stack-name {your-stack-name}
```

This SAM-based infrastructure provides a production-ready serverless foundation with best practices for security, scalability, and maintainability.
