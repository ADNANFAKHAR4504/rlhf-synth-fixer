import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class MonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // SNS topic for alarm notifications
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `cicd-alarms-${environmentSuffix}`,
      displayName: 'CI/CD Pipeline Alarms',
    });

    // Add email subscription (replace with actual email)
    this.alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('devops-team@company.com')
    );

    // CloudWatch dashboard for pipeline monitoring
    this.dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `CICD-Pipeline-${environmentSuffix}`,
    });

    // Add metrics widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Execution Success Rate',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionSuccess',
            statistic: 'Sum',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionFailure',
            statistic: 'Sum',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Build Duration',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'Duration',
            statistic: 'Average',
          }),
        ],
      })
    );

    // Tags
    cdk.Tags.of(this.alarmTopic).add('Purpose', 'Monitoring');
    cdk.Tags.of(this.dashboard).add('Purpose', 'Monitoring');
  }
}