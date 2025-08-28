package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

/**
 * Comprehensive unit tests for WebAppStackConfig class.
 * Tests all configuration methods, constants, and validation logic.
 */
public class WebAppStackConfigTest {

    private String originalEnvironmentSuffix;

    @BeforeEach
    void setUp() {
        // Store original environment variable if it exists
        originalEnvironmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
    }

    @AfterEach
    void tearDown() {
        // Cannot restore environment variables in JVM, but document this limitation
    }

    @Test
    void testConstructorIsPrivate() {
        assertDoesNotThrow(() -> {
            Constructor<WebAppStackConfig> constructor = WebAppStackConfig.class.getDeclaredConstructor();
            assertTrue(java.lang.reflect.Modifier.isPrivate(constructor.getModifiers()));
            
            constructor.setAccessible(true);
            assertThrows(InvocationTargetException.class, constructor::newInstance);
        });
    }

    @Test
    void testDefaultEnvironmentSuffix() {
        assertEquals("synthtrainr347", WebAppStackConfig.DEFAULT_ENVIRONMENT_SUFFIX);
    }

    @Test
    void testVpcCidr() {
        assertEquals("10.0.0.0/16", WebAppStackConfig.VPC_CIDR);
    }

    @Test
    void testSubnetCidrs() {
        assertEquals("10.0.1.0/24", WebAppStackConfig.SUBNET1_CIDR);
        assertEquals("10.0.2.0/24", WebAppStackConfig.SUBNET2_CIDR);
    }

    @Test
    void testInstanceType() {
        assertEquals("t3.micro", WebAppStackConfig.INSTANCE_TYPE);
    }

    @Test
    void testAutoScalingConfiguration() {
        assertEquals(2, WebAppStackConfig.MIN_SIZE);
        assertEquals(4, WebAppStackConfig.MAX_SIZE);
        assertEquals(2, WebAppStackConfig.DESIRED_CAPACITY);
    }

    @Test
    void testHealthCheckConfiguration() {
        assertEquals(30, WebAppStackConfig.HEALTH_CHECK_INTERVAL);
        assertEquals(5, WebAppStackConfig.HEALTH_CHECK_TIMEOUT);
        assertEquals(2, WebAppStackConfig.HEALTHY_THRESHOLD);
        assertEquals(2, WebAppStackConfig.UNHEALTHY_THRESHOLD);
        assertEquals(300, WebAppStackConfig.HEALTH_CHECK_GRACE_PERIOD);
        assertEquals("/", WebAppStackConfig.HEALTH_CHECK_PATH);
    }

    @Test
    void testPortConfiguration() {
        assertEquals(80, WebAppStackConfig.HTTP_PORT);
        assertEquals(443, WebAppStackConfig.HTTPS_PORT);
    }

    @Test
    void testLoadBalancerConfiguration() {
        assertEquals("application", WebAppStackConfig.LOAD_BALANCER_TYPE);
        assertEquals("HTTP", WebAppStackConfig.HTTP_PROTOCOL);
        assertEquals("tcp", WebAppStackConfig.TCP_PROTOCOL);
    }

    @Test
    void testGetEnvironmentSuffixWithDefault() {
        // When ENVIRONMENT_SUFFIX is not set, should return default
        String suffix = WebAppStackConfig.getEnvironmentSuffix();
        if (originalEnvironmentSuffix == null || originalEnvironmentSuffix.isEmpty()) {
            assertEquals(WebAppStackConfig.DEFAULT_ENVIRONMENT_SUFFIX, suffix);
        } else {
            assertEquals(originalEnvironmentSuffix, suffix);
        }
    }

