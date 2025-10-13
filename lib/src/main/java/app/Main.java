package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketVersioningV2;
import com.pulumi.aws.s3.BucketVersioningV2Args;
import com.pulumi.aws.s3.inputs.BucketVersioningV2VersioningConfigurationArgs;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationV2;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationV2Args;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.s3.BucketObjectLockConfigurationV2;
import com.pulumi.aws.s3.BucketObjectLockConfigurationV2Args;
import com.pulumi.aws.s3.inputs.BucketObjectLockConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketObjectLockConfigurationV2RuleDefaultRetentionArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.kms.Alias;
import com.pulumi.aws.kms.AliasArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.cloudtrail.Trail;
import com.pulumi.aws.cloudtrail.TrailArgs;
import com.pulumi.aws.cloudtrail.inputs.TrailEventSelectorArgs;

import com.pulumi.aws.cloudwatch.LogGroup;
import com.pulumi.aws.cloudwatch.LogGroupArgs;
import com.pulumi.aws.cloudwatch.LogMetricFilter;
import com.pulumi.aws.cloudwatch.LogMetricFilterArgs;
import com.pulumi.aws.cloudwatch.inputs.LogMetricFilterMetricTransformationArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;

import java.util.Map;

public final class Main {

    private Main() {
    }

    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    // Test helper method for validation
    public static boolean validateConfiguration() {
        // Simple validation logic that can be tested
        String region = getDefaultRegion();
        boolean daysValid = isValidRetentionDays(2557);
        return region != null && !region.isEmpty() && daysValid;
    }

    // Additional helper method for testing
    public static String getDefaultRegion() {
        return "us-east-1";
    }

    // Check if running in CI environment to skip CloudTrail (avoid limits)
    public static boolean isRunningInCI() {
        // Check for common CI environment variables
        String ci = System.getenv("CI");
        String githubActions = System.getenv("GITHUB_ACTIONS");
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        
        // Skip CloudTrail if running in CI or if environment suffix indicates PR
        return "true".equals(ci) 
               || "true".equals(githubActions) 
               || (environmentSuffix != null && environmentSuffix.startsWith("pr"));
    }

    // Method to validate input parameters
    public static boolean isValidRetentionDays(final int days) {
        if (days <= 0) {
            return false;
        }
        if (days > 3653) {
            return false;
        }
        return true;
    }

    static void defineInfrastructure(final Context ctx) {
        // Get AWS account ID dynamically
        var callerIdentity = AwsFunctions.getCallerIdentity();
        var accountId = callerIdentity.applyValue(identity -> identity.accountId());
        
        // Get environment suffix for unique resource naming
        String environmentSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");

        // Create encryption resources
        var kmsResources = createKmsResources(accountId, environmentSuffix);
        var kmsKey = kmsResources.key;
        var kmsAlias = kmsResources.alias;

        // Create storage resources
        var storageResources = createStorageResources(kmsKey);
        var documentBucket = storageResources.documentBucket;
        var cloudtrailBucket = storageResources.cloudtrailBucket;

        // Create monitoring and logging resources
        var monitoringResources = createMonitoringResources(environmentSuffix);

        // Create CloudTrail resources (optional in CI environments to avoid limits)
        boolean skipCloudTrail = isRunningInCI();
        CloudTrailResources cloudtrailResources = null;
        if (!skipCloudTrail) {
            cloudtrailResources = createCloudTrailResources(
                    cloudtrailBucket, kmsKey, monitoringResources.cloudtrailLogGroup, environmentSuffix);
        }

        // Create IAM policies
        var accessPolicy = createDocumentAccessPolicy(documentBucket, kmsKey, environmentSuffix);

        // Export outputs
        exportOutputs(ctx, documentBucket, kmsKey, 
                cloudtrailResources != null ? cloudtrailResources.trail : null, 
                monitoringResources, accessPolicy);
    }

