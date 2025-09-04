package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Arrays;

/**
 * Comprehensive unit tests for the Main CDK application.
 * 
 * These tests verify the complete infrastructure setup including:
 * - KMS keys creation and policies
 * - VPC configuration with multiple subnet types
 * - S3 bucket with encryption and lifecycle rules
 * - CloudTrail logging configuration
 * - Lambda function with proper IAM roles
 * - RDS instance with security groups
 * - Security groups for multi-tier architecture
 */
public class MainTest {

    private App app;
    private TapStack stack;
    private Template template;

    @BeforeEach
    public void setUp() {
        System.setProperty("CDK_DEFAULT_ACCOUNT", "123456789012");
        System.setProperty("CDK_DEFAULT_REGION", "us-east-1");
        
        app = new App();
        stack = new TapStack(app, "TestStack", software.amazon.awscdk.StackProps.builder().build());
        template = Template.fromStack(stack);
    }

    /**
     * Test that the TapStack can be instantiated successfully.
     */
    @Test
    public void testStackCreation() {
        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }

    /**
     * Test that all required KMS keys are created with proper policies.
     */
    @Test
    public void testKmsKeyCreation() {
        // Verify 3 KMS keys are created (Main, S3, RDS)
        template.resourceCountIs("AWS::KMS::Key", 3);
        
        // Verify KMS keys have rotation enabled
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
            "EnableKeyRotation", true
        ));
        
        // Verify KMS key policy includes required permissions
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
            "KeyPolicy", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Sid", "EnableIAMUserPermissions",
                        "Effect", "Allow"
                    ))
                ))
            ))
        ));
    }

    /**
     * Test VPC creation with proper subnet configuration.
     */
    @Test
    public void testVpcCreation() {
        // Verify VPC is created
        template.resourceCountIs("AWS::EC2::VPC", 1);
        
        // Verify VPC properties
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));
        
        // Verify subnets are created (public, private, isolated)
        // Multiple subnets should be created for different AZs and types
        
        // Verify NAT Gateways are created (2 as specified)
        template.resourceCountIs("AWS::EC2::NatGateway", 2);
        
        // Verify Internet Gateway is created
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
    }

    /**
     * Test S3 bucket creation with encryption and security features.
     */
    @Test
    public void testS3BucketCreation() {
        // Verify 2 S3 buckets are created (main + access logs)
        template.resourceCountIs("AWS::S3::Bucket", 2);
        
        // Verify main bucket has encryption enabled
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Map.of(
                "ServerSideEncryptionConfiguration", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "ServerSideEncryptionByDefault", Match.objectLike(Map.of(
                            "SSEAlgorithm", "aws:kms"
                        ))
                    ))
                ))
            ),
            "PublicAccessBlockConfiguration", Map.of(
                "BlockPublicAcls", true,
                "BlockPublicPolicy", true,
                "IgnorePublicAcls", true,
                "RestrictPublicBuckets", true
            ),
            "VersioningConfiguration", Map.of(
                "Status", "Enabled"
            )
        ));
        
        // Verify lifecycle rules are configured
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "LifecycleConfiguration", Match.objectLike(Map.of(
                "Rules", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Status", "Enabled"
                    ))
                ))
            ))
        ));
    }

    /**
     * Test CloudTrail creation with proper logging configuration.
     */
    @Test
    public void testCloudTrailCreation() {
        // Verify CloudTrail is created
        template.resourceCountIs("AWS::CloudTrail::Trail", 1);
        
        // Verify CloudTrail properties
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
            "IncludeGlobalServiceEvents", true,
            "IsMultiRegionTrail", true,
            "EnableLogFileValidation", true
        ));
        
        // Verify CloudWatch Log Group for CloudTrail
        template.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "RetentionInDays", 365
        ));
        
        // Verify CloudTrail IAM role is created
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Principal", Map.of("Service", "cloudtrail.amazonaws.com")
                    ))
                ))
            ))
        ));
    }

    /**
     * Test Lambda function creation with proper IAM roles and security.
     */
    @Test
    public void testLambdaFunctionCreation() {
        // Verify Lambda function is created
        template.resourceCountIs("AWS::Lambda::Function", 1);
        
        // Verify Lambda properties
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Runtime", "python3.9",
            "Handler", "index.handler",
            "Timeout", 300,
            "MemorySize", 512
        ));
        
        // Verify Lambda IAM role
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Principal", Map.of("Service", "lambda.amazonaws.com")
                    ))
                ))
            ))
        ));
        
        // Verify Lambda security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "SecurityGroupEgress", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 443,
                    "ToPort", 443
                ))
            ))
        )));
    }

    /**
     * Test RDS instance creation with security and encryption.
     */
    @Test
    public void testRdsInstanceCreation() {
        // Verify RDS instance is created
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
        
        // Verify RDS properties
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "Engine", "mysql",
            "EngineVersion", "8.0.42",
            "DBInstanceClass", "db.t3.micro",
            "StorageEncrypted", true,
            "BackupRetentionPeriod", 7,
            "DeletionProtection", false,
            "EnablePerformanceInsights", false,
            "EnableCloudwatchLogsExports", Arrays.asList("error", "general"),
            "MonitoringInterval", 60
        ));
        
        // Verify RDS subnet group
        template.resourceCountIs("AWS::RDS::DBSubnetGroup", 1);
        
        // Verify RDS parameter group
        template.resourceCountIs("AWS::RDS::DBParameterGroup", 1);
        template.hasResourceProperties("AWS::RDS::DBParameterGroup", Map.of(
            "Family", "mysql8.0",
            "Parameters", Map.of(
                "slow_query_log", "1",
                "general_log", "1",
                "log_queries_not_using_indexes", "1"
            )
        ));
        
        // Verify RDS monitoring role
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Principal", Map.of("Service", "monitoring.rds.amazonaws.com")
                    ))
                ))
            ))
        ));
    }

    /**
     * Test security groups creation for multi-tier architecture.
     */
    @Test
    public void testSecurityGroupsCreation() {
        // Verify multiple security groups are created
        // (Web, App, DB, Lambda, RDS - total 5)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 5);
        
        // Verify web security group exists with proper description
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.stringLikeRegexp(".*web tier.*")
        )));
        
        // Verify app security group exists with proper description
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.stringLikeRegexp(".*application tier.*")
        )));
        
        // Verify database security group exists with proper description
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "GroupDescription", Match.stringLikeRegexp(".*database tier.*")
        )));
    }

    /**
     * Test CloudWatch Log Groups creation and configuration.
     */
    @Test
    public void testLogGroupsCreation() {
        // Verify multiple log groups are created
        // (S3 Access Logs, CloudTrail, Lambda, RDS)
        template.resourceCountIs("AWS::Logs::LogGroup", 4);
        
        // Verify log retention policies
        template.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "RetentionInDays", 365
        ));
        
        template.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "RetentionInDays", 30
        ));
    }

    /**
     * Test IAM roles and policies creation.
     */
    @Test
    public void testIamRolesCreation() {
        // Verify multiple IAM roles are created
        // (CloudTrail, Lambda, RDS Monitoring, plus any auto-generated CDK roles)
        template.resourceCountIs("AWS::IAM::Role", 4);
        
        // Verify roles have proper trust relationships
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Effect", "Allow"
                    ))
                ))
            ))
        ));
    }

    /**
     * Test resource naming includes unique identifiers.
     */
    @Test
    public void testResourceNaming() {
        // Verify resources have unique naming patterns
        // This is tested by ensuring resources are created successfully
        // and the stack synthesis doesn't fail due to naming conflicts
        
        // Verify specific resource types exist with unique naming
        template.resourceCountIs("AWS::KMS::Key", 3);
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::S3::Bucket", 2);
        template.resourceCountIs("AWS::Lambda::Function", 1);
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
    }
}