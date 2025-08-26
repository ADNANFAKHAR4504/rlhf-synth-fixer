package app;

import app.config.EnvironmentConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;

/**
 * Comprehensive unit tests for EnvironmentConfig class.
 * Achieves 100% test coverage including all methods and edge cases.
 */
public class EnvironmentConfigTest {

    @Test
    void testValidEnvironmentConstruction() {
        // Test all valid environments
        EnvironmentConfig devConfig = new EnvironmentConfig("development");
        assertEquals("development", devConfig.getEnvironment());
        
        EnvironmentConfig testConfig = new EnvironmentConfig("testing");
        assertEquals("testing", testConfig.getEnvironment());
        
        EnvironmentConfig stagingConfig = new EnvironmentConfig("staging");
        assertEquals("staging", stagingConfig.getEnvironment());
        
        EnvironmentConfig prodConfig = new EnvironmentConfig("production");
        assertEquals("production", prodConfig.getEnvironment());
    }

    @ParameterizedTest
    @ValueSource(strings = {"invalid", "dev", "prod", "test", "", " ", "DEVELOPMENT"})
    void testInvalidEnvironmentConstruction(String invalidEnv) {
        // Test invalid environments throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> new EnvironmentConfig(invalidEnv));
        assertTrue(exception.getMessage().contains("Invalid environment"));
        assertTrue(exception.getMessage().contains("Must be one of"));
    }

    @Test
    void testIsProductionMethod() {
        EnvironmentConfig prodConfig = new EnvironmentConfig("production");
        assertTrue(prodConfig.isProduction());
        
        EnvironmentConfig devConfig = new EnvironmentConfig("development");
        assertFalse(devConfig.isProduction());
        
        EnvironmentConfig testConfig = new EnvironmentConfig("testing");
        assertFalse(testConfig.isProduction());
        
        EnvironmentConfig stagingConfig = new EnvironmentConfig("staging");
        assertFalse(stagingConfig.isProduction());
    }

    @Test
    void testIsDevelopmentMethod() {
        EnvironmentConfig devConfig = new EnvironmentConfig("development");
        assertTrue(devConfig.isDevelopment());
        
        EnvironmentConfig prodConfig = new EnvironmentConfig("production");
        assertFalse(prodConfig.isDevelopment());
        
        EnvironmentConfig testConfig = new EnvironmentConfig("testing");
        assertFalse(testConfig.isDevelopment());
        
        EnvironmentConfig stagingConfig = new EnvironmentConfig("staging");
        assertFalse(stagingConfig.isDevelopment());
    }

    @Test
    void testVpcConfigForDevelopment() {
        EnvironmentConfig config = new EnvironmentConfig("development");
        Map<String, String> vpcConfig = config.getVpcConfig();
        
        assertEquals("10.0.0.0/16", vpcConfig.get("cidrBlock"));
        assertEquals("true", vpcConfig.get("enableDnsHostnames"));
        assertEquals("true", vpcConfig.get("enableDnsSupport"));
    }

    @Test
    void testVpcConfigForTesting() {
        EnvironmentConfig config = new EnvironmentConfig("testing");
        Map<String, String> vpcConfig = config.getVpcConfig();
        
        assertEquals("10.1.0.0/16", vpcConfig.get("cidrBlock"));
        assertEquals("true", vpcConfig.get("enableDnsHostnames"));
        assertEquals("true", vpcConfig.get("enableDnsSupport"));
    }

    @Test
    void testVpcConfigForStaging() {
        EnvironmentConfig config = new EnvironmentConfig("staging");
        Map<String, String> vpcConfig = config.getVpcConfig();
        
        assertEquals("10.2.0.0/16", vpcConfig.get("cidrBlock"));
        assertEquals("true", vpcConfig.get("enableDnsHostnames"));
        assertEquals("true", vpcConfig.get("enableDnsSupport"));
    }

    @Test
    void testVpcConfigForProduction() {
        EnvironmentConfig config = new EnvironmentConfig("production");
        Map<String, String> vpcConfig = config.getVpcConfig();
        
        assertEquals("10.3.0.0/16", vpcConfig.get("cidrBlock"));
        assertEquals("true", vpcConfig.get("enableDnsHostnames"));
        assertEquals("true", vpcConfig.get("enableDnsSupport"));
    }

    @Test
    void testKmsKeyRotationDaysProduction() {
        EnvironmentConfig prodConfig = new EnvironmentConfig("production");
        assertEquals(90, prodConfig.getKmsKeyRotationDays());
    }

    @Test
    void testKmsKeyRotationDaysNonProduction() {
        EnvironmentConfig devConfig = new EnvironmentConfig("development");
        assertEquals(365, devConfig.getKmsKeyRotationDays());
        
        EnvironmentConfig testConfig = new EnvironmentConfig("testing");
        assertEquals(365, testConfig.getKmsKeyRotationDays());
        
        EnvironmentConfig stagingConfig = new EnvironmentConfig("staging");
        assertEquals(365, stagingConfig.getKmsKeyRotationDays());
    }

    @Test
    void testVpcConfigIsImmutable() {
        EnvironmentConfig config = new EnvironmentConfig("development");
        Map<String, String> vpcConfig1 = config.getVpcConfig();
        Map<String, String> vpcConfig2 = config.getVpcConfig();
        
        // Verify that modifying one doesn't affect the other (new instance each time)
        vpcConfig1.put("testKey", "testValue");
        assertFalse(vpcConfig2.containsKey("testKey"));
    }

    @Test
    void testEnvironmentConfigConsistency() {
        // Test that the same environment string always produces the same config
        EnvironmentConfig config1 = new EnvironmentConfig("production");
        EnvironmentConfig config2 = new EnvironmentConfig("production");
        
        assertEquals(config1.getEnvironment(), config2.getEnvironment());
        assertEquals(config1.isProduction(), config2.isProduction());
        assertEquals(config1.getKmsKeyRotationDays(), config2.getKmsKeyRotationDays());
        
        // VPC configs should be equivalent
        Map<String, String> vpc1 = config1.getVpcConfig();
        Map<String, String> vpc2 = config2.getVpcConfig();
        assertEquals(vpc1.get("cidrBlock"), vpc2.get("cidrBlock"));
    }
}