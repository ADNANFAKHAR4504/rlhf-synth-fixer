package app.constructs;

import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilter;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilterConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilterMetricTransformation;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopicConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscriptionConfig;
import software.constructs.Construct;

import java.util.List;

public class MonitoringConstruct extends BaseConstruct {

    public MonitoringConstruct(final Construct scope, final String id, final String functionName, final String logGroupName,
                               final String apiName) {
        super(scope, id);

        // Create SNS topic for error notifications
        SnsTopic errorTopic = new SnsTopic(this, "error-topic", SnsTopicConfig.builder()
                .name(resourceName("ErrorNotifications"))
                .displayName("Lambda Error Notifications")
                .tags(getTagsWithName("ErrorTopic"))
                .build());

        // Create email subscription
        new SnsTopicSubscription(this, "error-subscription", SnsTopicSubscriptionConfig.builder()
                .topicArn(errorTopic.getArn())
                .protocol("email")
                .endpoint("oride.a@turing.com")
                .build());

        // Create metric filter for Lambda errors
        new CloudwatchLogMetricFilter(this, "error-filter",
                CloudwatchLogMetricFilterConfig.builder()
                        .name(resourceName("LambdaErrors"))
                        .logGroupName(logGroupName)
                        .pattern("ERROR")
                        .metricTransformation(CloudwatchLogMetricFilterMetricTransformation.builder()
                                .name("LambdaErrors")
                                .namespace("ServerlessDemo")
                                .value("1")
                                .defaultValue("0")
                                .build())
                        .build());

        // Create alarm for Lambda errors
        new CloudwatchMetricAlarm(this, "lambda-error-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("LambdaErrorAlarm"))
                .alarmDescription("Alert when Lambda function encounters errors")
                .metricName("LambdaErrors")
                .namespace("ServerlessDemo")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(1.0)
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("LambdaErrorAlarm"))
                .build());

        // Create alarm for Lambda duration
        new CloudwatchMetricAlarm(this, "lambda-duration-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("LambdaDurationAlarm"))
                .alarmDescription("Alert when Lambda function duration is high")
                .metricName("Duration")
                .namespace("AWS/Lambda")
                .dimensions(java.util.Map.of("FunctionName", functionName))
                .statistic("Average")
                .period(300)
                .evaluationPeriods(2)
                .threshold(5000.0)
                .comparisonOperator("GreaterThanThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("LambdaDurationAlarm"))
                .build());

        // Create alarm for Lambda throttles
        new CloudwatchMetricAlarm(this, "lambda-throttle-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("LambdaThrottleAlarm"))
                .alarmDescription("Alert when Lambda function is throttled")
                .metricName("Throttles")
                .namespace("AWS/Lambda")
                .dimensions(java.util.Map.of("FunctionName", functionName))
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(1.0)
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("LambdaThrottleAlarm"))
                .build());

        // Create alarm for API Gateway 4XX errors
        new CloudwatchMetricAlarm(this, "api-4xx-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("API4xxAlarm"))
                .alarmDescription("Alert on high 4XX error rate")
                .metricName("4XXError")
                .namespace("AWS/ApiGateway")
                .dimensions(java.util.Map.of("ApiName", apiName, "Stage", "prod"))
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(2)
                .threshold(10.0)
                .comparisonOperator("GreaterThanThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("API4xxAlarm"))
                .build());

        // Create alarm for API Gateway 5XX errors
        new CloudwatchMetricAlarm(this, "api-5xx-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("API5xxAlarm"))
                .alarmDescription("Alert on 5XX errors")
                .metricName("5XXError")
                .namespace("AWS/ApiGateway")
                .dimensions(java.util.Map.of("ApiName", apiName, "Stage", "prod"))
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(1.0)
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("API5xxAlarm"))
                .build());
    }
}
