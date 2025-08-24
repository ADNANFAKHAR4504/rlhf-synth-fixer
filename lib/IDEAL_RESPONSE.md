# Nova Multi-Region CDK Java Infrastructure

This document contains the complete CDK Java implementation for the Nova application's multi-region, highly available infrastructure.

## Main Application (`app/Main.java`)

```java
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
 * Nova Multi-Region CDK Application
 * 
 * This CDK application provisions a highly available, multi-region infrastructure
 * for the Nova application with the following components:
 * 
 * - Primary region: us-west-2 with full HA setup
 * - Failover region: eu-central-1 with cost-optimized DR
 * - Global DNS with Route 53 health check failover
 * - RDS PostgreSQL with multi-AZ in primary, single-AZ in failover
 * - Application Load Balancers with proper health checks
 * - IAM roles and security groups with least privilege access
 */
public final class Main {

    /**
     * Main entry point for the CDK application.
     * Synthesizes the complete multi-region Nova infrastructure.
     */
    public static void main(final String[] args) {
        final App app = new App();
        final String environmentSuffix = Optional.ofNullable(app.getNode().tryGetContext("environmentSuffix"))
            .map(Object::toString)
            .orElse("dev");

        // Primary region stack (us-west-2) with full HA
        final NovaStack primaryStack = new NovaStack(app, "NovaStack-Primary-" + environmentSuffix,
            NovaStackProps.builder()
                .isPrimary(true)
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                    .env(Environment.builder().region("us-west-2").build())
                    .build())
                .build());

        // Failover region stack (eu-central-1) with DR setup
        final NovaStack failoverStack = new NovaStack(app, "NovaStack-Failover-" + environmentSuffix,
            NovaStackProps.builder()
                .isPrimary(false)
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                    .env(Environment.builder().region("eu-central-1").build())
                    .build())
                .build());

        // Global DNS stack with health check failover (us-east-1)
        new Route53Stack(app, "NovaRoute53Stack-" + environmentSuffix,
            Route53StackProps.builder()
                .primaryLoadBalancer(primaryStack.getLoadBalancer())
                .failoverLoadBalancer(failoverStack.getLoadBalancer())
                .stackProps(StackProps.builder()
                    .crossRegionReferences(true)
                    .env(Environment.builder().region("us-east-1").build())
                    .build())
                .build());

        app.synth();
    }

    /**
     * Regional Nova infrastructure stack.
     * Deploys VPC, RDS, ALB, and supporting resources for a single region.
     */
    public static final class NovaStack extends Stack {
        private final ApplicationLoadBalancer loadBalancer;

        public NovaStack(final Construct scope, final String id, final NovaStackProps props) {
            super(scope, id, props.getStackProps());

            final String regionType = props.getIsPrimary() ? "Primary" : "Failover";
            final String environmentSuffix = props.getEnvironmentSuffix();

            // VPC with 3 AZs, public and private subnets
            final Vpc vpc = Vpc.Builder.create(this, "NovaVpc")
                .cidr("10.0.0.0/16")
                .maxAzs(3)
                .enableDnsSupport(true)
                .enableDnsHostnames(true)
                .subnetConfiguration(Arrays.asList(
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .build(),
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build()
                ))
                .natGateways(props.getIsPrimary() ? 2 : 1) // Cost optimization for failover
                .build();

            // Database subnet group
            final SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "NovaDbSubnetGroup")
                .description("Subnet group for Nova database")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .build())
                .subnetGroupName("nova-db-subnet-group-" + regionType.toLowerCase() + "-" + environmentSuffix)
                .build();

            // Database security group
            final SecurityGroup dbSecurityGroup = SecurityGroup.Builder.create(this, "NovaDbSecurityGroup")
                .vpc(vpc)
                .description("Security group for Nova database")
                .build();

            // Application security group
            final SecurityGroup appSecurityGroup = SecurityGroup.Builder.create(this, "NovaAppSecurityGroup")
                .vpc(vpc)
                .description("Security group for Nova application instances")
                .build();

            // ALB security group
            final SecurityGroup albSecurityGroup = SecurityGroup.Builder.create(this, "NovaAlbSecurityGroup")
                .vpc(vpc)
                .description("Security group for Nova Application Load Balancer")
                .build();

            // Security group rules
            albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "HTTP traffic");
            albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS traffic");
            appSecurityGroup.addIngressRule(albSecurityGroup, Port.tcp(8080), "Application port from ALB");
            dbSecurityGroup.addIngressRule(appSecurityGroup, Port.tcp(5432), "PostgreSQL from application");

            // Database credentials secret
            final Secret dbSecret = Secret.Builder.create(this, "NovaDbSecret")
                .description("Database credentials for Nova application")
                .generateSecretString(SecretStringGenerator.builder()
                    .secretStringTemplate("{\"username\": \"novaadmin\"}")
                    .generateStringKey("password")
                    .excludeCharacters("\"@/\\")
                    .passwordLength(32)
                    .build())
                .secretName("nova/database/credentials-" + environmentSuffix)
                .build();

            // RDS instance
            final DatabaseInstance database = DatabaseInstance.Builder.create(this, "NovaDatabase")
                .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                    .version(PostgresEngineVersion.VER_15_7)
                    .build()))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
                .vpc(vpc)
                .subnetGroup(dbSubnetGroup)
                .securityGroups(Arrays.asList(dbSecurityGroup))
                .credentials(Credentials.fromSecret(dbSecret))
                .multiAz(props.getIsPrimary()) // Multi-AZ only for primary region
                .storageEncrypted(true)
                .enablePerformanceInsights(true)
                .performanceInsightRetention(PerformanceInsightRetention.DEFAULT)
                .deletionProtection(props.getIsPrimary()) // Protection only for primary
                .copyTagsToSnapshot(true)
                .build();

            // IAM role for application instances
            final Role appRole = Role.Builder.create(this, "NovaAppRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for Nova application instances")
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .inlinePolicies(Map.of("NovaApplicationPolicy", PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList("secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"))
                            .resources(Arrays.asList(dbSecret.getSecretArn()))
                            .build(),
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList("logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"))
                            .resources(Arrays.asList("arn:aws:logs:*:*:*"))
                            .build()
                    ))
                    .build()))
                .build();

            // Application Load Balancer
            this.loadBalancer = ApplicationLoadBalancer.Builder.create(this, "NovaLoadBalancer")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .build())
                .build();

            // Target group for application instances
            final ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "NovaTargetGroup")
                .vpc(vpc)
                .port(8080)
                .protocol(ApplicationProtocol.HTTP)
                .healthCheck(HealthCheck.builder()
                    .path("/health")
                    .port("8080")
                    .protocol(Protocol.HTTP)
                    .healthyThresholdCount(2)
                    .unhealthyThresholdCount(5)
                    .timeout(Duration.seconds(10))
                    .interval(Duration.seconds(30))
                    .build())
                .build();

            // ALB listener
            this.loadBalancer.addListener("NovaListener", software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultTargetGroups(Arrays.asList(targetGroup))
                .build());

            // Resource tagging
            Tags.of(this).add("Environment", "Production");
            Tags.of(this).add("Project", "Nova");
            Tags.of(this).add("Region", regionType);
        }

        public ApplicationLoadBalancer getLoadBalancer() {
            return loadBalancer;
        }
    }

    /**
     * Route 53 DNS stack with health checks and failover routing.
     * Provides global DNS resolution with automated failover between regions.
     */
    public static final class Route53Stack extends Stack {

        public Route53Stack(final Construct scope, final String id, final Route53StackProps props) {
            super(scope, id, props.getStackProps());

            // Hosted zone for the domain
            final HostedZone hostedZone = HostedZone.Builder.create(this, "NovaHostedZone")
                .zoneName("nova-app.com")
                .build();

            // Health check for primary region
            final CfnHealthCheck primaryHealthCheck = CfnHealthCheck.Builder.create(this, "PrimaryHealthCheck")
                .healthCheckConfig(CfnHealthCheck.HealthCheckConfigProperty.builder()
                    .fullyQualifiedDomainName(props.getPrimaryLoadBalancer().getLoadBalancerDnsName())
                    .port(80)
                    .resourcePath("/health")
                    .requestInterval(30)
                    .failureThreshold(2)
                    .type("HTTP")
                    .build())
                .healthCheckTags(Arrays.asList(
                    CfnHealthCheck.HealthCheckTagProperty.builder()
                        .key("Name")
                        .value("NovaApp Primary Health Check")
                        .build()
                ))
                .build();

            // Health check for failover region
            final CfnHealthCheck failoverHealthCheck = CfnHealthCheck.Builder.create(this, "FailoverHealthCheck")
                .healthCheckConfig(CfnHealthCheck.HealthCheckConfigProperty.builder()
                    .fullyQualifiedDomainName(props.getFailoverLoadBalancer().getLoadBalancerDnsName())
                    .port(80)
                    .resourcePath("/health")
                    .requestInterval(30)
                    .failureThreshold(2)
                    .type("HTTP")
                    .build())
                .healthCheckTags(Arrays.asList(
                    CfnHealthCheck.HealthCheckTagProperty.builder()
                        .key("Name")
                        .value("NovaApp Failover Health Check")
                        .build()
                ))
                .build();

            // Primary A record (us-west-2)
            ARecord.Builder.create(this, "PrimaryARecord")
                .zone(hostedZone)
                .recordName("nova-app.com")
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(props.getPrimaryLoadBalancer())))
                .region("us-west-2")
                .setIdentifier("PrimaryRegion")
                .healthCheckId(primaryHealthCheck.getAttrHealthCheckId())
                .build();

            // Failover A record (eu-central-1)
            ARecord.Builder.create(this, "FailoverARecord")
                .zone(hostedZone)
                .recordName("nova-app.com")
                .target(RecordTarget.fromAlias(new LoadBalancerTarget(props.getFailoverLoadBalancer())))
                .region("eu-central-1")
                .setIdentifier("FailoverRegion")
                .healthCheckId(failoverHealthCheck.getAttrHealthCheckId())
                .build();

            // Resource tagging
            Tags.of(this).add("Environment", "Production");
            Tags.of(this).add("Project", "Nova");
            Tags.of(this).add("Component", "DNS");
        }
    }
}

/**
 * Properties for NovaStack configuration.
 * Encapsulates the primary/failover flag and environment suffix.
 */
final class NovaStackProps {
    private final Boolean isPrimary;
    private final String environmentSuffix;
    private final StackProps stackProps;

    private NovaStackProps(final Builder builder) {
        this.isPrimary = builder.isPrimary;
        this.environmentSuffix = builder.environmentSuffix;
        this.stackProps = builder.stackProps;
    }

    public Boolean getIsPrimary() {
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
        private Boolean isPrimary;
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder isPrimary(final Boolean isPrimary) {
            this.isPrimary = isPrimary;
            return this;
        }

        public Builder environmentSuffix(final String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(final StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public NovaStackProps build() {
            return new NovaStackProps(this);
        }
    }
}

/**
 * Properties for Route53Stack configuration.
 * Contains references to the load balancers from both regions.
 */
final class Route53StackProps {
    private final ApplicationLoadBalancer primaryLoadBalancer;
    private final ApplicationLoadBalancer failoverLoadBalancer;
    private final StackProps stackProps;

    private Route53StackProps(final Builder builder) {
        this.primaryLoadBalancer = builder.primaryLoadBalancer;
        this.failoverLoadBalancer = builder.failoverLoadBalancer;
        this.stackProps = builder.stackProps;
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

        public Builder primaryLoadBalancer(final ApplicationLoadBalancer primaryLoadBalancer) {
            this.primaryLoadBalancer = primaryLoadBalancer;
            return this;
        }

        public Builder failoverLoadBalancer(final ApplicationLoadBalancer failoverLoadBalancer) {
            this.failoverLoadBalancer = failoverLoadBalancer;
            return this;
        }

        public Builder stackProps(final StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public Route53StackProps build() {
            return new Route53StackProps(this);
        }
    }
}
```

