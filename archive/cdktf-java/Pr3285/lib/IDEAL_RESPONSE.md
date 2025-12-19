```java
package app.config;

import app.stacks.MonitoringStack;
import app.stacks.NetworkStack;
import app.stacks.StorageStack;

public record ComputeStackConfig(NetworkStack network, StorageStack storage, MonitoringStack monitoring) {
}
```

```java
package app.stacks;

import com.hashicorp.cdktf.providers.aws.api_gateway_deployment.ApiGatewayDeployment;
import com.hashicorp.cdktf.providers.aws.api_gateway_integration.ApiGatewayIntegration;
import com.hashicorp.cdktf.providers.aws.api_gateway_integration_response.ApiGatewayIntegrationResponse;
import com.hashicorp.cdktf.providers.aws.api_gateway_method.ApiGatewayMethod;
import com.hashicorp.cdktf.providers.aws.api_gateway_method_response.ApiGatewayMethodResponse;
import com.hashicorp.cdktf.providers.aws.api_gateway_resource.ApiGatewayResource;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApi;
import com.hashicorp.cdktf.providers.aws.api_gateway_rest_api.ApiGatewayRestApiEndpointConfiguration;
import com.hashicorp.cdktf.providers.aws.api_gateway_stage.ApiGatewayStage;
import com.hashicorp.cdktf.providers.aws.api_gateway_stage.ApiGatewayStageAccessLogSettings;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermission;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class ApiStack {
    private final ApiGatewayRestApi api;
    private final ApiGatewayStage stage;

    public ApiStack(final Construct scope, final String id, final ComputeStack compute, final MonitoringStack monitoring) {

        // Create API Gateway
        this.api = ApiGatewayRestApi.Builder.create(scope, id + "-api")
                .name("serverless-api")
                .description("API Gateway for serverless application")
                .endpointConfiguration(ApiGatewayRestApiEndpointConfiguration.builder()
                        .types(List.of("REGIONAL"))
                        .build())
                .tags(Map.of("Name", "serverless-api"))
                .build();

        // Create resource
        ApiGatewayResource resource = ApiGatewayResource.Builder.create(scope, id + "-resource")
                .restApiId(api.getId())
                .parentId(api.getRootResourceId())
                .pathPart("process")
                .build();

        // Create OPTIONS method for CORS
        ApiGatewayMethod optionsMethod = ApiGatewayMethod.Builder.create(scope, id + "-options-method")
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod("OPTIONS")
                .authorization("NONE")
                .build();

        // Mock integration for OPTIONS
        ApiGatewayIntegration optionsIntegration = ApiGatewayIntegration.Builder.create(scope, id + "-options-integration")
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod(optionsMethod.getHttpMethod())
                .type("MOCK")
                .requestTemplates(Map.of("application/json", "{\"statusCode\": 200}"))
                .build();

        // Create OPTIONS method response
        ApiGatewayMethodResponse optionsMethodResponse = ApiGatewayMethodResponse.Builder.create(scope, id + "-options-response")
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod(optionsMethod.getHttpMethod())
                .statusCode("200")
                .responseParameters(Map.of(
                        "method.response.header.Access-Control-Allow-Headers", true,
                        "method.response.header.Access-Control-Allow-Methods", true,
                        "method.response.header.Access-Control-Allow-Origin", true
                ))
                .build();

        // Create OPTIONS integration response
        ApiGatewayIntegrationResponse.Builder.create(scope, id + "-options-integration-response")
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod(optionsMethod.getHttpMethod())
                .statusCode("200")
                .responseParameters(Map.of(
                        "method.response.header.Access-Control-Allow-Headers",
                        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                        "method.response.header.Access-Control-Allow-Methods",
                        "'OPTIONS,POST,GET'",
                        "method.response.header.Access-Control-Allow-Origin", "'*'"
                ))
                .dependsOn(List.of(optionsIntegration, optionsMethodResponse))
                .build();

        // Create POST method
        ApiGatewayMethod postMethod = ApiGatewayMethod.Builder.create(scope, id + "-post-method")
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod("POST")
                .authorization("NONE")
                .build();

        // Lambda integration
        String integrationUri = String.format(
                "arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/%s/invocations",
                compute.getLambdaFunction().getArn()
        );

        ApiGatewayIntegration lambdaIntegration = ApiGatewayIntegration.Builder.create(scope, id + "-lambda-integration")
                .restApiId(api.getId())
                .resourceId(resource.getId())
                .httpMethod(postMethod.getHttpMethod())
                .integrationHttpMethod("POST")
                .type("AWS_PROXY")
                .uri(integrationUri)
                .build();

        // Create deployment
        ApiGatewayDeployment deployment = ApiGatewayDeployment.Builder.create(scope, id + "-deployment")
                .restApiId(api.getId())
                .dependsOn(Arrays.asList(
                        optionsIntegration,
                        lambdaIntegration
                ))
                .build();

        // Create stage with CloudWatch logging
        this.stage = ApiGatewayStage.Builder.create(scope, id + "-stage")
                .stageName("prod")
                .restApiId(api.getId())
                .deploymentId(deployment.getId())
                .xrayTracingEnabled(true)
                .accessLogSettings(ApiGatewayStageAccessLogSettings.builder()
                        .destinationArn(monitoring.getApiLogGroup().getArn())
                        .format("$context.requestId")
                        .build())
                .tags(Map.of(
                        "Name", "prod-stage",
                        "Environment", "Production"
                ))
                .dependsOn(List.of(monitoring.getApiGatewayAccount()))
                .build();

        // Grant API Gateway permission to invoke Lambda
        LambdaPermission.Builder.create(scope, id + "-api-lambda-permission")
                .statementId("AllowAPIGatewayInvoke")
                .action("lambda:InvokeFunction")
                .functionName(compute.getLambdaFunction().getFunctionName())
                .principal("apigateway.amazonaws.com")
                .sourceArn(api.getExecutionArn() + "/*/*/*")
                .build();
    }

    // Getters
    public ApiGatewayRestApi getApi() {
        return api;
    }

    public ApiGatewayStage getStage() {
        return stage;
    }
}
```

