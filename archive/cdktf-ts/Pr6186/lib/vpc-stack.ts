import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

interface VpcStackProps {
  environmentSuffix: string;
  region: string;
}

export class VpcStack extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnetIds: string[];
  public readonly publicSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Get available AZs
    const azs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
    });

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `eks-vpc-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `eks-igw-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Public Subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      // Public Subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `eks-public-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
          'kubernetes.io/role/elb': '1',
        },
      });
      publicSubnets.push(publicSubnet);

      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `eks-nat-eip-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
        },
      });

      // NAT Gateway
      const natGw = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `eks-nat-gateway-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
        },
        dependsOn: [igw],
      });
      natGateways.push(natGw);

      // Private Subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `eks-private-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
          'kubernetes.io/role/internal-elb': '1',
        },
      });
      privateSubnets.push(privateSubnet);
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `eks-public-rt-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `eks-private-rt-${i}-${environmentSuffix}`,
            Environment: 'production',
            Team: 'platform',
            CostCenter: 'engineering',
          },
        }
      );

      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
  }
}
