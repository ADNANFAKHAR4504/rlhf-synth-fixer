import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly drVpcId: pulumi.Output<string>;
  public readonly primaryPublicSubnetIds: pulumi.Output<string[]>;
  public readonly drPublicSubnetIds: pulumi.Output<string[]>;
  public readonly primaryPrivateSubnetIds: pulumi.Output<string[]>;
  public readonly drPrivateSubnetIds: pulumi.Output<string[]>;
  public readonly primaryProvider: aws.Provider;
  public readonly drProvider: aws.Provider;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Primary provider for us-east-1
    this.primaryProvider = new aws.Provider(
      `primary-provider-${environmentSuffix}`,
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    // DR provider for us-east-2
    this.drProvider = new aws.Provider(
      `dr-provider-${environmentSuffix}`,
      {
        region: 'us-east-2',
      },
      { parent: this }
    );

    // Primary VPC in us-east-1
    const primaryVpc = new aws.ec2.Vpc(
      `primary-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-vpc-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: this.primaryProvider, parent: this }
    );

    // DR VPC in us-east-2
    const drVpc = new aws.ec2.Vpc(
      `dr-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-vpc-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: this.drProvider, parent: this }
    );

    // Get availability zones for primary region
    const primaryAzs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: this.primaryProvider }
    );

    // Get availability zones for DR region
    const drAzs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: this.drProvider }
    );

    // Create 3 public and 3 private subnets in primary region
    const primaryPublicSubnets: aws.ec2.Subnet[] = [];
    const primaryPrivateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `primary-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: primaryVpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: pulumi
            .output(primaryAzs)
            .apply(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `primary-public-subnet-${i}-${environmentSuffix}`,
            'DR-Role': 'primary',
          })),
        },
        { provider: this.primaryProvider, parent: this }
      );
      primaryPublicSubnets.push(publicSubnet);

      const privateSubnet = new aws.ec2.Subnet(
        `primary-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: primaryVpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: pulumi
            .output(primaryAzs)
            .apply(azs => azs.names[i]),
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `primary-private-subnet-${i}-${environmentSuffix}`,
            'DR-Role': 'primary',
          })),
        },
        { provider: this.primaryProvider, parent: this }
      );
      primaryPrivateSubnets.push(privateSubnet);
    }

    // Create 3 public and 3 private subnets in DR region
    const drPublicSubnets: aws.ec2.Subnet[] = [];
    const drPrivateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `dr-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: drVpc.id,
          cidrBlock: `10.1.${i}.0/24`,
          availabilityZone: pulumi.output(drAzs).apply(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `dr-public-subnet-${i}-${environmentSuffix}`,
            'DR-Role': 'secondary',
          })),
        },
        { provider: this.drProvider, parent: this }
      );
      drPublicSubnets.push(publicSubnet);

      const privateSubnet = new aws.ec2.Subnet(
        `dr-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: drVpc.id,
          cidrBlock: `10.1.${10 + i}.0/24`,
          availabilityZone: pulumi.output(drAzs).apply(azs => azs.names[i]),
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `dr-private-subnet-${i}-${environmentSuffix}`,
            'DR-Role': 'secondary',
          })),
        },
        { provider: this.drProvider, parent: this }
      );
      drPrivateSubnets.push(privateSubnet);
    }

    // Internet Gateway for primary VPC
    const primaryIgw = new aws.ec2.InternetGateway(
      `primary-igw-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-igw-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: this.primaryProvider, parent: this }
    );

    // Internet Gateway for DR VPC
    const drIgw = new aws.ec2.InternetGateway(
      `dr-igw-${environmentSuffix}`,
      {
        vpcId: drVpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-igw-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: this.drProvider, parent: this }
    );

    // Route table for primary public subnets
    const primaryPublicRt = new aws.ec2.RouteTable(
      `primary-public-rt-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-public-rt-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: this.primaryProvider, parent: this }
    );

    new aws.ec2.Route(
      `primary-public-route-${environmentSuffix}`,
      {
        routeTableId: primaryPublicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: primaryIgw.id,
      },
      { provider: this.primaryProvider, parent: this }
    );

    // Route table for DR public subnets
    const drPublicRt = new aws.ec2.RouteTable(
      `dr-public-rt-${environmentSuffix}`,
      {
        vpcId: drVpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-public-rt-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: this.drProvider, parent: this }
    );

    new aws.ec2.Route(
      `dr-public-route-${environmentSuffix}`,
      {
        routeTableId: drPublicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: drIgw.id,
      },
      { provider: this.drProvider, parent: this }
    );

    // Associate public subnets with route table in primary
    primaryPublicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `primary-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: primaryPublicRt.id,
        },
        { provider: this.primaryProvider, parent: this }
      );
    });

    // Associate public subnets with route table in DR
    drPublicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `dr-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: drPublicRt.id,
        },
        { provider: this.drProvider, parent: this }
      );
    });

    // Private route tables for primary
    const primaryPrivateRt = new aws.ec2.RouteTable(
      `primary-private-rt-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-private-rt-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: this.primaryProvider, parent: this }
    );

    // Private route tables for DR
    const drPrivateRt = new aws.ec2.RouteTable(
      `dr-private-rt-${environmentSuffix}`,
      {
        vpcId: drVpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-private-rt-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: this.drProvider, parent: this }
    );

    // Associate private subnets with route table in primary
    primaryPrivateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `primary-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: primaryPrivateRt.id,
        },
        { provider: this.primaryProvider, parent: this }
      );
    });

    // Associate private subnets with route table in DR
    drPrivateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `dr-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: drPrivateRt.id,
        },
        { provider: this.drProvider, parent: this }
      );
    });

    // VPC Peering Connection (requester in primary)
    const peeringConnection = new aws.ec2.VpcPeeringConnection(
      `vpc-peering-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        peerVpcId: drVpc.id,
        peerRegion: 'us-east-2',
        autoAccept: false,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `vpc-peering-${environmentSuffix}`,
        })),
      },
      { provider: this.primaryProvider, parent: this }
    );

    // VPC Peering Connection Accepter (in DR region)
    const peeringAccepter = new aws.ec2.VpcPeeringConnectionAccepter(
      `vpc-peering-accepter-${environmentSuffix}`,
      {
        vpcPeeringConnectionId: peeringConnection.id,
        autoAccept: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `vpc-peering-accepter-${environmentSuffix}`,
        })),
      },
      {
        provider: this.drProvider,
        parent: this,
        dependsOn: [peeringConnection],
      }
    );

    // Add routes for VPC peering in primary private route table
    new aws.ec2.Route(
      `primary-peering-route-${environmentSuffix}`,
      {
        routeTableId: primaryPrivateRt.id,
        destinationCidrBlock: '10.1.0.0/16',
        vpcPeeringConnectionId: peeringConnection.id,
      },
      {
        provider: this.primaryProvider,
        parent: this,
        dependsOn: [peeringAccepter],
      }
    );

    // Add routes for VPC peering in DR private route table
    new aws.ec2.Route(
      `dr-peering-route-${environmentSuffix}`,
      {
        routeTableId: drPrivateRt.id,
        destinationCidrBlock: '10.0.0.0/16',
        vpcPeeringConnectionId: peeringConnection.id,
      },
      { provider: this.drProvider, parent: this, dependsOn: [peeringAccepter] }
    );

    this.primaryVpcId = primaryVpc.id;
    this.drVpcId = drVpc.id;
    this.primaryPublicSubnetIds = pulumi.output(
      primaryPublicSubnets.map(s => s.id)
    );
    this.drPublicSubnetIds = pulumi.output(drPublicSubnets.map(s => s.id));
    this.primaryPrivateSubnetIds = pulumi.output(
      primaryPrivateSubnets.map(s => s.id)
    );
    this.drPrivateSubnetIds = pulumi.output(drPrivateSubnets.map(s => s.id));

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      drVpcId: this.drVpcId,
      primaryPublicSubnetIds: this.primaryPublicSubnetIds,
      drPublicSubnetIds: this.drPublicSubnetIds,
      primaryPrivateSubnetIds: this.primaryPrivateSubnetIds,
      drPrivateSubnetIds: this.drPrivateSubnetIds,
    });
  }
}
