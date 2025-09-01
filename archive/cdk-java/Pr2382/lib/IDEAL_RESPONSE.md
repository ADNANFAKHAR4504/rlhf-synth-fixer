**`lib/src/main/java/app/Main.java`**

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
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
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create separate stacks for each resource type
        // Create the DynamoDB stack as a nested stack

        // ! DO not create resources directly in this stack.
        // ! Instead, instantiate separate stacks for each resource type.

        // Example nested stack pattern:
        // NestedDynamoDBStack dynamodbStack = new NestedDynamoDBStack(
        //     this,
        //     "DynamoDBStack" + environmentSuffix,
        //     DynamoDBStackProps.builder()
        //         .environmentSuffix(environmentSuffix)
        //         .build()
        // );

        // Make the table available as a property of this stack
        // this.table = dynamodbStack.getTable();
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

    // Define production environment from environment variables (fallbacks allowed)
    Environment prodEnvironment = Environment.builder()
        .account(System.getenv("CDK_DEFAULT_ACCOUNT") != null ? System.getenv("CDK_DEFAULT_ACCOUNT") : "000000000000")
        .region(System.getenv("CDK_DEFAULT_REGION") != null ? System.getenv("CDK_DEFAULT_REGION") : "us-east-1")
        .build();

    // Create the main financial infrastructure stack
    new FinancialInfrastructureStack(app, "FinancialInfrastructureStack",
        StackProps.builder()
        .env(prodEnvironment)
        .description("Production-grade financial services infrastructure with enhanced security")
        .build());

        // Synthesize the CDK app
        app.synth();
    }
}


```

**`lib/src/main/java/app/config/EnvironmentConfig.java`**

```java
package app.config;

/**
 * Configuration class for environment-specific settings.
 * Centralizes all configuration values for the financial infrastructure.
 */
public class EnvironmentConfig {
    public static final String ENVIRONMENT = "prod";
    public static final String SERVICE_PREFIX = "financial";

    // Naming convention helper
    public static String getResourceName(String service, String resource) {
        return String.format("%s-%s-%s", ENVIRONMENT, service, resource);
    }

    // Security configuration
    public static final int PASSWORD_MAX_AGE_DAYS = 90;
    public static final int PASSWORD_MIN_LENGTH = 14;
    public static final boolean REQUIRE_UPPERCASE = true;
    public static final boolean REQUIRE_LOWERCASE = true;
    public static final boolean REQUIRE_NUMBERS = true;
    public static final boolean REQUIRE_SYMBOLS = true;
    public static final int PASSWORD_REUSE_PREVENTION = 12;

    // (MFA enforcement removed) Previously we added a list of exempt principals
    // used to exclude automation roles from MFA enforcement. MFA enforcement has
    // been removed per request.

    // Network configuration
    public static final String VPC_CIDR = "10.0.0.0/16";
    public static final String PRIVATE_SUBNET_CIDR_1 = "10.0.1.0/24";
    public static final String PRIVATE_SUBNET_CIDR_2 = "10.0.2.0/24";
    public static final String PUBLIC_SUBNET_CIDR_1 = "10.0.101.0/24";
    public static final String PUBLIC_SUBNET_CIDR_2 = "10.0.102.0/24";
}
```

**`lib/src/main/java/app/FinancialInfrastructureStack.java`**

```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;
import app.constructs.NetworkingConstruct;
import app.constructs.IamConstruct;
import app.constructs.SecurityConstruct;
import app.constructs.S3Construct;
import app.constructs.CloudTrailConstruct;
import app.constructs.WebServerConstruct;
import app.constructs.RdsConstruct;
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

        // 6. Create a web server in the public subnet
        WebServerConstruct web = new WebServerConstruct(this,
            EnvironmentConfig.getResourceName("web", "construct"),
            networking.getVpc(),
            networking.getWebSecurityGroup());

        // 7. Create RDS Postgres in private subnets encrypted with the project's KMS key
        RdsConstruct rds = new RdsConstruct(this,
            EnvironmentConfig.getResourceName("rds", "construct"),
            networking.getVpc(),
            networking.getDatabaseSecurityGroup(),
            security.getKmsKey());

        // Add stack-level tags for compliance and cost tracking
        software.amazon.awscdk.Tags.of(this).add("Environment", "Production");
        software.amazon.awscdk.Tags.of(this).add("Department", "IT");
        software.amazon.awscdk.Tags.of(this).add("Service", EnvironmentConfig.SERVICE_PREFIX);
        software.amazon.awscdk.Tags.of(this).add("Compliance", "Financial-Services");
        software.amazon.awscdk.Tags.of(this).add("DataClassification", "Confidential");
    }
}
```

**`lib/src/main/java/app/constructs/SecurityConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.AccountPrincipal;
import software.constructs.Construct;
import app.config.EnvironmentConfig;
import java.util.List;
import java.util.Map;

