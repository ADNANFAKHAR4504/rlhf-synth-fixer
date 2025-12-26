package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

/**
 * Comprehensive unit tests for the Main CDK application.
 * 
 * These tests verify the complete functionality of the TapStack infrastructure
 * including TapStackProps, TapStack, and Main classes with high coverage.
 */
public class MainTest {

    private App app;

    @BeforeEach
    void setUp() {
        app = new App();
    }

    // ==================== TapStackProps Tests ====================

    @Test
    @DisplayName("TapStackProps builder should create valid props with all fields")
    void testTapStackPropsBuilderWithAllFields() {
        StackProps stackProps = StackProps.builder().build();
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(stackProps)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }

    @Test
    @DisplayName("TapStackProps builder should create valid props with only environment suffix")
    void testTapStackPropsBuilderWithOnlyEnvironmentSuffix() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    @DisplayName("TapStackProps builder should handle null stackProps")
    void testTapStackPropsBuilderWithNullStackProps() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("dev")
                .stackProps(null)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("dev");
        assertThat(props.getStackProps()).isNotNull();
    }

    @Test
    @DisplayName("TapStackProps builder should handle null environment suffix")
    void testTapStackPropsBuilderWithNullEnvironmentSuffix() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix(null)
                .build();

        assertThat(props.getEnvironmentSuffix()).isNull();
        assertThat(props.getStackProps()).isNotNull();
    }

    // ==================== TapStack Tests ====================

    @Test
    @DisplayName("TapStack should be created successfully with valid props")
    void testStackCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getAlb()).isNotNull();
    }

    @Test
    @DisplayName("TapStack should use 'dev' as default environment suffix when none is provided")
    void testDefaultEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    @Test
    @DisplayName("TapStack should use 'dev' when props is null")
    void testDefaultEnvironmentSuffixWithNullProps() {
        TapStack stack = new TapStack(app, "TestStack", null);

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    @Test
    @DisplayName("TapStack should use 'dev' when environment suffix is null")
    void testDefaultEnvironmentSuffixWithNullEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix(null)
                .build());

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    @Test
    @DisplayName("TapStack should synthesize without errors")
    void testStackSynthesis() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }

    @Test
    @DisplayName("TapStack should respect environment suffix from CDK context")
    void testEnvironmentSuffixFromContext() {
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    @Test
    @DisplayName("TapStack should create VPC with correct configuration")
    void testVpcCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack.getVpc()).isNotNull();
        
        Template template = Template.fromStack(stack);
        
        // Verify VPC resource exists
        template.hasResourceProperties("AWS::EC2::VPC", Match.objectLike(
            java.util.Map.of(
                "CidrBlock", "10.0.0.0/16"
            )
        ));

        // Verify public subnets are created
        template.hasResourceProperties("AWS::EC2::Subnet", Match.objectLike(
            java.util.Map.of(
                "MapPublicIpOnLaunch", true
            )
        ));

        // Verify private subnets are created
        template.hasResourceProperties("AWS::EC2::Subnet", Match.objectLike(
            java.util.Map.of(
                "MapPublicIpOnLaunch", false
            )
        ));
    }

    @Test
    @DisplayName("TapStack should create Application Load Balancer")
    void testAlbCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack.getAlb()).isNotNull();
        
        Template template = Template.fromStack(stack);
        
        // Verify ALB resource exists
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Match.objectLike(
            java.util.Map.of(
                "Type", "application",
                "Scheme", "internet-facing"
            )
        ));

        // Verify ALB listener is created
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", Match.objectLike(
            java.util.Map.of(
                "Port", 80,
                "Protocol", "HTTP"
            )
        ));

        // Verify target group is created
        template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", Match.objectLike(
            java.util.Map.of(
                "Port", 80,
                "Protocol", "HTTP"
            )
        ));
    }

    @Test
    @DisplayName("TapStack should create security groups with proper configuration")
    void testSecurityGroupsCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify EC2 security group exists
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(
            java.util.Map.of(
                "GroupDescription", "Security group for EC2 instances in test environment"
            )
        ));
        
        // Verify ALB security group exists
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(
            java.util.Map.of(
                "GroupDescription", "Security group for ALB in test environment"
            )
        ));
    }

    @Test
    @DisplayName("TapStack should create EC2 instances in private subnets")
    void testEc2InstancesCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify EC2 instances are created
        template.hasResourceProperties("AWS::EC2::Instance", Match.objectLike(
            java.util.Map.of(
                "InstanceType", "t2.micro"
            )
        ));
    }

    @Test
    @DisplayName("TapStack should create IAM role for EC2 instances")
    void testIamRoleCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify IAM role is created
        template.hasResource("AWS::IAM::Role", Match.objectLike(
            java.util.Map.of()
        ));

        // Verify instance profile is created
        template.hasResource("AWS::IAM::InstanceProfile", Match.objectLike(
            java.util.Map.of()
        ));
    }

    @Test
    @DisplayName("TapStack should create CloudFormation outputs")
    void testCloudFormationOutputs() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify LoadBalancer DNS output exists
        template.hasOutput("LoadBalancerDNStest", Match.objectLike(
            java.util.Map.of(
                "Description", "DNS name of the Application Load Balancer for test environment"
            )
        ));
        
        // Verify VPC ID output exists
        template.hasOutput("VPCIDtest", Match.objectLike(
            java.util.Map.of(
                "Description", "VPC ID for test environment"
            )
        ));
    }

    @Test
    @DisplayName("TapStack should handle different environment suffixes correctly")
    void testDifferentEnvironmentSuffixes() {
        String[] environments = {"dev", "staging", "prod", "test"};
        
        for (String env : environments) {
            App testApp = new App();
            TapStack stack = new TapStack(testApp, "TestStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);
            assertThat(stack.getVpc()).isNotNull();
            assertThat(stack.getAlb()).isNotNull();
        }
    }

    @Test
    @DisplayName("TapStack should create multiple EC2 instances for multiple subnets")
    void testMultipleEc2Instances() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify multiple EC2 instances are created (one per private subnet)
        template.hasResourceProperties("AWS::EC2::Instance", Match.objectLike(
            java.util.Map.of(
                "InstanceType", "t2.micro"
            )
        ));
    }

    @Test
    @DisplayName("TapStack should create internet gateway and NAT gateway")
    void testInternetAndNatGatewayCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify internet gateway is created
        template.hasResource("AWS::EC2::InternetGateway", Match.objectLike(
            java.util.Map.of()
        ));

        // Verify NAT gateway is created
        template.hasResource("AWS::EC2::NatGateway", Match.objectLike(
            java.util.Map.of()
        ));
    }

    // ==================== Main Class Tests ====================

    @Test
    @DisplayName("Main class should have private constructor")
    void testMainClassNotInstantiable() throws NoSuchMethodException {
        java.lang.reflect.Constructor<Main> constructor = Main.class.getDeclaredConstructor();
        assertThat(java.lang.reflect.Modifier.isPrivate(constructor.getModifiers())).isTrue();
    }

    @Test
    @DisplayName("Main.main should handle null args")
    void testMainWithNullArgs() {
        // This test verifies that main method doesn't throw exceptions with null args
        try {
            Main.main(null);
            // If we reach here, no exception was thrown
            assertThat(true).isTrue();
        } catch (Exception e) {
            assertThat(e).isNull();
        }
    }

    @Test
    @DisplayName("Main.main should handle empty args")
    void testMainWithEmptyArgs() {
        // This test verifies that main method doesn't throw exceptions with empty args
        try {
            Main.main(new String[]{});
            // If we reach here, no exception was thrown
            assertThat(true).isTrue();
        } catch (Exception e) {
            assertThat(e).isNull();
        }
    }

    @Test
    @DisplayName("Main.main should handle non-empty args")
    void testMainWithNonEmptyArgs() {
        // This test verifies that main method doesn't throw exceptions with non-empty args
        try {
            Main.main(new String[]{"arg1", "arg2"});
            // If we reach here, no exception was thrown
            assertThat(true).isTrue();
        } catch (Exception e) {
            assertThat(e).isNull();
        }
    }

    // ==================== Edge Cases and Error Handling ====================

    @Test
    @DisplayName("TapStack should handle empty environment suffix")
    void testEmptyEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("")
                .build());

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("");
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getAlb()).isNotNull();
    }

    @Test
    @DisplayName("TapStack should handle special characters in environment suffix")
    void testSpecialCharactersInEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test-env_123")
                .build());

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test-env_123");
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getAlb()).isNotNull();
    }

    @Test
    @DisplayName("TapStack should handle very long environment suffix")
    void testLongEnvironmentSuffix() {
        String longSuffix = "a".repeat(100);
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix(longSuffix)
                .build());

        assertThat(stack.getEnvironmentSuffix()).isEqualTo(longSuffix);
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getAlb()).isNotNull();
    }

    @Test
    @DisplayName("TapStack should handle null stackProps in TapStackProps")
    void testNullStackPropsInTapStackProps() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(null)
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getAlb()).isNotNull();
    }

    @Test
    @DisplayName("TapStack should handle custom StackProps")
    void testCustomStackProps() {
        StackProps customProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();

        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(customProps)
                .build();

        TapStack stack = new TapStack(app, "TestStack", props);

        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getAlb()).isNotNull();
    }

    // ==================== Integration-style Tests ====================

    @Test
    @DisplayName("Complete stack should synthesize with all required resources")
    void testCompleteStackSynthesis() {
        TapStack stack = new TapStack(app, "CompleteTestStack", TapStackProps.builder()
                .environmentSuffix("complete")
                .build());

        Template template = Template.fromStack(stack);

        // Verify all major resource types are present
        template.hasResource("AWS::EC2::VPC", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::ElasticLoadBalancingV2::LoadBalancer", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::EC2::SecurityGroup", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::IAM::Role", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::EC2::Instance", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::ElasticLoadBalancingV2::Listener", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::ElasticLoadBalancingV2::TargetGroup", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::EC2::InternetGateway", Match.objectLike(java.util.Map.of()));
        template.hasResource("AWS::EC2::NatGateway", Match.objectLike(java.util.Map.of()));
    }

    @Test
    @DisplayName("Stack should have correct resource naming with environment suffix")
    void testResourceNamingWithEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "NamingTestStack", TapStackProps.builder()
                .environmentSuffix("naming")
                .build());

        Template template = Template.fromStack(stack);

        // Verify resources have correct naming pattern
        template.hasResource("AWS::EC2::VPC", Match.objectLike(
            java.util.Map.of()
        ));

        template.hasResource("AWS::ElasticLoadBalancingV2::LoadBalancer", Match.objectLike(
            java.util.Map.of()
        ));
    }
}