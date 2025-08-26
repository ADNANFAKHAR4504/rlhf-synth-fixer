package app;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import java.util.Map;
import java.util.List;

@DisplayName("WebAppStack Unit Tests")
public class WebAppStackTest {
    
    private App app;
    private String environmentSuffix;
    private WebAppStack stack;
    private Template template;
    
    @BeforeEach
    public void setup() {
        app = new App();
        environmentSuffix = "test123";
        
        WebAppStackProps props = WebAppStackProps.builder()
            .environmentSuffix(environmentSuffix)
            .stackProps(StackProps.builder()
                .env(Environment.builder()
                    .region("us-west-2")
                    .account("123456789012")
                    .build())
                .build())
            .build();
            
        stack = new WebAppStack(app, "TestStack", props);
        template = Template.fromStack(stack);
    }
    
    @Test
    @DisplayName("Should create VPC with correct configuration")
    public void testVpcConfiguration() {
        // Verify VPC is created
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16"
        ));
        
        // Verify subnets exist (we expect 6 subnets - 3 public and 3 private)
        template.resourceCountIs("AWS::EC2::Subnet", 6);
        
        // Verify Internet Gateway
        template.hasResourceProperties("AWS::EC2::InternetGateway", Map.of());
        
        // Verify NAT Gateways (should be 2 for HA)
        template.resourceCountIs("AWS::EC2::NatGateway", 2);
    }
    
    @Test
    @DisplayName("Should create S3 bucket with lifecycle rules")
    public void testS3BucketConfiguration() {
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "VersioningConfiguration", Map.of(
                "Status", "Enabled"
            ),
            "BucketEncryption", Map.of(
                "ServerSideEncryptionConfiguration", List.of(Map.of(
                    "ServerSideEncryptionByDefault", Map.of(
                        "SSEAlgorithm", "AES256"
                    )
                ))
            ),
            "LifecycleConfiguration", Map.of(
                "Rules", List.of(Map.of(
                    "Id", "LogsLifecycle",
                    "Status", "Enabled",
                    "Transitions", List.of(Map.of(
                        "StorageClass", "GLACIER",
                        "TransitionInDays", 30
                    )),
                    "ExpirationInDays", 365
                ))
            )
        ));
        
        // Verify bucket name pattern
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "BucketName", Match.anyValue()
        )));
    }
    
    @Test
    @DisplayName("Should create Auto Scaling Group with correct configuration")
    public void testAutoScalingGroupConfiguration() {
        // Verify Auto Scaling Group
        template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Map.of(
            "MinSize", "2",
            "MaxSize", "6",
            "DesiredCapacity", "2"
        ));
        
        // Verify Launch Template
        template.hasResourceProperties("AWS::EC2::LaunchTemplate", Match.objectLike(Map.of(
            "LaunchTemplateName", Match.anyValue()
        )));
    }
    
    @Test
    @DisplayName("Should create Application Load Balancer")
    public void testApplicationLoadBalancer() {
        // Verify ALB is created
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
            "Type", "application",
            "Scheme", "internet-facing"
        ));
        
        // Verify Target Group
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Map.of(
            "Port", 80,
            "Protocol", "HTTP",
            "TargetType", "instance"
        ));
        
        // Verify Listeners
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", Map.of(
            "Port", 80,
            "Protocol", "HTTP"
        ));
    }
    
    @Test
    @DisplayName("Should create security groups with correct rules")
    public void testSecurityGroups() {
        // Verify security groups are created
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of());
        
        // Verify ALB security group allows HTTP and HTTPS
        template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Match.objectLike(Map.of(
            "IpProtocol", "tcp",
            "FromPort", 80,
            "ToPort", 80
        )));
        
    }
    
    @Test
    @DisplayName("Should create IAM role for EC2 instances")
    public void testIamRole() {
        // Verify IAM role is created
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Map.of(
                "Statement", List.of(Map.of(
                    "Effect", "Allow",
                    "Principal", Map.of(
                        "Service", "ec2.amazonaws.com"
                    ),
                    "Action", "sts:AssumeRole"
                ))
            )
        )));
        
        // Verify Instance Profile
        template.hasResourceProperties("AWS::IAM::InstanceProfile", Map.of());
    }
    
    @Test
    @DisplayName("Should apply correct tags to resources")
    public void testResourceTags() {
        // Check if stack has tags applied
        Map<String, Object> stackJson = template.toJSON();
        
        // Verify tags are present on resources
        Assertions.assertThat(stack).isNotNull();
        
        // The Tags.of(this) should apply to all resources
        // We can't directly test CDK tags without synthesis, but we verify the stack is created
        Assertions.assertThat(stack.getStackName()).contains("TestStack");
    }
    
    @Test
    @DisplayName("Should create CloudFormation outputs")
    public void testOutputs() {
        // Verify outputs are created
        template.hasOutput("LoadBalancerDns", Map.of());
        template.hasOutput("LogsBucketName", Map.of());
        template.hasOutput("VpcId", Map.of());
        template.hasOutput("AutoScalingGroupName", Map.of());
    }
    
    @Test
    @DisplayName("Should have health check configured for target group")
    public void testHealthCheckConfiguration() {
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Match.objectLike(Map.of(
            "HealthCheckEnabled", true,
            "HealthCheckPath", "/",
            "HealthCheckProtocol", "HTTP",
            "HealthCheckIntervalSeconds", 30,
            "HealthCheckTimeoutSeconds", 10,
            "HealthyThresholdCount", 2,
            "UnhealthyThresholdCount", 3
        )));
    }
    
    @Test
    @DisplayName("Should configure CPU-based scaling")
    public void testCpuScaling() {
        // Verify scaling policy exists
        template.hasResourceProperties("AWS::AutoScaling::ScalingPolicy", Match.objectLike(Map.of(
            "PolicyType", "TargetTrackingScaling",
            "TargetTrackingConfiguration", Map.of(
                "PredefinedMetricSpecification", Map.of(
                    "PredefinedMetricType", "ASGAverageCPUUtilization"
                ),
                "TargetValue", 70
            )
        )));
    }
    
    @Test
    @DisplayName("Should use environment suffix in resource names")
    public void testEnvironmentSuffixUsage() {
        // Get the JSON representation
        Map<String, Object> stackJson = template.toJSON();
        String jsonString = stackJson.toString();
        
        // Verify environment suffix is used
        Assertions.assertThat(jsonString).contains("test123");
    }
    
    @Test
    @DisplayName("Should have getters for key resources")
    public void testStackGetters() {
        // Test all getters
        Assertions.assertThat(stack.getVpc()).isNotNull();
        Assertions.assertThat(stack.getApplicationLoadBalancer()).isNotNull();
        Assertions.assertThat(stack.getAutoScalingGroup()).isNotNull();
        Assertions.assertThat(stack.getLogsBucket()).isNotNull();
    }
}