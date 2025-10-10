```java
package app.config;

import java.util.Date;
import java.util.HashMap;
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

    public Map<String, String> mergeWithTags(final Map<String, String> additionalTags) {
        var merged = new HashMap<>(this.tags);
        merged.putAll(additionalTags);
        return Map.copyOf(merged);
    }
}
```

```java
package app.config;

public record MonitoringConfig(int cpuThresholdPercent, int evaluationPeriods, int periodSeconds, String snsTopicEmail,
                               boolean enableDetailedMonitoring) {
    public static MonitoringConfig defaultConfig() {
        return new MonitoringConfig(80, 2, 300, "admin@turing.com", true);
    }
}
```

```java
package app.config;

import java.util.List;

public record NetworkConfig(String vpcCidr, List<String> publicSubnetCidrs, List<String> privateSubnetCidrs,
                            List<String> availabilityZones, boolean enableDnsHostnames, boolean enableDnsSupport,
                            boolean enableNatGateway) {
    public static NetworkConfig defaultConfig() {
        return new NetworkConfig(
                "10.0.0.0/16", List.of("10.0.1.0/24", "10.0.2.0/24"), List.of("10.0.10.0/24", "10.0.11.0/24"),
                List.of("us-east-1a", "us-east-1b"), true, true, true
        );
    }
}
```

```java
package app.config;

public record SecurityConfig(String allowedSshIp, int sshPort, int httpPort, int httpsPort, String kmsKeyAlias,
                             boolean enableEncryption, String instanceType, String amiId) {
    public static SecurityConfig defaultConfig() {
        return new SecurityConfig("0.0.0.0/32", 22, 80, 443, "alias/vpc-migration-key",
                true, "t3.medium", "ami-0c02fb55956c7d316"
        );
    }
}
```

```java
package app.constructs;

import app.config.AppConfig;
import app.config.MonitoringConfig;
import app.config.NetworkConfig;
import app.config.SecurityConfig;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public abstract class BaseConstruct extends Construct {

    private final AppConfig config;

    public BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.config = AppConfig.defaultConfig();
    }

    protected Map<String, String> mergeTags(final Map<String, String> additionalTags) {
        return config.mergeWithTags(additionalTags);
    }

    protected String getEnvironment() {
        return config.environment();
    }

    protected String getRegion() {
        return config.region();
    }

    protected String getProjectName() {
        return config.projectName();
    }

    protected NetworkConfig getNetworkConfig() {
        return config.networkConfig();
    }

    protected SecurityConfig getSecurityConfig() {
        return config.securityConfig();
    }

    protected MonitoringConfig getMonitoringConfig() {
        return config.monitoringConfig();
    }

    protected List<String> getExistingInstanceIds() {
        return config.existingInstanceIds();
    }

    protected Map<String, String> getTags() {
        return config.tags();
    }
}
```

