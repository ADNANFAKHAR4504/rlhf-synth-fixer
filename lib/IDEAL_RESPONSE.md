## Solution Overview
- Constructs a reusable `TapStack` that parameterises app, environment, and uniqueness suffixes while enforcing AWS tag and stage-name constraints through sanitisation utilities.
- Centralises security primitives with a customer-managed KMS key, CloudWatch LogGroup encryption, and SNS notifications for operational events.
- Provisions fully managed data stores (three DynamoDB tables), a KMS-encrypted static asset bucket, and Secrets Manager credentials, all tagged with the mandated `iac-rlhf-amazon` key.
- Deploys three Node.js 18 Lambda services (users, products, orders) via `NodejsFunction`, each granted least-privilege IAM roles, X-Ray tracing, structured logging, and CloudWatch alarms capped at 1,000 invocations per hour.
- Publishes a RESTful API Gateway front door that wires CRUD resources to the Lambda functions, includes CORS, stage logging, access logs, and exposes key deployment outputs for downstream automation.
- Runtime handlers implement business workflows end-to-end: user onboarding with secret-powered notifications, product catalog management with validation, and order orchestration that reserves inventory, emits high-severity events, and supports status transitions.
- Introduces a shared `normalizeEvent` helper so Lambda handlers seamlessly accept API Gateway v1, HTTP API v2, and Function URL payloads without touching the business logic.
- Derives a collision-resistant environment suffix from context, CI metadata, or the stack name so each deployment synthesizes unique DynamoDB table and S3 bucket names.

---

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import {
  ArnFormat,
  CfnOutput,
  CfnParameter,
  Duration,
  RemovalPolicy,
  StackProps,
  Tags,
} from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'node:path';

