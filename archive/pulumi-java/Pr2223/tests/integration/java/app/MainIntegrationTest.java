package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Assumptions;
import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.InputStreamReader;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.pulumi.Context;

/**
 * Integration tests for the Main Pulumi program.
 * 
 * This is a minimal example showing how to write integration tests for Pulumi Java programs.
 * Add more specific tests based on your infrastructure requirements.
 * 
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

    /**
     * Test that the application can be compiled and the main class loads.
     */
    @Test
    void testApplicationLoads() {
        assertDoesNotThrow(() -> {
            Class.forName("app.Main");
        });
    }

    /**
     * Test that Pulumi dependencies are available on classpath.
     */
    @Test
    void testPulumiDependenciesAvailable() {
        assertDoesNotThrow(() -> {
            Class.forName("com.pulumi.Pulumi");
            Class.forName("com.pulumi.aws.s3.Bucket");
            Class.forName("com.pulumi.aws.s3.BucketArgs");
        }, "Pulumi dependencies should be available on classpath");
    }

    /**
     * Test that required project files exist.
     */
    @Test
    void testProjectStructure() {
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/Main.java")),
                "Main.java should exist");
        assertTrue(Files.exists(Paths.get("Pulumi.yaml")),
                "Pulumi.yaml should exist");
        assertTrue(Files.exists(Paths.get("build.gradle")),
                "build.gradle should exist");
    }

    /**
     * Test that defineInfrastructure method exists and is accessible.
     */
    @Test
    void testDefineInfrastructureMethodAccessible() {
        assertDoesNotThrow(() -> {
            var method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertNotNull(method);
            assertTrue(java.lang.reflect.Modifier.isStatic(method.getModifiers()));
        });
    }

    /**
     * Example test for Pulumi program validation using Pulumi CLI.
     * Disabled by default as it requires Pulumi CLI and AWS setup.
     * 
     * Uncomment @Disabled and configure environment to run this test.
     */
    @Test
    @Disabled("Enable for actual Pulumi preview testing - requires Pulumi CLI and AWS credentials")
    void testPulumiPreview() throws Exception {
        // Skip if Pulumi CLI is not available
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", "test")
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        assertTrue(finished, "Pulumi preview should complete within 60 seconds");

        // Preview should succeed (exit code 0) or show changes needed (exit code 1)
        int exitCode = process.exitValue();
        assertTrue(exitCode == 0 || exitCode == 1,
                "Pulumi preview should succeed or show pending changes");
    }

    /**
     * Example test for actual infrastructure deployment.
     * Disabled by default to prevent accidental resource creation.
     * 
     * IMPORTANT: This creates real AWS resources. Only enable in test environments.
     */
    @Test
    @Disabled("Enable for actual infrastructure testing - creates real AWS resources")
    void testInfrastructureDeployment() throws Exception {
        // Skip if environment is not properly configured
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(isTestingEnvironment(), "Should only run in testing environment");

        // Deploy infrastructure
        ProcessBuilder deployPb = new ProcessBuilder("pulumi", "up", "--yes", "--stack", "integration-test")
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process deployProcess = deployPb.start();
        boolean deployFinished = deployProcess.waitFor(300, TimeUnit.SECONDS);

        assertTrue(deployFinished, "Deployment should complete within 5 minutes");
        assertEquals(0, deployProcess.exitValue(), "Deployment should succeed");

        try {
            // Verify deployment worked by checking stack outputs
            ProcessBuilder outputsPb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", "integration-test")
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process outputsProcess = outputsPb.start();
            boolean outputsFinished = outputsProcess.waitFor(30, TimeUnit.SECONDS);

            assertTrue(outputsFinished, "Getting outputs should complete quickly");
            assertEquals(0, outputsProcess.exitValue(), "Should be able to get stack outputs");

        } finally {
            // Clean up - destroy the stack
            ProcessBuilder destroyPb = new ProcessBuilder("pulumi", "destroy", "--yes", "--stack", "integration-test")
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process destroyProcess = destroyPb.start();
            destroyProcess.waitFor(300, TimeUnit.SECONDS);
        }
    }

    /**
     * Helper method to check if Pulumi CLI is available.
     */
    private boolean isPulumiAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("pulumi", "version");
            Process process = pb.start();
            return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Helper method to check if AWS credentials are configured.
     */
    private boolean hasAwsCredentials() {
        return System.getenv("AWS_ACCESS_KEY_ID") != null &&
                System.getenv("AWS_SECRET_ACCESS_KEY") != null;
    }

    /**
     * Helper method to check if we're in a testing environment (not production).
     */
    private boolean isTestingEnvironment() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        return env != null && (env.startsWith("pr") || env.equals("dev") || env.equals("test"));
    }

    /**
     * Test environment configuration validation.
     */
    @Test
    void testEnvironmentConfigIntegration() {
        // Test all valid environments
        assertDoesNotThrow(() -> new Main.EnvironmentConfig("development"));
        assertDoesNotThrow(() -> new Main.EnvironmentConfig("testing"));
        assertDoesNotThrow(() -> new Main.EnvironmentConfig("staging"));
        assertDoesNotThrow(() -> new Main.EnvironmentConfig("production"));
        
        // Verify environment-specific VPC configurations
        Main.EnvironmentConfig devConfig = new Main.EnvironmentConfig("development");
        Map<String, String> devVpc = devConfig.getVpcConfig();
        assertEquals("10.0.0.0/16", devVpc.get("cidrBlock"));
        
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        Map<String, String> prodVpc = prodConfig.getVpcConfig();
        assertEquals("10.3.0.0/16", prodVpc.get("cidrBlock"));
        assertEquals(90, prodConfig.getKmsKeyRotationDays());
    }

    /**
     * Test resource naming uniqueness in integration context.
     */
    @Test
    void testResourceNamingIntegration() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        if (env == null) {
            env = "test";
        }
        
        // Generate multiple resource names and verify uniqueness
        String name1 = Main.ResourceNaming.generateResourceName(env, "vpc", "main");
        String name2 = Main.ResourceNaming.generateResourceName(env, "vpc", "main");
        String name3 = Main.ResourceNaming.generateResourceName(env, "s3", "bucket");
        
        assertNotNull(name1);
        assertNotNull(name2);
        assertNotNull(name3);
        
        // Names should be unique due to random suffix
        assertNotEquals(name1, name2);
        assertNotEquals(name1, name3);
        assertNotEquals(name2, name3);
        
        // All names should follow the pattern and be valid AWS resource names
        assertTrue(name1.matches("^[a-z0-9-]+$"));
        assertTrue(name2.matches("^[a-z0-9-]+$"));
        assertTrue(name3.matches("^[a-z0-9-]+$"));
    }

    /**
     * Test reading and parsing deployment outputs if they exist.
     * This test helps verify integration with CI/CD pipeline outputs.
     */
    @Test
    void testDeploymentOutputsParsing() {
        String outputsPath = "cfn-outputs/flat-outputs.json";
        
        if (Files.exists(Paths.get(outputsPath))) {
            assertDoesNotThrow(() -> {
                String content = Files.readString(Paths.get(outputsPath));
                ObjectMapper mapper = new ObjectMapper();
                
                // Parse the outputs JSON
                Map<String, Object> outputs = mapper.readValue(content, 
                    new TypeReference<Map<String, Object>>() {});
                
                assertNotNull(outputs);
                
                // Verify common output fields if they exist
                if (outputs.containsKey("vpcId")) {
                    assertNotNull(outputs.get("vpcId"));
                    assertTrue(outputs.get("vpcId").toString().startsWith("vpc-"));
                }
                
                if (outputs.containsKey("kmsKeyId")) {
                    assertNotNull(outputs.get("kmsKeyId"));
                }
                
                if (outputs.containsKey("environment")) {
                    assertNotNull(outputs.get("environment"));
                }
            }, "Should be able to parse deployment outputs if they exist");
        }
    }

    /**
     * Test that all required infrastructure classes are available and can be instantiated.
     */
    @Test
    void testInfrastructureClassesAvailable() {
        assertDoesNotThrow(() -> {
            // Test that all nested classes can be loaded
            Class.forName("app.Main$EnvironmentConfig");
            Class.forName("app.Main$ResourceNaming");
            Class.forName("app.Main$TaggingPolicy");
            Class.forName("app.Main$InfrastructureStack");
            Class.forName("app.Main$MigrationManager");
            Class.forName("app.Main$SecretsManagerMigration");
        }, "All infrastructure classes should be available");
    }

    /**
     * Test resource naming consistency across multiple calls.
     */
    @Test
    void testResourceNamingConsistency() {
        String environment = "integration-test";
        
        // Test that resource naming is consistent in format
        for (int i = 0; i < 10; i++) {
            String vpcName = Main.ResourceNaming.generateResourceName(environment, "vpc", "main");
            String sgName = Main.ResourceNaming.generateResourceName(environment, "sg", "web");
            String kmsName = Main.ResourceNaming.generateResourceName(environment, "kms", "key");
            
            // Verify format consistency
            assertTrue(vpcName.startsWith("cm-int-vpc-main-"));
            assertTrue(sgName.startsWith("cm-int-sg-web-"));
            assertTrue(kmsName.startsWith("cm-int-kms-key-"));
            
            // Verify length consistency (prefix + 6 random chars)
            assertEquals(22, vpcName.length()); // cm-int-vpc-main-XXXXXX
            assertEquals(20, sgName.length());  // cm-int-sg-web-XXXXXX
            assertEquals(21, kmsName.length()); // cm-int-kms-key-XXXXXX
        }
    }

    /**
     * Test application with various command line argument scenarios.
     */
    @Test
    void testMainApplicationArgumentHandling() {
        // Test that Main class can handle various argument scenarios
        // These will all fail due to Pulumi context, but should fail gracefully
        
        assertThrows(Exception.class, () -> Main.main(new String[]{}));
        assertThrows(Exception.class, () -> Main.main(new String[]{"--help"}));
        assertThrows(Exception.class, () -> Main.main(new String[]{"invalid", "args"}));
        
        // The important thing is that these don't cause JVM crashes or security issues
    }

    /**
     * Test integration with environment variables that might be set in CI/CD.
     */
    @Test
    void testEnvironmentVariableIntegration() {
        String githubPrNumber = System.getenv("GITHUB_PR_NUMBER");
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        String awsRegion = System.getenv("AWS_REGION");
        
        if (environmentSuffix != null) {
            assertTrue(environmentSuffix.length() > 0, "Environment suffix should not be empty if set");
            // Environment suffix should be safe for AWS resource names
            assertTrue(environmentSuffix.matches("^[a-zA-Z0-9-]+$"));
        }
        
        if (awsRegion != null && !awsRegion.trim().isEmpty()) {
            assertTrue(awsRegion.matches("^[a-z0-9-]+$"), "AWS region should be valid format");
        }
        
        // If this is a PR build, verify the naming convention
        if (githubPrNumber != null && environmentSuffix != null) {
            assertTrue(environmentSuffix.contains(githubPrNumber), 
                "Environment suffix should contain PR number for PR builds");
        }
    }

    /**
     * Test project metadata and configuration files.
     */
    @Test
    void testProjectMetadata() throws IOException {
        // Test that metadata.json exists and is valid
        assertTrue(Files.exists(Paths.get("metadata.json")), "metadata.json should exist");
        
        String metadataContent = Files.readString(Paths.get("metadata.json"));
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> metadata = mapper.readValue(metadataContent, 
            new TypeReference<Map<String, Object>>() {});
        
        assertEquals("pulumi", metadata.get("platform"));
        assertEquals("java", metadata.get("language"));
        assertNotNull(metadata.get("po_id"));
        
        // Test Pulumi.yaml exists and is readable
        assertTrue(Files.exists(Paths.get("Pulumi.yaml")), "Pulumi.yaml should exist");
        String pulumiConfig = Files.readString(Paths.get("Pulumi.yaml"));
        assertTrue(pulumiConfig.contains("name:"), "Pulumi.yaml should contain project name");
        assertTrue(pulumiConfig.contains("runtime:"), "Pulumi.yaml should contain runtime");
    }
}