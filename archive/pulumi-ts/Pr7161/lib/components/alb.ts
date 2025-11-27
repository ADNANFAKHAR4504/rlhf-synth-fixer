import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AlbComponentArgs {
  environment: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  tags: { [key: string]: string };
}

export class AlbComponent extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;
  public readonly dnsName: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;
  private readonly securityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: AlbComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:AlbComponent', name, {}, opts);

    const resourceOpts = { parent: this };

    // Create security group for ALB
    this.securityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-payment-alb-sg`,
      {
        name: `${args.environment}-payment-alb-sg`,
        description: 'Security group for Application Load Balancer',
        vpcId: args.vpcId,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP access',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS access',
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
          Name: `${args.environment}-payment-alb-sg`,
        },
      },
      resourceOpts
    );

    this.securityGroupId = this.securityGroup.id;

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `${args.environment}-payment-alb`,
      {
        name: `${args.environment}-payment-alb`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [this.securityGroup.id],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-alb`,
        },
      },
      resourceOpts
    );

    this.dnsName = this.alb.dnsName;

    // Create target group
    this.targetGroup = new aws.lb.TargetGroup(
      `${args.environment}-payment-tg`,
      {
        name: `${args.environment}-payment-tg`,
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
          ...args.tags,
          Name: `${args.environment}-payment-tg`,
        },
      },
      resourceOpts
    );

    this.targetGroupArn = this.targetGroup.arn;

    // Create listener with path-based routing
    this.listener = new aws.lb.Listener(
      `${args.environment}-payment-listener`,
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
        tags: args.tags,
      },
      resourceOpts
    );

    // Add path-based routing rules
    new aws.lb.ListenerRule(
      `${args.environment}-payment-api-rule`,
      {
        listenerArn: this.listener.arn,
        priority: 100,
        actions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/api/*'],
            },
          },
        ],
        tags: args.tags,
      },
      resourceOpts
    );

    new aws.lb.ListenerRule(
      `${args.environment}-payment-webhook-rule`,
      {
        listenerArn: this.listener.arn,
        priority: 200,
        actions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/webhook/*'],
            },
          },
        ],
        tags: args.tags,
      },
      resourceOpts
    );

    this.registerOutputs({
      dnsName: this.dnsName,
      targetGroupArn: this.targetGroupArn,
      securityGroupId: this.securityGroupId,
    });
  }

  // Helper method to get security group ID
  public getSecurityGroupId(): pulumi.Output<string> {
    return this.securityGroupId;
  }
}