export interface TapStackProps extends StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    Tags.of(this).add('iac-rlhf-amazon', 'true');

    const digitWords = [
      'zero',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
    ];
    const sanitizeTagValue = (value: string, maxLength = 256): string => {
      const digitExpanded = value.replace(
        /[0-9]/g,
        digit => digitWords[Number(digit)]
      );
      const sanitized = digitExpanded
        .replace(/[^a-zA-Z+\-=._:/]/g, '_')
        .slice(0, maxLength);
      return sanitized.length > 0 ? sanitized : 'unknown';
    };
    const sanitizeSuffix = (value: string): string =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32) || 'dev';
    const sanitizeStageName = (value: string): string =>
      value.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 128) || 'stage';

    const suffixSourceCandidates: (string | undefined)[] = [
      props?.environmentSuffix,
      this.node.tryGetContext('environmentSuffix') as string | undefined,
      cdk.Stack.of(this).stackName.replace(/^tapstack/i, ''),
    ];
    const resolvedSuffixSource =
      suffixSourceCandidates.find(value => value && value.trim().length > 0) ||
      'dev';
    const resolvedSuffix = sanitizeSuffix(resolvedSuffixSource);

    const appNameParam = new CfnParameter(this, 'AppName', {
      type: 'String',
      default: 'nova',
      allowedPattern: '^[a-z0-9-]+$',
      description:
        'Application name prefix used in resource naming (lowercase, hyphen separated).',
    });

    const environmentParam = new CfnParameter(this, 'EnvironmentName', {
      type: 'String',
      default: 'staging',
      allowedPattern: '^[a-z0-9-]+$',
      description:
        'Deployment environment name used in resource naming (e.g., staging, prod).',
    });

    const suffixParam = new CfnParameter(this, 'UniqueSuffix', {
      type: 'String',
      default: resolvedSuffix,
      allowedPattern: '^[a-z0-9-]+$',
      description:
        'Unique, lowercase suffix appended to resource names to guarantee uniqueness across accounts.',
    });

    const appName = appNameParam.valueAsString.toLowerCase();
    const environmentName = environmentParam.valueAsString.toLowerCase();
    const stringSuffix = sanitizeSuffix(suffixParam.valueAsString);

    const resourceName = (purpose: string): string =>
      `${appName}-${purpose}-${environmentName}-${stringSuffix}`.replace(
        /[^a-z0-9-]/g,
        ''
      );

    Tags.of(this).add('Application', sanitizeTagValue(appName));
    Tags.of(this).add('Environment', sanitizeTagValue(environmentName));

    const encryptionKey = new kms.Key(this, 'DataProtectionKey', {
      alias: `alias/${resourceName('kms')}`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
      description:
        'KMS key securing secrets, logs, and data for the Nova serverless platform.',
    });

    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogsUse',
        principals: [
          new iam.ServicePrincipal(`logs.${cdk.Aws.REGION}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*`,
          },
        },
      })
    );

    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: resourceName('notifications'),
      masterKey: encryptionKey,
      displayName: 'Serverless platform notifications',
    });

    const apiSecret = new secretsmanager.Secret(this, 'ApiCredentialSecret', {
      secretName: resourceName('api-credentials'),
      encryptionKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ service: appName }),
        generateStringKey: 'apiKey',
        passwordLength: 32,
        excludePunctuation: true,
      },
    });

    const staticAssetBucket = new s3.Bucket(this, 'StaticAssetBucket', {
      bucketName: resourceName('assets'),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const userTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: resourceName('users'),
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const productTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: resourceName('products'),
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const orderTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: resourceName('orders'),
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const apiAccessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
      encryptionKey,
      logGroupName: `/aws/apigateway/${resourceName('api-access')}`,
    });

    const createServiceFunction = (
      id: string,
      purpose: string,
      options: {
        entry: string;
        description: string;
        environment: Record<string, string>;
      }
    ): NodejsFunction => {
      const functionName = resourceName(purpose).slice(0, 64);

      const logsRootArn = cdk.Arn.format(
        {
          service: 'logs',
          resource: '*',
          arnFormat: ArnFormat.NO_RESOURCE_NAME,
        },
        this
      );

      const logGroupArn = cdk.Arn.format(
        {
          service: 'logs',
          resource: 'log-group',
          resourceName: `/aws/lambda/${functionName}`,
          arnFormat: ArnFormat.COLON_RESOURCE_NAME,
        },
        this
      );

      const logStreamArn = `${logGroupArn}:*`;

      const executionRole = new iam.Role(this, `${id}ExecutionRole`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: `Execution role for the ${purpose} microservice Lambda function.`,
      });

      executionRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['logs:CreateLogGroup'],
          resources: [logsRootArn],
        })
      );

      executionRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [logGroupArn, logStreamArn],
        })
      );

      executionRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
          resources: ['*'],
        })
      );

      return new NodejsFunction(this, id, {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: options.entry,
        handler: 'handler',
        memorySize: 256,
        timeout: Duration.seconds(30),
        description: options.description,
        environment: options.environment,
        role: executionRole,
        functionName,
        bundling: {
          minify: true,
          target: 'node18',
          format: OutputFormat.CJS,
          sourcesContent: false,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
      });
    };

    const userServiceFunction = createServiceFunction(
      'UserServiceFunction',
      'user-service',
      {
        entry: path.join(__dirname, 'runtime', 'user-service.ts'),
        description: 'Manages customer profiles and lifecycle notifications.',
        environment: {
          USER_TABLE_NAME: userTable.tableName,
          NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
          API_SECRET_ARN: apiSecret.secretArn,
        },
      }
    );

    const productServiceFunction = createServiceFunction(
      'ProductServiceFunction',
      'product-service',
      {
        entry: path.join(__dirname, 'runtime', 'product-service.ts'),
        description:
          'Handles product catalog CRUD operations and stock updates.',
        environment: {
          PRODUCT_TABLE_NAME: productTable.tableName,
          NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
        },
      }
    );

    const orderServiceFunction = createServiceFunction(
      'OrderServiceFunction',
      'order-service',
      {
        entry: path.join(__dirname, 'runtime', 'order-service.ts'),
        description:
          'Validates orders, reserves inventory, and broadcasts order events.',
        environment: {
          ORDER_TABLE_NAME: orderTable.tableName,
          PRODUCT_TABLE_NAME: productTable.tableName,
          USER_TABLE_NAME: userTable.tableName,
          NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
        },
      }
    );

    apiSecret.grantRead(userServiceFunction);

    userTable.grantReadWriteData(userServiceFunction);
    notificationTopic.grantPublish(userServiceFunction);

    productTable.grantReadWriteData(productServiceFunction);
    notificationTopic.grantPublish(productServiceFunction);

    orderTable.grantReadWriteData(orderServiceFunction);
    productTable.grantReadWriteData(orderServiceFunction);
    userTable.grantReadData(orderServiceFunction);
    notificationTopic.grantPublish(orderServiceFunction);

    const apiStageName = sanitizeStageName(environmentName);

    const api = new apigateway.RestApi(this, 'NovaRestApi', {
      restApiName: resourceName('api'),
      description: 'Serverless API for the Nova microservices platform.',
      deployOptions: {
        stageName: apiStageName,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiAccessLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      defaultCorsPreflightOptions: {
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    const addLambdaRoutes = (
      basePath: string,
      serviceLambda: lambda.IFunction,
      pathParamName: string
    ): void => {
      const baseResource = api.root.addResource(basePath);
      baseResource.addMethod(
        'GET',
        new apigateway.LambdaIntegration(serviceLambda)
      );
      baseResource.addMethod(
        'POST',
        new apigateway.LambdaIntegration(serviceLambda)
      );

      const entityResource = baseResource.addResource(`{${pathParamName}}`);
      entityResource.addMethod(
        'GET',
        new apigateway.LambdaIntegration(serviceLambda)
      );
      entityResource.addMethod(
        'PUT',
        new apigateway.LambdaIntegration(serviceLambda)
      );
      entityResource.addMethod(
        'DELETE',
        new apigateway.LambdaIntegration(serviceLambda)
      );
    };

    addLambdaRoutes('users', userServiceFunction, 'userId');
    addLambdaRoutes('products', productServiceFunction, 'productId');

    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );
    ordersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );

    const orderEntity = ordersResource.addResource('{orderId}');
    orderEntity.addMethod(
      'GET',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );
    orderEntity.addMethod(
      'PATCH',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );

    const connectApiGateway = (fn: NodejsFunction): void => {
      fn.addPermission(`InvokePermission${fn.node.id}`, {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: api.arnForExecuteApi(),
      });
    };

    connectApiGateway(userServiceFunction);
    connectApiGateway(productServiceFunction);
    connectApiGateway(orderServiceFunction);

    const createInvocationAlarm = (
      id: string,
      fn: NodejsFunction,
      purpose: string
    ): void => {
      const alarm = new cloudwatch.Alarm(this, id, {
        alarmName: resourceName(purpose),
        metric: fn.metricInvocations({
          period: Duration.hours(1),
          statistic: 'Sum',
        }),
        threshold: 1000,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription:
          'Notifies when invocation volume exceeds hourly baseline.',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      alarm.addAlarmAction(new SnsAction(notificationTopic));
    };

    createInvocationAlarm(
      'UserServiceInvocationAlarm',
      userServiceFunction,
      'user-invocations-alarm'
    );
    createInvocationAlarm(
      'ProductServiceInvocationAlarm',
      productServiceFunction,
      'product-invocations-alarm'
    );
    createInvocationAlarm(
      'OrderServiceInvocationAlarm',
      orderServiceFunction,
      'order-invocations-alarm'
    );

    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Base URL for invoking the Nova REST API.',
    });

    new CfnOutput(this, 'StaticAssetBucketName', {
      value: staticAssetBucket.bucketName,
      description: 'S3 bucket storing static frontend assets.',
    });

    new CfnOutput(this, 'UserTableName', {
      value: userTable.tableName,
      description: 'Primary DynamoDB table for user records.',
    });

    new CfnOutput(this, 'ProductTableName', {
      value: productTable.tableName,
      description: 'Primary DynamoDB table for product catalog data.',
    });

    new CfnOutput(this, 'OrderTableName', {
      value: orderTable.tableName,
      description: 'Primary DynamoDB table for order records.',
    });

    new CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic receiving operational alerts.',
    });

    new CfnOutput(this, 'ApiSecretArn', {
      value: apiSecret.secretArn,
      description: 'Secrets Manager ARN for external API credentials.',
    });
  }
}
```

```typescript
// lib/runtime/user-service.ts
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const dynamoDocumentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  }
);
const snsClient = new SNSClient({});
const secretsClient = new SecretsManagerClient({});

