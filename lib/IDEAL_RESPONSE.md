## **Corrected CDK Application**

```python
# app.py
from aws_cdk import App, Environment
from my_web_app_stack import MyWebAppStack

app = App()
MyWebAppStack(
    app, 
    "MyWebAppStack", 
    env=Environment(region='us-west-2')
)
app.synth()
```

```python
# my_web_app_stack.py
from aws_cdk import (
    Stack,
    CfnOutput,
    RemovalPolicy,
    Duration,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_iam as iam,
    aws_logs as logs
)
from constructs import Construct

class MyWebAppStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 Bucket for static website hosting (private bucket)
        bucket = s3.Bucket(
            self, "WebAppBucket",
            bucket_name=f"webapp-static-{self.account}-{self.region}",
            public_read_access=False,  # Secure by default
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Lambda execution role with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # CloudWatch Log Group for Lambda
        log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name=f"/aws/lambda/webapp-function",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda Function
        lambda_function = _lambda.Function(
            self, "WebAppLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline('''
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Handle different HTTP methods
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        response_body = {
            'message': 'Hello from Lambda!',
            'method': http_method,
            'path': path,
            'timestamp': context.aws_request_id
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
            },
            'body': json.dumps(response_body)
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
            '''),
            role=lambda_role,
            timeout=Duration.seconds(30),
            log_group=log_group,
            environment={
                'BUCKET_NAME': bucket.bucket_name
            }
        )

        # API Gateway for Lambda
        api = apigw.RestApi(
            self, "WebAppApi",
            rest_api_name="WebApp API",
            description="API for web application",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
            )
        )

        # Lambda integration
        lambda_integration = apigw.LambdaIntegration(
            lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )

        # API Gateway resources
        api.root.add_method("GET", lambda_integration)
        api_resource = api.root.add_resource("api")
        api_resource.add_method("GET", lambda_integration)
        api_resource.add_method("POST", lambda_integration)

        # Origin Access Control for CloudFront
        oac = cloudfront.OriginAccessControl(
            self, "OAC",
            origin_access_control_origin_type=cloudfront.OriginAccessControlOriginType.S3,
            signing=cloudfront.Signing.SIGV4_NO_OVERRIDE
        )

        # CloudFront Distribution
        distribution = cloudfront.Distribution(
            self, "WebAppDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3StaticWebsiteOrigin(bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.RestApiOrigin(api),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL
                )
            },
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html"
                )
            ]
        )

        # Grant CloudFront access to S3 bucket
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject"],
                resources=[bucket.arn_for_objects("*")],
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                }
            )
        )

        # Deploy static assets to S3
        s3_deployment.BucketDeployment(
            self, "DeployStaticAssets",
            sources=[s3_deployment.Source.asset("./static_content")],
            destination_bucket=bucket,
            distribution=distribution,
            distribution_paths=["/*"]
        )

        # Outputs
        CfnOutput(
            self, "CloudFrontURL",
            value=f"https://{distribution.distribution_domain_name}",
            description="CloudFront Distribution URL"
        )

        CfnOutput(
            self, "ApiGatewayURL",
            value=api.url,
            description="API Gateway URL"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Lambda Function Name"
        )

        CfnOutput(
            self, "S3BucketName",
            value=bucket.bucket_name,
            description="S3 Bucket Name"
        )
```

## **Static Content Structure**

Create a `static_content/` directory with:

```html
<!-- static_content/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serverless Web App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
        }
        button:hover {
            background-color: #0056b3;
        }
        #response {
            margin-top: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Serverless Web Application</h1>
        <p>This is a static site hosted on S3 behind CloudFront, with dynamic content served by Lambda through API Gateway.</p>
        
        <button onclick="callLambda()">Call Lambda Function</button>
        
        <div id="response"></div>
    </div>

    <script>
        async function callLambda() {
            try {
                const response = await fetch('/api');
                const data = await response.json();
                document.getElementById('response').innerHTML = 
                    '<h3>Lambda Response:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('response').innerHTML = 
                    '<h3>Error:</h3><p>' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
```

```html
<!-- static_content/error.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found</title>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <a href="/">Go back to home</a>
</body>
</html>
```

## **Deployment Instructions**

1. **Install dependencies:**
```bash
pip install aws-cdk-lib constructs
```

2. **Bootstrap CDK (if not done already):**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

3. **Deploy the stack:**
```bash
cdk deploy
```

4. **Test the deployment:**
```bash
# Test Lambda function directly
aws lambda invoke --function-name [LAMBDA_FUNCTION_NAME] --region us-west-2 output.txt

# Test via API Gateway
curl [API_GATEWAY_URL]/api

# Access the web application
# Open the CloudFront URL in your browser
```

## **Key Improvements Made:**

1. **Proper API Gateway Integration**: Lambda is now accessible via HTTP endpoints
2. **Secure S3 Configuration**: Private bucket with CloudFront Origin Access Control
3. **CloudFront Distribution**: CDN for performance and security
4. **Proper Asset Deployment**: Static files correctly deployed to S3
5. **CORS Configuration**: Enables cross-origin requests
6. **Error Handling**: Comprehensive error handling in Lambda
7. **CloudWatch Logging**: Proper logging setup
8. **Security Best Practices**: Least privilege IAM roles and secure configurations
9. **Environment Variables**: Proper configuration management
10. **Complete Testing Setup**: Functional web interface to test Lambda integration
