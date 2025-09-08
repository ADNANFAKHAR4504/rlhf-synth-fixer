""" Pulumi Infrastructure as Code - Serverless Application with Lambda and S3 Integration File: tap_stack.py

This module creates a production-ready serverless application that automatically processes files uploaded to an S3 bucket using Lambda functions with comprehensive security, monitoring, and error handling capabilities. """

```python
import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

# Configuration and constants
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()
environment = config.get("environment") or "production"

# Common tags for all resources
common_tags = {
    "Project": project_name,
    "Stack": stack_name,
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "Purpose": "ServerlessFileProcessing"
}

class ServerlessFileProcessingStack:
    def __init__(self):
        """Initialize the serverless file processing infrastructure stack."""
        
        # Create VPC and networking components first
        self._create_networking()
        
        # Create IAM roles and policies
        self._create_iam_resources()
        
        # Create Secrets Manager secret
        self._create_secrets()
        
        # Create S3 bucket
        self._create_s3_bucket()
        
        # Create Lambda function
        self._create_lambda_function()
        
        # Create CloudWatch resources
        self._create_monitoring()
        
        # Configure S3 event notifications
        self._configure_s3_notifications()
        
        # Export important outputs
        self._create_outputs()

    def _create_networking(self):
        """Create VPC, subnets, and security groups for Lambda function."""
        
        # Create VPC for secure Lambda execution
        self.vpc = aws.ec2.Vpc(
            "file-processor-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"{project_name}-vpc"}
        )
        
        # Create private subnets for Lambda (multi-AZ for high availability)
        self.private_subnet_1 = aws.ec2.Subnet(
            "private-subnet-1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=False,
            tags={**common_tags, "Name": f"{project_name}-private-subnet-1"}
        )
        
        self.private_subnet_2 = aws.ec2.Subnet(
            "private-subnet-2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=False,
            tags={**common_tags, "Name": f"{project_name}-private-subnet-2"}
        )
        
        # Create Internet Gateway and NAT Gateway for outbound internet access
        self.igw = aws.ec2.InternetGateway(
            "internet-gateway",
            vpc_id=self.vpc.id,
            tags={**common_tags, "Name": f"{project_name}-igw"}
        )
        
        # Public subnet for NAT Gateway
        self.public_subnet = aws.ec2.Subnet(
            "public-subnet",
            vpc_id=self.vpc.id,
            cidr_block="10.0.100.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"{project_name}-public-subnet"}
        )
        
        # Elastic IP for NAT Gateway
        self.nat_eip = aws.ec2.Eip(
            "nat-eip",
            domain="vpc",
            tags={**common_tags, "Name": f"{project_name}-nat-eip"}
        )
        
        # NAT Gateway
        self.nat_gateway = aws.ec2.NatGateway(
            "nat-gateway",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnet.id,
            tags={**common_tags, "Name": f"{project_name}-nat-gateway"}
        )
        
        # Route tables
        self.public_route_table = aws.ec2.RouteTable(
            "public-route-table",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-public-rt"}
        )
        
        self.private_route_table = aws.ec2.RouteTable(
            "private-route-table",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-private-rt"}
        )
        
        # Route table associations
        aws.ec2.RouteTableAssociation(
            "public-rta",
            subnet_id=self.public_subnet.id,
            route_table_id=self.public_route_table.id
        )
        
        aws.ec2.RouteTableAssociation(
            "private-rta-1",
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_route_table.id
        )
        
        aws.ec2.RouteTableAssociation(
            "private-rta-2",
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_route_table.id
        )
        
        # Security group for Lambda function
        self.lambda_security_group = aws.ec2.SecurityGroup(
            "lambda-security-group",
            name=f"{project_name}-lambda-sg",
            description="Security group for file processing Lambda function",
            vpc_id=self.vpc.id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-lambda-sg"}
        )

    def _create_iam_resources(self):
        """Create IAM roles and policies following least privilege principle."""
        
        # Lambda execution role
        lambda_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        })
        
        self.lambda_role = aws.iam.Role(
            "lambda-execution-role",
            name=f"{project_name}-lambda-role",
            assume_role_policy=lambda_assume_role_policy,
            description="IAM role for file processing Lambda function",
            tags=common_tags
        )
        
        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            "lambda-basic-execution",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )
        
        # Attach VPC access execution policy
        aws.iam.RolePolicyAttachment(
            "lambda-vpc-access",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )
        
        # Custom policy for S3 and Secrets Manager access
        lambda_custom_policy = aws.iam.Policy(
            "lambda-custom-policy",
            name=f"{project_name}-lambda-policy",
            description="Custom policy for Lambda function permissions",
            policy=Output.all(
                bucket_arn=lambda: f"arn:aws:s3:::{project_name}-file-uploads-bucket",
                secrets_arn=lambda: f"arn:aws:secretsmanager:us-east-1:*:secret:{project_name}-app-secrets-*"
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": [
                            f"{args['bucket_arn']}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": [
                            args['secrets_arn']
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })),
            tags=common_tags
        )
        
        # Attach custom policy to Lambda role
        aws.iam.RolePolicyAttachment(
            "lambda-custom-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=lambda_custom_policy.arn
        )

    def _create_secrets(self):
        """Create and configure AWS Secrets Manager secret."""
        
        self.app_secret = aws.secretsmanager.Secret(
            "app-secrets",
            name=f"{project_name}-app-secrets",
            description="Secrets for file processing application",
            kms_key_id="alias/aws/secretsmanager",  # Use AWS managed key for encryption
            tags=common_tags
        )
        
        # Create initial secret version with placeholder values
        self.secret_version = aws.secretsmanager.SecretVersion(
            "app-secrets-version",
            secret_id=self.app_secret.id,
            secret_string=json.dumps({
                "database_url": "placeholder_database_url",
                "api_key": "placeholder_api_key",
                "encryption_key": "placeholder_encryption_key"
            })
        )

    def _create_s3_bucket(self):
        """Create S3 bucket with security best practices."""
        
        # S3 bucket for file uploads
        self.s3_bucket = aws.s3.Bucket(
            "file-uploads-bucket",
            bucket=f"{project_name}-file-uploads-bucket",
            tags=common_tags
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            "bucket-public-access-block",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        # Enable versioning
        aws.s3.BucketVersioningV2(
            "bucket-versioning",
            bucket=self.s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )
        
        # Server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            "bucket-encryption",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True
                )
            ]
        )
        
        # Lifecycle configuration
        aws.s3.BucketLifecycleConfigurationV2(
            "bucket-lifecycle",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="delete_old_versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=90
                    )
                )
            ]
        )

    def _create_lambda_function(self):
        """Create Lambda function with comprehensive configuration."""
        
        # Lambda function code
        lambda_code = '''
import json
import boto3
import logging
import os
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

def get_secret(secret_name: str) -> Dict[str, Any]:
    """Retrieve secret from AWS Secrets Manager."""
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Error retrieving secret {secret_name}: {str(e)}")
        raise

def process_file(bucket: str, key: str) -> Dict[str, Any]:
    """Process uploaded file."""
    try:
        logger.info(f"Processing file: {key} from bucket: {bucket}")
        
        # Get file object
        response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = response['Body'].read()
        
        # Get application secrets
        secret_name = os.environ['SECRET_NAME']
        secrets = get_secret(secret_name)
        
        # Perform file processing logic here
        file_size = len(file_content)
        file_type = key.split('.')[-1] if '.' in key else 'unknown'
        
        logger.info(f"File processed successfully: {key}, Size: {file_size} bytes, Type: {file_type}")
        
        # You can add more processing logic here:
        # - Image processing
        # - Data validation
        # - Format conversion
        # - Database updates
        
        return {
            'statusCode': 200,
            'file': key,
            'size': file_size,
            'type': file_type,
            'processed': True
        }
        
    except Exception as e:
        logger.error(f"Error processing file {key}: {str(e)}")
        raise

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main Lambda handler function."""
    try:
        logger.info(f"Lambda function invoked with event: {json.dumps(event)}")
        
        results = []
        
        # Process each S3 record
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                
                # Skip if it's a delete event
                if record['eventName'].startswith('ObjectRemoved'):
                    logger.info(f"Skipping delete event for {key}")
                    continue
                
                result = process_file(bucket, key)
                results.append(result)
        
        logger.info(f"Successfully processed {len(results)} files")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Files processed successfully',
                'results': results
            })
        }
        
    except Exception as e:
        logger.error(f"Lambda execution failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e)
            })
        }
'''
        
        # Create CloudWatch log group
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            "lambda-log-group",
            name=f"/aws/lambda/{project_name}-file-processor",
            retention_in_days=30,
            tags=common_tags
        )
        
        # Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            "file-processor-lambda",
            name=f"{project_name}-file-processor",
            runtime="python3.9",
            handler="index.lambda_handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            role=self.lambda_role.arn,
            timeout=300,  # 5 minutes
            memory_size=256,  # MB
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SECRET_NAME": self.app_secret.name,
                    "LOG_LEVEL": "INFO"
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[
                    self.private_subnet_1.id,
                    self.private_subnet_2.id
                ],
                security_group_ids=[self.lambda_security_group.id]
            ),
            description="Processes files uploaded to S3 bucket",
            tags=common_tags,
            opts=ResourceOptions(depends_on=[self.lambda_log_group])
        )

    def _create_monitoring(self):
        """Create CloudWatch alarms and monitoring resources."""
        
        # Lambda error alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            "lambda-error-alarm",
            name=f"{project_name}-lambda-errors",
            description="Lambda function error rate alarm",
            metric_name="Errors",
            namespace="AWS/Lambda",
            statistic="Sum",
            period=300,  # 5 minutes
            evaluation_periods=2,
            threshold=1,
            comparison_operator="GreaterThanOrEqualToThreshold",
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            alarm_actions=[],  # Add SNS topic ARN here for notifications
            tags=common_tags
        )
        
        # Lambda duration alarm
        self.lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
            "lambda-duration-alarm",
            name=f"{project_name}-lambda-duration",
            description="Lambda function duration alarm",
            metric_name="Duration",
            namespace="AWS/Lambda",
            statistic="Average",
            period=300,
            evaluation_periods=2,
            threshold=60000,  # 1 minute in milliseconds
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            alarm_actions=[],  # Add SNS topic ARN here for notifications
            tags=common_tags
        )
        
        # Lambda throttles alarm
        self.lambda_throttle_alarm = aws.cloudwatch.MetricAlarm(
            "lambda-throttle-alarm",
            name=f"{project_name}-lambda-throttles",
            description="Lambda function throttle alarm",
            metric_name="Throttles",
            namespace="AWS/Lambda",
            statistic="Sum",
            period=300,
            evaluation_periods=1,
            threshold=1,
            comparison_operator="GreaterThanOrEqualToThreshold",
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            alarm_actions=[],  # Add SNS topic ARN here for notifications
            tags=common_tags
        )

    def _configure_s3_notifications(self):
        """Configure S3 bucket notifications to trigger Lambda function."""
        
        # Lambda permission for S3 to invoke the function
        aws.lambda_.Permission(
            "s3-invoke-lambda-permission",
            statement_id="AllowExecutionFromS3Bucket",
            action="lambda:InvokeFunction",
            function=self.lambda_function.arn,
            principal="s3.amazonaws.com",
            source_arn=self.s3_bucket.arn
        )
        
        # S3 bucket notification configuration
        aws.s3.BucketNotification(
            "bucket-notification",
            bucket=self.s3_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=self.lambda_function.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix="uploads/",  # Only trigger for files in uploads/ prefix
                    filter_suffix=""  # Process all file types
                )
            ],
            opts=ResourceOptions(depends_on=[self.lambda_function])
        )

    def _create_outputs(self):
        """Export important stack outputs."""
        
        pulumi.export("s3_bucket_name", self.s3_bucket.bucket)
        pulumi.export("s3_bucket_arn", self.s3_bucket.arn)
        pulumi.export("lambda_function_name", self.lambda_function.name)
        pulumi.export("lambda_function_arn", self.lambda_function.arn)
        pulumi.export("secret_name", self.app_secret.name)
        pulumi.export("vpc_id", self.vpc.id)
        pulumi.export("lambda_log_group", self.lambda_log_group.name)
        
        # Output useful information for testing
        pulumi.export("test_upload_command", 
            self.s3_bucket.bucket.apply(
                lambda bucket_name: f"aws s3 cp <your-file> s3://{bucket_name}/uploads/"
            )
        )

# Initialize the stack
stack = ServerlessFileProcessingStack()
