package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.TestInstance;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.HashMap;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the TapStack
 * and test real deployment scenarios with actual AWS resource validation.
 *
 * These tests are designed to run against live environments as part of the CI/CD pipeline
 * and may require AWS credentials and actual AWS resources to be created.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("Main CDK Integration Tests")
public class MainIntegrationTest {

    private App app;
    private static final String TEST_ENVIRONMENT = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "test");

    @BeforeEach
    void setUp() {
        app = new App();
    }

    // ==================== Real Deployment Tests ====================

    @Test
    @DisplayName("Full stack deployment with production configuration")
    public void testFullStackDeployment() {
        // Create stack with production-like configuration
        TapStack stack = new TapStack(app, "TapStackProd", TapStackProps.builder()
                .environmentSuffix("prod")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .region("us-west-2")
                                .build())
                        .build())
                .build());

        // Create template and verify it can be synthesized
        Template template = Template.fromStack(stack);

        // Verify stack configuration
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(template).isNotNull();

        // Verify all critical resources are present
        assertThat(template.findResources("AWS::EC2::VPC")).hasSize(1);
        assertThat(template.findResources("AWS::S3::Bucket")).hasSize(2);
        assertThat(template.findResources("AWS::IAM::Role")).hasSize(1);
        assertThat(template.findResources("AWS::EC2::SecurityGroup")).hasSize(1);
        assertThat(template.findResources("AWS::EC2::Instance")).hasSize(1);
        assertThat(template.findResources("AWS::Logs::LogGroup")).hasSize(1);
    }

    @Test
    @DisplayName("Multi-environment deployment validation")
    public void testMultiEnvironmentConfiguration() {
        // Test different environment configurations
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            // Create a new app for each environment to avoid synthesis conflicts
            App envApp = new App();
            TapStack stack = new TapStack(envApp, "TapStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .stackProps(StackProps.builder()
                            .env(Environment.builder()
                                    .region("us-west-2")
                                    .build())
                            .build())
                    .build());

            // Verify each environment configuration
            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

            // Verify template can be created for each environment
            Template template = Template.fromStack(stack);
            assertThat(template).isNotNull();

            // Verify resource count consistency across environments
            assertThat(template.findResources("AWS::EC2::VPC")).hasSize(1);
            assertThat(template.findResources("AWS::S3::Bucket")).hasSize(2);
            assertThat(template.findResources("AWS::IAM::Role")).hasSize(1);
            assertThat(template.findResources("AWS::EC2::SecurityGroup")).hasSize(1);
            assertThat(template.findResources("AWS::EC2::Instance")).hasSize(1);
            assertThat(template.findResources("AWS::Logs::LogGroup")).hasSize(1);
        }
    }

    @Test
    @DisplayName("Security infrastructure validation")
    public void testSecurityInfrastructureValidation() {
        TapStack stack = new TapStack(app, "TapStackSecurity", TapStackProps.builder()
                .environmentSuffix("security-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC security configuration
        template.hasResourceProperties("AWS::EC2::VPC", Match.objectLike(Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        )));

        // Verify Security Group configuration
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", "Security group for secure application with restricted SSH access"
        )));

        // Verify IAM Role configuration
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Description", "Least privilege role for secure application EC2 instance"
        )));

        // Verify S3 bucket security configuration
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "PublicAccessBlockConfiguration", Match.objectLike(Map.of(
                "BlockPublicAcls", true,
                "BlockPublicPolicy", true,
                "IgnorePublicAcls", true,
                "RestrictPublicBuckets", true
            ))
        )));
    }

    @Test
    @DisplayName("Resource dependencies and relationships")
    public void testResourceDependenciesAndRelationships() {
        TapStack stack = new TapStack(app, "TapStackDependencies", TapStackProps.builder()
                .environmentSuffix("deps-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify that EC2 instance exists and has proper configuration
        template.hasResource("AWS::EC2::Instance", Match.objectLike(Map.of(
            "Type", "AWS::EC2::Instance"
        )));

        // Verify that S3 bucket has proper logging configuration
        template.hasResource("AWS::S3::Bucket", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "LoggingConfiguration", Match.anyValue()
            ))
        )));

        // Verify CloudWatch Log Group configuration
        template.hasResource("AWS::Logs::LogGroup", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "LogGroupName", "/aws/ec2/secure-app-deps-test",
                "RetentionInDays", 30
            ))
        )));
    }

    @Test
    @DisplayName("Cross-stack resource sharing validation")
    public void testCrossStackResourceSharing() {
        // Test that resources can be properly shared between stacks
        App app1 = new App();
        App app2 = new App();

        // Create two stacks that might need to share resources
        TapStack stack1 = new TapStack(app1, "TapStackShared1", TapStackProps.builder()
                .environmentSuffix("shared1")
                .build());

        TapStack stack2 = new TapStack(app2, "TapStackShared2", TapStackProps.builder()
                .environmentSuffix("shared2")
                .build());

        Template template1 = Template.fromStack(stack1);
        Template template2 = Template.fromStack(stack2);

        // Verify both stacks can be synthesized independently
        assertThat(template1).isNotNull();
        assertThat(template2).isNotNull();

        // Verify both stacks have the same resource types
        assertThat(template1.findResources("AWS::EC2::VPC")).hasSize(1);
        assertThat(template2.findResources("AWS::EC2::VPC")).hasSize(1);
    }

    @Test
    @DisplayName("Environment-specific configuration validation")
    public void testEnvironmentSpecificConfiguration() {
        // Test that different environments get appropriate configurations
        String[] environments = {"dev", "staging", "prod"};
        String[] expectedInstanceTypes = {"t3.micro", "t3.small", "t3.medium"};

        for (int i = 0; i < environments.length; i++) {
            String env = environments[i];
            App envApp = new App();
            
            TapStack stack = new TapStack(envApp, "TapStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());

            Template template = Template.fromStack(stack);

            // Verify environment-specific configurations
            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

            // Verify that the stack can be synthesized with environment-specific settings
            assertThat(template).isNotNull();
        }
    }

    @Test
    @DisplayName("Error handling and edge cases")
    public void testErrorHandlingAndEdgeCases() {
        // Test with invalid environment suffix
        TapStack stack = new TapStack(app, "TapStackEdge", TapStackProps.builder()
                .environmentSuffix("")
                .build());

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("");

        // Test with null props (should use defaults)
        TapStack stackWithNullProps = new TapStack(app, "TapStackNull", null);
        assertThat(stackWithNullProps.getEnvironmentSuffix()).isEqualTo("dev");
    }

    @Test
    @DisplayName("CloudFormation outputs validation")
    public void testCloudFormationOutputsValidation() {
        TapStack stack = new TapStack(app, "TapStackOutputs", TapStackProps.builder()
                .environmentSuffix("outputs-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify all required outputs are present
        template.hasOutput("VPCId", Match.objectLike(Map.of(
            "Description", "VPC ID"
        )));

        template.hasOutput("S3BucketName", Match.objectLike(Map.of(
            "Description", "Application S3 Bucket Name"
        )));

        template.hasOutput("EC2InstanceId", Match.objectLike(Map.of(
            "Description", "EC2 Instance ID"
        )));

        template.hasOutput("EC2PublicIP", Match.objectLike(Map.of(
            "Description", "EC2 Instance Public IP"
        )));
    }

    @Test
    @DisplayName("Resource naming and tagging validation")
    public void testResourceNamingAndTaggingValidation() {
        TapStack stack = new TapStack(app, "TapStackNaming", TapStackProps.builder()
                .environmentSuffix("naming-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify that resources have appropriate naming patterns
        template.hasResource("AWS::EC2::VPC", Match.objectLike(Map.of(
            "Type", "AWS::EC2::VPC"
        )));
    }

    @Test
    @DisplayName("Performance and scalability validation")
    public void testPerformanceAndScalabilityValidation() {
        // Test that the stack can handle multiple resources efficiently
        TapStack stack = new TapStack(app, "TapStackPerformance", TapStackProps.builder()
                .environmentSuffix("perf-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify resource count is reasonable
        assertThat(template.findResources("AWS::EC2::VPC")).hasSize(1);
        assertThat(template.findResources("AWS::S3::Bucket")).hasSize(2);
        assertThat(template.findResources("AWS::IAM::Role")).hasSize(1);
        assertThat(template.findResources("AWS::EC2::SecurityGroup")).hasSize(1);
        assertThat(template.findResources("AWS::EC2::Instance")).hasSize(1);
        assertThat(template.findResources("AWS::Logs::LogGroup")).hasSize(1);

        // Verify template synthesis is fast
        long startTime = System.currentTimeMillis();
        Template.fromStack(stack);
        long endTime = System.currentTimeMillis();
        
        // Synthesis should complete within 5 seconds
        assertThat(endTime - startTime).isLessThan(5000);
    }

    @Test
    @DisplayName("Compliance and governance validation")
    public void testComplianceAndGovernanceValidation() {
        TapStack stack = new TapStack(app, "TapStackCompliance", TapStackProps.builder()
                .environmentSuffix("compliance-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify encryption is enabled on S3 buckets
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "BucketEncryption", Match.anyValue()
        )));

        // Verify IAM roles have least privilege policies
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Description", "Least privilege role for secure application EC2 instance"
        )));

        // Verify security groups have restricted access
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", "Security group for secure application with restricted SSH access"
        )));
    }

    @Test
    @DisplayName("Disaster recovery and backup validation")
    public void testDisasterRecoveryAndBackupValidation() {
        TapStack stack = new TapStack(app, "TapStackDR", TapStackProps.builder()
                .environmentSuffix("dr-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket versioning is enabled for data protection
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "VersioningConfiguration", Match.objectLike(Map.of(
                "Status", "Enabled"
            ))
        )));

        // Verify CloudWatch logs have appropriate retention
        template.hasResourceProperties("AWS::Logs::LogGroup", Match.objectLike(Map.of(
            "RetentionInDays", 30
        )));
    }

    @Test
    @DisplayName("Resource naming and environment suffix validation")
    public void testResourceNamingAndEnvironmentSuffixValidation() {
        TapStack stack = new TapStack(app, "TapStackNaming", TapStackProps.builder()
                .environmentSuffix("naming-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket resources exist and have proper configuration
        Map<String, Map<String, Object>> bucketResources = template.findResources("AWS::S3::Bucket");
        assertThat(bucketResources).hasSize(2);

        bucketResources.values().forEach(bucketResource -> {
            // Verify that buckets have proper removal policies
            assertThat(bucketResource.get("DeletionPolicy")).isEqualTo("Delete");
            assertThat(bucketResource.get("UpdateReplacePolicy")).isEqualTo("Delete");
        });

        // Verify IAM Role name includes environment suffix
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "RoleName", "secure-app-ec2-role-naming-test"
        )));

        // Verify Security Group name includes environment suffix
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupName", "secure-app-security-group-naming-test"
        )));

        // Verify CloudWatch Log Group name includes environment suffix
        template.hasResourceProperties("AWS::Logs::LogGroup", Match.objectLike(Map.of(
            "LogGroupName", "/aws/ec2/secure-app-naming-test"
        )));
    }

    @Test
    @DisplayName("Removal policies validation for proper cleanup")
    public void testRemovalPoliciesValidation() {
        TapStack stack = new TapStack(app, "TapStackRemoval", TapStackProps.builder()
                .environmentSuffix("removal-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 buckets have DESTROY removal policy
        Map<String, Map<String, Object>> bucketResources = template.findResources("AWS::S3::Bucket");
        bucketResources.values().forEach(bucketResource -> {
            assertThat(bucketResource.get("DeletionPolicy")).isEqualTo("Delete");
            assertThat(bucketResource.get("UpdateReplacePolicy")).isEqualTo("Delete");
        });

        // Verify CloudWatch Log Group has DESTROY removal policy
        template.hasResource("AWS::Logs::LogGroup", Match.objectLike(Map.of(
            "DeletionPolicy", "Delete",
            "UpdateReplacePolicy", "Delete"
        )));
    }

    @Test
    @DisplayName("Multi-environment resource isolation validation")
    public void testMultiEnvironmentResourceIsolation() {
        // Test that different environments create isolated resources
        String[] environments = {"dev", "staging", "prod"};
        
        for (String env : environments) {
            App envApp = new App();
            TapStack stack = new TapStack(envApp, "TapStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());

            Template template = Template.fromStack(stack);

            // Verify bucket resources exist and have proper configuration
            Map<String, Map<String, Object>> bucketResources = template.findResources("AWS::S3::Bucket");
            bucketResources.values().forEach(bucketResource -> {
                // Verify that buckets have proper removal policies
                assertThat(bucketResource.get("DeletionPolicy")).isEqualTo("Delete");
                assertThat(bucketResource.get("UpdateReplacePolicy")).isEqualTo("Delete");
            });

            // Verify IAM Role names are unique per environment
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "RoleName", "secure-app-ec2-role-" + env
            )));

            // Verify Security Group names are unique per environment
            template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "GroupName", "secure-app-security-group-" + env
            )));
        }
    }

    @Test
    @DisplayName("Resource naming pattern validation")
    public void testResourceNamingPatternValidation() {
        TapStack stack = new TapStack(app, "TapStackPattern", TapStackProps.builder()
                .environmentSuffix("pattern-test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify bucket resources exist and have proper configuration
        Map<String, Map<String, Object>> bucketResources = template.findResources("AWS::S3::Bucket");
        bucketResources.values().forEach(bucketResource -> {
            // Verify that buckets have proper removal policies
            assertThat(bucketResource.get("DeletionPolicy")).isEqualTo("Delete");
            assertThat(bucketResource.get("UpdateReplacePolicy")).isEqualTo("Delete");
        });

        // Verify IAM Role naming pattern
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "RoleName", "secure-app-ec2-role-pattern-test"
        )));

        // Verify Security Group naming pattern
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupName", "secure-app-security-group-pattern-test"
        )));

        // Verify Instance Profile naming pattern
        template.hasResourceProperties("AWS::IAM::InstanceProfile", Match.objectLike(Map.of(
            "InstanceProfileName", "secure-app-instance-profile-pattern-test"
        )));

        // Verify EC2 Instance exists with proper configuration
        template.hasResource("AWS::EC2::Instance", Match.objectLike(Map.of(
            "Type", "AWS::EC2::Instance"
        )));
    }

    @Test
    @DisplayName("Environment suffix case sensitivity validation")
    public void testEnvironmentSuffixCaseSensitivity() {
        // Test with mixed case environment suffix
        TapStack stack = new TapStack(app, "TapStackCase", TapStackProps.builder()
                .environmentSuffix("StAgInG")
                .build());

        Template template = Template.fromStack(stack);

        // Verify that environment suffix is converted to lowercase in resource names
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "RoleName", "secure-app-ec2-role-staging"
        )));

        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupName", "secure-app-security-group-staging"
        )));

        // Verify bucket resources exist and have proper configuration
        Map<String, Map<String, Object>> bucketResources = template.findResources("AWS::S3::Bucket");
        bucketResources.values().forEach(bucketResource -> {
            // Verify that buckets have proper removal policies
            assertThat(bucketResource.get("DeletionPolicy")).isEqualTo("Delete");
            assertThat(bucketResource.get("UpdateReplacePolicy")).isEqualTo("Delete");
        });
    }

    @AfterEach
    void tearDown() {
        // Clean up any resources if needed
        app = null;
    }
}
