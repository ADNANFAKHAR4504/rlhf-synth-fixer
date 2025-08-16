# CloudFormation Serverless Application Infrastructure

## Overview

This solution provides a production-ready serverless application infrastructure using AWS CloudFormation. The template creates a fully functional REST API with three Lambda functions for managing items, users, and orders, each backed by dedicated DynamoDB tables with on-demand scaling.

## Architecture Components

### Core Resources

1. **Three Lambda Functions**: 
   - Items Function: Handles CRUD operations for items catalog
   - Users Function: Manages user registration and retrieval  
   - Orders Function: Processes order creation and queries

2. **Three DynamoDB Tables**:
   - Items Table: Stores product catalog with itemId as primary key
   - Users Table: Stores user accounts with userId as primary key
   - Orders Table: Stores order records with orderId as primary key

3. **API Gateway**: Single REST API with three resource endpoints (/items, /users, /orders)

4. **IAM Role**: Shared execution role with least privilege permissions for CloudWatch Logs and DynamoDB access

## Template Structure

### TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation template for a serverless application with three Lambda functions (items, users, orders), DynamoDB tables, and API Gateway endpoints",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming"
    }
  },
  "Resources": {
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudWatchLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "DynamoDBPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["ItemsTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["UsersTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["OrdersTable", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
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
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-items-function-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs20.x",
        "Handler": "index.handler",
        "Timeout": 30,
        "MemorySize": 128,
        "Code": {
          "ZipFile": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n\n  const itemsTableName = process.env.ITEMS_TABLE_NAME;\n\n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const item = JSON.parse(event.body);\n        const putParams = {\n          TableName: itemsTableName,\n          Item: marshall(item),\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          body: JSON.stringify({ message: 'Item created successfully' }),\n        };\n      case 'GET':\n        const itemId = event.queryStringParameters?.itemId;\n        if (!itemId) {\n          return {\n            statusCode: 400,\n            body: JSON.stringify({ message: 'Missing itemId query parameter' }),\n          };\n        }\n        const getParams = {\n          TableName: itemsTableName,\n          Key: marshall({ itemId }),\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            body: JSON.stringify({ message: 'Item not found' }),\n          };\n        }\n        return {\n          statusCode: 200,\n          body: JSON.stringify(unmarshall(Item)),\n        };\n      default:\n        return {\n          statusCode: 405,\n          body: JSON.stringify({ message: 'Method Not Allowed' }),\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ message: 'Internal Server Error' }),\n    };\n  }\n};"
        },
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "ITEMS_TABLE_NAME": {
              "Ref": "ItemsTable"
            }
          }
        }
      }
    },
    "UsersFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-users-function-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs20.x",
        "Handler": "index.handler",
        "Timeout": 30,
        "MemorySize": 128,
        "Code": {
          "ZipFile": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n\n  const usersTableName = process.env.USERS_TABLE_NAME;\n\n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const user = JSON.parse(event.body);\n        const putParams = {\n          TableName: usersTableName,\n          Item: marshall(user),\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          body: JSON.stringify({ message: 'User created successfully' }),\n        };\n      case 'GET':\n        const userId = event.queryStringParameters?.userId;\n        if (!userId) {\n          return {\n            statusCode: 400,\n            body: JSON.stringify({ message: 'Missing userId query parameter' }),\n          };\n        }\n        const getParams = {\n          TableName: usersTableName,\n          Key: marshall({ userId }),\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            body: JSON.stringify({ message: 'User not found' }),\n          };\n        }\n        return {\n          statusCode: 200,\n          body: JSON.stringify(unmarshall(Item)),\n        };\n      default:\n        return {\n          statusCode: 405,\n          body: JSON.stringify({ message: 'Method Not Allowed' }),\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ message: 'Internal Server Error' }),\n    };\n  }\n};"
        },
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "USERS_TABLE_NAME": {
              "Ref": "UsersTable"
            }
          }
        }
      }
    },
    "OrdersFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-orders-function-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs20.x",
        "Handler": "index.handler",
        "Timeout": 30,
        "MemorySize": 128,
        "Code": {
          "ZipFile": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n\n  const ordersTableName = process.env.ORDERS_TABLE_NAME;\n\n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const order = JSON.parse(event.body);\n        const putParams = {\n          TableName: ordersTableName,\n          Item: marshall(order),\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          body: JSON.stringify({ message: 'Order created successfully' }),\n        };\n      case 'GET':\n        const orderId = event.queryStringParameters?.orderId;\n        if (!orderId) {\n          return {\n            statusCode: 400,\n            body: JSON.stringify({ message: 'Missing orderId query parameter' }),\n          };\n        }\n        const getParams = {\n          TableName: ordersTableName,\n          Key: marshall({ orderId }),\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            body: JSON.stringify({ message: 'Order not found' }),\n          };\n        }\n        return {\n          statusCode: 200,\n          body: JSON.stringify(unmarshall(Item)),\n        };\n      default:\n        return {\n          statusCode: 405,\n          body: JSON.stringify({ message: 'Method Not Allowed' }),\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ message: 'Internal Server Error' }),\n    };\n  }\n};"
        },
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "ORDERS_TABLE_NAME": {
              "Ref": "OrdersTable"
            }
          }
        }
      }
    },
    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-api-${EnvironmentSuffix}"
        },
        "Description": "API Gateway REST API with endpoints for items, users, and orders",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        }
      }
    },
    "ItemsResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Fn::GetAtt": ["ApiGateway", "RootResourceId"]
        },
        "PathPart": "items"
      }
    },
    "UsersResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Fn::GetAtt": ["ApiGateway", "RootResourceId"]
        },
        "PathPart": "users"
      }
    },
    "OrdersResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Fn::GetAtt": ["ApiGateway", "RootResourceId"]
        },
        "PathPart": "orders"
      }
    },
    "ItemsMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "ItemsResource"
        },
        "HttpMethod": "ANY",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ItemsFunction.Arn}/invocations"
          }
        }
      }
    },
    "UsersMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "UsersResource"
        },
        "HttpMethod": "ANY",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${UsersFunction.Arn}/invocations"
          }
        }
      }
    },
    "OrdersMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "OrdersResource"
        },
        "HttpMethod": "ANY",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${OrdersFunction.Arn}/invocations"
          }
        }
      }
    },
    "ApiDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["ItemsMethod", "UsersMethod", "OrdersMethod"],
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "StageName": "Prod"
      }
    },
    "ItemsFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ItemsFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"
        }
      }
    },
    "UsersFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "UsersFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"
        }
      }
    },
    "OrdersFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "OrdersFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"
        }
      }
    }
  },
  "Outputs": {
    "ApiGatewayUrl": {
      "Description": "URL of the deployed API Gateway",
      "Value": {
        "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/Prod"
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
    }
  }
}
```

## Key Features

### Security & IAM
- **Least Privilege**: IAM role grants only necessary permissions to specific DynamoDB tables
- **Granular Access**: Separate DynamoDB permissions for each table ARN
- **CloudWatch Integration**: Built-in logging permissions for debugging and monitoring

### Scalability
- **On-Demand DynamoDB**: Tables use PAY_PER_REQUEST billing mode for automatic scaling
- **Lambda Configuration**: Optimized timeout (30s) and memory (128MB) settings
- **API Gateway**: Regional endpoint for low latency and automatic scaling

### Error Handling
- **Comprehensive Error Responses**: Lambda functions return appropriate HTTP status codes (200, 201, 400, 404, 405, 500)
- **Input Validation**: Validates required query parameters before processing
- **Exception Handling**: Try-catch blocks with proper error logging

### Deployment Features
- **Environment Isolation**: EnvironmentSuffix parameter ensures resource naming uniqueness
- **Stack Outputs**: Exports API URL and table names for cross-stack references
- **No Retention Policies**: All resources are fully destroyable for clean stack deletion
- **Resource Naming**: Consistent naming convention with stack name and environment suffix

## API Endpoints

### POST Operations
- `POST /items` - Create new item with JSON payload
- `POST /users` - Create new user with JSON payload
- `POST /orders` - Create new order with JSON payload

### GET Operations  
- `GET /items?itemId=<id>` - Retrieve specific item by ID
- `GET /users?userId=<id>` - Retrieve specific user by ID
- `GET /orders?orderId=<id>` - Retrieve specific order by ID

## Lambda Function Details

Each Lambda function includes:
- **Runtime**: Node.js 20.x for latest features and performance
- **Handler**: index.handler entry point
- **Environment Variables**: Table name dynamically injected via CloudFormation reference
- **Inline Code**: Complete implementation included in template for simple deployment
- **Error Handling**: Proper HTTP status codes and error messages
- **Logging**: CloudWatch integration for monitoring and debugging

## Deployment Instructions

1. Deploy using AWS CLI:
   ```bash
   aws cloudformation deploy \
     --template-file TapStack.json \
     --stack-name TapStack${ENVIRONMENT_SUFFIX} \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX}
   ```

2. Access the API using the URL from stack outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name TapStack${ENVIRONMENT_SUFFIX} \
     --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
     --output text
   ```

## Best Practices Implemented

1. **Infrastructure as Code**: Complete infrastructure defined in CloudFormation
2. **Environment Isolation**: Parameter-based environment suffix for multi-environment deployments
3. **Security**: Least privilege IAM permissions scoped to specific resources
4. **Scalability**: On-demand DynamoDB and serverless Lambda functions
5. **Monitoring**: CloudWatch Logs integration for all Lambda functions
6. **Clean Deployment**: No retain policies ensure complete cleanup on stack deletion
7. **Consistent Naming**: All resources follow predictable naming patterns
8. **API Design**: RESTful endpoints with proper HTTP methods and status codes
9. **Error Handling**: Comprehensive error handling with appropriate responses
10. **Documentation**: Clear descriptions for all resources and outputs

This infrastructure provides a production-ready foundation for a serverless application that can scale automatically based on demand while maintaining security best practices and cost optimization through on-demand pricing models.