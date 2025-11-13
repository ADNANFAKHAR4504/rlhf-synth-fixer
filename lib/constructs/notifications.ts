import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class NotificationsConstruct extends Construct {
  public readonly operationalTopic: sns.Topic;
  public readonly securityTopic: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    let envSuffix =
      stack.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Sanitize envSuffix to remove bash syntax and invalid characters, then convert to lowercase
    envSuffix = envSuffix
      .replace(/[\${}:-]/g, '')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();

    // Ensure we have a valid suffix
    if (!envSuffix || envSuffix.trim() === '') {
      envSuffix = 'dev';
    }

    const stackName = `tapstack-${envSuffix}`;

    // Operational alerts topic
    this.operationalTopic = new sns.Topic(this, 'OperationalAlerts', {
      displayName: `Payment Platform - Operational Alerts (${stackName})`,
      topicName: `payment-platform-operational-alerts-${stackName}`,
    });

    // Security alerts topic
    this.securityTopic = new sns.Topic(this, 'SecurityAlerts', {
      displayName: `Payment Platform - Security Alerts (${stackName})`,
      topicName: `payment-platform-security-alerts-${stackName}`,
    });

    // Add email subscriptions (replace with actual email addresses)
    const operationsEmail = process.env.OPERATIONS_EMAIL || 'ops@example.com';
    const securityEmail = process.env.SECURITY_EMAIL || 'security@example.com';
    const smsNumber = process.env.ALERT_SMS || '+1234567890';

    // Operational subscriptions
    this.operationalTopic.addSubscription(
      new subscriptions.EmailSubscription(operationsEmail)
    );
    this.operationalTopic.addSubscription(
      new subscriptions.SmsSubscription(smsNumber)
    );

    // Security subscriptions
    this.securityTopic.addSubscription(
      new subscriptions.EmailSubscription(securityEmail)
    );
    this.securityTopic.addSubscription(
      new subscriptions.SmsSubscription(smsNumber)
    );
  }
}
