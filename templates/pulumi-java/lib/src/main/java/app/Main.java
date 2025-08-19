package app;

import com.pulumi.Pulumi;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;

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
        Pulumi.run(ctx -> {
            // Create an S3 bucket with development tags
            Bucket bucket = new Bucket("java-app-bucket", BucketArgs.builder()
                    .tags(Map.of("Environment", "development", 
                               "Project", "pulumi-java-template",
                               "ManagedBy", "pulumi"))
                    .build());

            // Export important values for reference
            ctx.export("bucketName", bucket.id());
        });
    }
}