import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  targetGroupArn: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly albArn: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;

  constructor(name: string, args: AlbStackArgs, opts?: ResourceOptions) {
    super('tap:alb:AlbStack', name, args, opts);

    // Create Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-alb-sg-${args.environmentSuffix}`,
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
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${name}-alb-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create S3 bucket for ALB access logs
    const albLogBucket = new aws.s3.Bucket(
      `${name}-alb-logs-${args.environmentSuffix}`,
      {
        acl: 'private',
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        tags: {
          Name: `${name}-alb-logs-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Get AWS ELB service account for the region
    const elbServiceAccount = aws.elb.getServiceAccount({});

    new aws.s3.BucketPolicy(
      `${name}-alb-log-policy-${args.environmentSuffix}`,
      {
        bucket: albLogBucket.id,
        policy: pulumi
          .all([albLogBucket.arn, elbServiceAccount])
          .apply(([bucketArn, account]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: account.arn,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create Application Load Balancer with access logs
    const alb = new aws.lb.LoadBalancer(
      `${name}-alb-${args.environmentSuffix}`,
      {
        name: `${name}-alb-${args.environmentSuffix}`.substring(0, 32), // ALB name limited to 32 chars
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        accessLogs: {
          bucket: albLogBucket.bucket,
          enabled: true,
          prefix: 'alb-logs',
        },
        tags: {
          Name: `${name}-alb-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this, dependsOn: [albLogBucket] }
    );

    // Create ALB listener
    new aws.lb.Listener(
      `${name}-listener-${args.environmentSuffix}`,
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

    this.albArn = alb.arn;
    this.albDns = alb.dnsName;

    this.registerOutputs({
      albArn: this.albArn,
      albDns: this.albDns,
    });
  }
}
