package app;

import com.pulumi.Pulumi;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketVersioning;
import com.pulumi.aws.s3.BucketVersioningArgs;
import com.pulumi.aws.s3.inputs.BucketVersioningVersioningConfigurationArgs;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfiguration;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;

import java.util.Map;

public final class Main {
    
    private Main() {
        // Utility class
    }
    
    public static void main(final String[] args) {
        Pulumi.run(ctx -> {

            Bucket bucket = new Bucket("java-app-bucket", BucketArgs.builder()
                    .tags(Map.of("Environment", "development"))
                    .build());

            new BucketVersioning(bucket.bucket().toString() + "-versioning",
                    BucketVersioningArgs.builder().bucket(bucket.id())
                            .versioningConfiguration(
                                    BucketVersioningVersioningConfigurationArgs.builder()
                                            .status("Enabled").build()).build());

            BucketServerSideEncryptionConfiguration encryption =
                    new BucketServerSideEncryptionConfiguration(
                            bucket.bucket().toString() + "-encryption",
                            BucketServerSideEncryptionConfigurationArgs.builder()
                                    .bucket(bucket.id())
                                    .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                                            .applyServerSideEncryptionByDefault(
                                                    BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
                                                            .builder()
                                                            .sseAlgorithm("AES256")
                                                            .build())
                                            .build())
                                    .build());


            ctx.export("bucketName", bucket.id());
            ctx.export("bucket_encryption", encryption.id());
        });
    }
}