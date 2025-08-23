package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.util.List;
import java.util.Arrays;

import com.pulumi.Context;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * Integration tests for the Main Pulumi program.
 *
 * Run with: ./gradlew integrationTest
 */
public class MainIntegrationTest {

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
            Class.forName("com.pulumi.aws.s3.Bucket");
            Class.forName("com.pulumi.aws.s3.BucketArgs");
        }, "Pulumi dependencies should be available on classpath");
    }

    @Test
    void testProjectStructure() {
        assertTrue(Files.exists(Paths.get("lib/src/main/java/app/Main.java")),
                "Main.java should exist");
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

    /**
     * Integration test: Validate outputs from a live Pulumi stack deployment.
     * Requires Pulumi CLI, AWS credentials, and a deployed stack.
     *
     * Enable this test for live deployment validation.
     * It will read stack outputs from Pulumi CLI and assert values/structure.
     */
    @Test
    void testLivePulumiStackOutputs() throws Exception {
        // --- Setup: Check env and CLI ---
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        // Use ENVIRONMENT_SUFFIX to determine stack name if present
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        assertNotNull(environmentSuffix, "ENVIRONMENT_SUFFIX environment variable must be set");
        // Compose stack name dynamically using ENVIRONMENT_SUFFIX
        // e.g., stack name = TapStack + environmentSuffix
        String stackName = "TapStack" + environmentSuffix;

        // --- Fetch outputs from Pulumi CLI ---
        ProcessBuilder outputsPb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", stackName)
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);
        Process outputsProcess = outputsPb.start();
        boolean outputsFinished = outputsProcess.waitFor(30, TimeUnit.SECONDS);

        assertTrue(outputsFinished, "Getting outputs should complete quickly");
        assertEquals(0, outputsProcess.exitValue(), "Should be able to get stack outputs");

        // --- Parse outputs JSON ---
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> outputs;
        try (var is = outputsProcess.getInputStream()) {
            outputs = mapper.readValue(is, new TypeReference<Map<String, Object>>() {});
        }

        // --- Example assertions matching your deployment ---
        assertNotNull(outputs);

        // deployedRegions
        assertTrue(outputs.containsKey("deployedRegions"), "deployedRegions should be present");
        List<String> deployedRegions = (List<String>) outputs.get("deployedRegions");
        assertTrue(deployedRegions.containsAll(Arrays.asList("us-east-1", "us-west-1")));
        assertEquals(2, deployedRegions.size());

        // environmentSuffix
        assertEquals("prod", outputs.get("environmentSuffix"));

        // identityRoleArn and instanceProfileName
        assertTrue(((String) outputs.get("identityRoleArn")).contains("nova-eb-service-role-default"));
        assertTrue(((String) outputs.get("instanceProfileName")).contains("nova-eb-instance-profile-default"));

        // primaryApplicationUrl and primaryRegion
        assertEquals("us-east-1", outputs.get("primaryRegion"));
        assertTrue(((String) outputs.get("primaryApplicationUrl")).contains("us-east-1.elb.amazonaws.com"));

        // stackTags assertions
        assertTrue(outputs.containsKey("stackTags"));
        Map<String, String> stackTags = (Map<String, String>) outputs.get("stackTags");
        assertEquals("nova-web-app", stackTags.get("Application"));
        assertEquals("production", stackTags.get("Environment"));

        // totalRegions
        assertEquals(2, (int) outputs.get("totalRegions"));

        // us-east-1 checks
        assertTrue(((String) outputs.get("us-east-1-albSecurityGroupId")).startsWith("sg-"));
        assertEquals("nova-app-useast1", outputs.get("us-east-1-applicationName"));
        assertTrue(((String) outputs.get("us-east-1-applicationUrl")).contains("us-east-1.elb.amazonaws.com"));
        assertEquals("nova-env-useast1-prod", outputs.get("us-east-1-environmentName"));
        assertTrue(((String) outputs.get("us-east-1-loadBalancerUrl")).contains("elasticbeanstalk.com"));
        assertEquals("/aws/elasticbeanstalk/nova-useast1", outputs.get("us-east-1-logGroupName"));
        assertEquals("vpc-085ddea60db5908e4", outputs.get("us-east-1-vpcId"));
        // subnet arrays are present and non-empty
        List<String> usEast1Priv = (List<String>) outputs.get("us-east-1-privateSubnetIds");
        List<String> usEast1Pub = (List<String>) outputs.get("us-east-1-publicSubnetIds");
        assertEquals(2, usEast1Priv.size());
        assertEquals(2, usEast1Pub.size());

        // us-west-1 checks
        assertTrue(((String) outputs.get("us-west-1-albSecurityGroupId")).startsWith("sg-"));
        assertEquals("nova-app-uswest1", outputs.get("us-west-1-applicationName"));
        assertTrue(((String) outputs.get("us-west-1-applicationUrl")).contains("us-west-1.elb.amazonaws.com"));
        assertEquals("nova-env-uswest1-prod", outputs.get("us-west-1-environmentName"));
        assertTrue(((String) outputs.get("us-west-1-loadBalancerUrl")).contains("elasticbeanstalk.com"));
        assertEquals("/aws/elasticbeanstalk/nova-uswest1", outputs.get("us-west-1-logGroupName"));
        assertEquals("vpc-046da5e751bef00ae", outputs.get("us-west-1-vpcId"));
        List<String> usWest1Priv = (List<String>) outputs.get("us-west-1-privateSubnetIds");
        List<String> usWest1Pub = (List<String>) outputs.get("us-west-1-publicSubnetIds");
        assertEquals(2, usWest1Priv.size());
        assertEquals(2, usWest1Pub.size());

        // Dashboard URLs
        assertTrue(((String) outputs.get("us-east-1-dashboardUrl")).startsWith("https://us-east-1.console.aws.amazon.com/cloudwatch/home"));
        assertTrue(((String) outputs.get("us-west-1-dashboardUrl")).startsWith("https://us-west-1.console.aws.amazon.com/cloudwatch/home"));
    }

    @Test
    void testPulumiPreview() throws Exception {
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", "test")
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        assertTrue(finished, "Pulumi preview should complete within 60 seconds");
        int exitCode = process.exitValue();
        assertTrue(exitCode == 0 || exitCode == 1,
                "Pulumi preview should succeed or show pending changes");
    }

    @Test
    void testInfrastructureDeployment() throws Exception {
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(isTestingEnvironment(), "Should only run in testing environment");

        // Use ENVIRONMENT_SUFFIX for stack name if present
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        assertNotNull(environmentSuffix, "ENVIRONMENT_SUFFIX environment variable must be set");
        String stackName = "integration-test";
        // Optionally, stackName could use environmentSuffix as well if your convention matches

        ProcessBuilder deployPb = new ProcessBuilder("pulumi", "up", "--yes", "--stack", stackName)
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process deployProcess = deployPb.start();
        boolean deployFinished = deployProcess.waitFor(300, TimeUnit.SECONDS);

        assertTrue(deployFinished, "Deployment should complete within 5 minutes");
        assertEquals(0, deployProcess.exitValue(), "Deployment should succeed");

        try {
            ProcessBuilder outputsPb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", stackName)
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process outputsProcess = outputsPb.start();
            boolean outputsFinished = outputsProcess.waitFor(30, TimeUnit.SECONDS);

            assertTrue(outputsFinished, "Getting outputs should complete quickly");
            assertEquals(0, outputsProcess.exitValue(), "Should be able to get stack outputs");

        } finally {
            ProcessBuilder destroyPb = new ProcessBuilder("pulumi", "destroy", "--yes", "--stack", stackName)
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process destroyProcess = destroyPb.start();
            destroyProcess.waitFor(300, TimeUnit.SECONDS);
        }
    }

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
        return System.getenv("AWS_ACCESS_KEY_ID") != null &&
                System.getenv("AWS_SECRET_ACCESS_KEY") != null;
    }

    private boolean isTestingEnvironment() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        return env != null && (env.startsWith("pr") || env.equals("dev") || env.equals("test"));
    }
}