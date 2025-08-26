package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.constructs.Construct;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Complete infrastructure stack implementation using AWS CDK for Java
 * This single file contains all infrastructure components for multi-environment deployment
 */
public class TapStack extends Stack {
    
    // Environment configuration
    private static class EnvironmentConfig {
        public final String environment;
        public final String region;
        public final String accountId;
        public final String suffix;
        public final String randomSuffix;
        public final String vpcCidr;
        public final List<String> publicSubnetCidrs;
        public final List<String> privateSubnetCidrs;
        public final String loggingBucket;
        public final String replicationBucket;
        public final String rolePrefix;
        public final Map<String, String> commonTags;
        
        public EnvironmentConfig(String environment, String region, String accountId, String suffix,
                                String randomSuffix, String vpcCidr, List<String> publicSubnetCidrs,
                                List<String> privateSubnetCidrs, String loggingBucket, String replicationBucket,
                                String rolePrefix, Map<String, String> commonTags) {
            this.environment = environment;
            this.region = region;
            this.accountId = accountId;
            this.suffix = suffix;
            this.randomSuffix = randomSuffix;
            this.vpcCidr = vpcCidr;
            this.publicSubnetCidrs = publicSubnetCidrs;
            this.privateSubnetCidrs = privateSubnetCidrs;
            this.loggingBucket = loggingBucket;
            this.replicationBucket = replicationBucket;
            this.rolePrefix = rolePrefix;
            this.commonTags = commonTags;
        }
    }
    
    // VPC Component class
    private static class VPCComponent {
        public final Vpc vpc;
        public final List<Subnet> publicSubnets;
        public final List<Subnet> privateSubnets;
        public final InternetGateway internetGateway;
        public final List<NatGateway> natGateways;
        
        public VPCComponent(Vpc vpc, List<Subnet> publicSubnets, List<Subnet> privateSubnets,
                          InternetGateway internetGateway, List<NatGateway> natGateways) {
            this.vpc = vpc;
            this.publicSubnets = publicSubnets;
            this.privateSubnets = privateSubnets;
            this.internetGateway = internetGateway;
            this.natGateways = natGateways;
        }
    }
    
    // IAM Component class
    private static class IAMComponent {
        public final Role ec2Role;
        public final Role lambdaRole;
        
        public IAMComponent(Role ec2Role, Role lambdaRole) {
            this.ec2Role = ec2Role;
            this.lambdaRole = lambdaRole;
        }
    }
    
    // S3 Component class
    private static class S3Component {
        public final Bucket loggingBucket;
        public final Bucket replicationBucket;
        
