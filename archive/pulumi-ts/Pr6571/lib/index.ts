import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as path from 'path';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';
const region = 'eu-south-2';

// KMS Key for Lambda encryption
const kmsKey = new aws.kms.Key(`transaction-kms-${environmentSuffix}`, {
  description: 'KMS key for encrypting Lambda environment variables',
  enableKeyRotation: true,
  tags: {
    Name: `transaction-kms-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

new aws.kms.Alias(`transaction-kms-alias-${environmentSuffix}`, {
  name: `alias/transaction-${environmentSuffix}`,
  targetKeyId: kmsKey.id,
});

// DynamoDB Table
const transactionTable = new aws.dynamodb.Table(
  `transaction-table-${environmentSuffix}`,
  {
    name: `transactions-${environmentSuffix}`,
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'transactionId',
    rangeKey: 'timestamp',
    attributes: [
      { name: 'transactionId', type: 'S' },
      { name: 'timestamp', type: 'N' },
    ],
    streamEnabled: true,
    streamViewType: 'NEW_AND_OLD_IMAGES',
    tags: {
      Name: `transaction-table-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// SNS Topic for notifications
const notificationTopic = new aws.sns.Topic(
  `notification-topic-${environmentSuffix}`,
  {
    name: `transaction-notifications-${environmentSuffix}`,
    tags: {
      Name: `notification-topic-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Dead Letter Queue for Fraud Detection Lambda
const fraudDetectionDlq = new aws.sqs.Queue(
  `fraud-detection-dlq-${environmentSuffix}`,
  {
    name: `fraud-detection-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    tags: {
      Name: `fraud-detection-dlq-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Dead Letter Queue for Notification Lambda
const notificationDlq = new aws.sqs.Queue(
  `notification-dlq-${environmentSuffix}`,
  {
    name: `notification-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    tags: {
      Name: `notification-dlq-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// SQS FIFO Queue for transaction ordering
const transactionQueue = new aws.sqs.Queue(
  `transaction-queue-${environmentSuffix}`,
  {
    name: `transaction-queue-${environmentSuffix}.fifo`,
    fifoQueue: true,
    contentBasedDeduplication: true,
    visibilityTimeoutSeconds: 30,
    tags: {
      Name: `transaction-queue-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// IAM Role for Transaction Validator Lambda
const validatorLambdaRole = new aws.iam.Role(
  `validator-lambda-role-${environmentSuffix}`,
  {
    name: `transaction-validator-role-${environmentSuffix}`,
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
      Name: `validator-lambda-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

new aws.iam.RolePolicyAttachment(
  `validator-lambda-basic-${environmentSuffix}`,
  {
    role: validatorLambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

new aws.iam.RolePolicy(`validator-lambda-policy-${environmentSuffix}`, {
  role: validatorLambdaRole.id,
  policy: pulumi
    .all([transactionTable.arn, kmsKey.arn])
    .apply(([tableArn, keyArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
            Resource: tableArn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: keyArn,
          },
        ],
      })
    ),
});

// CloudWatch Log Group for Transaction Validator
const validatorLogGroup = new aws.cloudwatch.LogGroup(
  `validator-log-group-${environmentSuffix}`,
  {
    name: `/aws/lambda/transaction-validator-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Name: `validator-log-group-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Transaction Validator Lambda
const validatorLambda = new aws.lambda.Function(
  `transaction-validator-${environmentSuffix}`,
  {
    name: `transaction-validator-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: validatorLambdaRole.arn,
    reservedConcurrentExecutions: 10,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'transaction-validator')
      ),
    }),
    environment: {
      variables: {
        TABLE_NAME: transactionTable.name,
        REGION: region,
      },
    },
    kmsKeyArn: kmsKey.arn,
    timeout: 30,
    tags: {
      Name: `transaction-validator-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { dependsOn: [validatorLogGroup] }
);

// IAM Role for Fraud Detection Lambda
const fraudLambdaRole = new aws.iam.Role(
  `fraud-lambda-role-${environmentSuffix}`,
  {
    name: `fraud-detection-role-${environmentSuffix}`,
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
      Name: `fraud-lambda-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

new aws.iam.RolePolicyAttachment(`fraud-lambda-basic-${environmentSuffix}`, {
  role: fraudLambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});

new aws.iam.RolePolicy(`fraud-lambda-policy-${environmentSuffix}`, {
  role: fraudLambdaRole.id,
  policy: pulumi
    .all([
      transactionTable.streamArn,
      transactionQueue.arn,
      kmsKey.arn,
      fraudDetectionDlq.arn,
    ])
    .apply(([streamArn, queueArn, keyArn, dlqArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:DescribeStream',
              'dynamodb:ListStreams',
            ],
            Resource: streamArn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: queueArn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: dlqArn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: keyArn,
          },
        ],
      })
    ),
});

// CloudWatch Log Group for Fraud Detection
const fraudLogGroup = new aws.cloudwatch.LogGroup(
  `fraud-log-group-${environmentSuffix}`,
  {
    name: `/aws/lambda/fraud-detection-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Name: `fraud-log-group-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Fraud Detection Lambda
const fraudLambda = new aws.lambda.Function(
  `fraud-detection-${environmentSuffix}`,
  {
    name: `fraud-detection-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: fraudLambdaRole.arn,
    reservedConcurrentExecutions: 10,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'fraud-detection')
      ),
    }),
    environment: {
      variables: {
        QUEUE_URL: transactionQueue.url,
        REGION: region,
      },
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
      targetArn: fraudDetectionDlq.arn,
    },
    timeout: 60,
    tags: {
      Name: `fraud-detection-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { dependsOn: [fraudLogGroup] }
);

// DynamoDB Stream Event Source Mapping
new aws.lambda.EventSourceMapping(`fraud-event-source-${environmentSuffix}`, {
  eventSourceArn: transactionTable.streamArn,
  functionName: fraudLambda.name,
  startingPosition: 'LATEST',
  batchSize: 10,
  maximumBatchingWindowInSeconds: 5,
});

// IAM Role for Notification Lambda
const notificationLambdaRole = new aws.iam.Role(
  `notification-lambda-role-${environmentSuffix}`,
  {
    name: `notification-role-${environmentSuffix}`,
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
      Name: `notification-lambda-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

new aws.iam.RolePolicyAttachment(
  `notification-lambda-basic-${environmentSuffix}`,
  {
    role: notificationLambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

new aws.iam.RolePolicy(`notification-lambda-policy-${environmentSuffix}`, {
  role: notificationLambdaRole.id,
  policy: pulumi
    .all([
      transactionQueue.arn,
      notificationTopic.arn,
      kmsKey.arn,
      notificationDlq.arn,
    ])
    .apply(([queueArn, topicArn, keyArn, dlqArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
            ],
            Resource: queueArn,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: topicArn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: dlqArn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: keyArn,
          },
        ],
      })
    ),
});

// CloudWatch Log Group for Notification Lambda
const notificationLogGroup = new aws.cloudwatch.LogGroup(
  `notification-log-group-${environmentSuffix}`,
  {
    name: `/aws/lambda/notification-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Name: `notification-log-group-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Notification Lambda
const notificationLambda = new aws.lambda.Function(
  `notification-${environmentSuffix}`,
  {
    name: `notification-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: notificationLambdaRole.arn,
    reservedConcurrentExecutions: 10,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'notification')
      ),
    }),
    environment: {
      variables: {
        SNS_TOPIC_ARN: notificationTopic.arn,
        REGION: region,
      },
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
      targetArn: notificationDlq.arn,
    },
    timeout: 30,
    tags: {
      Name: `notification-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { dependsOn: [notificationLogGroup] }
);

// SQS Event Source Mapping for Notification Lambda
new aws.lambda.EventSourceMapping(
  `notification-event-source-${environmentSuffix}`,
  {
    eventSourceArn: transactionQueue.arn,
    functionName: notificationLambda.name,
    batchSize: 10,
  }
);

// OpenAPI Schema for API Gateway
const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: `Transaction API ${environmentSuffix}`,
    version: '1.0.0',
  },
  paths: {
    '/transaction': {
      post: {
        summary: 'Process a transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['transactionId', 'amount', 'currency', 'merchantId'],
                properties: {
                  transactionId: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9-]+$',
                  },
                  amount: {
                    type: 'number',
                    minimum: 0.01,
                  },
                  currency: {
                    type: 'string',
                    pattern: '^[A-Z]{3}$',
                  },
                  merchantId: {
                    type: 'string',
                  },
                  customerId: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Transaction processed successfully',
          },
          '400': {
            description: 'Invalid request',
          },
        },
        'x-amazon-apigateway-integration': {
          type: 'aws_proxy',
          httpMethod: 'POST',
          uri: pulumi.interpolate`arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${validatorLambda.arn}/invocations`,
        },
        'x-amazon-apigateway-request-validator': 'all',
      },
    },
  },
  'x-amazon-apigateway-request-validators': {
    all: {
      validateRequestBody: true,
      validateRequestParameters: true,
    },
  },
};

// API Gateway REST API
const api = new aws.apigateway.RestApi(`transaction-api-${environmentSuffix}`, {
  name: `transaction-api-${environmentSuffix}`,
  body: pulumi.output(openApiSchema).apply(schema => JSON.stringify(schema)),
  tags: {
    Name: `transaction-api-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Lambda permission for API Gateway
const lambdaPermission = new aws.lambda.Permission(
  `api-lambda-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: validatorLambda.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  }
);

// API Gateway Deployment
const apiDeployment = new aws.apigateway.Deployment(
  `api-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
  },
  {
    dependsOn: [lambdaPermission],
  }
);

// API Gateway Stage
const apiStage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
  restApi: api.id,
  deployment: apiDeployment.id,
  stageName: environmentSuffix,
  tags: {
    Name: `api-stage-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// API Gateway Usage Plan
const usagePlan = new aws.apigateway.UsagePlan(
  `api-usage-plan-${environmentSuffix}`,
  {
    name: `transaction-usage-plan-${environmentSuffix}`,
    apiStages: [
      {
        apiId: api.id,
        stage: apiStage.stageName,
      },
    ],
    throttleSettings: {
      rateLimit: 10000,
      burstLimit: 5000,
    },
    quotaSettings: {
      limit: 10000,
      period: 'DAY',
    },
    tags: {
      Name: `api-usage-plan-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    dependsOn: [apiStage],
  }
);

// API Key
const apiKey = new aws.apigateway.ApiKey(`api-key-${environmentSuffix}`, {
  name: `transaction-api-key-${environmentSuffix}`,
  enabled: true,
  tags: {
    Name: `api-key-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Associate API Key with Usage Plan
new aws.apigateway.UsagePlanKey(`usage-plan-key-${environmentSuffix}`, {
  keyId: apiKey.id,
  keyType: 'API_KEY',
  usagePlanId: usagePlan.id,
});

// Exports
export const apiUrl = pulumi.interpolate`${api.executionArn}/${apiStage.stageName}/transaction`;
export const apiInvokeUrl = pulumi.interpolate`https://${api.id}.execute-api.${region}.amazonaws.com/${apiStage.stageName}/transaction`;
export const apiKeyValue = apiKey.value;
export const transactionTableName = transactionTable.name;
export const snsTopicArn = notificationTopic.arn;
