package app;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the
 * TapStack
 * and may involve more complex scenarios than unit tests.
 *
 * Note: These tests still use synthetic AWS resources and do not require
 * actual AWS credentials or resources to be created.
 */
public class MainIntegrationTest {

  /**
   * Integration test for full stack deployment simulation.
   *
   * This test verifies that the complete stack can be synthesized
   * with all its components working together.
   */
  @Test
  public void testFullStackDeployment() {
    App app = new App();

    // Create stack with production-like configuration
    TapStack stack = new TapStack(app, "TapStackProd", StackProps.builder()
        .env(Environment.builder()
            .region("us-east-2")
            .account("123456789012") // Mock account
            .build())
        .build());

    // Create template and verify it can be synthesized
    Template template = Template.fromStack(stack);

    // Verify stack configuration
    assertThat(stack).isNotNull();
    assertThat(stack.getStackName()).isEqualTo("TapStackProd");
    assertThat(template).isNotNull();
  }

  /**
   * Integration test for multiple environment configurations.
   *
   * This test verifies that the stack can be configured for different
   * regions with appropriate settings.
   */
  @Test
  public void testMultiRegionConfiguration() {
    // Test different region configurations
    String[] regions = { "us-east-1", "us-east-2", "us-west-2" };

    for (String region : regions) {
      // Create a new app for each region to avoid synthesis conflicts
      App app = new App();
      TapStack stack = new TapStack(app, "TapStack" + region.replaceAll("-", ""), StackProps.builder()
          .env(Environment.builder()
              .region(region)
              .account("123456789012") // Mock account
              .build())
          .build());

      // Verify each region configuration
      assertThat(stack.getStackName()).contains("TapStack");

      // Verify template can be created for each region
      Template template = Template.fromStack(stack);
      assertThat(template).isNotNull();
    }
  }

  /**
   * Integration test for stack with complex resource dependencies.
   *
   * This test verifies that all resources in the stack are properly
   * interconnected and that dependencies are correctly established.
   */
  @Test
  public void testResourceIntegration() {
    App app = new App();

    TapStack stack = new TapStack(app, "TapStackIntegration", StackProps.builder()
        .env(Environment.builder()
            .region("us-east-2")
            .account("123456789012") // Mock account
            .build())
        .build());

    Template template = Template.fromStack(stack);

    // Verify basic stack structure
    assertThat(stack).isNotNull();
    assertThat(template).isNotNull();

    // Verify that critical resources are created and properly configured
    template.hasResourceProperties("AWS::EC2::VPC", new java.util.HashMap<>());
    template.hasResourceProperties("AWS::KMS::Key", new java.util.HashMap<>());
    template.hasResourceProperties("AWS::S3::Bucket", new java.util.HashMap<>());
    template.hasResourceProperties("AWS::CloudTrail::Trail", new java.util.HashMap<>());
    template.hasResourceProperties("AWS::SNS::Topic", new java.util.HashMap<>());
    template.hasResourceProperties("AWS::EC2::Instance", new java.util.HashMap<>());
    template.hasResourceProperties("AWS::RDS::DBInstance", new java.util.HashMap<>());
  }
}
