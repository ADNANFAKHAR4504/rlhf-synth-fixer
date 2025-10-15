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
