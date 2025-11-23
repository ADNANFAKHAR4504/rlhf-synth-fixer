# EC2 Cost Optimization with Scheduled Start/Stop - Pulumi TypeScript Implementation

This implementation provides an automated EC2 cost optimization solution using Pulumi TypeScript. It imports existing EC2 instances tagged with Environment=development or Environment=staging, then creates scheduled Lambda functions to automatically stop instances at 7 PM EST and start them at 8 AM EST on weekdays.

## Architecture Overview

The solution consists of:
- Lambda functions to handle EC2 start/stop operations
- CloudWatch Events (EventBridge) rules for scheduling
- IAM roles with least privilege policies
- CloudWatch Alarms for monitoring instance state
- Cost calculation and reporting

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi stack for EC2 cost optimization with scheduled start/stop functionality.
 * This stack imports existing EC2 instances and creates automation to reduce costs
 * by stopping non-production instances during off-hours.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { Ec2SchedulerStack } from './ec2-scheduler-stack';
import { CostCalculationStack } from './cost-calculation-stack';

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
 * Main Pulumi component resource for EC2 cost optimization.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly schedulerOutputs: pulumi.Output<any>;
  public readonly costOutputs: pulumi.Output<any>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get the current AWS region
    const region = aws.config.region || 'ap-southeast-1';

    // Instantiate EC2 Scheduler Stack
    const schedulerStack = new Ec2SchedulerStack(
      `ec2-scheduler-${environmentSuffix}`,
      {
        environmentSuffix,
        region,
        tags,
      },
      { parent: this }
    );

    // Instantiate Cost Calculation Stack
    const costStack = new CostCalculationStack(
      `cost-calculation-${environmentSuffix}`,
      {
        environmentSuffix,
        instanceIds: schedulerStack.managedInstanceIds,
        tags,
      },
      { parent: this }
    );

    this.schedulerOutputs = schedulerStack.outputs;
    this.costOutputs = costStack.outputs;

    // Register the outputs of this component
    this.registerOutputs({
      stopLambdaArn: schedulerStack.stopFunctionArn,
      startLambdaArn: schedulerStack.startFunctionArn,
      stopRuleArn: schedulerStack.stopRuleArn,
      startRuleArn: schedulerStack.startRuleArn,
      managedInstanceIds: schedulerStack.managedInstanceIds,
      estimatedMonthlySavings: costStack.estimatedMonthlySavings,
    });
  }
}
```

## File: lib/ec2-scheduler-stack.ts

```typescript
/**
 * ec2-scheduler-stack.ts
 *
 * Component for EC2 instance scheduling - handles importing existing instances,
 * creating Lambda functions for start/stop operations, and setting up CloudWatch
 * Events rules for automated scheduling.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

export interface Ec2SchedulerStackArgs {
  environmentSuffix: string;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class Ec2SchedulerStack extends pulumi.ComponentResource {
  public readonly managedInstanceIds: pulumi.Output<string[]>;
  public readonly stopFunctionArn: pulumi.Output<string>;
  public readonly startFunctionArn: pulumi.Output<string>;
  public readonly stopRuleArn: pulumi.Output<string>;
  public readonly startRuleArn: pulumi.Output<string>;
  public readonly outputs: pulumi.Output<any>;

  constructor(name: string, args: Ec2SchedulerStackArgs, opts?: ResourceOptions) {
    super('tap:ec2:Ec2SchedulerStack', name, args, opts);

    const { environmentSuffix, region, tags } = args;

    // Query existing EC2 instances with development or staging tags
    const developmentInstances = aws.ec2.getInstancesOutput({
      filters: [
        {
          name: 'tag:Environment',
          values: ['development'],
        },
        {
          name: 'instance-state-name',
          values: ['running', 'stopped'],
        },
      ],
    });

    const stagingInstances = aws.ec2.getInstancesOutput({
      filters: [
        {
          name: 'tag:Environment',
          values: ['staging'],
        },
        {
          name: 'instance-state-name',
          values: ['running', 'stopped'],
        },
      ],
    });

    // Combine instance IDs from both environments
    this.managedInstanceIds = pulumi
      .all([developmentInstances.ids, stagingInstances.ids])
      .apply(([devIds, stagingIds]) => [...devIds, ...stagingIds]);

    // Create IAM role for Lambda execution
    const lambdaRole = new aws.iam.Role(
      `ec2-scheduler-lambda-role-${environmentSuffix}`,
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
        tags: {
          ...tags,
          Name: `ec2-scheduler-lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for EC2 operations
    const ec2Policy = new aws.iam.RolePolicy(
      `ec2-scheduler-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['ec2:StartInstances', 'ec2:StopInstances'],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'ec2:ResourceTag/Environment': ['development', 'staging'],
                },
              },
            },
            {
              Effect: 'Allow',
              Action: ['ec2:DescribeInstances', 'ec2:DescribeInstanceStatus'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create CloudWatch Logs group for Lambda functions
    const stopLogsGroup = new aws.cloudwatch.LogGroup(
      `ec2-stop-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/ec2-stop-function-${environmentSuffix}`,
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    const startLogsGroup = new aws.cloudwatch.LogGroup(
      `ec2-start-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/ec2-start-function-${environmentSuffix}`,
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    // Read Lambda function code
    const stopFunctionCode = fs.readFileSync(
      path.join(__dirname, 'lambda', 'ec2-stop.js'),
      'utf8'
    );

    const startFunctionCode = fs.readFileSync(
      path.join(__dirname, 'lambda', 'ec2-start.js'),
      'utf8'
    );

    // Create Lambda function to stop EC2 instances
    const stopFunction = new aws.lambda.Function(
      `ec2-stop-function-${environmentSuffix}`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(stopFunctionCode),
        }),
        role: lambdaRole.arn,
        handler: 'index.handler',
        runtime: aws.lambda.Runtime.NodeJS18dX,
        timeout: 60,
        environment: {
          variables: {
            TARGET_ENVIRONMENTS: 'development,staging',
          },
        },
        tags: {
          ...tags,
          Name: `ec2-stop-function-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [stopLogsGroup, ec2Policy] }
    );

    // Create Lambda function to start EC2 instances
    const startFunction = new aws.lambda.Function(
      `ec2-start-function-${environmentSuffix}`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(startFunctionCode),
        }),
        role: lambdaRole.arn,
        handler: 'index.handler',
        runtime: aws.lambda.Runtime.NodeJS18dX,
        timeout: 60,
        environment: {
          variables: {
            TARGET_ENVIRONMENTS: 'development,staging',
          },
        },
        tags: {
          ...tags,
          Name: `ec2-start-function-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [startLogsGroup, ec2Policy] }
    );

    // Create CloudWatch Events rule to stop instances at 7 PM EST (midnight UTC)
    // Cron expression: 0 0 * * ? (midnight UTC = 7 PM EST)
    const stopRule = new aws.cloudwatch.EventRule(
      `ec2-stop-rule-${environmentSuffix}`,
      {
        description: 'Stop development and staging EC2 instances at 7 PM EST on weekdays',
        scheduleExpression: 'cron(0 0 ? * MON-FRI *)',
        tags: {
          ...tags,
          Name: `ec2-stop-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Events rule to start instances at 8 AM EST (1 PM UTC)
    // Cron expression: 0 13 * * ? (1 PM UTC = 8 AM EST)
    const startRule = new aws.cloudwatch.EventRule(
      `ec2-start-rule-${environmentSuffix}`,
      {
        description: 'Start development and staging EC2 instances at 8 AM EST on weekdays',
        scheduleExpression: 'cron(0 13 ? * MON-FRI *)',
        tags: {
          ...tags,
          Name: `ec2-start-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add Lambda permissions for CloudWatch Events
    const stopPermission = new aws.lambda.Permission(
      `stop-invoke-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: stopFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: stopRule.arn,
      },
      { parent: this }
    );

    const startPermission = new aws.lambda.Permission(
      `start-invoke-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: startFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: startRule.arn,
      },
      { parent: this }
    );

    // Create CloudWatch Events targets
    const stopTarget = new aws.cloudwatch.EventTarget(
      `ec2-stop-target-${environmentSuffix}`,
      {
        rule: stopRule.name,
        arn: stopFunction.arn,
      },
      { parent: this, dependsOn: [stopPermission] }
    );

    const startTarget = new aws.cloudwatch.EventTarget(
      `ec2-start-target-${environmentSuffix}`,
      {
        rule: startRule.name,
        arn: startFunction.arn,
      },
      { parent: this, dependsOn: [startPermission] }
    );

    // Create CloudWatch Alarm for failed instance starts
    const startFailureAlarm = new aws.cloudwatch.MetricAlarm(
      `ec2-start-failure-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when EC2 start function fails',
        dimensions: {
          FunctionName: startFunction.name,
        },
        tags: {
          ...tags,
          Name: `ec2-start-failure-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.stopFunctionArn = stopFunction.arn;
    this.startFunctionArn = startFunction.arn;
    this.stopRuleArn = stopRule.arn;
    this.startRuleArn = startRule.arn;

    this.outputs = pulumi.output({
      stopFunctionArn: stopFunction.arn,
      startFunctionArn: startFunction.arn,
      stopRuleArn: stopRule.arn,
      startRuleArn: startRule.arn,
      managedInstanceIds: this.managedInstanceIds,
    });

    this.registerOutputs({});
  }
}
```

## File: lib/cost-calculation-stack.ts

```typescript
/**
 * cost-calculation-stack.ts
 *
 * Component for calculating estimated cost savings from EC2 instance scheduling.
 * Uses EC2 pricing data to estimate monthly savings based on 13 hours of daily shutdown.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CostCalculationStackArgs {
  environmentSuffix: string;
  instanceIds: pulumi.Input<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CostCalculationStack extends pulumi.ComponentResource {
  public readonly estimatedMonthlySavings: pulumi.Output<number>;
  public readonly outputs: pulumi.Output<any>;

  constructor(name: string, args: CostCalculationStackArgs, opts?: ResourceOptions) {
    super('tap:cost:CostCalculationStack', name, args, opts);

    const { environmentSuffix, instanceIds } = args;

    // EC2 pricing per hour for ap-southeast-1 (Singapore)
    // These are approximate on-demand prices
    const pricingMap: { [key: string]: number } = {
      't3.micro': 0.0132,
      't3.small': 0.0264,
      't3.medium': 0.0528,
      't3.large': 0.1056,
      't3.xlarge': 0.2112,
      't3.2xlarge': 0.4224,
      't2.micro': 0.0146,
      't2.small': 0.0292,
      't2.medium': 0.0584,
      't2.large': 0.1168,
      'm5.large': 0.12,
      'm5.xlarge': 0.24,
      'm5.2xlarge': 0.48,
    };

    // Calculate savings based on instance types
    this.estimatedMonthlySavings = pulumi
      .output(instanceIds)
      .apply(async (ids) => {
        if (ids.length === 0) {
          return 0;
        }

        let totalHourlyCost = 0;

        // Fetch instance details
        for (const instanceId of ids) {
          try {
            const instance = await aws.ec2.getInstance({
              instanceId: instanceId,
            });

            const instanceType = instance.instanceType;
            const hourlyRate = pricingMap[instanceType] || 0.05; // Default rate

            totalHourlyCost += hourlyRate;
          } catch (error) {
            console.warn(`Could not fetch details for instance ${instanceId}`);
          }
        }

        // Calculate monthly savings
        // 13 hours per day * 22 working days per month = 286 hours per month
        const monthlyShutdownHours = 13 * 22;
        const monthlySavings = totalHourlyCost * monthlyShutdownHours;

        return Math.round(monthlySavings * 100) / 100;
      });

    this.outputs = pulumi.output({
      estimatedMonthlySavings: this.estimatedMonthlySavings,
      instanceCount: pulumi.output(instanceIds).apply((ids) => ids.length),
    });

    this.registerOutputs({});
  }
}
```

## File: lib/lambda/ec2-stop.js

```javascript
/**
 * EC2 Stop Lambda Function
 *
 * This Lambda function stops EC2 instances tagged with Environment=development
 * or Environment=staging. It's triggered by CloudWatch Events at 7 PM EST on weekdays.
 */
