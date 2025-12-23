/**
 * SNS Stack - Notification topic for pipeline state changes
 *
 * This stack creates an SNS topic with email subscription for:
 * - Pipeline failures
 * - Manual approval requests
 * - Deployment notifications
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SnsStackArgs {
  environmentSuffix: string;
  region: string;
  notificationEmail: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SnsStack extends pulumi.ComponentResource {
  public readonly topicArn: pulumi.Output<string>;
  public readonly topicName: pulumi.Output<string>;

  constructor(
    name: string,
    args: SnsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:SnsStack', name, args, opts);

    // SNS Topic for Pipeline Notifications
    const pipelineTopic = new aws.sns.Topic(
      `pipeline-notifications-${args.environmentSuffix}`,
      {
        name: `pipeline-notifications-${args.environmentSuffix}`,
        displayName: 'CI/CD Pipeline Notifications',
        tags: args.tags,
      },
      { parent: this }
    );

    // Email Subscription
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _emailSubscription = new aws.sns.TopicSubscription(
      `pipeline-email-subscription-${args.environmentSuffix}`,
      {
        topic: pipelineTopic.arn,
        protocol: 'email',
        endpoint: args.notificationEmail,
      },
      { parent: this }
    );

    // SNS Topic Policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _topicPolicy = new aws.sns.TopicPolicy(
      `pipeline-topic-policy-${args.environmentSuffix}`,
      {
        arn: pipelineTopic.arn,
        policy: pipelineTopic.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: [
                    'codepipeline.amazonaws.com',
                    'codedeploy.amazonaws.com',
                    'events.amazonaws.com',
                  ],
                },
                Action: 'SNS:Publish',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    this.topicArn = pipelineTopic.arn;
    this.topicName = pipelineTopic.name;

    this.registerOutputs({
      topicArn: this.topicArn,
      topicName: this.topicName,
    });
  }
}
