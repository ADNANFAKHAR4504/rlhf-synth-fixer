**app.config.Config**
```java
package app.config;

public class Config {
    public static final String REGION = "us-east-1";
    public static final String PREFIX = "SrvlessDemo-";
    public static final String ENVIRONMENT = "production";
    public static final String OWNER = "DevOpsTeam";
    public static final String LAMBDA_RUNTIME = "nodejs20.x";
    public static final int LAMBDA_TIMEOUT = 10;
    public static final String LAMBDA_HANDLER = "handler.main";

    public String generateResourceName(final String name) {
        return PREFIX.concat(name);
    }
}
```

**app.Main**
```java
package app;

import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.S3Backend;
import com.hashicorp.cdktf.S3BackendConfig;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {

        final App app = new App();

        MainStack stack = new MainStack(app, "serverless-demo-stack");

        /*
         * Configures S3 backend for remote Terraform state storage.
         */
        new S3Backend(stack, S3BackendConfig.builder()
                .bucket(System.getenv("TERRAFORM_STATE_BUCKET"))
                .key("prs/" + System.getenv("ENVIRONMENT_SUFFIX") + "/" + stack.getStackId() + ".tfstate")
                .region(System.getenv("TERRAFORM_STATE_BUCKET_REGION"))
                .encrypt(true)
                .build());

        app.synth();
    }
}
```

**app.MainStack**
```java
package app;

import app.config.Config;
import app.constructs.S3Construct;
import app.constructs.IamConstruct;
import app.constructs.LambdaConstruct;
import app.constructs.DynamoDBConstruct;
import app.constructs.ApiGatewayConstruct;
import app.constructs.MonitoringConstruct;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 * 
 * This stack creates a simple S3 bucket with proper tagging for
 * cost tracking and resource management.
 */
public class MainStack extends TerraformStack {

    /**
     * Creates a new MainStack with basic AWS resources.
     * 
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;
    private S3Construct s3;
    private DynamoDBConstruct dynamodb;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder().region(Config.REGION).build());

        // Create resources and Lambda
        LambdaConstruct lambda = createLambdaWithDependencies();

        // Create API Gateway
        ApiGatewayConstruct apiGateway = new ApiGatewayConstruct(this, "api", lambda.getFunctionArn(),
                lambda.getFunctionInvokeArn());

        // Setup monitoring and alerting
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring", lambda.getFunctionName(),
                lambda.getLogGroupName(), apiGateway.getApiName());

        // Stack Outputs
        new TerraformOutput(this, "lambdaFunctionArn", TerraformOutputConfig.builder()
                .value(lambda.getFunctionArn())
                .description("ARN of the Lambda function")
                .build());

        new TerraformOutput(this, "lambdaFunctionName", TerraformOutputConfig.builder()
                .value(lambda.getFunctionName())
                .description("Name of the Lambda function")
                .build());

        new TerraformOutput(this, "apiGatewayUrl", TerraformOutputConfig.builder()
                .value("https://" + apiGateway.getApiId() + ".execute-api." + Config.REGION + ".amazonaws.com/prod")
                .description("API Gateway endpoint URL")
                .build());

        new TerraformOutput(this, "dynamoDbTableName", TerraformOutputConfig.builder()
                .value(dynamodb.getTableName())
                .description("DynamoDB table name")
                .build());

        new TerraformOutput(this, "dynamoDbTableArn", TerraformOutputConfig.builder()
                .value(dynamodb.getTableArn())
                .description("DynamoDB table ARN")
                .build());

        new TerraformOutput(this, "s3BucketName", TerraformOutputConfig.builder()
                .value(s3.getBucketName())
                .description("S3 bucket name")
                .build());

        new TerraformOutput(this, "s3BucketArn", TerraformOutputConfig.builder()
                .value(s3.getBucketArn())
                .description("S3 bucket ARN")
                .build());

        new TerraformOutput(this, "apiGatewayId", TerraformOutputConfig.builder()
                .value(apiGateway.getApiId())
                .description("API Gateway ID")
                .build());

        new TerraformOutput(this, "apiGatewayName", TerraformOutputConfig.builder()
                .value(apiGateway.getApiName())
                .description("API Gateway name")
                .build());

        new TerraformOutput(this, "lambdaLogGroupName", TerraformOutputConfig.builder()
                .value(lambda.getLogGroupName())
                .description("Lambda CloudWatch Log Group name")
                .build());

        new TerraformOutput(this, "stackId", TerraformOutputConfig.builder()
                .value(this.stackId)
                .description("Stack ID")
                .build());

    }

    private LambdaConstruct createLambdaWithDependencies() {

        s3 = new S3Construct(this, "s3");

        // Create DynamoDB table
        dynamodb = new DynamoDBConstruct(this, "dynamodb");

        // Create IAM roles and policies
        IamConstruct iam = new IamConstruct(this, "iam", dynamodb.getTableArn(), s3.getBucketArn());

        // Create Lambda functions
        return new LambdaConstruct(this, "lambda", iam.getLambdaExecutionRoleArn(), s3.getBucketName(),
                dynamodb.getTableName());
    }

    public String getStackId() {
        return stackId;
    }
}
```

