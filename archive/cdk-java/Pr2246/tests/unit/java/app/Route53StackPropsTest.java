package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

/**
 * Unit tests for Route53StackProps.
 * 
 * These tests verify the Route53StackProps builder pattern and property handling.
 */
public class Route53StackPropsTest {

    @Test
    public void testRoute53StackPropsBuilder() {
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build();

        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("test")
                .stackProps(stackProps)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }

    @Test
    public void testRoute53StackPropsWithNullStackProps() {
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    public void testRoute53StackPropsBuilderChaining() {
        Route53StackProps.Builder builder = Route53StackProps.builder();
        
        Route53StackProps.Builder result = builder.environmentSuffix("staging");
        assertThat(result).isSameAs(builder);

        StackProps stackProps = StackProps.builder().build();
        result = builder.stackProps(stackProps);
        assertThat(result).isSameAs(builder);

        Route53StackProps props = builder.build();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }
    
    @Test
    public void testRoute53StackPropsWithNullValues() {
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix(null)
                .stackProps(null)
                .build();

        assertThat(props.getEnvironmentSuffix()).isNull();
        assertThat(props.getStackProps()).isNotNull(); // Should create a default StackProps
    }
    
    @Test
    public void testRoute53StackPropsWithEmptyBuilder() {
        Route53StackProps props = Route53StackProps.builder().build();
        
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
        
        Route53StackProps props = Route53StackProps.builder()
                .environmentSuffix("test")
                .stackProps(initialStackProps)
                .build();
        
        // Verify that the returned stack props is the same object that was provided
        assertThat(props.getStackProps()).isSameAs(initialStackProps);
    }
}
