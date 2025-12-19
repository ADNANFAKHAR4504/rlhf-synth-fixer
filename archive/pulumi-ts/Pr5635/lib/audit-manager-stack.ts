/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AuditManagerStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class AuditManagerStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: AuditManagerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:AuditManager', name, args, opts);

    // TODO: aws.auditmanager does not exist in @pulumi/aws
    // The Pulumi AWS provider doesn't support AWS Audit Manager resources
    // This would need to be implemented via AWS SDK API calls from Lambda

    // Placeholder to allow compilation
    const _suffix = args.environmentSuffix;

    this.registerOutputs({});
  }
}
