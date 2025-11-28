/**
 * networking.ts
 *
 * Component for importing networking resources via stack references
 * or creating standalone networking for CI/CD environments
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkingStackArgs {
  stackReference: string;
  /**
   * If true, create standalone networking resources instead of using stack reference.
   * Useful for CI/CD testing when the referenced stack doesn't exist.
   */
  createStandalone?: boolean;
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

    const { stackReference, createStandalone } = args;

    // For CI/CD or testing, create standalone networking resources
    if (createStandalone) {
      const azs = ['us-east-1a', 'us-east-1b'];

      // Create VPC
      const vpc = new aws.ec2.Vpc(
        `${name}-vpc`,
        {
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: { Name: `${name}-vpc` },
        },
        { parent: this }
      );

      // Create Internet Gateway
      const igw = new aws.ec2.InternetGateway(
        `${name}-igw`,
        {
          vpcId: vpc.id,
          tags: { Name: `${name}-igw` },
        },
        { parent: this }
      );

      // Create private subnets
      const privateSubnets = azs.map(
        (az, index) =>
          new aws.ec2.Subnet(
            `${name}-private-${index}`,
            {
              vpcId: vpc.id,
              cidrBlock: `10.0.${index + 1}.0/24`,
              availabilityZone: az,
              mapPublicIpOnLaunch: false,
              tags: { Name: `${name}-private-${az}` },
            },
            { parent: this }
          )
      );

      // Create public subnets
      const publicSubnets = azs.map(
        (az, index) =>
          new aws.ec2.Subnet(
            `${name}-public-${index}`,
            {
              vpcId: vpc.id,
              cidrBlock: `10.0.${index + 100}.0/24`,
              availabilityZone: az,
              mapPublicIpOnLaunch: true,
              tags: { Name: `${name}-public-${az}` },
            },
            { parent: this, dependsOn: [igw] }
          )
      );

      // Create NAT Gateway for private subnet internet access
      const eip = new aws.ec2.Eip(
        `${name}-nat-eip`,
        {
          domain: 'vpc',
          tags: { Name: `${name}-nat-eip` },
        },
        { parent: this }
      );

      const natGateway = new aws.ec2.NatGateway(
        `${name}-nat`,
        {
          allocationId: eip.id,
          subnetId: publicSubnets[0].id,
          tags: { Name: `${name}-nat` },
        },
        { parent: this, dependsOn: [igw] }
      );

      // Route table for private subnets
      const privateRouteTable = new aws.ec2.RouteTable(
        `${name}-private-rt`,
        {
          vpcId: vpc.id,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              natGatewayId: natGateway.id,
            },
          ],
          tags: { Name: `${name}-private-rt` },
        },
        { parent: this }
      );

      // Associate private subnets with route table
      privateSubnets.forEach((subnet, index) => {
        new aws.ec2.RouteTableAssociation(
          `${name}-private-rta-${index}`,
          {
            subnetId: subnet.id,
            routeTableId: privateRouteTable.id,
          },
          { parent: this }
        );
      });

      // Route table for public subnets
      const publicRouteTable = new aws.ec2.RouteTable(
        `${name}-public-rt`,
        {
          vpcId: vpc.id,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              gatewayId: igw.id,
            },
          ],
          tags: { Name: `${name}-public-rt` },
        },
        { parent: this }
      );

      // Associate public subnets with route table
      publicSubnets.forEach((subnet, index) => {
        new aws.ec2.RouteTableAssociation(
          `${name}-public-rta-${index}`,
          {
            subnetId: subnet.id,
            routeTableId: publicRouteTable.id,
          },
          { parent: this }
        );
      });

      this.vpcId = vpc.id;
      this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
      this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
      this.availabilityZones = pulumi.output(azs);
    } else {
      // Use stack reference to import networking from external stack
      const networkStack = new pulumi.StackReference(
        stackReference,
        {},
        { parent: this }
      );

      this.vpcId = networkStack.getOutput('vpcId') as pulumi.Output<string>;
      this.privateSubnetIds = networkStack.getOutput(
        'privateSubnetIds'
      ) as pulumi.Output<string[]>;
      this.publicSubnetIds = networkStack.getOutput(
        'publicSubnetIds'
      ) as pulumi.Output<string[]>;
      this.availabilityZones = networkStack.getOutput(
        'availabilityZones'
      ) as pulumi.Output<string[]>;
    }

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      availabilityZones: this.availabilityZones,
    });
  }
}
