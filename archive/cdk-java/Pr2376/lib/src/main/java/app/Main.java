package app;

import app.constructs.Ec2Construct;
import app.constructs.SecurityGroupConstruct;
import app.constructs.VpcConstruct;
import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.Environment;
import software.constructs.Construct;

import java.util.List;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String envSuffix, final StackProps props) {
        this.environmentSuffix = envSuffix;
        this.stackProps = props != null ? props : StackProps.builder().build();
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

        public Builder environmentSuffix(final String envSuffix) {
            this.environmentSuffix = envSuffix;
            return this;
        }

        public Builder stackProps(final StackProps props) {
            this.stackProps = props;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Determine VPC configuration based on region
        String region = this.getRegion();
        if (region == null) {
            region = "us-east-1"; // Default region for tests
        }
        String vpcCidr;
        boolean shouldCreateEc2 = false;

        if ("us-east-1".equals(region)) {
            vpcCidr = "10.0.0.0/16";
            shouldCreateEc2 = true; // Only create EC2 in the first VPC
        } else {
            vpcCidr = "192.168.0.0/16";
        }

        // Create VPC component
        VpcConstruct vpcConstruct = new VpcConstruct(this, "VpcComponent", vpcCidr);

        // Create security group component
        SecurityGroupConstruct securityGroupConstruct = new SecurityGroupConstruct(
                this, "SecurityGroupComponent", vpcConstruct.getVpc());

        // Create EC2 instance only in the first VPC (us-east-1)
        if (shouldCreateEc2) {
            Ec2Construct ec2Construct = new Ec2Construct(this, "Ec2Component",
                    vpcConstruct.getVpc(),
                    vpcConstruct.getPublicSubnet(),
                    securityGroupConstruct.getWebSecurityGroup());

            CfnOutput.Builder.create(this, region + "-ec2InstanceIdOutput")
                    .value(ec2Construct.getInstanceId())
                    .exportName(region + "-ec2InstanceId")
                    .build();

            CfnOutput.Builder.create(this, region + "-ec2InstanceRoleArnOutput")
                    .value(ec2Construct.getInstanceRoleArn())
                    .exportName(region + "-ec2InstanceRoleArn")
                    .build();
        }

        CfnOutput.Builder.create(this, region + "-securityGroupIdOutput")
                .value(securityGroupConstruct.getSecurityGroupId())
                .exportName(region + "-securityGroupId")
                .build();

        CfnOutput.Builder.create(this, region + "-vpcIdOutput")
                .value(vpcConstruct.getVpc().getVpcId())
                .exportName(region + "-vpcId")
                .build();

        CfnOutput.Builder.create(this, region + "-vpcPrivateSubnetIdOutput")
                .value(vpcConstruct.getPrivateSubnet().getSubnetId())
                .exportName(region + "-vpcPrivateSubnetId")
                .build();

        CfnOutput.Builder.create(this, region + "-vpcPublicSubnetIdOutput")
                .value(vpcConstruct.getPublicSubnet().getSubnetId())
                .exportName(region + "-vpcPublicSubnetId")
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

        // Define environments for different regions
        Environment usEast1 = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-east-1")
                .build();

        Environment usWest2 = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-west-2")
                .build();

        String finalEnvironmentSuffix = environmentSuffix;

        List.of(usEast1, usWest2).forEach((environment) -> new TapStack(
                app, "TapStack-" + finalEnvironmentSuffix + "-" + environment.getRegion(),
                TapStackProps.builder()
                .environmentSuffix(finalEnvironmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(environment.getAccount())
                                .region(environment.getRegion())
                                .build())
                        .build())
                .build()));

        app.synth();
    }
}
