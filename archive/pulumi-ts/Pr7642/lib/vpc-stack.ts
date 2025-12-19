import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateway: aws.ec2.NatGateway;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:vpc:VpcStack', name, {}, opts);

    const { environmentSuffix, tags = {} } = args;

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azs.names[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azs.names[i],
          tags: {
            ...tags,
            Name: `private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
    }

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Elastic IP for NAT Gateway
    const eip = new aws.ec2.Eip(
      `nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          ...tags,
          Name: `nat-eip-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create NAT Gateway in first public subnet
    this.natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${environmentSuffix}`,
      {
        subnetId: this.publicSubnets[0].id,
        allocationId: eip.id,
        tags: {
          ...tags,
          Name: `nat-gateway-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route table
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `private-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to NAT Gateway
    new aws.ec2.Route(
      `private-route-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      { parent: this }
    );

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, i) => {
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
      vpcId: this.vpc.id,
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
    });
  }
}
