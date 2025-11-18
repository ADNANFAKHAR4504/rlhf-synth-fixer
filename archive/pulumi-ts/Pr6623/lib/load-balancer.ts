/**
 * load-balancer.ts
 *
 * Application Load Balancer for ECS service
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface LoadBalancerStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  publicSubnetIds: pulumi.Output<string>[];
  ecsSecurityGroupId: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  tags?: { [key: string]: string };
}

export class LoadBalancerStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly listenerArn: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly albName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LoadBalancerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:loadbalancer:LoadBalancerStack', name, args, opts);

    // Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `payment-alb-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Allow ALB to access ECS
    new aws.ec2.SecurityGroupRule(
      `alb-to-ecs-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 8080,
        toPort: 8080,
        protocol: 'tcp',
        sourceSecurityGroupId: albSecurityGroup.id,
        securityGroupId: args.ecsSecurityGroupId,
        description: 'Allow ALB to access ECS tasks',
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        name: `payment-alb-${args.environmentSuffix}`,
        loadBalancerType: 'application',
        subnets: args.publicSubnetIds,
        securityGroups: [albSecurityGroup.id],
        enableHttp2: true,
        enableDeletionProtection: false,
        tags: {
          Name: `payment-alb-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.albDnsName = alb.dnsName;
    this.securityGroupId = albSecurityGroup.id;
    this.albName = alb.name;

    // Listener
    const listener = new aws.lb.Listener(
      `listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: args.targetGroupArn,
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.listenerArn = listener.arn;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      listenerArn: this.listenerArn,
      securityGroupId: this.securityGroupId,
      albName: this.albName,
    });
  }
}
