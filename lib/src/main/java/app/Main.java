package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This version provisions the TapStack in multiple AWS regions
 * to support high availability and disaster recovery.
 */
public final class Main {

    private Main() {
        // Prevent instantiation
    }

    public static void main(final String[] args) {
        App app = new App();

        // Resolve account from environment
        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (account == null) {
            throw new RuntimeException("CDK_DEFAULT_ACCOUNT not set");
        }

        // Default environment suffix
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Primary region: us-east-1
        new TapStack(app, "TapStack-" + environmentSuffix + "-use1", TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region("us-east-1")
                                .build())
                        .build())
                .build());

        // Secondary region: us-west-2
        new TapStack(app, "TapStack-" + environmentSuffix + "-usw2", TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region("us-west-2")
                                .build())
                        .build())
                .build());

        // Synthesize CloudFormation templates for both regions
        app.synth();
    }
}
