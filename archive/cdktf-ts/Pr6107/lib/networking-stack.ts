import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

export interface NetworkingStackProps {
  environmentSuffix: string;
  region: string;
  provider?: AwsProvider;
}

export interface NetworkingStackOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  databaseSubnetIds: string[];
}

export class NetworkingStack extends Construct {
  public readonly outputs: NetworkingStackOutputs;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const { environmentSuffix, region, provider } = props;
    const drRole = region === 'us-east-1' ? 'primary' : 'dr';

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': drRole,
      ManagedBy: 'cdktf',
    };

    // VPC
    const vpc = new Vpc(this, `vpc-${region}`, {
      cidrBlock: region === 'us-east-1' ? '10.0.0.0/16' : '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}-${region}`,
        ...commonTags,
      },
      provider: provider,
    });

    // Internet Gateway
    const igw = new InternetGateway(this, `igw-${region}`, {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}-${region}`,
        ...commonTags,
      },
      provider: provider,
    });

    // Availability Zones
    const azs = ['a', 'b', 'c'];
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const databaseSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    // Create subnets in each AZ
    azs.forEach((az, index) => {
      const azName = `${region}${az}`;

      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${region}-${az}`, {
        vpcId: vpc.id,
        cidrBlock:
          region === 'us-east-1'
            ? `10.0.${index * 16}.0/20`
            : `10.1.${index * 16}.0/20`,
        availabilityZone: azName,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-${environmentSuffix}-${region}-${az}`,
          Type: 'public',
          ...commonTags,
        },
        provider: provider,
      });
      publicSubnets.push(publicSubnet);

      // Private subnet for compute
      const privateSubnet = new Subnet(this, `private-subnet-${region}-${az}`, {
        vpcId: vpc.id,
        cidrBlock:
          region === 'us-east-1'
            ? `10.0.${index * 16 + 48}.0/20`
            : `10.1.${index * 16 + 48}.0/20`,
        availabilityZone: azName,
        tags: {
          Name: `payment-private-${environmentSuffix}-${region}-${az}`,
          Type: 'private',
          ...commonTags,
        },
        provider: provider,
      });
      privateSubnets.push(privateSubnet);

      // Database subnet
      const dbSubnet = new Subnet(this, `db-subnet-${region}-${az}`, {
        vpcId: vpc.id,
        cidrBlock:
          region === 'us-east-1'
            ? `10.0.${index * 16 + 96}.0/20`
            : `10.1.${index * 16 + 96}.0/20`,
        availabilityZone: azName,
        tags: {
          Name: `payment-db-${environmentSuffix}-${region}-${az}`,
          Type: 'database',
          ...commonTags,
        },
        provider: provider,
      });
      databaseSubnets.push(dbSubnet);

      // NAT Gateway (one per AZ for high availability)
      const eip = new Eip(this, `nat-eip-${region}-${az}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${environmentSuffix}-${region}-${az}`,
          ...commonTags,
        },
        provider: provider,
      });

      const natGateway = new NatGateway(this, `nat-${region}-${az}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `payment-nat-${environmentSuffix}-${region}-${az}`,
          ...commonTags,
        },
        provider: provider,
        dependsOn: [igw],
      });
      natGateways.push(natGateway);
    });

    // Public route table
    const publicRouteTable = new RouteTable(this, `public-rt-${region}`, {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}-${region}`,
        ...commonTags,
      },
      provider: provider,
    });

    new Route(this, `public-route-${region}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
      provider: provider,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${region}-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
        provider: provider,
      });
    });

    // Private route tables (one per AZ for NAT Gateway)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-rt-${region}-${index}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `payment-private-rt-${environmentSuffix}-${region}-${azs[index]}`,
            ...commonTags,
          },
          provider: provider,
        }
      );

      new Route(this, `private-route-${region}-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
        provider: provider,
      });

      new RouteTableAssociation(this, `private-rta-${region}-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
        provider: provider,
      });
    });

    // Database route tables
    databaseSubnets.forEach((subnet, index) => {
      const dbRouteTable = new RouteTable(this, `db-rt-${region}-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `payment-db-rt-${environmentSuffix}-${region}-${azs[index]}`,
          ...commonTags,
        },
        provider: provider,
      });

      new Route(this, `db-route-${region}-${index}`, {
        routeTableId: dbRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
        provider: provider,
      });

      new RouteTableAssociation(this, `db-rta-${region}-${index}`, {
        subnetId: subnet.id,
        routeTableId: dbRouteTable.id,
        provider: provider,
      });
    });

    this.outputs = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map(s => s.id),
      privateSubnetIds: privateSubnets.map(s => s.id),
      databaseSubnetIds: databaseSubnets.map(s => s.id),
    };
  }
}
