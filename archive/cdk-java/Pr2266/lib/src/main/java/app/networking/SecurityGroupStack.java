package app.networking;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

public class SecurityGroupStack extends Stack {
    private final SecurityGroup albSecurityGroup;
    private final SecurityGroup webServerSecurityGroup;
    
    public SecurityGroupStack(final Construct scope, final String id, final StackProps props, final Vpc vpc) {
        super(scope, id, props);
        
        // ALB Security Group
        this.albSecurityGroup = SecurityGroup.Builder.create(this, "AlbSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();
        
        // Allow HTTP and HTTPS from anywhere
        albSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "Allow HTTP from anywhere"
        );
        
        albSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "Allow HTTPS from anywhere"
        );
        
        // Web Server Security Group
        this.webServerSecurityGroup = SecurityGroup.Builder.create(this, "WebServerSecurityGroup")
                .vpc(vpc)
                .description("Security group for web server instances")
                .allowAllOutbound(true)
                .build();
        
        // Allow traffic from ALB only
        webServerSecurityGroup.addIngressRule(
            Peer.securityGroupId(albSecurityGroup.getSecurityGroupId()),
            Port.tcp(80),
            "Allow HTTP from ALB"
        );
        
        // Allow SSH for management (adjust source as needed)
        webServerSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(22),
            "Allow SSH access"
        );
    }
    
    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }
    
    public SecurityGroup getWebServerSecurityGroup() {
        return webServerSecurityGroup;
    }
}