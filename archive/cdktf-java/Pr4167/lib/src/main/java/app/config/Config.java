package app.config;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record Config(String environment, String vpcCidrBlock, List<String> publicSubnetCidrs,
                     List<String> privateSubnetCidrs, String containerImage, Integer kinesisShards,
                     Integer lambdaMemory, String projectName, Map<String, String> tags) {
    public static Config defaultConfig() {
        return new Config("development", "10.0.0.0/16", List.of("10.0.0.0/24", "10.0.2.0/24"),
                List.of("10.0.1.0/24", "10.0.3.0/24"), "nginx:latest", 10, 512, "log-analytics",
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
