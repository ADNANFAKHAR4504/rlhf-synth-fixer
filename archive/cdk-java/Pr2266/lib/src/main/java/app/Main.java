package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

// Import all the stack classes
import app.networking.VpcStack;
import app.networking.SecurityGroupStack;
import app.compute.WebApplicationStack;
import app.compute.AutoScalingStack;
import app.monitoring.CloudWatchStack;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
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
 * Main TapStack that orchestrates multi-region web application deployment
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Deploy to primary region
        deployToRegion("us-east-1", true);
    }

    private void deployToRegion(String region, boolean isPrimary) {
        // Create VPC Stack for this region
        VpcStack vpcStack = new VpcStack(this, 
            "VpcStack" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build());

        // Create Security Group Stack
        SecurityGroupStack securityStack = new SecurityGroupStack(this,
            "SecurityStack" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            vpcStack.getVpc());

        // Create Web Application Stack
        WebApplicationStack webAppStack = new WebApplicationStack(this,
            "WebAppStack" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            vpcStack.getVpc(),
            securityStack.getAlbSecurityGroup(),
            securityStack.getWebServerSecurityGroup());

        // Create Auto Scaling Stack
        AutoScalingStack autoScalingStack = new AutoScalingStack(this,
            "AutoScalingStack" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            vpcStack.getVpc(),
            securityStack.getWebServerSecurityGroup(),
            webAppStack.getTargetGroup());

        // Create CloudWatch Stack
        CloudWatchStack monitoringStack = new CloudWatchStack(this,
            "CloudWatchStack" + environmentSuffix,
            StackProps.builder()
                .env(Environment.builder()
                    .region(region)
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .build())
                .build(),
            webAppStack.getAlb(),
            autoScalingStack.getAutoScalingGroup());
    }

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