**app.constructs.ApiGatewayConstruct**
```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.api_gateway_account.ApiGatewayAccount;
import com.hashicorp.cdktf.providers.aws.api_gateway_account.ApiGatewayAccountConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_deployment.ApiGatewayDeployment;
import com.hashicorp.cdktf.providers.aws.api_gateway_deployment.ApiGatewayDeploymentConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_integration.ApiGatewayIntegration;
import com.hashicorp.cdktf.providers.aws.api_gateway_integration.ApiGatewayIntegrationConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_method.ApiGatewayMethod;
import com.hashicorp.cdktf.providers.aws.api_gateway_method.ApiGatewayMethodConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_method_settings.ApiGatewayMethodSettings;
import com.hashicorp.cdktf.providers.aws.api_gateway_method_settings.ApiGatewayMethodSettingsConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_method_settings.ApiGatewayMethodSettingsSettings;
import com.hashicorp.cdktf.providers.aws.api_gateway_resource.ApiGatewayResource;
import com.hashicorp.cdktf.providers.aws.api_gateway_resource.ApiGatewayResourceConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApi;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApiConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration;
import com.hashicorp.cdktf.providers.aws.api_gateway_stage.ApiGatewayStage;
import com.hashicorp.cdktf.providers.aws.api_gateway_stage.ApiGatewayStageConfig;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachmentConfig;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermission;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermissionConfig;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;

public class ApiGatewayConstruct extends BaseConstruct {
    private final ApiGatewayRestApi api;

    public ApiGatewayConstruct(final Construct scope, final String id, final String lambdaArn, final String lambdaInvokeArn) {
        super(scope, id);

        // Create CloudWatch Logs role for API Gateway
        IamRole apiGatewayCloudWatchRole = new IamRole(this, "api-cloudwatch-role", IamRoleConfig.builder()
                .name(resourceName("APIGatewayCloudWatchLogsRole"))
                .assumeRolePolicy("""
                        {
                          "Version": "2012-10-17",
                          "Statement": [
                            {
                              "Effect": "Allow",
                              "Principal": {
                                "Service": "apigateway.amazonaws.com"
                              },
                              "Action": "sts:AssumeRole"
                            }
                          ]
                        }
                        """)
                .tags(getTagsWithName("APICloudWatchRole"))
                .build());

        // Attach CloudWatch Logs policy to API Gateway role
        new IamRolePolicyAttachment(this, "api-cloudwatch-policy", IamRolePolicyAttachmentConfig.builder()
                .role(apiGatewayCloudWatchRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs")
                .build());

        // Configure API Gateway account settings for CloudWatch Logs
        ApiGatewayAccount apiGatewayAccount = new ApiGatewayAccount(this, "api-account", ApiGatewayAccountConfig.builder()
                .cloudwatchRoleArn(apiGatewayCloudWatchRole.getArn())
                .build());

        // Create REST API
        this.api = new ApiGatewayRestApi(this, "rest-api", ApiGatewayRestApiConfig.builder()
                .name(resourceName("API"))
                .description("Serverless Demo API Gateway")
                .endpointConfiguration(ApiGatewayRestApiEndpointConfiguration.builder()
                        .types(List.of("REGIONAL"))
                        .build())
                .tags(getTagsWithName("API"))
                .build());

        // Create resource
        ApiGatewayResource resource = new ApiGatewayResource(this, "api-resource",
                ApiGatewayResourceConfig.builder()
                        .restApiId(api.getId())
                        .parentId(api.getRootResourceId())
                        .pathPart("items")
                        .build());

        // Create GET method
        ApiGatewayMethod getMethod = new ApiGatewayMethod(this, "get-method",
                ApiGatewayMethodConfig.builder()
                        .restApiId(api.getId())
                        .resourceId(resource.getId())
                        .httpMethod("GET")
                        .authorization("NONE")
                        .build());

        // Create POST method
        ApiGatewayMethod postMethod = new ApiGatewayMethod(this, "post-method",
                ApiGatewayMethodConfig.builder()
                        .restApiId(api.getId())
                        .resourceId(resource.getId())
                        .httpMethod("POST")
                        .authorization("NONE")
                        .build());

        // Create Lambda integrations
        ApiGatewayIntegration getIntegration = new ApiGatewayIntegration(this, "get-integration", ApiGatewayIntegrationConfig.builder()
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod(getMethod.getHttpMethod())
                .integrationHttpMethod("POST")
                .type("AWS_PROXY")
                .uri(lambdaInvokeArn)
                .build());

        ApiGatewayIntegration postIntegration = new ApiGatewayIntegration(this, "post-integration", ApiGatewayIntegrationConfig.builder()
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod(postMethod.getHttpMethod())
                .integrationHttpMethod("POST")
                .type("AWS_PROXY")
                .uri(lambdaInvokeArn)
                .build());

        // Create deployment
        ApiGatewayDeployment deployment = new ApiGatewayDeployment(this, "api-deployment",
                ApiGatewayDeploymentConfig.builder()
                        .restApiId(api.getId())
                        .dependsOn(Arrays.asList(getMethod, postMethod, getIntegration, postIntegration))
                        .build());

        // Create stage with logging
        ApiGatewayStage stage = new ApiGatewayStage(this, "api-stage", ApiGatewayStageConfig.builder()
                .deploymentId(deployment.getId())
                .restApiId(api.getId())
                .stageName("prod")
                .xrayTracingEnabled(true)
                .tags(getTagsWithName("APIStage"))
                .build());

        // Configure method settings for logging (depends on account configuration)
        new ApiGatewayMethodSettings(this, "method-settings", ApiGatewayMethodSettingsConfig.builder()
                .restApiId(api.getId())
                .stageName(stage.getStageName())
                .methodPath("*/*")
                .settings(ApiGatewayMethodSettingsSettings.builder()
                        .loggingLevel("INFO")
                        .dataTraceEnabled(true)
                        .metricsEnabled(true)
                        .build())
                .dependsOn(List.of(apiGatewayAccount))
                .build());

        // Grant API Gateway permission to invoke Lambda
        new LambdaPermission(this, "api-lambda-permission", LambdaPermissionConfig.builder()
                .statementId("AllowAPIGatewayInvoke")
                .action("lambda:InvokeFunction")
                .functionName(lambdaArn)
                .principal("apigateway.amazonaws.com")
                .sourceArn(api.getExecutionArn() + "/*/*")
                .build());
    }

    public String getApiName() {
        return api.getName();
    }

    public String getApiId() {
        return api.getId();
    }
}
```

