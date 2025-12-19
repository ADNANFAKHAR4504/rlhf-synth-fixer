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
  public readonly bucketName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const baseTags = {
      Environment: 'Production',
      Project: 'MarketAnalytics',
      ...((args.tags as Record<string, string>) || {}),
    };

    // Dead Letter Queue for failed messages
    const deadLetterQueue = new aws.sqs.Queue(
      `processing-dlq-${environmentSuffix}`,
      {
        messageRetentionSeconds: 345600, // 4 days
        tags: baseTags,
      },
      { parent: this }
    );

    // Main SQS Queue for processing
    const processingQueue = new aws.sqs.Queue(
      `processing-queue-${environmentSuffix}`,
      {
        name: `ProcessingQueue-${environmentSuffix}`,
        messageRetentionSeconds: 345600, // 4 days
        visibilityTimeoutSeconds: 300, // 5 minutes
        redrivePolicy: pulumi.jsonStringify({
          deadLetterTargetArn: deadLetterQueue.arn,
          maxReceiveCount: 3,
        }),
        tags: baseTags,
      },
      { parent: this }
    );

    // S3 Bucket for raw market data
    const dataBucket = new aws.s3.Bucket(
      `market-data-bucket-${environmentSuffix}`,
      {
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
        tags: baseTags,
      },
      { parent: this }
    );

    // S3 Bucket Public Access Block
    new aws.s3.BucketPublicAccessBlock(
      `market-data-bucket-pab-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // DynamoDB Table for market data state
    const marketDataTable = new aws.dynamodb.Table(
      `market-data-state-${environmentSuffix}`,
      {
        name: `MarketDataState-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this }
    );

    // IAM Role for DataIngestion Lambda
    const dataIngestionRole = new aws.iam.Role(
      `data-ingestion-role-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `data-ingestion-basic-${environmentSuffix}`,
      {
        role: dataIngestionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `data-ingestion-xray-${environmentSuffix}`,
      {
        role: dataIngestionRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    const dataIngestionPolicy = new aws.iam.RolePolicy(
      `data-ingestion-policy-${environmentSuffix}`,
      {
        role: dataIngestionRole.id,
        policy: pulumi
          .all([processingQueue.arn, marketDataTable.arn])
          .apply(([queueArn, tableArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
                {
                  Effect: 'Deny',
                  Action: 'dynamodb:DeleteTable',
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for DataIngestion Lambda
    const dataIngestionLogGroup = new aws.cloudwatch.LogGroup(
      `data-ingestion-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/DataIngestion-${environmentSuffix}`,
        retentionInDays: 7,
        tags: baseTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogMetricFilter(
      `data-ingestion-errors-${environmentSuffix}`,
      {
        logGroupName: dataIngestionLogGroup.name,
        name: `DataIngestionErrors-${environmentSuffix}`,
        pattern: '[ERROR]',
        metricTransformation: {
          name: 'DataIngestionErrorCount',
          namespace: 'MarketAnalytics',
          value: '1',
        },
      },
      { parent: this }
    );

    // DataIngestion Lambda Function
    const dataIngestionFunction = new aws.lambda.Function(
      `data-ingestion-${environmentSuffix}`,
      {
        name: `DataIngestion-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: dataIngestionRole.arn,
        memorySize: 1024,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/data-ingestion')
          ),
        }),
        environment: {
          variables: {
            QUEUE_URL: processingQueue.url,
            TABLE_NAME: marketDataTable.name,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: baseTags,
      },
      { parent: this, dependsOn: [dataIngestionLogGroup, dataIngestionPolicy] }
    );

    // IAM Role for DataProcessor Lambda
    const dataProcessorRole = new aws.iam.Role(
      `data-processor-role-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `data-processor-basic-${environmentSuffix}`,
      {
        role: dataProcessorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `data-processor-xray-${environmentSuffix}`,
      {
        role: dataProcessorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `data-processor-sqs-${environmentSuffix}`,
      {
        role: dataProcessorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole',
      },
      { parent: this }
    );

    const dataProcessorPolicy = new aws.iam.RolePolicy(
      `data-processor-policy-${environmentSuffix}`,
      {
        role: dataProcessorRole.id,
        policy: pulumi
          .all([marketDataTable.arn, deadLetterQueue.arn])
          .apply(([tableArn, dlqArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                    'dynamodb:UpdateItem',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: 'events:PutEvents',
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: dlqArn,
                },
                {
                  Effect: 'Deny',
                  Action: 'dynamodb:DeleteTable',
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for DataProcessor Lambda
    const dataProcessorLogGroup = new aws.cloudwatch.LogGroup(
      `data-processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/DataProcessor-${environmentSuffix}`,
        retentionInDays: 7,
        tags: baseTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogMetricFilter(
      `data-processor-errors-${environmentSuffix}`,
      {
        logGroupName: dataProcessorLogGroup.name,
        name: `DataProcessorErrors-${environmentSuffix}`,
        pattern: '[ERROR]',
        metricTransformation: {
          name: 'DataProcessorErrorCount',
          namespace: 'MarketAnalytics',
          value: '1',
        },
      },
      { parent: this }
    );

    // DataProcessor Lambda Function
    const dataProcessorFunction = new aws.lambda.Function(
      `data-processor-${environmentSuffix}`,
      {
        name: `DataProcessor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: dataProcessorRole.arn,
        memorySize: 1024,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/data-processor')
          ),
        }),
        environment: {
          variables: {
            TABLE_NAME: marketDataTable.name,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tags: baseTags,
      },
      { parent: this, dependsOn: [dataProcessorLogGroup, dataProcessorPolicy] }
    );

    // SQS Event Source Mapping for DataProcessor
    new aws.lambda.EventSourceMapping(
      `data-processor-sqs-trigger-${environmentSuffix}`,
      {
        eventSourceArn: processingQueue.arn,
        functionName: dataProcessorFunction.name,
        batchSize: 10,
      },
      { parent: this }
    );

    // IAM Role for DataAggregator Lambda
    const dataAggregatorRole = new aws.iam.Role(
      `data-aggregator-role-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `data-aggregator-basic-${environmentSuffix}`,
      {
        role: dataAggregatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `data-aggregator-xray-${environmentSuffix}`,
      {
        role: dataAggregatorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    const dataAggregatorPolicy = new aws.iam.RolePolicy(
      `data-aggregator-policy-${environmentSuffix}`,
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
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: dlqArn,
                },
                {
                  Effect: 'Deny',
                  Action: 'dynamodb:DeleteTable',
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for DataAggregator Lambda
    const dataAggregatorLogGroup = new aws.cloudwatch.LogGroup(
      `data-aggregator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/DataAggregator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: baseTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogMetricFilter(
      `data-aggregator-errors-${environmentSuffix}`,
      {
        logGroupName: dataAggregatorLogGroup.name,
        name: `DataAggregatorErrors-${environmentSuffix}`,
        pattern: '[ERROR]',
        metricTransformation: {
          name: 'DataAggregatorErrorCount',
          namespace: 'MarketAnalytics',
          value: '1',
        },
      },
      { parent: this }
    );

    // DataAggregator Lambda Function
    const dataAggregatorFunction = new aws.lambda.Function(
      `data-aggregator-${environmentSuffix}`,
      {
        name: `DataAggregator-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: dataAggregatorRole.arn,
        memorySize: 1024,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/data-aggregator')
          ),
        }),
        environment: {
          variables: {
            TABLE_NAME: marketDataTable.name,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tags: baseTags,
      },
      {
        parent: this,
        dependsOn: [dataAggregatorLogGroup, dataAggregatorPolicy],
      }
    );

    // EventBridge scheduled rule for DataAggregator (every 5 minutes)
    const scheduledRule = new aws.cloudwatch.EventRule(
      `data-aggregator-schedule-${environmentSuffix}`,
      {
        scheduleExpression: 'rate(5 minutes)',
        description: 'Trigger DataAggregator Lambda every 5 minutes',
        tags: baseTags,
      },
      { parent: this }
    );

    const scheduledRulePermission = new aws.lambda.Permission(
      `data-aggregator-schedule-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: dataAggregatorFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `data-aggregator-schedule-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: dataAggregatorFunction.arn,
      },
      { parent: this, dependsOn: [scheduledRulePermission] }
    );

    // EventBridge rule for custom events from DataProcessor
    const customEventRule = new aws.cloudwatch.EventRule(
      `data-processor-events-${environmentSuffix}`,
      {
        eventPattern: JSON.stringify({
          source: ['market.analytics.processor'],
          'detail-type': ['MarketDataProcessed'],
        }),
        description: 'Capture custom events from DataProcessor',
        tags: baseTags,
      },
      { parent: this }
    );

    const customEventPermission = new aws.lambda.Permission(
      `data-aggregator-event-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: dataAggregatorFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: customEventRule.arn,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `data-aggregator-event-target-${environmentSuffix}`,
      {
        rule: customEventRule.name,
        arn: dataAggregatorFunction.arn,
      },
      { parent: this, dependsOn: [customEventPermission] }
    );

    // S3 bucket notification to trigger DataIngestion Lambda
    new aws.iam.Role(
      `bucket-notification-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
            },
          ],
        }),
        tags: baseTags,
      },
      { parent: this }
    );

    const s3LambdaPermission = new aws.lambda.Permission(
      `s3-invoke-ingestion-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: dataIngestionFunction.name,
        principal: 's3.amazonaws.com',
        sourceArn: dataBucket.arn,
      },
      { parent: this }
    );

    new aws.s3.BucketNotification(
      `bucket-notification-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        lambdaFunctions: [
          {
            lambdaFunctionArn: dataIngestionFunction.arn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
      },
      { parent: this, dependsOn: [s3LambdaPermission] }
    );

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `market-data-api-${environmentSuffix}`,
      {
        name: `MarketDataAPI-${environmentSuffix}`,
        description: 'API for market data ingestion',
        tags: baseTags,
      },
      { parent: this }
    );

    const apiResource = new aws.apigateway.Resource(
      `ingest-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'ingest',
      },
      { parent: this }
    );

    const apiMethod = new aws.apigateway.Method(
      `ingest-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: 'POST',
        authorization: 'AWS_IAM',
      },
      { parent: this }
    );

    const apiIntegration = new aws.apigateway.Integration(
      `ingest-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: apiMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: dataIngestionFunction.invokeArn,
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      `api-invoke-ingestion-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: dataIngestionFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    const apiDeployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
      },
      { parent: this, dependsOn: [apiIntegration] }
    );

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-logs-${environmentSuffix}`,
      {
        name: `/aws/apigateway/MarketDataAPI-${environmentSuffix}`,
        retentionInDays: 7,
        tags: baseTags,
      },
      { parent: this }
    );

    const apiStage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: apiDeployment.id,
        stageName: 'prod',
        accessLogSettings: {
          destinationArn: apiLogGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            caller: '$context.identity.caller',
            user: '$context.identity.user',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            resourcePath: '$context.resourcePath',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
      },
      { parent: this, dependsOn: [apiLogGroup] }
    );

    // API Gateway Usage Plan for throttling
    new aws.apigateway.UsagePlan(
      `api-usage-plan-${environmentSuffix}`,
      {
        name: `MarketDataAPIUsagePlan-${environmentSuffix}`,
        apiStages: [
          {
            apiId: api.id,
            stage: apiStage.stageName,
          },
        ],
        throttleSettings: {
          burstLimit: 10000,
          rateLimit: 10000,
        },
        quotaSettings: {
          limit: 1000000,
          period: 'DAY',
        },
        tags: baseTags,
      },
      { parent: this }
    );

    // Export stack outputs
    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${aws.config.region}.amazonaws.com/${apiStage.stageName}/ingest`;
    this.bucketName = dataBucket.id;
    this.tableArn = marketDataTable.arn;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      bucketName: this.bucketName,
      tableArn: this.tableArn,
    });
  }
}