```java
package app.stacks;

import app.config.ComputeStackConfig;
import com.hashicorp.cdktf.AssetType;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.TerraformAssetConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_rule.CloudwatchEventRule;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_target.CloudwatchEventTarget;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunction;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionEnvironment;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionDeadLetterConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionTracingConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionVpcConfig;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermission;
import software.constructs.Construct;

import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ComputeStack {

    private final LambdaFunction lambdaFunction;

    private final IamRole lambdaRole;

    private final StorageStack storage;

    private final NetworkStack network;

    private final MonitoringStack monitoring;

    public ComputeStack(final Construct scope, final String id, final ComputeStackConfig config) {

        this.storage = config.storage();
        this.network = config.network();
        this.monitoring = config.monitoring();

        // Create KMS key for Lambda environment variables
        KmsKey lambdaKmsKey = KmsKey.Builder.create(scope, id + "-lambda-kms-key")
                .description("KMS key for Lambda environment variables")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "lambda-encryption-key"))
                .build();

        // Create IAM role for Lambda with least privilege
        String assumeRolePolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }]
                }
                """;

        this.lambdaRole = IamRole.Builder.create(scope, id + "-lambda-role")
                .name("serverless-lambda-role")
                .assumeRolePolicy(assumeRolePolicy)
                .tags(Map.of("Name", "lambda-execution-role"))
                .build();

        // Attach VPC execution policy
        IamRolePolicyAttachment.Builder.create(scope, id + "-lambda-vpc-policy")
                .role(lambdaRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
                .build();

        // Custom policy for S3, DynamoDB, and SNS access
        String customPolicy = createLambdaCustomPolicy(lambdaKmsKey);

        IamRolePolicy.Builder.create(scope, id + "-lambda-custom-policy")
                .name("serverless-lambda-custom-policy")
                .role(lambdaRole.getId())
                .policy(customPolicy)
                .build();

        this.lambdaFunction = createLambdaFunction(scope, id, lambdaKmsKey);

        // Create CloudWatch Event Rule for scheduled execution
        CloudwatchEventRule scheduledRule = CloudwatchEventRule.Builder.create(scope, id + "-scheduled-rule")
                .name("lambda-daily-trigger")
                .description("Trigger Lambda every 24 hours")
                .scheduleExpression("rate(24 hours)")
                .tags(Map.of("Name", "daily-trigger"))
                .build();

        // Add Lambda as target
        CloudwatchEventTarget.Builder.create(scope, id + "-scheduled-target")
                .rule(scheduledRule.getName())
                .targetId("lambda-target")
                .arn(lambdaFunction.getArn())
                .build();

        createLambdaPermission(scheduledRule, scope, id);
    }

    private String createLambdaCustomPolicy(final KmsKey lambdaKmsKey) {
        return String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:GetObject",
                                        "s3:ListBucket"
                                    ],
                                    "Resource": [
                                        "%s",
                                        "%s/*"
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "dynamodb:GetItem",
                                        "dynamodb:PutItem",
                                        "dynamodb:Query",
                                        "dynamodb:UpdateItem",
                                        "dynamodb:DeleteItem",
                                        "dynamodb:BatchGetItem",
                                        "dynamodb:BatchWriteItem"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sns:Publish"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sqs:SendMessage"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:DescribeKey",
                                        "kms:GenerateDataKey"
                                    ],
                                    "Resource": [
                                        "%s",
                                        "%s",
                                        "%s"
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": "arn:aws:logs:us-west-2:*:*"
                                }
                            ]
                        }
                        """,
                storage.getS3Bucket().getArn(),
                storage.getS3Bucket().getArn(),
                storage.getDynamoTable().getArn(),
                monitoring.getSnsTopic().getArn(),
                monitoring.getDeadLetterQueue().getArn(),
                storage.getS3KmsKey().getArn(),
                storage.getDynamoKmsKey().getArn(),
                lambdaKmsKey.getArn()
        );
    }

    private LambdaFunction createLambdaFunction(final Construct scope, final String id, final KmsKey lambdaKmsKey) {

        // Package Lambda function
        TerraformAsset lambdaAsset = new TerraformAsset(scope, "lambda-code", TerraformAssetConfig.builder()
                .path(Paths.get("").toAbsolutePath().resolve("lib/src/main/java/app/lambda").toString())
                .type(AssetType.ARCHIVE)
                .build());

        // Environment variables
        Map<String, String> envVars = new HashMap<>();
        envVars.put("S3_BUCKET_NAME", storage.getS3Bucket().getBucket());
        envVars.put("DYNAMODB_TABLE_NAME", storage.getDynamoTable().getName());
        envVars.put("SNS_TOPIC_ARN", monitoring.getSnsTopic().getArn());
        envVars.put("REGION", "us-west-2");

        // Create Lambda function
        return LambdaFunction.Builder.create(scope, id + "-function")
                .functionName("serverless-processor")
                .runtime("python3.8")
                .handler("handler.lambda_handler")
                .filename(lambdaAsset.getPath())
                .sourceCodeHash(lambdaAsset.getAssetHash())
                .role(lambdaRole.getArn())
                .timeout(60)
                .memorySize(512)
                .environment(LambdaFunctionEnvironment.builder()
                        .variables(envVars)
                        .build())
                .vpcConfig(LambdaFunctionVpcConfig.builder()
                        .subnetIds(Arrays.asList(
                                network.getPrivateSubnetA().getId(),
                                network.getPrivateSubnetB().getId()
                        ))
                        .securityGroupIds(List.of(
                                network.getLambdaSecurityGroup().getId()
                        ))
                        .build())
                .kmsKeyArn(lambdaKmsKey.getArn())
                .tracingConfig(LambdaFunctionTracingConfig.builder()
                        .mode("Active")
                        .build())
                .deadLetterConfig(LambdaFunctionDeadLetterConfig.builder()
                        .targetArn(monitoring.getDeadLetterQueue().getArn())
                        .build())
                .reservedConcurrentExecutions(100)
                .tags(Map.of(
                        "Name", "serverless-processor",
                        "Type", "Compute"
                ))
                .build();
    }

    private void createLambdaPermission(final CloudwatchEventRule scheduledRule, final Construct scope, final String id) {

        // Grant permission for EventBridge to invoke Lambda
        LambdaPermission.Builder.create(scope, id + "-eventbridge-permission")
                .statementId("AllowExecutionFromEventBridge")
                .action("lambda:InvokeFunction")
                .functionName(lambdaFunction.getFunctionName())
                .principal("events.amazonaws.com")
                .sourceArn(scheduledRule.getArn())
                .build();
    }

    // Getters
    public LambdaFunction getLambdaFunction() {
        return lambdaFunction;
    }

    public IamRole getLambdaRole() {
        return lambdaRole;
    }
}
```

