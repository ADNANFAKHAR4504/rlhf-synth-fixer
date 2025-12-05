import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createSNSTopics(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  const criticalTopic = new aws.sns.Topic(
    `infra-alerts-crit-e4-${environmentSuffix}`,
    {
      displayName: `Infra Critical Alerts - e4-${environmentSuffix}`,
      tags: tags,
    },
    opts
  );

  const warningTopic = new aws.sns.Topic(
    `infra-alerts-warn-e4-${environmentSuffix}`,
    {
      displayName: `Infra Warning Alerts - e4-${environmentSuffix}`,
      tags: tags,
    },
    opts
  );

  const infoTopic = new aws.sns.Topic(
    `infra-alerts-info-e4-${environmentSuffix}`,
    {
      displayName: `Infra Info Alerts - e4-${environmentSuffix}`,
      tags: tags,
    },
    opts
  );

  // Create subscriptions (email endpoints would be provided via configuration)
  new aws.sns.TopicSubscription(
    `infra-alerts-crit-sub-e4-${environmentSuffix}`,
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
    `infra-alerts-warn-sub-e4-${environmentSuffix}`,
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
    `infra-alerts-info-sub-e4-${environmentSuffix}`,
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
