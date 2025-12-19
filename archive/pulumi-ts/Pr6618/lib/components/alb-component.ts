import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AlbComponentArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  albSecurityGroupId: pulumi.Input<string>;
}

export class AlbComponent extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;

  constructor(
    name: string,
    args: AlbComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:AlbComponent', name, {}, opts);

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        name: `alb-${args.environmentSuffix}-pw`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [args.albSecurityGroupId],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        name: `tg-${args.environmentSuffix}-pw`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'ip',
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
        deregistrationDelay: 30,
        tags: {
          Name: `tg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Listener
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
          Name: `listener-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
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
