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
