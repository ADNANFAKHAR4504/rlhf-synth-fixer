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
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    private Environment testEnvironment;

    @BeforeEach
    public void setUp() {
        // Set up test environment with mock AWS account and region
        testEnvironment = Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build();
    }

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify default environment suffix is set
        assertThat(stack.getEnvironmentSuffix()).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isNotEmpty();
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack.getVpcStack());

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();

        // Verify VPC is created
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));

        // Verify Security Group is created
        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);

        // Verify EC2 Instance is created
        template.resourceCountIs("AWS::EC2::Instance", 1);
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");

        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test VPC configuration properties.
     */
    @Test
    public void testVpcConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Get VPC from the stack
        assertThat(stack.getVpcStack()).isNotNull();
        assertThat(stack.getVpcStack().getVpc()).isNotNull();

        // Verify VPC properties
        Template template = Template.fromStack(stack.getVpcStack());

        // Check for Internet Gateway
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);

        // Check for public subnets (2 AZs = 2 subnets)
        template.resourceCountIs("AWS::EC2::Subnet", 2);

        // Check for route tables
        template.hasResource("AWS::EC2::RouteTable", Map.of());
    }

    /**
     * Test security group configuration.
     */
    @Test
    public void testSecurityGroupConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify security group with SSH ingress rule
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "SecurityGroupIngress", java.util.Arrays.asList(
                Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 22,
                    "ToPort", 22,
                    "CidrIp", "203.0.113.0/32"
                )
            )
        ));
    }

    /**
     * Test IAM role for EC2 instance.
     */
    @Test
    public void testIamRoleConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify IAM role is created
        template.resourceCountIs("AWS::IAM::Role", 1);

        // Verify the role has SSM managed policy
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "ManagedPolicyArns", java.util.Arrays.asList(
                Map.of(
                    "Fn::Join", java.util.Arrays.asList(
                        "",
                        java.util.Arrays.asList(
                            "arn:",
                            Map.of("Ref", "AWS::Partition"),
                            ":iam::aws:policy/AmazonSSMManagedInstanceCore"
                        )
                    )
                )
            )
        ));
    }

    /**
     * Test that stack outputs are created.
     */
    @Test
    public void testStackOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify outputs are created
        template.hasOutput("VpcId", Map.of());
        template.hasOutput("InstanceId", Map.of());
        template.hasOutput("InstancePublicIp", Map.of());
        template.hasOutput("SecurityGroupId", Map.of());
    }
}