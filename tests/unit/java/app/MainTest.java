package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.IHostedZone;
import software.amazon.awscdk.services.route53.HostedZoneAttributes; // ✅ added

import java.util.Map;

public class MainTest {

    private Main.FaultTolerantStack createTestStack(App app, String id) {
        return new Main.FaultTolerantStack(app, id,
                software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build()) {
            @Override
            protected IHostedZone createHostedZoneMock(String env) {
                return HostedZone.fromHostedZoneAttributes(this, id + "-FakeZone",
                        HostedZoneAttributes.builder()  // ✅ corrected usage
                                .hostedZoneId("Z123456FAKE")
                                .zoneName("example.com")
                                .build());
            }
        };
    }

    @Test
    public void testVpcCreated() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestVpc");
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::EC2::VPC", 1);
    }

    @Test
    public void testS3BucketCreated() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestS3");
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "VersioningConfiguration", Map.of("Status", "Enabled")
        ));
    }

    @Test
    public void testIamRoleForEc2() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestRole");
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::IAM::Role", Map.of(
                "AssumeRolePolicyDocument", Map.of(
                        "Statement", java.util.List.of(
                                Map.of(
                                        "Action", "sts:AssumeRole",
                                        "Effect", "Allow",
                                        "Principal", Map.of("Service", "ec2.amazonaws.com")
                                )
                        ),
                        "Version", "2012-10-17"
                )
        ));
    }

    @Test
    public void testAutoScalingGroupCreated() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestAsg");
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::AutoScaling::AutoScalingGroup", 1);
    }

    @Test
    public void testAlbCreated() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestAlb");
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
    }

    @Test
    public void testRdsInstanceCreated() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestRds");
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "MultiAZ", true
        ));
    }

    @Test
    public void testCloudWatchAlarmCreated() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestAlarm");
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of(
                "Threshold", 70
        ));
    }

    @Test
    public void testRoute53RecordCreated() {
        App app = new App();
        Main.FaultTolerantStack stack = createTestStack(app, "TestDns");
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::Route53::RecordSet", 1);
    }
}
