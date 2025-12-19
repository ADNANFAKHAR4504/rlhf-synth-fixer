import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get environment suffix from Pulumi config or use default
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || pulumi.getStack();
const region = 'ap-southeast-1';

// DynamoDB Table for transaction storage
const transactionsTable = new aws.dynamodb.Table(
  `transactions-${environmentSuffix}`,
  {
    name: `transactions-${environmentSuffix}`,
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'transactionId',
    rangeKey: 'timestamp',
    attributes: [
      { name: 'transactionId', type: 'S' },
      { name: 'timestamp', type: 'N' },
    ],
    serverSideEncryption: {
      enabled: true,
    },
    pointInTimeRecovery: {
      enabled: true,
    },
    tags: {
      Environment: environmentSuffix,
      Purpose: 'TransactionStorage',
    },
  }
);

// SQS Queue for transaction processing
const transactionQueue = new aws.sqs.Queue(
  `transaction-queue-${environmentSuffix}`,
  {
    name: `transaction-queue-${environmentSuffix}`,
    visibilityTimeoutSeconds: 300,
    messageRetentionSeconds: 1209600, // 14 days
    receiveWaitTimeSeconds: 20, // Enable long polling
    sqsManagedSseEnabled: true,
    tags: {
      Environment: environmentSuffix,
      Purpose: 'TransactionQueue',
    },
  }
);

// SNS Topic for transaction notifications
const notificationTopic = new aws.sns.Topic(
  `transaction-notifications-${environmentSuffix}`,
  {
    name: `transaction-notifications-${environmentSuffix}`,
    tags: {
      Environment: environmentSuffix,
      Purpose: 'TransactionNotifications',
    },
  }
);

// IAM Role for Transaction Receiver Lambda
const receiverRole = new aws.iam.Role(
  `transaction-receiver-role-${environmentSuffix}`,
  {
    name: `transaction-receiver-role-${environmentSuffix}`,
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
      Environment: environmentSuffix,
    },
  }
);

// Attach basic Lambda execution policy to receiver role
new aws.iam.RolePolicyAttachment(
  `receiver-basic-execution-${environmentSuffix}`,
  {
    role: receiverRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach X-Ray write policy to receiver role
new aws.iam.RolePolicyAttachment(`receiver-xray-${environmentSuffix}`, {
  role: receiverRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
});

// Receiver Lambda policy for SQS send
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const receiverPolicy = new aws.iam.RolePolicy(
  `receiver-policy-${environmentSuffix}`,
  {
    role: receiverRole.id,
    policy: pulumi.all([transactionQueue.arn]).apply(([queueArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
            Resource: queueArn,
          },
        ],
      })
    ),
  }
);

