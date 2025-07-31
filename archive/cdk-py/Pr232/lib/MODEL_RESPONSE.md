Certainly! Below is a Python CDK script that sets up a serverless HTTP endpoint using AWS API Gateway and AWS Lambda, adhering to the specified requirements.

```python
from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_iam as iam,
    core
)

class MyCompanyServerlessStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define the Lambda function with inline code
        lambda_function = _lambda.Function(
            self, 'mycompany-LambdaFunction',
            runtime=_lambda.Runtime.PYTHON_3_8,  # Use Python 3.8 runtime
            handler='index.handler',  # File is "index", function is "handler"
            code=_lambda.Code.from_inline("""
def handler(event, context):
    import json
    print(f"Received event: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from MyCompany!')
    }
"""),
            environment={
                'LOG_LEVEL': 'INFO'
            }
        )

        # Define the API Gateway REST API
        api = apigw.RestApi(
            self, 'mycompany-ApiGateway',
            rest_api_name='mycompany-Service',
            description='This service serves mycompany HTTP POST requests.'
        )

        # Define a resource and POST method
        post_resource = api.root.add_resource('myresource')
        post_integration = apigw.LambdaIntegration(lambda_function)

        post_method = post_resource.add_method(
            'POST',  # HTTP Method
            post_integration,
            method_responses=[{
                'statusCode': '200',
                'responseParameters': {
                    'method.response.header.Content-Type': True
                }
            }]
        )

        # Define the IAM role and policy for the Lambda function
        lambda_role = iam.Role(
            self, 'mycompany-LambdaExecutionRole',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name('service-role/AWSLambdaBasicExecutionRole')
            ]
        )

        # Assign the role to the Lambda function
        lambda_function.role = lambda_role

        # Output the API Endpoint
        core.CfnOutput(
            self, 'ApiEndpoint',
            value=api.url
        )

# Initialize the CDK app and stack
app = core.App()
MyCompanyServerlessStack(app, "MyCompanyServerlessStack", env={'region': 'us-west-2'})
app.synth()
```

### Explanation:

1. **Lambda Function**:
   - Defined using `_lambda.Function` with inline Python code to handle and log incoming JSON payloads.
   - The handler is set to `index.handler`, which means the code will look for a function named `handler` in the `index` file.

2. **API Gateway**:
   - Defined using `apigw.RestApi`.
   - A resource `/myresource` is added to the API root, and a POST method is configured to integrate with the Lambda function.

3. **IAM Role**:
   - An IAM role is created with basic Lambda execution permissions using `iam.Role` and `iam.ManagedPolicy`.

4. **Output**:
   - The API endpoint URL is outputted using `core.CfnOutput`.

### Deployment:

1. **Install AWS CDK**:
   ```bash
   npm install -g aws-cdk
   ```

2. **Bootstrap CDK in your AWS account**:
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

3. **Deploy the stack**:
   ```bash
   cdk deploy
   ```

This script will deploy the necessary infrastructure in the `us-west-2` region, adhering to the naming conventions and requirements specified.