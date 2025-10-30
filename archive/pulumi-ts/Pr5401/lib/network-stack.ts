/**
 * network-stack.ts
 *
 * Creates VPC infrastructure with public and private subnets across multiple AZs.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly vpcCidr: string;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;
    this.vpcCidr = '10.0.0.0/16';

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: this.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.vpcId = vpc.id;

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create public subnets (2 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: pulumi
            .output(availabilityZones)
            .apply(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
            ...tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new aws.ec2.Eip(
      `nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create NAT Gateway in first public subnet
    const natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${environmentSuffix}`,
      {
        allocationId: natEip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          Name: `nat-gateway-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create private subnets (2 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: pulumi
            .output(availabilityZones)
            .apply(azs => azs.names[i]),
          tags: {
            Name: `private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
            ...tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // Create private route table
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Route to NAT Gateway
    new aws.ec2.Route(
      `private-route-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { parent: this }
    );

    // Associate private subnets with route table
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
