package app.config;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public record Config(String environment, String vpcCidrBlock, String containerImage, Integer kinesisShards,
                     Integer lambdaMemory, String projectName, Map<String, String> tags) {
    public static Config defaultConfig() {
        return new Config("development", "10.0.0.0/16", "nginx:latest", 10, 512, "log-analytics",
                Map.of(
                "Environment", "development",
                "ManagedBy", "CDK For Terraform",
                "Project", "Log Analytics",
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
