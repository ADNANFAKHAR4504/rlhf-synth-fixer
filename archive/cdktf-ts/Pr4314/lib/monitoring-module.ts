import { Construct } from 'constructs';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';

export interface MonitoringModuleProps {
  environmentSuffix: string;
}

export class MonitoringModule extends Construct {
  public readonly snsTopic: SnsTopic;

  constructor(scope: Construct, id: string, props: MonitoringModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // CloudWatch Log Group for pipeline logs
    new CloudwatchLogGroup(this, 'pipeline-log-group', {
      name: `/aws/pipeline/edu-content-${environmentSuffix}`,
      retentionInDays: 14,
      tags: {
        Name: `pipeline-logs-${environmentSuffix}`,
        Purpose: 'Pipeline Logging',
      },
    });

    // CloudWatch Log Group for CodeBuild
    new CloudwatchLogGroup(this, 'codebuild-log-group', {
      name: `/aws/codebuild/edu-content-${environmentSuffix}`,
      retentionInDays: 14,
      tags: {
        Name: `codebuild-logs-${environmentSuffix}`,
        Purpose: 'Build Logging',
      },
    });

    // CloudWatch Log Group for CodeDeploy
    new CloudwatchLogGroup(this, 'codedeploy-log-group', {
      name: `/aws/codedeploy/edu-content-${environmentSuffix}`,
      retentionInDays: 14,
      tags: {
        Name: `codedeploy-logs-${environmentSuffix}`,
        Purpose: 'Deployment Logging',
      },
    });

    // SNS Topic for notifications
    this.snsTopic = new SnsTopic(this, 'notification-topic', {
      name: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'Pipeline Notifications',
      tags: {
        Name: `pipeline-notifications-${environmentSuffix}`,
        Purpose: 'Pipeline Notifications',
      },
    });

    // SNS Topic Subscription (email - will need manual confirmation)
    new SnsTopicSubscription(this, 'email-subscription', {
      topicArn: this.snsTopic.arn,
      protocol: 'email',
      endpoint: `devops-${environmentSuffix}@example.com`,
    });

    // CloudWatch Alarm for pipeline failures
    new CloudwatchMetricAlarm(this, 'pipeline-failure-alarm', {
      alarmName: `pipeline-failure-${environmentSuffix}`,
      alarmDescription: 'Alert when pipeline fails',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'PipelineExecutionFailure',
      namespace: 'AWS/CodePipeline',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      actionsEnabled: true,
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `pipeline-failure-alarm-${environmentSuffix}`,
      },
    });

    // CloudWatch Alarm for build failures
    new CloudwatchMetricAlarm(this, 'build-failure-alarm', {
      alarmName: `build-failure-${environmentSuffix}`,
      alarmDescription: 'Alert when build fails',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'FailedBuilds',
      namespace: 'AWS/CodeBuild',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      actionsEnabled: true,
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `build-failure-alarm-${environmentSuffix}`,
      },
    });
  }
}
