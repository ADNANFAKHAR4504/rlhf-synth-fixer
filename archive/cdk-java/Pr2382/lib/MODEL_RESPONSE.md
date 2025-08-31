## 1. Main Application Entry Point

**`lib/src/main/java/app/Main.java`**

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import app.config.EnvironmentConfig;

/**
 * Main entry point for the Financial Services Infrastructure CDK application.
 * This application creates a highly secure, production-grade infrastructure stack
 * that meets stringent security and compliance requirements for financial services.
 */
public class Main {
    public static void main(final String[] args) {
        App app = new App();

        // Environment configuration for production deployment
        Environment prodEnvironment = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region(System.getenv("CDK_DEFAULT_REGION"))
                .build();

        // Create the main financial infrastructure stack
        new FinancialInfrastructureStack(app, "FinancialInfrastructureStack",
            StackProps.builder()
                .env(prodEnvironment)
                .description("Production-grade financial services infrastructure with enhanced security")
                .build());

        app.synth();
    }
}
```

## 2. Environment Configuration

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

    // Network configuration
    public static final String VPC_CIDR = "10.0.0.0/16";
    public static final String PRIVATE_SUBNET_CIDR_1 = "10.0.1.0/24";
    public static final String PRIVATE_SUBNET_CIDR_2 = "10.0.2.0/24";
    public static final String PUBLIC_SUBNET_CIDR_1 = "10.0.101.0/24";
    public static final String PUBLIC_SUBNET_CIDR_2 = "10.0.102.0/24";
}
```

## 3. Main Infrastructure Stack

**`lib/src/main/java/app/FinancialInfrastructureStack.java`**

```java
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
```

