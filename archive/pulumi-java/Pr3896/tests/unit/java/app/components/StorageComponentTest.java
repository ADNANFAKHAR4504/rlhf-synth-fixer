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

    /**
     * Test component name validation with valid names.
     */
    @Test
    void testValidComponentNames() {
        assertTrue(StorageComponent.isValidComponentName("test-storage"));
        assertTrue(StorageComponent.isValidComponentName("market-data-prod-storage"));
        assertTrue(StorageComponent.isValidComponentName("  valid-name  "));
        assertTrue(StorageComponent.isValidComponentName("a"));
    }

    /**
     * Test component name validation with invalid names.
     */
    @Test
    void testInvalidComponentNames() {
        assertFalse(StorageComponent.isValidComponentName(null));
        assertFalse(StorageComponent.isValidComponentName(""));
        assertFalse(StorageComponent.isValidComponentName("   "));
        assertFalse(StorageComponent.isValidComponentName("\t\n"));
    }

    /**
     * Test region validation with valid AWS regions.
     */
    @Test
    void testValidRegions() {
        assertTrue(StorageComponent.isValidRegion("us-west-2"));
        assertTrue(StorageComponent.isValidRegion("us-east-1"));
        assertTrue(StorageComponent.isValidRegion("eu-west-1"));
        assertTrue(StorageComponent.isValidRegion("ap-south-1"));
        assertTrue(StorageComponent.isValidRegion("ca-central-1"));
    }

    /**
     * Test region validation with invalid regions.
     */
    @Test
    void testInvalidRegions() {
        assertFalse(StorageComponent.isValidRegion(null));
        assertFalse(StorageComponent.isValidRegion(""));
        assertFalse(StorageComponent.isValidRegion("invalid"));
        assertFalse(StorageComponent.isValidRegion("us-west"));
        assertFalse(StorageComponent.isValidRegion("uswest2"));
        assertFalse(StorageComponent.isValidRegion("us-west-22"));
    }
}
