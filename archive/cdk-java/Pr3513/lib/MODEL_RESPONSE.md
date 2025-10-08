Based on the requirements, here's the complete AWS CDK infrastructure code in Java for the URL shortener service:

```java
// File: lib/src/main/java/app/TapStack.java
package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.cloudfront.*;
import software.amazon.awscdk.services.cloudfront.origins.*;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.applicationinsights.*;
import software.amazon.awscdk.services.wafv2.*;
import software.amazon.awscdk.services.events.*;
import software.amazon.awscdk.services.events.targets.*;
import software.amazon.awscdk.services.stepfunctions.*;
import software.amazon.awscdk.services.stepfunctions.tasks.*;
import software.amazon.awscdk.services.sns.*;
import software.constructs.Construct;

import java.util.*;

public class TapStack extends Stack {

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        String environmentSuffix = props != null ? props.getEnvironmentSuffix() : "dev";

        Map<String, String> tags = new HashMap<>();
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
        Function urlShortenerFunction = Function.Builder.create(this, "URLShortenerFunction")
                .functionName("url-shortener-" + environmentSuffix)
                .runtime(Runtime.JAVA_17)
                .code(Code.fromAsset("lib/lambda-handler"))
                .handler("app.URLShortenerHandler::handleRequest")
                .role(lambdaRole)
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .environment(Map.of(
                    "TABLE_NAME", urlTable.getTableName(),
                    "ANALYTICS_BUCKET", analyticsBucket.getBucketName()
                ))
                .tracing(Tracing.ACTIVE)
                .logRetention(RetentionDays.ONE_WEEK)
                .build();

        // Lambda function for cleanup operations
        Function cleanupFunction = Function.Builder.create(this, "CleanupFunction")
                .functionName("url-shortener-cleanup-" + environmentSuffix)
                .runtime(Runtime.JAVA_17)
                .code(Code.fromAsset("lib/cleanup-handler"))
                .handler("app.CleanupHandler::handleRequest")
                .memorySize(512)
                .timeout(Duration.minutes(5))
                .environment(Map.of(
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
                .assumedBy(CompositePrincipal.Builder.create()
                    .addPrincipals(
                        new ServicePrincipal("lambda.amazonaws.com"),
                        new ServicePrincipal("edgelambda.amazonaws.com")
                    )
                    .build())
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ))
                .build();

        analyticsBucket.grantWrite(edgeRole);

        Function edgeFunction = Function.Builder.create(this, "EdgeFunction")
                .functionName("url-shortener-edge-" + environmentSuffix)
                .runtime(Runtime.NODEJS_20_X)
                .code(Code.fromAsset("lib/edge-handler"))
                .handler("index.handler")
                .role(edgeRole)
                .memorySize(128)
                .timeout(Duration.seconds(5))
                .environment(Map.of(
                    "ANALYTICS_BUCKET", analyticsBucket.getBucketName()
                ))
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
                .result(Result.fromObject(Map.of("status", "completed")))
                .build();

        StateMachine cleanupStateMachine = StateMachine.Builder.create(this, "CleanupStateMachine")
                .stateMachineName("url-shortener-cleanup-" + environmentSuffix)
                .definition(cleanupTask.next(successState))
                .stateMachineType(StateMachineType.EXPRESS)
                .logs(LogOptions.builder()
                        .destination(new LogGroup(this, "StateMachineLogGroup",
                            LogGroupProps.builder()
                                .logGroupName("/aws/vendedlogs/states/url-shortener-cleanup-" + environmentSuffix)
                                .retention(RetentionDays.ONE_WEEK)
                                .build()))
                        .level(LogLevel.ALL)
                        .build())
                .build();

        // EventBridge scheduled rule
        Rule cleanupRule = Rule.Builder.create(this, "CleanupSchedule")
                .ruleName("url-shortener-cleanup-schedule-" + environmentSuffix)
                .schedule(Schedule.rate(Duration.hours(6)))
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
                        .responseTemplates(Map.of(
                            "application/json", "$input.json('$')"
                        ))
                        .build()
                ))
                .build();

        // POST /shorten endpoint
        Resource shortenResource = api.getRoot().addResource("shorten");
        shortenResource.addMethod("POST", lambdaIntegration,
            MethodOptions.builder()
                .methodResponses(Arrays.asList(
                    MethodResponse.builder()
                        .statusCode("200")
                        .build()
                ))
                .build());

        // GET /{shortId} endpoint
        Resource shortIdResource = api.getRoot().addResource("{shortId}");
        shortIdResource.addMethod("GET", lambdaIntegration,
            MethodOptions.builder()
                .requestParameters(Map.of(
                    "method.request.path.shortId", true
                ))
                .methodResponses(Arrays.asList(
                    MethodResponse.builder()
                        .statusCode("301")
                        .responseParameters(Map.of(
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
        Distribution distribution = Distribution.Builder.create(this, "URLShortenerDistribution")
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
                                .dimensionsMap(Map.of(
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
                                .dimensionsMap(Map.of(
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
                                .dimensionsMap(Map.of(
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
                                .dimensionsMap(Map.of(
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
}
```

