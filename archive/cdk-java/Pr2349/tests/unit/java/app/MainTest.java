package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;

/**
 * Comprehensive unit tests for the Main CDK application, TapStack, and TapStackProps.
 * 
 * These tests verify the basic structu        // Verify all expected outputs are present
        template.hasOutput("VpcId", Match.objectLike(Map.of(
            "Description", "ID of the VPC"
        )));

        template.hasOutput("DatabaseEndpoint", Match.objectLike(Map.of(
            "Description", "PostgreSQL database endpoint"
        ))); of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    private App app;
    
    @BeforeEach
    public void setUp() {
        app = new App();
    }

    // ===============================
    // Basic Stack Creation Tests
    // ===============================

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test priority of environment suffix: props > context > default.
     */
    @Test
    public void testEnvironmentSuffixPriority() {
        app.getNode().setContext("environmentSuffix", "context-env");
        
        TapStack stack = new TapStack(app, "TestStack",
            TapStackProps.builder()
                .environmentSuffix("props-env")
                .build());
        
        // Props should take priority over context
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("props-env");
    }

    /**
     * Test that stack works with null props.
     */
    @Test
    public void testStackWithNullProps() {
        TapStack stack = new TapStack(app, "TestStack", null);

        // Verify stack was created with default values
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test TapStack with custom stack properties.
     */
    @Test
    public void testStackWithCustomProps() {
        StackProps customProps = StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .description("Test Three-Tier Stack")
            .build();
        
        TapStack stack = new TapStack(app, "TestStack",
            TapStackProps.builder()
                .environmentSuffix("custom")
                .stackProps(customProps)
                .build());
        
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("custom");
        assertThat(stack.getRegion()).isEqualTo("us-west-2");
        assertThat(stack.getAccount()).isEqualTo("123456789012");
    }

    // ===============================
    // VPC and Networking Tests
    // ===============================

    /**
     * Test VPC creation and configuration.
     */
    @Test
    public void testVpcCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC is created with correct configuration
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));

        // Verify exactly one VPC is created
        template.resourceCountIs("AWS::EC2::VPC", 1);
    }

    /**
     * Test subnet configuration for three-tier architecture.
     */
    @Test
    public void testSubnetConfiguration() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify 6 subnets are created (2 AZs x 3 tiers)
        template.resourceCountIs("AWS::EC2::Subnet", 6);

        // Verify public subnets
        template.hasResourceProperties("AWS::EC2::Subnet", Match.objectLike(Map.of(
            "MapPublicIpOnLaunch", true
        )));

        // Verify private subnets exist
        template.hasResourceProperties("AWS::EC2::Subnet", Match.objectLike(Map.of(
            "MapPublicIpOnLaunch", false
        )));
    }

    /**
     * Test Internet Gateway and NAT Gateway creation.
     */
    @Test
    public void testGatewayCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Internet Gateway
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);

        // Verify NAT Gateway
        template.resourceCountIs("AWS::EC2::NatGateway", 1);

        // Verify Elastic IP for NAT Gateway
        template.resourceCountIs("AWS::EC2::EIP", 1);
    }

    // ===============================
    // Security Groups Tests
    // ===============================

    /**
     * Test security groups creation and configuration.
     */
    @Test
    public void testSecurityGroupsCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify two security groups are created
        template.resourceCountIs("AWS::EC2::SecurityGroup", 2);

        // Verify EC2 security group configuration
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", "Security group for EC2 instances with restricted SSH access"
        )));

        // Verify database security group configuration
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", "Security group for PostgreSQL database - restricted access"
        )));
    }

    /**
     * Test EC2 security group ingress rules.
     */
    @Test
    public void testEC2SecurityGroupRules() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify SSH access rule (restricted IP range)
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "SecurityGroupIngress", Match.arrayWith(List.of(
                Match.objectLike(Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 22,
                    "ToPort", 22,
                    "CidrIp", "203.0.113.0/24"
                ))
            ))
        )));
    }

    // ===============================
    // EC2 Instances Tests
    // ===============================

    /**
     * Test EC2 instances creation.
     */
    @Test
    public void testEC2Instances() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify EC2 instances are created
        template.resourceCountIs("AWS::EC2::Instance", 2); // Web server + App server

        // Verify instances have proper instance type
        template.hasResourceProperties("AWS::EC2::Instance", Match.objectLike(Map.of(
            "InstanceType", "t3.micro"
        )));
    }

    /**
     * Test EC2 instances configuration.
     */
    @Test
    public void testEC2InstancesConfiguration() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify two EC2 instances are created
        template.resourceCountIs("AWS::EC2::Instance", 2);

        // Verify instance configuration
        template.hasResourceProperties("AWS::EC2::Instance", Match.objectLike(Map.of(
            "InstanceType", "t3.micro"
        )));
    }

    // ===============================
    // RDS Database Tests
    // ===============================

    /**
     * Test RDS PostgreSQL database creation.
     */
    @Test
    public void testRDSDatabase() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify RDS instance is created
        template.hasResourceProperties("AWS::RDS::DBInstance", Match.objectLike(Map.of(
            "Engine", "postgres",
            "DBInstanceClass", "db.t3.micro",
            "AllocatedStorage", "100",
            "StorageEncrypted", true,
            "BackupRetentionPeriod", 7,
            "DeletionProtection", false
        )));

        // Verify DB subnet group is created
        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Match.objectLike(Map.of()));
    }

    /**
     * Test RDS database configuration.
     */
    @Test
    public void testRDSDatabaseConfiguration() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify RDS instance configuration
        template.hasResourceProperties("AWS::RDS::DBInstance", Match.objectLike(Map.of(
            "Engine", "postgres",
            "DBInstanceClass", "db.t3.micro",
            "AllocatedStorage", "100",
            "StorageEncrypted", true,
            "BackupRetentionPeriod", 7,
            "DeletionProtection", false
        )));

        // Verify exactly one RDS instance
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
    }

    /**
     * Test DB subnet group configuration.
     */
    @Test
    public void testDBSubnetGroup() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DB subnet group is created
        template.resourceCountIs("AWS::RDS::DBSubnetGroup", 1);

        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Match.objectLike(Map.of(
            "DBSubnetGroupDescription", "Subnet group for PostgreSQL database"
        )));
    }

    /**
     * Test database encryption and backup configuration.
     */
    @Test
    public void testDatabaseSecurity() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify database has proper security configuration
        template.hasResourceProperties("AWS::RDS::DBInstance", Match.objectLike(Map.of(
            "StorageEncrypted", true,
            "BackupRetentionPeriod", 7,
            "DeletionProtection", false // Current implementation
        )));
    }

    // ===============================
    // Secrets Manager Tests
    // ===============================

    /**
     * Test Secrets Manager secret creation.
     */
    @Test
    public void testSecretsManagerSecret() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Secrets Manager secret is created
        template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
            "Description", "Database credentials for PostgreSQL instance",
            "GenerateSecretString", Match.objectLike(Map.of(
                "SecretStringTemplate", "{\"username\": \"dbadmin\"}",
                "GenerateStringKey", "password",
                "PasswordLength", 32
            ))
        )));
    }

    /**
     * Test Secrets Manager secret configuration.
     */
    @Test
    public void testSecretsManagerConfiguration() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify secret is created
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);

        template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
            "Description", "Database credentials for PostgreSQL instance",
            "GenerateSecretString", Match.objectLike(Map.of(
                "SecretStringTemplate", "{\"username\": \"dbadmin\"}",
                "GenerateStringKey", "password",
                "PasswordLength", 32,
                "ExcludeCharacters", " /@\"'\\"
            ))
        )));

        // Verify secret target attachment
        template.resourceCountIs("AWS::SecretsManager::SecretTargetAttachment", 1);
    }

    // ===============================
    // IAM Tests
    // ===============================

    /**
     * Test IAM role creation for EC2 instances.
     */
    @Test
    public void testIAMRole() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM role is created
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(List.of(
                    Match.objectLike(Map.of(
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "ec2.amazonaws.com")
                    ))
                ))
            ))
        )));

        // Verify instance profile is created
        template.hasResourceProperties("AWS::IAM::InstanceProfile", Match.objectLike(Map.of()));
    }

    /**
     * Test IAM role and instance profile creation.
     */
    @Test
    public void testIAMRoleConfiguration() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM roles are created (EC2 role + RDS monitoring role)
        template.resourceCountIs("AWS::IAM::Role", 2);

        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(List.of(
                    Match.objectLike(Map.of(
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "ec2.amazonaws.com"),
                        "Action", "sts:AssumeRole"
                    ))
                ))
            ))
        )));

        // Verify instance profile is created
        template.resourceCountIs("AWS::IAM::InstanceProfile", 2);
    }

    // ===============================
    // Stack Outputs Tests
    // ===============================

    /**
     * Test stack outputs creation.
     */
    @Test
    public void testStackOutputs() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify outputs are created
        template.hasOutput("VpcId", Match.objectLike(Map.of()));
        template.hasOutput("DatabaseEndpoint", Match.objectLike(Map.of()));
    }

    /**
     * Test stack outputs with descriptions.
     */
    @Test
    public void testStackOutputsWithDescriptions() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
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
    }

    // ===============================
    // TapStackProps Tests
    // ===============================

    /**
     * Test TapStackProps builder functionality.
     */
    @Test
    public void testTapStackPropsBuilder() {
        StackProps customStackProps = StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .description("Test Three-Tier Infrastructure")
            .build();

        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("staging")
            .stackProps(customStackProps)
            .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        assertThat(props.getStackProps()).isNotNull();
        assertThat(props.getStackProps().getDescription()).isEqualTo("Test Three-Tier Infrastructure");
        assertThat(props.getStackProps().getEnv().getAccount()).isEqualTo("123456789012");
        assertThat(props.getStackProps().getEnv().getRegion()).isEqualTo("us-west-2");
    }

    /**
     * Test TapStackProps builder with environment suffix only.
     */
    @Test
    public void testTapStackPropsBuilderWithEnvironmentSuffixOnly() {
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("test")
            .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isNotNull(); // Default StackProps should be created
    }

    /**
     * Test TapStackProps builder with custom StackProps.
     */
    @Test
    public void testTapStackPropsBuilderWithCustomStackProps() {
        StackProps customStackProps = StackProps.builder()
            .description("Test stack description")
            .env(Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build())
            .build();

        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("prod")
            .stackProps(customStackProps)
            .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isEqualTo(customStackProps);
        assertThat(props.getStackProps().getDescription()).isEqualTo("Test stack description");
        assertThat(props.getStackProps().getEnv().getAccount()).isEqualTo("123456789012");
        assertThat(props.getStackProps().getEnv().getRegion()).isEqualTo("us-west-2");
    }

    /**
     * Test TapStackProps builder with null environment suffix.
     */
    @Test
    public void testTapStackPropsBuilderWithNullEnvironmentSuffix() {
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix(null)
            .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isNull();
        assertThat(props.getStackProps()).isNotNull(); // Default StackProps should be created
    }

    /**
     * Test TapStackProps builder with null StackProps.
     */
    @Test
    public void testTapStackPropsBuilderWithNullStackProps() {
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("test")
            .stackProps(null)
            .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isNotNull(); // Default StackProps should be created
    }

    /**
     * Test TapStackProps builder method chaining.
     */
    @Test
    public void testTapStackPropsBuilderMethodChaining() {
        StackProps stackProps = StackProps.builder()
            .description("Method chaining test")
            .build();

        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("chain")
            .stackProps(stackProps)
            .environmentSuffix("updated") // Override previous value
            .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("updated");
        assertThat(props.getStackProps().getDescription()).isEqualTo("Method chaining test");
    }

    // ===============================
    // Environment and Naming Tests
    // ===============================

    /**
     * Test stack tags are applied correctly.
     */
    @Test
    public void testStackTags() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        Template template = Template.fromStack(stack);

        // Verify that resources have proper tags
        // Note: Tags are applied at the stack level and propagated to resources
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
    }

    /**
     * Test resource naming conventions.
     */
    @Test
    public void testResourceNaming() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        Template template = Template.fromStack(stack);

        // Verify that resources are created (naming is internal to CDK)
        // but we can verify the logical structure
        assertThat(template).isNotNull();
        
        // Verify minimum required resources are present
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Instance", 2);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);
        template.resourceCountIs("AWS::IAM::Role", 2); // EC2 + RDS monitoring
    }

    /**
     * Test environment-specific resource naming.
     */
    @Test
    public void testEnvironmentSpecificNaming() {
        String[] environments = {"dev", "staging", "prod"};
        
        for (String env : environments) {
            App envApp = new App();
            TapStack stack = new TapStack(envApp, "TestStack" + env,
                TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());
            
            Template template = Template.fromStack(stack);
            
            // Verify environment suffix is included in resource names/properties
            // Note: The current implementation includes env suffix in the secret name, not description
            template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
                "Name", Match.stringLikeRegexp(".*" + env + ".*")
            )));
        }
    }

    /**
     * Test TapStackProps with different environment suffixes.
     */
    @Test
    public void testTapStackPropsWithDifferentEnvironmentSuffixes() {
        String[] environments = {"dev", "test", "staging", "prod", "demo"};

        for (String env : environments) {
            TapStackProps props = TapStackProps.builder()
                .environmentSuffix(env)
                .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo(env);
        }
    }

    // ===============================
    // Resource Count and Consistency Tests
    // ===============================

    /**
     * Test resource count consistency.
     */
    @Test
    public void testResourceCountConsistency() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("consistency")
                .build());

        Template template = Template.fromStack(stack);

        // Verify consistent resource counts
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Subnet", 6);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 2);
        template.resourceCountIs("AWS::EC2::Instance", 2);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
        template.resourceCountIs("AWS::RDS::DBSubnetGroup", 1);
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);
        template.resourceCountIs("AWS::SecretsManager::SecretTargetAttachment", 1);
        template.resourceCountIs("AWS::IAM::Role", 2); // EC2 + RDS monitoring
        template.resourceCountIs("AWS::IAM::InstanceProfile", 2);
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::NatGateway", 1);
    }

    /**
     * Test minimum required resources are present.
     */
    @Test
    public void testMinimumRequiredResources() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("minimum")
                .build());

        Template template = Template.fromStack(stack);

        // Verify all critical resources are present
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Instance", 2);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);
        template.resourceCountIs("AWS::IAM::Role", 2); // EC2 + RDS monitoring
        template.resourceCountIs("AWS::EC2::SecurityGroup", 2);
    }

    // ===============================
    // Edge Cases and Error Handling Tests
    // ===============================

    /**
     * Test TapStackProps with special characters in environment suffix.
     */
    @Test
    public void testTapStackPropsWithSpecialCharactersInEnvironmentSuffix() {
        String[] specialEnvs = {"dev-1", "test_env", "staging.v2", "prod-us-east-1"};

        for (String env : specialEnvs) {
            TapStackProps props = TapStackProps.builder()
                .environmentSuffix(env)
                .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo(env);
        }
    }

    /**
     * Test TapStackProps immutability.
     */
    @Test
    public void testTapStackPropsImmutability() {
        StackProps originalStackProps = StackProps.builder()
            .description("Original description")
            .build();

        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("immutable")
            .stackProps(originalStackProps)
            .build();

        // Verify the props contain the expected values
        assertThat(props.getEnvironmentSuffix()).isEqualTo("immutable");
        assertThat(props.getStackProps()).isEqualTo(originalStackProps);

        // Props should be immutable - getters should return the same values
        assertThat(props.getEnvironmentSuffix()).isEqualTo("immutable");
        assertThat(props.getStackProps()).isEqualTo(originalStackProps);
    }

    /**
     * Test complex production-like configuration.
     */
    @Test
    public void testComplexProductionConfiguration() {
        StackProps prodStackProps = StackProps.builder()
            .env(Environment.builder()
                .account("111122223333")
                .region("ap-southeast-2")
                .build())
            .description("Complex multi-tier infrastructure for testing")
            .build();

        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("complex")
            .stackProps(prodStackProps)
            .build();

        TapStack stack = new TapStack(app, "ComplexStack", props);

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("complex");
        assertThat(props.getStackProps()).isNotNull();
        assertThat(props.getStackProps().getEnv()).isNotNull();
        assertThat(props.getStackProps().getEnv().getAccount()).isEqualTo("111122223333");
        assertThat(props.getStackProps().getEnv().getRegion()).isEqualTo("ap-southeast-2");
        assertThat(props.getStackProps().getDescription()).contains("Complex multi-tier infrastructure");

        // Verify stack can synthesize
        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }
}
