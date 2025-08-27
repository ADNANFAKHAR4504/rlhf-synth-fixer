```java
// Main.java
package app;

import software.amazon.awscdk.App;



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

        // Get environment from context or default to 'dev'
        String environment = (String) app.getNode().tryGetContext("environment");
        if (environment == null) {
            environment = System.getenv("ENVIRONMENT");
            if (environment == null || environment.isEmpty()) {
                environment = "dev";
            }
        }

        // Create the main TAP stack using the TapStack class
        new TapStack(app, "TapStack-" + environment, software.amazon.awscdk.StackProps.builder()
                .env(software.amazon.awscdk.Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(System.getenv("CDK_DEFAULT_REGION"))
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}

```

```java
// TapStack.java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.ISubnet;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.Subnet;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Policy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyProps;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.CfnBucket;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.s3.Transition;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Random;
import java.util.stream.Collectors;
// Import Stack from java.util explicitly resolved through full qualification where needed

/**
 * Complete infrastructure stack implementation using AWS CDK for Java
 * This single file contains all infrastructure components for multi-environment deployment
 */
public class TapStack extends software.amazon.awscdk.Stack {

    // Environment configuration
    private static final class EnvironmentConfig {
        private final String environment;
        private final String region;
        private final String accountId;
        private final String suffix;
        private final String randomSuffix;
        private final String vpcCidr;
        private final List<String> publicSubnetCidrs;
        private final List<String> privateSubnetCidrs;
        private final String loggingBucket;
        private final String replicationBucket;
        private final String rolePrefix;
        private final Map<String, String> commonTags;

        private EnvironmentConfig(final Builder builder) {
            this.environment = builder.environment;
            this.region = builder.region;
            this.accountId = builder.accountId;
            this.suffix = builder.suffix;
            this.randomSuffix = builder.randomSuffix;
            this.vpcCidr = builder.vpcCidr;
            this.publicSubnetCidrs = builder.publicSubnetCidrs;
            this.privateSubnetCidrs = builder.privateSubnetCidrs;
            this.loggingBucket = builder.loggingBucket;
            this.replicationBucket = builder.replicationBucket;
            this.rolePrefix = builder.rolePrefix;
            this.commonTags = builder.commonTags;
        }

        static Builder builder() {
            return new Builder();
        }

        static final class Builder {
            private String environment;
            private String region;
            private String accountId;
            private String suffix;
            private String randomSuffix;
            private String vpcCidr;
            private List<String> publicSubnetCidrs;
            private List<String> privateSubnetCidrs;
            private String loggingBucket;
            private String replicationBucket;
            private String rolePrefix;
            private Map<String, String> commonTags;

            Builder environment(final String value) {
                this.environment = value;
                return this;
            }

            Builder region(final String value) {
                this.region = value;
                return this;
            }

            Builder accountId(final String value) {
                this.accountId = value;
                return this;
            }

            Builder suffix(final String value) {
                this.suffix = value;
                return this;
            }

            Builder randomSuffix(final String value) {
                this.randomSuffix = value;
                return this;
            }

            Builder vpcCidr(final String value) {
                this.vpcCidr = value;
                return this;
            }

            Builder publicSubnetCidrs(final List<String> value) {
                this.publicSubnetCidrs = value;
                return this;
            }

            Builder privateSubnetCidrs(final List<String> value) {
                this.privateSubnetCidrs = value;
                return this;
            }

            Builder loggingBucket(final String value) {
                this.loggingBucket = value;
                return this;
            }

            Builder replicationBucket(final String value) {
                this.replicationBucket = value;
                return this;
            }

            Builder rolePrefix(final String value) {
                this.rolePrefix = value;
                return this;
            }

            Builder commonTags(final Map<String, String> value) {
                this.commonTags = value;
                return this;
            }

            EnvironmentConfig build() {
                return new EnvironmentConfig(this);
            }
        }
    }

    // VPC Component class
    private static final class VPCComponent {
        private final Vpc vpc;
        private final List<Subnet> publicSubnets;
        private final List<Subnet> privateSubnets;
        private final software.amazon.awscdk.services.ec2.CfnInternetGateway internetGateway;
        private final List<software.amazon.awscdk.services.ec2.CfnNatGateway> natGateways;

        VPCComponent(final Vpc vpcInstance, final List<Subnet> publicSubnetsList, final List<Subnet> privateSubnetsList,
                          final software.amazon.awscdk.services.ec2.CfnInternetGateway internetGatewayInstance,
                          final List<software.amazon.awscdk.services.ec2.CfnNatGateway> natGatewaysList) {
            this.vpc = vpcInstance;
            this.publicSubnets = publicSubnetsList;
            this.privateSubnets = privateSubnetsList;
            this.internetGateway = internetGatewayInstance;
            this.natGateways = natGatewaysList;
        }
    }

    // IAM Component class
    private static final class IAMComponent {
        private final Role ec2Role;
        private final Role lambdaRole;

        IAMComponent(final Role ec2RoleInstance, final Role lambdaRoleInstance) {
            this.ec2Role = ec2RoleInstance;
            this.lambdaRole = lambdaRoleInstance;
        }
    }

    // S3 Component class
    private static final class S3Component {
        private final Bucket loggingBucket;
        private final Bucket replicationBucket;

        S3Component(final Bucket loggingBucketInstance, final Bucket replicationBucketInstance) {
            this.loggingBucket = loggingBucketInstance;
            this.replicationBucket = replicationBucketInstance;
        }
    }

    private final EnvironmentConfig config;
    private final VPCComponent vpcComponent;
    private final IAMComponent iamComponent;
    private final S3Component s3Component;

    /**
     * Constructor for TapStack
     */
    public TapStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    /**
     * Constructor for TapStack with props
     */
    public TapStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Get environment from context or default to dev
        String environment = (String) this.getNode().tryGetContext("environment");
        if (environment == null || environment.isEmpty()) {
            environment = System.getenv("ENVIRONMENT");
            if (environment == null || environment.isEmpty()) {
                environment = "dev";
            }
        }

        // Get configuration for the environment
        this.config = getConfig(environment);

        // Build infrastructure components
        this.vpcComponent = buildVPCComponent();
        this.iamComponent = buildIAMComponent();
        this.s3Component = buildS3Component();

        // Create outputs
        createOutputs();
    }

    /**
     * Get configuration for specified environment
     */
    private EnvironmentConfig getConfig(final String env) {
        Map<String, EnvironmentConfig> configs = new HashMap<>();

        configs.put("dev", getDevConfig());
        configs.put("staging", getStagingConfig());
        configs.put("prod", getProdConfig());

        final EnvironmentConfig envConfig = configs.get(env);
        if (envConfig == null) {
            throw new IllegalArgumentException("Unknown environment: " + env);
        }

        return envConfig;
    }

    /**
     * Development environment configuration
     */
    private EnvironmentConfig getDevConfig() {
        final String environmentName = "dev";
        final String suffix = getEnvironmentSuffix(environmentName);
        final String randomSuffix = generateRandomSuffix();
        final String accountId = getAccountId(environmentName);

        final Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", environmentName);
        commonTags.put("Project", "infrastructure");
        commonTags.put("ManagedBy", "cdk");
        commonTags.put("Suffix", suffix);

        return EnvironmentConfig.builder()
            .environment(environmentName)
            .region("us-east-1")
            .accountId(accountId)
            .suffix(suffix)
            .randomSuffix(randomSuffix)
            .vpcCidr("10.0.0.0/16")
            .publicSubnetCidrs(Arrays.asList("10.0.1.0/24", "10.0.2.0/24"))
            .privateSubnetCidrs(Arrays.asList("10.0.10.0/24", "10.0.20.0/24"))
            .loggingBucket(String.format("logs-%s-%s-%s", accountId, suffix, randomSuffix))
            .replicationBucket(String.format("logs-replica-%s-%s-%s", accountId, suffix, randomSuffix))
            .rolePrefix(String.format("%s-%s", suffix, randomSuffix))
            .commonTags(commonTags)
            .build();
    }

    /**
     * Staging environment configuration
     */
    private EnvironmentConfig getStagingConfig() {
        final String environmentName = "staging";
        final String suffix = getEnvironmentSuffix(environmentName);
        final String randomSuffix = generateRandomSuffix();
        final String accountId = getAccountId(environmentName);

        final Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", environmentName);
        commonTags.put("Project", "infrastructure");
        commonTags.put("ManagedBy", "cdk");
        commonTags.put("Suffix", suffix);

        return EnvironmentConfig.builder()
            .environment(environmentName)
            .region("us-east-2")
            .accountId(accountId)
            .suffix(suffix)
            .randomSuffix(randomSuffix)
            .vpcCidr("10.1.0.0/16")
            .publicSubnetCidrs(Arrays.asList("10.1.1.0/24", "10.1.2.0/24"))
            .privateSubnetCidrs(Arrays.asList("10.1.10.0/24", "10.1.20.0/24"))
            .loggingBucket(String.format("logs-%s-%s-%s", accountId, suffix, randomSuffix))
            .replicationBucket(String.format("logs-replica-%s-%s-%s", accountId, suffix, randomSuffix))
            .rolePrefix(String.format("%s-%s", suffix, randomSuffix))
            .commonTags(commonTags)
            .build();
    }

    /**
     * Production environment configuration
     */
    private EnvironmentConfig getProdConfig() {
        final String environmentName = "prod";
        final String suffix = getEnvironmentSuffix(environmentName);
        final String randomSuffix = generateRandomSuffix();
        final String accountId = getAccountId(environmentName);

        final Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", environmentName);
        commonTags.put("Project", "infrastructure");
        commonTags.put("ManagedBy", "cdk");
        commonTags.put("Suffix", suffix);

        return EnvironmentConfig.builder()
            .environment(environmentName)
            .region("us-west-1")
            .accountId(accountId)
            .suffix(suffix)
            .randomSuffix(randomSuffix)
            .vpcCidr("10.2.0.0/16")
            .publicSubnetCidrs(Arrays.asList("10.2.1.0/24", "10.2.2.0/24"))
            .privateSubnetCidrs(Arrays.asList("10.2.10.0/24", "10.2.20.0/24"))
            .loggingBucket(String.format("logs-%s-%s-%s", accountId, suffix, randomSuffix))
            .replicationBucket(String.format("logs-replica-%s-%s-%s", accountId, suffix, randomSuffix))
            .rolePrefix(String.format("%s-%s", suffix, randomSuffix))
            .commonTags(commonTags)
            .build();
    }

    /**
     * Build VPC component with networking
     */
    private VPCComponent buildVPCComponent() {
        // Create VPC
        Vpc vpc = Vpc.Builder.create(this, "MainVPC")
            .ipAddresses(IpAddresses.cidr(config.vpcCidr))
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .maxAzs(2)
            .natGateways(config.publicSubnetCidrs.size())
            .subnetConfiguration(Arrays.asList(
                SubnetConfiguration.builder()
                    .name(config.environment + "-public")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name(config.environment + "-private")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .cidrMask(24)
                    .build()
            ))
            .build();

        // Tag the VPC
        Tags.of(vpc).add("Name", config.environment + "-vpc");
        Tags.of(vpc).add("Environment", config.environment);
        Tags.of(vpc).add("Project", config.commonTags.get("Project"));
        Tags.of(vpc).add("ManagedBy", config.commonTags.get("ManagedBy"));

        // Get subnets
        List<ISubnet> publicSubnets = vpc.getPublicSubnets();
        List<ISubnet> privateSubnets = vpc.getPrivateSubnets();

        // Tag subnets
        for (int i = 0; i < publicSubnets.size(); i++) {
            Tags.of(publicSubnets.get(i)).add("Name", String.format("%s-public-subnet-%d", config.environment, i));
            Tags.of(publicSubnets.get(i)).add("Type", "public");
            Tags.of(publicSubnets.get(i)).add("Environment", config.environment);
        }

        for (int i = 0; i < privateSubnets.size(); i++) {
            Tags.of(privateSubnets.get(i)).add("Name", String.format("%s-private-subnet-%d", config.environment, i));
            Tags.of(privateSubnets.get(i)).add("Type", "private");
            Tags.of(privateSubnets.get(i)).add("Environment", config.environment);
        }

        // Note: Internet Gateway and NAT Gateways are automatically created by CDK
        return new VPCComponent(
            vpc,
            publicSubnets.stream().map(s -> (Subnet) s).collect(Collectors.toList()),
            privateSubnets.stream().map(s -> (Subnet) s).collect(Collectors.toList()),
            null, // Internet Gateway is managed by CDK
            null  // NAT Gateways are managed by CDK
        );
    }

    /**
     * Build IAM component with roles and policies
     */
    private IAMComponent buildIAMComponent() {
        // Create EC2 role
        Role ec2Role = Role.Builder.create(this, "EC2Role")
            .roleName(config.environment + "-" + config.rolePrefix + "-ec2-role")
            .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
            .managedPolicies(Arrays.asList(
                ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
            ))
            .build();

        // Tag EC2 role
        Tags.of(ec2Role).add("Name", config.environment + "-ec2-role");
        Tags.of(ec2Role).add("Environment", config.environment);
        Tags.of(ec2Role).add("Project", config.commonTags.get("Project"));
        Tags.of(ec2Role).add("ManagedBy", config.commonTags.get("ManagedBy"));

        // Create Lambda role
        Role lambdaRole = Role.Builder.create(this, "LambdaRole")
            .roleName(config.environment + "-" + config.rolePrefix + "-lambda-role")
            .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
            .managedPolicies(Arrays.asList(
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ))
            .build();

        // Tag Lambda role
        Tags.of(lambdaRole).add("Name", config.environment + "-lambda-role");
        Tags.of(lambdaRole).add("Environment", config.environment);
        Tags.of(lambdaRole).add("Project", config.commonTags.get("Project"));
        Tags.of(lambdaRole).add("ManagedBy", config.commonTags.get("ManagedBy"));

        // Create S3 cross-account policy
        PolicyDocument s3PolicyDocument = PolicyDocument.Builder.create()
            .statements(Arrays.asList(
                PolicyStatement.Builder.create()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList(
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ))
                    .resources(Arrays.asList(
                        String.format("arn:aws:s3:::%s/*", config.loggingBucket),
                        String.format("arn:aws:s3:::%s/*", config.replicationBucket)
                    ))
                    .build()
            ))
            .build();

        Policy s3Policy = Policy.Builder.create(this, "S3CrossAccountPolicy")
            .policyName(config.rolePrefix + "-s3-cross-account-policy")
            .document(s3PolicyDocument)
            .build();

        // Attach S3 policy to both roles
        s3Policy.attachToRole(ec2Role);
        s3Policy.attachToRole(lambdaRole);

        return new IAMComponent(ec2Role, lambdaRole);
    }

    /**
     * Build S3 component with buckets
     */
    private S3Component buildS3Component() {
        // Create logging bucket
        Bucket loggingBucket = Bucket.Builder.create(this, "LoggingBucket")
            .bucketName(config.loggingBucket)
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .lifecycleRules(Arrays.asList(
                LifecycleRule.builder()
                    .enabled(true)
                    .transitions(Arrays.asList(
                        Transition.builder()
                            .storageClass(StorageClass.GLACIER)
                            .transitionAfter(Duration.days(30))
                            .build()
                    ))
                    .expiration(Duration.days(365))
                    .build()
            ))
            .removalPolicy(RemovalPolicy.RETAIN)
            .build();

        // Tag logging bucket
        Tags.of(loggingBucket).add("Name", config.loggingBucket);
        Tags.of(loggingBucket).add("Purpose", "logging");
        Tags.of(loggingBucket).add("Environment", config.environment);
        Tags.of(loggingBucket).add("Project", config.commonTags.get("Project"));
        Tags.of(loggingBucket).add("ManagedBy", config.commonTags.get("ManagedBy"));

        // Create replication bucket
        Bucket replicationBucket = Bucket.Builder.create(this, "ReplicationBucket")
            .bucketName(config.replicationBucket)
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .lifecycleRules(Arrays.asList(
                LifecycleRule.builder()
                    .enabled(true)
                    .transitions(Arrays.asList(
                        Transition.builder()
                            .storageClass(StorageClass.GLACIER)
                            .transitionAfter(Duration.days(30))
                            .build()
                    ))
                    .expiration(Duration.days(365))
                    .build()
            ))
            .removalPolicy(RemovalPolicy.RETAIN)
            .build();

        // Tag replication bucket
        Tags.of(replicationBucket).add("Name", config.replicationBucket);
        Tags.of(replicationBucket).add("Purpose", "replication");
        Tags.of(replicationBucket).add("Environment", config.environment);
        Tags.of(replicationBucket).add("Project", config.commonTags.get("Project"));
        Tags.of(replicationBucket).add("ManagedBy", config.commonTags.get("ManagedBy"));

        // Add S3 bucket policies for SSL enforcement
        addS3BucketPolicies(loggingBucket, replicationBucket);

        // Set up cross-region replication if needed (moved to separate method to avoid dependency cycle)
        if (!config.environment.equals("dev")) {
            setupS3Replication(loggingBucket, replicationBucket);
        }

        return new S3Component(loggingBucket, replicationBucket);
    }

    /**
     * Add SSL enforcement policies to S3 buckets
     */
    private void addS3BucketPolicies(final Bucket loggingBucket, final Bucket replicationBucket) {
        // SSL enforcement policy for logging bucket

        loggingBucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(Arrays.asList(new AnyPrincipal()))
                .actions(Arrays.asList("s3:*"))
                .resources(Arrays.asList(
                    loggingBucket.getBucketArn(),
                    loggingBucket.getBucketArn() + "/*"
                ))
                .conditions(Map.of(
                    "Bool", Map.of("aws:SecureTransport", "false")
                ))
                .build()
        );

        // SSL enforcement policy for replication bucket

        replicationBucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(Arrays.asList(new AnyPrincipal()))
                .actions(Arrays.asList("s3:*"))
                .resources(Arrays.asList(
                    replicationBucket.getBucketArn(),
                    replicationBucket.getBucketArn() + "/*"
                ))
                .conditions(Map.of(
                    "Bool", Map.of("aws:SecureTransport", "false")
                ))
                .build()
        );
    }

    /**
     * Setup S3 replication without dependency cycle
     */
    private void setupS3Replication(final Bucket loggingBucket, final Bucket replicationBucket) {
        // Create replication role independently
        Role replicationRole = Role.Builder.create(this, "S3ReplicationRole")
            .roleName(config.environment + "-" + config.rolePrefix + "-s3-replication-role")
            .assumedBy(new ServicePrincipal("s3.amazonaws.com"))
            .build();

        // Add replication policies to the role
        PolicyDocument replicationPolicy = PolicyDocument.Builder.create()
            .statements(Arrays.asList(
                PolicyStatement.Builder.create()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList(
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket"
                    ))
                    .resources(Arrays.asList("arn:aws:s3:::" + config.loggingBucket))
                    .build(),
                PolicyStatement.Builder.create()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList(
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl"
                    ))
                    .resources(Arrays.asList("arn:aws:s3:::" + config.loggingBucket + "/*"))
                    .build(),
                PolicyStatement.Builder.create()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList(
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete"
                    ))
                    .resources(Arrays.asList("arn:aws:s3:::" + config.replicationBucket + "/*"))
                    .build()
            ))
            .build();

        new Policy(this, "S3ReplicationPolicy", PolicyProps.builder()
            .document(replicationPolicy)
            .roles(Arrays.asList(replicationRole))
            .build());

        // Configure replication on the bucket
        CfnBucket cfnLoggingBucket = (CfnBucket) loggingBucket.getNode().getDefaultChild();
        cfnLoggingBucket.setReplicationConfiguration(
            CfnBucket.ReplicationConfigurationProperty.builder()
                .role(replicationRole.getRoleArn())
                .rules(Arrays.asList(
                    CfnBucket.ReplicationRuleProperty.builder()
                        .status("Enabled")
                        .priority(1)
                        .deleteMarkerReplication(
                            CfnBucket.DeleteMarkerReplicationProperty.builder()
                                .status("Enabled")
                                .build()
                        )
                        .filter(CfnBucket.ReplicationRuleFilterProperty.builder().build())
                        .destination(
                            CfnBucket.ReplicationDestinationProperty.builder()
                                .bucket("arn:aws:s3:::" + config.replicationBucket)
                                .storageClass("STANDARD_IA")
                                .build()
                        )
                        .build()
                ))
                .build()
        );
    }

    /**
     * Create stack outputs
     */
    private void createOutputs() {
        // VPC outputs
        new CfnOutput(this, "VpcId", CfnOutputProps.builder()
            .value(vpcComponent.vpc.getVpcId())
            .description("VPC ID")
            .build());

        new CfnOutput(this, "PublicSubnetIds", CfnOutputProps.builder()
            .value(String.join(",", vpcComponent.publicSubnets.stream()
                .map(Subnet::getSubnetId)
                .collect(Collectors.toList())))
            .description("Public subnet IDs")
            .build());

        new CfnOutput(this, "PrivateSubnetIds", CfnOutputProps.builder()
            .value(String.join(",", vpcComponent.privateSubnets.stream()
                .map(Subnet::getSubnetId)
                .collect(Collectors.toList())))
            .description("Private subnet IDs")
            .build());

        // S3 outputs
        new CfnOutput(this, "LoggingBucketName", CfnOutputProps.builder()
            .value(s3Component.loggingBucket.getBucketName())
            .description("Logging bucket name")
            .build());

        new CfnOutput(this, "ReplicationBucketName", CfnOutputProps.builder()
            .value(s3Component.replicationBucket.getBucketName())
            .description("Replication bucket name")
            .build());

        // IAM outputs
        new CfnOutput(this, "EC2RoleArn", CfnOutputProps.builder()
            .value(iamComponent.ec2Role.getRoleArn())
            .description("EC2 role ARN")
            .build());

        new CfnOutput(this, "LambdaRoleArn", CfnOutputProps.builder()
            .value(iamComponent.lambdaRole.getRoleArn())
            .description("Lambda role ARN")
            .build());
    }

    /**
     * Helper methods
     */
    private String generateRandomSuffix() {
        final Random random = new Random();
        return String.format("%06x", random.nextInt(0xffffff));
    }

    private String getEnvironmentSuffix(final String environmentName) {
        String suffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (suffix == null || suffix.isEmpty()) {
            suffix = environmentName;
        }
        return suffix;
    }

    private String getAccountId(final String environmentName) {
        final String accountId = System.getenv("AWS_ACCOUNT_ID");
        if (accountId == null || accountId.isEmpty()) {
            switch (environmentName) {
                case "dev":
                    return "123456789012";
                case "staging":
                    return "123456789013";
                case "prod":
                    return "123456789014";
                default:
                    return "123456789012";
            }
        }
        return accountId;
    }

    /**
     * Main method for testing
     */
    public static void main(final String[] args) {
        App app = new App();

        String environmentName = (String) app.getNode().tryGetContext("environment");
        if (environmentName == null) {
            environmentName = "dev";
        }

        new TapStack(app, "TapStack-" + environmentName, StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region(System.getenv("CDK_DEFAULT_REGION"))
                .build())
            .build());

        app.synth();
    }
}
```
