/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the multi-AZ payment processing application with automatic failover.
 *
 * It orchestrates the instantiation of all infrastructure components including:
 * - VPC with public and private subnets across 3 AZs
 * - Auto Scaling Group with 2 instances per AZ
 * - Application Load Balancer with health checks
 * - CloudWatch alarms and SNS notifications
 * - Route53 health checks for failover
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { LoadBalancerStack } from './loadbalancer-stack';
import { ComputeStack } from './compute-stack';
import { MonitoringStack } from './monitoring-stack';
import { Route53Stack } from './route53-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the multi-AZ failover application.
 *
 * This component orchestrates the instantiation of all infrastructure components
 * required for a highly available payment processing application with automatic
 * failover capabilities across multiple availability zones.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Define default tags with required Production and FailoverEnabled tags
    const defaultTags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: 'Production',
      FailoverEnabled: 'true',
    }));

    // Define target region and availability zones
    const region = 'eu-central-1';
    const availabilityZones = [
      'eu-central-1a',
      'eu-central-1b',
      'eu-central-1c',
    ];

    // 1. Create Network Infrastructure (VPC, Subnets, NAT Gateways)
    const networkStack = new NetworkStack(
      'network',
      {
        environmentSuffix,
        region,
        availabilityZones,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. Create Security Groups
    const securityStack = new SecurityStack(
      'security',
      {
        environmentSuffix,
        vpcId: networkStack.vpc.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 3. Create Application Load Balancer and Target Group
    const loadBalancerStack = new LoadBalancerStack(
      'loadbalancer',
      {
        environmentSuffix,
        vpcId: networkStack.vpc.id,
        publicSubnetIds: networkStack.publicSubnets.map(s => s.id),
        albSecurityGroupId: securityStack.albSecurityGroup.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. Create Auto Scaling Group with EC2 Instances
    const computeStack = new ComputeStack(
      'compute',
      {
        environmentSuffix,
        region,
        availabilityZones,
        privateSubnetIds: networkStack.privateSubnets.map(s => s.id),
        instanceSecurityGroupId: securityStack.instanceSecurityGroup.id,
        targetGroupArn: loadBalancerStack.targetGroup.arn,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [loadBalancerStack] }
    );

    // 5. Create CloudWatch Alarms and SNS Notifications
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        region,
        availabilityZones,
        targetGroupArn: loadBalancerStack.targetGroup.arn,
        albArn: loadBalancerStack.alb.arn,
        autoScalingGroupName: computeStack.autoScalingGroup.name,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [computeStack] }
    );

    // 6. Create Route53 Health Checks
    const route53Stack = new Route53Stack(
      'route53',
      {
        environmentSuffix,
        albDnsName: loadBalancerStack.alb.dnsName,
        albZoneId: loadBalancerStack.alb.zoneId,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [loadBalancerStack] }
    );

    // Expose important outputs
    this.vpcId = networkStack.vpc.id;
    this.albDnsName = loadBalancerStack.alb.dnsName;
    this.snsTopicArn = monitoringStack.snsTopic.arn;
    this.autoScalingGroupName = computeStack.autoScalingGroup.name;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      albArn: loadBalancerStack.alb.arn,
      targetGroupArn: loadBalancerStack.targetGroup.arn,
      autoScalingGroupName: this.autoScalingGroupName,
      snsTopicArn: this.snsTopicArn,
      healthCheckId: route53Stack.healthCheck.id,
      region: region,
      availabilityZones: availabilityZones,
    });
  }
}
