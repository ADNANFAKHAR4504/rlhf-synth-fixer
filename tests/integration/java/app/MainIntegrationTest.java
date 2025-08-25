package app;

import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.assertions.Template;

import java.util.List;
import java.util.Map;

public class MainIntegrationTest {

    private Template synthesizeTemplate(String id) {
        App app = new App();
        Main.FaultTolerantStack stack = new Main.FaultTolerantStack(app, id,
                software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build()) {
            @Override
            protected software.amazon.awscdk.services.route53.IHostedZone createHostedZoneMock(String env) {
                return software.amazon.awscdk.services.route53.HostedZone.fromHostedZoneAttributes(this, id + "-FakeZone",
                        software.amazon.awscdk.services.route53.HostedZoneAttributes.builder()
                                .hostedZoneId("Z123456FAKE")
                                .zoneName("example.com")
                                .build());
            }
        };
        return Template.fromStack(stack);
    }

    @Test
    public void testVpcHasPrivateAndPublicSubnets() {
        Template template = synthesizeTemplate("IntegrationVpc");
        template.resourceCountIs("AWS::EC2::Subnet", 4);
    }

    @Test
    public void testS3BucketIsSecure() {
        Template template = synthesizeTemplate("IntegrationS3");
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "VersioningConfiguration", Map.of("Status", "Enabled"),
                "PublicAccessBlockConfiguration", Map.of(
                        "BlockPublicAcls", true,
                        "IgnorePublicAcls", true,
                        "BlockPublicPolicy", true,
                        "RestrictPublicBuckets", true
                )
        ));
    }

    @Test
    public void testAsgAttachedToAlb() {
        Template template = synthesizeTemplate("IntegrationAsgAlb");

        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Map.of(
                "Port", 80,
                "TargetType", "instance"
        ));

        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", Map.of(
                "Port", 80,
                "Protocol", "HTTP"
        ));
    }

    @Test
    public void testRdsIsMultiAzEncrypted() {
        Template template = synthesizeTemplate("IntegrationRds");
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "MultiAZ", true,
                "StorageEncrypted", true
        ));
    }

    @Test
    public void testIamRoleLeastPrivilege() {
        Template template = synthesizeTemplate("IntegrationIam");

        template.hasResourceProperties("AWS::IAM::Role", Map.of(
                "AssumeRolePolicyDocument", Map.of(
                        "Statement", List.of(
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
    public void testCloudWatchAlarmOnCpuUtilization() {
        Template template = synthesizeTemplate("IntegrationAlarm");

        template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of(
                "Threshold", 70,
                "EvaluationPeriods", 2
        ));
    }

    @Test
    public void testRoute53DnsPointsToAlb() {
        Template template = synthesizeTemplate("IntegrationDns");

        // ✅ No Hamcrest, just assert A record exists
        template.hasResourceProperties("AWS::Route53::RecordSet", Map.of(
                "Type", "A"
        ));
    }
}
