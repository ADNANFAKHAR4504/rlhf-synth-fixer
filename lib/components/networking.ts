/**
 * networking.ts
 *
 * Component for importing networking resources via stack references
 */
import * as pulumi from '@pulumi/pulumi';

export interface NetworkingStackArgs {
  stackReference: string;
}

export class NetworkingStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly availabilityZones: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: NetworkingStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:Networking', name, args, opts);

    const { stackReference } = args;

    // Get stack reference
    const networkStack = new pulumi.StackReference(stackReference);

    // Import VPC and subnet outputs
    this.vpcId = networkStack.getOutput('vpcId') as pulumi.Output<string>;
    this.privateSubnetIds = networkStack.getOutput('privateSubnetIds') as pulumi.Output<string[]>;
    this.publicSubnetIds = networkStack.getOutput('publicSubnetIds') as pulumi.Output<string[]>;
    this.availabilityZones = networkStack.getOutput('availabilityZones') as pulumi.Output<string[]>;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      availabilityZones: this.availabilityZones,
    });
  }
}
