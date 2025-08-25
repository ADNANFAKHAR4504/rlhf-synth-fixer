package app;

import app.InfrastructureConfig;
import java.util.Map;

public class TagUtils {
    public static Map<String, String> getStandardTags(InfrastructureConfig config) {
        return Map.of(
            "Environment", config.getEnvironment(),
            "Company", config.getCompanyName(),
            "ManagedBy", "Pulumi",
            "Compliance", "FinancialServices"
        );
    }
    
    public static Map<String, String> getStandardTags(InfrastructureConfig config, String service) {
        var tags = new java.util.HashMap<>(getStandardTags(config));
        tags.put("Service", service);
        return tags;
    }
    
    public static Map<String, String> getStandardTags(InfrastructureConfig config, String service, String component) {
        var tags = new java.util.HashMap<>(getStandardTags(config, service));
        tags.put("Component", component);
        return tags;
    }
}