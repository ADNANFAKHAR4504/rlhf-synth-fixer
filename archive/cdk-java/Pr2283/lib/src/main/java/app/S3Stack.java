package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;

import java.util.Map;

public class S3Stack extends Stack {

    private final Bucket appDataBucket;

    public S3Stack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
        // Get environment suffix from context
        String environmentSuffix = (String) this.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create S3 bucket with security best practices
        this.appDataBucket = Bucket.Builder.create(this, "app-s3-data")
                .bucketName("app-s3-data-" + environmentSuffix + "-" + this.getAccount() + "-" + this.getRegion())
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .enforceSsl(true)
                .build();

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public Bucket getAppDataBucket() {
        return appDataBucket;
    }
}