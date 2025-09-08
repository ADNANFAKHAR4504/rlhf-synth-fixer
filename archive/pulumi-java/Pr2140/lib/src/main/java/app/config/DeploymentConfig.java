package app.config;


import com.pulumi.Context;

import java.util.List;
import java.util.Map;

public class DeploymentConfig {
    private final String managementRegion;
    private final List<String> targetRegions;
    private final List<String> targetAccounts;
    private final String applicationName;
    private final String environment;
    private final Map<String, String> tags;

    public DeploymentConfig(Context ctx) {

        var config = ctx.config();

        this.managementRegion = config.get("managementRegion").orElse("us-east-1");

        this.targetRegions = config.getObject("targetRegions", String[].class)
                .map(List::of)
                .orElse(List.of("us-east-1", "us-west-2", "eu-west-1"));

        this.targetAccounts = config.getObject("targetAccounts", String[].class)
                .map(List::of)
                .orElse(List.of("123456789012", "123456789013"));

        this.applicationName = config.get("applicationName").orElse("multi-region-web-app");
        this.environment = config.get("environment").orElse("production");

        this.tags = Map.of(
                "Application", applicationName,
                "Environment", environment,
                "ManagedBy", "Pulumi",
                "Project", "MultiRegionWebApp"
        );
    }

    public String getManagementRegion() {
        return managementRegion;
    }

    public List<String> getTargetRegions() {
        return targetRegions;
    }

    public List<String> getTargetAccounts() {
        return targetAccounts;
    }

    public String getApplicationName() {
        return applicationName;
    }

    public String getEnvironment() {
        return environment;
    }

    public Map<String, String> getTags() {
        return tags;
    }
}