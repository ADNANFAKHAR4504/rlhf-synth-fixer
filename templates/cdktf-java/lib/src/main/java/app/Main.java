package app;

import com.hashicorp.cdktf.S3Backend;
import com.hashicorp.cdktf.S3BackendConfig;

import com.hashicorp.cdktf.App;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();

        // Get environment variables for tagging
        String environmentSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");
        String repositoryName = System.getenv().getOrDefault("REPOSITORY", "unknown");
        String commitAuthor = System.getenv().getOrDefault("COMMIT_AUTHOR", "unknown");
        String prNumber = System.getenv().getOrDefault("PR_NUMBER", "unknown");
        String team = System.getenv().getOrDefault("TEAM", "unknown");

        // Create default tags
        Map<String, String> defaultTags = Map.of(
                "Environment", environmentSuffix,
                "Repository", repositoryName,
                "Author", commitAuthor,
                "PRNumber", prNumber,
                "Team", team,
                "CreatedAt", ZonedDateTime.now(ZoneOffset.UTC)
                        .format(DateTimeFormatter.ISO_INSTANT)
        );

        MainStack stack = new MainStack(app, "cdktf-java-" + environmentSuffix, defaultTags);

        /*
         * Configures S3 backend for remote Terraform state storage.
         */
        new S3Backend(stack, S3BackendConfig.builder()
                .bucket(System.getenv("TERRAFORM_STATE_BUCKET"))
                .key("prs/" + environmentSuffix + "/" + stack.getStackId() + ".tfstate")
                .region(System.getenv().getOrDefault("TERRAFORM_STATE_BUCKET_REGION", "us-east-1"))
                .encrypt(true)
                .build());

        app.synth();
    }
}