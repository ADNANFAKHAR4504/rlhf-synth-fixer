import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';

export class LoadBalancerStack extends pulumi.ComponentResource {
  public readonly applicationLoadBalancer: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly albListener: aws.lb.Listener;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      securityGroupsStack: SecurityGroupsStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lb:LoadBalancerStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${args.environment}-app-load-balancer`,
      {
        name: `${args.environment}-app-load-balancer`,
        loadBalancerType: 'application',
        subnets: [
          args.vpcStack.primaryPublicSubnet1.id,
          args.vpcStack.primaryPublicSubnet2.id,
        ],
        securityGroups: [args.securityGroupsStack.primaryAlbSecurityGroup.id],
        enableDeletionProtection: false, // Set to true in production
        tags: {
          ...commonTags,
          Name: `${args.environment}-Application-Load-Balancer`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `${args.environment}-app-target-group`,
      {
        name: `${args.environment}-app-target-group`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: args.vpcStack.primaryVpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/health',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: {
          ...commonTags,
          Name: `${args.environment}-App-Target-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ALB Listener
    this.albListener = new aws.lb.Listener(
      `${args.environment}-app-listener`,
      {
        loadBalancerArn: this.applicationLoadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      loadBalancerDnsName: this.applicationLoadBalancer.dnsName,
      loadBalancerZoneId: this.applicationLoadBalancer.zoneId,
    });
  }
}
