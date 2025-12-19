"""
api.py

API Gateway infrastructure for REST endpoints.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional
import json


class ApiGatewayStack(pulumi.ComponentResource):
    """
    Creates API Gateway REST API with Lambda integration.
    """

    def __init__(
        self,
        name: str,
        *,
        lambda_function_arn: Output[str],
        lambda_function_name: Output[str],
        enable_custom_domain: bool,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:api:ApiGatewayStack', name, None, opts)

        # Create API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f'api-gateway-{environment_suffix}',
            name=f'payment-api-{environment_suffix}',
            description=f'Payment processing API - {environment_suffix}',
            tags={**tags, 'Name': f'payment-api-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create resource for /process endpoint
        self.resource = aws.apigateway.Resource(
            f'api-resource-{environment_suffix}',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='process',
            opts=ResourceOptions(parent=self)
        )

        # Create POST method
        self.method = aws.apigateway.Method(
            f'api-method-{environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.resource.id,
            http_method='POST',
            authorization='NONE',
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda integration
        self.integration = aws.apigateway.Integration(
            f'api-integration-{environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.resource.id,
            http_method=self.method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=lambda_function_arn.apply(
                lambda arn: f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{arn}/invocations'
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.method])
        )

        # Grant API Gateway permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f'api-lambda-permission-{environment_suffix}',
            action='lambda:InvokeFunction',
            function=lambda_function_name,
            principal='apigateway.amazonaws.com',
            source_arn=pulumi.Output.all(self.api.execution_arn).apply(
                lambda args: f'{args[0]}/*/*'
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create deployment
        self.deployment = aws.apigateway.Deployment(
            f'api-deployment-{environment_suffix}',
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.integration]
            )
        )

        # Create stage
        self.stage = aws.apigateway.Stage(
            f'api-stage-{environment_suffix}',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name='v1',
            tags={**tags, 'Name': f'api-stage-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[self.deployment])
        )

        # Note: Custom domain would require ACM certificate
        # Placeholder for production custom domain configuration
        if enable_custom_domain:
            # In a real implementation, you would:
            # 1. Create/import ACM certificate
            # 2. Create custom domain name
            # 3. Create base path mapping
            # 4. Create Route53 record
            pass

        # Expose outputs
        self.api_id = self.api.id
        self.api_endpoint = pulumi.Output.all(
            self.api.id,
            self.stage.stage_name
        ).apply(lambda args: f'https://{args[0]}.execute-api.us-east-1.amazonaws.com/{args[1]}')
        self.stage_name = self.stage.stage_name

        self.register_outputs({
            'api_id': self.api_id,
            'api_endpoint': self.api_endpoint,
            'stage_name': self.stage_name
        })
