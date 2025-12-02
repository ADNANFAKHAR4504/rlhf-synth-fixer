import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Construct } from 'constructs';

export interface VpcStackProps {
  environmentSuffix: string;
  region: string;
}

export class VpcStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet1: Subnet;
  public readonly publicSubnet2: Subnet;
  public readonly privateSubnet1: Subnet;
  public readonly privateSubnet2: Subnet;
  public readonly availabilityZones: string[];

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;
    this.availabilityZones = [`${region}a`, `${region}b`];

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `assessment-vpc-${environmentSuffix}`,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-igw-${environmentSuffix}`,
      },
    });

    // Create Public Subnets
    this.publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: this.availabilityZones[0],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `assessment-public-subnet-1-${environmentSuffix}`,
      },
    });

    this.publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: this.availabilityZones[1],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `assessment-public-subnet-2-${environmentSuffix}`,
      },
    });

    // Create Private Subnets
    this.privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: this.availabilityZones[0],
      tags: {
        Name: `assessment-private-subnet-1-${environmentSuffix}`,
      },
    });

    this.privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: this.availabilityZones[1],
      tags: {
        Name: `assessment-private-subnet-2-${environmentSuffix}`,
      },
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-public-rt-${environmentSuffix}`,
      },
    });

    // Add route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: this.publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: this.publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });
  }
}