```java
package app.stacks;

import app.config.ComputeStackConfig;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderDefaultTags;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainStack extends TerraformStack {

    /**
     * Creates a new MainStack with basic AWS resources.
     * 
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider with default tags
        Map<String, String> defaultTags = new HashMap<>();
        defaultTags.put("Environment", "Production");
        defaultTags.put("ManagedBy", "CDKTerraform");
        defaultTags.put("Project", "ServerlessInfrastructure");
        defaultTags.put("CostCenter", "Engineering");

        // Configure AWS Provider
        AwsProvider.Builder.create(this, "aws")
                .region("us-west-2")
                .defaultTags(List.of(AwsProviderDefaultTags.builder()
                        .tags(defaultTags)
                        .build()))
                .build();

        // NetworkStack
        NetworkStack networkStack = new NetworkStack(this, "network");

        // StorageStack
        StorageStack storageStack = new StorageStack(this, "storage");

        // MonitoringStack
        MonitoringStack monitoringStack = new MonitoringStack(this, "monitoring");

        // ComputeStack
        ComputeStack computeStack = new ComputeStack(this, "compute",
                new ComputeStackConfig(networkStack, storageStack, monitoringStack));

        // ApiStack
        ApiStack apiStack = new ApiStack(this, "api", computeStack, monitoringStack);

        // Network Stack Outputs
        new TerraformOutput(this, "vpcId", TerraformOutputConfig.builder()
                .value(networkStack.getVpc().getId())
                .build());

        new TerraformOutput(this, "vpcCidr", TerraformOutputConfig.builder()
                .value(networkStack.getVpc().getCidrBlock())
                .build());

        new TerraformOutput(this, "privateSubnetAId", TerraformOutputConfig.builder()
                .value(networkStack.getPrivateSubnetA().getId())
                .build());

        new TerraformOutput(this, "privateSubnetBId", TerraformOutputConfig.builder()
                .value(networkStack.getPrivateSubnetB().getId())
                .build());

        new TerraformOutput(this, "lambdaSecurityGroupId", TerraformOutputConfig.builder()
                .value(networkStack.getLambdaSecurityGroup().getId())
                .build());

        new TerraformOutput(this, "s3EndpointId", TerraformOutputConfig.builder()
                .value(networkStack.getS3Endpoint().getId())
                .build());

        // Storage Stack Outputs
        new TerraformOutput(this, "s3BucketName", TerraformOutputConfig.builder()
                .value(storageStack.getS3Bucket().getBucket())
                .build());

        new TerraformOutput(this, "s3BucketArn", TerraformOutputConfig.builder()
                .value(storageStack.getS3Bucket().getArn())
                .build());

        new TerraformOutput(this, "dynamoTableName", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoTable().getName())
                .build());

        new TerraformOutput(this, "dynamoTableArn", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoTable().getArn())
                .build());

        new TerraformOutput(this, "s3KmsKeyId", TerraformOutputConfig.builder()
                .value(storageStack.getS3KmsKey().getKeyId())
                .build());

        new TerraformOutput(this, "s3KmsKeyArn", TerraformOutputConfig.builder()
                .value(storageStack.getS3KmsKey().getArn())
                .build());

        new TerraformOutput(this, "dynamoKmsKeyId", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoKmsKey().getKeyId())
                .build());

        new TerraformOutput(this, "dynamoKmsKeyArn", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoKmsKey().getArn())
                .build());

        // Compute Stack Outputs
        new TerraformOutput(this, "lambdaFunctionName", TerraformOutputConfig.builder()
                .value(computeStack.getLambdaFunction().getFunctionName())
                .build());

        new TerraformOutput(this, "lambdaFunctionArn", TerraformOutputConfig.builder()
                .value(computeStack.getLambdaFunction().getArn())
                .build());

        new TerraformOutput(this, "lambdaRoleArn", TerraformOutputConfig.builder()
                .value(computeStack.getLambdaRole().getArn())
                .build());

        // API Stack Outputs
        new TerraformOutput(this, "apiGatewayId", TerraformOutputConfig.builder()
                .value(apiStack.getApi().getId())
                .build());

        new TerraformOutput(this, "apiGatewayArn", TerraformOutputConfig.builder()
                .value(apiStack.getApi().getArn())
                .build());

        new TerraformOutput(this, "apiStageUrl", TerraformOutputConfig.builder()
                .value(apiStack.getStage().getInvokeUrl())
                .build());

        // Monitoring Stack Outputs
        new TerraformOutput(this, "snsTopicArn", TerraformOutputConfig.builder()
                .value(monitoringStack.getSnsTopic().getArn())
                .build());

        new TerraformOutput(this, "lambdaLogGroupName", TerraformOutputConfig.builder()
                .value(monitoringStack.getLambdaLogGroup().getName())
                .build());

        new TerraformOutput(this, "apiLogGroupName", TerraformOutputConfig.builder()
                .value(monitoringStack.getApiLogGroup().getName())
                .build());

        new TerraformOutput(this, "deadLetterQueueUrl", TerraformOutputConfig.builder()
                .value(monitoringStack.getDeadLetterQueue().getUrl())
                .build());

        new TerraformOutput(this, "logsKmsKeyId", TerraformOutputConfig.builder()
                .value(monitoringStack.getLogsKmsKey().getKeyId())
                .build());

        new TerraformOutput(this, "logsKmsKeyArn", TerraformOutputConfig.builder()
                .value(monitoringStack.getLogsKmsKey().getArn())
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}
```

