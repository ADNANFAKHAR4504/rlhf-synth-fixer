import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityGroupsArgs {
  vpcId: pulumi.Input<string>;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class SecurityGroupsComponent extends pulumi.ComponentResource {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: SecurityGroupsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecurityGroupsComponent', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

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
        tags: {
          ...args.tags,
          Name: `alb-sg-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
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
          ...args.tags,
          Name: `ecs-sg-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for RDS database',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [this.ecsSecurityGroup.id],
            description: 'Allow traffic from ECS tasks',
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
          ...args.tags,
          Name: `rds-sg-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroup.id,
      ecsSecurityGroupId: this.ecsSecurityGroup.id,
      rdsSecurityGroupId: this.rdsSecurityGroup.id,
    });
  }
}
