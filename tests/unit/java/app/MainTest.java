package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.assertions.Template;

import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    @Test
    void testTapStackCreation() {
        // Given
        App app = new App();
        String stackId = "test-stack-dev";
        
        // When
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("dev")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-east-1")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then
        assertNotNull(stack, "TapStack should be created successfully");
        assertEquals("dev", stack.getEnvironmentSuffix(), "Environment suffix should match");
        
        // Verify VPC is created
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.0.0.0/16",
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        ));
    }
    
    @Test
    void testTapStackWithUsWest2Configuration() {
        // Given
        App app = new App();
        String stackId = "test-stack-prod";
        
        // When
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("prod")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-west-2")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then
        assertEquals("prod", stack.getEnvironmentSuffix(), "Environment suffix should match");
        
        // Verify VPC is created with different CIDR for us-west-2
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "192.168.0.0/16",
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        ));
        
        // Verify no EC2 instance is created in us-west-2
        template.resourceCountIs("AWS::EC2::Instance", 0);
    }
    
    @Test
    void testTapStackWithUsEast1HasEC2() {
        // Given
        App app = new App();
        String stackId = "test-stack-ec2";
        
        // When
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-east-1")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then
        // Verify EC2 instance is created in us-east-1
        template.resourceCountIs("AWS::EC2::Instance", 1);
        template.hasResourceProperties("AWS::EC2::Instance", Map.of(
                "InstanceType", "t3.micro",
                "ImageId", Match.anyValue()
        ));
        
        // Verify IAM role for EC2 is created
        template.resourceCountIs("AWS::IAM::Role", 1);
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Version", "2012-10-17",
                        "Statement", Match.arrayWith(List.of(Map.of(
                                "Action", "sts:AssumeRole",
                                "Effect", "Allow",
                                "Principal", Map.of("Service", "ec2.amazonaws.com")
                        )))
                ))
        ));
    }
    
    @Test
    void testNetworkingComponentConfiguration() {
        // Given
        App app = new App();
        String stackId = "test-networking";
        
        // When
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("dev")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-east-1")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then
        // Verify subnets are created
        template.resourceCountIs("AWS::EC2::Subnet", 2); // Public and private
        
        // Verify Internet Gateway
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        
        // Verify NAT Gateway
        template.resourceCountIs("AWS::EC2::NatGateway", 1);
        
        // Verify Route Tables (VPC creates default route table + 2 additional)
        template.resourceCountIs("AWS::EC2::RouteTable", 4);
        
        // Verify EIP for NAT Gateway
        template.resourceCountIs("AWS::EC2::EIP", 1);
    }
    
    @Test
    void testSecurityGroupConfiguration() {
        // Given
        App app = new App();
        String stackId = "test-security";
        
        // When
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("dev")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-east-1")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then
        // Verify Security Group is created
        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
        
        // Verify HTTP and HTTPS ingress rules
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                "SecurityGroupIngress", Match.arrayWith(List.of(
                        Map.of(
                                "IpProtocol", "tcp",
                                "FromPort", 80,
                                "ToPort", 80,
                                "CidrIp", "0.0.0.0/0",
                                "Description", "Allow HTTP traffic from anywhere"
                        ),
                        Map.of(
                                "IpProtocol", "tcp",
                                "FromPort", 443,
                                "ToPort", 443,
                                "CidrIp", "0.0.0.0/0",
                                "Description", "Allow HTTPS traffic from anywhere"
                        )
                ))
        ));
    }
    
    @Test
    void testTapStackPropsBuilder() {
        // Given
        String envSuffix = "staging";
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .region("us-west-2")
                        .account("987654321098")
                        .build())
                .build();
        
        // When
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix(envSuffix)
                .stackProps(stackProps)
                .build();
        
        // Then
        assertEquals(envSuffix, props.getEnvironmentSuffix());
        assertEquals(stackProps, props.getStackProps());
        assertEquals("us-west-2", Objects.requireNonNull(props.getStackProps().getEnv()).getRegion());
        assertEquals("987654321098", props.getStackProps().getEnv().getAccount());
    }
    
    @Test
    void testTapStackPropsBuilderDefaults() {
        // When
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("dev")
                .build();
        
        // Then
        assertEquals("dev", props.getEnvironmentSuffix());
        assertNotNull(props.getStackProps(), "Stack props should have default value");
    }
}