```java
package app.stacks;

import com.hashicorp.cdktf.providers.aws.api_gateway_account.ApiGatewayAccount;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm;
import com.hashicorp.cdktf.providers.aws.data_aws_caller_identity.DataAwsCallerIdentity;
import com.hashicorp.cdktf.providers.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument;
import com.hashicorp.cdktf.providers.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement;
import com.hashicorp.cdktf.providers.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipals;
import com.hashicorp.cdktf.providers.aws.data_aws_region.DataAwsRegion;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKeyConfig;
import com.hashicorp.cdktf.providers.aws.sns_topic.SnsTopic;
import com.hashicorp.cdktf.providers.aws.sns_topic_subscription.SnsTopicSubscription;
import com.hashicorp.cdktf.providers.aws.sqs_queue.SqsQueue;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class MonitoringStack {
    private final SnsTopic snsTopic;
    private final CloudwatchLogGroup lambdaLogGroup;
    private final CloudwatchLogGroup apiLogGroup;
    private final SqsQueue deadLetterQueue;
    private final KmsKey logsKmsKey;
    private final ApiGatewayAccount apiGatewayAccount;

    public MonitoringStack(final Construct scope, final String id) {

        DataAwsCallerIdentity current = new DataAwsCallerIdentity(scope, "current");
        DataAwsRegion currentRegion = new DataAwsRegion(scope, "current-region");

        // Use the non-deprecated region ID instead of name
        String currentRegionName = currentRegion.getId();

        // Create IAM role for API Gateway CloudWatch logging
        DataAwsIamPolicyDocument apiGatewayAssumeRole = DataAwsIamPolicyDocument.Builder.create(scope, id + "-api-gateway-assume-role")
                .statement(List.of(DataAwsIamPolicyDocumentStatement.builder()
                        .effect("Allow")
                        .principals(List.of(DataAwsIamPolicyDocumentStatementPrincipals.builder()
                                .type("Service")
                                .identifiers(List.of("apigateway.amazonaws.com"))
                                .build()))
                        .actions(List.of("sts:AssumeRole"))
                        .build()))
                .build();

        IamRole apiGatewayCloudwatchRole = IamRole.Builder.create(scope, id + "-api-gateway-cloudwatch-role")
                .name("api-gateway-cloudwatch-logs-role")
                .assumeRolePolicy(apiGatewayAssumeRole.getJson())
                .tags(Map.of("Name", "api-gateway-cloudwatch-role"))
                .build();

        IamRolePolicyAttachment.Builder.create(scope, id + "-api-gateway-cloudwatch-policy")
                .role(apiGatewayCloudwatchRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs")
                .build();

        // Set API Gateway account settings with CloudWatch Logs role
        this.apiGatewayAccount = ApiGatewayAccount.Builder.create(scope, id + "-api-gateway-account")
                .cloudwatchRoleArn(apiGatewayCloudwatchRole.getArn())
                .build();

        // Create KMS key for SNS
        KmsKey snsKmsKey = createSnsKmsKey(scope, id, current);

        // Create KMS key for CloudWatch Logs encryption
        this.logsKmsKey = createLogsKmsKey(scope, id, currentRegionName, current);

        // Create KMS alias for the logs key
        KmsAlias.Builder.create(scope, id + "-logs-kms-alias")
                .name("alias/serverless-logs-key")
                .targetKeyId(this.logsKmsKey.getKeyId())
                .build();

        // Create SNS topic for error notifications
        this.snsTopic = SnsTopic.Builder.create(scope, id + "-error-topic")
                .name("serverless-error-notifications")
                .kmsMasterKeyId(snsKmsKey.getId())
                .tags(Map.of("Name", "error-notifications"))
                .build();

        // Create SNS subscription (email)
        SnsTopicSubscription.Builder.create(scope, id + "-email-subscription")
                .topicArn(snsTopic.getArn())
                .protocol("email")
                .endpoint("ops-team@example.com")
                .build();

        // Create CloudWatch Log Groups with KMS encryption
        this.lambdaLogGroup = CloudwatchLogGroup.Builder.create(scope, id + "-lambda-logs")
                .name("/aws/lambda/serverless-processor")
                .retentionInDays(30)
                .kmsKeyId(this.logsKmsKey.getArn())
                .tags(Map.of("Name", "lambda-logs"))
                .build();

        this.apiLogGroup = CloudwatchLogGroup.Builder.create(scope, id + "-api-logs")
                .name("/aws/apigateway/serverless-api")
                .retentionInDays(30)
                .kmsKeyId(this.logsKmsKey.getArn())
                .tags(Map.of("Name", "api-logs"))
                .build();

        // Create Dead Letter Queue
        this.deadLetterQueue = SqsQueue.Builder.create(scope, id + "-dlq")
                .name("serverless-dlq")
                .messageRetentionSeconds(1209600) // 14 days
                .kmsMasterKeyId(snsKmsKey.getId())
                .tags(Map.of("Name", "dead-letter-queue"))
                .build();

        // Create CloudWatch Alarms
        CloudwatchMetricAlarm.Builder.create(scope, id + "-lambda-error-alarm")
                .alarmName("lambda-high-error-rate")
                .alarmDescription("Alert when Lambda error rate is high")
                .metricName("Errors")
                .namespace("AWS/Lambda")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(5.0)
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "FunctionName", "serverless-processor"
                ))
                .alarmActions(List.of(snsTopic.getArn()))
                .treatMissingData("notBreaching")
                .tags(Map.of("Name", "lambda-error-alarm"))
                .build();

        CloudwatchMetricAlarm.Builder.create(scope, id + "-lambda-throttle-alarm")
                .alarmName("lambda-throttles")
                .alarmDescription("Alert when Lambda is throttled")
                .metricName("Throttles")
                .namespace("AWS/Lambda")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(1)
                .threshold(10.0)
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "FunctionName", "serverless-processor"
                ))
                .alarmActions(List.of(snsTopic.getArn()))
                .treatMissingData("notBreaching")
                .tags(Map.of("Name", "lambda-throttle-alarm"))
                .build();

        CloudwatchMetricAlarm.Builder.create(scope, id + "-api-4xx-alarm")
                .alarmName("api-high-4xx-rate")
                .alarmDescription("Alert when API has high 4xx error rate")
                .metricName("4XXError")
                .namespace("AWS/ApiGateway")
                .statistic("Sum")
                .period(300)
                .evaluationPeriods(2)
                .threshold(20.0)
                .comparisonOperator("GreaterThanThreshold")
                .dimensions(Map.of(
                        "ApiName", "serverless-api"
                ))
                .alarmActions(List.of(snsTopic.getArn()))
                .treatMissingData("notBreaching")
                .tags(Map.of("Name", "api-4xx-alarm"))
                .build();
    }

    private KmsKey createSnsKmsKey(final Construct scope, final String id, final DataAwsCallerIdentity current) {
        return KmsKey.Builder.create(scope, id + "-sns-kms-key")
                .description("KMS key for SNS topic encryption")
                .enableKeyRotation(true)
                .policy(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Sid": "Enable IAM User Permissions",
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": "arn:aws:iam::%s:root"
                                },
                                "Action": "kms:*",
                                "Resource": "*"
                            },
                            {
                                "Sid": "Allow SNS to use the key",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "sns.amazonaws.com"
                                },
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:GenerateDataKey"
                                ],
                                "Resource": "*"
                            }]
                        }
                        """, current.getAccountId()))
                .tags(Map.of("Name", "sns-encryption-key"))
                .build();

    }

    private KmsKey createLogsKmsKey(final Construct scope, final String id, final String currentRegionName,
                                    final DataAwsCallerIdentity current) {
        return new KmsKey(scope, id + "-logs-kms-key", KmsKeyConfig.builder()
                .description("KMS key for CloudWatch Logs encryption")
                .enableKeyRotation(true)
                .policy(String.format("""
                                {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Sid": "Enable IAM User Permissions",
                                            "Effect": "Allow",
                                            "Principal": {
                                                "AWS": "arn:aws:iam::%s:root"
                                            },
                                            "Action": "kms:*",
                                            "Resource": "*"
                                        },
                                        {
                                            "Sid": "Allow CloudWatch Logs Service",
                                            "Effect": "Allow",
                                            "Principal": {
                                                "Service": "logs.%s.amazonaws.com"
                                            },
                                            "Action": [
                                                "kms:Encrypt",
                                                "kms:Decrypt",
                                                "kms:ReEncrypt*",
                                                "kms:GenerateDataKey*",
                                                "kms:DescribeKey"
                                            ],
                                            "Resource": "*",
                                            "Condition": {
                                                "ArnEquals": {
                                                    "kms:EncryptionContext:aws:logs:arn": [
                                                        "arn:aws:logs:%s:%s:log-group:/aws/lambda/serverless-processor",
                                                        "arn:aws:logs:%s:%s:log-group:/aws/apigateway/serverless-api"
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                                """,
                        current.getAccountId(),
                        currentRegionName,
                        currentRegionName, current.getAccountId(),
                        currentRegionName, current.getAccountId()
                ))
                .tags(Map.of("Name", "logs-encryption-key"))
                .build());
    }

    // Getters
    public SnsTopic getSnsTopic() {
        return snsTopic;
    }

    public CloudwatchLogGroup getLambdaLogGroup() {
        return lambdaLogGroup;
    }

    public CloudwatchLogGroup getApiLogGroup() {
        return apiLogGroup;
    }

    public SqsQueue getDeadLetterQueue() {
        return deadLetterQueue;
    }

    public KmsKey getLogsKmsKey() {
        return logsKmsKey;
    }

    public ApiGatewayAccount getApiGatewayAccount() {
        return apiGatewayAccount;
    }
}
```

