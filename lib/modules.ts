// modules.ts

import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

// Define the properties for the VpcModule
export interface VpcModuleProps {
  readonly vpcCidr: string;
  readonly availabilityZones: string[];
}

export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetId: string;
  public readonly privateSubnetId: string;
  // Expose the AZs used so the stack can reference them for outputs
  public readonly publicAz: string;
  public readonly privateAz: string;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);
    if (props.availabilityZones.length < 2) {
      throw new Error(
        `VpcModule requires at least 2 availability zones, but received ${props.availabilityZones.length}: ${props.availabilityZones.join(', ') || 'none'}`
      );
    }

    // Assign AZs to public properties for outputting later
    this.publicAz = props.availabilityZones[0];
    this.privateAz = props.availabilityZones[1];

    const vpc = new Vpc(this, 'MainVpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const internetGateway = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
    });

    // --- Public Subnet in first AZ ---
    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: this.publicAz,
      mapPublicIpOnLaunch: true,
      tags: { Name: 'PublicSubnet' },
    });

    // ... rest of the networking resources (no changes needed here) ...
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: { Name: 'PublicRouteTable' },
    });
    new Route(this, 'PublicInternetRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });
    new RouteTableAssociation(this, 'PublicSubnetRta', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });
    const natGatewayEip = new Eip(this, 'NatGatewayEip', { domain: 'vpc' });
    const natGateway = new NatGateway(this, 'NatGateway', {
      allocationId: natGatewayEip.id,
      subnetId: publicSubnet.id,
      dependsOn: [internetGateway],
      tags: { Name: 'NatGateway' },
    });
    const privateSubnet = new Subnet(this, 'PrivateSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: this.privateAz,
      tags: { Name: 'PrivateSubnet' },
    });
    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.id,
      tags: { Name: 'PrivateRouteTable' },
    });
    new Route(this, 'PrivateNatRoute', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });
    new RouteTableAssociation(this, 'PrivateSubnetRta', {
      subnetId: privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // Expose only the necessary IDs
    this.vpcId = vpc.id;
    this.publicSubnetId = publicSubnet.id;
    this.privateSubnetId = privateSubnet.id;
  }
}
