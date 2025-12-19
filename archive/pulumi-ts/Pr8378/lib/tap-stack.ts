// lib/tap-stack.ts

/**
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the Multi-Tiered Web Application project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */

import * as pulumi from '@pulumi/pulumi';
import { NetworkInfrastructure } from './components/networking';
import { FrontendInfrastructure } from './components/user';
import { BackendInfrastructure } from './components/backend';
import { DataProcessingInfrastructure } from './components/data';
import { MonitoringInfrastructure } from './components/monitoring';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly environmentSuffix: string;
  public readonly tags: { [key: string]: string };
  public readonly network: NetworkInfrastructure;
  public readonly monitoring: MonitoringInfrastructure;
  public readonly backend: BackendInfrastructure;
  public readonly dataProcessing: DataProcessingInfrastructure;
  public readonly frontend: FrontendInfrastructure;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, {}, opts);

    this.environmentSuffix = args.environmentSuffix || 'dev';
    this.tags = args.tags || {};

    // Create network infrastructure
    this.network = new NetworkInfrastructure(
      `${name}-network`,
      {
        environment: this.environmentSuffix,
        tags: this.tags,
      },
      { parent: this }
    );

    // Create monitoring infrastructure
    this.monitoring = new MonitoringInfrastructure(
      `${name}-monitoring`,
      {
        tags: this.tags,
      },
      { parent: this }
    );

    // Create backend infrastructure
    this.backend = new BackendInfrastructure(
      `${name}-backend`,
      {
        vpcId: this.network.vpc.id,
        privateSubnetIds: this.network.privateSubnetIds,
        vpcEndpointSgId: this.network.vpcEndpointSecurityGroup.id,
        snsTopicArn: this.monitoring.snsTopic.arn,
        tags: this.tags,
      },
      {
        parent: this,
        dependsOn: [this.network, this.monitoring],
      }
    );

    // Create data processing infrastructure
    this.dataProcessing = new DataProcessingInfrastructure(
      `${name}-data`,
      {
        vpcId: this.network.vpc.id,
        privateSubnetIds: this.network.privateSubnetIds,
        vpcEndpointSgId: this.network.vpcEndpointSecurityGroup.id,
        snsTopicArn: this.monitoring.snsTopic.arn,
        tags: this.tags,
      },
      {
        parent: this,
        dependsOn: [this.network, this.monitoring],
      }
    );

    // Create frontend infrastructure
    this.frontend = new FrontendInfrastructure(
      `${name}-frontend`,
      {
        tags: this.tags,
      },
      {
        parent: this,
        dependsOn: [this.backend],
      }
    );

    // Setup monitoring alarms for all components
    this.monitoring.setupAlarms(
      [
        this.backend.lambdaFunction.name,
        this.dataProcessing.kinesisProcessor.name,
      ],
      this.dataProcessing.kinesisStream.name,
      this.frontend.cloudfrontDistribution.id,
      { parent: this }
    );

    // Register component outputs
    this.registerOutputs({
      vpcId: this.network.vpc.id,
      cloudfrontDomain: this.frontend.cloudfrontDistribution.domainName,
      kinesisStreamName: this.dataProcessing.kinesisStream.name,
      snsTopicArn: this.monitoring.snsTopic.arn,
    });

    // Note: pulumi.export should be called from the main index.ts file, not from within a ComponentResource
    // The exports are now available through the registerOutputs() call above
  }

  /**
   * Helper method to get all stack outputs for easy access
   */
  public getOutputs() {
    return {
      vpcId: this.network.vpc.id,
      cloudfrontDomain: this.frontend.cloudfrontDistribution.domainName,
      kinesisStreamName: this.dataProcessing.kinesisStream.name,
      snsTopicArn: this.monitoring.snsTopic.arn,
    };
  }
}

// Additional helper function to create TapStackArgs easily
export function createTapStackArgs(
  environmentSuffix?: string,
  tags?: { [key: string]: string }
): TapStackArgs {
  return {
    environmentSuffix: environmentSuffix || 'dev',
    tags: tags || {},
  };
}

// Export the component interfaces for external use
export { NetworkInfrastructure } from './components/networking';
export { FrontendInfrastructure } from './components/user';
export { BackendInfrastructure } from './components/backend';
export { DataProcessingInfrastructure } from './components/data';
export { MonitoringInfrastructure } from './components/monitoring';