**app.constructs.BaseConstruct**
```java
package app.constructs;

import software.constructs.Construct;
import app.config.Config;

import java.util.HashMap;
import java.util.Map;

public abstract class BaseConstruct extends Construct {

    private final Config config;

    protected BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.config = new Config();
    }

    public static Map<String, String> getDefaultTags() {
        Map<String, String> tags = new HashMap<>();
        tags.put("Name", Config.PREFIX + "Resource");
        tags.put("Environment", Config.ENVIRONMENT);
        tags.put("Owner", Config.OWNER);
        tags.put("Project", "ServerlessDemo");
        tags.put("ManagedBy", "cdktf");
        return tags;
    }

    public static Map<String, String> getTagsWithName(final String resourceName) {
        Map<String, String> tags = getDefaultTags();
        tags.put("Name", Config.PREFIX + resourceName);
        return tags;
    }

    protected String getRegion() {
        return Config.REGION;
    }

    protected String getPrefix() {
        return Config.PREFIX;
    }

    protected String getEnvironment() {
        return Config.ENVIRONMENT;
    }

    protected String getOwner() {
        return Config.OWNER;
    }

    protected String getLambdaRuntime() {
        return Config.LAMBDA_RUNTIME;
    }

    protected int getLambdaTimeout() {
        return Config.LAMBDA_TIMEOUT;
    }

    protected String getLambdaHandler() {
        return Config.LAMBDA_HANDLER;
    }

    protected String resourceName(final String name) {
        return getConfig().generateResourceName(name);
    }

    protected Config getConfig() {
        return config;
    }
}
```

**app.constructs.DynamoDBConstruct**
```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTable;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableAttribute;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableConfig;
import software.constructs.Construct;

import java.util.List;

public class DynamoDBConstruct extends BaseConstruct {
    private final DynamodbTable table;

    public DynamoDBConstruct(final Construct scope, final String id) {
        super(scope, id);

        // Create DynamoDB table with pay-per-request billing
        this.table = new DynamodbTable(this, "app-table", DynamodbTableConfig.builder()
                .name(resourceName("AppTable"))
                .billingMode("PAY_PER_REQUEST")
                .hashKey("id")
                .attribute(List.of(DynamodbTableAttribute.builder()
                        .name("id")
                        .type("S")
                        .build())
                )
                .tags(getTagsWithName("AppTable"))
                .build());
    }

    public String getTableArn() {
        return table.getArn();
    }

    public String getTableName() {
        return table.getName();
    }
}
```

