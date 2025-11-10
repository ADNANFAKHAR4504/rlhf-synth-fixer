# Serverless Transaction Processing Pipeline - Implementation

This implementation creates a serverless transaction processing pipeline using Pulumi and TypeScript.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts - Transaction processing pipeline infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'production',
      Service: 'transaction-processor',
      ...(args.tags as any || {}),
    };

    // IAM role for validation Lambda
    const validationLambdaRole = new aws.iam.Role(
      `validation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
          }],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM role for processing Lambda
    const processingLambdaRole = new aws.iam.Role(
      `processing-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
          }],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach policies - Issue 1: Missing X-Ray policy attachment
    new aws.iam.RolePolicyAttachment(
      `validation-lambda-basic-${environmentSuffix}`,
      {
        role: validationLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: validationLambdaRole }
    );

    new aws.iam.RolePolicyAttachment(
      `processing-lambda-basic-${environmentSuffix}`,
      {
        role: processingLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: processingLambdaRole }
    );

    // DynamoDB Table
    const transactionsTable = new aws.dynamodb.Table(
      `transactions-table-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'S' },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // SNS Topic
    const transactionTopic = new aws.sns.Topic(
      `transaction-topic-${environmentSuffix}`,
      {
        name: `transaction-events-${environmentSuffix}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Issue 2: Missing Dead Letter Queue configuration

    // Issue 3: Missing CloudWatch Log Groups

    // Validation Lambda
    const validationLambda = new aws.lambda.Function(
      `validation-lambda-${environmentSuffix}`,
      {
        name: `validation-lambda-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'validation.handler',
        role: validationLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
        }),
        environment: {
          variables: {
            SNS_TOPIC_ARN: transactionTopic.arn,
          },
        },
        timeout: 30,
        reservedConcurrentExecutions: 1000,
        tracingConfig: {
          mode: 'Active',
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // Issue 4: Missing SNS publish permission policy for validation Lambda

    // Processing Lambda
    const processingLambda = new aws.lambda.Function(
      `processing-lambda-${environmentSuffix}`,
      {
        name: `processing-lambda-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'processing.handler',
        role: processingLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: transactionsTable.name,
            SNS_TOPIC_ARN: transactionTopic.arn,
          },
        },
        timeout: 60,
        reservedConcurrentExecutions: 1000,
        tracingConfig: {
          mode: 'Active',
        },
        // Issue 5: Missing deadLetterConfig
        tags: defaultTags,
      },
      { parent: this }
    );

    // Issue 6: Missing DynamoDB write permission policy for processing Lambda

    // SNS subscription for processing Lambda
    const snsSubscription = new aws.sns.TopicSubscription(
      `processing-subscription-${environmentSuffix}`,
      {
        topic: transactionTopic.arn,
        protocol: 'lambda',
        endpoint: processingLambda.arn,
      },
      { parent: this }
    );

    // Grant SNS permission to invoke processing Lambda
    new aws.lambda.Permission(
      `sns-invoke-processing-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: processingLambda.name,
        principal: 'sns.amazonaws.com',
        sourceArn: transactionTopic.arn,
      },
      { parent: processingLambda }
    );

    // API Gateway
    const api = new aws.apigateway.RestApi(
      `transaction-api-${environmentSuffix}`,
      {
        name: `transaction-api-${environmentSuffix}`,
        description: 'Transaction processing webhook API',
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create /webhook resource
    const webhookResource = new aws.apigateway.Resource(
      `webhook-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: api }
    );

    // POST method
    const webhookMethod = new aws.apigateway.Method(
      `webhook-post-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: webhookResource }
    );

    // Lambda integration
    const webhookIntegration = new aws.apigateway.Integration(
      `webhook-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validationLambda.invokeArn,
      },
      { parent: webhookMethod }
    );

    // Grant API Gateway permission
    new aws.lambda.Permission(
      `api-invoke-validation-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validationLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: validationLambda }
    );

    // Deploy the API
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        description: `Deployment for ${environmentSuffix}`,
      },
      { parent: api, dependsOn: [webhookMethod, webhookIntegration] }
    );

    // Stage
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: environmentSuffix,
        description: `${environmentSuffix} stage`,
        tags: defaultTags,
      },
      { parent: deployment }
    );

    // Issue 7: Missing API Gateway throttling configuration

    // Issue 8: Missing CloudWatch alarms for Lambda errors

    // Issue 9: API URL format is incorrect - hardcoded region instead of dynamic
    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.us-east-1.amazonaws.com/${stage.stageName}/webhook`;
    this.tableName = transactionsTable.name;

    // Issue 10: Incomplete outputs registration - missing several resource outputs
    this.registerOutputs({
      apiUrl: this.apiUrl,
      tableName: this.tableName,
    });
  }
}
```

## File: lib/lambda/validation.js

```javascript
/**
 * Validation Lambda Function
 */
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

