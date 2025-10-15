package app.components;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for QueryComponent.
 *
 * Note: Pulumi components are difficult to unit test as they require
 * a Pulumi context. These tests validate basic structure and instantiation.
 * Actual infrastructure validation is done through integration tests and
 * real AWS deployments.
 */
public class QueryComponentTest {

    /**
     * Test that QueryComponent class exists and is properly configured.
     */
    @Test
    void testQueryComponentClassStructure() {
        assertNotNull(QueryComponent.class);
        assertDoesNotThrow(() -> {
            QueryComponent.class.getDeclaredConstructor(
                String.class, 
                StorageComponent.class, 
                IamComponent.class, 
                String.class
            );
        });
    }

    /**
     * Test that QueryComponent has required public methods.
     */
    @Test
    void testQueryComponentHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            QueryComponent.class.getDeclaredMethod("getGlueDatabaseName");
            QueryComponent.class.getDeclaredMethod("getAthenaWorkgroupName");
            QueryComponent.class.getDeclaredMethod("getQuickSightDataSourceId");
        });
    }

    /**
     * Test that methods return Output types.
     */
    @Test
    void testMethodReturnTypes() throws Exception {
        Class<?> outputClass = Class.forName("com.pulumi.core.Output");

        assertEquals(outputClass,
            QueryComponent.class.getDeclaredMethod("getGlueDatabaseName").getReturnType());
        assertEquals(outputClass,
            QueryComponent.class.getDeclaredMethod("getAthenaWorkgroupName").getReturnType());
        assertEquals(outputClass,
            QueryComponent.class.getDeclaredMethod("getQuickSightDataSourceId").getReturnType());
    }

    /**
     * Test that constructor parameters are correctly defined.
     */
    @Test
    void testConstructorParameters() throws Exception {
        var constructor = QueryComponent.class.getDeclaredConstructor(
            String.class, 
            StorageComponent.class, 
            IamComponent.class, 
            String.class
        );
        assertNotNull(constructor);
        assertEquals(4, constructor.getParameterCount());
    }

    /**
     * Test that the class is public and can be instantiated.
     */
    @Test
    void testClassIsPublic() {
        assertTrue(java.lang.reflect.Modifier.isPublic(QueryComponent.class.getModifiers()));
    }
}

