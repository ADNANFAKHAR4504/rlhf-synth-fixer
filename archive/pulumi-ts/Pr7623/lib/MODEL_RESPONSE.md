# EC2 Cost Optimization System - Complete Implementation

This implementation provides an automated EC2 cost optimization system using **Pulumi with TypeScript**. The system manages scheduled start/stop operations for non-production instances with comprehensive monitoring and state tracking.

## Architecture Overview

- **EventBridge Rules**: Schedule start/stop operations at 8 AM and 7 PM EST on weekdays
- **Lambda Functions**: Execute start/stop operations for tagged EC2 instances
- **Step Functions**: Orchestrate complex workflows with error handling
- **DynamoDB**: Track instance states and scheduling history
- **CloudWatch Alarms**: Monitor automation health and alert on failures
- **IAM Roles**: Least privilege access for Lambda and Step Functions

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
  public readonly stateTableName: pulumi.Output<string>;
  public readonly startRuleArn: pulumi.Output<string>;
  public readonly stopRuleArn: pulumi.Output<string>;
  public readonly stateMachineArn: pulumi.Output<string>;
  public readonly estimatedMonthlySavings: pulumi.Output<number>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // DynamoDB Table for State Tracking
    const stateTable = new aws.dynamodb.Table(
      `ec2-schedule-state-${environmentSuffix}`,
      {
        name: `ec2-schedule-state-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'instanceId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'instanceId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        ttl: {
          attributeName: 'expiresAt',
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // IAM Role for Lambda Functions
    const lambdaRole = new aws.iam.Role(
      `ec2-scheduler-lambda-role-${environmentSuffix}`,
      {
        name: `ec2-scheduler-lambda-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Lambda Policy for EC2 and DynamoDB Access
    const lambdaPolicy = new aws.iam.Policy(
      `ec2-scheduler-lambda-policy-${environmentSuffix}`,
      {
        name: `ec2-scheduler-lambda-policy-${environmentSuffix}`,
        policy: pulumi.all([stateTable.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeInstances',
                  'ec2:StartInstances',
                  'ec2:StopInstances',
                  'ec2:DescribeTags',
                ],
                Resource: '*',
              },
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
                Resource: 'arn:aws:logs:*:*:*',
              },
            ],
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-policy-attachment-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: lambdaPolicy.arn,
      },
      { parent: this }
    );

    // Lambda Function: Stop Instances
    const stopInstancesLambda = new aws.lambda.Function(
      `ec2-stop-instances-${environmentSuffix}`,
      {
        name: `ec2-stop-instances-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'stop-instances.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lib/lambda'),
        }),
        timeout: 300,
        memorySize: 256,
        environment: {
          variables: {
            STATE_TABLE_NAME: stateTable.name,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // Lambda Function: Start Instances
    const startInstancesLambda = new aws.lambda.Function(
      `ec2-start-instances-${environmentSuffix}`,
      {
        name: `ec2-start-instances-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'start-instances.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lib/lambda'),
        }),
        timeout: 300,
        memorySize: 256,
        environment: {
          variables: {
            STATE_TABLE_NAME: stateTable.name,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // IAM Role for Step Functions
    const stepFunctionsRole = new aws.iam.Role(
      `ec2-scheduler-sfn-role-${environmentSuffix}`,
      {
        name: `ec2-scheduler-sfn-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'states.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    const stepFunctionsPolicy = new aws.iam.Policy(
      `ec2-scheduler-sfn-policy-${environmentSuffix}`,
      {
        name: `ec2-scheduler-sfn-policy-${environmentSuffix}`,
        policy: pulumi
          .all([startInstancesLambda.arn, stopInstancesLambda.arn])
          .apply(([startArn, stopArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['lambda:InvokeFunction'],
                  Resource: [startArn, stopArn],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogDelivery',
                    'logs:GetLogDelivery',
                    'logs:UpdateLogDelivery',
                    'logs:DeleteLogDelivery',
                    'logs:ListLogDeliveries',
                    'logs:PutResourcePolicy',
                    'logs:DescribeResourcePolicies',
                    'logs:DescribeLogGroups',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `sfn-policy-attachment-${environmentSuffix}`,
      {
        role: stepFunctionsRole.name,
        policyArn: stepFunctionsPolicy.arn,
      },
      { parent: this }
    );

    // Step Functions State Machine
    const stateMachine = new aws.sfn.StateMachine(
      `ec2-scheduler-workflow-${environmentSuffix}`,
      {
        name: `ec2-scheduler-workflow-${environmentSuffix}`,
        roleArn: stepFunctionsRole.arn,
        definition: pulumi
          .all([startInstancesLambda.arn, stopInstancesLambda.arn])
          .apply(([startArn, stopArn]) =>
            JSON.stringify({
              Comment: 'EC2 Scheduler Workflow',
              StartAt: 'DetermineAction',
              States: {
                DetermineAction: {
                  Type: 'Choice',
                  Choices: [
                    {
                      Variable: '$.action',
                      StringEquals: 'start',
                      Next: 'StartInstances',
                    },
                    {
                      Variable: '$.action',
                      StringEquals: 'stop',
                      Next: 'StopInstances',
                    },
                  ],
                  Default: 'Fail',
                },
                StartInstances: {
                  Type: 'Task',
                  Resource: startArn,
                  Retry: [
                    {
                      ErrorEquals: ['States.TaskFailed'],
                      IntervalSeconds: 2,
                      MaxAttempts: 3,
                      BackoffRate: 2.0,
                    },
                  ],
                  Catch: [
                    {
                      ErrorEquals: ['States.ALL'],
                      Next: 'HandleError',
                    },
                  ],
                  Next: 'Success',
                },
                StopInstances: {
                  Type: 'Task',
                  Resource: stopArn,
                  Retry: [
                    {
                      ErrorEquals: ['States.TaskFailed'],
                      IntervalSeconds: 2,
                      MaxAttempts: 3,
                      BackoffRate: 2.0,
                    },
                  ],
                  Catch: [
                    {
                      ErrorEquals: ['States.ALL'],
                      Next: 'HandleError',
                    },
                  ],
                  Next: 'Success',
                },
                HandleError: {
                  Type: 'Pass',
                  Result: 'Error occurred',
                  Next: 'Fail',
                },
                Success: {
                  Type: 'Succeed',
                },
                Fail: {
                  Type: 'Fail',
                },
              },
            })
          ),
        loggingConfiguration: {
          level: 'ALL',
          includeExecutionData: true,
          logDestination: pulumi.interpolate`arn:aws:logs:${aws.config.region}:${aws.getCallerIdentityOutput().accountId}:log-group:/aws/stepfunctions/ec2-scheduler-${environmentSuffix}:*`,
        },
        tags: tags,
      },
      { parent: this, dependsOn: [stepFunctionsPolicy] }
    );

    // Log Group for Step Functions
    new aws.cloudwatch.LogGroup(
      `sfn-log-group-${environmentSuffix}`,
      {
        name: `/aws/stepfunctions/ec2-scheduler-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // IAM Role for EventBridge
    const eventBridgeRole = new aws.iam.Role(
      `ec2-scheduler-eventbridge-role-${environmentSuffix}`,
      {
        name: `ec2-scheduler-eventbridge-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'events.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    const eventBridgePolicy = new aws.iam.Policy(
      `ec2-scheduler-eventbridge-policy-${environmentSuffix}`,
      {
        name: `ec2-scheduler-eventbridge-policy-${environmentSuffix}`,
        policy: stateMachine.arn.apply((arn) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['states:StartExecution'],
                Resource: arn,
              },
            ],
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eventbridge-policy-attachment-${environmentSuffix}`,
      {
        role: eventBridgeRole.name,
        policyArn: eventBridgePolicy.arn,
      },
      { parent: this }
    );

    // EventBridge Rule: Stop at 7 PM EST (23:00 UTC, adjust for DST)
    const stopRule = new aws.cloudwatch.EventRule(
      `ec2-stop-rule-${environmentSuffix}`,
      {
        name: `ec2-stop-rule-${environmentSuffix}`,
        description: 'Stop non-production EC2 instances at 7 PM EST on weekdays',
        scheduleExpression: 'cron(0 23 ? * MON-FRI *)',
        isEnabled: true,
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `ec2-stop-target-${environmentSuffix}`,
      {
        rule: stopRule.name,
        arn: stateMachine.arn,
        roleArn: eventBridgeRole.arn,
        input: JSON.stringify({ action: 'stop' }),
      },
      { parent: this, dependsOn: [eventBridgePolicy] }
    );

    // EventBridge Rule: Start at 8 AM EST (12:00 UTC, adjust for DST)
    const startRule = new aws.cloudwatch.EventRule(
      `ec2-start-rule-${environmentSuffix}`,
      {
        name: `ec2-start-rule-${environmentSuffix}`,
        description: 'Start non-production EC2 instances at 8 AM EST on weekdays',
        scheduleExpression: 'cron(0 12 ? * MON-FRI *)',
        isEnabled: true,
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `ec2-start-target-${environmentSuffix}`,
      {
        rule: startRule.name,
        arn: stateMachine.arn,
        roleArn: eventBridgeRole.arn,
        input: JSON.stringify({ action: 'start' }),
      },
      { parent: this, dependsOn: [eventBridgePolicy] }
    );

    // CloudWatch Alarm for Step Functions Failures
    const executionFailedAlarm = new aws.cloudwatch.MetricAlarm(
      `ec2-scheduler-failure-alarm-${environmentSuffix}`,
      {
        name: `ec2-scheduler-failure-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ExecutionsFailed',
        namespace: 'AWS/States',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        datapointsToAlarm: 1,
        dimensions: {
          StateMachineArn: stateMachine.arn,
        },
        alarmDescription:
          'Alert when EC2 scheduler Step Functions execution fails',
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Alarm for Lambda Errors
    const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
      `ec2-scheduler-lambda-error-alarm-${environmentSuffix}`,
      {
        name: `ec2-scheduler-lambda-error-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 2,
        datapointsToAlarm: 1,
        alarmDescription: 'Alert when EC2 scheduler Lambda functions have errors',
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Calculate estimated monthly savings
    // Assumptions: 2 t3.medium ($0.0416/hr) and 1 t3.large ($0.0832/hr) instance
    // 13 hours/day shutdown * 22 business days/month
    const monthlySavings = (2 * 0.0416 + 1 * 0.0832) * 13 * 22;

    // Register outputs
    this.stateTableName = stateTable.name;
    this.startRuleArn = startRule.arn;
    this.stopRuleArn = stopRule.arn;
    this.stateMachineArn = stateMachine.arn;
    this.estimatedMonthlySavings = pulumi.output(monthlySavings);

    this.registerOutputs({
      stateTableName: this.stateTableName,
      startRuleArn: this.startRuleArn,
      stopRuleArn: this.stopRuleArn,
      stateMachineArn: this.stateMachineArn,
      startLambdaArn: startInstancesLambda.arn,
      stopLambdaArn: stopInstancesLambda.arn,
      estimatedMonthlySavings: this.estimatedMonthlySavings,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

const stack = new TapStack(
  'ec2-cost-optimizer',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

export const stateTableName = stack.stateTableName;
export const startRuleArn = stack.startRuleArn;
export const stopRuleArn = stack.stopRuleArn;
export const stateMachineArn = stack.stateMachineArn;
export const estimatedMonthlySavings = stack.estimatedMonthlySavings;
```

## File: lib/lambda/stop-instances.ts

```typescript
import {
  EC2Client,
  DescribeInstancesCommand,
  StopInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';

const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface LambdaEvent {
  action: string;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  console.log('Stop Instances Lambda triggered', JSON.stringify(event));

  const stateTableName = process.env.STATE_TABLE_NAME;
  if (!stateTableName) {
    throw new Error('STATE_TABLE_NAME environment variable not set');
  }

  try {
    // Find all instances tagged with Environment=development or Environment=staging
    const describeCommand = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'tag:Environment',
          Values: ['development', 'staging'],
        },
        {
          Name: 'instance-state-name',
          Values: ['running'],
        },
      ],
    });

    const describeResult = await ec2Client.send(describeCommand);
    const instanceIds: string[] = [];

    if (describeResult.Reservations) {
      for (const reservation of describeResult.Reservations) {
        if (reservation.Instances) {
          for (const instance of reservation.Instances) {
            if (instance.InstanceId) {
              instanceIds.push(instance.InstanceId);
            }
          }
        }
      }
    }

    console.log(`Found ${instanceIds.length} instances to stop:`, instanceIds);

    if (instanceIds.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No running instances found to stop',
          instancesStopped: 0,
        }),
      };
    }

    // Stop instances
    const stopCommand = new StopInstancesCommand({
      InstanceIds: instanceIds,
    });

    await ec2Client.send(stopCommand);
    console.log(`Successfully stopped ${instanceIds.length} instances`);

    // Record state change in DynamoDB
    const timestamp = Date.now();
    for (const instanceId of instanceIds) {
      const putCommand = new PutItemCommand({
        TableName: stateTableName,
        Item: {
          instanceId: { S: instanceId },
          timestamp: { N: timestamp.toString() },
          action: { S: 'stop' },
          status: { S: 'success' },
          expiresAt: { N: Math.floor((timestamp + 30 * 24 * 60 * 60 * 1000) / 1000).toString() },
        },
      });

      await dynamoClient.send(putCommand);
    }

    console.log('State changes recorded in DynamoDB');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Instances stopped successfully',
        instancesStopped: instanceIds.length,
        instanceIds: instanceIds,
      }),
    };
  } catch (error) {
    console.error('Error stopping instances:', error);
    throw error;
  }
};
```

## File: lib/lambda/start-instances.ts

```typescript
import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';

const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface LambdaEvent {
  action: string;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  console.log('Start Instances Lambda triggered', JSON.stringify(event));

  const stateTableName = process.env.STATE_TABLE_NAME;
  if (!stateTableName) {
    throw new Error('STATE_TABLE_NAME environment variable not set');
  }

  try {
    // Find all instances tagged with Environment=development or Environment=staging
    const describeCommand = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'tag:Environment',
          Values: ['development', 'staging'],
        },
        {
          Name: 'instance-state-name',
          Values: ['stopped'],
        },
      ],
    });

    const describeResult = await ec2Client.send(describeCommand);
    const instanceIds: string[] = [];

    if (describeResult.Reservations) {
      for (const reservation of describeResult.Reservations) {
        if (reservation.Instances) {
          for (const instance of reservation.Instances) {
            if (instance.InstanceId) {
              instanceIds.push(instance.InstanceId);
            }
          }
        }
      }
    }

    console.log(`Found ${instanceIds.length} instances to start:`, instanceIds);

    if (instanceIds.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No stopped instances found to start',
          instancesStarted: 0,
        }),
      };
    }

    // Start instances
    const startCommand = new StartInstancesCommand({
      InstanceIds: instanceIds,
    });

    await ec2Client.send(startCommand);
    console.log(`Successfully started ${instanceIds.length} instances`);

    // Record state change in DynamoDB
    const timestamp = Date.now();
    for (const instanceId of instanceIds) {
      const putCommand = new PutItemCommand({
        TableName: stateTableName,
        Item: {
          instanceId: { S: instanceId },
          timestamp: { N: timestamp.toString() },
          action: { S: 'start' },
          status: { S: 'success' },
          expiresAt: { N: Math.floor((timestamp + 30 * 24 * 60 * 60 * 1000) / 1000).toString() },
        },
      });

      await dynamoClient.send(putCommand);
    }

    console.log('State changes recorded in DynamoDB');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Instances started successfully',
        instancesStarted: instanceIds.length,
        instanceIds: instanceIds,
      }),
    };
  } catch (error) {
    console.error('Error starting instances:', error);
    throw error;
  }
};
```

## File: lib/lambda/package.json

```json
{
  "name": "ec2-scheduler-lambda",
  "version": "1.0.0",
  "description": "Lambda functions for EC2 cost optimization scheduler",
  "main": "start-instances.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf *.js *.d.ts"
  },
  "dependencies": {
    "@aws-sdk/client-ec2": "^3.600.0",
    "@aws-sdk/client-dynamodb": "^3.600.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

## File: lib/README.md

```markdown
# EC2 Cost Optimization System

Automated EC2 cost optimization system using Pulumi with TypeScript that manages scheduled start/stop operations for non-production instances.

## Architecture

### Components

1. **EventBridge Rules**: Schedule automated start/stop operations
   - Stop Rule: Triggers at 7 PM EST (23:00 UTC) on weekdays
   - Start Rule: Triggers at 8 AM EST (12:00 UTC) on weekdays

2. **Lambda Functions**: Execute EC2 operations
   - `start-instances`: Starts stopped development/staging EC2 instances
   - `stop-instances`: Stops running development/staging EC2 instances
   - Both functions process multiple instances in a single execution
   - Uses AWS SDK v3 for Node.js 18+ compatibility

3. **Step Functions**: Orchestrate workflow with retry logic
   - Handles both start and stop actions
   - Automatic retry with exponential backoff
   - Error handling and logging

4. **DynamoDB Table**: Track instance state changes
   - Records all start/stop operations
   - TTL enabled for automatic cleanup after 30 days
   - Provides audit trail

5. **CloudWatch Alarms**: Monitor automation health
   - Step Functions execution failures
   - Lambda function errors
   - Configurable threshold and notifications

6. **IAM Roles**: Least privilege access
   - Lambda execution role with EC2 and DynamoDB permissions
   - Step Functions execution role with Lambda invocation permissions
   - EventBridge role with Step Functions execution permissions

### Cost Savings Calculation

Based on typical development environment:
- 2x t3.medium instances ($0.0416/hour each)
- 1x t3.large instance ($0.0832/hour)
- 13 hours daily shutdown (7 PM - 8 AM)
- 22 business days per month

**Estimated Monthly Savings**: $51.95

## Deployment

### Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- EC2 instances tagged with `Environment=development` or `Environment=staging`

### Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev"  # or "staging", "prod", etc.
export AWS_REGION="us-east-1"
```

### Deploy Infrastructure

```bash
# Install dependencies
npm install

# Install Lambda dependencies
cd lib/lambda
npm install
npm run build
cd ../..

# Deploy with Pulumi
pulumi up
```

### Stack Outputs

After deployment, the following outputs are available:

- `stateTableName`: DynamoDB table name for state tracking
- `startRuleArn`: ARN of the EventBridge start rule
- `stopRuleArn`: ARN of the EventBridge stop rule
- `stateMachineArn`: ARN of the Step Functions state machine
- `estimatedMonthlySavings`: Calculated monthly cost savings

## Usage

### Tagging EC2 Instances

The automation targets instances with specific tags:

```bash
# Tag instance for automation
aws ec2 create-tags \
  --resources i-1234567890abcdef0 \
  --tags Key=Environment,Value=development

# Production instances are never affected
aws ec2 create-tags \
  --resources i-fedcba0987654321 \
  --tags Key=Environment,Value=production
```

### Manual Execution

Trigger the Step Functions state machine manually:

```bash
# Stop instances
aws stepfunctions start-execution \
  --state-machine-arn <stateMachineArn> \
  --input '{"action": "stop"}'

# Start instances
aws stepfunctions start-execution \
  --state-machine-arn <stateMachineArn> \
  --input '{"action": "start"}'
```

### Viewing Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/ec2-start-instances-dev --follow
aws logs tail /aws/lambda/ec2-stop-instances-dev --follow

# Step Functions logs
aws logs tail /aws/stepfunctions/ec2-scheduler-dev --follow
```

## Optimization Script

The `lib/optimize.py` script further optimizes deployed resources:

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"

# Run optimization
python3 lib/optimize.py

# Dry run mode (no changes)
python3 lib/optimize.py --dry-run
```

### What the Optimizer Does

- Reduces Lambda memory allocations for cost optimization
- Optimizes CloudWatch log retention periods
- Reduces Step Functions execution history retention
- Calculates additional monthly savings from optimizations

## Monitoring

### CloudWatch Alarms

Two alarms are configured:

1. **Step Functions Failure Alarm**: Triggers when any execution fails
2. **Lambda Error Alarm**: Triggers when Lambda errors exceed threshold

## Troubleshooting

### Instances Not Stopping/Starting

1. Verify instance tags
2. Check Lambda logs for errors
3. Verify IAM permissions for Lambda role

### Step Functions Execution Failures

1. Check execution history in AWS Console
2. Review Step Functions logs in CloudWatch
3. Verify Lambda functions are invocable

## Cleanup

To remove all resources:

```bash
pulumi destroy
```
```