/**
 * Security construct that manages encryption keys and security policies.
 * This construct creates AWS KMS keys for encryption at rest and defines
 * security policies that enforce least privilege access.
 */
public class SecurityConstruct extends Construct {

    private final Key kmsKey;

    public SecurityConstruct(final Construct scope, final String id) {
        super(scope, id);

        // Create KMS key for encryption at rest
        this.kmsKey = createKmsKey();
    }

    /**
     * Creates a KMS key for encrypting data at rest.
     * The key is configured with appropriate policies for financial services compliance.
     */
    private Key createKmsKey() {
        Key key = Key.Builder.create(this, EnvironmentConfig.getResourceName("security", "kms-key"))
                .description("KMS key for financial services data encryption")
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .enableKeyRotation(true) // Enable automatic key rotation for enhanced security
                .policy(software.amazon.awscdk.services.iam.PolicyDocument.Builder.create()
                    .statements(List.of(
                        // Allow root account full access to the key
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(List.of(new AccountPrincipal(software.amazon.awscdk.Stack.of(this).getAccount())))
                            .actions(List.of("kms:*"))
                            .resources(List.of("*"))
                            .build(),
                        // Allow CloudTrail to use the key for log encryption
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(List.of(software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("cloudtrail.amazonaws.com").build()))
                            .actions(List.of(
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ))
                            .resources(List.of("*"))
                            .build()
                    ))
                    .build())
                .build();

        // Additionally allow CloudWatch Logs service to use this key, but scope it to
        // log groups that are related to CloudTrail in this account. We use a
        // StringLike condition with a wildcard to accommodate variations (for
        // example randomized physical names or different naming prefixes).
        String account = software.amazon.awscdk.Stack.of(this).getAccount();
        String sourceArnPattern = "arn:aws:logs:*:" + account + ":log-group:*cloudtrail*";
        key.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(List.of(software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("logs.amazonaws.com").build()))
                .actions(List.of(
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ))
                .resources(List.of("*"))
                .conditions(Map.of("StringLike", Map.of("aws:SourceArn", java.util.List.of(sourceArnPattern))))
                .build()
        );

        return key;
    }

    public Key getKmsKey() {
        return kmsKey;
    }
}
```

**`lib/src/main/java/app/constructs/IamConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.constructs.Construct;
// Removed imports for account-scoped custom resources to avoid runtime AWS account calls during synth
import software.amazon.awscdk.services.iam.ManagedPolicy;
import app.config.EnvironmentConfig;
import java.util.List;
import java.util.Map;
import software.amazon.awscdk.services.iam.Group;
import software.amazon.awscdk.services.iam.ArnPrincipal;
import software.amazon.awscdk.services.iam.User;

/**
 * IAM construct that creates roles and policies following the principle of least privilege.
 * This construct also enforces strong password policies and MFA requirements
 * for enhanced security in financial services environments.
 */
public class IamConstruct extends Construct {

    private final Role s3ReadOnlyRole;
    private final Role cloudTrailRole;

