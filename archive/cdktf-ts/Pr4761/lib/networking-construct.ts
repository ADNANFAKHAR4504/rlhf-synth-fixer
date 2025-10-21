import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {
  environmentSuffix: string;
  vpcCidr?: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly availabilityZones: string[];

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcCidr = '10.0.0.0/16' } = props;

    // Get available AZs in the region
    const azs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
    });

    this.availabilityZones = [
      `\${${azs.fqn}.names[0]}`,
      `\${${azs.fqn}.names[1]}`,
    ];

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create public subnets in 2 AZs
    this.publicSubnets = [];
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24'];

    publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: this.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'Public',
        },
        dependsOn: [this.vpc],
      });
      this.publicSubnets.push(subnet);
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Add route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create NAT Gateway in first public subnet for private subnet internet access
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `payment-nat-eip-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [igw],
    });

    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `payment-nat-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [natEip, igw, this.publicSubnets[0]],
    });

    // Create private subnets in 2 AZs
    this.privateSubnets = [];
    const privateSubnetCidrs = ['10.0.11.0/24', '10.0.12.0/24'];

    privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: this.availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-private-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'Private',
        },
        dependsOn: [this.vpc],
      });
      this.privateSubnets.push(subnet);
    });

    // Create private route table
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `payment-private-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Add route to NAT Gateway
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}
