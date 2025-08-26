package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Simple unit tests that don't require CDK app instantiation.
 */
public class SimpleTest {

    @Test
    public void testBasicAssertion() {
        assertThat(1 + 1).isEqualTo(2);
    }

    @Test
    public void testTapStackPropsBuilder() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
    }

    @Test
    public void testTapStackPropsDefaults() {
        TapStackProps props = TapStackProps.builder().build();
        
        assertThat(props).isNotNull();
        assertThat(props.getStackProps()).isNotNull();
    }
}