```java
package app.stacks;

import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import com.hashicorp.cdktf.providers.aws.vpc_endpoint.VpcEndpoint;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class NetworkStack {

    private final Vpc vpc;

    private final Subnet privateSubnetA;

    private final Subnet privateSubnetB;

    private final SecurityGroup lambdaSecurityGroup;

    private final VpcEndpoint s3Endpoint;

    public NetworkStack(final Construct scope, final String id) {

        // Create VPC with private subnets only for Lambda
        this.vpc = Vpc.Builder.create(scope, id + "-vpc")
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of(
                        "Name", "serverless-vpc",
                        "Type", "Private"
                ))
                .build();

        // Create private subnets for Lambda
        this.privateSubnetA = Subnet.Builder.create(scope, id + "-private-subnet-a")
                .vpcId(vpc.getId())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone("us-west-2a")
                .mapPublicIpOnLaunch(false)
                .tags(Map.of("Name", "private-subnet-a"))
                .build();

        this.privateSubnetB = Subnet.Builder.create(scope, id + "-private-subnet-b")
                .vpcId(vpc.getId())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone("us-west-2b")
                .mapPublicIpOnLaunch(false)
                .tags(Map.of("Name", "private-subnet-b"))
                .build();

        // Create VPC Endpoint for S3
        this.s3Endpoint = VpcEndpoint.Builder.create(scope, id + "-s3-endpoint")
                .vpcId(vpc.getId())
                .serviceName("com.amazonaws.us-west-2.s3")
                .vpcEndpointType("Gateway")
                .routeTableIds(List.of(
                        vpc.getMainRouteTableId()
                ))
                .tags(Map.of("Name", "s3-vpc-endpoint"))
                .build();

        // Create Security Group for Lambda
        this.lambdaSecurityGroup = SecurityGroup.Builder.create(scope, id + "-lambda-sg")
                .vpcId(vpc.getId())
                .name("lambda-security-group")
                .description("Security group for Lambda function")
                .tags(Map.of("Name", "lambda-sg"))
                .build();

        // Allow outbound HTTPS traffic
        SecurityGroupRule.Builder.create(scope, id + "-lambda-sg-egress")
                .type("egress")
                .fromPort(443)
                .toPort(443)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(lambdaSecurityGroup.getId())
                .build();
    }

    // Getters
    public Vpc getVpc() {
        return vpc;
    }

    public Subnet getPrivateSubnetA() {
        return privateSubnetA;
    }

    public Subnet getPrivateSubnetB() {
        return privateSubnetB;
    }

    public SecurityGroup getLambdaSecurityGroup() {
        return lambdaSecurityGroup;
    }

    public VpcEndpoint getS3Endpoint() {
        return s3Endpoint;
    }
}
```

