/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { AuroraCluster } from './infrastructure/aurora-cluster';
import { BaseInfrastructure } from './infrastructure/base-infrastructure';
import { CrossStackReferences } from './infrastructure/cross-stack-references';
import { EcsService } from './infrastructure/ecs-service';
import { ParameterStoreHierarchy } from './infrastructure/parameter-store';
import { CloudWatchDashboard } from './monitoring/cloudwatch-dashboard';
import { DriftDetection } from './monitoring/drift-detection';

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
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly ecsClusterArn: pulumi.Output<string>;
  public readonly ecsServiceName: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly auroraEndpoint: pulumi.Output<string>;
  public readonly auroraReaderEndpoint: pulumi.Output<string>;
  public readonly auroraClusterId: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Get configuration - prioritize args, then Pulumi config, then environment variables
    const config = new pulumi.Config();
    const environmentSuffix =
      args.environmentSuffix ||
      config.get('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';
    const environment =
      config.get('environment') || process.env.DEPLOY_ENV || 'dev'; // dev, staging, prod

    // Environment-specific configurations
    interface EnvironmentConfig {
      instanceType: string;
      auroraInstanceCount: number;
      backupRetentionDays: number;
      containerImageTag: string;
      vpcCidr: string;
    }

    const environmentConfigs: Record<string, EnvironmentConfig> = {
      dev: {
        instanceType: 't3.medium',
        auroraInstanceCount: 1,
        backupRetentionDays: 1,
        containerImageTag: 'latest',
        vpcCidr: '10.0.0.0/16',
      },
      staging: {
        instanceType: 'm5.large',
        auroraInstanceCount: 2,
        backupRetentionDays: 7,
        containerImageTag: 'staging-*',
        vpcCidr: '10.1.0.0/16',
      },
      prod: {
        instanceType: 'm5.xlarge',
        auroraInstanceCount: 3,
        backupRetentionDays: 30,
        containerImageTag: 'v*.*.*',
        vpcCidr: '10.2.0.0/16',
      },
    };

    const envConfig = environmentConfigs[environment];

    // Create base infrastructure
    const baseInfra = new BaseInfrastructure(
      `base-infra-${environmentSuffix}`,
      {
        environmentSuffix,
        environment,
        vpcCidr: envConfig.vpcCidr,
        availabilityZones: ['a', 'b', 'c'],
      },
      { parent: this }
    );

    // Create Parameter Store hierarchy
    new ParameterStoreHierarchy(
      `param-store-${environmentSuffix}`,
      {
        environmentSuffix,
        environment,
        vpcId: baseInfra.vpc.id,
        securityGroupIds: [baseInfra.securityGroup.id],
      },
      { parent: this }
    );

    // Create Aurora cluster
    const aurora = new AuroraCluster(
      `aurora-${environmentSuffix}`,
      {
        environmentSuffix,
        environment,
        vpcId: baseInfra.vpc.id,
        subnetIds: baseInfra.privateSubnetIds,
        securityGroupIds: [baseInfra.databaseSecurityGroup.id],
        instanceCount: envConfig.auroraInstanceCount,
        backupRetentionDays: envConfig.backupRetentionDays,
        instanceClass: envConfig.instanceType,
      },
      { parent: this }
    );

    // Create ECS service
    const ecsService = new EcsService(
      `ecs-service-${environmentSuffix}`,
      {
        environmentSuffix,
        environment,
        cluster: baseInfra.ecsCluster,
        vpcId: baseInfra.vpc.id,
        subnetIds: baseInfra.privateSubnetIds,
        albSubnetIds: baseInfra.publicSubnetIds,
        securityGroupId: baseInfra.securityGroup.id,
        imageTag: envConfig.containerImageTag,
        databaseEndpoint: aurora.endpoint,
        databaseSecretArn: aurora.secretArn,
      },
      { parent: this }
    );

    // Set up cross-stack references
    new CrossStackReferences(
      `cross-stack-${environmentSuffix}`,
      {
        environmentSuffix,
        environment,
        vpcId: baseInfra.vpc.id,
        ecsClusterArn: baseInfra.ecsCluster.arn,
        albArn: ecsService.albArn,
        auroraEndpoint: aurora.endpoint,
      },
      { parent: this }
    );

    // Create CloudWatch dashboard
    const dashboard = new CloudWatchDashboard(
      `dashboard-${environmentSuffix}`,
      {
        environmentSuffix,
        environment,
        ecsClusterName: baseInfra.ecsCluster.name,
        ecsServiceName: ecsService.serviceName,
        albArn: ecsService.albArn,
        auroraClusterId: aurora.clusterId,
      },
      { parent: this }
    );

    // Set up drift detection
    const driftDetection = new DriftDetection(
      `drift-${environmentSuffix}`,
      {
        environmentSuffix,
        environment,
        vpcId: baseInfra.vpc.id,
        ecsClusterArn: baseInfra.ecsCluster.arn,
        auroraClusterArn: aurora.clusterArn,
      },
      { parent: this }
    );

    // Set outputs
    this.vpcId = baseInfra.vpc.id;
    this.publicSubnetIds = baseInfra.publicSubnetIds;
    this.privateSubnetIds = baseInfra.privateSubnetIds;
    this.ecsClusterName = baseInfra.ecsCluster.name;
    this.ecsClusterArn = baseInfra.ecsCluster.arn;
    this.ecsServiceName = ecsService.serviceName;
    this.albDnsName = ecsService.albDnsName;
    this.albArn = ecsService.albArn;
    this.auroraEndpoint = aurora.endpoint;
    this.auroraReaderEndpoint = aurora.readerEndpoint;
    this.auroraClusterId = aurora.clusterId;
    this.snsTopicArn = driftDetection.snsTopicArn;
    this.dashboardName = dashboard.dashboardName;

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      ecsClusterName: this.ecsClusterName,
      ecsClusterArn: this.ecsClusterArn,
      ecsServiceName: this.ecsServiceName,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      auroraEndpoint: this.auroraEndpoint,
      auroraReaderEndpoint: this.auroraReaderEndpoint,
      auroraClusterId: this.auroraClusterId,
      snsTopicArn: this.snsTopicArn,
      dashboardName: this.dashboardName,
    });
  }
}
