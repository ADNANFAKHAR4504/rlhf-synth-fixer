```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.secretsmanager.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Map;
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
 * Main CDK stack for the three-tier AWS infrastructure.
 * 
 * This stack creates a complete VPC environment with:
 * - VPC with public and private subnets across multiple AZs
 * - Internet Gateway for public subnet connectivity
 * - NAT Gateway for private subnet outbound access
 * - EC2 instances with proper security configurations
 * - PostgreSQL RDS instance in private subnet with encryption
 * - Security groups with restricted SSH access
 * - Automated backups and proper resource tagging
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Apply common tags following AWS best practices
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Project", "ThreeTierInfrastructure");
        Tags.of(this).add("ManagedBy", "CDK");
        Tags.of(this).add("Owner", "Infrastructure-Team");

        // Create VPC with proper subnet configuration
        Vpc vpc = createVpc();
        
        // Create security groups
        SecurityGroup dbSecurityGroup = createDatabaseSecurityGroup(vpc);
        SecurityGroup ec2SecurityGroup = createEC2SecurityGroup(vpc, dbSecurityGroup);
        
        // Create database secret for secure credential management
        Secret dbSecret = createDatabaseSecret();
        
        // Create RDS PostgreSQL instance
        DatabaseInstance database = createPostgreSQLDatabase(vpc, dbSecurityGroup, dbSecret);
        
        // Create IAM role for EC2 instances (shared between web and app servers)
        Role ec2Role = createEC2Role();
        
        // Create EC2 instances
        Instance webServer = createWebServerInstance(vpc, ec2SecurityGroup, ec2Role);
        Instance appServer = createAppServerInstance(vpc, ec2SecurityGroup, ec2Role);
        
        // Create outputs for important resource identifiers
        createOutputs(vpc, database, webServer, appServer);
    }

    /**
     * Gets the environment suffix used by this stack.
     * 
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    /**
     * Creates VPC with public and private subnets across multiple availability zones.
     */
    private Vpc createVpc() {
        return Vpc.Builder.create(this, "ThreeTierVPC")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2) // Use 2 AZs for high availability
                .natGateways(1) // Single NAT Gateway for cost optimization in dev
                .subnetConfiguration(Arrays.asList(
                        // Public subnets for web tier
                        SubnetConfiguration.builder()
                                .name("PublicSubnet")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        // Private subnets for application tier  
                        SubnetConfiguration.builder()
                                .name("PrivateSubnet")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build(),
                        // Isolated subnets for database tier
                        SubnetConfiguration.builder()
                                .name("DatabaseSubnet")
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(24)
                                .build()
                ))
                .build();
    }

    /**
     * Creates security group for RDS database with restricted access.
     */
    private SecurityGroup createDatabaseSecurityGroup(Vpc vpc) {
        return SecurityGroup.Builder.create(this, "DatabaseSecurityGroup")
                .vpc(vpc)
                .description("Security group for PostgreSQL database - restricted access")
                .allowAllOutbound(false)
                .build();
    }

    /**
     * Creates security group for EC2 instances with SSH restrictions.
     */
    private SecurityGroup createEC2SecurityGroup(Vpc vpc, SecurityGroup dbSecurityGroup) {
        SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup")
                .vpc(vpc)
                .description("Security group for EC2 instances with restricted SSH access")
                .allowAllOutbound(true)
                .build();

        // Restrict SSH access to specific IP range (replace with your actual IP)
        ec2SecurityGroup.addIngressRule(
                Peer.ipv4("203.0.113.0/24"), // Replace with your actual IP range
                Port.tcp(22),
                "SSH access from trusted IP range only"
        );

        // Allow HTTP traffic
        ec2SecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "HTTP traffic"
        );

        // Allow HTTPS traffic
        ec2SecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "HTTPS traffic"
        );

        // Allow application traffic between tiers
        ec2SecurityGroup.addIngressRule(
                ec2SecurityGroup,
                Port.tcp(8080),
                "Application traffic between instances"
        );

        // Configure database security group to allow PostgreSQL access from EC2
        dbSecurityGroup.addIngressRule(
                ec2SecurityGroup,
                Port.tcp(5432),
                "PostgreSQL access from application tier"
        );

        return ec2SecurityGroup;
    }

    /**
     * Creates a secret for database credentials following security best practices.
     */
    private Secret createDatabaseSecret() {
        return Secret.Builder.create(this, "DatabaseSecret")
                .secretName("three-tier-db-credentials-" + environmentSuffix)
                .description("Database credentials for PostgreSQL instance")
                .generateSecretString(SecretStringGenerator.builder()
                        .secretStringTemplate("{\"username\": \"dbadmin\"}")
                        .generateStringKey("password")
                        .excludeCharacters(" /@\"'\\")
                        .passwordLength(32)
                        .build())
                .build();
    }

    /**
     * Creates PostgreSQL RDS instance with encryption and automated backups.
     */
    private DatabaseInstance createPostgreSQLDatabase(Vpc vpc, SecurityGroup securityGroup, Secret secret) {
        // Create subnet group for database in isolated subnets
        SubnetGroup subnetGroup = SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
                .description("Subnet group for PostgreSQL database")
                .vpc(vpc)
                .subnetGroupName("three-tier-db-subnet-group-" + environmentSuffix)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .build();

        // Configure PostgreSQL engine with latest stable version
        PostgresInstanceEngineProps engineProps = PostgresInstanceEngineProps.builder()
                .version(PostgresEngineVersion.VER_16_3)
                .build();

        return DatabaseInstance.Builder.create(this, "PostgreSQLDatabase")
                .engine(DatabaseInstanceEngine.postgres(engineProps))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)) // Cost-effective for dev
                .credentials(Credentials.fromSecret(secret))
                .vpc(vpc)
                .subnetGroup(subnetGroup)
                .securityGroups(Arrays.asList(securityGroup))
                .databaseName("appdb")
                .storageEncrypted(true) // Encryption at rest
                .backupRetention(Duration.days(7)) // Automated backups with 7-day retention
                .deletionProtection(false) // Allow deletion in dev environment
                .copyTagsToSnapshot(true)
                .monitoringInterval(Duration.seconds(60))
                .enablePerformanceInsights(false) // Disable for cost in dev
                .removalPolicy(RemovalPolicy.DESTROY) // Allow cleanup in dev
                .build();
    }

    /**
     * Creates web server instance in public subnet.
     */
    private Instance createWebServerInstance(Vpc vpc, SecurityGroup securityGroup, Role ec2Role) {
        Instance webServer = Instance.Builder.create(this, "WebServerInstance")
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2023())
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .availabilityZones(Arrays.asList(vpc.getAvailabilityZones().get(0)))
                        .build())
                .securityGroup(securityGroup)
                .role(ec2Role)
                .userData(createWebServerUserData())
                .build();

        // Add tags
        Tags.of(webServer).add("Name", "WebServer-" + environmentSuffix);
        Tags.of(webServer).add("Tier", "Web");

        return webServer;
    }

    /**
     * Creates application server instance in private subnet.
     */
    private Instance createAppServerInstance(Vpc vpc, SecurityGroup securityGroup, Role ec2Role) {
        Instance appServer = Instance.Builder.create(this, "AppServerInstance")
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2023())
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .availabilityZones(Arrays.asList(vpc.getAvailabilityZones().get(0)))
                        .build())
                .securityGroup(securityGroup)
                .role(ec2Role)
                .userData(createAppServerUserData())
                .build();

        // Add tags
        Tags.of(appServer).add("Name", "AppServer-" + environmentSuffix);
        Tags.of(appServer).add("Tier", "Application");

        return appServer;
    }

    /**
     * Creates IAM role for EC2 instances with least privilege access.
     */
    private Role createEC2Role() {
        return Role.Builder.create(this, "EC2Role-" + environmentSuffix)
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .description("IAM role for EC2 instances")
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .inlinePolicies(Map.of(
                        "DatabaseSecretAccess", PolicyDocument.Builder.create()
                                .statements(Arrays.asList(
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList(
                                                        "secretsmanager:GetSecretValue",
                                                        "secretsmanager:DescribeSecret"
                                                ))
                                                .resources(Arrays.asList("arn:aws:secretsmanager:*:*:secret:three-tier-db-credentials-*"))
                                                .build()
                                ))
                                .build()
                ))
                .build();
    }

    /**
     * Creates user data script for web server.
     */
    private UserData createWebServerUserData() {
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y httpd",
                "systemctl start httpd",
                "systemctl enable httpd",
                "echo '<h1>Three-Tier Architecture - Web Server</h1>' > /var/www/html/index.html",
                "echo '<p>Environment: " + environmentSuffix + "</p>' >> /var/www/html/index.html",
                "echo '<p>Instance Type: Web Tier</p>' >> /var/www/html/index.html"
        );
        return userData;
    }

    /**
     * Creates user data script for application server.
     */
    private UserData createAppServerUserData() {
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y java-17-amazon-corretto",
                "yum install -y postgresql15",
                "echo 'Application server setup complete' > /home/ec2-user/app-status.txt",
                "echo 'Environment: " + environmentSuffix + "' >> /home/ec2-user/app-status.txt"
        );
        return userData;
    }

    /**
     * Creates CloudFormation outputs for important resource information.
     */
    private void createOutputs(Vpc vpc, DatabaseInstance database, Instance webServer, Instance appServer) {
        CfnOutput.Builder.create(this, "VpcId")
                .description("VPC ID")
                .value(vpc.getVpcId())
                .build();

        CfnOutput.Builder.create(this, "DatabaseEndpoint")
                .description("PostgreSQL database endpoint")
                .value(database.getInstanceEndpoint().getHostname())
                .build();

        CfnOutput.Builder.create(this, "WebServerPublicIp")
                .description("Web server public IP address")
                .value(webServer.getInstancePublicIp())
                .build();

        CfnOutput.Builder.create(this, "WebServerPrivateIp")
                .description("Web server private IP address")
                .value(webServer.getInstancePrivateIp())
                .build();

        CfnOutput.Builder.create(this, "AppServerPrivateIp")
                .description("Application server private IP address")
                .value(appServer.getInstancePrivateIp())
                .build();
    }
}

/**
 * Main application entry point.
 */
public class Main {
    public static void main(final String[] args) {
        App app = new App();

        // Create stack with us-west-2 environment
        Environment environment = Environment.builder()
                .region("us-west-2")
                .build();

        new TapStack(app, "ThreeTierInfrastructureStack", TapStackProps.builder()
                .environmentSuffix("dev")
                .stackProps(StackProps.builder()
                        .env(environment)
                        .description("Three-tier AWS infrastructure with VPC, EC2, and PostgreSQL RDS")
                        .build())
                .build());

        app.synth();
    }
}
```