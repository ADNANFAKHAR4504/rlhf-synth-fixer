Hey there,

I need your help with a task for our **'IaC - AWS Nova Model Breaking'** project. We're building the infrastructure for a new video streaming application, and we've decided to use the AWS CDK with Java to define our infrastructure as code.

Your mission is to write the Java code for a robust, secure, and multi-region serverless architecture. I've already set up the basic `Main.java` file structure with a `TapStack` orchestrator class. You just need to fill in the implementation details to bring the infrastructure to life inside that class constructor. The goal is to create a single, complete `Main.java` file.

-----

### \#\# **High-Level Architecture Requirements**

Here’s what we need to build within the `TapStack` constructor. Remember to use the `environmentSuffix` variable (e.g., "dev" or "prod") that's already available in the class to name all your resources uniquely. This is critical for our CI/CD pipelines.

1.  **API & Compute Layer:**

      * Create an **AWS API Gateway (REST API)** to serve as the front door for our application.
      * Define two **AWS Lambda Functions** from local assets (assume a `lambda-handler.zip` file exists in a `assets` directory):
          * `video-upload-function`: To handle incoming video uploads.
          * `video-process-function`: To kick off video processing jobs.
      * Integrate these Lambdas with the API Gateway, creating distinct endpoints like `/upload` and `/process`.
      * **Optimize for cost**: Configure the Lambdas with the lowest practical memory size (e.g., 128 MB) and use the **ARM64 (Graviton2) architecture** for better price-performance.

2.  **Storage & Data:**

      * Provision a secure **S3 bucket** for storing the uploaded video files. This bucket **must have versioning enabled** and all data must be **encrypted at rest using a new, customer-managed AWS KMS key**.
      * Create a separate **S3 bucket** specifically for storing application and access logs. This one also needs **versioning and KMS encryption**.

3.  **Security & IAM (Critical):**

      * Adhere strictly to the **Principle of Least Privilege**. Create a unique, granular **IAM Role** for each Lambda function. Do not share roles.
      * The `video-upload-function`'s role should *only* have `s3:PutObject` permissions on the video bucket.
      * The `video-process-function`'s role should *only* have `s3:GetObject` permissions on the video bucket.
      * **Do not use AWS managed policies like `AdministratorAccess` or broad wildcards (`s3:*`)**. Be as specific as possible in your policy statements.

4.  **Networking & Custom Domain:**

      * Configure a **custom domain** for the API Gateway.
      * You'll need to look up an existing **AWS Certificate Manager (ACM) Certificate** and a **Route 53 Hosted Zone** to associate with the API Gateway. Assume the certificate ARN and hosted zone ID are passed in as context values.

5.  **Monitoring & Logging:**

      * Ensure both Lambda functions are configured with CloudWatch Log Groups.
      * For each Lambda, create a **CloudWatch Alarm** that triggers if its invocation error rate exceeds 5% over a 5-minute period.

-----

### \#\# **Your Task: Complete the Code**

I've provided the Java boilerplate below. Your job is to implement all the resources described above **inside the constructor of the `TapStack` class**. Please deliver the final, complete `Main.java` file with all the necessary imports and logic.

**Code to complete:**

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // =================================================================================
        // <<< YOUR IMPLEMENTATION GOES HERE >>>
        //
        // Define all the required AWS resources (KMS, S3, IAM Roles, Lambdas,
        // API Gateway, Custom Domain, CloudWatch Alarms) in this constructor.
        // Use the 'this.environmentSuffix' variable for naming resources.
        //
        // =================================================================================
    }

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

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

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

-----

### \#\# **Final Checklist & Constraints**

  * **Single File:** All your code must be in the one `Main.java` file provided.
  * **Encryption by Default:** All data at rest (S3 buckets) must be encrypted with your new KMS key.
  * **No Hardcoded Secrets:** Don't put any secrets or ARNs in the code.
  * **Secure Networking:** Remember our security principle: avoid overly permissive rules like `0.0.0.0/0`.
  * **Clean Stack Outputs:** Only output essential, non-sensitive information like the API Gateway URL.

Looking forward to seeing the complete CDK stack. Thanks\!
