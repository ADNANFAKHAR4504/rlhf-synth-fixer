package app.monitoring;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.sns.*;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class CloudWatchStack extends Stack {
    private final Dashboard dashboard;
    private final Topic alertTopic;
    
    public CloudWatchStack(final Construct scope, final String id, final StackProps props,
                         final ApplicationLoadBalancer alb, final AutoScalingGroup asg) {
        super(scope, id, props);
        
        // Create SNS topic for alerts
        this.alertTopic = Topic.Builder.create(this, "AlertTopic")
                .displayName("WebApp Alerts")
                .build();
        
        // Create CloudWatch Dashboard
        this.dashboard = Dashboard.Builder.create(this, "WebAppDashboard")
                .dashboardName("WebApplication-" + this.getRegion())
                .build();
        
        // Add ALB metrics
        dashboard.addWidgets(
            GraphWidget.Builder.create()
                .title("ALB Request Count")
                .left(List.of(
                    Metric.Builder.create()
                        .namespace("AWS/ApplicationELB")
                        .metricName("RequestCount")
                        .dimensionsMap(Map.of(
                            "LoadBalancer", alb.getLoadBalancerFullName()
                        ))
                        .statistic("Sum")
                        .build()
                ))
                .build()
        );
        
        // Add Auto Scaling metrics
        dashboard.addWidgets(
            GraphWidget.Builder.create()
                .title("Auto Scaling Group Instance Count")
                .left(List.of(
                    Metric.Builder.create()
                        .namespace("AWS/AutoScaling")
                        .metricName("GroupDesiredCapacity")
                        .dimensionsMap(Map.of(
                            "AutoScalingGroupName", asg.getAutoScalingGroupName()
                        ))
                        .statistic("Average")
                        .build()
                ))
                .build()
        );
        
        // Create alarms
        createHighCpuAlarm(asg);
        createHighRequestCountAlarm(alb);
    }
    
    private void createHighCpuAlarm(AutoScalingGroup asg) {
        Alarm.Builder.create(this, "HighCpuAlarm")
                .alarmName("WebApp-HighCPU-" + this.getRegion())
                .alarmDescription("High CPU utilization in Auto Scaling Group")
                .metric(Metric.Builder.create()
                    .namespace("AWS/AutoScaling")
                    .metricName("GroupAverageCPUUtilization")
                    .dimensionsMap(Map.of(
                        "AutoScalingGroupName", asg.getAutoScalingGroupName()
                    ))
                    .statistic("Average")
                    .build())
                .threshold(80)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build()
                .addAlarmAction(new SnsAction(alertTopic));
    }
    
    private void createHighRequestCountAlarm(ApplicationLoadBalancer alb) {
        Alarm.Builder.create(this, "HighRequestCountAlarm")
                .alarmName("WebApp-HighRequestCount-" + this.getRegion())
                .alarmDescription("High request count on ALB")
                .metric(Metric.Builder.create()
                    .namespace("AWS/ApplicationELB")
                    .metricName("RequestCount")
                    .dimensionsMap(Map.of(
                        "LoadBalancer", alb.getLoadBalancerFullName()
                    ))
                    .statistic("Sum")
                    .build())
                .threshold(1000)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build()
                .addAlarmAction(new SnsAction(alertTopic));
    }
    
    public Dashboard getDashboard() {
        return dashboard;
    }
    
    public Topic getAlertTopic() {
        return alertTopic;
    }
}