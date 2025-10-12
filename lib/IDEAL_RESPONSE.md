**app.config.AppConfig**
```java
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
```

**app.config.MonitoringConfig**
```java
package app.config;

import java.util.List;

public record MonitoringConfig(boolean enableContainerInsights, int logRetentionDays, List<String> alarmEmails,
                               MetricThresholds metricThresholds) {
    public record MetricThresholds(double cpuAlarmThreshold, double memoryAlarmThreshold, int unhealthyTaskThreshold,
                                   int httpErrorRateThreshold) {
    }

    public static MonitoringConfig defaultConfig() {
        return new MonitoringConfig(true, 30, List.of("ops-team@fintech.com"),
                new MetricThresholds(85.0, 85.0, 1, 5)
        );
    }
}
```

**app.config.NetworkConfig**
```java
package app.config;

import java.util.List;

public record NetworkConfig(String vpcCidr, List<String> publicSubnetCidrs, List<String> privateSubnetCidrs,
                            List<String> availabilityZones, boolean enableNatGateway, boolean enableVpnGateway) {
    public static NetworkConfig defaultConfig() {
        return new NetworkConfig("10.0.0.0/16", List.of("10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"),
                List.of("10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"),
                List.of("us-east-1a", "us-east-1b", "us-east-1c"), true, false
        );
    }
}
```

**app.config.ServiceConfig**
```java
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
                8080, 512, 1024, 3, 2, 10, 70, 80, 60, config
        );
    }

    public static ServiceConfig authService(final DeploymentConfig config) {
        return new ServiceConfig("auth-service", "nginx:latest", 8081, 256,
                512, 2, 1, 5, 70, 80, 60, config
        );
    }
}
```

**app.Main**
```java
package app;

import com.hashicorp.cdktf.S3Backend;
import com.hashicorp.cdktf.S3BackendConfig;

import com.hashicorp.cdktf.App;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();

        MainStack stack = new MainStack(app, "fintech-payment-infra");

        /*
         * Configures S3 backend for remote Terraform state storage.
         */
        new S3Backend(stack, S3BackendConfig.builder()
                .bucket(System.getenv("TERRAFORM_STATE_BUCKET"))
                .key("prs/" + System.getenv("ENVIRONMENT_SUFFIX") + "/" + stack.getStackId() + ".tfstate")
                .region(System.getenv("TERRAFORM_STATE_BUCKET_REGION"))
                .encrypt(true)
                .build());

        app.synth();
    }
}
```

**app.MainStack**
```java
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
                cluster.getCluster().getName(), getServiceConfigs(null));

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
```

**app.constructs.BaseConstruct**
```java
package app.constructs;

import app.config.AppConfig;
import software.constructs.Construct;

import java.util.Map;

public abstract class BaseConstruct extends Construct {

    private final AppConfig appConfig;

    public BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.appConfig = AppConfig.defaultConfig();
    }

    protected Map<String, String> mergeTags(final Map<String, String> additionalTags) {
        return appConfig.mergeWithTags(additionalTags);
    }

    protected AppConfig getAppConfig() {
        return appConfig;
    }

    protected String getEnvironment() {
        return appConfig.environment();
    }

    protected String getRegion() {
        return appConfig.region();
    }

    protected String appName() {
        return appConfig.appName();
    }

    protected Map<String, String> getTags() {
        return appConfig.tags();
    }
}
```

**app.constructs.EcsClusterConstruct**
```java
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
```

