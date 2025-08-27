package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.customresources.AwsCustomResource;

import java.util.Map;

/**
 * Unit tests for GuardDutyStack.
 */
public class GuardDutyStackTest {

    @Test
    public void testGuardDutyDetectorCreation() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        GuardDutyStack stack = new GuardDutyStack(app, "GuardDutyStackTest", props);
        Template template = Template.fromStack(stack);
        
        // Verify GuardDuty detector properties
        template.hasResourceProperties("AWS::GuardDuty::Detector", Map.of(
                "Enable", true,
                "FindingPublishingFrequency", "FIFTEEN_MINUTES"
        ));
        
        assertThat(stack.getGuardDutyDetector()).isNotNull();
    }

    @Test
    public void testGuardDutyS3LogsEnabled() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        GuardDutyStack stack = new GuardDutyStack(app, "GuardDutyStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify S3 logs data source is enabled
        template.hasResourceProperties("AWS::GuardDuty::Detector", Map.of(
                "DataSources", Map.of(
                        "S3Logs", Map.of(
                                "Enable", true
                        )
                )
        ));
    }

    @Test
    public void testGuardDutyKubernetesAuditLogs() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        GuardDutyStack stack = new GuardDutyStack(app, "GuardDutyStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify Kubernetes audit logs are enabled
        template.hasResourceProperties("AWS::GuardDuty::Detector", Map.of(
                "DataSources", Map.of(
                        "Kubernetes", Map.of(
                                "AuditLogs", Map.of(
                                        "Enable", true
                                )
                        )
                )
        ));
    }

    @Test
    public void testGuardDutyMalwareProtection() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        GuardDutyStack stack = new GuardDutyStack(app, "GuardDutyStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify malware protection is configured
        template.hasResourceProperties("AWS::GuardDuty::Detector", Map.of(
                "DataSources", Map.of(
                        "MalwareProtection", Map.of(
                                "ScanEc2InstanceWithFindings", Map.of(
                                        "EbsVolumes", true
                                )
                        )
                )
        ));
    }

    @Test
    public void testGuardDutyConfiguration() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        GuardDutyStack stack = new GuardDutyStack(app, "GuardDutyStackTest", props);
        
        // Verify detector is properly configured
        assertThat(stack.getGuardDutyDetector()).isNotNull();
    }
}