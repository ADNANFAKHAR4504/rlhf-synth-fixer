package app.stacks;

import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTable;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableAttribute;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTablePointInTimeRecovery;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableServerSideEncryption;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class StorageStack {

    private final S3Bucket s3Bucket;

    private final DynamodbTable dynamoTable;

    private final KmsKey s3KmsKey;

    private final KmsKey dynamoKmsKey;

    public StorageStack(final Construct scope, final String id) {
        // Create KMS keys for encryption
        this.s3KmsKey = KmsKey.Builder.create(scope, id + "-s3-kms-key")
                .description("KMS key for S3 bucket encryption")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "s3-encryption-key"))
                .build();

        KmsAlias.Builder.create(scope, id + "-s3-kms-alias")
                .name("alias/s3-serverless-key")
                .targetKeyId(s3KmsKey.getId())
                .build();

        this.dynamoKmsKey = KmsKey.Builder.create(scope, id + "-dynamo-kms-key")
                .description("KMS key for DynamoDB encryption")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "dynamodb-encryption-key"))
                .build();

        // Create S3 bucket with versioning and encryption
        this.s3Bucket = S3Bucket.Builder.create(scope, id + "-data-bucket")
                .bucket("serverless-data-bucket-" + System.currentTimeMillis())
                .tags(Map.of(
                        "Name", "serverless-data-bucket",
                        "Purpose", "Lambda data storage"
                ))
                .build();

        // Enable versioning
        S3BucketVersioningA.Builder.create(scope, id + "-bucket-versioning")
                .bucket(s3Bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build();

        // Enable server-side encryption
        S3BucketServerSideEncryptionConfigurationA.Builder.create(scope, id + "-bucket-encryption")
                .bucket(s3Bucket.getId())
                .rule(List.of(
                        S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                .applyServerSideEncryptionByDefault(
                                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                .sseAlgorithm("aws:kms")
                                                .kmsMasterKeyId(s3KmsKey.getArn())
                                                .build()
                                )
                                .bucketKeyEnabled(true)
                                .build()
                ))
                .build();

        // Block public access
        S3BucketPublicAccessBlock.Builder.create(scope, id + "-bucket-public-access-block")
                .bucket(s3Bucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build();

        // Create DynamoDB table
        this.dynamoTable = DynamodbTable.Builder.create(scope, id + "-data-table")
                .name("serverless-data-table")
                .billingMode("PROVISIONED")
                .readCapacity(5)
                .writeCapacity(5)
                .hashKey("pk")
                .rangeKey("sk")
                .attribute(Arrays.asList(
                        DynamodbTableAttribute.builder()
                                .name("pk")
                                .type("S")
                                .build(),
                        DynamodbTableAttribute.builder()
                                .name("sk")
                                .type("S")
                                .build()
                ))
                .serverSideEncryption(DynamodbTableServerSideEncryption.builder()
                        .enabled(true)
                        .kmsKeyArn(dynamoKmsKey.getArn())
                        .build())
                .pointInTimeRecovery(DynamodbTablePointInTimeRecovery.builder()
                        .enabled(true)
                        .build())
                .tags(Map.of(
                        "Name", "serverless-data-table",
                        "Purpose", "Application data storage"
                ))
                .build();
    }

    // Getters
    public S3Bucket getS3Bucket() {
        return s3Bucket;
    }

    public DynamodbTable getDynamoTable() {
        return dynamoTable;
    }

    public KmsKey getS3KmsKey() {
        return s3KmsKey;
    }

    public KmsKey getDynamoKmsKey() {
        return dynamoKmsKey;
    }
}
