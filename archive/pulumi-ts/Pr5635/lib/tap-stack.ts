import * as pulumi from '@pulumi/pulumi';
// import * as aws from "..." - not needed in stub
import { ResourceOptions } from '@pulumi/pulumi';
import { ComplianceMonitoringStack } from './compliance-monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  complianceEmailEndpoint?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly complianceBucket: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Instantiate the Compliance Monitoring Stack
    const complianceStack = new ComplianceMonitoringStack(
      'compliance-monitoring',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        complianceEmailEndpoint: args.complianceEmailEndpoint,
      },
      { parent: this }
    );

    this.complianceBucket = complianceStack.complianceBucketName;
    this.snsTopicArn = complianceStack.snsTopicArn;
    this.dashboardName = complianceStack.dashboardName;

    this.registerOutputs({
      complianceBucket: this.complianceBucket,
      snsTopicArn: this.snsTopicArn,
      dashboardName: this.dashboardName,
    });
  }
}