**app.constructs.LoadBalancerConstruct**
```java
package app.constructs;

import app.config.AppConfig;
import app.config.ServiceConfig;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificate;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificateConfig;
import com.hashicorp.cdktf.providers.aws.alb.Alb;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListener;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultAction;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultActionFixedResponse;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultActionRedirect;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRule;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRuleAction;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRuleCondition;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroup;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroupHealthCheck;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupEgress;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupIngress;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKey;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKeyConfig;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCert;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertConfig;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertSubject;
import software.constructs.Construct;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LoadBalancerConstruct extends BaseConstruct {

    private final Alb alb;

    private final Map<String, AlbTargetGroup> targetGroups = new HashMap<>();

    private final List<ServiceConfig> services;

    public LoadBalancerConstruct(final Construct scope, final String id, final String vpcId,
                                 final List<String> subnetIds, final List<ServiceConfig> serviceConfigs) {
        super(scope, id);

        this.services = serviceConfigs;

        AppConfig appConfig = getAppConfig();

        // Create ALB security group
        SecurityGroup albSg = SecurityGroup.Builder.create(this, "alb-sg")
                .vpcId(vpcId)
                .name(String.format("%s-alb-sg", appConfig.appName()))
                .description("Security group for Application Load Balancer")
                .ingress(List.of(
                        SecurityGroupIngress.builder()
                                .fromPort(80)
                                .toPort(80)
                                .protocol("tcp")
                                .cidrBlocks(List.of("0.0.0.0/0"))
                                .description("Allow HTTP from anywhere")
                                .build(),
                        SecurityGroupIngress.builder()
                                .fromPort(443)
                                .toPort(443)
                                .protocol("tcp")
                                .cidrBlocks(List.of("0.0.0.0/0"))
                                .description("Allow HTTPS from anywhere")
                                .build()
                ))
                .egress(List.of(SecurityGroupEgress.builder()
                        .fromPort(0)
                        .toPort(0)
                        .protocol("-1")
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("Allow all outbound traffic")
                        .build()))
                .tags(appConfig.tags())
                .build();

        // Create Application Load Balancer
        this.alb = Alb.Builder.create(this, "alb")
                .name(String.format("%s-alb-%s", appConfig.appName(), appConfig.environment()))
                .internal(false)
                .loadBalancerType("application")
                .securityGroups(List.of(albSg.getId()))
                .subnets(subnetIds)
                .enableDeletionProtection(appConfig.environment().equals("prod"))
                .enableHttp2(true)
                .tags(appConfig.tags())
                .build();

        // Create target groups for each service
        for (ServiceConfig service : services) {
            AlbTargetGroup tg = createTargetGroup(appConfig, service, vpcId);
            targetGroups.put(service.serviceName(), tg);
        }

        // Create listeners
        createListeners();
    }

    private AlbTargetGroup createTargetGroup(final AppConfig appConfig, final ServiceConfig service,
                                             final String vpcId) {
        String name = String.format("%s-%s-tg", appConfig.appName(), service.serviceName());

        if (name.length() > 32) {
            name = name.substring(0, 32);
            while (name.endsWith("-")) {
                name = name.substring(0, name.length() - 1);
            }
        }

        return AlbTargetGroup.Builder.create(this, service.serviceName() + "-tg")
                .name(name)
                .port(service.containerPort())
                .protocol("HTTP")
                .vpcId(vpcId)
                .targetType("ip")
                .healthCheck(AlbTargetGroupHealthCheck.builder()
                        .enabled(true)
                        .path("/health")
                        .protocol("HTTP")
                        .healthyThreshold(2)
                        .unhealthyThreshold(3)
                        .timeout(5)
                        .interval(30)
                        .matcher("200-299")
                        .build())
                .deregistrationDelay("30")
                .tags(appConfig.tags())
                .build();
    }

    private void createListeners() {
        AcmCertificate sslCert = createSSLCertificate();

        // Create HTTP Listener (redirects to HTTPS)
        AlbListener.Builder.create(this, "alb-http-listener")
                .loadBalancerArn(alb.getArn())
                .port(80)
                .protocol("HTTP")
                .defaultAction(List.of(AlbListenerDefaultAction.builder()
                        .type("redirect")
                        .redirect(AlbListenerDefaultActionRedirect.builder()
                                .port("443")
                                .protocol("HTTPS")
                                .statusCode("HTTP_301")
                                .build())
                        .build()))
                .build();

        if (!targetGroups.isEmpty()) {
            // Create HTTPS Listener with fixed response as default
            AlbListener httpsListener = AlbListener.Builder.create(this, "alb-https-listener")
                    .loadBalancerArn(alb.getArn())
                    .port(443)
                    .protocol("HTTPS")
                    .sslPolicy("ELBSecurityPolicy-TLS-1-2-2017-01")
                    .certificateArn(sslCert.getArn())
                    .defaultAction(List.of(AlbListenerDefaultAction.builder()
                            .type("fixed-response")
                            .fixedResponse(AlbListenerDefaultActionFixedResponse.builder()
                                    .contentType("text/plain")
                                    .messageBody("Service not found")
                                    .statusCode("404")
                                    .build())
                            .build()))
                    .build();

            // Create listener rules for each service
            int priority = 1;
            for (ServiceConfig service : services) {
                AlbTargetGroup tg = targetGroups.get(service.serviceName());
                if (tg != null) {
                    AlbListenerRule.Builder.create(this, service.serviceName() + "-rule")
                            .listenerArn(httpsListener.getArn())
                            .priority(priority++)
                            .action(List.of(AlbListenerRuleAction.builder()
                                    .type("forward")
                                    .targetGroupArn(tg.getArn())
                                    .build()))
                            .condition(List.of(AlbListenerRuleCondition.builder()
                                    .pathPattern(AlbListenerRuleConditionPathPattern.builder()
                                            .values(List.of("/" + service.serviceName() + "/*", "/" + service.serviceName()))
                                            .build())
                                    .build()))
                            .build();
                }
            }
        }
    }

    private AcmCertificate createSSLCertificate() {
        // Generate private key
        PrivateKey privateKey = new PrivateKey(this, "ssl-cert-key",
                PrivateKeyConfig.builder()
                        .algorithm("RSA")
                        .rsaBits(2048)
                        .build());

        // Create self-signed certificate
        SelfSignedCert selfSignedCert = new SelfSignedCert(this, "ssl-self-signed",
                SelfSignedCertConfig.builder()
                        .privateKeyPem(privateKey.getPrivateKeyPem())
                        .validityPeriodHours(365 * 24)
                        .subject(List.of(
                                SelfSignedCertSubject.builder()
                                        .commonName("turing.com")
                                        .organization("My Organization")
                                        .country("US")
                                        .province("CA")
                                        .locality("San Francisco")
                                        .build()
                        ))
                        .dnsNames(List.of("turing.com", "*." + "turing.com"))
                        .allowedUses(List.of("key_encipherment", "data_encipherment", "server_auth"))
                        .build());

        // Import to ACM
        return new AcmCertificate(this, "acm-cert", AcmCertificateConfig.builder()
                .privateKey(privateKey.getPrivateKeyPem())
                .certificateBody(selfSignedCert.getCertPem())
                .tags(Map.of(
                        "Name", String.format("%s-%s-cert", "Web App Certificate", "Production"),
                        "Environment", "Production"
                ))
                .build());
    }

    // Getters
    public Alb getAlb() {
        return alb;
    }

    public Map<String, AlbTargetGroup> getTargetGroups() {
        return targetGroups;
    }
}
```

