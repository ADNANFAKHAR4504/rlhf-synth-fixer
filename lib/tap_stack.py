# mycompany_serverless_stack.py

from typing import Optional

from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_iam as iam,
    NestedStack,
    CfnOutput,
    Duration,
    StackProps,
    Stack
)
from constructs import Construct


class MyCompanyServerlessStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Define IAM Role for Lambda
    lambda_role = iam.Role(
        self, 'mycompany-LambdaExecutionRole',
        assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                'service-role/AWSLambdaBasicExecutionRole'
            )
        ]
    )

    # Define the Lambda function 
    lambda_function = _lambda.Function(
        self, 'mycompany-LambdaFunction',
        runtime=_lambda.Runtime.PYTHON_3_11,
        handler='index.handler',
        code=_lambda.Code.from_inline("""
def handler(event, context):
    import json
    print(f"Received event: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from MyCompany!')
    }
"""),
        role=lambda_role,
        environment={
            'LOG_LEVEL': 'INFO'
        },
        timeout=Duration.seconds(10),
    )

    # Define API Gateway
    api = apigw.RestApi(
        self, 'mycompany-ApiGateway',
        rest_api_name='mycompany-Service',
        description='This service serves mycompany HTTP POST requests.'
    )

    post_resource = api.root.add_resource('myresource')
    post_resource.add_method(
        'POST',
        apigw.LambdaIntegration(lambda_function)
    )

    # Outputs
    CfnOutput(self, 'ApiEndpoint', value=api.url)
    CfnOutput(self, 'LambdaFunctionName', value=lambda_function.function_name)
    CfnOutput(self, 'LambdaFunctionArn', value=lambda_function.function_arn)
    CfnOutput(self, 'LambdaExecutionRoleName', value=lambda_role.role_name)
    CfnOutput(self, 'ApiGatewayRestApiId', value=api.rest_api_id)


class TapStackProps(StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Instantiate nested serverless stack
    self.serverless_stack = MyCompanyServerlessStack(
        self,
        f"MyCompanyServerlessStack{environment_suffix}"
    )
