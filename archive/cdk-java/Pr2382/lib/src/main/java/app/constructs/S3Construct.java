package app.constructs;

import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.Transition;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.s3.ObjectOwnership;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;
import app.config.EnvironmentConfig;

/**
 * S3 construct that creates secure S3 buckets with encryption, versioning,
 * and access logging enabled. All buckets follow financial services
 * security best practices.
 */
public class S3Construct extends Construct {
    
    private final Bucket dataBucket;
    private final Bucket cloudTrailBucket;
    private final Bucket accessLogsBucket;
    
    public S3Construct(final Construct scope, final String id, final IKey kmsKey) {
        super(scope, id);
        
        // Create access logs bucket first (no circular dependency)
        this.accessLogsBucket = createAccessLogsBucket(kmsKey);
        
        // Create main data bucket with access logging
        this.dataBucket = createDataBucket(kmsKey);
        
        // Create CloudTrail logs bucket
        this.cloudTrailBucket = createCloudTrailBucket(kmsKey);
    }
    
    /**
     * Creates a bucket for storing access logs from other S3 buckets.
     */
    private Bucket createAccessLogsBucket(final IKey kmsKey) {
    Bucket bucket = Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "access-logs"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.RETAIN) // Retain logs for compliance
                .lifecycleRules(java.util.List.of(
                    LifecycleRule.builder()
                        .id("AccessLogsLifecycle")
                        .enabled(true)
                        .transitions(java.util.List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(software.amazon.awscdk.Duration.days(90))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.DEEP_ARCHIVE)
                                .transitionAfter(software.amazon.awscdk.Duration.days(365))
                                .build()
                        ))
                        .build()
                ))
                .build();

        // Deny any requests that are not using secure transport (https)
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(java.util.List.of(new AnyPrincipal()))
                .actions(java.util.List.of("s3:*"))
                .resources(java.util.List.of(bucket.getBucketArn(), bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of("Bool", java.util.Map.of("aws:SecureTransport", "false")))
                .build()
        );

        return bucket;
    }
    
    /**
     * Creates the main data bucket with comprehensive security settings.
     */
    private Bucket createDataBucket(final IKey kmsKey) {
    Bucket bucket = Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "data"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .serverAccessLogsBucket(accessLogsBucket)
                .serverAccessLogsPrefix("data-bucket-access-logs/")
                .removalPolicy(RemovalPolicy.RETAIN)
                .objectOwnership(ObjectOwnership.BUCKET_OWNER_ENFORCED)
                .lifecycleRules(java.util.List.of(
                    LifecycleRule.builder()
                        .id("DataLifecycle")
                        .enabled(true)
                        .noncurrentVersionExpiration(software.amazon.awscdk.Duration.days(90))
                        .transitions(java.util.List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                .build()
                        ))
                        .build()
                ))
                .build();

        // Deny non-HTTPS requests to the bucket for compliance
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(java.util.List.of(new AnyPrincipal()))
                .actions(java.util.List.of("s3:*"))
                .resources(java.util.List.of(bucket.getBucketArn(), bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of("Bool", java.util.Map.of("aws:SecureTransport", "false")))
                .build()
        );

        return bucket;
    }
    
    /**
     * Creates a dedicated bucket for CloudTrail logs with appropriate permissions.
     */
    private Bucket createCloudTrailBucket(final IKey kmsKey) {
    Bucket bucket = Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "cloudtrail"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .serverAccessLogsBucket(accessLogsBucket)
                .serverAccessLogsPrefix("cloudtrail-bucket-access-logs/")
                .removalPolicy(RemovalPolicy.RETAIN)
                .lifecycleRules(java.util.List.of(
                    LifecycleRule.builder()
                        .id("CloudTrailLogsLifecycle")
                        .enabled(true)
                        .transitions(java.util.List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(90))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(software.amazon.awscdk.Duration.days(365))
                                .build()
                        ))
                        .build()
                ))
                .build();

        // Deny any non-HTTPS requests to the CloudTrail bucket
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(java.util.List.of(new AnyPrincipal()))
                .actions(java.util.List.of("s3:*"))
                .resources(java.util.List.of(bucket.getBucketArn(), bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of("Bool", java.util.Map.of("aws:SecureTransport", "false")))
                .build()
        );
        
        // Add CloudTrail service permissions
        bucket.addToResourcePolicy(
            software.amazon.awscdk.services.iam.PolicyStatement.Builder.create()
                .effect(software.amazon.awscdk.services.iam.Effect.ALLOW)
                .principals(java.util.List.of(
                    software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("cloudtrail.amazonaws.com").build()
                ))
                .actions(java.util.List.of("s3:PutObject"))
                .resources(java.util.List.of(bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of(
                    "StringEquals", java.util.Map.of(
                        "s3:x-amz-acl", "bucket-owner-full-control"
                    )
                ))
                .build()
        );
        
        bucket.addToResourcePolicy(
            software.amazon.awscdk.services.iam.PolicyStatement.Builder.create()
                .effect(software.amazon.awscdk.services.iam.Effect.ALLOW)
                .principals(java.util.List.of(
                    software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("cloudtrail.amazonaws.com").build()
                ))
                .actions(java.util.List.of("s3:GetBucketAcl"))
                .resources(java.util.List.of(bucket.getBucketArn()))
                .build()
        );
        
        return bucket;
    }
    
    // Getters
    public Bucket getDataBucket() { return dataBucket; }
    public Bucket getCloudTrailBucket() { return cloudTrailBucket; }
    public Bucket getAccessLogsBucket() { return accessLogsBucket; }
}