**app.constructs.MonitoringConstruct**
```java
package app.constructs;

import app.config.AppConfig;
import app.config.MonitoringConfig;
import app.config.ServiceConfig;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hashicorp.cdktf.providers.aws.cloudwatch_dashboard.CloudwatchDashboard;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import software.constructs.Construct;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MonitoringConstruct extends BaseConstruct {

    private final SnsTopic alarmTopic;

    private final List<CloudwatchMetricAlarm> alarms = new ArrayList<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public MonitoringConstruct(final Construct scope, final String id, final MonitoringConfig config,
                               final String clusterName, final List<ServiceConfig> services) {
        super(scope, id);

        AppConfig appConfig = getAppConfig();

        // Create SNS topic for alarms
        this.alarmTopic = SnsTopic.Builder.create(this, "alarm-topic")
                .name(String.format("%s-alarms", appConfig.appName()))
                .tags(appConfig.tags())
                .build();

        // Subscribe emails to topic
        for (String email : config.alarmEmails()) {
            SnsTopicSubscription.Builder.create(this, "email-" + email.hashCode())
                    .topicArn(alarmTopic.getArn())
                    .protocol("email")
                    .endpoint(email)
                    .build();
        }

        // Create alarms for each service
        for (ServiceConfig service : services) {
            createServiceAlarms(appConfig, config, clusterName, service);
        }

        // Create dashboard
        createDashboard(appConfig, clusterName, services);
    }

    private void createServiceAlarms(final AppConfig appConfig, final MonitoringConfig config, final String clusterName,
                                     final ServiceConfig service) {
        // CPU utilization alarm
        CloudwatchMetricAlarm cpuAlarm = CloudwatchMetricAlarm.Builder.create(this, service.serviceName() + "-cpu-alarm")
                .alarmName(String.format("%s-%s-high-cpu", appConfig.appName(), service.serviceName()))
                .alarmDescription(String.format("High CPU utilization for %s", service.serviceName()))
                .metricName("CPUUtilization")
                .namespace("AWS/ECS")
                .statistic("Average")
                .period(300)
                .evaluationPeriods(2)
                .threshold(config.metricThresholds().cpuAlarmThreshold())
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "ClusterName", clusterName,
                        "ServiceName", service.serviceName()
                ))
                .alarmActions(List.of(alarmTopic.getArn()))
                .tags(appConfig.tags())
                .build();
        alarms.add(cpuAlarm);

        // Memory utilization alarm
        CloudwatchMetricAlarm memoryAlarm = CloudwatchMetricAlarm.Builder.create(this, service.serviceName() + "-memory-alarm")
                .alarmName(String.format("%s-%s-high-memory", appConfig.appName(), service.serviceName()))
                .alarmDescription(String.format("High memory utilization for %s", service.serviceName()))
                .metricName("MemoryUtilization")
                .namespace("AWS/ECS")
                .statistic("Average")
                .period(300)
                .evaluationPeriods(2)
                .threshold(config.metricThresholds().memoryAlarmThreshold())
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "ClusterName", clusterName,
                        "ServiceName", service.serviceName()
                ))
                .alarmActions(List.of(alarmTopic.getArn()))
                .tags(appConfig.tags())
                .build();
        alarms.add(memoryAlarm);

        // Task count alarm
        CloudwatchMetricAlarm taskAlarm = CloudwatchMetricAlarm.Builder.create(this, service.serviceName() + "-task-alarm")
                .alarmName(String.format("%s-%s-low-tasks", appConfig.appName(), service.serviceName()))
                .alarmDescription(String.format("Low running task count for %s", service.serviceName()))
                .metricName("RunningTaskCount")
                .namespace("AWS/ECS")
                .statistic("Average")
                .period(60)
                .evaluationPeriods(2)
                .threshold((double) config.metricThresholds().unhealthyTaskThreshold())
                .comparisonOperator("LessThanThreshold")
                .dimensions(Map.of(
                        "ClusterName", clusterName,
                        "ServiceName", service.serviceName()
                ))
                .alarmActions(List.of(alarmTopic.getArn()))
                .treatMissingData("breaching")
                .tags(appConfig.tags())
                .build();
        alarms.add(taskAlarm);
    }

    private void createDashboard(final AppConfig appConfig, final String clusterName,
                                 final List<ServiceConfig> services) {

        List<Object> widgets = new ArrayList<>();

        // Cluster overview
        widgets.add(createTextWidget("ECS Cluster Overview", 0));
        widgets.add(createMetricWidget("Cluster CPU Utilization", List.of(List.of("AWS/ECS", "CPUUtilization",
                "ClusterName", clusterName)), 0, 1)
        );
        widgets.add(createMetricWidget("Cluster Memory Utilization", List.of(List.of("AWS/ECS", "MemoryUtilization",
                "ClusterName", clusterName)), 12, 1)
        );

        // Service metrics
        int yPosition = 7;
        for (ServiceConfig service : services) {
            widgets.add(createTextWidget(service.serviceName() + " Metrics", yPosition));
            yPosition++;

            widgets.add(createMetricWidget(service.serviceName() + " CPU",
                    List.of(List.of("AWS/ECS", "CPUUtilization",
                            "ClusterName", clusterName,
                            "ServiceName", service.serviceName()
                    )),
                    0, yPosition
            ));

            widgets.add(createMetricWidget(service.serviceName() + " Memory",
                    List.of(List.of("AWS/ECS", "MemoryUtilization",
                            "ClusterName", clusterName,
                            "ServiceName", service.serviceName()
                    )),
                    12, yPosition
            ));

            yPosition += 6;
        }

        String dashboardBody = String.format("""
                {
                    "widgets": %s
                }
                """, toJson(widgets));

        CloudwatchDashboard.Builder.create(this, "dashboard")
                .dashboardName(String.format("%s-%s", appConfig.appName(), appConfig.environment()))
                .dashboardBody(dashboardBody)
                .build();
    }

    private Map<String, Object> createTextWidget(final String text, final int y) {
        return Map.of("type", "text", "x", 0, "y", y, "width", 24, "height", 1,
                "properties", Map.of("markdown", "# " + text)
        );
    }

    private Map<String, Object> createMetricWidget(final String title, final List<List<Object>> metrics, final int x,
                                                   final int y) {
        return Map.of("type", "metric", "x", x, "y", y, "width", 12, "height", 6,
                "properties", Map.of(
                        "metrics", metrics,
                        "period", 300,
                        "stat", "Average",
                        "region", "us-east-1",
                        "title", title
                )
        );
    }

    private String toJson(final Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            System.err.println("Failed to serialize object: " + e.getMessage());
            return "{}";
        }
    }

    // Getters
    public SnsTopic getAlarmTopic() {
        return alarmTopic;
    }

    public List<CloudwatchMetricAlarm> getAlarms() {
        return alarms;
    }
}
```

