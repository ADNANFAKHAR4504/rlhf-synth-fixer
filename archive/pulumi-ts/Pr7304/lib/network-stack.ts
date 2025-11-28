/**
 * network-stack.ts
 *
 * Multi-region VPC infrastructure with peering connection.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface NetworkStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly primaryPrivateSubnetIds: pulumi.Output<string[]>;
  public readonly secondaryPrivateSubnetIds: pulumi.Output<string[]>;
  public readonly primaryPublicSubnetIds: pulumi.Output<string[]>;
  public readonly secondaryPublicSubnetIds: pulumi.Output<string[]>;
  public readonly primaryDbSecurityGroupId: pulumi.Output<string>;
  public readonly secondaryDbSecurityGroupId: pulumi.Output<string>;
  public readonly primaryAlbSecurityGroupId: pulumi.Output<string>;
  public readonly secondaryAlbSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Primary Region VPC (us-east-1)
    const primaryProvider = new aws.Provider(
      `primary-provider-${environmentSuffix}`,
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    const primaryVpc = new aws.ec2.Vpc(
      `primary-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `primary-vpc-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary Internet Gateway
    const primaryIgw = new aws.ec2.InternetGateway(
      `primary-igw-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          ...tags,
          Name: `primary-igw-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary Public Subnets (3 AZs)
    const primaryPublicSubnets = ['a', 'b', 'c'].map(
      (az, idx) =>
        new aws.ec2.Subnet(
          `primary-public-subnet-${az}-${environmentSuffix}`,
          {
            vpcId: primaryVpc.id,
            cidrBlock: `10.0.${idx + 101}.0/24`,
            availabilityZone: `${primaryRegion}${az}`,
            mapPublicIpOnLaunch: true,
            tags: {
              ...tags,
              Name: `primary-public-subnet-${az}-${environmentSuffix}`,
              EnvironmentSuffix: environmentSuffix,
            },
          },
          { parent: this, provider: primaryProvider }
        )
    );

    // Primary Public Route Table
    const primaryPublicRouteTable = new aws.ec2.RouteTable(
      `primary-public-rt-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          ...tags,
          Name: `primary-public-rt-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary Public Route to Internet Gateway
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _primaryPublicRoute = new aws.ec2.Route(
      `primary-public-route-${environmentSuffix}`,
      {
        routeTableId: primaryPublicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: primaryIgw.id,
      },
      { parent: this, provider: primaryProvider }
    );

    // Associate Public Subnets with Public Route Table
    primaryPublicSubnets.forEach((subnet, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _rta = new aws.ec2.RouteTableAssociation(
        `primary-public-rta-${['a', 'b', 'c'][idx]}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: primaryPublicRouteTable.id,
        },
        { parent: this, provider: primaryProvider }
      );
    });

    // Primary Private Subnets (3 AZs)
    const primarySubnets = ['a', 'b', 'c'].map(
      (az, idx) =>
        new aws.ec2.Subnet(
          `primary-private-subnet-${az}-${environmentSuffix}`,
          {
            vpcId: primaryVpc.id,
            cidrBlock: `10.0.${idx + 1}.0/24`,
            availabilityZone: `${primaryRegion}${az}`,
            tags: {
              ...tags,
              Name: `primary-private-subnet-${az}-${environmentSuffix}`,
              EnvironmentSuffix: environmentSuffix,
            },
          },
          { parent: this, provider: primaryProvider }
        )
    );

    // Secondary Region VPC (us-west-2)
    const secondaryProvider = new aws.Provider(
      `secondary-provider-${environmentSuffix}`,
      {
        region: secondaryRegion,
      },
      { parent: this }
    );

    const secondaryVpc = new aws.ec2.Vpc(
      `secondary-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `secondary-vpc-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Secondary Internet Gateway
    const secondaryIgw = new aws.ec2.InternetGateway(
      `secondary-igw-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        tags: {
          ...tags,
          Name: `secondary-igw-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Secondary Public Subnets (3 AZs)
    const secondaryPublicSubnets = ['a', 'b', 'c'].map(
      (az, idx) =>
        new aws.ec2.Subnet(
          `secondary-public-subnet-${az}-${environmentSuffix}`,
          {
            vpcId: secondaryVpc.id,
            cidrBlock: `10.1.${idx + 101}.0/24`,
            availabilityZone: `${secondaryRegion}${az}`,
            mapPublicIpOnLaunch: true,
            tags: {
              ...tags,
              Name: `secondary-public-subnet-${az}-${environmentSuffix}`,
              EnvironmentSuffix: environmentSuffix,
            },
          },
          { parent: this, provider: secondaryProvider }
        )
    );

    // Secondary Public Route Table
    const secondaryPublicRouteTable = new aws.ec2.RouteTable(
      `secondary-public-rt-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        tags: {
          ...tags,
          Name: `secondary-public-rt-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Secondary Public Route to Internet Gateway
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _secondaryPublicRoute = new aws.ec2.Route(
      `secondary-public-route-${environmentSuffix}`,
      {
        routeTableId: secondaryPublicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: secondaryIgw.id,
      },
      { parent: this, provider: secondaryProvider }
    );

    // Associate Public Subnets with Public Route Table
    secondaryPublicSubnets.forEach((subnet, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _rta = new aws.ec2.RouteTableAssociation(
        `secondary-public-rta-${['a', 'b', 'c'][idx]}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: secondaryPublicRouteTable.id,
        },
        { parent: this, provider: secondaryProvider }
      );
    });

    // Secondary Private Subnets (3 AZs)
    const secondarySubnets = ['a', 'b', 'c'].map(
      (az, idx) =>
        new aws.ec2.Subnet(
          `secondary-private-subnet-${az}-${environmentSuffix}`,
          {
            vpcId: secondaryVpc.id,
            cidrBlock: `10.1.${idx + 1}.0/24`,
            availabilityZone: `${secondaryRegion}${az}`,
            tags: {
              ...tags,
              Name: `secondary-private-subnet-${az}-${environmentSuffix}`,
              EnvironmentSuffix: environmentSuffix,
            },
          },
          { parent: this, provider: secondaryProvider }
        )
    );

    // VPC Peering Connection
    const vpcPeering = new aws.ec2.VpcPeeringConnection(
      `vpc-peering-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        peerVpcId: secondaryVpc.id,
        peerRegion: secondaryRegion,
        autoAccept: false,
        tags: {
          ...tags,
          Name: `vpc-peering-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Accept peering connection in secondary region
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _peeringAccepter = new aws.ec2.VpcPeeringConnectionAccepter(
      `vpc-peering-accepter-${environmentSuffix}`,
      {
        vpcPeeringConnectionId: vpcPeering.id,
        autoAccept: true,
        tags: {
          ...tags,
          Name: `vpc-peering-accepter-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Primary Security Groups
    const primaryDbSg = new aws.ec2.SecurityGroup(
      `primary-db-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `primary-db-sg-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const primaryAlbSg = new aws.ec2.SecurityGroup(
      `primary-alb-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `primary-alb-sg-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Secondary Security Groups
    const secondaryDbSg = new aws.ec2.SecurityGroup(
      `secondary-db-sg-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for secondary Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `secondary-db-sg-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    const secondaryAlbSg = new aws.ec2.SecurityGroup(
      `secondary-alb-sg-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for secondary ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `secondary-alb-sg-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Outputs
    this.primaryVpcId = primaryVpc.id;
    this.secondaryVpcId = secondaryVpc.id;
    this.primaryPrivateSubnetIds = pulumi.output(primarySubnets.map(s => s.id));
    this.secondaryPrivateSubnetIds = pulumi.output(
      secondarySubnets.map(s => s.id)
    );
    this.primaryPublicSubnetIds = pulumi.output(
      primaryPublicSubnets.map(s => s.id)
    );
    this.secondaryPublicSubnetIds = pulumi.output(
      secondaryPublicSubnets.map(s => s.id)
    );
    this.primaryDbSecurityGroupId = primaryDbSg.id;
    this.secondaryDbSecurityGroupId = secondaryDbSg.id;
    this.primaryAlbSecurityGroupId = primaryAlbSg.id;
    this.secondaryAlbSecurityGroupId = secondaryAlbSg.id;

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      secondaryVpcId: this.secondaryVpcId,
      primaryPrivateSubnetIds: this.primaryPrivateSubnetIds,
      secondaryPrivateSubnetIds: this.secondaryPrivateSubnetIds,
      primaryPublicSubnetIds: this.primaryPublicSubnetIds,
      secondaryPublicSubnetIds: this.secondaryPublicSubnetIds,
    });
  }
}
