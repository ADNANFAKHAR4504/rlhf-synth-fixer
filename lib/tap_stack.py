import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

# Set AWS region explicitly to avoid S3 backend region mismatch error
aws_region = "us-east-1"
provider = aws.Provider("custom", region=aws_region)

# Get availability zones
azs = aws.get_availability_zones(state="available", opts=ResourceOptions(provider=provider))

# Create VPC
vpc = aws.ec2.Vpc(
    "main-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={"Name": "main-vpc"},
    opts=ResourceOptions(provider=provider)
)

# Create public subnets
public_subnet_ids = []
for i in range(2):
    subnet = aws.ec2.Subnet(
        f"public-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,
        tags={"Name": f"public-{i}"},
        opts=ResourceOptions(provider=provider)
    )
    public_subnet_ids.append(subnet.id)

# Create private subnets
private_subnet_ids = []
for i in range(2):
    subnet = aws.ec2.Subnet(
        f"private-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i + 10}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=False,
        tags={"Name": f"private-{i}"},
        opts=ResourceOptions(provider=provider)
    )
    private_subnet_ids.append(subnet.id)

# Create an S3 bucket
bucket = aws.s3.Bucket(
    "lambda-trigger-bucket",
    force_destroy=True,
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        ]
    ),
    opts=ResourceOptions(provider=provider)
)

# IAM Role for Lambda
lambda_role = aws.iam.Role(
    "lambda-exec-role",
    assume_role_policy=pulumi.Output.json_dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Effect": "Allow",
            "Sid": ""
        }]
    }),
    opts=ResourceOptions(provider=provider)
)

# Attach AWSLambdaBasicExecutionRole policy
aws.iam.RolePolicyAttachment(
    "lambda-exec-role-policy",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    opts=ResourceOptions(provider=provider)
)

# Lambda function
lambda_function = aws.lambda_.Function(
    "s3-trigger-lambda",
    runtime="python3.9",
    role=lambda_role.arn,
    handler="index.handler",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "ENV": "dev"
        }
    ),
    opts=ResourceOptions(provider=provider)
)

# S3 event notification for Lambda
aws.s3.BucketNotification(
    "bucket-notification",
    bucket=bucket.id,
    lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
        lambda_function_arn=lambda_function.arn,
        events=["s3:ObjectCreated:*"]
    )],
    opts=ResourceOptions(provider=provider),
    depends_on=[lambda_function]
)

# Permissions for S3 to invoke Lambda
aws.lambda_.Permission(
    "allow-s3-invoke",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="s3.amazonaws.com",
    source_arn=bucket.arn,
    opts=ResourceOptions(provider=provider)
)

# Export key outputs for testability
vpcId = vpc.id
publicSubnetIds = public_subnet_ids
privateSubnetIds = private_subnet_ids
bucketName = bucket.id
lambdaName = lambda_function.name