**app.constructs.IamConstruct**
```java
package app.constructs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicyConfig;
import software.constructs.Construct;

public class IamConstruct extends BaseConstruct {
    private final IamRole lambdaExecutionRole;
    private final ObjectMapper mapper = new ObjectMapper();

    public IamConstruct(final Construct scope, final String id, final String dynamoTableArn, final String s3BucketArn) {
        super(scope, id);

        // Create Lambda execution role
        this.lambdaExecutionRole = new IamRole(this, "lambda-execution-role", IamRoleConfig.builder()
                .name(resourceName("LambdaExecutionRole"))
                .assumeRolePolicy(createAssumeRolePolicy())
                .tags(getTagsWithName("LambdaExecutionRole"))
                .build());

        // Attach CloudWatch Logs policy
        new IamRolePolicy(this, "lambda-logs-policy", IamRolePolicyConfig.builder()
                .name("LambdaLogsPolicy")
                .role(lambdaExecutionRole.getId())
                .policy(createLogsPolicy())
                .build());

        // Attach DynamoDB policy
        new IamRolePolicy(this, "lambda-dynamodb-policy", IamRolePolicyConfig.builder()
                .name(resourceName("LambdaDynamoDBPolicy"))
                .role(lambdaExecutionRole.getId())
                .policy(createDynamoDBPolicy(dynamoTableArn))
                .build());

        // Attach S3 read policy for deployment packages
        new IamRolePolicy(this, "lambda-s3-policy", IamRolePolicyConfig.builder()
                .name(resourceName("LambdaS3Policy"))
                .role(lambdaExecutionRole.getId())
                .policy(createS3Policy(s3BucketArn))
                .build());
    }

    private String createAssumeRolePolicy() {

        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");
        statement.put("Action", "sts:AssumeRole");

        ObjectNode principal = mapper.createObjectNode();
        principal.put("Service", "lambda.amazonaws.com");
        statement.set("Principal", principal);

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    private String createLogsPolicy() {
        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");

        ArrayNode actions = mapper.createArrayNode();
        actions.add("logs:CreateLogGroup");
        actions.add("logs:CreateLogStream");
        actions.add("logs:PutLogEvents");
        statement.set("Action", actions);

        statement.put("Resource", "arn:aws:logs:" + getRegion()
                + ":*:log-group:/aws/lambda/" + getPrefix() + "*");

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    private String createDynamoDBPolicy(final String tableArn) {
        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");

        ArrayNode actions = mapper.createArrayNode();
        actions.add("dynamodb:GetItem");
        actions.add("dynamodb:PutItem");
        actions.add("dynamodb:UpdateItem");
        actions.add("dynamodb:DeleteItem");
        actions.add("dynamodb:Query");
        actions.add("dynamodb:Scan");
        statement.set("Action", actions);

        ArrayNode resources = mapper.createArrayNode();
        resources.add(tableArn);
        resources.add(tableArn + "/index/*");
        statement.set("Resource", resources);

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    private String createS3Policy(final String bucketArn) {
        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");

        ArrayNode actions = mapper.createArrayNode();
        actions.add("s3:GetObject");
        actions.add("s3:GetObjectVersion");
        statement.set("Action", actions);

        statement.put("Resource", bucketArn + "/*");

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    public String getLambdaExecutionRoleArn() {
        return lambdaExecutionRole.getArn();
    }
}
```

