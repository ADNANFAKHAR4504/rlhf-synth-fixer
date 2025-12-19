package app;

import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.apigateway.LambdaIntegration;
import software.amazon.awscdk.services.apigateway.MethodLoggingLevel;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.AlarmProps;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.GlobalSecondaryIndexProps;
import software.amazon.awscdk.services.dynamodb.ProjectionType;
import software.amazon.awscdk.services.dynamodb.StreamViewType;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.iam.CompositePrincipal;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Tracing;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.s3.Transition;
import software.amazon.awscdk.services.wafv2.CfnWebACL;
import software.amazon.awscdk.services.wafv2.CfnWebACLAssociation;
import software.amazon.awscdk.services.wafv2.CfnWebACLAssociationProps;
import software.amazon.awscdk.services.events.targets.SfnStateMachine;
import software.amazon.awscdk.services.stepfunctions.IChainable;
import software.amazon.awscdk.services.stepfunctions.LogLevel;
import software.amazon.awscdk.services.stepfunctions.LogOptions;
import software.amazon.awscdk.services.stepfunctions.StateMachine;
import software.amazon.awscdk.services.stepfunctions.TaskInput;
import software.amazon.awscdk.services.stepfunctions.tasks.LambdaInvoke;
import software.amazon.awscdk.services.stepfunctions.tasks.LambdaInvokeProps;
import software.amazon.awscdk.services.stepfunctions.tasks.SnsPublish;
import software.amazon.awscdk.services.stepfunctions.tasks.SnsPublishProps;
import software.amazon.awscdk.services.sns.Topic;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Map;

/**
 * TapStack defines the AWS infrastructure for a URL Shortener application.
 */
public class TapStack extends software.amazon.awscdk.Stack {

    private final String environmentSuffix;
    private Role lambdaRole;
    private Table urlTable;
    private Bucket analyticsBucket;
    private software.amazon.awscdk.services.lambda.Function urlShortenerFunction;
    private software.amazon.awscdk.services.lambda.Function cleanupFunction;
    private RestApi api;
    private CfnWebACL webAcl;

    /**
     * Constructor for TapStack.
     * @param scope scope
     * @param id id
     * @param props props
     */
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