```java
package app.constructs;

import app.config.SecurityConfig;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroup;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupLaunchTemplate;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupTag;
import com.hashicorp.cdktf.providers.aws.instance.Instance;
import com.hashicorp.cdktf.providers.aws.instance.InstanceRootBlockDevice;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplate;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateConfig;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateMonitoring;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateIamInstanceProfile;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateTagSpecifications;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateBlockDeviceMappings;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateBlockDeviceMappingsEbs;
import software.constructs.Construct;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.Base64;

public class ComputeConstruct extends BaseConstruct {

    private final LaunchTemplate launchTemplate;

    private final AutoscalingGroup autoScalingGroup;

    private final List<Instance> instances;

    private final Map<String, String> tags;

    public ComputeConstruct(final Construct scope, final String id, final List<String> subnetIds,
                            final SecurityConstruct security, final String targetGroupArn) {
        super(scope, id);

        SecurityConfig securityConfig = getSecurityConfig();
        this.instances = new ArrayList<>();
        this.tags = getTags();

        String securityGroupId = security.getInstanceSecurityGroupId();
        String instanceProfileArn = security.getInstanceProfileArn();
        String instanceProfileName = security.getInstanceProfileName();
        String kmsKeyId = security.getKmsKeyId();
        String kmsKeyArn = security.getKmsKeyArn();

        // Create launch template for blue-green deployment
        this.launchTemplate = createLaunchTemplate(securityConfig, securityGroupId, instanceProfileArn, kmsKeyArn, id);

        // Create Auto Scaling Group
        this.autoScalingGroup = createAutoScalingGroup(subnetIds, targetGroupArn, id);

        // Create initial instances for migration
        createMigrationInstances(securityConfig, subnetIds, securityGroupId, instanceProfileName, kmsKeyId);
    }

    private LaunchTemplate createLaunchTemplate(final SecurityConfig config, final String securityGroupId,
                                                final String instanceProfileArn, final String kmsKeyArn, final String id) {

        String userData = Base64.getEncoder().encodeToString("""
                #!/bin/bash
                # Update system
                yum update -y

                # Install and start web server
                yum install -y httpd
                systemctl start httpd
                systemctl enable httpd

                # Create health check endpoint
                echo "OK" > /var/www/html/health

                # Create index page
                echo "<h1>VPC Migration Instance</h1>" > /var/www/html/index.html
                echo "<p>Instance is running successfully</p>" >> /var/www/html/index.html

                # Install CloudWatch agent
                wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
                rpm -U ./amazon-cloudwatch-agent.rpm

                # Configure CloudWatch agent
                cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
                {
                    "metrics": {
                        "namespace": "VPCMigration",
                        "metrics_collected": {
                            "cpu": {
                                "measurement": [
                                    {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                                    "cpu_usage_iowait"
                                ],
                                "metrics_collection_interval": 60
                            },
                            "disk": {
                                "measurement": [
                                    {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
                                ],
                                "metrics_collection_interval": 60,
                                "resources": ["*"]
                            },
                            "mem": {
                                "measurement": [
                                    {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                                ],
                                "metrics_collection_interval": 60
                            }
                        }
                    }
                }
                EOF

                # Start CloudWatch agent
                /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
                    -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
                """.getBytes());

        LaunchTemplateConfig.Builder builder = LaunchTemplateConfig.builder()
                .name(id + "-launch-template")
                .description("Launch template for migrated instances")
                .imageId(config.amiId())
                .instanceType(config.instanceType())
                .userData(userData)
                .vpcSecurityGroupIds(List.of(securityGroupId))
                .iamInstanceProfile(LaunchTemplateIamInstanceProfile.builder()
                        .arn(instanceProfileArn)
                        .build())
                .monitoring(LaunchTemplateMonitoring.builder()
                        .enabled(true)
                        .build())
                .tagSpecifications(List.of(
                        LaunchTemplateTagSpecifications.builder()
                                .resourceType("instance")
                                .tags(mergeTags(Map.of("Name", "migrated-instance")))
                                .build(),
                        LaunchTemplateTagSpecifications.builder()
                                .resourceType("volume")
                                .tags(mergeTags(Map.of("Name", "migrated-volume")))
                                .build()
                ))
                .tags(tags);

        if (config.enableEncryption()) {
            builder.blockDeviceMappings(List.of(
                    LaunchTemplateBlockDeviceMappings.builder()
                            .deviceName("/dev/xvda")
                            .ebs(LaunchTemplateBlockDeviceMappingsEbs.builder()
                                    .encrypted("true")
                                    .volumeSize(30)
                                    .volumeType("gp3")
                                    .deleteOnTermination("true")
                                    .build())
                            .build()
            ));
        }

        return new LaunchTemplate(this, "launch-template", builder.build());
    }

    private AutoscalingGroup createAutoScalingGroup(final List<String> subnetIds, final String targetGroupArn,
                                                    final String id) {

        List<AutoscalingGroupTag> asgTags = tags.entrySet().stream()
                .map(entry -> AutoscalingGroupTag.builder()
                        .key(entry.getKey())
                        .value(entry.getValue())
                        .propagateAtLaunch(true)
                        .build())
                .toList();

        return AutoscalingGroup.Builder.create(this, "asg")
                .name(id + "-asg")
                .minSize(2)
                .maxSize(6)
                .desiredCapacity(2)
                .healthCheckType("ELB")
                .healthCheckGracePeriod(300)
                .vpcZoneIdentifier(subnetIds)
                .targetGroupArns(List.of(targetGroupArn))
                .launchTemplate(AutoscalingGroupLaunchTemplate.builder()
                        .id(launchTemplate.getId())
                        .version("$Latest")
                        .build())
                .tag(asgTags)
                .build();
    }

    private void createMigrationInstances(final SecurityConfig config, final List<String> subnetIds,
                                          final String securityGroupId, final String instanceProfileName,
                                          final String kmsKeyId) {

        // Create instances for immediate migration (blue-green approach)
        for (int i = 0; i < Math.min(2, subnetIds.size()); i++) {
            Instance instance = Instance.Builder.create(this, "migration-instance-" + i)
                    .ami(config.amiId())
                    .instanceType(config.instanceType())
                    .subnetId(subnetIds.get(i))
                    .vpcSecurityGroupIds(List.of(securityGroupId))
                    .iamInstanceProfile(instanceProfileName)
                    .monitoring(true)
                    .rootBlockDevice(InstanceRootBlockDevice.builder()
                            .encrypted(config.enableEncryption())
                            .kmsKeyId(config.enableEncryption() ? kmsKeyId : null)
                            .volumeSize(30)
                            .volumeType("gp3")
                            .build())
                    .tags(mergeTags(Map.of(
                            "Name", "migration-instance-" + i,
                            "Type", "Migration"
                    )))
                    .build();

            instances.add(instance);
        }
    }

    // Getters
    public List<String> getInstanceIds() {
        return instances.stream().map(Instance::getId).toList();
    }

    public String getAutoScalingGroupName() {
        return autoScalingGroup.getName();
    }
}
```

