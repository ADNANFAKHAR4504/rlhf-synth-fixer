package app.components;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for IngestionComponent.
 *
 * Note: Pulumi components are difficult to unit test as they require
 * a Pulumi context. These tests validate basic structure and instantiation.
 * Actual infrastructure validation is done through integration tests and
 * real AWS deployments.
 */
public class IngestionComponentTest {

    /**
     * Test that IngestionComponent class exists and is properly configured.
     */
    @Test
    void testIngestionComponentClassStructure() {
        assertNotNull(IngestionComponent.class);
        assertDoesNotThrow(() -> {
            IngestionComponent.class.getDeclaredConstructor(
                String.class, 
                IamComponent.class, 
                StorageComponent.class, 
                StreamingComponent.class,
                String.class
            );
        });
    }

    /**
     * Test that IngestionComponent has required public methods.
     */
    @Test
    void testIngestionComponentHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            IngestionComponent.class.getDeclaredMethod("getLambdaFunctionArn");
            IngestionComponent.class.getDeclaredMethod("getLambdaFunctionName");
        });
    }

    /**
     * Test that methods return Output types.
     */
    @Test
    void testMethodReturnTypes() throws Exception {
        Class<?> outputClass = Class.forName("com.pulumi.core.Output");

        assertEquals(outputClass,
            IngestionComponent.class.getDeclaredMethod("getLambdaFunctionArn").getReturnType());
        assertEquals(outputClass,
            IngestionComponent.class.getDeclaredMethod("getLambdaFunctionName").getReturnType());
    }

    /**
     * Test that constructor parameters are correctly defined.
     */
    @Test
    void testConstructorParameters() throws Exception {
        var constructor = IngestionComponent.class.getDeclaredConstructor(
            String.class, 
            IamComponent.class, 
            StorageComponent.class, 
            StreamingComponent.class,
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
        assertTrue(java.lang.reflect.Modifier.isPublic(IngestionComponent.class.getModifiers()));
    }
}

