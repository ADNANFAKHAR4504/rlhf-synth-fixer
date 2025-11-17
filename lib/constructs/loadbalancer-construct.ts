import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface LoadBalancerConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.IVpc;
  publicSubnets: ec2.ISubnet[];
  blockedCountries: string[];
}

export class LoadBalancerConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: LoadBalancerConstructProps) {
    super(scope, id);

    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      `ALB-${props.environmentSuffix}`,
      {
        loadBalancerName: `fintech-alb-${props.environmentSuffix}`,
        vpc: props.vpc,
        internetFacing: true,
        vpcSubnets: {
          subnets: props.publicSubnets,
        },
        deletionProtection: false,
      }
    );

    this.webAcl = new wafv2.CfnWebACL(
      this,
      `WebACL-${props.environmentSuffix}`,
      {
        name: `fintech-waf-${props.environmentSuffix}`,
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `fintech-waf-${props.environmentSuffix}`,
        },
        rules: [
          {
            name: 'GeoBlockRule',
            priority: 1,
            statement: {
              geoMatchStatement: {
                countryCodes: props.blockedCountries,
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'GeoBlockRule',
            },
          },
        ],
      }
    );

    new wafv2.CfnWebACLAssociation(
      this,
      `WafAssociation-${props.environmentSuffix}`,
      {
        resourceArn: this.alb.loadBalancerArn,
        webAclArn: this.webAcl.attrArn,
      }
    );

    cdk.Tags.of(this.alb).add('Region', props.region);
  }
}
