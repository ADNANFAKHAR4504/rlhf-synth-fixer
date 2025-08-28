package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;

public class CdkApp {
    public static void main(final String[] args) {
        App app = new App();

        // ✅ Minimal empty stack (no StackProps needed)
        new Stack(app, "TapStack");

        app.synth(); // This creates cdk.out/manifest.json
    }
}
