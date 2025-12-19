/**
 * Main TapStack - Orchestrates all infrastructure components
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { IdentityInfrastructure } from './components/identity';
import { NetworkingInfrastructure } from './components/networking';
import { ElasticBeanstalkInfrastructure } from './components/elastic_beanstalk';
import { MonitoringInfrastructure } from './components/monitoring';

export interface TapStackArgs {
  environmentSuffix?: string;
  regions?: string[];
  tags?: Record<string, string>;
  /** Override LocalStack detection (useful for testing) */
  isLocalStack?: boolean;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly environmentSuffix: string;
  public readonly regions: string[];
  public readonly tags: Record<string, string>;
  public readonly isLocalStack: boolean;

  // Infrastructure components
  public readonly identity: IdentityInfrastructure;
  public readonly regionalNetworks: Record<string, NetworkingInfrastructure> =
    {};
  public readonly regionalMonitoring: Record<string, MonitoringInfrastructure> =
    {};
  public readonly regionalElasticBeanstalk: Record<
    string,
    ElasticBeanstalkInfrastructure
  > = {};
  public readonly providers: Record<string, aws.Provider> = {};

  constructor(
    name: string,
    args?: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('nova:TapStack', name, {}, opts);

    // Set default values
    this.environmentSuffix = args?.environmentSuffix || 'prod';
    this.regions = args?.regions || ['us-east-1', 'us-west-1'];
    this.tags = args?.tags || {
      Environment: this.environmentSuffix,
      Project: 'IaC-AWS-Nova-Model-Breaking',
      Application: 'nova-web-app',
      ManagedBy: 'Pulumi',
    };

    // Detect LocalStack environment - EB not fully supported (ListTagsForResource unavailable)
    // Can be overridden via args for testing purposes
    this.isLocalStack =
      args?.isLocalStack ??
      (!!process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
        !!process.env.AWS_ENDPOINT_URL?.includes('localstack'));

    console.log(' Creating Identity and Access Infrastructure...');

    // Create shared identity infrastructure
    this.identity = new IdentityInfrastructure(
      `${name}-identity`,
      {
        tags: this.tags,
      },
      { parent: this }
    );

    // Create regional infrastructure for each region
    for (const region of this.regions) {
      const isPrimary = region === this.regions[0]; // First region is primary

      console.log(
        ` Setting up AWS provider for region: ${region} ${isPrimary ? '(PRIMARY)' : ''}`
      );

      // Create regional AWS provider with explicit typing
      this.providers[region] = new aws.Provider(
        `${name}-provider-${region}`,
        {
          region: region as aws.Region, // Explicitly cast to aws.Region
        },
        { parent: this }
      );

      console.log(` Creating Networking Infrastructure for ${region}...`);

      // Create regional networking
      this.regionalNetworks[region] = new NetworkingInfrastructure(
        `${name}-networking-${region}`,
        {
          region,
          isPrimary,
          environment: this.environmentSuffix,
          tags: this.tags,
        },
        { parent: this, provider: this.providers[region] }
      );

      console.log(` Creating Monitoring Infrastructure for ${region}...`);

      // Create regional monitoring
      this.regionalMonitoring[region] = new MonitoringInfrastructure(
        `${name}-monitoring-${region}`,
        {
          region,
          environment: this.environmentSuffix,
          tags: this.tags,
        },
        { parent: this, provider: this.providers[region] }
      );

      // Skip Elastic Beanstalk on LocalStack - ListTagsForResource API not supported
      if (this.isLocalStack) {
        console.log(
          ` Skipping Elastic Beanstalk for ${region} (LocalStack - not fully supported)`
        );
      } else {
        console.log(
          ` Creating Elastic Beanstalk Infrastructure for ${region}...`
        );

        // Create regional Elastic Beanstalk
        this.regionalElasticBeanstalk[region] =
          new ElasticBeanstalkInfrastructure(
            `${name}-eb-${region}`,
            {
              region,
              isPrimary,
              environment: this.environmentSuffix,
              environmentSuffix: this.environmentSuffix,
              vpcId: this.regionalNetworks[region].vpcId,
              publicSubnetIds: this.regionalNetworks[region].publicSubnetIds,
              privateSubnetIds: this.regionalNetworks[region].privateSubnetIds,
              albSecurityGroupId:
                this.regionalNetworks[region].albSecurityGroupId,
              ebSecurityGroupId:
                this.regionalNetworks[region].ebSecurityGroupId,
              ebServiceRoleArn: this.identity.ebServiceRoleArn,
              ebInstanceProfileName: this.identity.ebInstanceProfileName,
              tags: this.tags,
            },
            { parent: this, provider: this.providers[region] }
          );
      }
    }

    // Register outputs
    this.registerOutputs({
      environmentSuffix: this.environmentSuffix,
      regions: this.regions,
      identityArn: this.identity.ebServiceRoleArn,
    });

    console.log(
      ` TapStack deployment complete for regions: ${this.regions.join(', ')}`
    );
  }
}
