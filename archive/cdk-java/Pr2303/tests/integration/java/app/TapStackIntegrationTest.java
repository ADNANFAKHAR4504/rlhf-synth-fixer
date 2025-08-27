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
import java.util.Arrays;

/**
 * Integration tests for the TapStack CDK application.
 * 
 * These tests verify end-to-end functionality and integration between
 * different infrastructure components across multiple environments.
 */
public class TapStackIntegrationTest {
    
    private App app;
    
    @BeforeEach
    public void setup() {
        app = new App();
    }
    
    /**
     * Test full infrastructure deployment for all environments
     */
    @Test
    public void testFullInfrastructureDeploymentAllEnvironments() {
        String[] environments = {"dev", "staging", "prod"};
        Map<String, String> expectedCidrs = Map.of(
            "dev", "10.0.0.0/16",
            "staging", "10.1.0.0/16",
            "prod", "10.2.0.0/16"
        );
        
        for (String env : environments) {
            App environmentApp = new App();
            environmentApp.getNode().setContext("environment", env);
            
            TapStack stack = new TapStack(environmentApp, "TapStack-" + env);
            Template template = Template.fromStack(stack);
            
            // Verify VPC with correct CIDR for each environment
            template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", expectedCidrs.get(env)
            ));
            
            // Verify all core components are created
            verifyCompleteInfrastructure(template, env);
        }
    }
    
    /**
     * Test cross-stack dependencies and references
     */
    @Test
    public void testCrossStackDependencies() {
        TapStack stack = new TapStack(app, "MainStack");
        Template template = Template.fromStack(stack);
        
        // Verify IAM roles can reference S3 buckets
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
        
        // Verify route tables reference NAT gateways
        template.hasResourceProperties("AWS::EC2::Route", Map.of(
            "DestinationCidrBlock", "0.0.0.0/0",
            "NatGatewayId", Match.anyValue()
        ));
    }
    
    /**
     * Test network connectivity configuration
     */
    @Test
    public void testNetworkConnectivity() {
        TapStack stack = new TapStack(app, "NetworkTestStack");
        Template template = Template.fromStack(stack);
        
        // Verify Internet Gateway attachment
        template.hasResourceProperties("AWS::EC2::VPCGatewayAttachment", Map.of(
            "VpcId", Match.anyValue(),
            "InternetGatewayId", Match.anyValue()
        ));
        
        // Verify public routes to Internet Gateway
        template.hasResourceProperties("AWS::EC2::Route", Map.of(
            "DestinationCidrBlock", "0.0.0.0/0",
            "GatewayId", Match.anyValue()
        ));
        
        // Verify private routes through NAT Gateway
        template.hasResourceProperties("AWS::EC2::Route", Map.of(
            "DestinationCidrBlock", "0.0.0.0/0",
            "NatGatewayId", Match.anyValue()
        ));
    }
    
    /**
     * Test S3 bucket replication configuration for production
     */
    @Test
    public void testS3ReplicationConfiguration() {
        app.getNode().setContext("environment", "prod");
        TapStack stack = new TapStack(app, "ProdReplicationStack");
        Template template = Template.fromStack(stack);
        
        // Verify replication role exists for production  
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "RoleName", Match.stringLikeRegexp(".*s3-replication-role"),
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Action", "sts:AssumeRole",
                        "Principal", Map.of("Service", "s3.amazonaws.com")
                    )
                ))
            ))
        ));
        
        // Verify bucket replication configuration (at least one bucket should have replication)
        template.resourceCountIs("AWS::S3::Bucket", 2);
        
        // Check that we have the replication role
        template.resourceCountIs("AWS::IAM::Role", 3); // EC2, Lambda, and S3 replication roles
    }
    
    /**
     * Test security configurations across all components
     */
    @Test
    public void testSecurityConfiguration() {
        TapStack stack = new TapStack(app, "SecurityTestStack");
        Template template = Template.fromStack(stack);
        
        // Verify S3 buckets have encryption enabled
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
        
        // Verify S3 buckets block public access
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "PublicAccessBlockConfiguration", Map.of(
                "BlockPublicAcls", true,
                "BlockPublicPolicy", true,
                "IgnorePublicAcls", true,
                "RestrictPublicBuckets", true
            )
        ));
        
        // Verify IAM roles follow least privilege
        template.hasResourceProperties("AWS::IAM::Policy", Map.of(
            "PolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.not(Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Action", "*",
                        "Resource", "*"
                    )
                )))
            ))
        ));
    }
    
    /**
     * Test tagging compliance across all resources
     */
    @Test
    public void testTaggingCompliance() {
        String[] environments = {"dev", "staging", "prod"};
        
        for (String env : environments) {
            App environmentApp = new App();
            environmentApp.getNode().setContext("environment", env);
            
            TapStack stack = new TapStack(environmentApp, "TagTestStack-" + env);
            Template template = Template.fromStack(stack);
            
            // Verify VPC has required tags
            template.hasResource("AWS::EC2::VPC", Map.of(
                "Properties", Match.objectLike(Map.of(
                    "Tags", Match.arrayWith(Arrays.asList(
                        Map.of("Key", "Environment", "Value", env),
                        Map.of("Key", "Project", "Value", "infrastructure")
                    ))
                ))
            ));
            
            // Verify S3 buckets have required tags
            template.hasResource("AWS::S3::Bucket", Map.of(
                "Properties", Match.objectLike(Map.of(
                    "Tags", Match.arrayWith(Arrays.asList(
                        Map.of("Key", "Environment", "Value", env),
                        Map.of("Key", "Project", "Value", "infrastructure")
                    ))
                ))
            ));
        }
    }
    
    /**
     * Test output generation and cross-stack exports
     */
    @Test
    public void testStackOutputs() {
        TapStack stack = new TapStack(app, "OutputTestStack");
        Template template = Template.fromStack(stack);
        
        // Verify all required outputs are present
        String[] requiredOutputs = {
            "VpcId", "PublicSubnetIds", "PrivateSubnetIds",
            "LoggingBucketName", "ReplicationBucketName",
            "EC2RoleArn", "LambdaRoleArn"
        };
        
        for (String output : requiredOutputs) {
            template.hasOutput(output, Map.of());
        }
    }
    
    /**
     * Test multi-region deployment readiness
     */
    @Test
    public void testMultiRegionDeployment() {
        Map<String, String> environmentRegions = Map.of(
            "dev", "us-east-1",
            "staging", "us-east-2",
            "prod", "us-west-1"
        );
        
        for (Map.Entry<String, String> entry : environmentRegions.entrySet()) {
            String env = entry.getKey();
            String expectedRegion = entry.getValue();
            
            App regionApp = new App();
            regionApp.getNode().setContext("environment", env);
            
            TapStack stack = new TapStack(regionApp, "RegionStack-" + env,
                StackProps.builder()
                    .env(Environment.builder()
                        .region(expectedRegion)
                        .build())
                    .build());
            
            // Verify stack can be created for each region
            assertThat(stack).isNotNull();
            
            // Synthesize to verify no errors
            regionApp.synth();
        }
    }
    
    /**
     * Test disaster recovery configuration
     */
    @Test
    public void testDisasterRecoveryConfiguration() {
        app.getNode().setContext("environment", "prod");
        TapStack stack = new TapStack(app, "DRTestStack");
        Template template = Template.fromStack(stack);
        
        // Verify S3 buckets have versioning for disaster recovery
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "VersioningConfiguration", Map.of("Status", "Enabled")
        ));
        
        // Verify retention policies are in place
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "LifecycleConfiguration", Match.objectLike(Map.of(
                "Rules", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Status", "Enabled",
                        "ExpirationInDays", 365,
                        "Transitions", Match.anyValue()
                    )
                ))
            ))
        ));
    }
    
    /**
     * Test cost optimization configurations
     */
    @Test
    public void testCostOptimization() {
        TapStack stack = new TapStack(app, "CostOptTestStack");
        Template template = Template.fromStack(stack);
        
        // Verify S3 lifecycle transitions to cheaper storage
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "LifecycleConfiguration", Match.objectLike(Map.of(
                "Rules", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Status", "Enabled",
                        "ExpirationInDays", 365,
                        "Transitions", Match.arrayWith(Arrays.asList(
                            Map.of(
                                "StorageClass", "GLACIER",
                                "TransitionInDays", 30
                            )
                        ))
                    )
                ))
            ))
        ));
    }
    
    /**
     * Test compliance with AWS Well-Architected Framework
     */
    @Test
    public void testWellArchitectedCompliance() {
        TapStack stack = new TapStack(app, "WellArchitectedStack");
        Template template = Template.fromStack(stack);
        
        // Security Pillar: Encryption at rest
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Match.objectLike(Map.of())
        ));
        
        // Reliability Pillar: Multi-AZ deployment
        template.resourceCountIs("AWS::EC2::NatGateway", 2);
        
        // Performance Pillar: Proper network segmentation
        template.hasResourceProperties("AWS::EC2::Subnet", Map.of(
            "MapPublicIpOnLaunch", true
        ));
        
        // Cost Optimization Pillar: Resource tagging
        template.hasResource("AWS::EC2::VPC", Map.of(
            "Properties", Match.objectLike(Map.of(
                "Tags", Match.arrayWith(Arrays.asList(
                    Map.of("Key", "Environment", "Value", Match.anyValue())
                ))
            ))
        ));
    }
    
    /**
     * Helper method to verify complete infrastructure
     */
    private void verifyCompleteInfrastructure(final Template template, final String environment) {
        // Verify VPC components
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::NatGateway", 2);
        template.resourceCountIs("AWS::EC2::EIP", 2);
        
        // Verify subnets (2 public + 2 private)
        template.resourceCountIs("AWS::EC2::Subnet", 4);
        
        // Verify IAM roles
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Action", "sts:AssumeRole",
                        "Principal", Map.of("Service", "ec2.amazonaws.com")
                    )
                ))
            ))
        ));
        
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Action", "sts:AssumeRole",
                        "Principal", Map.of("Service", "lambda.amazonaws.com")
                    )
                ))
            ))
        ));
        
        // Verify S3 buckets
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "VersioningConfiguration", Map.of("Status", "Enabled")
        ));
    }
}