/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource orchestrating the highly available
 * payment processing infrastructure with automatic failure recovery.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkingStack } from './networking-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { MaintenanceStack } from './maintenance-stack';

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
 * Main TapStack component orchestrating all infrastructure components.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly auroraEndpoint: pulumi.Output<string>;
  public readonly maintenanceBucket: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Networking - VPC, Subnets, NAT Gateway
    const networking = new NetworkingStack(
      'networking',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 2. Maintenance Page - S3 bucket with static website
    const maintenance = new MaintenanceStack(
      'maintenance',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 3. Database - RDS Aurora PostgreSQL cluster
    const database = new DatabaseStack(
      'database',
      {
        environmentSuffix,
        vpc: networking.vpc,
        privateSubnetIds: networking.privateSubnetIds,
        tags,
      },
      { parent: this }
    );

    // 4. Compute - ALB, ASG, EC2 instances
    const compute = new ComputeStack(
      'compute',
      {
        environmentSuffix,
        vpc: networking.vpc,
        publicSubnetIds: networking.publicSubnetIds,
        privateSubnetIds: networking.privateSubnetIds,
        databaseEndpoint: database.clusterEndpoint,
        tags,
      },
      { parent: this }
    );

    // 5. Monitoring - CloudWatch, SNS, Route 53
    const monitoring = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        albArn: compute.albArn,
        albTargetGroupArn: compute.targetGroupArn,
        asgName: compute.asgName,
        instanceIds: compute.instanceIds,
        clusterIdentifier: database.clusterIdentifier,
        maintenanceBucketWebsiteEndpoint: maintenance.websiteEndpoint,
        tags,
      },
      { parent: this }
    );

    // Export stack outputs
    this.albDnsName = compute.albDnsName;
    this.auroraEndpoint = database.clusterEndpoint;
    this.maintenanceBucket = maintenance.bucketName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      auroraEndpoint: this.auroraEndpoint,
      maintenanceBucket: this.maintenanceBucket,
      vpcId: networking.vpc.id,
      snsTopicArn: monitoring.snsTopicArn,
    });
  }
}
