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
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
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

        List<ServiceConstruct> services = new java.util.ArrayList<>();
        for (ServiceConfig serviceConfig : getServiceConfigs(deploymentConfig)) {
            services.add(new ServiceConstruct(this, serviceConfig.serviceName(), serviceConfig));
        }

        // Create Monitoring
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring", monitoringConfig,
                cluster.getCluster().getName(), getServiceConfigs(null), services);

        // Output VPC information
        new TerraformOutput(this, "vpcId", TerraformOutputConfig.builder()
                .value(network.getVpc().getId())
                .description("VPC ID")
                .build());

        new TerraformOutput(this, "vpcCidr", TerraformOutputConfig.builder()
                .value(network.getVpc().getCidrBlock())
                .description("VPC CIDR Block")
                .build());

        // Output Subnet information
        new TerraformOutput(this, "publicSubnetIds", TerraformOutputConfig.builder()
                .value(String.join(",", network.getPublicSubnets().stream().map(Subnet::getId).toList()))
                .description("Public Subnet IDs")
                .build());

        new TerraformOutput(this, "privateSubnetIds", TerraformOutputConfig.builder()
                .value(String.join(",", network.getPrivateSubnets().stream().map(Subnet::getId).toList()))
                .description("Private Subnet IDs")
                .build());

        // Output ECS Cluster information
        new TerraformOutput(this, "ecsClusterName", TerraformOutputConfig.builder()
                .value(cluster.getCluster().getName())
                .description("ECS Cluster Name")
                .build());

        new TerraformOutput(this, "ecsClusterArn", TerraformOutputConfig.builder()
                .value(cluster.getCluster().getArn())
                .description("ECS Cluster ARN")
                .build());

        // Output Load Balancer information
        new TerraformOutput(this, "albArn", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getArn())
                .description("Application Load Balancer ARN")
                .build());

        new TerraformOutput(this, "albDnsName", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getDnsName())
                .description("Application Load Balancer DNS Name")
                .build());

        new TerraformOutput(this, "albUrl", TerraformOutputConfig.builder()
                .value("https://" + loadBalancer.getAlb().getDnsName())
                .description("Application Load Balancer URL")
                .build());

        // Output Service Discovery information
        new TerraformOutput(this, "serviceDiscoveryNamespace", TerraformOutputConfig.builder()
                .value(serviceDiscovery.getNamespace().getName())
                .description("Service Discovery Namespace")
                .build());

        new TerraformOutput(this, "serviceDiscoveryNamespaceId", TerraformOutputConfig.builder()
                .value(serviceDiscovery.getNamespace().getId())
                .description("Service Discovery Namespace ID")
                .build());

        // Output Target Group ARNs
        loadBalancer.getTargetGroups().forEach((name, tg) -> {
            new TerraformOutput(this, name + "TargetGroupArn", TerraformOutputConfig.builder()
                    .value(tg.getArn())
                    .description(name + " Target Group ARN")
                    .build());
        });

        // Output ECS Service information
        for (int i = 0; i < services.size(); i++) {
            ServiceConstruct service = services.get(i);
            ServiceConfig serviceConfig = getServiceConfigs(deploymentConfig).get(i);
            String serviceName = serviceConfig.serviceName();

            new TerraformOutput(this, serviceName + "ServiceName", TerraformOutputConfig.builder()
                    .value(service.getService().getName())
                    .description(serviceName + " ECS Service Name")
                    .build());

            new TerraformOutput(this, serviceName + "ServiceArn", TerraformOutputConfig.builder()
                    .value(service.getService().getId())
                    .description(serviceName + " ECS Service ARN")
                    .build());

            new TerraformOutput(this, serviceName + "TaskDefinitionArn", TerraformOutputConfig.builder()
                    .value(service.getTaskDefinition().getArn())
                    .description(serviceName + " Task Definition ARN")
                    .build());

            new TerraformOutput(this, serviceName + "SecurityGroupId", TerraformOutputConfig.builder()
                    .value(service.getSecurityGroup().getId())
                    .description(serviceName + " Security Group ID")
                    .build());
        }

        // Output Monitoring information
        new TerraformOutput(this, "snsTopicArn", TerraformOutputConfig.builder()
                .value(monitoring.getAlarmTopic().getArn())
                .description("SNS Topic ARN for Alarms")
                .build());

        new TerraformOutput(this, "cloudWatchAlarmCount", TerraformOutputConfig.builder()
                .value(String.valueOf(monitoring.getAlarms().size()))
                .description("Number of CloudWatch Alarms")
                .build());
    }

    private List<ServiceConfig> getServiceConfigs(final ServiceConfig.DeploymentConfig config) {
        return List.of(ServiceConfig.paymentService(config), ServiceConfig.authService(config));
    }

    public String getStackId() {
        return stackId;
    }
}