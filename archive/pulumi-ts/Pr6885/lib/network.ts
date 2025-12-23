import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkProps {
  environment: string;
  environmentSuffix: string;
  vpcCidr: string;
}

export class NetworkComponent extends pulumi.ComponentResource {
  public vpc: aws.ec2.Vpc;
  public privateSubnets: aws.ec2.Subnet[];
  public securityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    props: NetworkProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:NetworkComponent', name, {}, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${props.environment}-${props.environmentSuffix}`,
      {
        cidrBlock: props.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `payments-vpc-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create 3 private subnets
    this.privateSubnets = [];
    const subnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${props.environment}-${props.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: subnetCidrs[i],
          availabilityZone: availabilityZones.names[i],
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `payments-private-subnet-${i}-${props.environment}-${props.environmentSuffix}`,
            Environment: props.environment,
          },
        },
        { parent: this }
      );

      this.privateSubnets.push(subnet);
    }

    // Create security group
    this.securityGroup = new aws.ec2.SecurityGroup(
      `payments-sg-${props.environment}-${props.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: `Security group for payment processing ${props.environment}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [props.vpcCidr],
            description: 'PostgreSQL access',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: `payments-sg-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      subnetIds: pulumi
        .output(this.privateSubnets)
        .apply(subnets => subnets.map(s => s.id)),
      securityGroupId: this.securityGroup.id,
    });
  }
}
