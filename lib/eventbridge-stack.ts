/**
 * eventbridge-stack.ts
 *
 * Defines EventBridge rules for scheduled Lambda invocation.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EventBridgeStackArgs {
  region: string;
  lambdaFunctionArn: pulumi.Input<string>;
  lambdaFunctionName: pulumi.Input<string>;
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EventBridgeStack extends pulumi.ComponentResource {
  public readonly rule: aws.cloudwatch.EventRule;
  public readonly target: aws.cloudwatch.EventTarget;
  public readonly ruleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: EventBridgeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eventbridge:EventBridgeStack', name, args, opts);

    const region = args.region;
    const envSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create EventBridge rule (scheduled every 5 minutes)
    this.rule = new aws.cloudwatch.EventRule(
      `${name}-schedule-rule`,
      {
        name: `${name}-schedule-${envSuffix}-e7`,
        description: 'Trigger Lambda every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: {
          ...tags,
          Name: `${name}-eventbridge-rule-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(
      `${name}-lambda-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: args.lambdaFunctionName,
        principal: 'events.amazonaws.com',
        sourceArn: this.rule.arn,
      },
      { parent: this }
    );

    // Create EventBridge target
    this.target = new aws.cloudwatch.EventTarget(
      `${name}-lambda-target`,
      {
        rule: this.rule.name,
        arn: args.lambdaFunctionArn,
      },
      { parent: this }
    );

    this.ruleArn = this.rule.arn;

    this.registerOutputs({
      ruleArn: this.rule.arn,
      ruleName: this.rule.name,
    });
  }
}
