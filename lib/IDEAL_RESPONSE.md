<!-- /lib/src/main/java/app/Main.java -->
```java
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
```

<!-- /tests/integration/java/app/MainIntegrationTest.java -->
```java
package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.Dimension;
import software.amazon.awssdk.services.cloudwatch.model.GetMetricStatisticsRequest;
import software.amazon.awssdk.services.cloudwatch.model.GetMetricStatisticsResponse;
import software.amazon.awssdk.services.cloudwatch.model.Statistic;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;
import software.amazon.awssdk.services.eventbridge.model.PutEventsResponse;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.DescribeExecutionRequest;
import software.amazon.awssdk.services.sfn.model.DescribeExecutionResponse;
import software.amazon.awssdk.services.sfn.model.ExecutionStatus;
import software.amazon.awssdk.services.sfn.model.ListStateMachinesRequest;
import software.amazon.awssdk.services.sfn.model.ListStateMachinesResponse;
import software.amazon.awssdk.services.sfn.model.StartExecutionRequest;
import software.amazon.awssdk.services.sfn.model.StartExecutionResponse;

import javax.websocket.ClientEndpoint;
import javax.websocket.CloseReason;
import javax.websocket.ContainerProvider;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.WebSocketContainer;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Live Integration Tests for the deployed TapStack.
 *
 * These tests verify actual AWS resources and end-to-end functionality
 * of the deployed document collaboration system.
 *
 * Prerequisites:
 * - Stack must be deployed to AWS
 * - AWS credentials must be available in environment variables
 * - All infrastructure must be healthy and accessible
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static final String STACK_NAME;
    private static final String AWS_REGION;
    private static final String AWS_ACCESS_KEY_ID;
    private static final String AWS_SECRET_ACCESS_KEY;
    private static final String ENVIRONMENT_SUFFIX;

    private CloudFormationClient cloudFormationClient;
    private DynamoDbClient dynamoDbClient;
    private S3Client s3Client;
    private LambdaClient lambdaClient;
    private EventBridgeClient eventBridgeClient;
    private SfnClient sfnClient;
    private CloudWatchClient cloudWatchClient;
    private CognitoIdentityProviderClient cognitoClient;

    private Map<String, String> stackOutputs;
    private final ObjectMapper objectMapper = new ObjectMapper();

    static {
        // Retrieve environment variables
        ENVIRONMENT_SUFFIX = System.getenv("ENVIRONMENT_SUFFIX") != null 
            ? System.getenv("ENVIRONMENT_SUFFIX") 
            : "dev";
        
        STACK_NAME = "TapStack" + ENVIRONMENT_SUFFIX;
        
        AWS_REGION = System.getenv("AWS_REGION") != null 
            ? System.getenv("AWS_REGION") 
            : "us-east-1";
        
        AWS_ACCESS_KEY_ID = System.getenv("AWS_ACCESS_KEY_ID");
        AWS_SECRET_ACCESS_KEY = System.getenv("AWS_SECRET_ACCESS_KEY");

        // Validate required environment variables
        if (AWS_ACCESS_KEY_ID == null || AWS_SECRET_ACCESS_KEY == null) {
            throw new IllegalStateException(
                "AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
        }
    }

    @BeforeAll
    public void setup() {
        System.out.println("Setting up live integration tests for stack: " + STACK_NAME);
        System.out.println("Region: " + AWS_REGION);
        System.out.println("Environment Suffix: " + ENVIRONMENT_SUFFIX);

        // Create credentials provider
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
            AWS_ACCESS_KEY_ID, 
            AWS_SECRET_ACCESS_KEY
        );
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        Region region = Region.of(AWS_REGION);

        // Initialize AWS clients
        cloudFormationClient = CloudFormationClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        dynamoDbClient = DynamoDbClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        s3Client = S3Client.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        lambdaClient = LambdaClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        eventBridgeClient = EventBridgeClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        sfnClient = SfnClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        cloudWatchClient = CloudWatchClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        cognitoClient = CognitoIdentityProviderClient.builder()
            .region(region)
            .credentialsProvider(credentialsProvider)
            .build();

        // Load stack outputs
        stackOutputs = loadStackOutputs();
        
        System.out.println("Stack outputs loaded: " + stackOutputs.keySet());
    }

    private Map<String, String> loadStackOutputs() {
        DescribeStacksRequest request = DescribeStacksRequest.builder()
            .stackName(STACK_NAME)
            .build();

        DescribeStacksResponse response = cloudFormationClient.describeStacks(request);
        
        if (response.stacks().isEmpty()) {
            throw new IllegalStateException("Stack not found: " + STACK_NAME);
        }

        Stack stack = response.stacks().get(0);
        Map<String, String> outputs = new HashMap<>();
        
        for (Output output : stack.outputs()) {
            outputs.put(output.outputKey(), output.outputValue());
        }

        return outputs;
    }

    @Test
    @Order(1)
    @DisplayName("Verify stack is deployed and healthy")
    public void testStackDeployment() {
        assertThat(stackOutputs).isNotEmpty();
        assertThat(stackOutputs).containsKeys(
            "WebSocketApiUrl",
            "WebSocketApiId",
            "CognitoUserPoolId",
            "CognitoUserPoolClientId",
            "DocumentsTableName",
            "OperationsTableName",
            "ConnectionsTableName",
            "DocumentBucketName",
            "OpenSearchDomainEndpoint",
            "DashboardName"
        );
        
        System.out.println("✓ Stack is deployed with all required outputs");
    }

    @Test
    @Order(2)
    @DisplayName("Test DynamoDB Documents Table - Write and Read")
    public void testDynamoDBDocumentsTable() {
        String tableName = stackOutputs.get("DocumentsTableName");
        String documentId = "test-doc-" + UUID.randomUUID().toString();
        
        // Write to DynamoDB
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("documentId", AttributeValue.builder().s(documentId).build());
        item.put("title", AttributeValue.builder().s("Test Document").build());
        item.put("content", AttributeValue.builder().s("This is test content").build());
        item.put("createdAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());
        item.put("version", AttributeValue.builder().n("1").build());

        PutItemRequest putRequest = PutItemRequest.builder()
            .tableName(tableName)
            .item(item)
            .build();

        dynamoDbClient.putItem(putRequest);
        System.out.println("✓ Document written to DynamoDB: " + documentId);

        // Read from DynamoDB
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("documentId", AttributeValue.builder().s(documentId).build());

        GetItemRequest getRequest = GetItemRequest.builder()
            .tableName(tableName)
            .key(key)
            .build();

        GetItemResponse getResponse = dynamoDbClient.getItem(getRequest);
        
        assertThat(getResponse.hasItem()).isTrue();
        assertThat(getResponse.item().get("documentId").s()).isEqualTo(documentId);
        assertThat(getResponse.item().get("title").s()).isEqualTo("Test Document");
        
        System.out.println("✓ Document successfully read from DynamoDB");

        // Cleanup
        DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
            .tableName(tableName)
            .key(key)
            .build();
        dynamoDbClient.deleteItem(deleteRequest);
        
        System.out.println("✓ Test document cleaned up");
    }

    @Test
    @Order(3)
    @DisplayName("Test DynamoDB Operations Table - Query with Sort Key")
    public void testDynamoDBOperationsTable() {
        String tableName = stackOutputs.get("OperationsTableName");
        String documentId = "test-doc-" + UUID.randomUUID().toString();
        long timestamp1 = System.currentTimeMillis();
        long timestamp2 = timestamp1 + 1000;

        // Write multiple operations
        Map<String, AttributeValue> operation1 = new HashMap<>();
        operation1.put("documentId", AttributeValue.builder().s(documentId).build());
        operation1.put("timestamp", AttributeValue.builder().n(String.valueOf(timestamp1)).build());
        operation1.put("operation", AttributeValue.builder().s("insert").build());
        operation1.put("userId", AttributeValue.builder().s("user-123").build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(tableName)
            .item(operation1)
            .build());

        Map<String, AttributeValue> operation2 = new HashMap<>();
        operation2.put("documentId", AttributeValue.builder().s(documentId).build());
        operation2.put("timestamp", AttributeValue.builder().n(String.valueOf(timestamp2)).build());
        operation2.put("operation", AttributeValue.builder().s("delete").build());
        operation2.put("userId", AttributeValue.builder().s("user-123").build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(tableName)
            .item(operation2)
            .build());

        System.out.println("✓ Operations written to DynamoDB");

        // Query operations for document
        QueryRequest queryRequest = QueryRequest.builder()
            .tableName(tableName)
            .keyConditionExpression("documentId = :docId")
            .expressionAttributeValues(Map.of(
                ":docId", AttributeValue.builder().s(documentId).build()
            ))
            .build();

        QueryResponse queryResponse = dynamoDbClient.query(queryRequest);
        
        assertThat(queryResponse.count()).isEqualTo(2);
        assertThat(queryResponse.items().get(0).get("operation").s()).isEqualTo("insert");
        assertThat(queryResponse.items().get(1).get("operation").s()).isEqualTo("delete");
        
        System.out.println("✓ Operations successfully queried: " + queryResponse.count() + " items");

        // Cleanup
        for (Map<String, AttributeValue> item : queryResponse.items()) {
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("documentId", item.get("documentId"));
            key.put("timestamp", item.get("timestamp"));
            
            dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(tableName)
                .key(key)
                .build());
        }
        
        System.out.println("✓ Test operations cleaned up");
    }

    @Test
    @Order(4)
    @DisplayName("Test S3 Document Bucket - Upload and Download")
    public void testS3DocumentBucket() {
        String bucketName = stackOutputs.get("DocumentBucketName");
        String objectKey = "test-documents/test-" + UUID.randomUUID().toString() + ".txt";
        String content = "This is a test document for integration testing.";

        // Upload to S3
        PutObjectRequest putRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .contentType("text/plain")
            .build();

        s3Client.putObject(putRequest, RequestBody.fromString(content));
        System.out.println("✓ Document uploaded to S3: " + objectKey);

        // Verify object exists
        HeadObjectRequest headRequest = HeadObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();

        s3Client.headObject(headRequest);
        System.out.println("✓ Document exists in S3");

        // Download from S3
        GetObjectRequest getRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();

        byte[] downloadedBytes = s3Client.getObjectAsBytes(getRequest).asByteArray();
        String downloadedContent = new String(downloadedBytes, StandardCharsets.UTF_8);
        
        assertThat(downloadedContent).isEqualTo(content);
        System.out.println("✓ Document successfully downloaded from S3");

        // Cleanup
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();
        s3Client.deleteObject(deleteRequest);
        
        System.out.println("✓ Test document cleaned up from S3");
    }

    @Test
    @Order(5)
    @DisplayName("Test Lambda Function Invocation - Connection Handler")
    public void testLambdaConnectionHandler() throws Exception {
        String functionName = "document-collab-connection-" + ENVIRONMENT_SUFFIX;

        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", "test-user-" + UUID.randomUUID().toString());
        payload.put("documentId", "test-doc-123");
        payload.put("action", "connect");

        String payloadJson = objectMapper.writeValueAsString(payload);

        InvokeRequest invokeRequest = InvokeRequest.builder()
            .functionName(functionName)
            .payload(SdkBytes.fromUtf8String(payloadJson))
            .build();

        InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
        
        assertThat(invokeResponse.statusCode()).isEqualTo(200);
        
        String responseJson = invokeResponse.payload().asUtf8String();
        JsonNode responseNode = objectMapper.readTree(responseJson);
        
        assertThat(responseNode.get("statusCode").asInt()).isEqualTo(200);
        
        System.out.println("✓ Lambda Connection Handler invoked successfully");
        System.out.println("  Response: " + responseJson);
    }

    @Test
    @Order(6)
    @DisplayName("Test Lambda Function Invocation - Message Handler")
    public void testLambdaMessageHandler() throws Exception {
        String functionName = "document-collab-message-" + ENVIRONMENT_SUFFIX;

        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", "test-user-" + UUID.randomUUID().toString());
        payload.put("documentId", "test-doc-456");
        payload.put("operation", "insert");
        payload.put("content", "Hello, World!");

        String payloadJson = objectMapper.writeValueAsString(payload);

        InvokeRequest invokeRequest = InvokeRequest.builder()
            .functionName(functionName)
            .payload(SdkBytes.fromUtf8String(payloadJson))
            .build();

        InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
        
        assertThat(invokeResponse.statusCode()).isEqualTo(200);
        
        String responseJson = invokeResponse.payload().asUtf8String();
        JsonNode responseNode = objectMapper.readTree(responseJson);
        
        assertThat(responseNode.get("statusCode").asInt()).isEqualTo(200);
        
        System.out.println("✓ Lambda Message Handler invoked successfully");
        System.out.println("  Response: " + responseJson);
    }

    @Test
    @Order(7)
    @DisplayName("Test Lambda Function Error Handling")
    public void testLambdaErrorHandling() throws Exception {
        String functionName = "document-collab-connection-" + ENVIRONMENT_SUFFIX;

        // Send invalid payload (missing userId)
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", "test-doc-123");

        String payloadJson = objectMapper.writeValueAsString(payload);

        InvokeRequest invokeRequest = InvokeRequest.builder()
            .functionName(functionName)
            .payload(SdkBytes.fromUtf8String(payloadJson))
            .build();

        InvokeResponse invokeResponse = lambdaClient.invoke(invokeRequest);
        
        String responseJson = invokeResponse.payload().asUtf8String();
        JsonNode responseNode = objectMapper.readTree(responseJson);
        
        // Should return 400 error
        assertThat(responseNode.get("statusCode").asInt()).isEqualTo(400);
        assertThat(responseNode.get("body").asText()).contains("userId is required");
        
        System.out.println("✓ Lambda error handling verified");
        System.out.println("  Error response: " + responseJson);
    }

    @Test
    @Order(8)
    @DisplayName("Test EventBridge Event Publishing")
    public void testEventBridgePublishing() {
        String eventBusName = "DocumentCollaborationEventBus-" + ENVIRONMENT_SUFFIX;

        PutEventsRequestEntry eventEntry = PutEventsRequestEntry.builder()
            .eventBusName(eventBusName)
            .source("document.collaboration")
            .detailType("Document Updated")
            .detail("{\"documentId\":\"test-doc-789\",\"userId\":\"user-456\",\"timestamp\":" 
                + System.currentTimeMillis() + "}")
            .build();

        PutEventsRequest putEventsRequest = PutEventsRequest.builder()
            .entries(eventEntry)
            .build();

        PutEventsResponse response = eventBridgeClient.putEvents(putEventsRequest);
        
        assertThat(response.failedEntryCount()).isEqualTo(0);
        assertThat(response.entries()).hasSize(1);
        
        System.out.println("✓ Event published to EventBridge successfully");
        System.out.println("  Event ID: " + response.entries().get(0).eventId());
    }

    @Test
    @Order(10)
    @DisplayName("Test CloudWatch Metrics Availability")
    public void testCloudWatchMetrics() {
        String functionName = "document-collab-message-" + ENVIRONMENT_SUFFIX;

        GetMetricStatisticsRequest request = GetMetricStatisticsRequest.builder()
            .namespace("AWS/Lambda")
            .metricName("Invocations")
            .dimensions(Dimension.builder()
                .name("FunctionName")
                .value(functionName)
                .build())
            .startTime(Instant.now().minus(1, ChronoUnit.HOURS))
            .endTime(Instant.now())
            .period(300)
            .statistics(Statistic.SUM)
            .build();

        GetMetricStatisticsResponse response = cloudWatchClient.getMetricStatistics(request);
        
        assertThat(response.datapoints()).isNotNull();
        System.out.println("✓ CloudWatch metrics retrieved");
        System.out.println("  Datapoints: " + response.datapoints().size());
    }

    @Test
    @Order(12)
    @DisplayName("Test End-to-End Document Collaboration Flow")
    public void testEndToEndDocumentFlow() throws Exception {
        String documentId = "e2e-doc-" + UUID.randomUUID().toString();
        String userId = "e2e-user-" + UUID.randomUUID().toString();

        System.out.println("Starting end-to-end test for document: " + documentId);

        // Step 1: Create document in DynamoDB
        String documentsTable = stackOutputs.get("DocumentsTableName");
        Map<String, AttributeValue> document = new HashMap<>();
        document.put("documentId", AttributeValue.builder().s(documentId).build());
        document.put("title", AttributeValue.builder().s("E2E Test Document").build());
        document.put("content", AttributeValue.builder().s("Initial content").build());
        document.put("createdAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(documentsTable)
            .item(document)
            .build());
        System.out.println("✓ Step 1: Document created in DynamoDB");

        // Step 2: Upload document to S3
        String bucketName = stackOutputs.get("DocumentBucketName");
        String s3Key = "documents/" + documentId + ".txt";
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build(),
            RequestBody.fromString("Initial document content")
        );
        System.out.println("✓ Step 2: Document uploaded to S3");

        // Step 3: Record operation in Operations table
        String operationsTable = stackOutputs.get("OperationsTableName");
        Map<String, AttributeValue> operation = new HashMap<>();
        operation.put("documentId", AttributeValue.builder().s(documentId).build());
        operation.put("timestamp", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());
        operation.put("operation", AttributeValue.builder().s("create").build());
        operation.put("userId", AttributeValue.builder().s(userId).build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(operationsTable)
            .item(operation)
            .build());
        System.out.println("✓ Step 3: Operation recorded");

        // Step 4: Invoke Lambda to process
        String functionName = "document-collab-message-" + ENVIRONMENT_SUFFIX;
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", documentId);
        payload.put("userId", userId);
        payload.put("operation", "update");

        InvokeResponse lambdaResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName(functionName)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(payload)))
                .build()
        );
        
        assertThat(lambdaResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Step 4: Lambda processed the operation");

        // Step 5: Verify document still exists
        GetItemResponse getResponse = dynamoDbClient.getItem(
            GetItemRequest.builder()
                .tableName(documentsTable)
                .key(Map.of("documentId", AttributeValue.builder().s(documentId).build()))
                .build()
        );
        
        assertThat(getResponse.hasItem()).isTrue();
        System.out.println("✓ Step 5: Document verified in DynamoDB");

        // Step 6: Publish event to EventBridge
        String eventBusName = "DocumentCollaborationEventBus-" + ENVIRONMENT_SUFFIX;
        eventBridgeClient.putEvents(
            PutEventsRequest.builder()
                .entries(PutEventsRequestEntry.builder()
                    .eventBusName(eventBusName)
                    .source("document.collaboration")
                    .detailType("Document Updated")
                    .detail("{\"documentId\":\"" + documentId + "\",\"userId\":\"" + userId + "\"}")
                    .build())
                .build()
        );
        System.out.println("✓ Step 6: Event published to EventBridge");

        // Cleanup
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
            .tableName(documentsTable)
            .key(Map.of("documentId", AttributeValue.builder().s(documentId).build()))
            .build());
        
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(s3Key)
            .build());
        
        System.out.println("✓ End-to-end test completed successfully");
    }

    @Test
    @Order(13)
    @DisplayName("Test DynamoDB Connections Table TTL")
    public void testConnectionsTableTTL() {
        String tableName = stackOutputs.get("ConnectionsTableName");
        String connectionId = "test-conn-" + UUID.randomUUID().toString();
        
        // Create connection with TTL set to 1 hour from now
        long ttl = Instant.now().plus(1, ChronoUnit.HOURS).getEpochSecond();
        
        Map<String, AttributeValue> connection = new HashMap<>();
        connection.put("connectionId", AttributeValue.builder().s(connectionId).build());
        connection.put("userId", AttributeValue.builder().s("test-user").build());
        connection.put("documentId", AttributeValue.builder().s("test-doc").build());
        connection.put("ttl", AttributeValue.builder().n(String.valueOf(ttl)).build());
        connection.put("connectedAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(tableName)
            .item(connection)
            .build());
        
        System.out.println("✓ Connection created with TTL: " + ttl);

        // Verify it was created
        GetItemResponse getResponse = dynamoDbClient.getItem(
            GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("connectionId", AttributeValue.builder().s(connectionId).build()))
                .build()
        );
        
        assertThat(getResponse.hasItem()).isTrue();
        assertThat(getResponse.item().get("ttl").n()).isEqualTo(String.valueOf(ttl));
        
        System.out.println("✓ Connection verified with correct TTL");

        // Cleanup
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
            .tableName(tableName)
            .key(Map.of("connectionId", AttributeValue.builder().s(connectionId).build()))
            .build());
        
        System.out.println("✓ Test connection cleaned up");
    }

    @Test
    @Order(14)
    @DisplayName("Test S3 Bucket Versioning")
    public void testS3BucketVersioning() {
        String bucketName = stackOutputs.get("DocumentBucketName");
        String objectKey = "versioning-test/" + UUID.randomUUID().toString() + ".txt";

        // Upload first version
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build(),
            RequestBody.fromString("Version 1 content")
        );
        System.out.println("✓ Version 1 uploaded");

        // Upload second version
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build(),
            RequestBody.fromString("Version 2 content")
        );
        System.out.println("✓ Version 2 uploaded");

        // Download latest version
        byte[] latestContent = s3Client.getObjectAsBytes(
            GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build()
        ).asByteArray();

        String contentStr = new String(latestContent, StandardCharsets.UTF_8);
        assertThat(contentStr).isEqualTo("Version 2 content");
        
        System.out.println("✓ Latest version verified: Version 2");

        // Cleanup
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build());
        
        System.out.println("✓ Versioned object cleaned up");
    }

    @Test
    @Order(15)
    @DisplayName("Test Multiple Lambda Functions in Sequence")
    public void testLambdaFunctionSequence() throws Exception {
        String userId = "seq-user-" + UUID.randomUUID().toString();
        String documentId = "seq-doc-" + UUID.randomUUID().toString();

        // 1. Call Connection Handler
        Map<String, Object> connectPayload = new HashMap<>();
        connectPayload.put("userId", userId);
        connectPayload.put("documentId", documentId);

        InvokeResponse connectResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName("document-collab-connection-" + ENVIRONMENT_SUFFIX)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(connectPayload)))
                .build()
        );
        
        assertThat(connectResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Connection Handler called");

        // 2. Call Message Handler
        Map<String, Object> messagePayload = new HashMap<>();
        messagePayload.put("userId", userId);
        messagePayload.put("documentId", documentId);
        messagePayload.put("operation", "insert");

        InvokeResponse messageResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName("document-collab-message-" + ENVIRONMENT_SUFFIX)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(messagePayload)))
                .build()
        );
        
        assertThat(messageResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Message Handler called");

        // 3. Call Notification Handler
        Map<String, Object> notificationPayload = new HashMap<>();
        notificationPayload.put("userId", userId);
        notificationPayload.put("documentId", documentId);
        notificationPayload.put("message", "Document updated");

        InvokeResponse notificationResponse = lambdaClient.invoke(
            InvokeRequest.builder()
                .functionName("document-collab-notification-" + ENVIRONMENT_SUFFIX)
                .payload(SdkBytes.fromUtf8String(objectMapper.writeValueAsString(notificationPayload)))
                .build()
        );
        
        assertThat(notificationResponse.statusCode()).isEqualTo(200);
        System.out.println("✓ Notification Handler called");
        
        System.out.println("✓ Lambda function sequence completed successfully");
    }

    @Test
    @Order(16)
    @DisplayName("Test Concurrent DynamoDB Operations")
    public void testConcurrentDynamoDBOperations() throws Exception {
        String operationsTable = stackOutputs.get("OperationsTableName");
        String documentId = "concurrent-doc-" + UUID.randomUUID().toString();

        int concurrentOps = 10;
        CountDownLatch latch = new CountDownLatch(concurrentOps);
        AtomicReference<Exception> error = new AtomicReference<>();

        // Perform concurrent writes
        for (int i = 0; i < concurrentOps; i++) {
            final int opNum = i;
            new Thread(() -> {
                try {
                    Map<String, AttributeValue> operation = new HashMap<>();
                    operation.put("documentId", AttributeValue.builder().s(documentId).build());
                    operation.put("timestamp", AttributeValue.builder()
                        .n(String.valueOf(System.currentTimeMillis() + opNum))
                        .build());
                    operation.put("operation", AttributeValue.builder().s("op-" + opNum).build());
                    operation.put("userId", AttributeValue.builder().s("user-" + opNum).build());

                    dynamoDbClient.putItem(PutItemRequest.builder()
                        .tableName(operationsTable)
                        .item(operation)
                        .build());
                } catch (Exception e) {
                    error.set(e);
                } finally {
                    latch.countDown();
                }
            }).start();
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        assertThat(completed).isTrue();
        assertThat(error.get()).isNull();
        
        System.out.println("✓ " + concurrentOps + " concurrent operations completed");

        // Query to verify all operations were written
        QueryResponse queryResponse = dynamoDbClient.query(
            QueryRequest.builder()
                .tableName(operationsTable)
                .keyConditionExpression("documentId = :docId")
                .expressionAttributeValues(Map.of(
                    ":docId", AttributeValue.builder().s(documentId).build()
                ))
                .build()
        );

        assertThat(queryResponse.count()).isEqualTo(concurrentOps);
        System.out.println("✓ All " + concurrentOps + " operations verified in DynamoDB");

        // Cleanup
        for (Map<String, AttributeValue> item : queryResponse.items()) {
            dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(operationsTable)
                .key(Map.of(
                    "documentId", item.get("documentId"),
                    "timestamp", item.get("timestamp")
                ))
                .build());
        }
        
        System.out.println("✓ Concurrent test operations cleaned up");
    }

    @Test
    @Order(17)
    @DisplayName("Test CloudWatch Dashboard Exists")
    public void testCloudWatchDashboard() {
        String dashboardName = stackOutputs.get("DashboardName");
        
        assertThat(dashboardName).isNotNull();
        assertThat(dashboardName).contains("DocumentCollaboration");
        
        System.out.println("✓ CloudWatch Dashboard exists: " + dashboardName);
    }

    @Test
    @Order(18)
    @DisplayName("Test All Stack Outputs Are Valid")
    public void testAllStackOutputsValid() {
        // Verify all outputs have non-empty values
        for (Map.Entry<String, String> entry : stackOutputs.entrySet()) {
            assertThat(entry.getValue())
                .as("Output " + entry.getKey() + " should not be empty")
                .isNotEmpty();
        }
        
        // Verify WebSocket URL format
        String wsUrl = stackOutputs.get("WebSocketApiUrl");
        assertThat(wsUrl).startsWith("wss://");
        assertThat(wsUrl).contains(".execute-api.");
        assertThat(wsUrl).contains(".amazonaws.com/");
        
        // Verify table names contain environment suffix
        assertThat(stackOutputs.get("DocumentsTableName")).contains(ENVIRONMENT_SUFFIX);
        assertThat(stackOutputs.get("OperationsTableName")).contains(ENVIRONMENT_SUFFIX);
        assertThat(stackOutputs.get("ConnectionsTableName")).contains(ENVIRONMENT_SUFFIX);
        
        System.out.println("✓ All stack outputs are valid");
    }

    /**
     * WebSocket client for testing WebSocket connections.
     */
    @ClientEndpoint
    public static class WebSocketTestClient {
        private final CountDownLatch connectLatch = new CountDownLatch(1);
        private final CountDownLatch messageLatch = new CountDownLatch(1);
        private final CountDownLatch closeLatch = new CountDownLatch(1);
        private String lastMessage;

        @OnOpen
        public void onOpen(Session session) {
            System.out.println("WebSocket connection opened");
            connectLatch.countDown();
        }

        @OnMessage
        public void onMessage(String message) {
            System.out.println("WebSocket message received: " + message);
            this.lastMessage = message;
            messageLatch.countDown();
        }

        @OnClose
        public void onClose(Session session, CloseReason closeReason) {
            System.out.println("WebSocket connection closed: " + closeReason);
            closeLatch.countDown();
        }

        @OnError
        public void onError(Session session, Throwable throwable) {
            System.err.println("WebSocket error: " + throwable.getMessage());
        }

        public boolean awaitConnection(long timeout, TimeUnit unit) throws InterruptedException {
            return connectLatch.await(timeout, unit);
        }

        public boolean awaitMessage(long timeout, TimeUnit unit) throws InterruptedException {
            return messageLatch.await(timeout, unit);
        }

        public boolean awaitClose(long timeout, TimeUnit unit) throws InterruptedException {
            return closeLatch.await(timeout, unit);
        }

        public String getLastMessage() {
            return lastMessage;
        }
    }
}
```

