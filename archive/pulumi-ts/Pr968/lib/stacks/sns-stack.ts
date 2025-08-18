/**
 * sns-stack.ts
 *
 * This module defines the SNS stack for security notifications.
 * Creates SNS topic and email subscription for security alerts.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface SnsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  alertEmail: string;
}

export interface SnsStackOutputs {
  topicArn: pulumi.Output<string>;
  topicName: pulumi.Output<string>;
}

export class SnsStack extends pulumi.ComponentResource {
  public readonly topicArn: pulumi.Output<string>;
  public readonly topicName: pulumi.Output<string>;

  constructor(name: string, args: SnsStackArgs, opts?: ResourceOptions) {
    super('tap:sns:SnsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create SNS topic for security alerts
    const securityAlertsTopic = new aws.sns.Topic(
      `tap-security-alerts-${environmentSuffix}`,
      {
        name: `tap-security-alerts-${environmentSuffix}`,
        displayName: `TAP Security Alerts - ${environmentSuffix}`,
        tags: {
          Name: `tap-security-alerts-${environmentSuffix}`,
          Purpose: 'SecurityAlerts',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create email subscription
    new aws.sns.TopicSubscription(
      `tap-security-alerts-subscription-${environmentSuffix}`,
      {
        topic: securityAlertsTopic.arn,
        protocol: 'email',
        endpoint: args.alertEmail,
      },
      { parent: this }
    );

    this.topicArn = securityAlertsTopic.arn;
    this.topicName = securityAlertsTopic.name;

    this.registerOutputs({
      topicArn: this.topicArn,
      topicName: this.topicName,
    });
  }
}
