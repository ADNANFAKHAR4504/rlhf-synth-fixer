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
          '.': new pulumi.asset.FileArchive(`${__dirname}/lambda`),
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
          '.': new pulumi.asset.FileArchive(`${__dirname}/lambda`),
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
        policy: stateMachine.arn.apply(arn =>
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
        description:
          'Stop non-production EC2 instances at 7 PM EST on weekdays',
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
        description:
          'Start non-production EC2 instances at 8 AM EST on weekdays',
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
    new aws.cloudwatch.MetricAlarm(
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
    new aws.cloudwatch.MetricAlarm(
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
        alarmDescription:
          'Alert when EC2 scheduler Lambda functions have errors',
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
