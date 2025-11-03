import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const environment = config.get('environment') || 'dev';
const region = aws.getRegionOutput().name;

// Common tags for all resources
const commonTags = {
  Environment: environment,
  CostCenter: 'data-engineering',
  ManagedBy: 'pulumi',
  Project: 'etl-optimization',
};

// KMS key for encrypting Lambda environment variables
const kmsKey = new aws.kms.Key(`lambda-encryption-key-${environmentSuffix}`, {
  description: 'KMS key for Lambda environment variable encryption',
  enableKeyRotation: true,
  tags: commonTags,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const kmsKeyAlias = new aws.kms.Alias(`lambda-key-alias-${environmentSuffix}`, {
  name: `alias/lambda-etl-${environmentSuffix}`,
  targetKeyId: kmsKey.id,
});

// S3 bucket for ETL data
const dataBucket = new aws.s3.Bucket(`etl-data-bucket-${environmentSuffix}`, {
  bucketPrefix: `etl-data-${environmentSuffix}`,
  forceDestroy: true,
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  },
  tags: commonTags,
});

// DynamoDB table for ETL metadata and state management
const metadataTable = new aws.dynamodb.Table(
  `etl-metadata-table-${environmentSuffix}`,
  {
    name: `etl-metadata-${environmentSuffix}`,
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'jobId',
    rangeKey: 'timestamp',
    attributes: [
      { name: 'jobId', type: 'S' },
      { name: 'timestamp', type: 'N' },
    ],
    serverSideEncryption: {
      enabled: true,
    },
    pointInTimeRecovery: {
      enabled: true,
    },
    tags: commonTags,
  }
);

// SQS Dead Letter Queue for failed Lambda executions
const deadLetterQueue = new aws.sqs.Queue(`etl-dlq-${environmentSuffix}`, {
  name: `etl-dlq-${environmentSuffix}`,
  messageRetentionSeconds: 1209600, // 14 days
  tags: commonTags,
});

// Lambda Layer for shared dependencies
const sharedDependenciesLayer = new aws.lambda.LayerVersion(
  `shared-deps-layer-${environmentSuffix}`,
  {
    layerName: `etl-shared-deps-${environmentSuffix}`,
    code: new pulumi.asset.AssetArchive({
      nodejs: new pulumi.asset.FileArchive(
        './lambda-layers/shared-dependencies'
      ),
    }),
    compatibleRuntimes: ['nodejs18.x'],
    description: 'Shared dependencies for ETL Lambda functions',
  }
);

// IAM role for API handler Lambda
const apiHandlerRole = new aws.iam.Role(
  `api-handler-role-${environmentSuffix}`,
  {
    name: `api-handler-role-${environmentSuffix}`,
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
    tags: commonTags,
  }
);

// IAM policy for API handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiHandlerPolicy = new aws.iam.RolePolicy(
  `api-handler-policy-${environmentSuffix}`,
  {
    role: apiHandlerRole.id,
    policy: pulumi
      .all([dataBucket.arn, metadataTable.arn, kmsKey.arn])
      .apply(([bucketArn, tableArn, keyArn]) =>
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
              Resource: 'arn:aws:logs:*:*:*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject'],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
              Resource: keyArn,
            },
            {
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: '*',
            },
          ],
        })
      ),
  }
);

// CloudWatch Log Group for API handler
const logRetentionDays = environment === 'prod' ? 30 : 7;

const apiHandlerLogGroup = new aws.cloudwatch.LogGroup(
  `api-handler-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/etl-api-handler-${environmentSuffix}`,
    retentionInDays: logRetentionDays,
    tags: commonTags,
  }
);

