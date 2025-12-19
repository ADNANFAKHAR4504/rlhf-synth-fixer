/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the serverless file processing pipeline.
 * Orchestrates S3, Lambda, SQS, DynamoDB, and API Gateway resources.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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
 * Main Pulumi component for the serverless file processing pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly validatorFunctionName: pulumi.Output<string>;
  public readonly processorFunctionName: pulumi.Output<string>;
  public readonly aggregatorFunctionName: pulumi.Output<string>;
  public readonly processingTableName: pulumi.Output<string>;
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly validatorQueueUrl: pulumi.Output<string>;
  public readonly processorQueueUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Merge required tags
    const resourceTags = {
      ...tags,
      Environment: 'Production',
      Team: 'Analytics',
    };

    // ========== S3 Bucket ==========
    const bucket = new aws.s3.Bucket(
      `file-processing-bucket-${environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== DynamoDB Table ==========
    const processingTable = new aws.dynamodb.Table(
      `processing-status-table-${environmentSuffix}`,
      {
        name: `processing-status-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'fileId',
        attributes: [
          {
            name: 'fileId',
            type: 'S',
          },
        ],
        ttl: {
          enabled: true,
          attributeName: 'expirationTime',
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== Dead Letter Queues ==========
    const validatorDlq = new aws.sqs.Queue(
      `validator-dlq-${environmentSuffix}`,
      {
        name: `validator-dlq-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorDlq = new aws.sqs.Queue(
      `processor-dlq-${environmentSuffix}`,
      {
        name: `processor-dlq-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorDlq = new aws.sqs.Queue(
      `aggregator-dlq-${environmentSuffix}`,
      {
        name: `aggregator-dlq-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== SQS FIFO Queues ==========
    const validatorQueue = new aws.sqs.Queue(
      `validator-queue-${environmentSuffix}`,
      {
        name: `validator-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.interpolate`{
          "deadLetterTargetArn": "${validatorDlq.arn}",
          "maxReceiveCount": 3
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorQueue = new aws.sqs.Queue(
      `processor-queue-${environmentSuffix}`,
      {
        name: `processor-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.interpolate`{
          "deadLetterTargetArn": "${processorDlq.arn}",
          "maxReceiveCount": 3
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorQueue = new aws.sqs.Queue(
      `aggregator-queue-${environmentSuffix}`,
      {
        name: `aggregator-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.interpolate`{
          "deadLetterTargetArn": "${aggregatorDlq.arn}",
          "maxReceiveCount": 3
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== IAM Roles for Lambda Functions ==========
    const validatorRole = new aws.iam.Role(
      `validator-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorRole = new aws.iam.Role(
      `processor-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorRole = new aws.iam.Role(
      `aggregator-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `validator-basic-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `processor-basic-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `aggregator-basic-${environmentSuffix}`,
      {
        role: aggregatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Validator Lambda permissions
    new aws.iam.RolePolicy(
      `validator-policy-${environmentSuffix}`,
      {
        role: validatorRole.id,
        policy: pulumi
          .all([bucket.arn, processorQueue.arn, processingTable.arn])
          .apply(([bucketArn, queueArn, tableArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:GetObjectVersion'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Processor Lambda permissions
    new aws.iam.RolePolicy(
      `processor-policy-${environmentSuffix}`,
      {
        role: processorRole.id,
        policy: pulumi
          .all([validatorQueue.arn, aggregatorQueue.arn, processingTable.arn])
          .apply(([validatorQueueArn, aggregatorQueueArn, tableArn]) =>
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
                  Resource: validatorQueueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: aggregatorQueueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Aggregator Lambda permissions
    new aws.iam.RolePolicy(
      `aggregator-policy-${environmentSuffix}`,
      {
        role: aggregatorRole.id,
        policy: pulumi
          .all([processorQueue.arn, processingTable.arn])
          .apply(([queueArn, tableArn]) =>
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
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ========== CloudWatch Log Groups ==========
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `validator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/file-validator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/data-processor-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorLogGroup = new aws.cloudwatch.LogGroup(
      `aggregator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/result-aggregator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== Lambda Functions ==========
    const validatorFunction = new aws.lambda.Function(
      `file-validator-${environmentSuffix}`,
      {
        name: `file-validator-${environmentSuffix}`,
        runtime: 'provided.al2023',
        handler: 'bootstrap',
        role: validatorRole.arn,
        memorySize: 512,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            `${__dirname}/lambda/validator/bootstrap`
          ),
        }),
        environment: {
          variables: {
            PROCESSOR_QUEUE_URL: processorQueue.url,
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [validatorLogGroup] }
    );

    const processorFunction = new aws.lambda.Function(
      `data-processor-${environmentSuffix}`,
      {
        name: `data-processor-${environmentSuffix}`,
        runtime: 'provided.al2023',
        handler: 'bootstrap',
        role: processorRole.arn,
        memorySize: 512,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            `${__dirname}/lambda/processor/bootstrap`
          ),
        }),
        environment: {
          variables: {
            AGGREGATOR_QUEUE_URL: aggregatorQueue.url,
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [processorLogGroup] }
    );

    const aggregatorFunction = new aws.lambda.Function(
      `result-aggregator-${environmentSuffix}`,
      {
        name: `result-aggregator-${environmentSuffix}`,
        runtime: 'provided.al2023',
        handler: 'bootstrap',
        role: aggregatorRole.arn,
        memorySize: 512,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            `${__dirname}/lambda/aggregator/bootstrap`
          ),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [aggregatorLogGroup] }
    );

    // ========== S3 Event Notification ==========
    // Allow S3 to invoke validator Lambda
    new aws.lambda.Permission(
      `s3-invoke-validator-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.arn,
        principal: 's3.amazonaws.com',
        sourceArn: bucket.arn,
      },
      { parent: this }
    );

    // S3 bucket notification
    new aws.s3.BucketNotification(
      `bucket-notification-${environmentSuffix}`,
      {
        bucket: bucket.id,
        lambdaFunctions: [
          {
            lambdaFunctionArn: validatorFunction.arn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
      },
      { parent: this }
    );

    // ========== SQS Event Source Mappings ==========
    new aws.lambda.EventSourceMapping(
      `validator-queue-trigger-${environmentSuffix}`,
      {
        eventSourceArn: validatorQueue.arn,
        functionName: processorFunction.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    new aws.lambda.EventSourceMapping(
      `processor-queue-trigger-${environmentSuffix}`,
      {
        eventSourceArn: processorQueue.arn,
        functionName: aggregatorFunction.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    // ========== API Gateway for Status Queries ==========
    // Status query Lambda function
    const statusQueryRole = new aws.iam.Role(
      `status-query-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `status-query-basic-${environmentSuffix}`,
      {
        role: statusQueryRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `status-query-policy-${environmentSuffix}`,
      {
        role: statusQueryRole.id,
        policy: processingTable.arn.apply(tableArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:GetItem', 'dynamodb:Query'],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const statusQueryLogGroup = new aws.cloudwatch.LogGroup(
      `status-query-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/status-query-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    const statusQueryFunction = new aws.lambda.Function(
      `status-query-${environmentSuffix}`,
      {
        name: `status-query-${environmentSuffix}`,
        runtime: 'provided.al2023',
        handler: 'bootstrap',
        role: statusQueryRole.arn,
        memorySize: 512,
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            `${__dirname}/lambda/status-query/bootstrap`
          ),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [statusQueryLogGroup] }
    );

    // REST API
    const api = new aws.apigateway.RestApi(
      `processing-api-${environmentSuffix}`,
      {
        name: `processing-api-${environmentSuffix}`,
        description: 'API for querying file processing status',
        tags: resourceTags,
      },
      { parent: this }
    );

    // API Resource: /status
    const statusResource = new aws.apigateway.Resource(
      `status-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'status',
      },
      { parent: this }
    );

    // API Resource: /status/{fileId}
    const fileIdResource = new aws.apigateway.Resource(
      `file-id-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: statusResource.id,
        pathPart: '{fileId}',
      },
      { parent: this }
    );

    // GET method
    const getMethod = new aws.apigateway.Method(
      `get-status-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: fileIdResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Lambda integration
    new aws.lambda.Permission(
      `api-invoke-status-query-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: statusQueryFunction.arn,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    const integration = new aws.apigateway.Integration(
      `status-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: fileIdResource.id,
        httpMethod: getMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: statusQueryFunction.invokeArn,
      },
      { parent: this }
    );

    // Deployment
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: pulumi
            .all([
              statusResource.id,
              fileIdResource.id,
              getMethod.id,
              integration.id,
            ])
            .apply(ids => JSON.stringify(ids)),
        },
      },
      { parent: this, dependsOn: [getMethod, integration] }
    );

    // Stage with throttling
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        tags: resourceTags,
      },
      { parent: this }
    );

    // Method settings for throttling
    new aws.apigateway.MethodSettings(
      `method-settings-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 2000,
          throttlingRateLimit: 1000,
        },
      },
      { parent: this }
    );

    // ========== Outputs ==========
    this.bucketName = bucket.id;
    this.validatorFunctionName = validatorFunction.name;
    this.processorFunctionName = processorFunction.name;
    this.aggregatorFunctionName = aggregatorFunction.name;
    this.processingTableName = processingTable.name;
    this.apiEndpoint = pulumi.interpolate`${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}/status`;
    this.validatorQueueUrl = validatorQueue.url;
    this.processorQueueUrl = processorQueue.url;

    this.registerOutputs({
      bucketName: this.bucketName,
      validatorFunctionName: this.validatorFunctionName,
      processorFunctionName: this.processorFunctionName,
      aggregatorFunctionName: this.aggregatorFunctionName,
      processingTableName: this.processingTableName,
      apiEndpoint: this.apiEndpoint,
      validatorQueueUrl: this.validatorQueueUrl,
      processorQueueUrl: this.processorQueueUrl,
    });
  }
}
