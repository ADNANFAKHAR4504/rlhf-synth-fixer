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
    TapStack stack = new TapStack(app, "TapStacktest-Primary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-2")
                .build())
            .build(),
        true, // isPrimary
        "us-west-2"); // otherRegion

    // Verify stack was created
    assertThat(stack).isNotNull();
    assertThat(stack.getStackName()).isEqualTo("TapStacktest-Primary");
  }

  /**
   * Test that the TapStack can be instantiated successfully as a secondary stack.
   */
  @Test
  public void testSecondaryStackCreation() {
    App app = new App();
    TapStack stack = new TapStack(app, "TapStacktest-Secondary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .build(),
        false, // isPrimary
        "us-east-2"); // otherRegion

    // Verify stack was created
    assertThat(stack).isNotNull();
    assertThat(stack.getStackName()).isEqualTo("TapStacktest-Secondary");
  }

  /**
   * Test that the TapStack synthesizes without errors for primary region.
   */
  @Test
  public void testPrimaryStackSynthesis() {
    App app = new App();
    TapStack stack = new TapStack(app, "TapStacktest-Primary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-2")
                .build())
            .build(),
        true, // isPrimary
        "us-west-2"); // otherRegion

    // Create template from the stack
    Template template = Template.fromStack(stack);

    // Verify template can be created (basic synthesis test)
    assertThat(template).isNotNull();

    // Verify that the template contains expected resources for primary stack
    template.hasResourceProperties("AWS::EC2::VPC", java.util.Map.of());
    template.hasResourceProperties("AWS::Route53::HostedZone", java.util.Map.of());
    template.hasResourceProperties("AWS::RDS::DBInstance", java.util.Map.of());
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", java.util.Map.of());
    template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", java.util.Map.of());
    template.hasResourceProperties("AWS::Lambda::Function", java.util.Map.of());
    template.hasResourceProperties("AWS::SNS::Topic", java.util.Map.of());
    template.hasResourceProperties("AWS::CloudWatch::Alarm", java.util.Map.of());

    // Verify stack outputs
    template.hasOutput("LoadBalancerDNS", java.util.Map.of());
    template.hasOutput("DatabaseEndpoint", java.util.Map.of());
    template.hasOutput("RegionInfo", java.util.Map.of());
  }

  /**
   * Test that the TapStack synthesizes without errors for secondary region.
   */
  @Test
  public void testSecondaryStackSynthesis() {
    App app = new App();
    TapStack stack = new TapStack(app, "TapStacktest-Secondary",
        StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .build(),
        false, // isPrimary
        "us-east-2"); // otherRegion

    // Create template from the stack
    Template template = Template.fromStack(stack);

    // Verify template can be created (basic synthesis test)
    assertThat(template).isNotNull();

    // Verify that the template contains expected resources for secondary stack
    template.hasResourceProperties("AWS::EC2::VPC", java.util.Map.of());
    template.hasResourceProperties("AWS::Route53::HostedZone", java.util.Map.of(
        "Name", "secondary.tapapp.exampleturing.com."));
    template.hasResourceProperties("AWS::RDS::DBInstance", java.util.Map.of());
    template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", java.util.Map.of());
    template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", java.util.Map.of());
    template.hasResourceProperties("AWS::Lambda::Function", java.util.Map.of());

    // Verify stack outputs
    template.hasOutput("LoadBalancerDNS", java.util.Map.of());
    template.hasOutput("DatabaseEndpoint", java.util.Map.of());
    template.hasOutput("RegionInfo", java.util.Map.of());
  }
}