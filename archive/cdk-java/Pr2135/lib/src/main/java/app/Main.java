package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck;
import software.amazon.awscdk.services.elasticloadbalancingv2.Protocol;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.PerformanceInsightRetention;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.route53.ARecord;
import software.amazon.awscdk.services.route53.CfnHealthCheck;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.RecordTarget;
import software.amazon.awscdk.services.route53.targets.LoadBalancerTarget;
import software.amazon.awscdk.services.secretsmanager.Secret;
import software.amazon.awscdk.services.secretsmanager.SecretStringGenerator;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

/**
 * NovaStackProps holds configuration for the NovaStack.
 */
final class NovaStackProps {
    private final boolean isPrimary;
    private final String environmentSuffix;
    private final StackProps stackProps;

    private NovaStackProps(final boolean pIsPrimary, final String pEnvironmentSuffix, final StackProps pStackProps) {
        this.isPrimary = pIsPrimary;
        this.environmentSuffix = pEnvironmentSuffix;
        this.stackProps = pStackProps != null ? pStackProps : StackProps.builder().build();
    }

    public boolean isPrimary() {
        return isPrimary;
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

    public static final class Builder {
        private boolean isPrimary;
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder isPrimary(final boolean pIsPrimary) {
            this.isPrimary = pIsPrimary;
            return this;
        }

        public Builder environmentSuffix(final String pEnvironmentSuffix) {
            this.environmentSuffix = pEnvironmentSuffix;
            return this;
        }

        public Builder stackProps(final StackProps pStackProps) {
            this.stackProps = pStackProps;
            return this;
        }

        public NovaStackProps build() {
            return new NovaStackProps(isPrimary, environmentSuffix, stackProps);
        }
    }
}

/**
 * Route53StackProps holds configuration for the Route53Stack.
 */
final class Route53StackProps {
    private final ApplicationLoadBalancer primaryLoadBalancer;
    private final ApplicationLoadBalancer failoverLoadBalancer;
    private final StackProps stackProps;

    private Route53StackProps(final ApplicationLoadBalancer pPrimaryLoadBalancer,
                               final ApplicationLoadBalancer pFailoverLoadBalancer,
                               final StackProps pStackProps) {
        this.primaryLoadBalancer = pPrimaryLoadBalancer;
        this.failoverLoadBalancer = pFailoverLoadBalancer;
        this.stackProps = pStackProps != null ? pStackProps : StackProps.builder().build();
    }

    public ApplicationLoadBalancer getPrimaryLoadBalancer() {
        return primaryLoadBalancer;
    }

    public ApplicationLoadBalancer getFailoverLoadBalancer() {
        return failoverLoadBalancer;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private ApplicationLoadBalancer primaryLoadBalancer;
        private ApplicationLoadBalancer failoverLoadBalancer;
        private StackProps stackProps;

        public Builder primaryLoadBalancer(final ApplicationLoadBalancer pPrimaryLoadBalancer) {
            this.primaryLoadBalancer = pPrimaryLoadBalancer;
            return this;
        }

        public Builder failoverLoadBalancer(final ApplicationLoadBalancer pFailoverLoadBalancer) {
            this.failoverLoadBalancer = pFailoverLoadBalancer;
            return this;
        }

        public Builder stackProps(final StackProps pStackProps) {
            this.stackProps = pStackProps;
            return this;
        }

        public Route53StackProps build() {
            return new Route53StackProps(primaryLoadBalancer, failoverLoadBalancer, stackProps);
        }
    }
}


/**
 * Main entry point for the Nova CDK Java application.
 */
public final class Main {

    private static final String PRIMARY_REGION = "us-west-2";
    private static final String FAILOVER_REGION = "eu-central-1";
    private static final String DOMAIN_NAME = "nova-app.com"; // Replace with your actual domain

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();

        // Get environment suffix from context or default to 'dev'
        final String environmentSuffix = Optional.ofNullable(app.getNode().tryGetContext("environmentSuffix"))
                                           .map(Object::toString)
                                           .orElse("dev");

        // Create stacks for both regions using the new Props pattern
        final NovaStack primaryStack = new NovaStack(app, "NovaStack-Primary-" + environmentSuffix,
            NovaStackProps.builder()
                .isPrimary(true)
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                    .env(Environment.builder()
                        .region(PRIMARY_REGION)
                        .build())
                    .build())
                .build());

