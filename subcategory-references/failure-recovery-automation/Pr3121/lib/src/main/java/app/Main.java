package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
// import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancerProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroupProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.TargetType;
import software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.s3.CfnBucket;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.route53.IHostedZone;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.CfnRecordSet;
import software.amazon.awscdk.services.route53.CfnHealthCheck;
import software.amazon.awscdk.Duration;

import java.util.Arrays;

/**
 * Properties for TapStack
 */
final class TapStackProps implements StackProps {
    private final Environment environment;
    private final String stackName;
    private final String description;
    private final String primaryRegion;
    private final String secondaryRegion;
    private final String domainName;
    private final boolean isPrimary;
    private final String environmentSuffix;

    private TapStackProps(final Builder builder) {
        this.environment = builder.environment;
        this.stackName = builder.stackName;
        this.description = builder.description;
        this.primaryRegion = builder.primaryRegion;
        this.secondaryRegion = builder.secondaryRegion;
        this.domainName = builder.domainName;
        this.isPrimary = builder.isPrimary;
        this.environmentSuffix = builder.environmentSuffix;
    }

    @Override
    public Environment getEnv() {
        return environment;
    }

    @Override
    public String getStackName() {
        return stackName;
    }

    @Override
    public String getDescription() {
        return description;
    }

    public String getPrimaryRegion() {
        return primaryRegion;
    }

    public String getSecondaryRegion() {
        return secondaryRegion;
    }

    public String getDomainName() {
        return domainName;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public static Builder builder() {
        return new Builder();
    }

    static class Builder {
        private Environment environment;
        private String stackName;
        private String description;
        private String primaryRegion;
        private String secondaryRegion;
        private String domainName;
        private boolean isPrimary;
        private String environmentSuffix;

        Builder environment(final Environment env) {
            this.environment = env;
            return this;
        }

        Builder stackName(final String name) {
            this.stackName = name;
            return this;
        }

        Builder description(final String desc) {
            this.description = desc;
            return this;
        }

        Builder primaryRegion(final String region) {
            this.primaryRegion = region;
            return this;
        }

        Builder secondaryRegion(final String region) {
            this.secondaryRegion = region;
            return this;
        }

        Builder domainName(final String domain) {
            this.domainName = domain;
            return this;
        }

        Builder isPrimary(final boolean primary) {
            this.isPrimary = primary;
            return this;
        }

        Builder environmentSuffix(final String suffix) {
            this.environmentSuffix = suffix;
            return this;
        }

        TapStackProps build() {
            return new TapStackProps(this);
        }
    }
}

/**
 * Main Stack for Disaster Recovery setup
 */
class TapStack extends Stack {
    private Bucket dataBucket;
    private ApplicationLoadBalancer loadBalancer;
    private CfnHealthCheck healthCheck;
    private String environmentSuffix;

    TapStack(final App scope, final String id, final TapStackProps props) {
        super(scope, id, props);

        // Store environment suffix
        this.environmentSuffix = props.getEnvironmentSuffix() != null ? props.getEnvironmentSuffix() : "dev";

        // Create VPC
        Vpc vpc = new Vpc(this, "VPC", VpcProps.builder()
                .maxAzs(2)
                .natGateways(0)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("Public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()
                ))
                .build());

        // Create Application Load Balancer
        this.loadBalancer = new ApplicationLoadBalancer(this, "ALB", ApplicationLoadBalancerProps.builder()
                .vpc(vpc)
                .internetFacing(true)
                .loadBalancerName(props.isPrimary() ? "primary-alb" : "secondary-alb")
                .build());

        // Create Target Group
        ApplicationTargetGroup targetGroup = new ApplicationTargetGroup(this, "TargetGroup",
                ApplicationTargetGroupProps.builder()
                        .vpc(vpc)
                        .port(80)
                        .protocol(ApplicationProtocol.HTTP)
                        .targetType(TargetType.IP)
                        .healthCheck(HealthCheck.builder()
                                .enabled(true)
                                .path("/health")
                                .interval(Duration.seconds(30))
                                .timeout(Duration.seconds(5))
                                .healthyThresholdCount(2)
                                .unhealthyThresholdCount(3)
                                .build())
                        .build());

