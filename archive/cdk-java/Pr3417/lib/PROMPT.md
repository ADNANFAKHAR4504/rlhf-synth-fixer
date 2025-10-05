# Document Collaboration System - Implementation Prompt

## Overview
It's been a busy weekend and I can't possibly build this document collaboration system myself. I want you to Build a real-time document collaboration system using AWS CDK deployed to **us-east-1**. This system should support multiple users editing documents simultaneously with conflict resolution, version history, and real-time synchronization. Make sure it is compatible with gradle build tool as I use build.gradle

---

## Architecture Requirements

### 1. Real-Time Communication Layer
**API Gateway WebSocket API**
- Enable bidirectional real-time communication between clients and backend
- Handle connection lifecycle (connect, disconnect, message routing)
- Support broadcasting updates to all connected clients editing the same document

```java
// CDK Java Implementation
import software.amazon.awscdk.services.apigatewayv2.WebSocketApi;
import software.amazon.awscdk.services.apigatewayv2.WebSocketStage;

WebSocketApi webSocketApi = WebSocketApi.Builder.create(this, "DocumentCollabWebSocket")
    .apiName("document-collaboration-websocket")
    .description("WebSocket API for real-time document collaboration")
    .build();

WebSocketStage stage = WebSocketStage.Builder.create(this, "ProdStage")
    .webSocketApi(webSocketApi)
    .stageName("prod")
    .autoDeploy(true)
    .build();
```

### 2. Compute Layer
**AWS Lambda (Java 17 Runtime)**

Implement the following Lambda functions:

1. **Connection Handler** - Manage WebSocket connections (connect/disconnect)
2. **Message Handler** - Process incoming document operations
3. **Conflict Resolution Handler** - Resolve conflicting edits using operational transformation

```java
// CDK Java Implementation for Lambda Functions
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Code;

Function messageHandler = Function.Builder.create(this, "MessageHandler")
    .runtime(Runtime.JAVA_17)
    .handler("com.doccollab.handlers.MessageHandler::handleRequest")
    .code(Code.fromAsset("lambda/target/lambda.jar"))
    .memorySize(1024)
    .timeout(Duration.seconds(30))
    .environment(Map.of(
        "OPERATIONS_TABLE", operationsTable.getTableName(),
        "REDIS_ENDPOINT", redisEndpoint
    ))
    .build();
```

### 3. Database Layer
**DynamoDB with Transactions**

Create the following tables:

1. **Documents Table** - Partition Key: `documentId`
2. **Operations Table** - Partition Key: `documentId`, Sort Key: `timestamp`
3. **Connections Table** - Partition Key: `connectionId`, TTL enabled

```java
// CDK Java Implementation for DynamoDB Tables
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.StreamViewType;

Table documentsTable = Table.Builder.create(this, "DocumentsTable")
    .tableName("DocumentCollabDocuments")
    .partitionKey(Attribute.builder()
        .name("documentId")
        .type(AttributeType.STRING)
        .build())
    .billingMode(BillingMode.PAY_PER_REQUEST)
    .pointInTimeRecovery(true)
    .removalPolicy(RemovalPolicy.RETAIN)
    .build();

Table operationsTable = Table.Builder.create(this, "OperationsTable")
    .tableName("DocumentCollabOperations")
    .partitionKey(Attribute.builder()
        .name("documentId")
        .type(AttributeType.STRING)
        .build())
    .sortKey(Attribute.builder()
        .name("timestamp")
        .type(AttributeType.NUMBER)
        .build())
    .stream(StreamViewType.NEW_AND_OLD_IMAGES)
    .build();
```

**DynamoDB Streams**

```java
import software.amazon.awscdk.services.lambda.eventsources.DynamoEventSource;
import software.amazon.awscdk.services.lambda.StartingPosition;

DynamoEventSource eventSource = DynamoEventSource.Builder.create(operationsTable)
    .startingPosition(StartingPosition.TRIM_HORIZON)
    .batchSize(100)
    .build();

conflictResolutionHandler.addEventSource(eventSource);
```

### 4. Storage Layer
**S3 with Versioning**

```java
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;

Bucket documentBucket = Bucket.Builder.create(this, "DocumentBucket")
    .bucketName("document-collab-bucket-us-east-1")
    .versioned(true)
    .encryption(BucketEncryption.S3_MANAGED)
    .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
    .lifecycleRules(List.of(
        LifecycleRule.builder()
            .noncurrentVersionExpiration(Duration.days(365))
            .build()
    ))
    .build();
```

### 5. Caching Layer
**ElastiCache Redis**

```java
import software.amazon.awscdk.services.elasticache.CfnCacheCluster;
import software.amazon.awscdk.services.elasticache.CfnSubnetGroup;

CfnSubnetGroup redisSubnetGroup = CfnSubnetGroup.Builder.create(this, "RedisSubnetGroup")
    .subnetIds(vpc.getPrivateSubnets().stream()
        .map(subnet -> subnet.getSubnetId())
        .collect(Collectors.toList()))
    .description("Subnet group for Redis cluster")
    .build();

CfnCacheCluster redisCluster = CfnCacheCluster.Builder.create(this, "RedisCluster")
    .cacheNodeType("cache.t3.medium")
    .engine("redis")
    .numCacheNodes(1)
    .cacheSubnetGroupName(redisSubnetGroup.getRef())
    .build();
```

