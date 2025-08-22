# Pulumi Python Infrastructure Code

This file contains the complete Pulumi Python infrastructure code from the lib folder.

## __init__.py

```python
# Empty __init__.py file to make lib a proper Python package
```

## tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
  environment_suffix (Optional[str]): An optional suffix for identifying
    the deployment environment (e.g., 'dev', 'prod').
  tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component creates and manages the exact AWS infrastructure specified
  in the original prompt requirements:

  - Lambda Function with "Hello from Lambda" response (Python 3.8)
  - API Gateway HTTP API with GET / endpoint
  - S3 static website with hardcoded index.html
  - RDS PostgreSQL database (version 14+, publicly accessible, 7-day backups)
  - IAM role for Lambda with AWSLambdaBasicExecutionRole
  - All resources deployed in us-west-2 region
  - Exports: S3 website URL, API Gateway URL, RDS endpoint

  Args:
  name (str): The logical name of this Pulumi component.
  args (TapStackArgs): Configuration arguments including environment suffix
    and tags.
  opts (ResourceOptions): Pulumi options.
  """

  # pylint: disable=too-many-instance-attributes

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags or {}

    # Example usage of suffix and tags
    # You would replace this with instantiation of imported components
    # like DynamoDBStack
    #
    # Create comprehensive AWS infrastructure with integrated inventory
    # management and simple demo
    self._create_infrastructure()

  def _create_infrastructure(self):
    """Create AWS infrastructure exactly as specified in prompt."""

    environment = self.environment_suffix

    # Resource naming convention: simple-demo-{resource-type}-{environment}
    def get_resource_name(resource_type: str) -> str:
      """Generate a standardized resource name."""
      return f"simple-demo-{resource_type}-{environment}"

    # Helper function to create base tags
    def get_base_tags():
      """Create standardized base tags for all resources."""
      return {
          "Environment": environment,
          "Project": "simple-demo",
          "ManagedBy": "Pulumi",
          **self.tags
      }

    # === EXACT PROMPT IMPLEMENTATION ===

    # 1. Create IAM Role for Lambda function (as required by prompt)
    self.lambda_role = aws.iam.Role(
        get_resource_name("lambda-role"),
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ]
        }),
        tags=get_base_tags(),
        opts=ResourceOptions(parent=self)
    )

    # Attach AWSLambdaBasicExecutionRole policy (as required by prompt)
    self.lambda_role_policy_attachment = aws.iam.RolePolicyAttachment(
        get_resource_name("lambda-role-policy"),
        role=self.lambda_role.name,
        policy_arn=(
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ),
        opts=ResourceOptions(parent=self)
    )

    # 2. Create Lambda function with "Hello from Lambda" response
    # (exact prompt requirement)
    lambda_function_code = """
import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps('Hello from Lambda!')
    }