**app.constructs.LambdaConstruct**
```java
package app.constructs;

import com.hashicorp.cdktf.AssetType;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.TerraformAssetConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunction;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionEnvironment;
import com.hashicorp.cdktf.providers.aws.s3_object.S3Object;
import com.hashicorp.cdktf.providers.aws.s3_object.S3ObjectConfig;
import software.constructs.Construct;

import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LambdaConstruct extends BaseConstruct {
    private final LambdaFunction function;
    private final CloudwatchLogGroup logGroup;

    public LambdaConstruct(final Construct scope, final String id, final String roleArn, final String s3Bucket,
                           final String dynamoTableName) {
        super(scope, id);

        String functionName = resourceName("ApiHandler");

        // Create CloudWatch Log Group
        this.logGroup = new CloudwatchLogGroup(this, "lambda-logs", CloudwatchLogGroupConfig.builder()
                .name("/aws/lambda/" + functionName)
                .retentionInDays(7)
                .tags(getTagsWithName("LambdaLogGroup"))
                .build());

        // Environment variables for Lambda
        Map<String, String> envVars = new HashMap<>();
        envVars.put("DYNAMODB_TABLE", dynamoTableName);
        envVars.put("REGION", getRegion());

        // Package Lambda function
        TerraformAsset lambdaAsset = new TerraformAsset(this, "lambda-code", TerraformAssetConfig.builder()
                .path(Paths.get("").toAbsolutePath().resolve("lib/src/main/java/app/lambda").toString())
                .type(AssetType.ARCHIVE)
                .build());

        // Upload Lambda deployment package to S3
        S3Object lambdaS3Object = new S3Object(this, "lambda-deployment-package", S3ObjectConfig.builder()
                .bucket(s3Bucket)
                .key("lambda-deployments/" + functionName + System.currentTimeMillis() + ".zip")
                .source(lambdaAsset.getPath())
                .sourceHash(lambdaAsset.getAssetHash())
                .tags(getTagsWithName("LambdaDeploymentPackage"))
                .build());

        // Create Lambda function using S3 deployment package
        this.function = new LambdaFunction(this, "api-handler", LambdaFunctionConfig.builder()
                .functionName(functionName)
                .runtime(getLambdaRuntime())
                .handler(getLambdaHandler())
                .s3Bucket(s3Bucket)
                .s3Key(lambdaS3Object.getKey())
                .s3ObjectVersion(lambdaS3Object.getVersionId())
                .role(roleArn)
                .timeout(getLambdaTimeout())
                .memorySize(256)
                .environment(LambdaFunctionEnvironment.builder()
                        .variables(envVars)
                        .build())
                .tags(getTagsWithName("ApiHandler"))
                .dependsOn(List.of(logGroup, lambdaS3Object))
                .build());
    }

    public String getFunctionArn() {
        return function.getArn();
    }

    public String getFunctionInvokeArn() {
        return function.getInvokeArn();
    }

    public String getFunctionName() {
        return function.getFunctionName();
    }

    public String getLogGroupName() {
        return logGroup.getName();
    }
}
```

**app.constructs.MonitoringConstruct**
```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilter;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilterConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilterMetricTransformation;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopicConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscriptionConfig;
import software.constructs.Construct;

import java.util.List;

public class MonitoringConstruct extends BaseConstruct {

    public MonitoringConstruct(final Construct scope, final String id, final String functionName, final String logGroupName,
                               final String apiName) {
        super(scope, id);

        // Create SNS topic for error notifications
        SnsTopic errorTopic = new SnsTopic(this, "error-topic", SnsTopicConfig.builder()
                .name(resourceName("ErrorNotifications"))
                .displayName("Lambda Error Notifications")
                .tags(getTagsWithName("ErrorTopic"))
                .build());

        // Create email subscription
        new SnsTopicSubscription(this, "error-subscription", SnsTopicSubscriptionConfig.builder()
                .topicArn(errorTopic.getArn())
                .protocol("email")
                .endpoint("oride.a@turing.com")
                .build());

        // Create metric filter for Lambda errors
        new CloudwatchLogMetricFilter(this, "error-filter",
                CloudwatchLogMetricFilterConfig.builder()
                        .name(resourceName("LambdaErrors"))
                        .logGroupName(logGroupName)
                        .pattern("ERROR")
                        .metricTransformation(CloudwatchLogMetricFilterMetricTransformation.builder()
                                .name("LambdaErrors")
                                .namespace("ServerlessDemo")
                                .value("1")
                                .defaultValue("0")
                                .build())
                        .build());

        // Create alarm for Lambda errors
        new CloudwatchMetricAlarm(this, "lambda-error-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("LambdaErrorAlarm"))
                .alarmDescription("Alert when Lambda function encounters errors")
                .metricName("LambdaErrors")
                .namespace("ServerlessDemo")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(1.0)
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("LambdaErrorAlarm"))
                .build());

        // Create alarm for Lambda duration
        new CloudwatchMetricAlarm(this, "lambda-duration-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("LambdaDurationAlarm"))
                .alarmDescription("Alert when Lambda function duration is high")
                .metricName("Duration")
                .namespace("AWS/Lambda")
                .dimensions(java.util.Map.of("FunctionName", functionName))
                .statistic("Average")
                .period(300)
                .evaluationPeriods(2)
                .threshold(5000.0)
                .comparisonOperator("GreaterThanThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("LambdaDurationAlarm"))
                .build());

        // Create alarm for Lambda throttles
        new CloudwatchMetricAlarm(this, "lambda-throttle-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("LambdaThrottleAlarm"))
                .alarmDescription("Alert when Lambda function is throttled")
                .metricName("Throttles")
                .namespace("AWS/Lambda")
                .dimensions(java.util.Map.of("FunctionName", functionName))
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(1.0)
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("LambdaThrottleAlarm"))
                .build());

        // Create alarm for API Gateway 4XX errors
        new CloudwatchMetricAlarm(this, "api-4xx-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("API4xxAlarm"))
                .alarmDescription("Alert on high 4XX error rate")
                .metricName("4XXError")
                .namespace("AWS/ApiGateway")
                .dimensions(java.util.Map.of("ApiName", apiName, "Stage", "prod"))
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(2)
                .threshold(10.0)
                .comparisonOperator("GreaterThanThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("API4xxAlarm"))
                .build());

        // Create alarm for API Gateway 5XX errors
        new CloudwatchMetricAlarm(this, "api-5xx-alarm", CloudwatchMetricAlarmConfig.builder()
                .alarmName(resourceName("API5xxAlarm"))
                .alarmDescription("Alert on 5XX errors")
                .metricName("5XXError")
                .namespace("AWS/ApiGateway")
                .dimensions(java.util.Map.of("ApiName", apiName, "Stage", "prod"))
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(1.0)
                .comparisonOperator("GreaterThanOrEqualToThreshold")
                .treatMissingData("notBreaching")
                .alarmActions(List.of(errorTopic.getArn()))
                .tags(getTagsWithName("API5xxAlarm"))
                .build());
    }
}
```

