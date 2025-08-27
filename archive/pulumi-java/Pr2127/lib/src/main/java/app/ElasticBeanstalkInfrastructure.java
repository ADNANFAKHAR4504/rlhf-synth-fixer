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