```java
// File: lib/lambda-handler/app/URLShortenerHandler.java
package app;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;

public class URLShortenerHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final DynamoDbClient dynamoDb;
    private final S3Client s3;
    private final String tableName;
    private final String bucketName;
    private final ObjectMapper objectMapper;

    public URLShortenerHandler() {
        this.dynamoDb = DynamoDbClient.create();
        this.s3 = S3Client.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.bucketName = System.getenv("ANALYTICS_BUCKET");
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setHeaders(Map.of(
            "Content-Type", "application/json",
            "Access-Control-Allow-Origin", "*"
        ));

        try {
            String httpMethod = request.getHttpMethod();

            if ("POST".equals(httpMethod)) {
                return handleCreateShortUrl(request, context);
            } else if ("GET".equals(httpMethod)) {
                return handleRedirect(request, context);
            } else {
                response.setStatusCode(405);
                response.setBody("{\"error\":\"Method not allowed\"}");
            }
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            response.setStatusCode(500);
            response.setBody("{\"error\":\"Internal server error\"}");
        }

        return response;
    }

    private APIGatewayProxyResponseEvent handleCreateShortUrl(APIGatewayProxyRequestEvent request, Context context) throws Exception {
        Subsegment subsegment = AWSXRay.beginSubsegment("CreateShortUrl");
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setHeaders(Map.of(
            "Content-Type", "application/json",
            "Access-Control-Allow-Origin", "*"
        ));

        try {
            JsonNode body = objectMapper.readTree(request.getBody());
            String longUrl = body.get("url").asText();

            if (longUrl == null || longUrl.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"error\":\"URL is required\"}");
                return response;
            }

            String shortId = generateShortId(longUrl);
            long expiresAt = Instant.now().plus(30, ChronoUnit.DAYS).getEpochSecond();

            Map<String, AttributeValue> item = new HashMap<>();
            item.put("shortId", AttributeValue.builder().s(shortId).build());
            item.put("longUrl", AttributeValue.builder().s(longUrl).build());
            item.put("createdAt", AttributeValue.builder().n(String.valueOf(Instant.now().getEpochSecond())).build());
            item.put("expiresAt", AttributeValue.builder().n(String.valueOf(expiresAt)).build());
            item.put("clicks", AttributeValue.builder().n("0").build());

            PutItemRequest putRequest = PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .conditionExpression("attribute_not_exists(shortId)")
                .build();

            try {
                dynamoDb.putItem(putRequest);
            } catch (ConditionalCheckFailedException e) {
                // Short ID already exists, use existing
            }

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("shortId", shortId);
            responseBody.put("shortUrl", "https://" + request.getHeaders().get("Host") + "/" + shortId);

            response.setStatusCode(200);
            response.setBody(objectMapper.writeValueAsString(responseBody));

        } finally {
            AWSXRay.endSubsegment();
        }

        return response;
    }

    private APIGatewayProxyResponseEvent handleRedirect(APIGatewayProxyRequestEvent request, Context context) throws Exception {
        Subsegment subsegment = AWSXRay.beginSubsegment("HandleRedirect");
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();

        try {
            String shortId = request.getPathParameters().get("shortId");

            if (shortId == null || shortId.isEmpty()) {
                response.setStatusCode(400);
                response.setBody("{\"error\":\"Short ID is required\"}");
                return response;
            }

            GetItemRequest getRequest = GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("shortId", AttributeValue.builder().s(shortId).build()))
                .build();

            GetItemResponse getResponse = dynamoDb.getItem(getRequest);

            if (!getResponse.hasItem()) {
                response.setStatusCode(404);
                response.setBody("{\"error\":\"URL not found\"}");
                return response;
            }

            String longUrl = getResponse.item().get("longUrl").s();

            // Update click count
            UpdateItemRequest updateRequest = UpdateItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("shortId", AttributeValue.builder().s(shortId).build()))
                .updateExpression("ADD clicks :inc")
                .expressionAttributeValues(Map.of(":inc", AttributeValue.builder().n("1").build()))
                .build();

            dynamoDb.updateItem(updateRequest);

            // Log analytics
            logAnalytics(shortId, request);

            response.setStatusCode(301);
            response.setHeaders(Map.of(
                "Location", longUrl,
                "Cache-Control", "public, max-age=3600"
            ));

        } finally {
            AWSXRay.endSubsegment();
        }

        return response;
    }

    private String generateShortId(String url) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(url.getBytes(StandardCharsets.UTF_8));
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        return encoded.substring(0, 8);
    }

    private void logAnalytics(String shortId, APIGatewayProxyRequestEvent request) {
        try {
            Map<String, Object> analytics = new HashMap<>();
            analytics.put("shortId", shortId);
            analytics.put("timestamp", Instant.now().toString());
            analytics.put("userAgent", request.getHeaders().get("User-Agent"));
            analytics.put("ip", request.getRequestContext().getIdentity().getSourceIp());

            String key = "analytics/" + Instant.now().toString().substring(0, 10) + "/" + shortId + "-" + System.currentTimeMillis() + ".json";

            PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("application/json")
                .build();

            s3.putObject(putRequest, RequestBody.fromString(objectMapper.writeValueAsString(analytics)));
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to log analytics: " + e.getMessage());
        }
    }
}
```

