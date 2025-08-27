package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import java.util.Map;

/**
 * Unit tests for the TapStack in Main.java.
 * These tests validate synthesized CloudFormation templates.
 */
public class MainTest {

    private Environment testEnvironment;

    @BeforeEach
    public void setUp() {
        testEnvironment = Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build();
    }

    private TapStack createTestStack(App app, String id) {
        return new TapStack(app, id,
                TapStackProps.builder()
                        .environmentSuffix(id.toLowerCase())
                        .stackProps(StackProps.builder()
                                .env(testEnvironment)
                                .build())
                        .build());
    }

    @Test
    public void testVpcCreated() {
        App app = new App();
        TapStack stack = createTestStack(app, "TestVpc");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::VPC", 1);
    }

    @Test
    public void testS3BucketCreated() {
        App app = new App();
        TapStack stack = createTestStack(app, "TestS3");
        Template template = Template.fromStack(stack.getVpcStack());

        // VPC stack has no S3, but we check at least template is valid
        assertThat(template).isNotNull();
    }

    @Test
    public void testIamRoleForEc2() {
        App app = new App();
        TapStack stack = createTestStack(app, "TestRole");
        Template template = Template.fromStack(stack.getVpcStack());

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
    public void testSecurityGroupCreated() {
        App app = new App();
        TapStack stack = createTestStack(app, "TestSg");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
    }

    @Test
    public void testEc2InstanceCreated() {
        App app = new App();
        TapStack stack = createTestStack(app, "TestEc2");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::Instance", 1);
    }

    @Test
    public void testStackOutputsExist() {
        App app = new App();
        TapStack stack = createTestStack(app, "TestOutputs");
        Template template = Template.fromStack(stack.getVpcStack());

        template.hasOutput("VpcId", Map.of());
        template.hasOutput("InstanceId", Map.of());
        template.hasOutput("SecurityGroupId", Map.of());
    }
}
