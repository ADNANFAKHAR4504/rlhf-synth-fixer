package app;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

  /**
   * Test that the TapStack can be instantiated successfully as a primary stack.
   */
  @Test
  public void testPrimaryStackCreation() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStackPrimary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        true, // isPrimary
        "us-west-2"); // otherRegion

    // Verify stack was created
    assertThat(stack).isNotNull();
    assertThat(stack.getStackName()).isEqualTo("TestStackPrimary");
  }

  /**
   * Test that the TapStack can be instantiated successfully as a secondary stack.
   */
  @Test
  public void testSecondaryStackCreation() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStackSecondary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .build(),
        false, // isPrimary
        "us-east-1"); // otherRegion

    // Verify stack was created
    assertThat(stack).isNotNull();
    assertThat(stack.getStackName()).isEqualTo("TestStackSecondary");
  }

  /**
   * Test that the TapStack synthesizes without errors for primary region.
   */
  @Test
  public void testPrimaryStackSynthesis() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStackPrimary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(),
        true, // isPrimary
        "us-west-2"); // otherRegion

    // Create template from the stack
    Template template = Template.fromStack(stack);

    // Verify template can be created (basic synthesis test)
    assertThat(template).isNotNull();

    // Verify that the template contains expected resources
    // (This is a basic check - more specific resource tests could be added)
    template.hasResourceProperties("AWS::EC2::VPC", java.util.Map.of());
  }

  /**
   * Test that the TapStack synthesizes without errors for secondary region.
   */
  @Test
  public void testSecondaryStackSynthesis() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStackSecondary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .build(),
        false, // isPrimary
        "us-east-1"); // otherRegion

    // Create template from the stack
    Template template = Template.fromStack(stack);

    // Verify template can be created (basic synthesis test)
    assertThat(template).isNotNull();

    // Verify that the template contains expected resources
    template.hasResourceProperties("AWS::EC2::VPC", java.util.Map.of());
  }
}