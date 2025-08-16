// VPC construct for production
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

export class VpcConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, environmentSuffix: string) {
    super(scope, id);
    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${environmentSuffix}-vpc`,
        Environment: environmentSuffix,
      },
    });
    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `${environmentSuffix}-igw`,
        Environment: environmentSuffix,
      },
    });

    // Public Subnets (3 AZs)
    const publicSubnets = [
      new Subnet(this, 'public-subnet-1', {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-west-2a',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${environmentSuffix}-public-subnet-1`,
          Environment: environmentSuffix,
          Type: 'public',
        },
      }),
      new Subnet(this, 'public-subnet-2', {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-west-2b',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${environmentSuffix}-public-subnet-2`,
          Environment: environmentSuffix,
          Type: 'public',
        },
      }),
      new Subnet(this, 'public-subnet-3', {
        vpcId: vpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: 'us-west-2c',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${environmentSuffix}-public-subnet-3`,
          Environment: environmentSuffix,
          Type: 'public',
        },
      }),
    ];

    // Private Subnets (3 AZs)
    const privateSubnets = [
      new Subnet(this, 'private-subnet-1', {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: 'us-west-2a',
        tags: {
          Name: `${environmentSuffix}-private-subnet-1`,
          Environment: environmentSuffix,
          Type: 'private',
        },
      }),
      new Subnet(this, 'private-subnet-2', {
        vpcId: vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: 'us-west-2b',
        tags: {
          Name: `${environmentSuffix}-private-subnet-2`,
          Environment: environmentSuffix,
          Type: 'private',
        },
      }),
      new Subnet(this, 'private-subnet-3', {
        vpcId: vpc.id,
        cidrBlock: '10.0.13.0/24',
        availabilityZone: 'us-west-2c',
        tags: {
          Name: `${environmentSuffix}-private-subnet-3`,
          Environment: environmentSuffix,
          Type: 'private',
        },
      }),
    ];

    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);

    // NAT Gateways (1 per AZ)
    const natEips = publicSubnets.map(
      (subnet, index) =>
        new Eip(this, `nat-eip-${index + 1}`, {
          domain: 'vpc',
          tags: {
            Name: `${environmentSuffix}-nat-eip-${index + 1}`,
            Environment: environmentSuffix,
          },
        })
    );

    const natGateways = publicSubnets.map(
      (subnet, index) =>
        new NatGateway(this, `nat-gateway-${index + 1}`, {
          allocationId: natEips[index].id,
          subnetId: subnet.id,
          tags: {
            Name: `${environmentSuffix}-nat-gateway-${index + 1}`,
            Environment: environmentSuffix,
          },
        })
    );

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `${environmentSuffix}-public-route-table`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-route-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables (1 per private subnet)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${index + 1}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `${environmentSuffix}-private-route-table-${index + 1}`,
            Environment: environmentSuffix,
          },
        }
      );

      new Route(this, `private-route-${index + 1}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(
        this,
        `private-route-association-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Network ACLs - Only allow ports 443 and 22
    const networkAcl = new NetworkAcl(this, `${environmentSuffix}-nacl`, {
      vpcId: vpc.id,
      tags: {
        Name: `${environmentSuffix}-nacl`,
        Environment: environmentSuffix,
      },
    });

    // Inbound rules
    new NetworkAclRule(this, 'nacl-inbound-ssh', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 22,
      toPort: 22,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'nacl-inbound-https', {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
    });

    // Outbound rules
    new NetworkAclRule(this, 'nacl-outbound-ssh', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 22,
      toPort: 22,
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    new NetworkAclRule(this, 'nacl-outbound-https', {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Associate Network ACL with subnets
    [...publicSubnets, ...privateSubnets].forEach((subnet, index) => {
      new NetworkAclAssociation(this, `nacl-association-${index + 1}`, {
        networkAclId: networkAcl.id,
        subnetId: subnet.id,
      });
    });
  }
}
