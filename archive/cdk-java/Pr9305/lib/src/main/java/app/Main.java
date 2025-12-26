package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
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

    public static final class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(final String environmentSuffixParam) {
            this.environmentSuffix = environmentSuffixParam;
            return this;
        }

        public Builder stackProps(final StackProps stackPropsParam) {
            this.stackProps = stackPropsParam;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Main CDK stack for robust cloud environment setup.
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create the cloud environment infrastructure stack
        CloudEnvironmentStack environmentStack = new CloudEnvironmentStack(
            this,
            "CloudEnvironment" + environmentSuffix,
            CloudEnvironmentStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .build()
        );

        // Create stack outputs (required by CI/CD pipeline)
        CfnOutput.Builder.create(this, "StackName")
                .value(this.getStackName())
                .description("Name of the CloudFormation stack")
                .build();

        CfnOutput.Builder.create(this, "EnvironmentSuffix")
                .value(this.environmentSuffix)
                .description("Environment suffix for this deployment")
                .build();

        CfnOutput.Builder.create(this, "VpcId")
                .value(environmentStack.getVpc().getVpcId())
                .description("VPC ID from nested stack")
                .build();

        CfnOutput.Builder.create(this, "LoadBalancerDnsName")
                .value(environmentStack.getLoadBalancer().getLoadBalancerDnsName())
                .description("Load Balancer DNS name from nested stack")
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
 * Main entry point for the CDK application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * @param args Command line arguments
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
