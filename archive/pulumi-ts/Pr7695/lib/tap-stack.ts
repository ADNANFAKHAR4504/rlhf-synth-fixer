import * as pulumi from '@pulumi/pulumi';
import { ComplianceScanner } from './compliance-scanner';

export interface TapStackArgs {
  environmentSuffix?: string;
  region?: string;
  dryRun?: boolean;
}

export class TapStack extends pulumi.ComponentResource {
  constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.region || 'us-east-1';
    const dryRun = args.dryRun || false;

    // Create and run compliance scanner
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const scanner = new ComplianceScanner(region, environmentSuffix, dryRun);

    // Export configuration values (scanner is not serializable as Pulumi Output)
    this.registerOutputs({
      environmentSuffix: pulumi.output(environmentSuffix),
      region: pulumi.output(region),
      dryRun: pulumi.output(dryRun),
    });
  }
}
