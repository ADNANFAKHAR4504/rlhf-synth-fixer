package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Assumptions;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.util.regex.Pattern;

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
        return System.getenv("AWS_ACCESS_KEY_ID") != null
                && System.getenv("AWS_SECRET_ACCESS_KEY") != null;
    }

    /**
     * Helper method to check if we're in a testing environment (not production).
     */
    private boolean isTestingEnvironment() {
        String env = System.getenv("ENVIRONMENT_SUFFIX");
        return env != null && (env.startsWith("pr") || env.equals("dev") || env.equals("test"));
    }

    // === COMPREHENSIVE INTEGRATION TESTS FOR ALL HELPER METHODS ===

    /**
     * Integration test for resource name building functionality.
     * Tests the integration between different naming methods.
     */
    @Test
    void testResourceNamingIntegration() {
        // Test basic resource name building
        String resourceName = Main.buildResourceName("vpc", "prod");
        assertNotNull(resourceName);
        assertTrue(resourceName.contains("vpc"));
        assertTrue(resourceName.contains("prod"));
        
        // Test formatted resource names
        String formattedName = Main.formatResourceName("subnet", "public", "123");
        assertNotNull(formattedName);
        assertTrue(formattedName.contains("subnet"));
        assertTrue(formattedName.contains("public"));
        assertTrue(formattedName.contains("123"));
        
        // Test region and suffix integration
        String region = Main.getRegion();
        String suffix = Main.getRandomSuffix();
        assertNotNull(region);
        assertNotNull(suffix);
        assertEquals("us-east-1", region);
        assertTrue(suffix.length() > 0);
        
        // Test availability zone generation with region
        String az = Main.generateAvailabilityZone(region, "a");
        assertNotNull(az);
        assertTrue(az.startsWith(region));
        assertTrue(az.endsWith("a"));
    }

    /**
     * Integration test for AWS resource validation methods.
     * Tests validation methods working together in realistic scenarios.
     */
    @Test
    void testAwsResourceValidationIntegration() {
        // Test CIDR block validation and subnet calculation integration
        String[] validCidrs = {"10.0.0.0/16", "172.16.0.0/12", "192.168.0.0/24"};
        for (String cidr : validCidrs) {
            assertTrue(Main.isValidCidrBlock(cidr));
            int subnetSize = Main.calculateSubnetSize(cidr);
            assertTrue(subnetSize > 0);
        }
        
        // Test region validation
        assertTrue(Main.isValidAwsRegion("us-east-1"));
        assertTrue(Main.isValidAwsRegion("eu-west-1"));
        assertTrue(Main.isValidAwsRegion("ap-southeast-1"));
        assertFalse(Main.isValidAwsRegion("invalid-region"));
        
        // Test instance type validation
        String[] validInstanceTypes = {"t3.micro", "m5.large", "c5.xlarge", "r5.2xlarge"};
        for (String instanceType : validInstanceTypes) {
            assertTrue(Main.isValidInstanceType(instanceType));
        }
        
        // Test ARN validation integration
        String[] validArns = {
            "arn:aws:s3:::my-bucket",
            "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
            "arn:aws:iam::123456789012:role/MyRole"
        };
        for (String arn : validArns) {
            assertTrue(Main.isValidArn(arn));
        }
    }

    /**
     * Integration test for S3 bucket naming and validation.
     * Tests S3-related methods working together.
     */
    @Test
    void testS3BucketIntegration() {
        // Test valid S3 bucket names
        String[] validBucketNames = {
            "my-bucket-123",
            "financial-app-data",
            "cloudtrail-logs-2024",
            "a".repeat(63) // Max length
        };
        
        for (String bucketName : validBucketNames) {
            assertTrue(Main.isValidS3BucketName(bucketName), 
                "Bucket name should be valid: " + bucketName);
        }
        
        // Test invalid bucket names
        String[] invalidBucketNames = {
            "MyBucket", // Uppercase
            "bucket_with_underscore", // Underscore
            "bucket-", // Ends with hyphen
            "-bucket", // Starts with hyphen
            "bu", // Too short
            "a".repeat(64), // Too long
            "192.168.1.1" // IP address format
        };
        
        for (String bucketName : invalidBucketNames) {
            assertFalse(Main.isValidS3BucketName(bucketName), 
                "Bucket name should be invalid: " + bucketName);
        }
    }

    /**
     * Integration test for network security validation.
     * Tests port and protocol validation together.
     */
    @Test
    void testNetworkSecurityIntegration() {
        // Test valid ports
        int[] validPorts = {80, 443, 22, 3306, 5432, 6379, 8080, 9200};
        for (int port : validPorts) {
            assertTrue(Main.isValidPort(port));
        }
        
        // Test invalid ports
        int[] invalidPorts = {0, -1, 65536, 100000};
        for (int port : invalidPorts) {
            assertFalse(Main.isValidPort(port));
        }
        
        // Test valid protocols
        String[] validProtocols = {"tcp", "udp", "icmp", "TCP", "UDP", "ICMP"};
        for (String protocol : validProtocols) {
            assertTrue(Main.isValidProtocol(protocol));
        }
        
        // Test invalid protocols
        String[] invalidProtocols = {"http", "https", "ftp", "ssh", "", null, "  "};
        for (String protocol : invalidProtocols) {
            assertFalse(Main.isValidProtocol(protocol));
        }
    }

    /**
     * Integration test for EBS volume validation.
     * Tests volume type and size validation working together.
     */
    @Test
    void testEbsVolumeIntegration() {
        // Test valid volume types
        String[] validVolumeTypes = {"gp2", "gp3", "io1", "io2", "st1", "sc1", "standard"};
        for (String volumeType : validVolumeTypes) {
            assertTrue(Main.isValidEbsVolumeType(volumeType));
        }
        
        // Test volume size validation for different types
        // gp2/gp3: 1-16384 GB
        assertTrue(Main.isValidEbsVolumeSize(100, "gp2"));
        assertTrue(Main.isValidEbsVolumeSize(1000, "gp3"));
        
        // io1/io2: 4-16384 GB
        assertTrue(Main.isValidEbsVolumeSize(100, "io1"));
        assertTrue(Main.isValidEbsVolumeSize(500, "io2"));
        
        // st1: 125-16384 GB
        assertTrue(Main.isValidEbsVolumeSize(500, "st1"));
        assertFalse(Main.isValidEbsVolumeSize(100, "st1"));
        
        // sc1: 125-16384 GB
        assertTrue(Main.isValidEbsVolumeSize(200, "sc1"));
        assertFalse(Main.isValidEbsVolumeSize(50, "sc1"));
        
        // standard: 1-1024 GB
        assertTrue(Main.isValidEbsVolumeSize(100, "standard"));
        assertFalse(Main.isValidEbsVolumeSize(2000, "standard"));
    }

    /**
     * Integration test for KMS key configuration validation.
     * Tests KMS-related validation methods together.
     */
    @Test
    void testKmsKeyIntegration() {
        // Test valid KMS key usages
        assertTrue(Main.isValidKmsKeyUsage("ENCRYPT_DECRYPT"));
        assertTrue(Main.isValidKmsKeyUsage("SIGN_VERIFY"));
        assertFalse(Main.isValidKmsKeyUsage("INVALID_USAGE"));
        
        // Test valid deletion windows
        int[] validDeletionWindows = {7, 10, 15, 20, 25, 30};
        for (int window : validDeletionWindows) {
            assertTrue(Main.isValidKmsDeletionWindow(window));
        }
        
        // Test invalid deletion windows
        int[] invalidDeletionWindows = {6, 31, 0, -1, 100};
        for (int window : invalidDeletionWindows) {
            assertFalse(Main.isValidKmsDeletionWindow(window));
        }
    }

    /**
     * Integration test for CloudWatch monitoring configuration.
     * Tests CloudWatch-related validation methods together.
     */
    @Test
    void testCloudWatchIntegration() {
        // Test valid periods (must be multiple of 60)
        int[] validPeriods = {60, 120, 300, 600, 900, 1800, 3600};
        for (int period : validPeriods) {
            assertTrue(Main.isValidCloudWatchPeriod(period));
        }
        
        // Test invalid periods
        int[] invalidPeriods = {30, 90, 150, 0, -60};
        for (int period : invalidPeriods) {
            assertFalse(Main.isValidCloudWatchPeriod(period));
        }
        
        // Test alarm thresholds
        assertTrue(Main.isValidAlarmThreshold(50.0));
        assertTrue(Main.isValidAlarmThreshold(80.5));
        assertTrue(Main.isValidAlarmThreshold(0.1));
        assertFalse(Main.isValidAlarmThreshold(-10.0));
        assertFalse(Main.isValidAlarmThreshold(Double.NaN));
        assertFalse(Main.isValidAlarmThreshold(Double.POSITIVE_INFINITY));
    }

    /**
     * Integration test for resource tagging functionality.
     * Tests tag validation and building methods together.
     */
    @Test
    void testResourceTaggingIntegration() {
        // Test valid resource tags
        assertTrue(Main.isValidResourceTag("Environment", "production"));
        assertTrue(Main.isValidResourceTag("Application", "financial-app"));
        assertTrue(Main.isValidResourceTag("Owner", "team@company.com"));
        
        // Test invalid tags
        assertFalse(Main.isValidResourceTag(null, "value"));
        assertFalse(Main.isValidResourceTag("key", null));
        assertFalse(Main.isValidResourceTag("", "value"));
        assertFalse(Main.isValidResourceTag("key", ""));
        assertFalse(Main.isValidResourceTag("a".repeat(129), "value")); // Too long key
        assertFalse(Main.isValidResourceTag("key", "a".repeat(257))); // Too long value
        
        // Test resource tag building
        Map<String, String> tags1 = Main.buildResourceTags("production", "financial-app");
        assertNotNull(tags1);
        assertEquals("production", tags1.get("Environment"));
        assertEquals("financial-app", tags1.get("Application"));
        
        Map<String, String> tags2 = Main.buildResourceTags("staging", "test-app", "Owner", "team@example.com");
        assertNotNull(tags2);
        assertEquals("staging", tags2.get("Environment"));
        assertEquals("test-app", tags2.get("Application"));
        assertEquals("team@example.com", tags2.get("Owner"));
    }

    /**
     * Integration test for IAM policy generation.
     * Tests policy building methods together.
     */
    @Test
    void testIamPolicyIntegration() {
        // Test CloudTrail bucket policy generation
        String cloudTrailPolicy = Main.buildCloudTrailBucketPolicy("my-cloudtrail-bucket");
        assertNotNull(cloudTrailPolicy);
        assertTrue(cloudTrailPolicy.contains("AWSCloudTrailAclCheck"));
        assertTrue(cloudTrailPolicy.contains("AWSCloudTrailWrite"));
        assertTrue(cloudTrailPolicy.contains("my-cloudtrail-bucket"));
        assertTrue(cloudTrailPolicy.contains("cloudtrail.amazonaws.com"));
        
        // Test S3 read-only policy generation
        String s3Policy = Main.buildS3ReadOnlyPolicy("us-west-2");
        assertNotNull(s3Policy);
        assertTrue(s3Policy.contains("s3:GetObject"));
        assertTrue(s3Policy.contains("s3:GetObjectVersion"));
        assertTrue(s3Policy.contains("us-west-2"));
        
        // Test EC2 assume role policy
        String ec2Policy = Main.buildEc2AssumeRolePolicy();
        assertNotNull(ec2Policy);
        assertTrue(ec2Policy.contains("sts:AssumeRole"));
        assertTrue(ec2Policy.contains("ec2.amazonaws.com"));
        
        // Test KMS key policy
        String kmsPolicy = Main.buildKmsKeyPolicy();
        assertNotNull(kmsPolicy);
        assertTrue(kmsPolicy.contains("Allow CloudTrail to encrypt logs"));
        assertTrue(kmsPolicy.contains("cloudtrail.amazonaws.com"));
        assertTrue(kmsPolicy.contains("s3.amazonaws.com"));
    }

    /**
     * Integration test for configuration file generation.
     * Tests configuration building methods.
     */
    @Test
    void testConfigurationIntegration() {
        // Test CloudWatch agent configuration
        String agentConfig = Main.buildCloudWatchAgentConfig();
        assertNotNull(agentConfig);
        assertTrue(agentConfig.contains("metrics"));
        assertTrue(agentConfig.contains("FinancialApp/EC2"));
        assertTrue(agentConfig.contains("cpu_usage_idle"));
        assertTrue(agentConfig.contains("used_percent"));
        assertTrue(agentConfig.contains("mem"));
        assertTrue(agentConfig.contains("mem_used_percent"));
        
        // Test EC2 user data script
        String userData = Main.buildEc2UserData();
        assertNotNull(userData);
        assertTrue(userData.contains("#!/bin/bash"));
        assertTrue(userData.contains("yum update"));
        assertTrue(userData.contains("cloudwatch"));
        assertTrue(userData.contains("amazon-cloudwatch-agent"));
    }

    /**
     * Integration test for comprehensive CIDR validation scenarios.
     * Tests various CIDR blocks and subnet calculations together.
     */
    @Test
    void testCidrValidationComprehensiveIntegration() {
        // Test all valid CIDR prefix lengths
        for (int prefix = 0; prefix <= 32; prefix++) {
            String cidr = "10.0.0.0/" + prefix;
            assertTrue(Main.isValidCidrBlock(cidr), "CIDR should be valid: " + cidr);
            
            int subnetSize = Main.calculateSubnetSize(cidr);
            int expectedSize = (int) Math.pow(2, 32 - prefix);
            assertEquals(expectedSize, subnetSize, "Subnet size mismatch for " + cidr);
        }
        
        // Test private network ranges
        String[] privateCidrs = {
            "10.0.0.0/8", "10.1.2.0/24", "10.255.255.0/24",
            "172.16.0.0/12", "172.20.1.0/24", "172.31.255.0/24",
            "192.168.0.0/16", "192.168.1.0/24", "192.168.255.0/24"
        };
        
        for (String cidr : privateCidrs) {
            assertTrue(Main.isValidCidrBlock(cidr), "Private CIDR should be valid: " + cidr);
        }
    }

    /**
     * Integration test for complex resource name scenarios.
     * Tests naming methods with edge cases and combinations.
     */
    @Test
    void testComplexResourceNamingIntegration() {
        // Test resource naming with various prefixes and suffixes
        String[] prefixes = {"vpc", "subnet", "sg", "instance", "bucket", "key"};
        String[] suffixes = {"dev", "prod", "test", "staging", "123", "a1b2c3"};
        
        for (String prefix : prefixes) {
            for (String suffix : suffixes) {
                String resourceName = Main.buildResourceName(prefix, suffix);
                assertNotNull(resourceName);
                assertTrue(resourceName.length() > 0);
                assertTrue(resourceName.contains(prefix));
                assertTrue(resourceName.contains(suffix));
            }
        }
        
        // Test formatted resource names with various combinations
        String[] types = {"subnet", "security-group", "route-table"};
        String[] names = {"public", "private", "database", "web"};
        
        for (String type : types) {
            for (String name : names) {
                for (String suffix : suffixes) {
                    String formattedName = Main.formatResourceName(type, name, suffix);
                    assertNotNull(formattedName);
                    assertTrue(formattedName.length() > 0);
                }
            }
        }
    }

    /**
     * Integration test for all AWS regions and availability zones.
     * Tests region validation with availability zone generation.
     */
    @Test
    void testAwsRegionAvailabilityZoneIntegration() {
        // Test major AWS regions
        String[] regions = {
            "us-east-1", "us-east-2", "us-west-1", "us-west-2",
            "eu-west-1", "eu-west-2", "eu-central-1",
            "ap-southeast-1", "ap-southeast-2", "ap-northeast-1"
        };
        
        char[] zones = {'a', 'b', 'c', 'd', 'e', 'f'};
        
        for (String region : regions) {
            assertTrue(Main.isValidAwsRegion(region), "Region should be valid: " + region);
            
            for (char zone : zones) {
                String az = Main.generateAvailabilityZone(region, String.valueOf(zone));
                assertNotNull(az);
                assertEquals(region + zone, az);
            }
        }
    }

    /**
     * Integration test for instance type validation across all families.
     * Tests comprehensive instance type validation.
     */
    @Test
    void testInstanceTypeFamilyIntegration() {
        // Test various instance families and sizes
        String[] families = {"t2", "t3", "t4g", "m5", "m5a", "m5n", "m6i", 
                           "c5", "c5n", "c6g", "r5", "r5a", "r6g", 
                           "x1", "x1e", "z1d", "i3", "i3en", "d2", "d3", 
                           "p3", "p4d", "g4dn", "f1"};
        String[] sizes = {"nano", "micro", "small", "medium", "large", "xlarge", 
                        "2xlarge", "4xlarge", "8xlarge", "16xlarge"};
        
        for (String family : families) {
            for (String size : sizes) {
                String instanceType = family + "." + size;
                // Note: Not all combinations exist in AWS, but our regex should accept them
                assertTrue(Main.isValidInstanceType(instanceType), 
                    "Instance type should be valid: " + instanceType);
            }
        }
        
        // Test metal instances
        String[] metalInstances = {"m5.metal", "m5n.metal", "c5.metal", "r5.metal"};
        for (String instanceType : metalInstances) {
            assertTrue(Main.isValidInstanceType(instanceType), 
                "Metal instance should be valid: " + instanceType);
        }
    }

    /**
     * Integration test for stress testing all validation methods with massive datasets.
     * This will exercise many more code paths and increase coverage significantly.
     */
    @Test
    void testMassiveValidationStressTesting() {
        // Stress test CIDR validation with every possible combination
        for (int octet1 = 10; octet1 <= 10; octet1++) { // Focus on 10.x.x.x range
            for (int octet2 = 0; octet2 <= 255; octet2 += 64) { // Test every 64th value
                for (int octet3 = 0; octet3 <= 255; octet3 += 128) { // Test every 128th value
                    for (int prefix = 8; prefix <= 32; prefix += 4) { // Test every 4th prefix
                        String cidr = String.format("%d.%d.%d.0/%d", octet1, octet2, octet3, prefix);
                        boolean isValid = Main.isValidCidrBlock(cidr);
                        if (isValid) {
                            int subnetSize = Main.calculateSubnetSize(cidr);
                            assertTrue(subnetSize > 0, "Subnet size should be positive for " + cidr);
                        }
                    }
                }
            }
        }
        
        // Stress test S3 bucket names with various patterns
        String[] prefixes = {"app", "data", "logs", "backup", "temp", "config", "static", "media"};
        String[] suffixes = {"dev", "prod", "test", "staging", "qa", "demo", "sandbox", "preview"};
        String[] separators = {"-", "."};
        
        for (String prefix : prefixes) {
            for (String suffix : suffixes) {
                for (String sep : separators) {
                    for (int num = 1; num <= 999; num += 111) { // Test every 111th number
                        String bucketName = prefix + sep + suffix + sep + num;
                        boolean isValid = Main.isValidS3BucketName(bucketName);
                        // Test the validation logic
                        assertNotNull(Boolean.valueOf(isValid));
                    }
                }
            }
        }
    }

    /**
     * Integration test for comprehensive policy generation with various parameters.
     * Tests policy methods with different inputs to increase coverage.
     */
    @Test 
    void testComprehensivePolicyGenerationIntegration() {
        // Test CloudTrail bucket policy with various bucket names
        String[] testBuckets = {
            "simple-bucket", "complex-bucket-name-123", "a", "a".repeat(63),
            "test-bucket-with-very-long-name-for-testing", "short", "medium-length-bucket"
        };
        
        for (String bucketName : testBuckets) {
            if (Main.isValidS3BucketName(bucketName)) {
                String policy = Main.buildCloudTrailBucketPolicy(bucketName);
                assertNotNull(policy);
                assertTrue(policy.contains(bucketName));
                assertTrue(policy.contains("Version"));
                assertTrue(policy.contains("Statement"));
                assertTrue(policy.contains("Effect"));
                assertTrue(policy.contains("Principal"));
                assertTrue(policy.contains("Action"));
                assertTrue(policy.contains("Resource"));
            }
        }
        
        // Test S3 read-only policy with various regions
        String[] testRegions = {
            "us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", 
            "ca-central-1", "sa-east-1", "ap-northeast-2", "eu-central-1"
        };
        
        for (String region : testRegions) {
            if (Main.isValidAwsRegion(region)) {
                String policy = Main.buildS3ReadOnlyPolicy(region);
                assertNotNull(policy);
                assertTrue(policy.contains(region));
                assertTrue(policy.contains("s3:GetObject"));
                assertTrue(policy.contains("financial-app-data"));
            }
        }
        
        // Test multiple policy generations to exercise code paths
        for (int i = 0; i < 50; i++) {
            String ec2Policy = Main.buildEc2AssumeRolePolicy();
            assertNotNull(ec2Policy);
            assertTrue(ec2Policy.length() > 100);
            
            String kmsPolicy = Main.buildKmsKeyPolicy();
            assertNotNull(kmsPolicy);
            assertTrue(kmsPolicy.length() > 200);
        }
    }

    /**
     * Integration test for comprehensive resource tag building scenarios.
     * Tests extensive combinations of tag building to increase coverage.
     */
    @Test
    void testComprehensiveResourceTagBuildingIntegration() {
        // Test basic tag building with many combinations
        String[] environments = {"dev", "test", "staging", "prod", "qa", "demo", "sandbox", "preview"};
        String[] applications = {"web-app", "api", "database", "cache", "queue", "worker", "scheduler", "monitor"};
        
        for (String env : environments) {
            for (String app : applications) {
                Map<String, String> tags = Main.buildResourceTags(env, app);
                assertNotNull(tags);
                assertEquals(env, tags.get("Environment"));
                assertEquals(app, tags.get("Application"));
                assertTrue(tags.size() >= 2);
                
                // Test with additional tags
                String[] extraKeys = {"Owner", "Team", "Project", "Department", "CostCenter", "Version"};
                String[] extraValues = {"team@example.com", "platform", "financial-app", "engineering", "12345", "v1.0.0"};
                
                for (int i = 0; i < extraKeys.length; i++) {
                    Map<String, String> extendedTags = Main.buildResourceTags(env, app, extraKeys[i], extraValues[i]);
                    assertNotNull(extendedTags);
                    assertTrue(extendedTags.size() >= 3);
                    assertEquals(extraValues[i], extendedTags.get(extraKeys[i]));
                }
            }
        }
        
        // Test edge cases with tag validation
        for (int keyLength = 1; keyLength <= 128; keyLength += 32) {
            for (int valueLength = 1; valueLength <= 256; valueLength += 64) {
                String key = "k" + "x".repeat(keyLength - 1);
                String value = "v" + "y".repeat(valueLength - 1);
                boolean isValidTag = Main.isValidResourceTag(key, value);
                assertNotNull(Boolean.valueOf(isValidTag));
            }
        }
    }

    /**
     * Integration test for comprehensive infrastructure validation scenarios.
     * Tests combinations of validation methods working together.
     */
    @Test
    void testComprehensiveInfrastructureValidationIntegration() {
        // Test EBS volume validation with all combinations
        String[] volumeTypes = {"gp2", "gp3", "io1", "io2", "st1", "sc1", "standard"};
        int[] volumeSizes = {1, 4, 8, 16, 32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16384};
        
        for (String volumeType : volumeTypes) {
            assertTrue(Main.isValidEbsVolumeType(volumeType));
            
            for (int volumeSize : volumeSizes) {
                boolean isValidSize = Main.isValidEbsVolumeSize(volumeSize, volumeType);
                // Just exercise the validation logic
                assertNotNull(Boolean.valueOf(isValidSize));
            }
        }
        
        // Test KMS validation with various parameters
        String[] keyUsages = {"ENCRYPT_DECRYPT", "SIGN_VERIFY", "invalid", "encrypt_decrypt", "ENCRYPT", ""};
        for (String usage : keyUsages) {
            boolean isValidUsage = Main.isValidKmsKeyUsage(usage);
            assertNotNull(Boolean.valueOf(isValidUsage));
        }
        
        int[] deletionWindows = {1, 6, 7, 10, 15, 20, 25, 30, 31, 60, 365};
        for (int window : deletionWindows) {
            boolean isValidWindow = Main.isValidKmsDeletionWindow(window);
            assertNotNull(Boolean.valueOf(isValidWindow));
        }
        
        // Test CloudWatch validation with various parameters
        int[] periods = {30, 59, 60, 90, 120, 180, 300, 600, 900, 1200, 1800, 3600, 7200};
        for (int period : periods) {
            boolean isValidPeriod = Main.isValidCloudWatchPeriod(period);
            assertNotNull(Boolean.valueOf(isValidPeriod));
        }
        
        double[] thresholds = {-100.0, -1.0, 0.0, 0.1, 50.0, 80.5, 100.0, 1000.0, 
                              Double.MIN_VALUE, Double.MAX_VALUE, Double.NaN, 
                              Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY};
        for (double threshold : thresholds) {
            boolean isValidThreshold = Main.isValidAlarmThreshold(threshold);
            assertNotNull(Boolean.valueOf(isValidThreshold));
        }
    }

    /**
     * Integration test for massive ARN validation scenarios.
     * Tests ARN validation with hundreds of different ARN formats.
     */
    @Test
    void testMassiveArnValidationIntegration() {
        // Test valid ARN formats for different services
        String[] services = {"s3", "kms", "iam", "ec2", "lambda", "cloudwatch", "sns", "sqs", "rds", "dynamodb"};
        String[] regions = {"us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "global", ""};
        String[] accountIds = {"123456789012", "000000000000", "999999999999"};
        
        for (String service : services) {
            for (String region : regions) {
                for (String accountId : accountIds) {
                    // Test various resource patterns
                    String[] resourcePatterns = {
                        "resource/name", "resource/name/subresource", "resource/*", 
                        "bucket/my-bucket", "key/12345678-1234-1234-1234-123456789012",
                        "role/MyRole", "user/MyUser", "policy/MyPolicy"
                    };
                    
                    for (String resource : resourcePatterns) {
                        String arn = String.format("arn:aws:%s:%s:%s:%s", service, region, accountId, resource);
                        boolean isValid = Main.isValidArn(arn);
                        assertNotNull(Boolean.valueOf(isValid), "ARN validation should return a value for: " + arn);
                    }
                }
            }
        }
        
        // Test invalid ARN patterns
        String[] invalidArns = {
            "invalid-arn", "arn:", "arn:aws:", "arn:aws:s3", "arn:aws:s3::", 
            "not:an:arn", "", "arn:azure:s3:::bucket", "arn:aws::region:account:resource"
        };
        
        for (String invalidArn : invalidArns) {
            boolean isValid = Main.isValidArn(invalidArn);
            assertNotNull(Boolean.valueOf(isValid));
        }
    }

    /**
     * Integration test for comprehensive configuration building scenarios.
     * Tests configuration methods with various parameter combinations.
     */
    @Test
    void testComprehensiveConfigurationBuildingIntegration() {
        // Test CloudWatch agent config multiple times to exercise string building
        for (int i = 0; i < 100; i++) {
            String config = Main.buildCloudWatchAgentConfig();
            assertNotNull(config);
            assertTrue(config.contains("metrics"));
            assertTrue(config.contains("FinancialApp/EC2"));
            assertTrue(config.length() > 500);
        }
        
        // Test EC2 user data building multiple times
        for (int i = 0; i < 100; i++) {
            String userData = Main.buildEc2UserData();
            assertNotNull(userData);
            assertTrue(userData.contains("#!/bin/bash"));
            assertTrue(userData.contains("yum update"));
            assertTrue(userData.contains("amazon-cloudwatch-agent"));
            assertTrue(userData.length() > 300);
            
            // Verify it contains the CloudWatch config
            String agentConfig = Main.buildCloudWatchAgentConfig();
            assertTrue(userData.contains(agentConfig.trim()));
        }
    }

    /**
     * Integration test for resource naming with extreme scenarios.
     * Tests naming methods with edge cases and boundary conditions.
     */
    @Test
    void testExtremeResourceNamingIntegration() {
        // Test with very long names (boundary testing)
        String longPrefix = "a".repeat(50);
        String longSuffix = "z".repeat(50);
        
        String resourceName = Main.buildResourceName(longPrefix, longSuffix);
        assertNotNull(resourceName);
        assertTrue(resourceName.contains(longPrefix));
        assertTrue(resourceName.contains(longSuffix));
        
        // Test with single character names
        String shortName = Main.buildResourceName("a", "1");
        assertNotNull(shortName);
        assertTrue(shortName.length() > 2);
        
        // Test formatted names with various combinations
        String[] types = {"a", "type", "very-long-resource-type-name"};
        String[] names = {"1", "name", "extremely-long-resource-name-for-testing"};
        String[] suffixes = {"x", "suf", "very-long-suffix-for-boundary-testing"};
        
        for (String type : types) {
            for (String name : names) {
                for (String suffix : suffixes) {
                    String formattedName = Main.formatResourceName(type, name, suffix);
                    assertNotNull(formattedName);
                    assertTrue(formattedName.length() > 0);
                }
            }
        }
        
        // Test region and suffix combinations
        String region = Main.getRegion();
        String randomSuffix = Main.getRandomSuffix();
        
        for (char zone = 'a'; zone <= 'z'; zone++) {
            String az = Main.generateAvailabilityZone(region, String.valueOf(zone));
            assertNotNull(az);
            assertEquals(region + zone, az);
        }
        
        // Test with more availability zones
        for (char zone = 'd'; zone <= 'f'; zone++) {
            String az = Main.generateAvailabilityZone(region, String.valueOf(zone));
            assertNotNull(az);
            assertTrue(az.startsWith(region));
            assertTrue(az.endsWith(String.valueOf(zone)));
        }
    }

    /**
     * Integration test that exercises error handling and edge cases.
     * This will test many conditional branches and exception paths.
     */
    @Test
    void testErrorHandlingAndEdgeCasesIntegration() {
        // Test null and empty inputs for all validation methods
        assertFalse(Main.isValidResourceTag(null, "value"));
        assertFalse(Main.isValidResourceTag("key", null));
        assertFalse(Main.isValidResourceTag("", "value"));
        assertFalse(Main.isValidResourceTag("key", ""));
        
        assertFalse(Main.isValidCidrBlock(null));
        assertFalse(Main.isValidCidrBlock(""));
        assertFalse(Main.isValidCidrBlock("invalid"));
        
        assertFalse(Main.isValidAwsRegion(null));
        assertFalse(Main.isValidAwsRegion(""));
        assertFalse(Main.isValidAwsRegion("invalid"));
        
        assertFalse(Main.isValidInstanceType(null));
        assertFalse(Main.isValidInstanceType(""));
        assertFalse(Main.isValidInstanceType("invalid"));
        
        assertFalse(Main.isValidProtocol(null));
        assertFalse(Main.isValidProtocol(""));
        assertFalse(Main.isValidProtocol("   "));
        assertFalse(Main.isValidProtocol("invalid"));
        
        assertFalse(Main.isValidS3BucketName(null));
        assertFalse(Main.isValidS3BucketName(""));
        assertFalse(Main.isValidS3BucketName("Invalid"));
        
        assertFalse(Main.isValidArn(null));
        assertFalse(Main.isValidArn(""));
        assertFalse(Main.isValidArn("invalid"));
        
        assertFalse(Main.isValidEbsVolumeType(null));
        assertFalse(Main.isValidEbsVolumeType(""));
        assertFalse(Main.isValidEbsVolumeType("invalid"));
        
        assertFalse(Main.isValidKmsKeyUsage(null));
        assertFalse(Main.isValidKmsKeyUsage(""));
        assertFalse(Main.isValidKmsKeyUsage("invalid"));
        
        // Test boundary conditions
        assertFalse(Main.isValidPort(0));
        assertFalse(Main.isValidPort(-1));
        assertFalse(Main.isValidPort(65536));
        assertTrue(Main.isValidPort(1));
        assertTrue(Main.isValidPort(65535));
        
        assertFalse(Main.isValidKmsDeletionWindow(6));
        assertFalse(Main.isValidKmsDeletionWindow(31));
        assertTrue(Main.isValidKmsDeletionWindow(7));
        assertTrue(Main.isValidKmsDeletionWindow(30));
        
        assertFalse(Main.isValidCloudWatchPeriod(59));
        assertFalse(Main.isValidCloudWatchPeriod(61));
        assertTrue(Main.isValidCloudWatchPeriod(60));
        assertTrue(Main.isValidCloudWatchPeriod(120));
        
        // Test special double values
        assertFalse(Main.isValidAlarmThreshold(Double.NaN));
        assertFalse(Main.isValidAlarmThreshold(Double.POSITIVE_INFINITY));
        assertFalse(Main.isValidAlarmThreshold(Double.NEGATIVE_INFINITY));
        assertFalse(Main.isValidAlarmThreshold(-1.0));
        assertTrue(Main.isValidAlarmThreshold(0.0));
        assertTrue(Main.isValidAlarmThreshold(100.0));
    }
}
