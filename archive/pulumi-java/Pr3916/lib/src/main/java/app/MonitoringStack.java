package app;

import com.pulumi.Context;
import com.pulumi.aws.cloudwatch.Dashboard;
import com.pulumi.aws.cloudwatch.DashboardArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;
import com.pulumi.aws.sns.Topic;
import com.pulumi.aws.sns.TopicArgs;
import com.pulumi.core.Output;

import java.util.List;
import java.util.Map;

/**
 * Monitoring stack for CloudWatch dashboard and alarms.
 */
public class MonitoringStack {
    private final Dashboard dashboard;

    public MonitoringStack(final Context ctx, final CdnStack cdn) {
        // Create SNS topic for alarms
        var alarmTopic = new Topic("cloudfront-alarms",
            TopicArgs.builder()
                .name("news-portal-cloudfront-alarms")
                .tags(Map.of(
                    "Name", "CloudFrontAlarms",
                    "Environment", "production"
                ))
                .build());

        // Create CloudWatch dashboard for viewer metrics
        Output<String> dashboardBody = cdn.getDistribution().id().applyValue(distributionId ->
            String.format("""
                {
                    "widgets": [
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "Requests", {"stat": "Sum", "label": "Total Requests"}]
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "CloudFront Requests",
                                "yAxis": {
                                    "left": {
                                        "label": "Count"
                                    }
                                }
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "BytesDownloaded", {"stat": "Sum", "label": "Bytes Downloaded"}],
                                    [".", "BytesUploaded", {"stat": "Sum", "label": "Bytes Uploaded"}]
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "Data Transfer",
                                "yAxis": {
                                    "left": {
                                        "label": "Bytes"
                                    }
                                }
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "4xxErrorRate", {"stat": "Average", "label": "4xx Error Rate"}],
                                    [".", "5xxErrorRate", {"stat": "Average", "label": "5xx Error Rate"}]
                                ],
                                "period": 300,
                                "stat": "Average",
                                "region": "us-east-1",
                                "title": "Error Rates",
                                "yAxis": {
                                    "left": {
                                        "label": "Percentage"
                                    }
                                }
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "CacheHitRate", {"stat": "Average", "label": "Cache Hit Rate"}]
                                ],
                                "period": 300,
                                "stat": "Average",
                                "region": "us-east-1",
                                "title": "Cache Performance",
                                "yAxis": {
                                    "left": {
                                        "label": "Percentage"
                                    }
                                }
                            }
                        }
                    ]
                }
                """, distributionId)
        );

        this.dashboard = new Dashboard("news-portal-dashboard",
            DashboardArgs.builder()
                .dashboardName("NewsPortalMetrics")
                .dashboardBody(dashboardBody)
                .build());

        // Create alarm for high error rate
        var errorRateAlarm = new MetricAlarm("high-error-rate-alarm",
            MetricAlarmArgs.builder()
                .name("news-portal-high-error-rate")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("5xxErrorRate")
                .namespace("AWS/CloudFront")
                .period(300)
                .statistic("Average")
                .threshold(5.0)
                .alarmDescription("Alert when 5xx error rate exceeds 5%")
                .alarmActions(alarmTopic.arn().applyValue(arn -> List.of(arn)))
                .treatMissingData("notBreaching")
                .tags(Map.of(
                    "Name", "HighErrorRateAlarm",
                    "Environment", "production"
                ))
                .build());

        // Create alarm for low cache hit rate
        var cacheHitAlarm = new MetricAlarm("low-cache-hit-alarm",
            MetricAlarmArgs.builder()
                .name("news-portal-low-cache-hit")
                .comparisonOperator("LessThanThreshold")
                .evaluationPeriods(3)
                .metricName("CacheHitRate")
                .namespace("AWS/CloudFront")
                .period(300)
                .statistic("Average")
                .threshold(70.0)
                .alarmDescription("Alert when cache hit rate falls below 70%")
                .alarmActions(alarmTopic.arn().applyValue(arn -> List.of(arn)))
                .treatMissingData("notBreaching")
                .tags(Map.of(
                    "Name", "LowCacheHitAlarm",
                    "Environment", "production"
                ))
                .build());
    }

    public Dashboard getDashboard() {
        return dashboard;
    }
}
