/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
// import * as aws from "..." - not needed in stub

export interface DetectiveStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DetectiveStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: DetectiveStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:Detective', name, args, opts); // TODO: aws.detective does not exist in @pulumi/aws
    // The Pulumi AWS provider doesn't support AWS Detective resources
    // This would need to be implemented via AWS SDK API calls from Lambda

    // Placeholder to allow compilation
    const _suffix = args.environmentSuffix;

    this.registerOutputs({});
  }
}
