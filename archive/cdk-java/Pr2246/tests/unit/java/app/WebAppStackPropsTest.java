package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

/**
 * Unit tests for WebAppStackProps.
 * 
 * These tests verify the WebAppStackProps builder pattern and property handling.
 */
public class WebAppStackPropsTest {

    @Test
    public void testWebAppStackPropsBuilder() {
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();

        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("test")
                .stackProps(stackProps)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }

    @Test
    public void testWebAppStackPropsWithNullStackProps() {
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    public void testWebAppStackPropsBuilderChaining() {
        WebAppStackProps.Builder builder = WebAppStackProps.builder();
        
        WebAppStackProps.Builder result = builder.environmentSuffix("staging");
        assertThat(result).isSameAs(builder);

        StackProps stackProps = StackProps.builder().build();
        result = builder.stackProps(stackProps);
        assertThat(result).isSameAs(builder);

        WebAppStackProps props = builder.build();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }
    
    @Test
    public void testWebAppStackPropsWithNullValues() {
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix(null)
                .stackProps(null)
                .build();

        assertThat(props.getEnvironmentSuffix()).isNull();
        assertThat(props.getStackProps()).isNotNull(); // Should create a default StackProps
    }
    
    @Test
    public void testWebAppStackPropsWithEmptyBuilder() {
        WebAppStackProps props = WebAppStackProps.builder().build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isNull();
        assertThat(props.getStackProps()).isNotNull();
    }
    
    @Test
    public void testStackPropsIsImmutable() {
        StackProps initialStackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();
        
        WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix("test")
                .stackProps(initialStackProps)
                .build();
        
        // Verify that the returned stack props is the same object that was provided
        assertThat(props.getStackProps()).isSameAs(initialStackProps);
    }
}
