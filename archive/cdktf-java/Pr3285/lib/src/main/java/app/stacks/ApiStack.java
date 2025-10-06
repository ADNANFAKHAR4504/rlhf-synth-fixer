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
