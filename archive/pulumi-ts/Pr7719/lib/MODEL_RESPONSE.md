# Serverless Data Processing Infrastructure - Initial Implementation

This implementation provides a serverless data processing infrastructure with Lambda functions, DynamoDB tables, and basic monitoring.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly table: pulumi.Output<string>;
  public readonly processorFunctionArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // DynamoDB Table - ISSUE: No auto-scaling configured
    const dataTable = new aws.dynamodb.Table(`data-table-${environmentSuffix}`, {
      attributes: [
        { name: 'id', type: 'S' },
        { name: 'timestamp', type: 'N' }
      ],
      hashKey: 'id',
      rangeKey: 'timestamp',
      billingMode: 'PROVISIONED', // ISSUE: Using fixed provisioning instead of on-demand/auto-scaling
      readCapacity: 5,
      writeCapacity: 5
    }, { parent: this });

    // IAM Role for Lambda - ISSUE: Overly permissive wildcard actions
    const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' }
        }]
      })
    }, { parent: this });

    // ISSUE: Wildcard permissions on all resources
    new aws.iam.RolePolicy(`lambda-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:*'], // ISSUE: Wildcard action
            Resource: '*' // ISSUE: All resources
          },
          {
            Effect: 'Allow',
            Action: ['logs:*'], // ISSUE: Wildcard action
            Resource: '*'
          }
        ]
      })
    }, { parent: this });

    // Data Processor Lambda - ISSUE: Over-provisioned memory, no DLQ
    const processorFunction = new aws.lambda.Function(`processor-${environmentSuffix}`, {
      runtime: aws.lambda.Runtime.NodeJS18dX,
      handler: 'index.handler',
      role: lambdaRole.arn,
      memorySize: 3008, // ISSUE: Way too much memory for actual usage
      timeout: 60,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
          const { DynamoDB } = require('@aws-sdk/client-dynamodb');
          const dynamodb = new DynamoDB({ region: 'us-east-1' });

          exports.handler = async (event) => {
            // ISSUE: No error handling
            const params = {
              TableName: '${dataTable.name}',
              Item: {
                id: { S: event.id },
                timestamp: { N: Date.now().toString() },
                data: { S: JSON.stringify(event.data) }
              }
            };
            await dynamodb.putItem(params);
            return { statusCode: 200 };
          };
        `)
      }),
      environment: {
        variables: {
          TABLE_NAME: dataTable.name
        }
      }
      // ISSUE: No deadLetterConfig
      // ISSUE: No reserved concurrent executions or provisioned concurrency
    }, { parent: this });

    // Data Validator Lambda - ISSUE: Duplicate code instead of reusable component
    const validatorFunction = new aws.lambda.Function(`validator-${environmentSuffix}`, {
      runtime: aws.lambda.Runtime.NodeJS18dX,
      handler: 'index.handler',
      role: lambdaRole.arn,
      memorySize: 3008, // ISSUE: Same over-provisioning
      timeout: 60,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
          exports.handler = async (event) => {
            if (!event.data) {
              throw new Error('Invalid data');
            }
            return { valid: true };
          };
        `)
      })
      // ISSUE: No DLQ, no log retention
    }, { parent: this });

    // Data Enricher Lambda - ISSUE: More duplication
    const enricherFunction = new aws.lambda.Function(`enricher-${environmentSuffix}`, {
      runtime: aws.lambda.Runtime.NodeJS18dX,
      handler: 'index.handler',
      role: lambdaRole.arn,
      memorySize: 3008, // ISSUE: Same issue
      timeout: 60,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
          exports.handler = async (event) => {
            return { ...event, enriched: true, timestamp: Date.now() };
          };
        `)
      })
    }, { parent: this });

    // ISSUE: No CloudWatch Log Groups with retention policies
    // ISSUE: No cost allocation tags on resources
    // ISSUE: No SQS Dead Letter Queues
    // ISSUE: No provisioned concurrency for critical functions
    // ISSUE: No monitoring or alarms

    this.table = dataTable.name;
    this.processorFunctionArn = processorFunction.arn;

    this.registerOutputs({
      tableName: this.table,
      processorFunctionArn: this.processorFunctionArn,
      validatorFunctionArn: validatorFunction.arn,
      enricherFunctionArn: enricherFunction.arn
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
```

## Issues in This Implementation

1. **Memory Over-Provisioning**: All Lambda functions use 3008MB when they only need ~512MB
2. **No Reusable Components**: Lambda functions are created individually with duplicated code
3. **No DynamoDB Auto-Scaling**: Fixed provisioning with low capacity
4. **No Dead Letter Queues**: Lambda failures are lost
5. **Wildcard IAM Permissions**: Security risk with overly broad permissions
6. **No Cost Tagging**: Cannot track costs by resource
7. **No Log Retention**: CloudWatch logs kept indefinitely
8. **No Provisioned Concurrency**: Critical functions suffer cold starts
9. **No Error Handling**: Code lacks proper error handling and retry logic
10. **No Dependency Management**: Missing proper Pulumi dependency configuration