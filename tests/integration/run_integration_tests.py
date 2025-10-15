"""
Integration Test Runner for TapStack Manufacturing IoT Platform.

Provides utilities and configuration for running integration tests against
deployed AWS infrastructure.
"""

import argparse
import json
import os
import sys
import time
from typing import Dict, List, Optional

import boto3
import pytest
from botocore.exceptions import ClientError, NoCredentialsError


class IntegrationTestRunner:
    """Runner for integration tests with deployment validation and configuration."""
    
    def __init__(self, region: str = 'us-east-1', profile: Optional[str] = None):
        """Initialize the integration test runner."""
        self.region = region
        self.profile = profile
        self.session = boto3.Session(profile_name=profile, region_name=region) if profile else boto3.Session(region_name=region)
        self.outputs_file = os.path.join('cfn-outputs', 'flat-outputs.json')
        
    def validate_aws_credentials(self) -> bool:
        """Validate AWS credentials are available and working."""
        try:
            sts = self.session.client('sts')
            identity = sts.get_caller_identity()
            print(f"✓ AWS credentials validated for account: {identity['Account']}")
            print(f"  User/Role: {identity['Arn']}")
            return True
        except NoCredentialsError:
            print("✗ No AWS credentials found")
            print("  Please configure AWS credentials using:")
            print("    - aws configure")
            print("    - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables")
            print("    - IAM role (if running on EC2)")
            return False
        except ClientError as e:
            print(f"✗ AWS credentials error: {e}")
            return False
    
    def check_deployment_outputs(self) -> Dict:
        """Check if deployment outputs are available and valid."""
        outputs_path = os.path.join(os.getcwd(), self.outputs_file)
        
        if not os.path.exists(outputs_path):
            print(f"✗ Deployment outputs file not found: {outputs_path}")
            print("  Please run deployment first:")
            print("    npm run deploy  # for CDK")
            print("    pulumi up       # for Pulumi") 
            return {}
        
        try:
            with open(outputs_path, 'r') as f:
                content = f.read().strip()
                if not content:
                    print(f"✗ Deployment outputs file is empty: {outputs_path}")
                    return {}
                
                outputs = json.loads(content)
                print(f"✓ Deployment outputs loaded: {len(outputs)} resources found")
                
                # Validate required outputs
                required_outputs = [
                    'vpc_id', 'ecs_cluster_arn', 'kinesis_stream_name',
                    'redis_endpoint', 'aurora_endpoint', 'api_gateway_url'
                ]
                
                missing_outputs = [key for key in required_outputs if key not in outputs]
                if missing_outputs:
                    print(f"⚠ Missing required outputs: {', '.join(missing_outputs)}")
                else:
                    print("✓ All required outputs present")
                
                return outputs
                
        except json.JSONDecodeError as e:
            print(f"✗ Invalid JSON in outputs file: {e}")
            return {}
        except Exception as e:
            print(f"✗ Error reading outputs file: {e}")
            return {}
    
    def validate_infrastructure_accessibility(self, outputs: Dict) -> bool:
        """Validate that infrastructure resources are accessible."""
        print("\nValidating infrastructure accessibility...")
        
        validation_results = []
        
        # Test VPC access
        if 'vpc_id' in outputs:
            try:
                ec2 = self.session.client('ec2')
                response = ec2.describe_vpcs(VpcIds=[outputs['vpc_id']])
                if response['Vpcs'] and response['Vpcs'][0]['State'] == 'available':
                    print("✓ VPC is accessible and available")
                    validation_results.append(True)
                else:
                    print("✗ VPC is not available")
                    validation_results.append(False)
            except ClientError as e:
                print(f"✗ VPC access error: {e}")
                validation_results.append(False)
        
        # Test ECS cluster access
        if 'ecs_cluster_arn' in outputs:
            try:
                ecs = self.session.client('ecs')
                cluster_name = outputs['ecs_cluster_arn'].split('/')[-1]
                response = ecs.describe_clusters(clusters=[cluster_name])
                if response['clusters'] and response['clusters'][0]['status'] == 'ACTIVE':
                    print("✓ ECS cluster is accessible and active")
                    validation_results.append(True)
                else:
                    print("✗ ECS cluster is not active")
                    validation_results.append(False)
            except ClientError as e:
                print(f"✗ ECS access error: {e}")
                validation_results.append(False)
        
        # Test Kinesis stream access
        if 'kinesis_stream_name' in outputs:
            try:
                kinesis = self.session.client('kinesis')
                response = kinesis.describe_stream(StreamName=outputs['kinesis_stream_name'])
                if response['StreamDescription']['StreamStatus'] == 'ACTIVE':
                    print("✓ Kinesis stream is accessible and active")
                    validation_results.append(True)
                else:
                    print("✗ Kinesis stream is not active")
                    validation_results.append(False)
            except ClientError as e:
                print(f"✗ Kinesis access error: {e}")
                validation_results.append(False)
        
        # Test RDS access
        if 'aurora_cluster_arn' in outputs:
            try:
                rds = self.session.client('rds')
                cluster_id = outputs['aurora_cluster_arn'].split(':')[-1]
                response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
                if response['DBClusters'] and response['DBClusters'][0]['Status'] == 'available':
                    print("✓ Aurora cluster is accessible and available")
                    validation_results.append(True)
                else:
                    print("✗ Aurora cluster is not available")
                    validation_results.append(False)
            except ClientError as e:
                print(f"✗ Aurora access error: {e}")
                validation_results.append(False)
        
        success_rate = sum(validation_results) / len(validation_results) if validation_results else 0
        print(f"\nInfrastructure validation: {success_rate:.1%} success rate")
        
        return success_rate >= 0.8  # 80% success rate required
    
    def run_tests(self, test_categories: Optional[List[str]] = None, verbose: bool = True) -> int:
        """Run integration tests with specified categories."""
        print(f"\n{'='*60}")
        print("TapStack Integration Test Runner")
        print(f"{'='*60}")
        
        # Validate prerequisites
        if not self.validate_aws_credentials():
            return 1
        
        outputs = self.check_deployment_outputs()
        if not outputs:
            return 1
        
        if not self.validate_infrastructure_accessibility(outputs):
            print("\n⚠ Infrastructure validation failed. Some tests may fail.")
            print("  Continuing with test execution...")
        
        # Prepare pytest arguments
        pytest_args = [
            'tests/integration/',
            '-v' if verbose else '',
            '--tb=short',
            '--durations=10',  # Show 10 slowest tests
            '--strict-markers',
            '--disable-warnings'
        ]
        
        # Add category-specific markers
        if test_categories:
            for category in test_categories:
                pytest_args.extend(['-m', category])
        
        # Filter out empty arguments
        pytest_args = [arg for arg in pytest_args if arg]
        
        # Set environment variables
        os.environ['AWS_REGION'] = self.region
        if self.profile:
            os.environ['AWS_PROFILE'] = self.profile
        
        print(f"\nRunning integration tests...")
        print(f"Test directory: tests/integration/")
        print(f"AWS Region: {self.region}")
        if self.profile:
            print(f"AWS Profile: {self.profile}")
        if test_categories:
            print(f"Test categories: {', '.join(test_categories)}")
        
        print(f"\nPytest command: pytest {' '.join(pytest_args)}")
        print(f"{'='*60}\n")
        
        # Run pytest
        exit_code = pytest.main(pytest_args)
        
        print(f"\n{'='*60}")
        if exit_code == 0:
            print("✓ All integration tests passed!")
        else:
            print(f"✗ Integration tests failed (exit code: {exit_code})")
        print(f"{'='*60}")
        
        return exit_code


