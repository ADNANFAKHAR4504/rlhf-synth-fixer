import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  alertEmails?: string[];
}

export class MonitoringStack extends cdk.Stack {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environmentSuffix, alertEmails = [] } = props;

    this.alarmTopic = new sns.Topic(this, `AlarmTopic-${environmentSuffix}`, {
      topicName: `dr-alarms-${environmentSuffix}-${this.region}`,
      displayName: `DR Alarms ${environmentSuffix}`,
    });

    // Add email subscriptions if provided
    alertEmails.forEach(email => {
      this.alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(email)
      );
    });

    // General log group for DR operations
    new logs.LogGroup(this, `LogGroup-${environmentSuffix}`, {
      logGroupName: `/dr/general-${environmentSuffix}-${this.region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard-${environmentSuffix}`,
      {
        dashboardName: `DR-${environmentSuffix}-${this.region}`,
      }
    );

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# DR Dashboard\nEnvironment: ${environmentSuffix}\nRegion: ${this.region}`,
        width: 24,
        height: 2,
      }),
      new cloudwatch.GraphWidget({
        title: 'RTO Metrics',
        width: 12,
        left: [
          new cloudwatch.Metric({
            namespace: 'DR/Metrics',
            metricName: 'RTOMinutes',
            dimensionsMap: { Environment: environmentSuffix },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'RPO Metrics',
        width: 12,
        left: [
          new cloudwatch.Metric({
            namespace: 'DR/Metrics',
            metricName: 'RPOMinutes',
            dimensionsMap: { Environment: environmentSuffix },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    cdk.Tags.of(this.alarmTopic).add('Environment', environmentSuffix);
  }
}
