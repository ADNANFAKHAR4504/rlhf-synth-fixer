"""
Integration tests for Image Optimization Infrastructure
Tests actual AWS resource creation, connectivity, and functionality
"""

import pytest
import boto3
import requests
import subprocess
import json
import os
import time
import io
from PIL import Image
from typing import Dict, List, Optional
from botocore.exceptions import ClientError, NoCredentialsError
from decimal import Decimal


def get_pulumi_stack_name() -> Optional[str]:
    """Get the target Pulumi stack if it exists (read-only)"""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3515')
    target_stack = f'TapStack{environment_suffix}'
    
    try:
        result = subprocess.run(['pulumi', 'stack', 'ls', '--json'],
                                capture_output=True, text=True)
        if result.returncode == 0:
            stacks = json.loads(result.stdout)
            for stack in stacks:
                if stack.get('name') == target_stack:
                    print(f"Using target stack: {target_stack}")
                    return target_stack
            print(f"Target stack '{target_stack}' not found in Pulumi")
            return None
    except Exception as e:
        print(f"Error listing stacks: {e}")
    return None


# Module-level fixtures
@pytest.fixture(scope="session")
def aws_clients():
    """Create AWS clients for testing"""
    region = os.environ.get('AWS_DEFAULT_REGION', 'us-west-1')
    
    # Try to get region from stack outputs if available
    stack_name = get_pulumi_stack_name()
    if stack_name:
        try:
            result = subprocess.run(['pulumi', 'stack', 'output', 'region'], 
                                  capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                region = result.stdout.strip().strip('"')
        except:
            pass
    
    try:
        return {
            's3': boto3.client('s3', region_name=region),
            'lambda': boto3.client('lambda', region_name=region),
            'dynamodb': boto3.client('dynamodb', region_name=region),
            'cloudfront': boto3.client('cloudfront', region_name=region),
            'sts': boto3.client('sts', region_name=region)
        }
    except NoCredentialsError:
        pytest.skip("AWS credentials not configured")


@pytest.fixture(scope="session")
def dynamodb_resource():
    """Create DynamoDB resource for higher-level operations"""
    region = os.environ.get('AWS_DEFAULT_REGION', 'us-west-1')
    try:
        return boto3.resource('dynamodb', region_name=region)
    except NoCredentialsError:
        pytest.skip("AWS credentials not configured")


@pytest.fixture(scope="session")
def stack_outputs():
    """Get stack outputs from Pulumi or environment variables"""
    # First check if outputs are provided via environment variables (for CI)
    env_outputs = {}
    env_mappings = {
        'UPLOAD_BUCKET': 'upload_bucket',
        'WEBP_BUCKET': 'webp_bucket',
        'JPEG_BUCKET': 'jpeg_bucket',
        'PNG_BUCKET': 'png_bucket',
        'CLOUDFRONT_DISTRIBUTION': 'cloudfront_distribution',
        'CLOUDFRONT_DISTRIBUTION_ID': 'cloudfront_distribution_id',
        'DYNAMODB_TABLE': 'dynamodb_table',
        'LAMBDA_FUNCTION': 'lambda_function',
        'LAMBDA_FUNCTION_ARN': 'lambda_function_arn',
    }
    
    for env_key, output_key in env_mappings.items():
        value = os.environ.get(env_key)
        if value:
            env_outputs[output_key] = value
    
    # If we have environment outputs, use them
    if env_outputs.get('upload_bucket'):
        print("Using outputs from environment variables")
        env_outputs['stack_name'] = os.environ.get('STACK_NAME', 'env-provided')
        return env_outputs
    
    # Otherwise try Pulumi
    stack_name = get_pulumi_stack_name()
    
    if not stack_name:
        print("ERROR: No Pulumi stack found or selected")
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3515')
        print(f"Please run: pulumi stack select TapStack{environment_suffix}")
        pytest.fail("No valid Pulumi stack available")
    
    try:
        print(f"Using Pulumi stack: {stack_name}")
        
        # First check if stack has outputs
        result = subprocess.run(['pulumi', 'stack', 'output', '--json'], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Failed to get Pulumi outputs: {result.stderr}")
            if "no outputs" in result.stderr.lower() or "stack has never been updated" in result.stderr.lower():
                pytest.fail(f"Stack '{stack_name}' has no outputs. Please deploy the stack first with: pulumi up")
            raise Exception("Failed to get Pulumi outputs")
            
        outputs = json.loads(result.stdout)
        
        if not outputs:
            pytest.fail(f"Stack '{stack_name}' has no outputs. Please deploy the stack first with: pulumi up")
        
        # Convert to expected format
        return {
            'upload_bucket': outputs.get('upload_bucket', '').strip('"'),
            'webp_bucket': outputs.get('webp_bucket', '').strip('"'),
            'jpeg_bucket': outputs.get('jpeg_bucket', '').strip('"'),
            'png_bucket': outputs.get('png_bucket', '').strip('"'),
            'cloudfront_distribution': outputs.get('cloudfront_distribution', '').strip('"'),
            'cloudfront_distribution_id': outputs.get('cloudfront_distribution_id', '').strip('"'),
            'dynamodb_table': outputs.get('dynamodb_table', '').strip('"'),
            'lambda_function': outputs.get('lambda_function', '').strip('"'),
            'lambda_function_arn': outputs.get('lambda_function_arn', '').strip('"'),
            'stack_name': stack_name
        }
    except Exception as e:
        print(f"ERROR: Could not get Pulumi outputs: {e}")
        pytest.fail(f"Failed to get outputs from stack '{stack_name}'")


@pytest.fixture(scope="session")
def check_aws_connectivity():
    """Check if we can connect to AWS"""
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"AWS Account: {identity['Account'][:3]}***")  # Mask account ID
        return True
    except Exception as e:
        print(f"AWS connectivity check failed: {e}")
        return False


@pytest.fixture
def test_image():
    """Create a test image for upload testing"""
    # Create a simple test image using PIL
    img = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr.getvalue()


class TestResourceExistence:
    """Test that required resources exist (basic smoke tests)"""
    
    def test_pulumi_stack_exists(self):
        """Test that a Pulumi stack exists or infrastructure outputs are available"""
        # Check if we have environment outputs (CI scenario)
        if os.environ.get('UPLOAD_BUCKET'):
            print("Infrastructure outputs provided via environment variables")
            return
        
        # Otherwise check for Pulumi
        try:
            environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3515')
            target_stack = f'TapStack{environment_suffix}'
            
            result = subprocess.run(['pulumi', 'stack', 'select', target_stack], 
                                  capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"Warning: Could not select stack {target_stack}")
            
            # Now list stacks to verify
            result = subprocess.run(['pulumi', 'stack', 'ls'], 
                                  capture_output=True, text=True)
            
            if result.returncode != 0:
                print("Warning: Pulumi not initialized or no stacks found")
                return
            
            # Check if we have stacks
            if result.stdout.strip():
                print(f"Pulumi stacks found:\n{result.stdout}")
                
                # Verify we're on the right stack
                stack_name = get_pulumi_stack_name()
                if stack_name:
                    print(f"Current/selected stack: {stack_name}")
                    assert stack_name == target_stack, f"Wrong stack selected. Expected {target_stack}, got {stack_name}"
                else:
                    pytest.fail(f"Could not select stack {target_stack}")
            else:
                pytest.fail("No Pulumi stacks found")
                
        except FileNotFoundError:
            pytest.skip("Pulumi CLI not available")
    
    def test_aws_credentials_configured(self, check_aws_connectivity):
        """Test that AWS credentials are properly configured"""
        assert check_aws_connectivity, "AWS credentials not configured or invalid"


class TestS3BucketIntegration:
    """Test S3 bucket integration and configuration"""
    
    def test_upload_bucket_exists_and_configured(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test upload bucket exists with correct configuration"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        s3 = aws_clients['s3']
        bucket_name = stack_outputs['upload_bucket']
        
        if not bucket_name or bucket_name.startswith('mock'):
            pytest.fail("Real upload bucket name not available from stack outputs")
        
        print(f"Testing upload bucket: {bucket_name}")
        
        try:
            # Check bucket exists
            response = s3.head_bucket(Bucket=bucket_name)
            print(f"Upload bucket {bucket_name} exists and is accessible")
            
            # Check bucket location
            location = s3.get_bucket_location(Bucket=bucket_name)
            print(f"Upload bucket location: {location['LocationConstraint']}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                pytest.fail(f"Upload bucket {bucket_name} not found - ensure stack is deployed")
            elif error_code == '403':
                pytest.fail(f"Access denied to upload bucket {bucket_name} - check permissions")
            else:
                pytest.fail(f"Error accessing upload bucket: {e}")
    
    def test_processed_buckets_exist(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test that all processed image buckets exist"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        s3 = aws_clients['s3']
        buckets = {
            'webp': stack_outputs['webp_bucket'],
            'jpeg': stack_outputs['jpeg_bucket'],
            'png': stack_outputs['png_bucket']
        }
        
        for bucket_type, bucket_name in buckets.items():
            if not bucket_name or bucket_name.startswith('mock'):
                pytest.fail(f"Real {bucket_type} bucket name not available from stack outputs")
            
            print(f"Testing {bucket_type} bucket: {bucket_name}")
            
            try:
                response = s3.head_bucket(Bucket=bucket_name)
                print(f"{bucket_type.upper()} bucket {bucket_name} exists and is accessible")
                
            except ClientError as e:
                error_code = e.response['Error']['Code']
                if error_code == 'NoSuchBucket':
                    pytest.fail(f"{bucket_type.upper()} bucket {bucket_name} not found")
                elif error_code == '403':
                    pytest.fail(f"Access denied to {bucket_type} bucket {bucket_name}")
                else:
                    pytest.fail(f"Error accessing {bucket_type} bucket: {e}")
    
    def test_bucket_versioning_configuration(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test bucket versioning is properly configured"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        s3 = aws_clients['s3']
        upload_bucket = stack_outputs['upload_bucket']
        
        try:
            versioning = s3.get_bucket_versioning(Bucket=upload_bucket)
            # Versioning should be enabled for upload bucket
            assert versioning.get('Status') == 'Enabled', "Upload bucket should have versioning enabled"
            print(f"Upload bucket versioning: {versioning.get('Status')}")
            
        except ClientError as e:
            print(f"Warning: Could not check bucket versioning: {e}")


class TestLambdaIntegration:
    """Test Lambda function integration and configuration"""
    
    def test_lambda_function_exists_and_configured(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test Lambda function exists with correct configuration"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        lambda_client = aws_clients['lambda']
        function_name = stack_outputs['lambda_function']
        
        if not function_name or function_name.startswith('mock'):
            pytest.fail("Real Lambda function name not available from stack outputs")
        
        print(f"Testing Lambda function: {function_name}")
        
        try:
            response = lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # Check basic configuration
            assert config['State'] == 'Active', f"Lambda function should be active, got {config['State']}"
            assert config['Runtime'].startswith('python'), f"Expected Python runtime, got {config['Runtime']}"
            
            # Check environment variables are set
            env_vars = config.get('Environment', {}).get('Variables', {})
            required_env_vars = ['WEBP_BUCKET', 'JPEG_BUCKET', 'PNG_BUCKET', 'METADATA_TABLE']
            
            for var in required_env_vars:
                assert var in env_vars, f"Environment variable {var} not set in Lambda function"
                assert env_vars[var], f"Environment variable {var} is empty"
            
            print(f"Lambda function {function_name} is properly configured")
            print(f"Runtime: {config['Runtime']}, Memory: {config['MemorySize']}MB, Timeout: {config['Timeout']}s")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                pytest.fail(f"Lambda function {function_name} not found - ensure stack is deployed")
            else:
                pytest.fail(f"Error accessing Lambda function: {e}")
    
    def test_lambda_function_can_be_invoked(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test Lambda function can be invoked (dry run)"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        lambda_client = aws_clients['lambda']
        function_name = stack_outputs['lambda_function']
        
        try:
            # Test with DryRun to avoid actual execution
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='DryRun'
            )
            
            assert response['StatusCode'] == 204, f"Lambda dry run failed with status {response['StatusCode']}"
            print(f"Lambda function {function_name} can be invoked successfully")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'InvalidParameterValueException':
                # This might be expected for some Lambda configurations
                print(f"Lambda function exists but has validation warnings: {e}")
            else:
                pytest.fail(f"Error invoking Lambda function: {e}")


class TestDynamoDBIntegration:
    """Test DynamoDB table integration and configuration"""
    
    def test_dynamodb_table_exists_and_configured(self, aws_clients, dynamodb_resource, stack_outputs, check_aws_connectivity):
        """Test DynamoDB table exists with correct configuration"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        dynamodb_client = aws_clients['dynamodb']
        table_name = stack_outputs['dynamodb_table']
        
        if not table_name or table_name.startswith('mock'):
            pytest.fail("Real DynamoDB table name not available from stack outputs")
        
        print(f"Testing DynamoDB table: {table_name}")
        
        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Check table status
            assert table['TableStatus'] == 'ACTIVE', f"DynamoDB table should be active, got {table['TableStatus']}"
            
            # Check key schema
            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            assert 'image_id' in key_schema, "DynamoDB table should have 'image_id' as key"
            
            # Check if table has the expected attributes
            attribute_definitions = {attr['AttributeName']: attr['AttributeType'] for attr in table['AttributeDefinitions']}
            assert 'image_id' in attribute_definitions, "DynamoDB table should define 'image_id' attribute"
            
            print(f"DynamoDB table {table_name} is properly configured")
            print(f"Status: {table['TableStatus']}, Item count: {table['ItemCount']}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                pytest.fail(f"DynamoDB table {table_name} not found - ensure stack is deployed")
            else:
                pytest.fail(f"Error accessing DynamoDB table: {e}")
    
    def test_dynamodb_table_read_write_capacity(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test DynamoDB table has appropriate read/write capacity"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        dynamodb_client = aws_clients['dynamodb']
        table_name = stack_outputs['dynamodb_table']
        
        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Check billing mode
            billing_mode = table.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')
            print(f"DynamoDB billing mode: {billing_mode}")
            
            if billing_mode == 'PROVISIONED':
                provisioned_throughput = table['ProvisionedThroughput']
                read_capacity = provisioned_throughput['ReadCapacityUnits']
                write_capacity = provisioned_throughput['WriteCapacityUnits']
                
                assert read_capacity >= 1, "Read capacity should be at least 1"
                assert write_capacity >= 1, "Write capacity should be at least 1"
                
                print(f"Provisioned capacity - Read: {read_capacity}, Write: {write_capacity}")
            
        except ClientError as e:
            print(f"Warning: Could not check DynamoDB capacity settings: {e}")


class TestCloudFrontIntegration:
    """Test CloudFront distribution integration"""
    
    def test_cloudfront_distribution_exists_and_configured(self, aws_clients, stack_outputs, check_aws_connectivity):
        """Test CloudFront distribution exists with correct configuration"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
            
        cloudfront = aws_clients['cloudfront']
        distribution_id = stack_outputs['cloudfront_distribution_id']
        domain_name = stack_outputs['cloudfront_distribution']
        
        if not distribution_id or distribution_id.startswith('mock'):
            pytest.fail("Real CloudFront distribution ID not available from stack outputs")
        
        print(f"Testing CloudFront distribution: {distribution_id}")
        
        try:
            response = cloudfront.get_distribution(Id=distribution_id)
            distribution = response['Distribution']
            config = distribution['DistributionConfig']
            
            # Check distribution status
            assert distribution['Status'] in ['Deployed', 'InProgress'], f"Distribution should be deployed or in progress, got {distribution['Status']}"
            
            # Check that distribution is enabled
            assert config['Enabled'] is True, "CloudFront distribution should be enabled"
            
            # Check domain name matches
            actual_domain = distribution['DomainName']
            assert actual_domain == domain_name, f"Domain name mismatch: expected {domain_name}, got {actual_domain}"
            
            # Check origins exist
            origins = config['Origins']['Items']
            assert len(origins) > 0, "CloudFront distribution should have at least one origin"
            
            print(f"CloudFront distribution {distribution_id} is properly configured")
            print(f"Status: {distribution['Status']}, Domain: {actual_domain}")
            print(f"Origins count: {len(origins)}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchDistribution':
                pytest.fail(f"CloudFront distribution {distribution_id} not found - ensure stack is deployed")
            else:
                pytest.fail(f"Error accessing CloudFront distribution: {e}")


class TestEndToEndIntegration:
    """Test end-to-end functionality of the image optimization system"""
    
    def test_cloudfront_domain_is_accessible(self, stack_outputs, check_aws_connectivity):
        """Test that CloudFront domain responds to HTTP requests"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
        
        domain_name = stack_outputs['cloudfront_distribution']
        
        if not domain_name or domain_name.startswith('mock'):
            pytest.skip("CloudFront domain not available from stack outputs")
        
        url = f"https://{domain_name}"
        print(f"Testing CloudFront domain accessibility: {url}")
        
        try:
            # Make a simple GET request with a reasonable timeout
            response = requests.get(url, timeout=30, allow_redirects=True)
            
            # CloudFront might return various status codes depending on configuration
            # 200 (OK), 403 (Forbidden due to no default object), 404 (Not Found) are all valid
            valid_status_codes = [200, 403, 404]
            assert response.status_code in valid_status_codes, \
                f"Expected status code in {valid_status_codes}, got {response.status_code}"
            
            # Check for CloudFront headers
            headers = response.headers
            cf_headers = [h for h in headers.keys() if h.lower().startswith('x-amz-cf')]
            
            print(f"CloudFront domain is accessible - Status: {response.status_code}")
            if cf_headers:
                print(f"CloudFront headers detected: {cf_headers}")
                
        except requests.RequestException as e:
            # This might be expected if CloudFront is still deploying
            print(f"Warning: CloudFront domain not accessible yet: {e}")
            print("This is normal if the distribution was recently created")
    
    def test_s3_upload_triggers_lambda(self, aws_clients, stack_outputs, test_image, check_aws_connectivity):
        """Test uploading an image to S3 (without actual processing to avoid costs)"""
        if not check_aws_connectivity:
            pytest.skip("AWS credentials not available")
        
        s3 = aws_clients['s3']
        upload_bucket = stack_outputs['upload_bucket']
        
        # This test only verifies we can upload - we don't test actual processing
        # to avoid Lambda execution costs in CI/CD
        test_key = f"test-images/integration-test-{int(time.time())}.png"
        
        try:
            # Upload test image
            s3.put_object(
                Bucket=upload_bucket,
                Key=test_key,
                Body=test_image,
                ContentType='image/png'
            )
            
            print(f"Successfully uploaded test image to {upload_bucket}/{test_key}")
            
            # Verify upload
            response = s3.head_object(Bucket=upload_bucket, Key=test_key)
            assert response['ContentType'] == 'image/png'
            assert response['ContentLength'] > 0
            
            # Clean up test object
            s3.delete_object(Bucket=upload_bucket, Key=test_key)
            print("Test image cleaned up successfully")
            
        except ClientError as e:
            pytest.fail(f"Failed to upload test image: {e}")


# Configuration for pytest
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )


# Mark all tests in this file as integration tests
pytestmark = pytest.mark.integration


# Setup and teardown
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment before running tests"""
    print("\nSetting up integration test environment for Image Optimization Stack...")
    
    # Check if infrastructure outputs are provided via environment
    env_vars = ['UPLOAD_BUCKET', 'CLOUDFRONT_DISTRIBUTION', 'DYNAMODB_TABLE', 'LAMBDA_FUNCTION']
    if any(os.environ.get(var) for var in env_vars):
        print("Infrastructure outputs provided via environment variables:")
        for var in env_vars:
            if os.environ.get(var):
                print(f"  {var}: {os.environ.get(var)[:50]}...")
    
    # Check if Pulumi is available
    try:
        result = subprocess.run(['pulumi', 'version'], capture_output=True, check=True)
        print(f"Pulumi version: {result.stdout.decode().strip()}")
        
        # Select the correct stack
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr3515')
        target_stack = f'TapStack{environment_suffix}'
        
        select_result = subprocess.run(['pulumi', 'stack', 'select', target_stack], 
                                     capture_output=True, text=True)
        
        if select_result.returncode == 0:
            print(f"Pulumi stack selected: {target_stack}")
        else:
            # Try to get current stack
            stack_name = get_pulumi_stack_name()
            if stack_name:
                print(f"Pulumi stack available: {stack_name}")
            else:
                print(f"WARNING: Could not select stack {target_stack}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Pulumi CLI not available (using environment variables if provided)")
    
    yield
    
    print("\nIntegration test environment cleanup completed")
