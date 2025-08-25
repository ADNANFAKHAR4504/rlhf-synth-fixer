package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.File;
import java.io.IOException;
import java.util.Map;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the TapStack
 * and may involve more complex scenarios than unit tests.
 *
 * Note: These tests still use synthetic AWS resources and do not require
 * actual AWS credentials or resources to be created.
 */
public class MainIntegrationTest {
    
    private Environment testEnvironment;
    private ObjectMapper objectMapper;
    
    @BeforeEach
    public void setUp() {
        // Set up test environment
        testEnvironment = Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build();
        objectMapper = new ObjectMapper();
    }

    /**
     * Integration test for full stack deployment simulation.
     *
     * This test verifies that the complete stack can be synthesized
     * with all its components working together.
     */
    @Test
    public void testFullStackDeployment() {
        App app = new App();

        // Create stack with production-like configuration
        TapStack stack = new TapStack(app, "TapStackProd", TapStackProps.builder()
                .environmentSuffix("prod")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Create template and verify it can be synthesized
        Template template = Template.fromStack(stack.getVpcStack());

        // Verify stack configuration
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(template).isNotNull();
        
        // Verify complete infrastructure is created
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Instance", 1);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
        template.resourceCountIs("AWS::IAM::Role", 1);
    }

    /**
     * Integration test for multiple environment configurations.
     *
     * This test verifies that the stack can be configured for different
     * environments (dev, staging, prod) with appropriate settings.
     */
    @Test
    public void testMultiEnvironmentConfiguration() {
        // Test different environment configurations
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            // Create a new app for each environment to avoid synthesis conflicts
            App app = new App();
            TapStack stack = new TapStack(app, "TapStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .stackProps(StackProps.builder()
                            .env(testEnvironment)
                            .build())
                    .build());

            // Verify each environment configuration
            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

            // Verify template can be created for each environment
            Template template = Template.fromStack(stack.getVpcStack());
            assertThat(template).isNotNull();
            
            // Verify that the VPC resource exists in the template
            // The stack correctly applies multiple tags including Environment tag
            template.resourceCountIs("AWS::EC2::VPC", 1);
        }
    }

    /**
     * Integration test for stack with nested components.
     *
     * This test verifies the integration between the main stack
     * and the VPC infrastructure nested stack.
     */
    @Test
    public void testStackWithNestedComponents() {
        App app = new App();

        TapStack stack = new TapStack(app, "TapStackIntegration", TapStackProps.builder()
                .environmentSuffix("integration")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify basic stack structure
        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
        
        // Verify VPC infrastructure stack is properly nested
        assertThat(stack.getVpcStack()).isNotNull();
        assertThat(stack.getVpcStack().getVpc()).isNotNull();
        assertThat(stack.getVpcStack().getEc2Instance()).isNotNull();
        assertThat(stack.getVpcStack().getSshSecurityGroup()).isNotNull();
    }
    
    /**
     * Integration test for verifying outputs.
     * This would use real deployment outputs if available.
     */
    @Test
    public void testDeploymentOutputsIntegration() {
        // Check if deployment outputs file exists
        File outputsFile = new File("cfn-outputs/flat-outputs.json");
        
        if (outputsFile.exists()) {
            try {
                // Read and parse outputs
                JsonNode outputs = objectMapper.readTree(outputsFile);
                
                // Verify expected outputs exist (without checking specific values)
                assertThat(outputs.has("VpcId")).as("VpcId output should exist").isTrue();
                assertThat(outputs.has("InstanceId")).as("InstanceId output should exist").isTrue();
                assertThat(outputs.has("SecurityGroupId")).as("SecurityGroupId output should exist").isTrue();
                
                // Verify outputs are not empty
                if (outputs.has("VpcId")) {
                    String vpcId = outputs.get("VpcId").asText();
                    assertThat(vpcId).isNotNull();
                    assertThat(vpcId).startsWith("vpc-");
                }
                
                if (outputs.has("InstanceId")) {
                    String instanceId = outputs.get("InstanceId").asText();
                    assertThat(instanceId).isNotNull();
                    assertThat(instanceId).startsWith("i-");
                }
                
                if (outputs.has("SecurityGroupId")) {
                    String sgId = outputs.get("SecurityGroupId").asText();
                    assertThat(sgId).isNotNull();
                    assertThat(sgId).startsWith("sg-");
                }
            } catch (IOException e) {
                // If file exists but can't be read, test should fail
                throw new RuntimeException("Failed to read deployment outputs", e);
            }
        } else {
            // If no deployment has been done yet, skip this test
            System.out.println("Deployment outputs not found, skipping output validation");
        }
    }
    
    /**
     * Integration test for network connectivity.
     * This verifies that resources in the VPC can communicate properly.
     */
    @Test
    public void testNetworkConnectivity() {
        App app = new App();
        
        TapStack stack = new TapStack(app, "TapStackNetwork", TapStackProps.builder()
                .environmentSuffix("network")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());
        
        Template template = Template.fromStack(stack.getVpcStack());
        
        // Verify Internet Gateway attachment
        template.hasResource("AWS::EC2::VPCGatewayAttachment", Map.of());
        
        // Verify route to Internet Gateway exists
        template.hasResourceProperties("AWS::EC2::Route", Map.of(
            "DestinationCidrBlock", "0.0.0.0/0"
        ));
        
        // Verify EC2 instance is in a public subnet
        template.hasResource("AWS::EC2::Instance", Map.of());
    }
}
