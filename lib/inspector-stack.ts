/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface InspectorStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class InspectorStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: InspectorStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:Inspector', name, args, opts);

    const suffix = args.environmentSuffix;

    // Enable Inspector for EC2
    const _ec2Configuration = new aws.inspector2.OrganizationConfiguration(
      `inspector-ec2-${suffix}`,
      {
        autoEnable: {
          ec2: true,
          ecr: true,
        },
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
