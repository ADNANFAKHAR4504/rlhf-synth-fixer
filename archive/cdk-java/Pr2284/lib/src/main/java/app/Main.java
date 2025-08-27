package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
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

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Represents the main CDK stack for the Cloud Environment Setup project.
 *
 * This stack orchestrates the creation of VPC, S3, and EventBridge infrastructure
 * using a nested stack pattern for better organization and modularity.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final VpcStack vpcStack;
    private final S3Stack s3Stack;
    private final EventBridgeStack eventBridgeStack;

    /**
     * Constructs a new TapStack with nested infrastructure stacks.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Properties for configuring the stack
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Apply common tags to all resources in this stack
        Tags.of(this).add("Environment", "Development");
        Tags.of(this).add("Project", "CloudEnvironmentSetup");
        Tags.of(this).add("ManagedBy", "CDK");

        // Create VPC Stack - foundational networking infrastructure
        this.vpcStack = new VpcStack(
            this,
            "VpcStack" + environmentSuffix,
            VpcStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .build()
        );

        // Create S3 Stack for application logs storage
        this.s3Stack = new S3Stack(
            this,
            "S3Stack" + environmentSuffix,
            S3StackProps.builder()
                .environmentSuffix(environmentSuffix)
                .build()
        );

        // Create EventBridge Stack for future event scheduling capabilities
        this.eventBridgeStack = new EventBridgeStack(
            this,
            "EventBridgeStack" + environmentSuffix,
            EventBridgeStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .vpc(vpcStack.getVpc())
                .build()
        );
    }

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    /**
     * Gets the VPC stack instance.
     *
     * @return The VPC stack
     */
    public VpcStack getVpcStack() {
        return vpcStack;
    }

    /**
     * Gets the S3 stack instance.
     *
     * @return The S3 stack
     */
    public S3Stack getS3Stack() {
        return s3Stack;
    }

    /**
     * Gets the EventBridge stack instance.
     *
     * @return The EventBridge stack
     */
    public EventBridgeStack getEventBridgeStack() {
        return eventBridgeStack;
    }
}

/**
 * Main entry point for the Cloud Environment Setup CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
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
     * with appropriate configuration for the us-west-2 region.
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from environment variable, context, or default to 'dev'
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
            if (environmentSuffix == null) {
                environmentSuffix = "synthtrainr483cdkjava";
            }
        }

        // Create the main TAP stack for us-west-2 region
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2")  // Explicitly set to us-west-2
                                .build())
                        .description("Cloud Environment Setup - VPC, S3, and EventBridge infrastructure for development environment")
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
