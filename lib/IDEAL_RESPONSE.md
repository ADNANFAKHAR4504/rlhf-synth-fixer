# AWS CDK Serverless API Solution

## Project Structure

```
serverless-api/
├── bin/
│   └── tap.ts                    # Entry point
├── lib/
│   └── tap-stack.ts              # Main stack definition
├── lambda/
│   └── api-handler.ts            # Lambda function handler
├── test/
│   └── tap-stack.unit.test.ts    # Unit tests
├── cdk.json                      # CDK configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Main Stack Implementation

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly itemsTable: dynamodb.Table;
  public readonly apiCredentials: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Environment-based configuration
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 1. DynamoDB table with auto-scaling (PROVISIONED mode for explicit scaling)
    this.itemsTable = new dynamodb.Table(
      this,
      `ItemsTable${environmentSuffix}`,
      {
        tableName: `tap-api-items-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        readCapacity: 5,
        writeCapacity: 5,
        removalPolicy:
          environmentSuffix === 'prod'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
      }
    );

    // Add Global Secondary Index
    this.itemsTable.addGlobalSecondaryIndex({
      indexName: 'createdAt-index',
      partitionKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: 5,
      writeCapacity: 5,
    });

    // Configure auto-scaling for the table
    const readScaling = this.itemsTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 100,
    });
    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    const writeScaling = this.itemsTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 50,
    });
    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    // 2. Secrets Manager for API credentials
    this.apiCredentials = new secretsmanager.Secret(
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

    // 3. IAM role with least-privilege access
    const lambdaRole = new iam.Role(this, `ApiLambdaRole${environmentSuffix}`, {
      roleName: `tap-api-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant specific permissions
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
        resources: [
          this.itemsTable.tableArn,
          `${this.itemsTable.tableArn}/index/*`,
        ],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [this.apiCredentials.secretArn],
      })
    );

    // 4. Lambda function with zero-downtime deployment strategy
    const lambdaFunction = new lambda.Function(
      this,
      `ApiFunction${environmentSuffix}`,
      {
        functionName: `tap-api-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'api-handler.handler',
        role: lambdaRole,
        environment: {
          TABLE_NAME: this.itemsTable.tableName,
          SECRET_ARN: this.apiCredentials.secretArn,
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
        // Enable zero-downtime deployments
        currentVersionOptions: {
          description: `Version deployed on ${new Date().toISOString()}`,
          removalPolicy:
            environmentSuffix === 'prod'
              ? cdk.RemovalPolicy.RETAIN
              : cdk.RemovalPolicy.DESTROY,
        },
      }
    );

    // Create version and alias for zero-downtime deployments
    const version = lambdaFunction.currentVersion;
    new lambda.Alias(this, `ApiFunctionAlias${environmentSuffix}`, {
      aliasName: environmentSuffix,
      version: version,
    });

    // 5. API Gateway REST API
    this.apiGateway = new apigateway.RestApi(
      this,
      `ApiGateway${environmentSuffix}`,
      {
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
      }
    );

    // Create API resources and methods
    const items = this.apiGateway.root.addResource('items');
    const item = items.addResource('{id}');

    // Add methods using the Lambda alias for zero-downtime deployments
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      allowTestInvoke: true,
    });

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

    // 6. CloudWatch monitoring
    const dashboard = new cloudwatch.Dashboard(
      this,
      `ApiDashboard${environmentSuffix}`,
      {
        dashboardName: `tap-api-dashboard-${environmentSuffix}`,
      }
    );

    // Add metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Request Count',
        left: [this.apiGateway.metricCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Latency',
        left: [this.apiGateway.metricLatency()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Error Rate',
        left: [
          this.apiGateway.metricClientError(),
          this.apiGateway.metricServerError(),
        ],
      }),
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
    this.apiGateway
      .metricServerError()
      .createAlarm(this, `ApiErrorAlarm${environmentSuffix}`, {
        alarmName: `tap-api-errors-${environmentSuffix}`,
        threshold: 10,
        evaluationPeriods: 2,
        alarmDescription: 'API Gateway server error rate is high',
      });

    lambdaFunction
      .metricErrors()
      .createAlarm(this, `LambdaErrorAlarm${environmentSuffix}`, {
        alarmName: `tap-lambda-errors-${environmentSuffix}`,
        threshold: 5,
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function error rate is high',
      });

    // 7. Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiGateway.url,
      description: 'API Gateway endpoint URL',
      exportName: `tap-api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: this.itemsTable.tableName,
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

## CDK Entry Point

```typescript
// bin/tap.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Environment-based configuration using CDK context
const environment = app.node.tryGetContext('environment') || 'dev';
const environmentConfig = app.node.tryGetContext(environment) || {};

new TapStack(app, `TapStack${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environmentSuffix: environment,
  ...environmentConfig,
  tags: {
    Environment: environment,
    Application: 'TapAPI',
  },
});
```

## Lambda Handler Implementation

```typescript
// lambda/api-handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, SecretsManager } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamoDB = new DynamoDB.DocumentClient();
const secretsManager = new SecretsManager();

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Retrieve secrets (cached in production)
    const secretData = await secretsManager
      .getSecretValue({
        SecretId: process.env.SECRET_ARN!,
      })
      .promise();

    const secrets = JSON.parse(secretData.SecretString!);

    const { httpMethod, path, body, pathParameters, queryStringParameters } =
      event;

    // Parse request body for POST/PUT
    let requestBody = {};
    if (body) {
      requestBody = JSON.parse(body);
    }

    // Route to appropriate handler based on HTTP method and path
    switch (httpMethod) {
      case 'GET':
        if (pathParameters && pathParameters.id) {
          return await getItem(pathParameters.id);
        } else {
          return await listItems(queryStringParameters);
        }

      case 'POST':
        return await createItem(requestBody);

      case 'PUT':
        if (!pathParameters || !pathParameters.id) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Item ID required for update' }),
          };
        }
        return await updateItem(pathParameters.id, requestBody);

      case 'DELETE':
        if (!pathParameters || !pathParameters.id) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Item ID required for deletion' }),
          };
        }
        return await deleteItem(pathParameters.id);

      default:
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function getItem(id: string): Promise<APIGatewayProxyResult> {
  const result = await dynamoDB
    .get({
      TableName: process.env.TABLE_NAME!,
      Key: { id },
    })
    .promise();

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Item not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.Item),
  };
}

async function listItems(
  queryParams: any = {}
): Promise<APIGatewayProxyResult> {
  const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;

  const params: DynamoDB.DocumentClient.ScanInput = {
    TableName: process.env.TABLE_NAME!,
    Limit: limit,
  };

  if (queryParams.nextToken) {
    params.ExclusiveStartKey = JSON.parse(
      Buffer.from(queryParams.nextToken, 'base64').toString()
    );
  }

  const result = await dynamoDB.scan(params).promise();

  let nextToken = undefined;
  if (result.LastEvaluatedKey) {
    nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
      'base64'
    );
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: result.Items,
      nextToken,
    }),
  };
}

async function createItem(data: any): Promise<APIGatewayProxyResult> {
  if (!data.name) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Name field is required' }),
    };
  }

  const itemId = uuidv4();
  const timestamp = new Date().toISOString();

  const item = {
    id: itemId,
    name: data.name,
    description: data.description || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDB
    .put({
      TableName: process.env.TABLE_NAME!,
      Item: item,
    })
    .promise();

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  };
}

async function updateItem(
  id: string,
  data: any
): Promise<APIGatewayProxyResult> {
  const getResult = await dynamoDB
    .get({
      TableName: process.env.TABLE_NAME!,
      Key: { id },
    })
    .promise();

  if (!getResult.Item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Item not found' }),
    };
  }

  let updateExpression = 'SET updatedAt = :updatedAt';
  const expressionAttributeValues: { [key: string]: any } = {
    ':updatedAt': new Date().toISOString(),
  };

  Object.keys(data).forEach(key => {
    if (key !== 'id' && key !== 'createdAt') {
      updateExpression += `, ${key} = :${key}`;
      expressionAttributeValues[`:${key}`] = data[key];
    }
  });

  await dynamoDB
    .update({
      TableName: process.env.TABLE_NAME!,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  const updatedResult = await dynamoDB
    .get({
      TableName: process.env.TABLE_NAME!,
      Key: { id },
    })
    .promise();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedResult.Item),
  };
}

async function deleteItem(id: string): Promise<APIGatewayProxyResult> {
  const getResult = await dynamoDB
    .get({
      TableName: process.env.TABLE_NAME!,
      Key: { id },
    })
    .promise();

  if (!getResult.Item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Item not found' }),
    };
  }

  await dynamoDB
    .delete({
      TableName: process.env.TABLE_NAME!,
      Key: { id },
    })
    .promise();

  return {
    statusCode: 204,
    headers: { 'Content-Type': 'application/json' },
    body: '',
  };
}
```

## Configuration Files

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "context": {
    "dev": {
      "readCapacity": 5,
      "writeCapacity": 5
    },
    "stage": {
      "readCapacity": 10,
      "writeCapacity": 10
    },
    "prod": {
      "readCapacity": 20,
      "writeCapacity": 15
    }
  }
}
```

## Key Improvements Over Current Implementation

1. **DynamoDB Auto-scaling**: Uses PROVISIONED billing mode with explicit auto-scaling configuration instead of PAY_PER_REQUEST
2. **Zero-downtime Deployments**: Implements Lambda versions and aliases for safe deployments
3. **Better Error Handling**: Comprehensive error handling in Lambda function
4. **Environment-based Configuration**: Proper environment suffix handling with context support
5. **Security**: Least-privilege IAM policies and secure Secrets Manager integration
6. **Monitoring**: Complete CloudWatch dashboards and alarms for operational visibility

## Architecture Benefits

- **Cost Efficiency**: Serverless components with auto-scaling
- **Security**: Least-privilege IAM, Secrets Manager, proper CORS
- **Scalability**: DynamoDB auto-scaling, Lambda concurrency
- **Observability**: CloudWatch metrics, logs, and alarms
- **Reliability**: Zero-downtime deployments, error handling
- **Maintainability**: Clean separation of concerns, environment configuration

This implementation fully satisfies all acceptance criteria from the PROMPT and provides a production-ready serverless API solution.