"""

    self.lambda_function = aws.lambda_.Function(
        get_resource_name("hello-lambda"),
        runtime="python3.8",  # Exact version from prompt
        code=pulumi.AssetArchive({
            "lambda_function.py": pulumi.StringAsset(lambda_function_code)
        }),
        handler="lambda_function.lambda_handler",
        role=self.lambda_role.arn,
        tags=get_base_tags(),
        opts=ResourceOptions(
            parent=self,
            depends_on=[self.lambda_role_policy_attachment]
        )
    )

    # 3. Create API Gateway HTTP API (as required by prompt)
    self.api_gateway = aws.apigatewayv2.Api(
        get_resource_name("hello-api"),
        protocol_type="HTTP",
        tags=get_base_tags(),
        opts=ResourceOptions(parent=self)
    )

    # Create API Gateway integration with Lambda
    self.api_integration = aws.apigatewayv2.Integration(
        get_resource_name("lambda-integration"),
        api_id=self.api_gateway.id,
        integration_type="AWS_PROXY",
        integration_method="POST",
        integration_uri=self.lambda_function.invoke_arn,
        opts=ResourceOptions(parent=self)
    )

    # Create API Gateway route for GET / (exact prompt requirement)
    self.api_route = aws.apigatewayv2.Route(
        get_resource_name("hello-route"),
        api_id=self.api_gateway.id,
        route_key="GET /",
        target=self.api_integration.id.apply(lambda id: f"integrations/{id}"),
        opts=ResourceOptions(parent=self)
    )

    # Create API Gateway stage
    self.api_stage = aws.apigatewayv2.Stage(
        get_resource_name("hello-stage"),
        api_id=self.api_gateway.id,
        name="$default",
        auto_deploy=True,
        opts=ResourceOptions(parent=self)
    )

    # Grant API Gateway permission to invoke Lambda (required)
    self.lambda_permission = aws.lambda_.Permission(
        get_resource_name("api-gateway-lambda-permission"),
        action="lambda:InvokeFunction",
        function=self.lambda_function.name,
        principal="apigateway.amazonaws.com",
        source_arn=self.api_gateway.execution_arn.apply(
            lambda arn: f"{arn}/*/*"
        ),
        opts=ResourceOptions(parent=self)
    )

    # 4. Create S3 bucket for static website hosting (as required by prompt)
    self.s3_bucket = aws.s3.Bucket(
        get_resource_name("static-website"),
        tags=get_base_tags(),
        opts=ResourceOptions(parent=self)
    )

    # Configure S3 bucket website using modern approach
    self.s3_website_config = aws.s3.BucketWebsiteConfigurationV2(
        get_resource_name("website-config"),
        bucket=self.s3_bucket.id,
        index_document=aws.s3.BucketWebsiteConfigurationV2IndexDocumentArgs(
            suffix="index.html"
        ),
        opts=ResourceOptions(parent=self)
    )

    # Configure S3 bucket for public read access (as required by prompt)
    self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
        get_resource_name("bucket-public-access"),
        bucket=self.s3_bucket.id,
        block_public_acls=False,
        block_public_policy=False,
        ignore_public_acls=False,
        restrict_public_buckets=False,
        opts=ResourceOptions(parent=self)
    )

    # Create bucket policy for public read access
    self.bucket_policy = aws.s3.BucketPolicy(
        get_resource_name("bucket-policy"),
        bucket=self.s3_bucket.id,
        policy=self.s3_bucket.id.apply(lambda bucket_name: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        })),
        opts=ResourceOptions(
            parent=self,
            depends_on=[self.bucket_public_access_block]
        )
    )

    # Upload index.html with hardcoded content (exact prompt requirement)
    index_html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Simple Demo Static Website</title>
</head>
<body>
    <h1>Hello from S3 Static Website!</h1>
    <p>This is a simple static website hosted on Amazon S3.</p>
    <p>Demo infrastructure includes Lambda, API Gateway, S3, and RDS.</p>
</body>
</html>"""

    self.index_html_object = aws.s3.BucketObject(
        get_resource_name("index-html"),
        bucket=self.s3_bucket.id,
        key="index.html",
        content=index_html_content,
        content_type="text/html",
        opts=ResourceOptions(parent=self)
    )

    # 5. Get default VPC for RDS (as required by prompt)
    default_vpc = aws.ec2.get_vpc(default=True)

    # Create DB subnet group for RDS (required for RDS)
    self.db_subnet_group = aws.rds.SubnetGroup(
        get_resource_name("db-subnet-group"),
        subnet_ids=aws.ec2.get_subnets(
            filters=[
                aws.ec2.GetSubnetsFilterArgs(
                    name="vpc-id",
                    values=[default_vpc.id]
                )
            ]
        ).ids,
        tags=get_base_tags(),
        opts=ResourceOptions(parent=self)
    )

    # Create security group for RDS
    self.rds_security_group = aws.ec2.SecurityGroup(
        get_resource_name("rds-security-group"),
        description="Allow PostgreSQL traffic for simple demo",
        vpc_id=default_vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"]  # For demo purposes as specified
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )
        ],
        tags=get_base_tags(),
        opts=ResourceOptions(parent=self)
    )

    # 6. Create RDS PostgreSQL instance (exact prompt specifications)
    self.rds_instance = aws.rds.Instance(
        get_resource_name("postgres-db"),
        allocated_storage=20,
        storage_type="gp2",
        engine="postgres",
        engine_version="15.7",  # Version 14 or higher as required
        instance_class="db.t3.micro",
        db_name="simpledemo",
        username="demouser",
        password="demopassword123",  # Default username/password for testing
        vpc_security_group_ids=[self.rds_security_group.id],
        db_subnet_group_name=self.db_subnet_group.name,
        publicly_accessible=True,  # Publicly accessible for simplicity
        backup_retention_period=7,  # 7-day retention as required
        backup_window="03:00-04:00",
        maintenance_window="sun:04:00-sun:05:00",
        skip_final_snapshot=True,
        tags=get_base_tags(),
        opts=ResourceOptions(parent=self)
    )

    # Create outputs exactly as required by prompt
    self.s3_website_url = self.s3_bucket.bucket_domain_name.apply(
        lambda domain: f"http://{domain}"
    )
    self.api_gateway_url = self.api_gateway.api_endpoint
    self.rds_endpoint = self.rds_instance.endpoint

    # Register outputs
    self.register_outputs({
        "s3_website_url": self.s3_website_url,
        "api_gateway_url": self.api_gateway_url,
        "rds_endpoint": self.rds_endpoint,
        "environment": environment
    })

    # Export the three required outputs exactly as specified in prompt
    pulumi.export("s3_website_url", self.s3_website_url)
    pulumi.export("api_gateway_url", self.api_gateway_url)
    pulumi.export("rds_endpoint", self.rds_endpoint)
```