// API Handler Lambda Function (small function - 512MB)
const apiHandlerFunction = new aws.lambda.Function(
  `api-handler-${environmentSuffix}`,
  {
    name: `etl-api-handler-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: apiHandlerRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./lambda-functions/api-handler'),
    }),
    layers: [sharedDependenciesLayer.arn],
    memorySize: 512,
    timeout: 30,
    reservedConcurrentExecutions: 5,
    environment: {
      variables: {
        DATA_BUCKET: dataBucket.bucket,
        METADATA_TABLE: metadataTable.name,
        MAX_CONNECTIONS: '10',
        REGION: region,
        ENVIRONMENT: environment,
      },
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
      targetArn: deadLetterQueue.arn,
    },
    tracingConfig: {
      mode: 'Active',
    },
    tags: commonTags,
  },
  { dependsOn: [apiHandlerLogGroup] }
);

// IAM role for Batch Processor Lambda
const batchProcessorRole = new aws.iam.Role(
  `batch-processor-role-${environmentSuffix}`,
  {
    name: `batch-processor-role-${environmentSuffix}`,
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
    tags: commonTags,
  }
);

// IAM policy for Batch Processor
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const batchProcessorPolicy = new aws.iam.RolePolicy(
  `batch-processor-policy-${environmentSuffix}`,
  {
    role: batchProcessorRole.id,
    policy: pulumi
      .all([dataBucket.arn, metadataTable.arn, kmsKey.arn])
      .apply(([bucketArn, tableArn, keyArn]) =>
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
              Resource: 'arn:aws:logs:*:*:*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Resource: [bucketArn, `${bucketArn}/*`],
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:UpdateItem',
                'dynamodb:BatchWriteItem',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
              Resource: keyArn,
            },
            {
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: '*',
            },
          ],
        })
      ),
  }
);

// CloudWatch Log Group for Batch Processor
const batchProcessorLogGroup = new aws.cloudwatch.LogGroup(
  `batch-processor-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/etl-batch-processor-${environmentSuffix}`,
    retentionInDays: logRetentionDays,
    tags: commonTags,
  }
);

// Batch Processor Lambda Function (large function - 1024MB)
const batchProcessorFunction = new aws.lambda.Function(
  `batch-processor-${environmentSuffix}`,
  {
    name: `etl-batch-processor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: batchProcessorRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./lambda-functions/batch-processor'),
    }),
    layers: [sharedDependenciesLayer.arn],
    memorySize: 1024,
    timeout: 300,
    reservedConcurrentExecutions: 5,
    environment: {
      variables: {
        DATA_BUCKET: dataBucket.bucket,
        METADATA_TABLE: metadataTable.name,
        MAX_CONNECTIONS: '10',
        REGION: region,
        ENVIRONMENT: environment,
      },
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
      targetArn: deadLetterQueue.arn,
    },
    tracingConfig: {
      mode: 'Active',
    },
    tags: commonTags,
  },
  { dependsOn: [batchProcessorLogGroup] }
);

// Grant Lambda permission to write to DLQ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiHandlerDlqPermission = new aws.lambda.Permission(
  `api-handler-dlq-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: apiHandlerFunction.name,
    principal: 'sqs.amazonaws.com',
    sourceArn: deadLetterQueue.arn,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const batchProcessorDlqPermission = new aws.lambda.Permission(
  `batch-processor-dlq-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: batchProcessorFunction.name,
    principal: 'sqs.amazonaws.com',
    sourceArn: deadLetterQueue.arn,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const s3InvokePermission = new aws.lambda.Permission(
  `s3-invoke-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: batchProcessorFunction.name,
    principal: 's3.amazonaws.com',
    sourceArn: dataBucket.arn,
  }
);

// S3 bucket notification to trigger batch processor
// Must be created after Lambda permission is granted
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bucketNotification = new aws.s3.BucketNotification(
  `etl-bucket-notification-${environmentSuffix}`,
  {
    bucket: dataBucket.id,
    lambdaFunctions: [
      {
        lambdaFunctionArn: batchProcessorFunction.arn,
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'incoming/',
      },
    ],
  },
  { dependsOn: [s3InvokePermission] }
);

// CloudWatch Alarms for monitoring
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiHandlerErrorAlarm = new aws.cloudwatch.MetricAlarm(
  `api-handler-errors-${environmentSuffix}`,
  {
    name: `api-handler-errors-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300,
    statistic: 'Sum',
    threshold: 10,
    alarmDescription:
      'Alert when API handler has more than 10 errors in 5 minutes',
    dimensions: {
      FunctionName: apiHandlerFunction.name,
    },
    tags: commonTags,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const batchProcessorErrorAlarm = new aws.cloudwatch.MetricAlarm(
  `batch-processor-errors-${environmentSuffix}`,
  {
    name: `batch-processor-errors-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300,
    statistic: 'Sum',
    threshold: 5,
    alarmDescription:
      'Alert when batch processor has more than 5 errors in 5 minutes',
    dimensions: {
      FunctionName: batchProcessorFunction.name,
    },
    tags: commonTags,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dlqDepthAlarm = new aws.cloudwatch.MetricAlarm(
  `dlq-depth-${environmentSuffix}`,
  {
    name: `dlq-depth-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 1,
    metricName: 'ApproximateNumberOfMessagesVisible',
    namespace: 'AWS/SQS',
    period: 300,
    statistic: 'Average',
    threshold: 10,
    alarmDescription: 'Alert when DLQ has more than 10 messages',
    dimensions: {
      QueueName: deadLetterQueue.name,
    },
    tags: commonTags,
  }
);

// Exports
export const dataBucketName = dataBucket.bucket;
export const dataBucketArn = dataBucket.arn;
export const metadataTableName = metadataTable.name;
export const metadataTableArn = metadataTable.arn;
export const deadLetterQueueUrl = deadLetterQueue.url;
export const deadLetterQueueArn = deadLetterQueue.arn;
export const apiHandlerFunctionName = apiHandlerFunction.name;
export const apiHandlerFunctionArn = apiHandlerFunction.arn;
export const batchProcessorFunctionName = batchProcessorFunction.name;
export const batchProcessorFunctionArn = batchProcessorFunction.arn;
export const kmsKeyId = kmsKey.id;
export const kmsKeyArn = kmsKey.arn;
export const sharedLayerArn = sharedDependenciesLayer.arn;