        public S3Component(Bucket loggingBucket, Bucket replicationBucket) {
            this.loggingBucket = loggingBucket;
            this.replicationBucket = replicationBucket;
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
    private EnvironmentConfig getConfig(String env) {
        Map<String, EnvironmentConfig> configs = new HashMap<>();
        
        configs.put("dev", getDevConfig());
        configs.put("staging", getStagingConfig());
        configs.put("prod", getProdConfig());
        
        EnvironmentConfig config = configs.get(env);
        if (config == null) {
            throw new IllegalArgumentException("Unknown environment: " + env);
        }
        
        return config;
    }
    
    /**
     * Development environment configuration
     */
    private EnvironmentConfig getDevConfig() {
        String environment = "dev";
        String suffix = getEnvironmentSuffix(environment);
        String randomSuffix = generateRandomSuffix();
        String accountId = getAccountId(environment);
        
        Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", environment);
        commonTags.put("Project", "infrastructure");
        commonTags.put("ManagedBy", "cdk");
        commonTags.put("Suffix", suffix);
        
        return new EnvironmentConfig(
            environment,
            "us-east-1",
            accountId,
            suffix,
            randomSuffix,
            "10.0.0.0/16",
            Arrays.asList("10.0.1.0/24", "10.0.2.0/24"),
            Arrays.asList("10.0.10.0/24", "10.0.20.0/24"),
            String.format("logs-%s-%s-%s", accountId, suffix, randomSuffix),
            String.format("logs-replica-%s-%s-%s", accountId, suffix, randomSuffix),
            String.format("%s-%s", suffix, randomSuffix),
            commonTags
        );
    }
    
    /**
     * Staging environment configuration
     */
    private EnvironmentConfig getStagingConfig() {
        String environment = "staging";
        String suffix = getEnvironmentSuffix(environment);
        String randomSuffix = generateRandomSuffix();
        String accountId = getAccountId(environment);
        
        Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", environment);
        commonTags.put("Project", "infrastructure");
        commonTags.put("ManagedBy", "cdk");
        commonTags.put("Suffix", suffix);
        
        return new EnvironmentConfig(
            environment,
            "us-east-2",
            accountId,
            suffix,
            randomSuffix,
            "10.1.0.0/16",
            Arrays.asList("10.1.1.0/24", "10.1.2.0/24"),
            Arrays.asList("10.1.10.0/24", "10.1.20.0/24"),
            String.format("logs-%s-%s-%s", accountId, suffix, randomSuffix),
            String.format("logs-replica-%s-%s-%s", accountId, suffix, randomSuffix),
            String.format("%s-%s", suffix, randomSuffix),
            commonTags
        );
    }
    
    /**
     * Production environment configuration
     */
    private EnvironmentConfig getProdConfig() {
        String environment = "prod";
        String suffix = getEnvironmentSuffix(environment);
        String randomSuffix = generateRandomSuffix();
        String accountId = getAccountId(environment);
        
        Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", environment);
        commonTags.put("Project", "infrastructure");
        commonTags.put("ManagedBy", "cdk");
        commonTags.put("Suffix", suffix);
        
        return new EnvironmentConfig(
            environment,
            "us-west-1",
            accountId,
            suffix,
            randomSuffix,
            "10.2.0.0/16",
            Arrays.asList("10.2.1.0/24", "10.2.2.0/24"),
            Arrays.asList("10.2.10.0/24", "10.2.20.0/24"),
            String.format("logs-%s-%s-%s", accountId, suffix, randomSuffix),
            String.format("logs-replica-%s-%s-%s", accountId, suffix, randomSuffix),
            String.format("%s-%s", suffix, randomSuffix),
            commonTags
        );
    }
    
    /**
     * Build VPC component with networking
     */
    private VPCComponent buildVPCComponent() {
        // Create VPC
        Vpc vpc = Vpc.Builder.create(this, "MainVPC")
            .cidr(config.vpcCidr)
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
            publicSubnets.stream().map(s -> (Subnet)s).collect(Collectors.toList()),
            privateSubnets.stream().map(s -> (Subnet)s).collect(Collectors.toList()),
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
            .roleName(config.rolePrefix + "-ec2-role")
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
            .roleName(config.rolePrefix + "-lambda-role")
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
                    .build(),
                PolicyStatement.Builder.create()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList("s3:ListBucket"))
                    .resources(Arrays.asList(
                        String.format("arn:aws:s3:::%s", config.loggingBucket),
                        String.format("arn:aws:s3:::%s", config.replicationBucket)
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
            .enforceSSL(true)
            .lifecycleRules(Arrays.asList(
                LifecycleRule.builder()
                    .id("transition-to-glacier")
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
            .enforceSSL(true)
            .lifecycleRules(Arrays.asList(
                LifecycleRule.builder()
                    .id("transition-to-glacier")
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
        
        // Set up cross-region replication if needed
        if (!config.environment.equals("dev")) {
            // Create replication role
            Role replicationRole = Role.Builder.create(this, "S3ReplicationRole")
                .roleName(config.rolePrefix + "-s3-replication-role")
                .assumedBy(new ServicePrincipal("s3.amazonaws.com"))
                .inlinePolicies(Map.of(
                    "ReplicationPolicy", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(Arrays.asList(
                                    "s3:GetReplicationConfiguration",
                                    "s3:ListBucket"
                                ))
                                .resources(Arrays.asList(loggingBucket.getBucketArn()))
                                .build(),
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(Arrays.asList(
                                    "s3:GetObjectVersionForReplication",
                                    "s3:GetObjectVersionAcl"
                                ))
                                .resources(Arrays.asList(loggingBucket.getBucketArn() + "/*"))
                                .build(),
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(Arrays.asList(
                                    "s3:ReplicateObject",
                                    "s3:ReplicateDelete"
                                ))
                                .resources(Arrays.asList(replicationBucket.getBucketArn() + "/*"))
                                .build()
                        ))
                        .build()
                ))
                .build();
            
            // Configure replication
            CfnBucket cfnLoggingBucket = (CfnBucket) loggingBucket.getNode().getDefaultChild();
            cfnLoggingBucket.setReplicationConfiguration(
                CfnBucket.ReplicationConfigurationProperty.builder()
                    .role(replicationRole.getRoleArn())
                    .rules(Arrays.asList(
                        CfnBucket.ReplicationRuleProperty.builder()
                            .id("replicate-all")
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
                                    .bucket(replicationBucket.getBucketArn())
                                    .storageClass("STANDARD_IA")
                                    .build()
                            )
                            .build()
                    ))
                    .build()
            );
        }
        
        return new S3Component(loggingBucket, replicationBucket);
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
        Random random = new Random();
        return String.format("%06x", random.nextInt(0xffffff));
    }
    
    private String getEnvironmentSuffix(String environment) {
        String suffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (suffix == null || suffix.isEmpty()) {
            suffix = environment;
        }
        return suffix;
    }
    
    private String getAccountId(String environment) {
        String accountId = System.getenv("AWS_ACCOUNT_ID");
        if (accountId == null || accountId.isEmpty()) {
            switch (environment) {
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
    public static void main(String[] args) {
        App app = new App();
        
        String environment = (String) app.getNode().tryGetContext("environment");
        if (environment == null) {
            environment = "dev";
        }
        
        new TapStack(app, "TapStack-" + environment, StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region(System.getenv("CDK_DEFAULT_REGION"))
                .build())
            .build());
        
        app.synth();
    }
}