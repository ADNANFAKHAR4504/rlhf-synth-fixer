package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.apigatewayv2.CfnApi;
import software.amazon.awscdk.services.apigatewayv2.CfnApiProps;
import software.amazon.awscdk.services.apigatewayv2.CfnIntegration;
import software.amazon.awscdk.services.apigatewayv2.CfnIntegrationProps;
import software.amazon.awscdk.services.apigatewayv2.CfnRoute;
import software.amazon.awscdk.services.apigatewayv2.CfnRouteProps;
import software.amazon.awscdk.services.apigatewayv2.CfnStage;
import software.amazon.awscdk.services.apigatewayv2.CfnStageProps;
import software.amazon.awscdk.services.appsync.GraphqlApi;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.AlarmProps;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Dashboard;
import software.amazon.awscdk.services.cloudwatch.DashboardProps;
import software.amazon.awscdk.services.cloudwatch.GraphWidget;
import software.amazon.awscdk.services.cloudwatch.GraphWidgetProps;
import software.amazon.awscdk.services.cloudwatch.IMetric;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.MetricOptions;
import software.amazon.awscdk.services.cognito.AccountRecovery;
import software.amazon.awscdk.services.cognito.CfnUserPoolGroup;
import software.amazon.awscdk.services.cognito.CfnUserPoolGroupProps;
import software.amazon.awscdk.services.cognito.Mfa;
import software.amazon.awscdk.services.cognito.SignInAliases;
import software.amazon.awscdk.services.cognito.UserPool;
import software.amazon.awscdk.services.cognito.UserPoolClient;
import software.amazon.awscdk.services.cognito.UserPoolClientProps;
import software.amazon.awscdk.services.cognito.UserPoolProps;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.StreamViewType;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.dynamodb.TableProps;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.elasticache.CfnCacheCluster;
import software.amazon.awscdk.services.elasticache.CfnCacheClusterProps;
import software.amazon.awscdk.services.elasticache.CfnSubnetGroup;
import software.amazon.awscdk.services.elasticache.CfnSubnetGroupProps;
import software.amazon.awscdk.services.events.EventBus;
import software.amazon.awscdk.services.events.EventBusProps;
import software.amazon.awscdk.services.events.EventPattern;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.RuleProps;
import software.amazon.awscdk.services.events.targets.LambdaFunction;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.PolicyStatementProps;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.FunctionProps;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Tracing;
import software.amazon.awscdk.services.lambda.eventsources.DynamoEventSource;
import software.amazon.awscdk.services.lambda.eventsources.DynamoEventSourceProps;
import software.amazon.awscdk.services.lambda.StartingPosition;
import software.amazon.awscdk.services.opensearchservice.CapacityConfig;
import software.amazon.awscdk.services.opensearchservice.Domain;
import software.amazon.awscdk.services.opensearchservice.DomainProps;
import software.amazon.awscdk.services.opensearchservice.EngineVersion;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sns.TopicProps;
import software.amazon.awscdk.services.sns.subscriptions.LambdaSubscription;
import software.amazon.awscdk.services.stepfunctions.Chain;
import software.amazon.awscdk.services.stepfunctions.StateMachine;
import software.amazon.awscdk.services.stepfunctions.StateMachineProps;
import software.amazon.awscdk.services.stepfunctions.StateMachineType;
import software.amazon.awscdk.services.stepfunctions.Succeed;
import software.amazon.awscdk.services.stepfunctions.tasks.DynamoAttributeValue;
import software.amazon.awscdk.services.stepfunctions.tasks.DynamoPutItem;
import software.amazon.awscdk.services.stepfunctions.tasks.DynamoPutItemProps;
import software.amazon.awscdk.services.stepfunctions.tasks.LambdaInvoke;
import software.amazon.awscdk.services.stepfunctions.tasks.LambdaInvokeProps;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
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
 * Helper class to hold VPC and networking resources.
 */
final class NetworkResources {
    private final IVpc vpc;
    private final SecurityGroup lambdaSecurityGroup;
    private final SecurityGroup redisSecurityGroup;

    NetworkResources(final IVpc vpcResource, final SecurityGroup lambdaSg, final SecurityGroup redisSg) {
        this.vpc = vpcResource;
        this.lambdaSecurityGroup = lambdaSg;
        this.redisSecurityGroup = redisSg;
    }

    public IVpc getVpc() {
        return vpc;
    }

    public SecurityGroup getLambdaSecurityGroup() {
        return lambdaSecurityGroup;
    }

    public SecurityGroup getRedisSecurityGroup() {
        return redisSecurityGroup;
    }
}

/**
 * Helper class to hold Cognito authentication resources.
 */
final class AuthResources {
    private final UserPool userPool;
    private final UserPoolClient userPoolClient;
    private final CfnUserPoolGroup editorGroup;
    private final CfnUserPoolGroup viewerGroup;

    AuthResources(final UserPool pool, final UserPoolClient client, 
                  final CfnUserPoolGroup editors, final CfnUserPoolGroup viewers) {
        this.userPool = pool;
        this.userPoolClient = client;
        this.editorGroup = editors;
        this.viewerGroup = viewers;
    }