// CloudWatch Log Group for Receiver Lambda
const receiverLogGroup = new aws.cloudwatch.LogGroup(
  `/aws/lambda/transaction-receiver-${environmentSuffix}`,
  {
    name: `/aws/lambda/transaction-receiver-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// Transaction Receiver Lambda Function
const receiverLambda = new aws.lambda.Function(
  `transaction-receiver-${environmentSuffix}`,
  {
    name: `transaction-receiver-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: receiverRole.arn,
    memorySize: 512,
    timeout: 30,
    environment: {
      variables: {
        QUEUE_URL: transactionQueue.url,
        ENVIRONMENT: environmentSuffix,
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const sqs = new SQSClient({ region: '${region}' });

exports.handler = async (event) => {
    console.log('Received transaction request:', JSON.stringify(event));

    try {
        const body = JSON.parse(event.body || '{}');

        // Basic validation
        if (!body.transactionId || !body.amount || !body.cardNumber) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Missing required fields: transactionId, amount, cardNumber'
                })
            };
        }

        // Add timestamp
        const message = {
            ...body,
            receivedAt: Date.now(),
            status: 'received'
        };

        // Send to SQS
        const command = new SendMessageCommand({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                TransactionId: {
                    DataType: 'String',
                    StringValue: body.transactionId
                }
            }
        });

        await sqs.send(command);

        console.log('Transaction queued successfully:', body.transactionId);

        return {
            statusCode: 202,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Transaction accepted for processing',
                transactionId: body.transactionId
            })
        };

    } catch (error) {
        console.error('Error processing transaction:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error'
            })
        };
    }
};
`),
      'package.json': new pulumi.asset.StringAsset(
        JSON.stringify({
          name: 'transaction-receiver',
          version: '1.0.0',
          dependencies: {
            '@aws-sdk/client-sqs': '^3.0.0',
          },
        })
      ),
    }),
    tracingConfig: {
      mode: 'Active',
    },
    tags: {
      Environment: environmentSuffix,
      Function: 'TransactionReceiver',
    },
  },
  { dependsOn: [receiverLogGroup] }
);

// IAM Role for Transaction Processor Lambda
const processorRole = new aws.iam.Role(
  `transaction-processor-role-${environmentSuffix}`,
  {
    name: `transaction-processor-role-${environmentSuffix}`,
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
      Environment: environmentSuffix,
    },
  }
);

// Attach basic Lambda execution policy to processor role
new aws.iam.RolePolicyAttachment(
  `processor-basic-execution-${environmentSuffix}`,
  {
    role: processorRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach X-Ray write policy to processor role
new aws.iam.RolePolicyAttachment(`processor-xray-${environmentSuffix}`, {
  role: processorRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
});

// Processor Lambda policy for SQS, DynamoDB, and SNS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const processorPolicy = new aws.iam.RolePolicy(
  `processor-policy-${environmentSuffix}`,
  {
    role: processorRole.id,
    policy: pulumi
      .all([transactionQueue.arn, transactionsTable.arn, notificationTopic.arn])
      .apply(([queueArn, tableArn, topicArn]) =>
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
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:GetItem',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: topicArn,
            },
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction'],
              Resource: `arn:aws:lambda:${region}:*:function:transaction-validator-${environmentSuffix}`,
            },
          ],
        })
      ),
  }
);

// CloudWatch Log Group for Processor Lambda
const processorLogGroup = new aws.cloudwatch.LogGroup(
  `/aws/lambda/transaction-processor-${environmentSuffix}`,
  {
    name: `/aws/lambda/transaction-processor-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// Transaction Processor Lambda Function
const processorLambda = new aws.lambda.Function(
  `transaction-processor-${environmentSuffix}`,
  {
    name: `transaction-processor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: processorRole.arn,
    memorySize: 512,
    timeout: 300,
    environment: {
      variables: {
        TABLE_NAME: transactionsTable.name,
        TOPIC_ARN: notificationTopic.arn,
        VALIDATOR_FUNCTION: `transaction-validator-${environmentSuffix}`,
        ENVIRONMENT: environmentSuffix,
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const dynamodb = new DynamoDBClient({ region: '${region}' });
const sns = new SNSClient({ region: '${region}' });
const lambda = new LambdaClient({ region: '${region}' });

exports.handler = async (event) => {
    console.log('Processing transactions:', JSON.stringify(event));

    const results = [];

    for (const record of event.Records) {
        try {
            const transaction = JSON.parse(record.body);
            console.log('Processing transaction:', transaction.transactionId);

            // Invoke validator
            const validationResult = await lambda.send(new InvokeCommand({
                FunctionName: process.env.VALIDATOR_FUNCTION,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({ transaction })
            }));

            const validationResponse = JSON.parse(
                new TextDecoder().decode(validationResult.Payload)
            );
            const validation = JSON.parse(validationResponse.body);

            // Update transaction status
            transaction.validated = validation.valid;
            transaction.validationErrors = validation.errors || [];
            transaction.processedAt = Date.now();
            transaction.status = validation.valid ? 'processed' : 'failed';

            // Store in DynamoDB
            await dynamodb.send(new PutItemCommand({
                TableName: process.env.TABLE_NAME,
                Item: {
                    transactionId: { S: transaction.transactionId },
                    timestamp: { N: transaction.processedAt.toString() },
                    amount: { N: transaction.amount.toString() },
                    cardNumber: { S: transaction.cardNumber },
                    status: { S: transaction.status },
                    validated: { BOOL: transaction.validated },
                    receivedAt: { N: transaction.receivedAt.toString() },
                    validationErrors: { S: JSON.stringify(transaction.validationErrors) }
                }
            }));

            // Publish notification
            await sns.send(new PublishCommand({
                TopicArn: process.env.TOPIC_ARN,
                Subject: \`Transaction \${transaction.status}\`,
                Message: JSON.stringify({
                    transactionId: transaction.transactionId,
                    status: transaction.status,
                    amount: transaction.amount,
                    timestamp: transaction.processedAt
                })
            }));

            console.log('Transaction processed successfully:', transaction.transactionId);
            results.push({ transactionId: transaction.transactionId, success: true });

        } catch (error) {
            console.error('Error processing transaction:', error);
            results.push({ error: error.message, success: false });
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ processed: results.length, results })
    };
};
`),
      'package.json': new pulumi.asset.StringAsset(
        JSON.stringify({
          name: 'transaction-processor',
          version: '1.0.0',
          dependencies: {
            '@aws-sdk/client-dynamodb': '^3.0.0',
            '@aws-sdk/client-sns': '^3.0.0',
            '@aws-sdk/client-lambda': '^3.0.0',
          },
        })
      ),
    }),
    tracingConfig: {
      mode: 'Active',
    },
    tags: {
      Environment: environmentSuffix,
      Function: 'TransactionProcessor',
    },
  },
  { dependsOn: [processorLogGroup] }
);

