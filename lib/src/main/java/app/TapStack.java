package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.cloudfront.*;
import software.amazon.awscdk.services.cloudfront.origins.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Tracing;
import software.amazon.awscdk.services.logs.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.applicationinsights.*;
import software.amazon.awscdk.services.wafv2.*;
import software.amazon.awscdk.services.events.targets.*;
import software.amazon.awscdk.services.stepfunctions.*;
import software.amazon.awscdk.services.stepfunctions.tasks.*;
import software.amazon.awscdk.services.sns.*;
import software.constructs.Construct;

import java.util.*;

public class TapStack extends software.amazon.awscdk.Stack {

    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or default to 'dev'
        String suffix = props != null ? props.getEnvironmentSuffix() : null;
        if (suffix == null) {
            suffix = (String) this.getNode().tryGetContext("environmentSuffix");
        }
        if (suffix == null) {
            suffix = "dev";
        }
        this.environmentSuffix = suffix;

        java.util.Map<String, String> tags = new HashMap<>();
        tags.put("Environment", environmentSuffix);
        tags.put("Application", "URLShortener");

        // S3 bucket for analytics data
        Bucket analyticsBucket = Bucket.Builder.create(this, "AnalyticsBucket")
                .bucketName("url-shortener-analytics-" + environmentSuffix + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .versioned(true)
                .lifecycleRules(Arrays.asList(
                    LifecycleRule.builder()
                        .id("TransitionToGlacier")
                        .transitions(Arrays.asList(
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(Duration.days(90))
                                .build()
                        ))
                        .build()
                ))
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        // DynamoDB table for URL storage
        Table urlTable = Table.Builder.create(this, "URLTable")
                .tableName("url-shortener-table-" + environmentSuffix)
                .partitionKey(Attribute.builder()
                        .name("shortId")
                        .type(AttributeType.STRING)
                        .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .timeToLiveAttribute("expiresAt")
                .pointInTimeRecovery(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // SNS Topic for expiration notifications
        Topic expirationTopic = Topic.Builder.create(this, "ExpirationTopic")
                .topicName("url-shortener-expirations-" + environmentSuffix)
                .displayName("URL Expiration Notifications")
                .build();

        // IAM role for main Lambda function
        Role lambdaRole = Role.Builder.create(this, "LambdaRole")
                .roleName("url-shortener-lambda-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                    ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess")
                ))
                .build();

        urlTable.grantReadWriteData(lambdaRole);
        analyticsBucket.grantWrite(lambdaRole);

        // Lambda function for URL shortening
        software.amazon.awscdk.services.lambda.Function urlShortenerFunction = software.amazon.awscdk.services.lambda.Function.Builder.create(this, "URLShortenerFunction")
                .functionName("url-shortener-" + environmentSuffix)
                .runtime(Runtime.JAVA_17)
                .code(Code.fromAsset("lib/lambda-handler"))
                .handler("app.URLShortenerHandler::handleRequest")
                .role(lambdaRole)
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .environment(java.util.Map.of(
                    "TABLE_NAME", urlTable.getTableName(),
                    "ANALYTICS_BUCKET", analyticsBucket.getBucketName()
                ))
                .tracing(Tracing.ACTIVE)
                .logRetention(RetentionDays.ONE_WEEK)
                .build();

        // Lambda function for cleanup operations
        software.amazon.awscdk.services.lambda.Function cleanupFunction = software.amazon.awscdk.services.lambda.Function.Builder.create(this, "CleanupFunction")
                .functionName("url-shortener-cleanup-" + environmentSuffix)
                .runtime(Runtime.JAVA_17)
                .code(Code.fromAsset("lib/cleanup-handler"))
                .handler("app.CleanupHandler::handleRequest")
                .memorySize(512)
                .timeout(Duration.minutes(5))
                .environment(java.util.Map.of(
                    "TABLE_NAME", urlTable.getTableName(),
                    "SNS_TOPIC_ARN", expirationTopic.getTopicArn(),
                    "ANALYTICS_BUCKET", analyticsBucket.getBucketName()
                ))
                .tracing(Tracing.ACTIVE)
                .build();

        urlTable.grantReadWriteData(cleanupFunction);
        expirationTopic.grantPublish(cleanupFunction);
        analyticsBucket.grantWrite(cleanupFunction);

        // Lambda@Edge for click tracking
        Role edgeRole = Role.Builder.create(this, "EdgeRole")
                .roleName("url-shortener-edge-role-" + environmentSuffix)
                .assumedBy(new CompositePrincipal(
                        new ServicePrincipal("lambda.amazonaws.com"),
                        new ServicePrincipal("edgelambda.amazonaws.com")
                    ))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ))
                .build();

        analyticsBucket.grantWrite(edgeRole);

        software.amazon.awscdk.services.lambda.Function edgeFunction = software.amazon.awscdk.services.lambda.Function.Builder.create(this, "EdgeFunction")
                .functionName("url-shortener-edge-" + environmentSuffix)
                .runtime(Runtime.NODEJS_20_X)
                .code(Code.fromAsset("lib/edge-handler"))
                .handler("index.handler")
                .role(edgeRole)
                .memorySize(128)
                .timeout(Duration.seconds(5))
                .build();

        EdgeLambda edgeLambda = EdgeLambda.builder()
                .functionVersion(edgeFunction.getCurrentVersion())
                .eventType(LambdaEdgeEventType.VIEWER_REQUEST)
                .build();

        // Step Functions state machine for cleanup workflow
        LambdaInvoke cleanupTask = LambdaInvoke.Builder.create(this, "CleanupTask")
                .lambdaFunction(cleanupFunction)
                .outputPath("$.Payload")
                .build();

        Pass successState = Pass.Builder.create(this, "SuccessState")
                .result(Result.fromObject(java.util.Map.of("status", "completed")))
                .build();

        StateMachine cleanupStateMachine = StateMachine.Builder.create(this, "CleanupStateMachine")
                .stateMachineName("url-shortener-cleanup-" + environmentSuffix)
                .definition(cleanupTask.next(successState))
                .stateMachineType(StateMachineType.EXPRESS)
                .logs(LogOptions.builder()
                        .destination(new LogGroup(this, "StateMachineLogGroup",
                            software.amazon.awscdk.services.logs.LogGroupProps.builder()
                                .logGroupName("/aws/vendedlogs/states/url-shortener-cleanup-" + environmentSuffix)
                                .retention(RetentionDays.ONE_WEEK)
                                .build()))
                        .level(LogLevel.ALL)
                        .build())
                .build();

        // EventBridge scheduled rule
        software.amazon.awscdk.services.events.Rule cleanupRule = software.amazon.awscdk.services.events.Rule.Builder.create(this, "CleanupSchedule")
                .ruleName("url-shortener-cleanup-schedule-" + environmentSuffix)
                .schedule(software.amazon.awscdk.services.events.Schedule.rate(Duration.hours(6)))
                .description("Triggers cleanup of expired URLs every 6 hours")
                .build();

        cleanupRule.addTarget(SfnStateMachine.Builder.create(cleanupStateMachine)
                .build());

        // API Gateway
        RestApi api = RestApi.Builder.create(this, "URLShortenerAPI")
                .restApiName("url-shortener-api-" + environmentSuffix)
                .description("URL Shortener API")
                .deployOptions(StageOptions.builder()
                    .stageName(environmentSuffix)
                    .tracingEnabled(true)
                    .metricsEnabled(true)
                    .loggingLevel(MethodLoggingLevel.INFO)
                    .dataTraceEnabled(true)
                    .build())
                .build();

        LambdaIntegration lambdaIntegration = LambdaIntegration.Builder.create(urlShortenerFunction)
                .proxy(false)
                .integrationResponses(Arrays.asList(
                    IntegrationResponse.builder()
                        .statusCode("200")
                        .responseTemplates(java.util.Map.of(
                            "application/json", "$input.json('$')"
                        ))
                        .build()
                ))
                .build();

        // POST /shorten endpoint
        software.amazon.awscdk.services.apigateway.Resource shortenResource = api.getRoot().addResource("shorten");
        shortenResource.addMethod("POST", lambdaIntegration,
            MethodOptions.builder()
                .methodResponses(Arrays.asList(
                    MethodResponse.builder()
                        .statusCode("200")
                        .build()
                ))
                .build());

        // GET /{shortId} endpoint
        software.amazon.awscdk.services.apigateway.Resource shortIdResource = api.getRoot().addResource("{shortId}");
        shortIdResource.addMethod("GET", lambdaIntegration,
            MethodOptions.builder()
                .requestParameters(java.util.Map.of(
                    "method.request.path.shortId", true
                ))
                .methodResponses(Arrays.asList(
                    MethodResponse.builder()
                        .statusCode("301")
                        .responseParameters(java.util.Map.of(
                            "method.response.header.Location", true
                        ))
                        .build()
                ))
                .build());

        // AWS WAF WebACL for API Gateway
        CfnWebACL webAcl = CfnWebACL.Builder.create(this, "APIGatewayWAF")
                .name("url-shortener-waf-" + environmentSuffix)
                .scope("REGIONAL")
                .defaultAction(CfnWebACL.DefaultActionProperty.builder()
                        .allow(CfnWebACL.AllowActionProperty.builder().build())
                        .build())
                .rules(Arrays.asList(
                        CfnWebACL.RuleProperty.builder()
                                .name("RateLimitRule")
                                .priority(1)
                                .statement(CfnWebACL.StatementProperty.builder()
                                        .rateBasedStatement(CfnWebACL.RateBasedStatementProperty.builder()
                                                .limit(100)
                                                .aggregateKeyType("IP")
                                                .evaluationWindowSec(300)
                                                .build())
                                        .build())
                                .action(CfnWebACL.RuleActionProperty.builder()
                                        .block(CfnWebACL.BlockActionProperty.builder()
                                                .customResponse(CfnWebACL.CustomResponseProperty.builder()
                                                        .responseCode(429)
                                                        .build())
                                                .build())
                                        .build())
                                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                                        .sampledRequestsEnabled(true)
                                        .cloudWatchMetricsEnabled(true)
                                        .metricName("RateLimitRule")
                                        .build())
                                .build(),
                        CfnWebACL.RuleProperty.builder()
                                .name("GeoBlockRule")
                                .priority(2)
                                .statement(CfnWebACL.StatementProperty.builder()
                                        .geoMatchStatement(CfnWebACL.GeoMatchStatementProperty.builder()
                                                .countryCodes(Arrays.asList("CN", "RU", "KP", "IR"))
                                                .build())
                                        .build())
                                .action(CfnWebACL.RuleActionProperty.builder()
                                        .block(CfnWebACL.BlockActionProperty.builder().build())
                                        .build())
                                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                                        .sampledRequestsEnabled(true)
                                        .cloudWatchMetricsEnabled(true)
                                        .metricName("GeoBlockRule")
                                        .build())
                                .build()))
                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                        .sampledRequestsEnabled(true)
                        .cloudWatchMetricsEnabled(true)
                        .metricName("APIGatewayWAF")
                        .build())
                .build();

        // Associate WAF with API Gateway
        CfnWebACLAssociation wafAssociation = CfnWebACLAssociation.Builder.create(this, "APIGatewayWAFAssociation")
                .resourceArn(api.getDeploymentStage().getStageArn())
                .webAclArn(webAcl.getAttrArn())
                .build();

        // CloudFront distribution
        software.amazon.awscdk.services.cloudfront.Distribution distribution = software.amazon.awscdk.services.cloudfront.Distribution.Builder.create(this, "URLShortenerDistribution")
                .comment("URL Shortener CloudFront Distribution " + environmentSuffix)
                .defaultBehavior(BehaviorOptions.builder()
                    .origin(new HttpOrigin(api.getUrl().replace("https://", "").replace("/", "")))
                    .allowedMethods(AllowedMethods.ALLOW_ALL)
                    .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                    .cachePolicy(CachePolicy.Builder.create(this, "URLShortenerCachePolicy")
                        .cachePolicyName("url-shortener-cache-policy-" + environmentSuffix)
                        .defaultTtl(Duration.hours(1))
                        .maxTtl(Duration.hours(24))
                        .minTtl(Duration.seconds(0))
                        .build())
                    .edgeLambdas(Arrays.asList(edgeLambda))
                    .build())
                .errorResponses(Arrays.asList(
                    ErrorResponse.builder()
                        .httpStatus(404)
                        .responseHttpStatus(404)
                        .responsePagePath("/404.html")
                        .ttl(Duration.minutes(5))
                        .build()
                ))
                .build();

        // CloudWatch Dashboard
        Dashboard dashboard = Dashboard.Builder.create(this, "URLShortenerDashboard")
                .dashboardName("url-shortener-" + environmentSuffix)
                .widgets(Arrays.asList(Arrays.asList(
                    GraphWidget.Builder.create()
                        .title("API Requests")
                        .left(Arrays.asList(
                            Metric.Builder.create()
                                .namespace("AWS/ApiGateway")
                                .metricName("Count")
                                .dimensionsMap(java.util.Map.of(
                                    "ApiName", api.getRestApiName(),
                                    "Stage", environmentSuffix
                                ))
                                .statistic("Sum")
                                .build()
                        ))
                        .build(),
                    GraphWidget.Builder.create()
                        .title("Lambda Invocations")
                        .left(Arrays.asList(
                            Metric.Builder.create()
                                .namespace("AWS/Lambda")
                                .metricName("Invocations")
                                .dimensionsMap(java.util.Map.of(
                                    "FunctionName", urlShortenerFunction.getFunctionName()
                                ))
                                .statistic("Sum")
                                .build()
                        ))
                        .build(),
                    GraphWidget.Builder.create()
                        .title("DynamoDB Throttles")
                        .left(Arrays.asList(
                            Metric.Builder.create()
                                .namespace("AWS/DynamoDB")
                                .metricName("UserErrors")
                                .dimensionsMap(java.util.Map.of(
                                    "TableName", urlTable.getTableName()
                                ))
                                .statistic("Sum")
                                .build()
                        ))
                        .build(),
                    GraphWidget.Builder.create()
                        .title("CloudFront Cache Hit Rate")
                        .left(Arrays.asList(
                            Metric.Builder.create()
                                .namespace("AWS/CloudFront")
                                .metricName("CacheHitRate")
                                .dimensionsMap(java.util.Map.of(
                                    "DistributionId", distribution.getDistributionId()
                                ))
                                .statistic("Average")
                                .build()
                        ))
                        .build()
                )))
                .build();

        // Application Insights
        CfnApplication appInsights = CfnApplication.Builder.create(this, "URLShortenerAppInsights")
                .resourceGroupName("url-shortener-rg-" + environmentSuffix)
                .componentMonitoringSettings(Arrays.asList(
                    CfnApplication.ComponentMonitoringSettingProperty.builder()
                        .componentConfigurationMode("DEFAULT")
                        .componentName(urlShortenerFunction.getFunctionName())
                        .tier("DEFAULT")
                        .build()
                ))
                .build();

        // Apply tags to all resources
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Application", "URLShortener");

        // Outputs
        new CfnOutput(this, "APIEndpoint", CfnOutputProps.builder()
                .value(api.getUrl())
                .description("API Gateway endpoint URL")
                .build());

        new CfnOutput(this, "CloudFrontURL", CfnOutputProps.builder()
                .value("https://" + distribution.getDistributionDomainName())
                .description("CloudFront distribution URL")
                .build());
    }

    /**
     * Get the environment suffix for this stack.
     *
     * @return the environment suffix (e.g., "dev", "staging", "prod")
     */
    public String getEnvironmentSuffix() {
        return this.environmentSuffix;
    }
}