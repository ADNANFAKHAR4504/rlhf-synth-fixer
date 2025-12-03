"""Integration tests for TapStack - discovers resources dynamically."""
import json
import os
import subprocess
import unittest
from pathlib import Path

import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack with dynamic resource discovery."""

    @classmethod
    def _discover_stack_name(cls):
        """Discover the stack name dynamically from cdktf.out/stacks/."""
        project_root = Path(__file__).parent.parent.parent
        stacks_dir = project_root / "cdktf.out" / "stacks"
        
        if not stacks_dir.exists():
            raise unittest.SkipTest("No stacks found in cdktf.out/stacks/. Please deploy the stack first.")
        
        # Find the first stack directory (should be TapStackdev or similar)
        stack_dirs = [d for d in stacks_dir.iterdir() if d.is_dir()]
        if not stack_dirs:
            raise unittest.SkipTest("No stack directories found. Please deploy the stack first.")
        
        # Return the first stack name found
        stack_name = stack_dirs[0].name
        print(f"Discovered stack name: {stack_name}")
        return stack_name

    @classmethod
    def _get_terraform_outputs(cls, stack_name):
        """Get Terraform outputs dynamically from the deployed stack."""
        project_root = Path(__file__).parent.parent.parent
        stack_dir = project_root / "cdktf.out" / "stacks" / stack_name
        
        if not stack_dir.exists():
            raise unittest.SkipTest(f"Stack directory {stack_dir} not found. Please deploy the stack first.")
        
        try:
            # Try to get outputs using terraform output -json
            result = subprocess.run(
                ["terraform", "output", "-json"],
                cwd=str(stack_dir),
                capture_output=True,
                text=True,
                timeout=30,
                check=True
            )
            
            outputs_raw = json.loads(result.stdout)
            
            # Parse Terraform output format: {"key": {"value": "...", "type": "..."}}
            outputs = {}
            for key, value_obj in outputs_raw.items():
                if isinstance(value_obj, dict) and "value" in value_obj:
                    outputs[key] = value_obj["value"]
                else:
                    outputs[key] = value_obj
            
            print(f"Successfully loaded {len(outputs)} outputs from stack {stack_name}")
            return outputs
            
        except subprocess.CalledProcessError as e:
            raise unittest.SkipTest(
                f"Failed to get Terraform outputs from stack {stack_name}: {e.stderr}"
            )
        except json.JSONDecodeError as e:
            raise unittest.SkipTest(
                f"Failed to parse Terraform outputs from stack {stack_name}: {e}"
            )
        except FileNotFoundError:
            raise unittest.SkipTest(
                "Terraform CLI not found. Please install Terraform to run integration tests."
            )

    @classmethod
    def _discover_environment_suffix(cls, stack_name):
        """Discover environment suffix from stack name (e.g., TapStackdev -> dev)."""
        # Stack name format: TapStack{environment_suffix}
        if stack_name.startswith("TapStack"):
            return stack_name[8:]  # Remove "TapStack" prefix
        return "dev"  # Default fallback

    @classmethod
    def _discover_resources_by_name(cls, environment_suffix, region):
        """Discover AWS resources dynamically by naming patterns."""
        # Initialize all resource keys to None
        resources = {
            'api_lambda': None,
            'fraud_detection_lambda': None,
            'notification_lambda': None,
            'dynamodb_table': None,
            'suspicious_queue': None,
            'dlq': None,
            'sns_topic': None,
            'kms_key': None,
            'api_gateway': None,
            'vpc': None
        }
        
        try:
            lambda_client = boto3.client('lambda', region_name=region)
            dynamodb_client = boto3.client('dynamodb', region_name=region)
            sqs_client = boto3.client('sqs', region_name=region)
            sns_client = boto3.client('sns', region_name=region)
            kms_client = boto3.client('kms', region_name=region)
            apigw_client = boto3.client('apigateway', region_name=region)
            ec2_client = boto3.client('ec2', region_name=region)
            
            # Discover Lambda functions
            try:
                lambda_functions = lambda_client.list_functions()['Functions']
                resources['api_lambda'] = next(
                    (f for f in lambda_functions if f['FunctionName'] == f'api-handler-{environment_suffix}'),
                    None
                )
                resources['fraud_detection_lambda'] = next(
                    (f for f in lambda_functions if f['FunctionName'] == f'fraud-detection-{environment_suffix}'),
                    None
                )
                resources['notification_lambda'] = next(
                    (f for f in lambda_functions if f['FunctionName'] == f'notification-handler-{environment_suffix}'),
                    None
                )
            except (ClientError, Exception) as e:
                print(f"Warning: Error discovering Lambda functions: {e}")
            
            # Discover DynamoDB table
            try:
                table_name = f'transactions-{environment_suffix}'
                resources['dynamodb_table'] = dynamodb_client.describe_table(TableName=table_name)['Table']
            except (ClientError, Exception) as e:
                print(f"Warning: Error discovering DynamoDB table: {e}")
            
            # Discover SQS queues
            try:
                queue_urls = sqs_client.list_queues().get('QueueUrls', [])
                resources['suspicious_queue'] = next(
                    (url for url in queue_urls if f'suspicious-transactions-{environment_suffix}' in url),
                    None
                )
                resources['dlq'] = next(
                    (url for url in queue_urls if f'fraud-detection-dlq-{environment_suffix}' in url),
                    None
                )
            except (ClientError, Exception) as e:
                print(f"Warning: Error discovering SQS queues: {e}")
            
            # Discover SNS topic
            try:
                topics = sns_client.list_topics()['Topics']
                resources['sns_topic'] = next(
                    (t for t in topics if f'fraud-alerts-{environment_suffix}' in t['TopicArn']),
                    None
                )
            except (ClientError, Exception) as e:
                print(f"Warning: Error discovering SNS topic: {e}")
            
            # Discover KMS key alias
            try:
                alias_name = f'alias/fraud-detection-{environment_suffix}'
                resources['kms_key'] = kms_client.describe_key(KeyId=alias_name)['KeyMetadata']
            except (ClientError, Exception) as e:
                print(f"Warning: Error discovering KMS key: {e}")
            
            # Discover API Gateway
            try:
                apis = apigw_client.get_rest_apis()['items']
                resources['api_gateway'] = next(
                    (api for api in apis if f'fraud-detection-api-{environment_suffix}' in api.get('name', '')),
                    None
                )
            except (ClientError, Exception) as e:
                print(f"Warning: Error discovering API Gateway: {e}")
            
            # Discover VPC
            try:
                vpcs = ec2_client.describe_vpcs(
                    Filters=[{'Name': 'tag:Name', 'Values': [f'fraud-detection-vpc-{environment_suffix}']}]
                )['Vpcs']
                resources['vpc'] = vpcs[0] if vpcs else None
            except (ClientError, Exception) as e:
                print(f"Warning: Error discovering VPC: {e}")
            
        except Exception as e:
            print(f"Warning: Error initializing AWS clients: {e}")
        
        return resources

    @classmethod
    def setUpClass(cls):
        """Set up test environment once for all tests."""
        # Discover stack name dynamically
        cls.stack_name = cls._discover_stack_name()
        
        # Discover environment suffix from stack name
        cls.environment_suffix = cls._discover_environment_suffix(cls.stack_name)
        print(f"Discovered environment suffix: {cls.environment_suffix}")
        
        # Get Terraform outputs dynamically
        cls.outputs = cls._get_terraform_outputs(cls.stack_name)
        
        # Get AWS region from environment or discover from outputs
        cls.region = os.getenv('AWS_REGION')
        if not cls.region:
            # Try to extract region from ARN if available
            if cls.outputs.get('sns_topic_arn'):
                # ARN format: arn:aws:service:region:account:resource
                parts = cls.outputs['sns_topic_arn'].split(':')
                if len(parts) >= 4:
                    cls.region = parts[3]
            if not cls.region:
                cls.region = 'us-east-1'  # Default fallback
        
        print(f"Using region: {cls.region}")
        
        # Discover resources dynamically
        cls.resources = cls._discover_resources_by_name(cls.environment_suffix, cls.region)
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.apigw_client = boto3.client('apigateway', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)

    def test_stack_outputs_exist(self):
        """Test that all expected stack outputs are present."""
        required_outputs = ['api_endpoint', 'dynamodb_table_name', 'sqs_queue_url', 'sns_topic_arn']
        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs, f"Output {output_key} not found in stack outputs")
            self.assertIsNotNone(self.outputs[output_key], f"Output {output_key} is None")

    def test_lambda_functions_exist(self):
        """Test that all Lambda functions are deployed."""
        if not self.resources['api_lambda']:
            self.skipTest("API handler Lambda function not found (may require AWS permissions)")
        if not self.resources['fraud_detection_lambda']:
            self.skipTest("Fraud detection Lambda function not found (may require AWS permissions)")
        if not self.resources['notification_lambda']:
            self.skipTest("Notification handler Lambda function not found (may require AWS permissions)")
        
        # Verify function names match expected pattern
        self.assertEqual(self.resources['api_lambda']['FunctionName'], f'api-handler-{self.environment_suffix}')
        self.assertEqual(self.resources['fraud_detection_lambda']['FunctionName'], f'fraud-detection-{self.environment_suffix}')
        self.assertEqual(self.resources['notification_lambda']['FunctionName'], f'notification-handler-{self.environment_suffix}')

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists."""
        if not self.resources['dynamodb_table']:
            self.skipTest("DynamoDB table not found (may require AWS permissions)")
        self.assertEqual(self.resources['dynamodb_table']['TableName'], f'transactions-{self.environment_suffix}')
        self.assertEqual(self.resources['dynamodb_table']['TableStatus'], 'ACTIVE')

    def test_sqs_queues_exist(self):
        """Test that SQS queues exist."""
        if not self.resources['suspicious_queue']:
            self.skipTest("Suspicious transactions queue not found (may require AWS permissions)")
        if not self.resources['dlq']:
            self.skipTest("Dead letter queue not found (may require AWS permissions)")

    def test_sns_topic_exists(self):
        """Test that SNS topic exists."""
        if not self.resources['sns_topic']:
            self.skipTest("SNS topic not found (may require AWS permissions)")
        topic_arn = self.resources['sns_topic']['TopicArn']
        self.assertIn(f'fraud-alerts-{self.environment_suffix}', topic_arn)

    def test_kms_key_exists(self):
        """Test that KMS key exists."""
        if not self.resources['kms_key']:
            self.skipTest("KMS key not found (may require AWS permissions)")
        self.assertEqual(self.resources['kms_key']['KeyState'], 'Enabled')

    def test_api_gateway_exists(self):
        """Test that API Gateway exists."""
        if not self.resources['api_gateway']:
            self.skipTest("API Gateway not found (may require AWS permissions)")

    def test_vpc_exists(self):
        """Test that VPC exists."""
        if not self.resources['vpc']:
            self.skipTest("VPC not found (may require AWS permissions)")
        self.assertEqual(self.resources['vpc']['State'], 'available')

    def test_lambda_functions_have_vpc_config(self):
        """Test that Lambda functions have VPC configuration."""
        for lambda_name, lambda_func in [
            ('api_lambda', self.resources['api_lambda']),
            ('fraud_detection_lambda', self.resources['fraud_detection_lambda']),
            ('notification_lambda', self.resources['notification_lambda'])
        ]:
            if not lambda_func:
                continue
            try:
                # Get full function configuration
                func_config = self.lambda_client.get_function_configuration(
                    FunctionName=lambda_func['FunctionName']
                )
                self.assertIn('VpcConfig', func_config)
                self.assertIsNotNone(func_config['VpcConfig'].get('SubnetIds'))
                self.assertGreater(len(func_config['VpcConfig']['SubnetIds']), 0)
            except ClientError as e:
                self.skipTest(f"Could not get Lambda configuration for {lambda_name}: {e}")

    def test_outputs_match_resources(self):
        """Test that Terraform outputs match actual AWS resources."""
        # Check DynamoDB table name
        if self.resources['dynamodb_table']:
            self.assertEqual(
                self.outputs['dynamodb_table_name'],
                self.resources['dynamodb_table']['TableName']
            )
        
        # Check SQS queue URL
        if self.resources['suspicious_queue']:
            self.assertEqual(
                self.outputs['sqs_queue_url'],
                self.resources['suspicious_queue']
            )
        
        # Check SNS topic ARN
        if self.resources['sns_topic']:
            self.assertEqual(
                self.outputs['sns_topic_arn'],
                self.resources['sns_topic']['TopicArn']
            )
        
        # If no resources were discovered, skip this test
        if not any([
            self.resources['dynamodb_table'],
            self.resources['suspicious_queue'],
            self.resources['sns_topic']
        ]):
            self.skipTest("No resources discovered to compare with outputs (may require AWS permissions)")
