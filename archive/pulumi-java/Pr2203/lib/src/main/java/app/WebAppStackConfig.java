package app;

import java.util.Optional;

/**
 * Configuration class for WebApp infrastructure stack Handles environment variables and
 * configuration management
 */
public class WebAppStackConfig {

  private final String awsRegion;
  private final String environmentSuffix;
  private final String instanceType;

  public WebAppStackConfig() {
    // Read AWS region from environment variable
    this.awsRegion = Optional.ofNullable(System.getenv("AWS_REGION")).orElse("us-west-2");

    // Read environment suffix from environment variable (with default)
    this.environmentSuffix = Optional.ofNullable(System.getenv("ENVIRONMENT_SUFFIX")).orElse("dev");

    // Instance configuration with defaults
    this.instanceType = Optional.ofNullable(System.getenv("INSTANCE_TYPE")).orElse("t4g.micro");
  }

  public String getAwsRegion() {
    return awsRegion;
  }

  public String getEnvironmentSuffix() {
    return environmentSuffix;
  }

  public String getInstanceType() {
    return instanceType;
  }

  /** Generate resource name with environment suffix */
  public String getResourceName(String baseName) {
    return baseName + "-" + environmentSuffix;
  }

  /** Get allowed CIDR blocks for security group access */
  public String[] getAllowedCidrBlocks() {
    return new String[] {"0.0.0.0/0"}; // In production, restrict this to specific IPs
  }
}
