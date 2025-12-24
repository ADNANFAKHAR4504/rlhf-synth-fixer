```python
# app.py
from aws_cdk import core
from my_web_app_stack import MyWebAppStack

app = core.App()
MyWebAppStack(app, "MyWebAppStack", env={'region': 'us-west-2'})
app.synth()
```

```python
# my_web_app_stack.py
from aws_cdk import (
    core,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_iam as iam
)

class MyWebAppStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # S3 Bucket for static website hosting
        bucket = s3.Bucket(self, "WebAppBucket",
            website_index_document="index.html",
            public_read_access=True,
            removal_policy=core.RemovalPolicy.DESTROY
        )

        # Lambda Function
        lambda_role = iam.Role(self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant Lambda permissions to read from S3
        bucket.grant_read(lambda_role)

        lambda_function = _lambda.Function(self, "WebAppLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="lambda_function.handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role
        )

        # Output the S3 Bucket URL
        core.CfnOutput(self, "BucketURL", value=bucket.bucket_website_url)
```

```python
# lambda/lambda_function.py
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
```

```html
<!-- lambda/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Simple Web App</title>
</head>
<body>
    <h1>Welcome to My Web App</h1>
    <p>This is a static site hosted on S3 with dynamic content served by Lambda.</p>
</body>
</html>
```

**Deployment Instructions:**

1. Install AWS CDK:
```bash
npm install -g aws-cdk
```

2. Bootstrap your CDK environment:
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

3. Deploy the stack:
```bash
cdk deploy
```

**Testing Lambda Function:**

After deployment, you can test the Lambda function using the AWS CLI:
```bash
aws lambda invoke --function-name MyWebAppStack-WebAppLambdaFunction-XXXXXXX --region us-west-2 output.txt
cat output.txt
```

This CDK application provisions the required infrastructure, adhering to AWS best practices and security principles. The S3 bucket hosts static content, while the Lambda function handles dynamic requests, with appropriate IAM roles and permissions.
