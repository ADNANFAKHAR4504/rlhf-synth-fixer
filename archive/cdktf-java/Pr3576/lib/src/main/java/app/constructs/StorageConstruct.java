package app.constructs;

import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRule;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilter;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfiguration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class StorageConstruct extends Construct {

    private final S3Bucket assetsBucket;

    private final S3Bucket backupBucket;

    public StorageConstruct(final Construct scope, final String id, final String kmsKeyArn) {
        super(scope, id);

        // Create assets bucket
        this.assetsBucket = createS3Bucket("assets", "web-app-assets", kmsKeyArn);

        // Create backup bucket
        this.backupBucket = createS3Bucket("backup", "web-app-backups", kmsKeyArn);

        // Configure lifecycle policies
        configureLifecyclePolicy(assetsBucket.getId(), "assets");
        configureLifecyclePolicy(backupBucket.getId(), "backup");
    }

    private S3Bucket createS3Bucket(final String bucketId, final String bucketName, final String kmsKeyArn) {
        S3Bucket bucket = S3Bucket.Builder.create(this, bucketId + "-bucket".toLowerCase())
                .bucket(bucketName + "-" + System.currentTimeMillis())
                .tags(Map.of(
                        "Name", bucketName,
                        "Environment", "Production"
                ))
                .build();

        // Enable versioning
        S3BucketVersioningA.Builder.create(this, bucketId + "-versioning")
                .bucket(bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build();

        // Enable encryption
        S3BucketServerSideEncryptionConfigurationA.Builder.create(this, bucketId + "-encryption")
                .bucket(bucket.getId())
                .rule(List.of(
                        S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                .applyServerSideEncryptionByDefault(
                                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                .sseAlgorithm("aws:kms")
                                                .kmsMasterKeyId(kmsKeyArn)
                                                .build())
                                .bucketKeyEnabled(true)
                                .build()
                ))
                .build();

        // Block public access
        S3BucketPublicAccessBlock.Builder.create(this, bucketId + "-public-access-block")
                .bucket(bucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build();

        return bucket;
    }

    private void configureLifecyclePolicy(final String bucketId, final String bucketType) {
        S3BucketLifecycleConfigurationRule rule;

        if ("backup".equals(bucketType)) {
            rule = S3BucketLifecycleConfigurationRule.builder()
                    .id("backup-lifecycle")
                    .status("Enabled")
                    .filter(List.of(S3BucketLifecycleConfigurationRuleFilter.builder()
                            .prefix("")
                            .build()))
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
                    .expiration(List.of(S3BucketLifecycleConfigurationRuleExpiration.builder()
                            .days(365)
                            .build()))
                    .build();
        } else {
            rule = S3BucketLifecycleConfigurationRule.builder()
                    .id("assets-lifecycle")
                    .status("Enabled")
                    .filter(List.of(S3BucketLifecycleConfigurationRuleFilter.builder()
                            .prefix("")
                            .build()))
                    .transition(List.of(
                            S3BucketLifecycleConfigurationRuleTransition.builder()
                                    .days(60)
                                    .storageClass("STANDARD_IA")
                                    .build()
                    ))
                    .noncurrentVersionTransition(List.of(
                            S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition.builder()
                                    .noncurrentDays(30)
                                    .storageClass("STANDARD_IA")
                                    .build()
                    ))
                    .noncurrentVersionExpiration(List.of(
                            S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration.builder()
                                    .noncurrentDays(90)
                                    .build()))
                    .build();
        }

        S3BucketLifecycleConfiguration.Builder.create(this, bucketType + "-lifecycle")
                .bucket(bucketId)
                .rule(List.of(rule))
                .build();
    }

    // Getters
    public S3Bucket getAssetsBucket() {
        return assetsBucket;
    }

    public S3Bucket getBackupBucket() {
        return backupBucket;
    }
}
