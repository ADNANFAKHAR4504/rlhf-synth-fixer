package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Unit tests for the Main CDK application.
 *
 * These tests verify the basic structure and configuration of the RegionalStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    /**
     * Test that the RegionalStack can be instantiated successfully.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "TestStack",
                StackProps.builder().build());

        // Verify stack was created
        assertThat(stack).isNotNull();
    }

    /**
     * Test that the RegionalStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "TestStack",
                StackProps.builder().build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
    }

    /**
     * Test that multiple RegionalStacks can be created.
     */
    @Test
    public void testMultipleStacks() {
        App app = new App();

        RegionalStack east = new RegionalStack(app, "TestStackEast",
                StackProps.builder().build());
        RegionalStack west = new RegionalStack(app, "TestStackWest",
                StackProps.builder().build());

        assertThat(east).isNotNull();
        assertThat(west).isNotNull();
    }
}
