import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LoadBalancerStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  albSecurityGroupId: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LoadBalancerStack extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;

  constructor(
    name: string,
    args: LoadBalancerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:loadbalancer:LoadBalancerStack', name, args, opts);

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        loadBalancerType: 'application',
        subnets: args.publicSubnetIds,
        securityGroups: [args.albSecurityGroupId],
        enableCrossZoneLoadBalancing: true,
        enableHttp2: true,
        enableDeletionProtection: false, // Set to true in production
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `alb-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Target Group with health checks
    this.targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30, // Health checks every 30 seconds
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        deregistrationDelay: 30,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `tg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create HTTP Listener (in production, use HTTPS with certificate)
    this.listener = new aws.lb.Listener(
      `listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `listener-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albArn: this.alb.arn,
      albDnsName: this.alb.dnsName,
      targetGroupArn: this.targetGroup.arn,
    });
  }
}