    public UserPool getUserPool() {
        return userPool;
    }

    public UserPoolClient getUserPoolClient() {
        return userPoolClient;
    }

    public CfnUserPoolGroup getEditorGroup() {
        return editorGroup;
    }

    public CfnUserPoolGroup getViewerGroup() {
        return viewerGroup;
    }
}

/**
 * Helper class to hold DynamoDB table resources.
 */
final class DocumentDataResources {
    private final Table documentsTable;
    private final Table operationsTable;
    private final Table connectionsTable;

    DocumentDataResources(final Table docs, final Table ops, final Table conns) {
        this.documentsTable = docs;
        this.operationsTable = ops;
        this.connectionsTable = conns;
    }

    public Table getDocumentsTable() {
        return documentsTable;
    }

    public Table getOperationsTable() {
        return operationsTable;
    }

    public Table getConnectionsTable() {
        return connectionsTable;
    }
}

/**
 * Helper class to hold S3 bucket resources.
 */
final class StorageResources {
    private final Bucket documentBucket;

    StorageResources(final Bucket bucket) {
        this.documentBucket = bucket;
    }

    public Bucket getDocumentBucket() {
        return documentBucket;
    }
}

/**
 * Helper class to hold ElastiCache resources.
 */
final class CacheResources {
    private final CfnSubnetGroup subnetGroup;
    private final CfnCacheCluster redisCluster;

    CacheResources(final CfnSubnetGroup subnet, final CfnCacheCluster cluster) {
        this.subnetGroup = subnet;
        this.redisCluster = cluster;
    }

    public CfnSubnetGroup getSubnetGroup() {
        return subnetGroup;
    }

    public CfnCacheCluster getRedisCluster() {
        return redisCluster;
    }
}

/**
 * Helper class to hold Lambda function resources.
 */
final class LambdaResources {
    private final Function connectionHandler;
    private final Function messageHandler;
    private final Function conflictResolutionHandler;
    private final Function notificationHandler;
    private final Function indexingHandler;
    private final Function searchHandler;

    LambdaResources(final Function conn, final Function msg, final Function conflict,
                    final Function notif, final Function index, final Function search) {
        this.connectionHandler = conn;
        this.messageHandler = msg;
        this.conflictResolutionHandler = conflict;
        this.notificationHandler = notif;
        this.indexingHandler = index;
        this.searchHandler = search;
    }

    public Function getConnectionHandler() {
        return connectionHandler;
    }

    public Function getMessageHandler() {
        return messageHandler;
    }

    public Function getConflictResolutionHandler() {
        return conflictResolutionHandler;
    }

    public Function getNotificationHandler() {
        return notificationHandler;
    }

    public Function getIndexingHandler() {
        return indexingHandler;
    }

    public Function getSearchHandler() {
        return searchHandler;
    }
}

/**
 * Helper class to hold WebSocket API resources.
 */
final class WebSocketResources {
    private final CfnApi webSocketApi;
    private final CfnStage stage;

    WebSocketResources(final CfnApi api, final CfnStage stg) {
        this.webSocketApi = api;
        this.stage = stg;
    }

    public CfnApi getWebSocketApi() {
        return webSocketApi;
    }

    public CfnStage getStage() {
        return stage;
    }
}

/**
 * Helper class to hold AppSync API resources.
 */
final class AppSyncResources {
    private final GraphqlApi api;

    AppSyncResources(final GraphqlApi graphqlApi) {
        this.api = graphqlApi;
    }

    public GraphqlApi getApi() {
        return api;
    }
}

/**
 * Helper class to hold EventBridge resources.
 */
final class EventResources {
    private final EventBus eventBus;
    private final Rule documentUpdatedRule;

    EventResources(final EventBus bus, final Rule rule) {
        this.eventBus = bus;
        this.documentUpdatedRule = rule;
    }

    public EventBus getEventBus() {
        return eventBus;
    }

    public Rule getDocumentUpdatedRule() {
        return documentUpdatedRule;
    }
}

/**
 * Helper class to hold OpenSearch resources.
 */
final class SearchResources {
    private final Domain openSearchDomain;

    SearchResources(final Domain domain) {
        this.openSearchDomain = domain;
    }

    public Domain getOpenSearchDomain() {
        return openSearchDomain;
    }
}

/**
 * Helper class to hold all output resources.
 */
final class OutputResources {
    private final WebSocketResources webSocket;
    private final AppSyncResources appSync;
    private final AuthResources auth;
    private final DocumentDataResources data;
    private final StorageResources storage;
    private final SearchResources search;
    private final Dashboard dashboard;

    OutputResources(final WebSocketResources ws, final AppSyncResources aps,
                   final AuthResources au, final DocumentDataResources dat,
                   final StorageResources stor, final SearchResources srch,
                   final Dashboard dash) {
        this.webSocket = ws;
        this.appSync = aps;
        this.auth = au;
        this.data = dat;
        this.storage = stor;
        this.search = srch;
        this.dashboard = dash;
    }

    public WebSocketResources getWebSocket() {
        return webSocket;
    }

