package app.config;

public record MonitoringConfig(int cpuThresholdPercent, int evaluationPeriods, int periodSeconds, String snsTopicEmail,
                               boolean enableDetailedMonitoring) {
    public static MonitoringConfig defaultConfig() {
        return new MonitoringConfig(80, 2, 300, "admin@turing.com", true);
    }
}
