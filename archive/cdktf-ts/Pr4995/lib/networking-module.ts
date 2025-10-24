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
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

interface NetworkingModuleProps {
  environmentSuffix: string;
  vpcCidr: string;
  availabilityZones: string[];
}

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnetIds: string[];
  public readonly publicSubnetIds: string[];
  public readonly ecsSecurityGroupId: string;
  public readonly databaseSecurityGroupId: string;
  public readonly cacheSecurityGroupId: string;
  public readonly efsSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: NetworkingModuleProps) {
    super(scope, id);

    const { environmentSuffix, vpcCidr, availabilityZones } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `manufacturing-vpc-${environmentSuffix}`,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-igw-${environmentSuffix}`,
      },
    });

    // Create Public Subnets
    const publicSubnets: Subnet[] = [];
    availabilityZones.forEach((az, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `manufacturing-public-subnet-${index + 1}-${environmentSuffix}`,
        },
      });
      publicSubnets.push(subnet);
    });

    // Create Private Subnets
    const privateSubnets: Subnet[] = [];
    availabilityZones.forEach((az, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `manufacturing-private-subnet-${index + 1}-${environmentSuffix}`,
        },
      });
      privateSubnets.push(subnet);
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-public-rt-${environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create NAT Gateways (one per AZ for high availability)
    const natGateways: NatGateway[] = [];
    publicSubnets.forEach((subnet, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `manufacturing-nat-eip-${index + 1}-${environmentSuffix}`,
        },
      });

      const natGateway = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          Name: `manufacturing-nat-${index + 1}-${environmentSuffix}`,
        },
      });
      natGateways.push(natGateway);
    });

    // Create Private Route Tables (one per AZ)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `manufacturing-private-rt-${index + 1}-${environmentSuffix}`,
          },
        }
      );

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-security-group', {
      name: `manufacturing-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS Fargate tasks',
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-ecs-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
    });

    // Security Group for RDS Aurora
    const databaseSecurityGroup = new SecurityGroup(
      this,
      'database-security-group',
      {
        name: `manufacturing-db-sg-${environmentSuffix}`,
        description: 'Security group for RDS Aurora PostgreSQL',
        vpcId: this.vpc.id,
        tags: {
          Name: `manufacturing-db-sg-${environmentSuffix}`,
        },
      }
    );

    new SecurityGroupRule(this, 'db-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: databaseSecurityGroup.id,
    });

    // Security Group for ElastiCache Redis
    const cacheSecurityGroup = new SecurityGroup(this, 'cache-security-group', {
      name: `manufacturing-cache-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis',
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-cache-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'cache-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: cacheSecurityGroup.id,
    });

    // Security Group for EFS
    const efsSecurityGroup = new SecurityGroup(this, 'efs-security-group', {
      name: `manufacturing-efs-sg-${environmentSuffix}`,
      description: 'Security group for EFS file system',
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-efs-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'efs-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 2049,
      toPort: 2049,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: efsSecurityGroup.id,
    });

    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
    this.ecsSecurityGroupId = ecsSecurityGroup.id;
    this.databaseSecurityGroupId = databaseSecurityGroup.id;
    this.cacheSecurityGroupId = cacheSecurityGroup.id;
    this.efsSecurityGroupId = efsSecurityGroup.id;
  }
}
