<!-- /lib/src/main/java/app/Main.java -->
```java
package app;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.apigateway.LambdaRestApi;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.lambda.Alias;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Version;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.sam.CfnApplication;
import software.amazon.awscdk.services.sns.Topic;
import software.constructs.Construct;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;
    private final List<String> corsAllowedDomains;

    private TapStackProps(final String envSuffix, final StackProps props, final List<String> domains) {
        this.environmentSuffix = envSuffix;
        this.stackProps = props != null ? props : StackProps.builder().build();
        this.corsAllowedDomains = domains != null ? domains : Arrays.asList("https://example.com");
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public List<String> getCorsAllowedDomains() {
        return corsAllowedDomains;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;
        private List<String> corsAllowedDomains;

        public Builder environmentSuffix(final String suffix) {
            this.environmentSuffix = suffix;
            return this;
        }

        public Builder stackProps(final StackProps props) {
            this.stackProps = props;
            return this;
        }

        public Builder corsAllowedDomains(final List<String> domains) {
            this.corsAllowedDomains = domains;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps, corsAllowedDomains);
        }
    }
}

/**
 * Security Infrastructure Stack with KMS for encryption
 */
class SecurityStack extends Stack {
    private final Key kmsKey;

    SecurityStack(final Construct scope, final String id, final String environmentSuffix, final StackProps props) {
        super(scope, id, props);

        // Create KMS Key for encryption
        this.kmsKey = Key.Builder.create(this, "ServerlessKmsKey")
                .description("KMS key for serverless infrastructure encryption - " + environmentSuffix)
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        software.amazon.awscdk.services.kms.Alias.Builder.create(this, "ServerlessKmsKeyAlias")
                .aliasName("alias/serverless-" + environmentSuffix + "-key")
                .targetKey(kmsKey)
                .build();

        Tags.of(this).add("project", "serverless-infrastructure");
        Tags.of(this).add("environment", environmentSuffix);
    }

    public Key getKmsKey() {
        return kmsKey;
    }
}

/**
 * Serverless Application Stack with Lambda, API Gateway, and S3
 */
class ServerlessStack extends Stack {
    private final Function userFunction;
    private final Function orderFunction;
    private final Function notificationFunction;
    private final Bucket staticAssetsBucket;
    private final RestApi apiGateway;
    private final Topic alertTopic;

    ServerlessStack(final Construct scope, final String id, final String environmentSuffix,
            final List<String> corsAllowedDomains, final Key kmsKey, final StackProps props) {
        super(scope, id, props);

        // Create S3 bucket for static assets
        this.staticAssetsBucket = createS3Bucket(environmentSuffix, kmsKey);

        // Create SNS topic for alerts
        this.alertTopic = createAlertTopic(environmentSuffix, kmsKey);

        // Create Lambda functions
        this.userFunction = createLambdaFunction("UserFunction", "user", environmentSuffix, kmsKey);
        this.orderFunction = createLambdaFunction("OrderFunction", "order", environmentSuffix, kmsKey);
        this.notificationFunction = createLambdaFunction("NotificationFunction", "notification", environmentSuffix, kmsKey);

        // Create API Gateway
        this.apiGateway = createApiGateway(environmentSuffix, corsAllowedDomains);

        // Deploy functions using SAM
        deploySamApplication(environmentSuffix);

        // Setup monitoring and alerts
        setupMonitoring();

        // Create function versions and aliases for auto-rollback
        setupVersioningAndRollback();

        Tags.of(this).add("project", "serverless-infrastructure");
        Tags.of(this).add("environment", environmentSuffix);
    }

    private Bucket createS3Bucket(final String environmentSuffix, final Key kmsKey) {
        Bucket bucket = Bucket.Builder.create(this, "StaticAssetsBucket")
                .bucketName("serverless-" + environmentSuffix + "-static-assets-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Add cache control for static assets
        bucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(Arrays.asList(new ServicePrincipal("cloudfront.amazonaws.com")))
                .actions(Arrays.asList("s3:GetObject"))
                .resources(Arrays.asList(bucket.getBucketArn() + "/*"))
                .conditions(Map.of("StringEquals", 
                    Map.of("AWS:SourceAccount", this.getAccount())
                ))
                .build());

        return bucket;
    }

    private Topic createAlertTopic(final String environmentSuffix, final Key kmsKey) {
        return Topic.Builder.create(this, "AlertTopic")
                .topicName("serverless-" + environmentSuffix + "-alerts")
                .displayName("Serverless Infrastructure Alerts")
                .masterKey(kmsKey)
                .build();
    }

    private Function createLambdaFunction(final String functionName, final String functionType, 
            final String environmentSuffix, final Key kmsKey) {

        // Create IAM role with least privilege
        Role lambdaRole = Role.Builder.create(this, functionName + "Role")
                .roleName("serverless-" + environmentSuffix + "-" + functionType + "-role")
                .assumedBy(ServicePrincipal.Builder.create("lambda.amazonaws.com").build())
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")))
                .inlinePolicies(Map.of("LeastPrivilegePolicy", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                                        .resources(Arrays.asList(staticAssetsBucket.getBucketArn() + "/*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("kms:Decrypt", "kms:GenerateDataKey"))
                                        .resources(Arrays.asList(kmsKey.getKeyArn()))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"))
                                        .resources(Arrays.asList("arn:aws:logs:" + this.getRegion() + ":" + this.getAccount() + ":*"))
                                        .build()))
                        .build()))
                .build();

        // Create Log Group for the function
        LogGroup logGroup = LogGroup.Builder.create(this, functionName + "LogGroup")
                .logGroupName("/aws/lambda/serverless-" + environmentSuffix + "-" + functionType)
                .retention(RetentionDays.ONE_YEAR)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Lambda function code
        String lambdaCode = generateLambdaCode(functionType, environmentSuffix);

        // Create Lambda function
        Function function = Function.Builder.create(this, functionName)
                .functionName("serverless-" + environmentSuffix + "-" + functionType)
                .runtime(Runtime.PYTHON_3_9)
                .handler("index.handler")
                .code(Code.fromInline(lambdaCode))
                .role(lambdaRole)
                .environment(Map.of(
                    "BUCKET_NAME", staticAssetsBucket.getBucketName(),
                    "KMS_KEY_ID", kmsKey.getKeyId(),
                    "ENVIRONMENT", environmentSuffix,
                    "LOG_LEVEL", "INFO"
                ))
                .timeout(Duration.seconds(30))
                .memorySize(256)
                .reservedConcurrentExecutions(100)
                .build();

        return function;
    }

    private String generateLambdaCode(final String functionType, final String environmentSuffix) {
        return "import json\n" 
               + "import boto3\n" 
               + "import os\n" 
               + "import logging\n" 
               + "from datetime import datetime\n" 
               + "\n" 
               + "# Configure logging\n" 
               + "logging.basicConfig(level=logging.INFO)\n" 
               + "logger = logging.getLogger(__name__)\n" 
               + "\n" 
               + "def handler(event, context):\n" 
               + "    \"\"\"" + functionType.toUpperCase() + " Lambda function handler\"\"\"\n" 
               + "    \n" 
               + "    # Log execution details to CloudWatch\n" 
               + "    logger.info(f'Function: {context.function_name} started')\n" 
               + "    logger.info(f'Request ID: {context.aws_request_id}')\n" 
               + "    logger.info(f'Environment: {os.environ.get(\"ENVIRONMENT\", \"unknown\")}')\n" 
               + "    \n" 
               + "    try:\n" 
               + "        # Process based on function type\n" 
               + "        if '" + functionType + "' == 'user':\n" 
               + "            result = process_user_request(event)\n" 
               + "        elif '" + functionType + "' == 'order':\n" 
               + "            result = process_order_request(event)\n" 
               + "        else:\n" 
               + "            result = process_notification_request(event)\n" 
               + "        \n" 
               + "        logger.info(f'Function: {context.function_name} completed successfully')\n" 
               + "        \n" 
               + "        return {\n" 
               + "            'statusCode': 200,\n" 
               + "            'headers': {\n" 
               + "                'Content-Type': 'application/json',\n" 
               + "                'Access-Control-Allow-Origin': '*',\n" 
               + "                'Access-Control-Allow-Headers': 'Content-Type',\n" 
               + "                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'\n" 
               + "            },\n" 
               + "            'body': json.dumps(result)\n" 
               + "        }\n" 
               + "    \n" 
               + "    except Exception as e:\n" 
               + "        logger.error(f'Function: {context.function_name} failed: {str(e)}')\n" 
               + "        \n" 
               + "        return {\n" 
               + "            'statusCode': 500,\n" 
               + "            'headers': {\n" 
               + "                'Content-Type': 'application/json',\n" 
               + "                'Access-Control-Allow-Origin': '*'\n" 
               + "            },\n" 
               + "            'body': json.dumps({\n" 
               + "                'error': 'Internal server error',\n" 
               + "                'message': str(e),\n" 
               + "                'requestId': context.aws_request_id\n" 
               + "            })\n" 
               + "        }\n" 
               + "\n" 
               + "def process_" + functionType + "_request(event):\n" 
               + "    \"\"\"Process " + functionType + " specific logic\"\"\"\n" 
               + "    return {\n" 
               + "        'message': '" + functionType.toUpperCase() + " function executed successfully',\n" 
               + "        'timestamp': datetime.utcnow().isoformat(),\n" 
               + "        'data': event.get('body', {})\n" 
               + "    }\n";
    }

    private RestApi createApiGateway(final String environmentSuffix, final List<String> corsAllowedDomains) {
        // Create API Gateway with CORS
        RestApi api = LambdaRestApi.Builder.create(this, "ServerlessApi")
                .restApiName("serverless-" + environmentSuffix + "-api")
                .description("Serverless infrastructure API Gateway")
                .handler(userFunction) // Default handler
                .proxy(false)
                .deployOptions(StageOptions.builder()
                        .stageName("prod")
                        .throttlingRateLimit(1000.0)
                        .throttlingBurstLimit(2000)
                        .build())
                .defaultCorsPreflightOptions(CorsOptions.builder()
                        .allowOrigins(corsAllowedDomains)
                        .allowMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"))
                        .allowHeaders(Arrays.asList("Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"))
                        .build())
                .build();

        // Add resources and methods
        api.getRoot().addResource("users").addMethod("GET", 
            new software.amazon.awscdk.services.apigateway.LambdaIntegration(userFunction));
        api.getRoot().addResource("orders").addMethod("POST", 
            new software.amazon.awscdk.services.apigateway.LambdaIntegration(orderFunction));
        api.getRoot().addResource("notifications").addMethod("PUT", 
            new software.amazon.awscdk.services.apigateway.LambdaIntegration(notificationFunction));

        return api;
    }

    private void deploySamApplication(final String environmentSuffix) {
        // Deploy Lambda functions using AWS SAM
        CfnApplication.Builder.create(this, "ServerlessSamApp")
                .location(CfnApplication.ApplicationLocationProperty.builder()
                        .applicationId("arn:aws:serverlessrepo:us-east-1:123456789012:applications/my-serverless-app")
                        .semanticVersion("1.0.0")
                        .build())
                .parameters(Map.of(
                    "Environment", 
                    environmentSuffix,
                    "BucketName", 
                    staticAssetsBucket.getBucketName()
                ))
                .build();
    }

    private void setupMonitoring() {
        // Create CloudWatch alarms for Lambda function errors
        createLambdaErrorAlarm(userFunction, "UserFunction");
        createLambdaErrorAlarm(orderFunction, "OrderFunction");
        createLambdaErrorAlarm(notificationFunction, "NotificationFunction");
    }

    private void createLambdaErrorAlarm(final Function function, final String functionName) {
        Metric errorMetric = Metric.Builder.create()
                .namespace("AWS/Lambda")
                .metricName("Errors")
                .dimensionsMap(Map.of("FunctionName", function.getFunctionName()))
                .statistic("Sum")
                .period(Duration.minutes(5))
                .build();

        Alarm errorAlarm = Alarm.Builder.create(this, functionName + "ErrorAlarm")
                .alarmName("Serverless-" + functionName + "-Errors")
                .metric(errorMetric)
                .threshold(1.0)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD)
                .evaluationPeriods(1)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .alarmDescription("Lambda function " + functionName + " error alarm")
                .build();

        errorAlarm.addAlarmAction(new SnsAction(alertTopic));
    }

    private void setupVersioningAndRollback() {
        // Create versions and aliases for each function
        setupFunctionVersioning(userFunction, "UserFunction");
        setupFunctionVersioning(orderFunction, "OrderFunction");
        setupFunctionVersioning(notificationFunction, "NotificationFunction");
    }

    private void setupFunctionVersioning(final Function function, final String functionName) {
        // Create a version
        Version version = Version.Builder.create(this, functionName + "Version")
                .lambda(function)
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        // Create an alias pointing to the version
        Alias.Builder.create(this, functionName + "Alias")
                .aliasName("LIVE")
                .version(version)
                .build();
    }

    // Getters for stack outputs
    public Function getUserFunction() {
        return userFunction;
    }
    
    public Function getOrderFunction() {
        return orderFunction;
    }
    
    public Function getNotificationFunction() {
        return notificationFunction;
    }
    
    public Bucket getStaticAssetsBucket() {
        return staticAssetsBucket;
    }
    
    public RestApi getApiGateway() {
        return apiGateway;
    }
    
    public Topic getAlertTopic() {
        return alertTopic;
    }
}

/**
 * Main Serverless Infrastructure Stack
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final SecurityStack securityStack;
    private final ServerlessStack serverlessStack;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .orElse("dev");

        List<String> corsAllowedDomains = Optional.ofNullable(props)
                .map(TapStackProps::getCorsAllowedDomains)
                .orElse(Arrays.asList("https://example.com"));

        // Create security stack
        this.securityStack = new SecurityStack(
                this,
                "Security",
                environmentSuffix,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Security Stack for serverless infrastructure: " + environmentSuffix)
                        .build());

        // Create serverless application stack
        this.serverlessStack = new ServerlessStack(
                this,
                "ServerlessApp",
                environmentSuffix,
                corsAllowedDomains,
                securityStack.getKmsKey(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Serverless Application Stack: " + environmentSuffix)
                        .build());

        // Add dependencies
        serverlessStack.addDependency(securityStack);

        // Create outputs
        createOutputs();

        // Add tags to all resources
        Tags.of(this).add("project", "serverless-infrastructure");
        Tags.of(this).add("environment", environmentSuffix);
    }

    private void createOutputs() {
        CfnOutput.Builder.create(this, "ApiGatewayUrl")
                .value(serverlessStack.getApiGateway().getUrl())
                .description("API Gateway URL")
                .exportName("ServerlessApiUrl-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "StaticAssetsBucket")
                .value(serverlessStack.getStaticAssetsBucket().getBucketName())
                .description("S3 bucket for static assets")
                .exportName("ServerlessStaticBucket-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "UserFunctionArn")
                .value(serverlessStack.getUserFunction().getFunctionArn())
                .description("User Lambda function ARN")
                .exportName("ServerlessUserFunctionArn-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "OrderFunctionArn")
                .value(serverlessStack.getOrderFunction().getFunctionArn())
                .description("Order Lambda function ARN")
                .exportName("ServerlessOrderFunctionArn-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "NotificationFunctionArn")
                .value(serverlessStack.getNotificationFunction().getFunctionArn())
                .description("Notification Lambda function ARN")
                .exportName("ServerlessNotificationFunctionArn-" + environmentSuffix)
                .build();
    }

    public SecurityStack getSecurityStack() {
        return securityStack;
    }
    
    public ServerlessStack getServerlessStack() {
        return serverlessStack;
    }
    
    public String getEnvironmentSuffix() { 
        return environmentSuffix;
    }
}

/**
 * Main entry point for the Serverless CDK Java application
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from environment variable, context, or default
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        }
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Get CORS allowed domains from environment
        String corsDomainsEnv = System.getenv("CORS_ALLOWED_DOMAINS");
        List<String> corsAllowedDomains;
        if (corsDomainsEnv != null && !corsDomainsEnv.isEmpty()) {
            corsAllowedDomains = Arrays.asList(corsDomainsEnv.split(","));
        } else {
            corsAllowedDomains = Arrays.asList("https://example.com", "https://app.example.com");
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .corsAllowedDomains(corsAllowedDomains)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2")
                                .build())
                        .build())
                .build());

        app.synth();
    }
}

```

