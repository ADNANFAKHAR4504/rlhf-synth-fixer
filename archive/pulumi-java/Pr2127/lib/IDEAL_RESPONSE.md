```java

// app.TapStack

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

// app.Main

package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import app.TapStack;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Main class for Java Pulumi infrastructure as code.
 * 
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
 * It creates a comprehensive multi-region infrastructure stack including:
 * - Identity and Access Management (IAM)
 * - Networking (VPC, Subnets, Security Groups)
 * - Elastic Beanstalk applications
 * - Monitoring and logging
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {
    
    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }
    
    /**
     * Main entry point for the Pulumi program.
     * 
     * This method defines the infrastructure resources to be created.
     * Pulumi will execute this code to determine what resources to create,
     * update, or delete based on the current state.
     * 
     * @param args Command line arguments (not used in this example)
     */
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources to be created.
     * 
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     * 
     * Creates a TapStack which orchestrates all infrastructure components
     * across multiple AWS regions with proper tagging and configuration.
     * 
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(Context ctx) {
        // Define default tags for all resources
        Map<String, String> defaultTags = new HashMap<>();
        defaultTags.put("Environment", "production");
        defaultTags.put("Project", "IaC-AWS-Nova-Model-Breaking");
        defaultTags.put("Application", "nova-web-app");
        defaultTags.put("ManagedBy", "Pulumi");
        defaultTags.put("Team", "Infrastructure");
        defaultTags.put("CostCenter", "Engineering");

        // Create the main infrastructure stack
        // This will create all AWS resources across specified regions
        var tapStack = new TapStack("tap-stack", new TapStack.TapStackArgs()
                .setEnvironmentSuffix("prod")
                .setRegions(Arrays.asList("us-east-1", "us-west-1"))
                .setTags(defaultTags)
        );

        // Export high-level stack information (wrap in Output.of)
        ctx.export("environmentSuffix", Output.of(tapStack.getEnvironmentSuffix()));
        ctx.export("deployedRegions", Output.of(tapStack.getRegions()));
        ctx.export("stackTags", Output.of(tapStack.getTags()));
        
        // Export identity infrastructure outputs
        ctx.export("identityRoleArn", tapStack.getIdentity().getEbServiceRoleArn());
        ctx.export("instanceProfileName", tapStack.getIdentity().getEbInstanceProfileName());

        // Export regional infrastructure outputs
        // This provides access to VPC IDs, application URLs, and other regional resources
        tapStack.getRegions().forEach(region -> {
            var networking = tapStack.getRegionalNetworks().get(region);
            var elasticBeanstalk = tapStack.getRegionalElasticBeanstalk().get(region);
            var monitoring = tapStack.getRegionalMonitoring().get(region);

            // Networking outputs
            ctx.export(region + "-vpcId", networking.getVpcId());
            ctx.export(region + "-publicSubnetIds", networking.getPublicSubnetIds());
            ctx.export(region + "-privateSubnetIds", networking.getPrivateSubnetIds());
            ctx.export(region + "-albSecurityGroupId", networking.getAlbSecurityGroupId());
            ctx.export(region + "-ebSecurityGroupId", networking.getEbSecurityGroupId());

            // Elastic Beanstalk outputs
            ctx.export(region + "-applicationName", elasticBeanstalk.getApplicationName());
            ctx.export(region + "-environmentName", elasticBeanstalk.getEnvironmentName());
            ctx.export(region + "-applicationUrl", elasticBeanstalk.getApplicationUrl());
            ctx.export(region + "-loadBalancerUrl", elasticBeanstalk.getLoadBalancerUrl());

            // Monitoring outputs
            ctx.export(region + "-logGroupName", monitoring.getLogGroupName());
            ctx.export(region + "-dashboardUrl", monitoring.getDashboardUrl());
        });

        // Export summary information for easy access (wrap in Output.of)
        ctx.export("primaryRegion", Output.of(tapStack.getRegions().get(0)));
        ctx.export("totalRegions", Output.of(tapStack.getRegions().size()));
        
        // Export primary region application URL for quick access
        if (!tapStack.getRegions().isEmpty()) {
            String primaryRegion = tapStack.getRegions().get(0);
            var primaryEB = tapStack.getRegionalElasticBeanstalk().get(primaryRegion);
            ctx.export("primaryApplicationUrl", primaryEB.getApplicationUrl());
        }
    }
}

// app.ElasticBeanStalkInfrastructure
package app;

import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import com.pulumi.aws.elasticbeanstalk.Application;
import com.pulumi.aws.elasticbeanstalk.ApplicationArgs;
import com.pulumi.aws.elasticbeanstalk.ConfigurationTemplate;
import com.pulumi.aws.elasticbeanstalk.ConfigurationTemplateArgs;
import com.pulumi.aws.elasticbeanstalk.Environment;
import com.pulumi.aws.elasticbeanstalk.EnvironmentArgs;
import com.pulumi.aws.elasticbeanstalk.inputs.ConfigurationTemplateSettingArgs;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

/**
 * Elastic Beanstalk Infrastructure Component
 * Handles EB Application, Configuration Template, and Environment
 */
public class ElasticBeanstalkInfrastructure extends ComponentResource {
    public static class ElasticBeanstalkInfrastructureArgs {
        private final String region;
        private final boolean isPrimary;
        private final String environment;
        private final String environmentSuffix;
        private final Output<String> vpcId;
        private final Output<List<String>> publicSubnetIds;
        private final Output<List<String>> privateSubnetIds;
        private final Output<String> albSecurityGroupId;
        private final Output<String> ebSecurityGroupId;
        private final Output<String> ebServiceRoleArn;
        private final Output<String> ebInstanceProfileName;
        private final Map<String, String> tags;

        public ElasticBeanstalkInfrastructureArgs(
            String region,
            boolean isPrimary,
            String environment,
            String environmentSuffix,
            Output<String> vpcId,
            Output<List<String>> publicSubnetIds,
            Output<List<String>> privateSubnetIds,
            Output<String> albSecurityGroupId,
            Output<String> ebSecurityGroupId,
            Output<String> ebServiceRoleArn,
            Output<String> ebInstanceProfileName,
            Map<String, String> tags) {

            this.region = region;
            this.isPrimary = isPrimary;
            this.environment = environment;
            this.environmentSuffix = environmentSuffix;
            this.vpcId = vpcId;
            this.publicSubnetIds = publicSubnetIds;
            this.privateSubnetIds = privateSubnetIds;
            this.albSecurityGroupId = albSecurityGroupId;
            this.ebSecurityGroupId = ebSecurityGroupId;
            this.ebServiceRoleArn = ebServiceRoleArn;
            this.ebInstanceProfileName = ebInstanceProfileName;
            this.tags = tags;
        }

        // Getters
        public String getRegion() { return region; }
        public boolean getIsPrimary() { return isPrimary; }
        public String getEnvironment() { return environment; }
        public String getEnvironmentSuffix() { return environmentSuffix; }
        public Output<String> getVpcId() { return vpcId; }
        public Output<List<String>> getPublicSubnetIds() { return publicSubnetIds; }
        public Output<List<String>> getPrivateSubnetIds() { return privateSubnetIds; }
        public Output<String> getAlbSecurityGroupId() { return albSecurityGroupId; }
        public Output<String> getEbSecurityGroupId() { return ebSecurityGroupId; }
        public Output<String> getEbServiceRoleArn() { return ebServiceRoleArn; }
        public Output<String> getEbInstanceProfileName() { return ebInstanceProfileName; }
        public Map<String, String> getTags() { return tags; }
    }

    private final String region;
    private final boolean isPrimary;
    private final String environment;
    private final String environmentSuffix;
    private final Map<String, String> tags;
    private final String regionSuffix;

    public final Application application;
    public final ConfigurationTemplate configTemplate;
    public final Environment ebEnvironment;

    public ElasticBeanstalkInfrastructure(String name, ElasticBeanstalkInfrastructureArgs args) {
        this(name, args, null);
    }

    public ElasticBeanstalkInfrastructure(String name, ElasticBeanstalkInfrastructureArgs args, ComponentResourceOptions opts) {
        super("nova:infrastructure:ElasticBeanstalk", name, opts);

        this.region = args.getRegion();
        this.isPrimary = args.getIsPrimary();
        this.environment = args.getEnvironment();
        this.environmentSuffix = args.getEnvironmentSuffix();
        this.tags = args.getTags();
        this.regionSuffix = args.getRegion().replace("-", "").replace("gov", "");

        this.application = createApplication();
        this.configTemplate = createConfigurationTemplate(args);
        this.ebEnvironment = createEnvironment();

        this.registerOutputs(Map.of(
            "applicationName", this.application.name(),
            "environmentName", this.ebEnvironment.name(),
            "environmentUrl", this.ebEnvironment.endpointUrl(),
            "environmentCname", this.ebEnvironment.cname()
        ));
    }

    private Application createApplication() {
        return new Application(
            "nova-app-" + this.regionSuffix,
            ApplicationArgs.builder()
                .name("nova-app-" + this.regionSuffix)
                .description("Nova application for " + this.region)
                .tags(this.tags)
                .build(),
            CustomResourceOptions.builder().parent(this).build()
        );
    }

    private String getSolutionStackName() {
        return "64bit Amazon Linux 2023 v4.6.3 running Docker";
    }

    private ConfigurationTemplate createConfigurationTemplate(ElasticBeanstalkInfrastructureArgs args) {
        // Convert subnet Output<List<String>> to comma-separated Output<String>
        Output<String> publicSubnetsString = args.getPublicSubnetIds()
            .apply(subnets -> Output.of(String.join(",", subnets)));
        Output<String> privateSubnetsString = args.getPrivateSubnetIds()
            .apply(subnets -> Output.of(String.join(",", subnets)));

        String solutionStackName = getSolutionStackName();
        System.out.println("🐳 Using Elastic Beanstalk solution stack: " + solutionStackName);

        List<ConfigurationTemplateSettingArgs> settings = new ArrayList<>();

        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:ec2:vpc")
            .name("VPCId")
            .value(args.getVpcId())
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:ec2:vpc")
            .name("Subnets")
            .value(privateSubnetsString)
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:ec2:vpc")
            .name("ELBSubnets")
            .value(publicSubnetsString)
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:launchconfiguration")
            .name("InstanceType")
            .value("t3.medium")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:launchconfiguration")
            .name("IamInstanceProfile")
            .value(args.getEbInstanceProfileName())
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:launchconfiguration")
            .name("SecurityGroups")
            .value(args.getEbSecurityGroupId())
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:asg")
            .name("MinSize")
            .value("2")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:asg")
            .name("MaxSize")
            .value("10")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:elasticbeanstalk:environment")
            .name("EnvironmentType")
            .value("LoadBalanced")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:elasticbeanstalk:environment")
            .name("LoadBalancerType")
            .value("application")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:elbv2:loadbalancer")
            .name("SecurityGroups")
            .value(args.getAlbSecurityGroupId())
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:elasticbeanstalk:environment")
            .name("ServiceRole")
            .value(args.getEbServiceRoleArn())
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:elasticbeanstalk:healthreporting:system")
            .name("SystemType")
            .value("enhanced")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:updatepolicy:rollingupdate")
            .name("RollingUpdateEnabled")
            .value("true")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:updatepolicy:rollingupdate")
            .name("MaxBatchSize")
            .value("1")
            .build());
        settings.add(ConfigurationTemplateSettingArgs.builder()
            .namespace("aws:autoscaling:updatepolicy:rollingupdate")
            .name("MinInstancesInService")
            .value("1")
            .build());

        // Use CustomResourceOptions for AWS resources
        return new ConfigurationTemplate(
            "nova-config-" + this.regionSuffix,
            ConfigurationTemplateArgs.builder()
                .name("nova-config-" + this.regionSuffix)
                .application(this.application.name())
                .solutionStackName(solutionStackName)
                .settings(settings)
                .build(),
            CustomResourceOptions.builder().parent(this).build()
        );
    }

    private Environment createEnvironment() {
        String envName = "nova-env-" + this.regionSuffix + "-" + this.environmentSuffix;
        System.out.println("🚀 Creating Elastic Beanstalk environment: " + envName);
        return new Environment(
            "nova-env-" + this.regionSuffix,
            EnvironmentArgs.builder()
                .name(envName)
                .application(this.application.name())
                .templateName(this.configTemplate.name())
                .tier("WebServer")
                .tags(this.tags)
                .build(),
            CustomResourceOptions.builder().parent(this).build()
        );
    }

    public Application getApplication() { return this.application; }
    public ConfigurationTemplate getConfigTemplate() { return this.configTemplate; }
    public Environment getEbEnvironment() { return this.ebEnvironment; }
    public Output<String> getApplicationName() { return this.application.name(); }
    public Output<String> getEnvironmentName() { return this.ebEnvironment.name(); }
    public Output<String> getEnvironmentUrl() { return this.ebEnvironment.endpointUrl(); }
    public Output<String> getEnvironmentCname() { return this.ebEnvironment.cname(); }

    // These two methods allow Main.java to call .getApplicationUrl() and .getLoadBalancerUrl() on this class
    public Output<String> getApplicationUrl() { return this.ebEnvironment.endpointUrl(); }
    public Output<String> getLoadBalancerUrl() { return this.ebEnvironment.cname(); }
}