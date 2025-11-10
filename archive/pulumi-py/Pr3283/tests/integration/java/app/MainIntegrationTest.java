package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Assumptions;
import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

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
}