/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for disaster recovery automation.
 * Orchestrates multi-region infrastructure deployment with automated failover.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkStack } from './network-stack';
import { RoutingStack } from './routing-stack';
import { StorageStack } from './storage-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  primaryRegion?: string;
  secondaryRegion?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly globalClusterId: pulumi.Output<string>;
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly secondaryBucketName: pulumi.Output<string>;
  public readonly healthCheckUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const primaryRegion = args.primaryRegion || 'us-east-1';
    const secondaryRegion = args.secondaryRegion || 'us-west-2';

    // Network Infrastructure - Both Regions
    const networkStack = new NetworkStack(
      'dr-network',
      {
        environmentSuffix,
        primaryRegion,
        secondaryRegion,
        tags,
      },
      { parent: this }
    );

    // Storage - S3 with Cross-Region Replication
    const storageStack = new StorageStack(
      'dr-storage',
      {
        environmentSuffix,
        primaryRegion,
        secondaryRegion,
        tags,
      },
      { parent: this }
    );

    // Database - Aurora Global Database
    const databaseStack = new DatabaseStack(
      'dr-database',
      {
        environmentSuffix,
        primaryRegion,
        secondaryRegion,
        primaryVpcId: networkStack.primaryVpcId,
        secondaryVpcId: networkStack.secondaryVpcId,
        primarySubnetIds: networkStack.primaryPrivateSubnetIds,
        secondarySubnetIds: networkStack.secondaryPrivateSubnetIds,
        primarySecurityGroupId: networkStack.primaryDbSecurityGroupId,
        secondarySecurityGroupId: networkStack.secondaryDbSecurityGroupId,
        secondaryKmsKeyId: storageStack.secondaryKmsKeyId,
        tags,
      },
      { parent: this }
    );

    // Compute - Lambda@Edge and ALBs
    const computeStack = new ComputeStack(
      'dr-compute',
      {
        environmentSuffix,
        primaryRegion,
        secondaryRegion,
        primaryVpcId: networkStack.primaryVpcId,
        secondaryVpcId: networkStack.secondaryVpcId,
        primarySubnetIds: networkStack.primaryPublicSubnetIds,
        secondarySubnetIds: networkStack.secondaryPublicSubnetIds,
        primaryAlbSecurityGroupId: networkStack.primaryAlbSecurityGroupId,
        secondaryAlbSecurityGroupId: networkStack.secondaryAlbSecurityGroupId,
        primaryDbEndpoint: databaseStack.primaryClusterEndpoint,
        secondaryDbEndpoint: databaseStack.secondaryClusterEndpoint,
        tags,
      },
      { parent: this }
    );

    // Routing - Route 53 Health Checks and Failover
    const routingStack = new RoutingStack(
      'dr-routing',
      {
        environmentSuffix,
        primaryAlbDns: computeStack.primaryAlbDns,
        secondaryAlbDns: computeStack.secondaryAlbDns,
        tags,
      },
      { parent: this }
    );

    // Monitoring - CloudWatch and EventBridge
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _monitoringStack = new MonitoringStack(
      'dr-monitoring',
      {
        environmentSuffix,
        primaryRegion,
        secondaryRegion,
        globalClusterId: databaseStack.globalClusterId,
        primaryClusterId: databaseStack.primaryClusterId,
        secondaryClusterId: databaseStack.secondaryClusterId,
        healthCheckId: routingStack.healthCheckId,
        tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.primaryVpcId = networkStack.primaryVpcId;
    this.secondaryVpcId = networkStack.secondaryVpcId;
    this.globalClusterId = databaseStack.globalClusterId;
    this.primaryBucketName = storageStack.primaryBucketName;
    this.secondaryBucketName = storageStack.secondaryBucketName;
    this.healthCheckUrl = routingStack.failoverDomainName;

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      secondaryVpcId: this.secondaryVpcId,
      globalClusterId: this.globalClusterId,
      primaryBucketName: this.primaryBucketName,
      secondaryBucketName: this.secondaryBucketName,
      healthCheckUrl: this.healthCheckUrl,
      primaryAlbDns: computeStack.primaryAlbDns,
      secondaryAlbDns: computeStack.secondaryAlbDns,
      primaryDbEndpoint: databaseStack.primaryClusterEndpoint,
      secondaryDbEndpoint: databaseStack.secondaryClusterEndpoint,
    });
  }
}
