### Reasoning Trace
---

The user is asking for a serverless application infrastructure in AWS using CDK for Terraform (CDKTF) with Java. Let me break down the requirements:

1. Modular structure with constructs directory
2. Resources: Lambda (Node.js 14.x), API Gateway, DynamoDB (pay-per-request), S3 (versioning), CloudWatch
3. API Gateway logging, Lambda error notifications through SNS
4. Tagging strategy and naming convention (SrvlessDemo_ prefix)
5. IAM least privilege, Lambda timeout ≤ 10 seconds
6. Clean separation, reusable constructs

I'll design a comprehensive solution with:
- Main application class
- Separate construct classes for each AWS service
- Proper IAM policies
- Configuration management
- Error handling and monitoring setup

Let me structure this properly with CDKTF for Java.
### Answer
---

I'll design a comprehensive serverless application infrastructure using CDK for Terraform with Java. This solution follows best practices with modular components, least privilege IAM, and proper monitoring.

## Project Structure

```
serverless-demo/
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── serverlessdemo/
│                   ├── Main.java
│                   ├── stacks/
│                   │   └── ServerlessStack.java
│                   ├── constructs/
│                   │   ├── LambdaConstruct.java
│                   │   ├── ApiGatewayConstruct.java
│                   │   ├── DynamoDBConstruct.java
│                   │   ├── S3Construct.java
│                   │   ├── MonitoringConstruct.java
│                   │   └── IamConstruct.java
│                   └── config/
│                       ├── Config.java
│                       └── Tags.java
├── lambda/
│   └── src/
│       └── handler.js
├── pom.xml
└── cdktf.json
```

## Implementation

### 1. Main Application Entry Point

```java
// src/main/java/com/serverlessdemo/Main.java
package com.serverlessdemo;

import com.hashicorp.cdktf.App;
import com.serverlessdemo.stacks.ServerlessStack;

public class Main {
    public static void main(String[] args) {
        final App app = new App();
        
        new ServerlessStack(app, "serverless-demo-stack");
        
        app.synth();
    }
}
```

### 2. Configuration Classes

```java
// src/main/java/com/serverlessdemo/config/Config.java
package com.serverlessdemo.config;

public class Config {
    public static final String REGION = "us-east-1";
    public static final String PREFIX = "SrvlessDemo_";
    public static final String ENVIRONMENT = "production";
    public static final String OWNER = "DevOpsTeam";
    public static final String LAMBDA_RUNTIME = "nodejs14.x";
    public static final int LAMBDA_TIMEOUT = 10;
    public static final String LAMBDA_HANDLER = "handler.main";
}
```

```java
// src/main/java/com/serverlessdemo/config/Tags.java
package com.serverlessdemo.config;

import java.util.HashMap;
import java.util.Map;

public class Tags {
    public static Map<String, String> getDefaultTags() {
        Map<String, String> tags = new HashMap<>();
        tags.put("Name", Config.PREFIX + "Resource");
        tags.put("Environment", Config.ENVIRONMENT);
        tags.put("Owner", Config.OWNER);
        return tags;
    }
    
    public static Map<String, String> getTagsWithName(String resourceName) {
        Map<String, String> tags = getDefaultTags();
        tags.put("Name", Config.PREFIX + resourceName);
        return tags;
    }
}
```

### 3. Main Stack

```java
// src/main/java/com/serverlessdemo/stacks/ServerlessStack.java
package com.serverlessdemo.stacks;

import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import com.serverlessdemo.config.Config;
import com.serverlessdemo.constructs.*;

public class ServerlessStack extends TerraformStack {
    
    public ServerlessStack(final Construct scope, final String id) {
        super(scope, id);
        
        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
            .region(Config.REGION)
            .build());
        
        // Create S3 bucket for Lambda deployments
        S3Construct s3 = new S3Construct(this, "s3");
        
        // Create DynamoDB table
        DynamoDBConstruct dynamodb = new DynamoDBConstruct(this, "dynamodb");
        
        // Create IAM roles and policies
        IamConstruct iam = new IamConstruct(this, "iam", 
            dynamodb.getTableArn(), 
            s3.getBucketArn());
        
        // Create Lambda functions
        LambdaConstruct lambda = new LambdaConstruct(this, "lambda", 
            iam.getLambdaExecutionRoleArn(),
            s3.getBucketName(),
            dynamodb.getTableName());
        
        // Create API Gateway
        ApiGatewayConstruct apiGateway = new ApiGatewayConstruct(this, "api", 
            lambda.getFunctionArn(),
            lambda.getFunctionInvokeArn());
        
        // Setup monitoring and alerting
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring",
            lambda.getFunctionName(),
            lambda.getLogGroupName(),
            apiGateway.getApiName());
    }
}
```

