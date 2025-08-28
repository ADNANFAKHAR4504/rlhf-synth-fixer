package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.Arrays;

/**
 * Comprehensive unit tests for the TapStack CDK application.
 * Tests all infrastructure components including VPC, IAM roles, and S3 buckets.
 */
public class TapStackTest {
    
    private App app;
    
    @BeforeEach
    public void setup() {
        app = new App();
    }
    
    /**
     * Test that the TapStack creates a VPC with correct configuration
     */
    @Test
    public void testVPCCreation() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify VPC is created
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));
        
        // Verify VPC has correct tags
        template.hasResource("AWS::EC2::VPC", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(Arrays.asList(
                    Map.of("Key", "Environment", "Value", "dev"),
                    Map.of("Key", "Project", "Value", "infrastructure")
                ))
            ))
        ));
    }
    
    /**
     * Test that the TapStack creates public and private subnets
     */
    @Test
    public void testSubnetCreation() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify subnets are created
        template.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private
        
        // Verify public subnet configuration
        template.hasResourceProperties("AWS::EC2::Subnet", Map.of(
            "MapPublicIpOnLaunch", true
        ));
    }
    
    /**
     * Test that the TapStack creates Internet Gateway and NAT Gateways
     */
    @Test
    public void testGatewayCreation() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify Internet Gateway is created
        template.hasResourceProperties("AWS::EC2::InternetGateway", Map.of());
        
        // Verify NAT Gateways are created (one per AZ)
        template.resourceCountIs("AWS::EC2::NatGateway", 2);
        
        // Verify Elastic IPs for NAT Gateways
        template.resourceCountIs("AWS::EC2::EIP", 2);
    }
    
    /**
     * Test that the TapStack creates IAM roles for EC2 and Lambda
     */
    @Test
    public void testIAMRoleCreation() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify EC2 role is created
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "ec2.amazonaws.com"),
                        "Action", "sts:AssumeRole"
                    )
                ))
            ))
        ));
        
        // Verify Lambda role is created
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "lambda.amazonaws.com"),
                        "Action", "sts:AssumeRole"
                    )
                ))
            ))
        ));
    }
    
    /**
     * Test that the TapStack creates S3 buckets with proper configuration
     */
    @Test
    public void testS3BucketCreation() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify logging bucket is created with versioning
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "VersioningConfiguration", Map.of("Status", "Enabled")
        ));
        
        // Verify bucket encryption
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Match.objectLike(Map.of(
                "ServerSideEncryptionConfiguration", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "ServerSideEncryptionByDefault", Map.of(
                            "SSEAlgorithm", "AES256"
                        )
                    )
                ))
            ))
        ));
        
        // Verify public access is blocked
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "PublicAccessBlockConfiguration", Map.of(
                "BlockPublicAcls", true,
                "BlockPublicPolicy", true,
                "IgnorePublicAcls", true,
                "RestrictPublicBuckets", true
            )
        ));
    }
    
    /**
     * Test that the TapStack creates S3 lifecycle rules
     */
    @Test
    public void testS3LifecycleRules() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify lifecycle rules are configured
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "LifecycleConfiguration", Match.objectLike(Map.of(
                "Rules", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Status", "Enabled",
                        "Transitions", Match.arrayWith(Arrays.asList(
                            Map.of(
                                "StorageClass", "GLACIER",
                                "TransitionInDays", 30
                            )
                        )),
                        "ExpirationInDays", 365
                    )
                ))
            ))
        ));
    }
    
    /**
     * Test that the TapStack creates outputs
     */
    @Test
    public void testStackOutputs() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify VPC outputs
        template.hasOutput("VpcId", Map.of(
            "Description", "VPC ID"
        ));
        
        template.hasOutput("PublicSubnetIds", Map.of(
            "Description", "Public subnet IDs"
        ));
        
        template.hasOutput("PrivateSubnetIds", Map.of(
            "Description", "Private subnet IDs"
        ));
        
        // Verify S3 outputs
        template.hasOutput("LoggingBucketName", Map.of(
            "Description", "Logging bucket name"
        ));
        
        template.hasOutput("ReplicationBucketName", Map.of(
            "Description", "Replication bucket name"
        ));
        
        // Verify IAM outputs
        template.hasOutput("EC2RoleArn", Map.of(
            "Description", "EC2 role ARN"
        ));
        
        template.hasOutput("LambdaRoleArn", Map.of(
            "Description", "Lambda role ARN"
        ));
    }
    
    /**
     * Test staging environment configuration
     */
    @Test
    public void testStagingEnvironmentConfiguration() {
        app.getNode().setContext("environment", "staging");
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify staging VPC CIDR
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.1.0.0/16"
        ));
        
        // Verify staging environment tags
        template.hasResource("AWS::EC2::VPC", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(Arrays.asList(
                    Map.of("Key", "Environment", "Value", "staging")
                ))
            ))
        ));
    }
    
    /**
     * Test production environment configuration
     */
    @Test
    public void testProductionEnvironmentConfiguration() {
        app.getNode().setContext("environment", "prod");
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify production VPC CIDR
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.2.0.0/16"
        ));
        
        // Verify production environment tags
        template.hasResource("AWS::EC2::VPC", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(Arrays.asList(
                    Map.of("Key", "Environment", "Value", "prod")
                ))
            ))
        ));
    }
    
    /**
     * Test S3 cross-account policy attachment
     */
    @Test
    public void testS3CrossAccountPolicy() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify S3 policy is created
        template.hasResourceProperties("AWS::IAM::Policy", Map.of(
            "PolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Action", Match.arrayWith(Arrays.asList(
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        )),
                        "Resource", Match.anyValue()
                    )
                ))
            ))
        ));
    }
    
    /**
     * Test that managed policies are attached to roles
     */
    @Test
    public void testManagedPolicyAttachment() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify SSM policy is attached to EC2 role
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "ManagedPolicyArns", Match.anyValue()
        ));
    }
    
    /**
     * Test that the stack synthesizes without errors
     */
    @Test
    public void testStackSynthesis() {
        TapStack stack = new TapStack(app, "TestStack");
        
        // This should not throw any exceptions
        app.synth();
        
        assertThat(stack).isNotNull();
    }
    
    /**
     * Test bucket SSL enforcement
     */
    @Test
    public void testBucketSSLEnforcement() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify SSL enforcement via bucket policy
        template.hasResourceProperties("AWS::S3::BucketPolicy", Map.of(
            "PolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Deny",
                        "Action", Match.anyValue(),
                        "Principal", Match.anyValue(),
                        "Resource", Match.anyValue(),
                        "Condition", Map.of(
                            "Bool", Map.of("aws:SecureTransport", "false")
                        )
                    )
                ))
            ))
        ));
    }
    
    /**
     * Test S3 replication configuration for non-dev environments
     */
    @Test
    public void testS3ReplicationForProduction() {
        app.getNode().setContext("environment", "prod");
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify replication role is created for production
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "s3.amazonaws.com"),
                        "Action", "sts:AssumeRole"
                    )
                ))
            ))
        ));
    }
    
    /**
     * Test resource naming conventions
     */
    @Test
    public void testResourceNamingConventions() {
        TapStack stack = new TapStack(app, "TestStack");
        Template template = Template.fromStack(stack);
        
        // Verify resources follow naming conventions with environment prefix
        template.hasResource("AWS::IAM::Role", Map.of(
            "Properties", Match.objectLike(Map.of(
                "RoleName", Match.stringLikeRegexp(".*dev.*")
            ))
        ));
    }
}