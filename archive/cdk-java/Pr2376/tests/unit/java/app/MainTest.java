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
    
    @Test
    void testTapStackEnvironmentSuffixResolution() {
        // Given
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");
        String stackId = "test-context-resolution";
        
        // When - Create stack without props to test context resolution
        TapStack stack = new TapStack(app, stackId, null);
        
        // Then
        assertEquals("staging", stack.getEnvironmentSuffix(), "Should resolve from context");
    }
    
    @Test
    void testTapStackDefaultEnvironmentSuffix() {
        // Given
        App app = new App();
        String stackId = "test-default-suffix";
        
        // When - Create stack without props or context
        TapStack stack = new TapStack(app, stackId, null);
        
        // Then
        assertEquals("dev", stack.getEnvironmentSuffix(), "Should default to 'dev'");
    }
    
    @Test
    void testTapStackPropsOverridesContext() {
        // Given
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");
        String stackId = "test-props-override";
        
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("production")
                .build();
        
        // When
        TapStack stack = new TapStack(app, stackId, props);
        
        // Then
        assertEquals("production", stack.getEnvironmentSuffix(), "Props should override context");
    }
    
    @Test
    void testVpcComponentConfiguration() {
        // Given
        App app = new App();
        String stackId = "test-vpc-component";
        
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-east-1")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        // When
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then - Verify VPC component resources
        // Internet Gateway
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        
        // VPC Gateway Attachment
        template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);
        
        // EIP for NAT Gateway
        template.resourceCountIs("AWS::EC2::EIP", 1);
        
        // NAT Gateway
        template.resourceCountIs("AWS::EC2::NatGateway", 1);
        
        // Route Tables (VPC default + public + private + custom)
        template.resourceCountIs("AWS::EC2::RouteTable", 4); 
        
        // Routes
        template.resourceCountIs("AWS::EC2::Route", 2); // Public and private routes
        
        // Subnet Route Table Associations (should be 4 - each subnet gets associated)
        template.resourceCountIs("AWS::EC2::SubnetRouteTableAssociation", 4);
    }
    
    @Test
    void testStackOutputsGeneration() {
        // Given
        App app = new App();
        String stackId = "test-outputs";
        
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-east-1")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        // When
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then - Verify outputs are created (region is resolved from stack props)
        String actualRegion = Objects.requireNonNull(props.getStackProps().getEnv()).getRegion();
        
        // Output keys use region without dashes
        String regionKey = actualRegion.replace("-", "");
        
        template.hasOutput(regionKey + "securityGroupIdOutput", Match.anyValue());
        template.hasOutput(regionKey + "vpcIdOutput", Match.anyValue());
        template.hasOutput(regionKey + "vpcPrivateSubnetIdOutput", Match.anyValue());
        template.hasOutput(regionKey + "vpcPublicSubnetIdOutput", Match.anyValue());
        template.hasOutput(regionKey + "ec2InstanceIdOutput", Match.anyValue());
        template.hasOutput(regionKey + "ec2InstanceRoleArnOutput", Match.anyValue());
    }
    
    @Test
    void testUsWest2NoEc2Resources() {
        // Given
        App app = new App();
        String stackId = "test-us-west-2-no-ec2";
        
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-west-2")
                                .account("123456789012")
                                .build())
                        .build())
                .build();
        
        // When
        TapStack stack = new TapStack(app, stackId, props);
        Template template = Template.fromStack(stack);
        
        // Then - Verify no EC2 instance or IAM role
        template.resourceCountIs("AWS::EC2::Instance", 0);
        template.resourceCountIs("AWS::IAM::Role", 0);
        template.resourceCountIs("AWS::IAM::InstanceProfile", 0);
        
        // But should have VPC and security group
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
        
        // Should have VPC outputs but no EC2 outputs (region is resolved from stack props)
        String actualRegion = Objects.requireNonNull(props.getStackProps().getEnv()).getRegion();
        
        // Output keys use region without dashes
        String regionKey = actualRegion.replace("-", "");
        
        template.hasOutput(regionKey + "vpcIdOutput", Match.anyValue());
        template.hasOutput(regionKey + "securityGroupIdOutput", Match.anyValue());
    }
    
    @Test
    void testMainApplicationConfiguration() {
        // Given - Simulate main method behavior
        App app = new App();
        app.getNode().setContext("environmentSuffix", "integration");
        
        // Define environments
        Environment usEast1 = Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build();
        
        Environment usWest2 = Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build();
        
        // When - Create stacks like main method does
        String environmentSuffix = "integration";
        
        TapStack stackUsEast1 = new TapStack(
                app, "TapStack-" + environmentSuffix + "-" + usEast1.getRegion(),
                TapStackProps.builder()
                        .environmentSuffix(environmentSuffix)
                        .stackProps(StackProps.builder()
                                .env(usEast1)
                                .build())
                        .build());
        
        TapStack stackUsWest2 = new TapStack(
                app, "TapStack-" + environmentSuffix + "-" + usWest2.getRegion(),
                TapStackProps.builder()
                        .environmentSuffix(environmentSuffix)
                        .stackProps(StackProps.builder()
                                .env(usWest2)
                                .build())
                        .build());
        
        // Then
        assertEquals("integration", stackUsEast1.getEnvironmentSuffix());
        assertEquals("integration", stackUsWest2.getEnvironmentSuffix());
        
        // Verify templates
        Template templateUsEast1 = Template.fromStack(stackUsEast1);
        Template templateUsWest2 = Template.fromStack(stackUsWest2);
        
        // US-East-1 should have EC2
        templateUsEast1.resourceCountIs("AWS::EC2::Instance", 1);
        templateUsEast1.hasResourceProperties("AWS::EC2::VPC", Map.of("CidrBlock", "10.0.0.0/16"));
        
        // US-West-2 should not have EC2
        templateUsWest2.resourceCountIs("AWS::EC2::Instance", 0);
        templateUsWest2.hasResourceProperties("AWS::EC2::VPC", Map.of("CidrBlock", "192.168.0.0/16"));
    }
    
    @Test
    void testTapStackPropsBuilderValidation() {
        // Test builder pattern validation
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix(null) // Test null handling
                .stackProps(null) // Test null handling
                .build();
        
        // Should handle nulls gracefully
        assertNotNull(props.getStackProps(), "Should provide default StackProps for null input");
        // environmentSuffix can be null, will be resolved from context or default
    }
    
    @Test
    void testStackPropsEnvironmentConfiguration() {
        // Test various environment configurations
        Environment customEnv = Environment.builder()
                .account("987654321098")
                .region("eu-west-1")
                .build();
        
        StackProps customStackProps = StackProps.builder()
                .env(customEnv)
                .description("Custom test stack")
                .build();
        
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("custom")
                .stackProps(customStackProps)
                .build();
        
        assertEquals("custom", props.getEnvironmentSuffix());
        assertEquals(customStackProps, props.getStackProps());
        assertEquals("987654321098", Objects.requireNonNull(props.getStackProps().getEnv()).getAccount());
        assertEquals("eu-west-1", props.getStackProps().getEnv().getRegion());
    }
}