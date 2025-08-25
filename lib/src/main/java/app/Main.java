package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

/**
 * Simple regional stack definition for the IaC – AWS Nova Model Breaking project.
 * This stack will later be extended to add resources (VPC, ASG, RDS, etc.).
 */
class RegionalStack extends Stack {
    public RegionalStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // TODO: Add resources such as VPC, AutoScaling, RDS, S3, etc.
    }
}

/**
 * Main entry point for the CDK Java application.
 * Provisions two stacks across us-east-1 and us-west-2.
 */
public final class Main {

    private Main() {
        // prevent instantiation
    }

    public static void main(final String[] args) {
        App app = new App();

        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (account == null) {
            throw new RuntimeException("CDK_DEFAULT_ACCOUNT not set");
        }

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Primary region: us-east-1
        new RegionalStack(app, "NovaStack-" + environmentSuffix + "-use1",
                StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region("us-east-1")
                                .build())
                        .build());

        // Secondary region: us-west-2
        new RegionalStack(app, "NovaStack-" + environmentSuffix + "-usw2",
                StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region("us-west-2")
                                .build())
                        .build());

        app.synth();
    }
}
