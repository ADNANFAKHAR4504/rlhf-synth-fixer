/**
 * VPC Stack - Creates VPC with public and private subnets across multiple AZs
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  region: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Get available AZs
    const azs = aws.getAvailabilityZonesOutput({ state: 'available' });
    const availableAzs = azs.names.apply(names => names.slice(0, 3));

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `eks-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `eks-vpc-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `eks-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `eks-igw-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const publicCidrs = ['10.0.101.0/24', '10.0.102.0/24', '10.0.103.0/24'];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `eks-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: publicCidrs[i],
          availabilityZone: availableAzs.apply(azs => azs[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `eks-public-subnet-${i + 1}-${environmentSuffix}`,
            'kubernetes.io/role/elb': '1',
          })),
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `eks-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `eks-public-rt-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `eks-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `eks-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `eks-nat-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `eks-nat-eip-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new aws.ec2.NatGateway(
        `eks-nat-${i + 1}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eips[i].id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `eks-nat-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      natGateways.push(nat);
    }

    // Create private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `eks-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: privateCidrs[i],
          availabilityZone: availableAzs.apply(azs => azs[i]),
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `eks-private-subnet-${i + 1}-${environmentSuffix}`,
            'kubernetes.io/role/internal-elb': '1',
          })),
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create private route tables (one per AZ)
    for (let i = 0; i < 3; i++) {
      const routeTable = new aws.ec2.RouteTable(
        `eks-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `eks-private-rt-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `eks-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `eks-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: privateSubnets[i].id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );
    }

    this.vpcId = vpc.id;
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
    });
  }
}
