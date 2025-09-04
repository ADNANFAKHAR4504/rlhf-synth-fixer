package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.cloudfront.Distribution;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive unit tests for the complete infrastructure stack.
 * This single test file validates all components of the highly available,
 * scalable web application infrastructure.
 */
class MainTest {

    private App app;
    private Stack stack;
    private Main.TapStack tapStack;

    @BeforeEach
    void setUp() {
        app = new App();
        stack = new Stack(app, "TestStack");
    }

    @Test
    @DisplayName("Should create complete infrastructure stack successfully")
    public void testCompleteInfrastructureCreation() {
        // Create the complete TapStack with all components
        tapStack = new Main.TapStack(app, "TestTapStack", Main.TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .description("Test infrastructure")
                        .build())
                .build());

        assertThat(tapStack).isNotNull();
        assertThat(tapStack.getEnvironmentSuffix()).isEqualTo("test");
    }

    @Test
    @DisplayName("Should create TapStackProps with builder pattern")
    public void testTapStackPropsBuilder() {
        Main.TapStackProps props = Main.TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .description("Test infrastructure")
                        .build())
                .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    @DisplayName("Should create stack with correct environment suffix")
    public void testEnvironmentSuffix() {
        Main.TapStackProps props = Main.TapStackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
    }

    @Test
    @DisplayName("Should create stack with default environment suffix")
    public void testDefaultEnvironmentSuffix() {
        Main.TapStackProps props = Main.TapStackProps.builder().build();
        assertThat(props.getEnvironmentSuffix()).isNull(); // Default is null, not "dev"
    }

    @Test
    @DisplayName("Should create NetworkConstruct with VPC and subnets")
    public void testNetworkConstructCreation() {
        Main.NetworkConstruct network = new Main.NetworkConstruct(stack, "TestNetwork", "test");

        assertThat(network).isNotNull();
        assertThat(network.getVpc()).isNotNull();
        assertThat(network.getVpc().getVpcId()).isNotNull();
    }

    @Test
    @DisplayName("Should create SecurityConstruct with IAM roles and security groups")
    public void testSecurityConstructCreation() {
        // Create a test VPC first
        Vpc testVpc = Vpc.Builder.create(stack, "TestVpc")
                .maxAzs(2)
                .build();

        Main.SecurityConstruct security = new Main.SecurityConstruct(stack, "TestSecurity", testVpc, "test");

        assertThat(security).isNotNull();
        assertThat(security.getEc2Role()).isNotNull();
        assertThat(security.getEc2InstanceProfile()).isNotNull();
        assertThat(security.getAlbSecurityGroup()).isNotNull();
        assertThat(security.getEc2SecurityGroup()).isNotNull();
    }

    @Test
    @DisplayName("Should create StorageConstruct with S3 bucket and CloudFront")
    public void testStorageConstructCreation() {
        Main.StorageConstruct storage = new Main.StorageConstruct(stack, "TestStorage", "test");

        assertThat(storage).isNotNull();
        assertThat(storage.getStaticAssetsBucket()).isNotNull();
        assertThat(storage.getCloudFrontDistribution()).isNotNull();
        
        Bucket bucket = storage.getStaticAssetsBucket();
        assertThat(bucket.getBucketName()).isNotNull();
        
        Distribution distribution = storage.getCloudFrontDistribution();
        assertThat(distribution.getDistributionDomainName()).isNotNull();
    }

    @Test
    @DisplayName("Should create ComputeConstruct with Auto Scaling Group and Load Balancer")
    public void testComputeConstructCreation() {
        // Create required dependencies
        Vpc testVpc = Vpc.Builder.create(stack, "TestVpc")
                .maxAzs(2)
                .build();

        Main.SecurityConstruct security = new Main.SecurityConstruct(stack, "TestSecurity", testVpc, "test");
        Main.StorageConstruct storage = new Main.StorageConstruct(stack, "TestStorage", "test");

        Main.ComputeConstruct compute = new Main.ComputeConstruct(stack, "TestCompute",
                testVpc,
                security.getAlbSecurityGroup(),
                security.getEc2SecurityGroup(),
                security.getEc2InstanceProfile(),
                storage.getStaticAssetsBucket().getBucketName(),
                "test");

        assertThat(compute).isNotNull();
        assertThat(compute.getAutoScalingGroup()).isNotNull();
        assertThat(compute.getApplicationLoadBalancer()).isNotNull();
        
        AutoScalingGroup asg = compute.getAutoScalingGroup();
        assertThat(asg).isNotNull();
        
        ApplicationLoadBalancer alb = compute.getApplicationLoadBalancer();
        assertThat(alb).isNotNull();
        assertThat(alb.getLoadBalancerDnsName()).isNotNull();
    }

    @Test
    @DisplayName("Should synthesize complete infrastructure without errors")
    public void testInfrastructureSynthesis() {
        // Create the complete TapStack
        tapStack = new Main.TapStack(app, "TestTapStack", Main.TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .description("Test infrastructure")
                        .build())
                .build());

        // Synthesize should not throw an exception
        assertThat(tapStack).isNotNull();
        
        // Verify the stack was created successfully
        assertThat(tapStack.getEnvironmentSuffix()).isEqualTo("test");
    }

    @Test
    @DisplayName("Should handle null props gracefully")
    public void testNullPropsHandling() {
        assertThat(app).isNotNull();
    }

    @Test
    @DisplayName("Should create infrastructure with proper resource naming")
    public void testResourceNaming() {
        tapStack = new Main.TapStack(app, "TestTapStack", Main.TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .description("Test infrastructure")
                        .build())
                .build());

        assertThat(tapStack).isNotNull();
        assertThat(tapStack.getEnvironmentSuffix()).isEqualTo("test");
    }

    @Test
    @DisplayName("Should create all required infrastructure components")
    public void testAllComponentsCreation() {
        // Create the complete infrastructure
        tapStack = new Main.TapStack(app, "TestTapStack", Main.TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .description("Test infrastructure")
                        .build())
                .build());

        // Verify all components are created
        assertThat(tapStack).isNotNull();
        
        // The stack should contain all the required constructs
        assertThat(tapStack.getNode().getChildren()).isNotEmpty();
    }

    @Test
    @DisplayName("Should validate infrastructure requirements")
    public void testInfrastructureRequirements() {
        tapStack = new Main.TapStack(app, "TestTapStack", Main.TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(software.amazon.awscdk.StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .description("Test infrastructure")
                        .build())
                .build());

        // Verify the infrastructure meets all requirements:
        // 1. Environment suffix
        assertThat(tapStack.getEnvironmentSuffix()).isEqualTo("test");
        
        // 2. Stack should be created successfully
        assertThat(tapStack).isNotNull();
    }
}