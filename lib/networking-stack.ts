import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn } from 'cdktf';
import { Construct } from 'constructs';

export interface NetworkingStackProps {
  environment: string;
  cidrBlock: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ecsSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const { environment, cidrBlock } = props;

    // Query available availability zones dynamically
    const availableAzs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environment}`,
        Environment: environment,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${environment}`,
      },
    });

    // Create Public Subnets (2 AZs) - use first 2 available AZs
    this.publicSubnets = [];
    const azs = [0, 1];

    azs.forEach((azIndex) => {
      const azName = Fn.element(availableAzs.names, azIndex);
      const subnet = new Subnet(this, `public-subnet-${azIndex}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${azIndex}.0/24`,
        availabilityZone: azName,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${environment}-${azIndex}`,
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Create Private Subnets (2 AZs)
    this.privateSubnets = [];
    azs.forEach((azIndex) => {
      const azName = Fn.element(availableAzs.names, azIndex);
      const subnet = new Subnet(this, `private-subnet-${azIndex}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${azIndex + 10}.0/24`,
        availabilityZone: azName,
        tags: {
          Name: `private-subnet-${environment}-${azIndex}`,
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: `public-rt-${environment}`,
      },
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Security Groups
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${environment}`,
      description: 'Security group for ALB',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    this.ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `ecs-sg-${environment}`,
      description: 'Security group for ECS tasks',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [this.albSecurityGroup.id],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${environment}`,
      description: 'Security group for RDS',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [this.ecsSecurityGroup.id],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });
  }
}