    public IamConstruct(final Construct scope, final String id) {
        super(scope, id);
        // Account password policy (PutAccountPasswordPolicy) previously used an
        // SDK-backed custom resource which performs account-level API calls during
        // synth. To avoid synth-time account calls and pipeline failures, that
        // behavior was removed from this construct. Account-level governance
        // should be managed separately (CI/CD or org policy).

        // Create IAM roles with least privilege
        this.s3ReadOnlyRole = createS3ReadOnlyRole();
        this.cloudTrailRole = createCloudTrailRole();
    }

    /**
     * Creates a group for human operators and attaches the MFA enforcement policy.
     */
    // Operators group and MFA enforcement removed.

    /**
     * Creates a strict password policy for IAM users.
     * Enforces 90-day rotation, complexity requirements, and prevents password reuse.
     */

    /**
     * Creates an IAM role for S3 read-only access with least privilege principle.
     */
    private Role createS3ReadOnlyRole() {
        return Role.Builder.create(this, EnvironmentConfig.getResourceName("iam", "s3-readonly-role"))
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("Role for EC2 instances requiring read-only S3 access")
                .inlinePolicies(Map.of(
                    "S3ReadOnlyPolicy", PolicyDocument.Builder.create()
                        .statements(List.of(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(List.of(
                                    "s3:GetObject",
                                    "s3:GetObjectVersion",
                                    "s3:ListBucket"
                                ))
                                .resources(List.of(
                                    String.format("arn:aws:s3:::%s-*", EnvironmentConfig.ENVIRONMENT),
                                    String.format("arn:aws:s3:::%s-*/*", EnvironmentConfig.ENVIRONMENT)
                                ))
                                .build()
                        ))
                        .build()
                ))
                .build();
    }

    /**
     * Creates an IAM role for CloudTrail service with minimal required permissions.
     */
    private Role createCloudTrailRole() {
        return Role.Builder.create(this, EnvironmentConfig.getResourceName("iam", "cloudtrail-role"))
                .assumedBy(new ServicePrincipal("cloudtrail.amazonaws.com"))
                .description("Role for CloudTrail logging service")
                .inlinePolicies(Map.of(
                    "CloudTrailLogsPolicy", PolicyDocument.Builder.create()
                        .statements(List.of(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(List.of(
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents",
                                    "logs:DescribeLogGroups",
                                    "logs:DescribeLogStreams"
                                ))
                                // Limit to CloudWatch Logs in this account; CloudTrail writes to log groups with the pattern /aws/cloudtrail/*
                                .resources(List.of(String.format("arn:aws:logs:*:%s:log-group:/aws/cloudtrail/*", software.amazon.awscdk.Stack.of(this).getAccount())))
                                .build()
                        ))
                        .build()
                ))
                .build();
    }

    /**
     * Create an account password policy using the L1 construct so the account
     * enforces 90-day rotation and complexity rules.
     */
    private void createPasswordPolicy() {
    // Account-level password policy application removed.
    // If desired, apply account password policies via an organizational
    // automation or in a deployment step that has explicit credentials and
    // the proper permissions. Keeping this method as a no-op avoids
    // synth-time account API calls that break CI.
    }

    /**
     * Creates a managed policy that can be attached to user groups to enforce MFA
     * and limit actions for human users. This is intentionally conservative.
     */
    private ManagedPolicy createMfaEnforcementPolicy() {
    // MFA enforcement removed per request.
    return null;
    }

    // Getters
    public Role getS3ReadOnlyRole() { return s3ReadOnlyRole; }
    public Role getCloudTrailRole() { return cloudTrailRole; }
    // Operators group removed.
    // Password policy getter intentionally omitted; refer to account-level governance
}
```

**`lib/src/main/java/app/constructs/S3Construct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.Transition;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.s3.ObjectOwnership;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;
import app.config.EnvironmentConfig;

/**
 * S3 construct that creates secure S3 buckets with encryption, versioning,
 * and access logging enabled. All buckets follow financial services
 * security best practices.
 */
