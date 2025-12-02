/**
 * build-notifications.ts
 *
 * Creates SNS topic and EventBridge rule to detect and notify on CodeBuild failures.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BuildNotificationsArgs {
  environmentSuffix: string;
  codeBuildProjectArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class BuildNotifications extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: BuildNotificationsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:notifications:BuildNotifications', name, {}, opts);

    // Create SNS topic for build failure notifications
    const snsTopic = new aws.sns.Topic(
      `build-failures-${args.environmentSuffix}`,
      {
        name: `build-failures-${args.environmentSuffix}`,
        displayName: 'CodeBuild Failure Notifications',
        tags: args.tags,
      },
      { parent: this }
    );

    // Create EventBridge rule to detect build failures
    const eventRule = new aws.cloudwatch.EventRule(
      `build-failure-rule-${args.environmentSuffix}`,
      {
        name: `build-failure-rule-${args.environmentSuffix}`,
        description: 'Detect CodeBuild build failures',
        eventPattern: pulumi
          .all([args.codeBuildProjectArn])
          .apply(([projectArn]) => {
            const projectName = projectArn.split('/').pop();
            return JSON.stringify({
              source: ['aws.codebuild'],
              'detail-type': ['CodeBuild Build State Change'],
              detail: {
                'build-status': ['FAILED'],
                'project-name': [projectName],
              },
            });
          }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Create EventBridge target to send to SNS
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _eventTarget = new aws.cloudwatch.EventTarget(
      `build-failure-target-${args.environmentSuffix}`,
      {
        rule: eventRule.name,
        arn: snsTopic.arn,
        inputTransformer: {
          inputPaths: {
            buildId: '$.detail.build-id',
            projectName: '$.detail.project-name',
            buildStatus: '$.detail.build-status',
            region: '$.region',
            account: '$.account',
          },
          inputTemplate:
            '"Build <buildId> for project <projectName> has FAILED. Status: <buildStatus>. AWS Account: <account>, Region: <region>"',
        },
      },
      { parent: this }
    );

    // Allow EventBridge to publish to SNS topic
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _snsTopicPolicy = new aws.sns.TopicPolicy(
      `build-failures-policy-${args.environmentSuffix}`,
      {
        arn: snsTopic.arn,
        policy: pulumi
          .all([snsTopic.arn, eventRule.arn])
          .apply(([topicArn, ruleArn]) =>
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
                  Condition: {
                    ArnEquals: {
                      'aws:SourceArn': ruleArn,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
