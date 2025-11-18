/**
 * VPC Stack for EKS Cluster
 * Creates a VPC with public and private subnets for EKS deployment
 */
import * as pulumi from '@pulumi/pulumi';
import * as awsx from '@pulumi/awsx';

export interface VpcStackArgs {
  environmentSuffix: string;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: awsx.ec2.Vpc;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly vpcId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:VpcStack', name, args, opts);

    // Create VPC with public and private subnets
    this.vpc = new awsx.ec2.Vpc(
      `eks-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        numberOfAvailabilityZones: 2,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        natGateways: {
          strategy: 'Single',
        },
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Public,
            cidrMask: 20,
            tags: {
              Name: `eks-public-subnet-${args.environmentSuffix}`,
              'kubernetes.io/role/elb': '1',
            },
          },
          {
            type: awsx.ec2.SubnetType.Private,
            cidrMask: 20,
            tags: {
              Name: `eks-private-subnet-${args.environmentSuffix}`,
              'kubernetes.io/role/internal-elb': '1',
            },
          },
        ],
        tags: {
          Name: `eks-vpc-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.vpcId = this.vpc.vpcId;
    this.publicSubnetIds = pulumi.output(this.vpc.publicSubnetIds);
    this.privateSubnetIds = pulumi.output(this.vpc.privateSubnetIds);

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
