package app;

import com.pulumi.aws.Provider;
import com.pulumi.aws.cloudwatch.*;
import com.pulumi.aws.sns.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import com.pulumi.core.Output;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

/**
 * Monitoring Infrastructure Component
 * Handles CloudWatch dashboards, alarms, and SNS notifications
 */
public class MonitoringInfrastructure extends ComponentResource {

    public static class MonitoringInfrastructureArgs {
        private String region;
        private String environment;
        private Map<String, String> tags;

        public MonitoringInfrastructureArgs() {}

        public String getRegion() { return region; }
        public MonitoringInfrastructureArgs setRegion(String region) {
            this.region = region;
            return this;
        }

        public String getEnvironment() { return environment; }
        public MonitoringInfrastructureArgs setEnvironment(String environment) {
            this.environment = environment;
            return this;
        }

        public Map<String, String> getTags() { return tags; }
        public MonitoringInfrastructureArgs setTags(Map<String, String> tags) {
            this.tags = tags;
            return this;
        }
    }

    private final String region;
    private final String environment;
    private final Map<String, String> tags;
    private final String regionSuffix;
    private final Provider provider;

    // Monitoring Resources
    private final Topic snsTopic;
    private final TopicPolicy snsTopicPolicy;
    private final Dashboard dashboard;

    public MonitoringInfrastructure(String name, MonitoringInfrastructureArgs args,
                                  ComponentResourceOptions opts) {
        super("nova:infrastructure:Monitoring", name, opts);

        this.region = args.getRegion();
        this.environment = args.getEnvironment();
        this.tags = args.getTags();
        this.regionSuffix = args.getRegion().replaceAll("-", "").replaceAll("gov", "");
        this.provider = (opts != null && opts.getProvider() != null && opts.getProvider().isPresent())
            ? (Provider) opts.getProvider().get()
            : null;

        this.snsTopic = this.createSnsTopic();
        this.snsTopicPolicy = this.createSnsTopicPolicy();
        this.dashboard = this.createDashboard();

        this.registerOutputs(Map.of(
            "snsTopicArn", this.snsTopic.arn(),
            "dashboardName", this.dashboard.dashboardName(),
            "logGroupName", getLogGroupName(),
            "dashboardUrl", getDashboardUrl()
        ));
    }

