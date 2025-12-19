/**
 * monitoring-stack.ts
 *
 * Creates SNS topic and email subscription for pipeline notifications.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  notificationEmail: string;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: ResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, tags, notificationEmail } = args;

    // SNS topic for pipeline failure notifications
    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        name: `pipeline-notifications-${environmentSuffix}`,
        displayName: 'CI/CD Pipeline Notifications',
        tags,
      },
      { parent: this }
    );

    // SNS topic policy to allow CloudWatch Events to publish
    void new aws.sns.TopicPolicy(
      `sns-topic-policy-${environmentSuffix}`,
      {
        arn: snsTopic.arn,
        policy: pulumi.all([snsTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'events.amazonaws.com',
                },
                Action: 'SNS:Publish',
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Email subscription to SNS topic
    void new aws.sns.TopicSubscription(
      `email-subscription-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: notificationEmail,
      },
      { parent: this }
    );

    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
