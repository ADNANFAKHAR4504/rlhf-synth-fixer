package app.constructs;

import app.config.AppConfig;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsCluster;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsClusterSetting;
import com.hashicorp.cdktf.providers.aws.ecs_cluster_capacity_providers.EcsClusterCapacityProviders;
import com.hashicorp.cdktf.providers.aws.ecs_cluster_capacity_providers.EcsClusterCapacityProvidersDefaultCapacityProviderStrategy;
import software.constructs.Construct;

import java.util.List;

public class EcsClusterConstruct extends BaseConstruct {

    private final EcsCluster cluster;

    public EcsClusterConstruct(final Construct scope, final String id, final boolean enableContainerInsights) {
        super(scope, id);

        AppConfig appConfig = getAppConfig();

        this.cluster = EcsCluster.Builder.create(this, "cluster")
                .name(String.format("%s-cluster-%s", appConfig.appName(), appConfig.environment()))
                .setting(List.of(EcsClusterSetting.builder()
                        .name("containerInsights")
                        .value(enableContainerInsights ? "enabled" : "disabled")
                        .build()))
                .tags(appConfig.tags())
                .build();

        // Enable Fargate capacity providers
        EcsClusterCapacityProviders.Builder.create(this, "capacity-providers")
                .clusterName(cluster.getName())
                .capacityProviders(List.of("FARGATE", "FARGATE_SPOT"))
                .defaultCapacityProviderStrategy(List.of(
                        EcsClusterCapacityProvidersDefaultCapacityProviderStrategy.builder()
                                .capacityProvider("FARGATE")
                                .weight(1)
                                .base(1)
                                .build(),
                        EcsClusterCapacityProvidersDefaultCapacityProviderStrategy.builder()
                                .capacityProvider("FARGATE_SPOT")
                                .weight(4)
                                .build()
                ))
                .build();
    }

    public EcsCluster getCluster() {
        return cluster;
    }
}
