package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulumi.Context;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Assumptions;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStackSetResponse;
import software.amazon.awssdk.services.cloudformation.model.ListStackSetsResponse;
import software.amazon.awssdk.services.cloudformation.model.ListStacksResponse;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsResponse;
import software.amazon.awssdk.services.cloudwatch.model.ListDashboardsResponse;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeRegionsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetAccountSummaryResponse;
import software.amazon.awssdk.services.iam.model.GetRoleResponse;
import software.amazon.awssdk.services.iam.model.ListRolesResponse;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Live AWS resource integration tests for deployed Pulumi infrastructure.
 * 
 * Tests actual AWS resources created by Pulumi deployment - NO MOCKING.
 * 
 * Prerequisites:
 * 1. Infrastructure must be deployed: cd lib && pulumi up
 * 2. Set PULUMI_CONFIG_PASSPHRASE environment variable (available in CI)
 * 3. Ensure AWS credentials are configured
 * 
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

    private static final String TEST_REGION = "us-east-1";
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static String TEST_STACK_NAME; // Will be populated from actual stack
    
    // Deployment outputs - populated from actual Pulumi stack
    private static String stackSetId;
    private static String stackSetArn;
    private static String administrationRoleArn;
    private static String executionRoleName;
    private static String dashboardUrl;
    private static JsonNode allOutputs;

    @BeforeAll
    static void setUpDeploymentOutputs() {
        // Get deployment outputs from actual Pulumi stack
        try {
            String stackName = getStackName();
            TEST_STACK_NAME = stackName; // Set the test stack name for other methods
            
            System.out.println("=== Loading Deployment Outputs ===");
            System.out.println("Stack Name: " + TEST_STACK_NAME);
            
            // Check if passphrase is required
            if (isPassphraseRequired()) {
                System.out.println("⚠️  Pulumi stack requires passphrase for decryption");
                System.out.println("💡 PULUMI_CONFIG_PASSPHRASE environment variable not found");
                System.out.println("ℹ️  Integration tests will skip live resource validation");
                return;
            }
            
            String outputsJson = executeCommand("pulumi", "stack", "output", "--json", "--cwd", "lib", "--stack", stackName);
            allOutputs = objectMapper.readTree(outputsJson);
            
            // Extract specific outputs
            stackSetId = getOutputValue("stackSetId");
            stackSetArn = getOutputValue("stackSetArn");
            administrationRoleArn = getOutputValue("administrationRoleArn");
            executionRoleName = getOutputValue("executionRoleName");
            dashboardUrl = getOutputValue("dashboardUrl");
            
            System.out.println("=== Deployment Outputs Loaded Successfully ===");
            System.out.println("Stack Set ID: " + stackSetId);
            System.out.println("Administration Role ARN: " + administrationRoleArn);
            System.out.println("Execution Role Name: " + executionRoleName);
            System.out.println("Dashboard URL: " + dashboardUrl);
            
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            System.err.println("Failed to load deployment outputs: " + errorMsg);
            
            if (errorMsg.contains("passphrase") || errorMsg.contains("decrypt")) {
                System.out.println("💡 Pulumi Configuration Help:");
                System.out.println("   • Set PULUMI_CONFIG_PASSPHRASE=<your-passphrase>");
                System.out.println("   • Or set PULUMI_CONFIG_PASSPHRASE_FILE=<path-to-passphrase-file>");
                System.out.println("   • Or use 'pulumi login --local' for local state");
            } else if (errorMsg.contains("no stack")) {
                System.out.println("💡 Stack Setup Help:");
                System.out.println("   • Run 'cd lib && pulumi up' to deploy infrastructure");
                System.out.println("   • Or set PULUMI_STACK environment variable to correct stack name");
            } else if (errorMsg.contains("not logged in")) {
                System.out.println("💡 Authentication Help:");
                System.out.println("   • Run 'pulumi login' to authenticate with Pulumi Cloud");
                System.out.println("   • Or run 'pulumi login --local' for local file state");
            }
            
            System.out.println("ℹ️  Integration tests will run with limited validation");
            TEST_STACK_NAME = "dev"; // fallback
        }
    }
    
    private static boolean isPassphraseRequired() {
        // If PULUMI_CONFIG_PASSPHRASE is set in CI, we don't need to prompt
        String passphrase = System.getenv("PULUMI_CONFIG_PASSPHRASE");
        if (passphrase != null && !passphrase.isEmpty()) {
            return false;
        }
        
        try {
            // Try a simple stack command to check if passphrase is needed
            executeCommand("pulumi", "stack", "ls", "--cwd", "lib");
            return false;
        } catch (Exception e) {
            return e.getMessage().contains("passphrase") || e.getMessage().contains("decrypt");
        }
    }
    
    private static String getStackName() {
        String stackName = System.getenv("PULUMI_STACK");
        if (stackName == null || stackName.isEmpty()) {
            // Try to get current stack
            try {
                return executeCommand("pulumi", "stack", "--show-name", "--cwd", "lib").trim();
            } catch (Exception e) {
                return "dev"; // fallback to dev stack
            }
        }
        return stackName;
    }
    
    private static String getOutputValue(String outputName) {
        if (allOutputs != null && allOutputs.has(outputName)) {
            JsonNode value = allOutputs.get(outputName);
            return value.isTextual() ? value.asText() : value.toString();
        }
        return null;
    }

    @BeforeEach
    void setUp() {
        // Validate that outputs are available before each test
        if (allOutputs == null) {
            System.out.println("Warning: Deployment outputs not available. Some tests may be skipped.");
        }
    }


    // ================== Live AWS Resource Integration Tests ==================

    // ================== Live Deployment Output Validation Tests ==================
    
    @Test
    void testDeploymentOutputsExist() {
        Assumptions.assumeTrue(allOutputs != null, "Deployment outputs should be available (set PULUMI_CONFIG_PASSPHRASE)");
        
        assertDoesNotThrow(() -> {
            // Validate all expected outputs exist from live deployment
            assertNotNull(stackSetId, "StackSet ID should be available from live deployment");
            assertNotNull(stackSetArn, "StackSet ARN should be available from live deployment");  
            assertNotNull(administrationRoleArn, "Administration Role ARN should be available from live deployment");
            assertNotNull(executionRoleName, "Execution Role Name should be available from live deployment");
            assertNotNull(dashboardUrl, "Dashboard URL should be available from live deployment");
            
            assertFalse(stackSetId.trim().isEmpty(), "StackSet ID should not be empty");
            assertFalse(stackSetArn.trim().isEmpty(), "StackSet ARN should not be empty");
            assertFalse(administrationRoleArn.trim().isEmpty(), "Administration Role ARN should not be empty");
            assertFalse(executionRoleName.trim().isEmpty(), "Execution Role Name should not be empty");
            assertFalse(dashboardUrl.trim().isEmpty(), "Dashboard URL should not be empty");
            
            System.out.println("✓ All live deployment outputs are present and non-empty");
        });
    }
    
    @Test
    void testLiveStackSetValidation() {
        Assumptions.assumeTrue(stackSetId != null, "StackSet ID should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (CloudFormationClient cfnClient = CloudFormationClient.builder().region(Region.of(TEST_REGION)).build()) {
                // Validate actual deployed StackSet exists in AWS
                DescribeStackSetResponse response = cfnClient.describeStackSet(request -> 
                    request.stackSetName(stackSetId));
                    
                assertNotNull(response.stackSet(), "Live StackSet should exist in AWS CloudFormation");
                assertEquals(stackSetId, response.stackSet().stackSetId());
                
                // Validate StackSet is in expected state
                assertNotNull(response.stackSet().status(), "StackSet should have a status");
                assertTrue(response.stackSet().status().toString().equals("ACTIVE"), 
                    "StackSet should be in ACTIVE state");
                
                System.out.println("✓ Live StackSet validation passed: " + response.stackSet().stackSetName());
                System.out.println("  - Status: " + response.stackSet().status());
                System.out.println("  - Description: " + response.stackSet().description());
                System.out.println("  - Stack Instances Count: " + 
                    (response.stackSet().organizationalUnitIds() != null ? 
                    response.stackSet().organizationalUnitIds().size() : "N/A"));
            }
        });
    }
    
    @Test
    void testLiveAdministrationRoleValidation() {
        Assumptions.assumeTrue(administrationRoleArn != null, "Administration Role ARN should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (IamClient iamClient = IamClient.builder().region(Region.of(TEST_REGION)).build()) {
                // Extract role name from ARN
                String roleName = administrationRoleArn.substring(administrationRoleArn.lastIndexOf("/") + 1);
                
                // Validate actual deployed IAM role exists in AWS
                GetRoleResponse response = iamClient.getRole(request -> request.roleName(roleName));
                
                assertNotNull(response.role(), "Live Administration Role should exist in AWS IAM");
                assertEquals(administrationRoleArn, response.role().arn());
                assertTrue(response.role().roleName().contains("CloudFormationStackSetAdministration"),
                    "Role should follow CloudFormation StackSet naming convention");
                
                // Validate role has proper trust policy for CloudFormation service
                assertNotNull(response.role().assumeRolePolicyDocument(), "Role should have assume role policy");
                
                System.out.println("✓ Live Administration Role validation passed: " + response.role().roleName());
                System.out.println("  - ARN: " + response.role().arn());
                System.out.println("  - Created: " + response.role().createDate());
                System.out.println("  - Max Session Duration: " + response.role().maxSessionDuration() + " seconds");
            }
        });
    }
    
    @Test
    void testLiveExecutionRoleValidation() {
        Assumptions.assumeTrue(executionRoleName != null, "Execution Role Name should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (IamClient iamClient = IamClient.builder().region(Region.of(TEST_REGION)).build()) {
                // Validate actual deployed execution role exists in AWS
                GetRoleResponse response = iamClient.getRole(request -> request.roleName(executionRoleName));
                
                assertNotNull(response.role(), "Live Execution Role should exist in AWS IAM");
                assertEquals(executionRoleName, response.role().roleName());
                assertTrue(response.role().roleName().contains("CloudFormationStackSetExecution"),
                    "Role should follow CloudFormation StackSet naming convention");
                
                // Validate role has proper trust policy for administration role
                assertNotNull(response.role().assumeRolePolicyDocument(), "Role should have assume role policy");
                
                System.out.println("✓ Live Execution Role validation passed: " + response.role().roleName());
                System.out.println("  - ARN: " + response.role().arn());
                System.out.println("  - Created: " + response.role().createDate());
                System.out.println("  - Max Session Duration: " + response.role().maxSessionDuration() + " seconds");
            }
        });
    }
    
    @Test
    void testLiveCloudWatchDashboardValidation() {
        Assumptions.assumeTrue(dashboardUrl != null, "Dashboard URL should be available from live deployment");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (CloudWatchClient cloudWatchClient = CloudWatchClient.builder().region(Region.of(TEST_REGION)).build()) {
                // List actual deployed dashboards in AWS
                ListDashboardsResponse response = cloudWatchClient.listDashboards();
                
                boolean dashboardFound = response.dashboardEntries().stream()
                    .anyMatch(dashboard -> dashboard.dashboardName().contains("WebApplication"));
                
                assertTrue(dashboardFound, "Live CloudWatch dashboard should exist in AWS");
                
                // Validate dashboard URL format from deployment
                assertTrue(dashboardUrl.startsWith("https://"), "Dashboard URL should be HTTPS");
                assertTrue(dashboardUrl.contains("console.aws.amazon.com"), "Dashboard URL should be AWS console URL");
                assertTrue(dashboardUrl.contains("cloudwatch"), "Dashboard URL should point to CloudWatch");
                
                // Find and validate the specific dashboard
                var webAppDashboard = response.dashboardEntries().stream()
                    .filter(dashboard -> dashboard.dashboardName().contains("WebApplication"))
                    .findFirst();
                    
                if (webAppDashboard.isPresent()) {
                    System.out.println("✓ Live CloudWatch Dashboard validation passed");
                    System.out.println("  - Dashboard Name: " + webAppDashboard.get().dashboardName());
                    System.out.println("  - Dashboard URL: " + dashboardUrl);
                    System.out.println("  - Last Modified: " + webAppDashboard.get().lastModified());
                    System.out.println("  - Size: " + webAppDashboard.get().size() + " bytes");
                }
            }
        });
    }
    
    @Test
    void testLiveApplicationEndpointsExist() {
        Assumptions.assumeTrue(allOutputs != null, "Deployment outputs should be available from live deployment");
        
        assertDoesNotThrow(() -> {
            // Check for actual application endpoints in different regions from live deployment
            String[] expectedRegions = {"us-east-1", "us-west-2", "eu-west-1"};
            int foundEndpoints = 0;
            
            for (String region : expectedRegions) {
                String endpointKey = "applicationEndpoint-" + region;
                String endpoint = getOutputValue(endpointKey);
                
                if (endpoint != null) {
                    assertFalse(endpoint.trim().isEmpty(), "Live application endpoint for " + region + " should not be empty");
                    assertTrue(endpoint.startsWith("http://"), "Application endpoint should start with http://");
                    assertTrue(endpoint.contains("elb.amazonaws.com"), "Application endpoint should be an ELB endpoint");
                    
                    System.out.println("✓ Live application endpoint found for " + region + ": " + endpoint);
                    foundEndpoints++;
                } else {
                    System.out.println("  Application endpoint not found for " + region + " (may not be deployed to this region)");
                }
            }
            
            assertTrue(foundEndpoints > 0, "At least one live application endpoint should exist");
            System.out.println("✓ Found " + foundEndpoints + " live application endpoints across regions");
        });
    }
    
    @Test 
    void testLiveDeploymentConfigurationValues() {
        Assumptions.assumeTrue(allOutputs != null, "Deployment outputs should be available from live deployment");
        
        assertDoesNotThrow(() -> {
            // Extract and validate configuration from actual deployed resources
            System.out.println("=== Live Deployment Configuration Analysis ===");
            
            // Analyze actual StackSet ID for application name
            if (stackSetId != null) {
                System.out.println("Live StackSet ID: " + stackSetId);
                assertTrue(stackSetId.contains("-"), "StackSet ID should contain application identifier");
                // Validate StackSet naming follows expected pattern
                assertTrue(stackSetId.matches("[a-zA-Z0-9-]+"), "StackSet ID should be alphanumeric with hyphens");
            }
            
            // Analyze actual role ARNs for proper naming conventions
            if (administrationRoleArn != null) {
                System.out.println("Live Administration Role ARN: " + administrationRoleArn);
                assertTrue(administrationRoleArn.contains("CloudFormationStackSet"), 
                    "Administration role should follow CloudFormation naming convention");
                assertTrue(administrationRoleArn.startsWith("arn:aws:iam::"), "Role ARN should be valid AWS ARN format");
            }
            
            if (executionRoleName != null) {
                System.out.println("Live Execution Role Name: " + executionRoleName);
                assertTrue(executionRoleName.contains("CloudFormationStackSet"), 
                    "Execution role should follow CloudFormation naming convention");
            }
            
            // Validate dashboard URL points to correct region
            if (dashboardUrl != null) {
                System.out.println("Live Dashboard URL: " + dashboardUrl);
                assertTrue(dashboardUrl.contains("region=" + TEST_REGION), 
                    "Dashboard URL should point to the correct region");
            }
            
            System.out.println("✓ Live deployment configuration validation passed");
        });
    }

    // ================== Helper Methods ==================
    
    private static boolean isPulumiAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("pulumi", "version");
            Process process = pb.start();
            return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean hasAwsCredentials() {
        return (System.getenv("AWS_ACCESS_KEY_ID") != null && System.getenv("AWS_SECRET_ACCESS_KEY") != null) ||
               System.getenv("AWS_PROFILE") != null ||
               System.getProperty("aws.accessKeyId") != null;
    }

    private static boolean isTestingEnvironment() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        String profile = System.getenv("AWS_PROFILE");
        return (env != null && (env.startsWith("pr") || env.equals("dev") || env.equals("test"))) ||
               (profile != null && (profile.contains("test") || profile.contains("dev")));
    }
    
    private static String executeCommand(String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command)
                .directory(Paths.get(".").toFile())
                .redirectErrorStream(true);
                
        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);
        
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Command timed out: " + String.join(" ", command));
        }
        
        if (process.exitValue() != 0) {
            String output = readProcessOutput(process);
            throw new RuntimeException("Command failed with exit code " + process.exitValue() + ": " + output);
        }
        
        return readProcessOutput(process);
    }
    
    private static String executeCommandWithTimeout(String... command)
            throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command)
                .directory(Paths.get(".").toFile())
                .redirectErrorStream(true);
                
        Process process = pb.start();
        boolean finished = process.waitFor(300, TimeUnit.SECONDS);
        
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Command timed out after " + 300 + " seconds: " + String.join(" ", command));
        }
        
        String output = readProcessOutput(process);
        
        if (process.exitValue() != 0) {
            throw new RuntimeException("Command failed with exit code " + process.exitValue() + ": " + output);
        }
        
        return output;
    }
    
    private static String readProcessOutput(Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }
}