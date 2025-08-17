import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '../.gen/providers/aws/vpc';
import { Subnet } from '../.gen/providers/aws/subnet';
import { InternetGateway } from '../.gen/providers/aws/internet-gateway';
import { NatGateway } from '../.gen/providers/aws/nat-gateway';
import { Eip } from '../.gen/providers/aws/eip';
import { RouteTable } from '../.gen/providers/aws/route-table';
import { Route } from '../.gen/providers/aws/route';
import { RouteTableAssociation } from '../.gen/providers/aws/route-table-association';
// Use 'any' for resource property types
import { Construct } from 'constructs';

interface VpcConstructProps {
  prefix: string;
  regions: string[];
}

export class VpcConstruct extends Construct {
  public readonly vpcs: Record<string, any> = {};
  public readonly publicSubnets: Record<string, any[]> = {};
  public readonly privateSubnets: Record<string, any[]> = {};
  public readonly providers: Record<string, any> = {};

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    props.regions.forEach((region, idx) => {
  const providerInstance = new AwsProvider(this, `${props.prefix}-provider-${region}`, {
        region,
        alias: region,
      });
      this.providers[region] = providerInstance;
  const cidrBlock = idx === 0 ? '10.0.0.0/16' : '10.1.0.0/16';
  const vpcInstance = new Vpc(this, `${props.prefix}-vpc-${region}`, {
        provider: providerInstance,
        cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${props.prefix}-vpc-${region}`,
          Environment: props.prefix,
        },
      });
      this.vpcs[region] = vpcInstance;
  // All resources imported at top-level
      // Public Subnets
  const publicSubnet1 = new Subnet(this, `${props.prefix}-public-subnet-1-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        cidrBlock: idx === 0 ? '10.0.1.0/24' : '10.1.1.0/24',
        availabilityZone: `${region}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.prefix}-public-subnet-1-${region}`,
          Environment: props.prefix,
        },
      });
  const publicSubnet2 = new Subnet(this, `${props.prefix}-public-subnet-2-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        cidrBlock: idx === 0 ? '10.0.2.0/24' : '10.1.2.0/24',
        availabilityZone: `${region}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.prefix}-public-subnet-2-${region}`,
          Environment: props.prefix,
        },
      });
  this.publicSubnets[region] = [publicSubnet1, publicSubnet2];
      // Private Subnets
  const privateSubnet1 = new Subnet(this, `${props.prefix}-private-subnet-1-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        cidrBlock: idx === 0 ? '10.0.3.0/24' : '10.1.3.0/24',
        availabilityZone: `${region}a`,
        tags: {
          Name: `${props.prefix}-private-subnet-1-${region}`,
          Environment: props.prefix,
        },
      });
  const privateSubnet2 = new Subnet(this, `${props.prefix}-private-subnet-2-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        cidrBlock: idx === 0 ? '10.0.4.0/24' : '10.1.4.0/24',
        availabilityZone: `${region}b`,
        tags: {
          Name: `${props.prefix}-private-subnet-2-${region}`,
          Environment: props.prefix,
        },
      });
      this.privateSubnets[region] = [privateSubnet1, privateSubnet2];
      // Internet Gateway
  const igw = new InternetGateway(this, `${props.prefix}-igw-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        tags: {
          Name: `${props.prefix}-igw-${region}`,
          Environment: props.prefix,
        },
      });
      // Elastic IPs for NAT Gateways
    const natEip1 = new Eip(this, `${props.prefix}-nat-eip-1-${region}`, {
        provider: providerInstance,
  domain: 'vpc',
        tags: {
          Name: `${props.prefix}-nat-eip-1-${region}`,
          Environment: props.prefix,
        },
      });
    const natEip2 = new Eip(this, `${props.prefix}-nat-eip-2-${region}`, {
        provider: providerInstance,
        domain: "vpc",
        tags: {
          Name: `${props.prefix}-nat-eip-2-${region}`,
          Environment: props.prefix,
        },
      });
      // NAT Gateways
    const natGw1 = new NatGateway(this, `${props.prefix}-nat-gw-1-${region}`, {
        provider: providerInstance,
        allocationId: natEip1.id,
        subnetId: publicSubnet1.id,
        tags: {
          Name: `${props.prefix}-nat-gw-1-${region}`,
          Environment: props.prefix,
        },
      });
    const natGw2 = new NatGateway(this, `${props.prefix}-nat-gw-2-${region}`, {
        provider: providerInstance,
        allocationId: natEip2.id,
        subnetId: publicSubnet2.id,
        tags: {
          Name: `${props.prefix}-nat-gw-2-${region}`,
          Environment: props.prefix,
        },
      });
      // Route Tables
  const publicRouteTable = new RouteTable(this, `${props.prefix}-public-rt-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        tags: {
          Name: `${props.prefix}-public-rt-${region}`,
          Environment: props.prefix,
        },
      });
  const privateRouteTable1 = new RouteTable(this, `${props.prefix}-private-rt-1-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        tags: {
          Name: `${props.prefix}-private-rt-1-${region}`,
          Environment: props.prefix,
        },
      });
  const privateRouteTable2 = new RouteTable(this, `${props.prefix}-private-rt-2-${region}`, {
        provider: providerInstance,
        vpcId: vpcInstance.id,
        tags: {
          Name: `${props.prefix}-private-rt-2-${region}`,
          Environment: props.prefix,
        },
      });
      // Routes
    new Route(this, `${props.prefix}-public-route-${region}`, {
        provider: providerInstance,
        routeTableId: publicRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      });
    new Route(this, `${props.prefix}-private-route-1-${region}`, {
        provider: providerInstance,
        routeTableId: privateRouteTable1.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGw1.id,
      });
    new Route(this, `${props.prefix}-private-route-2-${region}`, {
        provider: providerInstance,
        routeTableId: privateRouteTable2.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGw2.id,
      });
      // Route Table Associations
    new RouteTableAssociation(this, `${props.prefix}-public-rta-1-${region}`, {
        provider: providerInstance,
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      });
    new RouteTableAssociation(this, `${props.prefix}-public-rta-2-${region}`, {
        provider: providerInstance,
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      });
    new RouteTableAssociation(this, `${props.prefix}-private-rta-1-${region}`, {
        provider: providerInstance,
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable1.id,
      });
    new RouteTableAssociation(this, `${props.prefix}-private-rta-2-${region}`, {
        provider: providerInstance,
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable2.id,
      });
    });
  }
}
