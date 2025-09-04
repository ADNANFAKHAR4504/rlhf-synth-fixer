/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the TAP serverless infrastructure.
 * Creates API Gateway, Lambda, and DynamoDB resources with secure IAM roles.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi component resource for the TAP serverless infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly functionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // DynamoDB Table with warm throughput for performance
    const table = new aws.dynamodb.Table(
      `tap-table-${environmentSuffix}`,
      {
        name: `tap-items-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        // Enable warm throughput for better performance during traffic spikes
        tableClass: 'STANDARD',
        // Configure warm throughput for predictable performance
        onDemandThroughput: {
          maxReadRequestUnits: 4000,
          maxWriteRequestUnits: 4000,
        },
        tags: {
          ...tags,
          Name: `tap-items-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Role for Lambda execution
    const lambdaRole = new aws.iam.Role(
      `tap-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `tap-lambda-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Policy for Lambda to access DynamoDB with least privilege
    const lambdaPolicy = new aws.iam.RolePolicy(
      `tap-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([table.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: `arn:aws:logs:*:*:log-group:/aws/lambda/tap-api-handler-${environmentSuffix}*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Lambda Function with inline code
    const lambdaFunction = new aws.lambda.Function(
      `tap-function-${environmentSuffix}`,
      {
        name: `tap-api-handler-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // API Gateway v2 (HTTP API) event structure
    const httpMethod = event.requestContext?.http?.method || event.httpMethod;
    const { pathParameters, body } = event;
    const id = pathParameters?.id;

    switch (httpMethod) {
      case 'OPTIONS':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'CORS preflight successful' }),
        };

      case 'GET':
        if (id) {
          // Get single item
          const result = await dynamodb.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { id },
          }));
          
          if (!result.Item) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Item not found' }),
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.Item),
          };
        } else {
          // Scan all items
          const result = await dynamodb.send(new ScanCommand({
            TableName: TABLE_NAME,
          }));
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              items: result.Items,
              count: result.Count,
            }),
          };
        }

      case 'POST':
        const createData = JSON.parse(body);
        if (!createData.id) {
          createData.id = Date.now().toString();
        }
        
        await dynamodb.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            ...createData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }));
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: 'Item created successfully',
            id: createData.id,
          }),
        };

      case 'PUT':
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID parameter required' }),
          };
        }
        
        const updateData = JSON.parse(body);
        delete updateData.id; // Prevent ID modification
        
        await dynamodb.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id },
          UpdateExpression: 'SET updatedAt = :updatedAt' + 
            Object.keys(updateData).map((key, index) => \`, \${key} = :val\${index}\`).join(''),
          ExpressionAttributeValues: {
            ':updatedAt': new Date().toISOString(),
            ...Object.keys(updateData).reduce((acc, key, index) => {
              acc[\`:val\${index}\`] = updateData[key];
              return acc;
            }, {}),
          },
        }));
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Item updated successfully' }),
        };

      case 'DELETE':
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID parameter required' }),
          };
        }
        
        await dynamodb.send(new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id },
        }));
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Item deleted successfully' }),
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
        `),
        }),
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 30,
        memorySize: 256,
        environment: {
          variables: {
            TABLE_NAME: table.name,
          },
        },
        // Enable Application Signals for monitoring
        loggingConfig: {
          logFormat: 'JSON',
          logGroup: `/aws/lambda/tap-api-handler-${environmentSuffix}`,
        },
        tags: {
          ...tags,
          Name: `tap-api-handler-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        parent: this,
        dependsOn: [lambdaPolicy],
      }
    );

    // CloudWatch Log Group for Lambda
    new aws.cloudwatch.LogGroup(
      `tap-lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/tap-api-handler-${environmentSuffix}`,
        retentionInDays: 14,
        tags: {
          ...tags,
          Name: `tap-lambda-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [lambdaFunction] }
    );

    // API Gateway HTTP API (v2) for better performance
    const api = new aws.apigatewayv2.Api(
      `tap-api-${environmentSuffix}`,
      {
        name: `tap-serverless-api-${environmentSuffix}`,
        protocolType: 'HTTP',
        corsConfiguration: {
          allowCredentials: false,
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowOrigins: ['*'],
          allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Security-Token',
          ],
          maxAge: 86400,
        },
        tags: {
          ...tags,
          Name: `tap-serverless-api-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Lambda permission for API Gateway
    const lambdaPermission = new aws.lambda.Permission(
      `tap-lambda-permission-${environmentSuffix}`,
      {
        statementId: 'AllowExecutionFromAPIGateway',
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // API Gateway Integration
    const integration = new aws.apigatewayv2.Integration(
      `tap-integration-${environmentSuffix}`,
      {
        apiId: api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: lambdaFunction.invokeArn,
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
      },
      {
        parent: this,
        dependsOn: [lambdaPermission],
      }
    );

    // API Routes
    const routes = [
      // GET /items - list all items
      new aws.apigatewayv2.Route(
        `tap-route-list-${environmentSuffix}`,
        {
          apiId: api.id,
          routeKey: 'GET /items',
          target: pulumi.interpolate`integrations/${integration.id}`,
        },
        { parent: this }
      ),

      // GET /items/{id} - get single item
      new aws.apigatewayv2.Route(
        `tap-route-get-${environmentSuffix}`,
        {
          apiId: api.id,
          routeKey: 'GET /items/{id}',
          target: pulumi.interpolate`integrations/${integration.id}`,
        },
        { parent: this }
      ),

      // POST /items - create item
      new aws.apigatewayv2.Route(
        `tap-route-create-${environmentSuffix}`,
        {
          apiId: api.id,
          routeKey: 'POST /items',
          target: pulumi.interpolate`integrations/${integration.id}`,
        },
        { parent: this }
      ),

      // PUT /items/{id} - update item
      new aws.apigatewayv2.Route(
        `tap-route-update-${environmentSuffix}`,
        {
          apiId: api.id,
          routeKey: 'PUT /items/{id}',
          target: pulumi.interpolate`integrations/${integration.id}`,
        },
        { parent: this }
      ),

      // DELETE /items/{id} - delete item
      new aws.apigatewayv2.Route(
        `tap-route-delete-${environmentSuffix}`,
        {
          apiId: api.id,
          routeKey: 'DELETE /items/{id}',
          target: pulumi.interpolate`integrations/${integration.id}`,
        },
        { parent: this }
      ),

      // OPTIONS for CORS preflight
      new aws.apigatewayv2.Route(
        `tap-route-options-${environmentSuffix}`,
        {
          apiId: api.id,
          routeKey: 'OPTIONS /items',
          target: pulumi.interpolate`integrations/${integration.id}`,
        },
        { parent: this }
      ),

      new aws.apigatewayv2.Route(
        `tap-route-options-id-${environmentSuffix}`,
        {
          apiId: api.id,
          routeKey: 'OPTIONS /items/{id}',
          target: pulumi.interpolate`integrations/${integration.id}`,
        },
        { parent: this }
      ),
    ];

    // API Gateway Stage
    new aws.apigatewayv2.Stage(
      `tap-stage-${environmentSuffix}`,
      {
        apiId: api.id,
        name: '$default',
        autoDeploy: true,
        tags: {
          ...tags,
          Name: `tap-stage-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        parent: this,
        dependsOn: routes,
      }
    );

    // Export outputs
    this.apiUrl = api.apiEndpoint;
    this.tableName = table.name;
    this.functionName = lambdaFunction.name;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      tableName: this.tableName,
      functionName: this.functionName,
    });
  }
}
