// lib/secure-vpc.ts
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { name } from './utils/naming';

export interface SecureVpcProps {
  provider: AwsProvider;
  environment: string;
  region: string;

  /** CIDR like 10.0.0.0/16 */
  vpcCidr: string;

  /** Number of AZs/subnet pairs to create (1–3 recommended). Default 2. */
  azCount?: number;

  /** true = NAT per AZ; false = single NAT in first public subnet. */
  natPerAz?: boolean;
}

/**
 * SecureVpc creates:
 * - VPC with DNS support
 * - IGW
 * - Public + Private subnets across N AZs
 * - NAT per AZ (toggle) or single NAT
 * - Public route table, Private route tables + associations
 *
 * All AZ references use Fn.element() to avoid token indexing issues.
 */
export class SecureVpc extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];

  constructor(scope: Construct, id: string, props: SecureVpcProps) {
    super(scope, id);

    const env = props.environment;
    const region = props.region;
    const azCount = props.azCount ?? 2;
    const natPerAz = props.natPerAz ?? env === 'prod';

    // Available AZs in this region
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
      provider: props.provider,
    });

    // Core VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      provider: props.provider,
      tags: {
        Name: name(env, 'vpc', region),
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      provider: props.provider,
      tags: { Name: name(env, 'igw', region) },
    });

    // Public Route Table (one)
    const publicRt = new RouteTable(this, 'publicRt', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      provider: props.provider,
      tags: { Name: name(env, 'public-rt', region) },
    });

    // Subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < azCount; i++) {
      // Public subnet i
      const pub = new Subnet(this, `public-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(props.vpcCidr, 8, i),
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        provider: props.provider,
        tags: {
          Name: name(env, 'public-subnet', region, i),
          Type: 'Public',
        },
      });
      publicSubnets.push(pub);

      // Private subnet i (offset by 10 in cidrsubnet)
      const priv = new Subnet(this, `private-${i}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(props.vpcCidr, 8, i + 10),
        availabilityZone: Fn.element(azs.names, i),
        provider: props.provider,
        tags: {
          Name: name(env, 'private-subnet', region, i),
          Type: 'Private',
        },
      });
      privateSubnets.push(priv);

      // Associate public subnet to public route table
      new RouteTableAssociation(this, `pub-assoc-${i}`, {
        subnetId: pub.id,
        routeTableId: publicRt.id,
        provider: props.provider,
      });
    }

    // NAT Gateways (per AZ or single)
    const eips: Eip[] = [];
    const nats: NatGateway[] = [];

    const natLoops = natPerAz ? azCount : 1;

    for (let i = 0; i < natLoops; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        provider: props.provider,
        tags: { Name: name(env, 'nat-eip', region, i) },
      });
      eips.push(eip);

      const nat = new NatGateway(this, `nat-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id, // place NAT in corresponding public subnet (or first one if single)
        provider: props.provider,
        tags: { Name: name(env, 'nat', region, i) },
        dependsOn: [igw], // ensure IGW exists first
      });
      nats.push(nat);
    }

    // Private route tables – one per AZ for clarity
    for (let i = 0; i < azCount; i++) {
      const natIndex = natPerAz ? i : 0;

      const privateRt = new RouteTable(this, `private-rt-${i}`, {
        vpcId: vpc.id,
        route: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: nats[natIndex].id,
          },
        ],
        provider: props.provider,
        tags: { Name: name(env, 'private-rt', region, i) },
      });

      new RouteTableAssociation(this, `priv-assoc-${i}`, {
        subnetId: privateSubnets[i].id,
        routeTableId: privateRt.id,
        provider: props.provider,
      });
    }

    // Expose properties
    this.vpcId = vpc.id;
    this.internetGatewayId = igw.id;
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);
    this.natGatewayIds = nats.map(n => n.id);

    // Optional helpful outputs (names are local to this construct scope)
    new TerraformOutput(this, 'vpc_id', { value: this.vpcId });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: this.publicSubnetIds,
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: this.privateSubnetIds,
    });
    new TerraformOutput(this, 'internet_gateway_id', {
      value: this.internetGatewayId,
    });
    new TerraformOutput(this, 'nat_gateway_ids', { value: this.natGatewayIds });
  }
}