```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.lb.Lb;
import com.hashicorp.cdktf.providers.aws.lb_listener.LbListener;
import com.hashicorp.cdktf.providers.aws.lb_listener.LbListenerDefaultAction;
import com.hashicorp.cdktf.providers.aws.lb_target_group.LbTargetGroup;
import com.hashicorp.cdktf.providers.aws.lb_target_group.LbTargetGroupHealthCheck;
import com.hashicorp.cdktf.providers.aws.lb_target_group.LbTargetGroupStickiness;
import com.hashicorp.cdktf.providers.aws.lb_target_group_attachment.LbTargetGroupAttachment;
import com.hashicorp.cdktf.providers.aws.lb_target_group_attachment.LbTargetGroupAttachmentConfig;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class LoadBalancerConstruct extends BaseConstruct {

    private final Lb applicationLoadBalancer;

    private final LbTargetGroup targetGroup;

    private final LbListener httpListener;

    public LoadBalancerConstruct(final Construct scope, final String id, final List<String> subnetIds,
                                 final String securityGroupId, final String vpcId) {
        super(scope, id);

        // Create Application Load Balancer
        String albName = (id + "-alb").substring(0, Math.min(32, (id + "-alb").length()));
        this.applicationLoadBalancer = Lb.Builder.create(this, "alb")
                .name(albName)
                .internal(false)
                .loadBalancerType("application")
                .securityGroups(List.of(securityGroupId))
                .subnets(subnetIds)
                .enableDeletionProtection(false)
                .enableHttp2(true)
                .tags(mergeTags(Map.of("Name", id + "-alb")))
                .build();

        // Create Target Group
        String tgName = (id + "-tg").substring(0, Math.min(32, (id + "-tg").length()));
        this.targetGroup = LbTargetGroup.Builder.create(this, "tg")
                .name(tgName)
                .port(80)
                .protocol("HTTP")
                .vpcId(vpcId)
                .targetType("instance")
                .healthCheck(LbTargetGroupHealthCheck.builder()
                        .enabled(true)
                        .interval(30)
                        .path("/health")
                        .protocol("HTTP")
                        .timeout(5)
                        .healthyThreshold(2)
                        .unhealthyThreshold(2)
                        .matcher("200-299")
                        .build())
                .deregistrationDelay("300")
                .stickiness(LbTargetGroupStickiness.builder()
                        .enabled(true)
                        .type("lb_cookie")
                        .cookieDuration(86400)
                        .build())
                .tags(mergeTags(Map.of("Name", id + "-tg")))
                .build();

        // Create HTTP Listener
        this.httpListener = LbListener.Builder.create(this, "http-listener")
                .loadBalancerArn(applicationLoadBalancer.getArn())
                .port(80)
                .protocol("HTTP")
                .defaultAction(List.of(LbListenerDefaultAction.builder()
                        .type("forward")
                        .targetGroupArn(targetGroup.getArn())
                        .build()))
                .tags(getTags())
                .build();

        // Attach existing instances to target group if provided
        attachInstances(getExistingInstanceIds());
    }

    private void attachInstances(final List<String> instanceIds) {
        if (instanceIds != null && !instanceIds.isEmpty()) {
            for (int i = 0; i < instanceIds.size(); i++) {
                LbTargetGroupAttachment.Builder.create(this, "tg-attachment-" + i)
                        .targetGroupArn(targetGroup.getArn())
                        .targetId(instanceIds.get(i))
                        .port(80)
                        .build();
            }
        }
    }

    public void attachInstance(final String instanceId, final int port) {
        new LbTargetGroupAttachment(this, "tg-attachment-" + instanceId,
                LbTargetGroupAttachmentConfig.builder()
                        .targetGroupArn(targetGroup.getArn())
                        .targetId(instanceId)
                        .port(port)
                        .build());
    }

    // Getters
    public Lb getAlb() {
        return applicationLoadBalancer;
    }

    public LbTargetGroup getTargetGroup() {
        return targetGroup;
    }

    public LbListener getHttpListener() {
        return httpListener;
    }
}
```

