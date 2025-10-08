package app.components;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for StorageComponent.
 *
 * Note: Pulumi components are difficult to unit test as they require
 * a Pulumi context. These tests validate basic structure and instantiation.
 * Actual infrastructure validation is done through integration tests and
 * real AWS deployments.
 */
public class StorageComponentTest {

    /**
     * Test that StorageComponent class exists and is properly configured.
     */
    @Test
    void testStorageComponentClassStructure() {
        assertNotNull(StorageComponent.class);
        assertDoesNotThrow(() -> {
            StorageComponent.class.getDeclaredConstructor(String.class, String.class);
        });
    }

    /**
     * Test that StorageComponent has required public methods.
     */
    @Test
    void testStorageComponentHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            StorageComponent.class.getDeclaredMethod("getDataLakeBucketName");
            StorageComponent.class.getDeclaredMethod("getDataLakeBucketArn");
            StorageComponent.class.getDeclaredMethod("getTimestreamDatabaseName");
            StorageComponent.class.getDeclaredMethod("getTimestreamTableName");
            StorageComponent.class.getDeclaredMethod("getTimestreamTableArn");
        });
    }

    /**
     * Test that methods return Output types.
     */
    @Test
    void testMethodReturnTypes() throws Exception {
        Class<?> outputClass = Class.forName("com.pulumi.core.Output");

        assertEquals(outputClass,
            StorageComponent.class.getDeclaredMethod("getDataLakeBucketName").getReturnType());
        assertEquals(outputClass,
            StorageComponent.class.getDeclaredMethod("getDataLakeBucketArn").getReturnType());
        assertEquals(outputClass,
            StorageComponent.class.getDeclaredMethod("getTimestreamDatabaseName").getReturnType());
    }
}