**app.constructs.S3Construct**
```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3BucketConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlockConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningAConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

public class S3Construct extends BaseConstruct {
    private final S3Bucket bucket;

    public S3Construct(final Construct scope, final String id) {
        super(scope, id);

        // Create S3 bucket
        this.bucket = new S3Bucket(this, "deployment-bucket", S3BucketConfig.builder()
                .bucket(resourceName("lambda-deployments-" + System.currentTimeMillis()).toLowerCase())
                .tags(getTagsWithName("DeploymentBucket"))
                .build());

        // Enable versioning
        new S3BucketVersioningA(this, "bucket-versioning", S3BucketVersioningAConfig.builder()
                .bucket(bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build());

        // Block public access
        new S3BucketPublicAccessBlock(this, "bucket-pab", S3BucketPublicAccessBlockConfig.builder()
                .bucket(bucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());
    }

    public String getBucketArn() {
        return bucket.getArn();
    }

    public String getBucketName() {
        return bucket.getBucket();
    }
}
```

**Lambda Function (handler.js)**
```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
});

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const REGION = process.env.REGION || 'us-east-1';

// Enhanced error types for better monitoring
const ErrorTypes = {
    VALIDATION_ERROR: 'ValidationError',
    NOT_FOUND: 'NotFoundError',
    CONFLICT: 'ConflictError',
    RATE_LIMIT: 'RateLimitError',
    INTERNAL_ERROR: 'InternalError'
};

exports.main = async (event, context) => {
    // Request tracing
    const requestId = context.awsRequestId;
    const traceId = event.headers?.['X-Amzn-Trace-Id'] || 'unknown';

    console.log(`[${requestId}] Request received:`, {
        httpMethod: event.httpMethod,
        path: event.path,
        traceId: traceId,
        userAgent: event.headers?.['User-Agent'],
        sourceIp: event.requestContext?.identity?.sourceIp
    });

    // Set timeout warning
    const timeoutWarning = setTimeout(() => {
        console.warn(`[${requestId}] Function approaching timeout, remaining time: ${context.getRemainingTimeInMillis()}ms`);
    }, context.getRemainingTimeInMillis() - 1000);

    try {
        // Input validation
        if (!event.httpMethod || !event.path) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Missing required request properties', requestId);
        }

        // Health check endpoint
        if (event.path === '/health') {
            return await handleHealthCheck(requestId);
        }

        const httpMethod = event.httpMethod;
        const path = event.path;
        const pathSegments = path.split('/').filter(Boolean);

        // Route handling with enhanced paths
        if (pathSegments[0] === 'items') {
            if (pathSegments.length === 1) {
                // Collection operations: /items
                switch (httpMethod) {
                    case 'GET':
                        return await handleListItems(event, requestId);
                    case 'POST':
                        return await handleCreateItem(event, requestId);
                    default:
                        return createErrorResponse(405, ErrorTypes.VALIDATION_ERROR, 'Method not allowed for collection', requestId);
                }
            } else if (pathSegments.length === 2) {
                // Individual item operations: /items/{id}
                const itemId = pathSegments[1];
                switch (httpMethod) {
                    case 'GET':
                        return await handleGetItem(itemId, requestId);
                    case 'PUT':
                        return await handleUpdateItem(itemId, event, requestId);
                    case 'DELETE':
                        return await handleDeleteItem(itemId, requestId);
                    default:
                        return createErrorResponse(405, ErrorTypes.VALIDATION_ERROR, 'Method not allowed for item', requestId);
                }
            } else if (pathSegments.length === 3 && pathSegments[2] === 'batch') {
                // Batch operations: /items/batch
                switch (httpMethod) {
                    case 'POST':
                        return await handleBatchOperation(event, requestId);
                    default:
                        return createErrorResponse(405, ErrorTypes.VALIDATION_ERROR, 'Method not allowed for batch', requestId);
                }
            }
        }

        return createErrorResponse(404, ErrorTypes.NOT_FOUND, 'Endpoint not found', requestId);

    } catch (error) {
        console.error(`[${requestId}] Unhandled error:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return createErrorResponse(500, ErrorTypes.INTERNAL_ERROR, 'Internal server error', requestId);
    } finally {
        clearTimeout(timeoutWarning);
    }
};

