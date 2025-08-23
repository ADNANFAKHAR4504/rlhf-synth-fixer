package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
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
                if (foundDifferent) break;
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
}