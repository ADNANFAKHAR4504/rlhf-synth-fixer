import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';

interface VpcStackProps {
  environmentSuffix: string;
  environment: string;
  vpcCidr: string;
  availabilityZones: string[];
}

export class VpcStack extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id);

    const { environmentSuffix, environment, vpcCidr, availabilityZones } =
      props;

    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Create public subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    availabilityZones.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: this.calculateSubnetCidr(vpcCidr, index * 2),
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-${index + 1}-${environment}-${environmentSuffix}`,
          Environment: environment,
          Type: 'public',
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: this.calculateSubnetCidr(vpcCidr, index * 2 + 1),
        availabilityZone: az,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-private-subnet-${index + 1}-${environment}-${environmentSuffix}`,
          Environment: environment,
          Type: 'private',
        },
      });
      privateSubnets.push(privateSubnet);
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Add route to internet gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create NAT Gateway (one per AZ for HA)
    const natGateways: NatGateway[] = [];
    const privateRouteTables: RouteTable[] = [];

    publicSubnets.forEach((subnet, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${index + 1}-${environment}-${environmentSuffix}`,
          Environment: environment,
        },
      });

      const natGateway = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          Name: `payment-nat-${index + 1}-${environment}-${environmentSuffix}`,
          Environment: environment,
        },
      });
      natGateways.push(natGateway);
    });

    // Create private route tables (one per AZ)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `payment-private-rt-${index + 1}-${environment}-${environmentSuffix}`,
          Environment: environment,
        },
      });
      privateRouteTables.push(privateRouteTable);

      // Add route to NAT gateway
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Create VPC Endpoint for S3
    new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: 'com.amazonaws.ap-southeast-2.s3',
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateRouteTables.map(rt => rt.id),
      ],
      tags: {
        Name: `payment-s3-endpoint-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    // Simple CIDR calculation: split /16 into /24 subnets
    const baseIp = vpcCidr.split('/')[0];
    const octets = baseIp.split('.');
    octets[2] = String(subnetIndex);
    return `${octets.join('.')}/24`;
  }
}
