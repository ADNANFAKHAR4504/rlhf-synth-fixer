# Serverless Data Processing Infrastructure - Optimized Implementation

This implementation provides an optimized serverless data processing infrastructure with proper Lambda memory sizing, reusable components, DynamoDB auto-scaling, dead letter queues, hardened IAM policies, cost tagging, log retention, and provisioned concurrency.

## File: lib/lambda-component.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaComponentArgs {
  environmentSuffix: string;
  functionName: string;
  handler: string;
  code: pulumi.asset.AssetArchive;
  memorySize: number;
  role: aws.iam.Role;
  environment?: { variables: { [key: string]: pulumi.Input<string> } };
  deadLetterQueue: aws.sqs.Queue;
  provisionedConcurrency?: number;
  logRetentionDays?: number;
  tags: { [key: string]: string };
}

export class LambdaComponent extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  constructor(name: string, args: LambdaComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:lambda:LambdaComponent', name, {}, opts);

    // Create log group with retention policy
    this.logGroup = new aws.cloudwatch.LogGroup(`${args.functionName}-logs`, {
      name: `/aws/lambda/${args.functionName}`,
      retentionInDays: args.logRetentionDays || 7,
      tags: args.tags
    }, { parent: this });

    // Create Lambda function with right-sized memory and DLQ
    this.function = new aws.lambda.Function(args.functionName, {
      runtime: aws.lambda.Runtime.NodeJS18dX,
      handler: args.handler,
      role: args.role.arn,
      memorySize: args.memorySize,
      timeout: 60,
      code: args.code,
      environment: args.environment,
      deadLetterConfig: {
        targetArn: args.deadLetterQueue.arn
      },
      tags: args.tags,
      publish: true  // Required for versioning
    }, { parent: this, dependsOn: [this.logGroup] });

    // Add provisioned concurrency if specified
    if (args.provisionedConcurrency) {
      // Create alias for provisioned concurrency
      const functionAlias = new aws.lambda.Alias(`${args.functionName}-alias`, {
        functionName: this.function.name,
        functionVersion: this.function.version,
        name: 'live'
      }, { parent: this });

      // Configure provisioned concurrency on alias
      new aws.lambda.ProvisionedConcurrencyConfig(`${args.functionName}-concurrency`, {
        functionName: this.function.name,
        qualifier: functionAlias.name,
        provisionedConcurrentExecutions: args.provisionedConcurrency
      }, { parent: this, dependsOn: [functionAlias] });
    }

    this.registerOutputs({
      functionArn: this.function.arn,
      functionName: this.function.name,
      logGroupName: this.logGroup.name
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
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
      CostCenter: 'Engineering'
    };

    // DynamoDB Table with on-demand billing (auto-scaling)
    const dataTable = new aws.dynamodb.Table(`data-table-${environmentSuffix}`, {
      attributes: [
        { name: 'id', type: 'S' },
        { name: 'timestamp', type: 'N' }
      ],
      hashKey: 'id',
      rangeKey: 'timestamp',
      billingMode: 'PAY_PER_REQUEST', // On-demand auto-scaling
      tags: commonTags
    }, { parent: this });

    // Dead Letter Queue for Lambda failures
    const dlq = new aws.sqs.Queue(`lambda-dlq-${environmentSuffix}`, {
      name: `lambda-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: commonTags
    }, { parent: this });

    // IAM Role for Lambda with least privilege
    const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' }
        }]
      }),
      tags: commonTags
    }, { parent: this });

    // Scoped IAM policy with specific permissions
    new aws.iam.RolePolicy(`lambda-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([dataTable.arn, dlq.arn]).apply(([tableArn, queueArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:UpdateItem'
              ],
              Resource: tableArn
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              Resource: 'arn:aws:logs:*:*:log-group:/aws/lambda/*'
            },
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: queueArn
            }
          ]
        })
      )
    }, { parent: this });

    // Data Processor Lambda using reusable component with provisioned concurrency
    const processorComponent = new LambdaComponent('processor', {
      environmentSuffix,
      functionName: `processor-${environmentSuffix}`,
      handler: 'index.handler',
      memorySize: 512, // Right-sized based on metrics
      role: lambdaRole,
      deadLetterQueue: dlq,
      provisionedConcurrency: 2, // Minimize cold starts
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
        `)
      }),
      environment: {
        variables: {
          TABLE_NAME: dataTable.name
        }
      }
    }, { parent: this });

    // Data Validator Lambda using reusable component
    const validatorComponent = new LambdaComponent('validator', {
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
        `)
      })
    }, { parent: this });

    // Data Enricher Lambda using reusable component
    const enricherComponent = new LambdaComponent('enricher', {
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
        `)
      })
    }, { parent: this });

    // CloudWatch Alarms for DLQ monitoring
    new aws.cloudwatch.MetricAlarm(`dlq-alarm-${environmentSuffix}`, {
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
        QueueName: dlq.name
      },
      tags: commonTags
    }, { parent: this });

    this.table = dataTable.name;
    this.processorFunctionArn = processorComponent.function.arn;
    this.dlqUrl = dlq.url;

    this.registerOutputs({
      tableName: this.table,
      processorFunctionArn: this.processorFunctionArn,
      validatorFunctionArn: validatorComponent.function.arn,
      enricherFunctionArn: enricherComponent.function.arn,
      dlqUrl: this.dlqUrl,
      dlqArn: dlq.arn
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') ||
                         process.env.ENVIRONMENT_SUFFIX ||
                         'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix
});

export const tableName = stack.table;
export const processorFunctionArn = stack.processorFunctionArn;
export const dlqUrl = stack.dlqUrl;
```

## Key Improvements

1. **Lambda Memory Right-Sizing**: Reduced from 3008MB to 512-768MB based on actual usage
2. **Reusable Component Pattern**: Created LambdaComponent class to eliminate code duplication
3. **DynamoDB Auto-Scaling**: Changed to PAY_PER_REQUEST billing mode for automatic scaling
4. **Dead Letter Queue Integration**: Added SQS DLQ to all Lambda functions
5. **IAM Security Hardening**: Scoped permissions to specific actions and resources
6. **Cost Allocation Tagging**: Applied consistent tags to all resources
7. **Log Retention Management**: Set 7-day retention on all CloudWatch log groups
8. **Cold Start Optimization**: Added provisioned concurrency to critical processor function
9. **Circular Dependency Resolution**: Proper use of Pulumi's dependency management
10. **Error Handling**: Added try-catch blocks and proper error logging in Lambda code