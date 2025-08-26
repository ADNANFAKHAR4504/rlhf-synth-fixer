package app;

import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.List;

/**
 * Properties for configuring the VPC stack.
 */
class VpcStackProps {
    private final String environmentSuffix;
    private final NestedStackProps nestedStackProps;

    private VpcStackProps(String environmentSuffix, NestedStackProps nestedStackProps) {
        this.environmentSuffix = environmentSuffix;
        this.nestedStackProps = nestedStackProps != null ? nestedStackProps : NestedStackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public NestedStackProps getNestedStackProps() {
        return nestedStackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private NestedStackProps nestedStackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder nestedStackProps(NestedStackProps nestedStackProps) {
            this.nestedStackProps = nestedStackProps;
            return this;
        }

        public VpcStackProps build() {
            return new VpcStackProps(environmentSuffix, nestedStackProps);
        }
    }
}

/**
 * VPC Stack for creating networking infrastructure.
 * 
 * This nested stack creates a VPC with public and private subnets,
 * internet gateway, NAT gateway, and proper routing configuration.
 */
class VpcStack extends NestedStack {
    private final Vpc vpc;
    private final String internetGatewayId;
    private final List<ISubnet> publicSubnets;
    private final List<ISubnet> privateSubnets;

    /**
     * Creates a new VPC stack with complete networking infrastructure.
     *
     * @param scope The parent construct
     * @param id The construct ID
     * @param props Stack configuration properties
     */
    public VpcStack(final Construct scope, final String id, final VpcStackProps props) {
        super(scope, id, props.getNestedStackProps());

        String environmentSuffix = props.getEnvironmentSuffix();

        // Create VPC with specified CIDR block
        this.vpc = Vpc.Builder.create(this, "Vpc")
                .vpcName("cloud-env-vpc-" + environmentSuffix)
                .cidr("10.0.0.0/16")
                .maxAzs(2)  // Use exactly 2 AZs for cost optimization
                .subnetConfiguration(List.of(
                    SubnetConfiguration.builder()
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)  // Creates 10.0.1.0/24 and 10.0.2.0/24
                        .build(),
                    SubnetConfiguration.builder()
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_NAT)
                        .cidrMask(24)  // Creates 10.0.3.0/24 and 10.0.4.0/24
                        .build()
                ))
                .natGateways(1)  // Single NAT Gateway for cost optimization
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        // Get the internet gateway ID created by the VPC
        this.internetGatewayId = vpc.getInternetGatewayId();

        // Get public and private subnets
        this.publicSubnets = vpc.getPublicSubnets();
        this.privateSubnets = vpc.getPrivateSubnets();

        // Create VPC Endpoints for enhanced security and cost optimization
        createVpcEndpoints();

        // Apply tags to VPC and related resources
        Tags.of(vpc).add("Name", "cloud-env-vpc-" + environmentSuffix);
        Tags.of(vpc).add("Environment", "Development");
        Tags.of(this).add("Component", "Networking");
    }

    /**
     * Creates VPC endpoints for AWS services to reduce NAT Gateway usage and improve security.
     */
    private void createVpcEndpoints() {
        // S3 Gateway Endpoint (no charge)
        vpc.addGatewayEndpoint("S3Endpoint", GatewayVpcEndpointOptions.builder()
                .service(GatewayVpcEndpointAwsService.S3)
                .subnets(List.of(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_NAT)
                    .build()))
                .build());

        // EventBridge Interface Endpoint with ServiceRegion configuration
        InterfaceVpcEndpoint eventBridgeEndpoint = vpc.addInterfaceEndpoint("EventBridgeEndpoint",
            InterfaceVpcEndpointOptions.builder()
                .service(new InterfaceVpcEndpointService("com.amazonaws.us-west-2.events"))
                .subnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_NAT)
                    .build())
                .privateDnsEnabled(true)
                .build());

        Tags.of(eventBridgeEndpoint).add("Name", "eventbridge-endpoint");
        Tags.of(eventBridgeEndpoint).add("Environment", "Development");
    }

    /**
     * Gets the created VPC.
     *
     * @return The VPC instance
     */
    public Vpc getVpc() {
        return vpc;
    }

    /**
     * Gets the internet gateway ID.
     *
     * @return The InternetGateway ID
     */
    public String getInternetGatewayId() {
        return internetGatewayId;
    }

    /**
     * Gets the public subnets.
     *
     * @return List of public subnets
     */
    public List<ISubnet> getPublicSubnets() {
        return publicSubnets;
    }

    /**
     * Gets the private subnets.
     *
     * @return List of private subnets
     */
    public List<ISubnet> getPrivateSubnets() {
        return privateSubnets;
    }
}