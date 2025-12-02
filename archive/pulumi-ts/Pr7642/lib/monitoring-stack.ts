import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  instanceIds: pulumi.Input<string[]>;
  lambdaFunctionArn: pulumi.Input<string>;
  tags?: { [key: string]: string };
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly complianceAlarm: aws.cloudwatch.MetricAlarm;
  public readonly eventRule: aws.cloudwatch.EventRule;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:MonitoringStack', name, {}, opts);

    const {
      environmentSuffix,
      instanceIds,
      lambdaFunctionArn,
      tags = {},
    } = args;

    // Create EventBridge rule to trigger Lambda every 5 minutes
    this.eventRule = new aws.cloudwatch.EventRule(
      `compliance-check-rule-${environmentSuffix}`,
      {
        description: 'Trigger tag compliance check every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: {
          ...tags,
          Name: `compliance-check-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add Lambda permission for EventBridge
    new aws.lambda.Permission(
      `lambda-eventbridge-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunctionArn,
        principal: 'events.amazonaws.com',
        sourceArn: this.eventRule.arn,
      },
      { parent: this }
    );

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(
      `compliance-check-target-${environmentSuffix}`,
      {
        rule: this.eventRule.name,
        arn: lambdaFunctionArn,
      },
      { parent: this }
    );

    // Create CloudWatch alarm for compliance violations
    this.complianceAlarm = new aws.cloudwatch.MetricAlarm(
      `compliance-alarm-${environmentSuffix}`,
      {
        name: `compliance-violations-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'NonCompliantInstances',
        namespace: `Compliance/${environmentSuffix}`,
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when instances are missing required tags',
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `compliance-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `compliance-${environmentSuffix}`,
        dashboardBody: pulumi.all([instanceIds]).apply(([_ids]) => {
          return JSON.stringify({
            widgets: [
              {
                type: 'metric',
                properties: {
                  metrics: [
                    [
                      'Compliance/' + environmentSuffix,
                      'CompliantInstances',
                      { stat: 'Average' },
                    ],
                    ['.', 'NonCompliantInstances', { stat: 'Average' }],
                  ],
                  period: 300,
                  stat: 'Average',
                  region: 'us-east-1',
                  title: 'Compliance Status',
                  yAxis: {
                    left: {
                      min: 0,
                    },
                  },
                },
              },
              {
                type: 'metric',
                properties: {
                  metrics: [
                    [
                      'Compliance/' + environmentSuffix,
                      'CompliancePercentage',
                      { stat: 'Average' },
                    ],
                  ],
                  period: 300,
                  stat: 'Average',
                  region: 'us-east-1',
                  title: 'Compliance Percentage',
                  yAxis: {
                    left: {
                      min: 0,
                      max: 100,
                    },
                  },
                },
              },
            ],
          });
        }),
      },
      { parent: this }
    );

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
      alarmArn: this.complianceAlarm.arn,
    });
  }
}
