package app;

import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.s3.*;
import software.constructs.Construct;

import java.util.List;

/**
 * Properties for configuring the S3 stack.
 */
class S3StackProps {
    private final String environmentSuffix;
    private final NestedStackProps nestedStackProps;

    private S3StackProps(String environmentSuffix, NestedStackProps nestedStackProps) {
        this.environmentSuffix = environmentSuffix;
        this.nestedStackProps = nestedStackProps != null ? nestedStackProps : NestedStackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public NestedStackProps getNestedStackProps() {
        return nestedStackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private NestedStackProps nestedStackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder nestedStackProps(NestedStackProps nestedStackProps) {
            this.nestedStackProps = nestedStackProps;
            return this;
        }

        public S3StackProps build() {
            return new S3StackProps(environmentSuffix, nestedStackProps);
        }
    }
}

/**
 * S3 Stack for creating storage infrastructure.
 * 
 * This nested stack creates an S3 bucket for application logs
 * with versioning enabled and appropriate security configurations.
 */
class S3Stack extends NestedStack {
    private final Bucket logsBucket;

    /**
     * Creates a new S3 stack with application logs bucket.
     *
     * @param scope The parent construct
     * @param id The construct ID
     * @param props Stack configuration properties
     */
    public S3Stack(final Construct scope, final String id, final S3StackProps props) {
        super(scope, id, props.getNestedStackProps());

        String environmentSuffix = props.getEnvironmentSuffix();

        // Create S3 bucket for application logs with versioning
        this.logsBucket = Bucket.Builder.create(this, "ApplicationLogsBucket")
                .bucketName("cloud-env-logs-" + environmentSuffix + "-" + this.getAccount())
                .versioned(true)  // Enable versioning as requested
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)  // Security best practice
                .encryption(BucketEncryption.S3_MANAGED)  // Enable server-side encryption
                .lifecycleRules(List.of(
                    LifecycleRule.builder()
                        .id("LogsLifecycleRule")
                        .enabled(true)
                        .expiration(software.amazon.awscdk.Duration.days(90))  // Auto-delete after 90 days
                        .noncurrentVersionExpiration(software.amazon.awscdk.Duration.days(30))  // Clean old versions
                        .transitions(List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(software.amazon.awscdk.Duration.days(60))
                                .build()
                        ))
                        .build()
                ))
                .removalPolicy(RemovalPolicy.DESTROY)  // Allow bucket deletion for testing
                .autoDeleteObjects(true)  // Auto-delete objects on bucket deletion for testing
                .build();

        // Apply tags to the bucket
        Tags.of(logsBucket).add("Name", "application-logs-bucket-" + environmentSuffix);
        Tags.of(logsBucket).add("Environment", "Development");
        Tags.of(logsBucket).add("Purpose", "ApplicationLogs");
        Tags.of(this).add("Component", "Storage");
    }

    /**
     * Gets the created logs bucket.
     *
     * @return The S3 Bucket instance for application logs
     */
    public Bucket getLogsBucket() {
        return logsBucket;
    }
}