import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environment: string;
}

export class MonitoringConstruct extends Construct {
  public readonly alertTopic: sns.Topic;
  public readonly securityLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { environment } = props;

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, `AlertTopic-${environment}`, {
      displayName: `Security Alerts - ${environment}`,
      topicName: `security-alerts-${environment}`,
    });

    // Add email subscription (you can modify this)
    this.alertTopic.addSubscription(
      new subs.EmailSubscription('security-team@company.com')
    );

    // CloudWatch Log Group for security events
    this.securityLogGroup = new logs.LogGroup(
      this,
      `SecurityLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
      }
    );

    // CloudTrail Log Group
    const cloudTrailLogGroup = new logs.LogGroup(
      this,
      `CloudTrailLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
      }
    );

    // Metric filter for failed login attempts
    new logs.MetricFilter(this, `FailedLoginFilter-${environment}`, {
      logGroup: cloudTrailLogGroup,
      metricNamespace: 'Security',
      metricName: 'FailedLogins',
      filterPattern: logs.FilterPattern.literal(
        '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      ),
      metricValue: '1',
    });

    // Alarm for failed login attempts
    const failedLoginAlarm = new cloudwatch.Alarm(
      this,
      `FailedLoginAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'Security',
          metricName: 'FailedLogins',
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alert on multiple failed login attempts',
      }
    );

    failedLoginAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // Metric filter for root account usage
    new logs.MetricFilter(this, `RootUsageFilter-${environment}`, {
      logGroup: cloudTrailLogGroup,
      metricNamespace: 'Security',
      metricName: 'RootAccountUsage',
      filterPattern: logs.FilterPattern.literal(
        '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      ),
      metricValue: '1',
    });

    // Alarm for root account usage
    const rootUsageAlarm = new cloudwatch.Alarm(
      this,
      `RootUsageAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'Security',
          metricName: 'RootAccountUsage',
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alert on root account usage',
      }
    );

    rootUsageAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // EventBridge rule for security events
    const securityEventRule = new events.Rule(
      this,
      `SecurityEventRule-${environment}`,
      {
        eventPattern: {
          source: ['aws.signin'],
          detailType: ['AWS Console Sign In via CloudTrail'],
          detail: {
            responseElements: {
              ConsoleLogin: ['Failure'],
            },
          },
        },
      }
    );

    securityEventRule.addTarget(new targets.SnsTopic(this.alertTopic));

    // IAM policy for unauthorized access detection
    const unauthorizedAccessRule = new events.Rule(
      this,
      `UnauthorizedAccessRule-${environment}`,
      {
        eventPattern: {
          source: ['aws.iam'],
          detailType: ['AWS API Call via CloudTrail'],
          detail: {
            eventName: [
              'CreateUser',
              'DeleteUser',
              'CreateRole',
              'DeleteRole',
              'AttachUserPolicy',
              'DetachUserPolicy',
              'AttachRolePolicy',
              'DetachRolePolicy',
            ],
          },
        },
      }
    );

    unauthorizedAccessRule.addTarget(new targets.SnsTopic(this.alertTopic));

    // Tag monitoring resources
    cdk.Tags.of(this.alertTopic).add('Name', `AlertTopic-${environment}`);
    cdk.Tags.of(this.alertTopic).add('Component', 'Monitoring');
    cdk.Tags.of(this.securityLogGroup).add(
      'Name',
      `SecurityLogGroup-${environment}`
    );
    cdk.Tags.of(this.securityLogGroup).add('Component', 'Monitoring');
  }
}
