import { Construct } from 'constructs';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

export interface AlbConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
  certificateArn?: string;
  tags?: Record<string, string>;
}

export class AlbConstruct extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      subnetIds,
      certificateArn,
      tags = {},
    } = props;

    // Create security group for ALB
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `alb-sg-${environmentSuffix}`,
      description: `Security group for ALB ${environmentSuffix}`,
      vpcId,
      tags: {
        Name: `alb-sg-${environmentSuffix}`,
        ...tags,
      },
    });

    new SecurityGroupRule(this, 'sg-rule-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    if (certificateArn) {
      new SecurityGroupRule(this, 'sg-rule-https', {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: this.securityGroup.id,
      });
    }

    new SecurityGroupRule(this, 'sg-rule-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Create Application Load Balancer
    this.alb = new Lb(this, 'alb', {
      name: `alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [this.securityGroup.id],
      subnets: subnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `alb-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create target group
    this.targetGroup = new LbTargetGroup(this, 'tg', {
      name: `alb-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId,
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
      deregistrationDelay: '30',
      tags: {
        Name: `alb-tg-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create listener
    const listenerConfig: any = {
      loadBalancerArn: this.alb.arn,
      port: certificateArn ? 443 : 80,
      protocol: certificateArn ? 'HTTPS' : 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: {
        Name: `alb-listener-${environmentSuffix}`,
        ...tags,
      },
    };

    if (certificateArn) {
      listenerConfig.certificateArn = certificateArn;
      listenerConfig.sslPolicy = 'ELBSecurityPolicy-TLS-1-2-2017-01';
    }

    this.listener = new LbListener(this, 'listener', listenerConfig);
  }
}
