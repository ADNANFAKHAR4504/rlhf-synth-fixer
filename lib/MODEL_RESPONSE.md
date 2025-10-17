```java
package com.tap.infrastructure;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.kms.*;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.logs.*;
import software.amazon.awscdk.services.sns.*;
import software.amazon.awscdk.services.sns.subscriptions.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.cloudwatch.actions.*;
import software.constructs.Construct;

import java.util.*;

public class TapStack extends Stack {

    private final TapStackProps props;
    private final Key kmsKey;
    private final Topic alertTopic;
    private final Map<String, Object> tags;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, StackProps.builder()
                .env(Environment.builder()
                        .region("us-west-2")
                        .build())
                .build());
        
        this.props = props;
        this.tags = new HashMap<>();
        this.tags.put("project", props.getProject());
        this.tags.put("environment", props.getEnvironment());

        // Initialize security components
        this.kmsKey = createKmsKey();
        this.alertTopic = createAlertTopic();

        // Initialize infrastructure components
        createSecurityStack();
        createApplicationStack();
    }

    private Key createKmsKey() {
        Key key = Key.Builder.create(this, "TapKmsKey")
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.RETAIN)
                .description("KMS key for encrypting Lambda environment variables")
                .build();

        applyTags(key);
        return key;
    }

    private Topic createAlertTopic() {
        Topic topic = Topic.Builder.create(this, "TapAlertTopic")
                .displayName("TAP Serverless Alerts")
                .topicName("tap-serverless-alerts-" + props.getEnvironment())
                .build();

        applyTags(topic);
        return topic;
    }

    private void createSecurityStack() {
        // IAM Roles for Lambda functions
        createLambdaExecutionRole("ProcessorFunctionRole", "processor");
        createLambdaExecutionRole("AuthorizerFunctionRole", "authorizer");
        createLambdaExecutionRole("TransformerFunctionRole", "transformer");
    }

    private IRole createLambdaExecutionRole(String roleName, String functionType) {
        Role role = Role.Builder.create(this, roleName)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .roleName(roleName + "-" + props.getEnvironment())
                .build();

        // CloudWatch Logs permissions
        role.addToPrincipalPolicy(PolicyStatement.Builder.create()
                .actions(Arrays.asList(
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                ))
                .resources(Collections.singletonList("arn:aws:logs:us-west-2:*:*"))
                .build());

        // KMS permissions for encryption
        role.addToPrincipalPolicy(PolicyStatement.Builder.create()
                .actions(Arrays.asList(
                        "kms:Decrypt",
                        "kms:DescribeKey"
                ))
                .resources(Collections.singletonList(kmsKey.getKeyArn()))
                .build());

        // Function-specific S3 permissions
        if (functionType.equals("processor") || functionType.equals("transformer")) {
            role.addToPrincipalPolicy(PolicyStatement.Builder.create()
                    .actions(Arrays.asList(
                            "s3:GetObject",
                            "s3:PutObject"
                    ))
                    .resources(Collections.singletonList("arn:aws:s3:::tap-assets-*/*"))
                    .build());
        }

        applyTags(role);
        return role;
    }

    private void createApplicationStack() {
        // Create S3 bucket for static assets
        Bucket assetsBucket = createAssetsBucket();

        // Create Lambda functions
        Function processorFunc = createLambdaFunction("ProcessorFunction", "processor", 
                createLambdaExecutionRole("ProcessorFunctionRole", "processor"));
        Function authorizerFunc = createLambdaFunction("AuthorizerFunction", "authorizer",
                createLambdaExecutionRole("AuthorizerFunctionRole", "authorizer"));
        Function transformerFunc = createLambdaFunction("TransformerFunction", "transformer",
                createLambdaExecutionRole("TransformerFunctionRole", "transformer"));

        // Create API Gateway
        createApiGateway(processorFunc, authorizerFunc, transformerFunc);

        // Set up monitoring and alerts
        setupMonitoring(processorFunc, authorizerFunc, transformerFunc);
    }

    private Bucket createAssetsBucket() {
        Bucket bucket = Bucket.Builder.create(this, "TapAssetsBucket")
                .bucketName("tap-assets-" + props.getEnvironment() + "-" + 
                        System.currentTimeMillis())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.builder()
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .build())
                .versioned(true)
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        applyTags(bucket);
        return bucket;
    }

    private Function createLambdaFunction(String functionName, String functionType, IRole role) {
        Map<String, String> env = new HashMap<>();
        env.put("PROJECT", props.getProject());
        env.put("ENVIRONMENT", props.getEnvironment());
        env.put("FUNCTION_TYPE", functionType);
        env.put("LOG_LEVEL", "INFO");

        Function function = Function.Builder.create(this, functionName)
                .runtime(Runtime.JAVA_21)
                .code(Code.fromAsset("lambda/" + functionType))
                .handler("com.tap.lambda." + capitalize(functionType) + "Handler::handleRequest")
                .functionName(functionName.toLowerCase() + "-" + props.getEnvironment())
                .timeout(Duration.seconds(30))
                .memorySize(512)
                .role(role)
                .environment(env)
                .logRetention(RetentionDays.TWO_WEEKS)
                .environmentEncryption(kmsKey)
                .tracing(Tracing.ACTIVE)
                .currentVersionOptions(VersionOptions.builder()
                        .removalPolicy(RemovalPolicy.RETAIN)
                        .build())
                .build();

        // Create alias for versioning and rollback
        function.addAlias("live", AliasOptions.builder()
                .additionalVersions(Collections.singletonList(function.getLatestVersion()))
                .build());

        applyTags(function);
        return function;
    }

    private void createApiGateway(Function processorFunc, Function authorizerFunc, Function transformerFunc) {
        RestApi api = RestApi.Builder.create(this, "TapApi")
                .restApiName("tap-api-" + props.getEnvironment())
                .description("TAP Serverless API")
                .defaultCorsPreflightOptions(CorsOptions.builder()
                        .allowOrigins(Collections.singletonList(props.getAllowedCorsOrigin()))
                        .allowMethods(Collections.singletonList("GET", "POST", "PUT", "DELETE"))
                        .allowHeaders(Collections.singletonList("*"))
                        .maxAge(Duration.days(1))
                        .build())
                .cloudWatchRole(true)
                .build();

        // Processor endpoint
        Resource processorResource = api.getRoot().addResource("process");
        Method processorMethod = processorResource.addMethod("POST",
                new LambdaIntegration(processorFunc, LambdaIntegrationOptions.builder()
                        .proxy(true)
                        .build()));

        addMethodResponse(processorMethod);

        // Authorizer endpoint
        Resource authorizerResource = api.getRoot().addResource("authorize");
        Method authorizerMethod = authorizerResource.addMethod("POST",
                new LambdaIntegration(authorizerFunc, LambdaIntegrationOptions.builder()
                        .proxy(true)
                        .build()));

        addMethodResponse(authorizerMethod);

        // Transformer endpoint
        Resource transformerResource = api.getRoot().addResource("transform");
        Method transformerMethod = transformerResource.addMethod("POST",
                new LambdaIntegration(transformerFunc, LambdaIntegrationOptions.builder()
                        .proxy(true)
                        .build()));

        addMethodResponse(transformerMethod);

        applyTags(api);
    }

    private void addMethodResponse(Method method) {
        method.getResource().addMethod("OPTIONS", new MockIntegration(
                IntegrationOptions.builder()
                        .integrationResponses(Collections.singletonList(
                                IntegrationResponse.builder()
                                        .statusCode("200")
                                        .build()
                        ))
                        .build()
        ), MethodOptions.builder()
                .methodResponses(Arrays.asList(
                        MethodResponse.builder().statusCode("200").build(),
                        MethodResponse.builder().statusCode("400").build(),
                        MethodResponse.builder().statusCode("404").build(),
                        MethodResponse.builder().statusCode("500").build()
                ))
                .build());
    }

    private void setupMonitoring(Function processorFunc, Function authorizerFunc, Function transformerFunc) {
        // Create alarms for each function
        createFunctionAlarm(processorFunc, "ProcessorFunctionErrors");
        createFunctionAlarm(authorizerFunc, "AuthorizerFunctionErrors");
        createFunctionAlarm(transformerFunc, "TransformerFunctionErrors");
    }

    private void createFunctionAlarm(Function function, String alarmName) {
        Alarm alarm = Alarm.Builder.create(this, alarmName)
                .metric(function.metricErrors(MetricOptions.builder()
                        .period(Duration.minutes(1))
                        .statistic("Sum")
                        .build()))
                .threshold(1.0)
                .evaluationPeriods(1)
                .alarmDescription("Alert when " + function.getFunctionName() + " has errors")
                .build();

        alarm.addAlarmAction(new SnsAction(alertTopic));
        applyTags(alarm);
    }

    private void applyTags(IConstruct construct) {
        tags.forEach((key, value) -> Tags.of(construct).add(key, value.toString()));
    }

    private String capitalize(String str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    public static void main(final String[] args) {
        App app = new App();

        TapStackProps props = TapStackProps.builder()
                .project("TAP")
                .environment("dev")
                .allowedCorsOrigin("https://example.com")
                .build();

        new TapStack(app, "TapStack", props);

        app.synth();
    }
}

// Configuration class for stack properties
class TapStackProps {
    private String project;
    private String environment;
    private String allowedCorsOrigin;

    private TapStackProps(Builder builder) {
        this.project = builder.project;
        this.environment = builder.environment;
        this.allowedCorsOrigin = builder.allowedCorsOrigin;
    }

    public String getProject() {
        return project;
    }

    public String getEnvironment() {
        return environment;
    }

    public String getAllowedCorsOrigin() {
        return allowedCorsOrigin;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String project;
        private String environment;
        private String allowedCorsOrigin;

        public Builder project(String project) {
            this.project = project;
            return this;
        }

        public Builder environment(String environment) {
            this.environment = environment;
            return this;
        }

        public Builder allowedCorsOrigin(String origin) {
            this.allowedCorsOrigin = origin;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(this);
        }
    }
}

// Lambda Handler classes
class ProcessorHandler {
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input) {
        System.out.println("Processing request: " + input.getPath());
        
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withBody("{\"message\": \"Processed successfully\"}")
                .withHeaders(Collections.singletonMap("Content-Type", "application/json"));
    }
}

class AuthorizerHandler {
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input) {
        System.out.println("Authorizing request: " + input.getPath());
        
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withBody("{\"authorized\": true}")
                .withHeaders(Collections.singletonMap("Content-Type", "application/json"));
    }
}

class TransformerHandler {
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input) {
        System.out.println("Transforming request: " + input.getPath());
        
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withBody("{\"transformed\": true}")
                .withHeaders(Collections.singletonMap("Content-Type", "application/json"));
    }
}
```