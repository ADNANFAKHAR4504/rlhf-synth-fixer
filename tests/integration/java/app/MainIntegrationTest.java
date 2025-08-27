package app;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsRequest;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesRequest;

import java.io.File;
import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for FaultTolerantStack.
 * Live checks limited to SDK clients bundled with CDK (EC2, S3, CloudWatch, SNS).
 * IAM client is excluded since its module is not available in your runtime.
 */
public class MainIntegrationTest {

    private static JsonNode outputs;

    private Template synthesizeTemplate(String id) {
        App app = new App();
        Main.FaultTolerantStack stack = new Main.FaultTolerantStack(app, id,
                StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-east-1")
                                .build())
                        .build());
        return Template.fromStack(stack);
    }

    @BeforeAll
    public static void loadOutputs() throws IOException {
        File file = new File("cdk-outputs.json");
        if (file.exists()) {
            outputs = new ObjectMapper().readTree(file);
        } else {
            outputs = null;
        }
    }

    // ---------- CDK SYNTH TESTS ----------

    @Test
    public void testVpcCreatedInTemplate() {
        Template template = synthesizeTemplate("IntegrationVpc");
        template.resourceCountIs("AWS::EC2::VPC", 1);
    }

    @Test
    public void testS3BucketEncryptedInTemplate() {
        Template template = synthesizeTemplate("IntegrationS3");
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Map.of()
        ));
    }

    @Test
    public void testIamRoleCreatedInTemplate() {
        Template template = synthesizeTemplate("IntegrationIam");
        template.resourceCountIs("AWS::IAM::Role", 1);
    }

    @Test
    public void testRdsMultiAzInTemplate() {
        Template template = synthesizeTemplate("IntegrationRds");
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "MultiAZ", true,
                "StorageEncrypted", true
        ));
    }

    @Test
    public void testAlbCreatedInTemplate() {
        Template template = synthesizeTemplate("IntegrationAlb");
        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
    }

    @Test
    public void testCloudWatchAlarmCreatedInTemplate() {
        Template template = synthesizeTemplate("IntegrationAlarm");
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Map.of(
                "Threshold", 70
        ));
    }

    // ---------- LIVE AWS TESTS (only supported SDK clients) ----------

    @Test
    public void testVpcExistsInAws() {
        Assumptions.assumeTrue(outputs != null, "Skipping live VPC test: no outputs found");
        String vpcId = outputs.path("Nova-East").path("VpcId").asText(null);
        Assumptions.assumeTrue(vpcId != null, "Skipping live VPC test: VpcId missing");

        try (Ec2Client ec2 = Ec2Client.create()) {
            DescribeVpcsResponse resp = ec2.describeVpcs(
                    DescribeVpcsRequest.builder().vpcIds(vpcId).build()
            );
            assertThat(resp.vpcs()).isNotEmpty();
        }
    }

    @Test
    public void testLogBucketExistsInAws() {
        Assumptions.assumeTrue(outputs != null, "Skipping live S3 test: no outputs found");
        String bucket = outputs.path("Nova-East").path("LogBucket").asText(null);
        Assumptions.assumeTrue(bucket != null, "Skipping live S3 test: LogBucket missing");

        try (S3Client s3 = S3Client.create()) {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            assertThat(bucket).isNotEmpty();
        }
    }

    @Test
    public void testCloudWatchAlarmExistsInAws() {
        Assumptions.assumeTrue(outputs != null, "Skipping live Alarm test: no outputs found");
        String alarmName = outputs.path("Nova-East").path("CpuAlarmName").asText(null);
        Assumptions.assumeTrue(alarmName != null, "Skipping live Alarm test: CpuAlarmName missing");

        try (CloudWatchClient cw = CloudWatchClient.create()) {
            var resp = cw.describeAlarms(DescribeAlarmsRequest.builder().alarmNames(alarmName).build());
            assertThat(resp.metricAlarms()).isNotEmpty();
        }
    }

    @Test
    public void testSnsTopicExistsInAws() {
        Assumptions.assumeTrue(outputs != null, "Skipping live SNS test: no outputs found");
        String topicArn = outputs.path("Nova-East").path("AlarmTopicArn").asText(null);
        Assumptions.assumeTrue(topicArn != null, "Skipping live SNS test: AlarmTopicArn missing");

        try (SnsClient sns = SnsClient.create()) {
            var resp = sns.getTopicAttributes(GetTopicAttributesRequest.builder().topicArn(topicArn).build());
            assertThat(resp.attributes()).isNotEmpty();
        }
    }
}
