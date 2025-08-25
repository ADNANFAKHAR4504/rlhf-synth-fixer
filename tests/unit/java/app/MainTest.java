package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Unit tests for RegionalStack.
 */
public class MainTest {

    @Test
    public void testStackCreation() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "TestStack",
                StackProps.builder().build(), "test");
        assertThat(stack).isNotNull();
    }

    @Test
    public void testStackSynthesis() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "TestStack",
                StackProps.builder().build(), "test");
        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }

    @Test
    public void testMultipleStacks() {
        App app = new App();
        RegionalStack east = new RegionalStack(app, "TestStackEast",
                StackProps.builder().build(), "east");
        RegionalStack west = new RegionalStack(app, "TestStackWest",
                StackProps.builder().build(), "west");
        assertThat(east).isNotNull();
        assertThat(west).isNotNull();
    }
}
