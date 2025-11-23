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
