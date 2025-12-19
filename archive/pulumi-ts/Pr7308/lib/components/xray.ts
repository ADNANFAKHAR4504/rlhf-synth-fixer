/**
 * X-Ray Tracing Component
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface XRayComponentArgs {
  environmentSuffix: string;
  environment: 'dev' | 'staging' | 'prod';
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

export class XRayComponent extends pulumi.ComponentResource {
  public readonly samplingRuleArn: pulumi.Output<string>;
  public readonly groupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: XRayComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:xray:XRayComponent', name, {}, opts);

    const { environmentSuffix, environment, tags } = args;

    const samplingRule = new aws.xray.SamplingRule(
      `payment-sampling-${environmentSuffix}`,
      {
        ruleName: `payment-sampling-${environmentSuffix}`,
        priority: 1000,
        version: 1,
        reservoirSize: environment === 'prod' ? 10 : 5,
        fixedRate: environment === 'prod' ? 0.05 : 0.1,
        urlPath: '/payments/*',
        host: '*',
        httpMethod: '*',
        serviceName: `payment-processor-${environment}`,
        serviceType: '*',
        resourceArn: '*',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-sampling-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const xrayGroup = new aws.xray.Group(
      `payment-traces-${environmentSuffix}`,
      {
        groupName: `payment-traces-${environmentSuffix}`,
        filterExpression: 'service("payment-processor") AND responsetime > 2',
        insightsConfiguration: {
          insightsEnabled: true,
          notificationsEnabled: environment === 'prod',
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-traces-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.samplingRuleArn = samplingRule.arn;
    this.groupArn = xrayGroup.arn;

    this.registerOutputs({
      samplingRuleArn: this.samplingRuleArn,
      groupArn: this.groupArn,
    });
  }
}
