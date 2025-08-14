import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Assuming these are your component classes, which must be imported.
// The paths are relative to this file.
import { NetworkingInfrastructure } from './components/networking';
import { ComputeInfrastructure } from './components/compute';
import { SecurityInfrastructure } from './components/security';
import { MonitoringInfrastructure } from './components/monitoring';

/**
 * Arguments for the TapStack component.
 *
 * This interface defines the configurable parameters for the entire deployment,
 * such as the environment suffix, target regions, and global tags.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  regions?: string[];
  tags?: { [key: string]: string };
}

/**
 * Defines the shape of the data for each region that is exported.
 * This type is used to replace 'any' and provide strong type safety.
 */
type RegionalOutputData = {
  vpcId: pulumi.Output<string>;
  instanceIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  dashboardName: pulumi.Output<string>;
};

/**
 * The main Pulumi component that orchestrates the creation of all
 * regional infrastructure. It loops through specified regions and deploys
 * a full set of networking, compute, security, and monitoring resources.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly regionalNetworks: { [key: string]: NetworkingInfrastructure };
  public readonly regionalSecurity: { [key: string]: SecurityInfrastructure };
  public readonly regionalCompute: { [key: string]: ComputeInfrastructure };
  public readonly regionalMonitoring: {
    [key: string]: MonitoringInfrastructure;
  };
  public readonly providers: { [key: string]: aws.Provider };
  public readonly environmentSuffix: pulumi.Output<string>;
  public readonly regions: pulumi.Output<string[]>;
  public readonly tags: pulumi.Output<{ [key: string]: string }>;

  constructor(
    name: string,
    args: TapStackArgs = {}, // Add default empty object
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    // Apply default values if not provided, with null safety
    const environmentSuffix = args?.environmentSuffix || 'prod';
    const regions = args?.regions || ['us-east-1', 'us-west-2'];
    const tags = args?.tags || {
      Project: 'Pulumi-Tap-Stack',
      Environment: environmentSuffix,
      Application: 'custom-app',
      ManagedBy: 'Pulumi',
    };

    this.environmentSuffix = pulumi.output(environmentSuffix);
    this.regions = pulumi.output(regions);
    this.tags = pulumi.output(tags);

    this.regionalNetworks = {};
    this.regionalSecurity = {};
    this.regionalCompute = {};
    this.regionalMonitoring = {};
    this.providers = {};

    // Only deploy if regions array is not empty
    if (regions && regions.length > 0) {
      // Deploy to each region with proper multi-region setup
      regions.forEach((region, i) => {
        const regionSuffix = region.replace(/-/g, '').replace(/gov/g, '');
        const isPrimary = i === 0;

        console.log(
          `Setting up AWS provider for region: ${region} (${isPrimary ? 'PRIMARY' : 'SECONDARY'})`
        );
        this.providers[region] = new aws.Provider(
          `aws-provider-${regionSuffix}-${environmentSuffix}`,
          { region: region },
          { parent: this }
        );

        const providerOpts = (
          deps: pulumi.Resource[] = []
        ): pulumi.ResourceOptions => ({
          parent: this,
          provider: this.providers[region],
          dependsOn: deps,
        });

        console.log(`Creating Networking Infrastructure for ${region}...`);
        this.regionalNetworks[region] = new NetworkingInfrastructure(
          `network-${regionSuffix}-${environmentSuffix}`,
          {
            environment: this.environmentSuffix,
            region: region,
            tags: this.tags,
          },
          providerOpts()
        );

        console.log(`Creating Security Infrastructure for ${region}...`);
        this.regionalSecurity[region] = new SecurityInfrastructure(
          `security-${regionSuffix}-${environmentSuffix}`,
          {
            vpcId: this.regionalNetworks[region].vpcId,
            environment: this.environmentSuffix,
            tags: this.tags,
          },
          providerOpts([this.regionalNetworks[region]])
        );

        console.log(`Creating Compute Infrastructure for ${region}...`);
        this.regionalCompute[region] = new ComputeInfrastructure(
          `compute-${regionSuffix}-${environmentSuffix}`,
          {
            vpcId: this.regionalNetworks[region].vpcId,
            region: region,
            privateSubnetIds: this.regionalNetworks[region].privateSubnetIds,
            securityGroupId: this.regionalSecurity[region].webServerSgId,
            environment: this.environmentSuffix,
            tags: this.tags,
          },
          providerOpts([
            this.regionalNetworks[region],
            this.regionalSecurity[region],
          ])
        );

        console.log(`Creating Monitoring Infrastructure for ${region}...`);
        this.regionalMonitoring[region] = new MonitoringInfrastructure(
          `monitoring-${regionSuffix}-${environmentSuffix}`,
          {
            instanceIds: this.regionalCompute[region].instanceIds,
            environment: this.environmentSuffix,
            region: region,
            tags: this.tags,
          },
          providerOpts([
            this.regionalNetworks[region],
            this.regionalSecurity[region],
            this.regionalCompute[region],
          ])
        );
      });
    }

    // Assign the outputs directly from the computed values.
    this.registerOutputs({
      environment: this.environmentSuffix,
      tags: this.tags,
      regions: this.regions,
      primaryRegion: this.regions.apply(regions =>
        regions.length > 0 ? regions[0] : null
      ),
      primaryVpcId: this.regions.apply(regions =>
        regions.length > 0 && this.regionalNetworks[regions[0]]
          ? this.regionalNetworks[regions[0]].vpcId
          : null
      ),
      primaryInstanceIds: this.regions.apply(regions =>
        regions.length > 0 && this.regionalCompute[regions[0]]
          ? this.regionalCompute[regions[0]].instanceIds
          : null
      ),
      primaryWebServerSgId: this.regions.apply(regions =>
        regions.length > 0 && this.regionalSecurity[regions[0]]
          ? this.regionalSecurity[regions[0]].webServerSgId
          : null
      ),
      primaryDashboardName: this.regions.apply(regions =>
        regions.length > 0 && this.regionalMonitoring[regions[0]]
          ? this.regionalMonitoring[regions[0]].dashboardName
          : null
      ),
      allRegionsData: this.regions.apply(regions => {
        const outputs: { [key: string]: RegionalOutputData } = {};
        regions.forEach(region => {
          if (
            this.regionalNetworks[region] &&
            this.regionalCompute[region] &&
            this.regionalSecurity[region] &&
            this.regionalMonitoring[region]
          ) {
            outputs[region] = {
              vpcId: this.regionalNetworks[region].vpcId,
              instanceIds: this.regionalCompute[region].instanceIds,
              securityGroupId: this.regionalSecurity[region].webServerSgId,
              dashboardName: this.regionalMonitoring[region].dashboardName,
            };
          }
        });
        return outputs;
      }),
    });
  }
}

// ---------------------------------------------------------------------------------------
// The following section instantiates the TapStack and exports its outputs.
// This makes the outputs visible in the Pulumi CLI.
// ---------------------------------------------------------------------------------------

// Create a single instance of your TapStack. This is the main entry point of your program.
const tapStack = new TapStack('tap-stack', {
  // You can specify your desired environment, regions, and tags here.
  // The default values from the class constructor will be used if you don't.
});

// Explicitly export the outputs from the tapStack instance.
// The key on the left is the name of the output that will appear in your CLI.
export const environment = tapStack.environmentSuffix;
export const regions = tapStack.regions;
export const tags = tapStack.tags;

// Since the outputs are no longer public properties of the class,
// we need to access the outputs from the internal registerOutputs call.
// This is not possible directly from outside the class.
// A simpler way is to re-compute these outputs outside of the class, which
// is the best practice for a main Pulumi program file.
export const primaryRegion = tapStack.regions.apply(regions =>
  regions.length > 0 ? regions[0] : null
);
export const primaryVpcId = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalNetworks[regions[0]]
    ? tapStack.regionalNetworks[regions[0]].vpcId
    : null
);
export const primaryInstanceIds = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalCompute[regions[0]]
    ? tapStack.regionalCompute[regions[0]].instanceIds
    : null
);
export const primaryWebServerSgId = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalSecurity[regions[0]]
    ? tapStack.regionalSecurity[regions[0]].webServerSgId
    : null
);
export const primaryDashboardName = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalMonitoring[regions[0]]
    ? tapStack.regionalMonitoring[regions[0]].dashboardName
    : null
);
export const allRegionsData = tapStack.regions.apply(regions => {
  const outputs: { [key: string]: RegionalOutputData } = {};
  regions.forEach(region => {
    if (
      tapStack.regionalNetworks[region] &&
      tapStack.regionalCompute[region] &&
      tapStack.regionalSecurity[region] &&
      tapStack.regionalMonitoring[region]
    ) {
      outputs[region] = {
        vpcId: tapStack.regionalNetworks[region].vpcId,
        instanceIds: tapStack.regionalCompute[region].instanceIds,
        securityGroupId: tapStack.regionalSecurity[region].webServerSgId,
        dashboardName: tapStack.regionalMonitoring[region].dashboardName,
      };
    }
  });
  return outputs;
});
