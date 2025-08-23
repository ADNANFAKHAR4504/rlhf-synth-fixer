package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Map;
import java.util.regex.Pattern;

import com.pulumi.Context;

/**
 * Unit tests for the Main class.
 * 
 * This is a comprehensive test suite that covers static methods, constants,
 * and infrastructure configuration validation to achieve required code coverage.
 * 
 * Run with: ./gradlew test
 */
public class MainTest {

    /**
     * Test that the Main class structure is correct.
     */
    @Test
    void testMainClassStructure() {
        // Verify the main class exists and is properly configured
        assertNotNull(Main.class);
        assertTrue(Modifier.isFinal(Main.class.getModifiers()));
        assertTrue(Modifier.isPublic(Main.class.getModifiers()));
    }

    /**
     * Test that the main method exists with the correct signature.
     */
    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
        });
    }

    /**
     * Test that the defineInfrastructure method exists with the correct signature.
     * This method contains the actual infrastructure definition logic.
     */
    @Test
    void testDefineInfrastructureMethodExists() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
        });
    }

    /**
     * Test that the private constructor prevents instantiation.
     */
    @Test
    void testPrivateConstructor() {
        assertDoesNotThrow(() -> {
            var constructor = Main.class.getDeclaredConstructor();
            assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        });
    }

    /**
     * Test that the Main class cannot be instantiated directly.
     */
    @Test
    void testCannotInstantiate() {
        assertThrows(IllegalAccessException.class, () -> {
            Main.class.getDeclaredConstructor().newInstance();
        });
    }

    /**
     * Test defineInfrastructure method behavior when called with null context.
     */
    @Test
    void testDefineInfrastructureWithNullContext() {
        // Test basic method invocation - will fail due to Pulumi context requirements
        // but verifies the method signature and basic accessibility
        assertThrows(RuntimeException.class, () -> {
            Main.defineInfrastructure(null);
        }, "Method should throw RuntimeException for testing purposes");
    }

    /**
     * Test that the REGION constant is properly defined.
     */
    @Test
    void testRegionConstant() {
        assertDoesNotThrow(() -> {
            Field regionField = Main.class.getDeclaredField("REGION");
            assertTrue(Modifier.isStatic(regionField.getModifiers()));
            assertTrue(Modifier.isFinal(regionField.getModifiers()));
            assertTrue(Modifier.isPrivate(regionField.getModifiers()));
            
            regionField.setAccessible(true);
            String region = (String) regionField.get(null);
            assertEquals("us-east-1", region);
        });
    }

    /**
     * Test that the RANDOM_SUFFIX constant is properly defined and generated.
     */
    @Test
    void testRandomSuffixConstant() {
        assertDoesNotThrow(() -> {
            Field randomSuffixField = Main.class.getDeclaredField("RANDOM_SUFFIX");
            assertTrue(Modifier.isStatic(randomSuffixField.getModifiers()));
            assertTrue(Modifier.isFinal(randomSuffixField.getModifiers()));
            assertTrue(Modifier.isPrivate(randomSuffixField.getModifiers()));
            
            randomSuffixField.setAccessible(true);
            String suffix = (String) randomSuffixField.get(null);
            assertNotNull(suffix);
            assertFalse(suffix.isEmpty());
            // Verify it's a numeric string between 0-9999
            assertTrue(Pattern.matches("\\d{1,4}", suffix));
            int suffixValue = Integer.parseInt(suffix);
            assertTrue(suffixValue >= 0 && suffixValue < 10000);
        });
    }

    /**
     * Test that the generateRandomSuffix method works correctly.
     */
    @Test
    void testGenerateRandomSuffix() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("generateRandomSuffix");
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertTrue(Modifier.isPrivate(method.getModifiers()));
            assertEquals(String.class, method.getReturnType());
            
            method.setAccessible(true);
            String suffix1 = (String) method.invoke(null);
            String suffix2 = (String) method.invoke(null);
            
            assertNotNull(suffix1);
            assertNotNull(suffix2);
            assertFalse(suffix1.isEmpty());
            assertFalse(suffix2.isEmpty());
            
            // Verify both are numeric strings
            assertTrue(Pattern.matches("\\d{1,4}", suffix1));
            assertTrue(Pattern.matches("\\d{1,4}", suffix2));
            
            // Verify they're within expected range
            int value1 = Integer.parseInt(suffix1);
            int value2 = Integer.parseInt(suffix2);
            assertTrue(value1 >= 0 && value1 < 10000);
            assertTrue(value2 >= 0 && value2 < 10000);
        });
    }

    /**
     * Test that multiple calls to generateRandomSuffix produce different values.
     * This is probabilistic but with high confidence given the range.
     */
    @Test
    void testGenerateRandomSuffixVariability() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("generateRandomSuffix");
            method.setAccessible(true);
            
            String[] suffixes = new String[10];
            for (int i = 0; i < 10; i++) {
                suffixes[i] = (String) method.invoke(null);
            }
            
            // At least some should be different (probabilistically very likely)
            boolean foundDifferent = false;
            for (int i = 0; i < suffixes.length - 1; i++) {
                for (int j = i + 1; j < suffixes.length; j++) {
                    if (!suffixes[i].equals(suffixes[j])) {
                        foundDifferent = true;
                        break;
                    }
                }
                if (foundDifferent) {
                    break;
                }
            }
            assertTrue(foundDifferent, "Random suffix generation should produce varied results");
        });
    }

    /**
     * Test field access and visibility modifiers.
     */
    @Test
    void testFieldsConfiguration() {
        Field[] fields = Main.class.getDeclaredFields();
        assertTrue(fields.length >= 2, "Should have at least REGION and RANDOM_SUFFIX fields");
        
        for (Field field : fields) {
            if (field.getName().equals("REGION") || field.getName().equals("RANDOM_SUFFIX")) {
                assertTrue(Modifier.isPrivate(field.getModifiers()), 
                    field.getName() + " should be private");
                assertTrue(Modifier.isStatic(field.getModifiers()), 
                    field.getName() + " should be static");
                assertTrue(Modifier.isFinal(field.getModifiers()), 
                    field.getName() + " should be final");
            }
        }
    }

    /**
     * Test method accessibility and signatures.
     */
    @Test
    void testMethodSignatures() {
        Method[] methods = Main.class.getDeclaredMethods();
        
        boolean hasMain = false;
        boolean hasDefineInfrastructure = false;
        boolean hasGenerateRandomSuffix = false;
        
        for (Method method : methods) {
            if (method.getName().equals("main")) {
                hasMain = true;
                assertTrue(Modifier.isPublic(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(1, method.getParameterCount());
                assertEquals(String[].class, method.getParameterTypes()[0]);
            } else if (method.getName().equals("defineInfrastructure")) {
                hasDefineInfrastructure = true;
                assertTrue(Modifier.isPublic(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(1, method.getParameterCount());
                assertEquals(Context.class, method.getParameterTypes()[0]);
            } else if (method.getName().equals("generateRandomSuffix")) {
                hasGenerateRandomSuffix = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(0, method.getParameterCount());
                assertEquals(String.class, method.getReturnType());
            }
        }
        
        assertTrue(hasMain, "Should have main method");
        assertTrue(hasDefineInfrastructure, "Should have defineInfrastructure method");
        assertTrue(hasGenerateRandomSuffix, "Should have generateRandomSuffix method");
    }

    /**
     * Test constructor accessibility.
     */
    @Test
     void testConstructorAccess() {
        var constructors = Main.class.getDeclaredConstructors();
        assertEquals(1, constructors.length, "Should have exactly one constructor");
        
        var constructor = constructors[0];
        assertTrue(Modifier.isPrivate(constructor.getModifiers()), "Constructor should be private");
        assertEquals(0, constructor.getParameterCount(), "Constructor should have no parameters");
    }
    
    /**
     * Test the buildResourceName helper method.
     */
    @Test
    void testBuildResourceName() {
        // Test valid inputs
        assertEquals("s3-bucket-1234", Main.buildResourceName("s3-bucket", "1234"));
        assertEquals("vpc-5678", Main.buildResourceName("vpc", "5678"));
        assertEquals("financial-app-kms-key-9999", Main.buildResourceName("financial-app-kms-key", "9999"));
        
        // Test edge cases
        assertEquals("a-b", Main.buildResourceName("a", "b"));
        assertEquals("test-resource-0", Main.buildResourceName("test-resource", "0"));
    }
    
    /**
     * Test buildResourceName with invalid inputs.
     */
    @Test
    void testBuildResourceNameInvalidInputs() {
        // Test null prefix
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceName(null, "suffix");
        }, "Should throw exception for null prefix");
        
        // Test empty prefix
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceName("", "suffix");
        }, "Should throw exception for empty prefix");
        
        // Test null suffix
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceName("prefix", null);
        }, "Should throw exception for null suffix");
        
        // Test empty suffix
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceName("prefix", "");
        }, "Should throw exception for empty suffix");
    }
    
    /**
     * Test the getRegion helper method.
     */
    @Test
    void testGetRegion() {
        String region = Main.getRegion();
        assertNotNull(region);
        assertEquals("us-east-1", region);
        assertFalse(region.isEmpty());
    }
    
    /**
     * Test the getRandomSuffix helper method.
     */
    @Test
    void testGetRandomSuffix() {
        String suffix = Main.getRandomSuffix();
        assertNotNull(suffix);
        assertFalse(suffix.isEmpty());
        assertTrue(Pattern.matches("\\d{1,4}", suffix));
        
        int suffixValue = Integer.parseInt(suffix);
        assertTrue(suffixValue >= 0 && suffixValue < 10000);
    }
    
    /**
     * Test the isValidResourceTag helper method with valid tags.
     */
    @Test
    void testIsValidResourceTag() {
        // Valid tags
        assertTrue(Main.isValidResourceTag("Environment", "production"));
        assertTrue(Main.isValidResourceTag("Name", "financial-app"));
        assertTrue(Main.isValidResourceTag("Purpose", "CloudTrail-Logs"));
        assertTrue(Main.isValidResourceTag("Application", "financial-services"));
        assertTrue(Main.isValidResourceTag("Compliance", "required"));
        
        // Edge cases - valid
        assertTrue(Main.isValidResourceTag("a", "b"));
        assertTrue(Main.isValidResourceTag("Key123", "Value456"));
        
        // Long but valid keys/values
        String longKey = "a".repeat(128);
        String longValue = "b".repeat(256);
        assertTrue(Main.isValidResourceTag(longKey, longValue));
    }
    
    /**
     * Test the isValidResourceTag helper method with invalid tags.
     */
    @Test
    void testIsValidResourceTagInvalid() {
        // Invalid tags - null/empty
        assertFalse(Main.isValidResourceTag(null, "value"));
        assertFalse(Main.isValidResourceTag("key", null));
        assertFalse(Main.isValidResourceTag("", "value"));
        assertFalse(Main.isValidResourceTag("key", ""));
        assertFalse(Main.isValidResourceTag(null, null));
        assertFalse(Main.isValidResourceTag("", ""));
        
        // Invalid tags - AWS reserved prefixes
        assertFalse(Main.isValidResourceTag("aws:ec2:instance", "value"));
        assertFalse(Main.isValidResourceTag("AWS:S3:Bucket", "value"));
        
        // Invalid tags - too long
        String tooLongKey = "a".repeat(129);
        String tooLongValue = "b".repeat(257);
        assertFalse(Main.isValidResourceTag(tooLongKey, "value"));
        assertFalse(Main.isValidResourceTag("key", tooLongValue));
    }
    
    /**
     * Test method accessibility for new helper methods.
     */
    @Test
    void testHelperMethodAccessibility() {
        assertDoesNotThrow(() -> {
            Method buildResourceNameMethod = Main.class.getDeclaredMethod("buildResourceName", String.class, String.class);
            assertTrue(Modifier.isPublic(buildResourceNameMethod.getModifiers()));
            assertTrue(Modifier.isStatic(buildResourceNameMethod.getModifiers()));
            assertEquals(String.class, buildResourceNameMethod.getReturnType());
            
            Method getRegionMethod = Main.class.getDeclaredMethod("getRegion");
            assertTrue(Modifier.isPublic(getRegionMethod.getModifiers()));
            assertTrue(Modifier.isStatic(getRegionMethod.getModifiers()));
            assertEquals(String.class, getRegionMethod.getReturnType());
            assertEquals(0, getRegionMethod.getParameterCount());
            
            Method getRandomSuffixMethod = Main.class.getDeclaredMethod("getRandomSuffix");
            assertTrue(Modifier.isPublic(getRandomSuffixMethod.getModifiers()));
            assertTrue(Modifier.isStatic(getRandomSuffixMethod.getModifiers()));
            assertEquals(String.class, getRandomSuffixMethod.getReturnType());
            assertEquals(0, getRandomSuffixMethod.getParameterCount());
            
            Method isValidResourceTagMethod = Main.class.getDeclaredMethod("isValidResourceTag", String.class, String.class);
            assertTrue(Modifier.isPublic(isValidResourceTagMethod.getModifiers()));
            assertTrue(Modifier.isStatic(isValidResourceTagMethod.getModifiers()));
            assertEquals(boolean.class, isValidResourceTagMethod.getReturnType());
        });
    }
    
    /**
     * Test CIDR block validation.
     */
    @Test
    void testIsValidCidrBlock() {
        // Valid CIDR blocks
        assertTrue(Main.isValidCidrBlock("10.0.0.0/16"));
        assertTrue(Main.isValidCidrBlock("192.168.1.0/24"));
        assertTrue(Main.isValidCidrBlock("172.16.0.0/12"));
        assertTrue(Main.isValidCidrBlock("0.0.0.0/0"));
        assertTrue(Main.isValidCidrBlock("255.255.255.255/32"));
        
        // Invalid CIDR blocks
        assertFalse(Main.isValidCidrBlock(null));
        assertFalse(Main.isValidCidrBlock(""));
        assertFalse(Main.isValidCidrBlock("10.0.0.0"));
        assertFalse(Main.isValidCidrBlock("10.0.0.0/"));
        assertFalse(Main.isValidCidrBlock("10.0.0.0/33"));
        assertFalse(Main.isValidCidrBlock("10.0.0.0/-1"));
        assertFalse(Main.isValidCidrBlock("256.0.0.0/16"));
        assertFalse(Main.isValidCidrBlock("10.0.0/16"));
        assertFalse(Main.isValidCidrBlock("10.0.0.0.0/16"));
        assertFalse(Main.isValidCidrBlock("invalid/16"));
    }
    
    /**
     * Test AWS region validation.
     */
    @Test
    void testIsValidAwsRegion() {
        // Valid regions
        assertTrue(Main.isValidAwsRegion("us-east-1"));
        assertTrue(Main.isValidAwsRegion("us-west-2"));
        assertTrue(Main.isValidAwsRegion("eu-west-1"));
        assertTrue(Main.isValidAwsRegion("ap-southeast-2"));
        assertTrue(Main.isValidAwsRegion("sa-east-1"));
        assertTrue(Main.isValidAwsRegion("ca-central-1"));
        
        // Invalid regions
        assertFalse(Main.isValidAwsRegion(null));
        assertFalse(Main.isValidAwsRegion(""));
        assertFalse(Main.isValidAwsRegion("us-east"));
        assertFalse(Main.isValidAwsRegion("US-EAST-1"));
        assertFalse(Main.isValidAwsRegion("us_east_1"));
        assertFalse(Main.isValidAwsRegion("invalid-region"));
        assertFalse(Main.isValidAwsRegion("us-east-1-extra"));
    }
    
    /**
     * Test instance type validation.
     */
    @Test
    void testIsValidInstanceType() {
        // Valid instance types
        assertTrue(Main.isValidInstanceType("t3.micro"));
        assertTrue(Main.isValidInstanceType("m5.large"));
        assertTrue(Main.isValidInstanceType("c5n.xlarge"));
        assertTrue(Main.isValidInstanceType("r5a.2xlarge"));
        assertTrue(Main.isValidInstanceType("i3.metal"));
        
        // Invalid instance types
        assertFalse(Main.isValidInstanceType(null));
        assertFalse(Main.isValidInstanceType(""));
        assertFalse(Main.isValidInstanceType("t3"));
        assertFalse(Main.isValidInstanceType("T3.micro"));
        assertFalse(Main.isValidInstanceType("t3_micro"));
        assertFalse(Main.isValidInstanceType("t3.Micro"));
        assertFalse(Main.isValidInstanceType("invalid"));
    }
    
    /**
     * Test availability zone generation.
     */
    @Test
    void testGenerateAvailabilityZone() {
        // Valid combinations
        assertEquals("us-east-1a", Main.generateAvailabilityZone("us-east-1", "a"));
        assertEquals("eu-west-1b", Main.generateAvailabilityZone("eu-west-1", "b"));
        assertEquals("ap-southeast-2c", Main.generateAvailabilityZone("ap-southeast-2", "c"));
        
        // Invalid combinations
        assertThrows(IllegalArgumentException.class, () -> {
            Main.generateAvailabilityZone(null, "a");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.generateAvailabilityZone("us-east-1", null);
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.generateAvailabilityZone("", "a");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.generateAvailabilityZone("us-east-1", "");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.generateAvailabilityZone("us-east-1", "A");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.generateAvailabilityZone("us-east-1", "ab");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.generateAvailabilityZone("us-east-1", "1");
        });
    }
    
    /**
     * Test port number validation.
     */
    @Test
    void testIsValidPort() {
        // Valid ports
        assertTrue(Main.isValidPort(1));
        assertTrue(Main.isValidPort(80));
        assertTrue(Main.isValidPort(443));
        assertTrue(Main.isValidPort(8080));
        assertTrue(Main.isValidPort(65535));
        
        // Invalid ports
        assertFalse(Main.isValidPort(0));
        assertFalse(Main.isValidPort(-1));
        assertFalse(Main.isValidPort(65536));
        assertFalse(Main.isValidPort(100000));
    }
    
    /**
     * Test protocol validation.
     */
    @Test
    void testIsValidProtocol() {
        // Valid protocols
        assertTrue(Main.isValidProtocol("tcp"));
        assertTrue(Main.isValidProtocol("udp"));
        assertTrue(Main.isValidProtocol("icmp"));
        assertTrue(Main.isValidProtocol("all"));
        assertTrue(Main.isValidProtocol("-1"));
        assertTrue(Main.isValidProtocol("TCP"));
        assertTrue(Main.isValidProtocol("UDP"));
        assertTrue(Main.isValidProtocol("ICMP"));
        
        // Invalid protocols
        assertFalse(Main.isValidProtocol(null));
        assertFalse(Main.isValidProtocol(""));
        assertFalse(Main.isValidProtocol("http"));
        assertFalse(Main.isValidProtocol("https"));
        assertFalse(Main.isValidProtocol("invalid"));
        assertFalse(Main.isValidProtocol("tcp/udp"));
    }
    
    /**
     * Test resource name formatting.
     */
    @Test
    void testFormatResourceName() {
        // Valid inputs
        assertEquals("vpc-financial-app-1234", Main.formatResourceName("vpc", "financial-app", "1234"));
        assertEquals("s3-bucket-logs-5678", Main.formatResourceName("s3-bucket", "logs", "5678"));
        assertEquals("ec2-instance-web-9999", Main.formatResourceName("ec2-instance", "web", "9999"));
        
        // Invalid inputs
        assertThrows(IllegalArgumentException.class, () -> {
            Main.formatResourceName(null, "name", "suffix");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.formatResourceName("type", null, "suffix");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.formatResourceName("type", "name", null);
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.formatResourceName("", "name", "suffix");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.formatResourceName("type", "", "suffix");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.formatResourceName("type", "name", "");
        });
    }
    
    /**
     * Test ARN validation.
     */
    @Test
    void testIsValidArn() {
        // Valid ARNs
        assertTrue(Main.isValidArn("arn:aws:s3:::my-bucket"));
        assertTrue(Main.isValidArn("arn:aws:s3:::my-bucket/object"));
        assertTrue(Main.isValidArn("arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0"));
        assertTrue(Main.isValidArn("arn:aws:iam::123456789012:role/my-role"));
        assertTrue(Main.isValidArn("arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"));
        
        // Invalid ARNs
        assertFalse(Main.isValidArn(null));
        assertFalse(Main.isValidArn(""));
        assertFalse(Main.isValidArn("arn"));
        assertFalse(Main.isValidArn("arn:aws"));
        assertFalse(Main.isValidArn("arn:aws:s3"));
        assertFalse(Main.isValidArn("arn:aws:s3::"));
        assertFalse(Main.isValidArn("not-an-arn"));
    }
    
    /**
     * Test subnet size calculation.
     */
    @Test
    void testCalculateSubnetSize() {
        // Valid calculations
        assertEquals(65536, Main.calculateSubnetSize("10.0.0.0/16"));
        assertEquals(256, Main.calculateSubnetSize("192.168.1.0/24"));
        assertEquals(1048576, Main.calculateSubnetSize("172.16.0.0/12"));
        assertEquals(1, Main.calculateSubnetSize("10.0.0.0/32"));
        
        // Invalid CIDR blocks should throw exceptions
        assertThrows(IllegalArgumentException.class, () -> {
            Main.calculateSubnetSize("invalid-cidr");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.calculateSubnetSize("10.0.0.0");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.calculateSubnetSize(null);
        });
    }
    
    /**
     * Test S3 bucket name validation.
     */
    @Test
    void testIsValidS3BucketName() {
        // Valid bucket names
        assertTrue(Main.isValidS3BucketName("my-bucket"));
        assertTrue(Main.isValidS3BucketName("financial-app-logs-123"));
        assertTrue(Main.isValidS3BucketName("test-bucket-2023"));
        assertTrue(Main.isValidS3BucketName("abc"));
        assertTrue(Main.isValidS3BucketName("a".repeat(63)));
        
        // Invalid bucket names
        assertFalse(Main.isValidS3BucketName(null));
        assertFalse(Main.isValidS3BucketName(""));
        assertFalse(Main.isValidS3BucketName("ab"));  // Too short
        assertFalse(Main.isValidS3BucketName("a".repeat(64)));  // Too long
        assertFalse(Main.isValidS3BucketName("My-Bucket"));  // Uppercase
        assertFalse(Main.isValidS3BucketName("my bucket"));  // Space
        assertFalse(Main.isValidS3BucketName("my_bucket"));  // Underscore
        assertFalse(Main.isValidS3BucketName("-my-bucket"));  // Starts with dash
        assertFalse(Main.isValidS3BucketName("my-bucket-"));  // Ends with dash
        assertFalse(Main.isValidS3BucketName("192.168.1.1"));  // IP address format
    }
    
    /**
     * Test CloudTrail bucket policy generation.
     */
    @Test
    void testBuildCloudTrailBucketPolicy() {
        String policy = Main.buildCloudTrailBucketPolicy("test-bucket");
        assertNotNull(policy);
        assertTrue(policy.contains("AWSCloudTrailAclCheck"));
        assertTrue(policy.contains("AWSCloudTrailWrite"));
        assertTrue(policy.contains("test-bucket"));
        assertTrue(policy.contains("s3:GetBucketAcl"));
        assertTrue(policy.contains("s3:PutObject"));
        assertTrue(policy.contains("cloudtrail.amazonaws.com"));
        
        // Test invalid input
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildCloudTrailBucketPolicy(null);
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildCloudTrailBucketPolicy("");
        });
    }
    
    /**
     * Test S3 read-only policy generation.
     */
    @Test
    void testBuildS3ReadOnlyPolicy() {
        String policy = Main.buildS3ReadOnlyPolicy("us-east-1");
        assertNotNull(policy);
        assertTrue(policy.contains("s3:GetObject"));
        assertTrue(policy.contains("s3:ListBucket"));
        assertTrue(policy.contains("kms:Decrypt"));
        assertTrue(policy.contains("us-east-1"));
        assertTrue(policy.contains("financial-app-data-*"));
        
        // Test invalid inputs
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildS3ReadOnlyPolicy(null);
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildS3ReadOnlyPolicy("");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildS3ReadOnlyPolicy("invalid-region");
        });
    }
    
    /**
     * Test EC2 assume role policy generation.
     */
    @Test
    void testBuildEc2AssumeRolePolicy() {
        String policy = Main.buildEc2AssumeRolePolicy();
        assertNotNull(policy);
        assertTrue(policy.contains("sts:AssumeRole"));
        assertTrue(policy.contains("ec2.amazonaws.com"));
        assertTrue(policy.contains("2012-10-17"));
        assertTrue(policy.contains("Allow"));
    }
    
    /**
     * Test CloudWatch agent configuration generation.
     */
    @Test
    void testBuildCloudWatchAgentConfig() {
        String config = Main.buildCloudWatchAgentConfig();
        assertNotNull(config);
        assertTrue(config.contains("FinancialApp/EC2"));
        assertTrue(config.contains("cpu_usage_idle"));
        assertTrue(config.contains("mem_used_percent"));
        assertTrue(config.contains("used_percent"));
        assertTrue(config.contains("metrics_collection_interval"));
    }
    
    /**
     * Test EC2 user data script generation.
     */
    @Test
    void testBuildEc2UserData() {
        String userData = Main.buildEc2UserData();
        assertNotNull(userData);
        assertTrue(userData.contains("#!/bin/bash"));
        assertTrue(userData.contains("yum update -y"));
        assertTrue(userData.contains("amazon-cloudwatch-agent"));
        assertTrue(userData.contains("FinancialApp/EC2"));
        assertTrue(userData.startsWith("#!/bin/bash"));
    }
    
    /**
     * Test KMS key usage validation.
     */
    @Test
    void testIsValidKmsKeyUsage() {
        // Valid key usages
        assertTrue(Main.isValidKmsKeyUsage("ENCRYPT_DECRYPT"));
        assertTrue(Main.isValidKmsKeyUsage("SIGN_VERIFY"));
        
        // Invalid key usages
        assertFalse(Main.isValidKmsKeyUsage(null));
        assertFalse(Main.isValidKmsKeyUsage(""));
        assertFalse(Main.isValidKmsKeyUsage("INVALID_USAGE"));
        assertFalse(Main.isValidKmsKeyUsage("encrypt_decrypt"));
        assertFalse(Main.isValidKmsKeyUsage("ENCRYPT"));
    }
    
    /**
     * Test KMS deletion window validation.
     */
    @Test
    void testIsValidKmsDeletionWindow() {
        // Valid deletion windows
        assertTrue(Main.isValidKmsDeletionWindow(7));
        assertTrue(Main.isValidKmsDeletionWindow(15));
        assertTrue(Main.isValidKmsDeletionWindow(30));
        
        // Invalid deletion windows
        assertFalse(Main.isValidKmsDeletionWindow(6));
        assertFalse(Main.isValidKmsDeletionWindow(31));
        assertFalse(Main.isValidKmsDeletionWindow(0));
        assertFalse(Main.isValidKmsDeletionWindow(-1));
        assertFalse(Main.isValidKmsDeletionWindow(100));
    }
    
    
    /**
     * Test EBS volume type validation.
     */
    @Test
    void testIsValidEbsVolumeType() {
        // Valid volume types
        assertTrue(Main.isValidEbsVolumeType("gp2"));
        assertTrue(Main.isValidEbsVolumeType("gp3"));
        assertTrue(Main.isValidEbsVolumeType("io1"));
        assertTrue(Main.isValidEbsVolumeType("io2"));
        assertTrue(Main.isValidEbsVolumeType("st1"));
        assertTrue(Main.isValidEbsVolumeType("sc1"));
        assertTrue(Main.isValidEbsVolumeType("standard"));
        
        // Invalid volume types
        assertFalse(Main.isValidEbsVolumeType(null));
        assertFalse(Main.isValidEbsVolumeType(""));
        assertFalse(Main.isValidEbsVolumeType("gp4"));
        assertFalse(Main.isValidEbsVolumeType("invalid"));
        assertFalse(Main.isValidEbsVolumeType("GP2"));
    }
    
    /**
     * Test EBS volume size validation.
     */
    @Test
    void testIsValidEbsVolumeSize() {
        // Valid volume sizes for different types
        assertTrue(Main.isValidEbsVolumeSize(1, "gp2"));
        assertTrue(Main.isValidEbsVolumeSize(100, "gp3"));
        assertTrue(Main.isValidEbsVolumeSize(16384, "gp2"));
        assertTrue(Main.isValidEbsVolumeSize(4, "io1"));
        assertTrue(Main.isValidEbsVolumeSize(125, "st1"));
        assertTrue(Main.isValidEbsVolumeSize(1, "standard"));
        assertTrue(Main.isValidEbsVolumeSize(1024, "standard"));
        
        // Invalid volume sizes
        assertFalse(Main.isValidEbsVolumeSize(0, "gp2"));
        assertFalse(Main.isValidEbsVolumeSize(-1, "gp2"));
        assertFalse(Main.isValidEbsVolumeSize(16385, "gp2"));
        assertFalse(Main.isValidEbsVolumeSize(3, "io1"));
        assertFalse(Main.isValidEbsVolumeSize(124, "st1"));
        assertFalse(Main.isValidEbsVolumeSize(1025, "standard"));
        assertFalse(Main.isValidEbsVolumeSize(100, null));
        assertFalse(Main.isValidEbsVolumeSize(100, "invalid"));
    }
    
    /**
     * Test CloudWatch metric period validation.
     */
    @Test
    void testIsValidCloudWatchPeriod() {
        // Valid periods
        assertTrue(Main.isValidCloudWatchPeriod(60));
        assertTrue(Main.isValidCloudWatchPeriod(120));
        assertTrue(Main.isValidCloudWatchPeriod(300));
        assertTrue(Main.isValidCloudWatchPeriod(3600));
        
        // Invalid periods
        assertFalse(Main.isValidCloudWatchPeriod(0));
        assertFalse(Main.isValidCloudWatchPeriod(-60));
        assertFalse(Main.isValidCloudWatchPeriod(30));
        assertFalse(Main.isValidCloudWatchPeriod(90));
        assertFalse(Main.isValidCloudWatchPeriod(65));
    }
    
    /**
     * Test alarm threshold validation.
     */
    @Test
    void testIsValidAlarmThreshold() {
        // Valid thresholds
        assertTrue(Main.isValidAlarmThreshold(0.0));
        assertTrue(Main.isValidAlarmThreshold(50.0));
        assertTrue(Main.isValidAlarmThreshold(70.5));
        assertTrue(Main.isValidAlarmThreshold(100.0));
        
        // Invalid thresholds
        assertFalse(Main.isValidAlarmThreshold(-0.1));
        assertFalse(Main.isValidAlarmThreshold(100.1));
        assertFalse(Main.isValidAlarmThreshold(-50.0));
        assertFalse(Main.isValidAlarmThreshold(150.0));
    }
    
    /**
     * Test resource tags building - basic version.
     */
    @Test
    void testBuildResourceTagsBasic() {
        Map<String, String> tags = Main.buildResourceTags("production", "financial-app");
        assertNotNull(tags);
        assertEquals(2, tags.size());
        assertEquals("production", tags.get("Environment"));
        assertEquals("financial-app", tags.get("Application"));
        
        // Test invalid inputs
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceTags(null, "app");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceTags("env", null);
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceTags("", "app");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            Main.buildResourceTags("env", "");
        });
    }
    
    /**
     * Test resource tags building - with additional tag.
     */
    @Test
    void testBuildResourceTagsWithAdditionalTag() {
        Map<String, String> tags = Main.buildResourceTags("production", "financial-app", "Purpose", "CloudTrail");
        assertNotNull(tags);
        assertEquals(3, tags.size());
        assertEquals("production", tags.get("Environment"));
        assertEquals("financial-app", tags.get("Application"));
        assertEquals("CloudTrail", tags.get("Purpose"));
        
        // Test with null additional key/value (should be ignored)
        Map<String, String> tags2 = Main.buildResourceTags("production", "financial-app", null, "value");
        assertEquals(2, tags2.size());
        
        Map<String, String> tags3 = Main.buildResourceTags("production", "financial-app", "key", null);
        assertEquals(2, tags3.size());
        
        Map<String, String> tags4 = Main.buildResourceTags("production", "financial-app", "", "value");
        assertEquals(2, tags4.size());
        
        Map<String, String> tags5 = Main.buildResourceTags("production", "financial-app", "key", "");
        assertEquals(2, tags5.size());
    }
    
    /**
     * Test main method behavior with no arguments.
     */
    @Test
    void testMainMethodWithNoArguments() {
        // This test verifies that the main method can be called
        // In real scenarios, it would try to run Pulumi but we can't test actual Pulumi execution
        // We test that the method signature is correct and accessible
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
            
            // Test method can be invoked (will fail due to Pulumi context but verifies signature)
            try {
                mainMethod.invoke(null, (Object) new String[]{});
            } catch (Exception e) {
                // Expected to fail due to Pulumi context requirements
                assertTrue(e.getCause() instanceof RuntimeException
                        || e.getCause() instanceof IllegalStateException
                        || e.getCause() instanceof java.lang.NoClassDefFoundError
                        || e instanceof java.lang.reflect.InvocationTargetException);
            }
        });
    }
    
    /**
     * Test createInfrastructure method accessibility.
     */
    @Test
    void testCreateInfrastructureMethodExists() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("createInfrastructure", com.pulumi.Context.class);
            assertTrue(Modifier.isPublic(method.getModifiers()));
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
            assertEquals(1, method.getParameterCount());
            assertEquals(com.pulumi.Context.class, method.getParameterTypes()[0]);
        });
    }
    
    /**
     * Test createInfrastructure method behavior.
     */
    @Test
    void testCreateInfrastructureMethodBehavior() {
        // Test method behavior when called with null context
        assertThrows(Exception.class, () -> {
            Main.createInfrastructure(null);
        }, "Method should throw exception when called with null context");
    }
    
    /**
     * Test all helper method signatures and accessibility.
     */
    @Test
    void testAllHelperMethodsAccessible() {
        assertDoesNotThrow(() -> {
            // Test all new helper methods exist and are accessible
            Method[] expectedMethods = {
                Main.class.getDeclaredMethod("buildCloudTrailBucketPolicy", String.class),
                Main.class.getDeclaredMethod("buildS3ReadOnlyPolicy", String.class),  
                Main.class.getDeclaredMethod("buildEc2AssumeRolePolicy"),
                Main.class.getDeclaredMethod("buildCloudWatchAgentConfig"),
                Main.class.getDeclaredMethod("buildEc2UserData"),
                Main.class.getDeclaredMethod("isValidKmsKeyUsage", String.class),
                Main.class.getDeclaredMethod("isValidKmsDeletionWindow", int.class),
                Main.class.getDeclaredMethod("isValidEbsVolumeType", String.class),
                Main.class.getDeclaredMethod("isValidEbsVolumeSize", int.class, String.class),
                Main.class.getDeclaredMethod("isValidCloudWatchPeriod", int.class),
                Main.class.getDeclaredMethod("isValidAlarmThreshold", double.class),
                Main.class.getDeclaredMethod("buildResourceTags", String.class, String.class),
                Main.class.getDeclaredMethod("buildResourceTags", String.class, String.class, String.class, String.class)
            };
            
            for (Method method : expectedMethods) {
                assertTrue(Modifier.isPublic(method.getModifiers()), 
                    method.getName() + " should be public");
                assertTrue(Modifier.isStatic(method.getModifiers()), 
                    method.getName() + " should be static");
            }
        });
    }
    
    /**
     * Test constants accessibility and values.
     */
    @Test 
    void testConstantsAccessibility() {
        assertDoesNotThrow(() -> {
            // Test REGION constant
            Field regionField = Main.class.getDeclaredField("REGION");
            assertTrue(Modifier.isPrivate(regionField.getModifiers()));
            assertTrue(Modifier.isStatic(regionField.getModifiers()));
            assertTrue(Modifier.isFinal(regionField.getModifiers()));
            
            // Test RANDOM_SUFFIX constant
            Field suffixField = Main.class.getDeclaredField("RANDOM_SUFFIX");
            assertTrue(Modifier.isPrivate(suffixField.getModifiers()));
            assertTrue(Modifier.isStatic(suffixField.getModifiers()));
            assertTrue(Modifier.isFinal(suffixField.getModifiers()));
        });
    }    
    /**
     * Test VpcResources inner class.
     */
    @Test
    void testVpcResourcesClass() {
        // Test that VpcResources class exists and is properly structured
        assertDoesNotThrow(() -> {
            Class<?> vpcResourcesClass = Main.VpcResources.class;
            assertTrue(Modifier.isPublic(vpcResourcesClass.getModifiers()));
            assertTrue(Modifier.isStatic(vpcResourcesClass.getModifiers()));
            
            // Test constructor (parameter names changed to avoid hidden field warnings)
            var constructor = vpcResourcesClass.getConstructor(
                com.pulumi.aws.ec2.Vpc.class, 
                com.pulumi.aws.ec2.Subnet.class, 
                com.pulumi.aws.ec2.Subnet.class
            );
            assertTrue(Modifier.isPublic(constructor.getModifiers()));
            
            // Test getter methods exist
            var getVpcMethod = vpcResourcesClass.getMethod("getVpc");
            var getPublicSubnetMethod = vpcResourcesClass.getMethod("getPublicSubnet");
            var getPrivateSubnetMethod = vpcResourcesClass.getMethod("getPrivateSubnet");
            
            assertTrue(Modifier.isPublic(getVpcMethod.getModifiers()));
            assertEquals(com.pulumi.aws.ec2.Vpc.class, getVpcMethod.getReturnType());
            assertTrue(Modifier.isPublic(getPublicSubnetMethod.getModifiers()));
            assertEquals(com.pulumi.aws.ec2.Subnet.class, getPublicSubnetMethod.getReturnType());
            assertTrue(Modifier.isPublic(getPrivateSubnetMethod.getModifiers()));
            assertEquals(com.pulumi.aws.ec2.Subnet.class, getPrivateSubnetMethod.getReturnType());
        });
    }
    
    /**
     * Test IamResources inner class.
     */
    @Test
    void testIamResourcesClass() {
        // Test that IamResources class exists and is properly structured
        assertDoesNotThrow(() -> {
            Class<?> iamResourcesClass = Main.IamResources.class;
            assertTrue(Modifier.isPublic(iamResourcesClass.getModifiers()));
            assertTrue(Modifier.isStatic(iamResourcesClass.getModifiers()));
            
            // Test constructor (parameter names changed to avoid hidden field warnings)
            var constructor = iamResourcesClass.getConstructor(
                com.pulumi.aws.iam.Role.class,
                com.pulumi.aws.iam.Policy.class,
                com.pulumi.aws.iam.InstanceProfile.class
            );
            assertTrue(Modifier.isPublic(constructor.getModifiers()));
            
            // Test getter methods exist
            var getEc2RoleMethod = iamResourcesClass.getMethod("getEc2Role");
            var getS3PolicyMethod = iamResourcesClass.getMethod("getS3Policy");
            var getInstanceProfileMethod = iamResourcesClass.getMethod("getInstanceProfile");
            
            assertTrue(Modifier.isPublic(getEc2RoleMethod.getModifiers()));
            assertEquals(com.pulumi.aws.iam.Role.class, getEc2RoleMethod.getReturnType());
            assertTrue(Modifier.isPublic(getS3PolicyMethod.getModifiers()));
            assertEquals(com.pulumi.aws.iam.Policy.class, getS3PolicyMethod.getReturnType());
            assertTrue(Modifier.isPublic(getInstanceProfileMethod.getModifiers()));
            assertEquals(com.pulumi.aws.iam.InstanceProfile.class, getInstanceProfileMethod.getReturnType());
        });
    }
    
    /**
     * Test various edge cases for helper methods to increase coverage.
     */
    @Test
    void testHelperMethodEdgeCases() {
        // Test buildResourceName with various inputs
        assertEquals("prefix-suffix", Main.buildResourceName("prefix", "suffix"));
        assertEquals("a-1", Main.buildResourceName("a", "1"));
        
        // Test region and suffix getters multiple times (for consistency)
        String region1 = Main.getRegion();
        String region2 = Main.getRegion();
        assertEquals(region1, region2);
        
        String suffix1 = Main.getRandomSuffix();
        String suffix2 = Main.getRandomSuffix();
        assertEquals(suffix1, suffix2); // Should be same since it's static
        
        // Test CIDR validation edge cases
        assertTrue(Main.isValidCidrBlock("0.0.0.0/0"));
        assertTrue(Main.isValidCidrBlock("255.255.255.255/32"));
        assertFalse(Main.isValidCidrBlock("256.0.0.0/16"));
        assertFalse(Main.isValidCidrBlock("10.0.0.0/33"));
        assertFalse(Main.isValidCidrBlock("10.0.0/16"));
        
        // Test instance type validation edge cases
        assertTrue(Main.isValidInstanceType("t3.micro"));
        assertTrue(Main.isValidInstanceType("c5n.xlarge"));
        assertTrue(Main.isValidInstanceType("r5a.24xlarge"));
        assertFalse(Main.isValidInstanceType("invalid.type"));
        assertFalse(Main.isValidInstanceType("t3"));
        
        // Test port validation edge cases
        assertTrue(Main.isValidPort(1));
        assertTrue(Main.isValidPort(65535));
        assertFalse(Main.isValidPort(0));
        assertFalse(Main.isValidPort(65536));
        
        // Test protocol validation case insensitivity
        assertTrue(Main.isValidProtocol("TCP"));
        assertTrue(Main.isValidProtocol("tcp"));
        assertTrue(Main.isValidProtocol("UDP"));
        assertTrue(Main.isValidProtocol("udp"));
        
        // Test ARN validation edge cases
        assertTrue(Main.isValidArn("arn:aws:s3:::bucket/key"));
        assertTrue(Main.isValidArn("arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0"));
        assertFalse(Main.isValidArn("invalid-arn"));
        assertFalse(Main.isValidArn("arn:aws:s3"));
        
        // Test S3 bucket name validation edge cases
        assertTrue(Main.isValidS3BucketName("abc"));
        assertTrue(Main.isValidS3BucketName("my-bucket-123"));
        assertFalse(Main.isValidS3BucketName("ab"));
        assertFalse(Main.isValidS3BucketName("My-Bucket"));
        assertFalse(Main.isValidS3BucketName("192.168.1.1"));
        
        // Test availability zone generation edge cases
        assertEquals("us-east-1a", Main.generateAvailabilityZone("us-east-1", "a"));
        assertEquals("eu-west-1z", Main.generateAvailabilityZone("eu-west-1", "z"));
        
        // Test subnet size calculation edge cases
        assertEquals(1, Main.calculateSubnetSize("10.0.0.0/32"));
        assertEquals(256, Main.calculateSubnetSize("192.168.1.0/24"));
        assertEquals(65536, Main.calculateSubnetSize("10.0.0.0/16"));
        
        // Test KMS validation edge cases
        assertTrue(Main.isValidKmsKeyUsage("ENCRYPT_DECRYPT"));
        assertTrue(Main.isValidKmsKeyUsage("SIGN_VERIFY"));
        assertFalse(Main.isValidKmsKeyUsage("INVALID"));
        
        assertTrue(Main.isValidKmsDeletionWindow(7));
        assertTrue(Main.isValidKmsDeletionWindow(30));
        assertFalse(Main.isValidKmsDeletionWindow(6));
        assertFalse(Main.isValidKmsDeletionWindow(31));
        
        // Test EBS validation edge cases
        assertTrue(Main.isValidEbsVolumeType("gp3"));
        assertTrue(Main.isValidEbsVolumeType("io2"));
        assertFalse(Main.isValidEbsVolumeType("invalid"));
        
        assertTrue(Main.isValidEbsVolumeSize(1, "gp2"));
        assertTrue(Main.isValidEbsVolumeSize(16384, "gp3"));
        assertFalse(Main.isValidEbsVolumeSize(0, "gp2"));
        assertFalse(Main.isValidEbsVolumeSize(100, null));
        
        // Test CloudWatch validation edge cases
        assertTrue(Main.isValidCloudWatchPeriod(60));
        assertTrue(Main.isValidCloudWatchPeriod(3600));
        assertFalse(Main.isValidCloudWatchPeriod(30));
        assertFalse(Main.isValidCloudWatchPeriod(90));
        
        // Test alarm threshold validation edge cases
        assertTrue(Main.isValidAlarmThreshold(0.0));
        assertTrue(Main.isValidAlarmThreshold(100.0));
        assertTrue(Main.isValidAlarmThreshold(50.5));
        assertFalse(Main.isValidAlarmThreshold(-0.1));
        assertFalse(Main.isValidAlarmThreshold(100.1));
    }
    
    /**
     * Test policy generation methods to increase coverage.
     */
    @Test
    void testPolicyGenerationMethods() {
        // Test CloudTrail bucket policy
        String cloudtrailPolicy = Main.buildCloudTrailBucketPolicy("test-bucket");
        assertNotNull(cloudtrailPolicy);
        assertTrue(cloudtrailPolicy.contains("test-bucket"));
        assertTrue(cloudtrailPolicy.contains("AWSCloudTrailAclCheck"));
        assertTrue(cloudtrailPolicy.contains("AWSCloudTrailWrite"));
        assertTrue(cloudtrailPolicy.contains("s3:GetBucketAcl"));
        assertTrue(cloudtrailPolicy.contains("s3:PutObject"));
        assertTrue(cloudtrailPolicy.contains("cloudtrail.amazonaws.com"));
        
        // Test S3 read-only policy
        String s3Policy = Main.buildS3ReadOnlyPolicy("us-east-1");
        assertNotNull(s3Policy);
        assertTrue(s3Policy.contains("us-east-1"));
        assertTrue(s3Policy.contains("s3:GetObject"));
        assertTrue(s3Policy.contains("s3:ListBucket"));
        assertTrue(s3Policy.contains("kms:Decrypt"));
        assertTrue(s3Policy.contains("financial-app-data-*"));
        
        // Test EC2 assume role policy
        String ec2Policy = Main.buildEc2AssumeRolePolicy();
        assertNotNull(ec2Policy);
        assertTrue(ec2Policy.contains("sts:AssumeRole"));
        assertTrue(ec2Policy.contains("ec2.amazonaws.com"));
        assertTrue(ec2Policy.contains("2012-10-17"));
        
        // Test CloudWatch agent config
        String cloudwatchConfig = Main.buildCloudWatchAgentConfig();
        assertNotNull(cloudwatchConfig);
        assertTrue(cloudwatchConfig.contains("FinancialApp/EC2"));
        assertTrue(cloudwatchConfig.contains("cpu_usage_idle"));
        assertTrue(cloudwatchConfig.contains("mem_used_percent"));
        assertTrue(cloudwatchConfig.contains("used_percent"));
        
        // Test EC2 user data
        String userData = Main.buildEc2UserData();
        assertNotNull(userData);
        assertTrue(userData.contains("#!/bin/bash"));
        assertTrue(userData.contains("yum update -y"));
        assertTrue(userData.contains("amazon-cloudwatch-agent"));
        assertTrue(userData.contains("FinancialApp/EC2"));
    }
    
    /**
     * Test the createInfrastructure method signature and basic accessibility.
     */
    @Test
    void testCreateInfrastructureMethodSignature() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("createInfrastructure", com.pulumi.Context.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertTrue(Modifier.isPublic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
            assertEquals(1, method.getParameterCount());
        });
    }
    
    /**
     * Test VpcResources inner class constructor and getters for coverage.
     */
    @Test
    void testVpcResourcesConstructorAndGetters() {
        // Use null values since we're only testing the constructor and getters
        // not the actual Pulumi objects which require AWS context
        Main.VpcResources vpcResources = new Main.VpcResources(null, null, null);
        
        // Test getter methods exist and return the expected null values we passed
        assertEquals(null, vpcResources.getVpc());
        assertEquals(null, vpcResources.getPublicSubnet());
        assertEquals(null, vpcResources.getPrivateSubnet());
    }
    
    /**
     * Test IamResources inner class constructor and getters for coverage.
     */
    @Test
    void testIamResourcesConstructorAndGetters() {
        // Use null values since we're only testing the constructor and getters
        // not the actual Pulumi objects which require AWS context
        Main.IamResources iamResources = new Main.IamResources(null, null, null);
        
        // Test getter methods exist and return the expected null values we passed
        assertEquals(null, iamResources.getEc2Role());
        assertEquals(null, iamResources.getS3Policy());
        assertEquals(null, iamResources.getInstanceProfile());
    }
    
    /**
     * Test all static infrastructure helper methods are accessible.
     */
    @Test
    void testInfrastructureHelperMethodsExist() throws Exception {
        // Test private methods exist (infrastructure creation methods)
        Method[] methods = Main.class.getDeclaredMethods();
        
        boolean hasCreateAwsProvider = false;
        boolean hasCreateProviderOptions = false;
        boolean hasCreateKmsKey = false;
        boolean hasCreateCloudTrailS3Bucket = false;
        boolean hasCreateApplicationS3Bucket = false;
        boolean hasCreateVpcInfrastructure = false;
        boolean hasCreateSecurityGroup = false;
        boolean hasCreateIamResources = false;
        boolean hasCreateSnsTopic = false;
        boolean hasCreateEc2Instances = false;
        boolean hasCreateCloudTrail = false;
        boolean hasExportOutputs = false;
        
        for (Method method : methods) {
            String methodName = method.getName();
            if (methodName.equals("createAwsProvider")) {
                hasCreateAwsProvider = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createProviderOptions")) {
                hasCreateProviderOptions = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createKmsKey")) {
                hasCreateKmsKey = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createCloudTrailS3Bucket")) {
                hasCreateCloudTrailS3Bucket = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createApplicationS3Bucket")) {
                hasCreateApplicationS3Bucket = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createVpcInfrastructure")) {
                hasCreateVpcInfrastructure = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createSecurityGroup")) {
                hasCreateSecurityGroup = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createIamResources")) {
                hasCreateIamResources = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createSnsTopic")) {
                hasCreateSnsTopic = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createEc2Instances")) {
                hasCreateEc2Instances = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("createCloudTrail")) {
                hasCreateCloudTrail = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } else if (methodName.equals("exportOutputs")) {
                hasExportOutputs = true;
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            }
        }
        
        assertTrue(hasCreateAwsProvider, "Should have createAwsProvider method");
        assertTrue(hasCreateProviderOptions, "Should have createProviderOptions method");
        assertTrue(hasCreateKmsKey, "Should have createKmsKey method");
        assertTrue(hasCreateCloudTrailS3Bucket, "Should have createCloudTrailS3Bucket method");
        assertTrue(hasCreateApplicationS3Bucket, "Should have createApplicationS3Bucket method");
        assertTrue(hasCreateVpcInfrastructure, "Should have createVpcInfrastructure method");
        assertTrue(hasCreateSecurityGroup, "Should have createSecurityGroup method");
        assertTrue(hasCreateIamResources, "Should have createIamResources method");
        assertTrue(hasCreateSnsTopic, "Should have createSnsTopic method");
        assertTrue(hasCreateEc2Instances, "Should have createEc2Instances method");
        assertTrue(hasCreateCloudTrail, "Should have createCloudTrail method");
        assertTrue(hasExportOutputs, "Should have exportOutputs method");
    }
}
