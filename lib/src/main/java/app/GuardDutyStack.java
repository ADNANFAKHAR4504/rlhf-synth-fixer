package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.guardduty.*;
import software.constructs.Construct;

import java.util.Map;

public class GuardDutyStack extends Stack {

    private final CfnDetector guardDutyDetector;

    public GuardDutyStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Enable GuardDuty
        this.guardDutyDetector = CfnDetector.Builder.create(this, "app-guardduty-detector")
                .enable(true)
                .findingPublishingFrequency("FIFTEEN_MINUTES")
                .dataSources(CfnDetector.CFNDataSourceConfigurationsProperty.builder()
                        .s3Logs(CfnDetector.CFNS3LogsConfigurationProperty.builder()
                                .enable(true)
                                .build())
                        .kubernetes(CfnDetector.CFNKubernetesConfigurationProperty.builder()
                                .auditLogs(CfnDetector.CFNKubernetesAuditLogsConfigurationProperty.builder()
                                        .enable(true)
                                        .build())
                                .build())
                        .malwareProtection(CfnDetector.CFNMalwareProtectionConfigurationProperty.builder()
                                .scanEc2InstanceWithFindings(CfnDetector.CFNScanEc2InstanceWithFindingsConfigurationProperty.builder()
                                        .ebsVolumes(true)
                                        .build())
                                .build())
                        .build())
                .build();

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public CfnDetector getGuardDutyDetector() {
        return guardDutyDetector;
    }
}