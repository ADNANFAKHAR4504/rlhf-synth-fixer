package app;

import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;

import java.util.Map;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 * 
 * This stack creates a simple S3 bucket with proper tagging for
 * cost tracking and resource management.
 */
public class MainStack extends TerraformStack {
    
    private final S3Bucket bucket;

    /**
     * Creates a new MainStack with basic AWS resources.
     * 
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        AwsProvider.Builder.create(this, "aws")
                .region("us-west-1")
                .build();

        // Create S3 bucket for application storage
        this.bucket = S3Bucket.Builder.create(this, "app-storage-bucket")
                .bucket("cdktf-java-template-bucket-" + System.currentTimeMillis())
                .tags(Map.of(
                        "Environment", "development",
                        "Project", "cdktf-java-template",
                        "ManagedBy", "cdktf",
                        "Purpose", "ApplicationStorage"
                ))
                .build();
    }

    /**
     * Gets the S3 bucket resource created by this stack.
     * 
     * @return The S3 bucket instance
     */
    public S3Bucket getBucket() {
        return bucket;
    }

    /**
     * Gets the bucket name for external reference.
     * 
     * @return The bucket name
     */
    public String getBucketName() {
        return bucket.getBucket();
    }

    public String getStackId() {
        return stackId;
    }
}