    public AppSyncResources getAppSync() {
        return appSync;
    }

    public AuthResources getAuth() {
        return auth;
    }

    public DocumentDataResources getData() {
        return data;
    }

    public StorageResources getStorage() {
        return storage;
    }

    public SearchResources getSearch() {
        return search;
    }

    public Dashboard getDashboard() {
        return dashboard;
    }
}

/**
 * Represents the main CDK stack for the Document Collaboration System.
 *
 * This stack creates all AWS resources needed for a real-time document
 * collaboration platform with WebSocket support, conflict resolution,
 * and version history.
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = determineEnvironmentSuffix(props);

        // Create resources in dependency order
        NetworkResources network = createNetworkResources();
        AuthResources auth = createAuthResources();
        DocumentDataResources data = createDocumentDataResources();
        StorageResources storage = createStorageResources();
        CacheResources cache = createCacheResources(network);
        SearchResources search = createSearchResources();
        
        LambdaResources lambdas = createLambdaFunctions(network, data, storage, cache, search);
        
        WebSocketResources webSocket = createWebSocketApi(lambdas);
        // AppSyncResources appSync = createAppSyncApi(auth);
        
        StateMachine workflow = createStepFunctionsWorkflow(lambdas, data);
        
        Topic notificationTopic = createNotificationTopic();
        notificationTopic.addSubscription(new LambdaSubscription(lambdas.getNotificationHandler()));
        
        EventResources events = createEventBridgeResources(lambdas);
        
        Dashboard dashboard = createCloudWatchDashboard(data, lambdas);
        createCloudWatchAlarms(lambdas);
        
        // Wire up DynamoDB Streams
        configureDynamoStreams(lambdas, data);
        
        OutputResources outputs = new OutputResources(webSocket, null, auth, data, 
                                                      storage, search, dashboard);
        createOutputs(outputs);
    }

    private String determineEnvironmentSuffix(final TapStackProps props) {
        return Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");
    }

    private NetworkResources createNetworkResources() {
        Vpc vpc = new Vpc(this, "DocumentCollabVpc" + environmentSuffix, VpcProps.builder()
                .vpcName("document-collab-vpc-" + environmentSuffix)
                .maxAzs(2)
                .natGateways(1)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("Public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()
                ))
                .build());

        SecurityGroup lambdaSg = new SecurityGroup(this, "LambdaSecurityGroup" + environmentSuffix,
                SecurityGroupProps.builder()
                        .vpc(vpc)
                        .description("Security group for Lambda functions")
                        .allowAllOutbound(true)
                        .build());

        SecurityGroup redisSg = new SecurityGroup(this, "RedisSecurityGroup" + environmentSuffix,
                SecurityGroupProps.builder()
                        .vpc(vpc)
                        .description("Security group for Redis cluster")
                        .allowAllOutbound(false)
                        .build());

        redisSg.addIngressRule(lambdaSg, 
                software.amazon.awscdk.services.ec2.Port.tcp(6379), 
                "Allow Lambda to access Redis");

        return new NetworkResources(vpc, lambdaSg, redisSg);
    }

    private AuthResources createAuthResources() {
        UserPool userPool = new UserPool(this, "UserPool" + environmentSuffix, UserPoolProps.builder()
                .userPoolName("DocumentCollabUserPool-" + environmentSuffix)
                .selfSignUpEnabled(true)
                .signInAliases(SignInAliases.builder()
                        .email(true)
                        .username(true)
                        .build())
                .mfa(Mfa.OPTIONAL)
                .accountRecovery(AccountRecovery.EMAIL_ONLY)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build());

        UserPoolClient client = new UserPoolClient(this, "UserPoolClient" + environmentSuffix,
                UserPoolClientProps.builder()
                        .userPool(userPool)
                        .userPoolClientName("document-collab-client-" + environmentSuffix)
                        .generateSecret(false)
                        .build());

        CfnUserPoolGroup editorGroup = new CfnUserPoolGroup(this, "EditorGroup" + environmentSuffix,
                CfnUserPoolGroupProps.builder()
                        .userPoolId(userPool.getUserPoolId())
                        .groupName("editors")
                        .description("Users with edit access")
                        .precedence(1)
                        .build());

        CfnUserPoolGroup viewerGroup = new CfnUserPoolGroup(this, "ViewerGroup" + environmentSuffix,
                CfnUserPoolGroupProps.builder()
                        .userPoolId(userPool.getUserPoolId())
                        .groupName("viewers")
                        .description("Users with view-only access")
                        .precedence(2)
                        .build());

        return new AuthResources(userPool, client, editorGroup, viewerGroup);
    }

    private DocumentDataResources createDocumentDataResources() {
        Table documentsTable = new Table(this, "DocumentsTable" + environmentSuffix,
                TableProps.builder()
                        .tableName("DocumentCollabDocuments-" + environmentSuffix)
                        .partitionKey(Attribute.builder()
                                .name("documentId")
                                .type(AttributeType.STRING)
                                .build())
                        .billingMode(BillingMode.PAY_PER_REQUEST)
                        .pointInTimeRecoverySpecification(software.amazon.awscdk.services.dynamodb.PointInTimeRecoverySpecification.builder()
                                .pointInTimeRecoveryEnabled(true)
                                .build())
                        .removalPolicy(RemovalPolicy.RETAIN)
                        .build());

        Table operationsTable = new Table(this, "OperationsTable" + environmentSuffix,
                TableProps.builder()
                        .tableName("DocumentCollabOperations-" + environmentSuffix)
                        .partitionKey(Attribute.builder()
                                .name("documentId")
                                .type(AttributeType.STRING)
                                .build())
                        .sortKey(Attribute.builder()
                                .name("timestamp")
                                .type(AttributeType.NUMBER)
                                .build())
                        .billingMode(BillingMode.PAY_PER_REQUEST)
                        .stream(StreamViewType.NEW_AND_OLD_IMAGES)
                        .removalPolicy(RemovalPolicy.DESTROY)
                        .build());

        Table connectionsTable = new Table(this, "ConnectionsTable" + environmentSuffix,
                TableProps.builder()
                        .tableName("DocumentCollabConnections-" + environmentSuffix)
                        .partitionKey(Attribute.builder()
                                .name("connectionId")
                                .type(AttributeType.STRING)
                                .build())
                        .billingMode(BillingMode.PAY_PER_REQUEST)
                        .timeToLiveAttribute("ttl")
                        .removalPolicy(RemovalPolicy.DESTROY)
                        .build());

        return new DocumentDataResources(documentsTable, operationsTable, connectionsTable);
    }

    private StorageResources createStorageResources() {
        Bucket documentBucket = new Bucket(this, "DocumentBucket" + environmentSuffix,
                BucketProps.builder()
                        .bucketName("document-collab-" + environmentSuffix.toLowerCase() 
                                   + "-" + this.getAccount())
                        .versioned(true)
                        .encryption(BucketEncryption.S3_MANAGED)
                        .blockPublicAccess(software.amazon.awscdk.services.s3.BlockPublicAccess.BLOCK_ALL)
                        .lifecycleRules(Collections.singletonList(
                                LifecycleRule.builder()
                                        .noncurrentVersionExpiration(Duration.days(365))
                                        .build()
                        ))
                        .removalPolicy(RemovalPolicy.DESTROY)
                        .autoDeleteObjects(true)
                        .build());

        return new StorageResources(documentBucket);
    }

    private CacheResources createCacheResources(final NetworkResources network) {
        List<String> subnetIds = network.getVpc().getPrivateSubnets().stream()
                .map(subnet -> subnet.getSubnetId())
                .collect(Collectors.toList());

        CfnSubnetGroup subnetGroup = new CfnSubnetGroup(this, "RedisSubnetGroup" + environmentSuffix,
                CfnSubnetGroupProps.builder()
                        .cacheSubnetGroupName("document-collab-redis-subnet-" + environmentSuffix)
                        .subnetIds(subnetIds)
                        .description("Subnet group for Redis cluster")
                        .build());

        CfnCacheCluster redisCluster = new CfnCacheCluster(this, "RedisCluster" + environmentSuffix,
                CfnCacheClusterProps.builder()
                        .clusterName("doc-collab-redis-" + environmentSuffix)
                        .cacheNodeType("cache.t3.medium")
                        .engine("redis")
                        .numCacheNodes(1)
                        .cacheSubnetGroupName(subnetGroup.getCacheSubnetGroupName())
                        .vpcSecurityGroupIds(Collections.singletonList(
                                network.getRedisSecurityGroup().getSecurityGroupId()))
                        .build());

        redisCluster.addDependency(subnetGroup);

        return new CacheResources(subnetGroup, redisCluster);
    }

    private SearchResources createSearchResources() {
        Domain openSearchDomain = new Domain(this, "DocumentSearchDomain" + environmentSuffix,
                DomainProps.builder()
                        .domainName("doc-search-" + environmentSuffix)
                        .version(EngineVersion.OPENSEARCH_2_5)
                        .capacity(CapacityConfig.builder()
                                .dataNodeInstanceType("t3.small.search")
                                .dataNodes(1)
                                .multiAzWithStandbyEnabled(false)
                                .build())
                        .ebs(software.amazon.awscdk.services.opensearchservice.EbsOptions.builder()
                                .enabled(true)
                                .volumeSize(10)
                                .volumeType(software.amazon.awscdk.services.ec2.EbsDeviceVolumeType.GP3)
                                .build())
                        .nodeToNodeEncryption(true)
                        .encryptionAtRest(software.amazon.awscdk.services.opensearchservice.EncryptionAtRestOptions.builder()
                                .enabled(true)
                                .build())
                        .enforceHttps(true)
                        .removalPolicy(RemovalPolicy.DESTROY)
                        .build());

        return new SearchResources(openSearchDomain);
    }

    private LambdaResources createLambdaFunctions(final NetworkResources network,
                                                   final DocumentDataResources data,
                                                   final StorageResources storage,
                                                   final CacheResources cache,
                                                   final SearchResources search) {
        Role lambdaRole = createLambdaExecutionRole(data, storage, search);

        Map<String, String> commonEnv = new HashMap<>();
        commonEnv.put("DOCUMENTS_TABLE", data.getDocumentsTable().getTableName());
        commonEnv.put("OPERATIONS_TABLE", data.getOperationsTable().getTableName());
        commonEnv.put("CONNECTIONS_TABLE", data.getConnectionsTable().getTableName());
        commonEnv.put("DOCUMENT_BUCKET", storage.getDocumentBucket().getBucketName());
        commonEnv.put("REDIS_ENDPOINT", cache.getRedisCluster().getAttrRedisEndpointAddress());
        commonEnv.put("OPENSEARCH_ENDPOINT", search.getOpenSearchDomain().getDomainEndpoint());

        Function connectionHandler = createLambdaFunction("ConnectionHandler",
                "document-collab-connection", "lambda/connection-handler", 512, 30, 
                lambdaRole, commonEnv);

        Function messageHandler = createLambdaFunction("MessageHandler",
                "document-collab-message", "lambda/message-handler", 1024, 30, 
                lambdaRole, commonEnv);

        Function conflictResolutionHandler = createLambdaFunction("ConflictResolutionHandler",
                "document-collab-conflict", "lambda/conflict-resolution", 1024, 30, 
                lambdaRole, commonEnv);

        Function notificationHandler = createLambdaFunction("NotificationHandler",
                "document-collab-notification", "lambda/notification-handler", 512, 30, 
                lambdaRole, commonEnv);

        Function indexingHandler = createLambdaFunction("IndexingHandler",
                "document-collab-indexing", "lambda/indexing-handler", 512, 60, 
                lambdaRole, commonEnv);

        Function searchHandler = createLambdaFunction("SearchHandler",
                "document-collab-search", "lambda/search-handler", 512, 30, 
                lambdaRole, commonEnv);

        return new LambdaResources(connectionHandler, messageHandler, conflictResolutionHandler,
                                  notificationHandler, indexingHandler, searchHandler);
    }

    private Role createLambdaExecutionRole(final DocumentDataResources data,
                                          final StorageResources storage,
                                          final SearchResources search) {
        Role role = new Role(this, "LambdaExecutionRole" + environmentSuffix, RoleProps.builder()
                .roleName("document-collab-lambda-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName(
                                "service-role/AWSLambdaBasicExecutionRole"),
                        software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName(
                                "service-role/AWSLambdaVPCAccessExecutionRole")
                ))
                .build());

        // DynamoDB permissions
        role.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("dynamodb:PutItem", "dynamodb:GetItem", 
                        "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Query", 
                        "dynamodb:Scan", "dynamodb:BatchWriteItem"))
                .resources(Arrays.asList(
                        data.getDocumentsTable().getTableArn(),
                        data.getOperationsTable().getTableArn(),
                        data.getConnectionsTable().getTableArn(),
                        data.getOperationsTable().getTableArn() + "/index/*"
                ))
                .build()));

        // S3 permissions
        role.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("s3:GetObject", "s3:PutObject", "s3:DeleteObject", 
                        "s3:ListBucket"))
                .resources(Arrays.asList(
                        storage.getDocumentBucket().getBucketArn(),
                        storage.getDocumentBucket().getBucketArn() + "/*"
                ))
                .build()));

        // OpenSearch permissions
        role.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("es:ESHttpGet", "es:ESHttpPut", "es:ESHttpPost", 
                        "es:ESHttpDelete"))
                .resources(Collections.singletonList(search.getOpenSearchDomain().getDomainArn() + "/*"))
                .build()));

        // X-Ray permissions
        role.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("xray:PutTraceSegments", "xray:PutTelemetryRecords"))
                .resources(Collections.singletonList("*"))
                .build()));

        // API Gateway Management API permissions for WebSocket
        role.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Collections.singletonList("execute-api:ManageConnections"))
                .resources(Collections.singletonList("arn:aws:execute-api:*:*:*/@connections/*"))
                .build()));

        return role;
    }

    private Function createLambdaFunction(final String id, final String functionName,
                                         final String codePath, final int memory,
                                         final int timeout, final Role role,
                                         final Map<String, String> environment) {
        return new Function(this, id + environmentSuffix, FunctionProps.builder()
                .functionName(functionName + "-" + environmentSuffix)
                .runtime(Runtime.PYTHON_3_12)
                .handler("index.handler")
                .code(Code.fromInline(
                        "import json\n"
                        + "import time\n\n"
                        + "def handler(event, context):\n"
                        + "    try:\n"
                        + "        user_id = event.get('userId')\n"
                        + "        doc_id = event.get('documentId')\n"
                        + "        \n"
                        + "        if not user_id:\n"
                        + "            return {\n"
                        + "                'statusCode': 400,\n"
                        + "                'body': json.dumps({'error': 'userId is required'})\n"
                        + "            }\n"
                        + "        \n"
                        + "        return {\n"
                        + "            'statusCode': 200,\n"
                        + "            'body': json.dumps({\n"
                        + "                'message': 'Document access validated',\n"
                        + "                'userId': user_id,\n"
                        + "                'documentId': doc_id,\n"
                        + "                'timestamp': int(time.time())\n"
                        + "            })\n"
                        + "        }\n"
                        + "    except Exception as e:\n"
                        + "        return {\n"
                        + "            'statusCode': 500,\n"
                        + "            'body': json.dumps({'error': str(e)})\n"
                        + "        }\n"
                ))
                .role(role)
                .timeout(Duration.seconds(timeout))
                .memorySize(memory)
                .tracing(Tracing.ACTIVE)
                .environment(environment)
                .build());
    }

    private WebSocketResources createWebSocketApi(final LambdaResources lambdas) {
        // Create WebSocket API
        CfnApi webSocketApi = new CfnApi(this, "DocumentCollabWebSocket" + environmentSuffix,
                CfnApiProps.builder()
                        .name("document-collaboration-websocket-" + environmentSuffix)
                        .protocolType("WEBSOCKET")
                        .routeSelectionExpression("$request.body.action")
                        .description("WebSocket API for real-time document collaboration")
                        .build());

        // Create Lambda integrations
        CfnIntegration connectIntegration = new CfnIntegration(this, 
                "ConnectIntegration" + environmentSuffix,
                CfnIntegrationProps.builder()
                        .apiId(webSocketApi.getRef())
                        .integrationType("AWS_PROXY")
                        .integrationUri("arn:aws:apigateway:" + this.getRegion() 
                                + ":lambda:path/2015-03-31/functions/" 
                                + lambdas.getConnectionHandler().getFunctionArn() 
                                + "/invocations")
                        .build());

        CfnIntegration disconnectIntegration = new CfnIntegration(this, 
                "DisconnectIntegration" + environmentSuffix,
                CfnIntegrationProps.builder()
                        .apiId(webSocketApi.getRef())
                        .integrationType("AWS_PROXY")
                        .integrationUri("arn:aws:apigateway:" + this.getRegion() 
                                + ":lambda:path/2015-03-31/functions/" 
                                + lambdas.getConnectionHandler().getFunctionArn() 
                                + "/invocations")
                        .build());

        CfnIntegration defaultIntegration = new CfnIntegration(this, 
                "DefaultIntegration" + environmentSuffix,
                CfnIntegrationProps.builder()
                        .apiId(webSocketApi.getRef())
                        .integrationType("AWS_PROXY")
                        .integrationUri("arn:aws:apigateway:" + this.getRegion() 
                                + ":lambda:path/2015-03-31/functions/" 
                                + lambdas.getMessageHandler().getFunctionArn() 
                                + "/invocations")
                        .build());

        // Create routes
        new CfnRoute(this, "ConnectRoute" + environmentSuffix,
                CfnRouteProps.builder()
                        .apiId(webSocketApi.getRef())
                        .routeKey("$connect")
                        .target("integrations/" + connectIntegration.getRef())
                        .build());

        new CfnRoute(this, "DisconnectRoute" + environmentSuffix,
                CfnRouteProps.builder()
                        .apiId(webSocketApi.getRef())
                        .routeKey("$disconnect")
                        .target("integrations/" + disconnectIntegration.getRef())
                        .build());

        new CfnRoute(this, "DefaultRoute" + environmentSuffix,
                CfnRouteProps.builder()
                        .apiId(webSocketApi.getRef())
                        .routeKey("$default")
                        .target("integrations/" + defaultIntegration.getRef())
                        .build());

        // Create stage
        CfnStage stage = new CfnStage(this, "ProdStage" + environmentSuffix,
                CfnStageProps.builder()
                        .apiId(webSocketApi.getRef())
                        .stageName("prod")
                        .autoDeploy(true)
                        .build());

        // Grant API Gateway permission to invoke Lambda functions
        lambdas.getConnectionHandler().addPermission("AllowApiGatewayInvokeConnect",
                software.amazon.awscdk.services.lambda.Permission.builder()
                        .principal(new ServicePrincipal("apigateway.amazonaws.com"))
                        .action("lambda:InvokeFunction")
                        .sourceArn("arn:aws:execute-api:" + this.getRegion() + ":" 
                                + this.getAccount() + ":" + webSocketApi.getRef() + "/*")
                        .build());

        lambdas.getMessageHandler().addPermission("AllowApiGatewayInvokeMessage",
                software.amazon.awscdk.services.lambda.Permission.builder()
                        .principal(new ServicePrincipal("apigateway.amazonaws.com"))
                        .action("lambda:InvokeFunction")
                        .sourceArn("arn:aws:execute-api:" + this.getRegion() + ":" 
                                + this.getAccount() + ":" + webSocketApi.getRef() + "/*")
                        .build());

        return new WebSocketResources(webSocketApi, stage);
    }

    private StateMachine createStepFunctionsWorkflow(final LambdaResources lambdas,
                                                     final DocumentDataResources data) {
        Role stepFunctionsRole = new Role(this, "StepFunctionsRole" + environmentSuffix,
                RoleProps.builder()
                        .roleName("document-collab-stepfunctions-" + environmentSuffix)
                        .assumedBy(new ServicePrincipal("states.amazonaws.com"))
                        .build());

        stepFunctionsRole.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Collections.singletonList("lambda:InvokeFunction"))
                .resources(Collections.singletonList(lambdas.getMessageHandler().getFunctionArn()))
                .build()));

        stepFunctionsRole.addToPolicy(new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem"))
                .resources(Collections.singletonList(data.getDocumentsTable().getTableArn()))
                .build()));

        LambdaInvoke validateTask = new LambdaInvoke(this, "ValidateInput" + environmentSuffix,
                LambdaInvokeProps.builder()
                        .lambdaFunction(lambdas.getMessageHandler())
                        .outputPath("$.Payload")
                        .build());

        Map<String, DynamoAttributeValue> itemMap = new HashMap<>();
        itemMap.put("documentId", DynamoAttributeValue.fromString(
                software.amazon.awscdk.services.stepfunctions.JsonPath.stringAt("$.documentId")));
        itemMap.put("content", DynamoAttributeValue.fromString(
                software.amazon.awscdk.services.stepfunctions.JsonPath.stringAt("$.content")));
        itemMap.put("createdAt", DynamoAttributeValue.fromNumber(
                software.amazon.awscdk.services.stepfunctions.JsonPath.numberAt("$.timestamp")));

        DynamoPutItem createRecordTask = new DynamoPutItem(this, "CreateDynamoRecord" + environmentSuffix,
                DynamoPutItemProps.builder()
                        .table(data.getDocumentsTable())
                        .item(itemMap)
                        .build());

        Succeed successState = new Succeed(this, "Success" + environmentSuffix, 
                software.amazon.awscdk.services.stepfunctions.SucceedProps.builder()
                        .comment("Document creation workflow completed successfully")
                        .build());

        Chain definition = Chain.start(validateTask)
                .next(createRecordTask)
                .next(successState);

        StateMachine workflow = new StateMachine(this, "DocumentCreationWorkflow" + environmentSuffix,
                StateMachineProps.builder()
                        .stateMachineName("document-creation-workflow-" + environmentSuffix)
                        .definition(definition)
                        .stateMachineType(StateMachineType.STANDARD)
                        .role(stepFunctionsRole)
                        .tracingEnabled(true)
                        .build());

        return workflow;
    }

    private Topic createNotificationTopic() {
        return new Topic(this, "DocumentUpdatesTopic" + environmentSuffix, TopicProps.builder()
                .topicName("DocumentUpdates-" + environmentSuffix)
                .displayName("Document Collaboration Updates")
                .build());
    }

    private EventResources createEventBridgeResources(final LambdaResources lambdas) {
        EventBus documentEventBus = new EventBus(this, "DocumentEventBus" + environmentSuffix,
                EventBusProps.builder()
                        .eventBusName("DocumentCollaborationEventBus-" + environmentSuffix)
                        .build());

        Rule documentUpdatedRule = new Rule(this, "DocumentUpdatedRule" + environmentSuffix,
                RuleProps.builder()
                        .eventBus(documentEventBus)
                        .ruleName("document-updated-rule-" + environmentSuffix)
                        .eventPattern(EventPattern.builder()
                                .source(Collections.singletonList("document.collaboration"))
                                .detailType(Collections.singletonList("Document Updated"))
                                .build())
                        .targets(Collections.singletonList(
                                new LambdaFunction(lambdas.getNotificationHandler())))
                        .build());

        return new EventResources(documentEventBus, documentUpdatedRule);
    }

    private void configureDynamoStreams(final LambdaResources lambdas,
                                       final DocumentDataResources data) {
        DynamoEventSource eventSource = new DynamoEventSource(data.getOperationsTable(),
                DynamoEventSourceProps.builder()
                        .startingPosition(StartingPosition.TRIM_HORIZON)
                        .batchSize(100)
                        .retryAttempts(3)
                        .build());

        lambdas.getConflictResolutionHandler().addEventSource(eventSource);
    }

    private Dashboard createCloudWatchDashboard(final DocumentDataResources data,
                                                final LambdaResources lambdas) {
        Dashboard dashboard = new Dashboard(this, "DocumentCollabDashboard" + environmentSuffix,
                DashboardProps.builder()
                        .dashboardName("DocumentCollaboration-" + environmentSuffix)
                        .build());

        IMetric operationLatencyMetric = Metric.Builder.create()
                .namespace("DocumentCollab")
                .metricName("OperationLatency")
                .statistic("Average")
                .period(Duration.minutes(1))
                .build();

        IMetric activeConnectionsMetric = Metric.Builder.create()
                .namespace("DocumentCollab")
                .metricName("ActiveConnections")
                .statistic("Sum")
                .period(Duration.minutes(1))
                .build();

        IMetric lambdaErrors = lambdas.getMessageHandler().metricErrors(
                MetricOptions.builder().period(Duration.minutes(5)).build());
        
        IMetric lambdaDuration = lambdas.getMessageHandler().metricDuration(
                MetricOptions.builder().period(Duration.minutes(5)).build());

        dashboard.addWidgets(
                new GraphWidget(GraphWidgetProps.builder()
                        .title("Operation Latency")
                        .left(Collections.singletonList(operationLatencyMetric))
                        .width(12)
                        .build()),
                new GraphWidget(GraphWidgetProps.builder()
                        .title("Active Connections")
                        .left(Collections.singletonList(activeConnectionsMetric))
                        .width(12)
                        .build())
        );

        dashboard.addWidgets(
                new GraphWidget(GraphWidgetProps.builder()
                        .title("Lambda Performance")
                        .left(Arrays.asList(lambdaErrors, lambdaDuration))
                        .width(12)
                        .build())
        );

        return dashboard;
    }

    private void createCloudWatchAlarms(final LambdaResources lambdas) {
        IMetric messageHandlerErrors = lambdas.getMessageHandler().metricErrors(
                MetricOptions.builder().period(Duration.minutes(5)).build());

        new Alarm(this, "HighErrorRateAlarm" + environmentSuffix, AlarmProps.builder()
                .alarmName("document-collab-high-errors-" + environmentSuffix)
                .metric(messageHandlerErrors)
                .threshold(10)
                .evaluationPeriods(2)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .build());

        IMetric messageHandlerDuration = lambdas.getMessageHandler().metricDuration(
                MetricOptions.builder().period(Duration.minutes(5)).build());

        new Alarm(this, "HighLatencyAlarm" + environmentSuffix, AlarmProps.builder()
                .alarmName("document-collab-high-latency-" + environmentSuffix)
                .metric(messageHandlerDuration)
                .threshold(100)
                .evaluationPeriods(2)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .build());
    }

    private void createOutputs(final OutputResources resources) {
        new CfnOutput(this, "WebSocketApiUrl", CfnOutputProps.builder()
                .description("WebSocket API endpoint")
                .value("wss://" + resources.getWebSocket().getWebSocketApi().getRef() 
                        + ".execute-api." + this.getRegion() + ".amazonaws.com/" 
                        + resources.getWebSocket().getStage().getStageName())
                .exportName("WebSocketApiUrl-" + environmentSuffix)
                .build());

        new CfnOutput(this, "WebSocketApiId", CfnOutputProps.builder()
                .description("WebSocket API ID")
                .value(resources.getWebSocket().getWebSocketApi().getRef())
                .exportName("WebSocketApiId-" + environmentSuffix)
                .build());

        if (resources.getAppSync() != null) {
            new CfnOutput(this, "AppSyncApiUrl", CfnOutputProps.builder()
                    .description("AppSync GraphQL API endpoint")
                    .value(resources.getAppSync().getApi().getGraphqlUrl())
                    .exportName("AppSyncApiUrl-" + environmentSuffix)
                    .build());

            new CfnOutput(this, "AppSyncApiId", CfnOutputProps.builder()
                    .description("AppSync GraphQL API ID")
                    .value(resources.getAppSync().getApi().getApiId())
                    .exportName("AppSyncApiId-" + environmentSuffix)
                    .build());
        }

        new CfnOutput(this, "CognitoUserPoolId", CfnOutputProps.builder()
                .description("Cognito User Pool ID")
                .value(resources.getAuth().getUserPool().getUserPoolId())
                .exportName("CognitoUserPoolId-" + environmentSuffix)
                .build());

        new CfnOutput(this, "CognitoUserPoolClientId", CfnOutputProps.builder()
                .description("Cognito User Pool Client ID")
                .value(resources.getAuth().getUserPoolClient().getUserPoolClientId())
                .exportName("CognitoUserPoolClientId-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DocumentsTableName", CfnOutputProps.builder()
                .description("Documents DynamoDB Table Name")
                .value(resources.getData().getDocumentsTable().getTableName())
                .exportName("DocumentsTableName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "OperationsTableName", CfnOutputProps.builder()
                .description("Operations DynamoDB Table Name")
                .value(resources.getData().getOperationsTable().getTableName())
                .exportName("OperationsTableName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "ConnectionsTableName", CfnOutputProps.builder()
                .description("Connections DynamoDB Table Name")
                .value(resources.getData().getConnectionsTable().getTableName())
                .exportName("ConnectionsTableName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DocumentBucketName", CfnOutputProps.builder()
                .description("Document Storage S3 Bucket Name")
                .value(resources.getStorage().getDocumentBucket().getBucketName())
                .exportName("DocumentBucketName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "OpenSearchDomainEndpoint", CfnOutputProps.builder()
                .description("OpenSearch Domain Endpoint")
                .value(resources.getSearch().getOpenSearchDomain().getDomainEndpoint())
                .exportName("OpenSearchDomainEndpoint-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DashboardName", CfnOutputProps.builder()
                .description("CloudWatch Dashboard Name")
                .value(resources.getDashboard().getDashboardName())
                .exportName("DashboardName-" + environmentSuffix)
                .build());
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the Document Collaboration CDK application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
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
        String region = System.getenv("CDK_DEFAULT_REGION");

        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(account)
                                .region(region)
                                .build())
                        .description("Document Collaboration System with Real-time WebSocket Support")
                        .build())
                .build());

        app.synth();
    }
}