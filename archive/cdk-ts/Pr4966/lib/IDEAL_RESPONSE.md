# AWS CDK Serverless API Solution - Multiple Architecture Patterns

## Architecture Patterns Overview

This solution demonstrates **three different architectural approaches** for implementing serverless APIs with AWS CDK:

### Core Components (All Patterns)

1. **API Gateway** - REST API with CORS enabled and rate limiting
2. **Lambda Function** - Node.js runtime with proper DynamoDB operations
3. **DynamoDB Table** - NoSQL database with PAY_PER_REQUEST billing (auto-scaling)
4. **Secrets Manager** - Secure credential storage
5. **CloudWatch** - Monitoring, logging, and alerting
6. **IAM** - Least-privilege access policies

### Architectural Patterns

#### Pattern 1: Monolithic Stack (`tap-stack.ts`)

- **Approach**: Single comprehensive stack with all resources
- **Use Case**: Simple applications, development environments, proof-of-concepts
- **Benefits**: Easy deployment, all resources managed together
- **Trade-offs**: Less modular, harder to share resources across teams

#### Pattern 2: Modular API Stack (`api-stack.ts`)

- **Approach**: API-focused stack that depends on external DynamoDB
- **Use Case**: Enterprise environments, shared databases, microservices
- **Benefits**: Resource sharing, better separation of concerns, team autonomy
- **Trade-offs**: More complex dependencies, requires cross-stack references

#### Pattern 3: Specialized DynamoDB Stack (`dynamo-stack.ts`)

- **Approach**: DynamoDB-only stack with advanced auto-scaling
- **Use Case**: High-traffic applications, complex data models, PROVISIONED billing needs
- **Benefits**: Optimized for specific use cases, advanced scaling features
- **Trade-offs**: More complex, may include unused features

### Design Decisions (Common Across All Patterns)

- **Single Lambda Function**: Handles all CRUD operations with internal routing
- **PAY_PER_REQUEST Billing**: Automatic scaling without manual capacity management
- **Comprehensive Testing**: Unit tests (CDK synthesis) + Integration tests (live AWS resources)
- **Environment Isolation**: Proper resource naming and tagging by environment

## Stack Implementation Patterns

### Pattern 1: Monolithic Stack (`tap-stack.ts`)

**Best for**: Simple applications, development environments, proof-of-concepts

