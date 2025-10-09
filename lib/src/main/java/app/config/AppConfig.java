package app.config;

import java.util.Date;
import java.util.List;
import java.util.Map;

public record AppConfig(String environment, String region, String projectName, NetworkConfig networkConfig,
                        SecurityConfig securityConfig, MonitoringConfig monitoringConfig,
                        List<String> existingInstanceIds, Map<String, String> tags) {
    public static AppConfig defaultConfig() {
        return new AppConfig("production", "us-east-1", "vpc-migration",
                NetworkConfig.defaultConfig(), SecurityConfig.defaultConfig(), MonitoringConfig.defaultConfig(),
                List.of(), Map.of(
                "Environment", "production",
                "ManagedBy", "CDKTF",
                "Project", "VPC-Migration",
                "CreatedAt", new Date().toString()
        ));
    }
}
