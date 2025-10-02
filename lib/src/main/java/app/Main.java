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
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String envSuffix, final StackProps props) {
        this.environmentSuffix = envSuffix;
        this.stackProps = props != null ? props : StackProps.builder().build();
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

        public Builder environmentSuffix(final String envSuffix) {
            this.environmentSuffix = envSuffix;
            return this;
        }

        public Builder stackProps(final StackProps props) {
            this.stackProps = props;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Helper class to hold S3 bucket resources.
 */
final class BucketResources {
    private final Bucket attachmentsBucket;
    private final Bucket knowledgeBaseBucket;

    BucketResources(final Bucket attachments, final Bucket knowledgeBase) {
        this.attachmentsBucket = attachments;
        this.knowledgeBaseBucket = knowledgeBase;
    }

    public Bucket getAttachmentsBucket() {
        return attachmentsBucket;
    }

    public Bucket getKnowledgeBaseBucket() {
        return knowledgeBaseBucket;
    }
}

/**
 * Helper class to hold SQS queue resources.
 */
final class QueueResources {
    private final Queue deadLetterQueue;
    private final Queue highPriorityQueue;
    private final Queue standardPriorityQueue;
    private final Queue lowPriorityQueue;

    QueueResources(final Queue dlq, final Queue high, final Queue standard, final Queue low) {
        this.deadLetterQueue = dlq;
        this.highPriorityQueue = high;
        this.standardPriorityQueue = standard;
        this.lowPriorityQueue = low;
    }

    public Queue getDeadLetterQueue() {
        return deadLetterQueue;
    }

    public Queue getHighPriorityQueue() {
        return highPriorityQueue;
    }

    public Queue getStandardPriorityQueue() {
        return standardPriorityQueue;
    }

    public Queue getLowPriorityQueue() {
        return lowPriorityQueue;
    }
}

/**
 * Helper class to hold IAM role resources.
 */
final class RoleResources {
    private final Role lambdaExecutionRole;
    private final Role kendraRole;
    private final Role stepFunctionsRole;

    RoleResources(final Role lambda, final Role kendra, final Role stepFunctions) {
        this.lambdaExecutionRole = lambda;
        this.kendraRole = kendra;
        this.stepFunctionsRole = stepFunctions;
    }

    public Role getLambdaExecutionRole() {
        return lambdaExecutionRole;
    }

    public Role getKendraRole() {
        return kendraRole;
    }

    public Role getStepFunctionsRole() {
        return stepFunctionsRole;
    }
}

/**
 * Helper class to hold Lambda function resources.
 */
final class LambdaResources {
    private final Function sentimentAnalyzer;
    private final Function translation;
    private final Function knowledgeBaseSearch;
    private final Function escalation;
    private final Function slaCheck;
    private final Function autoResponse;

    LambdaResources(final Function sentiment, final Function trans, final Function knowledge,
                    final Function esc, final Function sla, final Function auto) {
        this.sentimentAnalyzer = sentiment;
        this.translation = trans;
        this.knowledgeBaseSearch = knowledge;
        this.escalation = esc;
        this.slaCheck = sla;
        this.autoResponse = auto;
    }

    public Function getSentimentAnalyzer() {
        return sentimentAnalyzer;
    }

    public Function getTranslation() {
        return translation;
    }

    public Function getKnowledgeBaseSearch() {
        return knowledgeBaseSearch;
    }

    public Function getEscalation() {
        return escalation;
    }

    public Function getSlaCheck() {
        return slaCheck;
    }

    public Function getAutoResponse() {
        return autoResponse;
    }
}

/**
 * Helper class to hold all resources needed for creating CloudFormation outputs.
 */
final class OutputResources {
    private final Table ticketsTable;
    private final BucketResources buckets;
    private final QueueResources queues;
    private final Topic notificationTopic;
    private final CfnIndex kendraIndex;
    private final StateMachine stateMachine;
    private final LambdaResources lambdas;
    private final RestApi api;
    private final Dashboard dashboard;

    OutputResources(final Table table, final BucketResources bucketRes,
                   final QueueResources queueRes, final Topic topic,
                   final CfnIndex kendra, final StateMachine machine,
                   final LambdaResources functions, final RestApi restApi,
                   final Dashboard dash) {
        this.ticketsTable = table;
        this.buckets = bucketRes;
        this.queues = queueRes;
        this.notificationTopic = topic;
        this.kendraIndex = kendra;
        this.stateMachine = machine;
        this.lambdas = functions;
        this.api = restApi;
        this.dashboard = dash;
    }

    public Table getTicketsTable() {
        return ticketsTable;
    }

    public BucketResources getBuckets() {
        return buckets;
    }

    public QueueResources getQueues() {
        return queues;
    }

    public Topic getNotificationTopic() {
        return notificationTopic;
    }

    public CfnIndex getKendraIndex() {
        return kendraIndex;
    }

    public StateMachine getStateMachine() {
        return stateMachine;
    }

    public LambdaResources getLambdas() {
        return lambdas;
    }

    public RestApi getApi() {
        return api;
    }

    public Dashboard getDashboard() {
        return dashboard;
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = determineEnvironmentSuffix(props);

        Table ticketsTable = createDynamoDBTable();
        BucketResources buckets = createS3Buckets();
        QueueResources queues = createSQSQueues();
        Topic notificationTopic = createSNSTopic();
        RoleResources roles = createIAMRoles(ticketsTable, buckets, queues, notificationTopic);
        LambdaResources lambdas = createLambdaFunctions(roles, ticketsTable, buckets, queues, 
                                                        notificationTopic);
        CfnIndex kendraIndex = createKendraIndex(roles.getKendraRole(), buckets.getKnowledgeBaseBucket());
        updateLambdaWithKendra(lambdas.getKnowledgeBaseSearch(), kendraIndex, 
                              roles.getLambdaExecutionRole());
        StateMachine stateMachine = createStepFunctions(lambdas, roles.getStepFunctionsRole());
        RestApi api = createApiGateway(lambdas.getSentimentAnalyzer());
        createEventBridgeRules(lambdas.getSlaCheck());
        Dashboard dashboard = createCloudWatchDashboard(ticketsTable, queues, lambdas);
        createCloudWatchAlarms(queues, lambdas);
        
        OutputResources outputResources = new OutputResources(
            ticketsTable, buckets, queues, notificationTopic,
            kendraIndex, stateMachine, lambdas, api, dashboard
        );
        createOutputs(outputResources);
    }

    private String determineEnvironmentSuffix(final TapStackProps props) {
        return Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");
    }

    private Table createDynamoDBTable() {
        Table table = Table.Builder.create(this, "TicketsTable" + environmentSuffix)
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

        table.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
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

        return table;
    }

    private BucketResources createS3Buckets() {
        Bucket attachmentsBucket = Bucket.Builder.create(this, "AttachmentsBucket" + environmentSuffix)
                .bucketName("support-attachments-" + environmentSuffix.toLowerCase() 
                           + "-" + this.getAccount())
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

        Bucket knowledgeBaseBucket = Bucket.Builder.create(this, "KnowledgeBasesBucket" + environmentSuffix)
                .bucketName("support-knowledge-bases-" + environmentSuffix.toLowerCase() 
                           + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .build();

        return new BucketResources(attachmentsBucket, knowledgeBaseBucket);
    }

    private QueueResources createSQSQueues() {
        Queue deadLetterQueue = Queue.Builder.create(this, "DeadLetterQueue" + environmentSuffix)
                .queueName("support-dead-letter-queue-" + environmentSuffix)
                .retentionPeriod(Duration.days(14))
                .build();

        DeadLetterQueue dlqConfig = DeadLetterQueue.builder()
                .maxReceiveCount(3)
                .queue(deadLetterQueue)
                .build();

        Queue highPriorityQueue = Queue.Builder.create(this, "HighPriorityQueue" + environmentSuffix)
                .queueName("support-high-priority-" + environmentSuffix)
                .visibilityTimeout(Duration.seconds(300))
                .deadLetterQueue(dlqConfig)
                .build();

        Queue standardPriorityQueue = Queue.Builder.create(this, "StandardPriorityQueue" + environmentSuffix)
                .queueName("support-standard-priority-" + environmentSuffix)
                .visibilityTimeout(Duration.seconds(300))
                .deadLetterQueue(dlqConfig)
                .build();

        Queue lowPriorityQueue = Queue.Builder.create(this, "LowPriorityQueue" + environmentSuffix)
                .queueName("support-low-priority-" + environmentSuffix)
                .visibilityTimeout(Duration.seconds(300))
                .deadLetterQueue(dlqConfig)
                .build();

        return new QueueResources(deadLetterQueue, highPriorityQueue, standardPriorityQueue, 
                                 lowPriorityQueue);
    }

    private Topic createSNSTopic() {
        return Topic.Builder.create(this, "AgentNotificationTopic" + environmentSuffix)
                .topicName("support-agent-notifications-" + environmentSuffix)
                .displayName("Support Agent Notifications")
                .build();
    }

    private RoleResources createIAMRoles(final Table ticketsTable, final BucketResources buckets,
                                        final QueueResources queues, final Topic notificationTopic) {
        Role lambdaExecutionRole = createLambdaExecutionRole(ticketsTable, buckets, queues, 
                                                             notificationTopic);
        Role kendraRole = createKendraRole(buckets.getKnowledgeBaseBucket());
        Role stepFunctionsRole = createStepFunctionsRole();

        return new RoleResources(lambdaExecutionRole, kendraRole, stepFunctionsRole);
    }

    private Role createLambdaExecutionRole(final Table ticketsTable, final BucketResources buckets,
                                          final QueueResources queues, final Topic notificationTopic) {
        Role role = Role.Builder.create(this, "LambdaExecutionRole" + environmentSuffix)
                .roleName("support-lambda-execution-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Collections.singletonList(
                        software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName(
                                "service-role/AWSLambdaBasicExecutionRole")))
                .build();

        addDynamoDBPermissions(role, ticketsTable);
        addComprehendPermissions(role);
        addTranslatePermissions(role);
        addSQSPermissions(role, queues);
        addSNSPermissions(role, notificationTopic);
        addS3Permissions(role, buckets);
        addXRayPermissions(role);

        return role;
    }

    private void addDynamoDBPermissions(final Role role, final Table table) {
        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem",
                                      "dynamodb:Query", "dynamodb:Scan"))
                .resources(Arrays.asList(table.getTableArn(), table.getTableArn() + "/index/*"))
                .build());
    }

    private void addComprehendPermissions(final Role role) {
        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("comprehend:DetectSentiment", "comprehend:DetectEntities",
                                      "comprehend:DetectDominantLanguage"))
                .resources(Collections.singletonList("*"))
                .build());
    }

    private void addTranslatePermissions(final Role role) {
        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("translate:TranslateText", "translate:DetectDominantLanguage"))
                .resources(Collections.singletonList("*"))
                .build());
    }

    private void addSQSPermissions(final Role role, final QueueResources queues) {
        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage",
                                      "sqs:GetQueueAttributes"))
                .resources(Arrays.asList(queues.getHighPriorityQueue().getQueueArn(),
                                        queues.getStandardPriorityQueue().getQueueArn(),
                                        queues.getLowPriorityQueue().getQueueArn(),
                                        queues.getDeadLetterQueue().getQueueArn()))
                .build());
    }

    private void addSNSPermissions(final Role role, final Topic topic) {
        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Collections.singletonList("sns:Publish"))
                .resources(Collections.singletonList(topic.getTopicArn()))
                .build());
    }

    private void addS3Permissions(final Role role, final BucketResources buckets) {
        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("s3:GetObject", "s3:PutObject", "s3:ListBucket"))
                .resources(Arrays.asList(buckets.getAttachmentsBucket().getBucketArn(),
                                        buckets.getAttachmentsBucket().getBucketArn() + "/*",
                                        buckets.getKnowledgeBaseBucket().getBucketArn(),
                                        buckets.getKnowledgeBaseBucket().getBucketArn() + "/*"))
                .build());
    }

    private void addXRayPermissions(final Role role) {
        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("xray:PutTraceSegments", "xray:PutTelemetryRecords"))
                .resources(Collections.singletonList("*"))
                .build());
    }

    private Role createKendraRole(final Bucket knowledgeBaseBucket) {
        Role role = Role.Builder.create(this, "KendraRole" + environmentSuffix)
                .roleName("support-kendra-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("kendra.amazonaws.com"))
                .build();

        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("cloudwatch:PutMetricData", "logs:CreateLogGroup",
                                      "logs:CreateLogStream", "logs:PutLogEvents"))
                .resources(Collections.singletonList("*"))
                .build());

        role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("s3:GetObject", "s3:ListBucket"))
                .resources(Arrays.asList(knowledgeBaseBucket.getBucketArn(),
                                        knowledgeBaseBucket.getBucketArn() + "/*"))
                .build());

        return role;
    }

    private Role createStepFunctionsRole() {
        return Role.Builder.create(this, "StepFunctionsRole" + environmentSuffix)
                .roleName("support-step-functions-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("states.amazonaws.com"))
                .build();
    }

    private LambdaResources createLambdaFunctions(final RoleResources roles, final Table ticketsTable,
                                                  final BucketResources buckets, 
                                                  final QueueResources queues,
                                                  final Topic notificationTopic) {
        Map<String, String> commonEnv = createCommonEnvironment(ticketsTable, buckets, queues, 
                                                               notificationTopic);

        Function sentimentAnalyzer = createLambdaFunction("SentimentAnalyzerFunction", 
                "support-sentiment-analyzer", "lambda/sentiment", 256, 30, 
                roles.getLambdaExecutionRole(), commonEnv);

        Function translation = createLambdaFunction("TranslationFunction", "support-translation",
                "lambda/translation", 256, 30, roles.getLambdaExecutionRole(), commonEnv);

        Function knowledgeBaseSearch = createLambdaFunction("KnowledgeBaseSearchFunction",
                "support-knowledge-search", "lambda/search", 256, 30, 
                roles.getLambdaExecutionRole(), commonEnv);

        Function escalation = createLambdaFunction("EscalationFunction", "support-escalation",
                "lambda/escalation", 256, 30, roles.getLambdaExecutionRole(), commonEnv);

        Function slaCheck = createLambdaFunction("SLACheckFunction", "support-sla-check",
                "lambda/sla-check", 512, 60, roles.getLambdaExecutionRole(), commonEnv);

        Function autoResponse = createLambdaFunction("AutoResponseFunction", "support-auto-response",
                "lambda/auto-response", 256, 30, roles.getLambdaExecutionRole(), commonEnv);

        grantStepFunctionsInvoke(roles.getStepFunctionsRole(), sentimentAnalyzer, translation,
                                escalation, slaCheck, autoResponse);

        return new LambdaResources(sentimentAnalyzer, translation, knowledgeBaseSearch, escalation,
                                  slaCheck, autoResponse);
    }

    private Map<String, String> createCommonEnvironment(final Table table, 
                                                       final BucketResources buckets,
                                                       final QueueResources queues, 
                                                       final Topic topic) {
        Map<String, String> env = new HashMap<>();
        env.put("TABLE_NAME", table.getTableName());
        env.put("HIGH_PRIORITY_QUEUE_URL", queues.getHighPriorityQueue().getQueueUrl());
        env.put("STANDARD_PRIORITY_QUEUE_URL", queues.getStandardPriorityQueue().getQueueUrl());
        env.put("LOW_PRIORITY_QUEUE_URL", queues.getLowPriorityQueue().getQueueUrl());
        env.put("NOTIFICATION_TOPIC_ARN", topic.getTopicArn());
        env.put("ATTACHMENTS_BUCKET", buckets.getAttachmentsBucket().getBucketName());
        env.put("KNOWLEDGE_BASE_BUCKET", buckets.getKnowledgeBaseBucket().getBucketName());
        return env;
    }

    private Function createLambdaFunction(final String id, final String functionName, 
                                         final String codePath,
                                         final int memory, final int timeout, final Role role,
                                         final Map<String, String> environment) {
        return Function.Builder.create(this, id + environmentSuffix)
                .functionName(functionName + "-" + environmentSuffix)
                .runtime(Runtime.NODEJS_18_X)
                .handler("index.handler")
                .code(Code.fromAsset(codePath))
                .role(role)
                .timeout(Duration.seconds(timeout))
                .memorySize(memory)
                .tracing(Tracing.ACTIVE)
                .environment(environment)
                .build();
    }

    private void grantStepFunctionsInvoke(final Role stepFunctionsRole, final Function... functions) {
        String[] arns = Arrays.stream(functions)
                .map(Function::getFunctionArn)
                .toArray(String[]::new);

        stepFunctionsRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Collections.singletonList("lambda:InvokeFunction"))
                .resources(Arrays.asList(arns))
                .build());
    }

    private CfnIndex createKendraIndex(final Role kendraRole, final Bucket knowledgeBaseBucket) {
        return CfnIndex.Builder.create(this, "KendraIndex" + environmentSuffix)
                .name("support-knowledge-base-" + environmentSuffix)
                .edition("DEVELOPER_EDITION")
                .roleArn(kendraRole.getRoleArn())
                .build();
    }

    private void updateLambdaWithKendra(final Function knowledgeBaseSearch, final CfnIndex kendraIndex,
                                       final Role lambdaRole) {
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("kendra:Query", "kendra:DescribeIndex", 
                                      "kendra:ListDataSources"))
                .resources(Collections.singletonList(kendraIndex.getAttrArn()))
                .build());

        knowledgeBaseSearch.addEnvironment("KENDRA_INDEX_ID", kendraIndex.getAttrId());
    }

    private StateMachine createStepFunctions(final LambdaResources lambdas, final Role role) {
        Pass startState = Pass.Builder.create(this, "StartEscalation" + environmentSuffix)
                .comment("Start escalation workflow")
                .build();

        LambdaInvoke checkSentiment = LambdaInvoke.Builder.create(this, 
                "CheckSentiment" + environmentSuffix)
                .lambdaFunction(lambdas.getSentimentAnalyzer())
                .outputPath("$.Payload")
                .build();

        Choice priorityChoice = Choice.Builder.create(this, "PriorityDecision" + environmentSuffix)
                .build();

        LambdaInvoke escalate = LambdaInvoke.Builder.create(this, "EscalateTicket" + environmentSuffix)
                .lambdaFunction(lambdas.getEscalation())
                .outputPath("$.Payload")
                .build();

        Pass standardProcessing = Pass.Builder.create(this, "StandardProcessing" + environmentSuffix)
                .comment("Process ticket through standard workflow")
                .build();

        Pass endState = Pass.Builder.create(this, "EndWorkflow" + environmentSuffix)
                .comment("End escalation workflow")
                .build();

        Chain escalatePath = Chain.start(escalate).next(endState);
        Chain standardPath = Chain.start(standardProcessing).next(endState);

        Chain escalationChain = Chain.start(startState)
                .next(checkSentiment)
                .next(priorityChoice
                        .when(Condition.numberGreaterThan("$.priority", 8), escalatePath)
                        .when(Condition.stringEquals("$.sentiment", "NEGATIVE"), escalatePath)
                        .otherwise(standardPath));
        return StateMachine.Builder.create(this, "EscalationStateMachine" + environmentSuffix)
                .stateMachineName("support-escalation-workflow-" + environmentSuffix)
                .definition(escalationChain)
                .stateMachineType(StateMachineType.STANDARD)
                .role(role)
                .tracingEnabled(true)
                .build();
    }

    private RestApi createApiGateway(final Function sentimentAnalyzer) {
        RestApi api = RestApi.Builder.create(this, "SupportAPI" + environmentSuffix)
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

        var ticketsResource = api.getRoot().addResource("tickets");
        ticketsResource.addMethod("POST", 
                LambdaIntegration.Builder.create(sentimentAnalyzer).build());
        ticketsResource.addMethod("GET", 
                LambdaIntegration.Builder.create(sentimentAnalyzer).build());

        var ticketResource = ticketsResource.addResource("{ticketId}");
        ticketResource.addMethod("GET", 
                LambdaIntegration.Builder.create(sentimentAnalyzer).build());
        ticketResource.addMethod("PUT", 
                LambdaIntegration.Builder.create(sentimentAnalyzer).build());

        return api;
    }

    private void createEventBridgeRules(final Function slaCheckFunction) {
        Rule slaMonitoringRule = Rule.Builder.create(this, "SLAMonitoringRule" + environmentSuffix)
                .ruleName("support-sla-monitoring-" + environmentSuffix)
                .description("Monitor SLA compliance every 5 minutes")
                .schedule(Schedule.rate(Duration.minutes(5)))
                .targets(Collections.singletonList(new LambdaFunction(slaCheckFunction)))
                .build();

        slaCheckFunction.grantInvoke(new ServicePrincipal("events.amazonaws.com"));
    }

    private Dashboard createCloudWatchDashboard(final Table ticketsTable, 
                                               final QueueResources queues,
                                               final LambdaResources lambdas) {
        Dashboard dashboard = Dashboard.Builder.create(this, "SupportDashboard" + environmentSuffix)
                .dashboardName("support-platform-dashboard-" + environmentSuffix)
                .build();

        IMetric ticketCountMetric = Metric.Builder.create()
                .namespace("AWS/DynamoDB")
                .metricName("ItemCount")
                .dimensionsMap(Collections.singletonMap("TableName", ticketsTable.getTableName()))
                .statistic("Average")
                .period(Duration.minutes(5))
                .build();

        IMetric highPriorityQueueDepth = queues.getHighPriorityQueue()
                .metricApproximateNumberOfMessagesVisible();
        IMetric standardPriorityQueueDepth = queues.getStandardPriorityQueue()
                .metricApproximateNumberOfMessagesVisible();
        IMetric lowPriorityQueueDepth = queues.getLowPriorityQueue()
                .metricApproximateNumberOfMessagesVisible();

        IMetric lambdaErrors = lambdas.getSentimentAnalyzer().metricErrors();
        IMetric lambdaDuration = lambdas.getSentimentAnalyzer().metricDuration();
        IMetric lambdaInvocations = lambdas.getSentimentAnalyzer().metricInvocations();

        dashboard.addWidgets(
                GraphWidget.Builder.create()
                        .title("Ticket Counts")
                        .left(Collections.singletonList(ticketCountMetric))
                        .width(12)
                        .build(),
                GraphWidget.Builder.create()
                        .title("Queue Depths")
                        .left(Arrays.asList(highPriorityQueueDepth, standardPriorityQueueDepth, 
                                           lowPriorityQueueDepth))
                        .width(12)
                        .build()
        );

        dashboard.addWidgets(
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

        return dashboard;
    }

    private void createCloudWatchAlarms(final QueueResources queues, final LambdaResources lambdas) {
        IMetric highPriorityQueueDepth = queues.getHighPriorityQueue()
                .metricApproximateNumberOfMessagesVisible();
        IMetric lambdaErrors = lambdas.getSentimentAnalyzer().metricErrors();
        IMetric dlqDepth = queues.getDeadLetterQueue().metricApproximateNumberOfMessagesVisible();

        Alarm.Builder.create(this, "HighPriorityBacklogAlarm" + environmentSuffix)
                .alarmName("support-high-priority-backlog-" + environmentSuffix)
                .metric(highPriorityQueueDepth)
                .threshold(10)
                .evaluationPeriods(2)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        Alarm.Builder.create(this, "LambdaErrorAlarm" + environmentSuffix)
                .alarmName("support-lambda-errors-" + environmentSuffix)
                .metric(lambdaErrors)
                .threshold(5)
                .evaluationPeriods(1)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        Alarm.Builder.create(this, "DeadLetterQueueAlarm" + environmentSuffix)
                .alarmName("support-dlq-messages-" + environmentSuffix)
                .metric(dlqDepth)
                .threshold(1)
                .evaluationPeriods(1)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();
    }

    private void createOutputs(final OutputResources resources) {
        createDynamoDBOutputs(resources.getTicketsTable());
        createApiGatewayOutputs(resources.getApi());
        createQueueOutputs(resources.getQueues());
        createSNSOutputs(resources.getNotificationTopic());
        createS3Outputs(resources.getBuckets());
        createKendraOutputs(resources.getKendraIndex());
        createStepFunctionsOutputs(resources.getStateMachine());
        createLambdaOutputs(resources.getLambdas());
        createDashboardOutputs(resources.getDashboard());
    }

    private void createDynamoDBOutputs(final Table table) {
        new CfnOutput(this, "DynamoDBTableName", CfnOutputProps.builder()
                .description("DynamoDB Tickets Table Name")
                .value(table.getTableName())
                .exportName("SupportTicketsTableName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DynamoDBTableArn", CfnOutputProps.builder()
                .description("DynamoDB Tickets Table ARN")
                .value(table.getTableArn())
                .exportName("SupportTicketsTableArn-" + environmentSuffix)
                .build());
    }

    private void createApiGatewayOutputs(final RestApi api) {
        new CfnOutput(this, "ApiGatewayUrl", CfnOutputProps.builder()
                .description("API Gateway Endpoint URL")
                .value(api.getUrl())
                .exportName("SupportApiUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "ApiGatewayId", CfnOutputProps.builder()
                .description("API Gateway REST API ID")
                .value(api.getRestApiId())
                .exportName("SupportApiId-" + environmentSuffix)
                .build());
    }

    private void createQueueOutputs(final QueueResources queues) {
        new CfnOutput(this, "HighPriorityQueueUrl", CfnOutputProps.builder()
                .description("High Priority Queue URL")
                .value(queues.getHighPriorityQueue().getQueueUrl())
                .exportName("HighPriorityQueueUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "StandardPriorityQueueUrl", CfnOutputProps.builder()
                .description("Standard Priority Queue URL")
                .value(queues.getStandardPriorityQueue().getQueueUrl())
                .exportName("StandardPriorityQueueUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "LowPriorityQueueUrl", CfnOutputProps.builder()
                .description("Low Priority Queue URL")
                .value(queues.getLowPriorityQueue().getQueueUrl())
                .exportName("LowPriorityQueueUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DeadLetterQueueUrl", CfnOutputProps.builder()
                .description("Dead Letter Queue URL")
                .value(queues.getDeadLetterQueue().getQueueUrl())
                .exportName("DeadLetterQueueUrl-" + environmentSuffix)
                .build());
    }

    private void createSNSOutputs(final Topic topic) {
        new CfnOutput(this, "AgentNotificationTopicArn", CfnOutputProps.builder()
                .description("Agent Notification SNS Topic ARN")
                .value(topic.getTopicArn())
                .exportName("AgentNotificationTopicArn-" + environmentSuffix)
                .build());
    }

    private void createS3Outputs(final BucketResources buckets) {
        new CfnOutput(this, "AttachmentsBucketName", CfnOutputProps.builder()
                .description("Attachments S3 Bucket Name")
                .value(buckets.getAttachmentsBucket().getBucketName())
                .exportName("AttachmentsBucketName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "KnowledgeBaseBucketName", CfnOutputProps.builder()
                .description("Knowledge Base S3 Bucket Name")
                .value(buckets.getKnowledgeBaseBucket().getBucketName())
                .exportName("KnowledgeBaseBucketName-" + environmentSuffix)
                .build());
    }

    private void createKendraOutputs(final CfnIndex kendraIndex) {
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
    }

    private void createStepFunctionsOutputs(final StateMachine stateMachine) {
        new CfnOutput(this, "StepFunctionsArn", CfnOutputProps.builder()
                .description("Escalation Step Functions State Machine ARN")
                .value(stateMachine.getStateMachineArn())
                .exportName("EscalationStateMachineArn-" + environmentSuffix)
                .build());
    }

    private void createLambdaOutputs(final LambdaResources lambdas) {
        new CfnOutput(this, "SentimentAnalyzerFunctionArn", CfnOutputProps.builder()
                .description("Sentiment Analyzer Lambda Function ARN")
                .value(lambdas.getSentimentAnalyzer().getFunctionArn())
                .exportName("SentimentAnalyzerFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "TranslationFunctionArn", CfnOutputProps.builder()
                .description("Translation Lambda Function ARN")
                .value(lambdas.getTranslation().getFunctionArn())
                .exportName("TranslationFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "KnowledgeBaseSearchFunctionArn", CfnOutputProps.builder()
                .description("Knowledge Base Search Lambda Function ARN")
                .value(lambdas.getKnowledgeBaseSearch().getFunctionArn())
                .exportName("KnowledgeBaseSearchFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "EscalationFunctionArn", CfnOutputProps.builder()
                .description("Escalation Lambda Function ARN")
                .value(lambdas.getEscalation().getFunctionArn())
                .exportName("EscalationFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "SLACheckFunctionArn", CfnOutputProps.builder()
                .description("SLA Check Lambda Function ARN")
                .value(lambdas.getSlaCheck().getFunctionArn())
                .exportName("SLACheckFunctionArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "AutoResponseFunctionArn", CfnOutputProps.builder()
                .description("Auto-Response Lambda Function ARN")
                .value(lambdas.getAutoResponse().getFunctionArn())
                .exportName("AutoResponseFunctionArn-" + environmentSuffix)
                .build());
    }

    private void createDashboardOutputs(final Dashboard dashboard) {
        new CfnOutput(this, "CloudWatchDashboardName", CfnOutputProps.builder()
                .description("CloudWatch Dashboard Name")
                .value(dashboard.getDashboardName())
                .exportName("SupportDashboardName-" + environmentSuffix)
                .build());
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the TAP CDK Java application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        if (account == null) {
            account = System.getenv("AWS_ACCOUNT_ID");
        }

        String region = System.getenv("CDK_DEFAULT_REGION");
        if (region == null) {
            region = System.getenv("AWS_REGION");
        }
        if (region == null) {
            region = "us-east-1";
        }

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

        app.synth();
    }
}