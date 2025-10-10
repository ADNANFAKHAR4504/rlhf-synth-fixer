**I'll create a comprehensive AWS CDK Java implementation for the event ticketing system. This will be a production-ready implementation with all required resources.**
```java
package com.ticketing;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.CfnOutput;
import software.constructs.Construct;

import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.ecs.*;
import software.amazon.awscdk.services.ecs.patterns.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.lambda.eventsources.*;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cognito.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.logs.*;
import software.amazon.awscdk.services.secretsmanager.*;
import software.amazon.awscdk.services.ses.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class TicketingSystemStack extends Stack {
    
    public TicketingSystemStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
        // ===========================
        // 1. NETWORK LAYER - VPC
        // ===========================
        Vpc vpc = Vpc.Builder.create(this, "TicketingVPC")
            .vpcName("ticketing-vpc")
            .ipAddresses(IpAddresses.cidr("10.24.0.0/16"))
            .maxAzs(2)
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
            .natGateways(2)
            .build();
        
        // ===========================
        // 2. SECURITY GROUPS
        // ===========================
        
        // ALB Security Group
        SecurityGroup albSecurityGroup = SecurityGroup.Builder.create(this, "ALB-SG")
            .vpc(vpc)
            .description("Security group for Application Load Balancer")
            .allowAllOutbound(true)
            .build();
        
        albSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "Allow HTTP traffic from internet"
        );
        
        albSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "Allow HTTPS traffic from internet"
        );
        
        // ECS Security Group
        SecurityGroup ecsSecurityGroup = SecurityGroup.Builder.create(this, "ECS-SG")
            .vpc(vpc)
            .description("Security group for ECS tasks")
            .allowAllOutbound(true)
            .build();
        
        ecsSecurityGroup.addIngressRule(
            albSecurityGroup,
            Port.tcp(8080),
            "Allow traffic from ALB"
        );
        
        // Aurora Security Group
        SecurityGroup auroraSecurityGroup = SecurityGroup.Builder.create(this, "Aurora-SG")
            .vpc(vpc)
            .description("Security group for Aurora database")
            .allowAllOutbound(false)
            .build();
        
        // Lambda Security Group
        SecurityGroup lambdaSecurityGroup = SecurityGroup.Builder.create(this, "Lambda-SG")
            .vpc(vpc)
            .description("Security group for Lambda functions")
            .allowAllOutbound(true)
            .build();
        
        // Allow ECS and Lambda to connect to Aurora
        auroraSecurityGroup.addIngressRule(
            ecsSecurityGroup,
            Port.tcp(5432),
            "Allow ECS tasks to connect to Aurora"
        );
        
        auroraSecurityGroup.addIngressRule(
            lambdaSecurityGroup,
            Port.tcp(5432),
            "Allow Lambda to connect to Aurora"
        );
        
        // ===========================
        // 3. DATABASE LAYER
        // ===========================
        
        // Aurora Serverless v2 Database
        DatabaseSecret databaseCredentials = DatabaseSecret.Builder.create(this, "AuroraCredentials")
            .username("admin")
            .build();
        
        IClusterEngine auroraEngine = DatabaseClusterEngine.auroraPostgres(
            AuroraPostgresClusterEngineProps.builder()
                .version(AuroraPostgresEngineVersion.VER_15_5)
                .build()
        );
        
        DatabaseCluster auroraCluster = DatabaseCluster.Builder.create(this, "AuroraCluster")
            .engine(auroraEngine)
            .credentials(Credentials.fromSecret(databaseCredentials))
            .defaultDatabaseName("ticketdb")
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .build())
            .securityGroups(Arrays.asList(auroraSecurityGroup))
            .writer(ClusterInstance.serverlessV2("writer", ServerlessV2ClusterInstanceProps.builder()
                .build()))
            .readers(Arrays.asList(
                ClusterInstance.serverlessV2("reader", ServerlessV2ClusterInstanceProps.builder()
                    .scaleWithWriter(true)
                    .build())
            ))
            .serverlessV2MinCapacity(0.5)
            .serverlessV2MaxCapacity(2.0)
            .build();
        
        // DynamoDB Table
        Table ticketInventoryTable = Table.Builder.create(this, "TicketInventory")
            .tableName("TicketInventory")
            .partitionKey(Attribute.builder()
                .name("eventId")
                .type(AttributeType.STRING)
                .build())
            .sortKey(Attribute.builder()
                .name("ticketId")
                .type(AttributeType.STRING)
                .build())
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .pointInTimeRecovery(true)
            .stream(StreamViewType.NEW_AND_OLD_IMAGES)
            .removalPolicy(RemovalPolicy.RETAIN)
            .build();
        
        // Add Global Secondary Index
        ticketInventoryTable.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
            .indexName("statusIndex")
            .partitionKey(Attribute.builder()
                .name("status")
                .type(AttributeType.STRING)
                .build())
            .sortKey(Attribute.builder()
                .name("purchaseTimestamp")
                .type(AttributeType.STRING)
                .build())
            .projectionType(ProjectionType.ALL)
            .build());
        
        // ===========================
        // 4. STORAGE - S3 BUCKET
        // ===========================
        
        String accountId = this.getAccount();
        Bucket qrCodeBucket = Bucket.Builder.create(this, "QRCodeBucket")
            .bucketName("ticket-qrcodes-" + accountId)
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .lifecycleRules(Arrays.asList(
                LifecycleRule.builder()
                    .enabled(true)
                    .expiration(Duration.days(90))
                    .build()
            ))
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .removalPolicy(RemovalPolicy.RETAIN)
            .build();
        
        // ===========================
        // 5. AUTHENTICATION - COGNITO
        // ===========================
        
        UserPool userPool = UserPool.Builder.create(this, "TicketSystemUsers")
            .userPoolName("TicketSystemUsers")
            .signInAliases(SignInAliases.builder()
                .email(true)
                .build())
            .selfSignUpEnabled(true)
            .passwordPolicy(PasswordPolicy.builder()
                .minLength(8)
                .requireUppercase(true)
                .requireDigits(true)
                .requireSymbols(true)
                .build())
            .mfa(Mfa.OPTIONAL)
            .mfaSecondFactor(MfaSecondFactor.builder()
                .sms(true)
                .otp(true)
                .build())
            .accountRecovery(AccountRecovery.EMAIL_ONLY)
            .removalPolicy(RemovalPolicy.RETAIN)
            .build();
        
        UserPoolClient userPoolClient = UserPoolClient.Builder.create(this, "TicketSystemWebClient")
            .userPool(userPool)
            .userPoolClientName("web-app-client")
            .authFlows(AuthFlow.builder()
                .userPassword(true)
                .userSrp(true)
                .build())
            .generateSecret(false)
            .build();
        
        // ===========================
        // 6. LAMBDA FUNCTION
        // ===========================
        
        // Lambda Execution Role
        Role lambdaExecutionRole = Role.Builder.create(this, "LambdaExecutionRole")
            .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
            .description("Execution role for QR Code Generator Lambda")
            .managedPolicies(Arrays.asList(
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ))
            .build();
        
        // Grant permissions to Lambda role
        ticketInventoryTable.grantStreamRead(lambdaExecutionRole);
        qrCodeBucket.grantWrite(lambdaExecutionRole);
        
        // Create CloudWatch Log Group for Lambda
        LogGroup lambdaLogGroup = LogGroup.Builder.create(this, "LambdaLogGroup")
            .logGroupName("/aws/lambda/QRCodeGenerator")
            .retention(RetentionDays.ONE_WEEK)
            .removalPolicy(RemovalPolicy.DESTROY)
            .build();
        
        // QR Code Generator Lambda
        Function qrCodeGenerator = Function.Builder.create(this, "QRCodeGenerator")
            .functionName("QRCodeGenerator")
            .runtime(Runtime.JAVA_17)
            .handler("com.ticketing.lambda.QRCodeGeneratorHandler::handleRequest")
            .code(Code.fromAsset("lambda"))
            .memorySize(512)
            .timeout(Duration.seconds(30))
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .build())
            .securityGroups(Arrays.asList(lambdaSecurityGroup))
            .role(lambdaExecutionRole)
            .environment(Map.of(
                "BUCKET_NAME", qrCodeBucket.getBucketName(),
                "REGION", this.getRegion()
            ))
            .logGroup(lambdaLogGroup)
            .build();
        
        // Add DynamoDB Stream trigger
        qrCodeGenerator.addEventSource(DynamoEventSource.Builder.create(ticketInventoryTable)
            .startingPosition(StartingPosition.TRIM_HORIZON)
            .batchSize(10)
            .retryAttempts(3)
            .build());
        
        // ===========================
        // 7. API GATEWAY
        // ===========================
        
        // Create CloudWatch Log Group for API Gateway
        LogGroup apiLogGroup = LogGroup.Builder.create(this, "APIGatewayLogGroup")
            .logGroupName("/aws/apigateway/TicketValidationAPI")
            .retention(RetentionDays.ONE_WEEK)
            .removalPolicy(RemovalPolicy.DESTROY)
            .build();
        
        // Ticket Validation Lambda
        Function validationLambda = Function.Builder.create(this, "TicketValidationLambda")
            .functionName("TicketValidationFunction")
            .runtime(Runtime.JAVA_17)
            .handler("com.ticketing.lambda.TicketValidationHandler::handleRequest")
            .code(Code.fromAsset("lambda"))
            .memorySize(256)
            .timeout(Duration.seconds(10))
            .environment(Map.of(
                "DYNAMODB_TABLE", ticketInventoryTable.getTableName(),
                "REGION", this.getRegion()
            ))
            .build();
        
        ticketInventoryTable.grantReadWriteData(validationLambda);
        
        // REST API
        RestApi api = RestApi.Builder.create(this, "TicketValidationAPI")
            .restApiName("TicketValidationAPI")
            .description("API for validating event tickets")
            .deployOptions(StageOptions.builder()
                .stageName("prod")
                .loggingLevel(MethodLoggingLevel.INFO)
                .dataTraceEnabled(true)
                .accessLogDestination(new LogGroupLogDestination(apiLogGroup))
                .accessLogFormat(AccessLogFormat.jsonWithStandardFields())
                .build())
            .defaultCorsPreflightOptions(CorsOptions.builder()
                .allowOrigins(Arrays.asList("*"))
                .allowMethods(Arrays.asList("POST", "OPTIONS"))
                .allowHeaders(Arrays.asList("Content-Type", "X-Api-Key"))
                .build())
            .apiKeySourceType(ApiKeySourceType.HEADER)
            .build();
        
        // API Key
        ApiKey apiKey = ApiKey.Builder.create(this, "TicketAPIKey")
            .apiKeyName("ticket-validation-key")
            .enabled(true)
            .build();
        
        // Usage Plan
        UsagePlan usagePlan = UsagePlan.Builder.create(this, "UsagePlan")
            .name("TicketValidationUsagePlan")
            .throttle(ThrottleSettings.builder()
                .rateLimit(100)
                .burstLimit(200)
                .build())
            .quota(QuotaSettings.builder()
                .limit(10000)
                .period(Period.DAY)
                .build())
            .build();
        
        usagePlan.addApiKey(apiKey);
        usagePlan.addApiStage(UsagePlanPerApiStage.builder()
            .api(api)
            .stage(api.getDeploymentStage())
            .build());
        
        // /validate resource
        IResource validateResource = api.getRoot().addResource("validate");
        
        LambdaIntegration validationIntegration = LambdaIntegration.Builder.create(validationLambda)
            .proxy(true)
            .build();
        
        validateResource.addMethod("POST", validationIntegration, MethodOptions.builder()
            .apiKeyRequired(true)
            .build());
        
        // ===========================
        // 8. ECS CLUSTER & APPLICATION
        // ===========================
        
        // ECS Cluster
        Cluster ecsCluster = Cluster.Builder.create(this, "TicketingCluster")
            .clusterName("ticketing-cluster")
            .vpc(vpc)
            .containerInsights(true)
            .build();
        
        // Create CloudWatch Log Group for ECS
        LogGroup ecsLogGroup = LogGroup.Builder.create(this, "ECSLogGroup")
            .logGroupName("/ecs/ticketing-app")
            .retention(RetentionDays.ONE_WEEK)
            .removalPolicy(RemovalPolicy.DESTROY)
            .build();
        
        // Task Definition
        FargateTaskDefinition taskDefinition = FargateTaskDefinition.Builder.create(this, "TaskDef")
            .memoryLimitMiB(2048)
            .cpu(1024)
            .build();
        
        // Grant task permissions
        ticketInventoryTable.grantReadWriteData(taskDefinition.getTaskRole());
        qrCodeBucket.grantReadWrite(taskDefinition.getTaskRole());
        databaseCredentials.grantRead(taskDefinition.getTaskRole());
        
        // Container Definition
        ContainerDefinition appContainer = taskDefinition.addContainer("TicketingAppContainer", ContainerDefinitionOptions.builder()
            .containerName("ticketing-app")
            .image(ContainerImage.fromRegistry("amazon/amazon-ecs-sample"))
            .memoryLimitMiB(2048)
            .cpu(1024)
            .logging(LogDriver.awsLogs(AwsLogDriverProps.builder()
                .streamPrefix("ticketing-app")
                .logGroup(ecsLogGroup)
                .build()))
            .environment(Map.of(
                "DB_SECRET_ARN", databaseCredentials.getSecretArn(),
                "DYNAMODB_TABLE", ticketInventoryTable.getTableName(),
                "S3_BUCKET", qrCodeBucket.getBucketName(),
                "USER_POOL_ID", userPool.getUserPoolId(),
                "REGION", this.getRegion()
            ))
            .build());
        
        appContainer.addPortMappings(PortMapping.builder()
            .containerPort(8080)
            .protocol(Protocol.TCP)
            .build());
        
        // ALB + Fargate Service
        ApplicationLoadBalancedFargateService fargateService = 
            ApplicationLoadBalancedFargateService.Builder.create(this, "TicketingService")
                .cluster(ecsCluster)
                .taskDefinition(taskDefinition)
                .publicLoadBalancer(true)
                .desiredCount(2)
                .listenerPort(80)
                .securityGroups(Arrays.asList(albSecurityGroup))
                .taskSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .build())
                .build();
        
        // Configure ECS Security Group
        fargateService.getService().getConnections().getSecurityGroups().get(0)
            .addIngressRule(albSecurityGroup, Port.tcp(8080), "Allow from ALB");
        
        // Health Check Configuration
        fargateService.getTargetGroup().configureHealthCheck(HealthCheck.builder()
            .path("/health")
            .interval(Duration.seconds(60))
            .timeout(Duration.seconds(5))
            .healthyThresholdCount(2)
            .unhealthyThresholdCount(3)
            .build());
        
        // Auto Scaling
        ScalableTaskCount scalableTarget = fargateService.getService().autoScaleTaskCount(
            EnableScalingProps.builder()
                .minCapacity(2)
                .maxCapacity(10)
                .build()
        );
        
        scalableTarget.scaleOnCpuUtilization("CpuScaling", CpuUtilizationScalingProps.builder()
            .targetUtilizationPercent(70)
            .scaleInCooldown(Duration.seconds(60))
            .scaleOutCooldown(Duration.seconds(60))
            .build());
        
        scalableTarget.scaleOnMemoryUtilization("MemoryScaling", MemoryUtilizationScalingProps.builder()
            .targetUtilizationPercent(80)
            .scaleInCooldown(Duration.seconds(60))
            .scaleOutCooldown(Duration.seconds(60))
            .build());
        
        // ===========================
        // 9. OUTPUTS
        // ===========================
        
        CfnOutput.Builder.create(this, "LoadBalancerDNS")
            .value(fargateService.getLoadBalancer().getLoadBalancerDnsName())
            .description("Application Load Balancer DNS")
            .exportName("ALB-DNS")
            .build();
        
        CfnOutput.Builder.create(this, "APIEndpoint")
            .value(api.getUrl())
            .description("API Gateway Endpoint")
            .exportName("API-Endpoint")
            .build();
        
        CfnOutput.Builder.create(this, "UserPoolId")
            .value(userPool.getUserPoolId())
            .description("Cognito User Pool ID")
            .exportName("UserPool-ID")
            .build();
        
        CfnOutput.Builder.create(this, "UserPoolClientId")
            .value(userPoolClient.getUserPoolClientId())
            .description("Cognito User Pool Client ID")
            .exportName("UserPoolClient-ID")
            .build();
        
        CfnOutput.Builder.create(this, "DynamoDBTableName")
            .value(ticketInventoryTable.getTableName())
            .description("DynamoDB Table Name")
            .exportName("DynamoDB-Table")
            .build();
        
        CfnOutput.Builder.create(this, "S3BucketName")
            .value(qrCodeBucket.getBucketName())
            .description("S3 Bucket for QR Codes")
            .exportName("S3-Bucket")
            .build();
        
        CfnOutput.Builder.create(this, "AuroraClusterEndpoint")
            .value(auroraCluster.getClusterEndpoint().getHostname())
            .description("Aurora Cluster Endpoint")
            .exportName("Aurora-Endpoint")
            .build();
        
        CfnOutput.Builder.create(this, "APIKey")
            .value(apiKey.getKeyId())
            .description("API Gateway API Key ID")
            .exportName("API-Key-ID")
            .build();
    }
}

// Lambda Ticketing

```java
package com.ticketing;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;

