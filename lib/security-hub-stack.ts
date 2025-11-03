/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityHubStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityHubStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: SecurityHubStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityHub', name, args, opts);

    const suffix = args.environmentSuffix;
    const tags = args.tags;

    // Get the current AWS region
    const currentRegion = aws.getRegionOutput();
    const region = currentRegion.name;

    // Enable Security Hub
    const securityHub = new aws.securityhub.Account(
      `security-hub-${suffix}`,
      {},
      { parent: this }
    );

    // Subscribe to CIS AWS Foundations Benchmark
    const cisStandard = new aws.securityhub.StandardsSubscription(
      `cis-standard-${suffix}`,
      {
        standardsArn: pulumi.interpolate`arn:aws:securityhub:${region}::standards/cis-aws-foundations-benchmark/v/1.2.0`,
      },
      { parent: this, dependsOn: [securityHub] }
    );

    // Subscribe to AWS Foundational Security Best Practices
    const foundationalStandard = new aws.securityhub.StandardsSubscription(
      `foundational-standard-${suffix}`,
      {
        standardsArn: pulumi.interpolate`arn:aws:securityhub:${region}::standards/aws-foundational-security-best-practices/v/1.0.0`,
      },
      { parent: this, dependsOn: [securityHub] }
    );

    this.registerOutputs({});
  }
}