```java
package app.constructs;

import app.config.MonitoringConfig;
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

    private final List<CloudwatchMetricAlarm> alarms;

    private final CloudwatchDashboard dashboard;

    public MonitoringConstruct(final Construct scope, final String id, final String autoScalingGroupName,
                               final String albArn) {
        super(scope, id);

        MonitoringConfig monitoringConfig = getMonitoringConfig();
        this.alarms = new ArrayList<>();

        // Create SNS topic for alarms
        this.alarmTopic = SnsTopic.Builder.create(this, "alarm-topic")
                .name(id + "-alarms")
                .displayName("VPC Migration Alarms")
                .tags(getTags())
                .build();

        // Subscribe email to SNS topic
        SnsTopicSubscription.Builder.create(this, "email-subscription")
                .topicArn(alarmTopic.getArn())
                .protocol("email")
                .endpoint(monitoringConfig.snsTopicEmail())
                .build();

        // Create CloudWatch alarms
        createCpuAlarm(monitoringConfig, autoScalingGroupName);
        createTargetHealthAlarm(albArn);
        createRequestCountAlarm(albArn);

        // Create CloudWatch Dashboard
        this.dashboard = createDashboard(autoScalingGroupName);
    }

    private void createCpuAlarm(final MonitoringConfig config, final String autoScalingGroupName) {
        CloudwatchMetricAlarm cpuAlarm = CloudwatchMetricAlarm.Builder.create(this, "cpu-alarm")
                .alarmName("high-cpu-utilization")
                .alarmDescription("Alarm when CPU exceeds " + config.cpuThresholdPercent() + "%")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(config.evaluationPeriods())
                .metricName("CPUUtilization")
                .namespace("AWS/EC2")
                .period(config.periodSeconds())
                .statistic("Average")
                .threshold(config.cpuThresholdPercent())
                .actionsEnabled(true)
                .alarmActions(List.of(alarmTopic.getArn()))
                .dimensions(Map.of("AutoScalingGroupName", autoScalingGroupName))
                .treatMissingData("breaching")
                .build();

        alarms.add(cpuAlarm);
    }

    private void createTargetHealthAlarm(final String albArn) {
        String albDimension = albArn.substring(albArn.indexOf("loadbalancer/") + "loadbalancer/".length());

        CloudwatchMetricAlarm healthAlarm = CloudwatchMetricAlarm.Builder.create(this, "target-health-alarm")
                .alarmName("unhealthy-targets")
                .alarmDescription("Alarm when targets become unhealthy")
                .comparisonOperator("LessThanThreshold")
                .evaluationPeriods(2)
                .metricName("HealthyHostCount")
                .namespace("AWS/ApplicationELB")
                .period(60)
                .statistic("Average")
                .threshold(1)
                .actionsEnabled(true)
                .alarmActions(List.of(alarmTopic.getArn()))
                .dimensions(Map.of("LoadBalancer", albDimension))
                .treatMissingData("breaching")
                .build();

        alarms.add(healthAlarm);
    }

    private void createRequestCountAlarm(final String albArn) {
        String albDimension = albArn.substring(albArn.indexOf("loadbalancer/") + "loadbalancer/".length());

        CloudwatchMetricAlarm requestAlarm = CloudwatchMetricAlarm.Builder.create(this, "request-count-alarm")
                .alarmName("high-request-count")
                .alarmDescription("Alarm when request count is unusually high")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("RequestCount")
                .namespace("AWS/ApplicationELB")
                .period(300)
                .statistic("Sum")
                .threshold(10000)
                .actionsEnabled(true)
                .alarmActions(List.of(alarmTopic.getArn()))
                .dimensions(Map.of("LoadBalancer", albDimension))
                .build();

        alarms.add(requestAlarm);
    }

    private CloudwatchDashboard createDashboard(final String autoScalingGroupName) {
        String dashboardBody = String.format("""
                {
                    "widgets": [
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
                                    ["...", {"stat": "Maximum"}]
                                ],
                                "period": 300,
                                "stat": "Average",
                                "region": "us-east-1",
                                "title": "EC2 CPU Utilization",
                                "dimensions": {
                                    "AutoScalingGroupName": "%s"
                                }
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                                    [".", "RequestCount", {"stat": "Sum"}],
                                    [".", "HealthyHostCount", {"stat": "Average"}],
                                    [".", "UnHealthyHostCount", {"stat": "Average"}]
                                ],
                                "period": 300,
                                "stat": "Average",
                                "region": "us-east-1",
                                "title": "ALB Metrics"
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/EC2", "NetworkIn", {"stat": "Sum"}],
                                    [".", "NetworkOut", {"stat": "Sum"}]
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "Network Traffic"
                            }
                        }
                    ]
                }
                """, autoScalingGroupName);

        return CloudwatchDashboard.Builder.create(this, "dashboard")
                .dashboardName("vpc-migration-dashboard")
                .dashboardBody(dashboardBody)
                .build();
    }

    // Getters
    public String getAlarmTopicArn() {
        return alarmTopic.getArn();
    }

    public List<String> getAlarmNames() {
        return alarms.stream().map(CloudwatchMetricAlarm::getAlarmName).toList();
    }

    public CloudwatchDashboard getDashboard() {
        return dashboard;
    }
}
```