        // Setup infrastructure components
        setupIamRoles();
        setupDatabase();
        setupStorage();
        setupLambdaFunctions();
        setupApiGateway();
        setupWaf();
        setupMonitoring();
        setupCleanupWorkflow();
        setupTagsAndOutputs();
    }

    private void setupIamRoles() {
        lambdaRole = Role.Builder.create(this, "LambdaExecutionRole")
                .assumedBy(new CompositePrincipal(
                        new ServicePrincipal("lambda.amazonaws.com"),
                        new ServicePrincipal("edgelambda.amazonaws.com")
                ))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName(
                            "service-role/AWSLambdaBasicExecutionRole"),
                        ManagedPolicy.fromAwsManagedPolicyName(
                            "AWSXRayDaemonWriteAccess")
                ))
                .build();
    }

    private void setupDatabase() {
        urlTable = Table.Builder.create(this, "URLTable")
                .partitionKey(Attribute.builder()
                        .name("shortCode")
                        .type(AttributeType.STRING)
                        .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .pointInTimeRecovery(true)
                .timeToLiveAttribute("expirationTime")
                .stream(StreamViewType.NEW_AND_OLD_IMAGES)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        urlTable.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("OriginalUrlIndex")
                .partitionKey(Attribute.builder()
                        .name("originalUrl")
                        .type(AttributeType.STRING)
                        .build())
                .projectionType(ProjectionType.ALL)
                .build());

        urlTable.grantReadWriteData(lambdaRole);
    }

    private void setupStorage() {
        analyticsBucket = Bucket.Builder.create(this, "AnalyticsBucket")
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
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .build();

        analyticsBucket.grantWrite(lambdaRole);
    }

    private void setupLambdaFunctions() {
        urlShortenerFunction =
            software.amazon.awscdk.services.lambda.Function.Builder
                .create(this, "URLShortenerFunction")
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

        cleanupFunction =
            software.amazon.awscdk.services.lambda.Function.Builder
                .create(this, "CleanupFunction")
                .runtime(Runtime.JAVA_17)
                .code(Code.fromAsset("lib/cleanup-handler"))
                .handler("app.CleanupHandler::handleRequest")
                .memorySize(512)
                .timeout(Duration.seconds(60))
                .environment(Map.of(
                    "TABLE_NAME", urlTable.getTableName(),
                    "ANALYTICS_BUCKET", analyticsBucket.getBucketName()
                ))
                .tracing(Tracing.ACTIVE)
                .logRetention(RetentionDays.ONE_WEEK)
                .build();

        urlTable.grantReadWriteData(urlShortenerFunction);
        urlTable.grantReadWriteData(cleanupFunction);
        analyticsBucket.grantReadWrite(cleanupFunction);
    }

    private void setupApiGateway() {
        api = RestApi.Builder.create(this, "URLShortenerAPI")
                .deployOptions(StageOptions.builder()
                    .stageName(environmentSuffix)
                    .tracingEnabled(true)
                        .dataTraceEnabled(true)
                        .loggingLevel(MethodLoggingLevel.INFO)
                    .metricsEnabled(true)
                        .build())
                .defaultCorsPreflightOptions(CorsOptions.builder()
                        .allowOrigins(Arrays.asList("*"))
                        .allowMethods(Arrays.asList("GET", "POST", "PUT", "DELETE",
                            "OPTIONS"))
                    .build())
                .build();

        LambdaIntegration shortenerIntegration =
            new LambdaIntegration(urlShortenerFunction);

        software.amazon.awscdk.services.apigateway.Resource urlResource =
            api.getRoot().addResource("url");
        urlResource.addMethod("POST", shortenerIntegration);

        software.amazon.awscdk.services.apigateway.Resource shortCodeResource =
            urlResource.addResource("{shortCode}");
        shortCodeResource.addMethod("GET", shortenerIntegration);
        shortCodeResource.addMethod("DELETE", shortenerIntegration);
    }

    private void setupWaf() {
        webAcl = CfnWebACL.Builder.create(this, "APIWebACL")
                .scope("REGIONAL")
                .defaultAction(CfnWebACL.DefaultActionProperty.builder()
                        .allow(CfnWebACL.AllowActionProperty.builder().build())
                        .build())
                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                        .sampledRequestsEnabled(true)
                        .cloudWatchMetricsEnabled(true)
                        .metricName("URLShortenerWAF")
                        .build())
                .rules(Arrays.asList(
                        CfnWebACL.RuleProperty.builder()
                                .name("RateLimitRule")
                                .priority(1)
                        .action(CfnWebACL.RuleActionProperty.builder()
                                .block(CfnWebACL.BlockActionProperty.builder().build())
                                .build())
                                .statement(CfnWebACL.StatementProperty.builder()
                                .rateBasedStatement(
                                    CfnWebACL.RateBasedStatementProperty.builder()
                                        .limit(2000)
                                                .aggregateKeyType("IP")
                                                .build())
                                        .build())
                                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                                        .sampledRequestsEnabled(true)
                                        .cloudWatchMetricsEnabled(true)
                                        .metricName("RateLimitRule")
                                        .build())
                        .build()
                ))
                .build();

        new CfnWebACLAssociation(this, "WebACLAssociation",
            CfnWebACLAssociationProps.builder()
                .resourceArn(api.getDeploymentStage().getStageArn())
                .webAclArn(webAcl.getAttrArn())
                .build());
    }

    private void setupMonitoring() {
        // CloudWatch alarms for Lambda function monitoring
        new Alarm(this, "HighErrorRateAlarm", AlarmProps.builder()
                .metric(urlShortenerFunction.metricErrors())
                .threshold(10)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .build());

        new Alarm(this, "HighLatencyAlarm", AlarmProps.builder()
                .metric(urlShortenerFunction.metricDuration())
                .threshold(1000)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .build());
    }

    private void setupCleanupWorkflow() {
        Topic expirationTopic = Topic.Builder.create(this, "ExpirationTopic")
                .displayName("URL Expiration Notifications")
                .build();

        LambdaInvoke scanTask = new LambdaInvoke(this, "ScanExpiredURLs",
            LambdaInvokeProps.builder()
                .lambdaFunction(cleanupFunction)
                .outputPath("$.Payload")
                .build());

        SnsPublish notifyTask = new SnsPublish(this, "NotifyExpiration",
            SnsPublishProps.builder()
                .topic(expirationTopic)
                .message(TaskInput.fromText("URLs cleaned up"))
                .build());

        IChainable definition = scanTask.next(notifyTask);

        StateMachine cleanupStateMachine =
            StateMachine.Builder.create(this, "CleanupStateMachine")
                .definition(definition)
                .logs(LogOptions.builder()
                        .destination(new LogGroup(this, "StateMachineLogGroup",
                            software.amazon.awscdk.services.logs.LogGroupProps.builder()
                                .retention(RetentionDays.ONE_WEEK)
                                .removalPolicy(RemovalPolicy.DESTROY)
                                .build()))
                        .level(LogLevel.ALL)
                        .build())
                .tracingEnabled(true)
                .build();

        software.amazon.awscdk.services.events.Rule cleanupRule =
            software.amazon.awscdk.services.events.Rule.Builder
                .create(this, "CleanupScheduleRule")
                .schedule(software.amazon.awscdk.services.events.Schedule.cron(
                    software.amazon.awscdk.services.events.CronOptions.builder()
                        .minute("0")
                        .hour("2")
                        .build()))
                .targets(Arrays.asList(new SfnStateMachine(cleanupStateMachine)))
                .build();
    }

    private void setupTagsAndOutputs() {
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Application", "URLShortener");

        new CfnOutput(this, "APIEndpoint", CfnOutputProps.builder()
                .value(api.getUrl())
                .description("API Gateway endpoint URL")
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
