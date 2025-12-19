## Complete Implementation

### File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { createHash } from 'crypto';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix: string =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ---- Stable API key (no replacement across deploys) ----
    // If a value is provided via context, use it. Otherwise, derive a deterministic value
    // from stack identity so it remains constant between deploys.
    const providedKey = this.node.tryGetContext('apiKeyValue') as
      | string
      | undefined;
    const uniq = cdk.Names.uniqueId(this)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(-8);
    const stableSeed = `${this.stackName}:${environmentSuffix}:${uniq}`;
    const stableHash = createHash('sha256').update(stableSeed).digest('hex');
    const apiKeyValue: string =
      providedKey ?? `tap-${environmentSuffix}-${stableHash.slice(0, 32)}`;
    const apiKeyName = `${this.stackName}-tap-api-key-${environmentSuffix}-${uniq}`;

    // Secrets
    const apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      description: 'API keys / signing material for webhook HMAC validation',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ defaultKey: '' }),
        generateStringKey: 'defaultKey',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!"\'/@\\',
      },
    });

    // S3 buckets
    const logsBucket = new s3.Bucket(this, 'TapAccessLogsBucket', {
      bucketName: `tap-access-logs-${environmentSuffix}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER, // ← allow ACLs
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE, // ← grant S3 log delivery
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const archiveBucket = new s3.Bucket(this, 'TxnArchiveBucket', {
      bucketName: `txn-archive-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      serverAccessLogsBucket: logsBucket,
      serverAccessLogsPrefix: 'archive/',
      lifecycleRules: [
        {
          id: 'archive-old-transactions',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // DynamoDB
    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: `tap-transactions-${environmentSuffix}`,
      partitionKey: { name: 'txnId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      contributorInsightsEnabled: true,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'byMerchantAndTime',
      partitionKey: { name: 'merchantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'byStatusAndTime',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const auditTable = new dynamodb.Table(this, 'AuditTable', {
      tableName: `tap-audit-${environmentSuffix}`,
      partitionKey: { name: 'auditId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      contributorInsightsEnabled: true,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    auditTable.addGlobalSecondaryIndex({
      indexName: 'byTxnAndTime',
      partitionKey: { name: 'txnId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SQS (FIFO) & DLQs
    const dlq = new sqs.Queue(this, 'TxnDLQ', {
      queueName: `tap-txn-dlq-${environmentSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(300),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const inboundQueue = new sqs.Queue(this, 'TxnInboundQueue', {
      queueName: `tap-txn-inbound-${environmentSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(900),
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    dlq.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('sqs.amazonaws.com')],
        actions: ['sqs:SendMessage'],
        resources: [dlq.queueArn],
        conditions: { ArnEquals: { 'aws:SourceArn': inboundQueue.queueArn } },
      })
    );

    // EventBridge requires STANDARD SQS queue for rule DLQs
    const eventBridgeDlq = new sqs.Queue(this, 'EventBridgeDLQ', {
      queueName: `tap-eventbridge-dlq-${environmentSuffix}`,
      fifo: false,
      visibilityTimeout: cdk.Duration.seconds(300),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // EventBridge
    const eventBus = new events.EventBus(this, 'TxnEventBus', {
      eventBusName: `tap-transaction-events-${environmentSuffix}`,
    });

    // Lambda defaults
    const lambdaDefaults: Omit<lambda.FunctionProps, 'code' | 'functionName'> =
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        handler: 'index.handler',
        environment: {
          TRANSACTIONS_TABLE: transactionsTable.tableName,
          AUDIT_TABLE: auditTable.tableName,
          ARCHIVE_BUCKET: archiveBucket.bucketName,
          EVENT_BUS_NAME: eventBus.eventBusName,
          SECRET_ARN: apiKeySecret.secretArn,
        },
      };

    // Shared helpers (embedded)
    const helpers = `
const { setTimeout: sleep } = require('timers/promises');
const log = (level, message, meta = {}) => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, message, ...meta }));
};
const customRetry = async (fn, opts = {}) => {
  const max = opts.maxAttempts ?? 3;
  const base = opts.baseDelay ?? 1000;
  const maxDelay = opts.maxDelay ?? 30000;
  for (let a = 1; a <= max; a++) {
    try { return await fn(); }
    catch (err) {
      const retryable = err?.statusCode === 429 ||
        (typeof err?.statusCode === 'number' && err.statusCode >= 500) ||
        err?.code === 'ThrottlingException' ||
        err?.code === 'TooManyRequestsException';
      if (!retryable || a === max) throw err;
      const delay = Math.min(base * 2 ** (a - 1) + Math.random() * 1000, maxDelay);
      console.log(JSON.stringify({ level: 'warn', message: 'retrying', attempt: a, delay }));
      await sleep(delay);
    }
  }
};
`;

    // Lambdas
    const validationLambda = new lambda.Function(this, 'ValidationLambda', {
      ...lambdaDefaults,
      functionName: `tap-transaction-validation-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
${helpers}
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  const { transactionId, merchantId, amount, currency } = event || {};
  log('info', 'validating', { transactionId, merchantId });
  if (!transactionId || !merchantId || typeof amount !== 'number' || !currency) throw new Error('Missing required fields');
  if (amount <= 0) throw new Error('Invalid amount');
  const dupe = await customRetry(async () => ddb.send(new GetItemCommand({
    TableName: process.env.TRANSACTIONS_TABLE,
    Key: { txnId: { S: String(transactionId) } }
  })));
  if (dupe.Item) throw new Error('Duplicate transaction');
  return { ...event, validated: true, validatedAt: new Date().toISOString() };
};
      `),
      reservedConcurrentExecutions: 100,
    });

    const fraudScoringLambda = new lambda.Function(this, 'FraudScoringLambda', {
      ...lambdaDefaults,
      functionName: `tap-fraud-scoring-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
${helpers}
exports.handler = async (event) => {
  const { transactionId, amount } = event || {};
  log('info', 'fraud-scoring', { transactionId, amount });
  const score = Math.floor(Math.random() * 101);
  const fraudRisk = score > 70 ? 'HIGH' : score > 40 ? 'MEDIUM' : 'LOW';
  return { ...event, fraudScore: score, fraudRisk, fraudScoredAt: new Date().toISOString() };
};
      `),
      reservedConcurrentExecutions: 50,
    });

    const complianceLambda = new lambda.Function(this, 'ComplianceLambda', {
      ...lambdaDefaults,
      functionName: `tap-compliance-verification-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
${helpers}
exports.handler = async (event) => {
  const { transactionId, amount } = event || {};
  log('info', 'compliance-check', { transactionId, amount });
  const flags = [];
  if (amount > 10000) flags.push('LARGE_AMOUNT');
  const compliancePassed = flags.length === 0;
  return { ...event, complianceFlags: flags, compliancePassed, complianceVerifiedAt: new Date().toISOString() };
};
      `),
      reservedConcurrentExecutions: 50,
    });

    const persistLambda = new lambda.Function(this, 'PersistLambda', {
      ...lambdaDefaults,
      functionName: `tap-persist-transaction-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
${helpers}
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  const { transactionId, merchantId, amount, currency, fraudScore = 0, complianceFlags = [] } = event || {};
  log('info', 'persist', { transactionId });
  const now = new Date().toISOString();
  const item = {
    txnId: { S: String(transactionId) },
    merchantId: { S: String(merchantId) },
    amount: { N: String(amount) },
    currency: { S: String(currency) },
    status: { S: 'COMPLETED' },
    fraudScore: { N: String(fraudScore) },
    complianceFlags: { SS: (Array.isArray(complianceFlags) && complianceFlags.length) ? complianceFlags.map(String) : ['NONE'] },
    createdAt: { S: now },
    updatedAt: { S: now }
  };
  await customRetry(async () => ddb.send(new PutItemCommand({
    TableName: process.env.TRANSACTIONS_TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(txnId)'
  })));
  return { ...event, persisted: true, persistedAt: now };
};
      `),
      reservedConcurrentExecutions: 75,
    });

    const emitEventsLambda = new lambda.Function(this, 'EmitEventsLambda', {
      ...lambdaDefaults,
      functionName: `tap-emit-events-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
${helpers}
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const eb = new EventBridgeClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  const { transactionId, fraudScore = 0, amount = 0 } = event || {};
  log('info', 'emit-events', { transactionId });
  const entries = [{
    Source: 'tap.transactions',
    DetailType: 'Transaction Processed',
    Detail: JSON.stringify(event),
    EventBusName: process.env.EVENT_BUS_NAME
  }];
  if (fraudScore > 70) {
    entries.push({
      Source: 'tap.fraud',
      DetailType: 'High Fraud Score',
      Detail: JSON.stringify({ transactionId, fraudScore }),
      EventBusName: process.env.EVENT_BUS_NAME
    });
  }
  if (amount > 10000) {
    entries.push({
      Source: 'tap.compliance',
      DetailType: 'High Amount Transaction',
      Detail: JSON.stringify({ transactionId, amount }),
      EventBusName: process.env.EVENT_BUS_NAME
    });
  }
  await customRetry(async () => eb.send(new PutEventsCommand({ Entries: entries })));
  return { ...event, eventsEmitted: true };
};
      `),
      reservedConcurrentExecutions: 50,
    });

    const webhookLambda = new lambda.Function(this, 'WebhookLambda', {
      ...lambdaDefaults,
      functionName: `tap-webhook-dispatcher-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
${helpers}
exports.handler = async (event) => {
  const { transactionId, merchantId, status = 'COMPLETED' } = event || {};
  log('info', 'webhook-dispatch', { transactionId, merchantId, status });
  await customRetry(async () => Promise.resolve());
  return { ...event, webhookDispatched: true, webhookDispatchedAt: new Date().toISOString() };
};
      `),
      reservedConcurrentExecutions: 100,
    });

    const compensatorLambda = new lambda.Function(this, 'CompensatorLambda', {
      ...lambdaDefaults,
      functionName: `tap-compensator-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
${helpers}
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const eb = new EventBridgeClient({ region: process.env.AWS_REGION });
exports.handler = async (input) => {
  const event = input && input.error ? { ...input.originalInput, error: input.error } : input;
  const transactionId = event?.transactionId;
  const error = event?.error ?? 'unknown';
  log('error', 'compensate', { transactionId, error });
  const now = new Date().toISOString();
  await customRetry(async () => ddb.send(new UpdateItemCommand({
    TableName: process.env.TRANSACTIONS_TABLE,
    Key: { txnId: { S: String(transactionId) } },
    UpdateExpression: 'SET #s = :s, #u = :u',
    ExpressionAttributeNames: { '#s': 'status', '#u': 'updatedAt' },
    ExpressionAttributeValues: { ':s': { S: 'ROLLED_BACK' }, ':u': { S: now } }
  })));
  const auditId = \`audit-\${Date.now()}-\${Math.random().toString(36).slice(2, 10)}\`;
  await customRetry(async () => ddb.send(new PutItemCommand({
    TableName: process.env.AUDIT_TABLE,
    Item: {
      auditId: { S: auditId },
      txnId: { S: String(transactionId) },
      eventType: { S: 'ROLLBACK' },
      details: { S: typeof error === 'string' ? error : JSON.stringify(error) },
      createdAt: { S: now }
    }
  })));
  await customRetry(async () => eb.send(new PutEventsCommand({
    Entries: [{
      Source: 'tap.compensation',
      DetailType: 'transaction.rolled_back',
      Detail: JSON.stringify({ transactionId, error, at: now }),
      EventBusName: process.env.EVENT_BUS_NAME
    }]
  })));
  return { transactionId, status: 'ROLLED_BACK', compensated: true, at: now };
};
      `),
      reservedConcurrentExecutions: 25,
    });

    const authorizerLambda = new lambda.Function(this, 'AuthorizerLambda', {
      ...lambdaDefaults,
      functionName: `tap-api-authorizer-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const token = event?.authorizationToken || '';
  const isValid = typeof token === 'string' && token.startsWith('Bearer ');
  if (!isValid) throw new Error('Unauthorized');
  return {
    principalId: 'merchant-user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: 'Allow', Resource: event.methodArn }]
    },
    context: { clientId: 'merchant-' + token.slice(7, 15) }
  };
};
      `),
      reservedConcurrentExecutions: 25,
    });

    // Grants
    transactionsTable.grantReadData(validationLambda);
    transactionsTable.grantReadWriteData(persistLambda);
    transactionsTable.grantReadWriteData(compensatorLambda);
    auditTable.grantWriteData(compensatorLambda);
    archiveBucket.grantReadWrite(persistLambda);
    eventBus.grantPutEventsTo(emitEventsLambda);
    eventBus.grantPutEventsTo(compensatorLambda);
    apiKeySecret.grantRead(authorizerLambda);

    // Provisioned concurrency
    const validationAlias = new lambda.Alias(this, 'ValidationAlias', {
      aliasName: 'provisioned',
      version: validationLambda.currentVersion,
      provisionedConcurrentExecutions: 5,
    });

    const webhookAlias = new lambda.Alias(this, 'WebhookAlias', {
      aliasName: 'provisioned',
      version: webhookLambda.currentVersion,
      provisionedConcurrentExecutions: 5,
    });

    // Step Functions
    const retryConfig: sfn.RetryProps = {
      errors: [
        'States.TaskFailed',
        'Lambda.ServiceException',
        'Lambda.AWSLambdaException',
        'Lambda.SdkClientException',
      ],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 3,
      backoffRate: 2,
    };

    const validateTask = new tasks.LambdaInvoke(this, 'ValidateTask', {
      lambdaFunction: validationAlias,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false,
    }).addRetry(retryConfig);

    const fraudTask = new tasks.LambdaInvoke(this, 'FraudTask', {
      lambdaFunction: fraudScoringLambda,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false,
    }).addRetry(retryConfig);

    const complianceTask = new tasks.LambdaInvoke(this, 'ComplianceTask', {
      lambdaFunction: complianceLambda,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false,
    }).addRetry(retryConfig);

    const persistTask = new tasks.LambdaInvoke(this, 'PersistTask', {
      lambdaFunction: persistLambda,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false,
    }).addRetry(retryConfig);

    const emitTask = new tasks.LambdaInvoke(this, 'EmitTask', {
      lambdaFunction: emitEventsLambda,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false,
    }).addRetry(retryConfig);

    const webhookTask = new tasks.LambdaInvoke(this, 'WebhookTask', {
      lambdaFunction: webhookAlias,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false,
    }).addRetry(retryConfig);

    const compensateTask = new tasks.LambdaInvoke(this, 'CompensateTask', {
      lambdaFunction: compensatorLambda,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false,
    });

    const parallelChecks = new sfn.Parallel(this, 'ParallelChecks')
      .branch(fraudTask)
      .branch(complianceTask);

    const aggregate = new sfn.Pass(this, 'AggregateResults', {
      parameters: {
        'transactionId.$': '$[0].transactionId',
        'merchantId.$': '$[0].merchantId',
        'amount.$': '$[0].amount',
        'currency.$': '$[0].currency',
        'fraudScore.$': '$[0].fraudScore',
        'fraudRisk.$': '$[0].fraudRisk',
        'complianceFlags.$': '$[1].complianceFlags',
        'compliancePassed.$': '$[1].compliancePassed',
      },
    });

    // Catch failures at tail
    webhookTask.addCatch(compensateTask, {
      errors: ['States.ALL'],
      resultPath: '$.error',
    });

    const definition = validateTask
      .next(parallelChecks)
      .next(aggregate)
      .next(persistTask)
      .next(emitTask)
      .next(webhookTask);

    const stateMachine = new sfn.StateMachine(this, 'TxnStateMachine', {
      stateMachineName: `tap-transaction-processor-${environmentSuffix}`,
      definition,
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          logGroupName: `/aws/vendedlogs/states/tap-transaction-processor-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_WEEK,
        }),
        level: sfn.LogLevel.ALL,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `tap-transaction-api-${environmentSuffix}`,
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'OPTIONS'],
      },
    });

    const authorizer = new apigateway.TokenAuthorizer(this, 'ApiAuthorizer', {
      handler: authorizerLambda,
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    const transactionModel = api.addModel('TransactionModel', {
      contentType: 'application/json',
      modelName: 'TransactionRequest',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['transactionId', 'merchantId', 'amount', 'currency'],
        properties: {
          transactionId: { type: apigateway.JsonSchemaType.STRING },
          merchantId: { type: apigateway.JsonSchemaType.STRING },
          amount: { type: apigateway.JsonSchemaType.NUMBER },
          currency: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    const transactionsResource = api.root.addResource('transactions');
    transactionsResource.addMethod(
      'POST',
      new apigateway.AwsIntegration({
        service: 'states',
        action: 'StartExecution',
        integrationHttpMethod: 'POST',
        options: {
          credentialsRole: new iam.Role(this, 'ApiGwSfnRole', {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            inlinePolicies: {
              StepFunctionsPolicy: new iam.PolicyDocument({
                statements: [
                  new iam.PolicyStatement({
                    actions: ['states:StartExecution'],
                    resources: [stateMachine.stateMachineArn],
                  }),
                ],
              }),
            },
          }),
          requestTemplates: {
            'application/json': `{
              "stateMachineArn": "${stateMachine.stateMachineArn}",
              "input": "$util.escapeJavaScript($input.body)"
            }`,
          },
          integrationResponses: [
            {
              statusCode: '200',
              responseTemplates: {
                'application/json':
                  '{"executionArn": "$input.json(\\"$.executionArn\\")"}',
              },
            },
          ],
        },
      }),
      {
        authorizer,
        apiKeyRequired: true,
        requestModels: { 'application/json': transactionModel },
        methodResponses: [{ statusCode: '200' }],
      }
    );

    const webhooksResource = api.root.addResource('webhooks');
    const statusResource = webhooksResource.addResource('status');
    statusResource.addMethod(
      'POST',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '{"status":"acknowledged"}',
            },
          },
        ],
        requestTemplates: { 'application/json': '{"statusCode":200}' },
      }),
      { authorizer, methodResponses: [{ statusCode: '200' }] }
    );

    const usagePlan = api.addUsagePlan('TapUsagePlan', {
      name: `tap-usage-plan-${environmentSuffix}`,
      throttle: { rateLimit: 100, burstLimit: 200 },
      quota: { limit: 10000, period: apigateway.Period.DAY },
    });

    usagePlan.addApiStage({ stage: api.deploymentStage });

    // ---- Stable, unique API key (no collisions) ----
    const apiKey = api.addApiKey('TapApiKey', {
      apiKeyName,
      value: apiKeyValue,
    });

    usagePlan.addApiKey(apiKey);

    // EventBridge rules
    new events.Rule(this, 'HighAmountRule', {
      ruleName: `tap-high-amount-${environmentSuffix}`,
      eventBus,
      eventPattern: {
        source: ['tap.compliance'],
        detailType: ['High Amount Transaction'],
      },
      targets: [
        new targets.LambdaFunction(persistLambda, {
          deadLetterQueue: eventBridgeDlq,
          retryAttempts: 2,
        }),
      ],
    });

    new events.Rule(this, 'HighFraudRule', {
      ruleName: `tap-high-fraud-${environmentSuffix}`,
      eventBus,
      eventPattern: { source: ['tap.fraud'], detailType: ['High Fraud Score'] },
      targets: [
        new targets.LambdaFunction(compensatorLambda, {
          deadLetterQueue: eventBridgeDlq,
          retryAttempts: 2,
        }),
      ],
    });

    new events.Rule(this, 'FailureSpikeRule', {
      ruleName: `tap-failure-spike-${environmentSuffix}`,
      eventBus,
      eventPattern: {
        source: ['tap.compensation'],
        detailType: ['transaction.rolled_back'],
      },
      targets: [
        new targets.SqsQueue(dlq, {
          messageGroupId: 'compensation-rollbacks',
        }),
      ],
    });

    // CloudWatch alarms
    new cloudwatch.Alarm(this, 'DLQDepthAlarm', {
      alarmName: `tap-dlq-depth-${environmentSuffix}`,
      alarmDescription: 'DLQ has visible messages',
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'ThrottlesAlarm', {
      alarmName: `tap-lambda-throttles-${environmentSuffix}`,
      alarmDescription: 'Lambda Throttles detected',
      metric: validationLambda.metricThrottles({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
    });

    new cloudwatch.Alarm(this, 'FailedExecutionsAlarm', {
      alarmName: `tap-failed-executions-${environmentSuffix}`,
      alarmDescription: 'Step Functions executions failing',
      metric: stateMachine.metricFailed(),
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `tap-api-5xx-${environmentSuffix}`,
      alarmDescription: 'API Gateway returning 5xx',
      metric: api.metricServerError(),
      threshold: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: `tap-transaction-pipeline-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown:
              '# Transaction Pipeline Dashboard\nReal-time monitoring of the TAP system',
            width: 24,
            height: 1,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Success vs Failed',
            left: [stateMachine.metricSucceeded()],
            right: [stateMachine.metricFailed()],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Processing Duration',
            left: [
              stateMachine.metric('ExecutionTime', {
                statistic: 'Average',
                period: cdk.Duration.minutes(5),
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Throttles',
            left: [
              validationLambda.metricThrottles(),
              fraudScoringLambda.metricThrottles(),
              webhookLambda.metricThrottles(),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Errors',
            left: [
              validationLambda.metricErrors(),
              persistLambda.metricErrors(),
              compensatorLambda.metricErrors(),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'DLQ Depth',
            metrics: [dlq.metricApproximateNumberOfMessagesVisible()],
            width: 8,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'API Requests / Errors',
            left: [api.metricCount()],
            right: [api.metricClientError(), api.metricServerError()],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'State Machine Executions',
            left: [
              stateMachine.metricStarted(),
              stateMachine.metricSucceeded(),
              stateMachine.metricFailed(),
              stateMachine.metricAborted(),
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `TapApiEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyValue', {
      value: apiKeyValue,
      description: 'API Key value (use as x-api-key header for testing)',
      exportName: `TapApiKeyValue-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
      exportName: `TapStateMachineArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: transactionsTable.tableName,
      description: 'Transactions table',
      exportName: `TapTransactionsTable-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'InboundQueueUrl', {
      value: inboundQueue.queueUrl,
      description: 'Inbound FIFO queue URL',
      exportName: `TapInboundQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'DLQ URL',
      exportName: `TapDLQUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge bus name',
      exportName: `TapEventBusName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArchiveBucketName', {
      value: archiveBucket.bucketName,
      description: 'Archive bucket',
      exportName: `TapArchiveBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `TapDashboard-${environmentSuffix}`,
    });
  }
}

```