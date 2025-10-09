TapStackpr3993  aws_lambda_permission.api-gateway_product-id-GET-permission_CE28100A: Creation complete after 0s [id=AllowAPIGatewayInvoke-product-id-GET]
TapStackpr3993  ╷
                │ Warning: Deprecated attribute
                │ 
                │   on cdk.tf.json line 86, in output.api-gateway-url:
                │   86:       "value": "https://${aws_api_gateway_rest_api.api-gateway_api_57BFA6D4.id}.execute-api.${data.aws_region.current-region (current-region).name}.amazonaws.com/${aws_api_gateway_stage.api-stage.stage_name}"
                │ 
                │ The attribute "name" is deprecated. Refer to the provider documentation for
                │ details.
                │ 
                │ (and 11 more similar warnings elsewhere)
                ╵
TapStackpr3993  ╷
                │ Error: creating API Gateway Deployment: operation error API Gateway: CreateDeployment, https response error StatusCode: 400, RequestID: 9454b9d4-57b2-433c-9db2-1c832c3dde7f, BadRequestException: No integration defined for method
                │ 
                │   with aws_api_gateway_deployment.api-deployment (api-deployment),
                │   on cdk.tf.json line 162, in resource.aws_api_gateway_deployment.api-deployment (api-deployment):
                │  162:       }
                │ 
                ╵
TapStackpr3993  ╷
TapStackpr3993  │ Error: putting API Gateway Integration Response: operation error API Gateway: PutIntegrationResponse, https response error StatusCode: 400, RequestID: 823aa636-6edc-45f9-84dc-4e38fd1ae420, BadRequestException: Invalid mapping expression specified: Validation Result: warnings : [], errors : [No method response exists for method.]
                │ 
                │   with aws_api_gateway_integration_response.api-gateway_order-id-options-integration-response_C6781E4B (api-gateway/order-id-options-integration-response),
                │   on cdk.tf.json line 302, in resource.aws_api_gateway_integration_response.api-gateway_order-id-options-integration-response_C6781E4B (api-gateway/order-id-options-integration-response):
                │  302:       },
                │ 
                ╵
TapStackpr3993  ╷
TapStackpr3993  │ Error: putting API Gateway Integration Response: operation error API Gateway: PutIntegrationResponse, https response error StatusCode: 400, RequestID: 2c47dbc2-5c0a-4caf-9a7f-92d630a4b50a, BadRequestException: Invalid mapping expression specified: Validation Result: warnings : [], errors : [No method response exists for method.]
                │ 
                │   with aws_api_gateway_integration_response.api-gateway_orders-options-integration-response_EBBA8E84 (api-gateway/orders-options-integration-response),
                │   on cdk.tf.json line 322, in resource.aws_api_gateway_integration_response.api-gateway_orders-options-integration-response_EBBA8E84 (api-gateway/orders-options-integration-response):
                │  322:       },
                │ 
                ╵
TapStackpr3993  ╷
                │ Error: putting API Gateway Integration Response: operation error API Gateway: PutIntegrationResponse, https response error StatusCode: 400, RequestID: 19e03721-29d3-4c3b-a6c2-66c4e49ed83f, BadRequestException: Invalid mapping expression specified: Validation Result: warnings : [], errors : [No method response exists for method.]
                │ 
                │   with aws_api_gateway_integration_response.api-gateway_products-options-integration-response_43F915DB (api-gateway/products-options-integration-response),
                │   on cdk.tf.json line 362, in resource.aws_api_gateway_integration_response.api-gateway_products-options-integration-response_43F915DB (api-gateway/products-options-integration-response):
                │  362:       }
                │ 
                ╵
TapStackpr3993  ::error::Terraform exited with code 1.
0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.