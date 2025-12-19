package app.components;

import com.pulumi.core.Output;
import com.pulumi.aws.cloudwatch.Dashboard;
import com.pulumi.aws.cloudwatch.DashboardArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;

import java.util.Map;

/**
 * Monitoring component for CloudWatch dashboards and alarms.
 */
public class MonitoringComponent {
    private final Dashboard dashboard;
    private final MetricAlarm lambdaErrorAlarm;
    private final MetricAlarm kinesisIteratorAgeAlarm;

    /**
     * Creates monitoring infrastructure.
     *
     * @param name component name
     * @param streamingComponent streaming component
     * @param ingestionComponent ingestion component
     * @param storageComponent storage component
     * @param region AWS region
     */
    public MonitoringComponent(final String name,
                               final StreamingComponent streamingComponent,
                               final IngestionComponent ingestionComponent,
                               final StorageComponent storageComponent,
                               final String region) {

        // Create CloudWatch dashboard
        Output<String> dashboardBody = Output.tuple(
            streamingComponent.getStreamName(),
            ingestionComponent.getLambdaFunctionName()
        ).applyValue(tuple -> {
            String streamName = tuple.t1;
            String functionName = tuple.t2;
            return String.format("""
                {
                  "widgets": [
                    {
                      "type": "metric",
                      "properties": {
                        "metrics": [
                          ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum", "label": "Incoming Records"}],
                          [".", "IncomingBytes", {"stat": "Sum", "label": "Incoming Bytes"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "%s",
                        "title": "Kinesis Stream Metrics",
                        "dimensions": {
                          "StreamName": "%s"
                        }
                      }
                    },
                    {
                      "type": "metric",
                      "properties": {
                        "metrics": [
                          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                          [".", "Errors", {"stat": "Sum"}],
                          [".", "Duration", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "%s",
                        "title": "Lambda Function Metrics",
                        "dimensions": {
                          "FunctionName": "%s"
                        }
                      }
                    }
                  ]
                }
                """, region, streamName, region, functionName);
        });

        this.dashboard = new Dashboard(name + "-dashboard", DashboardArgs.builder()
            .dashboardName("market-data-platform")
            .dashboardBody(dashboardBody)
            .build());

        // Create alarm for Lambda errors
        this.lambdaErrorAlarm = new MetricAlarm(name + "-lambda-errors",
            MetricAlarmArgs.builder()
                .name("market-data-lambda-errors")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("Errors")
                .namespace("AWS/Lambda")
                .period(300)
                .statistic("Sum")
                .threshold(10.0)
                .alarmDescription("Alert when Lambda function has too many errors")
                .dimensions(ingestionComponent.getLambdaFunctionName().applyValue(funcName ->
                    Map.of("FunctionName", funcName)
                ))
                .build());

        // Create alarm for Kinesis iterator age
        this.kinesisIteratorAgeAlarm = new MetricAlarm(name + "-kinesis-iterator-age",
            MetricAlarmArgs.builder()
                .name("market-data-kinesis-lag")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("GetRecords.IteratorAgeMilliseconds")
                .namespace("AWS/Kinesis")
                .period(300)
                .statistic("Maximum")
                .threshold(60000.0)
                .alarmDescription("Alert when Kinesis stream has high iterator age")
                .dimensions(streamingComponent.getStreamName().applyValue(streamName ->
                    Map.of("StreamName", streamName)
                ))
                .build());
    }

    public Output<String> getDashboardUrl() {
        return dashboard.dashboardArn().applyValue(arn ->
            "https://console.aws.amazon.com/cloudwatch/home#dashboards:name=market-data-platform"
        );
    }
}
