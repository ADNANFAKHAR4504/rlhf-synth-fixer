package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.apigateway.Cors;
import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.apigateway.LambdaIntegration;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Dashboard;
import software.amazon.awscdk.services.cloudwatch.GraphWidget;
import software.amazon.awscdk.services.cloudwatch.IMetric;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.GlobalSecondaryIndexProps;
import software.amazon.awscdk.services.dynamodb.StreamViewType;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.Schedule;
import software.amazon.awscdk.services.events.targets.LambdaFunction;
import software.amazon.awscdk.services.iam.Effect;

import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;

import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kendra.CfnIndex;

import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Tracing;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;

import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.s3.Transition;
import software.amazon.awscdk.services.sns.Topic;

import software.amazon.awscdk.services.sqs.DeadLetterQueue;
import software.amazon.awscdk.services.sqs.Queue;

import software.amazon.awscdk.services.stepfunctions.Chain;
import software.amazon.awscdk.services.stepfunctions.Choice;
import software.amazon.awscdk.services.stepfunctions.Condition;
import software.amazon.awscdk.services.stepfunctions.Pass;
import software.amazon.awscdk.services.stepfunctions.StateMachine;

import software.amazon.awscdk.services.stepfunctions.StateMachineType;
import software.amazon.awscdk.services.stepfunctions.tasks.LambdaInvoke;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;

