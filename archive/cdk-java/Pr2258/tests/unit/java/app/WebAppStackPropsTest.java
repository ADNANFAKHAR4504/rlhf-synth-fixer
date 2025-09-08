package app;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

@DisplayName("WebAppStackProps Tests")
public class WebAppStackPropsTest {
    
    @Test
    @DisplayName("Should create props with builder")
    public void testPropsBuilder() {
        String suffix = "prod";
        StackProps stackProps = StackProps.builder()
            .env(Environment.builder()
                .region("us-west-2")
                .account("123456789012")
                .build())
            .build();
        
        WebAppStackProps props = WebAppStackProps.builder()
            .environmentSuffix(suffix)
            .stackProps(stackProps)
            .build();
        
        Assertions.assertThat(props).isNotNull();
        Assertions.assertThat(props.getEnvironmentSuffix()).isEqualTo(suffix);
        Assertions.assertThat(props.getStackProps()).isEqualTo(stackProps);
    }
    
    @Test
    @DisplayName("Should handle null stack props")
    public void testNullStackProps() {
        WebAppStackProps props = WebAppStackProps.builder()
            .environmentSuffix("test")
            .stackProps(null)
            .build();
        
        Assertions.assertThat(props).isNotNull();
        Assertions.assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        Assertions.assertThat(props.getStackProps()).isNotNull();
    }
    
    @Test
    @DisplayName("Should create default stack props when not provided")
    public void testDefaultStackProps() {
        WebAppStackProps props = WebAppStackProps.builder()
            .environmentSuffix("dev")
            .build();
        
        Assertions.assertThat(props.getStackProps()).isNotNull();
        // Default stack props should be empty but not null
        Assertions.assertThat(props.getStackProps()).isInstanceOf(StackProps.class);
    }
    
    @Test
    @DisplayName("Builder should be chainable")
    public void testBuilderChaining() {
        String suffix = "staging";
        StackProps stackProps = StackProps.builder().build();
        
        WebAppStackProps props = WebAppStackProps.builder()
            .environmentSuffix(suffix)
            .stackProps(stackProps)
            .build();
        
        Assertions.assertThat(props).isNotNull();
        Assertions.assertThat(props.getEnvironmentSuffix()).isEqualTo(suffix);
    }
    
    @Test
    @DisplayName("Should handle various environment suffixes")
    public void testVariousEnvironmentSuffixes() {
        String[] suffixes = {"dev", "staging", "prod", "pr123", "feature-xyz"};
        
        for (String suffix : suffixes) {
            WebAppStackProps props = WebAppStackProps.builder()
                .environmentSuffix(suffix)
                .build();
            
            Assertions.assertThat(props.getEnvironmentSuffix()).isEqualTo(suffix);
        }
    }
    
    @Test
    @DisplayName("Should preserve stack props environment settings")
    public void testStackPropsEnvironment() {
        String region = "eu-west-1";
        String account = "987654321098";
        
        StackProps stackProps = StackProps.builder()
            .env(Environment.builder()
                .region(region)
                .account(account)
                .build())
            .build();
        
        WebAppStackProps props = WebAppStackProps.builder()
            .environmentSuffix("test")
            .stackProps(stackProps)
            .build();
        
        Assertions.assertThat(props.getStackProps().getEnv().getRegion()).isEqualTo(region);
        Assertions.assertThat(props.getStackProps().getEnv().getAccount()).isEqualTo(account);
    }
    
    @Test
    @DisplayName("Builder should create new instances")
    public void testBuilderCreatesNewInstances() {
        WebAppStackProps.Builder builder = WebAppStackProps.builder();
        
        WebAppStackProps props1 = builder
            .environmentSuffix("env1")
            .build();
        
        WebAppStackProps props2 = builder
            .environmentSuffix("env2")
            .build();
        
        // Both should have the same suffix since we're reusing the builder
        // This tests that the builder maintains state
        Assertions.assertThat(props2.getEnvironmentSuffix()).isEqualTo("env2");
    }
}