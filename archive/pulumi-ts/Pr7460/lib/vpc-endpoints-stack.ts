/**
 * VPC Endpoints Stack - Creates VPC endpoints for AWS services.
 *
 * Endpoints:
 * - DMS endpoint (for DMS API calls)
 * - Secrets Manager endpoint (for secret retrieval)
 * - CloudWatch Logs endpoint (for logging)
 *
 * These endpoints ensure traffic stays within AWS network and doesn't
 * traverse the internet, meeting the Direct Connect requirement.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcEndpointsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcEndpointsStack extends pulumi.ComponentResource {
  public readonly dmsEndpointId: pulumi.Output<string>;
  public readonly secretsManagerEndpointId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VpcEndpointsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:VpcEndpointsStack', name, args, opts);

    const tags = args.tags || {};

    // Create VPC endpoint for DMS
    const dmsEndpoint = new aws.ec2.VpcEndpoint(
      `dms-endpoint-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        serviceName: 'com.amazonaws.us-east-2.dms',
        vpcEndpointType: 'Interface',
        subnetIds: args.privateSubnetIds,
        securityGroupIds: [args.securityGroupId],
        privateDnsEnabled: true,
        tags: {
          ...tags,
          Name: `dms-endpoint-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create VPC endpoint for Secrets Manager
    const secretsManagerEndpoint = new aws.ec2.VpcEndpoint(
      `secretsmanager-endpoint-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        serviceName: 'com.amazonaws.us-east-2.secretsmanager',
        vpcEndpointType: 'Interface',
        subnetIds: args.privateSubnetIds,
        securityGroupIds: [args.securityGroupId],
        privateDnsEnabled: true,
        tags: {
          ...tags,
          Name: `secretsmanager-endpoint-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create VPC endpoint for CloudWatch Logs
    new aws.ec2.VpcEndpoint(
      `logs-endpoint-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        serviceName: 'com.amazonaws.us-east-2.logs',
        vpcEndpointType: 'Interface',
        subnetIds: args.privateSubnetIds,
        securityGroupIds: [args.securityGroupId],
        privateDnsEnabled: true,
        tags: {
          ...tags,
          Name: `logs-endpoint-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.dmsEndpointId = dmsEndpoint.id;
    this.secretsManagerEndpointId = secretsManagerEndpoint.id;

    this.registerOutputs({
      dmsEndpointId: this.dmsEndpointId,
      secretsManagerEndpointId: this.secretsManagerEndpointId,
    });
  }
}
