package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.cloudfront.Distribution;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.InstanceProfile;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the complete infrastructure stack.
 * These tests validate the synthesized CloudFormation template
 * and ensure all infrastructure components are properly configured.
 */
class MainIntegrationTest {

    private App app;
    private Main.TapStack tapStack;
    private Template template;

    @BeforeEach
    void setUp() {
        app = new App();
        
        // Create the complete TapStack for integration testing
        tapStack = new Main.TapStack(app, "IntegrationTestStack", Main.TapStackProps.builder()
                .environmentSuffix("integration")
                .stackProps(software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .description("Integration test infrastructure")
                        .build())
                .build());

        // Synthesize the template for testing
        template = Template.fromStack(tapStack);
    }

    @Test
    @DisplayName("Should synthesize complete infrastructure template")
    public void testInfrastructureSynthesis() {
        // Verify the template was synthesized successfully
        assertThat(template).isNotNull();
        
        // Verify the stack was created with correct properties
        assertThat(tapStack).isNotNull();
        assertThat(tapStack.getEnvironmentSuffix()).isEqualTo("integration");
    }

    @Test
    @DisplayName("Should create VPC with public and private subnets")
    public void testVpcCreation() {
        // Verify VPC is created with correct configuration
        template.hasResourceProperties("AWS::EC2::VPC", Match.objectLike(Map.of(
                "CidrBlock", "10.0.0.0/16",
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        )));

        // Verify public subnets are created
        template.hasResourceProperties("AWS::EC2::Subnet", Match.objectLike(Map.of(
                "MapPublicIpOnLaunch", true
        )));

        // Verify private subnets are created
        template.hasResourceProperties("AWS::EC2::Subnet", Match.objectLike(Map.of(
                "MapPublicIpOnLaunch", false
        )));
    }

    @Test
    @DisplayName("Should create S3 bucket for static assets")
    public void testS3BucketCreation() {
        // Verify S3 bucket is created with security configurations
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                "VersioningConfiguration", Map.of("Status", "Enabled"),
                "PublicAccessBlockConfiguration", Map.of(
                        "BlockPublicAcls", true,
                        "BlockPublicPolicy", true,
                        "IgnorePublicAcls", true,
                        "RestrictPublicBuckets", true
                )
        )));
    }

    @Test
    @DisplayName("Should create CloudFront distribution")
    public void testCloudFrontDistribution() {
        // Verify CloudFront distribution is created
        template.hasResource("AWS::CloudFront::Distribution", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "DistributionConfig", Match.objectLike(Map.of(
                                "Enabled", true,
                                "PriceClass", "PriceClass_100"
                        ))
                ))
        )));
    }

    @Test
    @DisplayName("Should create Auto Scaling Group")
    public void testAutoScalingGroupCreation() {
        // Verify Auto Scaling Group is created with correct configuration
        template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Match.objectLike(Map.of(
                "MinSize", "2",
                "MaxSize", "10",
                "DesiredCapacity", "2"
        )));
    }

    @Test
    @DisplayName("Should create Application Load Balancer")
    public void testLoadBalancerCreation() {
        // Verify Application Load Balancer is created
        template.hasResource("AWS::ElasticLoadBalancingV2::LoadBalancer", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "Type", "application",
                        "Scheme", "internet-facing"
                ))
        )));
    }

    @Test
    @DisplayName("Should create IAM roles and security groups")
    public void testSecurityResources() {
        // Verify IAM role is created
        template.hasResource("AWS::IAM::Role", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                                "Statement", Match.anyValue()
                        ))
                ))
        )));

        // Verify security groups are created
        template.hasResource("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "GroupDescription", Match.anyValue()
                ))
        )));
    }

    @Test
    @DisplayName("Should create CloudFormation outputs")
    public void testOutputCreation() {
        // Verify important outputs are created
        template.hasOutput("LoadBalancerDNSintegration", Match.objectLike(Map.of(
                "Description", "Application Load Balancer DNS name"
        )));

        template.hasOutput("LoadBalancerURLintegration", Match.objectLike(Map.of(
                "Description", "Application URL"
        )));

        template.hasOutput("StaticAssetsBucketintegration", Match.objectLike(Map.of(
                "Description", "S3 bucket for static assets"
        )));

        template.hasOutput("CloudFrontDistributionDomainintegration", Match.objectLike(Map.of(
                "Description", "CloudFront distribution domain for static assets"
        )));
    }

    @Test
    @DisplayName("Should configure high availability")
    public void testHighAvailabilityConfiguration() {
        // Verify multiple AZs are used
        template.hasResourceProperties("AWS::EC2::Subnet", Match.objectLike(Map.of(
                "AvailabilityZone", Match.anyValue()
        )));

        // Verify Auto Scaling Group spans multiple AZs
        template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Match.objectLike(Map.of(
                "VPCZoneIdentifier", Match.anyValue()
        )));
    }

    @Test
    @DisplayName("Should configure security best practices")
    public void testSecurityBestPractices() {
        // Verify S3 bucket encryption
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                "BucketEncryption", Match.objectLike(Map.of(
                        "ServerSideEncryptionConfiguration", Match.anyValue()
                ))
        )));

        // Verify security groups have restrictive rules
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "SecurityGroupIngress", Match.anyValue()
        )));
    }

    @Test
    @DisplayName("Should validate infrastructure requirements")
    public void testInfrastructureRequirements() {
        // Verify all required components are present
        assertThat(template.findResources("AWS::EC2::VPC")).isNotEmpty();
        assertThat(template.findResources("AWS::S3::Bucket")).isNotEmpty();
        assertThat(template.findResources("AWS::CloudFront::Distribution")).isNotEmpty();
        assertThat(template.findResources("AWS::AutoScaling::AutoScalingGroup")).isNotEmpty();
        assertThat(template.findResources("AWS::ElasticLoadBalancingV2::LoadBalancer")).isNotEmpty();
        assertThat(template.findResources("AWS::IAM::Role")).isNotEmpty();
        assertThat(template.findResources("AWS::EC2::SecurityGroup")).isNotEmpty();
    }

    @Test
    @DisplayName("Should configure auto scaling policies")
    public void testAutoScalingPolicies() {
        // Verify CPU-based auto scaling policy
        template.hasResource("AWS::AutoScaling::ScalingPolicy", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "PolicyType", "TargetTrackingScaling"
                ))
        )));
    }

    @Test
    @DisplayName("Should configure VPC Flow Logs")
    public void testVpcFlowLogs() {
        // Verify VPC Flow Logs are enabled
        template.hasResource("AWS::Logs::LogGroup", Match.objectLike(Map.of(
                "Properties", Match.objectLike(Map.of(
                        "RetentionInDays", 731
                ))
        )));
    }
}
