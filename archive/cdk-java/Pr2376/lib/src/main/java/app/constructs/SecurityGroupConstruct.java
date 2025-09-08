package app.constructs;

import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;

public class SecurityGroupConstruct extends Construct {
    private final SecurityGroup webSecurityGroup;

    public SecurityGroupConstruct(final Construct scope, final String id, final Vpc vpc) {
        super(scope, id);

        // Create security group for web traffic
        this.webSecurityGroup = SecurityGroup.Builder.create(this, "WebSecurityGroup")
                .vpc(vpc)
                .description("Security group allowing HTTP traffic")
                .allowAllOutbound(true)
                .build();

        // Allow HTTP traffic (port 80) from anywhere
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic from anywhere"
        );

        // Allow HTTPS traffic (port 443) from anywhere
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic from anywhere"
        );

        // Allow outbound traffic for SSM (HTTPS to AWS services)
        webSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS outbound for SSM"
        );
    }

    public SecurityGroup getWebSecurityGroup() {
        return webSecurityGroup;
    }

    public String getSecurityGroupId() {
        return this.webSecurityGroup.getSecurityGroupId();
    }
}