        // Add listener
        this.loadBalancer.addListener("Listener",
                software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultTargetGroups(Arrays.asList(targetGroup))
                .build());

        // Create S3 Bucket
        String bucketNameSuffix = props.isPrimary()
                ? "tap-primary-data-" + props.getEnv().getAccount()
                : "tap-secondary-data-" + props.getEnv().getAccount();
        this.dataBucket = new Bucket(this, "DataBucket", BucketProps.builder()
                .versioned(true)
                .bucketName(bucketNameSuffix)
                .build());

        // NOTE: S3 Replication is commented out for initial deployment
        // Uncomment after both stacks are successfully deployed
        if (props.isPrimary()) {
            configureS3Replication(props);
        }

        // Create Route53 Health Check
        this.healthCheck = CfnHealthCheck.Builder.create(this, "HealthCheck")
                .healthCheckConfig(CfnHealthCheck.HealthCheckConfigProperty.builder()
                        .type("HTTPS")
                        .resourcePath("/health")
                        .fullyQualifiedDomainName(this.loadBalancer.getLoadBalancerDnsName())
                        .port(80)
                        .requestInterval(30)
                        .failureThreshold(3)
                        .build())
                .healthCheckTags(Arrays.asList(
                        CfnHealthCheck.HealthCheckTagProperty.builder()
                                .key("Name")
                                .value(props.isPrimary() ? "Primary-HealthCheck" : "Secondary-HealthCheck")
                                .build()
                ))
                .build();

        // Create or reference hosted zone for joshteamgifted.com
        // Only create the hosted zone in the primary region to avoid conflicts
        IHostedZone hostedZone;
        if (props.isPrimary()) {
            hostedZone = new HostedZone(this, "HostedZone",
                    software.amazon.awscdk.services.route53.HostedZoneProps.builder()
                            .zoneName("joshteamgifted.com")
                            .comment("Hosted zone for disaster recovery setup")
                            .build());
        } else {
            // In secondary region, import the hosted zone by ID from primary region
            String hostedZoneId = (String) this.getNode().tryGetContext("hosted_zone_id");
            if (hostedZoneId == null || hostedZoneId.isEmpty()) {
                // Fallback: create a new hosted zone (not recommended for production)
                hostedZone = new HostedZone(this, "HostedZone",
                        software.amazon.awscdk.services.route53.HostedZoneProps.builder()
                                .zoneName("joshteamgifted.com")
                                .comment("Hosted zone for disaster recovery setup")
                                .build());
            } else {
                hostedZone = HostedZone.fromHostedZoneId(this, "HostedZone", hostedZoneId);
            }
        }

        // Configure Route53 Failover Records
        configureRoute53Failover(hostedZone, props);

        // Output values
        new CfnOutput(this, "VpcId", CfnOutputProps.builder()
                .value(vpc.getVpcId())
                .description("VPC ID")
                .exportName(props.isPrimary() ? "PrimaryVpcId" : "SecondaryVpcId")
                .build());

        new CfnOutput(this, "LoadBalancerDNS", CfnOutputProps.builder()
                .value(this.loadBalancer.getLoadBalancerDnsName())
                .description("Load Balancer DNS Name")
                .exportName(props.isPrimary() ? "PrimaryAlbDns" : "SecondaryAlbDns")
                .build());

        new CfnOutput(this, "BucketName", CfnOutputProps.builder()
                .value(this.dataBucket.getBucketName())
                .description("S3 Bucket Name")
                .exportName(props.isPrimary() ? "PrimaryBucketName" : "SecondaryBucketName")
                .build());

        new CfnOutput(this, "DeployedRegion", CfnOutputProps.builder()
                .value(props.getEnv().getRegion())
                .description("Deployed Region")
                .build());

        new CfnOutput(this, "HealthCheckId", CfnOutputProps.builder()
                .value(this.healthCheck.getAttrHealthCheckId())
                .description("Route53 Health Check ID")
                .exportName(props.isPrimary() ? "PrimaryHealthCheckId" : "SecondaryHealthCheckId")
                .build());

        new CfnOutput(this, "HostedZoneId", CfnOutputProps.builder()
                .value(hostedZone.getHostedZoneId())
                .description("Route53 Hosted Zone ID")
                .exportName(props.isPrimary() ? "PrimaryHostedZoneId" : "SecondaryHostedZoneId")
                .build());

