package app;

import software.constructs.Construct;

import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.TerraformStack;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();
        new MainStack(app, "cdktf-java");
        app.synth();
    }
}