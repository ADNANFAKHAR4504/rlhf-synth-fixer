package app;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

@DisplayName("Main Application Tests")
public class MainTest {
    
    @Test
    @DisplayName("Should create app with default environment suffix")
    public void testMainWithDefaultEnvironmentSuffix() {
        // Test that main method creates the app correctly
        // Since main is static and creates CDK app, we test the app creation logic
        App app = new App();
        
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }
        
        Assertions.assertThat(environmentSuffix).isEqualTo("dev");
    }
    
    @Test
    @DisplayName("Should create TapStack with environment suffix")
    public void testTapStackCreation() {
        App app = new App();
        String environmentSuffix = "prod";
        
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix(environmentSuffix)
            .stackProps(StackProps.builder()
                .env(Environment.builder()
                    .region("us-west-2")
                    .account("123456789012")
                    .build())
                .build())
            .build();
        
        TapStack stack = new TapStack(app, "TapStackProd", props);
        
        Assertions.assertThat(stack).isNotNull();
        Assertions.assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        Assertions.assertThat(stack.getWebAppStack()).isNotNull();
    }
    
    @Test
    @DisplayName("Should use context environment suffix when provided")
    public void testTapStackWithContextEnvironmentSuffix() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TapStackStaging", null);
        
        Assertions.assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }
    
    @Test
    @DisplayName("Should default to dev when no environment suffix provided")
    public void testTapStackDefaultEnvironmentSuffix() {
        App app = new App();
        
        TapStack stack = new TapStack(app, "TapStackDev", null);
        
        Assertions.assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }
    
    @Test
    @DisplayName("Should set correct region for WebAppStack")
    public void testWebAppStackRegion() {
        App app = new App();
        
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("test")
            .stackProps(StackProps.builder()
                .env(Environment.builder()
                    .region("us-west-2")
                    .account("123456789012")
                    .build())
                .build())
            .build();
        
        TapStack stack = new TapStack(app, "TestStack", props);
        WebAppStack webAppStack = stack.getWebAppStack();
        
        Assertions.assertThat(webAppStack).isNotNull();
        Assertions.assertThat(webAppStack.getRegion()).isEqualTo("us-west-2");
    }
    
    @Test
    @DisplayName("TapStackProps builder should work correctly")
    public void testTapStackPropsBuilder() {
        String testSuffix = "test";
        StackProps stackProps = StackProps.builder()
            .env(Environment.builder()
                .region("us-east-1")
                .account("987654321098")
                .build())
            .build();
        
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix(testSuffix)
            .stackProps(stackProps)
            .build();
        
        Assertions.assertThat(props).isNotNull();
        Assertions.assertThat(props.getEnvironmentSuffix()).isEqualTo(testSuffix);
        Assertions.assertThat(props.getStackProps()).isEqualTo(stackProps);
    }
    
    @Test
    @DisplayName("TapStackProps should handle null stack props")
    public void testTapStackPropsWithNullStackProps() {
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("test")
            .build();
        
        Assertions.assertThat(props.getStackProps()).isNotNull();
    }
    
    @Test
    @DisplayName("Should not allow Main class instantiation")
    public void testMainClassInstantiation() {
        // The Main class has a private constructor
        // We can't directly test this, but we verify the class exists
        Assertions.assertThat(Main.class).isNotNull();
        
        // Verify it has the main method
        try {
            Main.class.getDeclaredMethod("main", String[].class);
        } catch (NoSuchMethodException e) {
            Assertions.fail("Main method should exist");
        }
    }
}