        new CfnOutput(this, "AppEndpoint", CfnOutputProps.builder()
                .value(props.isPrimary() ? "app.joshteamgifted.com" : "sync.app.joshteamgifted.com")
                .description("Application Endpoint")
                .build());
    }

    private void configureRoute53Failover(final IHostedZone hostedZone, final TapStackProps props) {
        if (props.isPrimary()) {
            // Primary failover record for app.joshteamgifted.com
            CfnRecordSet primaryAppRecord = CfnRecordSet.Builder.create(this, "PrimaryAppRecord")
                    .hostedZoneId(hostedZone.getHostedZoneId())
                    .name("app.joshteamgifted.com")
                    .type("A")
                    .setIdentifier("primary-app")
                    .failover("PRIMARY")
                    .healthCheckId(this.healthCheck.getAttrHealthCheckId())
                    .aliasTarget(CfnRecordSet.AliasTargetProperty.builder()
                            .dnsName(this.loadBalancer.getLoadBalancerDnsName())
                            .hostedZoneId(this.loadBalancer.getLoadBalancerCanonicalHostedZoneId())
                            .evaluateTargetHealth(true)
                            .build())
                    .build();

            // Primary failover record for sync.app.joshteamgifted.com
            CfnRecordSet primarySyncRecord = CfnRecordSet.Builder.create(this, "PrimarySyncRecord")
                    .hostedZoneId(hostedZone.getHostedZoneId())
                    .name("sync.app.joshteamgifted.com")
                    .type("A")
                    .setIdentifier("primary-sync")
                    .failover("PRIMARY")
                    .healthCheckId(this.healthCheck.getAttrHealthCheckId())
                    .aliasTarget(CfnRecordSet.AliasTargetProperty.builder()
                            .dnsName(this.loadBalancer.getLoadBalancerDnsName())
                            .hostedZoneId(this.loadBalancer.getLoadBalancerCanonicalHostedZoneId())
                            .evaluateTargetHealth(true)
                            .build())
                    .build();

            new CfnOutput(this, "PrimaryAppDomain", CfnOutputProps.builder()
                    .value("app.joshteamgifted.com")
                    .description("Primary Application Domain")
                    .exportName("PrimaryAppDomain")
                    .build());

            new CfnOutput(this, "PrimarySyncDomain", CfnOutputProps.builder()
                    .value("sync.app.joshteamgifted.com")
                    .description("Primary Sync Domain")
                    .exportName("PrimarySyncDomain")
                    .build());
        } else {
            // Secondary failover record for app.joshteamgifted.com
            CfnRecordSet secondaryAppRecord = CfnRecordSet.Builder.create(this, "SecondaryAppRecord")
                    .hostedZoneId(hostedZone.getHostedZoneId())
                    .name("app.joshteamgifted.com")
                    .type("A")
                    .setIdentifier("secondary-app")
                    .failover("SECONDARY")
                    .aliasTarget(CfnRecordSet.AliasTargetProperty.builder()
                            .dnsName(this.loadBalancer.getLoadBalancerDnsName())
                            .hostedZoneId(this.loadBalancer.getLoadBalancerCanonicalHostedZoneId())
                            .evaluateTargetHealth(true)
                            .build())
                    .build();

            // Secondary failover record for sync.app.joshteamgifted.com
            CfnRecordSet secondarySyncRecord = CfnRecordSet.Builder.create(this, "SecondarySyncRecord")
                    .hostedZoneId(hostedZone.getHostedZoneId())
                    .name("sync.app.joshteamgifted.com")
                    .type("A")
                    .setIdentifier("secondary-sync")
                    .failover("SECONDARY")
                    .aliasTarget(CfnRecordSet.AliasTargetProperty.builder()
                            .dnsName(this.loadBalancer.getLoadBalancerDnsName())
                            .hostedZoneId(this.loadBalancer.getLoadBalancerCanonicalHostedZoneId())
                            .evaluateTargetHealth(true)
                            .build())
                    .build();

            new CfnOutput(this, "SecondaryAppDomain", CfnOutputProps.builder()
                    .value("app.joshteamgifted.com")
                    .description("Secondary Application Domain")
                    .exportName("SecondaryAppDomain")
                    .build());

            new CfnOutput(this, "SecondarySyncDomain", CfnOutputProps.builder()
                    .value("sync.app.joshteamgifted.com")
                    .description("Secondary Sync Domain")
                    .exportName("SecondarySyncDomain")
                    .build());
        }
    }

