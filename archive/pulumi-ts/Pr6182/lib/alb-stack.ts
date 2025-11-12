/**
 * ALB Stack - Creates Application Load Balancer, target groups, and SSL certificates
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, VpcOutputs, AlbOutputs } from './types';

export interface AlbStackArgs {
  config: EnvironmentConfig;
  vpcOutputs: VpcOutputs;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly outputs: AlbOutputs;

  constructor(
    name: string,
    args: AlbStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:alb:AlbStack', name, {}, opts);

    const { config, vpcOutputs } = args;

    // Create ALB security group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${config.environment}-alb-sg-${config.environmentSuffix}`,
      {
        vpcId: vpcOutputs.vpcId,
        description: `Security group for ${config.environment} ALB`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
          },
          ...(config.enableSsl
            ? [
                {
                  protocol: 'tcp',
                  fromPort: 443,
                  toPort: 443,
                  cidrBlocks: ['0.0.0.0/0'],
                  description: 'Allow HTTPS traffic',
                },
              ]
            : []),
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
          ...config.tags,
          Name: `${config.environment}-alb-sg-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `${config.environment}-alb-${config.environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: vpcOutputs.publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          ...config.tags,
          Name: `${config.environment}-alb-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      `${config.environment}-tg-${config.environmentSuffix}`,
      {
        port: 3000,
        protocol: 'HTTP',
        vpcId: vpcOutputs.vpcId,
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
          ...config.tags,
          Name: `${config.environment}-tg-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    let albUrl: pulumi.Output<string>;

    if (config.enableSsl) {
      // Create ACM certificate for HTTPS
      const certificate = new aws.acm.Certificate(
        `${config.environment}-cert-${config.environmentSuffix}`,
        {
          domainName: `${config.environment}.example.com`,
          validationMethod: 'DNS',
          tags: {
            ...config.tags,
            Name: `${config.environment}-cert-${config.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Create HTTPS listener
      new aws.lb.Listener(
        `${config.environment}-https-listener-${config.environmentSuffix}`,
        {
          loadBalancerArn: alb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
          certificateArn: certificate.arn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: targetGroup.arn,
            },
          ],
          tags: {
            ...config.tags,
            Name: `${config.environment}-https-listener-${config.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // HTTP listener redirects to HTTPS
      new aws.lb.Listener(
        `${config.environment}-http-listener-${config.environmentSuffix}`,
        {
          loadBalancerArn: alb.arn,
          port: 80,
          protocol: 'HTTP',
          defaultActions: [
            {
              type: 'redirect',
              redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
              },
            },
          ],
          tags: {
            ...config.tags,
            Name: `${config.environment}-http-listener-${config.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      albUrl = pulumi.interpolate`https://${alb.dnsName}`;
    } else {
      // Create HTTP listener only
      new aws.lb.Listener(
        `${config.environment}-http-listener-${config.environmentSuffix}`,
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
          tags: {
            ...config.tags,
            Name: `${config.environment}-http-listener-${config.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      albUrl = pulumi.interpolate`http://${alb.dnsName}`;
    }

    this.outputs = {
      albArn: alb.arn,
      albDnsName: alb.dnsName,
      albUrl: albUrl,
      targetGroupArn: targetGroup.arn,
      securityGroupId: albSecurityGroup.id,
    };

    this.registerOutputs({
      albArn: this.outputs.albArn,
      albDnsName: this.outputs.albDnsName,
      albUrl: this.outputs.albUrl,
      targetGroupArn: this.outputs.targetGroupArn,
      securityGroupId: this.outputs.securityGroupId,
    });
  }
}
