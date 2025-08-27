package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.Map;

public class SecurityGroupStack extends Stack {

    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup dbSecurityGroup;

    public SecurityGroupStack(final Construct scope, final String id, 
                            final StackProps props, final Vpc vpc) {
        super(scope, id, props);

        // Security Group for EC2 web server
        this.webSecurityGroup = SecurityGroup.Builder.create(this, "app-sg-web")
                .securityGroupName("app-sg-web")
                .description("Security group for web servers - HTTPS only from specific ranges")
                .vpc(vpc)
                .build();

        // Allow HTTPS from specific IP ranges only
        webSecurityGroup.addIngressRule(
                Peer.ipv4("10.0.0.0/16"),
                Port.tcp(443),
                "HTTPS from internal network"
        );
        webSecurityGroup.addIngressRule(
                Peer.ipv4("192.168.1.0/24"),
                Port.tcp(443),
                "HTTPS from management network"
        );

        // Security Group for RDS
        this.dbSecurityGroup = SecurityGroup.Builder.create(this, "app-sg-database")
                .securityGroupName("app-sg-database")
                .description("Security group for RDS database")
                .vpc(vpc)
                .build();

        // Allow MySQL/Aurora connections from web security group only
        dbSecurityGroup.addIngressRule(
                Peer.securityGroupId(webSecurityGroup.getSecurityGroupId()),
                Port.tcp(3306),
                "MySQL from web servers"
        );

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public SecurityGroup getWebSecurityGroup() {
        return webSecurityGroup;
    }

    public SecurityGroup getDbSecurityGroup() {
        return dbSecurityGroup;
    }
}