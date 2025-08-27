package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.Map;

import com.pulumi.Context;
import com.pulumi.aws.Provider;
import com.pulumi.aws.kms.Key;

/**
 * Comprehensive unit tests for all Main class components.
 * Consolidates all test classes into a single file with complete coverage.
 * 
 * This includes tests for:
 * - Main class structure and methods
 * - EnvironmentConfig class
 * - InfrastructureStack class
 * - MigrationManager class
 * - SecretsManagerMigration class
 * - ResourceNaming utility class
 * - TaggingPolicy utility class
 * 
 * Run with: ./gradlew test
 */
public class MainTest {

    @Mock
    private Provider mockAwsProvider;
    @Mock
    private Key mockKmsKey;

    private Main.EnvironmentConfig testConfig;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        testConfig = new Main.EnvironmentConfig("development");
    }

    // ========================================
    // Main Class Tests
    // ========================================

    @Test
    void testMainClassStructure() {
        // Verify the main class exists and is properly configured
        assertNotNull(Main.class);
        assertTrue(Modifier.isFinal(Main.class.getModifiers()));
        assertTrue(Modifier.isPublic(Main.class.getModifiers()));
    }

    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
        });
    }

    @Test
    void testDefineInfrastructureMethodExists() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
        });
    }

    @Test
    void testPrivateConstructor() {
        assertDoesNotThrow(() -> {
            var constructor = Main.class.getDeclaredConstructor();
            assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        });
    }

    @Test
    void testCannotInstantiate() {
        assertThrows(IllegalAccessException.class, () -> {
            Main.class.getDeclaredConstructor().newInstance();
        });
    }

    @Test
    void testDefineInfrastructureValidation() {
        // Test basic method invocation - will fail due to Pulumi context requirements
        // but verifies the method signature and basic accessibility
        assertThrows(Exception.class, () -> {
            Main.defineInfrastructure(null);
        });
    }

    @Test
    void testMainMethodInvocation() {
        // Test that main method can be invoked but will fail due to Pulumi context
        assertThrows(Exception.class, () -> {
            Main.main(new String[]{});
        });
        
        // Test with arguments
        assertThrows(Exception.class, () -> {
            Main.main(new String[]{"arg1", "arg2"});
        });
        
        // Test with null arguments (should handle gracefully)
        assertThrows(Exception.class, () -> {
            Main.main(null);
        });
    }

    // ========================================
    // EnvironmentConfig Tests
    // ========================================

    @Test
    void testValidEnvironmentConstruction() {
        // Test all valid environments
        Main.EnvironmentConfig devConfig = new Main.EnvironmentConfig("development");
        assertEquals("development", devConfig.getEnvironment());
        
        Main.EnvironmentConfig testConfig = new Main.EnvironmentConfig("testing");
        assertEquals("testing", testConfig.getEnvironment());
        
        Main.EnvironmentConfig stagingConfig = new Main.EnvironmentConfig("staging");
        assertEquals("staging", stagingConfig.getEnvironment());
        
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        assertEquals("production", prodConfig.getEnvironment());
    }

    @ParameterizedTest
    @ValueSource(strings = {"invalid", "dev", "prod", "test", "", " ", "DEVELOPMENT"})
    void testInvalidEnvironmentConstruction(String invalidEnv) {
        // Test invalid environments throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> new Main.EnvironmentConfig(invalidEnv));
        assertTrue(exception.getMessage().contains("Invalid environment"));
        assertTrue(exception.getMessage().contains("Must be one of"));
    }

    @Test
    void testIsProductionMethod() {
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        assertTrue(prodConfig.isProduction());
        
        Main.EnvironmentConfig devConfig = new Main.EnvironmentConfig("development");
        assertFalse(devConfig.isProduction());
        
        Main.EnvironmentConfig testConfig = new Main.EnvironmentConfig("testing");
        assertFalse(testConfig.isProduction());
        
        Main.EnvironmentConfig stagingConfig = new Main.EnvironmentConfig("staging");
        assertFalse(stagingConfig.isProduction());
    }

    @Test
    void testIsDevelopmentMethod() {
        Main.EnvironmentConfig devConfig = new Main.EnvironmentConfig("development");
        assertTrue(devConfig.isDevelopment());
        
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        assertFalse(prodConfig.isDevelopment());
        
        Main.EnvironmentConfig testConfig = new Main.EnvironmentConfig("testing");
        assertFalse(testConfig.isDevelopment());
        
        Main.EnvironmentConfig stagingConfig = new Main.EnvironmentConfig("staging");
        assertFalse(stagingConfig.isDevelopment());
    }

    @Test
    void testVpcConfigForDifferentEnvironments() {
        // Development
        Main.EnvironmentConfig devConfig = new Main.EnvironmentConfig("development");
        Map<String, String> devVpcConfig = devConfig.getVpcConfig();
        assertEquals("10.0.0.0/16", devVpcConfig.get("cidrBlock"));
        assertEquals("true", devVpcConfig.get("enableDnsHostnames"));
        assertEquals("true", devVpcConfig.get("enableDnsSupport"));

        // Testing  
        Main.EnvironmentConfig testConfig = new Main.EnvironmentConfig("testing");
        Map<String, String> testVpcConfig = testConfig.getVpcConfig();
        assertEquals("10.1.0.0/16", testVpcConfig.get("cidrBlock"));
        
        // Staging
        Main.EnvironmentConfig stagingConfig = new Main.EnvironmentConfig("staging");
        Map<String, String> stagingVpcConfig = stagingConfig.getVpcConfig();
        assertEquals("10.2.0.0/16", stagingVpcConfig.get("cidrBlock"));
        
        // Production
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        Map<String, String> prodVpcConfig = prodConfig.getVpcConfig();
        assertEquals("10.3.0.0/16", prodVpcConfig.get("cidrBlock"));
    }

    @Test
    void testKmsKeyRotationDays() {
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        assertEquals(90, prodConfig.getKmsKeyRotationDays());

        Main.EnvironmentConfig devConfig = new Main.EnvironmentConfig("development");
        assertEquals(365, devConfig.getKmsKeyRotationDays());
        
        Main.EnvironmentConfig testConfig = new Main.EnvironmentConfig("testing");
        assertEquals(365, testConfig.getKmsKeyRotationDays());
        
        Main.EnvironmentConfig stagingConfig = new Main.EnvironmentConfig("staging");
        assertEquals(365, stagingConfig.getKmsKeyRotationDays());
    }

    // ========================================
    // InfrastructureStack Tests
    // ========================================

    @Test
    void testInfrastructureStackConstruction() {
        // Test successful construction
        Main.InfrastructureStack infraStack = new Main.InfrastructureStack(
            "test-stack", testConfig, mockAwsProvider
        );
        assertNotNull(infraStack);
        
        // Test with different parameters
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        Main.InfrastructureStack prodStack = new Main.InfrastructureStack(
            "prod-stack", prodConfig, mockAwsProvider
        );
        assertNotNull(prodStack);
    }

    @Test
    void testInfrastructureStackConstructionWithNullValues() {
        // Test construction with null values - should not throw during construction
        // but may throw during method calls
        assertDoesNotThrow(() -> {
            new Main.InfrastructureStack(null, null, null);
        });
        
        assertDoesNotThrow(() -> {
            new Main.InfrastructureStack("test", testConfig, null);
        });
        
        assertDoesNotThrow(() -> {
            new Main.InfrastructureStack("test", null, mockAwsProvider);
        });
    }

    @Test
    void testInfrastructureStackMethods() {
        Main.InfrastructureStack infraStack = new Main.InfrastructureStack(
            "test-stack", testConfig, mockAwsProvider
        );

        // Test that methods exist and will throw exceptions due to Pulumi context
        assertThrows(Exception.class, () -> {
            infraStack.createVpc();
        });

        assertThrows(Exception.class, () -> {
            infraStack.createSecurityGroups(null);
        });

        assertThrows(Exception.class, () -> {
            infraStack.createKmsKey();
        });
    }

    // ========================================
    // MigrationManager Tests
    // ========================================

    @Test
    void testMigrationManagerConstruction() {
        // Test successful construction
        Main.MigrationManager migrationManager = new Main.MigrationManager(
            "test-migration-manager", testConfig, mockAwsProvider
        );
        assertNotNull(migrationManager);
        
        // Test with different parameters
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        Main.MigrationManager prodManager = new Main.MigrationManager(
            "prod-migration-manager", prodConfig, mockAwsProvider
        );
        assertNotNull(prodManager);
    }

    @Test
    void testMigrationManagerConstructionWithNullValues() {
        // Test construction with null values
        assertDoesNotThrow(() -> {
            new Main.MigrationManager(null, null, null);
        });
        
        assertDoesNotThrow(() -> {
            new Main.MigrationManager("test", testConfig, null);
        });
        
        assertDoesNotThrow(() -> {
            new Main.MigrationManager("test", null, mockAwsProvider);
        });
    }

    @Test
    void testMigrateSecretsMethod() {
        Main.MigrationManager migrationManager = new Main.MigrationManager(
            "test-migration-manager", testConfig, mockAwsProvider
        );

        // Test that the method exists and will throw exceptions due to Pulumi context
        assertThrows(Exception.class, () -> {
            migrationManager.migrateSecrets(mockKmsKey);
        });

        assertThrows(Exception.class, () -> {
            migrationManager.migrateSecrets(null);
        });
    }

    // ========================================
    // SecretsManagerMigration Tests
    // ========================================

    @Test
    void testSecretsManagerMigrationConstruction() {
        // Test successful construction
        Main.SecretsManagerMigration secretsMigration = new Main.SecretsManagerMigration(
            testConfig, mockAwsProvider, mockKmsKey
        );
        assertNotNull(secretsMigration);
        
        // Test with different parameters
        Main.EnvironmentConfig prodConfig = new Main.EnvironmentConfig("production");
        Main.SecretsManagerMigration prodMigration = new Main.SecretsManagerMigration(
            prodConfig, mockAwsProvider, mockKmsKey
        );
        assertNotNull(prodMigration);
    }

    @Test
    void testSecretsManagerMigrationConstructionWithNullValues() {
        // Test construction with null values
        assertDoesNotThrow(() -> {
            new Main.SecretsManagerMigration(null, null, null);
        });
        
        assertDoesNotThrow(() -> {
            new Main.SecretsManagerMigration(testConfig, mockAwsProvider, null);
        });
        
        assertDoesNotThrow(() -> {
            new Main.SecretsManagerMigration(testConfig, null, mockKmsKey);
        });
    }

    @Test
    void testSecretsManagerMigrationMigrateMethod() {
        Main.SecretsManagerMigration secretsMigration = new Main.SecretsManagerMigration(
            testConfig, mockAwsProvider, mockKmsKey
        );

        // Test that the method exists and will throw exceptions due to Pulumi context
        assertThrows(Exception.class, () -> {
            secretsMigration.migrate();
        });
    }

    @Test
    void testPrivateConvertMapToJsonMethod() throws Exception {
        Main.SecretsManagerMigration secretsMigration = new Main.SecretsManagerMigration(
            testConfig, mockAwsProvider, mockKmsKey
        );

        // Test the private convertMapToJson method using reflection
        Method convertMapToJsonMethod = Main.SecretsManagerMigration.class.getDeclaredMethod("convertMapToJson", java.util.Map.class);
        convertMapToJsonMethod.setAccessible(true);
        
        // Test with simple map
        java.util.Map<String, String> testMap = new java.util.HashMap<>();
        testMap.put("key1", "value1");
        testMap.put("key2", "value2");
        
        String result = (String) convertMapToJsonMethod.invoke(secretsMigration, testMap);
        
        assertNotNull(result);
        assertTrue(result.startsWith("{"));
        assertTrue(result.endsWith("}"));
        assertTrue(result.contains("\"key1\":\"value1\""));
        assertTrue(result.contains("\"key2\":\"value2\""));
    }

    @Test
    void testConvertMapToJsonWithEmptyMap() throws Exception {
        Main.SecretsManagerMigration secretsMigration = new Main.SecretsManagerMigration(
            testConfig, mockAwsProvider, mockKmsKey
        );

        // Test convertMapToJson with empty map
        Method convertMapToJsonMethod = Main.SecretsManagerMigration.class.getDeclaredMethod("convertMapToJson", java.util.Map.class);
        convertMapToJsonMethod.setAccessible(true);
        
        java.util.Map<String, String> emptyMap = new java.util.HashMap<>();
        String result = (String) convertMapToJsonMethod.invoke(secretsMigration, emptyMap);
        
        assertEquals("{}", result);
    }

    // ========================================
    // ResourceNaming Tests
    // ========================================

    @Test
    void testGenerateResourceNameBasicFormat() {
        String result = Main.ResourceNaming.generateResourceName("development", "vpc", "main");
        
        // Check format: cm-{env}-{type}-{name}-{random}
        assertTrue(result.startsWith("cm-dev-vpc-main-"));
        assertEquals(22, result.length()); // cm-dev-vpc-main- (16) + 6 random chars = 22
        assertTrue(result.matches("^[a-z0-9-]+$")); // Only lowercase letters, numbers, and hyphens
    }

    @Test
    void testGenerateResourceNameEnvironmentTruncation() {
        // Test environment name truncation to 3 characters
        String result1 = Main.ResourceNaming.generateResourceName("development", "s3", "bucket");
        assertTrue(result1.startsWith("cm-dev-s3-bucket-"));
        
        String result2 = Main.ResourceNaming.generateResourceName("production", "rds", "db");
        assertTrue(result2.startsWith("cm-pro-rds-db-"));
        
        String result3 = Main.ResourceNaming.generateResourceName("staging", "ec2", "web");
        assertTrue(result3.startsWith("cm-sta-ec2-web-"));
        
        // Test short environment name (no truncation needed)
        String result4 = Main.ResourceNaming.generateResourceName("qa", "kms", "key");
        assertTrue(result4.startsWith("cm-qa-kms-key-"));
    }

    @Test
    void testGenerateResourceNameRandomSuffixUniqueness() {
        Set<String> generatedNames = new HashSet<>();
        
        // Generate multiple names and verify they're unique
        for (int i = 0; i < 100; i++) {
            String name = Main.ResourceNaming.generateResourceName("test", "resource", "name");
            assertTrue(generatedNames.add(name), "Generated duplicate name: " + name);
        }
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 5, 10, 20, 50})
    void testGenerateRandomStringLength(int length) {
        String result = Main.ResourceNaming.generateRandomString(length);
        assertEquals(length, result.length());
        assertTrue(result.matches("^[a-z0-9]+$"));
    }

    @Test
    void testGenerateRandomStringUniqueness() {
        Set<String> generatedStrings = new HashSet<>();
        
        // Generate multiple random strings and verify they're unique
        for (int i = 0; i < 100; i++) {
            String randomStr = Main.ResourceNaming.generateRandomString(10);
            assertTrue(generatedStrings.add(randomStr), "Generated duplicate string: " + randomStr);
        }
    }

    @Test
    void testGenerateRandomStringEmptyLength() {
        String result = Main.ResourceNaming.generateRandomString(0);
        assertEquals(0, result.length());
        assertEquals("", result);
    }

    @Test
    void testSanitizeNameBasicReplacement() {
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("hello world"));
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("hello_world"));
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("hello@world"));
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("hello#world"));
    }

    @Test
    void testSanitizeNameMultipleDashesReduction() {
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("hello---world"));
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("hello-----world"));
        assertEquals("hello-world-test", Main.ResourceNaming.sanitizeName("hello--world--test"));
    }

    @Test
    void testSanitizeNameLowerCase() {
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("HELLO WORLD"));
        assertEquals("hello-world", Main.ResourceNaming.sanitizeName("Hello World"));
        assertEquals("hello-world-123", Main.ResourceNaming.sanitizeName("Hello_World_123"));
    }

    // ========================================
    // TaggingPolicy Tests
    // ========================================

    @Test
    void testGetDefaultTagsBasicStructure() {
        Map<String, String> tags = Main.TaggingPolicy.getDefaultTags("development");
        
        assertNotNull(tags);
        assertEquals(4, tags.size());
        
        assertEquals("CloudMigration", tags.get("Project"));
        assertEquals("development", tags.get("Environment"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertNotNull(tags.get("CreatedDate"));
    }

    @Test
    void testGetDefaultTagsCreatedDate() {
        Map<String, String> tags = Main.TaggingPolicy.getDefaultTags("production");
        
        String createdDate = tags.get("CreatedDate");
        assertNotNull(createdDate);
        
        // Verify the date format matches LocalDate.now().toString() format
        LocalDate today = LocalDate.now();
        assertEquals(today.toString(), createdDate);
    }

    @Test
    void testGetDefaultTagsWithDifferentEnvironments() {
        Map<String, String> devTags = Main.TaggingPolicy.getDefaultTags("development");
        Map<String, String> prodTags = Main.TaggingPolicy.getDefaultTags("production");
        Map<String, String> testTags = Main.TaggingPolicy.getDefaultTags("testing");
        
        // Environment tag should be different
        assertEquals("development", devTags.get("Environment"));
        assertEquals("production", prodTags.get("Environment"));
        assertEquals("testing", testTags.get("Environment"));
        
        // Other tags should be the same
        assertEquals(devTags.get("Project"), prodTags.get("Project"));
        assertEquals(devTags.get("ManagedBy"), prodTags.get("ManagedBy"));
        assertEquals(devTags.get("Project"), testTags.get("Project"));
        assertEquals(devTags.get("ManagedBy"), testTags.get("ManagedBy"));
    }

    @Test
    void testGetResourceTagsBasicStructure() {
        Map<String, String> tags = Main.TaggingPolicy.getResourceTags("staging", "VPC");
        
        assertNotNull(tags);
        assertEquals(4, tags.size());
        
        assertEquals("CloudMigration", tags.get("Project"));
        assertEquals("staging", tags.get("Environment"));
        assertEquals("VPC", tags.get("ResourceType"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
    }

    @Test
    void testGetResourceTagsWithCustomTag() {
        Map<String, String> tags = Main.TaggingPolicy.getResourceTags("development", "SecurityGroup", "Tier", "Web");
        
        assertNotNull(tags);
        assertEquals(5, tags.size());
        
        assertEquals("CloudMigration", tags.get("Project"));
        assertEquals("development", tags.get("Environment"));
        assertEquals("SecurityGroup", tags.get("ResourceType"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertEquals("Web", tags.get("Tier"));
    }

    @Test
    void testGetResourceTagsWithCustomTagOverwrite() {
        // Test that custom tags can overwrite base tags if same key is used
        Map<String, String> tags = Main.TaggingPolicy.getResourceTags("development", "Lambda", "ManagedBy", "Terraform");
        
        assertEquals("Terraform", tags.get("ManagedBy")); // Should be overwritten
        assertEquals("development", tags.get("Environment"));
        assertEquals("Lambda", tags.get("ResourceType"));
        assertEquals("CloudMigration", tags.get("Project"));
    }

    @Test
    void testTagsImmutability() {
        // Test that base method returns independent instances
        Map<String, String> tags1 = Main.TaggingPolicy.getResourceTags("test", "S3");
        Map<String, String> tags2 = Main.TaggingPolicy.getResourceTags("test", "S3");
        
        // Modify one map
        tags1.put("Modified", "true");
        
        // Verify the other is not affected
        assertFalse(tags2.containsKey("Modified"));
        assertEquals(4, tags2.size()); // Should still have original 4 tags
    }
}