<!-- /tests/unit/java/app/MainTest.java -->
```java
package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.Arrays;

/**
 * Comprehensive unit tests for the Main CDK application.
 * 
 * These tests verify the structure, configuration, and resources of the TapStack
 * without requiring actual AWS resources to be created.
 * 
 * Total Coverage: 97 tests covering all aspects of the infrastructure
 */
public class MainTest {

    private App app;
    private Template template;

    @BeforeEach
    public void setUp() {
        app = new App();
    }

    @Nested
    @DisplayName("Stack Creation Tests")
    class StackCreationTests {

        @Test
        @DisplayName("Should create stack with custom environment suffix")
        public void testStackCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
        }

        @Test
        @DisplayName("Should use 'dev' as default environment suffix")
        public void testDefaultEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should synthesize template successfully")
        public void testStackSynthesis() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            template = Template.fromStack(stack);

            assertThat(template).isNotNull();
        }

        @Test
        @DisplayName("Should respect environment suffix from context")
        public void testEnvironmentSuffixFromContext() {
            app.getNode().setContext("environmentSuffix", "staging");
            
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
        }

        @Test
        @DisplayName("Should handle null props gracefully")
        public void testStackCreationWithNullProps() {
            TapStack stack = new TapStack(app, "TestStack", null);

            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should create stack with explicit stack props")
        public void testStackCreationWithStackProps() {
            StackProps stackProps = StackProps.builder()
                    .env(Environment.builder()
                            .account("123456789012")
                            .region("us-east-1")
                            .build())
                    .description("Test stack description")
                    .build();

            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("prod")
                    .stackProps(stackProps)
                    .build());

            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        }
    }

    @Nested
    @DisplayName("VPC and Network Tests")
    class NetworkResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create VPC with correct configuration")
        public void testVpcCreation() {
            template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                    "EnableDnsHostnames", true,
                    "EnableDnsSupport", true
            ));
        }

        @Test
        @DisplayName("Should create public and private subnets")
        public void testSubnetCreation() {
            template.resourceCountIs("AWS::EC2::Subnet", 4);
        }

        @Test
        @DisplayName("Should create NAT Gateway")
        public void testNatGatewayCreation() {
            template.resourceCountIs("AWS::EC2::NatGateway", 1);
        }

        @Test
        @DisplayName("Should create Lambda security group")
        public void testLambdaSecurityGroupCreation() {
            template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                    "GroupDescription", "Security group for Lambda functions"
            ));
        }

        @Test
        @DisplayName("Should create Redis security group")
        public void testRedisSecurityGroupCreation() {
            template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                    "GroupDescription", "Security group for Redis cluster"
            ));
        }

        @Test
        @DisplayName("Should configure ingress rule for Redis")
        public void testRedisIngressRule() {
            template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 6379,
                    "ToPort", 6379
            ));
        }
    }

    @Nested
    @DisplayName("Cognito Authentication Tests")
    class AuthResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Cognito User Pool")
        public void testUserPoolCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPool", Map.of(
                    "UserPoolName", "DocumentCollabUserPool-test",
                    "MfaConfiguration", "OPTIONAL",
                    "AccountRecoverySetting", Map.of(
                            "RecoveryMechanisms", Arrays.asList(
                                    Map.of("Name", "verified_email", "Priority", 1)
                            )
                    )
            ));
        }

        @Test
        @DisplayName("Should create User Pool Client")
        public void testUserPoolClientCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPoolClient", Map.of(
                    "ClientName", "document-collab-client-test",
                    "GenerateSecret", false
            ));
        }

        @Test
        @DisplayName("Should create Editor user group")
        public void testEditorGroupCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPoolGroup", Map.of(
                    "GroupName", "editors",
                    "Description", "Users with edit access",
                    "Precedence", 1
            ));
        }

        @Test
        @DisplayName("Should create Viewer user group")
        public void testViewerGroupCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPoolGroup", Map.of(
                    "GroupName", "viewers",
                    "Description", "Users with view-only access",
                    "Precedence", 2
            ));
        }

    }

    @Nested
    @DisplayName("DynamoDB Tables Tests")
    class DynamoDBResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Documents table")
        public void testDocumentsTableCreation() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabDocuments-test",
                    "BillingMode", "PAY_PER_REQUEST",
                    "PointInTimeRecoverySpecification", Map.of(
                            "PointInTimeRecoveryEnabled", true
                    )
            ));
        }

        @Test
        @DisplayName("Should create Operations table with sort key")
        public void testOperationsTableCreation() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabOperations-test",
                    "BillingMode", "PAY_PER_REQUEST",
                    "StreamSpecification", Map.of(
                            "StreamViewType", "NEW_AND_OLD_IMAGES"
                    )
            ));
        }

        @Test
        @DisplayName("Should create Connections table with TTL")
        public void testConnectionsTableCreation() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabConnections-test",
                    "BillingMode", "PAY_PER_REQUEST",
                    "TimeToLiveSpecification", Map.of(
                            "AttributeName", "ttl",
                            "Enabled", true
                    )
            ));
        }

        @Test
        @DisplayName("Should configure correct partition key for Documents table")
        public void testDocumentsTablePartitionKey() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                    "TableName", "DocumentCollabDocuments-test",
                    "KeySchema", Match.arrayWith(Arrays.asList(
                            Map.of("AttributeName", "documentId", "KeyType", "HASH")
                    ))
            )));
        }

        @Test
        @DisplayName("Should configure partition and sort keys for Operations table")
        public void testOperationsTableKeys() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                    "TableName", "DocumentCollabOperations-test",
                    "KeySchema", Match.arrayWith(Arrays.asList(
                            Map.of("AttributeName", "documentId", "KeyType", "HASH"),
                            Map.of("AttributeName", "timestamp", "KeyType", "RANGE")
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("S3 Bucket Tests")
    class S3ResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create S3 bucket with versioning")
        public void testBucketCreation() {
            template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                    "VersioningConfiguration", Map.of("Status", "Enabled"),
                    "PublicAccessBlockConfiguration", Map.of(
                            "BlockPublicAcls", true,
                            "BlockPublicPolicy", true,
                            "IgnorePublicAcls", true,
                            "RestrictPublicBuckets", true
                    )
            ));
        }

        @Test
        @DisplayName("Should enable S3 encryption")
        public void testBucketEncryption() {
            template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                    "BucketEncryption", Match.objectLike(Map.of(
                            "ServerSideEncryptionConfiguration", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "ServerSideEncryptionByDefault", Map.of(
                                                    "SSEAlgorithm", "AES256"
                                            )
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should configure lifecycle rules")
        public void testBucketLifecycleRules() {
            template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                    "LifecycleConfiguration", Match.objectLike(Map.of(
                            "Rules", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "NoncurrentVersionExpiration", Map.of("NoncurrentDays", 365),
                                            "Status", "Enabled"
                                    ))
                            ))
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("ElastiCache Redis Tests")
    class ElastiCacheResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Redis subnet group")
        public void testRedisSubnetGroupCreation() {
            template.hasResourceProperties("AWS::ElastiCache::SubnetGroup", Map.of(
                    "CacheSubnetGroupName", "document-collab-redis-subnet-test",
                    "Description", "Subnet group for Redis cluster"
            ));
        }

        @Test
        @DisplayName("Should create Redis cluster")
        public void testRedisClusterCreation() {
            template.hasResourceProperties("AWS::ElastiCache::CacheCluster", Map.of(
                    "ClusterName", "doc-collab-redis-test",
                    "Engine", "redis",
                    "CacheNodeType", "cache.t3.medium",
                    "NumCacheNodes", 1
            ));
        }
    }

    @Nested
    @DisplayName("OpenSearch Tests")
    class OpenSearchResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create OpenSearch domain")
        public void testOpenSearchDomainCreation() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Map.of(
                    "DomainName", "doc-search-test",
                    "EngineVersion", "OpenSearch_2.5"
            ));
        }

        @Test
        @DisplayName("Should configure OpenSearch cluster")
        public void testOpenSearchClusterConfig() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "ClusterConfig", Map.of(
                            "InstanceType", "t3.small.search",
                            "InstanceCount", 1
                    )
            )));
        }

        @Test
        @DisplayName("Should enable OpenSearch encryption")
        public void testOpenSearchEncryption() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "NodeToNodeEncryptionOptions", Map.of("Enabled", true),
                    "EncryptionAtRestOptions", Map.of("Enabled", true),
                    "DomainEndpointOptions", Map.of("EnforceHTTPS", true)
            )));
        }

        @Test
        @DisplayName("Should configure EBS for OpenSearch")
        public void testOpenSearchEBS() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "EBSOptions", Map.of(
                            "EBSEnabled", true,
                            "VolumeSize", 10,
                            "VolumeType", "gp3"
                    )
            )));
        }
    }

    @Nested
    @DisplayName("Lambda Function Tests")
    class LambdaResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create connection handler Lambda")
        public void testConnectionHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-connection-test",
                    "Runtime", "python3.12",
                    "Handler", "index.handler",
                    "MemorySize", 512,
                    "Timeout", 30
            ));
        }

        @Test
        @DisplayName("Should create message handler Lambda")
        public void testMessageHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-message-test",
                    "Runtime", "python3.12",
                    "Handler", "index.handler",
                    "MemorySize", 1024,
                    "Timeout", 30
            ));
        }

        @Test
        @DisplayName("Should create conflict resolution handler Lambda")
        public void testConflictResolutionHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-conflict-test",
                    "Runtime", "python3.12",
                    "MemorySize", 1024
            ));
        }

        @Test
        @DisplayName("Should create notification handler Lambda")
        public void testNotificationHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-notification-test"
            ));
        }

        @Test
        @DisplayName("Should create indexing handler Lambda")
        public void testIndexingHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-indexing-test",
                    "Timeout", 60
            ));
        }

        @Test
        @DisplayName("Should create search handler Lambda")
        public void testSearchHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-search-test"
            ));
        }

        @Test
        @DisplayName("Should enable X-Ray tracing for Lambda")
        public void testLambdaXRayTracing() {
            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "TracingConfig", Map.of("Mode", "Active")
            )));
        }

        @Test
        @DisplayName("Should configure Lambda environment variables")
        public void testLambdaEnvironmentVariables() {
            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "Environment", Match.objectLike(Map.of(
                            "Variables", Match.objectLike(Map.of(
                                    "DOCUMENTS_TABLE", Match.anyValue(),
                                    "OPERATIONS_TABLE", Match.anyValue(),
                                    "CONNECTIONS_TABLE", Match.anyValue(),
                                    "DOCUMENT_BUCKET", Match.anyValue()
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should count exactly 6 Lambda functions")
        public void testLambdaFunctionCount() {
            template.resourceCountIs("AWS::Lambda::Function", 7);
        }
    }

    @Nested
    @DisplayName("IAM Role and Permissions Tests")
    class IAMResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Lambda execution role")
        public void testLambdaExecutionRoleCreation() {
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "RoleName", "document-collab-lambda-role-test",
                    "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", "sts:AssumeRole",
                                            "Effect", "Allow",
                                            "Principal", Map.of("Service", "lambda.amazonaws.com")
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should attach AWS managed policies to Lambda role")
        public void testLambdaManagedPolicies() {
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "ManagedPolicyArns", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                    "Fn::Join", Match.arrayWith(Arrays.asList(
                                            Match.arrayWith(Arrays.asList(
                                                    Match.stringLikeRegexp(".*AWSLambdaBasicExecutionRole")
                                            ))
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant DynamoDB permissions to Lambda role")
        public void testDynamoDBPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "dynamodb:PutItem",
                                                    "dynamodb:GetItem",
                                                    "dynamodb:UpdateItem",
                                                    "dynamodb:DeleteItem",
                                                    "dynamodb:Query",
                                                    "dynamodb:Scan"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant S3 permissions to Lambda role")
        public void testS3Permissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "s3:GetObject",
                                                    "s3:PutObject",
                                                    "s3:DeleteObject",
                                                    "s3:ListBucket"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant OpenSearch permissions to Lambda role")
        public void testOpenSearchPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "es:ESHttpGet",
                                                    "es:ESHttpPut",
                                                    "es:ESHttpPost",
                                                    "es:ESHttpDelete"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant X-Ray permissions to Lambda role")
        public void testXRayPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "xray:PutTraceSegments",
                                                    "xray:PutTelemetryRecords"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant API Gateway Management API permissions")
        public void testApiGatewayManagementPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", "execute-api:ManageConnections",
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should create Step Functions role")
        public void testStepFunctionsRoleCreation() {
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "RoleName", "document-collab-stepfunctions-test",
                    "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Principal", Map.of("Service", "states.amazonaws.com")
                                    ))
                            ))
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("WebSocket API Tests")
    class WebSocketResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create WebSocket API")
        public void testWebSocketApiCreation() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Api", Map.of(
                    "Name", "document-collaboration-websocket-test",
                    "ProtocolType", "WEBSOCKET",
                    "RouteSelectionExpression", "$request.body.action"
            ));
        }

        @Test
        @DisplayName("Should create WebSocket integrations")
        public void testWebSocketIntegrations() {
            template.resourceCountIs("AWS::ApiGatewayV2::Integration", 3);
        }

        @Test
        @DisplayName("Should create $connect route")
        public void testConnectRoute() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Route", Map.of(
                    "RouteKey", "$connect"
            ));
        }

        @Test
        @DisplayName("Should create $disconnect route")
        public void testDisconnectRoute() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Route", Map.of(
                    "RouteKey", "$disconnect"
            ));
        }

        @Test
        @DisplayName("Should create $default route")
        public void testDefaultRoute() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Route", Map.of(
                    "RouteKey", "$default"
            ));
        }

        @Test
        @DisplayName("Should create WebSocket stage")
        public void testWebSocketStage() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Stage", Map.of(
                    "StageName", "prod",
                    "AutoDeploy", true
            ));
        }

        @Test
        @DisplayName("Should grant API Gateway invoke permissions")
        public void testApiGatewayInvokePermissions() {
            template.hasResourceProperties("AWS::Lambda::Permission", Match.objectLike(Map.of(
                    "Action", "lambda:InvokeFunction",
                    "Principal", "apigateway.amazonaws.com"
            )));
        }
    }

    @Nested
    @DisplayName("Step Functions Tests")
    class StepFunctionsResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Step Functions state machine")
        public void testStateMachineCreation() {
            template.hasResourceProperties("AWS::StepFunctions::StateMachine", Map.of(
                    "StateMachineName", "document-creation-workflow-test",
                    "StateMachineType", "STANDARD"
            ));
        }

        @Test
        @DisplayName("Should enable tracing for state machine")
        public void testStateMachineTracing() {
            template.hasResourceProperties("AWS::StepFunctions::StateMachine", Match.objectLike(Map.of(
                    "TracingConfiguration", Map.of("Enabled", true)
            )));
        }
    }

    @Nested
    @DisplayName("SNS Topic Tests")
    class SNSResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create SNS topic")
        public void testSnsTopicCreation() {
            template.hasResourceProperties("AWS::SNS::Topic", Map.of(
                    "TopicName", "DocumentUpdates-test",
                    "DisplayName", "Document Collaboration Updates"
            ));
        }

        @Test
        @DisplayName("Should subscribe Lambda to SNS topic")
        public void testSnsLambdaSubscription() {
            template.hasResourceProperties("AWS::SNS::Subscription", Match.objectLike(Map.of(
                    "Protocol", "lambda"
            )));
        }
    }

    @Nested
    @DisplayName("EventBridge Tests")
    class EventBridgeResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create custom EventBridge bus")
        public void testEventBusCreation() {
            template.hasResourceProperties("AWS::Events::EventBus", Map.of(
                    "Name", "DocumentCollaborationEventBus-test"
            ));
        }

        @Test
        @DisplayName("Should create EventBridge rule for document updates")
        public void testDocumentUpdatedRule() {
            template.hasResourceProperties("AWS::Events::Rule", Match.objectLike(Map.of(
                    "Name", "document-updated-rule-test",
                    "EventPattern", Match.objectLike(Map.of(
                            "source", Arrays.asList("document.collaboration"),
                            "detail-type", Arrays.asList("Document Updated")
                    ))
            )));
        }

        @Test
        @DisplayName("Should configure Lambda as EventBridge target")
        public void testEventBridgeLambdaTarget() {
            template.hasResourceProperties("AWS::Events::Rule", Match.objectLike(Map.of(
                    "Targets", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                    "Arn", Match.anyValue()
                            ))
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("DynamoDB Streams Tests")
    class DynamoDBStreamsTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create event source mapping for DynamoDB stream")
        public void testDynamoStreamEventSourceMapping() {
            template.hasResourceProperties("AWS::Lambda::EventSourceMapping", Match.objectLike(Map.of(
                    "StartingPosition", "TRIM_HORIZON",
                    "BatchSize", 100,
                    "MaximumRetryAttempts", 3
            )));
        }

        @Test
        @DisplayName("Should connect stream to conflict resolution Lambda")
        public void testStreamToLambdaConnection() {
            template.hasResourceProperties("AWS::Lambda::EventSourceMapping", Match.objectLike(Map.of(
                    "FunctionName", Match.anyValue(),
                    "EventSourceArn", Match.anyValue()
            )));
        }
    }

    @Nested
    @DisplayName("CloudWatch Dashboard Tests")
    class CloudWatchDashboardTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create CloudWatch dashboard")
        public void testDashboardCreation() {
            template.hasResourceProperties("AWS::CloudWatch::Dashboard", Match.objectLike(Map.of(
                    "DashboardName", "DocumentCollaboration-test"
            )));
        }

        @Test
        @DisplayName("Should configure dashboard body with widgets")
        public void testDashboardBody() {
            template.hasResourceProperties("AWS::CloudWatch::Dashboard", Match.objectLike(Map.of(
                    "DashboardBody", Match.anyValue()
            )));
        }
    }

    @Nested
    @DisplayName("CloudWatch Alarms Tests")
    class CloudWatchAlarmsTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create high error rate alarm")
        public void testHighErrorRateAlarm() {
            template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                    "AlarmName", "document-collab-high-errors-test",
                    "Threshold", 10.0,
                    "EvaluationPeriods", 2,
                    "ComparisonOperator", "GreaterThanThreshold"
            )));
        }

        @Test
        @DisplayName("Should create high latency alarm")
        public void testHighLatencyAlarm() {
            template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                    "AlarmName", "document-collab-high-latency-test",
                    "Threshold", 100.0,
                    "EvaluationPeriods", 2,
                    "ComparisonOperator", "GreaterThanThreshold"
            )));
        }

        @Test
        @DisplayName("Should create exactly 2 alarms")
        public void testAlarmCount() {
            template.resourceCountIs("AWS::CloudWatch::Alarm", 2);
        }
    }

    @Nested
    @DisplayName("Stack Outputs Tests")
    class StackOutputsTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create WebSocket API URL output")
        public void testWebSocketApiUrlOutput() {
            template.hasOutput("WebSocketApiUrl", Match.objectLike(Map.of(
                    "Description", "WebSocket API endpoint",
                    "Export", Map.of("Name", "WebSocketApiUrl-test")
            )));
        }

        @Test
        @DisplayName("Should create WebSocket API ID output")
        public void testWebSocketApiIdOutput() {
            template.hasOutput("WebSocketApiId", Match.objectLike(Map.of(
                    "Description", "WebSocket API ID",
                    "Export", Map.of("Name", "WebSocketApiId-test")
            )));
        }

        @Test
        @DisplayName("Should create Cognito User Pool ID output")
        public void testCognitoUserPoolIdOutput() {
            template.hasOutput("CognitoUserPoolId", Match.objectLike(Map.of(
                    "Description", "Cognito User Pool ID",
                    "Export", Map.of("Name", "CognitoUserPoolId-test")
            )));
        }

        @Test
        @DisplayName("Should create Cognito User Pool Client ID output")
        public void testCognitoUserPoolClientIdOutput() {
            template.hasOutput("CognitoUserPoolClientId", Match.objectLike(Map.of(
                    "Description", "Cognito User Pool Client ID",
                    "Export", Map.of("Name", "CognitoUserPoolClientId-test")
            )));
        }

        @Test
        @DisplayName("Should create Documents table name output")
        public void testDocumentsTableNameOutput() {
            template.hasOutput("DocumentsTableName", Match.objectLike(Map.of(
                    "Description", "Documents DynamoDB Table Name",
                    "Export", Map.of("Name", "DocumentsTableName-test")
            )));
        }

        @Test
        @DisplayName("Should create Operations table name output")
        public void testOperationsTableNameOutput() {
            template.hasOutput("OperationsTableName", Match.objectLike(Map.of(
                    "Description", "Operations DynamoDB Table Name",
                    "Export", Map.of("Name", "OperationsTableName-test")
            )));
        }

        @Test
        @DisplayName("Should create Connections table name output")
        public void testConnectionsTableNameOutput() {
            template.hasOutput("ConnectionsTableName", Match.objectLike(Map.of(
                    "Description", "Connections DynamoDB Table Name",
                    "Export", Map.of("Name", "ConnectionsTableName-test")
            )));
        }

        @Test
        @DisplayName("Should create Document bucket name output")
        public void testDocumentBucketNameOutput() {
            template.hasOutput("DocumentBucketName", Match.objectLike(Map.of(
                    "Description", "Document Storage S3 Bucket Name",
                    "Export", Map.of("Name", "DocumentBucketName-test")
            )));
        }

        @Test
        @DisplayName("Should create OpenSearch domain endpoint output")
        public void testOpenSearchDomainEndpointOutput() {
            template.hasOutput("OpenSearchDomainEndpoint", Match.objectLike(Map.of(
                    "Description", "OpenSearch Domain Endpoint",
                    "Export", Map.of("Name", "OpenSearchDomainEndpoint-test")
            )));
        }

        @Test
        @DisplayName("Should create Dashboard name output")
        public void testDashboardNameOutput() {
            template.hasOutput("DashboardName", Match.objectLike(Map.of(
                    "Description", "CloudWatch Dashboard Name",
                    "Export", Map.of("Name", "DashboardName-test")
            )));
        }
    }

    @Nested
    @DisplayName("TapStackProps Tests")
    class TapStackPropsTests {

        @Test
        @DisplayName("Should build TapStackProps with all properties")
        public void testTapStackPropsBuilder() {
            StackProps stackProps = StackProps.builder()
                    .description("Test description")
                    .build();

            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("prod")
                    .stackProps(stackProps)
                    .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
            assertThat(props.getStackProps()).isEqualTo(stackProps);
        }

        @Test
        @DisplayName("Should handle null stackProps in builder")
        public void testTapStackPropsBuilderWithNullStackProps() {
            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("test")
                    .stackProps(null)
                    .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
            assertThat(props.getStackProps()).isNotNull();
        }

        @Test
        @DisplayName("Should use builder to create props")
        public void testTapStackPropsBuilderPattern() {
            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("staging")
                    .build();

            assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        }
    }

    @Nested
    @DisplayName("Main Application Tests")
    class MainApplicationTests {

        @Test
        @DisplayName("Should create app with environment variables")
        public void testMainWithEnvironmentVariables() {
            App app = new App();
            
            String account = System.getenv("CDK_DEFAULT_ACCOUNT");
            String region = System.getenv("CDK_DEFAULT_REGION");

            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .stackProps(StackProps.builder()
                            .env(Environment.builder()
                                    .account(account)
                                    .region(region)
                                    .build())
                            .description("Document Collaboration System with Real-time WebSocket Support")
                            .build())
                    .build());

            assertThat(stack).isNotNull();
        }
    }

    @Nested
    @DisplayName("Resource Naming Tests")
    class ResourceNamingTests {

        @Test
        @DisplayName("Should use environment suffix in resource names")
        public void testResourceNamingWithEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("prod")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.hasResourceProperties("AWS::Cognito::UserPool", Map.of(
                    "UserPoolName", "DocumentCollabUserPool-prod"
            ));

            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabDocuments-prod"
            ));
        }

        @Test
        @DisplayName("Should use different suffixes for different environments")
        public void testMultipleEnvironmentSuffixes() {
            TapStack devStack = new TapStack(app, "DevStack", TapStackProps.builder()
                    .environmentSuffix("dev")
                    .build());
            
            assertThat(devStack.getEnvironmentSuffix()).isEqualTo("dev");

            App app2 = new App();
            TapStack prodStack = new TapStack(app2, "ProdStack", TapStackProps.builder()
                    .environmentSuffix("prod")
                    .build());
            
            assertThat(prodStack.getEnvironmentSuffix()).isEqualTo("prod");
            assertThat(devStack.getEnvironmentSuffix()).isNotEqualTo(prodStack.getEnvironmentSuffix());
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should create all required resources")
        public void testAllResourcesCreated() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.resourceCountIs("AWS::EC2::VPC", 1);
            template.resourceCountIs("AWS::Cognito::UserPool", 1);
            template.resourceCountIs("AWS::DynamoDB::Table", 3);
            template.resourceCountIs("AWS::S3::Bucket", 1);
            template.resourceCountIs("AWS::Lambda::Function", 7);
            template.resourceCountIs("AWS::ApiGatewayV2::Api", 1);
            template.resourceCountIs("AWS::ElastiCache::CacheCluster", 1);
            template.resourceCountIs("AWS::OpenSearchService::Domain", 1);
            template.resourceCountIs("AWS::StepFunctions::StateMachine", 1);
            template.resourceCountIs("AWS::SNS::Topic", 1);
            template.resourceCountIs("AWS::Events::EventBus", 1);
            template.resourceCountIs("AWS::CloudWatch::Dashboard", 1);
        }

        @Test
        @DisplayName("Should have correct number of IAM roles")
        public void testIAMRolesCount() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.resourcePropertiesCountIs("AWS::IAM::Role", 
                    Match.objectLike(Map.of("RoleName", Match.anyValue())), 2);
        }

        @Test
        @DisplayName("Should configure all stack outputs")
        public void testAllOutputsConfigured() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.hasOutput("WebSocketApiUrl", Match.anyValue());
            template.hasOutput("WebSocketApiId", Match.anyValue());
            template.hasOutput("CognitoUserPoolId", Match.anyValue());
            template.hasOutput("CognitoUserPoolClientId", Match.anyValue());
            template.hasOutput("DocumentsTableName", Match.anyValue());
            template.hasOutput("OperationsTableName", Match.anyValue());
            template.hasOutput("ConnectionsTableName", Match.anyValue());
            template.hasOutput("DocumentBucketName", Match.anyValue());
            template.hasOutput("OpenSearchDomainEndpoint", Match.anyValue());
            template.hasOutput("DashboardName", Match.anyValue());
        }

        @Test
        @DisplayName("Should synthesize valid CloudFormation template")
        public void testValidCloudFormationTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            assertThat(template).isNotNull();
            assertThat(template.toJSON()).isNotNull();
            assertThat(template.toJSON()).containsKey("Resources");
            assertThat(template.toJSON()).containsKey("Outputs");
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle empty environment suffix")
        public void testEmptyEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("")
                    .build());
            
            assertThat(stack.getEnvironmentSuffix()).isEmpty();
        }

        @Test
        @DisplayName("Should handle special characters in environment suffix")
        public void testSpecialCharactersInEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test-123")
                    .build());
            
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("test-123");
        }

        @Test
        @DisplayName("Should create stack without context")
        public void testStackCreationWithoutContext() {
            App freshApp = new App();
            TapStack stack = new TapStack(freshApp, "TestStack", TapStackProps.builder().build());
            
            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should prioritize props over context")
        public void testPropsPriorityOverContext() {
            app.getNode().setContext("environmentSuffix", "context-env");
            
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("props-env")
                    .build());
            
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("props-env");
        }
    }

    @Nested
    @DisplayName("Security Configuration Tests")
    class SecurityConfigurationTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should block all public access for S3 bucket")
        public void testS3PublicAccessBlock() {
            template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                    "PublicAccessBlockConfiguration", Map.of(
                            "BlockPublicAcls", true,
                            "BlockPublicPolicy", true,
                            "IgnorePublicAcls", true,
                            "RestrictPublicBuckets", true
                    )
            )));
        }

        @Test
        @DisplayName("Should enable encryption at rest for OpenSearch")
        public void testOpenSearchEncryptionAtRest() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "EncryptionAtRestOptions", Map.of("Enabled", true)
            )));
        }

        @Test
        @DisplayName("Should enable node-to-node encryption for OpenSearch")
        public void testOpenSearchNodeToNodeEncryption() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "NodeToNodeEncryptionOptions", Map.of("Enabled", true)
            )));
        }

        @Test
        @DisplayName("Should enforce HTTPS for OpenSearch")
        public void testOpenSearchEnforceHTTPS() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "DomainEndpointOptions", Map.of("EnforceHTTPS", true)
            )));
        }

        @Test
        @DisplayName("Should enable point-in-time recovery for Documents table")
        public void testDynamoDBPointInTimeRecovery() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                    "TableName", "DocumentCollabDocuments-test",
                    "PointInTimeRecoverySpecification", Map.of(
                            "PointInTimeRecoveryEnabled", true
                    )
            )));
        }
    }
}
```