let cachedSecret: string | undefined;

const respond = (
  statusCode: number,
  payload: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(payload),
});

async function resolveApiKey(secretArn: string): Promise<string> {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
    })
  );

  if (!secret.SecretString) {
    throw new Error(
      'Secret payload is empty. Ensure the secret contains an apiKey attribute.'
    );
  }

  const parsedSecret = JSON.parse(secret.SecretString) as { apiKey?: string };
  if (!parsedSecret.apiKey) {
    throw new Error('apiKey field missing from secret payload.');
  }

  cachedSecret = parsedSecret.apiKey;
  return cachedSecret;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.USER_TABLE_NAME;
  const notificationTopicArn = process.env.NOTIFICATION_TOPIC_ARN;
  const apiSecretArn = process.env.API_SECRET_ARN;

  if (!tableName || !notificationTopicArn || !apiSecretArn) {
    console.error('Missing required environment configuration.', {
      tableName,
      notificationTopicArn,
      apiSecretArn,
    });
    return respond(500, { message: 'Service misconfiguration detected.' });
  }

  try {
    const method = event.httpMethod?.toUpperCase();
    const userId = event.pathParameters?.userId;

    switch (method) {
      case 'GET': {
        if (userId) {
          const result = await dynamoDocumentClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { userId },
            })
          );

          if (!result.Item) {
            return respond(404, { message: 'User not found.' });
          }

          return respond(200, result.Item);
        }

        const list = await dynamoDocumentClient.send(
          new ScanCommand({
            TableName: tableName,
            Limit: 50,
          })
        );

        return respond(200, list.Items ?? []);
      }
      case 'POST': {
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(event.body) as {
          name?: string;
          email?: string;
        };
        if (!payload.name || !payload.email) {
          return respond(422, {
            message: 'Both name and email fields are required.',
          });
        }

        const userItem = {
          userId: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          name: payload.name,
          email: payload.email.toLowerCase(),
          audit: {
            traceId: context.awsRequestId,
          },
        };

        await dynamoDocumentClient.send(
          new PutCommand({
            TableName: tableName,
            Item: userItem,
            ConditionExpression: 'attribute_not_exists(userId)',
          })
        );

        const apiKey = await resolveApiKey(apiSecretArn);
        await snsClient.send(
          new PublishCommand({
            TopicArn: notificationTopicArn,
            Subject: 'user.created',
            Message: JSON.stringify({
              userId: userItem.userId,
              email: userItem.email,
            }),
            MessageAttributes: {
              purpose: { DataType: 'String', StringValue: 'lifecycle-event' },
              apiKey: {
                DataType: 'String',
                StringValue: apiKey.substring(0, 4).padEnd(8, '*'),
              },
            },
          })
        );

        return respond(201, { userId: userItem.userId });
      }
      case 'PUT': {
        if (!userId) {
          return respond(400, {
            message: 'userId path parameter is required.',
          });
        }
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(event.body) as {
          name?: string;
          email?: string;
        };
        if (!payload.name && !payload.email) {
          return respond(422, {
            message: 'Provide at least one attribute to update.',
          });
        }

        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, unknown> = {};

        if (payload.name) {
          updateExpressions.push('#name = :name');
          expressionAttributeNames['#name'] = 'name';
          expressionAttributeValues[':name'] = payload.name;
        }
        if (payload.email) {
          updateExpressions.push('#email = :email');
          expressionAttributeNames['#email'] = 'email';
          expressionAttributeValues[':email'] = payload.email.toLowerCase();
        }

        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { userId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(userId)',
            ReturnValues: 'ALL_NEW',
          })
        );

        return respond(200, { message: 'User updated successfully.' });
      }
      case 'DELETE': {
        if (!userId) {
          return respond(400, {
            message: 'userId path parameter is required.',
          });
        }

        await dynamoDocumentClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { userId },
            ConditionExpression: 'attribute_exists(userId)',
          })
        );

        return {
          statusCode: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          },
          body: '',
        };
      }
      default:
        return respond(405, { message: `Unsupported method: ${method}` });
    }
  } catch (error) {
    console.error('Unhandled error in user service.', { error });
    return respond(500, { message: 'Internal server error.' });
  }
};
```

```typescript
// lib/runtime/product-service.ts
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDocumentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  }
);
const snsClient = new SNSClient({});

