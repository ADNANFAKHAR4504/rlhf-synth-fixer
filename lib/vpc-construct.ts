import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

export interface VpcConstructProps {
  environment: string;
  region: string;
  vpcCidr: string;
  azs: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
  commonTags: { [key: string]: string };
}

export class VpcConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnets: string[];
  public readonly privateSubnets: string[];
  public readonly databaseSubnets: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];

  constructor(scope: Construct, id: string, config: VpcConstructProps) {
    super(scope, id);

    new aws.provider.AwsProvider(this, 'aws', {
      region: config.region,
    });

    new aws.dataAwsRegion.DataAwsRegion(this, 'current');

    const mainVpc = new aws.vpc.Vpc(this, 'MainVpc', {
      cidrBlock: config.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-vpc`,
      },
    });

    const igw = new aws.internetGateway.InternetGateway(this, 'IGW', {
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-igw`,
      },
    });

    const publicSubnets = config.publicSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `PublicSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-public-subnet-${i + 1}`,
          },
        })
    );

    const privateSubnets = config.privateSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `PrivateSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-private-subnet-${i + 1}`,
          },
        })
    );

    const databaseSubnets = config.databaseSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `DatabaseSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-database-subnet-${i + 1}`,
          },
        })
    );

    const eips = privateSubnets.map(
      (_, i) =>
        new aws.eip.Eip(this, `NatEip${i}`, {
          domain: 'vpc',
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-eip-${i + 1}`,
          },
        })
    );

    const natGateways = privateSubnets.map(
      (_, i) =>
        new aws.natGateway.NatGateway(this, `NatGateway${i}`, {
          allocationId: eips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-gateway-${i + 1}`,
          },
        })
    );

    // Output props for wiring
    this.vpcId = mainVpc.id;
    this.publicSubnets = publicSubnets.map(s => s.id);
    this.privateSubnets = privateSubnets.map(s => s.id);
    this.databaseSubnets = databaseSubnets.map(s => s.id);
    this.internetGatewayId = igw.id;
    this.natGatewayIds = natGateways.map(n => n.id);
  }
}