// Event Source Mapping for SQS to Processor Lambda
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventSourceMapping = new aws.lambda.EventSourceMapping(
  `transaction-processor-trigger-${environmentSuffix}`,
  {
    eventSourceArn: transactionQueue.arn,
    functionName: processorLambda.name,
    batchSize: 10,
    maximumBatchingWindowInSeconds: 5,
  }
);

// IAM Role for Transaction Validator Lambda
const validatorRole = new aws.iam.Role(
  `transaction-validator-role-${environmentSuffix}`,
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
      Environment: environmentSuffix,
    },
  }
);

// Attach basic Lambda execution policy to validator role
new aws.iam.RolePolicyAttachment(
  `validator-basic-execution-${environmentSuffix}`,
  {
    role: validatorRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach X-Ray write policy to validator role
new aws.iam.RolePolicyAttachment(`validator-xray-${environmentSuffix}`, {
  role: validatorRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
});

// CloudWatch Log Group for Validator Lambda
const validatorLogGroup = new aws.cloudwatch.LogGroup(
  `/aws/lambda/transaction-validator-${environmentSuffix}`,
  {
    name: `/aws/lambda/transaction-validator-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// Transaction Validator Lambda Function
const validatorLambda = new aws.lambda.Function(
  `transaction-validator-${environmentSuffix}`,
  {
    name: `transaction-validator-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: validatorRole.arn,
    memorySize: 512,
    timeout: 30,
    environment: {
      variables: {
        ENVIRONMENT: environmentSuffix,
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Validating transaction:', JSON.stringify(event));

    const { transaction } = event;
    const errors = [];

    // Validate transaction ID
    if (!transaction.transactionId || transaction.transactionId.length < 10) {
        errors.push('Invalid transaction ID: must be at least 10 characters');
    }

    // Validate amount
    if (!transaction.amount || transaction.amount <= 0) {
        errors.push('Invalid amount: must be greater than 0');
    }

    if (transaction.amount > 100000) {
        errors.push('Invalid amount: exceeds maximum limit of 100,000');
    }

    // Validate card number (basic check - real implementation would use Luhn algorithm)
    if (!transaction.cardNumber || transaction.cardNumber.length < 13) {
        errors.push('Invalid card number: must be at least 13 digits');
    }

    // Check for card number pattern
    if (transaction.cardNumber && !/^[0-9]+$/.test(transaction.cardNumber)) {
        errors.push('Invalid card number: must contain only digits');
    }

    const valid = errors.length === 0;

    console.log('Validation result:', { transactionId: transaction.transactionId, valid, errors });

    return {
        statusCode: 200,
        body: JSON.stringify({
            valid,
            errors,
            transactionId: transaction.transactionId
        })
    };
};
`),
      'package.json': new pulumi.asset.StringAsset(
        JSON.stringify({
          name: 'transaction-validator',
          version: '1.0.0',
        })
      ),
    }),
    tracingConfig: {
      mode: 'Active',
    },
    tags: {
      Environment: environmentSuffix,
      Function: 'TransactionValidator',
    },
  },
  { dependsOn: [validatorLogGroup] }
);

// API Gateway REST API
const api = new aws.apigateway.RestApi(`transaction-api-${environmentSuffix}`, {
  name: `transaction-api-${environmentSuffix}`,
  description: 'API for serverless transaction processing',
  endpointConfiguration: {
    types: 'REGIONAL',
  },
  tags: {
    Environment: environmentSuffix,
  },
});

// API Gateway Resource for /transactions
const transactionsResource = new aws.apigateway.Resource(
  `transactions-resource-${environmentSuffix}`,
  {
    restApi: api.id,
    parentId: api.rootResourceId,
    pathPart: 'transactions',
  }
);

// Lambda permission for API Gateway to invoke receiver
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiGatewayInvokePermission = new aws.lambda.Permission(
  `api-gateway-invoke-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: receiverLambda.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*/*`,
  }
);

// API Gateway Method (POST)
const postMethod = new aws.apigateway.Method(
  `transactions-post-${environmentSuffix}`,
  {
    restApi: api.id,
    resourceId: transactionsResource.id,
    httpMethod: 'POST',
    authorization: 'NONE',
  }
);

// API Gateway Integration with Lambda
const integration = new aws.apigateway.Integration(
  `transactions-integration-${environmentSuffix}`,
  {
    restApi: api.id,
    resourceId: transactionsResource.id,
    httpMethod: postMethod.httpMethod,
    integrationHttpMethod: 'POST',
    type: 'AWS_PROXY',
    uri: receiverLambda.invokeArn,
  }
);

// API Gateway Deployment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deployment = new aws.apigateway.Deployment(
  `api-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
    description: 'Production deployment',
  },
  {
    dependsOn: [postMethod, integration],
  }
);

// API Gateway Stage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
  restApi: api.id,
  deployment: deployment.id,
  stageName: 'prod',
  tags: {
    Environment: environmentSuffix,
  },
});

// CloudWatch Alarm for SQS Queue Depth
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queueDepthAlarm = new aws.cloudwatch.MetricAlarm(
  `queue-depth-alarm-${environmentSuffix}`,
  {
    name: `queue-depth-alarm-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'ApproximateNumberOfMessagesVisible',
    namespace: 'AWS/SQS',
    period: 300,
    statistic: 'Average',
    threshold: 1000,
    alarmDescription: 'Alert when SQS queue depth exceeds 1000 messages',
    dimensions: {
      QueueName: transactionQueue.name,
    },
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Alarm for Lambda Errors (Receiver)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const receiverErrorAlarm = new aws.cloudwatch.MetricAlarm(
  `receiver-error-alarm-${environmentSuffix}`,
  {
    name: `receiver-error-alarm-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300,
    statistic: 'Sum',
    threshold: 10,
    alarmDescription: 'Alert when receiver Lambda errors exceed threshold',
    dimensions: {
      FunctionName: receiverLambda.name,
    },
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Alarm for Lambda Errors (Processor)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const processorErrorAlarm = new aws.cloudwatch.MetricAlarm(
  `processor-error-alarm-${environmentSuffix}`,
  {
    name: `processor-error-alarm-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300,
    statistic: 'Sum',
    threshold: 10,
    alarmDescription: 'Alert when processor Lambda errors exceed threshold',
    dimensions: {
      FunctionName: processorLambda.name,
    },
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Alarm for API Gateway 4xx Errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const api4xxAlarm = new aws.cloudwatch.MetricAlarm(
  `api-4xx-alarm-${environmentSuffix}`,
  {
    name: `api-4xx-alarm-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: '4XXError',
    namespace: 'AWS/ApiGateway',
    period: 300,
    statistic: 'Sum',
    threshold: 50,
    alarmDescription: 'Alert when API Gateway 4xx errors exceed threshold',
    dimensions: {
      ApiName: api.name,
    },
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Alarm for API Gateway 5xx Errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const api5xxAlarm = new aws.cloudwatch.MetricAlarm(
  `api-5xx-alarm-${environmentSuffix}`,
  {
    name: `api-5xx-alarm-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: '5XXError',
    namespace: 'AWS/ApiGateway',
    period: 300,
    statistic: 'Sum',
    threshold: 10,
    alarmDescription: 'Alert when API Gateway 5xx errors exceed threshold',
    dimensions: {
      ApiName: api.name,
    },
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// Exports
export const apiUrl = pulumi.interpolate`${api.executionArn}/prod`;
export const apiEndpoint = pulumi.interpolate`https://${api.id}.execute-api.${region}.amazonaws.com/prod/transactions`;
export const queueUrl = transactionQueue.url;
export const tableName = transactionsTable.name;
export const topicArn = notificationTopic.arn;
export const receiverFunctionName = receiverLambda.name;
export const processorFunctionName = processorLambda.name;
export const validatorFunctionName = validatorLambda.name;
