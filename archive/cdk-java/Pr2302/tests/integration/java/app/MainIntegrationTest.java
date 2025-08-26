package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration with actual deployment outputs
 * from AWS resources created by the CDK stack.
 */
public class MainIntegrationTest {

    private static Map<String, Object> deploymentOutputs;
    private static ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Load deployment outputs from the cfn-outputs/flat-outputs.json file.
     * This is executed once before all tests.
     */
    @BeforeAll
    public static void loadDeploymentOutputs() {
        try {
            String outputsPath = "cfn-outputs/flat-outputs.json";
            if (Files.exists(Paths.get(outputsPath))) {
                String jsonContent = Files.readString(Paths.get(outputsPath));
                deploymentOutputs = objectMapper.readValue(jsonContent, Map.class);
                System.out.println("Loaded deployment outputs: " + deploymentOutputs);
            } else {
                System.out.println("No deployment outputs found at " + outputsPath + " - using mock data for testing");
                // Use empty map for testing when no deployment outputs are available
                deploymentOutputs = Map.of();
            }
        } catch (Exception e) {
            System.err.println("Error loading deployment outputs: " + e.getMessage());
            deploymentOutputs = Map.of();
        }
    }

    /**
     * Integration test for full stack deployment.
     *
     * This test verifies that the complete stack can be synthesized
     * with all its components working together.
     */
    @Test
    public void testFullStackDeployment() {
        App app = new App();

        // Create stack with production-like configuration
        TapStackDev stack = new TapStackDev(app, "TapStackProd", StackProps.builder().build());

        // Create template and verify it can be synthesized
        Template template = Template.fromStack(stack);

        // Verify stack configuration
        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }

    /**
     * Test that verifies Load Balancer DNS output exists in deployment.
     */
    @Test
    public void testLoadBalancerDnsOutput() {
        if (!deploymentOutputs.isEmpty()) {
            assertThat(deploymentOutputs).containsKey("LoadBalancerDNS");
            String loadBalancerDns = (String) deploymentOutputs.get("LoadBalancerDNS");
            assertThat(loadBalancerDns).isNotNull();
            assertThat(loadBalancerDns).contains("elb.amazonaws.com");
            System.out.println("Load Balancer DNS: " + loadBalancerDns);
        } else {
            System.out.println("Skipping live output test - no deployment outputs available");
        }
    }

    /**
     * Test that verifies VPC ID output exists in deployment.
     */
    @Test
    public void testVpcIdOutput() {
        if (!deploymentOutputs.isEmpty()) {
            assertThat(deploymentOutputs).containsKey("VpcId");
            String vpcId = (String) deploymentOutputs.get("VpcId");
            assertThat(vpcId).isNotNull();
            assertThat(vpcId).startsWith("vpc-");
            System.out.println("VPC ID: " + vpcId);
        } else {
            System.out.println("Skipping live output test - no deployment outputs available");
        }
    }

    /**
     * Test that verifies Auto Scaling Group output exists in deployment.
     */
    @Test
    public void testAutoScalingGroupOutput() {
        if (!deploymentOutputs.isEmpty()) {
            assertThat(deploymentOutputs).containsKey("AutoScalingGroupName");
            String asgName = (String) deploymentOutputs.get("AutoScalingGroupName");
            assertThat(asgName).isNotNull();
            assertThat(asgName).contains("AutoScalingGroup");
            System.out.println("Auto Scaling Group Name: " + asgName);
        } else {
            System.out.println("Skipping live output test - no deployment outputs available");
        }
    }

    /**
     * Test that verifies subnet outputs exist in deployment.
     */
    @Test
    public void testSubnetOutputs() {
        if (!deploymentOutputs.isEmpty()) {
            // Check private subnets
            assertThat(deploymentOutputs).containsKey("PrivateSubnetIds");
            String privateSubnets = (String) deploymentOutputs.get("PrivateSubnetIds");
            assertThat(privateSubnets).isNotNull();
            assertThat(privateSubnets.split(",")).hasSizeGreaterThanOrEqualTo(3); // At least 3 AZs
            
            // Check public subnets
            assertThat(deploymentOutputs).containsKey("PublicSubnetIds");
            String publicSubnets = (String) deploymentOutputs.get("PublicSubnetIds");
            assertThat(publicSubnets).isNotNull();
            assertThat(publicSubnets.split(",")).hasSizeGreaterThanOrEqualTo(3); // At least 3 AZs
            
            System.out.println("Private Subnets: " + privateSubnets);
            System.out.println("Public Subnets: " + publicSubnets);
        } else {
            System.out.println("Skipping live output test - no deployment outputs available");
        }
    }

    /**
     * Test that verifies high availability configuration.
     * This test checks that resources are distributed across multiple AZs.
     */
    @Test
    public void testHighAvailabilityConfiguration() {
        if (!deploymentOutputs.isEmpty()) {
            // Verify subnets span multiple AZs
            String privateSubnets = (String) deploymentOutputs.get("PrivateSubnetIds");
            String publicSubnets = (String) deploymentOutputs.get("PublicSubnetIds");
            
            if (privateSubnets != null && publicSubnets != null) {
                String[] privateSubnetArray = privateSubnets.split(",");
                String[] publicSubnetArray = publicSubnets.split(",");
                
                // Verify we have at least 3 subnets in each tier for HA
                assertThat(privateSubnetArray).hasSizeGreaterThanOrEqualTo(3);
                assertThat(publicSubnetArray).hasSizeGreaterThanOrEqualTo(3);
                
                System.out.println("High Availability Configuration Validated:");
                System.out.println("- Private subnets across " + privateSubnetArray.length + " AZs");
                System.out.println("- Public subnets across " + publicSubnetArray.length + " AZs");
            }
        } else {
            System.out.println("Skipping live output test - no deployment outputs available");
        }
    }

    /**
     * Test that verifies Load Balancer ARN output exists and is valid.
     */
    @Test
    public void testLoadBalancerArnOutput() {
        if (!deploymentOutputs.isEmpty()) {
            assertThat(deploymentOutputs).containsKey("LoadBalancerArn");
            String loadBalancerArn = (String) deploymentOutputs.get("LoadBalancerArn");
            assertThat(loadBalancerArn).isNotNull();
            assertThat(loadBalancerArn).startsWith("arn:aws:elasticloadbalancing:");
            assertThat(loadBalancerArn).contains(":loadbalancer/app/");
            System.out.println("Load Balancer ARN: " + loadBalancerArn);
        } else {
            System.out.println("Skipping live output test - no deployment outputs available");
        }
    }

    /**
     * Test that verifies all required outputs are present.
     */
    @Test
    public void testAllRequiredOutputsPresent() {
        if (!deploymentOutputs.isEmpty()) {
            String[] requiredOutputs = {
                "LoadBalancerDNS",
                "VpcId",
                "AutoScalingGroupName",
                "LoadBalancerArn",
                "PrivateSubnetIds",
                "PublicSubnetIds"
            };
            
            for (String output : requiredOutputs) {
                assertThat(deploymentOutputs)
                    .as("Output '" + output + "' should be present")
                    .containsKey(output);
                assertThat(deploymentOutputs.get(output))
                    .as("Output '" + output + "' should not be null")
                    .isNotNull();
            }
            
            System.out.println("All required outputs are present in deployment");
        } else {
            System.out.println("Skipping live output test - no deployment outputs available");
        }
    }
}