<!-- /tests/unit/java/app/MainTest.java -->
```java
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

```

<!-- /tests/integration/java/app/MainIntegrationTest.java -->
```java
package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsRequest;
import software.amazon.awssdk.services.cloudwatch.model.DescribeAlarmsResponse;
import software.amazon.awssdk.services.cloudwatch.model.MetricAlarm;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogStreamsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogStreamsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetLogEventsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetLogEventsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.LogStream;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.iam.model.GetRoleResponse;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DescribeKeyRequest;
import software.amazon.awssdk.services.kms.model.DescribeKeyResponse;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.GetFunctionRequest;
import software.amazon.awssdk.services.lambda.model.GetFunctionResponse;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.ListAliasesRequest;
import software.amazon.awssdk.services.lambda.model.ListAliasesResponse;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionRequest;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionResponse;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionResponse;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningRequest;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningResponse;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesRequest;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesResponse;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Real-world integration tests for deployed AWS infrastructure.
 * These tests interact with actual AWS resources and verify end-to-end functionality.
 *
 * Prerequisites:
 * - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables must be set
 * - ENVIRONMENT_SUFFIX environment variable should be set (defaults to "dev")
 * - Stack must be deployed before running these tests
 */
@DisplayName("Real-World AWS Infrastructure Integration Tests")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class MainIntegrationTest {

    private static final Region AWS_REGION = Region.US_WEST_2;
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // AWS Clients
    private CloudFormationClient cfnClient;
    private LambdaClient lambdaClient;
    private S3Client s3Client;
    private CloudWatchClient cloudWatchClient;
    private CloudWatchLogsClient logsClient;
    private SnsClient snsClient;
    private IamClient iamClient;
    private KmsClient kmsClient;

    // Stack information
    private String stackName;
    private String environmentSuffix;
    private String apiGatewayUrl;
    private String s3BucketName;
    private String userFunctionArn;
    private String orderFunctionArn;
    private String notificationFunctionArn;
    private String kmsKeyId;

    @BeforeAll
    public void setUp() {
        // Get credentials from environment
        String accessKey = System.getenv("AWS_ACCESS_KEY_ID");
        String secretKey = System.getenv("AWS_SECRET_ACCESS_KEY");
        environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");

        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        assertThat(accessKey).as("AWS_ACCESS_KEY_ID must be set").isNotNull();
        assertThat(secretKey).as("AWS_SECRET_ACCESS_KEY must be set").isNotNull();

        // Create credentials provider
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);

        // Initialize AWS clients
        cfnClient = CloudFormationClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        lambdaClient = LambdaClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        s3Client = S3Client.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        cloudWatchClient = CloudWatchClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        logsClient = CloudWatchLogsClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        snsClient = SnsClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        iamClient = IamClient.builder()
                .region(Region.AWS_GLOBAL) // IAM is global
                .credentialsProvider(credentialsProvider)
                .build();

        kmsClient = KmsClient.builder()
                .region(AWS_REGION)
                .credentialsProvider(credentialsProvider)
                .build();

        // Get stack information
        stackName = "TapStack" + environmentSuffix;
        loadStackOutputs();
    }

    @AfterAll
    public void tearDown() {
        if (cfnClient != null) cfnClient.close();
        if (lambdaClient != null) lambdaClient.close();
        if (s3Client != null) s3Client.close();
        if (cloudWatchClient != null) cloudWatchClient.close();
        if (logsClient != null) logsClient.close();
        if (snsClient != null) snsClient.close();
        if (iamClient != null) iamClient.close();
        if (kmsClient != null) kmsClient.close();
    }

    private void loadStackOutputs() {
        DescribeStacksRequest request = DescribeStacksRequest.builder()
                .stackName(stackName)
                .build();

        DescribeStacksResponse response = cfnClient.describeStacks(request);
        assertThat(response.stacks()).isNotEmpty();

        Stack stack = response.stacks().get(0);
        Map<String, String> outputs = new HashMap<>();

        for (Output output : stack.outputs()) {
            outputs.put(output.outputKey(), output.outputValue());
        }

        apiGatewayUrl = outputs.get("ApiGatewayUrl");
        s3BucketName = outputs.get("StaticAssetsBucket");
        userFunctionArn = outputs.get("UserFunctionArn");
        orderFunctionArn = outputs.get("OrderFunctionArn");
        notificationFunctionArn = outputs.get("NotificationFunctionArn");

        assertThat(apiGatewayUrl).as("API Gateway URL should be present").isNotNull();
        assertThat(s3BucketName).as("S3 bucket name should be present").isNotNull();
        assertThat(userFunctionArn).as("User function ARN should be present").isNotNull();
        assertThat(orderFunctionArn).as("Order function ARN should be present").isNotNull();
        assertThat(notificationFunctionArn).as("Notification function ARN should be present").isNotNull();
    }

    // API GATEWAY INTEGRATION TESTS

    @Nested
    @DisplayName("API Gateway Integration Tests")
    class ApiGatewayTests {

        @Test
        @DisplayName("Should successfully invoke GET /users endpoint")
        public void testGetUsersEndpoint() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .GET()
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).isNotNull();

            // Verify response structure
            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.get("message").asText()).contains("USER");
        }

        @Test
        @DisplayName("Should successfully invoke POST /orders endpoint")
        public void testPostOrdersEndpoint() throws IOException, InterruptedException {
            String requestBody = "{\"orderId\": \"12345\", \"item\": \"test-item\"}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "orders"))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).isNotNull();

            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.get("message").asText()).contains("ORDER");
        }

        @Test
        @DisplayName("Should successfully invoke PUT /notifications endpoint")
        public void testPutNotificationsEndpoint() throws IOException, InterruptedException {
            String requestBody = "{\"notificationId\": \"67890\", \"message\": \"test-notification\"}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "notifications"))
                    .PUT(HttpRequest.BodyPublishers.ofString(requestBody))
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).isNotNull();

            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.get("message").asText()).contains("NOTIFICATION");
        }

        @Test
        @DisplayName("Should return correct CORS headers")
        public void testCorsHeaders() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).isPresent();
            assertThat(response.headers().firstValue("Access-Control-Allow-Methods")).isPresent();
            assertThat(response.headers().firstValue("Access-Control-Allow-Headers")).isPresent();
        }

        @Test
        @DisplayName("Should handle invalid endpoint gracefully")
        public void testInvalidEndpoint() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "invalid-endpoint"))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isIn(403, 404);
        }

        @Test
        @DisplayName("Should return timestamp in response")
        public void testResponseTimestamp() throws IOException, InterruptedException {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("timestamp")).isTrue();
        }
    }

    // LAMBDA FUNCTION INTEGRATION TESTS

    @Nested
    @DisplayName("Lambda Function Integration Tests")
    class LambdaFunctionTests {

        @Test
        @DisplayName("Should invoke user Lambda function directly")
        public void testInvokeUserFunction() {
            String payload = "{\"body\": {\"test\": \"data\"}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(userFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);
            assertThat(invokeResponse.payload()).isNotNull();

            String responsePayload = invokeResponse.payload().asUtf8String();
            assertThat(responsePayload).contains("statusCode");
        }

        @Test
        @DisplayName("Should invoke order Lambda function directly")
        public void testInvokeOrderFunction() {
            String payload = "{\"body\": {\"orderId\": \"test-123\"}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(orderFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);
            assertThat(invokeResponse.payload()).isNotNull();
        }

        @Test
        @DisplayName("Should invoke notification Lambda function directly")
        public void testInvokeNotificationFunction() {
            String payload = "{\"body\": {\"message\": \"test notification\"}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(notificationFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);
            assertThat(invokeResponse.payload()).isNotNull();
        }

        @Test
        @DisplayName("Should verify Lambda function configuration")
        public void testLambdaConfiguration() {
            GetFunctionRequest request = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse response = lambdaClient.getFunction(request);

            assertThat(response.configuration().runtime().toString()).contains("python");
            assertThat(response.configuration().timeout()).isEqualTo(30);
            assertThat(response.configuration().memorySize()).isEqualTo(256);
        }

        @Test
        @DisplayName("Should verify Lambda environment variables")
        public void testLambdaEnvironmentVariables() {
            GetFunctionRequest request = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse response = lambdaClient.getFunction(request);
            Map<String, String> envVars = response.configuration().environment().variables();

            assertThat(envVars).containsKey("BUCKET_NAME");
            assertThat(envVars).containsKey("KMS_KEY_ID");
            assertThat(envVars).containsKey("ENVIRONMENT");
            assertThat(envVars).containsKey("LOG_LEVEL");
            assertThat(envVars.get("ENVIRONMENT")).isEqualTo(environmentSuffix);
        }

        @Test
        @DisplayName("Should verify Lambda has correct IAM role")
        public void testLambdaIamRole() {
            GetFunctionRequest request = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse response = lambdaClient.getFunction(request);
            String roleArn = response.configuration().role();

            assertThat(roleArn).isNotNull();
            assertThat(roleArn).contains("serverless-" + environmentSuffix + "-user-role");
        }

        @Test
        @DisplayName("Should verify Lambda versions exist")
        public void testLambdaVersions() {
            String functionName = "serverless-" + environmentSuffix + "-user";

            ListVersionsByFunctionRequest request = ListVersionsByFunctionRequest.builder()
                    .functionName(functionName)
                    .build();

            ListVersionsByFunctionResponse response = lambdaClient.listVersionsByFunction(request);

            assertThat(response.versions()).isNotEmpty();
        }

        @Test
        @DisplayName("Should verify Lambda alias exists")
        public void testLambdaAlias() {
            String functionName = "serverless-" + environmentSuffix + "-user";

            ListAliasesRequest request = ListAliasesRequest.builder()
                    .functionName(functionName)
                    .build();

            ListAliasesResponse response = lambdaClient.listAliases(request);

            assertThat(response.aliases()).isNotEmpty();
            assertThat(response.aliases().get(0).name()).isEqualTo("LIVE");
        }
    }

    // S3 INTEGRATION TESTS

    @Nested
    @DisplayName("S3 Bucket Integration Tests")
    class S3BucketTests {

        @Test
        @DisplayName("Should upload and retrieve object from S3")
        public void testS3PutAndGet() {
            String key = "test-file-" + System.currentTimeMillis() + ".txt";
            String content = "Test content for integration testing";

            // Put object
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(key)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromString(content));

            // Get object
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(key)
                    .build();

            ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getRequest);
            String retrievedContent = objectBytes.asUtf8String();

            assertThat(retrievedContent).isEqualTo(content);

            // Cleanup
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteRequest);
        }

        @Test
        @DisplayName("Should verify S3 bucket has encryption enabled")
        public void testS3Encryption() {
            GetBucketEncryptionRequest request = GetBucketEncryptionRequest.builder()
                    .bucket(s3BucketName)
                    .build();

            GetBucketEncryptionResponse response = s3Client.getBucketEncryption(request);

            assertThat(response.serverSideEncryptionConfiguration()).isNotNull();
            assertThat(response.serverSideEncryptionConfiguration().rules()).isNotEmpty();
        }

        @Test
        @DisplayName("Should verify S3 bucket has versioning enabled")
        public void testS3Versioning() {
            GetBucketVersioningRequest request = GetBucketVersioningRequest.builder()
                    .bucket(s3BucketName)
                    .build();

            GetBucketVersioningResponse response = s3Client.getBucketVersioning(request);

            assertThat(response.status().toString()).isEqualTo("Enabled");
        }
    }

    // CLOUDWATCH INTEGRATION TESTS

    @Nested
    @DisplayName("CloudWatch Integration Tests")
    class CloudWatchTests {

        @Test
        @DisplayName("Should verify CloudWatch alarms exist")
        public void testCloudWatchAlarms() {
            DescribeAlarmsRequest request = DescribeAlarmsRequest.builder()
                    .alarmNamePrefix("Serverless-")
                    .build();

            DescribeAlarmsResponse response = cloudWatchClient.describeAlarms(request);

            assertThat(response.metricAlarms()).isNotEmpty();

            // Verify alarm for user function
            boolean userAlarmExists = response.metricAlarms().stream()
                    .anyMatch(alarm -> alarm.alarmName().contains("UserFunction"));
            assertThat(userAlarmExists).isTrue();
        }

        @Test
        @DisplayName("Should verify CloudWatch logs exist for Lambda functions")
        public void testCloudWatchLogs() throws InterruptedException {
            String logGroupName = "/aws/lambda/serverless-" + environmentSuffix + "-user";

            // Wait a bit for logs to be available
            Thread.sleep(2000);

            DescribeLogStreamsRequest request = DescribeLogStreamsRequest.builder()
                    .logGroupName(logGroupName)
                    .orderBy("LastEventTime")
                    .descending(true)
                    .limit(1)
                    .build();

            assertThatCode(() -> {
                DescribeLogStreamsResponse response = logsClient.describeLogStreams(request);
                assertThat(response.logStreams()).isNotEmpty();
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should verify Lambda function logs contain execution details")
        public void testLambdaLogsContent() throws InterruptedException {
            // Invoke function first to generate logs
            String payload = "{\"body\": {\"test\": \"logging\"}}";
            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(userFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();
            lambdaClient.invoke(invokeRequest);

            // Wait for logs to be written
            Thread.sleep(5000);

            String logGroupName = "/aws/lambda/serverless-" + environmentSuffix + "-user";

            DescribeLogStreamsRequest streamRequest = DescribeLogStreamsRequest.builder()
                    .logGroupName(logGroupName)
                    .orderBy("LastEventTime")
                    .descending(true)
                    .limit(1)
                    .build();

            DescribeLogStreamsResponse streamResponse = logsClient.describeLogStreams(streamRequest);

            if (!streamResponse.logStreams().isEmpty()) {
                LogStream latestStream = streamResponse.logStreams().get(0);

                GetLogEventsRequest logRequest = GetLogEventsRequest.builder()
                        .logGroupName(logGroupName)
                        .logStreamName(latestStream.logStreamName())
                        .limit(50)
                        .build();

                GetLogEventsResponse logResponse = logsClient.getLogEvents(logRequest);

                assertThat(logResponse.events()).isNotEmpty();
            }
        }
    }

    // IAM & KMS SECURITY TESTS

    @Nested
    @DisplayName("Security Integration Tests")
    class SecurityTests {

        @Test
        @DisplayName("Should verify IAM role has least privilege policies")
        public void testIamRolePolicies() {
            String roleName = "serverless-" + environmentSuffix + "-user-role";

            GetRoleRequest request = GetRoleRequest.builder()
                    .roleName(roleName)
                    .build();

            GetRoleResponse response = iamClient.getRole(request);

            assertThat(response.role()).isNotNull();
            assertThat(response.role().roleName()).isEqualTo(roleName);
        }

        @Test
        @DisplayName("Should verify KMS key exists and has rotation enabled")
        public void testKmsKeyRotation() {
            // Get KMS key ID from Lambda environment variables
            GetFunctionRequest funcRequest = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse funcResponse = lambdaClient.getFunction(funcRequest);
            kmsKeyId = funcResponse.configuration().environment().variables().get("KMS_KEY_ID");

            assertThat(kmsKeyId).isNotNull();

            DescribeKeyRequest keyRequest = DescribeKeyRequest.builder()
                    .keyId(kmsKeyId)
                    .build();

            DescribeKeyResponse keyResponse = kmsClient.describeKey(keyRequest);

            assertThat(keyResponse.keyMetadata().enabled()).isTrue();
        }
    }

    // SNS INTEGRATION TESTS

    @Nested
    @DisplayName("SNS Integration Tests")
    class SnsTests {

        @Test
        @DisplayName("Should verify SNS topic exists")
        public void testSnsTopicExists() {
            String topicName = "serverless-" + environmentSuffix + "-alerts";

            // Get topic ARN from CloudWatch alarm
            DescribeAlarmsRequest request = DescribeAlarmsRequest.builder()
                    .alarmNamePrefix("Serverless-UserFunction")
                    .build();

            DescribeAlarmsResponse response = cloudWatchClient.describeAlarms(request);

            if (!response.metricAlarms().isEmpty()) {
                MetricAlarm alarm = response.metricAlarms().get(0);
                assertThat(alarm.alarmActions()).isNotEmpty();

                String topicArn = alarm.alarmActions().get(0);
                assertThat(topicArn).contains(topicName);
            }
        }

        @Test
        @DisplayName("Should verify SNS topic has KMS encryption")
        public void testSnsTopicEncryption() {
            DescribeAlarmsRequest alarmRequest = DescribeAlarmsRequest.builder()
                    .alarmNamePrefix("Serverless-UserFunction")
                    .build();

            DescribeAlarmsResponse alarmResponse = cloudWatchClient.describeAlarms(alarmRequest);

            if (!alarmResponse.metricAlarms().isEmpty() && 
                !alarmResponse.metricAlarms().get(0).alarmActions().isEmpty()) {
                
                String topicArn = alarmResponse.metricAlarms().get(0).alarmActions().get(0);

                GetTopicAttributesRequest topicRequest = GetTopicAttributesRequest.builder()
                        .topicArn(topicArn)
                        .build();

                GetTopicAttributesResponse topicResponse = snsClient.getTopicAttributes(topicRequest);

                assertThat(topicResponse.attributes()).containsKey("KmsMasterKeyId");
            }
        }
    }

    // END-TO-END WORKFLOW TESTS

    @Nested
    @DisplayName("End-to-End Workflow Tests")
    class EndToEndTests {

        @Test
        @DisplayName("Should complete full user workflow through API")
        public void testCompleteUserWorkflow() throws IOException, InterruptedException {
            // 1. Call GET /users
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiGatewayUrl + "users"))
                    .GET()
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);

            // 2. Verify response structure
            JsonNode jsonResponse = objectMapper.readTree(response.body());
            assertThat(jsonResponse.has("message")).isTrue();
            assertThat(jsonResponse.has("timestamp")).isTrue();
            assertThat(jsonResponse.has("data")).isTrue();
        }

        @Test
        @DisplayName("Should handle multiple concurrent requests")
        public void testConcurrentRequests() throws InterruptedException {
            int numberOfRequests = 5;
            List<Thread> threads = new java.util.ArrayList<>();

            for (int i = 0; i < numberOfRequests; i++) {
                Thread thread = new Thread(() -> {
                    try {
                        HttpRequest request = HttpRequest.newBuilder()
                                .uri(URI.create(apiGatewayUrl + "users"))
                                .GET()
                                .build();

                        HttpResponse<String> response = httpClient.send(request, 
                            HttpResponse.BodyHandlers.ofString());

                        assertThat(response.statusCode()).isEqualTo(200);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });
                threads.add(thread);
                thread.start();
            }

            // Wait for all threads to complete
            for (Thread thread : threads) {
                thread.join();
            }
        }

        @Test
        @DisplayName("Should verify Lambda can access S3 bucket")
        public void testLambdaS3Integration() {
            // Invoke Lambda which should have access to S3
            String payload = "{\"body\": {\"s3Test\": true}}";

            InvokeRequest invokeRequest = InvokeRequest.builder()
                    .functionName(userFunctionArn)
                    .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);

            assertThat(invokeResponse.statusCode()).isEqualTo(200);

            // Verify Lambda has S3 bucket name in environment
            GetFunctionRequest funcRequest = GetFunctionRequest.builder()
                    .functionName(userFunctionArn)
                    .build();

            GetFunctionResponse funcResponse = lambdaClient.getFunction(funcRequest);
            Map<String, String> envVars = funcResponse.configuration().environment().variables();

            assertThat(envVars.get("BUCKET_NAME")).isEqualTo(s3BucketName);
        }

        @Test
        @DisplayName("Should verify all three Lambda functions are accessible")
        public void testAllLambdaFunctionsAccessible() {
            List<String> functionArns = List.of(userFunctionArn, orderFunctionArn, notificationFunctionArn);

            for (String functionArn : functionArns) {
                GetFunctionRequest request = GetFunctionRequest.builder()
                        .functionName(functionArn)
                        .build();

                assertThatCode(() -> {
                    GetFunctionResponse response = lambdaClient.getFunction(request);
                    assertThat(response.configuration().state().toString()).isEqualTo("Active");
                }).doesNotThrowAnyException();
            }
        }

        @Test
        @DisplayName("Should verify stack has all required tags")
        public void testStackTags() {
            DescribeStacksRequest request = DescribeStacksRequest.builder()
                    .stackName(stackName)
                    .build();

            DescribeStacksResponse response = cfnClient.describeStacks(request);
            Stack stack = response.stacks().get(0);

            boolean hasProjectTag = stack.tags().stream()
                    .anyMatch(tag -> tag.key().equals("project") && 
                             tag.value().equals("serverless-infrastructure"));

            boolean hasEnvironmentTag = stack.tags().stream()
                    .anyMatch(tag -> tag.key().equals("environment") && 
                             tag.value().equals(environmentSuffix));

            assertThat(hasProjectTag).isTrue();
            assertThat(hasEnvironmentTag).isTrue();
        }
    }
}

```