    @Test
    void testCreateTags() {
        String environmentSuffix = "test123";
        Map<String, String> tags = WebAppStackConfig.createTags(environmentSuffix);
        
        assertNotNull(tags);
        assertEquals(4, tags.size());
        assertEquals("Production", tags.get("Environment"));
        assertEquals("trainr347", tags.get("Project"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertEquals(environmentSuffix, tags.get("EnvironmentSuffix"));
    }

    @Test
    void testGenerateBucketName() {
        String environmentSuffix = "Test123";
        String bucketName = WebAppStackConfig.generateBucketName(environmentSuffix);
        
        assertEquals("webapp-code-bucket-test123", bucketName);
        assertTrue(bucketName.equals(bucketName.toLowerCase()));
    }

    @Test
    void testGenerateBucketNameWithSpecialCharacters() {
        String environmentSuffix = "PR-123_TEST";
        String bucketName = WebAppStackConfig.generateBucketName(environmentSuffix);
        
        assertEquals("webapp-code-bucket-pr-123_test", bucketName);
    }

    @Test
    void testGenerateResourceName() {
        String baseName = "webapp-vpc";
        String environmentSuffix = "test123";
        String resourceName = WebAppStackConfig.generateResourceName(baseName, environmentSuffix);
        
        assertEquals("webapp-vpc-test123", resourceName);
    }

    @Test
    void testGenerateResourceNameWithEmptySuffix() {
        String baseName = "webapp-vpc";
        String environmentSuffix = "";
        String resourceName = WebAppStackConfig.generateResourceName(baseName, environmentSuffix);
        
        assertEquals("webapp-vpc-", resourceName);
    }

    @Test
    void testGenerateLaunchTemplatePrefix() {
        String environmentSuffix = "test123";
        String prefix = WebAppStackConfig.generateLaunchTemplatePrefix(environmentSuffix);
        
        assertEquals("webapp-test123-", prefix);
    }

    @Test
    void testCreateAssumeRolePolicy() {
        String policy = WebAppStackConfig.createAssumeRolePolicy();
        
        assertNotNull(policy);
        assertTrue(policy.contains("2012-10-17"));
        assertTrue(policy.contains("sts:AssumeRole"));
        assertTrue(policy.contains("ec2.amazonaws.com"));
        assertTrue(policy.contains("Allow"));
        
        // Verify it's valid JSON structure
        assertTrue(policy.startsWith("{"));
        assertTrue(policy.endsWith("}"));
        assertTrue(policy.contains("Version"));
        assertTrue(policy.contains("Statement"));
    }

    @Test
    void testCreateS3AccessPolicy() {
        String policy = WebAppStackConfig.createS3AccessPolicy();
        
        assertNotNull(policy);
        assertTrue(policy.contains("2012-10-17"));
        assertTrue(policy.contains("s3:GetObject"));
        assertTrue(policy.contains("s3:ListBucket"));
        assertTrue(policy.contains("Allow"));
        
        // Verify it's valid JSON structure
        assertTrue(policy.startsWith("{"));
        assertTrue(policy.endsWith("}"));
        assertTrue(policy.contains("Version"));
        assertTrue(policy.contains("Statement"));
        assertTrue(policy.contains("Action"));
        assertTrue(policy.contains("Resource"));
    }

    @Test
    void testCreateUserDataScript() {
        String bucketName = "test-bucket-123";
        String userData = WebAppStackConfig.createUserDataScript(bucketName);
        
        assertNotNull(userData);
        assertTrue(userData.contains("#!/bin/bash"));
        assertTrue(userData.contains("yum update -y"));
        assertTrue(userData.contains("yum install -y httpd"));
        assertTrue(userData.contains("systemctl start httpd"));
        assertTrue(userData.contains("systemctl enable httpd"));
        assertTrue(userData.contains("Web Application"));
        assertTrue(userData.contains(bucketName));
        assertTrue(userData.contains("aws s3 cp"));
        assertTrue(userData.contains("ec2-metadata"));
        assertTrue(userData.contains("tar -xzf"));
    }

    @Test
    void testCreateUserDataScriptWithSpecialBucketName() {
        String bucketName = "webapp-code-bucket-pr123";
        String userData = WebAppStackConfig.createUserDataScript(bucketName);
        
        assertTrue(userData.contains("s3://" + bucketName + "/app.tar.gz"));
    }

    @Test
    void testValidateConfigurationWithValidValues() {
        // All configuration constants should be valid by design
        assertTrue(WebAppStackConfig.validateConfiguration());
    }

    @Test
    void testGetExpectedExports() {
        String[] exports = WebAppStackConfig.getExpectedExports();
        
        assertNotNull(exports);
        assertEquals(9, exports.length);
        
        // Verify all expected exports are present
        assertTrue(java.util.Arrays.asList(exports).contains("loadBalancerDnsName"));
        assertTrue(java.util.Arrays.asList(exports).contains("applicationUrl"));
        assertTrue(java.util.Arrays.asList(exports).contains("applicationUrlHttps"));
        assertTrue(java.util.Arrays.asList(exports).contains("vpcId"));
        assertTrue(java.util.Arrays.asList(exports).contains("publicSubnet1Id"));
        assertTrue(java.util.Arrays.asList(exports).contains("publicSubnet2Id"));
        assertTrue(java.util.Arrays.asList(exports).contains("autoScalingGroupName"));
        assertTrue(java.util.Arrays.asList(exports).contains("targetGroupArn"));
        assertTrue(java.util.Arrays.asList(exports).contains("codeBucketName"));
    }

    @Test
    void testConfigurationConsistency() {
        // Test that min_size <= desired_capacity <= max_size
        assertTrue(WebAppStackConfig.MIN_SIZE <= WebAppStackConfig.DESIRED_CAPACITY);
        assertTrue(WebAppStackConfig.DESIRED_CAPACITY <= WebAppStackConfig.MAX_SIZE);
        
        // Test that health check timeout < interval
        assertTrue(WebAppStackConfig.HEALTH_CHECK_TIMEOUT < WebAppStackConfig.HEALTH_CHECK_INTERVAL);
        
        // Test that ports are valid
        assertTrue(WebAppStackConfig.HTTP_PORT > 0 && WebAppStackConfig.HTTP_PORT <= 65535);
        assertTrue(WebAppStackConfig.HTTPS_PORT > 0 && WebAppStackConfig.HTTPS_PORT <= 65535);
        
        // Test that thresholds are positive
        assertTrue(WebAppStackConfig.HEALTHY_THRESHOLD > 0);
        assertTrue(WebAppStackConfig.UNHEALTHY_THRESHOLD > 0);
    }

    @Test
    void testSubnetCidrNonOverlapping() {
        // Verify that subnet CIDRs don't overlap and are within VPC CIDR
        assertTrue(WebAppStackConfig.SUBNET1_CIDR.startsWith("10.0.1."));
        assertTrue(WebAppStackConfig.SUBNET2_CIDR.startsWith("10.0.2."));
        assertFalse(WebAppStackConfig.SUBNET1_CIDR.equals(WebAppStackConfig.SUBNET2_CIDR));
    }

    @Test
    void testImmutableConstants() {
        // Test that we can't modify constants through reflection would require more complex setup
        // For now, verify they are static final
        assertDoesNotThrow(() -> {
            var field = WebAppStackConfig.class.getField("VPC_CIDR");
            assertTrue(java.lang.reflect.Modifier.isStatic(field.getModifiers()));
            assertTrue(java.lang.reflect.Modifier.isFinal(field.getModifiers()));
        });
    }

    @Test
    void testPolicyJsonStructure() {
        String assumeRolePolicy = WebAppStackConfig.createAssumeRolePolicy();
        String s3Policy = WebAppStackConfig.createS3AccessPolicy();
        
        // Both policies should be well-formed JSON strings
        int braceCountAssume = countChar(assumeRolePolicy, '{') - countChar(assumeRolePolicy, '}');
        int braceCountS3 = countChar(s3Policy, '{') - countChar(s3Policy, '}');
        
        assertEquals(0, braceCountAssume, "Assume role policy should have balanced braces");
        assertEquals(0, braceCountS3, "S3 policy should have balanced braces");
    }

    private int countChar(final String str, final char ch) {
        return (int) str.chars().filter(c -> c == ch).count();
    }
}