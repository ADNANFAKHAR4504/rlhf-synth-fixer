import pulumi
import pulumi_aws as aws
import json
import base64

# Configure AWS provider for us-west-2 region
aws_provider = aws.Provider("aws-provider", region="us-west-2")

# Create IAM Role for Lambda function
lambda_role = aws.iam.Role(
    "lambda-role",
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
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Attach AWSLambdaBasicExecutionRole policy to the Lambda role
lambda_role_policy_attachment = aws.iam.RolePolicyAttachment(
    "lambda-role-policy-attachment",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create Lambda function with inline code
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

lambda_function = aws.lambda_.Function(
    "hello-lambda",
    runtime="python3.8",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(lambda_function_code)
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[lambda_role_policy_attachment]
    )
)

# Create API Gateway HTTP API
api_gateway = aws.apigatewayv2.Api(
    "hello-api",
    protocol_type="HTTP",
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create API Gateway integration with Lambda
api_integration = aws.apigatewayv2.Integration(
    "lambda-integration",
    api_id=api_gateway.id,
    integration_type="AWS_PROXY",
    integration_method="POST",
    integration_uri=lambda_function.invoke_arn,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create API Gateway route
api_route = aws.apigatewayv2.Route(
    "hello-route",
    api_id=api_gateway.id,
    route_key="GET /",
    target=api_integration.id.apply(lambda id: f"integrations/{id}"),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create API Gateway stage
api_stage = aws.apigatewayv2.Stage(
    "hello-stage",
    api_id=api_gateway.id,
    name="$default",
    auto_deploy=True,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Grant API Gateway permission to invoke Lambda
lambda_permission = aws.lambda_.Permission(
    "api-gateway-lambda-permission",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=api_gateway.execution_arn.apply(lambda arn: f"{arn}/*/*"),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create S3 bucket for static website hosting
s3_bucket = aws.s3.Bucket(
    "static-website-bucket",
    website=aws.s3.BucketWebsiteArgs(
        index_document="index.html"
    ),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Configure S3 bucket for public read access
bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    "bucket-public-access-block",
    bucket=s3_bucket.id,
    block_public_acls=False,
    block_public_policy=False,
    ignore_public_acls=False,
    restrict_public_buckets=False,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create bucket policy for public read access
bucket_policy = aws.s3.BucketPolicy(
    "bucket-policy",
    bucket=s3_bucket.id,
    policy=s3_bucket.id.apply(lambda bucket_name: json.dumps({
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
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[bucket_public_access_block]
    )
)

# Upload index.html to S3 bucket
index_html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Static Website</title>
</head>
<body>
    <h1>Hello from S3 Static Website!</h1>
    <p>This is a simple static website hosted on Amazon S3.</p>
</body>
</html>
"""

index_html_object = aws.s3.BucketObject(
    "index-html",
    bucket=s3_bucket.id,
    key="index.html",
    content=index_html_content,
    content_type="text/html",
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create DB subnet group for RDS
db_subnet_group = aws.rds.SubnetGroup(
    "db-subnet-group",
    subnet_ids=[
        # Get default VPC subnets
        aws.ec2.get_subnets(
            filters=[
                aws.ec2.GetSubnetsFilterArgs(
                    name="vpc-id",
                    values=[aws.ec2.get_vpc(default=True).id]
                )
            ]
        ).ids[0],
        aws.ec2.get_subnets(
            filters=[
                aws.ec2.GetSubnetsFilterArgs(
                    name="vpc-id",
                    values=[aws.ec2.get_vpc(default=True).id]
                )
            ]
        ).ids[1]
    ],
    tags={
        "Name": "DB subnet group"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create security group for RDS
rds_security_group = aws.ec2.SecurityGroup(
    "rds-security-group",
    description="Allow PostgreSQL traffic",
    vpc_id=aws.ec2.get_vpc(default=True).id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
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
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create RDS PostgreSQL instance
rds_instance = aws.rds.Instance(
    "postgres-db",
    allocated_storage=20,
    storage_type="gp2",
    engine="postgres",
    engine_version="14.9",
    instance_class="db.t3.micro",
    db_name="testdb",
    username="testuser",
    password="testpassword123",
    vpc_security_group_ids=[rds_security_group.id],
    db_subnet_group_name=db_subnet_group.name,
    publicly_accessible=True,
    backup_retention_period=7,
    backup_window="03:00-04:00",
    maintenance_window="sun:04:00-sun:05:00",
    skip_final_snapshot=True,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Export stack outputs
pulumi.export("s3_website_url", s3_bucket.website_endpoint.apply(lambda endpoint: f"http://{endpoint}"))
pulumi.export("api_gateway_url", api_gateway.api_endpoint)
pulumi.export("rds_endpoint", rds_instance.endpoint)