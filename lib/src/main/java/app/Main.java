package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

/**
 * RegionalStack represents a single-region deployment of the Nova Model Breaking project.
 * Resources such as VPC, AutoScaling, RDS, and S3 will be added here in future iterations.
 */
public class RegionalStack extends Stack {
    public RegionalStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // TODO: Add resources (VPC, AutoScalingGroup, RDS, S3, Route53, CloudWatch, IAM, etc.)
    }
}

/**
 * Main entry point for the AWS CDK Java application.
 * Provisions stacks across us-east-1 and us-west-2 for HA/DR.
 */
public final class Main {

    private Main() {
        // Prevent instantiation
    }

    public static void main(final String[] args) {
        App app = new App();

        // Resolve AWS account from environment variables
        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (account == null) {
            throw new RuntimeException("CDK_DEFAULT_ACCOUNT not set");
        }

        // Get environment suffix (default: dev)
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

        // Synthesize app into CloudFormation templates
        app.synth();
    }
}
