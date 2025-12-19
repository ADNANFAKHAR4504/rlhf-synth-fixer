import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TagsConfig } from '../types';

export interface VpcComponentArgs {
  environmentSuffix: string;
  tags: TagsConfig;
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:vpc:VpcComponent', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create VPC with 10.0.0.0/16 CIDR
    this.vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `payment-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create 3 private subnets in different AZs
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
    this.privateSubnets = azs.map((az, index) => {
      return new aws.ec2.Subnet(
        `payment-private-subnet-${index + 1}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index + 1}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...tags,
            Name: `payment-private-subnet-${index + 1}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
    });

    // Create route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `payment-private-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `payment-private-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate private subnets with route table
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.vpcId = this.vpc.id;
    this.privateSubnetIds = this.privateSubnets.map(s => s.id);

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
