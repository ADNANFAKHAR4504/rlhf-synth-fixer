package app;

import app.config.AppConfig;
import app.config.MonitoringConfig;
import app.config.NetworkConfig;
import app.config.ServiceConfig;
import app.constructs.MonitoringConstruct;
import app.constructs.LoadBalancerConstruct;
import app.constructs.NetworkConstruct;
import app.constructs.EcsClusterConstruct;
import app.constructs.ServiceDiscoveryConstruct;
import app.constructs.ServiceConstruct;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.tls.provider.TlsProvider;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

import java.util.List;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 */
public class MainStack extends TerraformStack {

    /**
     * Creates a new MainStack with basic AWS resources.
     *
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Load configurations
        AppConfig appConfig = AppConfig.defaultConfig();
        NetworkConfig networkConfig = NetworkConfig.defaultConfig();
        MonitoringConfig monitoringConfig = MonitoringConfig.defaultConfig();

        // TLS Provider
        new TlsProvider(this, "tls");

        // Configure AWS Provider
        AwsProvider.Builder.create(this, "aws").region(appConfig.region()).build();

        // Create Network
        NetworkConstruct network = new NetworkConstruct(this, "network", networkConfig);

        // Create ECS Cluster
        EcsClusterConstruct cluster = new EcsClusterConstruct(this, "ecs-cluster",
                monitoringConfig.enableContainerInsights());

        // Create Service Discovery
        ServiceDiscoveryConstruct serviceDiscovery = new ServiceDiscoveryConstruct(this, "service-discovery",
                network.getVpc().getId(), getServiceConfigs(null));

        // Create Load Balancer
        LoadBalancerConstruct loadBalancer = new LoadBalancerConstruct(this, "load-balancer",
                network.getVpc().getId(), network.getPublicSubnets().stream().map(Subnet::getId).toList(),
                getServiceConfigs(null));

        // Deploy Services
        ServiceConfig.DeploymentConfig deploymentConfig = new ServiceConfig.DeploymentConfig(cluster.getCluster().getId(),
                network.getVpc().getId(), network.getPrivateSubnets().stream().map(Subnet::getId).toList(),
                loadBalancer.getTargetGroups(), serviceDiscovery.getServices(), monitoringConfig.logRetentionDays());

        for (ServiceConfig serviceConfig : getServiceConfigs(deploymentConfig)) {
            new ServiceConstruct(this, serviceConfig.serviceName(), serviceConfig);
        }

        // Create Monitoring
        new MonitoringConstruct(this, "monitoring", monitoringConfig, cluster.getCluster().getName(),
                getServiceConfigs(null));
    }

    private List<ServiceConfig> getServiceConfigs(final ServiceConfig.DeploymentConfig config) {
        return List.of(ServiceConfig.paymentService(config), ServiceConfig.authService(config));
    }

    public String getStackId() {
        return stackId;
    }
}