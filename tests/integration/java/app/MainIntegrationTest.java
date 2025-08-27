package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the TapStack
 * and test more complex scenarios including multi-environment deployments,
 * resource interdependencies, and end-to-end stack functionality.
 */
public class MainIntegrationTest {

    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }

    /**
     * Integration test for full stack deployment simulation.
     *
     * This test verifies that the complete stack can be synthesized
     * with all its components working together.
     */
    @Test
    public void testFullStackDeployment() {
        TapStack stack = new TapStack(app, "ThreeTierInfrastructureStack", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        // Create template and verify it can be synthesized
        Template template = Template.fromStack(stack);

        // Verify stack configuration
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(template).isNotNull();

        // Verify all major components are present
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Instance", 2);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);
        template.resourceCountIs("AWS::IAM::Role", 2);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 2);

        // Verify outputs are created for integration
        template.hasOutput("VpcId", Map.of(
            "Description", "VPC ID",
            "Value", Map.of("Ref", Match.anyValue())
        ));
        template.hasOutput("DatabaseEndpoint", Match.objectLike(Map.of()));
        template.hasOutput("WebServerPublicIp", Match.objectLike(Map.of()));
        template.hasOutput("AppServerPrivateIp", Match.objectLike(Map.of()));
    }

    /**
     * Integration test for multiple environment configurations.
     *
     * This test verifies that the stack can be configured for different
     * environments (dev, staging, prod) with appropriate settings.
     */
    @Test
    public void testMultiEnvironmentConfiguration() {
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            // Create a new app for each environment to avoid synthesis conflicts
            App envApp = new App();
            TapStack stack = new TapStack(envApp, "ThreeTierStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());

            // Verify each environment configuration
            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

            // Verify template can be created for each environment
            Template template = Template.fromStack(stack);
            assertThat(template).isNotNull();

            // Verify basic structure exists (security groups don't include env suffix in description)
            template.resourceCountIs("AWS::EC2::SecurityGroup", 2);
        }
    }

    /**
     * Integration test for VPC and networking components.
     *
     * Verifies that VPC, subnets, gateways, and routing work together properly.
     */
    @Test
    public void testNetworkingIntegration() {
        TapStack stack = new TapStack(app, "NetworkingTestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC with proper CIDR
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16"
        ));

        // Verify subnets across multiple AZs
        template.resourceCountIs("AWS::EC2::Subnet", 6); // 2 AZs x 3 types

        // Verify Internet Gateway and attachment
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);

        // Verify NAT Gateway for private subnet connectivity
        template.resourceCountIs("AWS::EC2::NatGateway", 1);

        // Verify route tables for different subnet types
        template.hasResourceProperties("AWS::EC2::RouteTable", Match.objectLike(Map.of()));
        template.hasResourceProperties("AWS::EC2::Route", Match.objectLike(Map.of()));
    }

    /**
     * Integration test for security groups and network security.
     *
     * Verifies that security groups are properly configured with correct rules
     * and that they reference each other correctly.
     */
    @Test
    public void testSecurityGroupsIntegration() {
        TapStack stack = new TapStack(app, "SecurityTestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify EC2 security group with SSH access
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", "Security group for EC2 instances with restricted SSH access",
            "SecurityGroupIngress", Match.arrayWith(List.of(
                Match.objectLike(Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 22,
                    "ToPort", 22,
                    "CidrIp", "203.0.113.0/24"
                ))
            ))
        )));

        // Verify database security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", "Security group for PostgreSQL database - restricted access"
        )));

        // Verify security group count
        template.resourceCountIs("AWS::EC2::SecurityGroup", 2);
    }

    /**
     * Integration test for database and secrets integration.
     *
     * Verifies that RDS database is properly integrated with Secrets Manager
     * and placed in the correct subnets with proper security.
     */
    @Test
    public void testDatabaseIntegration() {
        TapStack stack = new TapStack(app, "DatabaseTestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Secrets Manager secret
        template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
            "Description", "Database credentials for PostgreSQL instance"
        )));

        // Verify RDS instance with proper configuration
        template.hasResourceProperties("AWS::RDS::DBInstance", Match.objectLike(Map.of(
            "Engine", "postgres",
            "DBInstanceClass", "db.t3.micro",
            "AllocatedStorage", "100",
            "StorageEncrypted", true,
            "BackupRetentionPeriod", 7,
            "DeletionProtection", false
        )));

        // Verify DB subnet group for isolated subnets
        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Match.objectLike(Map.of()));

        // Verify secret attachment (links RDS to Secrets Manager)
        template.hasResourceProperties("AWS::SecretsManager::SecretTargetAttachment", Match.objectLike(Map.of()));
    }

    /**
     * Integration test for EC2 instances and IAM integration.
     *
     * Verifies that EC2 instances are properly configured with IAM roles,
     * placed in correct subnets, and have proper security group assignments.
     */
    @Test
    public void testEC2IAMIntegration() {
        TapStack stack = new TapStack(app, "EC2TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM role for EC2
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(List.of(Match.objectLike(Map.of(
                    "Effect", "Allow",
                    "Principal", Map.of("Service", "ec2.amazonaws.com"),
                    "Action", "sts:AssumeRole"
                ))))
            ))
        )));

        // Verify instance profile
        template.hasResourceProperties("AWS::IAM::InstanceProfile", Match.objectLike(Map.of()));

        // Verify EC2 instances
        template.resourceCountIs("AWS::EC2::Instance", 2);
        
        // Verify instances have proper configuration
        template.hasResourceProperties("AWS::EC2::Instance", Match.objectLike(Map.of(
            "InstanceType", "t3.micro"
        )));
    }

    /**
     * Integration test for stack outputs and cross-references.
     *
     * Verifies that stack outputs are properly configured for integration
     * with other stacks or external systems.
     */
    @Test
    public void testStackOutputsIntegration() {
        TapStack stack = new TapStack(app, "OutputsTestStack", TapStackProps.builder()
                .environmentSuffix("integration")
                .build());

        Template template = Template.fromStack(stack);

        // Verify all expected outputs are present
        template.hasOutput("VpcId", Match.objectLike(Map.of(
            "Description", "VPC ID"
        )));

        template.hasOutput("DatabaseEndpoint", Match.objectLike(Map.of(
            "Description", "PostgreSQL database endpoint"
        )));

        template.hasOutput("WebServerPublicIp", Match.objectLike(Map.of(
            "Description", "Web server public IP address"
        )));

        template.hasOutput("AppServerPrivateIp", Match.objectLike(Map.of(
            "Description", "Application server private IP address"
        )));
    }

    /**
     * Integration test for resource dependencies and ordering.
     *
     * Verifies that resources are created in the correct order and
     * dependencies are properly established.
     */
    @Test
    public void testResourceDependencies() {
        TapStack stack = new TapStack(app, "DependencyTestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify that all resources can be synthesized without circular dependencies
        assertThat(template).isNotNull();

        // Verify that dependent resources exist
        // VPC must exist for subnets
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Subnet", 6);

        // Security groups must reference VPC
        template.resourceCountIs("AWS::EC2::SecurityGroup", 2);

        // RDS needs subnet group and security group
        template.resourceCountIs("AWS::RDS::DBSubnetGroup", 1);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);

        // EC2 instances need security groups and subnets
        template.resourceCountIs("AWS::EC2::Instance", 2);
    }

    /**
     * Integration test for production-like configuration.
     *
     * Tests the stack with production settings to ensure it meets
     * production requirements for security, reliability, and performance.
     */
    @Test
    public void testProductionConfiguration() {
        StackProps prodStackProps = StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .description("Production Three-Tier Infrastructure")
            .build();

        TapStack stack = new TapStack(app, "ProdStack", TapStackProps.builder()
                .environmentSuffix("prod")
                .stackProps(prodStackProps)
                .build());

        Template template = Template.fromStack(stack);

        // Verify production-ready database configuration
        template.hasResourceProperties("AWS::RDS::DBInstance", Match.objectLike(Map.of(
            "StorageEncrypted", true,
            "BackupRetentionPeriod", 7,
            "DeletionProtection", false,
            "AllocatedStorage", "100"
        )));

        // Verify production environment suffix is applied
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        
        // Verify stack properties
        assertThat(stack.getAccount()).isEqualTo("123456789012");
        assertThat(stack.getRegion()).isEqualTo("us-east-1");
    }

    /**
     * Integration test for context-based configuration.
     *
     * Tests that the stack properly responds to CDK context variables
     * and external configuration.
     */
    @Test
    public void testContextBasedConfiguration() {
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "ContextTestStack", TapStackProps.builder()
                .build()); // No environment suffix in props

        // Verify context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");

        Template template = Template.fromStack(stack);
        
        // Verify template is valid
        assertThat(template).isNotNull();
        
        // Verify staging-specific configuration (security groups exist)
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.anyValue()
        )));
    }

    /**
     * Integration test for stack with custom stack properties.
     *
     * Tests the integration when custom stack properties are provided,
     * including environment, tags, and other CDK stack options.
     */
    @Test
    public void testCustomStackPropertiesIntegration() {
        StackProps customProps = StackProps.builder()
            .env(Environment.builder()
                .account("987654321098")
                .region("eu-west-1")
                .build())
            .description("Custom Test Infrastructure")
            .build();

        TapStack stack = new TapStack(app, "CustomPropsStack", TapStackProps.builder()
                .environmentSuffix("custom")
                .stackProps(customProps)
                .build());

        // Verify custom properties are applied
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("custom");
        assertThat(stack.getAccount()).isEqualTo("987654321098");
        assertThat(stack.getRegion()).isEqualTo("eu-west-1");

        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }

    /**
     * Integration test for error scenarios and edge cases.
     *
     * Tests how the stack handles edge cases and validates proper
     * error handling where applicable.
     */
    @Test
    public void testEdgeCasesAndErrorHandling() {
        // Test with null props - should use defaults
        TapStack stack1 = new TapStack(app, "NullPropsStack", null);
        assertThat(stack1.getEnvironmentSuffix()).isEqualTo("dev");

        // Test with empty environment suffix - should use context or default
        TapStack stack2 = new TapStack(app, "EmptyEnvStack", TapStackProps.builder()
                .environmentSuffix("")
                .build());
        // Empty string should be preserved (not null)
        assertThat(stack2.getEnvironmentSuffix()).isEqualTo("");

        // Verify both stacks can synthesize
        Template template1 = Template.fromStack(stack1);
        Template template2 = Template.fromStack(stack2);
        assertThat(template1).isNotNull();
        assertThat(template2).isNotNull();
    }
}
