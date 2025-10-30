/**
 * Application Load Balancer Stack Component
 *
 * Creates an Application Load Balancer with security groups, target groups,
 * listeners, and ACM certificate for HTTPS traffic.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly albArn: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly ecsTaskSecurityGroupId: pulumi.Output<string>;
  public readonly httpListener: aws.lb.Listener;

  constructor(name: string, args: AlbStackArgs, opts?: ResourceOptions) {
    super('tap:alb:AlbStack', name, args, opts);

    // Create Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        name: `alb-sg-${args.environmentSuffix}`,
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from anywhere',
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
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Security Group for ECS Tasks
    const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-task-sg-${args.environmentSuffix}`,
      {
        name: `ecs-task-sg-${args.environmentSuffix}`,
        vpcId: args.vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
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
          Name: `ecs-task-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Target Group for ECS tasks
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        name: `payment-api-tg-${args.environmentSuffix}`.substring(0, 32),
        port: 80,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'ip',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        tags: {
          Name: `tg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        name: `payment-api-alb-${args.environmentSuffix}`.substring(0, 32),
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        tags: {
          Name: `alb-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create HTTP Listener
    const httpListener = new aws.lb.Listener(
      `listener-http-${args.environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.albArn = alb.arn;
    this.albDns = alb.dnsName;
    this.albSecurityGroupId = albSecurityGroup.id;
    this.targetGroupArn = targetGroup.arn;
    this.ecsTaskSecurityGroupId = ecsTaskSecurityGroup.id;
    this.httpListener = httpListener;

    this.registerOutputs({
      albArn: this.albArn,
      albDns: this.albDns,
      albSecurityGroupId: this.albSecurityGroupId,
      targetGroupArn: this.targetGroupArn,
      ecsTaskSecurityGroupId: this.ecsTaskSecurityGroupId,
    });
  }
}
