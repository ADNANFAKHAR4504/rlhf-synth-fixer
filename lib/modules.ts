// lib/modules.ts
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// VPC Module
export interface VpcConfig {
  cidrBlock: string;
  tags: { [key: string]: string };
}

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${id}-vpc`,
      },
    });
  }
}

// Network Module (Subnets, IGW, NAT Gateways, Route Tables)
export interface NetworkConfig {
  vpcId: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  tags: { [key: string]: string };
}

export class NetworkConstruct extends Construct {
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly natGateways: NatGateway[] = [];

  constructor(scope: Construct, id: string, config: NetworkConfig) {
    super(scope, id);

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${id}-igw`,
      },
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${id}-public-rt`,
      },
    });

    // Public Route to Internet
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Create Public Subnets
    for (let i = 0; i < config.publicSubnetCidrs.length; i++) {
      const subnet = new Subnet(this, `public-subnet-${i + 1}`, {
        vpcId: config.vpcId,
        cidrBlock: config.publicSubnetCidrs[i],
        availabilityZone: config.availabilityZones[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${id}-public-subnet-${i + 1}`,
          'kubernetes.io/role/elb': '1',
        },
      });

      new RouteTableAssociation(this, `public-rt-assoc-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });

      this.publicSubnets.push(subnet);
    }

    // Create Private Subnets with NAT Gateways
    for (let i = 0; i < config.privateSubnetCidrs.length; i++) {
      // EIP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${i + 1}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${id}-nat-eip-${i + 1}`,
        },
      });

      // NAT Gateway in public subnet
      const natGw = new NatGateway(this, `nat-gw-${i + 1}`, {
        allocationId: eip.id,
        subnetId: this.publicSubnets[i].id,
        tags: {
          ...config.tags,
          Name: `${id}-nat-gw-${i + 1}`,
        },
      });

      this.natGateways.push(natGw);

      // Private Route Table
      const privateRouteTable = new RouteTable(this, `private-rt-${i + 1}`, {
        vpcId: config.vpcId,
        tags: {
          ...config.tags,
          Name: `${id}-private-rt-${i + 1}`,
        },
      });

      // Private Route to NAT Gateway
      new Route(this, `private-route-${i + 1}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      });

      // Create Private Subnet
      const subnet = new Subnet(this, `private-subnet-${i + 1}`, {
        vpcId: config.vpcId,
        cidrBlock: config.privateSubnetCidrs[i],
        availabilityZone: config.availabilityZones[i],
        tags: {
          ...config.tags,
          Name: `${id}-private-subnet-${i + 1}`,
          'kubernetes.io/role/internal-elb': '1',
        },
      });

      new RouteTableAssociation(this, `private-rt-assoc-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });

      this.privateSubnets.push(subnet);
    }
  }
}

// Security Group Module
export interface SecurityGroupConfig {
  name: string;
  vpcId: string;
  ingressRules: {
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks: string[];
    description: string;
  }[];
  egressRules: {
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks: string[];
    description: string;
  }[];
  tags: { [key: string]: string };
}

export class SecurityGroupConstruct extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupConfig) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(this, 'security-group', {
      name: config.name,
      vpcId: config.vpcId,
      description: `Security group for ${config.name}`,
      tags: {
        ...config.tags,
        Name: config.name,
      },
    });

    // Ingress Rules
    config.ingressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `ingress-rule-${index}`, {
        securityGroupId: this.securityGroup.id,
        type: 'ingress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        description: rule.description,
      });
    });

    // Egress Rules
    config.egressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `egress-rule-${index}`, {
        securityGroupId: this.securityGroup.id,
        type: 'egress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        description: rule.description,
      });
    });
  }
}
