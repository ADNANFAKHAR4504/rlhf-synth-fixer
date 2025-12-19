import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';

export interface VpcConstructProps {
  environmentSuffix: string;
  cidrBlock: string;
  availabilityZones: string[];
  tags?: Record<string, string>;
}

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      cidrBlock,
      availabilityZones,
      tags = {},
    } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create public and private subnets in each AZ
    this.publicSubnets = [];
    this.privateSubnets = [];

    availabilityZones.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: this.calculateSubnetCidr(cidrBlock, index * 2),
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index}-${environmentSuffix}`,
          Type: 'public',
          ...tags,
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: this.calculateSubnetCidr(cidrBlock, index * 2 + 1),
        availabilityZone: az,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `private-subnet-${index}-${environmentSuffix}`,
          Type: 'private',
          ...tags,
        },
      });
      this.privateSubnets.push(privateSubnet);
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `public-rt-${environmentSuffix}`,
        ...tags,
      },
    });

    // Add route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create route table for private subnets
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `private-rt-${environmentSuffix}`,
        ...tags,
      },
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    const [network] = vpcCidr.split('/');
    const [a, b] = network.split('.').map(Number);
    const newC = subnetIndex * 16;
    return `${a}.${b}.${newC}.0/20`;
  }
}
