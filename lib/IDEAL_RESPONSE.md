```ts
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
 * The main Pulumi component that orchestrates the creation of all
 * regional infrastructure. It loops through specified regions and deploys
 * a full set of networking, compute, security, and monitoring resources.
 */
export class TapStack extends pulumi.ComponentResource {
    public readonly regionalNetworks: { [key: string]: NetworkingInfrastructure };
    public readonly regionalSecurity: { [key: string]: SecurityInfrastructure };
    public readonly regionalCompute: { [key: string]: ComputeInfrastructure };
    public readonly regionalMonitoring: { [key: string]: MonitoringInfrastructure };
    public readonly providers: { [key: string]: aws.Provider };
    public readonly environmentSuffix: pulumi.Output<string>;
    public readonly regions: pulumi.Output<string[]>;
    public readonly tags: pulumi.Output<{ [key: string]: string }>;

    constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
        super('tap:stack:TapStack', name, args, opts);

        // Apply default values if not provided, mirroring the Python class's behavior.
        const environmentSuffix = args.environmentSuffix || 'prod';
        const regions = args.regions || ['us-east-1', 'us-west-2'];
        const tags = args.tags || {
            'Project': 'Pulumi-Tap-Stack',
            'Environment': environmentSuffix,
            'Application': 'custom-app',
            'ManagedBy': 'Pulumi'
        };

        this.environmentSuffix = pulumi.output(environmentSuffix);
        this.regions = pulumi.output(regions);
        this.tags = pulumi.output(tags);

        this.regionalNetworks = {};
        this.regionalSecurity = {};
        this.regionalCompute = {};
        this.regionalMonitoring = {};
        this.providers = {};

        // Deploy to each region with proper multi-region setup
        regions.forEach((region, i) => {
            const regionSuffix = region.replace(/-/g, '').replace(/gov/g, '');
            const isPrimary = i === 0;

            console.log(`Setting up AWS provider for region: ${region} (${isPrimary ? 'PRIMARY' : 'SECONDARY'})`);
            this.providers[region] = new aws.Provider(
                `aws-provider-${regionSuffix}-${environmentSuffix}`,
                { region: region },
                { parent: this }
            );

            const providerOpts = (deps: pulumi.Resource[] = []): pulumi.ResourceOptions => ({
                parent: this,
                provider: this.providers[region],
                dependsOn: deps
            });

            console.log(`Creating Networking Infrastructure for ${region}...`);
            this.regionalNetworks[region] = new NetworkingInfrastructure(
                `network-${regionSuffix}-${environmentSuffix}`,
                {
                    environment: this.environmentSuffix,
                    region: region,
                    tags: this.tags
                },
                providerOpts()
            );

            console.log(`Creating Security Infrastructure for ${region}...`);
            this.regionalSecurity[region] = new SecurityInfrastructure(
                `security-${regionSuffix}-${environmentSuffix}`,
                {
                    vpcId: this.regionalNetworks[region].vpcId,
                    environment: this.environmentSuffix,
                    tags: this.tags
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
                    tags: this.tags
                },
                providerOpts([this.regionalNetworks[region], this.regionalSecurity[region]])
            );

            console.log(`Creating Monitoring Infrastructure for ${region}...`);
            this.regionalMonitoring[region] = new MonitoringInfrastructure(
                `monitoring-${regionSuffix}-${environmentSuffix}`,
                {
                    instanceIds: this.regionalCompute[region].instanceIds,
                    environment: this.environmentSuffix,
                    region: region,
                    tags: this.tags
                },
                providerOpts([this.regionalNetworks[region], this.regionalSecurity[region], this.regionalCompute[region]])
            );
        });

        console.log('Exporting Outputs for Multi-Region Deployment...');

        pulumi.export("deployed_regions", this.regions);
        pulumi.export("total_regions", this.regions.apply(r => r.length));
        pulumi.export("environment", this.environmentSuffix);
        pulumi.export("tags", this.tags);

        this.regions.apply(regions => {
            if (regions && regions.length > 0) {
                const primaryRegion = regions[0];
                pulumi.export("primary_region", primaryRegion);
                pulumi.export("primary_vpc_id", this.regionalNetworks[primaryRegion].vpcId);
                pulumi.export("primary_instance_ids", this.regionalCompute[primaryRegion].instanceIds);
                pulumi.export("primary_web_server_sg_id", this.regionalSecurity[primaryRegion].webServerSgId);
                pulumi.export("primary_dashboard_name", this.regionalMonitoring[primaryRegion].dashboardName);
            }
        });
        
        const allRegionsData = this.regions.apply(regions => {
            const outputs: { [key: string]: any } = {};
            regions.forEach(region => {
                outputs[region] = {
                    vpcId: this.regionalNetworks[region].vpcId,
                    instanceIds: this.regionalCompute[region].instanceIds,
                    securityGroupId: this.regionalSecurity[region].webServerSgId,
                    dashboardName: this.regionalMonitoring[region].dashboardName,
                };
            });
            return outputs;
        });

        pulumi.export("all_regions_data", allRegionsData);

        this.registerOutputs({});
    }
}