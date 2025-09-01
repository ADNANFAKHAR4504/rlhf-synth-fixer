package app;

import com.hashicorp.cdktf.App;


public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();
        new MainStack(app, "cdktf-java");
        app.synth();
    }
}