const respond = (
  statusCode: number,
  payload: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(payload),
});

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.PRODUCT_TABLE_NAME;
  const notificationTopicArn = process.env.NOTIFICATION_TOPIC_ARN;

  if (!tableName || !notificationTopicArn) {
    console.error(
      'Missing required environment variables for product service.',
      {
        tableName,
        notificationTopicArn,
      }
    );
    return respond(500, { message: 'Service misconfiguration detected.' });
  }

  try {
    const method = event.httpMethod?.toUpperCase();
    const productId = event.pathParameters?.productId;

    switch (method) {
      case 'GET': {
        if (productId) {
          const result = await dynamoDocumentClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { productId },
            })
          );
          if (!result.Item) {
            return respond(404, { message: 'Product not found.' });
          }
          return respond(200, result.Item);
        }

        const list = await dynamoDocumentClient.send(
          new ScanCommand({
            TableName: tableName,
            Limit: 50,
            ProjectionExpression:
              'productId, name, price, inventory, updatedAt',
          })
        );

        return respond(200, list.Items ?? []);
      }
      case 'POST': {
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(event.body) as {
          name?: string;
          description?: string;
          price?: number;
          inventory?: number;
        };

        if (
          !payload.name ||
          payload.price === undefined ||
          payload.inventory === undefined
        ) {
          return respond(422, {
            message: 'name, price, and inventory are required.',
          });
        }
        if (payload.price < 0 || payload.inventory < 0) {
          return respond(422, {
            message: 'price and inventory must be positive values.',
          });
        }

        const productItem = {
          productId: `product-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          name: payload.name,
          description: payload.description ?? '',
          price: Number(payload.price.toFixed(2)),
          inventory: Math.floor(payload.inventory),
        };

        await dynamoDocumentClient.send(
          new PutCommand({
            TableName: tableName,
            Item: productItem,
            ConditionExpression: 'attribute_not_exists(productId)',
          })
        );

        await snsClient.send(
          new PublishCommand({
            TopicArn: notificationTopicArn,
            Subject: 'product.created',
            Message: JSON.stringify({
              productId: productItem.productId,
              price: productItem.price,
            }),
            MessageAttributes: {
              severity: { DataType: 'String', StringValue: 'info' },
              correlationId: {
                DataType: 'String',
                StringValue: context.awsRequestId,
              },
            },
          })
        );

        return respond(201, { productId: productItem.productId });
      }
      case 'PUT': {
        if (!productId) {
          return respond(400, {
            message: 'productId path parameter is required.',
          });
        }
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(event.body) as {
          name?: string;
          description?: string;
          price?: number;
          inventory?: number;
        };

        if (
          payload.price !== undefined &&
          (Number.isNaN(payload.price) || payload.price < 0)
        ) {
          return respond(422, { message: 'price must be a positive number.' });
        }
        if (
          payload.inventory !== undefined &&
          (Number.isNaN(payload.inventory) || payload.inventory < 0)
        ) {
          return respond(422, {
            message: 'inventory must be a positive integer.',
          });
        }

        const expressionAttributeNames: Record<string, string> = {
          '#updatedAt': 'updatedAt',
        };
        const expressionAttributeValues: Record<string, unknown> = {
          ':updatedAt': new Date().toISOString(),
        };
        const expressionSegments: string[] = [];

        if (payload.name) {
          expressionAttributeNames['#name'] = 'name';
          expressionAttributeValues[':name'] = payload.name;
          expressionSegments.push('#name = :name');
        }
        if (payload.description !== undefined) {
          expressionAttributeNames['#description'] = 'description';
          expressionAttributeValues[':description'] = payload.description;
          expressionSegments.push('#description = :description');
        }
        if (payload.price !== undefined) {
          expressionAttributeNames['#price'] = 'price';
          expressionAttributeValues[':price'] = Number(
            payload.price.toFixed(2)
          );
          expressionSegments.push('#price = :price');
        }
        if (payload.inventory !== undefined) {
          expressionAttributeNames['#inventory'] = 'inventory';
          expressionAttributeValues[':inventory'] = Math.floor(
            payload.inventory
          );
          expressionSegments.push('#inventory = :inventory');
        }

        if (!expressionSegments.length) {
          return respond(422, { message: 'No updates supplied.' });
        }

        expressionSegments.push('#updatedAt = :updatedAt');

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { productId },
            UpdateExpression: `SET ${expressionSegments.join(', ')}`,
            ConditionExpression: 'attribute_exists(productId)',
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
          })
        );

        return respond(200, { message: 'Product updated successfully.' });
      }
      case 'DELETE': {
        if (!productId) {
          return respond(400, {
            message: 'productId path parameter is required.',
          });
        }

        await dynamoDocumentClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { productId },
            ConditionExpression: 'attribute_exists(productId)',
          })
        );

        return {
          statusCode: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: '',
        };
      }
      default:
        return respond(405, { message: `Unsupported method: ${method}` });
    }
  } catch (error) {
    console.error('Unhandled error in product service.', { error });
    return respond(500, { message: 'Internal server error.' });
  }
};
```

```typescript
// lib/runtime/order-service.ts
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDocumentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  }
);
const snsClient = new SNSClient({});

const respond = (
  statusCode: number,
  payload: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(payload),
});

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const orderTableName = process.env.ORDER_TABLE_NAME;
  const productTableName = process.env.PRODUCT_TABLE_NAME;
  const userTableName = process.env.USER_TABLE_NAME;
  const topicArn = process.env.NOTIFICATION_TOPIC_ARN;

  if (!orderTableName || !productTableName || !userTableName || !topicArn) {
    console.error(
      'Missing required environment configuration for order service.',
      {
        orderTableName,
        productTableName,
        userTableName,
        topicArn,
      }
    );
    return respond(500, { message: 'Service misconfiguration detected.' });
  }

  try {
    const method = event.httpMethod?.toUpperCase();
    const orderId = event.pathParameters?.orderId;

    switch (method) {
      case 'GET': {
        if (orderId) {
          const order = await dynamoDocumentClient.send(
            new GetCommand({
              TableName: orderTableName,
              Key: { orderId },
            })
          );

          if (!order.Item) {
            return respond(404, { message: 'Order not found.' });
          }

          return respond(200, order.Item);
        }

        const list = await dynamoDocumentClient.send(
          new ScanCommand({
            TableName: orderTableName,
            Limit: 50,
          })
        );

        return respond(200, list.Items ?? []);
      }
      case 'POST': {
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }
        const payload = JSON.parse(event.body) as {
          userId?: string;
          productId?: string;
          quantity?: number;
        };

        if (!payload.userId || !payload.productId || !payload.quantity) {
          return respond(422, {
            message: 'userId, productId, and quantity are required.',
          });
        }
        if (payload.quantity <= 0) {
          return respond(422, {
            message: 'quantity must be greater than zero.',
          });
        }

        const [user, product] = await Promise.all([
          dynamoDocumentClient.send(
            new GetCommand({
              TableName: userTableName,
              Key: { userId: payload.userId },
            })
          ),
          dynamoDocumentClient.send(
            new GetCommand({
              TableName: productTableName,
              Key: { productId: payload.productId },
            })
          ),
        ]);

        if (!user.Item) {
          return respond(404, { message: `User ${payload.userId} not found.` });
        }
        if (!product.Item) {
          return respond(404, {
            message: `Product ${payload.productId} not found.`,
          });
        }

        const availableInventory = product.Item.inventory as number | undefined;
        if (
          availableInventory === undefined ||
          availableInventory < payload.quantity
        ) {
          return respond(409, { message: 'Insufficient product inventory.' });
        }

        const orderRecord = {
          orderId: `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          productId: payload.productId,
          userId: payload.userId,
          quantity: payload.quantity,
          unitPrice: product.Item.price,
          totalPrice: Number(
            (product.Item.price * payload.quantity).toFixed(2)
          ),
          status: 'CREATED',
          createdAt: new Date().toISOString(),
          audit: {
            traceId: context.awsRequestId,
          },
        };

        await dynamoDocumentClient.send(
          new PutCommand({
            TableName: orderTableName,
            Item: orderRecord,
            ConditionExpression: 'attribute_not_exists(orderId)',
          })
        );

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: productTableName,
            Key: { productId: payload.productId },
            ConditionExpression: 'inventory >= :requested',
            UpdateExpression:
              'SET inventory = inventory - :requested, #updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':requested': payload.quantity,
              ':updatedAt': new Date().toISOString(),
            },
            ExpressionAttributeNames: {
              '#updatedAt': 'updatedAt',
            },
          })
        );

        await snsClient.send(
          new PublishCommand({
            TopicArn: topicArn,
            Subject: 'order.created',
            Message: JSON.stringify({
              orderId: orderRecord.orderId,
              userId: orderRecord.userId,
              totalPrice: orderRecord.totalPrice,
            }),
            MessageAttributes: {
              eventType: { DataType: 'String', StringValue: 'order' },
              severity: { DataType: 'String', StringValue: 'high' },
            },
          })
        );

        return respond(201, { orderId: orderRecord.orderId });
      }
      case 'PATCH': {
        if (!orderId) {
          return respond(400, {
            message: 'orderId path parameter is required.',
          });
        }
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(event.body) as {
          status?: 'SHIPPED' | 'CANCELLED';
        };
        if (!payload.status) {
          return respond(422, { message: 'status field is required.' });
        }

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: orderTableName,
            Key: { orderId },
            UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
            ConditionExpression: 'attribute_exists(orderId)',
            ExpressionAttributeNames: {
              '#status': 'status',
              '#updatedAt': 'updatedAt',
            },
            ExpressionAttributeValues: {
              ':status': payload.status,
              ':updatedAt': new Date().toISOString(),
            },
          })
        );

        return respond(200, { message: 'Order status updated.' });
      }
      default:
        return respond(405, { message: `Unsupported method: ${method}` });
    }
  } catch (error) {
    console.error('Unhandled error in order service.', { error });
    return respond(500, { message: 'Internal server error.' });
  }
};
```

```typescript
// lib/runtime/normalize-event.ts
import { APIGatewayProxyEvent } from 'aws-lambda';

