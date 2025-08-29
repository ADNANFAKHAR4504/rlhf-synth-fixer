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
    
    // (MFA enforcement removed) Previously we added a list of exempt principals
    // used to exclude automation roles from MFA enforcement. MFA enforcement has
    // been removed per request.
    
    // Network configuration
    public static final String VPC_CIDR = "10.0.0.0/16";
    public static final String PRIVATE_SUBNET_CIDR_1 = "10.0.1.0/24";
    public static final String PRIVATE_SUBNET_CIDR_2 = "10.0.2.0/24";
    public static final String PUBLIC_SUBNET_CIDR_1 = "10.0.101.0/24";
    public static final String PUBLIC_SUBNET_CIDR_2 = "10.0.102.0/24";
}