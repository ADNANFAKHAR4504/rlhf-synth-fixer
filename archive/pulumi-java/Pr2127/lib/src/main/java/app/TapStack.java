package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.*;
import java.util.stream.IntStream;

/**
 * Main TapStack - Orchestrates all infrastructure components
 */
public class TapStack extends ComponentResource {

    public static class TapStackArgs {
        private String environmentSuffix;
        private List<String> regions;
        private Map<String, String> tags;

        public TapStackArgs() {
            this.environmentSuffix = "prod";
            this.regions = Arrays.asList("us-east-1", "us-west-1");
            this.tags = new HashMap<>();
        }

        // Getters and setters
        public String getEnvironmentSuffix() { return environmentSuffix; }
        public TapStackArgs setEnvironmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public List<String> getRegions() { return regions; }
        public TapStackArgs setRegions(List<String> regions) {
            this.regions = regions;
            return this;
        }

        public Map<String, String> getTags() { return tags; }
        public TapStackArgs setTags(Map<String, String> tags) {
            this.tags = tags;
            return this;
        }
    }

    // Properties
    private final String environmentSuffix;
    private final List<String> regions;
    private final Map<String, String> tags;

    // Infrastructure components
    private final IdentityInfrastructure identity;
    private final Map<String, NetworkingInfrastructure> regionalNetworks;
    private final Map<String, MonitoringInfrastructure> regionalMonitoring;
    private final Map<String, ElasticBeanstalkInfrastructure> regionalElasticBeanstalk;
    private final Map<String, Provider> providers;

    public TapStack(String name, TapStackArgs args, ComponentResourceOptions opts) {
        super("nova:TapStack", name, opts);

        // Set default values
        this.environmentSuffix = args != null && args.getEnvironmentSuffix() != null
            ? args.getEnvironmentSuffix() : "prod";
        this.regions = args != null && args.getRegions() != null
            ? args.getRegions() : Arrays.asList("us-east-1", "us-west-1");

        // Initialize default tags
        Map<String, String> defaultTags = new HashMap<>();
        defaultTags.put("Environment", this.environmentSuffix);
        defaultTags.put("Project", "IaC-AWS-Nova-Model-Breaking");
        defaultTags.put("Application", "nova-web-app");
        defaultTags.put("ManagedBy", "Pulumi");

        this.tags = args != null && args.getTags() != null
            ? args.getTags() : defaultTags;

        // Initialize collections
        this.regionalNetworks = new HashMap<>();
        this.regionalMonitoring = new HashMap<>();
        this.regionalElasticBeanstalk = new HashMap<>();
        this.providers = new HashMap<>();

        System.out.println("🚀 Creating Identity and Access Infrastructure...");

        // Create shared identity infrastructure
        this.identity = new IdentityInfrastructure(
            name + "-identity",
            new IdentityInfrastructure.IdentityInfrastructureArgs()
                .setTags(this.tags),
            ComponentResourceOptions.builder()
                .parent(this)
                .build()
        );

        // Create regional infrastructure for each region
        IntStream.range(0, this.regions.size()).forEach(i -> {
            String region = this.regions.get(i);
            boolean isPrimary = i == 0; // First region is primary

            System.out.println(String.format("🌍 Setting up AWS provider for region: %s %s",
                region, isPrimary ? "(PRIMARY)" : ""));

            // Create regional AWS provider
            this.providers.put(region, new Provider(
                name + "-provider-" + region,
                ProviderArgs.builder()
                    .region(region)
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .build()
            ));

            System.out.println(String.format("🔗 Creating Networking Infrastructure for %s...", region));

            // Create regional networking
            this.regionalNetworks.put(region, new NetworkingInfrastructure(
                name + "-networking-" + region,
                new NetworkingInfrastructure.NetworkingInfrastructureArgs()
                    .setRegion(region)
                    .setIsPrimary(isPrimary)
                    .setEnvironment(this.environmentSuffix)
                    .setTags(this.tags),
                ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(this.providers.get(region))
                    .build()
            ));

            System.out.println(String.format("📊 Creating Monitoring Infrastructure for %s...", region));

            // Create regional monitoring
            this.regionalMonitoring.put(region, new MonitoringInfrastructure(
                name + "-monitoring-" + region,
                new MonitoringInfrastructure.MonitoringInfrastructureArgs()
                    .setRegion(region)
                    .setEnvironment(this.environmentSuffix)
                    .setTags(this.tags),
                ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(this.providers.get(region))
                    .build()
            ));

            System.out.println(String.format("🚀 Creating Elastic Beanstalk Infrastructure for %s...", region));

            // Create regional Elastic Beanstalk
            NetworkingInfrastructure networking = this.regionalNetworks.get(region);
            this.regionalElasticBeanstalk.put(region, new ElasticBeanstalkInfrastructure(
                name + "-eb-" + region,
                new ElasticBeanstalkInfrastructure.ElasticBeanstalkInfrastructureArgs(
                    region,
                    isPrimary,
                    this.environmentSuffix,
                    this.environmentSuffix,
                    networking.getVpcId(),
                    networking.getPublicSubnetIds(),
                    networking.getPrivateSubnetIds(),
                    networking.getAlbSecurityGroupId(),
                    networking.getEbSecurityGroupId(),
                    this.identity.getEbServiceRoleArn(),
                    this.identity.getEbInstanceProfileName(),
                    this.tags
                ),
                ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(this.providers.get(region))
                    .build()
            ));
        });

        // Register outputs
        this.registerOutputs(Map.of(
            "environmentSuffix", Output.of(this.environmentSuffix),
            "regions", Output.of(this.regions),
            "identityArn", this.identity.getEbServiceRoleArn()
        ));

        System.out.println(String.format("✅ TapStack deployment complete for regions: %s",
            String.join(", ", this.regions)));
    }

    // Constructor with default args
    public TapStack(String name) {
        this(name, new TapStackArgs(), ComponentResourceOptions.builder().build());
    }

    // Constructor with args only
    public TapStack(String name, TapStackArgs args) {
        this(name, args, ComponentResourceOptions.builder().build());
    }

    // Getters for accessing components
    public String getEnvironmentSuffix() { return environmentSuffix; }
    public List<String> getRegions() { return regions; }
    public Map<String, String> getTags() { return tags; }
    public IdentityInfrastructure getIdentity() { return identity; }
    public Map<String, NetworkingInfrastructure> getRegionalNetworks() { return regionalNetworks; }
    public Map<String, MonitoringInfrastructure> getRegionalMonitoring() { return regionalMonitoring; }
    public Map<String, ElasticBeanstalkInfrastructure> getRegionalElasticBeanstalk() { return regionalElasticBeanstalk; }
    public Map<String, Provider> getProviders() { return providers; }

}