def main():
    """Main entry point for the integration test runner."""
    parser = argparse.ArgumentParser(
        description='Run integration tests for TapStack Manufacturing IoT Platform',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Test Categories:
  integration    - All integration tests
  aws           - Tests requiring AWS credentials
  network       - Tests requiring network connectivity
  slow          - Long-running tests

Examples:
  python run_integration_tests.py                    # Run all integration tests
  python run_integration_tests.py --category aws     # Run AWS-specific tests
  python run_integration_tests.py --region us-west-2 # Use specific region
  python run_integration_tests.py --profile prod     # Use specific AWS profile
        '''
    )
    
    parser.add_argument(
        '--region',
        default='us-east-1',
        help='AWS region to use for testing (default: us-east-1)'
    )
    
    parser.add_argument(
        '--profile',
        help='AWS profile to use for testing'
    )
    
    parser.add_argument(
        '--category',
        action='append',
        dest='categories',
        help='Test categories to run (can be specified multiple times)'
    )
    
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Run tests with minimal output'
    )
    
    args = parser.parse_args()
    
    # Create and run integration test runner
    runner = IntegrationTestRunner(
        region=args.region,
        profile=args.profile
    )
    
    exit_code = runner.run_tests(
        test_categories=args.categories,
        verbose=not args.quiet
    )
    
    sys.exit(exit_code)


if __name__ == '__main__':
    main()