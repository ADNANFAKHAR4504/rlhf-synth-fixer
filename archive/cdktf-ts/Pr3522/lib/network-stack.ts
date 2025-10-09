import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

interface NetworkStackProps {
  vpcCidr: string;
  region: string;
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    this.vpc = new Vpc(this, `portfolio-vpc-${props.environmentSuffix}`, {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `portfolio-tracking-vpc-${props.environmentSuffix}`,
      },
    });

    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'portfolio-igw',
      },
    });

    this.publicSubnets = [];
    this.privateSubnets = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `172.32.${i * 2}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `portfolio-public-subnet-${i + 1}`,
          Type: 'public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `172.32.${i * 2 + 1}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        tags: {
          Name: `portfolio-private-subnet-${i + 1}`,
          Type: 'private',
        },
      });
      this.privateSubnets.push(privateSubnet);

      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `portfolio-nat-eip-${i + 1}`,
        },
      });

      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `portfolio-nat-gateway-${i + 1}`,
        },
      });
      natGateways.push(natGateway);
    }

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'portfolio-public-rt',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `portfolio-private-rt-${index + 1}`,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}
