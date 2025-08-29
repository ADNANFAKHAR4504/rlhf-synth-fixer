package app.config;

/**
 * Configuration class for environment-specific settings.
 * Centralizes all configuration values for the financial infrastructure.
 */
public class EnvironmentConfig {
    public static final String ENVIRONMENT = "prod";
    public static final String SERVICE_PREFIX = "financial";
    
    // Naming convention helper
    public static String getResourceName(String service, String resource) {
        return String.format("%s-%s-%s", ENVIRONMENT, service, resource);
    }
    
    // Security configuration
    public static final int PASSWORD_MAX_AGE_DAYS = 90;
    public static final int PASSWORD_MIN_LENGTH = 14;
    public static final boolean REQUIRE_UPPERCASE = true;
    public static final boolean REQUIRE_LOWERCASE = true;
    public static final boolean REQUIRE_NUMBERS = true;
    public static final boolean REQUIRE_SYMBOLS = true;
    public static final int PASSWORD_REUSE_PREVENTION = 12;
    
    // List of automation/service principal ARNs that should be exempt from the
    // interactive MFA enforcement policy. Populate with role/service role ARNs
    // used by CI/CD or automation (for example: "arn:aws:iam::123456789012:role/DeployRole").
    // Leave empty to apply MFA enforcement to all principals.
    public static final String[] MFA_EXEMPT_PRINCIPALS = new String[] {
        // "arn:aws:iam::123456789012:role/CI-CD-DeployRole",
    };
    
    // Network configuration
    public static final String VPC_CIDR = "10.0.0.0/16";
    public static final String PRIVATE_SUBNET_CIDR_1 = "10.0.1.0/24";
    public static final String PRIVATE_SUBNET_CIDR_2 = "10.0.2.0/24";
    public static final String PUBLIC_SUBNET_CIDR_1 = "10.0.101.0/24";
    public static final String PUBLIC_SUBNET_CIDR_2 = "10.0.102.0/24";
}