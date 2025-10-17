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
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
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

        // Note: Lambda functions are deployed directly via CDK above
        // SAM deployment is not needed as functions are already created

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

        // Lambda function code
        String lambdaCode = generateLambdaCode(functionType, environmentSuffix);

        // Create Lambda function with log retention
        // CDK will automatically create and manage the log group
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
                .logRetention(RetentionDays.ONE_YEAR)
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
