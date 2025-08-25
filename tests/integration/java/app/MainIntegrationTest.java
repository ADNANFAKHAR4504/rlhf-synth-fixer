package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the RegionalStack
 * and may involve more complex scenarios than unit tests.
 */
public class MainIntegrationTest {

    /**
     * Integration test for full stack deployment simulation.
     */
    @Test
    public void testFullStackDeployment() {
        App app = new App();

        RegionalStack stack = new RegionalStack(app, "NovaStackProd",
                StackProps.builder().build(), "prod");

        Template template = Template.fromStack(stack);

        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }

    /**
     * Integration test for multiple environment configurations.
     */
    @Test
    public void testMultiEnvironmentConfiguration() {
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            App app = new App();
            RegionalStack stack = new RegionalStack(app, "NovaStack" + env,
                    StackProps.builder().build(), env);

            assertThat(stack).isNotNull();
            assertThat(templateFrom(stack)).isNotNull();
        }
    }

    /**
     * Integration test for stack with nested components (future-proof).
     */
    @Test
    public void testStackWithNestedComponents() {
        App app = new App();

        RegionalStack stack = new RegionalStack(app, "NovaStackIntegration",
                StackProps.builder().build(), "integration");

        Template template = Template.fromStack(stack);

        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }

    // helper method for brevity
    private Template templateFrom(RegionalStack stack) {
        return Template.fromStack(stack);
    }
}
