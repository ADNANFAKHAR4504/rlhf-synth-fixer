import { Construct } from 'constructs';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';

// =============================================================
// Network Module - now handles 2 public & 2 private subnets in different AZs
// =============================================================
export interface NetworkModuleProps {
  readonly cidrBlock: string;
  readonly publicSubnetCidrs: string[];
  readonly privateSubnetCidrs: string[];
  readonly availabilityZones: string[];
  readonly tags?: { [key: string]: string };
}

export class NetworkModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    const tags = { Environment: 'Production', ...props.tags };

    // Create VPC
    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: props.cidrBlock,
      tags,
    });
    this.vpcId = vpc.id;

    // Internet Gateway for Public Subnets
    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags,
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags,
    });

    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Create Public Subnets first
    this.publicSubnetIds = props.publicSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `PublicSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags,
      });

      new RouteTableAssociation(this, `PublicRTA${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });

      return subnet.id;
    });

    // Elastic IP for NAT Gateway
    const eip = new Eip(this, 'NatEip', {
      domain: 'vpc',
      tags,
    });

    // FIX: Create NAT Gateway after the public subnets exist.
    // This allows us to directly assign the subnetId from the created subnets,
    // removing the need for the 'any' type assertion.
    const natGateway = new NatGateway(this, 'NatGateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnetIds[0], // Assign directly
      tags,
      dependsOn: [igw],
    });

    // Private Route Table
    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.id,
      tags,
    });

    new Route(this, 'PrivateRoute', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Create Private Subnets
    this.privateSubnetIds = props.privateSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `PrivateSubnet${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        tags,
      });

      new RouteTableAssociation(this, `PrivateRTA${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });

      return subnet.id;
    });
  }
}

// =============================================================
// Security Module - updated SSH rule & added HTTPS rule
// =============================================================
export interface SecurityModuleProps {
  readonly vpcId: string;
  readonly tags?: { [key: string]: string };
}

export class SecurityModule extends Construct {
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    const tags = { Environment: 'Production', ...props.tags };

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpcId: props.vpcId,
      description: 'Allow SSH, HTTP, and HTTPS inbound traffic',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ['203.0.113.0/24'], // restricted SSH
          description: 'Allow SSH from trusted CIDR only',
        },
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags,
    });
    this.securityGroupId = securityGroup.id;
  }
}

// =============================================================
// Compute Module
// =============================================================
export interface ComputeModuleProps {
  readonly vpcId: string;
  readonly publicSubnetIds: string[];
  readonly securityGroupId: string;
  readonly sshKeyName: string;
  readonly tags?: { [key: string]: string };
}

export class ComputeModule extends Construct {
  public readonly instanceId: string;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    const tags = { Environment: 'Production', ...props.tags };

    const instance = new Instance(this, 'EC2Instance', {
      ami: 'ami-04e08e36e17a21b56',
      instanceType: 't2.micro',
      subnetId: props.publicSubnetIds[0],
      vpcSecurityGroupIds: [props.securityGroupId],
      keyName: props.sshKeyName,
      tags,
    });
    this.instanceId = instance.id;
  }
}
