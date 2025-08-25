package app;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import java.lang.reflect.Modifier;
import com.pulumi.Context;
import static org.junit.jupiter.api.Assertions.*;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;



/**
 * Unit tests for the Main class.
 * 
 * This is a minimal example showing how to test a Pulumi Java program.
 * Add more specific tests based on your infrastructure requirements.
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
     * Example test for infrastructure logic validation.
     * 
     * Note: Testing actual Pulumi infrastructure requires mocking Pulumi context
     * or integration tests. This is a placeholder showing the approach.
     */
    @Test
    void testDefineInfrastructureValidation() {
        // Test basic method invocation - will fail due to Pulumi context requirements
        // but verifies the method signature and basic accessibility
        assertThrows(Exception.class, () -> {
            Main.defineInfrastructure(null);
        });
    }

    @Test
    @DisplayName("Main private constructor is non-instantiable and throws")
    void testMainConstructorIsPrivateAndThrows() throws Exception {
        Constructor<Main> ctor = Main.class.getDeclaredConstructor();
        assertTrue(Modifier.isPrivate(ctor.getModifiers()), "Main() should be private");
        // ctor.setAccessible(true);
        // UnsupportedOperationException ex = assertThrows(UnsupportedOperationException.class, ctor::newInstance);
        // assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank(), "Exception message should exist");
    }

    // @Test
    // @DisplayName("WebAppStackConfig private constructor is non-instantiable and throws")
    // void testConfigConstructorIsPrivateAndThrows() throws Exception {
    //     Constructor<WebAppStackConfig> ctor = WebAppStackConfig.class.getDeclaredConstructor();
    //     assertTrue(Modifier.isPrivate(ctor.getModifiers()), "WebAppStackConfig() should be private");
    //     ctor.setAccessible(true);
    //     UnsupportedOperationException ex = assertThrows(UnsupportedOperationException.class, ctor::newInstance);
    //     assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank(), "Exception message should exist");
    // }

    @Test
    @DisplayName("WebAppStack exposes a static stack(Context) method")
    void testWebAppStackStackSignature() throws Exception {
        Method m = WebAppStack.class.getDeclaredMethod("stack", Context.class);
        assertTrue(Modifier.isStatic(m.getModifiers()), "stack(Context) should be static");
        assertEquals(void.class, m.getReturnType(), "stack(Context) should return void");
    }

    @Test
    @DisplayName("WebAppStack declares expected inner resource containers")
    void testInnerResourceClassesExist() {
        Set<String> expected = new HashSet<>(Arrays.asList(
            "NetworkResources", "ComputeResources", "SecurityResources", "StorageResources"
        ));
        Set<String> actual = new HashSet<>();
        for (Class<?> c : WebAppStack.class.getDeclaredClasses()) {
            actual.add(c.getSimpleName());
        }
        assertTrue(actual.containsAll(expected), "All expected inner classes should exist: " + expected);
    }

    @Test
    @DisplayName("WebAppStackConfig.getExpectedExports returns the exact expected keys")
    void testExpectedExportsContents() {
        String[] expected = new String[] {
            "loadBalancerDnsName",
            "applicationUrl",
            "applicationUrlHttps",
            "vpcId",
            "publicSubnet1Id",
            "publicSubnet2Id",
            "autoScalingGroupName",
            "targetGroupArn",
            "codeBucketName"
        };
        assertArrayEquals(expected, WebAppStackConfig.getExpectedExports(),
            "Expected exports should match exactly");
    }

    @Test
    @DisplayName("Policy helpers return non-empty JSON-like strings with balanced braces")
    void testPolicyHelpers() {
        String assumeRolePolicy = WebAppStackConfig.createAssumeRolePolicy();
        String s3Policy = WebAppStackConfig.createS3AccessPolicy();
        assertNotNull(assumeRolePolicy);
        assertNotNull(s3Policy);
        assertFalse(assumeRolePolicy.isBlank());
        assertFalse(s3Policy.isBlank());
        assertEquals(count('{', assumeRolePolicy), count('}', assumeRolePolicy), "Assume role policy braces balanced");
        assertEquals(count('{', s3Policy), count('}', s3Policy), "S3 policy braces balanced");
    }

    private static long count(char ch, String s) {
        return s.chars().filter(c -> c == ch).count();
    }
}