async function handleHealthCheck(requestId) {
    console.log(`[${requestId}] Health check requested`);

    try {
        // Test DynamoDB connection
        const params = {
            TableName: TABLE_NAME,
            Limit: 1
        };

        const start = Date.now();
        await dynamodb.scan(params).promise();
        const duration = Date.now() - start;

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            region: REGION,
            table: TABLE_NAME,
            dynamoLatency: `${duration}ms`,
            requestId: requestId
        };

        console.log(`[${requestId}] Health check passed:`, health);
        return createResponse(200, health, requestId);
    } catch (error) {
        console.error(`[${requestId}] Health check failed:`, error);
        return createErrorResponse(503, ErrorTypes.INTERNAL_ERROR, 'Service unhealthy', requestId);
    }
}

async function handleListItems(event, requestId) {
    console.log(`[${requestId}] Listing items`);

    try {
        // Query parameters for pagination and filtering
        const queryParams = event.queryStringParameters || {};
        const limit = Math.min(parseInt(queryParams.limit) || 20, 100); // Max 100 items
        const lastKey = queryParams.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;

        const params = {
            TableName: TABLE_NAME,
            Limit: limit
        };

        if (lastKey) {
            params.ExclusiveStartKey = lastKey;
        }

        const result = await dynamodb.scan(params).promise();

        const response = {
            items: result.Items || [],
            count: result.Count,
            scannedCount: result.ScannedCount
        };

        if (result.LastEvaluatedKey) {
            response.nextToken = encodeURIComponent(JSON.stringify(result.LastEvaluatedKey));
        }

        console.log(`[${requestId}] Listed ${result.Count} items`);
        return createResponse(200, response, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error listing items:`, error);
        if (error.code === 'ResourceNotFoundException') {
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, 'Table not found', requestId);
        }
        throw error;
    }
}

async function handleGetItem(itemId, requestId) {
    console.log(`[${requestId}] Getting item: ${itemId}`);

    if (!isValidId(itemId)) {
        return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid item ID format', requestId);
    }

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: itemId }
        };

        const result = await dynamodb.get(params).promise();

        if (!result.Item) {
            console.log(`[${requestId}] Item not found: ${itemId}`);
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, `Item with id '${itemId}' not found`, requestId);
        }

        console.log(`[${requestId}] Item retrieved: ${itemId}`);
        return createResponse(200, result.Item, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error getting item ${itemId}:`, error);
        throw error;
    }
}

async function handleCreateItem(event, requestId) {
    console.log(`[${requestId}] Creating item`);

    try {
        const body = parseRequestBody(event.body);
        const validationResult = validateItemData(body, true);

        if (!validationResult.isValid) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, validationResult.errors.join(', '), requestId);
        }

        const item = {
            id: body.id,
            name: body.name || null,
            data: body.data || {},
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        };

        // Conditional put to prevent duplicates
        const params = {
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(id)'
        };

        await dynamodb.put(params).promise();

        console.log(`[${requestId}] Item created: ${item.id}`);
        return createResponse(201, {
            message: 'Item created successfully',
            id: item.id,
            createdAt: item.createdAt
        }, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error creating item:`, error);

        if (error.code === 'ConditionalCheckFailedException') {
            return createErrorResponse(409, ErrorTypes.CONFLICT, 'Item already exists', requestId);
        }
        throw error;
    }
}

async function handleUpdateItem(itemId, event, requestId) {
    console.log(`[${requestId}] Updating item: ${itemId}`);

    if (!isValidId(itemId)) {
        return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid item ID format', requestId);
    }

    try {
        const body = parseRequestBody(event.body);
        const validationResult = validateItemData(body, false);

        if (!validationResult.isValid) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, validationResult.errors.join(', '), requestId);
        }

        // Build update expression dynamically
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (body.name !== undefined) {
            updateExpressions.push('#name = :name');
            expressionAttributeNames['#name'] = 'name';
            expressionAttributeValues[':name'] = body.name;
        }

        if (body.data !== undefined) {
            updateExpressions.push('#data = :data');
            expressionAttributeNames['#data'] = 'data';
            expressionAttributeValues[':data'] = body.data;
        }

        updateExpressions.push('#updatedAt = :updatedAt');
        updateExpressions.push('#version = #version + :inc');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeNames['#version'] = 'version';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        expressionAttributeValues[':inc'] = 1;

        const params = {
            TableName: TABLE_NAME,
            Key: { id: itemId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_NEW'
        };

        const result = await dynamodb.update(params).promise();

        console.log(`[${requestId}] Item updated: ${itemId}`);
        return createResponse(200, {
            message: 'Item updated successfully',
            item: result.Attributes
        }, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error updating item ${itemId}:`, error);

        if (error.code === 'ConditionalCheckFailedException') {
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, `Item with id '${itemId}' not found`, requestId);
        }
        throw error;
    }
}