    /**
     * Create SNS Topic for alerts
     */
    private Topic createSnsTopic() {
        return new Topic(String.format("nova-alerts-%s", this.regionSuffix),
            TopicArgs.builder()
                .name(String.format("nova-alerts-%s", this.regionSuffix))
                .displayName(String.format("Nova Alerts - %s", this.region))
                .tags(this.tags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    /**
     * Create SNS Topic Policy
     */
    private TopicPolicy createSnsTopicPolicy() {
        return new TopicPolicy(String.format("nova-alerts-policy-%s", this.regionSuffix),
            TopicPolicyArgs.builder()
                .arn(this.snsTopic.arn())
                .policy(this.snsTopic.arn().apply(arn ->
                    Output.of(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "cloudwatch.amazonaws.com"
                                    },
                                    "Action": "sns:Publish",
                                    "Resource": "%s"
                                }
                            ]
                        }
                        """, arn))
                ))
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    /**
     * Create CloudWatch Dashboard
     */
    private Dashboard createDashboard() {
        String dashboardBody = String.format("""
            {
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ApplicationELB", "RequestCount"],
                                ["AWS/ApplicationELB", "TargetResponseTime"],
                                ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count"]
                            ],
                            "view": "timeSeries",
                            "stacked": false,
                            "region": "%s",
                            "title": "Nova Application Metrics",
                            "period": 300
                        }
                    },
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ElasticBeanstalk", "EnvironmentHealth"]
                            ],
                            "view": "timeSeries",
                            "stacked": false,
                            "region": "%s",
                            "title": "Environment Health",
                            "period": 300
                        }
                    }
                ]
            }
            """, this.region, this.region);

        return new Dashboard(String.format("nova-dashboard-%s", this.regionSuffix),
            DashboardArgs.builder()
                .dashboardName(String.format("nova-dashboard-%s", this.regionSuffix))
                .dashboardBody(dashboardBody)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    /**
     * Create CPU High Alarm
     */
    public MetricAlarm createCpuAlarm(Output<String> environmentName, Output<String> asgName) {
        return new MetricAlarm(String.format("nova-cpu-alarm-%s", this.regionSuffix),
            MetricAlarmArgs.builder()
                .name(String.format("nova-cpu-high-%s", this.regionSuffix))
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("CPUUtilization")
                .namespace("AWS/EC2")
                .period(120)
                .statistic("Average")
                .threshold(80.0)
                .alarmDescription("This metric monitors ec2 cpu utilization")
                .alarmActions(this.snsTopic.arn().apply(arn -> Output.of(List.of(arn))))
                .dimensions(asgName.apply(name -> Output.of(Map.of("AutoScalingGroupName", name))))
                .tags(this.tags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    /**
     * Create 5XX Error Alarm
     */
    public MetricAlarm createErrorAlarm(Output<String> environmentName) {
        return new MetricAlarm(String.format("nova-error-alarm-%s", this.regionSuffix),
            MetricAlarmArgs.builder()
                .name(String.format("nova-5xx-errors-%s", this.regionSuffix))
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("HTTPCode_Target_5XX_Count")
                .namespace("AWS/ApplicationELB")
                .period(60)
                .statistic("Sum")
                .threshold(10.0)
                .alarmDescription("This metric monitors 5XX errors")
                .alarmActions(this.snsTopic.arn().apply(arn -> Output.of(List.of(arn))))
                .dimensions(environmentName.apply(name -> Output.of(Map.of("LoadBalancer", name))))
                .tags(this.tags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    /**
     * Create Environment Health Alarm
     */
    public MetricAlarm createHealthAlarm(Output<String> environmentName) {
        return new MetricAlarm(String.format("nova-health-alarm-%s", this.regionSuffix),
            MetricAlarmArgs.builder()
                .name(String.format("nova-env-health-%s", this.regionSuffix))
                .comparisonOperator("LessThanThreshold")
                .evaluationPeriods(1)
                .metricName("EnvironmentHealth")
                .namespace("AWS/ElasticBeanstalk")
                .period(60)
                .statistic("Average")
                .threshold(15.0)
                .alarmDescription("This metric monitors environment health")
                .alarmActions(this.snsTopic.arn().apply(arn -> Output.of(List.of(arn))))
                .dimensions(environmentName.apply(name -> Output.of(Map.of("EnvironmentName", name))))
                .tags(this.tags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    /**
     * Create Response Time Alarm
     */
    public MetricAlarm createResponseTimeAlarm(Output<String> lbFullName) {
        return new MetricAlarm(String.format("nova-response-time-alarm-%s", this.regionSuffix),
            MetricAlarmArgs.builder()
                .name(String.format("nova-response-time-%s", this.regionSuffix))
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("TargetResponseTime")
                .namespace("AWS/ApplicationELB")
                .period(60)
                .statistic("Average")
                .threshold(1.0)
                .alarmDescription("This metric monitors response time")
                .alarmActions(this.snsTopic.arn().apply(arn -> Output.of(List.of(arn))))
                .dimensions(lbFullName.apply(name -> Output.of(Map.of("LoadBalancer", name))))
                .tags(this.tags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    // Property getters for easy access
    public Output<String> getSnsTopicArn() {
        return this.snsTopic.arn();
    }

    public Output<String> getDashboardName() {
        return this.dashboard.dashboardName();
    }

    public Output<String> getLogGroupName() {
        // Return a computed log group name based on region
        return Output.of(String.format("/aws/elasticbeanstalk/nova-%s", this.regionSuffix));
    }

    public Output<String> getDashboardUrl() {
        // Return the CloudWatch dashboard URL
        return this.dashboard.dashboardName().apply(name ->
            Output.of(String.format("https://%s.console.aws.amazon.com/cloudwatch/home?region=%s#dashboards:name=%s",
                this.region, this.region, name))
        );
    }

    // Additional getters for accessing the resources directly
    public Topic getSnsTopic() { return this.snsTopic; }
    public TopicPolicy getSnsTopicPolicy() { return this.snsTopicPolicy; }
    public Dashboard getDashboard() { return this.dashboard; }
}