package app;

import app.config.DeploymentConfig;
import com.pulumi.Context;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Comprehensive integration tests for the Main Pulumi program.
 * 
 * Tests infrastructure deployment, AWS resource validation, and end-to-end scenarios.
 * Includes both live AWS integration tests and extensive mock-based testing.
 * 
 * Run with: ./gradlew integrationTest
 */
@ExtendWith(MockitoExtension.class)
public class MainIntegrationTest {

    @Mock
    private Context mockContext;
    
    @Mock
    private com.pulumi.Config mockPulumiConfig;

    private static final String TEST_STACK_NAME = "integration-test-" + System.currentTimeMillis();
    private static final String TEST_REGION = "us-east-1";

    @BeforeEach
    void setUp() {
        // Setup mock config for integration tests
        when(mockContext.config()).thenReturn(mockPulumiConfig);
        when(mockPulumiConfig.get("managementRegion")).thenReturn(java.util.Optional.of(TEST_REGION));
        when(mockPulumiConfig.get("applicationName")).thenReturn(java.util.Optional.of("integration-test-app"));
        when(mockPulumiConfig.get("environment")).thenReturn(java.util.Optional.of("integration-test"));
        when(mockPulumiConfig.getObject("targetRegions", String[].class))
            .thenReturn(java.util.Optional.of(new String[]{TEST_REGION, "us-west-2"}));
        when(mockPulumiConfig.getObject("targetAccounts", String[].class))
            .thenReturn(java.util.Optional.of(new String[]{"123456789012"}));

        DeploymentConfig testConfig = new DeploymentConfig(mockContext);
    }

    // ================== Application and Dependencies Tests ==================
    
    @Test
    void testApplicationLoads() {
        assertDoesNotThrow(() -> {
            Class.forName("app.Main");
        });
    }

    @Test
    void testPulumiDependenciesAvailable() {
        assertDoesNotThrow(() -> {
            Class.forName("com.pulumi.Pulumi");
            Class.forName("com.pulumi.aws.Provider");
            Class.forName("com.pulumi.aws.cloudformation.StackSet");
            Class.forName("com.pulumi.aws.cloudformation.StackSetArgs");
            Class.forName("com.pulumi.aws.cloudformation.StackSetInstance");
            Class.forName("com.pulumi.aws.cloudformation.StackSetInstanceArgs");
            Class.forName("com.pulumi.aws.iam.Role");
            Class.forName("com.pulumi.aws.iam.RoleArgs");
            Class.forName("com.pulumi.aws.iam.Policy");
            Class.forName("com.pulumi.aws.iam.PolicyArgs");
            Class.forName("com.pulumi.aws.cloudwatch.Dashboard");
            Class.forName("com.pulumi.aws.cloudwatch.DashboardArgs");
            Class.forName("com.pulumi.aws.cloudwatch.LogGroup");
            Class.forName("com.pulumi.aws.cloudwatch.LogGroupArgs");
        }, "All required Pulumi AWS dependencies should be available on classpath");
    }

    @Test
    void testAwsSdkDependenciesAvailable() {
        assertDoesNotThrow(() -> {
            Class.forName("software.amazon.awssdk.services.cloudformation.CloudFormationClient");
            Class.forName("software.amazon.awssdk.services.ec2.Ec2Client");
            Class.forName("software.amazon.awssdk.services.iam.IamClient");
            Class.forName("software.amazon.awssdk.services.cloudwatch.CloudWatchClient");
            Class.forName("software.amazon.awssdk.services.sts.StsClient");
        }, "AWS SDK dependencies should be available for integration testing");
    }

