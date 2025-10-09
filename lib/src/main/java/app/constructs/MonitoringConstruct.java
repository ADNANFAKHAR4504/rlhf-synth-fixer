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