        final NovaStack failoverStack = new NovaStack(app, "NovaStack-Failover-" + environmentSuffix,
            NovaStackProps.builder()
                .isPrimary(false)
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                    .env(Environment.builder()
                        .region(FAILOVER_REGION)
                        .build())
                    .build())
                .build());

        // Create global Route 53 stack using the new Props pattern
        new Route53Stack(app, "NovaRoute53Stack-" + environmentSuffix,
            Route53StackProps.builder()
                .primaryLoadBalancer(primaryStack.getLoadBalancer())
                .failoverLoadBalancer(failoverStack.getLoadBalancer())
                .stackProps(StackProps.builder()
                    .crossRegionReferences(true) // Enable cross-region references for the application
                    .env(Environment.builder().region("us-east-1").build()) // Anchor the global stack
                    .build())
                .build());

        app.synth();
    }

    /**
     * Main infrastructure stack for each region.
     */
    static class NovaStack extends Stack {
        private final ApplicationLoadBalancer loadBalancer;
        private final DatabaseInstance database;
        private final boolean isPrimary;
        private final String environmentSuffix;

        NovaStack(final Construct scope, final String id, final NovaStackProps props) {
            super(scope, id, props.getStackProps());
            this.isPrimary = props.isPrimary();
            this.environmentSuffix = props.getEnvironmentSuffix();

            // Apply mandatory tagging to all resources in this stack
            Tags.of(this).add("Environment", "Production");
            Tags.of(this).add("Project", "Nova");
            Tags.of(this).add("Region", isPrimary ? "Primary" : "Failover");

            // Create VPC with proper subnet configuration
            final Vpc vpc = createVpc();

            // Create security groups
            final SecurityGroup dbSecurityGroup = createDatabaseSecurityGroup(vpc);
            final SecurityGroup albSecurityGroup = createLoadBalancerSecurityGroup(vpc);
            final SecurityGroup appSecurityGroup = createApplicationSecurityGroup(vpc, albSecurityGroup);

            // Configure database security group to allow access from app security group
            dbSecurityGroup.addIngressRule(appSecurityGroup, Port.tcp(5432), "PostgreSQL from application");

            // Create IAM roles
            createApplicationRole();

            // Create database secret
            final Secret dbSecret = createDatabaseSecret();

            // Create database (primary or read replica)
            this.database = createDatabase(vpc, dbSecurityGroup, dbSecret);

            // Create Application Load Balancer
            this.loadBalancer = createLoadBalancer(vpc, albSecurityGroup);

            // Create target group for health checks
            createTargetGroup(vpc);
        }

        /**
         * Creates a VPC with public and private subnets across multiple AZs.
         */
        private Vpc createVpc() {
            return Vpc.Builder.create(this, "NovaVpc")
                .maxAzs(3)
                .natGateways(2) // For high availability
                .subnetConfiguration(Arrays.asList(
                    SubnetConfiguration.builder()
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build(),
                    SubnetConfiguration.builder()
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .cidrMask(24)
                        .build(),
                    SubnetConfiguration.builder()
                        .name("DatabaseSubnet")
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .cidrMask(24)
                        .build()
                ))
                .build();
        }

        /**
         * Creates security group for RDS database with minimal required access.
         */
        private SecurityGroup createDatabaseSecurityGroup(final Vpc vpc) {
            return SecurityGroup.Builder.create(this, "DatabaseSecurityGroup")
                .vpc(vpc)
                .description("Security group for Nova PostgreSQL database")
                .allowAllOutbound(false)
                .build();
        }

        /**
         * Creates security group for Application Load Balancer.
         */
        private SecurityGroup createLoadBalancerSecurityGroup(final Vpc vpc) {
            final SecurityGroup sg = SecurityGroup.Builder.create(this, "LoadBalancerSecurityGroup")
                .vpc(vpc)
                .description("Security group for Nova Application Load Balancer")
                .allowAllOutbound(false)
                .build();

            // Allow HTTPS traffic from internet
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS traffic");
            sg.addIngressRule(Peer.anyIpv6(), Port.tcp(443), "HTTPS traffic IPv6");

            // Allow HTTP traffic for health checks and redirect to HTTPS
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "HTTP traffic");
            sg.addIngressRule(Peer.anyIpv6(), Port.tcp(80), "HTTP traffic IPv6");

            return sg;
        }

        /**
         * Creates security group for application instances.
         */
        private SecurityGroup createApplicationSecurityGroup(final Vpc vpc, final SecurityGroup albSecurityGroup) {
            final SecurityGroup sg = SecurityGroup.Builder.create(this, "ApplicationSecurityGroup")
                .vpc(vpc)
                .description("Security group for Nova application instances")
                .allowAllOutbound(true) // Allow outbound for API calls, updates, etc.
                .build();

            // Allow traffic from load balancer only
            sg.addIngressRule(albSecurityGroup, Port.tcp(8080), "Application port from ALB");

            return sg;
        }

        /**
         * Creates IAM role for application instances with least privilege.
         */
        private Role createApplicationRole() {
            return Role.Builder.create(this, "NovaApplicationRole")
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .description("IAM role for Nova application instances")
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .inlinePolicies(Map.of(
                    "NovaApplicationPolicy", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(Arrays.asList(
                                    "secretsmanager:GetSecretValue",
                                    "secretsmanager:DescribeSecret"
                                ))
                                .resources(Arrays.asList("arn:aws:secretsmanager:*:*:secret:nova/database/*"))
                                .build(),
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(Arrays.asList(
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ))
                                .resources(Arrays.asList("arn:aws:logs:*:*:log-group:/nova/*"))
                                .build()
                        ))
                        .build()
                ))
                .build();
        }

        /**
         * Creates a secret for database credentials.
         */
        private Secret createDatabaseSecret() {
            return Secret.Builder.create(this, "DatabaseSecret")
                .secretName("nova/database/credentials-" + this.environmentSuffix)
                .description("Database credentials for Nova application")
                .generateSecretString(SecretStringGenerator.builder()
                    .secretStringTemplate("{\"username\": \"novaadmin\"}")
                    .generateStringKey("password")
                    .excludeCharacters(" %+~`#$&*()|[]{}:;<>?!'/\"\\")
                    .passwordLength(32)
                    .build())
                .build();
        }

        /**
         * Creates RDS PostgreSQL database - primary instance or read replica.
         */
        private DatabaseInstance createDatabase(final Vpc vpc, final SecurityGroup securityGroup, final Secret secret) {
            // Create subnet group for database
            final SubnetGroup subnetGroup = SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
                .description("Subnet group for Nova database")
                .vpc(vpc)
                .subnetGroupName("nova-db-subnet-group-" + (isPrimary ? "primary" : "failover") + "-" + this.environmentSuffix)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_ISOLATED)
                    .build())
                .build();

            // Use a recent, supported PostgreSQL version
            final PostgresInstanceEngineProps engineProps = PostgresInstanceEngineProps.builder()
                .version(PostgresEngineVersion.VER_16_3)
                .build();

            if (isPrimary) {
                // Create primary database instance
                return DatabaseInstance.Builder.create(this, "PrimaryDatabase")
                    .engine(DatabaseInstanceEngine.postgres(engineProps))
                    .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                    .credentials(Credentials.fromSecret(secret))
                    .vpc(vpc)
                    .subnetGroup(subnetGroup)
                    .securityGroups(Arrays.asList(securityGroup))
                    .databaseName("novadb")
                    .backupRetention(Duration.days(7))
                    .deletionProtection(true)
                    .multiAz(true) // Enable Multi-AZ for high availability
                    .storageEncrypted(true)
                    .copyTagsToSnapshot(true) // Ensure tags are copied to automated backups
                    .monitoringInterval(Duration.seconds(60))
                    .enablePerformanceInsights(true)
                    .performanceInsightRetention(PerformanceInsightRetention.DEFAULT)
                    .removalPolicy(RemovalPolicy.SNAPSHOT)
                    .build();
            } else {
                // Create read replica in failover region
                return DatabaseInstance.Builder.create(this, "ReadReplicaDatabase")
                    .engine(DatabaseInstanceEngine.postgres(engineProps))
                    .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                    .credentials(Credentials.fromSecret(secret))
                    .vpc(vpc)
                    .subnetGroup(subnetGroup)
                    .securityGroups(Arrays.asList(securityGroup))
                    .storageEncrypted(true)
                    .monitoringInterval(Duration.seconds(60))
                    .enablePerformanceInsights(true)
                    .performanceInsightRetention(PerformanceInsightRetention.DEFAULT)
                    .removalPolicy(RemovalPolicy.SNAPSHOT)
                    .build();
            }
        }

        /**
         * Creates Application Load Balancer.
         */
        private ApplicationLoadBalancer createLoadBalancer(final Vpc vpc, final SecurityGroup securityGroup) {
            return ApplicationLoadBalancer.Builder.create(this, "NovaLoadBalancer")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(securityGroup)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .build())
                .build();
        }

        /**
         * Creates target group for health checks.
         */
        private ApplicationTargetGroup createTargetGroup(final Vpc vpc) {
            return ApplicationTargetGroup.Builder.create(this, "NovaTargetGroup")
                .port(8080)
                .protocol(ApplicationProtocol.HTTP)
                .vpc(vpc)
                .healthCheck(HealthCheck.builder()
                    .path("/health")
                    .protocol(Protocol.HTTP)
                    .port("8080")
                    .healthyThresholdCount(2)
                    .unhealthyThresholdCount(3)
                    .timeout(Duration.seconds(10))
                    .interval(Duration.seconds(30))
                    .build())
                .build();
        }

        public ApplicationLoadBalancer getLoadBalancer() {
            return loadBalancer;
        }

        public DatabaseInstance getDatabase() {
            return database;
        }
    }

    /**
     * Route 53 stack for global DNS routing and health checks.
     */
    static class Route53Stack extends Stack {

        Route53Stack(final Construct scope, final String id, final Route53StackProps props) {
            super(scope, id, props.getStackProps());

            final ApplicationLoadBalancer primaryLb = props.getPrimaryLoadBalancer();
            final ApplicationLoadBalancer failoverLb = props.getFailoverLoadBalancer();

            // Apply mandatory tagging
            Tags.of(this).add("Environment", "Production");
            Tags.of(this).add("Project", "Nova");
            Tags.of(this).add("Component", "DNS");

            // Create hosted zone
            final HostedZone hostedZone = HostedZone.Builder.create(this, "NovaHostedZone")
                .zoneName(DOMAIN_NAME)
                .build();

            // Create health checks for each region
            final CfnHealthCheck primaryHealthCheck = createHealthCheck("Primary", primaryLb.getLoadBalancerDnsName());
            final CfnHealthCheck failoverHealthCheck = createHealthCheck("Failover", failoverLb.getLoadBalancerDnsName());

            // Create Route 53 records with latency-based routing for automated failover
            createLatencyRoutingRecord(hostedZone, "Primary", PRIMARY_REGION, primaryLb, primaryHealthCheck);
            createLatencyRoutingRecord(hostedZone, "Failover", FAILOVER_REGION, failoverLb, failoverHealthCheck);
        }

        /**
         * Creates health check for load balancer using correct CfnHealthCheck properties.
         */
        private CfnHealthCheck createHealthCheck(final String region, final String fqdn) {
            final CfnHealthCheck.HealthCheckConfigProperty healthCheckConfig = CfnHealthCheck.HealthCheckConfigProperty.builder()
                .type("HTTP") // Changed to HTTP to match ALB target group
                .fullyQualifiedDomainName(fqdn)
                .port(80) // Match ALB port
                .resourcePath("/health") // Add health check path
                .requestInterval(30) // Fast health checks for automated failover
                .failureThreshold(2) // Reduced for faster failover detection
                .build();

            return CfnHealthCheck.Builder.create(this, "HealthCheck" + region)
                .healthCheckConfig(healthCheckConfig)
                .build();
        }

        /**
         * Creates latency-based routing record.
         */
        private void createLatencyRoutingRecord(final HostedZone hostedZone, final String regionName, final String region,
                                                final ApplicationLoadBalancer loadBalancer, final CfnHealthCheck healthCheck) {
            ARecord.Builder.create(this, "ARecord" + regionName)
                .zone(hostedZone)
                .recordName(DOMAIN_NAME)
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(loadBalancer)))
                .setIdentifier(regionName + "Region")
                .region(region)
                .build();
        }
    }
}
