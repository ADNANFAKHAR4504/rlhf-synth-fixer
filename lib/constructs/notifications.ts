import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class NotificationsConstruct extends Construct {
  public readonly operationalTopic: sns.Topic;
  public readonly securityTopic: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Operational alerts topic
    this.operationalTopic = new sns.Topic(this, 'OperationalAlerts', {
      displayName: 'Payment Platform - Operational Alerts',
      topicName: 'payment-platform-operational-alerts',
    });

    // Security alerts topic
    this.securityTopic = new sns.Topic(this, 'SecurityAlerts', {
      displayName: 'Payment Platform - Security Alerts',
      topicName: 'payment-platform-security-alerts',
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