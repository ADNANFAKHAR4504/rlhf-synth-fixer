package app.config;

import java.util.List;

public record SecurityConfig(List<String> allowedSshIpRanges, List<String> allowedHttpPorts, boolean enableFlowLogs,
                             int cpuAlarmThreshold, int cpuAlarmEvaluationPeriods, String sslCertificateArn) {
    public static SecurityConfig defaultConfig() {
        return new SecurityConfig(
                List.of("0.0.0.0/32"),
                List.of("80", "443"),
                true,
                70,
                1,
                "" // SSL certificate ARN
        );
    }
}