```java
package app.stacks;

import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTable;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableAttribute;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTablePointInTimeRecovery;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableServerSideEncryption;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class StorageStack {

    private final S3Bucket s3Bucket;

    private final DynamodbTable dynamoTable;

    private final KmsKey s3KmsKey;

    private final KmsKey dynamoKmsKey;

    public StorageStack(final Construct scope, final String id) {
        // Create KMS keys for encryption
        this.s3KmsKey = KmsKey.Builder.create(scope, id + "-s3-kms-key")
                .description("KMS key for S3 bucket encryption")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "s3-encryption-key"))
                .build();

        KmsAlias.Builder.create(scope, id + "-s3-kms-alias")
                .name("alias/s3-serverless-key")
                .targetKeyId(s3KmsKey.getId())
                .build();

        this.dynamoKmsKey = KmsKey.Builder.create(scope, id + "-dynamo-kms-key")
                .description("KMS key for DynamoDB encryption")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "dynamodb-encryption-key"))
                .build();

        // Create S3 bucket with versioning and encryption
        this.s3Bucket = S3Bucket.Builder.create(scope, id + "-data-bucket")
                .bucket("serverless-data-bucket-" + System.currentTimeMillis())
                .tags(Map.of(
                        "Name", "serverless-data-bucket",
                        "Purpose", "Lambda data storage"
                ))
                .build();

        // Enable versioning
        S3BucketVersioningA.Builder.create(scope, id + "-bucket-versioning")
                .bucket(s3Bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build();

        // Enable server-side encryption
        S3BucketServerSideEncryptionConfigurationA.Builder.create(scope, id + "-bucket-encryption")
                .bucket(s3Bucket.getId())
                .rule(List.of(
                        S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                .applyServerSideEncryptionByDefault(
                                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                .sseAlgorithm("aws:kms")
                                                .kmsMasterKeyId(s3KmsKey.getArn())
                                                .build()
                                )
                                .bucketKeyEnabled(true)
                                .build()
                ))
                .build();

        // Block public access
        S3BucketPublicAccessBlock.Builder.create(scope, id + "-bucket-public-access-block")
                .bucket(s3Bucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build();

        // Create DynamoDB table
        this.dynamoTable = DynamodbTable.Builder.create(scope, id + "-data-table")
                .name("serverless-data-table")
                .billingMode("PROVISIONED")
                .readCapacity(5)
                .writeCapacity(5)
                .hashKey("pk")
                .rangeKey("sk")
                .attribute(Arrays.asList(
                        DynamodbTableAttribute.builder()
                                .name("pk")
                                .type("S")
                                .build(),
                        DynamodbTableAttribute.builder()
                                .name("sk")
                                .type("S")
                                .build()
                ))
                .serverSideEncryption(DynamodbTableServerSideEncryption.builder()
                        .enabled(true)
                        .kmsKeyArn(dynamoKmsKey.getArn())
                        .build())
                .pointInTimeRecovery(DynamodbTablePointInTimeRecovery.builder()
                        .enabled(true)
                        .build())
                .tags(Map.of(
                        "Name", "serverless-data-table",
                        "Purpose", "Application data storage"
                ))
                .build();
    }

    // Getters
    public S3Bucket getS3Bucket() {
        return s3Bucket;
    }

    public DynamodbTable getDynamoTable() {
        return dynamoTable;
    }

    public KmsKey getS3KmsKey() {
        return s3KmsKey;
    }

    public KmsKey getDynamoKmsKey() {
        return dynamoKmsKey;
    }
}
```

```java
package app;

import app.stacks.MainStack;
import com.hashicorp.cdktf.S3Backend;
import com.hashicorp.cdktf.S3BackendConfig;

import com.hashicorp.cdktf.App;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();

        MainStack stack = new MainStack(app, "serverless-infrastructure");

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

**app/lambda/handler.py**
```javascript
import json
import os
import boto3
import logging
from datetime import datetime
from botocore.exceptions import ClientError, BotoCoreError
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients with retry configuration
config = boto3.session.Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

s3_client = boto3.client('s3', config=config)
dynamodb = boto3.resource('dynamodb', config=config)
sns_client = boto3.client('sns', config=config)

