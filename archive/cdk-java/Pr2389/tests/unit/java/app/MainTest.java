package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;
import java.util.Arrays;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test that the CI/CD pipeline nested stack is created.
     */
    @Test
    public void testCiCdPipelineStackCreated() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify that the nested CiCdPipelineStack was created
        template.resourceCountIs("AWS::CloudFormation::Stack", 1);
        
        // Verify nested stack properties
        template.hasResourceProperties("AWS::CloudFormation::Stack", Map.of(
                "TemplateURL", Match.anyValue()
        ));
    }

    /**
     * Test that TapStack creates the expected stack structure.
     */
    @Test
    public void testStackStructure() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify the main stack contains exactly one nested stack (CiCdPipelineStack)
        template.resourceCountIs("AWS::CloudFormation::Stack", 1);
        
        // Verify stack was created successfully
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the main stack contains nested CI/CD resources.
     * The actual CI/CD resources are in the nested stack, not the main stack.
     */
    @Test
    public void testNestedStackArchitecture() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify that main stack only contains the nested stack, not individual resources
        template.resourceCountIs("AWS::CloudFormation::Stack", 1);
        
        // The main stack template should NOT contain individual CI/CD resources
        // as they are encapsulated in the nested stack
        template.resourceCountIs("AWS::Events::Rule", 0);
        template.resourceCountIs("AWS::CodePipeline::Pipeline", 0);
        template.resourceCountIs("AWS::CodeBuild::Project", 0);
        template.resourceCountIs("AWS::CodeDeploy::Application", 0);
        template.resourceCountIs("AWS::S3::Bucket", 0);
        template.resourceCountIs("AWS::SNS::Topic", 0);
    }

    /**
     * Test that nested stack has proper template URL configuration.
     */
    @Test
    public void testNestedStackTemplateUrl() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify nested stack has template URL
        template.hasResourceProperties("AWS::CloudFormation::Stack", Map.of(
                "TemplateURL", Match.anyValue()
        ));
        
        // Verify we have exactly one nested stack
        template.resourceCountIs("AWS::CloudFormation::Stack", 1);
    }

    /**
     * Test that nested stack has proper deletion policies for development.
     */
    @Test
    public void testNestedStackDeletionPolicies() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify nested stack has appropriate deletion policies for dev environment
        // Note: deletion policies are at the resource level, not in Properties
        template.hasResource("AWS::CloudFormation::Stack", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete",
                "UpdateReplacePolicy", "Delete"
        )));
    }

    /**
     * Test that template has proper CDK bootstrap requirements.
     */
    @Test
    public void testCdkBootstrapRequirements() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // The template should reference CDK bootstrap resources
        template.hasParameter("BootstrapVersion", Match.anyValue());
        
        // Verify the stack was created successfully
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test main stack resource composition and organization.
     */
    @Test
    public void testMainStackComposition() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Main stack should have minimal resources - just the nested stack
        // Should have exactly one nested stack and no individual CI/CD resources
        template.resourceCountIs("AWS::CloudFormation::Stack", 1);
        
        // Verify clean separation - no individual CI/CD resources in main stack
        int stackResources = template.findResources("AWS::CloudFormation::Stack").size();
        assertThat(stackResources).isEqualTo(1);
        
        // Verify the stack contains the CI/CD pipeline as a nested stack
        template.hasResourceProperties("AWS::CloudFormation::Stack", Map.of(
                "TemplateURL", Match.anyValue()
        ));
    }

    /**
     * Test template parameter configuration and validation.
     */
    @Test
    public void testTemplateParameters() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify bootstrap version parameter exists and has correct configuration
        template.hasParameter("BootstrapVersion", Match.objectLike(Map.of(
                "Type", "AWS::SSM::Parameter::Value<String>",
                "Default", "/cdk-bootstrap/hnb659fds/version"
        )));
        
        // Main stack should be minimal - parameters should be for CDK bootstrap only
        Map<String, Object> parameters = template.toJSON();
        @SuppressWarnings("unchecked")
        Map<String, Object> parametersMap = (Map<String, Object>) parameters.get("Parameters");
        
        // Should only have the bootstrap version parameter
        assertThat(parametersMap).hasSize(1);
        assertThat(parametersMap).containsKey("BootstrapVersion");
    }
}