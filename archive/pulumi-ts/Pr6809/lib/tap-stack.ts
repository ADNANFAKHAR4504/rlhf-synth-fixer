/* eslint-disable prettier/prettier */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as path from 'path';

export interface TapStackArgs {
  // future extension point for parameterization
}

export default class TapStack extends pulumi.ComponentResource {
  public readonly apiGatewayUrl: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly dynamodbTableArn: pulumi.Output<string>;

  private readonly environmentSuffix: string;
  private readonly region = 'us-east-1';

  constructor(
    name: string,
    _args: TapStackArgs = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:stack:TapStack', name, {}, opts);

    this.environmentSuffix = pulumi.getStack() || 'dev';

    const commonTags = {
      Environment: 'Production',
      Project: 'MarketAnalytics',
    };

    // ===== S3 Bucket for Raw Data Ingestion =====
    const marketDataBucket = new aws.s3.Bucket(
      `market-data-${this.environmentSuffix}`,
      {
        bucket: `market-data-${this.environmentSuffix.toLowerCase()}`,
        tags: commonTags,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
      },
      { parent: this }
    );

    // ===== DynamoDB Table for State Management =====
    const marketDataTable = new aws.dynamodb.Table(
      `MarketDataState-${this.environmentSuffix}`,
      {
        name: `MarketDataState-${this.environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'symbol',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'symbol', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: commonTags,
      },
      { parent: this }
    );

    // ===== SQS Queues =====
    const deadLetterQueue = new aws.sqs.Queue(
      `ProcessingDLQ-${this.environmentSuffix}`,
      {
        name: `ProcessingDLQ-${this.environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: commonTags,
      },
      { parent: this }
    );

    const processingQueue = new aws.sqs.Queue(
      `ProcessingQueue-${this.environmentSuffix}`,
      {
        name: `ProcessingQueue-${this.environmentSuffix}`,
        messageRetentionSeconds: 345600, // 4 days
        visibilityTimeoutSeconds: 300, // 5 minutes
        redrivePolicy: deadLetterQueue.arn.apply(arn =>
          JSON.stringify({
            deadLetterTargetArn: arn,
            maxReceiveCount: 3,
          })
        ),
        tags: commonTags,
      },
      { parent: this }
    );

    // ===== IAM Roles for Lambda Functions =====

    // DataIngestion Lambda Role
    const dataIngestionRole = new aws.iam.Role(
      `DataIngestion-Role-${this.environmentSuffix}`,
      {
        name: `DataIngestion-Role-${this.environmentSuffix}`,
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
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `DataIngestion-LambdaBasic-${this.environmentSuffix}`,
      {
        role: dataIngestionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `DataIngestion-XRay-${this.environmentSuffix}`,
      {
        role: dataIngestionRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    void new aws.iam.RolePolicy(
      `DataIngestion-Policy-${this.environmentSuffix}`,
      {
        role: dataIngestionRole.id,
        policy: pulumi
          .all([
            marketDataBucket.arn,
            processingQueue.arn,
            marketDataTable.arn,
            deadLetterQueue.arn,
          ])
          .apply(([bucketArn, queueArn, tableArn, dlqArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:GetObjectVersion'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Deny',
                  Action: [
                    's3:DeleteBucket',
                    's3:DeleteObject',
                    's3:PutBucketPolicy',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: [queueArn, dlqArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
                {
                  Effect: 'Deny',
                  Action: ['dynamodb:DeleteTable', 'dynamodb:DeleteItem'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // DataProcessor Lambda Role
    const dataProcessorRole = new aws.iam.Role(
      `DataProcessor-Role-${this.environmentSuffix}`,
      {
        name: `DataProcessor-Role-${this.environmentSuffix}`,
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
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `DataProcessor-LambdaBasic-${this.environmentSuffix}`,
      {
        role: dataProcessorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `DataProcessor-XRay-${this.environmentSuffix}`,
      {
        role: dataProcessorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    void new aws.iam.RolePolicy(
      `DataProcessor-Policy-${this.environmentSuffix}`,
      {
        role: dataProcessorRole.id,
        policy: pulumi
          .all([processingQueue.arn, marketDataTable.arn])
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
                  Effect: 'Deny',
                  Action: ['sqs:DeleteQueue', 'sqs:PurgeQueue'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Deny',
                  Action: ['dynamodb:DeleteTable', 'dynamodb:DeleteItem'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['events:PutEvents'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // DataAggregator Lambda Role
    const dataAggregatorRole = new aws.iam.Role(
      `DataAggregator-Role-${this.environmentSuffix}`,
      {
        name: `DataAggregator-Role-${this.environmentSuffix}`,
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
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `DataAggregator-LambdaBasic-${this.environmentSuffix}`,
      {
        role: dataAggregatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `DataAggregator-XRay-${this.environmentSuffix}`,
      {
        role: dataAggregatorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    void new aws.iam.RolePolicy(
      `DataAggregator-Policy-${this.environmentSuffix}`,
      {
        role: dataAggregatorRole.id,
        policy: pulumi
          .all([marketDataTable.arn, deadLetterQueue.arn])
          .apply(([tableArn, dlqArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:Scan',
                    'dynamodb:Query',
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Deny',
                  Action: ['dynamodb:DeleteTable', 'dynamodb:DeleteItem'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['cloudwatch:PutMetricData'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: dlqArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ===== CloudWatch Log Groups =====
    const dataIngestionLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/DataIngestion-${this.environmentSuffix}`,
      {
        name: `/aws/lambda/DataIngestion-${this.environmentSuffix}`,
        retentionInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    const dataProcessorLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/DataProcessor-${this.environmentSuffix}`,
      {
        name: `/aws/lambda/DataProcessor-${this.environmentSuffix}`,
        retentionInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    const dataAggregatorLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/DataAggregator-${this.environmentSuffix}`,
      {
        name: `/aws/lambda/DataAggregator-${this.environmentSuffix}`,
        retentionInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    // ===== Lambda Functions =====
    const lambdaCodeArchive = new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
    });

    const dataIngestionLambda = new aws.lambda.Function(
      `DataIngestion-${this.environmentSuffix}`,
      {
        name: `DataIngestion-${this.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'dataIngestion.handler',
        role: dataIngestionRole.arn,
        memorySize: 3008,
        timeout: 300,
        code: lambdaCodeArchive,
        environment: {
          variables: {
            SQS_QUEUE_URL: processingQueue.url,
            DYNAMODB_TABLE_NAME: marketDataTable.name,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [dataIngestionLogGroup] }
    );

    const allowS3Invocation = new aws.lambda.Permission(
      `DataIngestion-S3Permission-${this.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: dataIngestionLambda.arn,
        principal: 's3.amazonaws.com',
        sourceArn: marketDataBucket.arn,
      },
      { parent: this }
    );

    void new aws.s3.BucketNotification(
      `market-data-notification-${this.environmentSuffix}`,
      {
        bucket: marketDataBucket.id,
        lambdaFunctions: [
          {
            lambdaFunctionArn: dataIngestionLambda.arn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
      },
      { parent: this, dependsOn: [allowS3Invocation] }
    );

    const dataProcessorLambda = new aws.lambda.Function(
      `DataProcessor-${this.environmentSuffix}`,
      {
        name: `DataProcessor-${this.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'dataProcessor.handler',
        role: dataProcessorRole.arn,
        memorySize: 3008,
        timeout: 300,
        code: lambdaCodeArchive,
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: marketDataTable.name,
            EVENT_BUS_NAME: 'default',
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [dataProcessorLogGroup] }
    );

    void new aws.lambda.EventSourceMapping(
      `DataProcessor-SQS-${this.environmentSuffix}`,
      {
        eventSourceArn: processingQueue.arn,
        functionName: dataProcessorLambda.name,
        batchSize: 10,
      },
      { parent: this }
    );

    const dataAggregatorLambda = new aws.lambda.Function(
      `DataAggregator-${this.environmentSuffix}`,
      {
        name: `DataAggregator-${this.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'dataAggregator.handler',
        role: dataAggregatorRole.arn,
        memorySize: 3008,
        timeout: 300,
        code: lambdaCodeArchive,
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: marketDataTable.name,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [dataAggregatorLogGroup] }
    );

    // ===== EventBridge Rules =====
    const scheduledRule = new aws.cloudwatch.EventRule(
      `DataAggregator-Schedule-${this.environmentSuffix}`,
      {
        name: `DataAggregator-Schedule-${this.environmentSuffix}`,
        description: 'Trigger DataAggregator every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: commonTags,
      },
      { parent: this }
    );

    const allowEventBridgeInvocation = new aws.lambda.Permission(
      `DataAggregator-EventBridge-${this.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: dataAggregatorLambda.arn,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    void new aws.cloudwatch.EventTarget(
      `DataAggregator-Target-${this.environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: dataAggregatorLambda.arn,
      },
      { parent: this, dependsOn: [allowEventBridgeInvocation] }
    );

    // ===== API Gateway =====
    const api = new aws.apigateway.RestApi(
      `MarketDataAPI-${this.environmentSuffix}`,
      {
        name: `MarketDataAPI-${this.environmentSuffix}`,
        description: 'Market Data Ingestion API',
        tags: commonTags,
      },
      { parent: this }
    );

    const ingestResource = new aws.apigateway.Resource(
      `ingest-resource-${this.environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'ingest',
      },
      { parent: this }
    );

    const ingestMethod = new aws.apigateway.Method(
      `ingest-post-${this.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: ingestResource.id,
        httpMethod: 'POST',
        authorization: 'AWS_IAM',
      },
      { parent: this }
    );

    const apiLambdaPermission = new aws.lambda.Permission(
      `DataIngestion-APIGateway-${this.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: dataIngestionLambda.arn,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    const ingestIntegration = new aws.apigateway.Integration(
      `ingest-integration-${this.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: ingestResource.id,
        httpMethod: ingestMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: dataIngestionLambda.invokeArn,
      },
      { parent: this, dependsOn: [apiLambdaPermission] }
    );

    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${this.environmentSuffix}`,
      {
        restApi: api.id,
      },
      { parent: this, dependsOn: [ingestIntegration] }
    );

    const apiStage = new aws.apigateway.Stage(
      `api-stage-${this.environmentSuffix}`,
      {
        deployment: deployment.id,
        restApi: api.id,
        stageName: 'prod',
        tags: commonTags,
      },
      { parent: this }
    );

    void new aws.apigateway.MethodSettings(
      `api-throttle-${this.environmentSuffix}`,
      {
        restApi: api.id,
        stageName: apiStage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 10000,
          throttlingRateLimit: 10000,
        },
      },
      { parent: this }
    );

    // ===== CloudWatch Metric Filters =====
    void new aws.cloudwatch.LogMetricFilter(
      `DataIngestion-error-filter-${this.environmentSuffix}`,
      {
        name: `DataIngestion-ErrorFilter-${this.environmentSuffix}`,
        logGroupName: dataIngestionLogGroup.name,
        pattern: '?ERROR ?Exception',
        metricTransformation: {
          name: 'DataIngestionErrorCount',
          namespace: 'MarketAnalytics',
          value: '1',
        },
      },
      { parent: this }
    );

    void new aws.cloudwatch.LogMetricFilter(
      `DataProcessor-error-filter-${this.environmentSuffix}`,
      {
        name: `DataProcessor-ErrorFilter-${this.environmentSuffix}`,
        logGroupName: dataProcessorLogGroup.name,
        pattern: '?ERROR ?Exception',
        metricTransformation: {
          name: 'DataProcessorErrorCount',
          namespace: 'MarketAnalytics',
          value: '1',
        },
      },
      { parent: this }
    );

    void new aws.cloudwatch.LogMetricFilter(
      `DataAggregator-error-filter-${this.environmentSuffix}`,
      {
        name: `DataAggregator-ErrorFilter-${this.environmentSuffix}`,
        logGroupName: dataAggregatorLogGroup.name,
        pattern: '?ERROR ?Exception',
        metricTransformation: {
          name: 'DataAggregatorErrorCount',
          namespace: 'MarketAnalytics',
          value: '1',
        },
      },
      { parent: this }
    );

    // ===== Expose outputs =====
    this.apiGatewayUrl = pulumi.interpolate`https://${api.id}.execute-api.${this.region}.amazonaws.com/prod/ingest`;
    this.s3BucketName = marketDataBucket.bucket;
    this.dynamodbTableArn = marketDataTable.arn;

    this.registerOutputs({
      apiGatewayUrl: this.apiGatewayUrl,
      s3BucketName: this.s3BucketName,
      dynamodbTableArn: this.dynamodbTableArn,
    });
  }
}
