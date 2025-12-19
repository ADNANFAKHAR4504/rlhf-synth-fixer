import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LoadBalancerStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  certificateArn?: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LoadBalancerStack extends pulumi.ComponentResource {
  public readonly albArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albZoneId: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: LoadBalancerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:loadbalancer:LoadBalancerStack', name, args, opts);

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${args.environmentSuffix}`,
      {
        loadBalancerType: 'application',
        subnets: args.subnetIds,
        securityGroups: [args.securityGroupId],
        enableDeletionProtection: false, // Must be destroyable
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-alb-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create Target Group for ECS tasks
    const targetGroup = new aws.lb.TargetGroup(
      `payment-tg-${args.environmentSuffix}`,
      {
        port: 3000,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'ip',

        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },

        deregistrationDelay: 30,

        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-tg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create HTTP listener (redirect to HTTPS if cert available)
    new aws.lb.Listener(
      `payment-http-listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: args.certificateArn
          ? [
              {
                type: 'redirect',
                redirect: {
                  port: '443',
                  protocol: 'HTTPS',
                  statusCode: 'HTTP_301',
                },
              },
            ]
          : [
              {
                type: 'forward',
                targetGroupArn: targetGroup.arn,
              },
            ],
      },
      { parent: this }
    );

    // Create HTTPS listener if certificate is provided
    if (args.certificateArn) {
      new aws.lb.Listener(
        `payment-https-listener-${args.environmentSuffix}`,
        {
          loadBalancerArn: alb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
          certificateArn: args.certificateArn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: targetGroup.arn,
            },
          ],
        },
        { parent: this }
      );
    }

    this.albArn = alb.arn;
    this.albDnsName = alb.dnsName;
    this.albZoneId = alb.zoneId;
    this.targetGroupArn = targetGroup.arn;

    this.registerOutputs({
      albArn: this.albArn,
      albDnsName: this.albDnsName,
      albZoneId: this.albZoneId,
      targetGroupArn: this.targetGroupArn,
    });
  }
}
