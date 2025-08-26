package app.config;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

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
        Map<String, String> config = new HashMap<>();
        
        switch (environment) {
            case "development":
                config.put("cidrBlock", "10.0.0.0/16");
                config.put("enableDnsHostnames", "true");
                config.put("enableDnsSupport", "true");
                break;
            case "testing":
                config.put("cidrBlock", "10.1.0.0/16");
                config.put("enableDnsHostnames", "true");
                config.put("enableDnsSupport", "true");
                break;
            case "staging":
                config.put("cidrBlock", "10.2.0.0/16");
                config.put("enableDnsHostnames", "true");
                config.put("enableDnsSupport", "true");
                break;
            case "production":
                config.put("cidrBlock", "10.3.0.0/16");
                config.put("enableDnsHostnames", "true");
                config.put("enableDnsSupport", "true");
                break;
            default:
                throw new IllegalStateException("Unexpected environment: " + environment);
        }
        
        return config;
    }
    
    public int getKmsKeyRotationDays() {
        return isProduction() ? 90 : 365;
    }
}