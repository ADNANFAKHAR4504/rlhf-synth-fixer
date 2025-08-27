# Serverless Web Application Infrastructure Solution

I'll help you build a complete serverless infrastructure using AWS CDK in Java. The solution includes Lambda functions, API Gateway, DynamoDB, VPC configuration, and comprehensive monitoring with the latest AWS features like Application Insights and Config.

## Main.java

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.FunctionProps;
import software.amazon.awscdk.services.lambda.VpcConfig;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.LambdaIntegration;
import software.amazon.awscdk.services.apigateway.RestApiProps;
import software.amazon.awscdk.services.dynamodb.TableV2;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.ThroughputProps;
import software.amazon.awscdk.services.dynamodb.TableV2Props;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.logs.LogGroupProps;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.applicationinsights.CfnApplication;
import software.amazon.awscdk.services.config.ConfigurationRecorder;
import software.amazon.awscdk.services.config.DeliveryChannel;
import software.amazon.awscdk.services.config.ConfigurationRecorderProps;
import software.amazon.awscdk.services.config.DeliveryChannelProps;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;
import software.constructs.Construct;

import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.Duration;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
class TapStackProps {
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

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project - Serverless Web Application.
 *
 * This stack creates a complete serverless infrastructure including:
 * - Lambda function for backend processing
 * - API Gateway for HTTP requests
 * - DynamoDB table with provisioned capacity
 * - VPC with private subnets
 * - CloudWatch monitoring and alarms
 * - Application Insights and Config for enhanced monitoring
 * - Proper IAM roles with least privilege
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    
    /**
     * Constructs a new TapStack with complete serverless infrastructure.
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

        // Common tags for all resources
        Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", this.environmentSuffix);
        commonTags.put("Project", "ServerlessWebApp");

        // Create VPC with public and private subnets
        Vpc vpc = new Vpc(this, "ServerlessVpc", VpcProps.builder()
                .maxAzs(2)
                .subnetConfiguration(List.of(
                    SubnetConfiguration.builder()
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build(),
                    SubnetConfiguration.builder()
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .cidrMask(24)
                        .build()
                ))
                .build());
        
        // Add tags to VPC
        commonTags.forEach((key, value) -> vpc.getNode().addTag(key, value));

        // Security group for Lambda
        SecurityGroup lambdaSecurityGroup = new SecurityGroup(this, "LambdaSecurityGroup", 
                SecurityGroupProps.builder()
                    .vpc(vpc)
                    .description("Security group for Lambda function")
                    .build());
        
        // Allow HTTPS outbound for Lambda to access DynamoDB and other AWS services
        lambdaSecurityGroup.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "HTTPS outbound for AWS services"
        );
        
        commonTags.forEach((key, value) -> lambdaSecurityGroup.getNode().addTag(key, value));

        // S3 bucket for AWS Config
        Bucket configBucket = new Bucket(this, "ConfigBucket", BucketProps.builder()
                .build());
        commonTags.forEach((key, value) -> configBucket.getNode().addTag(key, value));

        // DynamoDB table with provisioned capacity using TableV2 (latest feature)
        TableV2 dynamoTable = new TableV2(this, "ApplicationDataTable", TableV2Props.builder()
                .partitionKey(Attribute.builder()
                    .name("id")
                    .type(AttributeType.STRING)
                    .build())
                .billingMode(BillingMode.PROVISIONED)
                .readCapacity(ThroughputProps.builder()
                    .readCapacity(5)
                    .build())
                .writeCapacity(ThroughputProps.builder()
                    .writeCapacity(5)
                    .build())
                .build());
        
        commonTags.forEach((key, value) -> dynamoTable.getNode().addTag(key, value));

        // IAM role for Lambda with least privilege
        Role lambdaRole = new Role(this, "LambdaExecutionRole", software.amazon.awscdk.services.iam.RoleProps.builder()
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(List.of(
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")
                ))
                .build());

        // Add DynamoDB permissions to Lambda role
        lambdaRole.addToPolicy(PolicyStatement.builder()
                .effect(Effect.ALLOW)
                .actions(List.of(
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ))
                .resources(List.of(dynamoTable.getTableArn()))
                .build());

        commonTags.forEach((key, value) -> lambdaRole.getNode().addTag(key, value));

        // CloudWatch Log Group for Lambda
        LogGroup lambdaLogGroup = new LogGroup(this, "LambdaLogGroup", LogGroupProps.builder()
                .logGroupName("/aws/lambda/serverless-backend-" + this.environmentSuffix)
                .retention(RetentionDays.FOURTEEN)
                .build());
        
        commonTags.forEach((key, value) -> lambdaLogGroup.getNode().addTag(key, value));

        // Lambda function for backend processing
        Function backendFunction = new Function(this, "BackendFunction", FunctionProps.builder()
                .runtime(Runtime.JAVA_21)
                .handler("com.serverless.Handler::handleRequest")
                .code(Code.fromInline(
                    "package com.serverless;\n" +
                    "import com.amazonaws.services.lambda.runtime.Context;\n" +
                    "import com.amazonaws.services.lambda.runtime.RequestHandler;\n" +
                    "import java.util.Map;\n" +
                    "import java.util.HashMap;\n\n" +
                    "public class Handler implements RequestHandler<Map<String, Object>, Map<String, Object>> {\n" +
                    "    @Override\n" +
                    "    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {\n" +
                    "        Map<String, Object> response = new HashMap<>();\n" +
                    "        response.put(\"statusCode\", 200);\n" +
                    "        response.put(\"body\", \"{\\\"message\\\":\\\"Hello from serverless backend!\\\",\\\"environment\\\":\\\"" + this.environmentSuffix + "\\\"}\");\n" +
                    "        Map<String, String> headers = new HashMap<>();\n" +
                    "        headers.put(\"Content-Type\", \"application/json\");\n" +
                    "        response.put(\"headers\", headers);\n" +
                    "        return response;\n" +
                    "    }\n" +
                    "}"
                ))
                .memorySize(512)
                .timeout(Duration.ofSeconds(30))
                .role(lambdaRole)
                .logGroup(lambdaLogGroup)
                .vpc(vpc)
                .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .build())
                .securityGroups(List.of(lambdaSecurityGroup))
                .environment(Map.of(
                    "DYNAMODB_TABLE", dynamoTable.getTableName(),
                    "ENVIRONMENT", this.environmentSuffix
                ))
                .build());
        
        commonTags.forEach((key, value) -> backendFunction.getNode().addTag(key, value));

        // REST API Gateway
        RestApi api = new RestApi(this, "ServerlessApi", RestApiProps.builder()
                .restApiName("serverless-api-" + this.environmentSuffix)
                .description("Serverless API Gateway for web application")
                .build());
        
        commonTags.forEach((key, value) -> api.getNode().addTag(key, value));

        // API Gateway Lambda integration
        LambdaIntegration lambdaIntegration = new LambdaIntegration(backendFunction);
        api.getRoot().addMethod("GET", lambdaIntegration);
        api.getRoot().addResource("health").addMethod("GET", lambdaIntegration);

        // CloudWatch alarm for Lambda error rate > 1%
        Alarm lambdaErrorAlarm = new Alarm(this, "LambdaErrorAlarm", software.amazon.awscdk.services.cloudwatch.AlarmProps.builder()
                .metric(Metric.builder()
                    .namespace("AWS/Lambda")
                    .metricName("ErrorRate")
                    .dimensionsMap(Map.of("FunctionName", backendFunction.getFunctionName()))
                    .statistic("Average")
                    .period(Duration.ofMinutes(5))
                    .build())
                .threshold(1.0)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .alarmDescription("Lambda error rate exceeds 1%")
                .build());
        
        commonTags.forEach((key, value) -> lambdaErrorAlarm.getNode().addTag(key, value));

        // AWS Application Insights for enhanced monitoring (latest feature)
        CfnApplication appInsights = new CfnApplication(this, "AppInsights", software.amazon.awscdk.services.applicationinsights.CfnApplicationProps.builder()
                .resourceGroupName("ServerlessApp-" + this.environmentSuffix)
                .autoConfigurationEnabled(true)
                .cweMonitorEnabled(true)
                .opsCenterEnabled(true)
                .build());
        
        commonTags.forEach((key, value) -> appInsights.addTag(key, value));

        // AWS Config for compliance monitoring (latest feature)
        Role configRole = new Role(this, "ConfigRole", software.amazon.awscdk.services.iam.RoleProps.builder()
                .assumedBy(new ServicePrincipal("config.amazonaws.com"))
                .managedPolicies(List.of(
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/ConfigRole")
                ))
                .build());

        ConfigurationRecorder configRecorder = new ConfigurationRecorder(this, "ConfigRecorder", 
                ConfigurationRecorderProps.builder()
                    .role(configRole)
                    .recordingMode(software.amazon.awscdk.services.config.RecordingMode.builder()
                        .recordingFrequency(software.amazon.awscdk.services.config.RecordingFrequency.CONTINUOUS)
                        .recordingModeOverrides(List.of())
                        .build())
                    .build());

        DeliveryChannel configDelivery = new DeliveryChannel(this, "ConfigDelivery",
                DeliveryChannelProps.builder()
                    .bucket(configBucket)
                    .build());

        commonTags.forEach((key, value) -> configRole.getNode().addTag(key, value));

        // Stack outputs for integration testing
        CfnOutput.Builder.create(this, "ApiGatewayUrl")
                .description("API Gateway URL")
                .value(api.getUrl())
                .build();

        CfnOutput.Builder.create(this, "DynamoDBTableName")
                .description("DynamoDB Table Name")
                .value(dynamoTable.getTableName())
                .build();

        CfnOutput.Builder.create(this, "LambdaFunctionArn")
                .description("Lambda Function ARN")
                .value(backendFunction.getFunctionArn())
                .build();

        CfnOutput.Builder.create(this, "VpcId")
                .description("VPC ID")
                .value(vpc.getVpcId())
                .build();
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
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

## Lambda Function Code (Optional Enhancement)

If you want a more sophisticated Lambda handler, create this as a separate file:

```java
package com.serverless;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private final DynamoDbClient dynamoDbClient;
    private final String tableName;
    private final ObjectMapper objectMapper;
    
    public Handler() {
        this.dynamoDbClient = DynamoDbClient.create();
        this.tableName = System.getenv("DYNAMODB_TABLE");
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            // Log the incoming request
            context.getLogger().log("Processing request: " + event.getPath());
            
            // Create a new item in DynamoDB
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("id", AttributeValue.builder().s(UUID.randomUUID().toString()).build());
            item.put("timestamp", AttributeValue.builder().s(Instant.now().toString()).build());
            item.put("path", AttributeValue.builder().s(event.getPath()).build());
            item.put("method", AttributeValue.builder().s(event.getHttpMethod()).build());
            
            PutItemRequest putItemRequest = PutItemRequest.builder()
                    .tableName(tableName)
                    .item(item)
                    .build();
            
            dynamoDbClient.putItem(putItemRequest);
            
            // Create response
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("message", "Hello from serverless backend!");
            responseBody.put("environment", System.getenv("ENVIRONMENT"));
            responseBody.put("timestamp", Instant.now().toString());
            responseBody.put("requestId", context.getAwsRequestId());
            
            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/json");
            headers.put("Access-Control-Allow-Origin", "*");
            
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withHeaders(headers)
                    .withBody(objectMapper.writeValueAsString(responseBody));
                    
        } catch (Exception e) {
            context.getLogger().log("Error processing request: " + e.getMessage());
            
            Map<String, String> errorHeaders = new HashMap<>();
            errorHeaders.put("Content-Type", "application/json");
            
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(500)
                    .withHeaders(errorHeaders)
                    .withBody("{\"error\":\"Internal server error\"}");
        }
    }
}
```

## Key Features Implemented:

1. **Latest CDK Features**: Uses DynamoDB TableV2 construct and Application Insights
2. **Complete VPC Setup**: Public and private subnets across multiple AZs
3. **Lambda in Private Subnets**: Secure deployment with VPC configuration
4. **Proper IAM Roles**: Least privilege access with specific DynamoDB permissions
5. **CloudWatch Monitoring**: Error rate alarms and log groups
6. **AWS Config**: Compliance monitoring and drift detection
7. **Environment-Specific**: Supports multiple environments via suffix
8. **Stack Outputs**: All required outputs for integration testing
9. **Resource Tagging**: Consistent tagging strategy
10. **Security Groups**: Proper network security configuration

The solution follows AWS best practices and includes the latest CDK v2 features for a production-ready serverless web application infrastructure.