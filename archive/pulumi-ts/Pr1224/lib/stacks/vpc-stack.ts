import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly internetGatewayId: pulumi.Output<string>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const vpcCidr = args.vpcCidr || '10.0.0.0/16';
    const tags = args.tags || {};

    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { Name: `tap-vpc-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    const igw = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { Name: `tap-igw-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    const publicRt = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { Name: `tap-public-rt-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `tap-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    const azs = aws.getAvailabilityZonesOutput({ state: 'available' });

    const { publicIds, privateIds } = azs.names.apply(names => {
      const use = names.slice(0, Math.min(names.length, 3));
      const publicSubnetIds: pulumi.Output<string>[] = [];
      const privateSubnetIds: pulumi.Output<string>[] = [];

      use.forEach((az, i) => {
        const pub = new aws.ec2.Subnet(
          `tap-public-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i * 2 + 1}.0/24`,
            availabilityZone: az,
            mapPublicIpOnLaunch: false,
            tags: {
              Name: `tap-public-subnet-${i}-${environmentSuffix}`,
              Type: 'public',
              ...tags,
            },
          },
          { parent: this }
        );

        publicSubnetIds.push(pub.id);

        new aws.ec2.RouteTableAssociation(
          `tap-public-rta-${i}-${environmentSuffix}`,
          {
            subnetId: pub.id,
            routeTableId: publicRt.id,
          },
          { parent: this }
        );

        const priv = new aws.ec2.Subnet(
          `tap-private-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i * 2 + 2}.0/24`,
            availabilityZone: az,
            tags: {
              Name: `tap-private-subnet-${i}-${environmentSuffix}`,
              Type: 'private',
              ...tags,
            },
          },
          { parent: this }
        );

        privateSubnetIds.push(priv.id);

        const eip = new aws.ec2.Eip(
          `tap-nat-eip-${i}-${environmentSuffix}`,
          {
            domain: 'vpc',
            tags: { Name: `tap-nat-eip-${i}-${environmentSuffix}`, ...tags },
          },
          { parent: this }
        );

        const nat = new aws.ec2.NatGateway(
          `tap-nat-${i}-${environmentSuffix}`,
          {
            allocationId: eip.id,
            subnetId: pub.id,
            tags: { Name: `tap-nat-${i}-${environmentSuffix}`, ...tags },
          },
          { parent: this }
        );

        const privateRt = new aws.ec2.RouteTable(
          `tap-private-rt-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            tags: { Name: `tap-private-rt-${i}-${environmentSuffix}`, ...tags },
          },
          { parent: this }
        );

        new aws.ec2.Route(
          `tap-private-route-${i}-${environmentSuffix}`,
          {
            routeTableId: privateRt.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: nat.id,
          },
          { parent: this }
        );

        new aws.ec2.RouteTableAssociation(
          `tap-private-rta-${i}-${environmentSuffix}`,
          {
            subnetId: priv.id,
            routeTableId: privateRt.id,
          },
          { parent: this }
        );
      });

      return {
        publicIds: pulumi.all(publicSubnetIds),
        privateIds: pulumi.all(privateSubnetIds),
      };
    });

    this.vpcId = vpc.id;
    this.internetGatewayId = igw.id;
    this.publicSubnetIds = publicIds;
    this.privateSubnetIds = privateIds;

    this.registerOutputs({
      vpcId: this.vpcId,
      internetGatewayId: this.internetGatewayId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
