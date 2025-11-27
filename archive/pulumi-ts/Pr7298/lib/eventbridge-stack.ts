/**
 * eventbridge-stack.ts
 *
 * Defines EventBridge rules for pipeline state change notifications.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EventBridgeStackArgs {
  environmentSuffix: string;
  pipelineName: pulumi.Input<string>;
  snsTopicArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EventBridgeStack extends pulumi.ComponentResource {
  public readonly pipelineRule: aws.cloudwatch.EventRule;
  public readonly pipelineTarget: aws.cloudwatch.EventTarget;

  constructor(
    name: string,
    args: EventBridgeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eventbridge:EventBridgeStack', name, args, opts);

    const { environmentSuffix, pipelineName, snsTopicArn, tags } = args;

    // EventBridge rule for pipeline state changes
    this.pipelineRule = new aws.cloudwatch.EventRule(
      `pipeline-state-rule-${environmentSuffix}`,
      {
        name: `cicd-pipeline-state-${environmentSuffix}`,
        description: 'Capture CodePipeline execution state changes',
        eventPattern: pulumi.interpolate`{
          "source": ["aws.codepipeline"],
          "detail-type": ["CodePipeline Pipeline Execution State Change", "CodePipeline Stage Execution State Change"],
          "detail": {
            "pipeline": ["${pipelineName}"]
          }
        }`,
        tags: {
          ...tags,
          Name: `pipeline-state-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // EventBridge target (SNS topic)
    this.pipelineTarget = new aws.cloudwatch.EventTarget(
      `pipeline-sns-target-${environmentSuffix}`,
      {
        rule: this.pipelineRule.name,
        arn: snsTopicArn,
      },
      { parent: this }
    );

    // SNS topic policy to allow EventBridge
    new aws.sns.TopicPolicy(
      `sns-eventbridge-policy-${environmentSuffix}`,
      {
        arn: snsTopicArn,
        policy: pulumi.all([snsTopicArn]).apply(([topicArn]) =>
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

    this.registerOutputs({
      ruleArn: this.pipelineRule.arn,
      ruleName: this.pipelineRule.name,
    });
  }
}
