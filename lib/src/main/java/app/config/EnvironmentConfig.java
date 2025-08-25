package app.config;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class EnvironmentConfig {
    private final String environment;
    private final List<String> validEnvironments = Arrays.asList(
        "development", "testing", "staging", "production"
    );
    
    public EnvironmentConfig(String environment) {
        if (!validEnvironments.contains(environment)) {
            throw new IllegalArgumentException(
                "Invalid environment: " + environment + 
                ". Must be one of: " + validEnvironments
            );
        }
        this.environment = environment;
    }
    
    public String getEnvironment() {
        return environment;
    }
    
    public boolean isProduction() {
        return "production".equals(environment);
    }
    
    public boolean isDevelopment() {
        return "development".equals(environment);
    }
    
    public Map<String, String> getVpcConfig() {
        return switch (environment) {
            case "development" -> Map.of(
                "cidrBlock", "10.0.0.0/16",
                "enableDnsHostnames", "true",
                "enableDnsSupport", "true"
            );
            case "testing" -> Map.of(
                "cidrBlock", "10.1.0.0/16",
                "enableDnsHostnames", "true",
                "enableDnsSupport", "true"
            );
            case "staging" -> Map.of(
                "cidrBlock", "10.2.0.0/16",
                "enableDnsHostnames", "true",
                "enableDnsSupport", "true"
            );
            case "production" -> Map.of(
                "cidrBlock", "10.3.0.0/16",
                "enableDnsHostnames", "true",
                "enableDnsSupport", "true"
            );
            default -> throw new IllegalStateException("Unexpected environment: " + environment);
        };
    }
    
    public int getKmsKeyRotationDays() {
        return isProduction() ? 90 : 365;
    }
}