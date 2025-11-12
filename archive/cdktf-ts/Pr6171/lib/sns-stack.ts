import { Construct } from 'constructs';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';

export interface SnsStackProps {
  environmentSuffix: string;
  emailEndpoint: string;
}

export class SnsStack extends Construct {
  public readonly notificationTopic: SnsTopic;

  constructor(scope: Construct, id: string, props: SnsStackProps) {
    super(scope, id);

    const { environmentSuffix, emailEndpoint } = props;

    // Create SNS topic for payment notifications
    this.notificationTopic = new SnsTopic(this, 'notification_topic', {
      name: `payment-notifications-${environmentSuffix}`,
      displayName: 'Payment Processing Notifications',
      tags: {
        Name: `payment-notifications-${environmentSuffix}`,
      },
    });

    // Create email subscription
    new SnsTopicSubscription(this, 'email_subscription', {
      topicArn: this.notificationTopic.arn,
      protocol: 'email',
      endpoint: emailEndpoint,
    });
  }
}