# Environment variables with validation
try:
    S3_BUCKET = os.environ['S3_BUCKET_NAME']
    DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE_NAME']
    SNS_TOPIC = os.environ['SNS_TOPIC_ARN']
    REGION = os.environ.get('REGION', 'us-west-2')
except KeyError as e:
    logger.error(f"Missing required environment variable: {e}")
    raise

# Constants
MAX_S3_OBJECT_SIZE = 10 * 1024 * 1024  # 10MB
MAX_BODY_SIZE = 256 * 1024  # 256KB for API Gateway
MAX_S3_OBJECTS_PER_RUN = 100

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler function that processes events from API Gateway or EventBridge.

    Args:
        event: Event data from trigger source
        context: Lambda context object

    Returns:
        Response dict with statusCode and body
    """
    request_id = context.request_id if context else 'unknown'

    try:
        logger.info(f"Processing request {request_id}", extra={
            'request_id': request_id,
            'event_type': 'api' if 'httpMethod' in event else 'scheduled'
        })

        # Validate context
        if context:
            remaining_time = context.get_remaining_time_in_millis()
            if remaining_time < 5000:  # Less than 5 seconds remaining
                logger.warning(f"Low remaining execution time: {remaining_time}ms")

        # Determine if triggered by API Gateway or EventBridge
        if 'httpMethod' in event:
            # API Gateway trigger
            response = handle_api_request(event, context)
        else:
            # EventBridge scheduled trigger
            response = handle_scheduled_task(context)

        logger.info(f"Request {request_id} completed successfully")
        return response

    except (ClientError, BotoCoreError) as e:
        error_msg = f"AWS service error in request {request_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        send_error_notification(error_msg, request_id)

        if 'httpMethod' in event:
            return create_error_response(503, 'Service temporarily unavailable')
        raise

    except ValueError as e:
        error_msg = f"Validation error in request {request_id}: {str(e)}"
        logger.error(error_msg)

        if 'httpMethod' in event:
            return create_error_response(400, str(e))
        raise

    except Exception as e:
        error_msg = f"Unexpected error in request {request_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        send_error_notification(error_msg, request_id)

        if 'httpMethod' in event:
            return create_error_response(500, 'Internal server error')
        raise

def create_error_response(status_code: int, message: str) -> Dict[str, Any]:
    """
    Create a standardized error response for API Gateway.

    Args:
        status_code: HTTP status code
        message: Error message

    Returns:
        Formatted error response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps({
            'error': message,
            'timestamp': datetime.utcnow().isoformat()
        })
    }


def validate_api_request(event: Dict[str, Any]) -> None:
    """
    Validate API Gateway request.

    Args:
        event: API Gateway event

    Raises:
        ValueError: If validation fails
    """
    # Validate HTTP method
    http_method = event.get('httpMethod', '')
    if http_method not in ['GET', 'POST', 'OPTIONS']:
        raise ValueError(f"Unsupported HTTP method: {http_method}")

    # Handle OPTIONS for CORS preflight
    if http_method == 'OPTIONS':
        return

    # Validate body size for POST requests
    if http_method == 'POST':
        body = event.get('body', '')
        if len(body) > MAX_BODY_SIZE:
            raise ValueError(f"Request body exceeds maximum size of {MAX_BODY_SIZE} bytes")


def handle_api_request(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle API Gateway requests with comprehensive validation and error handling.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    try:
        # Validate request
        validate_api_request(event)

        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                },
                'body': ''
            }

        # Parse request body
        body_str = event.get('body', '{}')
        if not body_str:
            body_str = '{}'

        try:
            body = json.loads(body_str)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request body: {e}")
            raise ValueError('Invalid JSON in request body')

        # Validate body is a dict
        if not isinstance(body, dict):
            raise ValueError('Request body must be a JSON object')

        # Process the request
        result = process_data(body)

        # Store in DynamoDB with retry logic
        store_in_dynamodb(result)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'result': result,
                'timestamp': datetime.utcnow().isoformat()
            }, default=str)
        }

    except ValueError as e:
        # Already logged in main handler
        return create_error_response(400, str(e))
    except (ClientError, BotoCoreError) as e:
        # Already logged in main handler
        return create_error_response(503, 'Service temporarily unavailable')

def handle_scheduled_task(context: Any) -> Dict[str, Any]:
    """
    Handle scheduled tasks from EventBridge with improved error handling.

    Args:
        context: Lambda context

    Returns:
        Response dict
    """
    logger.info("Starting scheduled task")

    processed_count = 0
    error_count = 0
    errors = []

    try:
        # List objects in S3 bucket with pagination
        paginator = s3_client.get_paginator('list_objects_v2')
        page_iterator = paginator.paginate(
            Bucket=S3_BUCKET,
            MaxKeys=100,
            PaginationConfig={'MaxItems': MAX_S3_OBJECTS_PER_RUN}
        )

        for page in page_iterator:
            # Check remaining execution time
            if context and context.get_remaining_time_in_millis() < 10000:
                logger.warning("Approaching timeout, stopping S3 object processing")
                break

            if 'Contents' not in page:
                logger.info("No objects found in S3 bucket")
                continue

            for obj in page['Contents']:
                try:
                    # Skip objects that are too large
                    if obj['Size'] > MAX_S3_OBJECT_SIZE:
                        logger.warning(f"Skipping large object: {obj['Key']} (size: {obj['Size']} bytes)")
                        continue

                    process_s3_object(obj['Key'])
                    processed_count += 1

                except Exception as e:
                    error_count += 1
                    error_msg = f"Failed to process {obj['Key']}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)

                    # Stop processing if too many errors
                    if error_count > 10:
                        logger.error("Too many errors, stopping scheduled task")
                        break

        result_msg = f"Scheduled task completed: {processed_count} objects processed, {error_count} errors"
        logger.info(result_msg)

        # Send notification if there were errors
        if error_count > 0:
            send_error_notification(
                f"{result_msg}\nErrors:\n" + "\n".join(errors[:5]),
                'scheduled-task'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': result_msg,
                'processed': processed_count,
                'errors': error_count
            })
        }

    except ClientError as e:
        error_msg = f"Error accessing S3: {str(e)}"
        logger.error(error_msg, exc_info=True)
        send_error_notification(error_msg, 'scheduled-task')
        raise