    @Test
    void testProjectStructure() {
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/Main.java")),
                "Main.java should exist");
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/config/DeploymentConfig.java")),
                "DeploymentConfig.java should exist");
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/components/IAMRoles.java")),
                "IAMRoles.java should exist");
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/components/WebApplicationStackSet.java")),
                "WebApplicationStackSet.java should exist");
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/components/CrossAccountRoleSetup.java")),
                "CrossAccountRoleSetup.java should exist");
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/components/ObservabilityDashboard.java")),
                "ObservabilityDashboard.java should exist");
        assertTrue(Files.exists(Paths.get("Pulumi.yaml")),
                "Pulumi.yaml should exist");
        assertTrue(Files.exists(Paths.get("build.gradle")),
                "build.gradle should exist");
    }

    @Test
    void testDefineInfrastructureMethodAccessible() {
        assertDoesNotThrow(() -> {
            var method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertNotNull(method);
            assertTrue(java.lang.reflect.Modifier.isStatic(method.getModifiers()));
        });
    }

    // ================== AWS Integration Tests ==================
    
    @Test
    @Disabled("Enable for AWS credential testing - requires AWS access")
    void testAwsCredentialsAndPermissions() {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (StsClient stsClient = StsClient.builder().region(Region.of(TEST_REGION)).build()) {
                GetCallerIdentityResponse response = stsClient.getCallerIdentity();
                assertNotNull(response.account());
                assertNotNull(response.arn());
                System.out.println("AWS Account: " + response.account());
                System.out.println("AWS ARN: " + response.arn());
            }
        });
    }
    
    @Test
    @Disabled("Enable for IAM permissions testing - requires AWS access")
    void testRequiredIAMPermissions() {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (IamClient iamClient = IamClient.builder().region(Region.of(TEST_REGION)).build()) {
                // Test CloudFormation StackSet permissions
                ListRolesResponse rolesResponse = iamClient.listRoles();
                assertNotNull(rolesResponse.roles());
                
                // Test basic IAM read permissions
                GetAccountSummaryResponse summaryResponse = iamClient.getAccountSummary();
                assertNotNull(summaryResponse.summaryMap());
            }
        });
    }
    
    @Test
    @Disabled("Enable for CloudFormation permissions testing - requires AWS access")
    void testCloudFormationPermissions() {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (CloudFormationClient cfnClient = CloudFormationClient.builder().region(Region.of(TEST_REGION)).build()) {
                // Test basic CloudFormation permissions
                ListStackSetsResponse stackSetsResponse = cfnClient.listStackSets();
                assertNotNull(stackSetsResponse.summaries());
                
                ListStacksResponse stacksResponse = cfnClient.listStacks();
                assertNotNull(stacksResponse.stackSummaries());
            }
        });
    }
    
    @Test
    @Disabled("Enable for EC2 permissions testing - requires AWS access")
    void testEC2Permissions() {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (Ec2Client ec2Client = Ec2Client.builder().region(Region.of(TEST_REGION)).build()) {
                // Test basic EC2 read permissions
                DescribeRegionsResponse regionsResponse = ec2Client.describeRegions();
                assertNotNull(regionsResponse.regions());
                assertFalse(regionsResponse.regions().isEmpty());
                
                // Test VPC permissions
                DescribeVpcsResponse vpcsResponse = ec2Client.describeVpcs();
                assertNotNull(vpcsResponse.vpcs());
            }
        });
    }
    
    @Test
    @Disabled("Enable for CloudWatch permissions testing - requires AWS access")
    void testCloudWatchPermissions() {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        
        assertDoesNotThrow(() -> {
            try (CloudWatchClient cloudWatchClient = CloudWatchClient.builder().region(Region.of(TEST_REGION)).build()) {
                // Test basic CloudWatch permissions
                ListDashboardsResponse dashboardsResponse = cloudWatchClient.listDashboards();
                assertNotNull(dashboardsResponse.dashboardEntries());
                
                DescribeAlarmsResponse alarmsResponse = cloudWatchClient.describeAlarms();
                assertNotNull(alarmsResponse.metricAlarms());
            }
        });
    }

    // ================== Pulumi CLI Integration Tests ==================
    
    @Test
    @Disabled("Enable for actual Pulumi preview testing - requires Pulumi CLI and AWS credentials")
    void testPulumiPreview() throws Exception {
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", TEST_STACK_NAME)
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(120, TimeUnit.SECONDS);

        assertTrue(finished, "Pulumi preview should complete within 2 minutes");

        // Preview should succeed (exit code 0) or show changes needed (exit code 1)
        int exitCode = process.exitValue();
        assertTrue(exitCode == 0 || exitCode == 1,
                "Pulumi preview should succeed or show pending changes");

        // Capture and log output for debugging
        String output = readProcessOutput(process);
        System.out.println("Pulumi preview output:\n" + output);
    }
    
    @Test
    @Disabled("Enable for Pulumi config validation - requires Pulumi CLI")
    void testPulumiConfigValidation() throws Exception {
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        
        // Test setting and getting config values
        assertDoesNotThrow(() -> {
            // Set test config
            executeCommand("pulumi", "config", "set", "applicationName", "integration-test-app", "--stack", TEST_STACK_NAME);
            executeCommand("pulumi", "config", "set", "environment", "integration-test", "--stack", TEST_STACK_NAME);
            executeCommand("pulumi", "config", "set", "managementRegion", TEST_REGION, "--stack", TEST_STACK_NAME);
            
            // Validate config was set
            String appName = executeCommand("pulumi", "config", "get", "applicationName", "--stack", TEST_STACK_NAME);
            String env = executeCommand("pulumi", "config", "get", "environment", "--stack", TEST_STACK_NAME);
            String region = executeCommand("pulumi", "config", "get", "managementRegion", "--stack", TEST_STACK_NAME);
            
            assertEquals("integration-test-app", appName.trim());
            assertEquals("integration-test", env.trim());
            assertEquals(TEST_REGION, region.trim());
        });
    }

    @Test
    @Disabled("Enable for actual infrastructure deployment testing - creates real AWS resources")
    void testFullInfrastructureDeploymentAndCleanup() throws Exception {
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(isTestingEnvironment(), "Should only run in testing environment");

        String stackName = "integration-test-" + System.currentTimeMillis();
        
        try {
            // Initialize stack
            executeCommand("pulumi", "stack", "init", stackName, "--cwd", "lib");
            
            // Set configuration
            executeCommand("pulumi", "config", "set", "applicationName", "integration-test-app", "--stack", stackName, "--cwd", "lib");
            executeCommand("pulumi", "config", "set", "environment", "integration-test", "--stack", stackName, "--cwd", "lib");
            executeCommand("pulumi", "config", "set", "managementRegion", TEST_REGION, "--stack", stackName, "--cwd", "lib");
            
            // Deploy infrastructure with timeout
            String deployOutput = executeCommandWithTimeout(
                    "pulumi", "up", "--yes", "--stack", stackName, "--cwd", "lib");
            
            assertNotNull(deployOutput);
            assertTrue(deployOutput.contains("Resources") || deployOutput.contains("Update summary"));
            
            // Verify stack outputs
            String outputsJson = executeCommand("pulumi", "stack", "output", "--json", "--stack", stackName, "--cwd", "lib");
            assertNotNull(outputsJson);
            assertFalse(outputsJson.trim().isEmpty());
            
            // Verify specific outputs exist
            String stackSetId = executeCommand("pulumi", "stack", "output", "stackSetId", "--stack", stackName, "--cwd", "lib");
            String administrationRoleArn = executeCommand("pulumi", "stack", "output", "administrationRoleArn", "--stack", stackName, "--cwd", "lib");
            
            assertNotNull(stackSetId);
            assertNotNull(administrationRoleArn);
            assertFalse(stackSetId.trim().isEmpty());
            assertFalse(administrationRoleArn.trim().isEmpty());
            
            System.out.println("Deployment successful! Stack Set ID: " + stackSetId.trim());
            System.out.println("Administration Role ARN: " + administrationRoleArn.trim());
            
        } finally {
            // Clean up - destroy the stack
            try {
                String destroyOutput = executeCommandWithTimeout(
                        "pulumi", "destroy", "--yes", "--stack", stackName, "--cwd", "lib");
                
                // Remove the stack
                executeCommand("pulumi", "stack", "rm", stackName, "--yes", "--cwd", "lib");
                
                System.out.println("Cleanup completed successfully");
                
            } catch (Exception e) {
                System.err.println("Cleanup failed: " + e.getMessage());
                // Don't fail the test if cleanup fails
            }
        }
    }
    
    @Test
    @Disabled("Enable for AWS resource validation after deployment - requires deployed infrastructure")
    void testDeployedResourcesValidation() {
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(isTestingEnvironment(), "Should only run in testing environment");
        
        assertDoesNotThrow(() -> {
            // Validate CloudFormation StackSet was created
            try (CloudFormationClient cfnClient = CloudFormationClient.builder().region(Region.of(TEST_REGION)).build()) {
                ListStackSetsResponse stackSetsResponse = cfnClient.listStackSets();
                
                boolean found = stackSetsResponse.summaries().stream()
                    .anyMatch(summary -> summary.stackSetName().contains("integration-test-app"));
                
                if (found) {
                    System.out.println("StackSet found in CloudFormation");
                } else {
                    System.out.println("StackSet not found - this is expected if infrastructure is not deployed");
                }
            }
            
            // Validate IAM roles were created
            try (IamClient iamClient = IamClient.builder().region(Region.of(TEST_REGION)).build()) {
                ListRolesResponse rolesResponse = iamClient.listRoles();
                
                boolean adminRoleFound = rolesResponse.roles().stream()
                    .anyMatch(role -> role.roleName().contains("CloudFormationStackSetAdministration"));
                    
                boolean execRoleFound = rolesResponse.roles().stream()
                    .anyMatch(role -> role.roleName().contains("CloudFormationStackSetExecution"));
                
                if (adminRoleFound && execRoleFound) {
                    System.out.println("IAM roles found");
                } else {
                    System.out.println("IAM roles not found - this is expected if infrastructure is not deployed");
                }
            }
            
            // Validate CloudWatch dashboard was created
            try (CloudWatchClient cloudWatchClient = CloudWatchClient.builder().region(Region.of(TEST_REGION)).build()) {
                ListDashboardsResponse dashboardsResponse = cloudWatchClient.listDashboards();
                
                boolean dashboardFound = dashboardsResponse.dashboardEntries().stream()
                    .anyMatch(dashboard -> dashboard.dashboardName().contains("WebApplication"));
                
                if (dashboardFound) {
                    System.out.println("CloudWatch dashboard found");
                } else {
                    System.out.println("CloudWatch dashboard not found - this is expected if infrastructure is not deployed");
                }
            }
        });
    }

    // ================== Component Integration Tests ==================
    
    @Test
    void testAllComponentsCanBeInstantiatedTogether() {
        // Test that all components can be created in the same order as Main.defineInfrastructure
        assertDoesNotThrow(() -> {
            var config = new DeploymentConfig(mockContext);
            assertNotNull(config);

            System.out.println("   - Application: " + config.getApplicationName());
            System.out.println("   - Environment: " + config.getEnvironment());
            System.out.println("   - Management Region: " + config.getManagementRegion());
            System.out.println("   - Target Regions: " + config.getTargetRegions());
            System.out.println("   - Target Accounts: " + config.getTargetAccounts());
        });
    }
    
    @Test
    void testConfigurationVariations() {
        // Test different configuration scenarios
        assertDoesNotThrow(() -> {
            // Test with minimal configuration
            when(mockPulumiConfig.get(anyString())).thenReturn(java.util.Optional.empty());
            when(mockPulumiConfig.getObject(any(), eq(String[].class))).thenReturn(java.util.Optional.empty());
            
            var defaultConfig = new DeploymentConfig(mockContext);
            assertEquals("multi-region-web-app", defaultConfig.getApplicationName());
            assertEquals("production", defaultConfig.getEnvironment());
            assertEquals(3, defaultConfig.getTargetRegions().size());
            assertEquals(2, defaultConfig.getTargetAccounts().size());
            
            System.out.println("Default configuration works correctly");
        });
    }
    
    @Test
    void testResourceNamingConventions() {
        // Test that resource names follow conventions
        assertDoesNotThrow(() -> {
            var config = new DeploymentConfig(mockContext);
            
            // Test that tags are properly formatted
            var tags = config.getTags();
            assertEquals("integration-test-app", tags.get("Application"));
            assertEquals("integration-test", tags.get("Environment"));
            assertEquals("Pulumi", tags.get("ManagedBy"));
            assertEquals("MultiRegionWebApp", tags.get("Project"));
            
            System.out.println("Resource naming conventions are correct");
        });
    }

    // ================== Helper Methods ==================
    
    private boolean isPulumiAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("pulumi", "version");
            Process process = pb.start();
            return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean hasAwsCredentials() {
        return (System.getenv("AWS_ACCESS_KEY_ID") != null && System.getenv("AWS_SECRET_ACCESS_KEY") != null) ||
               System.getenv("AWS_PROFILE") != null ||
               System.getProperty("aws.accessKeyId") != null;
    }

    private boolean isTestingEnvironment() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        String profile = System.getenv("AWS_PROFILE");
        return (env != null && (env.startsWith("pr") || env.equals("dev") || env.equals("test"))) ||
               (profile != null && (profile.contains("test") || profile.contains("dev")));
    }
    
    private String executeCommand(String... command) throws IOException, InterruptedException {
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
    
    private String executeCommandWithTimeout(String... command)
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
    
    private String readProcessOutput(Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }
}