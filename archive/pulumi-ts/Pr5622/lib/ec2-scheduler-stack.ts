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
  public readonly outputs: pulumi.Output<{
    stopFunctionArn: string;
    startFunctionArn: string;
    stopRuleArn: string;
    startRuleArn: string;
    managedInstanceIds: string[];
  }>;

  constructor(
    name: string,
    args: Ec2SchedulerStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:ec2:Ec2SchedulerStack', name, args, opts);

    const { environmentSuffix, tags } = args;

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
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for EC2 operations with explicit production protection
    const ec2Policy = new aws.iam.RolePolicy(
      `ec2-scheduler-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Deny',
              Action: ['ec2:StartInstances', 'ec2:StopInstances'],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'ec2:ResourceTag/Environment': 'production',
                },
              },
            },
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
        reservedConcurrentExecutions: 1,
        environment: {
          variables: {
            TARGET_ENVIRONMENTS: 'development,staging',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
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
        reservedConcurrentExecutions: 1,
        environment: {
          variables: {
            TARGET_ENVIRONMENTS: 'development,staging',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
        tags: {
          ...tags,
          Name: `ec2-start-function-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [startLogsGroup, ec2Policy] }
    );

    // Create IAM role for EventBridge Scheduler
    const schedulerRole = new aws.iam.Role(
      `ec2-scheduler-eventbridge-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'scheduler.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `ec2-scheduler-eventbridge-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create inline policy for EventBridge Scheduler to invoke Lambda
    new aws.iam.RolePolicy(
      `scheduler-lambda-policy-${environmentSuffix}`,
      {
        role: schedulerRole.id,
        policy: pulumi
          .all([stopFunction.arn, startFunction.arn])
          .apply(([stopArn, startArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: 'lambda:InvokeFunction',
                  Resource: [stopArn, startArn],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create EventBridge Scheduler schedule to stop instances at 7 PM EST on weekdays
    // Uses America/New_York timezone with automatic DST handling
    const stopSchedule = new aws.scheduler.Schedule(
      `ec2-stop-schedule-${environmentSuffix}`,
      {
        description:
          'Stop development and staging EC2 instances at 7 PM EST on weekdays',
        scheduleExpression: 'cron(0 19 ? * MON-FRI *)',
        scheduleExpressionTimezone: 'America/New_York',
        flexibleTimeWindow: {
          mode: 'OFF',
        },
        target: {
          arn: stopFunction.arn,
          roleArn: schedulerRole.arn,
          input: JSON.stringify({}),
        },
      },
      { parent: this }
    );

    // Create EventBridge Scheduler schedule to start instances at 8 AM EST on weekdays
    // Uses America/New_York timezone with automatic DST handling
    const startSchedule = new aws.scheduler.Schedule(
      `ec2-start-schedule-${environmentSuffix}`,
      {
        description:
          'Start development and staging EC2 instances at 8 AM EST on weekdays',
        scheduleExpression: 'cron(0 8 ? * MON-FRI *)',
        scheduleExpressionTimezone: 'America/New_York',
        flexibleTimeWindow: {
          mode: 'OFF',
        },
        target: {
          arn: startFunction.arn,
          roleArn: schedulerRole.arn,
          input: JSON.stringify({}),
        },
      },
      { parent: this }
    );

    // Create CloudWatch Alarm for failed instance starts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    this.stopRuleArn = stopSchedule.arn;
    this.startRuleArn = startSchedule.arn;

    this.outputs = pulumi.output({
      stopFunctionArn: stopFunction.arn,
      startFunctionArn: startFunction.arn,
      stopRuleArn: stopSchedule.arn,
      startRuleArn: startSchedule.arn,
      managedInstanceIds: this.managedInstanceIds,
    });

    this.registerOutputs({});
  }
}