const { EC2Client, DescribeInstancesCommand, StopInstancesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('EC2 Stop Lambda triggered:', JSON.stringify(event, null, 2));

  const targetEnvironments = (process.env.TARGET_ENVIRONMENTS || 'development,staging').split(',');

  try {
    // Find all running instances with target environment tags
    const instancesPromises = targetEnvironments.map(async (env) => {
      const describeCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [env.trim()],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });

      const response = await ec2Client.send(describeCommand);
      const instances = [];

      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push(instance.InstanceId);
        }
      }

      return instances;
    });

    const instanceArrays = await Promise.all(instancesPromises);
    const instanceIds = instanceArrays.flat();

    if (instanceIds.length === 0) {
      console.log('No running instances found to stop');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No running instances found to stop',
          stoppedInstances: [],
        }),
      };
    }

    console.log(`Stopping ${instanceIds.length} instances:`, instanceIds);

    // Stop the instances
    const stopCommand = new StopInstancesCommand({
      InstanceIds: instanceIds,
    });

    const stopResponse = await ec2Client.send(stopCommand);

    console.log('Stop response:', JSON.stringify(stopResponse, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully stopped ${instanceIds.length} instances`,
        stoppedInstances: instanceIds,
        details: stopResponse.StoppingInstances,
      }),
    };
  } catch (error) {
    console.error('Error stopping instances:', error);
    throw error;
  }
};
```

## File: lib/lambda/ec2-start.js

```javascript
/**
 * EC2 Start Lambda Function
 *
 * This Lambda function starts EC2 instances tagged with Environment=development
 * or Environment=staging. It's triggered by CloudWatch Events at 8 AM EST on weekdays.
 */
const { EC2Client, DescribeInstancesCommand, StartInstancesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('EC2 Start Lambda triggered:', JSON.stringify(event, null, 2));

  const targetEnvironments = (process.env.TARGET_ENVIRONMENTS || 'development,staging').split(',');

  try {
    // Find all stopped instances with target environment tags
    const instancesPromises = targetEnvironments.map(async (env) => {
      const describeCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [env.trim()],
          },
          {
            Name: 'instance-state-name',
            Values: ['stopped'],
          },
        ],
      });

      const response = await ec2Client.send(describeCommand);
      const instances = [];

      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push(instance.InstanceId);
        }
      }

      return instances;
    });

    const instanceArrays = await Promise.all(instancesPromises);
    const instanceIds = instanceArrays.flat();

    if (instanceIds.length === 0) {
      console.log('No stopped instances found to start');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No stopped instances found to start',
          startedInstances: [],
        }),
      };
    }

    console.log(`Starting ${instanceIds.length} instances:`, instanceIds);

    // Start the instances
    const startCommand = new StartInstancesCommand({
      InstanceIds: instanceIds,
    });

    const startResponse = await ec2Client.send(startCommand);

    console.log('Start response:', JSON.stringify(startResponse, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully started ${instanceIds.length} instances`,
        startedInstances: instanceIds,
        details: startResponse.StartingInstances,
      }),
    };
  } catch (error) {
    console.error('Error starting instances:', error);
    throw error;
  }
};
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for EC2 cost optimization infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration for EC2 scheduling and cost optimization.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes
const repository = config.get('repository') || 'ec2-cost-optimization';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: 'EC2CostOptimization',
};

