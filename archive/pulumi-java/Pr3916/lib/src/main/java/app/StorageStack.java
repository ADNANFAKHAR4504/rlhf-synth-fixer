package app;

import com.pulumi.Context;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2Args;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleTransitionArgs;

import java.util.Map;

/**
 * Storage stack for S3 bucket configuration.
 */
public class StorageStack {
    private final Bucket bucket;

    public StorageStack(final Context ctx) {
        // Create S3 bucket for article storage
        this.bucket = new Bucket("news-articles-bucket",
            BucketArgs.builder()
                .tags(Map.of(
                    "Name", "NewsArticlesBucket",
                    "Environment", "production",
                    "ManagedBy", "pulumi"
                ))
                .build());

        // Block public access
        var publicAccessBlock = new BucketPublicAccessBlock("bucket-public-access-block",
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        // Configure lifecycle policy for 120-day archival
        var lifecycleConfig = new BucketLifecycleConfigurationV2("bucket-lifecycle",
            BucketLifecycleConfigurationV2Args.builder()
                .bucket(bucket.id())
                .rules(
                    BucketLifecycleConfigurationV2RuleArgs.builder()
                        .id("archive-old-content")
                        .status("Enabled")
                        .transitions(
                            BucketLifecycleConfigurationV2RuleTransitionArgs.builder()
                                .days(120)
                                .storageClass("GLACIER")
                                .build()
                        )
                        .build()
                )
                .build());
    }

    public Bucket getBucket() {
        return bucket;
    }
}