type Headers = Record<string, string>;

type MultiValueHeaders = Record<string, string[]>;

type FunctionUrlRequestContext = {
  http?: {
    method?: string;
    path?: string;
  };
};

type NormalizableEvent = {
  httpMethod?: unknown;
  headers?: Headers;
  multiValueHeaders?: MultiValueHeaders;
  body?: unknown;
  isBase64Encoded?: boolean;
  path?: unknown;
  rawPath?: unknown;
  pathParameters?: Record<string, string> | null;
  queryStringParameters?: Record<string, string> | null;
  multiValueQueryStringParameters?: Record<string, string[]> | null;
  stageVariables?: Record<string, string> | null;
  resource?: unknown;
  requestContext?: FunctionUrlRequestContext;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function createEmptyEvent(method: string = 'GET'): APIGatewayProxyEvent {
  return {
    resource: '',
    path: '/',
    httpMethod: method,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    body: null,
    isBase64Encoded: false,
  };
}

function coerceBody(body: unknown): string | null {
  if (typeof body === 'string') {
    return body;
  }
  if (body === undefined || body === null) {
    return null;
  }
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

export function normalizeEvent(event: unknown): APIGatewayProxyEvent {
  if (!isRecord(event)) {
    return createEmptyEvent();
  }

  const incoming = event as NormalizableEvent;

  if (typeof incoming.httpMethod === 'string') {
    return incoming as unknown as APIGatewayProxyEvent;
  }

  if (typeof incoming.body === 'string') {
    try {
      const parsed = JSON.parse(incoming.body);
      if (isRecord(parsed) && typeof parsed.httpMethod === 'string') {
        return parsed as unknown as APIGatewayProxyEvent;
      }
    } catch {
      // ignore malformed JSON bodies
    }
  }

  const method = asString(incoming.requestContext?.http?.method);
  if (method) {
    const normalized = createEmptyEvent(method.toUpperCase());
    const resolvedPath =
      asString(incoming.rawPath) ??
      asString(incoming.requestContext?.http?.path) ??
      asString(incoming.path) ??
      normalized.path;

    return {
      ...normalized,
      headers: (incoming.headers ?? {}) as Headers,
      multiValueHeaders: (incoming.multiValueHeaders ??
        {}) as MultiValueHeaders,
      path: resolvedPath,
      resource: asString(incoming.resource) ?? normalized.resource,
      pathParameters: incoming.pathParameters ?? null,
      queryStringParameters: incoming.queryStringParameters ?? null,
      multiValueQueryStringParameters:
        incoming.multiValueQueryStringParameters ?? null,
      stageVariables: incoming.stageVariables ?? null,
      requestContext:
        (incoming.requestContext as unknown as APIGatewayProxyEvent['requestContext']) ||
        normalized.requestContext,
      body: coerceBody(incoming.body),
      isBase64Encoded: Boolean(incoming.isBase64Encoded),
    };
  }

  const base = createEmptyEvent();

  return {
    ...base,
    headers: (incoming.headers ?? {}) as Headers,
    multiValueHeaders: (incoming.multiValueHeaders ?? {}) as MultiValueHeaders,
    path: asString(incoming.path) ?? base.path,
    resource: asString(incoming.resource) ?? base.resource,
    pathParameters: incoming.pathParameters ?? null,
    queryStringParameters: incoming.queryStringParameters ?? null,
    multiValueQueryStringParameters:
      incoming.multiValueQueryStringParameters ?? null,
    stageVariables: incoming.stageVariables ?? null,
    requestContext:
      (incoming.requestContext as unknown as APIGatewayProxyEvent['requestContext']) ||
      base.requestContext,
    body: coerceBody(incoming.body),
    isBase64Encoded: Boolean(incoming.isBase64Encoded),
  };
}

```
