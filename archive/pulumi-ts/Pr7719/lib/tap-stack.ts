import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { LambdaComponent } from './lambda-component';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly table: pulumi.Output<string>;
  public readonly processorFunctionArn: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Common tags for cost allocation
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'DataProcessing',
      ManagedBy: 'Pulumi',
      CostCenter: 'Engineering',
    };

    // DynamoDB Table with on-demand billing (auto-scaling)
    const dataTable = new aws.dynamodb.Table(
      `data-table-${environmentSuffix}`,
      {
        attributes: [
          { name: 'id', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        hashKey: 'id',
        rangeKey: 'timestamp',
        billingMode: 'PAY_PER_REQUEST', // On-demand auto-scaling
        tags: commonTags,
      },
      { parent: this }
    );

    // Dead Letter Queue for Lambda failures
    const dlq = new aws.sqs.Queue(
      `lambda-dlq-${environmentSuffix}`,
      {
        name: `lambda-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: commonTags,
      },
      { parent: this }
    );

    // IAM Role for Lambda with least privilege
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // Scoped IAM policy with specific permissions
    new aws.iam.RolePolicy(
      `lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([dataTable.arn, dlq.arn])
          .apply(([tableArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                    'dynamodb:UpdateItem',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: 'arn:aws:logs:*:*:log-group:/aws/lambda/*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Data Processor Lambda using reusable component with provisioned concurrency
    const processorComponent = new LambdaComponent(
      'processor',
      {
        environmentSuffix,
        functionName: `processor-${environmentSuffix}`,
        handler: 'index.handler',
        memorySize: 512, // Right-sized based on metrics
        role: lambdaRole,
        deadLetterQueue: dlq,
        provisionedConcurrency: 1, // Minimize cold starts (reduced to 1 for account limits)
        logRetentionDays: 7,
        tags: commonTags,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
          const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
          const dynamodb = new DynamoDBClient({ region: 'us-east-1' });

          exports.handler = async (event) => {
            try {
              const params = {
                TableName: process.env.TABLE_NAME,
                Item: {
                  id: { S: event.id },
                  timestamp: { N: Date.now().toString() },
                  data: { S: JSON.stringify(event.data) }
                }
              };
              await dynamodb.send(new PutItemCommand(params));
              return { statusCode: 200, body: 'Success' };
            } catch (error) {
              console.error('Error processing data:', error);
              throw error; // Will be sent to DLQ
            }
          };
        `),
        }),
        environment: {
          variables: {
            TABLE_NAME: dataTable.name,
          },
        },
      },
      { parent: this }
    );

    // Data Validator Lambda using reusable component
    const validatorComponent = new LambdaComponent(
      'validator',
      {
        environmentSuffix,
        functionName: `validator-${environmentSuffix}`,
        handler: 'index.handler',
        memorySize: 512, // Right-sized
        role: lambdaRole,
        deadLetterQueue: dlq,
        logRetentionDays: 7,
        tags: commonTags,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
          exports.handler = async (event) => {
            try {
              if (!event.data) {
                throw new Error('Invalid data: missing data field');
              }
              return { valid: true, data: event.data };
            } catch (error) {
              console.error('Validation error:', error);
              throw error;
            }
          };
        `),
        }),
      },
      { parent: this }
    );

    // Data Enricher Lambda using reusable component
    const enricherComponent = new LambdaComponent(
      'enricher',
      {
        environmentSuffix,
        functionName: `enricher-${environmentSuffix}`,
        handler: 'index.handler',
        memorySize: 768, // Slightly more memory for enrichment
        role: lambdaRole,
        deadLetterQueue: dlq,
        logRetentionDays: 7,
        tags: commonTags,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
          exports.handler = async (event) => {
            try {
              return {
                ...event,
                enriched: true,
                enrichedAt: Date.now(),
                version: '1.0'
              };
            } catch (error) {
              console.error('Enrichment error:', error);
              throw error;
            }
          };
        `),
        }),
      },
      { parent: this }
    );

    // CloudWatch Alarms for DLQ monitoring
    new aws.cloudwatch.MetricAlarm(
      `dlq-alarm-${environmentSuffix}`,
      {
        name: `dlq-messages-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ApproximateNumberOfMessagesVisible',
        namespace: 'AWS/SQS',
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when messages appear in DLQ',
        dimensions: {
          QueueName: dlq.name,
        },
        tags: commonTags,
      },
      { parent: this }
    );

    this.table = dataTable.name;
    this.processorFunctionArn = processorComponent.function.arn;
    this.dlqUrl = dlq.url;

    this.registerOutputs({
      tableName: this.table,
      processorFunctionArn: this.processorFunctionArn,
      validatorFunctionArn: validatorComponent.function.arn,
      enricherFunctionArn: enricherComponent.function.arn,
      dlqUrl: this.dlqUrl,
      dlqArn: dlq.arn,
    });
  }
}
