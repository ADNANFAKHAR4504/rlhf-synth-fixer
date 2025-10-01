package app.constructs;

import app.config.Config;
import com.hashicorp.cdktf.providers.aws.data_aws_caller_identity.DataAwsCallerIdentity;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAliasConfig;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKeyConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3BucketConfig;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ArtifactStorageConstruct extends Construct {

    private final S3Bucket artifactBucket;
    private final S3Bucket stagingArtifactBucket;
    private final S3Bucket sourceBucket;
    private final KmsKey kmsKey;

    public ArtifactStorageConstruct(final Construct scope, final String id, final Config config,
                                    final AwsProvider secondaryProvider) {
        super(scope, id);

        DataAwsCallerIdentity identity = new DataAwsCallerIdentity(this, "Current");

        // Create KMS key for encryption
        Map<String, String> tags = new HashMap<>();
        tags.put("Project", config.projectName());
        tags.put("ManagedBy", "CDK For Terraform");

        this.kmsKey = new KmsKey(this, "pipeline-kms-key", KmsKeyConfig.builder()
                .description("KMS key for CI/CD pipeline artifacts encryption")
                .deletionWindowInDays(10)
                .enableKeyRotation(true)
                .tags(tags)
                .policy(generateKmsPolicy(identity))
                .build());

        new KmsAlias(this, "pipeline-kms-alias", KmsAliasConfig.builder()
                .name("alias/" + config.resourceName(config.projectName() + "-pipeline"))
                .targetKeyId(kmsKey.getId())
                .build());

        // Create S3 bucket for artifacts
        this.artifactBucket = new S3Bucket(this, "artifacts-bucket", S3BucketConfig.builder()
                .bucket(config.resourceName(config.projectName() + "-pipeline-artifacts"))
                .forceDestroy(true)
                .tags(tags)
                .build());

        // Enable versioning for artifacts
        new S3BucketVersioningA(this, "artifacts" + "-versioning", S3BucketVersioningAConfig.builder()
                .bucket(artifactBucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build()
                ).build());

        // Configure server-side encryption
        new S3BucketServerSideEncryptionConfigurationA(this, "artifacts-encryption",
                S3BucketServerSideEncryptionConfigurationAConfig.builder()
                        .bucket(artifactBucket.getId())
                        .rule(List.of(
                                S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                        .applyServerSideEncryptionByDefault(
                                                S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                        .sseAlgorithm("aws:kms")
                                                        .kmsMasterKeyId(kmsKey.getArn())
                                                        .build())
                                        .bucketKeyEnabled(true)
                                        .build()
                        ))
                        .build());

        // Block public access
        new S3BucketPublicAccessBlock(this, "artifacts-public-access-block",
                S3BucketPublicAccessBlockConfig.builder()
                        .bucket(artifactBucket.getId())
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .build());

        // Create S3 bucket for source code
        this.sourceBucket = new S3Bucket(this, "source-bucket", S3BucketConfig.builder()
                .bucket(config.resourceName(config.projectName() + "-pipeline-source"))
                .forceDestroy(true)
                .tags(tags)
                .build());

        // Enable versioning for CodePipeline S3 source
        new S3BucketVersioningA(this, "source" + "-versioning", S3BucketVersioningAConfig.builder()
                .bucket(sourceBucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build()
                ).build());

        // Configure server-side encryption for source bucket
        new S3BucketServerSideEncryptionConfigurationA(this, "source-encryption",
                S3BucketServerSideEncryptionConfigurationAConfig.builder()
                        .bucket(sourceBucket.getId())
                        .rule(List.of(
                                S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                        .applyServerSideEncryptionByDefault(
                                                S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                        .sseAlgorithm("aws:kms")
                                                        .kmsMasterKeyId(kmsKey.getArn())
                                                        .build())
                                        .bucketKeyEnabled(true)
                                        .build()
                        ))
                        .build());

        // Block public access for source bucket
        new S3BucketPublicAccessBlock(this, "source-public-access-block",
                S3BucketPublicAccessBlockConfig.builder()
                        .bucket(sourceBucket.getId())
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .build());


        // Create S3 bucket for secondary region artifacts
        this.stagingArtifactBucket = new S3Bucket(this, "secondary-artifacts-bucket", S3BucketConfig.builder()
                .bucket(config.resourceName(config.projectName() + "-secondary-artifacts"))
                .forceDestroy(true)
                .tags(tags)
                .provider(secondaryProvider)
                .build());

        // Enable versioning on secondary region artifacts bucket
        new S3BucketVersioningA(this, "secondary-artifacts" + "-versioning", S3BucketVersioningAConfig.builder()
                .bucket(stagingArtifactBucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build()
                ).provider(secondaryProvider)
                .build());

        // Configure server-side encryption for secondary region artifacts bucket
        new S3BucketServerSideEncryptionConfigurationA(this, "secondary-artifacts-encryption",
                S3BucketServerSideEncryptionConfigurationAConfig.builder()
                        .bucket(stagingArtifactBucket.getId())
                        .rule(List.of(
                                S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                        .applyServerSideEncryptionByDefault(
                                                S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                        .sseAlgorithm("aws:kms")
                                                        .kmsMasterKeyId(kmsKey.getArn())
                                                        .build())
                                        .bucketKeyEnabled(true)
                                        .build()
                        ))
                        .provider(secondaryProvider)
                        .build());

        // Block public access for secondary region artifacts bucket
        new S3BucketPublicAccessBlock(this, "secondary-artifacts-public-access-block",
                S3BucketPublicAccessBlockConfig.builder()
                        .bucket(stagingArtifactBucket.getId())
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .provider(secondaryProvider)
                        .build());

    }

    private String generateKmsPolicy(final DataAwsCallerIdentity identity) {
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
                            "Sid": "Allow services to use the key",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": [
                                    "codepipeline.amazonaws.com",
                                    "codebuild.amazonaws.com",
                                    "s3.amazonaws.com",
                                    "logs.amazonaws.com"
                                ]
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey",
                                "kms:CreateGrant"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """.formatted(identity.getAccountId());
    }

    public S3Bucket getArtifactBucket() {
        return artifactBucket;
    }

    public S3Bucket getStagingArtifactBucket() {
        return stagingArtifactBucket;
    }

    public KmsKey getKmsKey() {
        return kmsKey;
    }

    public S3Bucket getSourceBucket() {
        return sourceBucket;
    }
}
