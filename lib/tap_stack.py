"""
Complete AWS Infrastructure Stack with S3, Lambda, VPC, and CloudWatch
Production-ready configuration with proper security and networking
"""

import json
import os
from typing import Any, Dict

import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, export


class TapStack:
    """Main infrastructure stack for TAP (Transform and Process) application"""
    
    def __init__(self):
        self.config = Config()
        self.stage = os.getenv('STAGE', 'dev')
        self.project_name = pulumi.get_project()
        
        # Common tags for all resources
        self.common_tags = {
            'Project': self.project_name,
            'Stage': self.stage,
            'ManagedBy': 'Pulumi'
        }
        
        # Initialize infrastructure components
        self.vpc = self._create_vpc()
        self.s3_bucket = self._create_s3_bucket()
        self.lambda_function = self._create_lambda_function()
        self.cloudwatch_logs = self._create_cloudwatch_logs()
        
        # Export important values
        self._export_outputs()
    
    def _create_vpc(self) -> Dict[str, Any]:
        """Create VPC with public/private subnets across 2 AZs"""
        
        # Main VPC
        vpc = aws.ec2.Vpc(
            f"{self.project_name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, 'Name': f"{self.project_name}-vpc"}
        )
        
        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{self.project_name}-igw",
            vpc_id=vpc.id,
            tags={**self.common_tags, 'Name': f"{self.project_name}-igw"}
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Public subnets (2 AZs)
        public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"{self.project_name}-public-subnet-{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.common_tags, 'Name': f"{self.project_name}-public-subnet-{i+1}"}
            )
            public_subnets.append(subnet)
        
        # Private subnets (2 AZs)
        private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"{self.project_name}-private-subnet-{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**self.common_tags, 'Name': f"{self.project_name}-private-subnet-{i+1}"}
            )
            private_subnets.append(subnet)
        
        # Elastic IP for NAT Gateway
        nat_eip = aws.ec2.Eip(
            f"{self.project_name}-nat-eip",
            domain="vpc",
            tags={**self.common_tags, 'Name': f"{self.project_name}-nat-eip"}
        )
        
        # NAT Gateway in first public subnet
        nat_gateway = aws.ec2.NatGateway(
            f"{self.project_name}-nat-gateway",
            allocation_id=nat_eip.id,
            subnet_id=public_subnets[0].id,
            tags={**self.common_tags, 'Name': f"{self.project_name}-nat-gateway"}
        )
        
        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"{self.project_name}-public-rt",
            vpc_id=vpc.id,
            tags={**self.common_tags, 'Name': f"{self.project_name}-public-rt"}
        )
        
        # Public route to IGW
        aws.ec2.Route(
            f"{self.project_name}-public-route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.project_name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        # Private route table
        private_rt = aws.ec2.RouteTable(
            f"{self.project_name}-private-rt",
            vpc_id=vpc.id,
            tags={**self.common_tags, 'Name': f"{self.project_name}-private-rt"}
        )
        
        # Private route to NAT Gateway
        aws.ec2.Route(
            f"{self.project_name}-private-route",
            route_table_id=private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )
        
        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.project_name}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )
        
        return {
            'vpc': vpc,
            'igw': igw,
            'public_subnets': public_subnets,
            'private_subnets': private_subnets,
            'nat_gateway': nat_gateway,
            'public_rt': public_rt,
            'private_rt': private_rt
        }
    
    def _create_s3_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket with encryption, versioning, and security settings"""
        
        # S3 bucket
        bucket = aws.s3.Bucket(
            f"{self.project_name}-bucket",
            bucket=f"{self.project_name}-{self.stage}-{pulumi.get_stack()}",
            tags=self.common_tags
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.project_name}-bucket-pab",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        # Enable versioning
        aws.s3.BucketVersioningV2(
            f"{self.project_name}-bucket-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )
        
        # Server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"{self.project_name}-bucket-encryption",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )]
        )
        
        # Lifecycle configuration
        aws.s3.BucketLifecycleConfigurationV2(
            f"{self.project_name}-bucket-lifecycle",
            bucket=bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="delete_old_versions",
                status="Enabled",
                noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=30
                )
            )]
        )
        
        return bucket
    
    def _create_lambda_function(self) -> aws.lambda_.Function:
        """Create Lambda function with S3 trigger and proper IAM role"""
        
        # Lambda execution role
        lambda_role = aws.iam.Role(
            f"{self.project_name}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=self.common_tags
        )
        
        # Lambda policy for S3 and CloudWatch
        lambda_policy = aws.iam.Policy(
            f"{self.project_name}-lambda-policy",
            policy=pulumi.Output.all(self.s3_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject"
                            ],
                            "Resource": f"{args[0]}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:ListBucket"
                            ],
                            "Resource": args[0]
                        }
                    ]
                })
            )
        )
        
        # Attach policy to role
        aws.iam.RolePolicyAttachment(
            f"{self.project_name}-lambda-policy-attachment",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )
        
        # Lambda function code
        lambda_code = """
