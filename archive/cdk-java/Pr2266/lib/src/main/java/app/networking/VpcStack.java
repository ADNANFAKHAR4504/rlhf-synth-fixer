package app.networking;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class VpcStack extends Stack {
    private final Vpc vpc;
    private final List<ISubnet> publicSubnets;
    private final List<ISubnet> privateSubnets;
    
    public VpcStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
        // Create VPC with multiple AZs
        this.vpc = Vpc.Builder.create(this, "WebAppVpc")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(3)
                .subnetConfiguration(List.of(
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("public")
                        .subnetType(SubnetType.PUBLIC)
                        .build(),
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("private")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();
        
        this.publicSubnets = vpc.getPublicSubnets();
        this.privateSubnets = vpc.getPrivateSubnets();
        
        // Add VPC Flow Logs for monitoring
        FlowLog.Builder.create(this, "VpcFlowLogs")
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .trafficType(FlowLogTrafficType.ALL)
                .build();
    }
    
    public Vpc getVpc() {
        return vpc;
    }
    
    public List<ISubnet> getPublicSubnets() {
        return publicSubnets;
    }
    
    public List<ISubnet> getPrivateSubnets() {
        return privateSubnets;
    }
}