```java
// File: lib/cleanup-handler/app/CleanupHandler.java
package app;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

public class CleanupHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private final DynamoDbClient dynamoDb;
    private final SnsClient sns;
    private final S3Client s3;
    private final String tableName;
    private final String topicArn;
    private final String bucketName;
    private final ObjectMapper objectMapper;

    public CleanupHandler() {
        this.dynamoDb = DynamoDbClient.create();
        this.sns = SnsClient.create();
        this.s3 = S3Client.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.topicArn = System.getenv("SNS_TOPIC_ARN");
        this.bucketName = System.getenv("ANALYTICS_BUCKET");
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Subsegment subsegment = AWSXRay.beginSubsegment("CleanupProcess");
        Map<String, Object> response = new HashMap<>();
        List<String> deletedUrls = new ArrayList<>();
        int totalDeleted = 0;

        try {
            long currentTime = Instant.now().getEpochSecond();

            // Scan for expired URLs
            Map<String, AttributeValue> expressionValues = new HashMap<>();
            expressionValues.put(":now", AttributeValue.builder().n(String.valueOf(currentTime)).build());

            ScanRequest scanRequest = ScanRequest.builder()
                    .tableName(tableName)
                    .filterExpression("expiresAt < :now")
                    .expressionAttributeValues(expressionValues)
                    .projectionExpression("shortId, longUrl, clicks")
                    .build();

            ScanResponse scanResponse;
            String lastEvaluatedKey = null;

            do {
                if (lastEvaluatedKey != null) {
                    scanRequest = scanRequest.toBuilder()
                            .exclusiveStartKey(Map.of("shortId", AttributeValue.builder().s(lastEvaluatedKey).build()))
                            .build();
                }

                scanResponse = dynamoDb.scan(scanRequest);

                for (Map<String, AttributeValue> item : scanResponse.items()) {
                    String shortId = item.get("shortId").s();
                    String longUrl = item.get("longUrl").s();
                    String clicks = item.getOrDefault("clicks", AttributeValue.builder().n("0").build()).n();

                    // Archive analytics before deletion
                    archiveUrlData(shortId, longUrl, clicks);

                    // Delete from DynamoDB
                    DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                            .tableName(tableName)
                            .key(Map.of("shortId", AttributeValue.builder().s(shortId).build()))
                            .build();

                    dynamoDb.deleteItem(deleteRequest);
                    deletedUrls.add(shortId);
                    totalDeleted++;

                    // Send individual notifications for first 5 deletions
                    if (totalDeleted <= 5) {
                        sendExpirationNotification(shortId, longUrl, clicks);
                    }
                }

                lastEvaluatedKey = scanResponse.hasLastEvaluatedKey() ?
                        scanResponse.lastEvaluatedKey().get("shortId").s() : null;

            } while (scanResponse.hasLastEvaluatedKey());

            // Send summary notification if more than 5 URLs deleted
            if (totalDeleted > 5) {
                sendSummaryNotification(totalDeleted, deletedUrls);
            }

            response.put("success", true);
            response.put("deletedCount", totalDeleted);
            response.put("deletedUrls", deletedUrls.stream().limit(10).collect(Collectors.toList()));

        } catch (Exception e) {
            context.getLogger().log("Cleanup error: " + e.getMessage());
            AWSXRay.getCurrentSegment().addException(e);

            response.put("success", false);
            response.put("error", e.getMessage());

        } finally {
            AWSXRay.endSubsegment();
        }

        return response;
    }

    private void archiveUrlData(String shortId, String longUrl, String clicks) {
        try {
            Map<String, Object> archiveData = new HashMap<>();
            archiveData.put("shortId", shortId);
            archiveData.put("longUrl", longUrl);
            archiveData.put("totalClicks", Integer.parseInt(clicks));
            archiveData.put("archivedAt", Instant.now().toString());
            archiveData.put("reason", "expired");

            String key = "archive/" + Instant.now().toString().substring(0, 10) + "/" + shortId + ".json";

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType("application/json")
                    .build();

            s3.putObject(putRequest, RequestBody.fromString(objectMapper.writeValueAsString(archiveData)));

        } catch (Exception e) {
            // Log but don't fail the cleanup
            AWSXRay.getCurrentSegment().addException(e);
        }
    }

    private void sendExpirationNotification(String shortId, String longUrl, String clicks) {
        try {
            String message = String.format(
                    "URL Expired and Deleted\n\n" +
                    "Short ID: %s\n" +
                    "Original URL: %s\n" +
                    "Total Clicks: %s\n" +
                    "Deleted at: %s\n\n" +
                    "This URL has been permanently removed from the system and archived.",
                    shortId, longUrl, clicks, Instant.now().toString()
            );

            PublishRequest publishRequest = PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject("URL Expiration - " + shortId)
                    .message(message)
                    .build();

            sns.publish(publishRequest);

        } catch (Exception e) {
            // Log but don't fail
            AWSXRay.getCurrentSegment().addException(e);
        }
    }

    private void sendSummaryNotification(int totalDeleted, List<String> deletedUrls) {
        try {
            String urlList = deletedUrls.stream()
                    .limit(20)
                    .collect(Collectors.joining("\n  - ", "  - ", ""));

            String message = String.format(
                    "Bulk URL Cleanup Summary\n\n" +
                    "Total URLs Deleted: %d\n" +
                    "Cleanup Time: %s\n\n" +
                    "First 20 Deleted Short IDs:\n%s\n\n" +
                    "All expired URLs have been archived to S3 and removed from DynamoDB.",
                    totalDeleted, Instant.now().toString(), urlList
            );

            PublishRequest publishRequest = PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject("URL Cleanup Summary Report")
                    .message(message)
                    .build();

            sns.publish(publishRequest);

        } catch (Exception e) {
            AWSXRay.getCurrentSegment().addException(e);
        }
    }
}
```