```typescript
// lib/tap-stack.ts - Single comprehensive stack
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create DynamoDB table
    const table = new dynamodb.Table(this, `ItemsTable${environmentSuffix}`, {
      tableName: `tap-api-items-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development/testing only
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // Add Global Secondary Index for potential query patterns
    table.addGlobalSecondaryIndex({
      indexName: 'createdAt-index',
      partitionKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Note: Auto-scaling is not supported for PAY_PER_REQUEST billing mode tables.
    // DynamoDB automatically scales based on demand for on-demand tables.

    // Create Secrets Manager secret for API credentials
    const apiSecret = new secretsmanager.Secret(
      this,
      `ApiSecret${environmentSuffix}`,
      {
        secretName: `tap-api-secret-${environmentSuffix}`,
        description: 'API credentials for external service integration',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ apiKey: '', apiSecret: '' }),
          generateStringKey: 'password',
          passwordLength: 32,
        },
      }
    );

    // Create IAM role for Lambda function with least-privilege access
    const lambdaRole = new iam.Role(this, `ApiLambdaRole${environmentSuffix}`, {
      roleName: `tap-api-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific DynamoDB permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
        ],
        resources: [table.tableArn, `${table.tableArn}/index/*`],
      })
    );

    // Add Secrets Manager permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [apiSecret.secretArn],
      })
    );

    // Create Lambda function
    const lambdaFunction = new lambda.Function(
      this,
      `ApiFunction${environmentSuffix}`,
      {
        functionName: `tap-api-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Lambda function invoked with event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, body, pathParameters, queryStringParameters } = event;
  const tableName = process.env.TABLE_NAME;
  const secretArn = process.env.SECRET_ARN;

  console.log('Environment variables:', { tableName, secretArn });

  try {
    // Parse request body for POST/PUT
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (parseError) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
      }
    }

    // Basic CRUD operations
    switch (httpMethod) {
      case 'GET':
        if (pathParameters && pathParameters.id) {
          // Get single item
          const params = {
            TableName: tableName,
            Key: { id: pathParameters.id }
          };

          const result = await dynamoDB.get(params).promise();

          if (!result.Item) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'Item not found' }),
            };
          }

          return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
          };
        } else {
          // List all items (simple scan for now)
          console.log('Scanning table:', tableName);
          const params = {
            TableName: tableName,
            Limit: 50
          };

          const result = await dynamoDB.scan(params).promise();
          console.log('Scan result:', result);

          return {
            statusCode: 200,
            body: JSON.stringify({
              items: result.Items || [],
              count: result.Count || 0
            }),
          };
        }

      case 'POST':
        console.log('POST operation with body:', requestBody);
        // Validate required fields
        if (!requestBody.name) {
          console.log('Missing name field');
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Name field is required' }),
          };
        }

        // Create new item
        const itemId = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const newItem = {
          id: itemId,
          name: requestBody.name,
          description: requestBody.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('Creating item:', newItem);
        console.log('Table name:', tableName);

        try {
          await dynamoDB.put({
            TableName: tableName,
            Item: newItem
          }).promise();
          console.log('Item created successfully');
        } catch (dbError) {
          console.error('DynamoDB put error:', dbError);
          throw dbError;
        }

        return {
          statusCode: 201,
          body: JSON.stringify(newItem),
        };

      case 'PUT':
        // Update item
        if (!pathParameters || !pathParameters.id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Item ID required for update' }),
          };
        }

        // First check if item exists
        const getParams = {
          TableName: tableName,
          Key: { id: pathParameters.id }
        };

        const existingItem = await dynamoDB.get(getParams).promise();

        if (!existingItem.Item) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Item not found' }),
          };
        }

        // Update the item
        const updatedItem = {
          ...existingItem.Item,
          ...requestBody,
          id: pathParameters.id, // Ensure ID doesn't change
          updatedAt: new Date().toISOString(),
        };

        await dynamoDB.put({
          TableName: tableName,
          Item: updatedItem
        }).promise();

        return {
          statusCode: 200,
          body: JSON.stringify(updatedItem),
        };

      case 'DELETE':
        // Delete item
        if (!pathParameters || !pathParameters.id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Item ID required for deletion' }),
          };
        }

        // Check if item exists before deleting
        const deleteGetParams = {
          TableName: tableName,
          Key: { id: pathParameters.id }
        };

        const itemToDelete = await dynamoDB.get(deleteGetParams).promise();

        if (!itemToDelete.Item) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Item not found' }),
          };
        }

        await dynamoDB.delete({
          TableName: tableName,
          Key: { id: pathParameters.id },
          ReturnValues: 'ALL_OLD'
        }).promise();

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Item deleted successfully',
            id: pathParameters.id
          }),
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Lambda function error:', error);
    console.error('Error stack:', error.stack);
    console.error('Event that caused error:', JSON.stringify(event, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        type: error.name
      }),
    };
  }
};
        `),
        handler: 'index.handler',
        role: lambdaRole,
        environment: {
          TABLE_NAME: table.tableName,
          SECRET_ARN: apiSecret.secretArn,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logGroup: new logs.LogGroup(
          this,
          `LambdaLogGroup${environmentSuffix}`,
          {
            logGroupName: `/aws/lambda/tap-api-function-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }
        ),
      }
    );

    // Create API Gateway
    const api = new apigateway.RestApi(this, `ApiGateway${environmentSuffix}`, {
      restApiName: `tap-api-${environmentSuffix}`,
      description: 'Serverless API for CRUD operations',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // Create API resource and methods
    const items = api.root.addResource('items');
    const item = items.addResource('{id}');

    // Add methods
    items.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    items.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    item.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    item.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    item.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunction), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Create CloudWatch dashboard for API monitoring
    const dashboard = new cloudwatch.Dashboard(
      this,
      `ApiDashboard${environmentSuffix}`,
      {
        dashboardName: `tap-api-dashboard-${environmentSuffix}`,
      }
    );

    // Add widgets to dashboard
    dashboard.addWidgets(
      // API Gateway metrics
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Request Count',
        left: [api.metricCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Latency',
        left: [api.metricLatency()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Error Rate',
        left: [api.metricClientError(), api.metricServerError()],
      }),
      // Lambda metrics
      new cloudwatch.GraphWidget({
        title: 'Lambda - Invocation Count',
        left: [lambdaFunction.metricInvocations()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Duration',
        left: [lambdaFunction.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Error Rate',
        left: [lambdaFunction.metricErrors()],
      })
    );

    // Create CloudWatch alarms
    lambdaFunction
      .metricErrors()
      .createAlarm(this, `LambdaErrorAlarm${environmentSuffix}`, {
        alarmName: `tap-lambda-errors-${environmentSuffix}`,
        threshold: 5,
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function error rate is high',
      });

    api
      .metricServerError()
      .createAlarm(this, `ApiErrorAlarm${environmentSuffix}`, {
        alarmName: `tap-api-errors-${environmentSuffix}`,
        threshold: 10,
        evaluationPeriods: 2,
        alarmDescription: 'API Gateway server error rate is high',
      });

    // Output important values for integration tests
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `tap-api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
      exportName: `tap-dynamo-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `tap-lambda-function-${environmentSuffix}`,
    });
  }
}
```

### Pattern 2: Modular API Stack (`api-stack.ts`)

**Best for**: Enterprise environments, shared databases, microservices architecture

```typescript
// lib/api-stack.ts - API-focused stack depending on external DynamoDB
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  environmentSuffix: string;
  dynamoTableArn: string; // Depends on external DynamoDB
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { environmentSuffix, dynamoTableArn } = props;

    // Secrets Manager for API credentials
    const apiSecret = new secretsmanager.Secret(
      this,
      `ApiSecret${environmentSuffix}`,
      {
        secretName: `tap-api-secret-${environmentSuffix}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ apiKey: '', apiSecret: '' }),
          generateStringKey: 'password',
          passwordLength: 32,
        },
      }
    );

    // IAM role with permissions to external DynamoDB table
    const lambdaRole = new iam.Role(this, `ApiLambdaRole${environmentSuffix}`, {
      roleName: `tap-api-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Permissions for external DynamoDB table
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
        ],
        resources: [dynamoTableArn, `${dynamoTableArn}/index/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [apiSecret.secretArn],
      })
    );

    // Lambda function (same implementation as monolithic stack)
    this.lambdaFunction = new lambda.Function(
      this,
      `ApiFunction${environmentSuffix}`,
      {
        functionName: `tap-api-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { httpMethod, path, body, pathParameters, queryStringParameters } = event;
  const tableName = process.env.TABLE_NAME;
  const secretArn = process.env.SECRET_ARN;

  try {
    // Parse request body for POST/PUT
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (parseError) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
      }
    }

    // Basic CRUD operations
    switch (httpMethod) {
      case 'GET':
        if (pathParameters && pathParameters.id) {
          // Get single item
          const params = {
            TableName: tableName,
            Key: { id: pathParameters.id }
          };

          const result = await dynamoDB.get(params).promise();

          if (!result.Item) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'Item not found' }),
            };
          }

          return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
          };
        } else {
          // List all items (simple scan for now)
          const params = {
            TableName: tableName,
            Limit: 50
          };

          const result = await dynamoDB.scan(params).promise();

          return {
            statusCode: 200,
            body: JSON.stringify({
              items: result.Items || [],
              count: result.Count || 0
            }),
          };
        }

      case 'POST':
        // Validate required fields
        if (!requestBody.name) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Name field is required' }),
          };
        }

        // Create new item
        const itemId = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const newItem = {
          id: itemId,
          name: requestBody.name,
          description: requestBody.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await dynamoDB.put({
          TableName: tableName,
          Item: newItem
        }).promise();

        return {
          statusCode: 201,
          body: JSON.stringify(newItem),
        };

      case 'PUT':
        // Update item
        if (!pathParameters || !pathParameters.id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Item ID required for update' }),
          };
        }

        // First check if item exists
        const getParams = {
          TableName: tableName,
          Key: { id: pathParameters.id }
        };

        const existingItem = await dynamoDB.get(getParams).promise();

        if (!existingItem.Item) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Item not found' }),
          };
        }

        // Update the item
        const updatedItem = {
          ...existingItem.Item,
          ...requestBody,
          id: pathParameters.id, // Ensure ID doesn't change
          updatedAt: new Date().toISOString(),
        };

        await dynamoDB.put({
          TableName: tableName,
          Item: updatedItem
        }).promise();

        return {
          statusCode: 200,
          body: JSON.stringify(updatedItem),
        };

      case 'DELETE':
        // Delete item
        if (!pathParameters || !pathParameters.id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Item ID required for deletion' }),
          };
        }

        // Check if item exists before deleting
        const deleteGetParams = {
          TableName: tableName,
          Key: { id: pathParameters.id }
        };

        const itemToDelete = await dynamoDB.get(deleteGetParams).promise();

        if (!itemToDelete.Item) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Item not found' }),
          };
        }

        await dynamoDB.delete({
          TableName: tableName,
          Key: { id: pathParameters.id },
          ReturnValues: 'ALL_OLD'
        }).promise();

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Item deleted successfully',
            id: pathParameters.id
          }),
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
      `),
        handler: 'index.handler',
        role: lambdaRole,
        environment: {
          TABLE_NAME: `tap-api-items-${environmentSuffix}`, // Table name, not ARN
          SECRET_ARN: apiSecret.secretArn,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // API Gateway (same configuration as monolithic stack)
    this.api = new apigateway.RestApi(this, `ApiGateway${environmentSuffix}`, {
      restApiName: `tap-api-${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // Create API resources and methods (same as monolithic stack)
    const items = this.api.root.addResource('items');
    const item = items.addResource('{id}');

    const lambdaIntegration = new apigateway.LambdaIntegration(
      this.lambdaFunction
    );
    items.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    items.addMethod('POST', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    item.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    item.addMethod('PUT', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    item.addMethod('DELETE', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // CloudWatch monitoring (same as monolithic stack)
    const dashboard = new cloudwatch.Dashboard(
      this,
      `ApiDashboard${environmentSuffix}`,
      {
        dashboardName: `tap-api-dashboard-${environmentSuffix}`,
      }
    );

    dashboard.addWidgets([
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Request Count',
        left: [this.api.metricCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Latency',
        left: [this.api.metricLatency()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Error Rate',
        left: [this.api.metricClientError(), this.api.metricServerError()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Invocation Count',
        left: [this.lambdaFunction.metricInvocations()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Duration',
        left: [this.lambdaFunction.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Error Rate',
        left: [this.lambdaFunction.metricErrors()],
      }),
    ]);

    // CloudWatch alarms (same as monolithic stack)
    this.api
      .metricServerError()
      .createAlarm(this, `ApiErrorAlarm${environmentSuffix}`, {
        alarmName: `tap-api-errors-${environmentSuffix}`,
        threshold: 10,
        evaluationPeriods: 2,
      });

    this.lambdaFunction
      .metricErrors()
      .createAlarm(this, `LambdaErrorAlarm${environmentSuffix}`, {
        alarmName: `tap-lambda-errors-${environmentSuffix}`,
        threshold: 5,
        evaluationPeriods: 2,
      });
  }
}
```

### Pattern 3: Specialized DynamoDB Stack (`dynamo-stack.ts`)

**Best for**: High-traffic applications, complex data models, PROVISIONED billing requirements

```typescript
// lib/dynamo-stack.ts - DynamoDB-focused stack with advanced scaling
import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // DynamoDB table with advanced configuration
    this.table = new dynamodb.Table(this, `ItemsTable${environmentSuffix}`, {
      tableName: `tap-api-items-${environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Can be changed to PROVISIONED
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Add Global Secondary Index
    this.table.addGlobalSecondaryIndex({
      indexName: 'createdAt-index',
      partitionKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Advanced auto-scaling configuration (for PROVISIONED mode)
    if (this.table.billingMode === dynamodb.BillingMode.PROVISIONED) {
      // Read capacity auto-scaling
      const readScaling = new applicationautoscaling.ScalableTarget(
        this,
        `DynamoReadScaling${environmentSuffix}`,
        {
          serviceNamespace: applicationautoscaling.ServiceNamespace.DYNAMODB,
          resourceId: `table/${this.table.tableName}/index/*`,
          scalableDimension: 'dynamodb:index:ReadCapacityUnits',
          minCapacity: 5,
          maxCapacity: 400,
          role: undefined, // Use default role
        }
      );

      readScaling.scaleToTrackMetric('DynamoReadScalingPolicy', {
        targetValue: 70.0,
        predefinedMetric:
          applicationautoscaling.PredefinedMetric
            .DYNAMODB_READ_CAPACITY_UTILIZATION,
      });

      // Write capacity auto-scaling
      const writeScaling = new applicationautoscaling.ScalableTarget(
        this,
        `DynamoWriteScaling${environmentSuffix}`,
        {
          serviceNamespace: applicationautoscaling.ServiceNamespace.DYNAMODB,
          resourceId: `table/${this.table.tableName}/index/*`,
          scalableDimension: 'dynamodb:index:WriteCapacityUnits',
          minCapacity: 5,
          maxCapacity: 400,
          role: undefined, // Use default role
        }
      );

      writeScaling.scaleToTrackMetric('DynamoWriteScalingPolicy', {
        targetValue: 70.0,
        predefinedMetric:
          applicationautoscaling.PredefinedMetric
            .DYNAMODB_WRITE_CAPACITY_UTILIZATION,
      });
    }

    // CloudWatch alarms for monitoring
    this.table
      .metricConsumedReadCapacityUnits({ statistic: 'Maximum' })
      .createAlarm(this, `DynamoReadCapacityAlarm${environmentSuffix}`, {
        alarmName: `tap-dynamo-read-capacity-${environmentSuffix}`,
        threshold: 300,
        evaluationPeriods: 2,
        alarmDescription: 'DynamoDB read capacity utilization is high',
      });

    this.table
      .metricConsumedWriteCapacityUnits({ statistic: 'Maximum' })
      .createAlarm(this, `DynamoWriteCapacityAlarm${environmentSuffix}`, {
        alarmName: `tap-dynamo-write-capacity-${environmentSuffix}`,
        threshold: 300,
        evaluationPeriods: 2,
        alarmDescription: 'DynamoDB write capacity utilization is high',
      });
  }
}
```

## Pattern Usage Examples

### Pattern 1: Monolithic Stack Usage

```typescript
// bin/tap.ts - Using monolithic stack
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const environment = app.node.tryGetContext('environment') || 'dev';

new TapStack(app, `TapStack${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environmentSuffix: environment,
  tags: {
    Environment: environment,
    Application: 'TapAPI',
    Pattern: 'Monolithic',
  },
});
```

### Pattern 2: Modular Stack Usage

```typescript
// bin/tap-modular.ts - Using modular stacks
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoStack } from '../lib/dynamo-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();
const environment = app.node.tryGetContext('environment') || 'dev';

// Deploy DynamoDB stack first
const dynamoStack = new DynamoStack(app, `DynamoStack${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environmentSuffix: environment,
  tags: {
    Environment: environment,
    Application: 'TapAPI',
    Pattern: 'Modular',
    Component: 'Database',
  },
});

// Deploy API stack with reference to DynamoDB
new ApiStack(app, `ApiStack${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environmentSuffix: environment,
  dynamoTableArn: dynamoStack.table.tableArn, // Cross-stack reference
  tags: {
    Environment: environment,
    Application: 'TapAPI',
    Pattern: 'Modular',
    Component: 'API',
  },
});
```

### Pattern 3: Specialized Stack Usage

```typescript
// bin/tap-specialized.ts - Using specialized DynamoDB stack
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoStack } from '../lib/dynamo-stack';

const app = new cdk.App();
const environment = app.node.tryGetContext('environment') || 'dev';

// Use specialized DynamoDB stack with PROVISIONED billing
const dynamoStack = new DynamoStack(app, `DynamoStack${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environmentSuffix: environment,
  tags: {
    Environment: environment,
    Application: 'TapAPI',
    Pattern: 'Specialized',
    Component: 'HighTrafficDatabase',
  },
});

// Access the table for other stacks or outputs
new cdk.CfnOutput(dynamoStack, 'TableName', {
  value: dynamoStack.table.tableName,
  description: 'DynamoDB table name for high-traffic workloads',
});
```
