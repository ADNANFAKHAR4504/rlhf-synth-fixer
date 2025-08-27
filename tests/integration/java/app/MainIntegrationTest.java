package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import java.util.Collections;
import java.util.Map;

/**
 * Integration tests for TapStack deployments.
 * These tests check synthesized templates and validate resources.
 */
public class MainIntegrationTest {

    private Environment testEnvironment;

    @BeforeEach
    public void setUp() {
        testEnvironment = Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build();
    }

    private TapStack synthesizeStack(String id, String envSuffix) {
        App app = new App();
        return new TapStack(app, id,
                TapStackProps.builder()
                        .environmentSuffix(envSuffix)
                        .stackProps(StackProps.builder()
                                .env(testEnvironment)
                                .build())
                        .build());
    }

    @Test
    public void testFullStackSynthesis() {
        TapStack stack = synthesizeStack("TapStackIntegration", "integration");
        Template template = Template.fromStack(stack.getVpcStack());

        assertThat(template).isNotNull();
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Instance", 1);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
        template.resourceCountIs("AWS::IAM::Role", 1);
    }

    @Test
    public void testMultiEnvironmentSynthesis() {
        String[] envs = {"dev", "staging", "prod"};
        for (String env : envs) {
            TapStack stack = synthesizeStack("TapStack" + env, env);
            Template template = Template.fromStack(stack.getVpcStack());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);
            template.resourceCountIs("AWS::EC2::VPC", 1);
        }
    }

    @Test
    public void testNetworkResources() {
        TapStack stack = synthesizeStack("TapStackNetwork", "network");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::Subnet", 2);
        template.hasResource("AWS::EC2::RouteTable", Map.of());
    }

    @Test
    public void testVpcHasCorrectCidr() {
        TapStack stack = synthesizeStack("TapStackVpc", "vpc");
        Template template = Template.fromStack(stack.getVpcStack());

        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.0.0.0/16"
        ));
    }

    @Test
    public void testInstanceTypeIsT2Micro() {
        TapStack stack = synthesizeStack("TapStackInstance", "instance");
        Template template = Template.fromStack(stack.getVpcStack());

        template.hasResourceProperties("AWS::EC2::Instance", Map.of(
                "InstanceType", "t2.micro"
        ));
    }

    @Test
    public void testSecurityGroupAllowsSsh() {
        TapStack stack = synthesizeStack("TapStackSecurity", "security");
        Template template = Template.fromStack(stack.getVpcStack());

        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                "GroupDescription", "Security group for SSH access to EC2 instances"
        ));
    }

    @Test
    public void testIamRoleCreated() {
        TapStack stack = synthesizeStack("TapStackIam", "iam");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::IAM::Role", 1);
    }

    @Test
    public void testSubnetsAreTwo() {
        TapStack stack = synthesizeStack("TapStackSubnets", "subnet");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::Subnet", 2);
    }

    @Test
    public void testInternetGatewayAttached() {
        TapStack stack = synthesizeStack("TapStackGateway", "gateway");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);
    }

    @Test
    public void testRouteTableCreated() {
        TapStack stack = synthesizeStack("TapStackRoutes", "routes");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::RouteTable", 1);
    }

    @Test
    public void testVpcHasEnvironmentTag() {
        TapStack stack = synthesizeStack("TapStackTags", "tags");
        Template template = Template.fromStack(stack.getVpcStack());

        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "Tags", new Object[]{
                        Map.of("Key", "Environment", "Value", "tags"),
                        Map.of("Key", "Project", "Value", "VpcInfrastructure")
                }
        ));
    }
}