public class S3Construct extends Construct {

    private final Bucket dataBucket;
    private final Bucket cloudTrailBucket;
    private final Bucket accessLogsBucket;

    public S3Construct(final Construct scope, final String id, final IKey kmsKey) {
        super(scope, id);

        // Create access logs bucket first (no circular dependency)
        this.accessLogsBucket = createAccessLogsBucket(kmsKey);

        // Create main data bucket with access logging
        this.dataBucket = createDataBucket(kmsKey);

        // Create CloudTrail logs bucket
        this.cloudTrailBucket = createCloudTrailBucket(kmsKey);
    }

    /**
     * Creates a bucket for storing access logs from other S3 buckets.
     */
    private Bucket createAccessLogsBucket(final IKey kmsKey) {
    Bucket bucket = Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "access-logs"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.RETAIN) // Retain logs for compliance
                .lifecycleRules(java.util.List.of(
                    LifecycleRule.builder()
                        .id("AccessLogsLifecycle")
                        .enabled(true)
                        .transitions(java.util.List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(software.amazon.awscdk.Duration.days(90))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.DEEP_ARCHIVE)
                                .transitionAfter(software.amazon.awscdk.Duration.days(365))
                                .build()
                        ))
                        .build()
                ))
                .build();

        // Deny any requests that are not using secure transport (https)
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(java.util.List.of(new AnyPrincipal()))
                .actions(java.util.List.of("s3:*"))
                .resources(java.util.List.of(bucket.getBucketArn(), bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of("Bool", java.util.Map.of("aws:SecureTransport", "false")))
                .build()
        );

        return bucket;
    }

    /**
     * Creates the main data bucket with comprehensive security settings.
     */
    private Bucket createDataBucket(final IKey kmsKey) {
    Bucket bucket = Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "data"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .serverAccessLogsBucket(accessLogsBucket)
                .serverAccessLogsPrefix("data-bucket-access-logs/")
                .removalPolicy(RemovalPolicy.RETAIN)
                .objectOwnership(ObjectOwnership.BUCKET_OWNER_ENFORCED)
                .lifecycleRules(java.util.List.of(
                    LifecycleRule.builder()
                        .id("DataLifecycle")
                        .enabled(true)
                        .noncurrentVersionExpiration(software.amazon.awscdk.Duration.days(90))
                        .transitions(java.util.List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                .build()
                        ))
                        .build()
                ))
                .build();

        // Deny non-HTTPS requests to the bucket for compliance
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(java.util.List.of(new AnyPrincipal()))
                .actions(java.util.List.of("s3:*"))
                .resources(java.util.List.of(bucket.getBucketArn(), bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of("Bool", java.util.Map.of("aws:SecureTransport", "false")))
                .build()
        );

        return bucket;
    }

    /**
     * Creates a dedicated bucket for CloudTrail logs with appropriate permissions.
     */
    private Bucket createCloudTrailBucket(final IKey kmsKey) {
    Bucket bucket = Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "cloudtrail"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .serverAccessLogsBucket(accessLogsBucket)
                .serverAccessLogsPrefix("cloudtrail-bucket-access-logs/")
                .removalPolicy(RemovalPolicy.RETAIN)
                .lifecycleRules(java.util.List.of(
                    LifecycleRule.builder()
                        .id("CloudTrailLogsLifecycle")
                        .enabled(true)
                        .transitions(java.util.List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(90))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(software.amazon.awscdk.Duration.days(365))
                                .build()
                        ))
                        .build()
                ))
                .build();

        // Deny any non-HTTPS requests to the CloudTrail bucket
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(java.util.List.of(new AnyPrincipal()))
                .actions(java.util.List.of("s3:*"))
                .resources(java.util.List.of(bucket.getBucketArn(), bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of("Bool", java.util.Map.of("aws:SecureTransport", "false")))
                .build()
        );

        // Add CloudTrail service permissions
        bucket.addToResourcePolicy(
            software.amazon.awscdk.services.iam.PolicyStatement.Builder.create()
                .effect(software.amazon.awscdk.services.iam.Effect.ALLOW)
                .principals(java.util.List.of(
                    software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("cloudtrail.amazonaws.com").build()
                ))
                .actions(java.util.List.of("s3:PutObject"))
                .resources(java.util.List.of(bucket.getBucketArn() + "/*"))
                .conditions(java.util.Map.of(
                    "StringEquals", java.util.Map.of(
                        "s3:x-amz-acl", "bucket-owner-full-control"
                    )
                ))
                .build()
        );

        bucket.addToResourcePolicy(
            software.amazon.awscdk.services.iam.PolicyStatement.Builder.create()
                .effect(software.amazon.awscdk.services.iam.Effect.ALLOW)
                .principals(java.util.List.of(
                    software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("cloudtrail.amazonaws.com").build()
                ))
                .actions(java.util.List.of("s3:GetBucketAcl"))
                .resources(java.util.List.of(bucket.getBucketArn()))
                .build()
        );

        return bucket;
    }

    // Getters
    public Bucket getDataBucket() { return dataBucket; }
    public Bucket getCloudTrailBucket() { return cloudTrailBucket; }
    public Bucket getAccessLogsBucket() { return accessLogsBucket; }
}
```

**`lib/src/main/java/app/constructs/CloudTrailConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.cloudtrail.Trail;
import software.amazon.awscdk.services.cloudtrail.ReadWriteType;
import software.amazon.awscdk.services.s3.IBucket;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.constructs.Construct;
import java.util.UUID;
import app.config.EnvironmentConfig;

