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