## Architecture Overview

The infrastructure is designed with the following key characteristics:

### Multi-Region Deployment
- **Primary Region (us-west-2)**: Full high-availability configuration with Multi-AZ RDS, multiple NAT gateways, and deletion protection
- **Failover Region (eu-central-1)**: Cost-optimized disaster recovery setup with single-AZ RDS and reduced capacity

### Network Architecture
- **VPC**: 10.0.0.0/16 CIDR with DNS support enabled
- **Subnets**: 6 subnets across 3 availability zones (public/private pairs)
- **NAT Gateways**: 2 in primary region for HA, 1 in failover for cost optimization
- **Security Groups**: Least-privilege access with specific port and protocol restrictions

### Database Layer
- **Engine**: PostgreSQL 15.7 with performance insights enabled
- **Instance Type**: db.t3.medium with storage encryption
- **Backup**: Automated backups with copy tags to snapshot
- **Security**: Secrets Manager integration for credential management

### Application Layer
- **Load Balancer**: Internet-facing ALB with health checks on /health endpoint
- **Target Groups**: HTTP protocol on port 8080 with comprehensive health monitoring
- **Security**: IAM roles with managed SSM policy and custom policies for Secrets Manager

### Global DNS
- **Domain**: nova-app.com hosted zone
- **Health Checks**: HTTP-based monitoring on port 80 with /health path
- **Routing**: Latency-based routing with health check failover
- **Failover**: Automatic traffic redirection on regional failure

### Security Features
- **IAM**: Least-privilege roles with specific resource ARN restrictions
- **Network**: Security groups with specific port/protocol access rules
- **Encryption**: RDS storage encryption and Secrets Manager for credentials
- **Monitoring**: CloudWatch logs integration with proper IAM permissions

This implementation provides a production-ready, highly available infrastructure that can survive regional outages while maintaining cost efficiency in the disaster recovery region.