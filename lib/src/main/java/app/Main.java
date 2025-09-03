package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import app.components.IamComponent;
import app.components.AuditingComponent;
import app.components.NetworkingComponent;
import app.components.ComputeComponent;
import app.components.StorageComponent;

import java.util.List;
import java.util.Arrays;

/**
 * Main class for Java Pulumi infrastructure as code.
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
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
     * <p>
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
     * <p>
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     *
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(final Context ctx) {

        String stackName = ctx.stackName().toLowerCase();

        List<String> allowedRegions = Arrays.asList("us-west-2", "us-east-1");
        String currentRegion = ctx.config().get("aws:region").orElse("us-west-2");

        // Validate region
        if (!allowedRegions.contains(currentRegion)) {
            throw new IllegalArgumentException(
                    String.format("Deployment only allowed in regions: %s. Current region: %s",
                            allowedRegions, currentRegion)
            );
        }

        // Create IAM components first (needed for other resources)
        var iamComponent = new IamComponent("iam-" + stackName, currentRegion);

        // Create networking infrastructure
        var networkingComponent = new NetworkingComponent("networking-" + stackName, currentRegion);

        // Create storage with encryption
        var storageComponent = new StorageComponent("storage-" + stackName, currentRegion);

        // Create compute resources
        var computeComponent = new ComputeComponent("compute-" + stackName,
                networkingComponent,
                iamComponent,
                currentRegion);

        // Enable auditing and compliance
        var auditingComponent = new AuditingComponent("auditing-" + stackName,
                storageComponent,
                currentRegion);

        // Export important outputs
        ctx.export("vpcId", networkingComponent.getVpcId());
        ctx.export("publicSubnetIds", networkingComponent.getPublicSubnetIds());
        ctx.export("privateSubnetIds", networkingComponent.getPrivateSubnetIds());
        ctx.export("ec2InstanceIds", computeComponent.getInstanceIds());
        ctx.export("s3BucketNames", storageComponent.getBucketNames());
        ctx.export("cloudTrailArn", auditingComponent.getCloudTrailArn());
    }
}