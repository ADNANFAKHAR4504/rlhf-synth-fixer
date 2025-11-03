import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { EcsStack } from './ecs-stack';
import { LoadBalancerStack } from './load-balancer-stack';
import { DnsStack } from './dns-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  ecrImageUri?: string;
  domainName?: string;
  certificateArn?: string;
  dbSecretArn?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = pulumi.output(aws.getRegion()).name;

    const defaultTags = pulumi.output(args.tags).apply(t => ({
      ...t,
      Environment: 'production',
      ManagedBy: 'pulumi',
    }));

    // 1. Create VPC and network infrastructure
    const networkStack = new NetworkStack(
      'payment-network',
      {
        environmentSuffix,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. Create security groups
    const securityStack = new SecurityStack(
      'payment-security',
      {
        environmentSuffix,
        vpcId: networkStack.vpcId,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 3. Create CloudWatch logging
    const monitoringStack = new MonitoringStack(
      'payment-monitoring',
      {
        environmentSuffix,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. Create RDS database
    const databaseStack = new DatabaseStack(
      'payment-database',
      {
        environmentSuffix,
        subnetIds: networkStack.privateSubnetIds,
        securityGroupId: securityStack.dbSecurityGroupId,
        dbSecretArn: args.dbSecretArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5. Create Application Load Balancer
    const loadBalancerStack = new LoadBalancerStack(
      'payment-alb',
      {
        environmentSuffix,
        vpcId: networkStack.vpcId,
        subnetIds: networkStack.publicSubnetIds,
        securityGroupId: securityStack.albSecurityGroupId,
        certificateArn: args.certificateArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 6. Create ECS cluster and service
    const ecsStack = new EcsStack(
      'payment-ecs',
      {
        environmentSuffix,
        vpcId: networkStack.vpcId,
        subnetIds: networkStack.privateSubnetIds,
        securityGroupId: securityStack.ecsSecurityGroupId,
        targetGroupArn: loadBalancerStack.targetGroupArn,
        ecrImageUri: args.ecrImageUri || 'nginx:latest',
        dbSecretArn: args.dbSecretArn,
        dbEndpoint: databaseStack.dbEndpoint,
        logGroupName: monitoringStack.ecsLogGroupName,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 7. Create Route53 DNS (optional)
    if (args.domainName) {
      new DnsStack(
        'payment-dns',
        {
          environmentSuffix,
          domainName: args.domainName,
          albDnsName: loadBalancerStack.albDnsName,
          albZoneId: loadBalancerStack.albZoneId,
          tags: defaultTags,
        },
        { parent: this }
      );
    }

    // Export key outputs
    this.albDnsName = loadBalancerStack.albDnsName;
    this.dbEndpoint = databaseStack.dbEndpoint;
    this.ecsClusterName = ecsStack.clusterName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      dbEndpoint: this.dbEndpoint,
      ecsClusterName: this.ecsClusterName,
      region: region,
    });
  }
}