import java.util.Map;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(final String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(final StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // ========================================================================
        // COMPREHENSIVE CUSTOMER SUPPORT PLATFORM INFRASTRUCTURE
        // Region: us-west-2
        // ========================================================================

        // ========================================================================
        // 1. DYNAMODB TABLE WITH GSI AND STREAMS
        // ========================================================================
        Table ticketsTable = Table.Builder.create(this, "TicketsTable" + environmentSuffix)
                .tableName("SupportTickets-" + environmentSuffix)
                .partitionKey(Attribute.builder()
                        .name("ticketId")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("timestamp")
                        .type(AttributeType.NUMBER)
                        .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .pointInTimeRecovery(true)
                .stream(StreamViewType.NEW_AND_OLD_IMAGES)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Add Global Secondary Index for status and priority queries
        ticketsTable.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("StatusPriorityIndex")
                .partitionKey(Attribute.builder()
                        .name("status")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("priority")
                        .type(AttributeType.NUMBER)
                        .build())
                .build());

        // ========================================================================
        // 2. S3 BUCKETS FOR ATTACHMENTS AND KNOWLEDGE BASE
        // ========================================================================
        // Attachments bucket with encryption, versioning, and lifecycle policies
        Bucket attachmentsBucket = Bucket.Builder.create(this, "AttachmentsBucket" + environmentSuffix)
                .bucketName("support-attachments-" + environmentSuffix.toLowerCase() + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .lifecycleRules(Collections.singletonList(LifecycleRule.builder()
                        .transitions(Collections.singletonList(Transition.builder()
                                .storageClass(StorageClass.INTELLIGENT_TIERING)
                                .transitionAfter(Duration.days(30))
                                .build()))
                        .build()))
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .build();

        // Knowledge base bucket for Kendra content
        Bucket knowledgeBaseBucket = Bucket.Builder.create(this, "KnowledgeBaseBucket" + environmentSuffix)
                .bucketName("support-knowledge-base-" + environmentSuffix.toLowerCase() + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .build();

        // ========================================================================
        // 3. SQS QUEUES WITH PRIORITY ROUTING AND DLQ
        // ========================================================================
        // Dead Letter Queue for failed messages
        Queue deadLetterQueue = Queue.Builder.create(this, "DeadLetterQueue" + environmentSuffix)
                .queueName("support-dead-letter-queue-" + environmentSuffix)
                .retentionPeriod(Duration.days(14))
                .build();

        DeadLetterQueue dlqConfig = DeadLetterQueue.builder()
                .maxReceiveCount(3)
                .queue(deadLetterQueue)
                .build();

        // High priority queue for urgent tickets
        Queue highPriorityQueue = Queue.Builder.create(this, "HighPriorityQueue" + environmentSuffix)
                .queueName("support-high-priority-" + environmentSuffix)
                .visibilityTimeout(Duration.seconds(300))
                .deadLetterQueue(dlqConfig)
                .build();

        // Standard priority queue
        Queue standardPriorityQueue = Queue.Builder.create(this, "StandardPriorityQueue" + environmentSuffix)
                .queueName("support-standard-priority-" + environmentSuffix)
                .visibilityTimeout(Duration.seconds(300))
                .deadLetterQueue(dlqConfig)
                .build();

        // Low priority queue
        Queue lowPriorityQueue = Queue.Builder.create(this, "LowPriorityQueue" + environmentSuffix)
                .queueName("support-low-priority-" + environmentSuffix)
                .visibilityTimeout(Duration.seconds(300))
                .deadLetterQueue(dlqConfig)
                .build();

        // ========================================================================
        // 4. SNS TOPIC FOR AGENT NOTIFICATIONS
        // ========================================================================
        Topic agentNotificationTopic = Topic.Builder.create(this, "AgentNotificationTopic" + environmentSuffix)
                .topicName("support-agent-notifications-" + environmentSuffix)
                .displayName("Support Agent Notifications")
                .build();

        // ========================================================================
        // 5. IAM ROLES WITH LEAST PRIVILEGE
        // ========================================================================
        // Lambda execution role with comprehensive permissions
        Role lambdaExecutionRole = Role.Builder.create(this, "LambdaExecutionRole" + environmentSuffix)
                .roleName("support-lambda-execution-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Collections.singletonList(
                        software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName(
                                "service-role/AWSLambdaBasicExecutionRole")))
                .build();

        // Add permissions for DynamoDB
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"))
                .resources(Arrays.asList(
                        ticketsTable.getTableArn(),
                        ticketsTable.getTableArn() + "/index/*"))
                .build());

        // Add permissions for Comprehend (sentiment analysis and entity detection)
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "comprehend:DetectSentiment",
                        "comprehend:DetectEntities",
                        "comprehend:DetectDominantLanguage"))
                .resources(Collections.singletonList("*"))
                .build());

        // Add permissions for Translate
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "translate:TranslateText",
                        "translate:DetectDominantLanguage"))
                .resources(Collections.singletonList("*"))
                .build());

        // Add permissions for SQS
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"))
                .resources(Arrays.asList(
                        highPriorityQueue.getQueueArn(),
                        standardPriorityQueue.getQueueArn(),
                        lowPriorityQueue.getQueueArn(),
                        deadLetterQueue.getQueueArn()))
                .build());

        // Add permissions for SNS
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Collections.singletonList("sns:Publish"))
                .resources(Collections.singletonList(agentNotificationTopic.getTopicArn()))
                .build());

        // Add permissions for S3
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket"))
                .resources(Arrays.asList(
                        attachmentsBucket.getBucketArn(),
                        attachmentsBucket.getBucketArn() + "/*",
                        knowledgeBaseBucket.getBucketArn(),
                        knowledgeBaseBucket.getBucketArn() + "/*"))
                .build());

        // Add permissions for X-Ray tracing
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"))
                .resources(Collections.singletonList("*"))
                .build());

        // Kendra service role
        Role kendraRole = Role.Builder.create(this, "KendraRole" + environmentSuffix)
                .roleName("support-kendra-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("kendra.amazonaws.com"))
                .build();

        kendraRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "cloudwatch:PutMetricData",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"))
                .resources(Collections.singletonList("*"))
                .build());

        kendraRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:GetObject",
                        "s3:ListBucket"))
                .resources(Arrays.asList(
                        knowledgeBaseBucket.getBucketArn(),
                        knowledgeBaseBucket.getBucketArn() + "/*"))
                .build());

        // Step Functions execution role
        Role stepFunctionsRole = Role.Builder.create(this, "StepFunctionsRole" + environmentSuffix)
                .roleName("support-step-functions-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("states.amazonaws.com"))
                .build();

        // ========================================================================
        // 6. LAMBDA FUNCTIONS (NODE.JS 18) WITH X-RAY TRACING
        // ========================================================================
        Map<String, String> commonEnv = new HashMap<>();
        commonEnv.put("TABLE_NAME", ticketsTable.getTableName());
        commonEnv.put("HIGH_PRIORITY_QUEUE_URL", highPriorityQueue.getQueueUrl());
        commonEnv.put("STANDARD_PRIORITY_QUEUE_URL", standardPriorityQueue.getQueueUrl());
        commonEnv.put("LOW_PRIORITY_QUEUE_URL", lowPriorityQueue.getQueueUrl());
        commonEnv.put("NOTIFICATION_TOPIC_ARN", agentNotificationTopic.getTopicArn());
        commonEnv.put("ATTACHMENTS_BUCKET", attachmentsBucket.getBucketName());
        commonEnv.put("KNOWLEDGE_BASE_BUCKET", knowledgeBaseBucket.getBucketName());

        // Sentiment Analysis Lambda
        Function sentimentAnalyzerFunction = Function.Builder.create(this, "SentimentAnalyzerFunction" + environmentSuffix)
                .functionName("support-sentiment-analyzer-" + environmentSuffix)
                .runtime(Runtime.NODEJS_18_X)
                .handler("index.handler")
                .code(Code.fromAsset("lambda/sentiment"))
                .role(lambdaExecutionRole)
                .timeout(Duration.seconds(30))
                .memorySize(256)
                .tracing(Tracing.ACTIVE)
                .environment(commonEnv)
                .build();

        // Translation Lambda
        Function translationFunction = Function.Builder.create(this, "TranslationFunction" + environmentSuffix)
                .functionName("support-translation-" + environmentSuffix)
                .runtime(Runtime.NODEJS_18_X)
                .handler("index.handler")
                .code(Code.fromAsset("lambda/translation"))
                .role(lambdaExecutionRole)
                .timeout(Duration.seconds(30))
                .memorySize(256)
                .tracing(Tracing.ACTIVE)
                .environment(commonEnv)
                .build();

        // Knowledge Base Search Lambda (requires Kendra)
        Function knowledgeBaseSearchFunction = Function.Builder.create(this, "KnowledgeBaseSearchFunction" + environmentSuffix)
                .functionName("support-knowledge-search-" + environmentSuffix)
                .runtime(Runtime.NODEJS_18_X)
                .handler("index.handler")
                .code(Code.fromAsset("lambda/search"))
                .role(lambdaExecutionRole)
                .timeout(Duration.seconds(30))
                .memorySize(256)
                .tracing(Tracing.ACTIVE)
                .environment(commonEnv)
                .build();

        // Escalation Lambda
        Function escalationFunction = Function.Builder.create(this, "EscalationFunction" + environmentSuffix)
                .functionName("support-escalation-" + environmentSuffix)
                .runtime(Runtime.NODEJS_18_X)
                .handler("index.handler")
                .code(Code.fromAsset("lambda/escalation"))
                .role(lambdaExecutionRole)
                .timeout(Duration.seconds(30))
                .memorySize(256)
                .tracing(Tracing.ACTIVE)
                .environment(commonEnv)
                .build();

        // SLA Check Lambda
        Function slaCheckFunction = Function.Builder.create(this, "SLACheckFunction" + environmentSuffix)
                .functionName("support-sla-check-" + environmentSuffix)
                .runtime(Runtime.NODEJS_18_X)
                .handler("index.handler")
                .code(Code.fromAsset("lambda/sla-check"))
                .role(lambdaExecutionRole)
                .timeout(Duration.seconds(60))
                .memorySize(512)
                .tracing(Tracing.ACTIVE)
                .environment(commonEnv)
                .build();

        // Auto-response Lambda
        Function autoResponseFunction = Function.Builder.create(this, "AutoResponseFunction" + environmentSuffix)
                .functionName("support-auto-response-" + environmentSuffix)
                .runtime(Runtime.NODEJS_18_X)
                .handler("index.handler")
                .code(Code.fromAsset("lambda/auto-response"))
                .role(lambdaExecutionRole)
                .timeout(Duration.seconds(30))
                .memorySize(256)
                .tracing(Tracing.ACTIVE)
                .environment(commonEnv)
                .build();

        // Grant Lambda permission to invoke Step Functions
        stepFunctionsRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Collections.singletonList("lambda:InvokeFunction"))
                .resources(Arrays.asList(
                        sentimentAnalyzerFunction.getFunctionArn(),
                        translationFunction.getFunctionArn(),
                        escalationFunction.getFunctionArn(),
                        slaCheckFunction.getFunctionArn(),
                        autoResponseFunction.getFunctionArn()))
                .build());

        // ========================================================================
        // 7. KENDRA INDEX FOR KNOWLEDGE BASE SEARCH
        // ========================================================================
        CfnIndex kendraIndex = CfnIndex.Builder.create(this, "KendraIndex" + environmentSuffix)
                .name("support-knowledge-base-" + environmentSuffix)
                .edition("DEVELOPER_EDITION")
                .roleArn(kendraRole.getRoleArn())
                .build();

        // Add Kendra permissions to Lambda role
        lambdaExecutionRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "kendra:Query",
                        "kendra:DescribeIndex",
                        "kendra:ListDataSources"))
                .resources(Collections.singletonList(kendraIndex.getAttrArn()))
                .build());

        // Update environment variable with Kendra Index ID
        knowledgeBaseSearchFunction.addEnvironment("KENDRA_INDEX_ID", kendraIndex.getAttrId());

        // ========================================================================
        // 8. STEP FUNCTIONS STATE MACHINE FOR ESCALATION WORKFLOW
        // ========================================================================
        // Define escalation workflow states
        Pass startState = Pass.Builder.create(this, "StartEscalation" + environmentSuffix)
                .comment("Start escalation workflow")
                .build();

        LambdaInvoke checkSentiment = LambdaInvoke.Builder.create(this, "CheckSentiment" + environmentSuffix)
                .lambdaFunction(sentimentAnalyzerFunction)
                .outputPath("$.Payload")
                .build();

        Choice priorityChoice = Choice.Builder.create(this, "PriorityDecision" + environmentSuffix)
                .build();

        LambdaInvoke escalate = LambdaInvoke.Builder.create(this, "EscalateTicket" + environmentSuffix)
                .lambdaFunction(escalationFunction)
                .outputPath("$.Payload")
                .build();

        Pass standardProcessing = Pass.Builder.create(this, "StandardProcessing" + environmentSuffix)
                .comment("Process ticket through standard workflow")
                .build();

        Pass endState = Pass.Builder.create(this, "EndWorkflow" + environmentSuffix)
                .comment("End escalation workflow")
                .build();

        // Define escalate path with end state
        Chain escalatePath = Chain.start(escalate).next(endState);

        // Define standard path with end state
        Chain standardPath = Chain.start(standardProcessing).next(endState);

        // Define the workflow chain
        Chain escalationChain = Chain.start(startState)
                .next(checkSentiment)
                .next(priorityChoice
                        .when(Condition.numberGreaterThan("$.priority", 8), escalatePath)
                        .when(Condition.stringEquals("$.sentiment", "NEGATIVE"), escalatePath)
                        .otherwise(standardPath));

        StateMachine escalationStateMachine = StateMachine.Builder.create(this, "EscalationStateMachine" + environmentSuffix)
                .stateMachineName("support-escalation-workflow-" + environmentSuffix)
                .definition(escalationChain)
                .stateMachineType(StateMachineType.STANDARD)
                .role(stepFunctionsRole)
                .tracingEnabled(true)
                .build();

        // ========================================================================
        // 9. API GATEWAY REST API WITH X-RAY TRACING AND CORS
        // ========================================================================
        RestApi supportApi = RestApi.Builder.create(this, "SupportAPI" + environmentSuffix)
                .restApiName("support-platform-api-" + environmentSuffix)
                .description("Customer Support Platform API")
                .deployOptions(StageOptions.builder()
                        .stageName("prod")
                        .tracingEnabled(true)
                        .build())
                .defaultCorsPreflightOptions(CorsOptions.builder()
                        .allowOrigins(Cors.ALL_ORIGINS)
                        .allowMethods(Cors.ALL_METHODS)
                        .allowHeaders(Arrays.asList("Content-Type", "Authorization", "X-Api-Key"))
                        .build())
                .build();

        // Add /tickets endpoint
        var ticketsResource = supportApi.getRoot().addResource("tickets");

        // POST /tickets - Create new ticket
        ticketsResource.addMethod("POST",
                LambdaIntegration.Builder.create(sentimentAnalyzerFunction).build());

        // GET /tickets - List tickets
        ticketsResource.addMethod("GET",
                LambdaIntegration.Builder.create(sentimentAnalyzerFunction).build());

        // GET /tickets/{ticketId} - Get specific ticket
        var ticketResource = ticketsResource.addResource("{ticketId}");
        ticketResource.addMethod("GET",
                LambdaIntegration.Builder.create(sentimentAnalyzerFunction).build());

        // PUT /tickets/{ticketId} - Update ticket
        ticketResource.addMethod("PUT",
                LambdaIntegration.Builder.create(sentimentAnalyzerFunction).build());

        // ========================================================================
        // 10. EVENTBRIDGE RULE FOR SLA MONITORING (EVERY 5 MINUTES)
        // ========================================================================
        Rule slaMonitoringRule = Rule.Builder.create(this, "SLAMonitoringRule" + environmentSuffix)
                .ruleName("support-sla-monitoring-" + environmentSuffix)
                .description("Monitor SLA compliance every 5 minutes")
                .schedule(Schedule.rate(Duration.minutes(5)))
                .targets(Collections.singletonList(new LambdaFunction(slaCheckFunction)))
                .build();

        // Grant EventBridge permission to invoke Lambda
        slaCheckFunction.grantInvoke(new ServicePrincipal("events.amazonaws.com"));

        // ========================================================================
        // 11. CLOUDWATCH DASHBOARD WITH METRICS
        // ========================================================================
        Dashboard supportDashboard = Dashboard.Builder.create(this, "SupportDashboard" + environmentSuffix)
                .dashboardName("support-platform-dashboard-" + environmentSuffix)
                .build();

        // Ticket count metrics
        IMetric ticketCountMetric = Metric.Builder.create()
                .namespace("AWS/DynamoDB")
                .metricName("ItemCount")
                .dimensionsMap(Collections.singletonMap("TableName", ticketsTable.getTableName()))
                .statistic("Average")
                .period(Duration.minutes(5))
                .build();

        // Queue depth metrics
        IMetric highPriorityQueueDepth = highPriorityQueue.metricApproximateNumberOfMessagesVisible();
        IMetric standardPriorityQueueDepth = standardPriorityQueue.metricApproximateNumberOfMessagesVisible();
        IMetric lowPriorityQueueDepth = lowPriorityQueue.metricApproximateNumberOfMessagesVisible();

        // Lambda metrics
        IMetric lambdaErrors = sentimentAnalyzerFunction.metricErrors();
        IMetric lambdaDuration = sentimentAnalyzerFunction.metricDuration();
        IMetric lambdaInvocations = sentimentAnalyzerFunction.metricInvocations();

        // Add widgets to dashboard
        supportDashboard.addWidgets(
                GraphWidget.Builder.create()
                        .title("Ticket Counts")
                        .left(Collections.singletonList(ticketCountMetric))
                        .width(12)
                        .build(),
                GraphWidget.Builder.create()
                        .title("Queue Depths")
                        .left(Arrays.asList(highPriorityQueueDepth, standardPriorityQueueDepth, lowPriorityQueueDepth))
                        .width(12)
                        .build()
        );

        supportDashboard.addWidgets(
                GraphWidget.Builder.create()
                        .title("Lambda Performance")
                        .left(Arrays.asList(lambdaInvocations, lambdaErrors))
                        .right(Collections.singletonList(lambdaDuration))
                        .width(12)
                        .build(),
                GraphWidget.Builder.create()
                        .title("Response Times")
                        .left(Collections.singletonList(lambdaDuration))
                        .width(12)
                        .build()
        );

        // ========================================================================
        // 12. CLOUDWATCH ALARMS FOR QUEUE BACKLOGS AND LAMBDA ERRORS
        // ========================================================================
        // High priority queue backlog alarm
        Alarm highPriorityBacklogAlarm = Alarm.Builder.create(this, "HighPriorityBacklogAlarm" + environmentSuffix)
                .alarmName("support-high-priority-backlog-" + environmentSuffix)
                .metric(highPriorityQueueDepth)
                .threshold(10)
                .evaluationPeriods(2)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        // Lambda error alarm
        Alarm lambdaErrorAlarm = Alarm.Builder.create(this, "LambdaErrorAlarm" + environmentSuffix)
                .alarmName("support-lambda-errors-" + environmentSuffix)
                .metric(lambdaErrors)
                .threshold(5)
                .evaluationPeriods(1)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        // Dead letter queue alarm
        IMetric dlqDepth = deadLetterQueue.metricApproximateNumberOfMessagesVisible();
        Alarm dlqAlarm = Alarm.Builder.create(this, "DeadLetterQueueAlarm" + environmentSuffix)
                .alarmName("support-dlq-messages-" + environmentSuffix)
                .metric(dlqDepth)
                .threshold(1)
                .evaluationPeriods(1)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        // ========================================================================
        // 13. CFN OUTPUTS FOR ALL IMPORTANT RESOURCES
        // ========================================================================
        new CfnOutput(this, "DynamoDBTableName", CfnOutputProps.builder()
                .description("DynamoDB Tickets Table Name")
                .value(ticketsTable.getTableName())
                .exportName("SupportTicketsTableName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DynamoDBTableArn", CfnOutputProps.builder()
                .description("DynamoDB Tickets Table ARN")
                .value(ticketsTable.getTableArn())
                .exportName("SupportTicketsTableArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "ApiGatewayUrl", CfnOutputProps.builder()
                .description("API Gateway Endpoint URL")
                .value(supportApi.getUrl())
                .exportName("SupportApiUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "ApiGatewayId", CfnOutputProps.builder()
                .description("API Gateway REST API ID")
                .value(supportApi.getRestApiId())
                .exportName("SupportApiId-" + environmentSuffix)
                .build());

        new CfnOutput(this, "HighPriorityQueueUrl", CfnOutputProps.builder()
                .description("High Priority Queue URL")
                .value(highPriorityQueue.getQueueUrl())
                .exportName("HighPriorityQueueUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "StandardPriorityQueueUrl", CfnOutputProps.builder()
                .description("Standard Priority Queue URL")
                .value(standardPriorityQueue.getQueueUrl())
                .exportName("StandardPriorityQueueUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "LowPriorityQueueUrl", CfnOutputProps.builder()
                .description("Low Priority Queue URL")
                .value(lowPriorityQueue.getQueueUrl())
                .exportName("LowPriorityQueueUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DeadLetterQueueUrl", CfnOutputProps.builder()
                .description("Dead Letter Queue URL")
                .value(deadLetterQueue.getQueueUrl())
                .exportName("DeadLetterQueueUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "AgentNotificationTopicArn", CfnOutputProps.builder()
                .description("Agent Notification SNS Topic ARN")
                .value(agentNotificationTopic.getTopicArn())
                .exportName("AgentNotificationTopicArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "AttachmentsBucketName", CfnOutputProps.builder()
                .description("Attachments S3 Bucket Name")
                .value(attachmentsBucket.getBucketName())
                .exportName("AttachmentsBucketName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "KnowledgeBaseBucketName", CfnOutputProps.builder()
                .description("Knowledge Base S3 Bucket Name")
                .value(knowledgeBaseBucket.getBucketName())
                .exportName("KnowledgeBaseBucketName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "KendraIndexId", CfnOutputProps.builder()
                .description("Kendra Index ID")
                .value(kendraIndex.getAttrId())
                .exportName("KendraIndexId-" + environmentSuffix)
                .build());

        new CfnOutput(this, "KendraIndexArn", CfnOutputProps.builder()
                .description("Kendra Index ARN")
                .value(kendraIndex.getAttrArn())
                .exportName("KendraIndexArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "StepFunctionsArn", CfnOutputProps.builder()
                .description("Escalation Step Functions State Machine ARN")
                .value(escalationStateMachine.getStateMachineArn())
                .exportName("EscalationStateMachineArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "SentimentAnalyzerFunctionArn", CfnOutputProps.builder()
                .description("Sentiment Analyzer Lambda Function ARN")
                .value(sentimentAnalyzerFunction.getFunctionArn())
                .exportName("SentimentAnalyzerFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "TranslationFunctionArn", CfnOutputProps.builder()
                .description("Translation Lambda Function ARN")
                .value(translationFunction.getFunctionArn())
                .exportName("TranslationFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "KnowledgeBaseSearchFunctionArn", CfnOutputProps.builder()
                .description("Knowledge Base Search Lambda Function ARN")
                .value(knowledgeBaseSearchFunction.getFunctionArn())
                .exportName("KnowledgeBaseSearchFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "EscalationFunctionArn", CfnOutputProps.builder()
                .description("Escalation Lambda Function ARN")
                .value(escalationFunction.getFunctionArn())
                .exportName("EscalationFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "SLACheckFunctionArn", CfnOutputProps.builder()
                .description("SLA Check Lambda Function ARN")
                .value(slaCheckFunction.getFunctionArn())
                .exportName("SLACheckFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "AutoResponseFunctionArn", CfnOutputProps.builder()
                .description("Auto-Response Lambda Function ARN")
                .value(autoResponseFunction.getFunctionArn())
                .exportName("AutoResponseFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "CloudWatchDashboardName", CfnOutputProps.builder()
                .description("CloudWatch Dashboard Name")
                .value(supportDashboard.getDashboardName())
                .exportName("SupportDashboardName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "HighPriorityBacklogAlarmName", CfnOutputProps.builder()
                .description("High Priority Queue Backlog Alarm Name")
                .value(highPriorityBacklogAlarm.getAlarmName())
                .exportName("HighPriorityBacklogAlarmName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "LambdaErrorAlarmName", CfnOutputProps.builder()
                .description("Lambda Error Alarm Name")
                .value(lambdaErrorAlarm.getAlarmName())
                .exportName("LambdaErrorAlarmName-" + environmentSuffix)
                .build());
    }

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * This method creates a CDK App instance and instantiates the TapStack
     * with appropriate configuration based on environment variables and context.
     *
     * Region: us-west-2 (as per PROMPT requirements)
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Get AWS account from environment or use default
        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (account == null) {
            account = System.getenv("AWS_ACCOUNT_ID");
        }

        // Region is set to us-west-2 as per PROMPT requirements
        String region = "us-west-2";

        // Create the main TAP stack with us-west-2 region
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region(region)
                                .build())
                        .description("Comprehensive Customer Support Platform with AI Services in us-west-2")
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
