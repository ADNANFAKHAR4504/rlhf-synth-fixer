package app.constructs;

import app.config.AppConfig;
import app.config.ServiceConfig;
import com.hashicorp.cdktf.TerraformResourceLifecycle;
import com.hashicorp.cdktf.providers.aws.service_discovery_private_dns_namespace.ServiceDiscoveryPrivateDnsNamespace;
import com.hashicorp.cdktf.providers.aws.service_discovery_service.ServiceDiscoveryService;
import com.hashicorp.cdktf.providers.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfig;
import com.hashicorp.cdktf.providers.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecords;
import com.hashicorp.cdktf.providers.aws.service_discovery_service.ServiceDiscoveryServiceHealthCheckCustomConfig;
import software.constructs.Construct;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ServiceDiscoveryConstruct extends BaseConstruct {

    private final ServiceDiscoveryPrivateDnsNamespace namespace;

    private final Map<String, ServiceDiscoveryService> services = new HashMap<>();

    public ServiceDiscoveryConstruct(final Construct scope, final String id, final String vpcId,
                                     final List<ServiceConfig> serviceConfigs
    ) {
        super(scope, id);

        AppConfig appConfig = getAppConfig();

        // Create private DNS namespace
        this.namespace = ServiceDiscoveryPrivateDnsNamespace.Builder.create(this, "namespace")
                .name(String.format("%s.local", appConfig.appName()))
                .vpc(vpcId)
                .description("Private DNS namespace for service discovery")
                .tags(appConfig.tags())
                .build();

        // Create service discovery services
        for (ServiceConfig config : serviceConfigs) {
            ServiceDiscoveryService service = ServiceDiscoveryService.Builder.create(this,
                            config.serviceName() + "-discovery")
                    .name(config.serviceName())
                    .dnsConfig(ServiceDiscoveryServiceDnsConfig.builder()
                            .namespaceId(namespace.getId())
                            .dnsRecords(List.of(ServiceDiscoveryServiceDnsConfigDnsRecords.builder()
                                    .ttl(10)
                                    .type("A")
                                    .build()))
                            .routingPolicy("MULTIVALUE")
                            .build())
                    .healthCheckCustomConfig(ServiceDiscoveryServiceHealthCheckCustomConfig.builder()
                            .failureThreshold(1)
                            .build())
                    .tags(appConfig.tags())
                    .lifecycle(TerraformResourceLifecycle.builder()
                            .preventDestroy(true)
                            .build())
                    .build();

            services.put(config.serviceName(), service);
        }
    }

    // Getters
    public ServiceDiscoveryPrivateDnsNamespace getNamespace() {
        return namespace;
    }

    public Map<String, ServiceDiscoveryService> getServices() {
        return services;
    }
}
