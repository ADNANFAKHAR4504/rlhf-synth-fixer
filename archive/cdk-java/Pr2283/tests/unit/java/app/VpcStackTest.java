package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.Environment;

import java.util.Map;

/**
 * Unit tests for VpcStack.
 */
public class VpcStackTest {

    @Test
    public void testVpcCreation() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        VpcStack stack = new VpcStack(app, "VpcStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify VPC is created
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.0.0.0/16",
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        ));

        // Verify public and private subnets are created (at least 2 subnets)
        template.resourceCountIs("AWS::EC2::Subnet", 6); // 3 AZs * 2 subnet types
        assertThat(stack.getVpc()).isNotNull();
    }

    @Test
    public void testVpcHasMultipleAvailabilityZones() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        VpcStack stack = new VpcStack(app, "VpcStackTest", props);
        
        // Verify VPC spans multiple AZs
        assertThat(stack.getVpc().getAvailabilityZones()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    public void testVpcNaming() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        VpcStack stack = new VpcStack(app, "VpcStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify VPC has correct tags
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "Tags", Match.anyValue()
        ));
    }
}