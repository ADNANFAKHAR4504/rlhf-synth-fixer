import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ComplianceMonitoringStack } from './compliance-monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly reportBucketName: pulumi.Output<string>;
  public readonly complianceTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly analyzerFunctionName: pulumi.Output<string>;
  public readonly reportGeneratorFunctionName: pulumi.Output<string>;
  public readonly deepScannerFunctionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    const complianceStack = new ComplianceMonitoringStack(
      'compliance-monitoring',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    this.reportBucketName = complianceStack.reportBucketName;
    this.complianceTopicArn = complianceStack.complianceTopicArn;
    this.dashboardName = complianceStack.dashboardName;
    this.analyzerFunctionName = complianceStack.analyzerFunctionName;
    this.reportGeneratorFunctionName =
      complianceStack.reportGeneratorFunctionName;
    this.deepScannerFunctionName = complianceStack.deepScannerFunctionName;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      complianceTopicArn: this.complianceTopicArn,
      dashboardName: this.dashboardName,
      analyzerFunctionName: this.analyzerFunctionName,
      reportGeneratorFunctionName: this.reportGeneratorFunctionName,
      deepScannerFunctionName: this.deepScannerFunctionName,
    });
  }
}