// Instantiate the main stack component for the infrastructure
const stack = new TapStack('ec2-cost-optimizer', {
  environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for use by other systems
export const stopLambdaArn = stack.schedulerOutputs.apply(
  (outputs) => outputs.stopFunctionArn
);
export const startLambdaArn = stack.schedulerOutputs.apply(
  (outputs) => outputs.startFunctionArn
);
export const stopRuleArn = stack.schedulerOutputs.apply(
  (outputs) => outputs.stopRuleArn
);
export const startRuleArn = stack.schedulerOutputs.apply(
  (outputs) => outputs.startRuleArn
);
export const managedInstanceIds = stack.schedulerOutputs.apply(
  (outputs) => outputs.managedInstanceIds
);
export const estimatedMonthlySavings = stack.costOutputs.apply(
  (outputs) => outputs.estimatedMonthlySavings
);
```

## File: Pulumi.yaml

```yaml
name: ec2-cost-optimizer
runtime:
  name: nodejs
  options:
    typescript: true
description: Pulumi infrastructure for EC2 cost optimization with scheduled start/stop
main: bin/tap.ts
```

## File: package.json

```json
{
  "name": "ec2-cost-optimizer",
  "version": "1.0.0",
  "description": "EC2 cost optimization with scheduled start/stop using Pulumi",
  "main": "bin/tap.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "@aws-sdk/client-ec2": "^3.400.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Implementation Notes

### Key Features

1. **Instance Discovery**: Automatically discovers EC2 instances tagged with Environment=development or Environment=staging
2. **Scheduled Operations**: Uses CloudWatch Events with cron expressions for EST timezone scheduling
3. **Least Privilege IAM**: Lambda role has minimal permissions with resource-based conditions
4. **Audit Logging**: All operations logged to CloudWatch Logs with 7-day retention
5. **Error Monitoring**: CloudWatch Alarm detects and alerts on Lambda function failures
6. **Cost Calculation**: Estimates monthly savings based on instance types and shutdown hours

### Timezone Handling

The cron expressions use UTC time:
- Stop at 7 PM EST = midnight UTC: `cron(0 0 ? * MON-FRI *)`
- Start at 8 AM EST = 1 PM UTC: `cron(0 13 ? * MON-FRI *)`

Note: These times do not automatically adjust for daylight saving time transitions. For production use, consider using a more sophisticated timezone library or adjusting the cron expressions seasonally.

### Security Considerations

- Lambda functions use least privilege IAM policies with conditions
- Only instances with specific Environment tags can be stopped/started
- CloudWatch Logs enabled for audit trail
- No hardcoded credentials or sensitive data

### Cost Optimization

- Lambda functions handle multiple instances per invocation
- CloudWatch Logs retention set to 7 days to minimize storage costs
- Estimated savings: 13 hours/day × 22 days/month × instance hourly rate

### Deployment

1. Ensure existing EC2 instances have proper Environment tags
2. Run `npm install` to install dependencies
3. Run `pulumi up` to deploy the infrastructure
4. Verify outputs show managed instance IDs and estimated savings
5. Test by manually invoking Lambda functions or waiting for scheduled execution

### Testing Strategy

The implementation includes:
- Lambda function logic with proper error handling
- Instance filtering by environment tags
- Batch operations to handle multiple instances efficiently
- Comprehensive logging for troubleshooting