def process_s3_object(key: str) -> None:
    """
    Process individual S3 object with validation and error handling.

    Args:
        key: S3 object key

    Raises:
        Exception: If processing fails
    """
    logger.info(f"Processing S3 object: {key}")

    try:
        # Validate key format
        if not key or key.startswith('/'):
            raise ValueError(f"Invalid S3 key: {key}")

        # Get object from S3
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)

        # Read content with size validation
        content_length = response.get('ContentLength', 0)
        if content_length > MAX_S3_OBJECT_SIZE:
            raise ValueError(f"Object size {content_length} exceeds maximum {MAX_S3_OBJECT_SIZE}")

        content = response['Body'].read().decode('utf-8')

        # Validate content is not empty
        if not content.strip():
            logger.warning(f"Empty content in S3 object: {key}")
            return

        # Process the content
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in S3 object {key}: {e}")
            raise ValueError(f"Invalid JSON content in {key}")

        result = process_data(data)

        # Store processed data
        store_in_dynamodb(result, source='s3', source_key=key)

        logger.info(f"Successfully processed S3 object: {key}")

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        if error_code == 'NoSuchKey':
            logger.error(f"S3 object not found: {key}")
        elif error_code == 'AccessDenied':
            logger.error(f"Access denied to S3 object: {key}")
        else:
            logger.error(f"Error accessing S3 object {key}: {e}")
        raise

    except Exception as e:
        logger.error(f"Error processing S3 object {key}: {e}", exc_info=True)
        raise

def process_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process incoming data with validation.

    Args:
        data: Input data to process

    Returns:
        Processed data dict

    Raises:
        ValueError: If data is invalid
    """
    if not isinstance(data, dict):
        raise ValueError("Data must be a dictionary")

    # Sanitize and validate data
    sanitized_data = {}
    for key, value in data.items():
        # Skip internal/private keys
        if key.startswith('_'):
            continue

        # Limit string lengths to prevent abuse
        if isinstance(value, str) and len(value) > 10000:
            logger.warning(f"Truncating long string value for key: {key}")
            value = value[:10000]

        sanitized_data[key] = value

    # Add your business logic here
    processed_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'data': sanitized_data,
        'processed': True,
        'processing_region': REGION
    }

    return processed_data

def store_in_dynamodb(data: Dict[str, Any], source: str = 'api', source_key: Optional[str] = None) -> None:
    """
    Store data in DynamoDB with retry logic and validation.

    Args:
        data: Data to store
        source: Source of the data (api, s3, etc.)
        source_key: Optional key identifying the source

    Raises:
        ClientError: If DynamoDB operation fails
    """
    if not data:
        raise ValueError("Cannot store empty data")

    table = dynamodb.Table(DYNAMODB_TABLE)

    timestamp = datetime.utcnow()
    item = {
        'pk': f"{source}#{timestamp.strftime('%Y-%m-%d')}",
        'sk': f"{timestamp.isoformat()}#{source_key or 'direct'}",
        'data': json.dumps(data, default=str),
        'source': source,
        'created_at': timestamp.isoformat(),
        'ttl': int(timestamp.timestamp()) + (90 * 24 * 60 * 60)  # 90 days TTL
    }

    # Add source_key to item if provided
    if source_key:
        item['source_key'] = source_key

    try:
        # Use conditional expression to prevent overwriting
        table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)'
        )
        logger.info(f"Data stored in DynamoDB: {item['pk']}#{item['sk']}")

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')

        if error_code == 'ConditionalCheckFailedException':
            # Item already exists, this is OK
            logger.warning(f"Item already exists in DynamoDB: {item['pk']}#{item['sk']}")
            return
        elif error_code == 'ProvisionedThroughputExceededException':
            logger.error(f"DynamoDB throughput exceeded: {e}")
            send_error_notification(f"DynamoDB throughput exceeded", 'dynamodb-error')
            raise
        elif error_code == 'ResourceNotFoundException':
            logger.error(f"DynamoDB table not found: {DYNAMODB_TABLE}")
            send_error_notification(f"DynamoDB table not found: {DYNAMODB_TABLE}", 'dynamodb-error')
            raise
        else:
            logger.error(f"Error storing in DynamoDB: {e}", exc_info=True)
            send_error_notification(f"DynamoDB write error: {e}", 'dynamodb-error')
            raise

def send_error_notification(error_message: str, request_id: str = 'unknown') -> None:
    """
    Send error notification via SNS with retry logic.

    Args:
        error_message: Error message to send
        request_id: Request ID for tracking
    """
    if not error_message:
        logger.warning("Empty error message, skipping notification")
        return

    try:
        # Truncate very long error messages
        if len(error_message) > 8000:
            error_message = error_message[:8000] + "... (truncated)"

        message = {
            'error': error_message,
            'function': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
            'request_id': request_id,
            'timestamp': datetime.utcnow().isoformat(),
            'region': REGION
        }

        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject=f'Lambda Error - {request_id}',
            Message=json.dumps(message, indent=2),
            MessageAttributes={
                'error_type': {
                    'DataType': 'String',
                    'StringValue': 'lambda_error'
                },
                'severity': {
                    'DataType': 'String',
                    'StringValue': 'high'
                }
            }
        )
        logger.info(f"Error notification sent for request {request_id}")

    except ClientError as e:
        # Don't raise exception on notification failure to avoid cascading errors
        logger.error(f"Failed to send SNS notification: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Unexpected error sending notification: {e}", exc_info=True)
```