```xml
// File: lib/cleanup-handler/pom.xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>app</groupId>
    <artifactId>url-shortener-cleanup</artifactId>
    <version>1.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-lambda-java-core</artifactId>
            <version>1.2.3</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>dynamodb</artifactId>
            <version>2.21.26</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>sns</artifactId>
            <version>2.21.26</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>s3</artifactId>
            <version>2.21.26</version>
        </dependency>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-xray-recorder-sdk-core</artifactId>
            <version>2.14.0</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.15.3</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.1</version>
                <configuration>
                    <createDependencyReducedPom>false</createDependencyReducedPom>
                </configuration>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

```javascript
// File: lib/edge-handler/index.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    try {
        // Extract geographic information from CloudFront headers
        const country = headers['cloudfront-viewer-country'] ? headers['cloudfront-viewer-country'][0].value : 'unknown';
        const city = headers['cloudfront-viewer-city'] ? headers['cloudfront-viewer-city'][0].value : 'unknown';
        const timeZone = headers['cloudfront-viewer-time-zone'] ? headers['cloudfront-viewer-time-zone'][0].value : 'unknown';

        // Extract device information
        const isMobile = headers['cloudfront-is-mobile-viewer'] ? headers['cloudfront-is-mobile-viewer'][0].value === 'true' : false;
        const isDesktop = headers['cloudfront-is-desktop-viewer'] ? headers['cloudfront-is-desktop-viewer'][0].value === 'true' : false;
        const isTablet = headers['cloudfront-is-tablet-viewer'] ? headers['cloudfront-is-tablet-viewer'][0].value === 'true' : false;

        // Prepare analytics data
        const analyticsData = {
            timestamp: new Date().toISOString(),
            uri: request.uri,
            country: country,
            city: city,
            timeZone: timeZone,
            device: {
                isMobile: isMobile,
                isDesktop: isDesktop,
                isTablet: isTablet
            },
            userAgent: headers['user-agent'] ? headers['user-agent'][0].value : 'unknown',
            referer: headers['referer'] ? headers['referer'][0].value : 'direct'
        };

        // Asynchronously write to S3 (don't wait for completion)
        const bucketName = process.env.ANALYTICS_BUCKET;
        if (bucketName) {
            const key = `edge-analytics/${new Date().toISOString().substring(0, 10)}/${Date.now()}-${Math.random().toString(36).substring(7)}.json`;

            s3.putObject({
                Bucket: bucketName,
                Key: key,
                Body: JSON.stringify(analyticsData),
                ContentType: 'application/json'
            }).promise().catch(err => {
                console.error('Failed to write analytics:', err);
            });
        }

        // Add custom headers for downstream processing
        request.headers['x-viewer-country'] = [{
            key: 'X-Viewer-Country',
            value: country
        }];

        request.headers['x-viewer-city'] = [{
            key: 'X-Viewer-City',
            value: city
        }];

    } catch (error) {
        console.error('Error in edge function:', error);
        // Don't fail the request on error
    }

    return request;
};
```

```xml
// File: lib/lambda-handler/pom.xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>app</groupId>
    <artifactId>url-shortener-lambda</artifactId>
    <version>1.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-lambda-java-core</artifactId>
            <version>1.2.3</version>
        </dependency>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-lambda-java-events</artifactId>
            <version>3.11.3</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>dynamodb</artifactId>
            <version>2.21.26</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>s3</artifactId>
            <version>2.21.26</version>
        </dependency>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-xray-recorder-sdk-core</artifactId>
            <version>2.14.0</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.15.3</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.1</version>
                <configuration>
                    <createDependencyReducedPom>false</createDependencyReducedPom>
                </configuration>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

```json
// File: lib/edge-handler/package.json
{
  "name": "url-shortener-edge-handler",
  "version": "1.0.0",
  "description": "Lambda@Edge function for URL shortener click tracking",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1490.0"
  }
}
```