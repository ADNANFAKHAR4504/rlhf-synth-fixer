/**
 * tap-stack.ts
 *
 * Main Pulumi stack orchestrating multi-region disaster recovery infrastructure
 * for the payment processing system.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { DnsStack } from './dns-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupStack } from './backup-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryEndpoint: pulumi.Output<string>;
  public readonly drEndpoint: pulumi.Output<string>;
  public readonly healthCheckStatus: pulumi.Output<string>;
  public readonly replicationLag: pulumi.Output<string>;
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly drVpcId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'DisasterRecovery',
      ManagedBy: 'Pulumi',
    }));

    // Network infrastructure in both regions with VPC peering
    const networkStack = new NetworkStack(
      'network',
      {
        environmentSuffix: environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Compute resources with Auto Scaling and ALBs in both regions
    // Created first so security group IDs can be passed to database stack
    const computeStack = new ComputeStack(
      'compute',
      {
        environmentSuffix: environmentSuffix,
        tags,
        primaryVpcId: networkStack.primaryVpcId,
        drVpcId: networkStack.drVpcId,
        primaryPublicSubnetIds: networkStack.primaryPublicSubnetIds,
        drPublicSubnetIds: networkStack.drPublicSubnetIds,
        primaryPrivateSubnetIds: networkStack.primaryPrivateSubnetIds,
        drPrivateSubnetIds: networkStack.drPrivateSubnetIds,
        primaryProvider: networkStack.primaryProvider,
        drProvider: networkStack.drProvider,
      },
      { parent: this }
    );

    // Database layer with Aurora Global Database and DynamoDB global tables
    // Uses compute security group IDs for more secure access control
    const databaseStack = new DatabaseStack(
      'database',
      {
        environmentSuffix: environmentSuffix,
        tags,
        primaryVpcId: networkStack.primaryVpcId,
        drVpcId: networkStack.drVpcId,
        primarySubnetIds: networkStack.primaryPrivateSubnetIds,
        drSubnetIds: networkStack.drPrivateSubnetIds,
        primaryProvider: networkStack.primaryProvider,
        drProvider: networkStack.drProvider,
        primaryInstanceSecurityGroupId:
          computeStack.primaryInstanceSecurityGroupId,
        drInstanceSecurityGroupId: computeStack.drInstanceSecurityGroupId,
      },
      { parent: this, dependsOn: [computeStack] }
    );

    // DNS and health-check based failover routing
    const dnsStack = new DnsStack(
      'dns',
      {
        environmentSuffix: environmentSuffix,
        tags,
        primaryAlbDnsName: computeStack.primaryAlbDnsName,
        drAlbDnsName: computeStack.drAlbDnsName,
        primaryAlbZoneId: computeStack.primaryAlbZoneId,
        drAlbZoneId: computeStack.drAlbZoneId,
        primaryProvider: networkStack.primaryProvider,
      },
      { parent: this }
    );

    // Monitoring with CloudWatch Metric Streams, alarms, and Lambda failover
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix: environmentSuffix,
        tags,
        primaryDbClusterId: databaseStack.primaryClusterId,
        drDbClusterId: databaseStack.drClusterId,
        dynamoTableName: databaseStack.dynamoTableName,
        primaryAlbArn: computeStack.primaryAlbArn,
        drAlbArn: computeStack.drAlbArn,
        primaryProvider: networkStack.primaryProvider,
        drProvider: networkStack.drProvider,
      },
      { parent: this }
    );

    // Backup configuration with cross-region copying
    const backupStack = new BackupStack(
      'backup',
      {
        environmentSuffix: environmentSuffix,
        tags,
        primaryDbClusterArn: databaseStack.primaryClusterArn,
        primaryProvider: networkStack.primaryProvider,
        drProvider: networkStack.drProvider,
      },
      { parent: this }
    );

    this.primaryEndpoint = dnsStack.primaryEndpoint;
    this.drEndpoint = dnsStack.drEndpoint;
    this.healthCheckStatus = pulumi.output(
      'Monitoring via Route53 health checks'
    );
    this.replicationLag = databaseStack.replicationLag;
    this.primaryVpcId = networkStack.primaryVpcId;
    this.drVpcId = networkStack.drVpcId;

    this.registerOutputs({
      primaryEndpoint: this.primaryEndpoint,
      drEndpoint: this.drEndpoint,
      healthCheckStatus: this.healthCheckStatus,
      replicationLag: this.replicationLag,
      primaryVpcId: this.primaryVpcId,
      drVpcId: this.drVpcId,
      primarySnsTopicArn: monitoringStack.primarySnsTopicArn,
      drSnsTopicArn: monitoringStack.drSnsTopicArn,
      failoverLambdaArn: monitoringStack.failoverLambdaArn,
      backupPlanId: backupStack.backupPlanId,
      primaryVaultName: backupStack.primaryVaultName,
      drVaultName: backupStack.drVaultName,
      dynamoTableName: databaseStack.dynamoTableName,
      dbPasswordSecretArn: databaseStack.dbPasswordSecretArn,
    });
  }
}
