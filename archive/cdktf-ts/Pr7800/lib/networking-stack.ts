import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

export interface NetworkingStackProps {
  environmentSuffix: string;
  vpcCidr: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly lambdaSecurityGroup: SecurityGroup;
  public readonly databaseSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const { environmentSuffix, vpcCidr } = props;

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `trading-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create subnets in 3 AZs
    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `trading-public-subnet-${i}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `trading-private-subnet-${i}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'private',
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Create single NAT Gateway for cost optimization
    const eip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `trading-nat-eip-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `trading-nat-gateway-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [igw],
    });

    // Create route tables
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-private-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Associate subnets with route tables
    this.publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Create security groups
    this.lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      name: `trading-lambda-sg-${environmentSuffix}`,
      description: 'Security group for Lambda functions',
      vpcId: this.vpc.id,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `trading-lambda-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.databaseSecurityGroup = new SecurityGroup(this, 'database-sg', {
      name: `trading-database-sg-${environmentSuffix}`,
      description: 'Security group for Aurora database',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [this.lambdaSecurityGroup.id],
          description: 'Allow PostgreSQL from Lambda',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `trading-database-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
  }
}