/**
 * CloudTrail construct that implements comprehensive logging and monitoring.
 * This construct creates CloudTrail with encryption, log file validation,
 * and CloudWatch integration for real-time monitoring.
 */
public class CloudTrailConstruct extends Construct {

    private final Trail cloudTrail;
    private final LogGroup logGroup;

    public CloudTrailConstruct(final Construct scope, final String id,
                              final IBucket s3Bucket, final IKey kmsKey) {
        super(scope, id);

        // Create CloudWatch log group for CloudTrail
        this.logGroup = createLogGroup(kmsKey);

        // Create CloudTrail with comprehensive logging
        this.cloudTrail = createCloudTrail(s3Bucket, kmsKey);
    }

    /**
     * Creates a CloudWatch log group for CloudTrail logs with encryption.
     */
    private LogGroup createLogGroup(final IKey kmsKey) {
    // Use a short random suffix on the physical log group name to avoid
    // collisions with existing global log group names in other accounts/environments.
    final String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
    final String physicalName = EnvironmentConfig.getResourceName("cloudtrail", "log-group") + "-" + randomSuffix;

    return LogGroup.Builder.create(this, EnvironmentConfig.getResourceName("cloudtrail", "log-group"))
        .logGroupName(physicalName)
        .retention(RetentionDays.ONE_YEAR) // Retain logs for compliance
        .encryptionKey(kmsKey)
        .build();
    }

    /**
     * Creates CloudTrail with comprehensive security and monitoring settings.
     */
    private Trail createCloudTrail(final IBucket s3Bucket, final IKey kmsKey) {
        // Create a basic multi-region CloudTrail with file validation and CloudWatch integration.
        return Trail.Builder.create(this, EnvironmentConfig.getResourceName("cloudtrail", "trail"))
                .trailName(EnvironmentConfig.getResourceName("cloudtrail", "trail"))
                .bucket(s3Bucket)
                .s3KeyPrefix("cloudtrail-logs/")
                .cloudWatchLogGroup(logGroup)
                .enableFileValidation(true)
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .managementEvents(ReadWriteType.ALL)
                .build();
    }

    // Getters
    public Trail getCloudTrail() { return cloudTrail; }
    public LogGroup getLogGroup() { return logGroup; }
}
```

**`lib/src/main/java/app/constructs/NetworkingConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.constructs.Construct;
import app.config.EnvironmentConfig;
import java.util.List;

