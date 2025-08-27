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
   * Integration test for full stack deployment simulation in primary region.
   *
   * This test verifies that the complete stack can be synthesized
   * with all its components working together in a production-like configuration.
   */
  @Test
  public void testFullPrimaryStackDeployment() {
    App app = new App();

    // Create stack with production-like configuration
    TapStack stack = new TapStack(app, "TapStackprod-Primary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-2")
                .build())
            .build(),
        true, // isPrimary
        "us-west-2"); // otherRegion

    // Create template and verify it can be synthesized
    Template template = Template.fromStack(stack);

    // Verify stack configuration
    assertThat(stack).isNotNull();
    assertThat(stack.getStackName()).isEqualTo("TapStackprod-Primary");
    assertThat(template).isNotNull();

    // Verify that the template contains expected resources for primary stack
    template.hasResourceProperties("AWS::EC2::VPC", java.util.Map.of());
    template.hasResourceProperties("AWS::Route53::HostedZone", java.util.Map.of());
  }

  /**
   * Integration test for multiple region configurations.
   *
   * This test verifies that the stack can be configured for different
   * regions with appropriate primary/secondary settings.
   */
  @Test
  public void testMultiRegionConfiguration() {
    // Test primary region configuration
    App app1 = new App();
    TapStack primaryStack = new TapStack(app1, "TapStacktest-Primary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-2")
                .build())
            .build(),
        true, // isPrimary
        "us-west-2"); // otherRegion

    // Test secondary region configuration
    App app2 = new App();
    TapStack secondaryStack = new TapStack(app2, "TapStacktest-Secondary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .build(),
        false, // isPrimary
        "us-east-2"); // otherRegion

    // Verify both stacks can be created and synthesized
    assertThat(primaryStack.getStackName()).isEqualTo("TapStacktest-Primary");
    assertThat(secondaryStack.getStackName()).isEqualTo("TapStacktest-Secondary");

    Template primaryTemplate = Template.fromStack(primaryStack);
    Template secondaryTemplate = Template.fromStack(secondaryStack);

    assertThat(primaryTemplate).isNotNull();
    assertThat(secondaryTemplate).isNotNull();
  }

  /**
   * Integration test for stack with all major components.
   *
   * This test verifies that all major AWS resources are properly
   * configured and can work together.
   */
  @Test
  public void testStackWithAllComponents() {
    App app = new App();

    TapStack stack = new TapStack(app, "TapStackintegration-Primary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-2")
                .build())
            .build(),
        true, // isPrimary
        "us-west-2"); // otherRegion

    Template template = Template.fromStack(stack);

    // Verify basic stack structure
    assertThat(stack).isNotNull();
    assertThat(template).isNotNull();

    // Verify that all major resource types are present
    template.hasResourceProperties("AWS::EC2::VPC", java.util.Map.of());
    template.hasResourceProperties("AWS::EC2::SecurityGroup", java.util.Map.of());
    template.hasResourceProperties("AWS::RDS::DBInstance", java.util.Map.of());
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", java.util.Map.of());
    template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", java.util.Map.of());
    template.hasResourceProperties("AWS::SNS::Topic", java.util.Map.of());
    template.hasResourceProperties("AWS::CloudWatch::Alarm", java.util.Map.of());
    template.hasResourceProperties("AWS::Lambda::Function", java.util.Map.of());
  }
}
