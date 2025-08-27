package app.networking;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;

public class VpcStackTest {

    @Test
    public void testVpcCreation() {
        App app = new App();
        VpcStack stack = new VpcStack(app, "TestVpcStack", StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-east-1")
                        .build())
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC is created
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.0.0.0/16",
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        ));

        // Verify Flow Logs are created
        template.hasResourceProperties("AWS::EC2::FlowLog", Map.of(
                "ResourceType", "VPC",
                "TrafficType", "ALL"
        ));

        // Verify the stack has the correct getters
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getPublicSubnets()).isNotNull();
        assertThat(stack.getPrivateSubnets()).isNotNull();
    }

    @Test
    public void testSubnetConfiguration() {
        App app = new App();
        VpcStack stack = new VpcStack(app, "TestVpcStack2", StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build());

        Template template = Template.fromStack(stack);

        // Verify public subnets are created
        template.hasResourceProperties("AWS::EC2::Subnet", Map.of(
                "MapPublicIpOnLaunch", true
        ));

        // Verify private subnets are created (checking for NAT Gateway association)
        template.hasResource("AWS::EC2::NatGateway", Match.anyValue());
    }
}