### 6. Mobile Client Support
**AWS AppSync (GraphQL)**

```java
import software.amazon.awscdk.services.appsync.GraphqlApi;
import software.amazon.awscdk.services.appsync.SchemaFile;
import software.amazon.awscdk.services.appsync.AuthorizationType;

GraphqlApi api = GraphqlApi.Builder.create(this, "DocumentCollabAPI")
    .name("DocumentCollabGraphQLAPI")
    .schema(SchemaFile.fromAsset("schema/schema.graphql"))
    .authorizationConfig(AuthorizationConfig.builder()
        .defaultAuthorization(AuthorizationMode.builder()
            .authorizationType(AuthorizationType.USER_POOL)
            .userPoolConfig(UserPoolConfig.builder()
                .userPool(userPool)
                .build())
            .build())
        .build())
    .xrayEnabled(true)
    .build();
```

### 7. Authentication & Authorization
**Amazon Cognito**

```java
import software.amazon.awscdk.services.cognito.UserPool;
import software.amazon.awscdk.services.cognito.UserPoolClient;
import software.amazon.awscdk.services.cognito.Mfa;
import software.amazon.awscdk.services.cognito.CfnUserPoolGroup;

UserPool userPool = UserPool.Builder.create(this, "UserPool")
    .userPoolName("DocumentCollabUserPool")
    .selfSignUpEnabled(true)
    .signInAliases(SignInAliases.builder()
        .email(true)
        .username(true)
        .build())
    .mfa(Mfa.OPTIONAL)
    .accountRecovery(AccountRecovery.EMAIL_ONLY)
    .build();

CfnUserPoolGroup editorGroup = CfnUserPoolGroup.Builder.create(this, "EditorGroup")
    .userPoolId(userPool.getUserPoolId())
    .groupName("editors")
    .description("Users with edit access")
    .precedence(2)
    .build();
```

### 8. Workflow Orchestration
**AWS Step Functions**

```java
import software.amazon.awscdk.services.stepfunctions.StateMachine;
import software.amazon.awscdk.services.stepfunctions.Chain;
import software.amazon.awscdk.services.stepfunctions.tasks.LambdaInvoke;
import software.amazon.awscdk.services.stepfunctions.tasks.DynamoPutItem;

LambdaInvoke validateTask = LambdaInvoke.Builder.create(this, "ValidateInput")
    .lambdaFunction(validateInputFunction)
    .outputPath("$.Payload")
    .build();

DynamoPutItem createRecordTask = DynamoPutItem.Builder.create(this, "CreateDynamoRecord")
    .table(documentsTable)
    .item(Map.of(
        "documentId", DynamoAttributeValue.fromString(JsonPath.stringAt("$.documentId"))
    ))
    .build();

Chain definition = Chain.start(validateTask)
    .next(createRecordTask)
    .next(new Succeed(this, "Success"));

StateMachine workflow = StateMachine.Builder.create(this, "DocumentCreationWorkflow")
    .stateMachineName("DocumentCreationWorkflow")
    .definition(definition)
    .build();
```

### 9. Monitoring & Observability
**Amazon CloudWatch & AWS X-Ray**

```java
import software.amazon.awscdk.services.cloudwatch.Dashboard;
import software.amazon.awscdk.services.cloudwatch.GraphWidget;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.Alarm;

Metric operationLatencyMetric = Metric.Builder.create()
    .namespace("DocumentCollab")
    .metricName("OperationLatency")
    .statistic("Average")
    .period(Duration.minutes(1))
    .build();

Alarm highLatencyAlarm = Alarm.Builder.create(this, "HighLatencyAlarm")
    .metric(operationLatencyMetric)
    .threshold(100)
    .evaluationPeriods(2)
    .build();

Dashboard dashboard = Dashboard.Builder.create(this, "DocumentCollabDashboard")
    .dashboardName("DocumentCollaboration")
    .build();

dashboard.addWidgets(
    GraphWidget.Builder.create()
        .title("Operation Latency")
        .left(List.of(operationLatencyMetric))
        .build()
);
```

### 10. Event-Driven Architecture
**Amazon EventBridge**

```java
import software.amazon.awscdk.services.events.EventBus;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.EventPattern;
import software.amazon.awscdk.services.events.targets.LambdaFunction;

EventBus documentEventBus = EventBus.Builder.create(this, "DocumentEventBus")
    .eventBusName("DocumentCollaborationEventBus")
    .build();

Rule documentUpdatedRule = Rule.Builder.create(this, "DocumentUpdatedRule")
    .eventBus(documentEventBus)
    .eventPattern(EventPattern.builder()
        .source(List.of("document.collaboration"))
        .detailType(List.of("Document Updated"))
        .build())
    .build();

documentUpdatedRule.addTarget(new LambdaFunction(notificationHandler));
```

