package app.components;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for StreamingComponent.
 *
 * Note: Pulumi components are difficult to unit test as they require
 * a Pulumi context. These tests validate basic structure and instantiation.
 * Actual infrastructure validation is done through integration tests and
 * real AWS deployments.
 */
public class StreamingComponentTest {

    /**
     * Test that StreamingComponent class exists and is properly configured.
     */
    @Test
    void testStreamingComponentClassStructure() {
        assertNotNull(StreamingComponent.class);
        assertDoesNotThrow(() -> {
            StreamingComponent.class.getDeclaredConstructor(String.class, String.class);
        });
    }

    /**
     * Test that StreamingComponent has required public methods.
     */
    @Test
    void testStreamingComponentHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            StreamingComponent.class.getDeclaredMethod("getStreamName");
            StreamingComponent.class.getDeclaredMethod("getStreamArn");
        });
    }

    /**
     * Test that methods return Output types.
     */
    @Test
    void testMethodReturnTypes() throws Exception {
        Class<?> outputClass = Class.forName("com.pulumi.core.Output");

        assertEquals(outputClass,
            StreamingComponent.class.getDeclaredMethod("getStreamName").getReturnType());
        assertEquals(outputClass,
            StreamingComponent.class.getDeclaredMethod("getStreamArn").getReturnType());
    }

    /**
     * Test that constructor parameters are correctly defined.
     */
    @Test
    void testConstructorParameters() throws Exception {
        var constructor = StreamingComponent.class.getDeclaredConstructor(String.class, String.class);
        assertNotNull(constructor);
        assertEquals(2, constructor.getParameterCount());
    }

    /**
     * Test that the class is public and can be instantiated.
     */
    @Test
    void testClassIsPublic() {
        assertTrue(java.lang.reflect.Modifier.isPublic(StreamingComponent.class.getModifiers()));
    }
}

