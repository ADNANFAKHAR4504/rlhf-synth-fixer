import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string[]>;
  albSecurityGroupId: pulumi.Input<string>;
  certificateArn?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly httpsListener: aws.lb.Listener;
  public readonly frontendTargetGroup: aws.lb.TargetGroup;
  public readonly backendTargetGroup: aws.lb.TargetGroup;

  constructor(
    name: string,
    args: AlbStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:alb:AlbStack', name, args, opts);

    // Create Application Load Balancer
    // Note: ALB names must be <= 32 characters
    const albName = `${name}-alb-${args.environmentSuffix}`.substring(0, 32);
    this.alb = new aws.lb.LoadBalancer(
      `${name}-alb-${args.environmentSuffix}`,
      {
        name: albName,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [args.albSecurityGroupId],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          ...args.tags,
          Name: `${name}-alb-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Target Group for Frontend (port 3000)
    // Note: ALB target group names must be <= 32 characters
    const frontendTgName = `${name}-fe-tg-${args.environmentSuffix}`.substring(
      0,
      32
    );
    this.frontendTargetGroup = new aws.lb.TargetGroup(
      `${name}-frontend-tg-${args.environmentSuffix}`,
      {
        name: frontendTgName,
        port: 3000,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200-299',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          ...args.tags,
          Name: `${name}-frontend-tg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Target Group for Backend (port 8080)
    // Note: ALB target group names must be <= 32 characters
    const backendTgName = `${name}-be-tg-${args.environmentSuffix}`.substring(
      0,
      32
    );
    this.backendTargetGroup = new aws.lb.TargetGroup(
      `${name}-backend-tg-${args.environmentSuffix}`,
      {
        name: backendTgName,
        port: 8080,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/api/health',
          protocol: 'HTTP',
          matcher: '200-299',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          ...args.tags,
          Name: `${name}-backend-tg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create HTTP Listener (for testing - in production use HTTPS)
    const httpListener = new aws.lb.Listener(
      `${name}-http-listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.frontendTargetGroup.arn,
          },
        ],
      },
      { parent: this, dependsOn: [this.alb] }
    );

    // Create HTTPS Listener if certificate is provided
    if (args.certificateArn) {
      this.httpsListener = new aws.lb.Listener(
        `${name}-https-listener-${args.environmentSuffix}`,
        {
          loadBalancerArn: this.alb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
          certificateArn: args.certificateArn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: this.frontendTargetGroup.arn,
            },
          ],
        },
        { parent: this, dependsOn: [this.alb] }
      );
    } else {
      // Use HTTP listener as the main listener for testing
      this.httpsListener = httpListener;
    }

    // Create Listener Rule for Backend API (path-based routing)
    new aws.lb.ListenerRule(
      `${name}-backend-rule-${args.environmentSuffix}`,
      {
        listenerArn: this.httpsListener.arn,
        priority: 100,
        actions: [
          {
            type: 'forward',
            targetGroupArn: this.backendTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/api/*'],
            },
          },
        ],
      },
      { parent: this }
    );

    // Frontend rule (default, already handled by listener default action)
    // But we can explicitly add it for clarity
    new aws.lb.ListenerRule(
      `${name}-frontend-rule-${args.environmentSuffix}`,
      {
        listenerArn: this.httpsListener.arn,
        priority: 200,
        actions: [
          {
            type: 'forward',
            targetGroupArn: this.frontendTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/*'],
            },
          },
        ],
      },
      { parent: this }
    );

    this.registerOutputs({
      albDnsName: this.alb.dnsName,
      albArn: this.alb.arn,
    });
  }
}
