package app;

import app.components.ComputeStack;
import app.components.NetworkStack;
import app.components.SecurityStack;
import app.components.StorageStack;
import app.config.AppConfig;
import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.resources.ComponentResourceOptions;

import java.util.Map;

/**
 * Main class for Java Pulumi infrastructure as code.
 * 
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
 * It creates a simple S3 bucket as an example.
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
    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources to be created.
     * 
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     * 
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(final Context ctx) {

        AppConfig config = new AppConfig(ctx);

        var primaryProvider = new Provider("primary-provider",
                ProviderArgs.builder()
                        .region(config.getPrimaryRegion())
                        .build());

        var secondaryProvider = new Provider("secondary-provider",
                ProviderArgs.builder()
                        .region(config.getSecondaryRegion())
                        .build());

        Map<String, Provider> providers = Map.of(
                "primary", primaryProvider,
                "secondary", secondaryProvider
        );

        providers.forEach((region, provider) -> {

            var options = ComponentResourceOptions.builder()
                    .provider(provider)
                    .build();

            // Deploy Network Stack
            var networkStack = new NetworkStack(region + "-network", config, options);

            // Deploy Security Stack
            var securityStack = new SecurityStack(region + "-security",
                    networkStack.getVpcId(), config, options);

            // Deploy Storage Stack
            var storageStack = new StorageStack(region + "-storage", config, options);

            // Deploy Compute Stack
            var computeStack = new ComputeStack(region + "-compute",
                    networkStack.getPublicSubnetPrimaryId(),
                    securityStack.getWebSecurityGroupId(),
                    storageStack.getInstanceProfileName(),
                    config, options);

            // Export outputs
            ctx.export(region + "-vpcId", networkStack.getVpcId());
            ctx.export(region + "-publicSubnetPrimaryId", networkStack.getPublicSubnetPrimaryId());
            ctx.export(region + "-publicSubnetSecondaryId", networkStack.getPublicSubnetSecondaryId());
            ctx.export(region + "-privateSubnetPrimaryId", networkStack.getPrivateSubnetPrimaryId());
            ctx.export(region + "-privateSubnetSecondaryId", networkStack.getPrivateSubnetSecondaryId());
            ctx.export(region + "-internetGatewayId", networkStack.getInternetGatewayId());
            ctx.export(region + "-publicRouteTableId", networkStack.getPublicRouteTableId());
            ctx.export(region + "-webSecurityGroupId", securityStack.getWebSecurityGroupId());
            ctx.export(region + "-bucketId", storageStack.getBucketId());
            ctx.export(region + "-bucketArn", storageStack.getBucketArn());
            ctx.export(region + "-iamRoleArn", storageStack.getIamRoleArn());
            ctx.export(region + "-instanceProfileName", storageStack.getInstanceProfileName());
            ctx.export(region + "-instanceId", computeStack.getInstanceId());
            ctx.export(region + "-publicIp", computeStack.getPublicIp());
        });
    }
}