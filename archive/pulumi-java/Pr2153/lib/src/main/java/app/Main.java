package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;

/**
 * Main entry point for the Pulumi Java web application infrastructure program.
 * This class follows the Pulumi convention of having a main method that calls Pulumi.run().
 */
public final class Main {
    
    /**
     * Private constructor to prevent instantiation.
     */
    private Main() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    /**
     * Main entry point for the application.
     * @param args Command line arguments (not used)
     */
    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }
    
    /**
     * Define the infrastructure resources using WebAppStack.
     * @param ctx Pulumi execution context
     */
    static void defineInfrastructure(final Context ctx) {
        WebAppStack.stack(ctx);
    }
}