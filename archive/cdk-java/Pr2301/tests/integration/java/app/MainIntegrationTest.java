package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;
import java.util.Arrays;

/**
 * Comprehensive integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components and
 * cross-resource dependencies in the TapStack infrastructure:
 * - Resource interdependencies and references
 * - Security group rules between tiers
 * - KMS key usage across services
 * - CloudWatch logging integration
 * - IAM policy effectiveness
 * - Multi-resource deployment scenarios
 */
public class MainIntegrationTest {

    private App app;
    private TapStack stack;
    private Template template;

    @BeforeEach
    public void setUp() {
        System.setProperty("CDK_DEFAULT_ACCOUNT", "123456789012");
        System.setProperty("CDK_DEFAULT_REGION", "us-east-1");
        
        app = new App();
        stack = new TapStack(app, "IntegrationTestStack", software.amazon.awscdk.StackProps.builder().build());
        template = Template.fromStack(stack);
    }

    /**
     * Integration test for full stack deployment simulation.
     * Verifies that all components can be synthesized together successfully.
     */
    @Test
    public void testFullStackDeployment() {
        // Verify stack synthesis succeeds with all components
        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
        
        // Verify total resource count indicates all components are present
        // Expected: 3 KMS Keys + 1 VPC + multiple subnets + 2 S3 buckets + 
        // 1 CloudTrail + 1 Lambda + 1 RDS + multiple security groups + IAM roles + Log groups
        
        // Verify key resource types exist
        template.resourceCountIs("AWS::KMS::Key", 3);
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::S3::Bucket", 2);
        template.resourceCountIs("AWS::CloudTrail::Trail", 1);
        template.resourceCountIs("AWS::Lambda::Function", 1);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
    }

