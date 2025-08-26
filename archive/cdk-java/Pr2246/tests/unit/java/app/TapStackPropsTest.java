package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;

/**
 * Unit tests for TapStackProps.
 */
public class TapStackPropsTest {

    @Test
    public void testTapStackPropsBuilder() {
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();

        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(stackProps)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }

    @Test
    public void testTapStackPropsWithNullStackProps() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    public void testTapStackPropsBuilderChaining() {
        TapStackProps.Builder builder = TapStackProps.builder();
        
        TapStackProps.Builder result = builder.environmentSuffix("staging");
        assertThat(result).isSameAs(builder);

        StackProps stackProps = StackProps.builder().build();
        result = builder.stackProps(stackProps);
        assertThat(result).isSameAs(builder);

        TapStackProps props = builder.build();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }
}