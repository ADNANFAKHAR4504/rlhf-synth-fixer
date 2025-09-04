package app;

import software.amazon.awscdk.App;



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

        // Get environment from context or default to 'dev'
        String environment = (String) app.getNode().tryGetContext("environment");
        if (environment == null) {
            environment = System.getenv("ENVIRONMENT");
            if (environment == null || environment.isEmpty()) {
                environment = "dev";
            }
        }

        // Create the main TAP stack using the TapStack class
        new TapStack(app, "TapStack-" + environment, software.amazon.awscdk.StackProps.builder()
                .env(software.amazon.awscdk.Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(System.getenv("CDK_DEFAULT_REGION"))
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
