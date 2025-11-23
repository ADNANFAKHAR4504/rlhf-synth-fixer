import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly ecsSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    // ALB Security Group
    const albSg = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
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
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-alb-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ECS Security Group
    const ecsSg = new aws.ec2.SecurityGroup(
      `payment-ecs-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for ECS tasks',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-ecs-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow ALB to communicate with ECS on port 3000
    new aws.ec2.SecurityGroupRule(
      `payment-ecs-ingress-from-alb-${args.environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: ecsSg.id,
        sourceSecurityGroupId: albSg.id,
        protocol: 'tcp',
        fromPort: 3000,
        toPort: 3000,
        description: 'Allow traffic from ALB',
      },
      { parent: this }
    );

    // Database Security Group
    const dbSg = new aws.ec2.SecurityGroup(
      `payment-db-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for RDS PostgreSQL',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow ECS to communicate with RDS on PostgreSQL port
    new aws.ec2.SecurityGroupRule(
      `payment-db-ingress-from-ecs-${args.environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: dbSg.id,
        sourceSecurityGroupId: ecsSg.id,
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        description: 'Allow PostgreSQL traffic from ECS',
      },
      { parent: this }
    );

    this.albSecurityGroupId = albSg.id;
    this.ecsSecurityGroupId = ecsSg.id;
    this.dbSecurityGroupId = dbSg.id;

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroupId,
      ecsSecurityGroupId: this.ecsSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
    });
  }
}
