# SAM Serverless Application Infrastructure

## Overview

This solution provides a complete serverless application infrastructure using AWS SAM (Serverless Application Model). The template creates a REST API with three Lambda functions for managing items, users, and orders, each backed by dedicated DynamoDB tables.

## Architecture Components

### Core Resources

1. **Three Lambda Functions**: 
   - Items Function: Handles CRUD operations for items
   - Users Function: Handles CRUD operations for users  
   - Orders Function: Handles CRUD operations for orders

2. **Three DynamoDB Tables**:
   - Items Table: Stores item data with itemId as primary key
   - Users Table: Stores user data with userId as primary key
   - Orders Table: Stores order data with orderId as primary key

3. **API Gateway**: Single REST API with three endpoints (/items, /users, /orders)

4. **IAM Role**: Shared execution role with least privilege permissions for CloudWatch Logs and DynamoDB access

## Template Structure

### TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Transform": "AWS::Serverless-2016-10-31",
  "Description": "SAM template for a serverless application with three Lambda functions (items, users, orders), DynamoDB tables, and API Gateway endpoints",
  "Globals": {
    "Function": {
      "Runtime": "nodejs20.x",
      "Timeout": 30,
      "MemorySize": 128
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
                    "Fn::GetAtt": [
                      "ItemsTable",
                      "Arn"
                    ]
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
                    "Fn::GetAtt": [
                      "UsersTable",
                      "Arn"
                    ]
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
                    "Fn::GetAtt": [
                      "OrdersTable",
                      "Arn"
                    ]
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
          "Fn::Sub": "${AWS::StackName}-items-table"
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
      },
      "Description": "DynamoDB table for storing items data"
    },
    "UsersTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-users-table"
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
      },
      "Description": "DynamoDB table for storing users data"
    },
    "OrdersTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-orders-table"
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
      },
      "Description": "DynamoDB table for storing orders data"
    },
    "ItemsFunction": {
      "Type": "AWS::Serverless::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-items-function"
        },
        "InlineCode": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n\n  const itemsTableName = process.env.ITEMS_TABLE_NAME;\n\n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const item = JSON.parse(event.body);\n        const putParams = {\n          TableName: itemsTableName,\n          Item: marshall(item),\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          body: JSON.stringify({ message: 'Item created successfully' }),\n        };\n      case 'GET':\n        const itemId = event.queryStringParameters?.itemId;\n        if (!itemId) {\n          return {\n            statusCode: 400,\n            body: JSON.stringify({ message: 'Missing itemId query parameter' }),\n          };\n        }\n        const getParams = {\n          TableName: itemsTableName,\n          Key: marshall({ itemId }),\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            body: JSON.stringify({ message: 'Item not found' }),\n          };\n        }\n        return {\n          statusCode: 200,\n          body: JSON.stringify(unmarshall(Item)),\n        };\n      default:\n        return {\n          statusCode: 405,\n          body: JSON.stringify({ message: 'Method Not Allowed' }),\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ message: 'Internal Server Error' }),\n    };\n  }\n};",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Environment": {
          "Variables": {
            "ITEMS_TABLE_NAME": {
              "Ref": "ItemsTable"
            }
          }
        },
        "Events": {
          "ApiEvent": {
            "Type": "Api",
            "Properties": {
              "RestApiId": {
                "Ref": "ApiGateway"
              },
              "Path": "/items",
              "Method": "ANY"
            }
          }
        }
      },
      "Description": "Lambda function for handling items operations"
    },
    "UsersFunction": {
      "Type": "AWS::Serverless::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-users-function"
        },
        "InlineCode": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n\n  const usersTableName = process.env.USERS_TABLE_NAME;\n\n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const user = JSON.parse(event.body);\n        const putParams = {\n          TableName: usersTableName,\n          Item: marshall(user),\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          body: JSON.stringify({ message: 'User created successfully' }),\n        };\n      case 'GET':\n        const userId = event.queryStringParameters?.userId;\n        if (!userId) {\n          return {\n            statusCode: 400,\n            body: JSON.stringify({ message: 'Missing userId query parameter' }),\n          };\n        }\n        const getParams = {\n          TableName: usersTableName,\n          Key: marshall({ userId }),\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            body: JSON.stringify({ message: 'User not found' }),\n          };\n        }\n        return {\n          statusCode: 200,\n          body: JSON.stringify(unmarshall(Item)),\n        };\n      default:\n        return {\n          statusCode: 405,\n          body: JSON.stringify({ message: 'Method Not Allowed' }),\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ message: 'Internal Server Error' }),\n    };\n  }\n};",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Environment": {
          "Variables": {
            "USERS_TABLE_NAME": {
              "Ref": "UsersTable"
            }
          }
        },
        "Events": {
          "ApiEvent": {
            "Type": "Api",
            "Properties": {
              "RestApiId": {
                "Ref": "ApiGateway"
              },
              "Path": "/users",
              "Method": "ANY"
            }
          }
        }
      },
      "Description": "Lambda function for handling users operations"
    },
    "OrdersFunction": {
      "Type": "AWS::Serverless::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-orders-function"
        },
        "InlineCode": "const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');\nconst { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');\nconst ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });\n\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n\n  const ordersTableName = process.env.ORDERS_TABLE_NAME;\n\n  try {\n    switch (event.httpMethod) {\n      case 'POST':\n        const order = JSON.parse(event.body);\n        const putParams = {\n          TableName: ordersTableName,\n          Item: marshall(order),\n        };\n        await ddbClient.send(new PutItemCommand(putParams));\n        return {\n          statusCode: 201,\n          body: JSON.stringify({ message: 'Order created successfully' }),\n        };\n      case 'GET':\n        const orderId = event.queryStringParameters?.orderId;\n        if (!orderId) {\n          return {\n            statusCode: 400,\n            body: JSON.stringify({ message: 'Missing orderId query parameter' }),\n          };\n        }\n        const getParams = {\n          TableName: ordersTableName,\n          Key: marshall({ orderId }),\n        };\n        const { Item } = await ddbClient.send(new GetItemCommand(getParams));\n        if (!Item) {\n          return {\n            statusCode: 404,\n            body: JSON.stringify({ message: 'Order not found' }),\n          };\n        }\n        return {\n          statusCode: 200,\n          body: JSON.stringify(unmarshall(Item)),\n        };\n      default:\n        return {\n          statusCode: 405,\n          body: JSON.stringify({ message: 'Method Not Allowed' }),\n        };\n    }\n  } catch (error) {\n    console.error('Error:', error);\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ message: 'Internal Server Error' }),\n    };\n  }\n};",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Environment": {
          "Variables": {
            "ORDERS_TABLE_NAME": {
              "Ref": "OrdersTable"
            }
          }
        },
        "Events": {
          "ApiEvent": {
            "Type": "Api",
            "Properties": {
              "RestApiId": {
                "Ref": "ApiGateway"
              },
              "Path": "/orders",
              "Method": "ANY"
            }
          }
        }
      },
      "Description": "Lambda function for handling orders operations"
    },
    "ApiGateway": {
      "Type": "AWS::Serverless::Api",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-api"
        },
        "StageName": "Prod",
        "Cors": {
          "AllowMethods": "'*'",
          "AllowHeaders": "'*'",
          "AllowOrigin": "'*'"
        },
        "DefinitionBody": {
          "swagger": "2.0",
          "info": {
            "title": {
              "Fn::Sub": "${AWS::StackName} API"
            },
            "version": "1.0"
          },
          "paths": {
            "/items": {
              "x-amazon-apigateway-any-method": {
                "x-amazon-apigateway-integration": {
                  "type": "aws_proxy",
                  "httpMethod": "POST",
                  "uri": {
                    "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ItemsFunction.Arn}/invocations"
                  }
                }
              }
            },
            "/users": {
              "x-amazon-apigateway-any-method": {
                "x-amazon-apigateway-integration": {
                  "type": "aws_proxy",
                  "httpMethod": "POST",
                  "uri": {
                    "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${UsersFunction.Arn}/invocations"
                  }
                }
              }
            },
            "/orders": {
              "x-amazon-apigateway-any-method": {
                "x-amazon-apigateway-integration": {
                  "type": "aws_proxy",
                  "httpMethod": "POST",
                  "uri": {
                    "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${OrdersFunction.Arn}/invocations"
                  }
                }
              }
            }
          }
        }
      },
      "Description": "API Gateway REST API with endpoints for items, users, and orders"
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
          "Fn::Sub": "${AWS::StackName}-api-url"
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
          "Fn::Sub": "${AWS::StackName}-items-table"
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
          "Fn::Sub": "${AWS::StackName}-users-table"
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
          "Fn::Sub": "${AWS::StackName}-orders-table"
        }
      }
    }
  }
}
```

## Key Features

### Security & IAM
- **Least Privilege**: IAM role grants only necessary permissions
- **Granular Access**: Separate DynamoDB permissions for each table
- **CloudWatch Integration**: Built-in logging permissions for debugging

### Scalability
- **On-Demand DynamoDB**: Tables use PAY_PER_REQUEST billing mode for automatic scaling
- **Lambda Configuration**: Optimized timeout (30s) and memory (128MB) settings
- **API Gateway**: Handles traffic scaling automatically

### Error Handling
- **Comprehensive Error Responses**: Lambda functions return appropriate HTTP status codes
- **Input Validation**: Validates required query parameters
- **Exception Handling**: Try-catch blocks for robust error management

### Deployment Features
- **Stack Outputs**: Exports API URL and table names for reference
- **Resource Naming**: Uses stack name for consistent resource naming
- **Cross-Origin Support**: CORS enabled for web application integration

## API Endpoints

### POST Operations
- `POST /items` - Create new item
- `POST /users` - Create new user  
- `POST /orders` - Create new order

### GET Operations
- `GET /items?itemId=<id>` - Retrieve specific item
- `GET /users?userId=<id>` - Retrieve specific user
- `GET /orders?orderId=<id>` - Retrieve specific order

## Lambda Function Details

Each Lambda function includes:
- **Runtime**: Node.js 20.x
- **Handler**: index.handler
- **Environment Variables**: Table name injected via CloudFormation reference
- **Inline Code**: Complete implementation included in template
- **Error Handling**: HTTP status codes and error messages
- **Logging**: CloudWatch integration for monitoring

## Deployment Instructions

1. Save the JSON template as `TapStack.json`
2. Deploy using AWS SAM CLI:
   ```bash
   sam deploy --template-file TapStack.json --stack-name my-serverless-app --capabilities CAPABILITY_IAM
   ```
3. Access the API using the URL from the stack outputs

## Outputs Available

After deployment, the stack provides:
- **ApiGatewayUrl**: Base URL for all API endpoints
- **ItemsTableName**: DynamoDB table name for items
- **UsersTableName**: DynamoDB table name for users  
- **OrdersTableName**: DynamoDB table name for orders

This infrastructure provides a production-ready serverless application foundation that can be extended with additional functionality as needed.