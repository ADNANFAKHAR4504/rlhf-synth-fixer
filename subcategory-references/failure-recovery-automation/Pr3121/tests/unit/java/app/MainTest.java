package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
// import java.util.List;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    private App app;
    private String testAccountId = "123456789012";

    @BeforeEach
    void setUp() {
        app = new App();
    }

    /**
     * Test that the primary TapStack can be instantiated successfully.
     */
    @Test
    void testPrimaryStackCreation() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .stackName("TapStack-Primary")
                .description("Primary Disaster Recovery Stack in us-east-1")
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .isPrimary(true)
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestPrimaryStack", props);

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the secondary TapStack can be instantiated successfully.
     */
    @Test
    void testSecondaryStackCreation() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-west-2")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .stackName("TapStack-Secondary")
                .description("Secondary Disaster Recovery Stack in us-west-2")
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .isPrimary(false)
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestSecondaryStack", props);

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    void testDefaultEnvironmentSuffix() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the primary stack creates a VPC with correct configuration.
     */
    @Test
    void testPrimaryStackCreatesVpc() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::EC2::VPC", 1);
    }

    /**
     * Test that the primary stack creates an Application Load Balancer.
     */
    @Test
    void testPrimaryStackCreatesAlb() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
                "Name", "primary-alb"
        ));
    }

    /**
     * Test that the secondary stack creates correct ALB name.
     */
    @Test
    void testSecondaryStackCreatesAlbWithCorrectName() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-west-2")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(false)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
                "Name", "secondary-alb"
        ));
    }

    /**
     * Test that the primary stack creates an S3 bucket with correct name.
     */
    @Test
    void testPrimaryStackCreatesS3Bucket() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::S3::Bucket", 1);
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketName", "tap-primary-data-" + testAccountId,
                "VersioningConfiguration", Map.of("Status", "Enabled")
        ));
    }

    /**
     * Test that the secondary stack creates an S3 bucket with correct name.
     */
    @Test
    void testSecondaryStackCreatesS3Bucket() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-west-2")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(false)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketName", "tap-secondary-data-" + testAccountId
        ));
    }

    /**
     * Test that the primary stack creates a Route53 Health Check.
     */
    @Test
    void testPrimaryStackCreatesHealthCheck() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::Route53::HealthCheck", 1);
        template.hasResourceProperties("AWS::Route53::HealthCheck", Map.of(
                "HealthCheckConfig", Match.objectLike(Map.of(
                        "Type", "HTTPS",
                        "ResourcePath", "/health",
                        "Port", 80
                ))
        ));
    }

    /**
     * Test that the primary stack creates a Route53 Hosted Zone.
     */
    @Test
    void testPrimaryStackCreatesHostedZone() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::Route53::HostedZone", 1);
        template.hasResourceProperties("AWS::Route53::HostedZone", Map.of(
                "Name", "joshteamgifted.com."
        ));
    }

    /**
     * Test that the primary stack creates Route53 failover records.
     */
    @Test
    void testPrimaryStackCreatesFailoverRecords() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::Route53::RecordSet", 2);
        template.hasResourceProperties("AWS::Route53::RecordSet", Match.objectLike(Map.of(
                "Name", "app.joshteamgifted.com",
                "Type", "A",
                "Failover", "PRIMARY"
        )));
    }

    /**
     * Test that the secondary stack creates secondary failover records.
     */
    @Test
    void testSecondaryStackCreatesSecondaryFailoverRecords() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-west-2")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(false)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::Route53::RecordSet", Match.objectLike(Map.of(
                "Name", "app.joshteamgifted.com",
                "Type", "A",
                "Failover", "SECONDARY"
        )));
    }

    /**
     * Test that the stack creates a Target Group with correct health check configuration.
     */
    @Test
    void testStackCreatesTargetGroupWithHealthCheck() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::ElasticLoadBalancingV2::TargetGroup", 1);
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Map.of(
                "Port", 80,
                "Protocol", "HTTP",
                "TargetType", "ip",
                "HealthCheckEnabled", true,
                "HealthCheckPath", "/health"
        ));
    }

    /**
     * Test that stack outputs are created correctly for primary stack.
     */
    @Test
    void testPrimaryStackCreatesOutputs() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.hasOutput("VpcId", Match.objectLike(Map.of(
                "Export", Map.of("Name", "PrimaryVpcId")
        )));
        template.hasOutput("BucketName", Match.objectLike(Map.of(
                "Export", Map.of("Name", "PrimaryBucketName")
        )));
    }

    /**
     * Test that stack outputs are created correctly for secondary stack.
     */
    @Test
    void testSecondaryStackCreatesOutputs() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-west-2")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(false)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.hasOutput("VpcId", Match.objectLike(Map.of(
                "Export", Map.of("Name", "SecondaryVpcId")
        )));
        template.hasOutput("BucketName", Match.objectLike(Map.of(
                "Export", Map.of("Name", "SecondaryBucketName")
        )));
    }

    /**
     * Test TapStackProps builder pattern with all properties.
     */
    @Test
    void testTapStackPropsBuilder() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .stackName("TestStack")
                .description("Test Description")
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("test.com")
                .isPrimary(true)
                .environmentSuffix("staging")
                .build();

        assertThat(props.getEnv()).isEqualTo(env);
        assertThat(props.getStackName()).isEqualTo("TestStack");
        assertThat(props.getDescription()).isEqualTo("Test Description");
        assertThat(props.getPrimaryRegion()).isEqualTo("us-east-1");
        assertThat(props.getSecondaryRegion()).isEqualTo("us-west-2");
        assertThat(props.getDomainName()).isEqualTo("test.com");
        assertThat(props.isPrimary()).isTrue();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test that stack getters return correct values.
     */
    @Test
    void testStackGetters() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);

        assertThat(stack.getLoadBalancer()).isNotNull();
        assertThat(stack.getHealthCheck()).isNotNull();
        assertThat(stack.getDataBucket()).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that VPC is created with zero NAT gateways.
     */
    @Test
    void testVpcWithZeroNatGateways() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::EC2::NatGateway", 0);
    }

    /**
     * Test that both public and private subnets are created.
     */
    @Test
    void testSubnetsCreation() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        template.resourceCountIs("AWS::EC2::Subnet", 4);
    }

    /**
     * Test Main class instantiation is prevented (utility class pattern).
     */
    @Test
    void testMainConstructorIsPrivate() throws Exception {
        java.lang.reflect.Constructor<Main> constructor = Main.class.getDeclaredConstructor();
        assertThat(java.lang.reflect.Modifier.isPrivate(constructor.getModifiers())).isTrue();
    }

    /**
     * Test that the stack synthesis works without errors.
     */
    @Test
    void testStackSynthesisWithoutErrors() {
        Environment env = Environment.builder()
                .account(testAccountId)
                .region("us-east-1")
                .build();

        TapStackProps props = TapStackProps.builder()
                .environment(env)
                .isPrimary(true)
                .primaryRegion("us-east-1")
                .secondaryRegion("us-west-2")
                .domainName("joshteamgifted.com")
                .environmentSuffix("test")
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);
        Template template = Template.fromStack(stack);

        assertThat(template).isNotNull();
    }
}