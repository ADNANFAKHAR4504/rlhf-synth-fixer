import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

interface NetworkingProps {
  environment: string;
  region: string;
  tags: { [key: string]: string };
}

export class Networking extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly igw: InternetGateway;

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    this.vpc = new Vpc(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-vpc`,
      },
    });

    this.igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-igw`,
      },
    });

    // Multi-AZ subnets
    const { region } = props;
    const azs = [`${region}a`, `${region}b`]; // For us-west-2, this is us-west-2a, us-west-2b
    azs.forEach((az, i) => {
      const publicSubnet = new Subnet(this, `PublicSubnet${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...props.tags,
          Name: `${props.environment}-${props.region}-public-subnet-${az}`,
        },
      });
      this.publicSubnets.push(publicSubnet);

      const privateSubnet = new Subnet(this, `PrivateSubnet${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 2}.0/24`,
        availabilityZone: az,
        tags: {
          ...props.tags,
          Name: `${props.environment}-${props.region}-private-subnet-${az}`,
        },
      });
      this.privateSubnets.push(privateSubnet);

      // NAT Gateway for private subnet
      const eip = new Eip(this, `NatEip${i}`, {
        domain: 'vpc',
        tags: {
          ...props.tags,
          Name: `${props.environment}-${props.region}-nat-eip-${az}`,
        },
      });

      const natGateway = new NatGateway(this, `NatGateway${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...props.tags,
          Name: `${props.environment}-${props.region}-nat-gateway-${az}`,
        },
      });

      // Route tables
      const publicRt = new RouteTable(this, `PublicRT${i}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.tags,
          Name: `${props.environment}-${props.region}-public-rt-${az}`,
        },
      });

      new Route(this, `PublicRoute${i}`, {
        routeTableId: publicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.igw.id,
      });

      new RouteTableAssociation(this, `PublicRTAssoc${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRt.id,
      });

      const privateRt = new RouteTable(this, `PrivateRT${i}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.tags,
          Name: `${props.environment}-${props.region}-private-rt-${az}`,
        },
      });

      new Route(this, `PrivateRoute${i}`, {
        routeTableId: privateRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new RouteTableAssociation(this, `PrivateRTAssoc${i}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRt.id,
      });
    });
  }
}
