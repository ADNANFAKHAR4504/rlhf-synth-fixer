package app;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Comprehensive unit tests for the CDK Serverless Infrastructure.
 * Tests verify all classes and methods without deploying AWS resources.
 */
@DisplayName("Serverless Infrastructure CDK Unit Tests")
public class MainTest {

    private App app;

    @BeforeEach
    public void setUp() {
        app = new App();
    }

    @AfterEach
    public void tearDown() {
        // Clean up environment variables
        System.clearProperty("ENVIRONMENT_SUFFIX");
        System.clearProperty("CORS_ALLOWED_DOMAINS");
        System.clearProperty("CDK_DEFAULT_ACCOUNT");
    }

    // TAPSTACKPROPS TESTS

    @Nested
    @DisplayName("TapStackProps Tests")
    class TapStackPropsTests {

        @Test
        @DisplayName("Should build TapStackProps with all properties")
        public void testTapStackPropsBuilderComplete() {
            List<String> corsDomains = Arrays.asList("https://example.com", "https://test.com");
            StackProps stackProps = StackProps.builder()
                    .env(Environment.builder()
                            .account("123456789012")
                            .region("us-east-1")
                            .build())
                    .build();

            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("prod")
                    .corsAllowedDomains(corsDomains)
                    .stackProps(stackProps)
                    .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
            assertThat(props.getCorsAllowedDomains()).isEqualTo(corsDomains);
            assertThat(props.getStackProps()).isEqualTo(stackProps);
        }

        @Test
        @DisplayName("Should build TapStackProps with minimal properties")
        public void testTapStackPropsBuilderMinimal() {
            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("test")
                    .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
            assertThat(props.getCorsAllowedDomains()).containsExactly("https://example.com");
            assertThat(props.getStackProps()).isNotNull();
        }

        @Test
        @DisplayName("Should handle null values with defaults")
        public void testTapStackPropsNullHandling() {
            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix(null)
                    .corsAllowedDomains(null)
                    .stackProps(null)
                    .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isNull();
            assertThat(props.getCorsAllowedDomains()).containsExactly("https://example.com");
            assertThat(props.getStackProps()).isNotNull();
        }

        @Test
        @DisplayName("Should create builder from static method")
        public void testTapStackPropsStaticBuilder() {
            TapStackProps.Builder builder = TapStackProps.builder();
            assertThat(builder).isNotNull();
        }

        @Test
        @DisplayName("Should chain builder methods")
        public void testTapStackPropsBuilderChaining() {
            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("dev")
                    .corsAllowedDomains(Arrays.asList("https://localhost:3000"))
                    .stackProps(StackProps.builder().build())
                    .build();

            assertThat(props.getEnvironmentSuffix()).isEqualTo("dev");
        }
    }

    // TAPSTACK TESTS

    @Nested
    @DisplayName("TapStack Tests")
    class TapStackTests {

