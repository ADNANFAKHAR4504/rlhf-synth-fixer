package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.*;
import software.amazon.awscdk.services.rds.*;
import software.constructs.Construct;

import java.util.List;
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
 * High-Availability Web Application Stack with ALB, ASG, and RDS Multi-AZ
 *
 * This stack creates a complete web application infrastructure including:
 * - VPC with public/private subnets across 2 AZs
 * - Application Load Balancer for traffic distribution  
 * - Auto Scaling Group (2-6 instances) for compute capacity
 * - PostgreSQL RDS Multi-AZ database for data persistence
 * - Proper security groups and networking configuration
 */
class TapStackDev extends Stack {
    private final String environmentSuffix;

    /**
     * Constructs a new TapStackDev.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStackDev(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create VPC with public and private subnets across 2 availability zones
        Vpc vpc = Vpc.Builder.create(this, "WebAppVPC")
                .maxAzs(2)
                .cidr("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PUBLIC)
                                .name("PublicSubnet")
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .name("PrivateSubnet")
                                .cidrMask(24)
                                .build()
                ))
                .build();

        // Security Group for Application Load Balancer
        SecurityGroup albSecurityGroup = SecurityGroup.Builder.create(this, "ALBSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();

        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic from internet"
        );

        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic from internet"
        );

        // Security Group for Web Application Instances
        SecurityGroup webSecurityGroup = SecurityGroup.Builder.create(this, "WebSecurityGroup")
                .vpc(vpc)
                .description("Security group for web application instances")
                .allowAllOutbound(true)
                .build();

        webSecurityGroup.addIngressRule(
                albSecurityGroup,
                Port.tcp(8080),
                "Allow traffic from ALB to web instances"
        );

        // Security Group for RDS Database
        SecurityGroup databaseSecurityGroup = SecurityGroup.Builder.create(this, "DatabaseSecurityGroup")
                .vpc(vpc)
                .description("Security group for PostgreSQL database")
                .allowAllOutbound(false)
                .build();

        databaseSecurityGroup.addIngressRule(
                webSecurityGroup,
                Port.tcp(5432),
                "Allow PostgreSQL access from web instances"
        );

        // Create DB Subnet Group for RDS
        SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
                .description("Subnet group for PostgreSQL database")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .build();

        // Create RDS PostgreSQL Multi-AZ Instance
        DatabaseInstance database = DatabaseInstance.Builder.create(this, "PostgreSQLDatabase")
                .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                        .version(PostgresEngineVersion.VER_15_12)
                        .build()))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .vpc(vpc)
                .subnetGroup(dbSubnetGroup)
                .securityGroups(List.of(databaseSecurityGroup))
                .multiAz(true) // Enable Multi-AZ for high availability
                .allocatedStorage(20)
                .maxAllocatedStorage(100)
                .storageType(StorageType.GP2)
                .storageEncrypted(true)
                .databaseName("webapp")
                .credentials(Credentials.fromGeneratedSecret("dbadmin"))
                .backupRetention(software.amazon.awscdk.Duration.days(7))
                .deletionProtection(false) // Set to true for production
                .removalPolicy(software.amazon.awscdk.RemovalPolicy.DESTROY) // Set to RETAIN for production
                .build();

        // User Data script for web instances
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y java-17-amazon-corretto-headless",
                "yum install -y amazon-cloudwatch-agent",
                "# Install your Spring Boot application here",
                "# Example: wget -O /opt/webapp.jar https://your-artifact-repo/webapp.jar",
                "# Create systemd service for your application",
                "echo '[Unit]' > /etc/systemd/system/webapp.service",
                "echo 'Description=Web Application' >> /etc/systemd/system/webapp.service",
                "echo 'After=network.target' >> /etc/systemd/system/webapp.service",
                "echo '' >> /etc/systemd/system/webapp.service",
                "echo '[Service]' >> /etc/systemd/system/webapp.service",
                "echo 'Type=simple' >> /etc/systemd/system/webapp.service",
                "echo 'User=ec2-user' >> /etc/systemd/system/webapp.service",
                "echo 'ExecStart=/usr/bin/java -jar /opt/webapp.jar' >> /etc/systemd/system/webapp.service",
                "echo 'Restart=always' >> /etc/systemd/system/webapp.service",
                "echo '' >> /etc/systemd/system/webapp.service",
                "echo '[Install]' >> /etc/systemd/system/webapp.service",
                "echo 'WantedBy=multi-user.target' >> /etc/systemd/system/webapp.service",
                "# systemctl enable webapp",
                "# systemctl start webapp"
        );

        // Create Launch Template for Auto Scaling Group
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "WebAppLaunchTemplate")
                .machineImage(MachineImage.latestAmazonLinux2())
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .securityGroup(webSecurityGroup)
                .userData(userData)
                .role(software.amazon.awscdk.services.iam.Role.Builder.create(this, "InstanceRole")
                        .assumedBy(software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                        .managedPolicies(List.of(
                                software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
                                software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                        ))
                        .build())
                .build();

        // Create Auto Scaling Group
        AutoScalingGroup autoScalingGroup = AutoScalingGroup.Builder.create(this, "WebAppASG")
                .vpc(vpc)
                .launchTemplate(launchTemplate)
                .minCapacity(2)
                .maxCapacity(6)
                .desiredCapacity(2)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .healthCheck(software.amazon.awscdk.services.autoscaling.HealthCheck.elb(ElbHealthCheckOptions.builder()
                        .grace(software.amazon.awscdk.Duration.seconds(300))
                        .build()))
                .build();

        // Add scaling policies
        autoScalingGroup.scaleOnCpuUtilization("CpuScaling",
                CpuUtilizationScalingProps.builder()
                        .targetUtilizationPercent(70)
                        .cooldown(software.amazon.awscdk.Duration.seconds(300))
                        .build());

        // Create Application Load Balancer
        ApplicationLoadBalancer applicationLoadBalancer = ApplicationLoadBalancer.Builder.create(this, "WebAppALB")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .build();

        // Create Target Group for Auto Scaling Group
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "WebAppTargetGroup")
                .port(8080)
                .protocol(ApplicationProtocol.HTTP)
                .vpc(vpc)
                .targetType(TargetType.INSTANCE)
                .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                        .enabled(true)
                        .path("/actuator/health") // Spring Boot health endpoint
                        .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.Protocol.HTTP)
                        .interval(software.amazon.awscdk.Duration.seconds(30))
                        .healthyThresholdCount(2)
                        .unhealthyThresholdCount(3)
                        .build())
                .build();

        // Attach Auto Scaling Group to Target Group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

        // Add listener to ALB
        ApplicationListener listener = applicationLoadBalancer.addListener("WebAppListener",
                BaseApplicationListenerProps.builder()
                        .port(80)
                        .protocol(ApplicationProtocol.HTTP)
                        .defaultAction(ListenerAction.forward(List.of(targetGroup)))
                        .build());

        // Stack Outputs for Integration Testing
        CfnOutput.Builder.create(this, "LoadBalancerDNS")
                .description("DNS name of the Application Load Balancer")
                .value(applicationLoadBalancer.getLoadBalancerDnsName())
                .exportName("LoadBalancerDNS" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "DatabaseEndpoint")
                .description("PostgreSQL database endpoint")
                .value(database.getInstanceEndpoint().getHostname())
                .exportName("DatabaseEndpoint" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "DatabasePort")
                .description("PostgreSQL database port")
                .value(database.getInstanceEndpoint().getPort().toString())
                .exportName("DatabasePort" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "VPCId")
                .description("VPC ID for the infrastructure")
                .value(vpc.getVpcId())
                .exportName("VPCId" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "AutoScalingGroupName")
                .description("Name of the Auto Scaling Group")
                .value(autoScalingGroup.getAutoScalingGroupName())
                .exportName("AutoScalingGroupName" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "DatabaseSecretArn")
                .description("ARN of the database credentials secret")
                .value(database.getSecret().getSecretArn())
                .exportName("DatabaseSecretArn" + environmentSuffix)
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
        new TapStackDev(app, "TapStack" + environmentSuffix, TapStackProps.builder()
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