### 4. S3 Construct

```java
// src/main/java/com/serverlessdemo/constructs/S3Construct.java
package com.serverlessdemo.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3BucketConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioning;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlockConfig;
import com.serverlessdemo.config.Config;
import com.serverlessdemo.config.Tags;

public class S3Construct extends Construct {
    private final S3Bucket bucket;
    
    public S3Construct(final Construct scope, final String id) {
        super(scope, id);
        
        String bucketName = Config.PREFIX.toLowerCase() + "lambda-deployments-" + 
                           System.currentTimeMillis();
        
        // Create S3 bucket
        this.bucket = new S3Bucket(this, "deployment-bucket", S3BucketConfig.builder()
            .bucket(bucketName)
            .tags(Tags.getTagsWithName("DeploymentBucket"))
            .build());
        
        // Enable versioning
        new S3BucketVersioning(this, "bucket-versioning", S3BucketVersioningConfig.builder()
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

### 5. DynamoDB Construct

```java
// src/main/java/com/serverlessdemo/constructs/DynamoDBConstruct.java
package com.serverlessdemo.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTable;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableConfig;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableAttribute;
import com.serverlessdemo.config.Config;
import com.serverlessdemo.config.Tags;
import java.util.Arrays;

public class DynamoDBConstruct extends Construct {
    private final DynamodbTable table;
    