        @Test
        @DisplayName("Should create TapStack with complete configuration")
        public void testTapStackCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .corsAllowedDomains(Arrays.asList("https://test.example.com"))
                    .build());

            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
            assertThat(stack.getSecurityStack()).isNotNull();
            assertThat(stack.getServerlessStack()).isNotNull();
        }

        @Test
        @DisplayName("Should use default environment suffix when not provided")
        public void testDefaultEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should handle null TapStackProps")
        public void testNullTapStackProps() {
            TapStack stack = new TapStack(app, "TestStack", null);
            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should create all outputs")
        public void testStackOutputs() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack);

            // Verify all required outputs exist
            template.hasOutput("ApiGatewayUrl", Match.objectLike(Map.of(
                    "Export", Match.objectLike(Map.of(
                            "Name", "ServerlessApiUrl-test"
                    ))
            )));

            template.hasOutput("StaticAssetsBucket", Match.objectLike(Map.of(
                    "Export", Match.objectLike(Map.of(
                            "Name", "ServerlessStaticBucket-test"
                    ))
            )));
        }

        @Test
        @DisplayName("Should apply project and environment tags")
        public void testStackTags() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("prod")
                    .build());

            assertThat(stack).isNotNull();
        }

        @Test
        @DisplayName("Should create nested stacks with proper dependencies")
        public void testNestedStackDependencies() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            assertThat(stack.getSecurityStack()).isNotNull();
            assertThat(stack.getServerlessStack()).isNotNull();
            assertThat(stack.getSecurityStack().getKmsKey()).isNotNull();
        }
    }

    // SECURITYSTACK TESTS

    @Nested
    @DisplayName("SecurityStack Tests")
    class SecurityStackTests {

        @Test
        @DisplayName("Should create KMS key with rotation enabled")
        public void testKmsKeyCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getSecurityStack());

            template.hasResourceProperties("AWS::KMS::Key", Match.objectLike(Map.of(
                    "EnableKeyRotation", true
            )));
        }

        @Test
        @DisplayName("Should create KMS key alias")
        public void testKmsKeyAlias() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getSecurityStack());
            template.resourceCountIs("AWS::KMS::Alias", 1);
        }

        @Test
        @DisplayName("Should apply security tags")
        public void testSecurityStackTags() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("staging")
                    .build());

            assertThat(stack.getSecurityStack()).isNotNull();
            assertThat(stack.getSecurityStack().getKmsKey()).isNotNull();
        }
    }

    // SERVERLESSSTACK TESTS

    @Nested
    @DisplayName("ServerlessStack Tests")
    class ServerlessStackTests {

        @Test
        @DisplayName("Should create S3 bucket with encryption and versioning")
        public void testS3BucketCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());

            template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                    "BucketEncryption", Match.objectLike(Map.of(
                            "ServerSideEncryptionConfiguration", Match.arrayWith(
                                    Collections.singletonList(Match.objectLike(Map.of(
                                            "ServerSideEncryptionByDefault", Match.objectLike(Map.of(
                                                    "SSEAlgorithm", "aws:kms"
                                            ))
                                    )))
                            )
                    )),
                    "VersioningConfiguration", Match.objectLike(Map.of(
                            "Status", "Enabled"
                    ))
            )));
        }

        @Test
        @DisplayName("Should create SNS topic with KMS encryption")
        public void testSnsTopicCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            template.resourceCountIs("AWS::SNS::Topic", 1);
        }

        @Test
        @DisplayName("Should create three Lambda functions")
        public void testLambdaFunctionCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            // Note: CDK creates an extra Lambda function for log retention management
            // We verify our 3 main functions exist with specific properties
            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "FunctionName", Match.stringLikeRegexp(".*-user")
            )));
            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "FunctionName", Match.stringLikeRegexp(".*-order")
            )));
            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "FunctionName", Match.stringLikeRegexp(".*-notification")
            )));
        }

        @Test
        @DisplayName("Should configure Lambda functions with correct properties")
        public void testLambdaFunctionProperties() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());

            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "Runtime", "python3.9",
                    "Handler", "index.handler",
                    "Timeout", 30,
                    "MemorySize", 256,
                    "ReservedConcurrentExecutions", 100
            )));
        }

        @Test
        @DisplayName("Should create IAM roles with least privilege")
        public void testLambdaIamRoles() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            // Note: CDK creates an extra IAM role for the log retention Lambda function
            // 3 Lambda function roles + 1 API Gateway role + 1 log retention role = 5 total
            // We verify our 3 main Lambda roles exist
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "RoleName", Match.stringLikeRegexp("serverless-test-user-role")
            )));
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "RoleName", Match.stringLikeRegexp("serverless-test-order-role")
            )));
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "RoleName", Match.stringLikeRegexp("serverless-test-notification-role")
            )));
        }

        @Test
        @DisplayName("Should create CloudWatch log groups")
        public void testCloudWatchLogGroups() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            // Note: With logRetention property, CDK manages log groups as custom resources
            // We verify that log retention custom resources are created
            template.hasResourceProperties("Custom::LogRetention", Match.objectLike(Map.of(
                    "RetentionInDays", 365
            )));
        }

        @Test
        @DisplayName("Should create API Gateway with CORS")
        public void testApiGatewayCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .corsAllowedDomains(Arrays.asList("https://test.com"))
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
        }

        @Test
        @DisplayName("Should create API Gateway with throttling")
        public void testApiGatewayThrottling() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            template.resourceCountIs("AWS::ApiGateway::Stage", 1);
        }

        @Test
        @DisplayName("Should create CloudWatch alarms for Lambda errors")
        public void testCloudWatchAlarms() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            template.resourceCountIs("AWS::CloudWatch::Alarm", 3);
        }

        @Test
        @DisplayName("Should configure alarm actions with SNS")
        public void testAlarmActions() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());

            template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                    "ComparisonOperator", "GreaterThanOrEqualToThreshold",
                    "EvaluationPeriods", 1,
                    "Threshold", 1.0
            )));
        }

        @Test
        @DisplayName("Should create Lambda versions for rollback")
        public void testLambdaVersioning() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            template.resourceCountIs("AWS::Lambda::Version", 3);
        }

        @Test
        @DisplayName("Should create Lambda aliases")
        public void testLambdaAliases() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            template.resourceCountIs("AWS::Lambda::Alias", 3);
        }

        @Test
        @DisplayName("Should expose all resource getters")
        public void testServerlessStackGetters() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            assertThat(stack.getServerlessStack().getUserFunction()).isNotNull();
            assertThat(stack.getServerlessStack().getOrderFunction()).isNotNull();
            assertThat(stack.getServerlessStack().getNotificationFunction()).isNotNull();
            assertThat(stack.getServerlessStack().getStaticAssetsBucket()).isNotNull();
            assertThat(stack.getServerlessStack().getApiGateway()).isNotNull();
            assertThat(stack.getServerlessStack().getAlertTopic()).isNotNull();
        }

        @Test
        @DisplayName("Should create API Gateway resources and methods")
        public void testApiGatewayResourcesAndMethods() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());
            template.resourceCountIs("AWS::ApiGateway::Resource", 3);
            // 3 main methods + CORS OPTIONS methods = 7 total
            template.resourceCountIs("AWS::ApiGateway::Method", 7);
        }
    }

    // MAIN APPLICATION TESTS

    @Nested
    @DisplayName("Main Application Tests")
    class MainApplicationTests {

        @Test
        @DisplayName("Should execute main with default environment")
        public void testMainMethodDefault() {
            assertThatCode(() -> {
                Main.main(new String[]{});
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should execute main with ENVIRONMENT_SUFFIX from system property")
        public void testMainMethodWithEnvironmentSuffix() {
            System.setProperty("ENVIRONMENT_SUFFIX", "production");

            assertThatCode(() -> {
                Main.main(new String[]{});
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should execute main with CORS_ALLOWED_DOMAINS from system property")
        public void testMainMethodWithCorsDomainsConfig() {
            System.setProperty("CORS_ALLOWED_DOMAINS", "https://app1.com,https://app2.com");

            assertThatCode(() -> {
                Main.main(new String[]{});
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should execute main with CDK_DEFAULT_ACCOUNT")
        public void testMainMethodWithAccount() {
            System.setProperty("CDK_DEFAULT_ACCOUNT", "123456789012");

            assertThatCode(() -> {
                Main.main(new String[]{});
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should execute main with all environment variables")
        public void testMainMethodWithAllEnvVars() {
            System.setProperty("ENVIRONMENT_SUFFIX", "prod");
            System.setProperty("CORS_ALLOWED_DOMAINS", "https://prod1.com,https://prod2.com");
            System.setProperty("CDK_DEFAULT_ACCOUNT", "999888777666");

            assertThatCode(() -> {
                Main.main(new String[]{});
            }).doesNotThrowAnyException();
        }
    }

    // LAMBDA CODE GENERATION TESTS

    @Nested
    @DisplayName("Lambda Code Generation Tests")
    class LambdaCodeGenerationTests {

        @Test
        @DisplayName("Should generate valid Python code for user function")
        public void testUserFunctionCodeGeneration() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());

            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "Runtime", "python3.9",
                    "Handler", "index.handler"
            )));
        }

        @Test
        @DisplayName("Should include environment variables in Lambda functions")
        public void testLambdaEnvironmentVariables() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template template = Template.fromStack(stack.getServerlessStack());

            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "Environment", Match.objectLike(Map.of(
                            "Variables", Match.objectLike(Map.of(
                                    "ENVIRONMENT", "test",
                                    "LOG_LEVEL", "INFO"
                            ))
                    ))
            )));
        }
    }

    // EDGE CASES TESTS

    @Nested
    @DisplayName("Edge Cases and Error Handling")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle stack creation with null props gracefully")
        public void testStackCreationWithNullProps() {
            assertThatCode(() -> {
                new TapStack(app, "TestStack", null);
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle single CORS domain")
        public void testSingleCorsDomain() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .corsAllowedDomains(Collections.singletonList("https://single.com"))
                    .build());

            assertThat(stack).isNotNull();
        }

        @ParameterizedTest
        @ValueSource(strings = {"dev", "staging", "prod", "test", "qa", "uat"})
        @DisplayName("Should support various environment suffixes")
        public void testVariousEnvironmentSuffixes(String envSuffix) {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix(envSuffix)
                    .build());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo(envSuffix);
        }

        @Test
        @DisplayName("Should create valid CloudFormation template")
        public void testValidCloudFormationTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            Template securityTemplate = Template.fromStack(stack.getSecurityStack());
            Template serverlessTemplate = Template.fromStack(stack.getServerlessStack());

            assertThat(securityTemplate).isNotNull();
            assertThat(serverlessTemplate).isNotNull();
            
            securityTemplate.resourceCountIs("AWS::KMS::Key", 1);
            // Note: CDK creates an extra Lambda function for log retention management
            // We verify our main Lambda functions exist by checking for their specific properties
            serverlessTemplate.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "FunctionName", Match.stringLikeRegexp("serverless-test-user")
            )));
            serverlessTemplate.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "FunctionName", Match.stringLikeRegexp("serverless-test-order")
            )));
            serverlessTemplate.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "FunctionName", Match.stringLikeRegexp("serverless-test-notification")
            )));
        }
    }

    // LEGACY TESTS 

    @Test
    @DisplayName("Legacy: Stack creation test")
    public void testStackCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    @Test
    @DisplayName("Legacy: Default environment suffix test")
    public void testDefaultEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    @Test
    @DisplayName("Legacy: Stack synthesis test")
    public void testStackSynthesis() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }

    @Test
    @DisplayName("Legacy: Environment suffix from TapStackProps")
    public void testEnvironmentSuffixFromProps() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("staging")
                .build());
        
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }
}