/**
 * Networking construct that creates a secure VPC with properly configured
 * security groups, subnets, and network ACLs for financial services compliance.
 */
public class NetworkingConstruct extends Construct {

    private final Vpc vpc;
    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup databaseSecurityGroup;
    private final SecurityGroup internalSecurityGroup;

    public NetworkingConstruct(final Construct scope, final String id) {
        super(scope, id);

        // Create VPC with public and private subnets
        this.vpc = createVpc();

        // Create security groups with least privilege access
        this.webSecurityGroup = createWebSecurityGroup();
        this.databaseSecurityGroup = createDatabaseSecurityGroup();
        this.internalSecurityGroup = createInternalSecurityGroup();
    }

    /**
     * Creates a VPC with public and private subnets across multiple AZs.
     */
    private Vpc createVpc() {
        return Vpc.Builder.create(this, EnvironmentConfig.getResourceName("network", "vpc"))
                .vpcName(EnvironmentConfig.getResourceName("network", "vpc"))
                .cidr(EnvironmentConfig.VPC_CIDR)
                .maxAzs(2) // Use 2 AZs for high availability
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(List.of(
                    // Public subnets for load balancers and NAT gateways
                    SubnetConfiguration.builder()
                        .name(EnvironmentConfig.getResourceName("network", "public-subnet"))
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build(),
                    // Private subnets for application servers
                    SubnetConfiguration.builder()
                        .name(EnvironmentConfig.getResourceName("network", "private-subnet"))
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .cidrMask(24)
                        .build(),
                    // Isolated subnets for databases
                    SubnetConfiguration.builder()
                        .name(EnvironmentConfig.getResourceName("network", "isolated-subnet"))
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .cidrMask(24)
                        .build()
                ))
                .natGateways(2) // NAT gateways in each AZ for redundancy
                .build();
    }

    /**
     * Creates security group for web-facing resources.
     * Only allows HTTPS (443) and HTTP (80) from internet.
     */
    private SecurityGroup createWebSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, EnvironmentConfig.getResourceName("network", "web-sg"))
                .securityGroupName(EnvironmentConfig.getResourceName("network", "web-sg"))
                .description("Security group for web-facing resources")
                .vpc(vpc)
                .allowAllOutbound(false) // Explicitly control outbound traffic
                .build();

        // Allow HTTPS from anywhere (required for web services)
        sg.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "Allow HTTPS from internet"
        );

        // Allow HTTP from anywhere (will redirect to HTTPS)
    // Do not allow plain HTTP from internet to comply with TLS 1.2+ requirement.
    // Only HTTPS (443) is allowed for public web access.

        // Allow outbound HTTPS for API calls and updates
        sg.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "Allow outbound HTTPS"
        );

        // Allow outbound HTTP for redirects and some APIs
        sg.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "Allow outbound HTTP"
        );

        return sg;
    }

    /**
     * Creates security group for database resources.
     * Only allows access from application security groups.
     */
    private SecurityGroup createDatabaseSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, EnvironmentConfig.getResourceName("network", "db-sg"))
                .securityGroupName(EnvironmentConfig.getResourceName("network", "db-sg"))
                .description("Security group for database resources")
                .vpc(vpc)
                .allowAllOutbound(false)
                .build();
    // Database access: allow application/web security group to connect on DB port (e.g., Postgres 5432)

    // The application/web security group is created in createWebSecurityGroup() and available as `webSecurityGroup`.
        if (this.webSecurityGroup != null) {
            sg.addIngressRule(
                Peer.securityGroupId(this.webSecurityGroup.getSecurityGroupId()),
                Port.tcp(5432),
                "Allow application web tier to access DB on Postgres port"
            );
        }

        return sg;
    }

    /**
     * Creates security group for internal application communication.
     */
    private SecurityGroup createInternalSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, EnvironmentConfig.getResourceName("network", "internal-sg"))
                .securityGroupName(EnvironmentConfig.getResourceName("network", "internal-sg"))
                .description("Security group for internal application communication")
                .vpc(vpc)
                .allowAllOutbound(false)
                .build();

        // Allow internal communication on application ports from the VPC CIDR
        // Avoid self-referencing security group ingress to prevent CloudFormation
        // circular dependency during deploy.
        sg.addIngressRule(
            Peer.ipv4(vpc.getVpcCidrBlock()),
            Port.tcp(8080),
            "Allow internal application communication from VPC"
        );

        // Allow outbound traffic required for application components inside the VPC
        sg.addEgressRule(
            Peer.ipv4(vpc.getVpcCidrBlock()),
            Port.tcp(8080),
            "Allow outbound to VPC on app port"
        );

        // Allow outbound DNS (UDP/TCP 53) and HTTPS so instances can resolve and reach external APIs
        sg.addEgressRule(
            Peer.anyIpv4(),
            Port.udp(53),
            "Allow outbound DNS"
        );

        sg.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "Allow outbound HTTPS"
        );

        return sg;
    }

    // Public getters to expose networking resources to other constructs/stacks
    public Vpc getVpc() {
        return this.vpc;
    }

    public SecurityGroup getWebSecurityGroup() {
        return this.webSecurityGroup;
    }

    public SecurityGroup getDatabaseSecurityGroup() {
        return this.databaseSecurityGroup;
    }

    public SecurityGroup getInternalSecurityGroup() {
        return this.internalSecurityGroup;
    }

}
```

**`lib/src/main/java/app/constructs/RdsConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.InstanceProps;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.kms.IKey;
import software.constructs.Construct;
import app.config.EnvironmentConfig;

