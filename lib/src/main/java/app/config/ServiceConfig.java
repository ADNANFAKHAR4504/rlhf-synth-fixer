package app.config;

import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroup;
import com.hashicorp.cdktf.providers.aws.service_discovery_service.ServiceDiscoveryService;

import java.util.List;
import java.util.Map;

public record ServiceConfig(String serviceName, String imageUri, int containerPort, int cpu, int memory,
                            int desiredCount, int minCount, int maxCount, int targetCpuPercent, int targetMemoryPercent,
                            int healthCheckGracePeriod, DeploymentConfig deploymentConfig) {
    public record DeploymentConfig(String clusterId, String vpcId, List<String> subnetIds,
                                   Map<String, AlbTargetGroup> targetGroup,
                                   Map<String, ServiceDiscoveryService> serviceDiscovery, int logRetentionDays) {
    }

    public static ServiceConfig paymentService(final DeploymentConfig config) {
        return new ServiceConfig("payment-service", "nginx:latest",
                80, 512, 1024, 3, 2, 10, 70, 80, 60, config
        );
    }

    public static ServiceConfig authService(final DeploymentConfig config) {
        return new ServiceConfig("auth-service", "nginx:latest", 80, 256,
                512, 2, 1, 5, 70, 80, 60, config
        );
    }
}
