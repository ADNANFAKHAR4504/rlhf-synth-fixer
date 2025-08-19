package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Main class.
 * Run with: ./gradlew test
 */
public class MainTest {

    /**
     * Verify the Main class can be loaded.
     */
    @Test
    void testMainClassExists() {
        assertNotNull(Main.class);
    }

    /**
     * Verify the main method exists with correct signature.
     */
    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Main.class.getDeclaredMethod("main", String[].class);
        });
    }
}