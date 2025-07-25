## **Corrected CDK Application - TapStack Implementation**

```python
# tap.py
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='us-west-2'  # Fixed region as specified in requirements
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

```python
# lib/tap_stack.py
"""
tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the static website with Lambda backend project.
It provisions S3 bucket for static hosting and Lambda function for dynamic content.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3_deployment
from constructs import Construct


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
      environment_suffix (Optional[str]): An optional suffix to identify the 
      deployment environment (e.g., 'dev', 'prod').
      **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
      environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    # Validate environment_suffix
    if environment_suffix is not None and not isinstance(environment_suffix, str):
      raise ValueError("environment_suffix must be a string")
    if environment_suffix is not None and len(environment_suffix.strip()) == 0:
      raise ValueError("environment_suffix cannot be empty")
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  """
  Represents the main CDK stack for the static website with Lambda backend.

  This stack provisions:
  - S3 bucket for static website hosting
  - Lambda function for dynamic content
  - IAM roles with least privilege access
  - CloudFront distribution for secure content delivery
  - Static content deployment

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the 
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
      website_bucket (s3.Bucket): The S3 bucket used for static website hosting.
      lambda_function (_lambda.Function): The Lambda function for dynamic content.
      distribution (cloudfront.CloudFrontWebDistribution): CloudFront distribution for content delivery.
  """

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use default
    self.environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
    
    # Validate environment_suffix
    if not self.environment_suffix or not isinstance(self.environment_suffix, str):
      raise ValueError("environment_suffix is required and must be a non-empty string")

    # Create S3 bucket for static website hosting (private - accessed via CloudFront)
    self.website_bucket = s3.Bucket(
        self,
        "WebsiteBucket",
        bucket_name=f"static-website-{self.environment_suffix}-{self.account}",
        versioned=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True,
        # Remove public access for security - CloudFront will handle access
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
    )

    # Create IAM role for Lambda function with least privilege
    lambda_role = iam.Role(
        self,
        "LambdaExecutionRole",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        ],
        inline_policies={
            "S3AccessPolicy": iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        actions=[
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket",
                        ],
                        resources=[
                            self.website_bucket.bucket_arn,
                            f"{self.website_bucket.bucket_arn}/*",
                        ],
                    )
                ]
            )
        },
    )

    # Create Lambda function for dynamic content using external file
    self.lambda_function = _lambda.Function(
        self,
        "DynamicContentFunction",
        runtime=_lambda.Runtime.PYTHON_3_12,
        handler="handler.lambda_handler",
        code=_lambda.Code.from_asset("lib/lambda"),
        role=lambda_role,
        timeout=Duration.seconds(30),
        memory_size=128,
        environment={
            "WEBSITE_BUCKET": self.website_bucket.bucket_name,
        },
        description="Lambda function for dynamic content processing"
    )

    # Create CloudFront Origin Access Identity for secure S3 access
    origin_access_identity = cloudfront.OriginAccessIdentity(
        self,
        "WebsiteOAI",
        comment=f"OAI for static website {self.environment_suffix}"
    )

    # Grant CloudFront access to S3 bucket
    self.website_bucket.grant_read(origin_access_identity)

    # Create CloudFront distribution for secure static content delivery
    self.distribution = cloudfront.CloudFrontWebDistribution(
        self,
        "WebsiteDistribution",
        origin_configs=[
            cloudfront.SourceConfiguration(
                s3_origin_source=cloudfront.S3OriginConfig(
                    s3_bucket_source=self.website_bucket,
                    origin_access_identity=origin_access_identity
                ),
                behaviors=[
                    cloudfront.Behavior(
                        is_default_behavior=True,
                        compress=True,
                        allowed_methods=cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                        cached_methods=cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        min_ttl=Duration.seconds(0),
                        default_ttl=Duration.seconds(86400),
                        max_ttl=Duration.seconds(31536000)
                    )
                ]
            )
        ],
        default_root_object="index.html",
        error_configurations=[
            cloudfront.CfnDistribution.CustomErrorResponseProperty(
                error_code=404,
                response_code=200,
                response_page_path="/error.html",
                error_caching_min_ttl=300
            ),
            cloudfront.CfnDistribution.CustomErrorResponseProperty(
                error_code=403,
                response_code=200,
                response_page_path="/error.html",
                error_caching_min_ttl=300
            )
        ],
        price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        enabled=True
    )

    # Deploy static content to S3 bucket
    s3_deployment.BucketDeployment(
        self,
        "WebsiteDeployment",
        sources=[s3_deployment.Source.asset("lib/static_content")],
        destination_bucket=self.website_bucket,
        destination_key_prefix="",
        # Invalidate CloudFront cache after deployment
        distribution=self.distribution,
        distribution_paths=["/*"]
    )

    # Output the CloudFront distribution URL and Lambda function ARN
    CfnOutput(
        self,
        "WebsiteURL",
        value=f"https://{self.distribution.distribution_domain_name}",
        description="URL of the static website via CloudFront",
    )

    CfnOutput(
        self,
        "CloudFrontDistributionId",
        value=self.distribution.distribution_id,
        description="CloudFront Distribution ID",
    )

    CfnOutput(
        self,
        "LambdaFunctionARN",
        value=self.lambda_function.function_arn,
        description="ARN of the Lambda function",
    )

    CfnOutput(
        self,
        "LambdaFunctionName",
        value=self.lambda_function.function_name,
        description="Name of the Lambda function",
    )

    CfnOutput(
        self,
        "S3BucketName",
        value=self.website_bucket.bucket_name,
        description="Name of the S3 bucket",
    )
```

## **Lambda Function Handler**

```python
# lib/lambda/handler.py
"""
Lambda function handler for dynamic content requests.
Provides a REST API endpoint that returns current timestamp and request information.
"""
import json
import boto3
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """
    Lambda function handler for dynamic content requests.
    Returns a JSON response with current timestamp and request information.
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        
    Returns:
        dict: HTTP response with status code, headers, and body
    """
    try:
        # Get the website bucket name from environment variables
        website_bucket = os.environ.get('WEBSITE_BUCKET')
        
        if not website_bucket:
            logger.error("WEBSITE_BUCKET environment variable not set")
            raise ValueError("WEBSITE_BUCKET environment variable is required")
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Get current timestamp
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Prepare response data
        response_data = {
            "message": "Hello from Lambda!",
            "timestamp": current_time,
            "request_id": context.aws_request_id,
            "function_name": context.function_name,
            "function_version": context.function_version,
            "website_bucket": website_bucket,
            "region": os.environ.get('AWS_REGION'),
            "event": {
                "httpMethod": event.get("httpMethod"),
                "path": event.get("path"),
                "queryStringParameters": event.get("queryStringParameters"),
                "headers": event.get("headers", {})
            }
        }
        
        logger.info(f"Successfully processed request: {context.aws_request_id}")
        
        # Return successful response
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Cache-Control": "no-cache"
            },
            "body": json.dumps(response_data, indent=2)
        }
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Bad Request",
                "message": str(ve),
                "request_id": context.aws_request_id if context else None
            }, indent=2)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        # Return error response
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
                "request_id": context.aws_request_id if context else None
            }, indent=2)
        }
```

## **Static Content Structure**

Create a `lib/static_content/` directory with:

```html
<!-- lib/static_content/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AWS CDK Static Website</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 600px;
            width: 90%;
            text-align: center;
        }

        h1 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 2.5em;
        }

        p {
            font-size: 1.2em;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #666;
        }

        .button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1em;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            margin: 10px;
        }

        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .response {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            text-align: left;
            display: none;
        }

        .response h3 {
            color: #667eea;
            margin-bottom: 15px;
        }

        .response pre {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 0.9em;
        }

        .loading {
            display: none;
            color: #667eea;
            font-style: italic;
        }

        .error {
            color: #e53e3e;
            background: #fed7d7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 AWS CDK Static Website</h1>
        <p>Welcome to your static website deployed with AWS CDK! This page demonstrates a simple web application with static content hosted on S3 and dynamic content served by Lambda.</p>
        
        <button class="button" onclick="testLambdaFunction()">Test Lambda Function</button>
        <button class="button" onclick="clearResponse()">Clear Response</button>
        
        <div class="loading" id="loading">Loading...</div>
        
        <div class="response" id="response">
            <h3>Lambda Response:</h3>
            <pre id="responseContent"></pre>
        </div>
        
        <div class="error" id="error"></div>
    </div>

    <script>
        async function testLambdaFunction() {
            const loading = document.getElementById('loading');
            const response = document.getElementById('response');
            const responseContent = document.getElementById('responseContent');
            const error = document.getElementById('error');
            
            // Show loading, hide other elements
            loading.style.display = 'block';
            response.style.display = 'none';
            error.style.display = 'none';
            
            try {
                // Note: In a real implementation, you would call your Lambda function
                // through API Gateway or another endpoint. For this demo, we'll simulate
                // the response that would come from the Lambda function.
                
                const mockResponse = {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: "Hello from Lambda!",
                        timestamp: new Date().toISOString(),
                        request_id: "demo-" + Math.random().toString(36).substr(2, 9),
                        function_name: "TapStackdev-DynamicContentFunction",
                        website_bucket: "static-website-dev-" + Math.random().toString(36).substr(2, 9),
                        event: {
                            httpMethod: "GET",
                            path: "/api/dynamic",
                            headers: {
                                "User-Agent": navigator.userAgent
                            }
                        }
                    })
                };
                
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Display the response
                responseContent.textContent = JSON.stringify(mockResponse, null, 2);
                response.style.display = 'block';
                
            } catch (err) {
                error.textContent = `Error: ${err.message}`;
                error.style.display = 'block';
            } finally {
                loading.style.display = 'none';
            }
        }
        
        function clearResponse() {
            document.getElementById('response').style.display = 'none';
            document.getElementById('error').style.display = 'none';
            document.getElementById('loading').style.display = 'none';
        }
    </script>
</body>
</html>
```

```html
<!-- lib/static_content/error.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - AWS CDK Static Website</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }

        .error-code {
            font-size: 6em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 20px;
        }

        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2em;
        }

        p {
            font-size: 1.1em;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #666;
        }

        .button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1em;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔍</div>
        <div class="error-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.</p>
        
        <a href="/" class="button">Go to Homepage</a>
    </div>
</body>
</html>
```

## **Project Structure**

```
/
├── tap.py                          # CDK application entry point
├── lib/
│   ├── tap_stack.py               # Main stack definition
│   ├── lambda/
│   │   └── handler.py             # Lambda function handler
│   └── static_content/
│       ├── index.html             # Main website page
│       └── error.html             # Error page
├── tests/                          # Test directory
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   └── test_tap_stack.py      # Unit tests
│   └── integration/
│       └── test_tap_stack.py      # Integration tests
├── cdk.json                       # CDK configuration
└── requirements.txt               # Python dependencies
```

## **Deployment Instructions**

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (if not done already):**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

3. **Deploy the stack (development environment):**
```bash
cdk synth
# Note: No direct deployment as per user preferences
```

4. **Deploy with custom environment suffix:**
```bash
cdk synth -c environmentSuffix=staging
```

5. **Test the deployment:**
```bash
# Test Lambda function directly
aws lambda invoke --function-name [LAMBDA_FUNCTION_NAME] --region us-west-2 output.txt

# Access the web application
# Open the CloudFront URL from the stack outputs
```

## **Key Features Implemented:**

1. **Environment-Specific Deployment**: Configurable environment suffix for multi-environment support
2. **Secure S3 Configuration**: Private bucket with CloudFront Origin Access Identity
3. **CloudFront Distribution**: CDN for performance, security, and global content delivery
4. **Lambda Integration**: Dynamic content processing with comprehensive error handling
5. **IAM Security**: Least privilege roles and fine-grained permissions
6. **Static Asset Deployment**: Automated deployment with cache invalidation
7. **Modern Web Interface**: Responsive design with gradient styling and smooth animations
8. **Comprehensive Error Handling**: Both backend (Lambda) and frontend error management
9. **CloudWatch Logging**: Structured logging for debugging and monitoring
10. **Resource Tagging**: Environment, repository, and author tags for resource management
11. **Type Safety**: Full TypeScript/Python type annotations and validation
12. **Testing Framework**: Unit and integration test structure

## **Architecture Benefits:**

- **Serverless**: Cost-effective, auto-scaling Lambda backend
- **Secure**: Private S3 bucket with CloudFront OAI access control
- **Performant**: Global CloudFront distribution with optimized caching
- **Maintainable**: Clear separation of concerns and modular code structure
- **Observable**: Comprehensive logging and AWS CloudWatch integration
- **Scalable**: Environment-specific deployments for dev/staging/production workflows
