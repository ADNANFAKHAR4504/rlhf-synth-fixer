/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
// import * as aws from "..." - not needed in stub

export interface DevOpsGuruStackArgs {
  environmentSuffix: string;
  snsTopicArn: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DevOpsGuruStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: DevOpsGuruStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:operations:DevOpsGuru', name, args, opts); // TODO: aws.devopsguru does not exist in @pulumi/aws
    // The Pulumi AWS provider doesn't support Amazon DevOps Guru resources
    // This would need to be implemented via AWS SDK API calls from Lambda

    // Placeholder to allow compilation
    const _suffix = args.environmentSuffix;

    this.registerOutputs({});
  }
}