**app.constructs.NetworkConstruct**
```java
package app.constructs;

import app.config.AppConfig;
import app.config.NetworkConfig;
import com.hashicorp.cdktf.providers.aws.eip.Eip;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGateway;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGateway;
import com.hashicorp.cdktf.providers.aws.route.Route;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTable;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociation;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import software.constructs.Construct;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class NetworkConstruct extends BaseConstruct {

    private final Vpc vpc;

    private final List<Subnet> publicSubnets;

    private final List<Subnet> privateSubnets;

    public NetworkConstruct(final Construct scope, final String id, final NetworkConfig config) {
        super(scope, id);

        AppConfig appConfig = getAppConfig();

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "vpc")
                .cidrBlock(config.vpcCidr())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(appConfig.tags())
                .build();

        // Create Internet Gateway
        InternetGateway igw = InternetGateway.Builder.create(this, "igw")
                .vpcId(vpc.getId())
                .tags(appConfig.tags())
                .build();

        // Create subnets
        this.publicSubnets = new ArrayList<>();
        this.privateSubnets = new ArrayList<>();

        // Public subnets
        for (int i = 0; i < config.publicSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "public-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.publicSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(true)
                    .tags(mergeTags(Map.of("Name", String.format("%s-public-subnet-%d", appConfig.appName(), i))))
                    .build();
            publicSubnets.add(subnet);
        }

        // Private subnets
        List<NatGateway> natGateways = new ArrayList<>();
        if (config.enableNatGateway()) {
            // Create NAT Gateways for each AZ
            for (int i = 0; i < config.availabilityZones().size(); i++) {
                Eip eip = Eip.Builder.create(this, "nat-eip-" + i)
                        .domain("vpc")
                        .tags(appConfig.tags())
                        .build();

                NatGateway natGateway = NatGateway.Builder.create(this, "nat-gateway-" + i)
                        .allocationId(eip.getId())
                        .subnetId(publicSubnets.get(i).getId())
                        .tags(appConfig.tags())
                        .build();
                natGateways.add(natGateway);
            }
        }

        for (int i = 0; i < config.privateSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "private-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.privateSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .tags(mergeTags(Map.of("Name", String.format("%s-private-subnet-%d", appConfig.appName(), i))))
                    .build();
            privateSubnets.add(subnet);
        }

        // Route tables
        RouteTable publicRouteTable = RouteTable.Builder.create(this, "public-rt")
                .vpcId(vpc.getId())
                .tags(appConfig.tags())
                .build();

        Route.Builder.create(this, "public-route")
                .routeTableId(publicRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.getId())
                .build();

        // Associate public subnets with public route table
        for (int i = 0; i < publicSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "public-rta-" + i)
                    .subnetId(publicSubnets.get(i).getId())
                    .routeTableId(publicRouteTable.getId())
                    .build();
        }

        // Private route tables (one per AZ for HA)
        if (config.enableNatGateway()) {
            for (int i = 0; i < privateSubnets.size(); i++) {
                RouteTable privateRouteTable = RouteTable.Builder.create(this, "private-rt-" + i)
                        .vpcId(vpc.getId())
                        .tags(appConfig.tags())
                        .build();

                Route.Builder.create(this, "private-route-" + i)
                        .routeTableId(privateRouteTable.getId())
                        .destinationCidrBlock("0.0.0.0/0")
                        .natGatewayId(natGateways.get(i).getId())
                        .build();

                RouteTableAssociation.Builder.create(this, "private-rta-" + i)
                        .subnetId(privateSubnets.get(i).getId())
                        .routeTableId(privateRouteTable.getId())
                        .build();
            }
        }
    }

    // Getters
    public Vpc getVpc() {
        return vpc;
    }

    public List<Subnet> getPublicSubnets() {
        return publicSubnets;
    }

    public List<Subnet> getPrivateSubnets() {
        return privateSubnets;
    }
}
```