    private void configureS3Replication(final TapStackProps props) {
        // Create replication role
        Role replicationRole = new Role(this, "ReplicationRole", RoleProps.builder()
                .assumedBy(new ServicePrincipal("s3.amazonaws.com"))
                .build());

        // Add permissions for replication
        replicationRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket"
                ))
                .resources(Arrays.asList(this.dataBucket.getBucketArn()))
                .build());

        replicationRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl",
                        "s3:GetObjectVersionTagging"
                ))
                .resources(Arrays.asList(this.dataBucket.getBucketArn() + "/*"))
                .build());

        String destinationBucket = "arn:aws:s3:::tap-secondary-data-" + props.getEnv().getAccount();
        replicationRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete",
                        "s3:ReplicateTags"
                ))
                .resources(Arrays.asList(destinationBucket + "/*"))
                .build());

        // Configure replication on the bucket
        CfnBucket cfnBucket = (CfnBucket) this.dataBucket.getNode().getDefaultChild();
        cfnBucket.setReplicationConfiguration(
                CfnBucket.ReplicationConfigurationProperty.builder()
                        .role(replicationRole.getRoleArn())
                        .rules(Arrays.asList(
                                CfnBucket.ReplicationRuleProperty.builder()
                                        .status("Enabled")
                                        .priority(1)
                                        .filter(CfnBucket.ReplicationRuleFilterProperty.builder()
                                                .prefix("")
                                                .build())
                                        .destination(CfnBucket.ReplicationDestinationProperty.builder()
                                                .bucket(destinationBucket)
                                                .build())
                                        .deleteMarkerReplication(CfnBucket.DeleteMarkerReplicationProperty.builder()
                                                .status("Enabled")
                                                .build())
                                        .build()
                        ))
                        .build()
        );
    }

    ApplicationLoadBalancer getLoadBalancer() {
        return loadBalancer;
    }

    CfnHealthCheck getHealthCheck() {
        return healthCheck;
    }

    String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    Bucket getDataBucket() {
        return dataBucket;
    }
}

/**
 * Main Application Entry Point
 */
public final class Main {
    
    private Main() {
        // Private constructor to hide utility class constructor
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to "dev"
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        String accountId = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (accountId == null || accountId.isEmpty()) {
            accountId = "123456789012"; // Placeholder
        }

        // Define primary and secondary regions
        String primaryRegion = "us-east-1";
        String secondaryRegion = "us-west-2";

        // Create primary stack in us-east-1
        Environment primaryEnv = Environment.builder()
                .account(accountId)
                .region(primaryRegion)
                .build();

        TapStackProps primaryStackProps = TapStackProps.builder()
                .environment(primaryEnv)
                .stackName("TapStack-Primary")
                .description("Primary Disaster Recovery Stack in us-east-1")
                .primaryRegion(primaryRegion)
                .secondaryRegion(secondaryRegion)
                .domainName("joshteamgifted.com")
                .isPrimary(true)
                .environmentSuffix(environmentSuffix)
                .build();

        TapStack primaryStack = new TapStack(app, "TapStackPrimary", primaryStackProps);

        // Create secondary stack in us-west-2
        Environment secondaryEnv = Environment.builder()
                .account(accountId)
                .region(secondaryRegion)
                .build();

        TapStackProps secondaryStackProps = TapStackProps.builder()
                .environment(secondaryEnv)
                .stackName("TapStack-Secondary")
                .description("Secondary Disaster Recovery Stack in us-west-2")
                .primaryRegion(primaryRegion)
                .secondaryRegion(secondaryRegion)
                .domainName("joshteamgifted.com")
                .isPrimary(false)
                .environmentSuffix(environmentSuffix)
                .build();

        TapStack secondaryStack = new TapStack(app, "TapStackSecondary", secondaryStackProps);

        app.synth();
    }
}