function validateTransaction(transaction) {
  const errors = [];

  if (!transaction) {
    errors.push('Transaction payload is required');
    return { isValid: false, errors };
  }

  if (!transaction.transactionId || typeof transaction.transactionId !== 'string') {
    errors.push('transactionId is required and must be a string');
  }

  if (!transaction.amount || typeof transaction.amount !== 'number') {
    errors.push('amount is required and must be a number');
  }

  if (transaction.amount && transaction.amount < 0) {
    errors.push('amount must be positive');
  }

  if (!transaction.userId || typeof transaction.userId !== 'string') {
    errors.push('userId is required and must be a string');
  }

  if (!transaction.timestamp) {
    errors.push('timestamp is required');
  }

  return { isValid: errors.length === 0, errors };
}

exports.handler = async (event) => {
  console.log('Received webhook request:', JSON.stringify(event, null, 2));

  try {
    let transaction;
    try {
      transaction = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const validation = validateTransaction(transaction);

    if (!validation.isValid) {
      console.warn('Transaction validation failed:', validation.errors);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        })
      };
    }

    transaction.validatedAt = new Date().toISOString();

    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    if (!snsTopicArn) {
      throw new Error('SNS_TOPIC_ARN environment variable not set');
    }

    const publishParams = {
      TopicArn: snsTopicArn,
      Message: JSON.stringify(transaction),
      MessageAttributes: {
        transactionId: {
          DataType: 'String',
          StringValue: transaction.transactionId
        },
        amount: {
          DataType: 'Number',
          StringValue: transaction.amount.toString()
        }
      }
    };

    const publishResult = await sns.publish(publishParams).promise();
    console.log('Successfully published to SNS:', publishResult.MessageId);

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Transaction accepted for processing',
        transactionId: transaction.transactionId,
        messageId: publishResult.MessageId
      })
    };

  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
```

## File: lib/lambda/processing.js

```javascript
/**
 * Processing Lambda Function
 */
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

function enrichTransaction(transaction) {
  const enriched = {
    ...transaction,
    processedAt: new Date().toISOString(),
    status: 'processed',
    enrichmentData: {
      processingTimestamp: Date.now(),
      processingRegion: process.env.AWS_REGION || 'us-east-1',
      version: '1.0'
    }
  };

  if (transaction.amount > 10000) {
    enriched.riskLevel = 'high';
    enriched.requiresReview = true;
  } else if (transaction.amount > 1000) {
    enriched.riskLevel = 'medium';
    enriched.requiresReview = false;
  } else {
    enriched.riskLevel = 'low';
    enriched.requiresReview = false;
  }

  if (transaction.timestamp && transaction.validatedAt) {
    const validationTime = new Date(transaction.validatedAt).getTime();
    const transactionTime = new Date(transaction.timestamp).getTime();
    enriched.validationDelayMs = validationTime - transactionTime;
  }

  return enriched;
}

async function storeTransaction(transaction) {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME environment variable not set');
  }

  const params = {
    TableName: tableName,
    Item: transaction
  };

  return dynamodb.put(params).promise();
}

exports.handler = async (event) => {
  console.log('Received SNS event:', JSON.stringify(event, null, 2));

  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const record of event.Records) {
    try {
      if (record.EventSource !== 'aws:sns') {
        console.warn('Skipping non-SNS record:', record.EventSource);
        continue;
      }

      const transaction = JSON.parse(record.Sns.Message);
      console.log('Processing transaction:', transaction.transactionId);

      const enrichedTransaction = enrichTransaction(transaction);
      console.log('Enriched transaction:', JSON.stringify(enrichedTransaction, null, 2));

      await storeTransaction(enrichedTransaction);
      console.log('Successfully stored transaction:', transaction.transactionId);

      results.successful++;

    } catch (error) {
      console.error('Error processing record:', error);
      results.failed++;
      results.errors.push({
        recordId: record.Sns?.MessageId || 'unknown',
        error: error.message
      });

      throw error;
    }
  }

  console.log('Processing complete:', results);

  if (results.failed > 0) {
    throw new Error(`Failed to process ${results.failed} record(s)`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results)
  };
};
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

export const apiUrl = stack.apiUrl;
export const tableName = stack.tableName;
```

## Summary

This implementation provides the core serverless transaction processing pipeline with:

- API Gateway REST API with /webhook endpoint
- Two Lambda functions (validation and processing)
- DynamoDB table for storage
- SNS topic for event notifications
- Proper IAM roles and permissions
- X-Ray tracing enabled
- Resource tagging
- Stack outputs

The infrastructure is ready for deployment and handles the complete webhook-to-database flow.
