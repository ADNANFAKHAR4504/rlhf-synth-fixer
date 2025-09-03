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
import java.io.*;

import com.pulumi.Context;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

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

    @Test
    void testPulumiPreview() throws Exception {
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");

        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        assertNotNull(environmentSuffix, "ENVIRONMENT_SUFFIX environment variable must be set");
        String stackName = "TapStack" + environmentSuffix;

        // Check if the stack exists
        assertTrue(stackExists(stackName), "Pulumi stack '" + stackName + "' must exist before running preview!");

        ProcessBuilder pb = new ProcessBuilder("pulumi", "preview", "--stack", stackName)
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process process = pb.start();
        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        String out = readProcessOutput(process);

        assertTrue(finished, "Pulumi preview should complete within 60 seconds. Output: " + out);
        int exitCode = process.exitValue();
        assertTrue(exitCode == 0 || exitCode == 1,
                "Pulumi preview should succeed or show pending changes. Exit code: " + exitCode + ". Output: " + out);
    }

    @Test
    void testInfrastructureDeployment() throws Exception {
        Assumptions.assumeTrue(isPulumiAvailable(), "Pulumi CLI should be available");
        Assumptions.assumeTrue(hasAwsCredentials(), "AWS credentials should be configured");
        Assumptions.assumeTrue(isTestingEnvironment(), "Should only run in testing environment");

        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        assertNotNull(environmentSuffix, "ENVIRONMENT_SUFFIX environment variable must be set");
        String stackName = "TapStack" + environmentSuffix;

        assertTrue(stackExists(stackName), "Pulumi stack '" + stackName + "' must exist before deployment!");

        ProcessBuilder deployPb = new ProcessBuilder("pulumi", "up", "--yes", "--stack", stackName)
                .directory(Paths.get("lib").toFile())
                .redirectErrorStream(true);

        Process deployProcess = deployPb.start();
        boolean deployFinished = deployProcess.waitFor(300, TimeUnit.SECONDS);

        String deployOut = readProcessOutput(deployProcess);

        assertTrue(deployFinished, "Deployment should complete within 5 minutes. Output: " + deployOut);
        assertEquals(0, deployProcess.exitValue(), "Deployment should succeed. Output: " + deployOut);

        try {
            ProcessBuilder outputsPb = new ProcessBuilder("pulumi", "stack", "output", "--json", "--stack", stackName)
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process outputsProcess = outputsPb.start();
            boolean outputsFinished = outputsProcess.waitFor(30, TimeUnit.SECONDS);

            String outputsLog = readProcessOutput(outputsProcess);

            assertTrue(outputsFinished, "Getting outputs should complete quickly. Output: " + outputsLog);
            assertEquals(0, outputsProcess.exitValue(), "Should be able to get stack outputs. Output: " + outputsLog);

        } finally {
            ProcessBuilder destroyPb = new ProcessBuilder("pulumi", "destroy", "--yes", "--stack", stackName)
                    .directory(Paths.get("lib").toFile())
                    .redirectErrorStream(true);

            Process destroyProcess = destroyPb.start();
            destroyProcess.waitFor(300, TimeUnit.SECONDS);
            readProcessOutput(destroyProcess); // swallow output
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

    private boolean stackExists(String stackName) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder("pulumi", "stack", "select", stackName);
        pb.redirectErrorStream(true);
        pb.directory(Paths.get("lib").toFile());
        Process p = pb.start();
        p.waitFor(15, TimeUnit.SECONDS);
        // 0 = selected, 255 = not found
        return p.exitValue() == 0;
    }

    private String readProcessOutput(Process p) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append(System.lineSeparator());
            }
        }
        return sb.toString();
    }
}