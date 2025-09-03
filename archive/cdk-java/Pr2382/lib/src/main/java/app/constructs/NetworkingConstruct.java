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