### 11. Notifications
**Amazon SNS**

```java
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sns.subscriptions.LambdaSubscription;

Topic documentTopic = Topic.Builder.create(this, "DocumentUpdatesTopic")
    .topicName("DocumentUpdates")
    .displayName("Document Collaboration Updates")
    .build();

documentTopic.addSubscription(new LambdaSubscription(emailNotificationHandler));
```

### 12. Search Capabilities
**Amazon OpenSearch**

```java
import software.amazon.awscdk.services.opensearchservice.Domain;
import software.amazon.awscdk.services.opensearchservice.EngineVersion;
import software.amazon.awscdk.services.opensearchservice.CapacityConfig;

Domain openSearchDomain = Domain.Builder.create(this, "DocumentSearchDomain")
    .domainName("document-collab-search")
    .version(EngineVersion.OPENSEARCH_2_5)
    .capacity(CapacityConfig.builder()
        .dataNodeInstanceType("t3.small.search")
        .dataNodes(2)
        .build())
    .nodeToNodeEncryption(true)
    .enforceHttps(true)
    .build();
```

---

## CDK Implementation Requirements

### Stack Structure
```java
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class DocumentCollabApp {
    public static void main(final String[] args) {
        App app = new App();

        Environment env = Environment.builder()
                .region("us-east-1")
                .build();

        StackProps stackProps = StackProps.builder()
                .env(env)
                .build();

        NetworkStack networkStack = new NetworkStack(app, "NetworkStack", stackProps);
        AuthStack authStack = new AuthStack(app, "AuthStack", stackProps);
        DataStack dataStack = new DataStack(app, "DataStack", stackProps, networkStack.getVpc());
        ApiStack apiStack = new ApiStack(app, "ApiStack", stackProps,
            authStack.getUserPool(),
            dataStack.getDocumentsTable(),
            dataStack.getOperationsTable(),
            dataStack.getConnectionsTable());
        MonitoringStack monitoringStack = new MonitoringStack(app, "MonitoringStack", stackProps, apiStack);

        app.synth();
    }
}
```

### Expected Outputs
```java
import software.amazon.awscdk.CfnOutput;

CfnOutput.Builder.create(this, "WebSocketApiUrl")
    .value(webSocketApi.getApiEndpoint())
    .description("WebSocket API endpoint")
    .exportName("WebSocketApiUrl")
    .build();

CfnOutput.Builder.create(this, "AppSyncGraphQLUrl")
    .value(api.getGraphqlUrl())
    .exportName("AppSyncGraphQLUrl")
    .build();

CfnOutput.Builder.create(this, "CognitoUserPoolId")
    .value(userPool.getUserPoolId())
    .exportName("CognitoUserPoolId")
    .build();
```

---

## Success Criteria

1. **Performance**
   - WebSocket message latency < 100ms
   - Document load time < 500ms
   - Support 100+ concurrent editors per document

2. **Reliability**
   - 99.9% uptime
   - Zero data loss
   - Automatic conflict resolution

3. **Scalability**
   - Handle 10,000+ concurrent connections
   - Support 1M+ documents
   - Auto-scaling based on load

4. **Security**
   - End-to-end encryption
   - Role-based access control
   - Audit logging for all operations

---

## Deliverables

1. **Complete CDK Java code** with stack structure:
   - DocumentCollabApp.java (main entry point)
   - NetworkStack.java (VPC, subnets, security groups)
   - AuthStack.java (Cognito user pool and groups)
   - DataStack.java (DynamoDB, S3, Redis, OpenSearch)
   - ApiStack.java (WebSocket API, AppSync, Lambda functions)
   - MonitoringStack.java (CloudWatch dashboards and alarms)

2. **Java 17 Lambda function implementations**:
   - ConnectionHandler.java - WebSocket connection management
   - MessageHandler.java - Document operation processing
   - ConflictResolutionHandler.java - Operational transformation
   - NotificationHandler.java - Event processing
   - IndexingHandler.java - OpenSearch indexing
   - SearchHandler.java - Full-text search

3. **GraphQL schema** (schema.graphql):
   - Queries: getDocument, listDocuments, searchDocuments
   - Mutations: createDocument, editDocument, deleteDocument
   - Subscriptions: onDocumentUpdated, onUserJoined

4. **DynamoDB table designs** with:
   - Primary keys and sort keys
   - Global Secondary Indexes (GSI)
   - Time-to-Live (TTL) attributes
   - DynamoDB Streams configuration

5. **CloudWatch dashboard configuration**:
   - Active connections metric
   - Operation latency percentiles
   - Error rates and alarms
   - Lambda performance metrics

6. **Deployment instructions**:
   ```bash
   mvn clean package
   cdk bootstrap aws://ACCOUNT-ID/us-east-1
   cdk synth
   cdk deploy --all
   ```

7. **API documentation** with example requests/responses for:
   - WebSocket message format
   - GraphQL queries and mutations
   - EventBridge event patterns
   - REST API endpoints