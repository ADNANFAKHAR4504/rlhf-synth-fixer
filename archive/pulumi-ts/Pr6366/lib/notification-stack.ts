/**
 * notification-stack.ts
 *
 * This module defines the SNS topic and subscriptions for payment notifications
 * and CloudWatch alarms.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NotificationStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  emailEndpoint?: string;
}

export class NotificationStack extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;

  constructor(
    name: string,
    args: NotificationStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:notification:NotificationStack', name, args, opts);

    const { environmentSuffix, tags, emailEndpoint } = args;

    // Create SNS topic for payment notifications
    this.snsTopic = new aws.sns.Topic(
      `payment-notifications-${environmentSuffix}`,
      {
        displayName: `Payment Notifications - ${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-notifications-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create email subscription if endpoint provided
    if (emailEndpoint) {
      new aws.sns.TopicSubscription(
        `payment-email-sub-${environmentSuffix}`,
        {
          topic: this.snsTopic.arn,
          protocol: 'email',
          endpoint: emailEndpoint,
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
    });
  }
}