import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"
    Process S3 events and transform data
    \"\"\"
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Process each record in the event
        processed_files = []
        
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for {object_key} in {bucket_name}")
                
                # Skip processing for certain file types or paths
                if should_skip_processing(object_key):
                    logger.info(f"Skipping processing for {object_key}")
                    continue
                
                # Process the file based on event type
                if event_name.startswith('ObjectCreated'):
                    result = process_created_object(bucket_name, object_key)
                elif event_name.startswith('ObjectRemoved'):
                    result = process_removed_object(bucket_name, object_key)
                else:
                    logger.warning(f"Unhandled event type: {event_name}")
                    continue
                
                processed_files.append({
                    'bucket': bucket_name,
                    'key': object_key,
                    'event': event_name,
                    'result': result,
                    'timestamp': datetime.utcnow().isoformat()
                })
        
        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 events',
                'processed_files': processed_files,
                'total_processed': len(processed_files)
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to process S3 events'
            })
        }

def should_skip_processing(object_key: str) -> bool:
    \"\"\"
    Determine if file should be skipped based on key patterns
    \"\"\"
    skip_patterns = [
        'processed/',
        'temp/',
        '.tmp',
        'logs/',
        '_$folder$'  # S3 console folder markers
    ]
    
    return any(pattern in object_key for pattern in skip_patterns)

def process_created_object(bucket_name: str, object_key: str) -> Dict[str, Any]:
    \"\"\"
    Process newly created S3 objects
    \"\"\"
    try:
        # Get object metadata
        response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
        file_size = response['ContentLength']
        content_type = response.get('ContentType', 'unknown')
        
        logger.info(f"Processing created object: {object_key} ({file_size} bytes, {content_type})")
        
        # Example processing: create a processed marker file
        processed_key = f"processed/{object_key}.processed"
        
        # Create processing metadata
        processing_metadata = {
            'original_key': object_key,
            'file_size': file_size,
            'content_type': content_type,
            'processed_at': datetime.utcnow().isoformat(),
            'processor': 'tap-lambda-function'
        }
        
        # Upload processed marker
        s3_client.put_object(
            Bucket=bucket_name,
            Key=processed_key,
            Body=json.dumps(processing_metadata),
            ContentType='application/json'
        )
        
        return {
            'action': 'processed',
            'processed_key': processed_key,
            'metadata': processing_metadata
        }
        
    except Exception as e:
        logger.error(f"Error processing created object {object_key}: {str(e)}")
        raise

def process_removed_object(bucket_name: str, object_key: str) -> Dict[str, Any]:
    \"\"\"
    Process removed S3 objects
    \"\"\"
    try:
        logger.info(f"Processing removed object: {object_key}")
        
        # Clean up any associated processed files
        processed_key = f"processed/{object_key}.processed"
        
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=processed_key)
            logger.info(f"Cleaned up processed file: {processed_key}")
        except s3_client.exceptions.NoSuchKey:
            logger.info(f"No processed file to clean up: {processed_key}")
        
        return {
            'action': 'cleanup',
            'cleaned_key': processed_key
        }
        
    except Exception as e:
        logger.error(f"Error processing removed object {object_key}: {str(e)}")
        raise
"""
        
        # Lambda function
        lambda_function = aws.lambda_.Function(
            f"{self.project_name}-lambda",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(lambda_code)
            }),
            handler="lambda_function.lambda_handler",
            role=lambda_role.arn,
            timeout=300,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "STAGE": self.stage,
                    "PROJECT_NAME": self.project_name
                }
            ),
            tags=self.common_tags
        )
        
        # S3 bucket notification permission for Lambda
        aws.lambda_.Permission(
            f"{self.project_name}-lambda-s3-permission",
            statement_id="AllowExecutionFromS3Bucket",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="s3.amazonaws.com",
            source_arn=self.s3_bucket.arn
        )
        
        # S3 bucket notification configuration
        aws.s3.BucketNotification(
            f"{self.project_name}-bucket-notification",
            bucket=self.s3_bucket.id,
            lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_function.arn,
                events=["s3:ObjectCreated:*", "s3:ObjectRemoved:*"],
                filter_prefix="",
                filter_suffix=""
            )]
        )
        
        return lambda_function
    
    def _create_cloudwatch_logs(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for Lambda function"""
        
        log_group = aws.cloudwatch.LogGroup(
            f"{self.project_name}-lambda-logs",
            name=pulumi.Output.concat("/aws/lambda/", self.lambda_function.name),
            retention_in_days=14,
            tags=self.common_tags
        )
        
        return log_group
    
    def _export_outputs(self):
        """Export important stack outputs"""
        
        export("vpc_id", self.vpc['vpc'].id)
        export("vpc_cidr", self.vpc['vpc'].cidr_block)
        export("public_subnet_ids", [subnet.id for subnet in self.vpc['public_subnets']])
        export("private_subnet_ids", [subnet.id for subnet in self.vpc['private_subnets']])
        export("s3_bucket_name", self.s3_bucket.bucket)
        export("s3_bucket_arn", self.s3_bucket.arn)
        export("lambda_function_name", self.lambda_function.name)
        export("lambda_function_arn", self.lambda_function.arn)
        export("cloudwatch_log_group", self.cloudwatch_logs.name)


# Initialize the stack
tap_stack = TapStack()