```java
package app.constructs;

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

    private final InternetGateway internetGateway;

    private final NatGateway natGateway;

    public NetworkConstruct(final Construct scope, final String id) {
        super(scope, id);

        NetworkConfig networkConfig = getNetworkConfig();
        Map<String, String> tags = getTags();

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "vpc")
                .cidrBlock(networkConfig.vpcCidr())
                .enableDnsHostnames(networkConfig.enableDnsHostnames())
                .enableDnsSupport(networkConfig.enableDnsSupport())
                .tags(mergeTags(Map.of("Name", id + "-vpc")))
                .build();

        // Create Internet Gateway
        this.internetGateway = InternetGateway.Builder.create(this, "igw")
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", id + "-igw")))
                .build();

        // Create subnets
        this.publicSubnets = createPublicSubnets(networkConfig, tags);
        this.privateSubnets = createPrivateSubnets(networkConfig, tags);

        // Create NAT Gateway if enabled
        if (networkConfig.enableNatGateway()) {
            Eip natEip = Eip.Builder.create(this, "nat-eip")
                    .domain("vpc")
                    .tags(mergeTags(Map.of("Name", id + "-nat-eip")))
                    .build();

            this.natGateway = NatGateway.Builder.create(this, "nat")
                    .allocationId(natEip.getId())
                    .subnetId(publicSubnets.get(0).getId())
                    .tags(mergeTags(Map.of("Name", id + "-nat")))
                    .build();

            setupPrivateRouting();
        } else {
            this.natGateway = null;
        }

        setupPublicRouting();
    }

    private List<Subnet> createPublicSubnets(final NetworkConfig config, final Map<String, String> tags) {
        List<Subnet> subnets = new ArrayList<>();

        for (int i = 0; i < config.publicSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "public-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.publicSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(true)
                    .tags(mergeTags(Map.of(
                            "Name", "public-subnet-" + config.availabilityZones().get(i),
                            "Type", "Public"
                    )))
                    .build();
            subnets.add(subnet);
        }

        return subnets;
    }

    private List<Subnet> createPrivateSubnets(final NetworkConfig config, final Map<String, String> tags) {
        List<Subnet> subnets = new ArrayList<>();

        for (int i = 0; i < config.privateSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "private-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.privateSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(false)
                    .tags(mergeTags(Map.of(
                            "Name", "private-subnet-" + config.availabilityZones().get(i),
                            "Type", "Private"
                    )))
                    .build();
            subnets.add(subnet);
        }

        return subnets;
    }

    private void setupPublicRouting() {
        RouteTable publicRouteTable = RouteTable.Builder.create(this, "public-rt")
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", "public-route-table")))
                .build();

        Route.Builder.create(this, "public-route")
                .routeTableId(publicRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(internetGateway.getId())
                .build();

        for (int i = 0; i < publicSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "public-rta-" + i)
                    .routeTableId(publicRouteTable.getId())
                    .subnetId(publicSubnets.get(i).getId())
                    .build();
        }
    }

    private void setupPrivateRouting() {
        RouteTable privateRouteTable = RouteTable.Builder.create(this, "private-rt")
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", "private-route-table")))
                .build();

        Route.Builder.create(this, "private-route")
                .routeTableId(privateRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.getId())
                .build();

        for (int i = 0; i < privateSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "private-rta-" + i)
                    .routeTableId(privateRouteTable.getId())
                    .subnetId(privateSubnets.get(i).getId())
                    .build();
        }
    }

    // Getters
    public String getVpcId() {
        return vpc.getId();
    }

    public List<String> getPublicSubnetIds() {
        return publicSubnets.stream().map(Subnet::getId).toList();
    }

    public List<String> getPrivateSubnetIds() {
        return privateSubnets.stream().map(Subnet::getId).toList();
    }

    public Vpc getVpc() {
        return vpc;
    }
}
```