/**
 * Main application entry point for AWS CDK Event Ticketing System.
 * Deploys all infrastructure to us-west-2 region.
 */
public class TicketingSystemApp {
    
    public static void main(final String[] args) {
        App app = new App();
        
        // Define deployment environment
        Environment environment = Environment.builder()
            .region("us-west-2")
            .build();
        
        // Create the main stack
        TicketingSystemStack ticketingStack = new TicketingSystemStack(
            app, 
            "TicketingSystemStack", 
            StackProps.builder()
                .env(environment)
                .description("Production Event Ticketing System Infrastructure")
                .build()
        );
        
        // Add tags to all resources in the stack
        Tags.of(ticketingStack).add("Project", "EventTicketingSystem");
        Tags.of(ticketingStack).add("Environment", "Production");
        Tags.of(ticketingStack).add("ManagedBy", "AWS-CDK");
        Tags.of(ticketingStack).add("CostCenter", "Ticketing");
        
        // Synthesize CloudFormation template
        app.synth();
    }
}

// TicketValidationHandler.java
```java
package com.ticketing.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Lambda function handler for validating event tickets via API Gateway.
 * Checks ticket status in DynamoDB and marks tickets as validated.
 */
public class TicketValidationHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private final DynamoDbClient dynamoDbClient;
    private final String tableName;
    private final Gson gson;
    
    public TicketValidationHandler() {
        this.dynamoDbClient = DynamoDbClient.builder().build();
        this.tableName = System.getenv("DYNAMODB_TABLE");
        this.gson = new Gson();
    }
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Received validation request");
        
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setHeaders(getCorsHeaders());
        
        try {
            // Parse request body
            String body = request.getBody();
            if (body == null || body.isEmpty()) {
                return createErrorResponse(400, "Request body is required");
            }
            
            JsonObject requestJson = gson.fromJson(body, JsonObject.class);
            
            if (!requestJson.has("eventId") || !requestJson.has("ticketId")) {
                return createErrorResponse(400, "eventId and ticketId are required");
            }
            
            String eventId = requestJson.get("eventId").getAsString();
            String ticketId = requestJson.get("ticketId").getAsString();
            
            context.getLogger().log(String.format("Validating ticket %s for event %s", ticketId, eventId));
            
            // Retrieve ticket from DynamoDB
            GetItemResponse getItemResponse = dynamoDbClient.getItem(GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                    "eventId", AttributeValue.builder().s(eventId).build(),
                    "ticketId", AttributeValue.builder().s(ticketId).build()
                ))
                .build());
            
            if (!getItemResponse.hasItem() || getItemResponse.item().isEmpty()) {
                return createErrorResponse(404, "Ticket not found");
            }
            
            Map<String, AttributeValue> item = getItemResponse.item();
            String status = item.get("status").s();
            
            // Validate ticket status
            if (!"purchased".equalsIgnoreCase(status)) {
                if ("validated".equalsIgnoreCase(status)) {
                    return createErrorResponse(409, "Ticket already validated");
                } else if ("cancelled".equalsIgnoreCase(status)) {
                    return createErrorResponse(403, "Ticket has been cancelled");
                } else {
                    return createErrorResponse(400, "Invalid ticket status: " + status);
                }
            }
            
            // Update ticket status to validated
            String validationTimestamp = Instant.now().toString();
            
            dynamoDbClient.updateItem(UpdateItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                    "eventId", AttributeValue.builder().s(eventId).build(),
                    "ticketId", AttributeValue.builder().s(ticketId).build()
                ))
                .updateExpression("SET #status = :validated, validationTimestamp = :timestamp")
                .expressionAttributeNames(Map.of("#status", "status"))
                .expressionAttributeValues(Map.of(
                    ":validated", AttributeValue.builder().s("validated").build(),
                    ":timestamp", AttributeValue.builder().s(validationTimestamp).build()
                ))
                .build());
            
            context.getLogger().log(String.format("Successfully validated ticket %s for event %s", ticketId, eventId));
            
            // Create success response
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);
            responseBody.put("message", "Ticket validated successfully");
            responseBody.put("eventId", eventId);
            responseBody.put("ticketId", ticketId);
            responseBody.put("validationTimestamp", validationTimestamp);
            
            response.setStatusCode(200);
            response.setBody(gson.toJson(responseBody));
            
        } catch (Exception e) {
            context.getLogger().log("Error validating ticket: " + e.getMessage());
            return createErrorResponse(500, "Internal server error: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Creates an error response with proper CORS headers.
     */
    private APIGatewayProxyResponseEvent createErrorResponse(int statusCode, String message) {
        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("success", false);
        errorBody.put("error", message);
        
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(statusCode);
        response.setHeaders(getCorsHeaders());
        response.setBody(gson.toJson(errorBody));
        
        return response;
    }
    
    /**
     * Returns CORS headers for API responses.
     */
    private Map<String, String> getCorsHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "POST, OPTIONS");
        headers.put("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");
        return headers;
    }
}
