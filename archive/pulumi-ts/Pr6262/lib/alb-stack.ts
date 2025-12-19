import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  ecsServiceArn: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  blueTargetGroupArn: pulumi.Output<string>;
  greenTargetGroupArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:alb:AlbStack', name, args, opts);

    const {
      environmentSuffix,
      vpcId,
      publicSubnetIds,
      blueTargetGroupArn,
      tags,
    } = args;

    // ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for payment application load balancer',
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
            description: 'Allow all outbound traffic',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-alb-sg-${environmentSuffix}`,
          Tier: 'Web',
        })),
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${environmentSuffix}`,
      {
        name: `payment-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        subnets: publicSubnetIds,
        securityGroups: [albSecurityGroup.id],
        enableDeletionProtection: false,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-alb-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ALB Listener
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _listener = new aws.lb.Listener(
      `payment-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: blueTargetGroupArn,
          },
        ],
      },
      { parent: this }
    );

    // WAF Web ACL for SQL Injection and XSS Protection
    const sqlInjectionRuleSet = new aws.wafv2.WebAcl(
      `payment-waf-${environmentSuffix}`,
      {
        name: `payment-waf-${environmentSuffix}`,
        scope: 'REGIONAL',
        description:
          'WAF for payment application with SQL injection and XSS protection',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesSQLiRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'BlockSQLKeywords',
            priority: 3,
            action: {
              block: {},
            },
            statement: {
              orStatement: {
                statements: [
                  {
                    byteMatchStatement: {
                      fieldToMatch: {
                        queryString: {},
                      },
                      positionalConstraint: 'CONTAINS',
                      searchString: 'SELECT',
                      textTransformations: [
                        {
                          priority: 0,
                          type: 'LOWERCASE',
                        },
                      ],
                    },
                  },
                  {
                    byteMatchStatement: {
                      fieldToMatch: {
                        queryString: {},
                      },
                      positionalConstraint: 'CONTAINS',
                      searchString: 'INSERT',
                      textTransformations: [
                        {
                          priority: 0,
                          type: 'LOWERCASE',
                        },
                      ],
                    },
                  },
                  {
                    byteMatchStatement: {
                      fieldToMatch: {
                        queryString: {},
                      },
                      positionalConstraint: 'CONTAINS',
                      searchString: 'DROP',
                      textTransformations: [
                        {
                          priority: 0,
                          type: 'LOWERCASE',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'BlockSQLKeywordsMetric',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `payment-waf-${environmentSuffix}`,
          sampledRequestsEnabled: true,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-waf-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Associate WAF with ALB
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _wafAssociation = new aws.wafv2.WebAclAssociation(
      `payment-waf-assoc-${environmentSuffix}`,
      {
        resourceArn: alb.arn,
        webAclArn: sqlInjectionRuleSet.arn,
      },
      { parent: this }
    );

    // Outputs
    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      albArn: this.albArn,
    });
  }
}