```java
package app.constructs;

import app.config.SecurityConfig;
import com.hashicorp.cdktf.providers.aws.iam_instance_profile.IamInstanceProfile;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.data_aws_caller_identity.DataAwsCallerIdentity;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAliasConfig;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKeyConfig;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class SecurityConstruct extends BaseConstruct {

    private final SecurityGroup instanceSecurityGroup;

    private final SecurityGroup albSecurityGroup;

    private final IamRole instanceRole;

    private final IamInstanceProfile instanceProfile;

    private final KmsKey kmsKey;

    public SecurityConstruct(final Construct scope, final String id, final String vpcId) {
        super(scope, id);

        SecurityConfig securityConfig = getSecurityConfig();

        // Get current AWS account ID for KMS policy
        DataAwsCallerIdentity currentIdentity = new DataAwsCallerIdentity(this, "current");

        // Create KMS Key for encryption with proper policy for Auto Scaling
        String kmsPolicy = String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::%s:root"
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow Auto Scaling to use the key",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "autoscaling.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow EC2 service to use the key",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """, currentIdentity.getAccountId());

        this.kmsKey = new KmsKey(this, "kms-key", KmsKeyConfig.builder()
                .description("KMS key for VPC migration encryption")
                .enableKeyRotation(true)
                .policy(kmsPolicy)
                .tags(mergeTags(Map.of("Name", id + "-kms-key")))
                .build());

        new KmsAlias(this, "kms-alias", KmsAliasConfig.builder()
                .name(securityConfig.kmsKeyAlias())
                .targetKeyId(kmsKey.getId())
                .build());

        // Create instance security group
        this.instanceSecurityGroup = createInstanceSecurityGroup(securityConfig, vpcId);

        // Create ALB security group
        this.albSecurityGroup = createAlbSecurityGroup(securityConfig, vpcId);

        // Create IAM role for instances
        this.instanceRole = createInstanceRole(getTags());

        // Create instance profile
        this.instanceProfile = IamInstanceProfile.Builder.create(this, "instance-profile")
                .role(instanceRole.getName())
                .name(id + "-instance-profile")
                .tags(getTags())
                .build();

        // Attach necessary policies
        attachPolicies();
    }

    private SecurityGroup createInstanceSecurityGroup(final SecurityConfig config, final String vpcId) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "instance-sg")
                .name("instance-security-group")
                .description("Security group for EC2 instances")
                .vpcId(vpcId)
                .tags(mergeTags(Map.of("Name", "instance-sg")))
                .build();

        // SSH access from specific IP
        if (!config.allowedSshIp().equals("0.0.0.0/32")) {
            SecurityGroupRule.Builder.create(this, "ssh-rule")
                    .type("ingress")
                    .fromPort(config.sshPort())
                    .toPort(config.sshPort())
                    .protocol("tcp")
                    .cidrBlocks(List.of(config.allowedSshIp()))
                    .securityGroupId(securityGroup.getId())
                    .description("SSH access from specific IP")
                    .build();
        }

        // Egress rule - allow all outbound
        SecurityGroupRule.Builder.create(this, "egress-rule")
                .type("egress")
                .fromPort(0)
                .toPort(65535)
                .protocol("-1")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("Allow all outbound traffic")
                .build();

        return securityGroup;
    }

    private SecurityGroup createAlbSecurityGroup(final SecurityConfig config, final String vpcId) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "alb-sg")
                .name("alb-security-group")
                .description("Security group for Application Load Balancer")
                .vpcId(vpcId)
                .tags(mergeTags(Map.of("Name", "alb-sg")))
                .build();

        // HTTP ingress
        SecurityGroupRule.Builder.create(this, "alb-http-rule")
                .type("ingress")
                .fromPort(config.httpPort())
                .toPort(config.httpPort())
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("HTTP access")
                .build();

        // HTTPS ingress
        SecurityGroupRule.Builder.create(this, "alb-https-rule")
                .type("ingress")
                .fromPort(config.httpsPort())
                .toPort(config.httpsPort())
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("HTTPS access")
                .build();

        // Egress rule
        SecurityGroupRule.Builder.create(this, "alb-egress-rule")
                .type("egress")
                .fromPort(0)
                .toPort(65535)
                .protocol("-1")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("Allow all outbound traffic")
                .build();

        return securityGroup;
    }

    private IamRole createInstanceRole(final Map<String, String> tags) {
        String assumeRolePolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """;

        return IamRole.Builder.create(this, "instance-role")
                .name("ec2-instance-role")
                .assumeRolePolicy(assumeRolePolicy)
                .tags(tags)
                .build();
    }

    private void attachPolicies() {
        // CloudWatch Logs policy
        IamRolePolicyAttachment.Builder.create(this, "cloudwatch-policy")
                .role(instanceRole.getName())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build();

        // SSM policy for management
        IamRolePolicyAttachment.Builder.create(this, "ssm-policy")
                .role(instanceRole.getName())
                .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                .build();
    }

    // Allow ALB to communicate with instances
    public void allowAlbToInstances(final int port) {
        SecurityGroupRule.Builder.create(this, "alb-to-instance-rule")
                .type("ingress")
                .fromPort(port)
                .toPort(port)
                .protocol("tcp")
                .sourceSecurityGroupId(albSecurityGroup.getId())
                .securityGroupId(instanceSecurityGroup.getId())
                .description("Allow ALB to communicate with instances")
                .build();
    }

    // Getters
    public String getInstanceSecurityGroupId() {
        return instanceSecurityGroup.getId();
    }

    public String getAlbSecurityGroupId() {
        return albSecurityGroup.getId();
    }

    public String getInstanceProfileArn() {
        return instanceProfile.getArn();
    }

    public String getInstanceProfileName() {
        return instanceProfile.getName();
    }

    public String getKmsKeyId() {
        return kmsKey.getId();
    }

    public String getKmsKeyArn() {
        return kmsKey.getArn();
    }
}
```

