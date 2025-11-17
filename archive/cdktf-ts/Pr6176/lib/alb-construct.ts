import { Construct } from 'constructs';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

export interface AlbConstructProps {
  environment: string;
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
}

export class AlbConstruct extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    const { environment, vpcId, subnetIds, securityGroupIds } = props;

    // Create ALB
    this.alb = new Lb(this, 'alb', {
      name: `alb-${environment}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: securityGroupIds,
      subnets: subnetIds,
      tags: {
        Name: `alb-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Create Target Group
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `tg-${environment}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
      tags: {
        Name: `tg-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Create Listener
    new LbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}