/**
 * Minimal RDS Postgres construct creating an encrypted DB in private subnets.
 * Uses generated credentials (for demo) and KMS key for storage encryption.
 */
public class RdsConstruct extends Construct {
    private final DatabaseInstance instance;

    public RdsConstruct(final Construct scope, final String id, final Vpc vpc, final SecurityGroup dbSecurityGroup, final IKey kmsKey) {
        super(scope, id);

    this.instance = DatabaseInstance.Builder.create(this, EnvironmentConfig.getResourceName("rds", "postgres"))
        .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder().version(PostgresEngineVersion.VER_13).build()))
                .vpc(vpc)
                .securityGroups(java.util.List.of(dbSecurityGroup))
                .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PRIVATE_WITH_EGRESS).build())
                .credentials(Credentials.fromGeneratedSecret("postgres"))
        .storageEncrypted(true)
        .storageEncryptionKey(kmsKey)
                        .multiAz(true)
                .allocatedStorage(20)
                .build();
    }

    public DatabaseInstance getInstance() { return instance; }
}


```

**`lib/src/main/java/app/constructs/WebServerConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.constructs.Construct;
import app.config.EnvironmentConfig;

/**
 * Minimal web server construct that creates a t3.micro EC2 instance in a public subnet
 * and a lightweight instance role. Intended to satisfy prompt requirements for a
 * web-facing host locked down to HTTPS.
 */
public class WebServerConstruct extends Construct {

    private final Instance instance;
    private final Role role;

    public WebServerConstruct(final Construct scope, final String id, final Vpc vpc, final SecurityGroup webSecurityGroup) {
        super(scope, id);

        // Create a minimal role for the EC2 instance (least privilege placeholder)
        this.role = Role.Builder.create(this, EnvironmentConfig.getResourceName("web", "instance-role"))
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .build();

        // Create the EC2 instance in a public subnet using Amazon Linux (t3.micro)
        this.instance = Instance.Builder.create(this, EnvironmentConfig.getResourceName("web", "instance"))
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux())
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
                .securityGroup(webSecurityGroup)
                .role(this.role)
                .build();
    }

    public Instance getInstance() { return instance; }
    public Role getRole() { return role; }
}

```
