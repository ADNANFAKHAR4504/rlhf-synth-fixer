import pulumi
import pulumi_aws as aws

# Get config for environment-specific values (e.g., dev/staging/prod)
config = pulumi.Config()
env = config.require("environment")  # e.g., dev, staging, prod

# Create a new VPC
vpc = aws.ec2.Vpc("mainVpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={"Name": f"{env}-vpc"})

# Get available AZs in us-east-1 region
azs = aws.get_availability_zones(state="available")

# Create two public subnets in different AZs
public_subnets = []
for i in range(2):
    subnet = aws.ec2.Subnet(f"publicSubnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,
        tags={"Name": f"{env}-public-subnet-{i}"})
    public_subnets.append(subnet)

# Create two private subnets in different AZs
private_subnets = []
for i in range(2, 4):
    subnet = aws.ec2.Subnet(f"privateSubnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=azs.names[i - 2],
        tags={"Name": f"{env}-private-subnet-{i}"})
    private_subnets.append(subnet)

# Create an S3 bucket with server-side encryption
bucket = aws.s3.Bucket("processingBucket",
    server_side_encryption_configuration={
        "rule": {
            "applyServerSideEncryptionByDefault": {"sseAlgorithm": "AES256"},
        },
    },
    tags={"Environment": env})

# Create an IAM role for the Lambda with least privilege permissions
lambda_role = aws.iam.Role("lambdaExecutionRole",
    assume_role_policy=pulumi.Output.all().apply(
        lambda _: aws.iam.get_policy_document(statements=[{
            "actions": ["sts:AssumeRole"],
            "principals": [{"type": "Service", "identifiers": ["lambda.amazonaws.com"]}],
        }]).json),
    tags={"Environment": env})

# Attach a managed policy allowing basic Lambda execution + S3 read + CloudWatch logs
aws.iam.RolePolicyAttachment("lambdaBasicExecution",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")

aws.iam.RolePolicyAttachment("lambdaS3Access",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess")

# Create Lambda function to process S3 object uploads
lambda_function = aws.lambda_.Function("s3EventProcessor",
    role=lambda_role.arn,
    runtime="python3.9",
    handler="index.handler",
    timeout=60,
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda"),  # expects your code in ./lambda/
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={"ENV": env},
    ),
    tags={"Environment": env})

# Give S3 permission to invoke the Lambda on ObjectCreated events
lambda_permission = aws.lambda_.Permission("allowS3InvokeLambda",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="s3.amazonaws.com",
    source_arn=bucket.arn)

# Create S3 bucket notification to trigger Lambda on object creation
bucket_notification = aws.s3.BucketNotification("bucketNotification",
    bucket=bucket.id,
    lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
        lambda_function_arn=lambda_function.arn,
        events=["s3:ObjectCreated:*"],
    )],
    opts=pulumi.ResourceOptions(depends_on=[lambda_permission]))

# Enable CloudWatch log group for the Lambda
log_group = aws.cloudwatch.LogGroup("lambdaLogGroup",
    name=f"/aws/lambda/{lambda_function.name}",
    retention_in_days=14,
    tags={"Environment": env})

# Export key resources
pulumi.export("vpcId", vpc.id)
pulumi.export("publicSubnetIds", [s.id for s in public_subnets])
pulumi.export("privateSubnetIds", [s.id for s in private_subnets])
pulumi.export("bucketName", bucket.bucket)
pulumi.export("lambdaName", lambda_function.name)