async function handleDeleteItem(itemId, requestId) {
    console.log(`[${requestId}] Deleting item: ${itemId}`);

    if (!isValidId(itemId)) {
        return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid item ID format', requestId);
    }

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: itemId },
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_OLD'
        };

        const result = await dynamodb.delete(params).promise();

        console.log(`[${requestId}] Item deleted: ${itemId}`);
        return createResponse(200, {
            message: 'Item deleted successfully',
            deletedItem: result.Attributes
        }, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error deleting item ${itemId}:`, error);

        if (error.code === 'ConditionalCheckFailedException') {
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, `Item with id '${itemId}' not found`, requestId);
        }
        throw error;
    }
}

async function handleBatchOperation(event, requestId) {
    console.log(`[${requestId}] Handling batch operation`);

    try {
        const body = parseRequestBody(event.body);

        if (!body.operation || !Array.isArray(body.items)) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Batch operation requires operation type and items array', requestId);
        }

        if (body.items.length > 25) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Batch operations limited to 25 items', requestId);
        }

        switch (body.operation) {
            case 'write':
                return await handleBatchWrite(body.items, requestId);
            case 'get':
                return await handleBatchGet(body.items, requestId);
            default:
                return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid batch operation type', requestId);
        }

    } catch (error) {
        console.error(`[${requestId}] Error in batch operation:`, error);
        throw error;
    }
}

async function handleBatchWrite(items, requestId) {
    const writeRequests = items.map(item => {
        if (item.action === 'put') {
            return {
                PutRequest: {
                    Item: {
                        id: item.id,
                        name: item.name || null,
                        data: item.data || {},
                        timestamp: Date.now(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        version: 1
                    }
                }
            };
        } else if (item.action === 'delete') {
            return {
                DeleteRequest: {
                    Key: { id: item.id }
                }
            };
        }
    }).filter(Boolean);

    const params = {
        RequestItems: {
            [TABLE_NAME]: writeRequests
        }
    };

    const result = await dynamodb.batchWrite(params).promise();

    return createResponse(200, {
        message: 'Batch write completed',
        unprocessedItems: result.UnprocessedItems
    }, requestId);
}

async function handleBatchGet(items, requestId) {
    const keys = items.map(item => ({ id: item.id }));

    const params = {
        RequestItems: {
            [TABLE_NAME]: {
                Keys: keys
            }
        }
    };

    const result = await dynamodb.batchGet(params).promise();

    return createResponse(200, {
        items: result.Responses[TABLE_NAME] || [],
        unprocessedKeys: result.UnprocessedKeys
    }, requestId);
}

function parseRequestBody(body) {
    if (!body) {
        throw new Error('Request body is required');
    }

    try {
        return JSON.parse(body);
    } catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}

function validateItemData(data, requireId = false) {
    const errors = [];

    if (requireId && !data.id) {
        errors.push('Missing required field: id');
    }

    if (data.id && !isValidId(data.id)) {
        errors.push('Invalid id format: must be alphanumeric with dashes/underscores, 1-50 characters');
    }

    if (data.name && typeof data.name !== 'string') {
        errors.push('Name must be a string');
    }

    if (data.name && data.name.length > 255) {
        errors.push('Name must be 255 characters or less');
    }

    if (data.data && typeof data.data !== 'object') {
        errors.push('Data must be an object');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function isValidId(id) {
    return typeof id === 'string' &&
           /^[a-zA-Z0-9_-]+$/.test(id) &&
           id.length >= 1 &&
           id.length <= 50;
}

function createResponse(statusCode, body, requestId) {
    const response = {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'X-Request-ID': requestId
        },
        body: JSON.stringify(body)
    };

    console.log(`[${requestId}] Response: ${statusCode}`);
    return response;
}

function createErrorResponse(statusCode, errorType, message, requestId) {
    const error = {
        error: {
            type: errorType,
            message: message,
            requestId: requestId,
            timestamp: new Date().toISOString()
        }
    };

    // Log error for CloudWatch monitoring
    console.error(`[${requestId}] ERROR ${statusCode}:`, error);

    return createResponse(statusCode, error, requestId);
}
```

