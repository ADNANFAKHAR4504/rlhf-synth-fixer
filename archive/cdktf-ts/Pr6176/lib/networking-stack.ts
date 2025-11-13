import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

export interface NetworkingStackProps {
  environment: string;
  cidrBlock: string;
  awsRegion: string;
  availabilityZones?: string[];
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

    const { environment, cidrBlock, awsRegion, availabilityZones } = props;

    // Use provided AZs or derive from region
    const azList = availabilityZones || [`${awsRegion}a`, `${awsRegion}b`];

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
      dependsOn: [this.vpc],
    });

    // Create Public Subnets (2 AZs)
    this.publicSubnets = [];
    const numAzs = Math.min(2, azList.length);

    for (let azIndex = 0; azIndex < numAzs; azIndex++) {
      const subnet = new Subnet(this, `public-subnet-${azIndex}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${azIndex}.0/24`,
        availabilityZone: azList[azIndex],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${environment}-${azList[azIndex]}`,
        },
        dependsOn: [this.vpc],
      });
      this.publicSubnets.push(subnet);
    }

    // Create Private Subnets (2 AZs)
    this.privateSubnets = [];

    for (let azIndex = 0; azIndex < numAzs; azIndex++) {
      const subnet = new Subnet(this, `private-subnet-${azIndex}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${azIndex + 10}.0/24`,
        availabilityZone: azList[azIndex],
        tags: {
          Name: `private-subnet-${environment}-${azList[azIndex]}`,
        },
        dependsOn: [this.vpc],
      });
      this.privateSubnets.push(subnet);
    }

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
      dependsOn: [this.vpc, igw],
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
        dependsOn: [subnet, publicRouteTable],
      });
    });

    // Create Security Groups (without cross-referencing ingress rules)
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      namePrefix: `alb-sg-${environment}-`,
      description: 'Security group for ALB',
      vpcId: this.vpc.id,
      tags: {
        Name: `alb-sg-${environment}`,
        Environment: environment,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
      dependsOn: [this.vpc],
    });

    this.ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      namePrefix: `ecs-sg-${environment}-`,
      description: 'Security group for ECS tasks',
      vpcId: this.vpc.id,
      tags: {
        Name: `ecs-sg-${environment}`,
        Environment: environment,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
      dependsOn: [this.vpc],
    });

    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      namePrefix: `rds-sg-${environment}-`,
      description: 'Security group for RDS',
      vpcId: this.vpc.id,
      tags: {
        Name: `rds-sg-${environment}`,
        Environment: environment,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
      dependsOn: [this.vpc],
    });

    // Create Security Group Rules separately to avoid circular dependencies
    // ALB Security Group Rules
    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    // ECS Security Group Rules
    new SecurityGroupRule(this, 'ecs-ingress-from-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ecsSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ecs-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ecsSecurityGroup.id,
    });

    // RDS Security Group Rules
    new SecurityGroupRule(this, 'rds-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ecsSecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'rds-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.rdsSecurityGroup.id,
    });
  }
}
