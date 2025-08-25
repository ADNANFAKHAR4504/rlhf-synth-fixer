package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Comprehensive Unit Tests for RegionalStack.
 *
 * These tests validate that the stack creates the required
 * AWS resources with proper configurations, following the
 * project requirements for high availability, security, and outputs.
 */
public class MainTest {

    @Test
    public void testStackCreation() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "TestStack",
                StackProps.builder().build(), "test");
        assertThat(stack).isNotNull();
    }

    @Test
    public void testStackSynthesis() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "TestStack",
                StackProps.builder().build(), "test");
        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }

    @Test
    public void testMultipleStacks() {
        App app = new App();
        RegionalStack east = new RegionalStack(app, "TestStackEast",
                StackProps.builder().build(), "east");
        RegionalStack west = new RegionalStack(app, "TestStackWest",
                StackProps.builder().build(), "west");
        assertThat(east).isNotNull();
        assertThat(west).isNotNull();
    }

    @Test
    public void testVpcExists() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "VpcTestStack",
                StackProps.builder().build(), "dev");
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.0.0.0/16"
        ));
    }

    @Test
    public void testLogBucketEncryptionAndVersioning() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "TestStackLogs",
                StackProps.builder().build(), "dev");

        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Map.of(
                    "ServerSideEncryptionConfiguration", List.of(
                        Map.of("ServerSideEncryptionByDefault", Map.of("SSEAlgorithm", "AES256"))
                    )
                ),
                "VersioningConfiguration", Map.of("Status", "Enabled")
        ));
    }


    @Test
    public void testAlbAndAsgExist() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "AlbAsgStack",
                StackProps.builder().build(), "dev");
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
        template.resourceCountIs("AWS::AutoScaling::AutoScalingGroup", 1);
    }

    @Test
    public void testRdsMultiAzDeployment() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "RdsStack",
                StackProps.builder().build(), "dev");
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "MultiAZ", true
        ));
    }

    @Test
    public void testCloudWatchAlarmExists() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "AlarmStack",
                StackProps.builder().build(), "qa");
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::CloudWatch::Alarm", 1);
    }

    @Test
    public void testOutputsExist() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "OutputStack",
                StackProps.builder().build(), "staging");
        Template template = Template.fromStack(stack);

        template.hasOutput("VpcId", Map.of());
        template.hasOutput("AlbDns", Map.of());
        template.hasOutput("CpuAlarmName", Map.of());
        template.hasOutput("LogBucketName", Map.of());
        template.hasOutput("RdsEndpoint", Map.of());
    }
}
