package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;

/**
 * Unit tests for the InfrastructureStack.
 * 
 * These tests verify that the infrastructure components are properly configured
 * and that CloudFormation templates are generated correctly.
 */
public class InfrastructureStackTest {
    
    private App app;
    private InfrastructureStack stack;
    private Template template;
    
    @BeforeEach
    public void setUp() {
        app = new App();
        stack = new InfrastructureStack(app, "TestInfraStack", StackProps.builder()
                .env(Environment.builder()
                    .account("123456789012")
                    .region("us-east-1")
                    .build())
                .build());
        template = Template.fromStack(stack);
    }

    /**
     * Test that VPC is created with correct configuration.
     */
    @Test
    public void testVpcCreation() {
        // Verify VPC exists with correct CIDR
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));
        
        // Check VPC tags
        template.hasResource("AWS::EC2::VPC", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(List.of(
                    Map.of("Key", "Environment", "Value", "Production"),
                    Map.of("Key", "Name", "Value", "WebAppVPC")
                ))
            ))
        ));
    }

    /**
     * Test that subnets are created correctly.
     */
    @Test
    public void testSubnetCreation() {
        // Verify that public subnets are created
        template.resourceCountIs("AWS::EC2::Subnet", 4);  // 2 public + 2 for each AZ
        
        // Verify subnet has MapPublicIpOnLaunch enabled for public subnets
        template.hasResourceProperties("AWS::EC2::Subnet", Map.of(
            "MapPublicIpOnLaunch", true
        ));
    }

    /**
     * Test that Internet Gateway is created and attached.
     */
    @Test
    public void testInternetGateway() {
        // Verify Internet Gateway exists
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        
        // Verify VPC Gateway Attachment exists
        template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);
    }

    /**
     * Test that Security Group is created with correct rules.
     */
    @Test
    public void testSecurityGroup() {
        // Verify Security Group exists
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for web servers allowing HTTP traffic"
        ));
        
        // Check for HTTP ingress rule (with Description field)
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "SecurityGroupIngress", Match.arrayWith(List.of(
                Map.of(
                    "CidrIp", "0.0.0.0/0",
                    "Description", "Allow HTTP traffic from anywhere",
                    "FromPort", 80,
                    "ToPort", 80,
                    "IpProtocol", "tcp"
                )
            ))
        ));
        
        // Check for SSH ingress rule (with Description field)
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "SecurityGroupIngress", Match.arrayWith(List.of(
                Map.of(
                    "CidrIp", "0.0.0.0/0",
                    "Description", "Allow SSH access for management",
                    "FromPort", 22,
                    "ToPort", 22,
                    "IpProtocol", "tcp"
                )
            ))
        ));
    }

    /**
     * Test that EC2 instances are created.
     */
    @Test
    public void testEc2Instances() {
        // Verify 2 EC2 instances are created
        template.resourceCountIs("AWS::EC2::Instance", 2);
        
        // Verify instance type
        template.hasResourceProperties("AWS::EC2::Instance", Map.of(
            "InstanceType", "t3.micro"
        ));
        
        // Check for proper tags
        template.hasResource("AWS::EC2::Instance", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(List.of(
                    Map.of("Key", "Environment", "Value", "Production")
                ))
            ))
        ));
    }

    /**
     * Test that User Data is properly configured.
     */
    @Test
    public void testUserData() {
        // Verify instances have user data
        template.hasResourceProperties("AWS::EC2::Instance", Map.of(
            "UserData", Match.anyValue()
        ));
    }

    /**
     * Test that all resources have Production environment tag.
     */
    @Test
    public void testProductionTags() {
        // Check VPC has Production tag
        template.hasResource("AWS::EC2::VPC", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(List.of(
                    Map.of("Key", "Environment", "Value", "Production")
                ))
            ))
        ));
        
        // Check Security Group has Production tag
        template.hasResource("AWS::EC2::SecurityGroup", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(List.of(
                    Map.of("Key", "Environment", "Value", "Production")
                ))
            ))
        ));
    }

    /**
     * Test that route tables are properly configured.
     */
    @Test
    public void testRouteTables() {
        // CDK creates 4 route tables (2 public subnets across 2 AZs)
        template.resourceCountIs("AWS::EC2::RouteTable", 4);  
        
        // Verify routes to IGW exist
        template.hasResourceProperties("AWS::EC2::Route", Map.of(
            "DestinationCidrBlock", "0.0.0.0/0"
        ));
    }

    /**
     * Test that NAT Gateways are not created (as specified).
     */
    @Test
    public void testNoNatGateways() {
        // Verify no NAT Gateways are created (as per requirements)
        template.resourceCountIs("AWS::EC2::NatGateway", 0);
    }

    /**
     * Test getter methods.
     */
    @Test
    public void testGetterMethods() {
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getWebSecurityGroup()).isNotNull();
        assertThat(stack.getWebInstance1()).isNotNull();
        assertThat(stack.getWebInstance2()).isNotNull();
    }

    /**
     * Test that stack can be synthesized without errors.
     */
    @Test
    public void testStackSynthesis() {
        // This will throw if synthesis fails
        assertThat(template).isNotNull();
        assertThat(template.toJSON()).isNotNull();
        assertThat(template.toJSON()).isNotEmpty();
    }
}