package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the infrastructure components and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
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
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
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
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test that VPC is created with required multi-AZ configuration.
     */
    @Test
    public void testVpcConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC exists with correct settings
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.0.0.0/16",
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        ));

        // Verify NAT Gateways exist (for high availability)
        template.resourceCountIs("AWS::EC2::NatGateway", 2);

        // Verify subnets are created (6 for 2 AZs with 3 subnet types in us-west-2)
        template.resourceCountIs("AWS::EC2::Subnet", 6);
    }

    /**
     * Test that Aurora RDS cluster is properly configured.
     */
    @Test
    public void testRdsClusterConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify RDS cluster exists with encryption and deletion protection disabled (for destroyability)
        template.hasResourceProperties("AWS::RDS::DBCluster", Map.of(
                "Engine", "aurora-mysql",
                "StorageEncrypted", true,
                "DeletionProtection", false,
                "BackupRetentionPeriod", 7,
                "PreferredBackupWindow", "03:00-04:00"
        ));

        // Verify two DB instances for multi-AZ failover
        template.resourceCountIs("AWS::RDS::DBInstance", 2);
    }

    /**
     * Test that S3 bucket is configured with security requirements.
     */
    @Test
    public void testS3BucketConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket exists with proper security settings
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Match.objectLike(Map.of(
                        "ServerSideEncryptionConfiguration", Match.arrayWith(java.util.Arrays.asList(
                                Map.of("ServerSideEncryptionByDefault", Map.of(
                                        "SSEAlgorithm", "AES256"
                                ))
                        ))
                )),
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

        // Verify bucket policy enforces HTTPS-only access
        template.hasResourceProperties("AWS::S3::BucketPolicy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Effect", "Deny",
                                        "Condition", Match.objectLike(Map.of(
                                                "Bool", Map.of("aws:SecureTransport", "false")
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test that Application Load Balancer is properly configured.
     */
    @Test
    public void testAlbConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify ALB exists and is internet-facing
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
                "Type", "application",
                "Scheme", "internet-facing"
        ));

        // Verify ALB listener configuration
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", Map.of(
                "Protocol", "HTTP",
                "Port", 80
        ));

        // Verify target group with health checks
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Match.objectLike(Map.of(
                "Protocol", "HTTP",
                "Port", 80,
                "HealthCheckPath", "/health.html",
                "HealthCheckIntervalSeconds", 30
        )));
    }

    /**
     * Test that Auto Scaling Group is configured correctly.
     */
    @Test
    public void testAutoScalingGroupConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Auto Scaling Group settings
        template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Map.of(
                "MinSize", "2",
                "MaxSize", "10",
                "DesiredCapacity", "3",
                "HealthCheckGracePeriod", 300,
                "HealthCheckType", "ELB"
        ));

        // Verify launch template exists
        template.resourceCountIs("AWS::EC2::LaunchTemplate", 1);
    }

    /**
     * Test that CloudWatch alarms are configured for RDS monitoring.
     */
    @Test
    public void testCloudWatchAlarms() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify SNS topic for alarms
        template.hasResourceProperties("AWS::SNS::Topic", Map.of(
                "DisplayName", "Production Database Alarms"
        ));

        // Verify CPU utilization alarm
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                "MetricName", "CPUUtilization",
                "Threshold", 80,
                "EvaluationPeriods", 2
        )));

        // Verify database connections alarm
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                "MetricName", "DatabaseConnections",
                "Threshold", 40,
                "EvaluationPeriods", 2
        )));

        // Verify replica lag alarm
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                "MetricName", "AuroraReplicaLag",
                "Threshold", 1000,
                "EvaluationPeriods", 3
        )));
    }

    /**
     * Test that all resources have production tags.
     */
    @Test
    public void testProductionTags() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC has production tag
        template.hasResourceProperties("AWS::EC2::VPC", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(java.util.Arrays.asList(
                        Map.of("Key", "environment", "Value", "production")
                ))
        )));

        // Verify RDS cluster has production tag
        template.hasResourceProperties("AWS::RDS::DBCluster", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(java.util.Arrays.asList(
                        Map.of("Key", "environment", "Value", "production")
                ))
        )));

        // Verify S3 bucket has production tag
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(java.util.Arrays.asList(
                        Map.of("Key", "environment", "Value", "production")
                ))
        )));
    }

    /**
     * Test that all required stack outputs are present.
     */
    @Test
    public void testStackOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify required outputs exist
        template.hasOutput("LoadBalancerDnsName", Match.objectLike(Map.of(
                "Export", Map.of("Name", "ALBDnsNametest")
        )));

        template.hasOutput("DatabaseClusterEndpoint", Match.objectLike(Map.of(
                "Export", Map.of("Name", "DatabaseEndpointtest")
        )));

        template.hasOutput("S3BucketName", Match.objectLike(Map.of(
                "Export", Map.of("Name", "S3BucketNametest")
        )));

        template.hasOutput("VpcId", Match.objectLike(Map.of(
                "Export", Map.of("Name", "VpcIdtest")
        )));
    }

    /**
     * Test that IAM roles and security groups are properly configured.
     */
    @Test
    public void testSecurityConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM role for EC2 instances
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Principal", Match.objectLike(Map.of(
                                                "Service", "ec2.amazonaws.com"
                                        ))
                                ))
                        ))
                ))
        )));

        // Verify security groups exist (at least 3)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 3);
    }
}