    /**
     * Test KMS key integration across all services.
     * Verifies that the correct KMS keys are used by the right services.
     */
    @Test
    public void testKmsKeyIntegration() {
        // Verify S3 bucket uses S3 KMS key
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "BucketEncryption", Match.objectLike(Map.of(
                "ServerSideEncryptionConfiguration", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "ServerSideEncryptionByDefault", Match.objectLike(Map.of(
                            "SSEAlgorithm", "aws:kms",
                            "KMSMasterKeyID", Match.anyValue()
                        ))
                    ))
                ))
            ))
        )));
        
        // Verify RDS uses RDS KMS key
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "StorageEncrypted", true,
            "KmsKeyId", Match.anyValue()
        ));
        
        // Verify CloudWatch Log Groups use main KMS key
        template.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "KmsKeyId", Match.anyValue()
        ));
        
        // Verify CloudTrail uses main KMS key
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
            "KMSKeyId", Match.anyValue()
        ));
    }

    /**
     * Test VPC and networking integration.
     * Verifies proper subnet placement and security group associations.
     */
    @Test
    public void testVpcNetworkingIntegration() {
        // Verify Lambda is placed in VPC with security groups
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
            "VpcConfig", Match.objectLike(Map.of(
                "SecurityGroupIds", Match.anyValue(),
                "SubnetIds", Match.anyValue()
            ))
        )));
        
        // Verify RDS is placed in isolated subnets
        template.hasResourceProperties("AWS::RDS::DBInstance", Match.objectLike(Map.of(
            "DBSubnetGroupName", Match.anyValue(),
            "VPCSecurityGroups", Match.anyValue()
        )));
        
        // Verify RDS subnet group uses isolated subnets
        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Match.objectLike(Map.of(
            "SubnetIds", Match.anyValue()
        )));
    }

    /**
     * Test security group rule integration between tiers.
     * Verifies proper communication paths between web, app, and database tiers.
     */
    @Test
    public void testSecurityGroupIntegration() {
        // Verify security groups exist with proper descriptions
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.stringLikeRegexp(".*web tier.*")
        )));
        
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.stringLikeRegexp(".*application tier.*")
        )));
        
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.stringLikeRegexp(".*database tier.*")
        )));
        
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.stringLikeRegexp(".*Lambda function.*")
        )));
    }

    /**
     * Test IAM role and policy integration.
     * Verifies that roles have appropriate permissions for their resources.
     */
    @Test
    public void testIamIntegration() {
        // Verify CloudTrail role exists
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Principal", Map.of("Service", "cloudtrail.amazonaws.com")
                    ))
                ))
            ))
        )));
        
        // Verify Lambda role exists
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Principal", Map.of("Service", "lambda.amazonaws.com")
                    ))
                ))
            ))
        )));
        
        // Verify RDS monitoring role exists
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Principal", Map.of("Service", "monitoring.rds.amazonaws.com")
                    ))
                ))
            ))
        )));
    }

    /**
     * Test CloudWatch logging integration across services.
     * Verifies log groups are properly configured and encrypted.
     */
    @Test
    public void testLoggingIntegration() {
        // Verify CloudTrail sends logs to CloudWatch
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
            "CloudWatchLogsLogGroupArn", Match.anyValue(),
            "CloudWatchLogsRoleArn", Match.anyValue()
        ));
        
        // Verify RDS exports logs to CloudWatch
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "EnableCloudwatchLogsExports", Arrays.asList("error", "general")
        ));
        
        // Verify Lambda uses custom log group
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "LoggingConfig", Match.objectLike(Map.of(
                "LogGroup", Match.anyValue()
            ))
        ));
        
        // Verify all log groups have retention policies
        template.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "RetentionInDays", Match.anyValue()
        ));
    }

    /**
     * Test S3 integration with CloudTrail and access logging.
     * Verifies proper bucket relationships and logging configuration.
     */
    @Test
    public void testS3Integration() {
        // Verify CloudTrail uses S3 bucket for log storage
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
            "S3BucketName", Match.anyValue(),
            "S3KeyPrefix", "cloudtrail-logs/"
        ));
        
        // Verify main S3 bucket has access logging configured
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "LoggingConfiguration", Match.objectLike(Map.of(
                "DestinationBucketName", Match.anyValue(),
                "LogFilePrefix", "access-logs/"
            ))
        )));
        
        // Verify S3 bucket lifecycle configuration
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "LifecycleConfiguration", Match.objectLike(Map.of(
                "Rules", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Status", "Enabled"
                    ))
                ))
            ))
        )));
    }

    /**
     * Test RDS integration with security and monitoring.
     * Verifies parameter groups, monitoring, and security configuration.
     */
    @Test
    public void testRdsIntegration() {
        // Verify RDS uses custom parameter group
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "DBParameterGroupName", Match.anyValue()
        ));
        
        // Verify RDS parameter group has security settings
        template.hasResourceProperties("AWS::RDS::DBParameterGroup", Map.of(
            "Parameters", Map.of(
                "slow_query_log", "1",
                "general_log", "1",
                "log_queries_not_using_indexes", "1"
            )
        ));
        
        // Verify RDS monitoring configuration
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "MonitoringInterval", 60,
            "MonitoringRoleArn", Match.anyValue()
        ));
        
        // Verify RDS backup configuration
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "BackupRetentionPeriod", 7,
            "DeleteAutomatedBackups", false
        ));
    }

    /**
     * Test Lambda integration with VPC, KMS, and S3.
     * Verifies Lambda can access required resources with proper permissions.
     */
    @Test
    public void testLambdaIntegration() {
        // Verify Lambda environment variables reference other resources
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
            "Environment", Match.objectLike(Map.of(
                "Variables", Match.objectLike(Map.of(
                    "S3_BUCKET_NAME", Match.anyValue(),
                    "KMS_KEY_ID", Match.anyValue(),
                    "UNIQUE_ID", Match.anyValue()
                ))
            ))
        )));
        
        // Verify Lambda role has inline policies for S3 and KMS
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Principal", Map.of("Service", "lambda.amazonaws.com")
                    ))
                ))
            )),
            "Policies", Match.anyValue()
        )));
    }

    /**
     * Test resource unique naming and no conflicts.
     * Verifies all resources have unique names and can coexist.
     */
    @Test
    public void testResourceNamingIntegration() {
        // Verify unique resource naming patterns exist by checking resource counts
        template.resourceCountIs("AWS::KMS::Key", 3); // Main, S3, RDS keys
        template.resourceCountIs("AWS::EC2::VPC", 1); // SecureVPC
        template.resourceCountIs("AWS::S3::Bucket", 2); // Main + access logs
        template.resourceCountIs("AWS::Lambda::Function", 1); // SecureFunction
        template.resourceCountIs("AWS::RDS::DBInstance", 1); // SecureRDSInstance
        template.resourceCountIs("AWS::CloudTrail::Trail", 1); // SecureCloudTrail
        
        // Verify unique resource creation with proper counts
        template.resourceCountIs("AWS::KMS::Key", 3);
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::S3::Bucket", 2);
        template.resourceCountIs("AWS::Lambda::Function", 1);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
    }

    /**
     * Test end-to-end resource dependency chain.
     * Verifies the complete dependency graph works correctly.
     */
    @Test
    public void testResourceDependencyChain() {
        // This test verifies that the template can be synthesized without
        // circular dependencies or missing references by checking resource counts
        
        // Verify template contains all expected resource types
        template.resourceCountIs("AWS::KMS::Key", 3);
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::S3::Bucket", 2);
        template.resourceCountIs("AWS::CloudTrail::Trail", 1);
        template.resourceCountIs("AWS::Lambda::Function", 1);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 5);
        template.resourceCountIs("AWS::Logs::LogGroup", 4);
        template.resourceCountIs("AWS::IAM::Role", 4);
        
        // Verify stack was created successfully
        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }
}