```java
package app;

import app.config.AppConfig;
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

        MainStack stack = new MainStack(app, "ec2-instance-migration", AppConfig.defaultConfig().region());

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

```java
package app;

import app.constructs.ComputeConstruct;
import app.constructs.NetworkConstruct;
import app.constructs.SecurityConstruct;
import app.constructs.MonitoringConstruct;
import app.constructs.LoadBalancerConstruct;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

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

    public MainStack(final Construct scope, final String id, final String region) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
                .region(region)
                .build());

        // Create networking infrastructure
        NetworkConstruct network = new NetworkConstruct(this, "network");

        // Create security infrastructure
        SecurityConstruct security = new SecurityConstruct(this, "security", network.getVpcId());

        // Allow ALB to communicate with instances
        security.allowAlbToInstances(80);

        // Create load balancer
        LoadBalancerConstruct loadBalancer = new LoadBalancerConstruct(this, "alb", network.getPublicSubnetIds(),
                security.getAlbSecurityGroupId(), network.getVpcId()
        );

        // Create compute resources
        ComputeConstruct compute = new ComputeConstruct(this, "compute", network.getPrivateSubnetIds(),
                security, loadBalancer.getTargetGroup().getArn()
        );

        // Create monitoring
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring", compute.getAutoScalingGroupName(),
                loadBalancer.getAlb().getArn()
        );

        // Define outputs
        // Network outputs
        new TerraformOutput(this, "vpc-id", TerraformOutputConfig.builder()
                .value(network.getVpcId())
                .description("ID of the newly created VPC")
                .build());

        new TerraformOutput(this, "vpc-cidr", TerraformOutputConfig.builder()
                .value(network.getVpc().getCidrBlock())
                .description("CIDR block of the VPC")
                .build());

        new TerraformOutput(this, "public-subnet-ids", TerraformOutputConfig.builder()
                .value(network.getPublicSubnetIds())
                .description("IDs of public subnets")
                .build());

        new TerraformOutput(this, "private-subnet-ids", TerraformOutputConfig.builder()
                .value(network.getPrivateSubnetIds())
                .description("IDs of private subnets")
                .build());

        // Load Balancer outputs
        new TerraformOutput(this, "alb-dns-name", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getDnsName())
                .description("DNS name of the Application Load Balancer")
                .build());

        new TerraformOutput(this, "alb-arn", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getArn())
                .description("ARN of the Application Load Balancer")
                .build());

        new TerraformOutput(this, "alb-zone-id", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getZoneId())
                .description("Zone ID of the Application Load Balancer")
                .build());

        new TerraformOutput(this, "target-group-arn", TerraformOutputConfig.builder()
                .value(loadBalancer.getTargetGroup().getArn())
                .description("ARN of the Target Group")
                .build());

        new TerraformOutput(this, "alb-listener-arn", TerraformOutputConfig.builder()
                .value(loadBalancer.getHttpListener().getArn())
                .description("ARN of the ALB HTTP Listener")
                .build());

        // Security outputs
        new TerraformOutput(this, "instance-security-group-id", TerraformOutputConfig.builder()
                .value(security.getInstanceSecurityGroupId())
                .description("ID of the instance security group")
                .build());

        new TerraformOutput(this, "alb-security-group-id", TerraformOutputConfig.builder()
                .value(security.getAlbSecurityGroupId())
                .description("ID of the ALB security group")
                .build());

        new TerraformOutput(this, "kms-key-id", TerraformOutputConfig.builder()
                .value(security.getKmsKeyId())
                .description("ID of the KMS encryption key")
                .build());

        new TerraformOutput(this, "kms-key-arn", TerraformOutputConfig.builder()
                .value(security.getKmsKeyArn())
                .description("ARN of the KMS encryption key")
                .build());

        new TerraformOutput(this, "instance-profile-arn", TerraformOutputConfig.builder()
                .value(security.getInstanceProfileArn())
                .description("ARN of the IAM instance profile")
                .build());

        new TerraformOutput(this, "instance-profile-name", TerraformOutputConfig.builder()
                .value(security.getInstanceProfileName())
                .description("Name of the IAM instance profile")
                .build());

        // Compute outputs
        new TerraformOutput(this, "autoscaling-group-name", TerraformOutputConfig.builder()
                .value(compute.getAutoScalingGroupName())
                .description("Name of the Auto Scaling Group")
                .build());

        new TerraformOutput(this, "instance-ids", TerraformOutputConfig.builder()
                .value(compute.getInstanceIds())
                .description("IDs of the migration instances")
                .build());

        // Monitoring outputs
        new TerraformOutput(this, "alarm-topic-arn", TerraformOutputConfig.builder()
                .value(monitoring.getAlarmTopicArn())
                .description("ARN of the SNS topic for alarms")
                .build());

        new TerraformOutput(this, "alarm-names", TerraformOutputConfig.builder()
                .value(monitoring.getAlarmNames())
                .description("Names of CloudWatch alarms")
                .build());

        new TerraformOutput(this, "dashboard-name", TerraformOutputConfig.builder()
                .value(monitoring.getDashboard().getDashboardName())
                .description("Name of the CloudWatch dashboard")
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}
```