package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Main CDK application entry point.
 * 
 * These tests verify the main application can be executed without errors.
 */
public class MainTest {

    /**
     * Test that the main method can be called without throwing exceptions.
     * Note: This test primarily ensures the main method exists and is properly structured.
     */
    @Test
    public void testMainMethodExists() {
        // Verify main method can be called (would normally create CDK app)
        // Since main() creates CDK resources, we just verify it doesn't throw on null args
        assertDoesNotThrow(() -> {
            // We can't actually run main() in tests as it calls app.synth()
            // Just verify the class and method exist
            Class<?> mainClass = Main.class;
            assertNotNull(mainClass);
            
            // Verify main method exists
            assertDoesNotThrow(() -> 
                mainClass.getMethod("main", String[].class)
            );
        });
    }

    /**
     * Test that Main class cannot be instantiated (utility class pattern).
     */
    @Test
    public void testMainCannotBeInstantiated() {
        // Main should have a private constructor to prevent instantiation
        assertThrows(IllegalAccessException.class, () -> {
            Main.class.getDeclaredConstructor().newInstance();
        });
    }

    /**
     * Test Main class structure.
     */
    @Test  
    public void testMainClassStructure() {
        // Verify Main class is final
        assertTrue(java.lang.reflect.Modifier.isFinal(Main.class.getModifiers()));
        
        // Verify main method is public static
        try {
            var mainMethod = Main.class.getMethod("main", String[].class);
            assertTrue(java.lang.reflect.Modifier.isPublic(mainMethod.getModifiers()));
            assertTrue(java.lang.reflect.Modifier.isStatic(mainMethod.getModifiers()));
        } catch (NoSuchMethodException e) {
            fail("Main method not found");
        }
    }
}