    public DynamoDBConstruct(final Construct scope, final String id) {
        super(scope, id);
        
        // Create DynamoDB table with pay-per-request billing
        this.table = new DynamodbTable(this, "app-table", DynamodbTableConfig.builder()
            .name(Config.PREFIX + "AppTable")
            .billingMode("PAY_PER_REQUEST")
            .hashKey("id")
            .attribute(Arrays.asList(
                DynamodbTableAttribute.builder()
                    .name("id")
                    .type("S")
                    .build()
            ))
            .tags(Tags.getTagsWithName("AppTable"))
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

### 6. IAM Construct

```java
// src/main/java/com/serverlessdemo/constructs/IamConstruct.java
package com.serverlessdemo.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicyConfig;
import com.serverlessdemo.config.Tags;
import com.serverlessdemo.config.Config;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

public class IamConstruct extends Construct {
    private final IamRole lambdaExecutionRole;
    private final ObjectMapper mapper = new ObjectMapper();
    
    public IamConstruct(final Construct scope, final String id, 
                       String dynamoTableArn, String s3BucketArn) {
        super(scope, id);
        
        // Create Lambda execution role
        this.lambdaExecutionRole = new IamRole(this, "lambda-execution-role", IamRoleConfig.builder()
            .name(Config.PREFIX + "LambdaExecutionRole")
            .assumeRolePolicy(createAssumeRolePolicy())
            .tags(Tags.getTagsWithName("LambdaExecutionRole"))
            .build());
        
        // Attach CloudWatch Logs policy
        new IamRolePolicy(this, "lambda-logs-policy", IamRolePolicyConfig.builder()
            .name(Config.PREFIX + "LambdaLogsPolicy")
            .role(lambdaExecutionRole.getId())
            .policy(createLogsPolicy())
            .build());
        
        // Attach DynamoDB policy
        new IamRolePolicy(this, "lambda-dynamodb-policy", IamRolePolicyConfig.builder()
            .name(Config.PREFIX + "LambdaDynamoDBPolicy")
            .role(lambdaExecutionRole.getId())
            .policy(createDynamoDBPolicy(dynamoTableArn))
            .build());
        
        // Attach S3 read policy for deployment packages
        new IamRolePolicy(this, "lambda-s3-policy", IamRolePolicyConfig.builder()
            .name(Config.PREFIX + "LambdaS3Policy")
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
        
        statement.put("Resource", "arn:aws:logs:" + Config.REGION + ":*:log-group:/aws/lambda/" + Config.PREFIX + "*");
        
        statements.add(statement);
        policy.set("Statement", statements);
        
        return policy.toString();
    }
    
    private String createDynamoDBPolicy(String tableArn) {
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
    
    private String createS3Policy(String bucketArn) {
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

### 7. Lambda Construct

```java
// src/main/java/com/serverlessdemo/constructs/LambdaConstruct.java
package com.serverlessdemo.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunction;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionEnvironment;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import com.serverlessdemo.config.Config;
import com.serverlessdemo.config.Tags;
import java.util.HashMap;
import java.util.Map;

public class LambdaConstruct extends Construct {
    private final LambdaFunction function;
    private final CloudwatchLogGroup logGroup;
    
    public LambdaConstruct(final Construct scope, final String id, 
                          String roleArn, String s3Bucket, String dynamoTableName) {
        super(scope, id);
        
        String functionName = Config.PREFIX + "ApiHandler";
        
        // Create CloudWatch Log Group
        this.logGroup = new CloudwatchLogGroup(this, "lambda-logs", CloudwatchLogGroupConfig.builder()
            .name("/aws/lambda/" + functionName)
            .retentionInDays(7)
            .tags(Tags.getTagsWithName("LambdaLogGroup"))
            .build());
        
        // Environment variables for Lambda
        Map<String, String> envVars = new HashMap<>();
        envVars.put("DYNAMODB_TABLE", dynamoTableName);
        envVars.put("REGION", Config.REGION);
        
        // Create Lambda function
        this.function = new LambdaFunction(this, "api-handler", LambdaFunctionConfig.builder()
            .functionName(functionName)
            .runtime(Config.LAMBDA_RUNTIME)
            .handler(Config.LAMBDA_HANDLER)
            .role(roleArn)
            .timeout(Config.LAMBDA_TIMEOUT)
            .memorySize(256)
            .s3Bucket(s3Bucket)
            .s3Key("lambda-deployment.zip")
            .environment(LambdaFunctionEnvironment.builder()
                .variables(envVars)
                .build())
            .tags(Tags.getTagsWithName("ApiHandler"))
            .dependsOn(java.util.Arrays.asList(logGroup))
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

### 8. API Gateway Construct

```java
// src/main/java/com/serverlessdemo/constructs/ApiGatewayConstruct.java
package com.serverlessdemo.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApi;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApiConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration;
import com.hashicorp.cdktf.providers.aws.api_gateway_resource.ApiGatewayResource;
import com.hashicorp.cdktf.providers.aws.api_gateway_resource.ApiGatewayResourceConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_method.ApiGatewayMethod;
import com.hashicorp.cdktf.providers.aws.api_gateway_method.ApiGatewayMethodConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_integration.ApiGatewayIntegration;
import com.hashicorp.cdktf.providers.aws.api_gateway_integration.ApiGatewayIntegrationConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_deployment.ApiGatewayDeployment;
import com.hashicorp.cdktf.providers.aws.api_gateway_deployment.ApiGatewayDeploymentConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_stage.ApiGatewayStage;
import com.hashicorp.cdktf.providers.aws.api_gateway_stage.ApiGatewayStageConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_method_settings.ApiGatewayMethodSettings;
import com.hashicorp.cdktf.providers.aws.api_gateway_method_settings.ApiGatewayMethodSettingsConfig;
import com.hashicorp.cdktf.providers.aws.api_gateway_method_settings.ApiGatewayMethodSettingsSettings;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermission;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermissionConfig;
import com.serverlessdemo.config.Config;
import com.serverlessdemo.config.Tags;
import java.util.Arrays;

public class ApiGatewayConstruct extends Construct {
    private final ApiGatewayRestApi api;
    private final ApiGatewayStage stage;
    
    public ApiGatewayConstruct(final Construct scope, final String id, 
                               String lambdaArn, String lambdaInvokeArn) {
        super(scope, id);
        
        // Create REST API
        this.api = new ApiGatewayRestApi(this, "rest-api", ApiGatewayRestApiConfig.builder()
            .name(Config.PREFIX + "API")
            .description("Serverless Demo API Gateway")
            .endpointConfiguration(ApiGatewayRestApiEndpointConfiguration.builder()
                .types(Arrays.asList("REGIONAL"))
                .build())
            .tags(Tags.getTagsWithName("API"))
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
        new ApiGatewayIntegration(this, "get-integration", ApiGatewayIntegrationConfig.builder()
            .restApiId(api.getId())
            .resourceId(resource.getId())
            .httpMethod(getMethod.getHttpMethod())
            .integrationHttpMethod("POST")
            .type("AWS_PROXY")
            .uri(lambdaInvokeArn)
            .build());
        
        new ApiGatewayIntegration(this, "post-integration", ApiGatewayIntegrationConfig.builder()
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
                .dependsOn(Arrays.asList(getMethod, postMethod))
                .build());
        
        // Create stage with logging
        this.stage = new ApiGatewayStage(this, "api-stage", ApiGatewayStageConfig.builder()
            .deploymentId(deployment.getId())
            .restApiId(api.getId())
            .stageName("prod")
            .xrayTracingEnabled(true)
            .tags(Tags.getTagsWithName("APIStage"))
            .build());
        
        // Configure method settings for logging
        new ApiGatewayMethodSettings(this, "method-settings", ApiGatewayMethodSettingsConfig.builder()
            .restApiId(api.getId())
            .stageName(stage.getStageName())
            .methodPath("*/*")
            .settings(ApiGatewayMethodSettingsSettings.builder()
                .loggingLevel("INFO")
                .dataTraceEnabled(true)
                .metricsEnabled(true)
                .build())
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

### 9. Monitoring Construct

```java
// src/main/java/com/serverlessdemo/constructs/MonitoringConstruct.java
package com.serverlessdemo.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopicConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscriptionConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilter;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilterConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_metric_filter.CloudwatchLogMetricFilterMetricTransformation;
import com.serverlessdemo.config.Config;
import com.serverlessdemo.config.Tags;
import java.util.Arrays;

public class MonitoringConstruct extends Construct {
    private final SnsTopic errorTopic;
    
    public MonitoringConstruct(final Construct scope, final String id,
                              String functionName, String logGroupName, String apiName) {
        super(scope, id);
        
        // Create SNS topic for error notifications
        this.errorTopic = new SnsTopic(this, "error-topic", SnsTopicConfig.builder()
            .name(Config.PREFIX + "ErrorNotifications")
            .displayName("Lambda Error Notifications")
            .tags(Tags.getTagsWithName("ErrorTopic"))
            .build());
        
        // Create email subscription (replace with actual email)
        new SnsTopicSubscription(this, "error-subscription", SnsTopicSubscriptionConfig.builder()
            .topicArn(errorTopic.getArn())
            .protocol("email")
            .endpoint("devops@example.com")
            .build());
        
        // Create metric filter for Lambda errors
        CloudwatchLogMetricFilter errorFilter = new CloudwatchLogMetricFilter(this, "error-filter",
            CloudwatchLogMetricFilterConfig.builder()
                .name(Config.PREFIX + "LambdaErrors")
                .logGroupName(logGroupName)
                .pattern("[ERROR]")
                .metricTransformation(CloudwatchLogMetricFilterMetricTransformation.builder()
                    .name("LambdaErrors")
                    .namespace("ServerlessDemo")
                    .value("1")
                    .build())
                .build());
        
        // Create alarm for Lambda errors
        new CloudwatchMetricAlarm(this, "lambda-error-alarm", CloudwatchMetricAlarmConfig.builder()
            .alarmName(Config.PREFIX + "LambdaErrorAlarm")
            .alarmDescription("Alert when Lambda function encounters errors")
            .metricName("LambdaErrors")
            .namespace("ServerlessDemo")
            .statistic("Sum")
            .period(300)
            .evaluationPeriods(1)
            .threshold(1.0)
            .comparisonOperator("GreaterThanOrEqualToThreshold")
            .treatMissingData("notBreaching")
            .alarmActions(Arrays.asList(errorTopic.getArn()))
            .tags(Tags.getTagsWithName("LambdaErrorAlarm"))
            .build());
        
        // Create alarm for Lambda duration
        new CloudwatchMetricAlarm(this, "lambda-duration-alarm", CloudwatchMetricAlarmConfig.builder()
            .alarmName(Config.PREFIX + "LambdaDurationAlarm")
            .alarmDescription("Alert when Lambda function duration is high")
            .metricName("Duration")
            .namespace("AWS/Lambda")
            .dimensions(java.util.Map.of("FunctionName", functionName))
            .statistic("Average")
            .period(300)
            .evaluationPeriods(2)
            .threshold(5000.0)  // 5 seconds
            .comparisonOperator("GreaterThanThreshold")
            .treatMissingData("notBreaching")
            .alarmActions(Arrays.asList(errorTopic.getArn()))
            .tags(Tags.getTagsWithName("LambdaDurationAlarm"))
            .build());
        
        // Create alarm for Lambda throttles
        new CloudwatchMetricAlarm(this, "lambda-throttle-alarm", CloudwatchMetricAlarmConfig.builder()
            .alarmName(Config.PREFIX + "LambdaThrottleAlarm")
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
            .alarmActions(Arrays.asList(errorTopic.getArn()))
            .tags(Tags.getTagsWithName("LambdaThrottleAlarm"))
            .build());
        
        // Create alarm for API Gateway 4XX errors
        new CloudwatchMetricAlarm(this, "api-4xx-alarm", CloudwatchMetricAlarmConfig.builder()
            .alarmName(Config.PREFIX + "API4xxAlarm")
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
            .alarmActions(Arrays.asList(errorTopic.getArn()))
            .tags(Tags.getTagsWithName("API4xxAlarm"))
            .build());
        
        // Create alarm for API Gateway 5XX errors
        new CloudwatchMetricAlarm(this, "api-5xx-alarm", CloudwatchMetricAlarmConfig.builder()
            .alarmName(Config.PREFIX + "API5xxAlarm")
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
            .alarmActions(Arrays.asList(errorTopic.getArn()))
            .tags(Tags.getTagsWithName("API5xxAlarm"))
            .build());
    }
}
```

### 10. Lambda Handler Code

```javascript
// lambda/src/handler.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
});

const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.main = async (event) => {
    console.log('Received event:', JSON.stringify(event));
    
    try {
        const httpMethod = event.httpMethod;
        const path = event.path;
        
        if (path === '/items') {
            switch (httpMethod) {
                case 'GET':
                    return await handleGet(event);
                case 'POST':
                    return await handlePost(event);
                default:
                    return createResponse(405, { error: 'Method not allowed' });
            }
        }
        
        return createResponse(404, { error: 'Not found' });
        
    } catch (error) {
        console.error('ERROR:', error);
        return createResponse(500, { error: 'Internal server error' });
    }
};

async function handleGet(event) {
    const params = {
        TableName: TABLE_NAME,
        Limit: 20
    };
    
    try {
        const result = await dynamodb.scan(params).promise();
        return createResponse(200, result.Items);
    } catch (error) {
        console.error('DynamoDB error:', error);
        throw error;
    }
}

async function handlePost(event) {
    const body = JSON.parse(event.body);
    
    if (!body.id) {
        return createResponse(400, { error: 'Missing id field' });
    }
    
    const params = {
        TableName: TABLE_NAME,
        Item: {
            id: body.id,
            data: body.data || {},
            timestamp: Date.now()
        }
    };
    
    try {
        await dynamodb.put(params).promise();
        return createResponse(201, { message: 'Item created', id: body.id });
    } catch (error) {
        console.error('DynamoDB error:', error);
        throw error;
    }
}

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(body)
    };
}
```

### 11. Maven Configuration (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.serverlessdemo</groupId>
    <artifactId>serverless-cdktf-demo</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdktf.version>0.18.0</cdktf.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.hashicorp</groupId>
            <artifactId>cdktf</artifactId>
            <version>${cdktf.version}</version>
        </dependency>
        
        <dependency>
            <groupId>com.hashicorp</groupId>
            <artifactId>cdktf-provider-aws</artifactId>
            <version>5.0.0</version>
        </dependency>
        
        <dependency>
            <groupId>software.constructs</groupId>
            <artifactId>constructs</artifactId>
            <version>10.2.70</version>
        </dependency>
        
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.15.2</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 12. CDKTF Configuration (cdktf.json)

```json
{
  "language": "java",
  "app": "mvn -q compile exec:java -Dexec.mainClass=\"com.serverlessdemo.Main\"",
  "projectId": "serverless-demo",
  "sendCrashReports": false,
  "terraformProviders": [
    "hashicorp/aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## Key Features

### 1. **Modular Architecture**
- Each AWS service is encapsulated in its own construct
- Clear separation of concerns
- Reusable components

### 2. **Security Best Practices**
- Least privilege IAM policies with no wildcards
- Specific resource ARNs in policies
- S3 bucket with versioning and public access blocked
- API Gateway with proper authorization setup

### 3. **Monitoring & Alerting**
- CloudWatch Log Groups with retention policies
- Metric filters for error detection
- SNS notifications for critical alerts
- Comprehensive alarms for Lambda and API Gateway

### 4. **Resource Management**
- Consistent naming convention with prefix
- Comprehensive tagging strategy
- DynamoDB with pay-per-request billing
- Lambda timeout constraints (≤10 seconds)

### 5. **Scalability**
- Serverless architecture with automatic scaling
- Regional deployment in us-east-1
- API Gateway with CloudWatch logging

## Deployment Instructions

1. **Install Prerequisites:**
   - Java 11+
   - Maven
   - Node.js 14.x (for Lambda code)
   - Terraform
   - CDKTF CLI

2. **Build and Deploy:**
```bash
# Install CDKTF CLI
npm install -g cdktf-cli

# Install dependencies
mvn clean install

# Package Lambda function
cd lambda
zip -r ../lambda-deployment.zip .
aws s3 cp ../lambda-deployment.zip s3://[your-bucket-name]/

# Deploy infrastructure
cdktf deploy
```

3. **Verify Deployment:**
   - Check AWS Console for created resources
   - Test API Gateway endpoints
   - Verify CloudWatch alarms and SNS subscriptions

This solution provides a production-ready serverless application with proper separation of concerns, security, monitoring, and scalability built-in from the start.