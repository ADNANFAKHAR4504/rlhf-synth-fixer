I'll create a complete, production-ready AWS infrastructure using Pulumi Python SDK. Based on your requirements, I'll provide all necessary files for immediate deployment.

## 1. Infrastructure Code (`tap_stack.py`)

```python
"""
TAP Stack - Production-ready AWS Infrastructure
Complete infrastructure with VPC, S3, Lambda, and monitoring
"""

import json
import os
import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, export

class TapStack:
    """Main infrastructure stack for TAP application"""
    
    def __init__(self):
        self.config = Config()
        self.stage = self.config.get("stage") or os.environ.get("STAGE", "dev")
        self.project_name = pulumi.get_project()
        self.stack_name = pulumi.get_stack()
        
        # Common tags for all resources
        self.common_tags = {
            "Project": self.project_name,
            "Stage": self.stage,
            "Managed": "Pulumi",
            "Environment": self.stage
        }
        
        # Initialize infrastructure components
        self.vpc = self._create_vpc()
        self.s3_bucket = self._create_s3_bucket()
        self.lambda_role = self._create_lambda_role()
        self.lambda_function = self._create_lambda_function()
        self.s3_notification = self._create_s3_notification()
        self.cloudwatch_logs = self._create_cloudwatch_logs()
        
        # Export important values
        self._export_outputs()
    
    def _create_vpc(self):
        """Create VPC with public and private subnets across 2 AZs"""
        
        # VPC
        vpc = aws.ec2.Vpc(
            f"{self.project_name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"{self.project_name}-vpc"}
        )
        
        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{self.project_name}-igw",
            vpc_id=vpc.id,
            tags={**self.common_tags, "Name": f"{self.project_name}-igw"}
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Public subnets
        public_subnet_1 = aws.ec2.Subnet(
            f"{self.project_name}-public-subnet-1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=azs.names[0],
            map_public_ip_on_launch=True,
            tags={**self.common_tags, "Name": f"{self.project_name}-public-subnet-1", "Type": "Public"}
        )
        
        public_subnet_2 = aws.ec2.Subnet(
            f"{self.project_name}-public-subnet-2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=azs.names[1],
            map_public_ip_on_launch=True,
            tags={**self.common_tags, "Name": f"{self.project_name}-public-subnet-2", "Type": "Public"}
        )
        
        # Private subnets
        private_subnet_1 = aws.ec2.Subnet(
            f"{self.project_name}-private-subnet-1",
            vpc_id=vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone=azs.names[0],
            tags={**self.common_tags, "Name": f"{self.project_name}-private-subnet-1", "Type": "Private"}
        )
        
        private_subnet_2 = aws.ec2.Subnet(
            f"{self.project_name}-private-subnet-2",
            vpc_id=vpc.id,
            cidr_block="10.0.4.0/24",
            availability_zone=azs.names[1],
            tags={**self.common_tags, "Name": f"{self.project_name}-private-subnet-2", "Type": "Private"}
        )
        
        # Elastic IP for NAT Gateway
        nat_eip = aws.ec2.Eip(
            f"{self.project_name}-nat-eip",
            domain="vpc",
            tags={**self.common_tags, "Name": f"{self.project_name}-nat-eip"}
        )
        
        # NAT Gateway
        nat_gateway = aws.ec2.NatGateway(
            f"{self.project_name}-nat-gateway",
            allocation_id=nat_eip.id,
            subnet_id=public_subnet_1.id,
            tags={**self.common_tags, "Name": f"{self.project_name}-nat-gateway"}
        )
        
        # Public route table
        public_route_table = aws.ec2.RouteTable(
            f"{self.project_name}-public-rt",
            vpc_id=vpc.id,
            tags={**self.common_tags, "Name": f"{self.project_name}-public-rt"}
        )
        
        # Public route to internet
        aws.ec2.Route(
            f"{self.project_name}-public-route",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
        
        # Associate public subnets with public route table
        aws.ec2.RouteTableAssociation(
            f"{self.project_name}-public-rta-1",
            subnet_id=public_subnet_1.id,
            route_table_id=public_route_table.id
        )
        
        aws.ec2.RouteTableAssociation(
            f"{self.project_name}-public-rta-2",
            subnet_id=public_subnet_2.id,
            route_table_id=public_route_table.id
        )
        
        # Private route table
        private_route_table = aws.ec2.RouteTable(
            f"{self.project_name}-private-rt",
            vpc_id=vpc.id,
            tags={**self.common_tags, "Name": f"{self.project_name}-private-rt"}
        )
        
        # Private route to NAT Gateway
        aws.ec2.Route(
            f"{self.project_name}-private-route",
            route_table_id=private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )
        
        # Associate private subnets with private route table
        aws.ec2.RouteTableAssociation(
            f"{self.project_name}-private-rta-1",
            subnet_id=private_subnet_1.id,
            route_table_id=private_route_table.id
        )
        
        aws.ec2.RouteTableAssociation(
            f"{self.project_name}-private-rta-2",
            subnet_id=private_subnet_2.id,
            route_table_id=private_route_table.id
        )
        
        return {
            "vpc": vpc,
            "public_subnets": [public_subnet_1, public_subnet_2],
            "private_subnets": [private_subnet_1, private_subnet_2],
            "igw": igw,
            "nat_gateway": nat_gateway
        }
    
    def _create_s3_bucket(self):
        """Create S3 bucket with encryption and versioning"""
        
        # S3 bucket
        bucket = aws.s3.Bucket(
            f"{self.project_name}-{self.stage}-bucket",
            tags=self.common_tags
        )
        
        # Bucket versioning
        aws.s3.BucketVersioningV2(
            f"{self.project_name}-bucket-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )
        
        # Bucket encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"{self.project_name}-bucket-encryption",
            bucket=bucket.id,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                    )
                ]
            )
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
        
        return bucket
    
    def _create_lambda_role(self):
        """Create IAM role for Lambda function"""
        
        # Lambda execution role
        lambda_role = aws.iam.Role(
            f"{self.project_name}-lambda-role",
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
            tags=self.common_tags
        )
        
        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"{self.project_name}-lambda-basic-execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )
        
        # Custom policy for S3 access
        s3_policy = aws.iam.RolePolicy(
            f"{self.project_name}-lambda-s3-policy",
            role=lambda_role.id,
            policy=self.s3_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"{arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": arn
                    }
                ]
            }))
        )
        
        return lambda_role
    
    def _create_lambda_function(self):
        """Create Lambda function with inline code"""
        
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
    Lambda function to process S3 events
    
    Args:
        event: S3 event data
        context: Lambda context
        
    Returns:
        Response dictionary
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
                
                # Get object metadata
                try:
                    response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                    file_size = response.get('ContentLength', 0)
                    last_modified = response.get('LastModified')
                    
                    processed_files.append({
                        'bucket': bucket_name,
                        'key': object_key,
                        'event': event_name,
                        'size': file_size,
                        'last_modified': last_modified.isoformat() if last_modified else None,
                        'processed_at': datetime.utcnow().isoformat()
                    })
                    
                    logger.info(f"Successfully processed {object_key}")
                    
                except Exception as e:
                    logger.error(f"Error processing {object_key}: {str(e)}")
                    raise
        
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
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to process S3 events'
            })
        }
"""
        
        # Lambda function
        lambda_function = aws.lambda_.Function(
            f"{self.project_name}-processor",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(lambda_code)
            }),
            handler="lambda_function.lambda_handler",
            role=self.lambda_role.arn,
            timeout=60,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "STAGE": self.stage,
                    "BUCKET_NAME": self.s3_bucket.id,
                    "LOG_LEVEL": "INFO"
                }
            ),
            tags=self.common_tags
        )
        
        return lambda_function
    
    def _create_s3_notification(self):
        """Create S3 bucket notification to trigger Lambda"""
        
        # Lambda permission for S3 to invoke
        lambda_permission = aws.lambda_.Permission(
            f"{self.project_name}-lambda-s3-permission",
            statement_id="AllowExecutionFromS3Bucket",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="s3.amazonaws.com",
            source_arn=self.s3_bucket.arn.apply(lambda arn: f"{arn}/*")
        )
        
        # S3 bucket notification
        bucket_notification = aws.s3.BucketNotification(
            f"{self.project_name}-bucket-notification",
            bucket=self.s3_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=self.lambda_function.arn,
                    events=["s3:ObjectCreated:*", "s3:ObjectRemoved:*"],
                    filter_prefix="",
                    filter_suffix=""
                )
            ],
            opts=pulumi.ResourceOptions(depends_on=[lambda_permission])
        )
        
        return bucket_notification
    
    def _create_cloudwatch_logs(self):
        """Create CloudWatch log group for Lambda"""
        
        log_group = aws.cloudwatch.LogGroup(
            f"{self.project_name}-lambda-logs",
            name=self.lambda_function.name.apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=14,
            tags=self.common_tags
        )
        
        return log_group
    
    def _export_outputs(self):
        """Export important stack outputs"""
        
        export("vpc_id", self.vpc["vpc"].id)
        export("bucket_name", self.s3_bucket.id)
        export("bucket_arn", self.s3_bucket.arn)
        export("lambda_function_name", self.lambda_function.name)
        export("lambda_function_arn", self.lambda_function.arn)
        export("public_subnet_ids", [subnet.id for subnet in self.vpc["public_subnets"]])
        export("private_subnet_ids", [subnet.id for subnet in self.vpc["private_subnets"]])

# Create the stack
tap_stack = TapStack()
```

