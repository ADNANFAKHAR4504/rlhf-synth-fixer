package app;

import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between the PrimaryStack and SecondaryStack
 * and ensure they can be synthesized together correctly.
 */
public class MainIntegrationTest {

    /**
     * Integration test for a full multi-region deployment simulation.
     *
     * This test verifies that both the PrimaryStack and SecondaryStack can be
     * synthesized together with all their components.
     */
    @Test
    public void testMultiRegionDeployment() {
        App app = new App();

        // Define test parameters
        String environmentName = "test";
        String primaryRegion = "us-east-1";
        String secondaryRegion = "us-west-2";

        // Create Primary Stack
        Main.PrimaryStack primaryStack = new Main.PrimaryStack(app, "PrimaryStack-" + environmentName,
            StackProps.builder().build(), environmentName, primaryRegion, secondaryRegion);

        // Create Secondary Stack
        Main.SecondaryStack secondaryStack = new Main.SecondaryStack(app, "SecondaryStack-" + environmentName,
            StackProps.builder().build(), environmentName, secondaryRegion, primaryStack);

        // Create templates for both stacks
        Template primaryTemplate = Template.fromStack(primaryStack);
        Template secondaryTemplate = Template.fromStack(secondaryStack);

        // --- Assertions for Primary Stack ---
        assertThat(primaryTemplate).isNotNull();
        // Check for key resources in the primary stack
        primaryTemplate.resourceCountIs("AWS::EC2::VPC", 1);
        primaryTemplate.resourceCountIs("AWS::RDS::DBInstance", 1);
        primaryTemplate.resourceCountIs("AWS::DynamoDB::Table", 1);
        primaryTemplate.resourceCountIs("AWS::KMS::Key", 1);
        primaryTemplate.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
        primaryTemplate.resourceCountIs("AWS::AutoScaling::AutoScalingGroup", 1);

        // --- Assertions for Secondary Stack ---
        assertThat(secondaryTemplate).isNotNull();
        // Check for key resources in the secondary stack
        secondaryTemplate.resourceCountIs("AWS::EC2::VPC", 1);
        secondaryTemplate.resourceCountIs("AWS::RDS::DBInstance", 1); // Read replica
    }
}
