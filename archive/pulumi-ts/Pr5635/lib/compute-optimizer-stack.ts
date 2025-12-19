/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
// import * as aws from "..." - not needed in stub

export interface ComputeOptimizerStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeOptimizerStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: ComputeOptimizerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:operations:ComputeOptimizer', name, args, opts); // TODO: aws.computeoptimizer does not exist in @pulumi/aws
    // The Pulumi AWS provider doesn't support AWS Compute Optimizer resources
    // This would need to be implemented via AWS SDK API calls from Lambda

    // Placeholder to allow compilation
    const _suffix = args.environmentSuffix;

    this.registerOutputs({});
  }
}