## 2. Unit Tests (`test_tap_stack.py`)

```python
"""
Unit tests for TAP Stack infrastructure
Tests all components using Pulumi mocks
"""

import json
import unittest
from unittest.mock import Mock, patch
import pulumi
from pulumi import Output


class MockResourceArgs:
    """Mock resource arguments for testing"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack infrastructure"""
    
    def setUp(self):
        """Set up test environment"""
        # Mock Pulumi runtime
        pulumi.runtime.set_mocks(
            mocks=MockPulumiProvider(),
            project='test-project',
            stack='test-stack',
            preview=False
        )
        
    def tearDown(self):
        """Clean up after tests"""
        pulumi.runtime.reset_mocks()
    
    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test VPC and networking components creation"""
        from tap_stack import TapStack
        
        stack = TapStack()
        
        # Test VPC exists
        self.assertIsNotNone(stack.vpc)
        self.assertIn('vpc', stack.vpc)
        
        # Test subnets exist
        self.assertIn('public_subnets', stack.vpc)
        self.assertIn('private_subnets', stack.vpc)
        self.assertEqual(len(stack.vpc['public_subnets']), 2)
        self.assertEqual(len(stack.vpc['private_subnets']), 2)
        
        # Test networking components
        self.assertIn('igw', stack.vpc)
        self.assertIn('nat_gateway', stack.vpc)
    
    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket creation and configuration"""
        from tap_stack import TapStack
        
        stack = TapStack()
        
        # Test bucket exists
        self.assertIsNotNone(stack.s3_bucket)
        
        # Verify bucket has proper configuration
        # Note: In real tests, you'd verify the bucket properties
        # Here we're testing the structure exists
        self.assertTrue(hasattr(stack.s3_bucket, 'id'))
        self.assertTrue(hasattr(stack.s3_bucket, 'arn'))
    
    @pulumi.runtime.test
    def test_lambda_role_creation(self):
        """Test Lambda IAM role creation"""
        from tap_stack import TapStack
        
        stack = TapStack()
        
        # Test role exists
        self.assertIsNotNone(stack.lambda_role)
        self.assertTrue(hasattr(stack.lambda_role, 'arn'))
        self.assertTrue(hasattr(stack.lambda_role, 'name'))
    
    @pulumi.runtime.test
    def test_lambda_function_creation(self):
        """Test Lambda function creation"""
        from tap_stack import TapStack
        
        stack = TapStack()
        
        # Test function exists
        self.assertIsNotNone(stack.lambda_function)
        self.assertTrue(hasattr(stack.lambda_function, 'arn'))
        self.assertTrue(hasattr(stack.lambda_function, 'name'))
    
    @pulumi.runtime.test
    def test_s3_notification_creation(self):
        """Test S3 bucket notification creation"""
        from tap_stack import TapStack
        
        stack = TapStack()
        
        # Test notification exists
        self.assertIsNotNone(stack.s3_notification)
    
    @pulumi.runtime.test
    def test_cloudwatch_logs_creation(self):
        """Test CloudWatch log group creation"""
        from tap_stack import TapStack
        
        stack = TapStack()
        
        # Test log group exists
        self.assertIsNotNone(stack.cloudwatch_logs)
    
    @pulumi.runtime.test
    def test_common_tags(self):
        """Test common tags are properly set"""
        from tap_stack import TapStack
        
        stack = TapStack()
        
        # Test common tags structure
        expected_keys = ['Project', 'Stage', 'Managed', 'Environment']
        for key in expected_keys:
            self.assertIn(key, stack.common_tags)
        
        self.assertEqual(stack.common_tags['Managed'], 'Pulumi')
    
    def test_lambda_handler_success(self):
        """Test Lambda handler with successful S3 event"""
        # Mock S3 event
        test_event = {
            'Records': [
                {
                    'eventSource': 'aws:s3',
                    'eventName': 's3:ObjectCreated:Put',
                    's3': {
                        'bucket': {'name': 'test-bucket'},
                        'object': {'key': 'test-file.txt'}
                    }
                }
            ]
        }
        
        # Mock context
        context = Mock()
        
        # Mock boto3 client
        with patch('boto3.client') as mock_boto3:
            mock_s3 = Mock()
            mock_s3.head_object.return_value = {
                'ContentLength': 1024,
                'LastModified': '2023-01-01T00:00:00Z'
            }
            mock_boto3.return_value = mock_s3
            
            # Import and test lambda function
            lambda_code = """
import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        processed_files = []
        
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for {object_key} in {bucket_name}")
                
                try:
                    response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                    file_size = response.get('ContentLength', 0)
                    last_modified = response.get('LastModified')
                    
                    processed_files.append({
                        'bucket': bucket_name,
                        'key': object_key,
                        'event': event_name,
                        'size': file_size,
                        'last_modified': last_modified if last_modified else None,
                        'processed_at': datetime.utcnow().isoformat()
                    })
                    
                    logger.info(f"Successfully processed {object_key}")
                    
                except Exception as e:
                    logger.error(f"Error processing {object_key}: {str(e)}")
                    raise
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 events',
                'processed_files': processed_files,
                'total_processed': len(processed_files)
            })
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to process S3 events'
            })
        }
"""
            
            # Execute lambda code in local scope
            exec(lambda_code, globals())
            
            # Test the handler
            result = lambda_handler(test_event, context)
            
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            self.assertEqual(body['total_processed'], 1)
            self.assertEqual(len(body['processed_files']), 1)
    
    def test_lambda_handler_error(self):
        """Test Lambda handler with error scenario"""
        test_event = {
            'Records': [
                {
                    'eventSource': 'aws:s3',
                    'eventName': 's3:ObjectCreated:Put',
                    's3': {
                        'bucket': {'name': 'test-bucket'},
                        'object': {'key': 'test-file.txt'}
                    }
                }
            ]
        }
        
        context = Mock()
        
        # Mock boto3 client to raise exception
        with patch('boto3.client') as mock_boto3:
            mock_s3 = Mock()
            mock_s3.head_object.side_effect = Exception("S3 error")
            mock_boto3.return_value = mock_s3
            
            # Import lambda code (same as above)
            lambda_code = """
import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        processed_files = []
        
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for {object_key} in {bucket_name}")
                
                try:
                    response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                    file_size = response.get('ContentLength', 0)
                    last_modified = response.get('LastModified')
                    
                    processed_files.append({
                        'bucket': bucket_name,
                        'key': object_key,
                        'event': event_name,
                        'size': file_size,
                        'last_modified': last_modified if last_modified else None,
                        'processed_at': datetime.utcnow().isoformat()
                    })
                    
                    logger.info(f"Successfully processed {object_key}")
                    
                except Exception as e:
                    logger.error(f"Error processing {object_key}: {str(e)}")
                    raise
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 events',
                'processed_files': processed_files,
                'total_processed': len(processed_files)
            })
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to process S3 events'
            })
        }
"""
            
            exec(lambda_code, globals())
            
            # Test error handling
            result = lambda_handler(test_event, context)
            
            self.assertEqual(result['statusCode'], 500)
            body = json.loads(result['body'])
            self.assertIn('error', body)


class MockPulumiProvider:
    """Mock Pulumi provider for testing"""
    
    def call(self, args):
        """Mock call method"""
        if args.tok == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"]
            }
        return {}
    
    def new_resource(self, args):
        """Mock new_resource method"""
        # Return mock resource with basic properties
        return [f"{args.name}-id", {
            "id": f"{args.name}-id",
            "arn": f"arn:aws:service:us-east-1:123456789012:resource/{args.name}",
            "name": args.name
        }]


if __name__ == '__main__':
    # Run tests
    unittest.main()
```

## 3. Integration Tests (`test_integration.py`)

```python
"""
Integration tests for TAP Stack
Tests against live AWS resources
"""

import json
import time
import unittest
import boto3
import pulumi
from pulumi import automation as auto
import os
import tempfile
import uuid


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TAP Stack"""
    
    @classmethod
    def setUpClass(cls):
        """Set up integration test environment"""
        cls.project_name = "tap-integration-test"
        cls.stack_name = "test"
        cls.region = "us-east-1"
        cls.test_id = str(uuid.uuid4())[:8]
        
        # AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        
        # Deploy stack for testing
        cls._deploy_test_stack()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up integration test environment"""
        cls._destroy_test_stack()
    
    @classmethod
    def _deploy_test_stack(cls):
        """Deploy test stack"""
        try:
            # Create temporary directory for test stack
            cls.temp_dir = tempfile.mkdtemp()
            
            # Copy stack code to temp directory
            stack_code = """
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from tap_stack import TapStack

# Create stack instance
stack = TapStack()
"""
            
            with open(os.path.join(cls.temp_dir, '__main__.py'), 'w') as f:
                f.write(stack_code)
            
            # Copy tap_stack.py to temp directory
            import tap_stack
            import inspect
            source = inspect.getsource(tap_stack)
            with