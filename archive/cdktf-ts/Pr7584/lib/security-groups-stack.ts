import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

export interface SecurityGroupsStackProps {
  environmentSuffix: string;
  vpc: Vpc;
}

export class SecurityGroupsStack extends Construct {
  public readonly ecsSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly redisSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsStackProps) {
    super(scope, id);

    const { environmentSuffix, vpc } = props;

    // ECS Security Group
    this.ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `assessment-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS Fargate tasks',
      vpcId: vpc.id,
      tags: {
        Name: `assessment-ecs-sg-${environmentSuffix}`,
      },
    });

    // Allow outbound traffic from ECS
    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ecsSecurityGroup.id,
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `assessment-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora cluster',
      vpcId: vpc.id,
      tags: {
        Name: `assessment-rds-sg-${environmentSuffix}`,
      },
    });

    // Allow inbound from ECS to RDS on port 5432 (PostgreSQL)
    new SecurityGroupRule(this, 'rds-ingress-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ecsSecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
    });

    // Redis Security Group
    this.redisSecurityGroup = new SecurityGroup(this, 'redis-sg', {
      name: `assessment-redis-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis',
      vpcId: vpc.id,
      tags: {
        Name: `assessment-redis-sg-${environmentSuffix}`,
      },
    });

    // Allow inbound from ECS to Redis on port 6379
    new SecurityGroupRule(this, 'redis-ingress-ecs', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ecsSecurityGroup.id,
      securityGroupId: this.redisSecurityGroup.id,
    });
  }
}
