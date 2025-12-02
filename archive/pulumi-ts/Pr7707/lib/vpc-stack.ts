/**
 * VPC Stack - Network Infrastructure for RDS
 *
 * This module creates the necessary networking infrastructure to support
 * the RDS PostgreSQL deployment, including VPC, subnets, and security groups.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: pulumi.Input<string> };
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnet1: aws.ec2.Subnet;
  public readonly privateSubnet2: aws.ec2.Subnet;
  public readonly applicationSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    const resourceTags = {
      Environment: 'production',
      Team: 'platform',
      Service: 'user-api',
      ...args.tags,
    };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...resourceTags,
          Name: `vpc-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Get available AZs
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create Private Subnet 1
    this.privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...resourceTags,
          Name: `private-subnet-1-${args.environmentSuffix}`,
          Tier: 'private',
        },
      },
      defaultResourceOptions
    );

    // Create Private Subnet 2
    this.privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...resourceTags,
          Name: `private-subnet-2-${args.environmentSuffix}`,
          Tier: 'private',
        },
      },
      defaultResourceOptions
    );

    // Create Application Security Group (simulates application tier)
    this.applicationSecurityGroup = new aws.ec2.SecurityGroup(
      `app-sg-${args.environmentSuffix}`,
      {
        name: `app-sg-${args.environmentSuffix}`,
        description:
          'Security group for application tier - simulated for RDS access',
        vpcId: this.vpc.id,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...resourceTags,
          Name: `app-sg-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      privateSubnet1Id: this.privateSubnet1.id,
      privateSubnet2Id: this.privateSubnet2.id,
      applicationSecurityGroupId: this.applicationSecurityGroup.id,
    });
  }
}
