package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

/**
 * Main entry point for the Secure Infrastructure CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the SecurityStack with comprehensive
 * AWS security best practices.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter and demonstrates enterprise-grade security
 * configurations for EC2, S3, RDS, IAM, and other AWS services.
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
     * This method creates a CDK App instance and instantiates the SecurityStack
     * with appropriate configuration based on environment variables and context.
     * The stack implements comprehensive security best practices including:
     * - Customer-managed KMS encryption for all services
     * - Multi-tier VPC with proper network segmentation
     * - Security groups with minimal required access
     * - IAM roles following principle of least privilege
     * - Comprehensive logging and monitoring setup
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        try {
            System.err.println("Starting CDK application...");
            App app = new App();

            // Get environment suffix from context or environment variable
            String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
            if (environmentSuffix == null || environmentSuffix.isEmpty()) {
                environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
                if (environmentSuffix == null || environmentSuffix.isEmpty()) {
                    environmentSuffix = "synthtrainr479cdkjava";
                }
            }
            System.err.println("Using environment suffix: " + environmentSuffix);

            // Create the security stack with comprehensive AWS security best practices
            System.err.println("Creating SecurityStack...");
            new SecurityStack(app, "TapStack" + environmentSuffix, 
                    StackProps.builder()
                            .env(Environment.builder()
                                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                    .region(System.getenv("CDK_DEFAULT_REGION"))
                                    .build())
                            .build(), 
                    environmentSuffix);

            // Synthesize the CDK app
            System.err.println("Synthesizing CDK app...");
            app.synth();
            System.err.println("Synthesis complete!");
        } catch (Exception e) {
            System.err.println("Error in Main: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}