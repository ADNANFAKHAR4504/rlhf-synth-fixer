package app;

import software.amazon.awscdk.App;
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
 * Main CDK stack that instantiates the infrastructure stack.
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final InfrastructureStack infrastructureStack;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Detect LocalStack environment
        String awsEndpointUrl = System.getenv("AWS_ENDPOINT_URL");
        boolean isLocalStack = awsEndpointUrl != null &&
                               (awsEndpointUrl.contains("localhost") || awsEndpointUrl.contains("4566"));

        // Build environment - use specific account/region for AWS, generic for LocalStack
        Environment.Builder envBuilder = Environment.builder();
        if (!isLocalStack) {
            envBuilder.account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                     .region("us-east-1");
        }

        // Create the infrastructure stack
        this.infrastructureStack = new InfrastructureStack(
            this,
            "InfrastructureStack" + environmentSuffix,
            StackProps.builder()
                .env(envBuilder.build())
                .build(),
            environmentSuffix
        );
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public InfrastructureStack getInfrastructureStack() {
        return infrastructureStack;
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

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Detect LocalStack environment
        String awsEndpointUrl = System.getenv("AWS_ENDPOINT_URL");
        boolean isLocalStack = awsEndpointUrl != null &&
                               (awsEndpointUrl.contains("localhost") || awsEndpointUrl.contains("4566"));

        // Build environment - use specific account/region for AWS, generic for LocalStack
        Environment.Builder envBuilder = Environment.builder();
        if (!isLocalStack) {
            envBuilder.account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                     .region("us-east-1");
        }
        // For LocalStack, we don't specify account/region to avoid validation

        // Create the main stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(envBuilder.build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
