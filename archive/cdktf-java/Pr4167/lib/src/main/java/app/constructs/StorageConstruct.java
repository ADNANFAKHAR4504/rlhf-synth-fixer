package app.constructs;

import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3BucketConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfiguration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRule;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlockConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationAConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningAConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class StorageConstruct extends BaseConstruct {

    private final S3Bucket bucket;

    public StorageConstruct(final Construct scope, final String id) {
        super(scope, id);

        // S3 bucket for long-term storage
        this.bucket = new S3Bucket(this, "log-bucket", S3BucketConfig.builder()
                .bucket(getResourcePrefix() + "-logs-" + System.currentTimeMillis())
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-logs",
                        "Purpose", "Long-term log storage"
                )))
                .build());

        // Bucket versioning
        new S3BucketVersioningA(this, "bucket-versioning", S3BucketVersioningAConfig.builder()
                .bucket(bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build());

        // Server-side encryption
        new S3BucketServerSideEncryptionConfigurationA(this, "bucket-encryption",
                S3BucketServerSideEncryptionConfigurationAConfig.builder()
                        .bucket(bucket.getId())
                        .rule(List.of(S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                .applyServerSideEncryptionByDefault(
                                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                .sseAlgorithm("AES256")
                                                .build())
                                .build()))
                        .build());

        // Lifecycle rules for cost optimization
        new S3BucketLifecycleConfiguration(this, "bucket-lifecycle",
                S3BucketLifecycleConfigurationConfig.builder()
                        .bucket(bucket.getId())
                        .rule(List.of(S3BucketLifecycleConfigurationRule.builder()
                                .id("archive-old-logs")
                                .status("Enabled")
                                .transition(List.of(
                                        S3BucketLifecycleConfigurationRuleTransition.builder()
                                                .days(30)
                                                .storageClass("STANDARD_IA")
                                                .build(),
                                        S3BucketLifecycleConfigurationRuleTransition.builder()
                                                .days(90)
                                                .storageClass("GLACIER")
                                                .build()
                                ))
                                .build()))
                        .build());

        // Block public access
        new S3BucketPublicAccessBlock(this, "bucket-pab", S3BucketPublicAccessBlockConfig.builder()
                .bucket(bucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());
    }

    public S3Bucket getBucket() {
        return bucket;
    }
}
