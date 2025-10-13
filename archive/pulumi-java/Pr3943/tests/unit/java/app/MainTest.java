package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

/**
 * Comprehensive unit tests for the Main class.
 * 
 * These tests focus on testing the business logic and validation methods
 * rather than just structural verification.
 */
@DisplayName("Main Class Unit Tests")
public class MainTest {

    @BeforeEach
    void setUp() {
        // Setup test environment if needed
    }

    // === BUSINESS LOGIC TESTS ===

    @Test
    @DisplayName("Should validate configuration correctly")
    void testValidateConfiguration() {
        // Test the validation method - this actually exercises code
        boolean result = Main.validateConfiguration();
        assertTrue(result, "Configuration validation should return true");
        
        // Verify it calls the underlying methods
        String region = Main.getDefaultRegion();
        assertTrue(Main.isValidRetentionDays(2557));
        assertNotNull(region);
        assertFalse(region.isEmpty());
    }

    @Test
    @DisplayName("Should return correct default region")
    void testGetDefaultRegion() {
        String region = Main.getDefaultRegion();
        
        assertNotNull(region, "Default region should not be null");
        assertFalse(region.isEmpty(), "Default region should not be empty");
        assertEquals("us-east-1", region, "Default region should be us-east-1");
        assertTrue(region.startsWith("us-"), "Should be a US region");
    }

    @Test
    @DisplayName("Should validate retention days correctly")
    void testIsValidRetentionDays() {
        // Test valid values
        assertTrue(Main.isValidRetentionDays(1), "1 day should be valid");
        assertTrue(Main.isValidRetentionDays(90), "90 days should be valid");
        assertTrue(Main.isValidRetentionDays(365), "365 days (1 year) should be valid");
        assertTrue(Main.isValidRetentionDays(2557), "2557 days (7 years) should be valid");
        assertTrue(Main.isValidRetentionDays(3653), "3653 days (10 years) should be valid");
        
        // Test invalid values
        assertFalse(Main.isValidRetentionDays(0), "0 days should be invalid");
        assertFalse(Main.isValidRetentionDays(-1), "Negative days should be invalid");
        assertFalse(Main.isValidRetentionDays(-100), "Large negative days should be invalid");
        assertFalse(Main.isValidRetentionDays(3654), "More than 10 years should be invalid");
        assertFalse(Main.isValidRetentionDays(5000), "Extremely long retention should be invalid");
    }

    @Test
    @DisplayName("Should handle edge cases for retention days")
    void testRetentionDaysEdgeCases() {
        // Test boundary conditions
        assertFalse(Main.isValidRetentionDays(Integer.MIN_VALUE), "Min integer should be invalid");
        assertFalse(Main.isValidRetentionDays(Integer.MAX_VALUE), "Max integer should be invalid");
        
        // Test exactly at boundaries
        assertTrue(Main.isValidRetentionDays(1), "Minimum valid value");
        assertTrue(Main.isValidRetentionDays(3653), "Maximum valid value");
        assertFalse(Main.isValidRetentionDays(3654), "Just over maximum should be invalid");
    }

    @Test
    @DisplayName("Should maintain consistency between validation methods")
    void testValidationConsistency() {
        // Test that validateConfiguration uses the same logic as individual methods
        String expectedRegion = Main.getDefaultRegion();
        boolean expectedDaysValid = Main.isValidRetentionDays(2557);
        boolean overallValid = Main.validateConfiguration();
        
        // The overall validation should be consistent with individual checks
        assertEquals(expectedDaysValid && expectedRegion != null && !expectedRegion.isEmpty(), 
                    overallValid, "Overall validation should match individual validations");
    }

    // === STRUCTURAL TESTS (minimal but necessary) ===

    @Test
    @DisplayName("Should have proper class structure")
    void testMainClassStructure() {
        assertNotNull(Main.class, "Main class should exist");
        assertTrue(Modifier.isFinal(Main.class.getModifiers()), "Main class should be final");
        assertTrue(Modifier.isPublic(Main.class.getModifiers()), "Main class should be public");
    }

    @Test
    @DisplayName("Should have private constructor")
    void testPrivateConstructor() {
        assertDoesNotThrow(() -> {
            var constructor = Main.class.getDeclaredConstructor();
            assertTrue(Modifier.isPrivate(constructor.getModifiers()), 
                      "Constructor should be private");
        });
    }

    @Test
    @DisplayName("Should have main method with correct signature")
    void testMainMethodSignature() {
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()), "main method should be static");
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()), "main method should be public");
            assertEquals(void.class, mainMethod.getReturnType(), "main method should return void");
        });
    }

    @Test
    @DisplayName("Should prevent direct instantiation")
    void testCannotInstantiate() {
        assertThrows(IllegalAccessException.class, () -> {
            Main.class.getDeclaredConstructor().newInstance();
        }, "Should not be able to instantiate Main class directly");
    }
}
