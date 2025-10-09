package app.components;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for MonitoringComponent.
 *
 * Note: Pulumi components are difficult to unit test as they require
 * a Pulumi context. These tests validate basic structure and instantiation.
 * Actual infrastructure validation is done through integration tests and
 * real AWS deployments.
 */
public class MonitoringComponentTest {

    /**
     * Test that MonitoringComponent class exists and is properly configured.
     */
    @Test
    void testMonitoringComponentClassStructure() {
        assertNotNull(MonitoringComponent.class);
        assertDoesNotThrow(() -> {
            MonitoringComponent.class.getDeclaredConstructor(
                String.class, 
                StreamingComponent.class, 
                IngestionComponent.class, 
                StorageComponent.class,
                String.class
            );
        });
    }

    /**
     * Test that MonitoringComponent has required public methods.
     */
    @Test
    void testMonitoringComponentHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            MonitoringComponent.class.getDeclaredMethod("getDashboardUrl");
        });
    }

    /**
     * Test that methods return Output types.
     */
    @Test
    void testMethodReturnTypes() throws Exception {
        Class<?> outputClass = Class.forName("com.pulumi.core.Output");

        assertEquals(outputClass,
            MonitoringComponent.class.getDeclaredMethod("getDashboardUrl").getReturnType());
    }

    /**
     * Test that constructor parameters are correctly defined.
     */
    @Test
    void testConstructorParameters() throws Exception {
        var constructor = MonitoringComponent.class.getDeclaredConstructor(
            String.class, 
            StreamingComponent.class, 
            IngestionComponent.class, 
            StorageComponent.class,
            String.class
        );
        assertNotNull(constructor);
        assertEquals(5, constructor.getParameterCount());
    }

    /**
     * Test that the class is public and can be instantiated.
     */
    @Test
    void testClassIsPublic() {
        assertTrue(java.lang.reflect.Modifier.isPublic(MonitoringComponent.class.getModifiers()));
    }
}

