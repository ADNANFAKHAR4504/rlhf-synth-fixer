package app.components;

import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.inputs.GetCallerIdentityArgs;
import com.pulumi.aws.outputs.GetCallerIdentityResult;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationArgs;
import com.pulumi.aws.s3.BucketVersioningArgs;
import com.pulumi.core.Output;
import com.pulumi.aws.kms.Alias;
import com.pulumi.aws.kms.AliasArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketLifecycleConfiguration;
import com.pulumi.aws.s3.BucketLifecycleConfigurationArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfiguration;
import com.pulumi.aws.s3.BucketVersioning;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationRuleArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationRuleExpirationArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationRuleTransitionArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleArgs;
import com.pulumi.aws.s3.inputs.BucketVersioningVersioningConfigurationArgs;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StorageComponent extends ComponentResource {
    private final Key kmsKey;
    private final List<Bucket> buckets;
    private final Bucket cloudTrailBucket;
    private final Output<String> accountId;

    public StorageComponent(final String name, final String region) {
        this(name, region, null);
    }

    public StorageComponent(final String name, final String region, final ComponentResourceOptions opts) {
        super("custom:infrastructure:StorageComponent", name, opts);

        var identity = AwsFunctions.getCallerIdentity(GetCallerIdentityArgs.builder().build());

        this.accountId = identity.applyValue(GetCallerIdentityResult::accountId);

        // Create KMS Customer Managed Key for S3 encryption
        this.kmsKey = createKmsKey(name, region);

        // Create KMS key alias for easier reference
        new Alias(name + "-s3-kms-alias", AliasArgs.builder()
                .name("alias/" + name + "-s3-encryption")
                .targetKeyId(kmsKey.keyId())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Create secure S3 buckets for different purposes
        this.buckets = createSecureBuckets(name);

        // Create dedicated CloudTrail bucket
        this.cloudTrailBucket = createCloudTrailBucket(name);
    }

    private Key createKmsKey(final String name, final String region) {
        return new Key(name + "-s3-kms-key", KeyArgs.builder()
                .description("KMS Customer Managed Key for S3 bucket encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .enableKeyRotation(true)
                .policy(accountId.applyValue(this::createKmsKeyPolicy))
                .tags(getTags(name + "-s3-kms-key", "KMSKey", Map.of("Purpose", "S3Encryption")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private String createKmsKeyPolicy(final String accountIdParam) {
        return """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "arn:aws:iam::%s:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow S3 Service",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "s3.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey",
                            "kms:GenerateDataKeyWithoutPlaintext",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudTrail Service",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            """.formatted(accountIdParam);
    }

    private List<Bucket> createSecureBuckets(final String name) {
        var secureBuckets = new ArrayList<Bucket>();
        var bucketPurposes = List.of("critical-data", "application-logs", "backup-data", "compliance-archive");

        bucketPurposes.forEach(purpose -> {
            var bucket = createSecureBucket(name + "-" + purpose, purpose);
            secureBuckets.add(bucket);
        });

        return secureBuckets;
    }

    private Bucket createCloudTrailBucket(final String name) {
        return createSecureBucket(name + "-cloudtrail-logs", "cloudtrail");
    }

    private Bucket createSecureBucket(final String bucketName, final String purpose) {
        var timestamp = String.valueOf(System.currentTimeMillis());
        var uniqueBucketName = bucketName + "-" + timestamp;

        // Create S3 bucket
        var bucket = new Bucket(bucketName, BucketArgs.builder()
                .bucket(uniqueBucketName)
                .tags(getTags(bucketName, "S3Bucket", Map.of(
                        "Purpose", purpose,
                        "Encryption", "KMS-CMK",
                        "DataClassification", purpose.contains("critical") ? "Confidential" : "Internal"
                )))
                .forceDestroy(true)
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Enable versioning for data protection (but not for CloudTrail buckets to ease deletion)
        if (!purpose.equals("cloudtrail")) {
            new BucketVersioning(bucketName + "-versioning", BucketVersioningArgs.builder()
                    .bucket(bucket.id())
                    .versioningConfiguration(BucketVersioningVersioningConfigurationArgs.builder()
                            .status("Enabled")
                            .build())
                    .build(), CustomResourceOptions.builder().parent(this).build());
        }

        // Configure server-side encryption with KMS CMK
        new BucketServerSideEncryptionConfiguration(bucketName + "-encryption",
                BucketServerSideEncryptionConfigurationArgs.builder()
                        .bucket(bucket.id())
                        .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                                .applyServerSideEncryptionByDefault(
                                        BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                                                .sseAlgorithm("aws:kms")
                                                .kmsMasterKeyId(kmsKey.arn())
                                                .build())
                                .bucketKeyEnabled(true)
                                .build())
                        .build(), CustomResourceOptions.builder().parent(this).build());

        // Block all public access
        new BucketPublicAccessBlock(bucketName + "-pab", BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Add lifecycle configuration for cost optimization
        createBucketLifecycle(bucketName, bucket, purpose);

        return bucket;
    }

    private void createBucketLifecycle(final String bucketName, final Bucket bucket, final String purpose) {
        var lifecycleRules = new ArrayList<BucketLifecycleConfigurationRuleArgs>();

        // Standard lifecycle rule
        lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                .id("standard-lifecycle")
                .status("Enabled")
                .transitions(
                        BucketLifecycleConfigurationRuleTransitionArgs.builder()
                                .days(30)
                                .storageClass("STANDARD_IA")
                                .build(),
                        BucketLifecycleConfigurationRuleTransitionArgs.builder()
                                .days(90)
                                .storageClass("GLACIER")
                                .build()
                )
                .build());

        // Add cleanup rules for multipart uploads and optionally versioned objects
        if (purpose.equalsIgnoreCase("cloudtrail")) {
            // For CloudTrail buckets, only clean up multipart uploads since versioning is disabled
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("cleanup-multipart")
                    .status("Enabled")
                    .abortIncompleteMultipartUpload(
                            BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs.builder()
                            .daysAfterInitiation(1)
                            .build())
                    .build());
        } else {
            // For other buckets with versioning enabled, clean up versions and multipart uploads
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("cleanup-versions")
                    .status("Enabled")
                    .noncurrentVersionExpiration(
                            BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs.builder()
                            .noncurrentDays(1)
                            .build())
                    .abortIncompleteMultipartUpload(
                            BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs.builder()
                            .daysAfterInitiation(1)
                            .build())
                    .build());
        }

        // Add retention rules for compliance data
        if (purpose.toLowerCase().contains("compliance") || purpose.contains("audit")) {
            // Keep compliance data for 7 years
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("compliance-retention")
                    .status("Enabled")
                    .expiration(BucketLifecycleConfigurationRuleExpirationArgs.builder()
                            .days(2555) // 7 years
                            .build())
                    .build());
        } else if (purpose.toLowerCase().contains("cloudtrail")) {
            // For CloudTrail buckets, keep logs for 90 days for testing
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("cloudtrail-cleanup")
                    .status("Enabled")
                    .expiration(BucketLifecycleConfigurationRuleExpirationArgs.builder()
                            .days(90)
                            .build())
                    .noncurrentVersionExpiration(
                            BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs.builder()
                                    .noncurrentDays(90) // keep old versions for retention
                                    .build())
                    .build());
        }

        new BucketLifecycleConfiguration(bucketName + "-lifecycle",
                BucketLifecycleConfigurationArgs.builder()
                        .bucket(bucket.id())
                        .rules(lifecycleRules)
                        .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Map<String, String> getTags(final String name, final String resourceType, final Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure",
                "BackupRequired", "true"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    // Getters
    public Output<String> getKmsKeyArn() {
        return kmsKey.arn();
    }

    public Output<List<String>> getBucketNames() {
        return Output.all(buckets.stream().map(Bucket::bucket).toList())
                .applyValue(ArrayList::new);
    }

    public Output<String> getCloudTrailBucketName() {
        return cloudTrailBucket.bucket();
    }
}