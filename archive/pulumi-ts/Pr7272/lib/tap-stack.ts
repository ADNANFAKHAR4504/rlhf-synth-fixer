import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as path from 'path';

// Get configuration and environment suffix
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || pulumi.getStack();

/**
 * Payment Webhook Processing System
 *
 * This stack creates a serverless payment webhook processing pipeline with:
 * - API Gateway REST API for webhook ingestion
 * - Lambda functions for validation and processing (ARM64)
 * - DynamoDB for event storage with streams
 * - Step Functions for orchestration with retry logic
 * - EventBridge for event-driven triggering
 * - KMS for encryption
 * - X-Ray for distributed tracing
 * - IAM roles with least privilege
 */

// Create customer-managed KMS key for Lambda environment variable encryption
const kmsKey = new aws.kms.Key(`payment-kms-${environmentSuffix}`, {
  description:
    'KMS key for encrypting Lambda environment variables in payment webhook system',
  enableKeyRotation: true,
  tags: {
    Name: `payment-kms-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

const _kmsKeyAlias = new aws.kms.Alias(
  `payment-kms-alias-${environmentSuffix}`,
  {
    name: `alias/payment-webhook-${environmentSuffix}`,
    targetKeyId: kmsKey.id,
  }
);
void _kmsKeyAlias;

// Create DynamoDB table for payment events with streams enabled
const paymentsTable = new aws.dynamodb.Table(
  `payments-table-${environmentSuffix}`,
  {
    name: `payments-${environmentSuffix}`,
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'paymentId',
    rangeKey: 'timestamp',
    attributes: [
      { name: 'paymentId', type: 'S' },
      { name: 'timestamp', type: 'N' },
    ],
    streamEnabled: true,
    streamViewType: 'NEW_AND_OLD_IMAGES',
    pointInTimeRecovery: {
      enabled: true,
    },
    serverSideEncryption: {
      enabled: true,
    },
    tags: {
      Name: `payments-table-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create IAM role for webhook validator Lambda
const webhookValidatorRole = new aws.iam.Role(
  `webhook-validator-role-${environmentSuffix}`,
  {
    name: `webhook-validator-role-${environmentSuffix}`,
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
      Name: `webhook-validator-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(
  `webhook-validator-basic-${environmentSuffix}`,
  {
    role: webhookValidatorRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach X-Ray write policy
new aws.iam.RolePolicyAttachment(
  `webhook-validator-xray-${environmentSuffix}`,
  {
    role: webhookValidatorRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
  }
);

// Create inline policy for DynamoDB access
const _webhookValidatorPolicy = new aws.iam.RolePolicy(
  `webhook-validator-policy-${environmentSuffix}`,
  {
    role: webhookValidatorRole.id,
    policy: pulumi
      .all([paymentsTable.arn, kmsKey.arn])
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
  }
);

// Create webhook validator Lambda function
const webhookValidatorFunction = new aws.lambda.Function(
  `webhook-validator-${environmentSuffix}`,
  {
    name: `webhook-validator-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: webhookValidatorRole.arn,
    architectures: ['arm64'],
    reservedConcurrentExecutions: 10,
    timeout: 30,
    memorySize: 512,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'webhook-validator')
      ),
    }),
    environment: {
      variables: {
        TABLE_NAME: paymentsTable.name,
        POWERTOOLS_SERVICE_NAME: 'webhook-validator',
      },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
      mode: 'Active',
    },
    tags: {
      Name: `webhook-validator-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create IAM role for payment processor Lambda
const paymentProcessorRole = new aws.iam.Role(
  `payment-processor-role-${environmentSuffix}`,
  {
    name: `payment-processor-role-${environmentSuffix}`,
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
      Name: `payment-processor-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(
  `payment-processor-basic-${environmentSuffix}`,
  {
    role: paymentProcessorRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach X-Ray write policy
new aws.iam.RolePolicyAttachment(
  `payment-processor-xray-${environmentSuffix}`,
  {
    role: paymentProcessorRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
  }
);

// Create inline policy for DynamoDB access
const _paymentProcessorPolicy = new aws.iam.RolePolicy(
  `payment-processor-policy-${environmentSuffix}`,
  {
    role: paymentProcessorRole.id,
    policy: pulumi
      .all([paymentsTable.arn, kmsKey.arn])
      .apply(([tableArn, keyArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
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
  }
);

// Create payment processor Lambda function
const paymentProcessorFunction = new aws.lambda.Function(
  `payment-processor-${environmentSuffix}`,
  {
    name: `payment-processor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: paymentProcessorRole.arn,
    architectures: ['arm64'],
    reservedConcurrentExecutions: 10,
    timeout: 60,
    memorySize: 1024,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'payment-processor')
      ),
    }),
    environment: {
      variables: {
        TABLE_NAME: paymentsTable.name,
        POWERTOOLS_SERVICE_NAME: 'payment-processor',
      },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
      mode: 'Active',
    },
    tags: {
      Name: `payment-processor-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create API Gateway REST API
const api = new aws.apigateway.RestApi(
  `payment-webhook-api-${environmentSuffix}`,
  {
    name: `payment-webhook-api-${environmentSuffix}`,
    description: 'Payment webhook processing API',
    tags: {
      Name: `payment-webhook-api-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create /webhooks resource
const webhooksResource = new aws.apigateway.Resource(
  `webhooks-resource-${environmentSuffix}`,
  {
    restApi: api.id,
    parentId: api.rootResourceId,
    pathPart: 'webhooks',
  }
);

// Create POST method for /webhooks
const webhooksMethod = new aws.apigateway.Method(
  `webhooks-post-method-${environmentSuffix}`,
  {
    restApi: api.id,
    resourceId: webhooksResource.id,
    httpMethod: 'POST',
    authorization: 'NONE',
  }
);

// Create Lambda integration
const webhooksIntegration = new aws.apigateway.Integration(
  `webhooks-integration-${environmentSuffix}`,
  {
    restApi: api.id,
    resourceId: webhooksResource.id,
    httpMethod: webhooksMethod.httpMethod,
    integrationHttpMethod: 'POST',
    type: 'AWS_PROXY',
    uri: webhookValidatorFunction.invokeArn,
  }
);

// Grant API Gateway permission to invoke Lambda
const _webhookLambdaPermission = new aws.lambda.Permission(
  `webhook-lambda-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: webhookValidatorFunction.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  }
);

// Deploy API Gateway
const deployment = new aws.apigateway.Deployment(
  `api-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
  },
  { dependsOn: [webhooksIntegration] }
);

const _stage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
  restApi: api.id,
  deployment: deployment.id,
  stageName: 'prod',
  xrayTracingEnabled: true,
  tags: {
    Name: `api-stage-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Create IAM role for Step Functions
const stepFunctionsRole = new aws.iam.Role(
  `step-functions-role-${environmentSuffix}`,
  {
    name: `step-functions-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'states.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      Name: `step-functions-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create inline policy for Step Functions
const _stepFunctionsPolicy = new aws.iam.RolePolicy(
  `step-functions-policy-${environmentSuffix}`,
  {
    role: stepFunctionsRole.id,
    policy: paymentProcessorFunction.arn.apply(functionArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction'],
            Resource: functionArn,
          },
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
          },
        ],
      })
    ),
  }
);

// Create Step Functions state machine with exponential backoff retry logic
const stateMachine = new aws.sfn.StateMachine(
  `payment-processor-sfn-${environmentSuffix}`,
  {
    name: `payment-processor-${environmentSuffix}`,
    roleArn: stepFunctionsRole.arn,
    tracingConfiguration: {
      enabled: true,
    },
    definition: paymentProcessorFunction.arn.apply(functionArn =>
      JSON.stringify({
        Comment:
          'Payment processing workflow with exponential backoff retry logic',
        StartAt: 'ProcessPayment',
        States: {
          ProcessPayment: {
            Type: 'Task',
            Resource: functionArn,
            Retry: [
              {
                ErrorEquals: [
                  'States.TaskFailed',
                  'Lambda.ServiceException',
                  'Lambda.TooManyRequestsException',
                ],
                IntervalSeconds: 2,
                MaxAttempts: 3,
                BackoffRate: 2.0,
              },
            ],
            Catch: [
              {
                ErrorEquals: ['States.ALL'],
                ResultPath: '$.error',
                Next: 'PaymentFailed',
              },
            ],
            Next: 'PaymentSucceeded',
          },
          PaymentSucceeded: {
            Type: 'Succeed',
          },
          PaymentFailed: {
            Type: 'Fail',
            Error: 'PaymentProcessingFailed',
            Cause: 'Payment processing failed after retries',
          },
        },
      })
    ),
    tags: {
      Name: `payment-processor-sfn-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create IAM role for EventBridge pipe
const eventBridgePipeRole = new aws.iam.Role(
  `eventbridge-pipe-role-${environmentSuffix}`,
  {
    name: `eventbridge-pipe-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'pipes.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      Name: `eventbridge-pipe-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create inline policy for EventBridge pipe
const _eventBridgePipePolicy = new aws.iam.RolePolicy(
  `eventbridge-pipe-policy-${environmentSuffix}`,
  {
    role: eventBridgePipeRole.id,
    policy: pulumi
      .all([paymentsTable.streamArn, stateMachine.arn])
      .apply(([streamArn, sfnArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ],
              Resource: streamArn,
            },
            {
              Effect: 'Allow',
              Action: ['states:StartExecution'],
              Resource: sfnArn,
            },
          ],
        })
      ),
  }
);

// Create EventBridge pipe to connect DynamoDB Streams to Step Functions
const _pipe = new aws.pipes.Pipe(`payment-events-pipe-${environmentSuffix}`, {
  name: `payment-events-pipe-${environmentSuffix}`,
  roleArn: eventBridgePipeRole.arn,
  source: paymentsTable.streamArn,
  target: stateMachine.arn,
  sourceParameters: {
    dynamodbStreamParameters: {
      startingPosition: 'LATEST',
      batchSize: 1,
    },
    filterCriteria: {
      filters: [
        {
          pattern: JSON.stringify({
            eventName: ['INSERT'],
          }),
        },
      ],
    },
  },
  tags: {
    Name: `payment-events-pipe-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Export outputs
export const apiId = api.id;
export const apiEndpoint = pulumi.interpolate`${api.executionArn.apply(arn => arn.replace('execute-api', 'execute-api').replace(/:([^:]+)$/, ''))}/prod/webhooks`;
export const apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/prod/webhooks`;
export const stateMachineArn = stateMachine.arn;
export const paymentsTableName = paymentsTable.name;
export const kmsKeyId = kmsKey.id;
export const webhookValidatorFunctionName = webhookValidatorFunction.name;
export const paymentProcessorFunctionName = paymentProcessorFunction.name;

// Mark intentionally unused resources to satisfy linter
void _webhookValidatorPolicy;
void _paymentProcessorPolicy;
void _webhookLambdaPermission;
void _stage;
void _stepFunctionsPolicy;
void _eventBridgePipePolicy;
void _pipe;
