"""
Lambda function module with VPC configuration and environment variables.
Creates Lambda deployment package and configures networking.
"""


import os
import zipfile
import pulumi
import pulumi_aws as aws


def zip_directory_contents(source_dir: str, output_zip: str):
  with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
      for file in files:
        # Skip hidden files if necessary
        if file.startswith("."):
          continue
        file_path = os.path.join(root, file)
        arcname = os.path.relpath(file_path, source_dir)
        zipf.write(file_path, arcname)


class ServerlessComponent(pulumi.ComponentResource):
  def __init__(
      self,
      name: str,
      environment: str,
      lambda_role_arn: str,
      private_subnet_ids: list,
      lambda_security_group_id: pulumi.Output[str],
      rds_endpoint: pulumi.Output[str],
      db_name: pulumi.Output[str],
      db_username: str,
      db_password: pulumi.Output[str],
      handler: str = "lambda_function.lambda_handler",
      runtime: str = "python3.12",
      opts=None,
  ):
    super().__init__("custom:aws:Serverless", name, None, opts)

    lambda_folder = os.path.join(os.getcwd(), "lib/components/lambda_files")
    zip_file = os.path.join(os.getcwd(), "lib/components/lambda.zip")

    # 3. Create the zip (only contents)
    zip_directory_contents(lambda_folder, zip_file)

    # 1. Validate lambda.zip exists
    lambda_zip_path = os.path.join(os.getcwd(), "lib/components/lambda.zip")
    if not os.path.exists(lambda_zip_path):
      raise FileNotFoundError(f"Lambda package {lambda_zip_path} not found.")

    # 2. Create Lambda function
    self.lambda_function = aws.lambda_.Function(
        f"{name}-lambda-fn",
        name=f"api-lambda-{environment}",
        runtime=runtime,
        role=lambda_role_arn,
        handler=handler,
        code=pulumi.FileArchive(lambda_zip_path),
        timeout=30,
        memory_size=256,

        # VPC Configuration for RDS access
        vpc_config=aws.lambda_.FunctionVpcConfigArgs(
            subnet_ids=private_subnet_ids,
            security_group_ids=[lambda_security_group_id]
        ),

        # Environment variables for database connection
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DB_HOST": rds_endpoint,
                "DB_NAME": db_name,
                "DB_USER": db_username,
                "DB_PASSWORD": db_password,
                "DB_PORT": "5432",
                "ENVIRONMENT": environment
            }
        ),

        # Enable detailed monitoring
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active"
        ),

        tags={
            "Name": f"api-lambda-{environment}",
            "Environment": environment
        },

        opts=pulumi.ResourceOptions(parent=self),
    )

    lambda_function_arn = self.lambda_function.arn
    lambda_function_name = self.lambda_function.name

    # Create REST API
    self.api = aws.apigateway.RestApi(
        f"api-{environment}",
        name=f"serverless-api-{environment}",
        description=f"Serverless API for {environment} environment",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types="REGIONAL"
        ),
        tags={
            "Name": f"api-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Create API Gateway resources and methods

    # Health check resource
    self.health_resource = aws.apigateway.Resource(
        f"health-resource-{environment}",
        rest_api=self.api.id,
        parent_id=self.api.root_resource_id,
        path_part="health"
    )

    # Users resource
    self.users_resource = aws.apigateway.Resource(
        f"users-resource-{environment}",
        rest_api=self.api.id,
        parent_id=self.api.root_resource_id,
        path_part="users",
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
        ])
    )

    # Create methods for health endpoint
    self.health_method = aws.apigateway.Method(
        f"health-method-{environment}",
        rest_api=self.api.id,
        resource_id=self.health_resource.id,
        http_method="GET",
        authorization="NONE",
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
        ])
    )

    # Create methods for users endpoint
    self.users_get_method = aws.apigateway.Method(
        f"users-get-method-{environment}",
        rest_api=self.api.id,
        resource_id=self.users_resource.id,
        http_method="GET",
        authorization="NONE",
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
        ])
    )

    self.users_post_method = aws.apigateway.Method(
        f"users-post-method-{environment}",
        rest_api=self.api.id,
        resource_id=self.users_resource.id,
        http_method="POST",
        authorization="NONE",
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
        ])
    )

    # CORS OPTIONS methods
    self.health_options_method = aws.apigateway.Method(
        f"health-options-method-{environment}",
        rest_api=self.api.id,
        resource_id=self.health_resource.id,
        http_method="OPTIONS",
        authorization="NONE",
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
        ])
    )

    self.users_options_method = aws.apigateway.Method(
        f"users-options-method-{environment}",
        rest_api=self.api.id,
        resource_id=self.users_resource.id,
        http_method="OPTIONS",
        authorization="NONE",
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
        ])
    )

    # CORS MOCK Integration for /health OPTIONS
    self.health_options_integration = aws.apigateway.Integration(
        f"health-options-integration-{environment}",
        rest_api=self.api.id,
        resource_id=self.health_resource.id,
        http_method="OPTIONS",
        type="MOCK",
        request_templates={"application/json": '{"statusCode": 200}'},
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
            self.users_options_method,
        ])
    )

    # CORS MOCK Integration for /users OPTIONS
    self.users_options_integration = aws.apigateway.Integration(
        f"users-options-integration-{environment}",
        rest_api=self.api.id,
        resource_id=self.users_resource.id,
        http_method="OPTIONS",
        type="MOCK",
        request_templates={"application/json": '{"statusCode": 200}'},
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
            self.users_options_method,
            self.health_options_integration,
        ])
    )

    # Lambda integrations
    self.health_integration = aws.apigateway.Integration(
        f"health-integration-{environment}",
        rest_api=self.api.id,
        resource_id=self.health_resource.id,
        http_method=self.health_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function_arn.apply(
            lambda arn: f"arn:aws:apigateway:{aws.get_region().name}:lambda:path/2015-03-31/functions/{arn}/invocations"
        ),
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
            self.users_options_method,
            self.health_options_integration,
            self.users_options_integration,
        ])
    )

    self.users_get_integration = aws.apigateway.Integration(
        f"users-get-integration-{environment}",
        rest_api=self.api.id,
        resource_id=self.users_resource.id,
        http_method=self.users_get_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function_arn.apply(
            lambda arn: f"arn:aws:apigateway:{aws.get_region().name}:lambda:path/2015-03-31/functions/{arn}/invocations"
        ),
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
            self.users_options_method,
            self.health_options_integration,
            self.users_options_integration,
            self.health_integration,
        ])
    )

    self.users_post_integration = aws.apigateway.Integration(
        f"users-post-integration-{environment}",
        rest_api=self.api.id,
        resource_id=self.users_resource.id,
        http_method=self.users_post_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function_arn.apply(
            lambda arn: f"arn:aws:apigateway:{aws.get_region().name}:lambda:path/2015-03-31/functions/{arn}/invocations"
        ),
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
            self.users_options_method,
            self.health_options_integration,
            self.users_options_integration,
            self.health_integration,
            self.users_get_integration,
        ])
    )

    self.lambda_permission = aws.lambda_.Permission(
        f"apigw-lambda-permission-{environment}",
        action="lambda:InvokeFunction",
        function=lambda_function_name,
        principal="apigateway.amazonaws.com",
        source_arn=self.api.execution_arn.apply(lambda arn: f"{arn}/*/*/*"),
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
            self.users_options_method,
            self.health_options_integration,
            self.users_options_integration,
            self.health_integration,
            self.users_get_integration,
            self.users_post_integration,
        ])
    )

    self.deployment = aws.apigateway.Deployment(
        f"api-deployment-{environment}",
        rest_api=self.api.id,
        triggers={
            "redeployment": pulumi.Output.concat(
                self.health_method.id, self.users_get_method.id, self.users_post_method.id
            )
        },
        opts=pulumi.ResourceOptions(depends_on=[
            self.health_resource,
            self.users_resource,
            self.health_method,
            self.users_get_method,
            self.users_post_method,
            self.health_options_method,
            self.users_options_method,
            self.health_options_integration,
            self.users_options_integration,
            self.health_integration,
            self.users_get_integration,
            self.users_post_integration,
            self.lambda_permission,
        ])
    )

    self.stage = aws.apigateway.Stage(
        f"api-stage-{environment}",
        rest_api=self.api.id,
        deployment=self.deployment.id,
        stage_name=environment
    )

    # self.api_url = pulumi.Output.concat(
    #     "https://",
    #     self.api.id,
    #     ".execute-api.",
    #     aws.get_region().name,
    #     ".amazonaws.com/",
    #     self.stage.stage_name,
    #     "/users"
    # )
    self.api_url = pulumi.Output.concat(
        "https://",
        self.api.id,
        ".execute-api.",
        aws.get_region().name,
        ".amazonaws.com"
    )

    # Register outputs
    self.register_outputs(
        {
            "lambda_name": self.lambda_function.name,
            "lambda_arn": self.lambda_function.arn,
            "lambda_function_arn": self.lambda_function.arn,
            "api_gateway_arn": self.api.arn
        }
    )
