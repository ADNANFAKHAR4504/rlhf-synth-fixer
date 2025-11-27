/**
 * xray-stack.ts
 *
 * Defines AWS X-Ray distributed tracing configuration.
 *
 * Features:
 * - Sampling rules (10% of requests)
 * - X-Ray groups for filtering traces by environment
 * - Service map for visualizing microservices architecture
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface XrayStackArgs {
  environmentSuffix: string;
  sampleRate?: number; // Default 0.1 (10%)
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class XrayStack extends pulumi.ComponentResource {
  public readonly samplingRule: aws.xray.SamplingRule;
  public readonly xrayGroup: aws.xray.Group;

  constructor(
    name: string,
    args: XrayStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:xray:XrayStack', name, args, opts);

    const { environmentSuffix, sampleRate = 0.1, tags } = args;

    // Create X-Ray sampling rule (10% by default)
    this.samplingRule = new aws.xray.SamplingRule(
      `cicd-sampling-rule-${environmentSuffix}`,
      {
        ruleName: `cicd-pipeline-${environmentSuffix}`,
        priority: 1000,
        version: 1,
        reservoirSize: 1, // Number of requests to trace per second before applying fixed rate
        fixedRate: sampleRate, // 0.1 = 10% of requests
        urlPath: '*', // Trace all paths
        host: '*', // Trace all hosts
        httpMethod: '*', // Trace all HTTP methods
        serviceName: '*', // Trace all services
        serviceType: '*', // Trace all service types
        resourceArn: '*', // Trace all resources
        attributes: {
          environment: environmentSuffix,
        },
        tags: {
          ...tags,
          Name: `cicd-sampling-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create X-Ray group for filtering traces
    this.xrayGroup = new aws.xray.Group(
      `cicd-xray-group-${environmentSuffix}`,
      {
        groupName: `cicd-pipeline-${environmentSuffix}`,
        filterExpression: `annotation.environment = "${environmentSuffix}"`,
        insightsConfiguration: {
          insightsEnabled: true, // Enable X-Ray Insights
          notificationsEnabled: false, // Disable notifications
        },
        tags: {
          ...tags,
          Name: `cicd-xray-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      samplingRuleName: this.samplingRule.ruleName,
      samplingRuleArn: this.samplingRule.arn,
      xrayGroupName: this.xrayGroup.groupName,
      xrayGroupArn: this.xrayGroup.arn,
    });
  }
}
