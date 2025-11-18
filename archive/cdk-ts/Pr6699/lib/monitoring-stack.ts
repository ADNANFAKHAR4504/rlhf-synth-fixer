import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `critical-alerts-${props.environmentSuffix}`,
      displayName: 'Critical Infrastructure Alerts',
    });

    // Email subscription (placeholder - should be configured via context parameter)
    const alertEmail =
      this.node.tryGetContext('alertEmail') || 'alerts@example.com';

    this.alertTopic.addSubscription(
      new subscriptions.EmailSubscription(alertEmail)
    );

    // Output
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: `AlertTopicArn-${props.environmentSuffix}`,
    });
  }
}
