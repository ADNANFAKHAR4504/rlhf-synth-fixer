# IDEAL_RESPONSE.md

## Project: IaC – AWS Nova Model Breaking

The following code implements a **multi-region fault-tolerant infrastructure** using **AWS CDK (Java)**.  
It provisions two stacks (`us-east-1` and `us-west-2`) for high availability and disaster recovery.  

All files are located in the `lib/` folder.

---

## 📄 lib/Main.java

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

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

        // Determine environment suffix (default: dev)
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

        // Synthesize into CloudFormation templates
        app.synth();
    }
}