**app.constructs.ServiceConstruct**
```java
package app.constructs;

import app.config.AppConfig;
import app.config.ServiceConfig;
import com.hashicorp.cdktf.providers.aws.appautoscaling_policy.AppautoscalingPolicy;
import com.hashicorp.cdktf.providers.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration;
import com.hashicorp.cdktf.providers.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification;
import com.hashicorp.cdktf.providers.aws.appautoscaling_target.AppautoscalingTarget;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsService;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceDeploymentController;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceLoadBalancer;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceNetworkConfiguration;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceServiceRegistries;
import com.hashicorp.cdktf.providers.aws.ecs_task_definition.EcsTaskDefinition;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupEgress;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupIngress;
import software.constructs.Construct;

import java.util.List;

public class ServiceConstruct extends BaseConstruct {

    private final EcsService service;

    private final EcsTaskDefinition taskDefinition;

    private final SecurityGroup securityGroup;

    public ServiceConstruct(final Construct scope, final String id, final ServiceConfig serviceConfig) {
        super(scope, id);

        AppConfig appConfig = getAppConfig();

        ServiceConfig.DeploymentConfig deploymentConfig = serviceConfig.deploymentConfig();

        // Create CloudWatch Log Group
        CloudwatchLogGroup logGroup = CloudwatchLogGroup.Builder.create(this, "log-group")
                .name(String.format("/ecs/%s/%s", appConfig.appName(), serviceConfig.serviceName()))
                .retentionInDays(deploymentConfig.logRetentionDays())
                .tags(appConfig.tags())
                .build();

        // Create IAM roles
        IamRole taskExecutionRole = createTaskExecutionRole(appConfig, serviceConfig);
        IamRole taskRole = createTaskRole(appConfig, serviceConfig);

        // Create Security Group
        this.securityGroup = SecurityGroup.Builder.create(this, "sg")
                .vpcId(deploymentConfig.vpcId())
                .name(String.format("%s-%s-sg", appConfig.appName(), serviceConfig.serviceName()))
                .description(String.format("Security group for %s service", serviceConfig.serviceName()))
                .ingress(List.of(SecurityGroupIngress.builder()
                        .fromPort(serviceConfig.containerPort())
                        .toPort(serviceConfig.containerPort())
                        .protocol("tcp")
                        .cidrBlocks(List.of("10.0.0.0/16"))
                        .description("Allow traffic from VPC")
                        .build()))
                .egress(List.of(SecurityGroupEgress.builder()
                        .fromPort(0)
                        .toPort(0)
                        .protocol("-1")
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("Allow all outbound traffic")
                        .build()))
                .tags(appConfig.tags())
                .build();

        // Create Task Definition
        String containerDefinitions = createContainerDefinitions(serviceConfig, logGroup.getName(), appConfig.region());

        this.taskDefinition = EcsTaskDefinition.Builder.create(this, "task-def")
                .family(String.format("%s-%s", appConfig.appName(), serviceConfig.serviceName()))
                .networkMode("awsvpc")
                .requiresCompatibilities(List.of("FARGATE"))
                .cpu(String.valueOf(serviceConfig.cpu()))
                .memory(String.valueOf(serviceConfig.memory()))
                .executionRoleArn(taskExecutionRole.getArn())
                .taskRoleArn(taskRole.getArn())
                .containerDefinitions(containerDefinitions)
                .tags(appConfig.tags())
                .build();

        // Create ECS Service
        this.service = EcsService.Builder.create(this, "service")
                .name(serviceConfig.serviceName())
                .cluster(deploymentConfig.clusterId())
                .taskDefinition(taskDefinition.getArn())
                .desiredCount(serviceConfig.desiredCount())
                .launchType("FARGATE")
                .deploymentController(EcsServiceDeploymentController.builder()
                        .type("ECS")
                        .build())
                .networkConfiguration(EcsServiceNetworkConfiguration.builder()
                        .subnets(deploymentConfig.subnetIds())
                        .securityGroups(List.of(securityGroup.getId()))
                        .assignPublicIp(false)
                        .build())
                .loadBalancer(List.of(EcsServiceLoadBalancer.builder()
                        .targetGroupArn(deploymentConfig.targetGroup().get(id).getArn())
                        .containerName(serviceConfig.serviceName())
                        .containerPort(serviceConfig.containerPort())
                        .build()))
                .serviceRegistries(EcsServiceServiceRegistries.builder()
                        .registryArn(deploymentConfig.serviceDiscovery().get(id).getArn())
                        .build())
                .healthCheckGracePeriodSeconds(serviceConfig.healthCheckGracePeriod())
                .deploymentMinimumHealthyPercent(100)
                .deploymentMaximumPercent(200)
                .enableExecuteCommand(true)
                .tags(appConfig.tags())
                .build();

        // Configure Auto Scaling
        configureAutoScaling(appConfig, serviceConfig);
    }

    private IamRole createTaskExecutionRole(final AppConfig appConfig, final ServiceConfig serviceConfig) {
        String assumeRolePolicy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Action": "sts:AssumeRole",
                      "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                      },
                      "Effect": "Allow"
                    }
                  ]
                }
                """;

        IamRole role = IamRole.Builder.create(this, "task-execution-role")
                .name(String.format("%s-%s-task-execution", appConfig.appName(), serviceConfig.serviceName()))
                .assumeRolePolicy(assumeRolePolicy)
                .tags(appConfig.tags())
                .build();

        IamRolePolicyAttachment.Builder.create(this, "task-execution-policy")
                .role(role.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy")
                .build();

        return role;
    }

    private IamRole createTaskRole(final AppConfig appConfig, final ServiceConfig serviceConfig) {
        String assumeRolePolicy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Action": "sts:AssumeRole",
                      "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                      },
                      "Effect": "Allow"
                    }
                  ]
                }
                """;

        return IamRole.Builder.create(this, "task-role")
                .name(String.format("%s-%s-task", appConfig.appName(), serviceConfig.serviceName()))
                .assumeRolePolicy(assumeRolePolicy)
                .tags(appConfig.tags())
                .build();
    }

    private String createContainerDefinitions(final ServiceConfig serviceConfig, final String logGroupName,
                                              final String region) {
        return String.format("""
                        [
                          {
                            "name": "%s",
                            "image": "%s",
                            "cpu": 0,
                            "portMappings": [
                              {
                                "containerPort": %d,
                                "protocol": "tcp"
                              }
                            ],
                            "essential": true,
                            "logConfiguration": {
                              "logDriver": "awslogs",
                              "options": {
                                "awslogs-group": "%s",
                                "awslogs-region": "%s",
                                "awslogs-stream-prefix": "ecs"
                              }
                            },
                            "healthCheck": {
                              "command": ["CMD-SHELL", "curl -f http://localhost:%d/health || exit 1"],
                              "interval": 30,
                              "timeout": 5,
                              "retries": 3,
                              "startPeriod": 60
                            }
                          }
                        ]
                        """, serviceConfig.serviceName(), serviceConfig.imageUri(), serviceConfig.containerPort(),
                logGroupName, region, serviceConfig.containerPort()
        );
    }

    private void configureAutoScaling(final AppConfig appConfig, final ServiceConfig serviceConfig) {
        String resourceId = String.format("service/%s-%s-%s/%s",
                appConfig.appName(), "cluster", appConfig.environment(), serviceConfig.serviceName());

        AppautoscalingTarget target = AppautoscalingTarget.Builder.create(this, "scaling-target")
                .maxCapacity(serviceConfig.maxCount())
                .minCapacity(serviceConfig.minCount())
                .resourceId(resourceId)
                .scalableDimension("ecs:service:DesiredCount")
                .serviceNamespace("ecs")
                .dependsOn(List.of(service))
                .build();

        // CPU scaling policy
        AppautoscalingPolicy.Builder.create(this, "cpu-scaling")
                .name(String.format("%s-cpu-scaling", serviceConfig.serviceName()))
                .policyType("TargetTrackingScaling")
                .resourceId(target.getResourceId())
                .scalableDimension(target.getScalableDimension())
                .serviceNamespace(target.getServiceNamespace())
                .targetTrackingScalingPolicyConfiguration(AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration.builder()
                        .predefinedMetricSpecification(
                                AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification.builder()
                                .predefinedMetricType("ECSServiceAverageCPUUtilization")
                                .build())
                        .targetValue((double) serviceConfig.targetCpuPercent())
                        .build())
                .build();

        // Memory scaling policy
        AppautoscalingPolicy.Builder.create(this, "memory-scaling")
                .name(String.format("%s-memory-scaling", serviceConfig.serviceName()))
                .policyType("TargetTrackingScaling")
                .resourceId(target.getResourceId())
                .scalableDimension(target.getScalableDimension())
                .serviceNamespace(target.getServiceNamespace())
                .targetTrackingScalingPolicyConfiguration(AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration.builder()
                        .predefinedMetricSpecification(
                                AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification.builder()
                                .predefinedMetricType("ECSServiceAverageMemoryUtilization")
                                .build())
                        .targetValue((double) serviceConfig.targetMemoryPercent())
                        .build())
                .build();
    }

    // Getters
    public EcsService getService() {
        return service;
    }

    public EcsTaskDefinition getTaskDefinition() {
        return taskDefinition;
    }

    public SecurityGroup getSecurityGroup() {
        return securityGroup;
    }
}
```

**app.constructs.ServiceDiscoveryConstruct**
```java
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
                            .failureThreshold(3)
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
```
