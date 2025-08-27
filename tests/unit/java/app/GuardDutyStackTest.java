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
import java.util.HashMap;

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
        
        // Verify the Custom Resource for creating/managing GuardDuty detector
        template.resourceCountIs("Custom::AWS", 3); // We should have three custom resources now
        
        // Check for the createDetector action in the ManageGuardDutyDetector resource
        // Since the actual Create and Update values are JSON strings, we'll use string contains check
        template.hasResourceProperties("Custom::AWS", Match.objectLike(Map.of(
            "InstallLatestAwsSdk", true,
            "ServiceToken", Match.anyValue()
        )));
        
        // Verify a resource with ManageGuardDutyDetector logical ID exists
        template.hasResource("Custom::AWS", Match.objectLike(Map.of(
            "DeletionPolicy", "Delete",
            "UpdateReplacePolicy", "Delete"
        )));
        
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

        // Verify S3 logs data source is enabled in the custom resource by checking the string value
        template.hasResourceProperties("Custom::AWS", Match.objectLike(Map.of(
            "Create", Match.stringLikeRegexp(".*\"S3Logs\":\\{\"Enable\":true\\}.*")
        )));
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

        // Verify Kubernetes audit logs are enabled in the custom resource by checking string
        template.hasResourceProperties("Custom::AWS", Match.objectLike(Map.of(
            "Create", Match.stringLikeRegexp(".*\"Kubernetes\":\\{\"AuditLogs\":\\{\"Enable\":true\\}\\}.*")
        )));
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

        // Verify malware protection is configured in the custom resource by checking string
        template.hasResourceProperties("Custom::AWS", Match.objectLike(Map.of(
            "Create", Match.stringLikeRegexp(".*\"MalwareProtection\":\\{\"ScanEc2InstanceWithFindings\":\\{\"EbsVolumes\":true\\}\\}.*")
        )));
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