import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createSNSTopics(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  const criticalTopic = new aws.sns.Topic(
    `infrastructure-alerts-critical-${environmentSuffix}`,
    {
      displayName: `Infrastructure Critical Alerts - ${environmentSuffix}`,
      tags: tags,
    },
    opts
  );

  const warningTopic = new aws.sns.Topic(
    `infrastructure-alerts-warning-${environmentSuffix}`,
    {
      displayName: `Infrastructure Warning Alerts - ${environmentSuffix}`,
      tags: tags,
    },
    opts
  );

  const infoTopic = new aws.sns.Topic(
    `infrastructure-alerts-info-${environmentSuffix}`,
    {
      displayName: `Infrastructure Info Alerts - ${environmentSuffix}`,
      tags: tags,
    },
    opts
  );

  // Create subscriptions (email endpoints would be provided via configuration)
  new aws.sns.TopicSubscription(
    `infrastructure-alerts-critical-sub-${environmentSuffix}`,
    {
      topic: criticalTopic.arn,
      protocol: 'email',
      endpoint: pulumi
        .output(pulumi.getStack())
        .apply(stack => `infrastructure-critical-${stack}@example.com`),
    },
    opts
  );

  new aws.sns.TopicSubscription(
    `infrastructure-alerts-warning-sub-${environmentSuffix}`,
    {
      topic: warningTopic.arn,
      protocol: 'email',
      endpoint: pulumi
        .output(pulumi.getStack())
        .apply(stack => `infrastructure-warning-${stack}@example.com`),
    },
    opts
  );

  new aws.sns.TopicSubscription(
    `infrastructure-alerts-info-sub-${environmentSuffix}`,
    {
      topic: infoTopic.arn,
      protocol: 'email',
      endpoint: pulumi
        .output(pulumi.getStack())
        .apply(stack => `infrastructure-info-${stack}@example.com`),
    },
    opts
  );

  return {
    topicArns: pulumi.output({
      critical: criticalTopic.arn,
      warning: warningTopic.arn,
      info: infoTopic.arn,
    }),
    topics: {
      critical: criticalTopic,
      warning: warningTopic,
      info: infoTopic,
    },
  };
}
