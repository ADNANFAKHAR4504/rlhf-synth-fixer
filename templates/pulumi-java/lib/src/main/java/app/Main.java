package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.inputs.ProviderDefaultTagsArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.resources.CustomResourceOptions;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
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
    static void defineInfrastructure(Context ctx) {
        // Get environment variables for tagging
        String environmentSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");
        String repositoryName = System.getenv().getOrDefault("REPOSITORY", "unknown");
        String commitAuthor = System.getenv().getOrDefault("COMMIT_AUTHOR", "unknown");
        String prNumber = System.getenv().getOrDefault("PR_NUMBER", "unknown");
        String team = System.getenv().getOrDefault("TEAM", "unknown");
        String awsRegion = System.getenv().getOrDefault("AWS_REGION", "us-east-1");

        // Create default tags
        Map<String, String> defaultTags = Map.of(
                "Environment", environmentSuffix,
                "Repository", repositoryName,
                "Author", commitAuthor,
                "PRNumber", prNumber,
                "Team", team,
                "CreateAt", ZonedDateTime.now(ZoneOffset.UTC)
                        .format(DateTimeFormatter.ISO_INSTANT)
        );

        // Configure AWS provider with default tags
        Provider provider = new Provider("aws", ProviderArgs.builder()
                .region(awsRegion)
                .defaultTags(List.of(AwsProviderDefaultTags.builder()
                        .tags(defaultTags)
                        .build()))
                .build());

        Bucket bucket = new Bucket("java-app-bucket", BucketArgs.builder()
                .tags(Map.of(
                        "Environment", environmentSuffix,
                        "Project", "pulumi-java-template",
                        "ManagedBy", "pulumi"))
                .build(), CustomResourceOptions.builder()
                .provider(provider)
                .build());

        ctx.export("bucketName", bucket.id());
    }
}