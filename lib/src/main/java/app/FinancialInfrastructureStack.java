package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;
import app.constructs.*;
import app.config.EnvironmentConfig;

/**
 * Main infrastructure stack for financial services organization.
 * This stack orchestrates all security, networking, storage, and monitoring components
 * required for a production-grade financial services environment.
 */
public class FinancialInfrastructureStack extends Stack {
    
    public FinancialInfrastructureStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // 1. Create networking infrastructure with security groups
        NetworkingConstruct networking = new NetworkingConstruct(this, 
            EnvironmentConfig.getResourceName("networking", "construct"));

        // 2. Create IAM roles and policies with least privilege principle
        IamConstruct iam = new IamConstruct(this, 
            EnvironmentConfig.getResourceName("iam", "construct"));

        // 3. Create security construct for KMS keys and security policies
        SecurityConstruct security = new SecurityConstruct(this, 
            EnvironmentConfig.getResourceName("security", "construct"));

        // 4. Create S3 buckets with encryption and versioning
        S3Construct s3 = new S3Construct(this, 
            EnvironmentConfig.getResourceName("s3", "construct"), 
            security.getKmsKey());

        // 5. Create CloudTrail for comprehensive logging and monitoring
        CloudTrailConstruct cloudTrail = new CloudTrailConstruct(this, 
            EnvironmentConfig.getResourceName("cloudtrail", "construct"),
            s3.getCloudTrailBucket(),
            security.getKmsKey());

        // Add stack-level tags for compliance and cost tracking
        software.amazon.awscdk.Tags.of(this).add("Environment", EnvironmentConfig.ENVIRONMENT);
        software.amazon.awscdk.Tags.of(this).add("Service", EnvironmentConfig.SERVICE_PREFIX);
        software.amazon.awscdk.Tags.of(this).add("Compliance", "Financial-Services");
        software.amazon.awscdk.Tags.of(this).add("DataClassification", "Confidential");
    }
}