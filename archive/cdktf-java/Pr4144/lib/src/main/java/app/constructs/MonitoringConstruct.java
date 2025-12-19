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
                               final String clusterName, final List<ServiceConfig> serviceConfigs,
                               final List<ServiceConstruct> serviceConstructs) {
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
        for (int i = 0; i < serviceConfigs.size(); i++) {
            ServiceConfig serviceConfig = serviceConfigs.get(i);
            ServiceConstruct serviceConstruct = i < serviceConstructs.size() ? serviceConstructs.get(i) : null;
            createServiceAlarms(appConfig, config, clusterName, serviceConfig, serviceConstruct);
        }

        // Create dashboard
        createDashboard(appConfig, clusterName, serviceConfigs);
    }

    private void createServiceAlarms(final AppConfig appConfig, final MonitoringConfig config, final String clusterName,
                                     final ServiceConfig service, final ServiceConstruct serviceConstruct) {
        // CPU utilization alarm
        CloudwatchMetricAlarm.Builder cpuAlarmBuilder = CloudwatchMetricAlarm.Builder.create(this, service.serviceName() + "-cpu-alarm")
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
                .tags(appConfig.tags());

        if (serviceConstruct != null) {
            cpuAlarmBuilder.dependsOn(List.of(serviceConstruct.getService()));
        }

        CloudwatchMetricAlarm cpuAlarm = cpuAlarmBuilder.build();
        alarms.add(cpuAlarm);

        // Memory utilization alarm
        CloudwatchMetricAlarm.Builder memoryAlarmBuilder = CloudwatchMetricAlarm.Builder.create(this, service.serviceName() + "-memory-alarm")
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
                .tags(appConfig.tags());

        if (serviceConstruct != null) {
            memoryAlarmBuilder.dependsOn(List.of(serviceConstruct.getService()));
        }

        CloudwatchMetricAlarm memoryAlarm = memoryAlarmBuilder.build();
        alarms.add(memoryAlarm);

        // Task count alarm
        CloudwatchMetricAlarm.Builder taskAlarmBuilder = CloudwatchMetricAlarm.Builder.create(this, service.serviceName() + "-task-alarm")
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
                .tags(appConfig.tags());

        if (serviceConstruct != null) {
            taskAlarmBuilder.dependsOn(List.of(serviceConstruct.getService()));
        }

        CloudwatchMetricAlarm taskAlarm = taskAlarmBuilder.build();
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
