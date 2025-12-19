package app.constructs;

import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3BucketConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlockConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningAConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

public class S3Construct extends BaseConstruct {
    private final S3Bucket bucket;

    public S3Construct(final Construct scope, final String id) {
        super(scope, id);

        // Create S3 bucket
        this.bucket = new S3Bucket(this, "deployment-bucket", S3BucketConfig.builder()
                .bucket(resourceName("lambda-deployments-" + System.currentTimeMillis()).toLowerCase())
                .tags(getTagsWithName("DeploymentBucket"))
                .build());

        // Enable versioning
        new S3BucketVersioningA(this, "bucket-versioning", S3BucketVersioningAConfig.builder()
                .bucket(bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
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

    public String getBucketArn() {
        return bucket.getArn();
    }

    public String getBucketName() {
        return bucket.getBucket();
    }
}
