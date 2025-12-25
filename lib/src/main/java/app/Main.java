package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.iam.CfnInstanceProfile;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.Policy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.ObjectOwnership;
import software.constructs.Construct;

import java.util.List;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String environmentSuffix, final StackProps stackProps) {
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

        public Builder environmentSuffix(final String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(final StackProps stackProps) {
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
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final boolean isLocalStack;

    /**
     * Constructs a new TapStack with secure S3 infrastructure.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Detect LocalStack environment
        String endpointUrl = System.getenv("AWS_ENDPOINT_URL");
        this.isLocalStack = endpointUrl != null &&
                           (endpointUrl.contains("localhost") || endpointUrl.contains("4566"));

        // Get environment suffix from props, context, or use 'dev' as default
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
                .objectOwnership(ObjectOwnership.OBJECT_WRITER)
                .versioned(true)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .id("DeleteOldLogs")
                                .enabled(true)
                                .expiration(software.amazon.awscdk.Duration.days(90))
                                .build()
                ))
                .removalPolicy(RemovalPolicy.DESTROY)
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
                .removalPolicy(RemovalPolicy.DESTROY)
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

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * This method creates a CDK App instance and instantiates the TapStack
     * with appropriate configuration based on environment variables and context.
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
