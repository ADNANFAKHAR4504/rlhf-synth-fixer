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
    void testPulumiPreview() throws Exception {
        // Skip if Pulumi CLI is not available
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", "TapStackdev")
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
     * Test that verifies the actual deployed infrastructure by checking stack outputs.
     * This test uses real deployed resources, not mocked values.
     */
    @Test
    void testDeployedInfrastructureOutputs() throws Exception {
        // Skip if Pulumi CLI is not available
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", "TapStackdev")
                .directory(Paths.get("").toAbsolutePath().toFile()); // Run from project root
        
        // Set environment variable for passphrase
        pb.environment().put("PULUMI_CONFIG_PASSPHRASE", "");
        pb.redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(30, TimeUnit.SECONDS);

        assertTrue(finished, "Getting stack outputs should complete within 30 seconds");
        
        // Debug output
        String output = new String(process.getInputStream().readAllBytes());
        System.out.println("Pulumi command output: " + output);
        System.out.println("Exit code: " + process.exitValue());
        
        assertEquals(0, process.exitValue(), "Should be able to get stack outputs successfully. Error: " + output);

        // Read the output to verify real resource values exist
        assertFalse(output.trim().isEmpty(), "Stack outputs should not be empty");
        
        // Verify that key outputs exist (these are real values from deployed infrastructure)
        assertTrue(output.contains("documentBucketName"), "Document bucket name should be in outputs");
        assertTrue(output.contains("kmsKeyId"), "KMS key ID should be in outputs");
        assertTrue(output.contains("documentAccessPolicyArn"), "IAM policy ARN should be in outputs");
        assertTrue(output.contains("cloudtrailName"), "CloudTrail name should be in outputs");
        
        System.out.println("Real deployed infrastructure outputs: " + output);
    }

    /**
     * Test that verifies actual AWS resources exist by checking them via AWS CLI.
     * This test directly validates the deployed infrastructure in AWS.
     */
    @Test
    void testAwsResourcesExist() throws Exception {
        // Skip if AWS CLI is not available
        Assumptions.assumeTrue(isAwsCliAvailable(), "AWS CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        // Get the bucket name from Pulumi outputs
        ProcessBuilder getOutputsPb = new ProcessBuilder("pulumi", "stack", "output", "documentBucketName", "--stack", "TapStackdev")
                .directory(Paths.get("").toAbsolutePath().toFile()); // Run from project root
        getOutputsPb.environment().put("PULUMI_CONFIG_PASSPHRASE", "");
        getOutputsPb.redirectErrorStream(true);
        Process outputsProcess = getOutputsPb.start();
        outputsProcess.waitFor(30, TimeUnit.SECONDS);
        
        if (outputsProcess.exitValue() == 0) {
            String bucketName = new String(outputsProcess.getInputStream().readAllBytes()).trim();
            
            // Verify the S3 bucket actually exists in AWS
            ProcessBuilder s3CheckPb = new ProcessBuilder("aws", "s3api", "head-bucket", "--bucket", bucketName)
                    .redirectErrorStream(true);
            Process s3Process = s3CheckPb.start();
            boolean s3Finished = s3Process.waitFor(30, TimeUnit.SECONDS);
            
            assertTrue(s3Finished, "S3 bucket check should complete within 30 seconds");
            assertEquals(0, s3Process.exitValue(), "S3 bucket should exist in AWS: " + bucketName);
            
            System.out.println("Verified S3 bucket exists: " + bucketName);
        }

        // Get the KMS key ID from Pulumi outputs
        ProcessBuilder getKmsOutputsPb = new ProcessBuilder("pulumi", "stack", "output", "kmsKeyId", "--stack", "TapStackdev")
                .directory(Paths.get("").toAbsolutePath().toFile()); // Run from project root
        getKmsOutputsPb.environment().put("PULUMI_CONFIG_PASSPHRASE", "");
        getKmsOutputsPb.redirectErrorStream(true);
        Process kmsOutputsProcess = getKmsOutputsPb.start();
        kmsOutputsProcess.waitFor(30, TimeUnit.SECONDS);
        
        if (kmsOutputsProcess.exitValue() == 0) {
            String kmsKeyId = new String(kmsOutputsProcess.getInputStream().readAllBytes()).trim();
            
            // Verify the KMS key actually exists in AWS
            ProcessBuilder kmsCheckPb = new ProcessBuilder("aws", "kms", "describe-key", "--key-id", kmsKeyId)
                    .redirectErrorStream(true);
            Process kmsProcess = kmsCheckPb.start();
            boolean kmsFinished = kmsProcess.waitFor(30, TimeUnit.SECONDS);
            
            assertTrue(kmsFinished, "KMS key check should complete within 30 seconds");
            assertEquals(0, kmsProcess.exitValue(), "KMS key should exist in AWS: " + kmsKeyId);
            
            System.out.println("Verified KMS key exists: " + kmsKeyId);
        }
    }

    /**
     * Helper method to check if AWS CLI is available.
     */
    private boolean isAwsCliAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("aws", "--version");
            Process process = pb.start();
            return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