    private static KmsResources createKmsResources(final Output<String> accountId, final String environmentSuffix) {
        var kmsKey = new Key("document-kms-key", KeyArgs.builder()
                .description("KMS key for encrypting legal documents")
                .enableKeyRotation(true)
                .deletionWindowInDays(30)
                .policy(Output.format("""
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
                                "Sid": "Allow CloudTrail to encrypt logs",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "cloudtrail.amazonaws.com"
                                },
                                "Action": [
                                    "kms:GenerateDataKey*",
                                    "kms:DecryptDataKey"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Sid": "Allow S3 to use the key",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "s3.amazonaws.com"
                                },
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:GenerateDataKey"
                                ],
                                "Resource": "*"
                            }
                        ]
                    }
                    """, accountId))
                .tags(Map.of(
                        "Name", "legal-documents-kms-key",
                        "Environment", "production",
                        "Purpose", "document-encryption"
                ))
                .build());

        var kmsAlias = new Alias("document-kms-alias", AliasArgs.builder()
                .name("alias/legal-documents-key-" + environmentSuffix)
                .targetKeyId(kmsKey.keyId())
                .build());

        return new KmsResources(kmsKey, kmsAlias);
    }

    private static StorageResources createStorageResources(final Key kmsKey) {
        // Create S3 bucket for document storage with Object Lock
        var documentBucket = new Bucket("legal-documents-bucket", BucketArgs.builder()
                .objectLockEnabled(true)
                .tags(Map.of(
                        "Name", "legal-documents-storage",
                        "Environment", "production",
                        "Compliance", "required",
                        "Purpose", "document-storage"
                ))
                .build());

        // Enable versioning (required for Object Lock)
        var bucketVersioning = new BucketVersioningV2("document-bucket-versioning",
                BucketVersioningV2Args.builder()
                .bucket(documentBucket.id())
                .versioningConfiguration(BucketVersioningV2VersioningConfigurationArgs.builder()
                        .status("Enabled")
                        .build())
                .build());

        // Configure server-side encryption with KMS
        var bucketEncryption = new BucketServerSideEncryptionConfigurationV2("document-bucket-encryption",
                BucketServerSideEncryptionConfigurationV2Args.builder()
                .bucket(documentBucket.id())
                .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                        .applyServerSideEncryptionByDefault(
                                BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                                .sseAlgorithm("aws:kms")
                                .kmsMasterKeyId(kmsKey.arn())
                                .build())
                        .bucketKeyEnabled(true)
                        .build())
                .build(),
                CustomResourceOptions.builder()
                .dependsOn(bucketVersioning)
                .build());

        // Configure Object Lock in compliance mode
        var objectLockConfig = new BucketObjectLockConfigurationV2("document-bucket-object-lock",
                BucketObjectLockConfigurationV2Args.builder()
                .bucket(documentBucket.id())
                .rule(BucketObjectLockConfigurationV2RuleArgs.builder()
                        .defaultRetention(BucketObjectLockConfigurationV2RuleDefaultRetentionArgs.builder()
                                .mode("COMPLIANCE")
                                .days(90)
                                .build())
                        .build())
                .build(),
                CustomResourceOptions.builder()
                .dependsOn(bucketVersioning)
                .build());

