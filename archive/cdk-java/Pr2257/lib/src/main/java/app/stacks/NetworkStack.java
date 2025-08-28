package app.stacks;


import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;

import java.util.List;

public final class NetworkStack extends Stack {
    private final IVpc vpc;
    private final ISecurityGroup ecsSecurityGroup;
    private final ISecurityGroup rdsSecurityGroup;

    public NetworkStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with public and private subnets across 2 AZs
        this.vpc = Vpc.Builder.create(this, "SecureVPC")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2)
                .natGateways(2)
                .subnetConfiguration(List.of(
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
                                .cidrMask(28)
                                .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        // Security group for ECS tasks
        this.ecsSecurityGroup = SecurityGroup.Builder.create(this, "ECSSecurityGroup")
                .vpc(vpc)
                .description("Security group for ECS tasks")
                .allowAllOutbound(true)
                .build();

        // Allow inbound HTTPS traffic
        ecsSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS inbound"
        );

        // Allow inbound HTTP traffic (for ALB health checks)
        ecsSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP inbound"
        );

        // Security group for RDS
        this.rdsSecurityGroup = SecurityGroup.Builder.create(this, "RDSSecurityGroup")
                .vpc(vpc)
                .description("Security group for RDS database")
                .allowAllOutbound(false)
                .build();

        // Allow ECS tasks to connect to RDS on port 5432 (PostgreSQL)
        rdsSecurityGroup.addIngressRule(
                ecsSecurityGroup,
                Port.tcp(5432),
                "Allow ECS tasks to connect to RDS"
        );

        // Add tags for production environment
        Tags.of(this).add("Environment", "production");
        Tags.of(this).add("Project", "SecureWebApp");
        Tags.of(vpc).add("Name", "SecureWebApp-VPC");
    }

    public IVpc getVpc() {
        return vpc;
    }

    public ISecurityGroup getEcsSecurityGroup() {
        return ecsSecurityGroup;
    }

    public ISecurityGroup getRdsSecurityGroup() {
        return rdsSecurityGroup;
    }
}