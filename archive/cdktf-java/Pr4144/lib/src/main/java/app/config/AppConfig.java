package app.config;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public record AppConfig(String environment, String region, String appName, Map<String, String> tags) {

    public static AppConfig defaultConfig() {
        return new AppConfig("prod", "us-east-1", "fintech-payment",
                Map.of(
                        "Environment", "Production",
                        "Application", "FinTech Payment Processor",
                        "ManagedBy", "Terraform CDK",
                        "Compliance", "PCI-DSS",
                        "CreatedAt", new Date().toString()
                )
        );
    }

    public Map<String, String> mergeWithTags(final Map<String, String> additionalTags) {
        var merged = new HashMap<>(this.tags);
        merged.putAll(additionalTags);
        return Map.copyOf(merged);
    }
}
