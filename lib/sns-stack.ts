/**
 * sns-stack.ts
 *
 * Defines SNS topic for pipeline notifications.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SnsStackArgs {
  environmentSuffix: string;
  kmsKeyId: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SnsStack extends pulumi.ComponentResource {
  public readonly notificationTopic: aws.sns.Topic;

  constructor(
    name: string,
    args: SnsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:sns:SnsStack', name, args, opts);

    const { environmentSuffix, kmsKeyId, tags } = args;

    this.notificationTopic = new aws.sns.Topic(
      `cicd-notifications-${environmentSuffix}`,
      {
        name: `cicd-notifications-${environmentSuffix}`,
        kmsMasterKeyId: kmsKeyId,
        tags: {
          ...tags,
          Name: `cicd-notifications-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      topicArn: this.notificationTopic.arn,
    });
  }
}
