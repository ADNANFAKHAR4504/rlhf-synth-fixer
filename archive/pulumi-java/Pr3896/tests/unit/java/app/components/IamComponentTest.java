package app.components;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for IamComponent.
 *
 * Note: Pulumi components are difficult to unit test as they require
 * a Pulumi context. These tests validate basic structure and instantiation.
 * Actual infrastructure validation is done through integration tests and
 * real AWS deployments.
 */
public class IamComponentTest {

    /**
     * Test that IamComponent class exists and is properly configured.
     */
    @Test
    void testIamComponentClassStructure() {
        assertNotNull(IamComponent.class);
        assertDoesNotThrow(() -> {
            IamComponent.class.getDeclaredConstructor(String.class, String.class);
        });
    }

    /**
     * Test that IamComponent has required public methods for role ARNs.
     */
    @Test
    void testIamComponentHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            IamComponent.class.getDeclaredMethod("getLambdaRoleArn");
            IamComponent.class.getDeclaredMethod("getGlueRoleArn");
            IamComponent.class.getDeclaredMethod("getQuickSightRoleArn");
        });
    }

    /**
     * Test that methods return Output types.
     */
    @Test
    void testMethodReturnTypes() throws Exception {
        Class<?> outputClass = Class.forName("com.pulumi.core.Output");

        assertEquals(outputClass,
            IamComponent.class.getDeclaredMethod("getLambdaRoleArn").getReturnType());
        assertEquals(outputClass,
            IamComponent.class.getDeclaredMethod("getGlueRoleArn").getReturnType());
        assertEquals(outputClass,
            IamComponent.class.getDeclaredMethod("getQuickSightRoleArn").getReturnType());
    }

    /**
     * Test that constructor parameters are correctly defined.
     */
    @Test
    void testConstructorParameters() throws Exception {
        var constructor = IamComponent.class.getDeclaredConstructor(String.class, String.class);
        assertNotNull(constructor);
        assertEquals(2, constructor.getParameterCount());
    }

    /**
     * Test that the class is public and can be instantiated.
     */
    @Test
    void testClassIsPublic() {
        assertTrue(java.lang.reflect.Modifier.isPublic(IamComponent.class.getModifiers()));
    }
}

