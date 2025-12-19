import { Construct } from 'constructs';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

export interface LoadBalancerStackProps {
  environmentSuffix: string;
  vpcId: string;
  publicSubnetIds: string[];
  region: string;
  provider?: AwsProvider;
}

export interface LoadBalancerStackOutputs {
  albArn: string;
  albDnsName: string;
  albZoneId: string;
  targetGroupArn: string;
}

export class LoadBalancerStack extends Construct {
  public readonly outputs: LoadBalancerStackOutputs;

  constructor(scope: Construct, id: string, props: LoadBalancerStackProps) {
    super(scope, id);

    const { environmentSuffix, vpcId, publicSubnetIds, region, provider } =
      props;

    const drRole = region === 'us-east-1' ? 'primary' : 'dr';

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': drRole,
      ManagedBy: 'cdktf',
    };

    // ALB Security Group
    const albSg = new SecurityGroup(this, `alb-sg-${region}`, {
      name: `payment-alb-sg-${environmentSuffix}-${region}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `payment-alb-sg-${environmentSuffix}-${region}`,
      },
      provider: provider,
    });

    new SecurityGroupRule(this, `alb-http-ingress-${region}`, {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'HTTP access from internet',
      provider: provider,
    });

    new SecurityGroupRule(this, `alb-https-ingress-${region}`, {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'HTTPS access from internet',
      provider: provider,
    });

    new SecurityGroupRule(this, `alb-egress-${region}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'Allow all outbound traffic',
      provider: provider,
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, `target-group-${region}`, {
      name: `payment-tg-${environmentSuffix}-${region}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      deregistrationDelay: '30',
      tags: commonTags,
      provider: provider,
    });

    // Application Load Balancer
    const alb = new Lb(this, `alb-${region}`, {
      name: `payment-alb-${environmentSuffix}-${region}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      idleTimeout: 60,
      tags: commonTags,
      provider: provider,
    });

    // Listener
    new LbListener(this, `listener-${region}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      provider: provider,
    });

    this.outputs = {
      albArn: alb.arn,
      albDnsName: alb.dnsName,
      albZoneId: alb.zoneId,
      targetGroupArn: targetGroup.arn,
    };
  }
}
