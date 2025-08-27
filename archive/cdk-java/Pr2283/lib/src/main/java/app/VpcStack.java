package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.Map;

public class VpcStack extends Stack {

    private final Vpc vpc;

    public VpcStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with public and private subnets across multiple AZs
        this.vpc = Vpc.Builder.create(this, "app-vpc-main")
                .vpcName("app-vpc-main")
                .cidr("10.0.0.0/16")
                .maxAzs(3)
                .subnetConfiguration(java.util.List.of(
                        SubnetConfiguration.builder()
                                .name("app-subnet-public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("app-subnet-private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        // Add common tags
        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public Vpc getVpc() {
        return vpc;
    }
}