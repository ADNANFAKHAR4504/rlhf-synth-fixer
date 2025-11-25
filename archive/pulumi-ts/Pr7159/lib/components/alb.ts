import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AlbComponentArgs {
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
  sslCertificateArn?: string;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class AlbComponent extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly httpListener: aws.lb.Listener;
  public readonly httpsListener?: aws.lb.Listener;
  public readonly dnsName: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:loadbalancing:AlbComponent', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        loadBalancerType: 'application',
        securityGroups: [args.securityGroupId],
        subnets: args.subnetIds,
        enableDeletionProtection: false,
        tags: {
          ...args.tags,
          Name: `alb-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.dnsName = this.alb.dnsName;

    // HTTP Listener
    this.httpListener = new aws.lb.Listener(
      `alb-listener-http-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: args.sslCertificateArn
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
                targetGroupArn: args.targetGroupArn,
              },
            ],
      },
      defaultResourceOptions
    );

    // HTTPS Listener (if certificate provided)
    if (args.sslCertificateArn) {
      this.httpsListener = new aws.lb.Listener(
        `alb-listener-https-${args.environmentSuffix}`,
        {
          loadBalancerArn: this.alb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
          certificateArn: args.sslCertificateArn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: args.targetGroupArn,
            },
          ],
        },
        defaultResourceOptions
      );
    }

    this.registerOutputs({
      albArn: this.alb.arn,
      albDnsName: this.dnsName,
    });
  }
}
