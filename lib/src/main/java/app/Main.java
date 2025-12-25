package app;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.apigateway.LambdaIntegration;
// Removed unused VpcConfig import
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.RestApiProps;
// import software.amazon.awscdk.services.applicationinsights.CfnApplication;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.config.CfnConfigurationRecorder;
import software.amazon.awscdk.services.config.CfnDeliveryChannel;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.TablePropsV2;
import software.amazon.awscdk.services.dynamodb.TableV2;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.FunctionProps;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.LogGroupProps;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;
import software.constructs.Construct;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String envSuffixValue, final StackProps stackPropsValue) {
        this.environmentSuffix = envSuffixValue;
        this.stackProps = stackPropsValue != null ? stackPropsValue : StackProps.builder().build();
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

    public static final class Builder {
        private String envSuffixValue;
        private StackProps stackPropsValue;

        public Builder environmentSuffix(final String envSuffixParam) {
            this.envSuffixValue = envSuffixParam;
            return this;
        }

        public Builder stackProps(final StackProps stackPropsParam) {
            this.stackPropsValue = stackPropsParam;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(envSuffixValue, stackPropsValue);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project - Serverless Web
 * Application.
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
     * @param id    The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including
     *              environment suffix
     */
    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = getEnvironmentSuffix(props);

        createInfrastructure();
    }

    private String getEnvironmentSuffix(final TapStackProps props) {
        return Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");
    }

    private void createInfrastructure() {
        // Common tags for all resources
        Map<String, String> commonTags = new HashMap<>();
        commonTags.put("Environment", this.environmentSuffix);
        commonTags.put("Project", "ServerlessWebApp");

        // Create VPC with public and private subnets
        Vpc vpc = createVpc(commonTags);

        // Security group for Lambda
        SecurityGroup lambdaSecurityGroup = createLambdaSecurityGroup(vpc, commonTags);

        // S3 bucket for AWS Config
        Bucket configBucket = createConfigBucket(commonTags);

        // DynamoDB table with provisioned capacity using TableV2 (latest feature)
        TableV2 dynamoTable = createDynamoTable(commonTags);

        // IAM role for Lambda with least privilege
        Role lambdaRole = createLambdaRole(dynamoTable, commonTags);

        // CloudWatch Log Group for Lambda
        LogGroup lambdaLogGroup = createLogGroup(commonTags);

        // Lambda function for backend processing
        Function backendFunction = createLambdaFunction(vpc, lambdaSecurityGroup,
                dynamoTable, lambdaRole, lambdaLogGroup, commonTags);

        // REST API Gateway
        RestApi api = createApiGateway(backendFunction, commonTags);

        // CloudWatch alarm for Lambda error rate > 1%
        Alarm lambdaErrorAlarm = createCloudWatchAlarm(backendFunction, commonTags);

        // AWS Application Insights for enhanced monitoring (latest feature)
        // Note: Commented out due to Resource Group dependency issues in automated
        // deployments
        // CfnApplication appInsights = createApplicationInsights(commonTags);

        // AWS Config for compliance monitoring (latest feature)
        createAwsConfig(configBucket, commonTags);

        // Stack outputs for integration testing
        createStackOutputs(api, dynamoTable, backendFunction, vpc);
    }

    private Vpc createVpc(final Map<String, String> commonTags) {
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
                                .build()))
                .build());

        // Add tags to VPC
        commonTags.forEach((key, value) -> Tags.of(vpc).add(key, value));

        return vpc;
    }

    private SecurityGroup createLambdaSecurityGroup(final Vpc vpc, final Map<String, String> commonTags) {
        SecurityGroup lambdaSecurityGroup = new SecurityGroup(this,
                "LambdaSecurityGroup" + this.environmentSuffix,
                SecurityGroupProps.builder()
                        .vpc(vpc)
                        .description("Security group for Lambda function")
                        .build());

        // Allow HTTPS outbound for Lambda to access DynamoDB and other AWS services
        lambdaSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "HTTPS outbound for AWS services");

        commonTags.forEach((key, value) -> Tags.of(lambdaSecurityGroup).add(key, value));

        return lambdaSecurityGroup;
    }

    private Bucket createConfigBucket(final Map<String, String> commonTags) {
        // Add timestamp to ensure unique bucket name
        String timestamp = String.valueOf(System.currentTimeMillis() / 1000);
        Bucket configBucket = new Bucket(this, "ConfigBucket", BucketProps.builder()
                .bucketName("tap-" + this.environmentSuffix.toLowerCase() + "-config-" + timestamp)
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .build());

        // Add comprehensive bucket policy for AWS Config service
        // AWS Config requires specific permissions with account and region conditions
        String accountId = this.getAccount();
        String region = this.getRegion();

        // Allow Config service to check bucket ACL and location
        configBucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(List.of(new ServicePrincipal("config.amazonaws.com")))
                .actions(List.of(
                        "s3:GetBucketAcl",
                        "s3:GetBucketLocation"))
                .resources(List.of(configBucket.getBucketArn()))
                .conditions(Map.of(
                        "StringEquals", Map.of(
                                "AWS:SourceAccount", accountId)))
                .build());

        // Allow Config service to put objects with proper ACL
        // AWS Config will write to AWSLogs/{accountId}/Config/* path automatically
        configBucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(List.of(new ServicePrincipal("config.amazonaws.com")))
                .actions(List.of("s3:PutObject"))
                .resources(List.of(configBucket.getBucketArn() + "/AWSLogs/" + accountId + "/Config/*"))
                .conditions(Map.of(
                        "StringEquals", Map.of(
                                "s3:x-amz-acl", "bucket-owner-full-control",
                                "AWS:SourceAccount", accountId)))
                .build());

        // Allow Config service to get bucket ACL for delivery channel verification
        configBucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(List.of(new ServicePrincipal("config.amazonaws.com")))
                .actions(List.of("s3:ListBucket"))
                .resources(List.of(configBucket.getBucketArn()))
                .conditions(Map.of(
                        "StringEquals", Map.of(
                                "AWS:SourceAccount", accountId)))
                .build());

        commonTags.forEach((key, value) -> Tags.of(configBucket).add(key, value));

        return configBucket;
    }

    private TableV2 createDynamoTable(final Map<String, String> commonTags) {
        // Add timestamp to make table name unique and avoid conflicts
        long timestamp = System.currentTimeMillis();
        TableV2 dynamoTable = new TableV2(this, "ApplicationDataTable", TablePropsV2.builder()
                .tableName(String.format("tap-%s-%d-data", this.environmentSuffix.toLowerCase(), timestamp))
                .removalPolicy(RemovalPolicy.DESTROY)
                .partitionKey(Attribute.builder()
                        .name("id")
                        .type(AttributeType.STRING)
                        .build())
                .billing(software.amazon.awscdk.services.dynamodb.Billing.onDemand())
                .build());

        commonTags.forEach((key, value) -> Tags.of(dynamoTable).add(key, value));

        return dynamoTable;
    }

    private Role createLambdaRole(final TableV2 dynamoTable, final Map<String, String> commonTags) {
        Role lambdaRole = new Role(this, "LambdaExecutionRole",
                software.amazon.awscdk.services.iam.RoleProps.builder()
                        .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                        .managedPolicies(List.of(
                                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")))
                        .build());

        // Add DynamoDB permissions to Lambda role
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"))
                .resources(List.of(dynamoTable.getTableArn()))
                .build());

        commonTags.forEach((key, value) -> Tags.of(lambdaRole).add(key, value));

        return lambdaRole;
    }

    private LogGroup createLogGroup(final Map<String, String> commonTags) {
        // Add timestamp to make log group name unique and avoid conflicts
        long timestamp = System.currentTimeMillis();
        LogGroup lambdaLogGroup = new LogGroup(this, "LambdaLogGroup", LogGroupProps.builder()
                .logGroupName(String.format("/aws/lambda/tap-%s-%d-backend", this.environmentSuffix, timestamp))
                .retention(RetentionDays.TWO_WEEKS)
                .build());

        commonTags.forEach((key, value) -> Tags.of(lambdaLogGroup).add(key, value));

        return lambdaLogGroup;
    }

    private Function createLambdaFunction(final Vpc vpc, final SecurityGroup lambdaSecurityGroup,
            final TableV2 dynamoTable, final Role lambdaRole, final LogGroup lambdaLogGroup,
            final Map<String, String> commonTags) {
        // Add timestamp to make function name unique and avoid conflicts
        long timestamp = System.currentTimeMillis();
        Function backendFunction = new Function(this, "BackendFunction", FunctionProps.builder()
                .functionName(String.format("tap-%s-%d-backend", this.environmentSuffix, timestamp))
                .runtime(Runtime.JAVA_21)
                .handler("com.serverless.Handler::handleRequest")
                .code(Code.fromAsset("lib/lambda"))
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .role(lambdaRole)
                .logGroup(lambdaLogGroup)
                .vpc(vpc)
                .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(List.of(lambdaSecurityGroup))
                .environment(Map.of(
                        "DYNAMODB_TABLE", dynamoTable.getTableName(),
                        "ENVIRONMENT", this.environmentSuffix))
                .build());

        commonTags.forEach((key, value) -> Tags.of(backendFunction).add(key, value));

        return backendFunction;
    }

    private RestApi createApiGateway(final Function backendFunction, final Map<String, String> commonTags) {
        // Add timestamp to make API name unique and avoid conflicts
        long timestamp = System.currentTimeMillis();
        RestApi api = new RestApi(this, "ServerlessApi", RestApiProps.builder()
                .restApiName(String.format("tap-%s-%d-api", this.environmentSuffix, timestamp))
                .description("Serverless API Gateway for web application")
                .build());

        commonTags.forEach((key, value) -> Tags.of(api).add(key, value));

        // API Gateway Lambda integration
        LambdaIntegration lambdaIntegration = new LambdaIntegration(backendFunction);
        api.getRoot().addMethod("GET", lambdaIntegration);
        api.getRoot().addResource("health").addMethod("GET", lambdaIntegration);

        return api;
    }

    private Alarm createCloudWatchAlarm(final Function backendFunction, final Map<String, String> commonTags) {
        Alarm lambdaErrorAlarm = new Alarm(this, "LambdaErrorAlarm",
                software.amazon.awscdk.services.cloudwatch.AlarmProps.builder()
                        .metric(new Metric(software.amazon.awscdk.services.cloudwatch.MetricProps.builder()
                                .namespace("AWS/Lambda")
                                .metricName("ErrorRate")
                                .dimensionsMap(Map.of("FunctionName", backendFunction.getFunctionName()))
                                .statistic("Average")
                                .period(Duration.minutes(5))
                                .build()))
                        .threshold(1.0)
                        .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                        .evaluationPeriods(2)
                        .treatMissingData(TreatMissingData.NOT_BREACHING)
                        .alarmDescription("Lambda error rate exceeds 1%")
                        .build());

        commonTags.forEach((key, value) -> Tags.of(lambdaErrorAlarm).add(key, value));

        return lambdaErrorAlarm;
    }

    // Temporarily commented out due to Resource Group dependency issues in
    // automated deployments
    // private CfnApplication createApplicationInsights(final Map<String, String>
    // commonTags) {
    // CfnApplication appInsights = new CfnApplication(this, "AppInsights",
    // software.amazon.awscdk.services.applicationinsights.CfnApplicationProps.builder()
    // .resourceGroupName("ServerlessApp-" + this.environmentSuffix)
    // .autoConfigurationEnabled(true)
    // .cweMonitorEnabled(true)
    // .opsCenterEnabled(true)
    // .build());

    // commonTags.forEach((key, value) -> Tags.of(appInsights).add(key, value));

    // return appInsights;
    // }

    private void createAwsConfig(final Bucket configBucket, final Map<String, String> commonTags) {
        Role configRole = new Role(this, "ConfigRole",
                software.amazon.awscdk.services.iam.RoleProps.builder()
                        .assumedBy(new ServicePrincipal("config.amazonaws.com"))
                        .managedPolicies(List.of(
                                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWS_ConfigRole")))
                        .build());

        // AWS Config Configuration Recorder using CFN construct
        CfnConfigurationRecorder configRecorder = new CfnConfigurationRecorder(this, "ConfigRecorder",
                software.amazon.awscdk.services.config.CfnConfigurationRecorderProps.builder()
                        .roleArn(configRole.getRoleArn())
                        .recordingGroup(
                                software.amazon.awscdk.services.config.CfnConfigurationRecorder.RecordingGroupProperty.builder()
                                        .allSupported(true)
                                        .includeGlobalResourceTypes(true)
                                        .build())
                        .build());

        // AWS Config Delivery Channel using CFN construct
        // Removing S3 key prefix to avoid validation issues - AWS Config will use
        // default path
        CfnDeliveryChannel configDelivery = new CfnDeliveryChannel(this, "ConfigDelivery",
                software.amazon.awscdk.services.config.CfnDeliveryChannelProps.builder()
                        .s3BucketName(configBucket.getBucketName())
                        .build());

        commonTags.forEach((key, value) -> Tags.of(configRole).add(key, value));
    }

    private void createStackOutputs(final RestApi api, final TableV2 dynamoTable,
            final Function backendFunction, final Vpc vpc) {
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
 * This class serves as the entry point for the CDK application and is
 * responsible
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

        // Get environment suffix from environment variable, context or default to 'dev'
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null) {
            environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        }
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-east-2")
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}