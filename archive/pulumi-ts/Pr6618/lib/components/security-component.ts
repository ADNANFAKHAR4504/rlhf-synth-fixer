import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityComponentArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
}

export class SecurityComponent extends pulumi.ComponentResource {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: SecurityComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecurityComponent', name, {}, opts);

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic',
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
        tags: {
          Name: `alb-sg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // ECS Security Group
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow traffic from ALB',
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
        tags: {
          Name: `ecs-sg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for RDS Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [this.ecsSecurityGroup.id],
            description: 'Allow PostgreSQL traffic from ECS',
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
        tags: {
          Name: `rds-sg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroup.id,
      ecsSecurityGroupId: this.ecsSecurityGroup.id,
      rdsSecurityGroupId: this.rdsSecurityGroup.id,
    });
  }
}
