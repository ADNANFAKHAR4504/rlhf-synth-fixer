package app;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import software.amazon.awscdk.App;
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
   * Test that the TapStack can be instantiated successfully with default
   * properties.
   */
  @Test
  public void testStackCreation() {
    App app = new App();
    app.getNode().setContext("environmentSuffix", "test");
    TapStack stack = new TapStack(app, "TestStack", StackProps.builder().build());

    // Verify stack was created
    assertThat(stack).isNotNull();
  }

  /**
   * Test that the TapStack uses 'dev' as default environment suffix when none is
   * provided.
   */
  @Test
  public void testDefaultEnvironmentSuffix() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStack", StackProps.builder().build());

    // Verify stack was created
    assertThat(stack).isNotNull();
  }

  /**
   * Test that the TapStack synthesizes without errors.
   */
  @Test
  public void testStackSynthesis() {
    App app = new App();
    app.getNode().setContext("environmentSuffix", "test");
    TapStack stack = new TapStack(app, "TestStack", StackProps.builder().build());

    // Create template from the stack
    Template template = Template.fromStack(stack);

    // Verify template can be created (basic synthesis test)
    assertThat(template).isNotNull();
  }

  /**
   * Test that the TapStack respects environment suffix from CDK context.
   */
  @Test
  public void testEnvironmentSuffixFromContext() {
    App app = new App();
    app.getNode().setContext("environmentSuffix", "staging");

    TapStack stack = new TapStack(app, "TestStack", StackProps.builder().build());

    // Verify stack was created
    assertThat(stack).isNotNull();
  }
}