I'll help you create a secure S3 infrastructure setup using AWS CDK Java that follows the latest security best practices. This solution implements zero-trust principles with proper access controls, encryption, and monitoring.

Here's the complete CDK Java implementation that addresses all your requirements:

## Updated Main.java

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.constructs.Construct;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Secure S3 infrastructure stack with IAM role and access logging.
 * Implements zero-trust security principles and latest AWS best practices.
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create access logs bucket first
        Bucket accessLogsBucket = Bucket.Builder.create(this, "AccessLogsBucket")
                .bucketName("secure-data-access-logs-" + environmentSuffix)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .objectOwnership(ObjectOwnership.BUCKET_OWNER_ENFORCED)
                .versioned(true)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .id("DeleteOldLogs")
                                .enabled(true)
                                .expiration(software.amazon.awscdk.Duration.days(90))
                                .build()
                ))
                .build();

        // Create the main secure data bucket with enhanced security features
        Bucket secureDataBucket = Bucket.Builder.create(this, "SecureDataBucket")
                .bucketName("secure-data-bucket-" + environmentSuffix)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .objectOwnership(ObjectOwnership.BUCKET_OWNER_ENFORCED)
                .versioned(true)
                .serverAccessLogsBucket(accessLogsBucket)
                .serverAccessLogsPrefix("access-logs/")
                .eventBridgeEnabled(true)
                .transferAcceleration(false)
                .build();

        // Create IAM role for data scientists with least privilege access
        Role dataScientistRole = Role.Builder.create(this, "DataScientistRole")
                .roleName("DataScientistRole-" + environmentSuffix)
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .description("Role for data scientists to access secure S3 bucket with read/write permissions")
                .build();

        // Create custom policy for S3 bucket access with least privilege
        PolicyDocument policyDocument = PolicyDocument.Builder.create()
                .statements(List.of(
                        // Allow list bucket permissions
                        PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(List.of(
                                        "s3:ListBucket",
                                        "s3:GetBucketLocation",
                                        "s3:GetBucketVersioning"
                                ))
                                .resources(List.of(secureDataBucket.getBucketArn()))
                                .build(),
                        // Allow object-level read/write permissions
                        PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(List.of(
                                        "s3:GetObject",
                                        "s3:GetObjectVersion",
                                        "s3:PutObject",
                                        "s3:DeleteObject",
                                        "s3:DeleteObjectVersion",
                                        "s3:GetObjectAttributes"
                                ))
                                .resources(List.of(secureDataBucket.getBucketArn() + "/*"))
                                .build()
                ))
                .build();

        Policy s3AccessPolicy = Policy.Builder.create(this, "S3AccessPolicy")
                .policyName("SecureS3BucketAccess-" + environmentSuffix)
                .document(policyDocument)
                .build();

        // Attach policy to role
        dataScientistRole.attachInlinePolicy(s3AccessPolicy);

        // Create instance profile for EC2 instances
        CfnInstanceProfile instanceProfile = CfnInstanceProfile.Builder.create(this, "DataScientistInstanceProfile")
                .instanceProfileName("DataScientistInstanceProfile-" + environmentSuffix)
                .roles(List.of(dataScientistRole.getRoleName()))
                .build();

        // Create CloudFormation outputs for integration and testing
        CfnOutput.Builder.create(this, "SecureDataBucketName")
                .value(secureDataBucket.getBucketName())
                .description("Name of the secure S3 bucket for data science team")
                .exportName("SecureDataBucketName-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "SecureDataBucketArn")
                .value(secureDataBucket.getBucketArn())
                .description("ARN of the secure S3 bucket")
                .exportName("SecureDataBucketArn-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "AccessLogsBucketName")
                .value(accessLogsBucket.getBucketName())
                .description("Name of the S3 access logs bucket")
                .exportName("AccessLogsBucketName-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "DataScientistRoleArn")
                .value(dataScientistRole.getRoleArn())
                .description("ARN of the DataScientist IAM role")
                .exportName("DataScientistRoleArn-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "DataScientistInstanceProfileName")
                .value(instanceProfile.getInstanceProfileName())
                .description("Name of the instance profile for EC2 instances")
                .exportName("DataScientistInstanceProfileName-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "BucketRegion")
                .value(this.getRegion())
                .description("AWS region where the bucket is deployed")
                .exportName("BucketRegion-" + environmentSuffix)
                .build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the secure S3 CDK Java application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
```

This implementation provides:

## Security Features

1. **S3 Bucket Security**: 
   - Server-side encryption with AWS-managed keys (SSE-S3)
   - Block all public access enabled by default
   - Object ownership enforced (disables ACLs)
   - Versioning enabled for data protection

2. **Access Control**:
   - Dedicated IAM role `DataScientistRole` with least privilege permissions
   - Custom policy allowing only necessary S3 operations
   - Instance profile for EC2-based access

3. **Monitoring & Logging**:
   - Server access logging enabled with dedicated logs bucket
   - EventBridge integration for real-time monitoring
   - Lifecycle policy on logs bucket for cost optimization

4. **Latest AWS Features**:
   - Object Ownership enforcement (2024 feature)
   - Enhanced data integrity protections through versioning
   - Zero-trust security model implementation

## Key Components

- **Main S3 Bucket**: `secure-data-bucket-{env}` with full security hardening
- **Access Logs Bucket**: Separate bucket for storing access logs with lifecycle management
- **IAM Role**: `DataScientistRole-{env}` with minimal required permissions
- **Instance Profile**: For EC2-based access to the role
- **CloudFormation Outputs**: All resources exported for integration

The infrastructure follows AWS Well-Architected Framework principles and implements the latest security best practices from 2024.