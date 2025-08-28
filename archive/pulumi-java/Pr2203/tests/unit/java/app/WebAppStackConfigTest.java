package app;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

/** Unit tests for WebAppStackConfig class. */
class WebAppStackConfigTest {

  @Test
  void testWebAppStackConfigInitialization() {
    // Test that WebAppStackConfig can be instantiated
    WebAppStackConfig config = new WebAppStackConfig();
    assertNotNull(config);
  }

  @Test
  void testGetAwsRegion() {
    WebAppStackConfig config = new WebAppStackConfig();
    String region = config.getAwsRegion();
    assertNotNull(region);
    // Should have a default value if environment variable not set
    assertTrue(region.length() > 0);
  }

  @Test
  void testGetEnvironmentSuffix() {
    WebAppStackConfig config = new WebAppStackConfig();
    String suffix = config.getEnvironmentSuffix();
    assertNotNull(suffix);
    // Should have a default value if environment variable not set
    assertTrue(suffix.length() > 0);
  }

  @Test
  void testGetInstanceType() {
    WebAppStackConfig config = new WebAppStackConfig();
    String instanceType = config.getInstanceType();
    assertNotNull(instanceType);
    assertEquals("t4g.micro", instanceType); // Default value
  }

  @Test
  void testGetAllowedCidrBlocks() {
    WebAppStackConfig config = new WebAppStackConfig();
    String[] cidrBlocks = config.getAllowedCidrBlocks();
    assertNotNull(cidrBlocks);
    assertEquals(1, cidrBlocks.length);
    assertEquals("0.0.0.0/0", cidrBlocks[0]); // Default value
  }

  @Test
  void testGetResourceName() {
    WebAppStackConfig config = new WebAppStackConfig();
    String baseName = "test-resource";
    String resourceName = config.getResourceName(baseName);
    assertNotNull(resourceName);
    assertTrue(resourceName.contains(baseName));
    assertTrue(resourceName.contains(config.getEnvironmentSuffix()));
  }
}