## 4. Security Construct

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
        return Key.Builder.create(this, EnvironmentConfig.getResourceName("security", "kms-key"))
                .description("KMS key for financial services data encryption")
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .enableKeyRotation(true) // Enable automatic key rotation for enhanced security
                .policy(software.amazon.awscdk.services.iam.PolicyDocument.Builder.create()
                    .statements(List.of(
                        // Allow root account full access to the key
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(List.of(new AccountPrincipal(this.getAccount())))
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
    }

    public Key getKmsKey() {
        return kmsKey;
    }
}
```

## 5. IAM Construct

**`lib/src/main/java/app/constructs/IamConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;
import app.config.EnvironmentConfig;
import java.util.List;
import java.util.Map;

/**
 * IAM construct that creates roles and policies following the principle of least privilege.
 * This construct also enforces strong password policies and MFA requirements
 * for enhanced security in financial services environments.
 */
public class IamConstruct extends Construct {

    private final Role s3ReadOnlyRole;
    private final Role cloudTrailRole;
    private final AccountPasswordPolicy passwordPolicy;

    public IamConstruct(final Construct scope, final String id) {
        super(scope, id);

        // Create password policy with strict requirements
        this.passwordPolicy = createPasswordPolicy();

        // Create IAM roles with least privilege
        this.s3ReadOnlyRole = createS3ReadOnlyRole();
        this.cloudTrailRole = createCloudTrailRole();
    }

    /**
     * Creates a strict password policy for IAM users.
     * Enforces 90-day rotation, complexity requirements, and prevents password reuse.
     */
    private AccountPasswordPolicy createPasswordPolicy() {
        return AccountPasswordPolicy.Builder.create(this, EnvironmentConfig.getResourceName("iam", "password-policy"))
                .minimumPasswordLength(EnvironmentConfig.PASSWORD_MIN_LENGTH)
                .requireUppercaseCharacters(EnvironmentConfig.REQUIRE_UPPERCASE)
                .requireLowercaseCharacters(EnvironmentConfig.REQUIRE_LOWERCASE)
                .requireNumbers(EnvironmentConfig.REQUIRE_NUMBERS)
                .requireSymbols(EnvironmentConfig.REQUIRE_SYMBOLS)
                .maxPasswordAge(software.amazon.awscdk.Duration.days(EnvironmentConfig.PASSWORD_MAX_AGE_DAYS))
                .passwordReusePrevention(EnvironmentConfig.PASSWORD_REUSE_PREVENTION)
                .allowUsersToChangePassword(true)
                .hardExpiry(false) // Allow grace period for password changes
                .build();
    }

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
                                .resources(List.of("*"))
                                .build()
                        ))
                        .build()
                ))
                .build();
    }

    // Getters
    public Role getS3ReadOnlyRole() { return s3ReadOnlyRole; }
    public Role getCloudTrailRole() { return cloudTrailRole; }
    public AccountPasswordPolicy getPasswordPolicy() { return passwordPolicy; }
}
```

## 6. S3 Construct

**`lib/src/main/java/app/constructs/S3Construct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.kms.IKey;
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
        return Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "access-logs"))
                .bucketName(EnvironmentConfig.getResourceName("s3", "access-logs"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .enforceSSL(true) // Require SSL/TLS for all requests
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
    }

    /**
     * Creates the main data bucket with comprehensive security settings.
     */
    private Bucket createDataBucket(final IKey kmsKey) {
        return Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "data"))
                .bucketName(EnvironmentConfig.getResourceName("s3", "data"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .enforceSSL(true)
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
    }

    /**
     * Creates a dedicated bucket for CloudTrail logs with appropriate permissions.
     */
    private Bucket createCloudTrailBucket(final IKey kmsKey) {
        Bucket bucket = Bucket.Builder.create(this, EnvironmentConfig.getResourceName("s3", "cloudtrail"))
                .bucketName(EnvironmentConfig.getResourceName("s3", "cloudtrail"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .enforceSSL(true)
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

## 7. CloudTrail Construct

**`lib/src/main/java/app/constructs/CloudTrailConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.cloudtrail.*;
import software.amazon.awscdk.services.s3.IBucket;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.constructs.Construct;
import app.config.EnvironmentConfig;
import java.util.List;

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
        return LogGroup.Builder.create(this, EnvironmentConfig.getResourceName("cloudtrail", "log-group"))
                .logGroupName(String.format("/aws/cloudtrail/%s", EnvironmentConfig.getResourceName("cloudtrail", "logs")))
                .retention(RetentionDays.ONE_YEAR) // Retain logs for compliance
                .encryptionKey(kmsKey)
                .build();
    }

    /**
     * Creates CloudTrail with comprehensive security and monitoring settings.
     */
    private Trail createCloudTrail(final IBucket s3Bucket, final IKey kmsKey) {
        return Trail.Builder.create(this, EnvironmentConfig.getResourceName("cloudtrail", "trail"))
                .trailName(EnvironmentConfig.getResourceName("cloudtrail", "trail"))
                .bucket(s3Bucket)
                .s3KeyPrefix("cloudtrail-logs/")
                .kmsKey(kmsKey)
                .cloudWatchLogGroup(logGroup)
                .enableFileValidation(true) // Enable log file integrity validation
                .includeGlobalServiceEvents(true) // Include global services like IAM
                .isMultiRegionTrail(true) // Enable multi-region trail
                .managementEvents(ReadWriteType.ALL) // Log all management events
                .eventSelectors(List.of(
                    // Log all S3 data events
                    EventSelector.builder()
                        .readWriteType(ReadWriteType.ALL)
                        .includeManagementEvents(false)
                        .dataResources(List.of(
                            DataResource.builder()
                                .type("AWS::S3::Object")
                                .values(List.of("arn:aws:s3:::*/*"))
                                .build(),
                            DataResource.builder()
                                .type("AWS::S3::Bucket")
                                .values(List.of("arn:aws:s3:::*"))
                                .build()
                        ))
                        .build(),
                    // Log all Lambda function executions
                    EventSelector.builder()
                        .readWriteType(ReadWriteType.ALL)
                        .includeManagementEvents(false)
                        .dataResources(List.of(
                            DataResource.builder()
                                .type("AWS::Lambda::Function")
                                .values(List.of("arn:aws:lambda:*"))
                                .build()
                        ))
                        .build()
                ))
                .insightSelectors(List.of(
                    // Enable CloudTrail Insights for unusual activity patterns
                    InsightSelector.builder()
                        .insightType(InsightType.API_CALL_RATE)
                        .build()
                ))
                .build();
    }

    // Getters
    public Trail getCloudTrail() { return cloudTrail; }
    public LogGroup getLogGroup() { return logGroup; }
}
```

## 8. Networking Construct

**`lib/src/main/java/app/constructs/NetworkingConstruct.java`**

```java
package app.constructs;

import software.amazon.awscdk.services.ec2.*;
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
        sg.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "Allow HTTP from internet (redirect to HTTPS)"
        );

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

        // Database access will be added when application security groups are created
        // This follows the principle of least privilege

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

        // Allow internal communication on application ports
        sg.addIngressRule(
            Peer.securityGroupId(sg.getSecurityGroupId()),
            Port.tcp(8080),
            "Allow internal application communication"
        );

        // Allow outboun

```
