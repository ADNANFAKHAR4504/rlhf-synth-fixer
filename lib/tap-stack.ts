/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the financial services platform infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { DatabaseStack } from './database-stack';
import { ContainerStack } from './container-stack';
import { MonitoringStack } from './monitoring-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * A suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Required for resource naming.
   */
  environmentSuffix: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * AWS region for deployment
   */
  region?: string;
}

/**
 * Represents the main Pulumi component resource for the financial services platform.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly databaseClusterId: pulumi.Output<string>;
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix;
    const tags = args.tags || {};

    // Create VPC infrastructure
    // NAT Gateway is disabled by default to avoid EIP allocation limits in CI/CD environments
    const vpcStack = new VpcStack(
      'vpc',
      {
        environmentSuffix: environmentSuffix,
        cidr: '10.0.0.0/16',
        availabilityZones: 3,
        tags: tags,
        enableNatGateway: false,
      },
      { parent: this }
    );

    // Create monitoring infrastructure
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create database infrastructure
    const databaseStack = new DatabaseStack(
      'database',
      {
        environmentSuffix: environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        vpcSecurityGroupId: vpcStack.databaseSecurityGroupId,
        logGroupName: monitoringStack.databaseLogGroupName,
        tags: tags,
      },
      { parent: this }
    );

    // Create container infrastructure
    const containerStack = new ContainerStack(
      'container',
      {
        environmentSuffix: environmentSuffix,
        logGroupName: monitoringStack.containerLogGroupName,
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.vpcId = vpcStack.vpcId;
    this.privateSubnetIds = vpcStack.privateSubnetIds;
    this.publicSubnetIds = vpcStack.publicSubnetIds;
    this.databaseClusterId = databaseStack.clusterId;
    this.databaseEndpoint = databaseStack.clusterEndpoint;
    this.ecrRepositoryUrl = containerStack.repositoryUrl;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      databaseClusterId: this.databaseClusterId,
      databaseEndpoint: this.databaseEndpoint,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
    });
  }
}