        // Block public access
        var publicAccessBlock = new BucketPublicAccessBlock("document-bucket-public-access-block",
                BucketPublicAccessBlockArgs.builder()
                .bucket(documentBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        // Create S3 bucket for CloudTrail logs
        var cloudtrailBucket = new Bucket("cloudtrail-logs-bucket", BucketArgs.builder()
                .tags(Map.of(
                        "Name", "cloudtrail-logs-storage",
                        "Environment", "production",
                        "Purpose", "audit-logs"
                ))
                .build());

        var cloudtrailBucketPublicAccessBlock = new BucketPublicAccessBlock("cloudtrail-bucket-public-access-block",
                BucketPublicAccessBlockArgs.builder()
                .bucket(cloudtrailBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        return new StorageResources(documentBucket, cloudtrailBucket);
    }

    private static MonitoringResources createMonitoringResources(final String environmentSuffix) {
        // Create CloudWatch Log Group for CloudTrail
        var cloudtrailLogGroup = new LogGroup("cloudtrail-log-group", LogGroupArgs.builder()
                .name("/aws/cloudtrail/legal-documents-" + environmentSuffix)
                .retentionInDays(2557)
                .tags(Map.of(
                        "Name", "cloudtrail-logs",
                        "Environment", "production"
                ))
                .build());

        // Create CloudWatch Log Group for S3 access logs
        var s3AccessLogGroup = new LogGroup("s3-access-log-group", LogGroupArgs.builder()
                .name("/aws/s3/legal-documents-access-" + environmentSuffix)
                .retentionInDays(90)
                .tags(Map.of(
                        "Name", "s3-access-logs",
                        "Environment", "production"
                ))
                .build());

        // Create CloudWatch Log Metric Filter for document access patterns
        var documentAccessMetricFilter = new LogMetricFilter("document-access-metric",
                LogMetricFilterArgs.builder()
                .name("DocumentAccessFrequency")
                .logGroupName(cloudtrailLogGroup.name())
                .pattern("{ ($.eventName = GetObject) }")
                .metricTransformation(LogMetricFilterMetricTransformationArgs.builder()
                        .name("DocumentAccessCount")
                        .namespace("LegalDocuments")
                        .value("1")
                        .defaultValue("0")
                        .unit("Count")
                        .build())
                .build());

        return new MonitoringResources(cloudtrailLogGroup, s3AccessLogGroup, documentAccessMetricFilter);
    }

    private static CloudTrailResources createCloudTrailResources(
            final Bucket cloudtrailBucket, final Key kmsKey, final LogGroup cloudtrailLogGroup, 
            final String environmentSuffix) {
        
        // CloudTrail bucket policy
        var cloudtrailBucketPolicyDoc = cloudtrailBucket.arn()
                .applyValue(bucketArn -> String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "AWSCloudTrailAclCheck",
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "cloudtrail.amazonaws.com"
                                    },
                                    "Action": "s3:GetBucketAcl",
                                    "Resource": "%s"
                                },
                                {
                                    "Sid": "AWSCloudTrailWrite",
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "cloudtrail.amazonaws.com"
                                    },
                                    "Action": "s3:PutObject",
                                    "Resource": "%s/*",
                                    "Condition": {
                                        "StringEquals": {
                                            "s3:x-amz-acl": "bucket-owner-full-control"
                                        }
                                    }
                                }
                            ]
                        }
                        """, bucketArn, bucketArn));

        var cloudtrailBucketPolicy = new com.pulumi.aws.s3.BucketPolicy("cloudtrail-bucket-policy",
                com.pulumi.aws.s3.BucketPolicyArgs.builder()
                .bucket(cloudtrailBucket.id())
                .policy(cloudtrailBucketPolicyDoc.applyValue(com.pulumi.core.Either::ofLeft))
                .build());

        // Create IAM role for CloudTrail
        var cloudtrailRole = new Role("cloudtrail-role", RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "cloudtrail.amazonaws.com"
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    }
                    """)
                .tags(Map.of(
                        "Name", "cloudtrail-cloudwatch-role",
                        "Environment", "production"
                ))
                .build());

        var cloudtrailRolePolicy = new RolePolicy("cloudtrail-role-policy", RolePolicyArgs.builder()
                .role(cloudtrailRole.id())
                .policy(cloudtrailLogGroup.arn().applyValue(logGroupArn -> com.pulumi.core.Either.ofLeft(String.format("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": "%s:*"
                            }
                        ]
                    }
                    """, logGroupArn))))
                .build());

        // Create CloudTrail
        var trail = new Trail("legal-documents-trail", TrailArgs.builder()
                .name("legal-documents-audit-trail-" + environmentSuffix)
                .s3BucketName(cloudtrailBucket.id())
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableLogFileValidation(true)
                .cloudWatchLogsGroupArn(cloudtrailLogGroup.arn().applyValue(arn -> arn + ":*"))
                .cloudWatchLogsRoleArn(cloudtrailRole.arn())
                .kmsKeyId(kmsKey.arn())
                .eventSelectors(TrailEventSelectorArgs.builder()
                        .readWriteType("All")
                        .includeManagementEvents(true)
                        .build())
                .tags(Map.of(
                        "Name", "legal-documents-trail",
                        "Environment", "production",
                        "Compliance", "required"
                ))
                .build(),
                CustomResourceOptions.builder()
                .dependsOn(cloudtrailBucketPolicy, cloudtrailRolePolicy)
                .build());

        return new CloudTrailResources(trail, cloudtrailRole, cloudtrailBucketPolicy);
    }

    private static Policy createDocumentAccessPolicy(final Bucket documentBucket, final Key kmsKey, final String environmentSuffix) {
        return new Policy("document-access-policy", PolicyArgs.builder()
                .name("LegalDocumentAccessPolicy-" + environmentSuffix)
                .description("Policy for accessing legal documents with MFA requirement for deletion")
                .policy(Output.tuple(documentBucket.arn(), kmsKey.arn()).applyValue(tuple -> {
                    String bucketArn = tuple.t1;
                    String keyArn = tuple.t2;
                    return com.pulumi.core.Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "AllowListBucket",
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:ListBucket",
                                        "s3:GetBucketLocation"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Sid": "AllowReadAndWrite",
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:GetObject",
                                        "s3:PutObject",
                                        "s3:PutObjectRetention",
                                        "s3:PutObjectLegalHold"
                                    ],
                                    "Resource": "%s/*"
                                },
                                {
                                    "Sid": "AllowKMSDecryptEncrypt",
                                    "Effect": "Allow",
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:Encrypt",
                                        "kms:GenerateDataKey",
                                        "kms:DescribeKey"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Sid": "DenyDeleteWithoutMFA",
                                    "Effect": "Deny",
                                    "Action": [
                                        "s3:DeleteObject",
                                        "s3:DeleteObjectVersion",
                                        "s3:BypassGovernanceRetention"
                                    ],
                                    "Resource": "%s/*",
                                    "Condition": {
                                        "BoolIfExists": {
                                            "aws:MultiFactorAuthPresent": "false"
                                        }
                                    }
                                }
                            ]
                        }
                        """, bucketArn, bucketArn, keyArn, bucketArn));
                }))
                .tags(Map.of(
                        "Name", "document-access-policy",
                        "Environment", "production"
                ))
                .build());
    }

    private static void exportOutputs(final Context ctx, final Bucket documentBucket, final Key kmsKey,
                                    final Trail trail, final MonitoringResources monitoringResources,
                                    final Policy documentAccessPolicy) {
        ctx.export("documentBucketName", documentBucket.id());
        ctx.export("documentBucketArn", documentBucket.arn());
        ctx.export("kmsKeyId", kmsKey.id());
        ctx.export("kmsKeyArn", kmsKey.arn());
        
        // Export CloudTrail name only if CloudTrail was created
        if (trail != null) {
            ctx.export("cloudtrailName", trail.name());
        } else {
            ctx.export("cloudtrailName", Output.of("cloudtrail-skipped-in-ci"));
        }
        
        ctx.export("cloudtrailLogGroupName", monitoringResources.cloudtrailLogGroup.name());
        ctx.export("accessLogGroupName", monitoringResources.s3AccessLogGroup.name());
        ctx.export("documentAccessPolicyArn", documentAccessPolicy.arn());
    }

    // Helper classes for better organization
    private static class KmsResources {
        private final Key key;
        private final Alias alias;

        KmsResources(final Key keyParam, final Alias aliasParam) {
            this.key = keyParam;
            this.alias = aliasParam;
        }
    }

    private static class StorageResources {
        private final Bucket documentBucket;
        private final Bucket cloudtrailBucket;

        StorageResources(final Bucket docBucket, final Bucket trailBucket) {
            this.documentBucket = docBucket;
            this.cloudtrailBucket = trailBucket;
        }
    }

    private static class MonitoringResources {
        private final LogGroup cloudtrailLogGroup;
        private final LogGroup s3AccessLogGroup;
        private final LogMetricFilter documentAccessMetricFilter;

        MonitoringResources(final LogGroup trailLogGroup, final LogGroup s3LogGroup, 
                          final LogMetricFilter metricFilter) {
            this.cloudtrailLogGroup = trailLogGroup;
            this.s3AccessLogGroup = s3LogGroup;
            this.documentAccessMetricFilter = metricFilter;
        }
    }

    private static class CloudTrailResources {
        private final Trail trail;
        private final Role cloudtrailRole;
        private final com.pulumi.aws.s3.BucketPolicy bucketPolicy;

        CloudTrailResources(final Trail trailParam, final Role roleParam, 
                          final com.pulumi.aws.s3.BucketPolicy policyParam) {
            this.trail = trailParam;
            this.cloudtrailRole = roleParam;
            this.bucketPolicy = policyParam;
        }
    }
}
