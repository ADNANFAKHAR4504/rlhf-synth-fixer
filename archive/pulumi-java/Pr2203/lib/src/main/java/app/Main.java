package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.resources.ComponentResourceOptions;

/**
 * Main class for Java Pulumi infrastructure as code.
 *
 * <p>This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK. It creates a
 * simple S3 bucket as an example.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

  /** Private constructor to prevent instantiation of utility class. */
  private Main() {
    // Utility class should not be instantiated
  }

  /**
   * Main entry point for the Pulumi program.
   *
   * <p>This method defines the infrastructure resources to be created. Pulumi will execute this
   * code to determine what resources to create, update, or delete based on the current state.
   *
   * @param args Command line arguments (not used in this example)
   */
  public static void main(String[] args) {
    Pulumi.run(Main::defineInfrastructure);
  }

  /**
   * Defines the infrastructure resources to be created.
   *
   * <p>This method is separated from main() to make it easier to test and to follow best practices
   * for Pulumi Java programs.
   *
   * @param ctx The Pulumi context for exporting outputs
   */
  static void defineInfrastructure(Context ctx) {
    // Initialize configuration
    WebAppStack stack =
        new WebAppStack("webapp-migration", ComponentResourceOptions.builder().build());

    // Export important outputs
    ctx.export("ec2InstanceId", stack.getWebInstance().id());
    ctx.export("ec2PublicIp", stack.getWebInstance().publicIp());
    ctx.export("s3BucketName", stack.getDataBucket().bucket());
    ctx.export("dynamoTableName", stack.getDataTable().name());
    ctx.export("securityGroupId", stack.getWebSecurityGroup().id());
  }
}
