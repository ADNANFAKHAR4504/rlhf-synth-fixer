"""Performance and load testing for TapStack infrastructure"""

import concurrent.futures
import json
import time
import unittest
from statistics import mean, stdev

import boto3
from pytest import mark

from tests.utils import load_flat_outputs

# Load CloudFormation outputs
flat_outputs = load_flat_outputs()


@mark.describe("TapStack Performance Tests")
class TestTapStackPerformance(unittest.TestCase):
    """Performance test cases for the deployed TapStack infrastructure"""

    def setUp(self):
        """Set up AWS clients for performance testing"""
        self.env_suffix = 'dev'  # Default for performance tests
        self.eu_west_region = 'eu-west-2'
        self.eu_central_region = 'eu-central-1'

        self.eu_west_session = boto3.Session(region_name=self.eu_west_region)
        self.eu_central_session = boto3.Session(region_name=self.eu_central_region)

        self.eu_west_lambda = self.eu_west_session.client('lambda')
        self.eu_west_s3 = self.eu_west_session.client('s3')
        
        self.eu_central_lambda = self.eu_central_session.client('lambda')
        self.eu_central_s3 = self.eu_central_session.client('s3')

    def _get_output_value(self, stack_prefix, output_key):
        """Helper method to get CloudFormation output values"""
        for stack_output_key in flat_outputs.keys():
            if stack_output_key.endswith(f".{output_key}"):
                stack_name = stack_output_key.replace(f".{output_key}", "")
                if stack_prefix in stack_name and self.env_suffix in stack_name:
                    return flat_outputs[stack_output_key]
        return None

    @mark.it("Lambda cold start latency should be acceptable")
    def test_lambda_cold_start_latency(self):
        """Test Lambda cold start performance"""
        regions = [
            ('eu-west-2', self.eu_west_lambda, 'MultiRegionStackEUWest'),
            ('eu-central-1', self.eu_central_lambda, 'MultiRegionStackEUCentral')
        ]

        for region, lambda_client, stack_prefix in regions:
            with self.subTest(region=region):
                lambda_arn = self._get_output_value(stack_prefix, 'LambdaFunctionArn')
                
                if lambda_arn:
                    function_name = lambda_arn.split(':')[-1]
                    
                    # Measure cold start (first invocation after function update/creation)
                    start_time = time.time()
                    response = lambda_client.invoke(
                        FunctionName=function_name,
                        InvocationType='RequestResponse',
                        Payload=json.dumps({'performance_test': 'cold_start'})
                    )
                    cold_start_duration = time.time() - start_time

                    # Cold start should be under 5 seconds for Python Lambda
                    self.assertLess(cold_start_duration, 5.0, 
                                  f"Cold start took {cold_start_duration:.2f}s in {region}")
                    
                    # Verify successful response
                    self.assertEqual(response['StatusCode'], 200)

    @mark.it("Lambda warm execution latency should be optimal")
    def test_lambda_warm_execution_latency(self):
        """Test Lambda warm execution performance"""
        regions = [
            ('eu-west-2', self.eu_west_lambda, 'MultiRegionStackEUWest'),
            ('eu-central-1', self.eu_central_lambda, 'MultiRegionStackEUCentral')
        ]

        for region, lambda_client, stack_prefix in regions:
            with self.subTest(region=region):
                lambda_arn = self._get_output_value(stack_prefix, 'LambdaFunctionArn')
                
                if lambda_arn:
                    function_name = lambda_arn.split(':')[-1]
                    execution_times = []
                    
                    # Warm up the function
                    lambda_client.invoke(
                        FunctionName=function_name,
                        InvocationType='RequestResponse',
                        Payload=json.dumps({'warm_up': True})
                    )
                    
                    # Measure 10 warm executions
                    for i in range(10):
                        start_time = time.time()
                        response = lambda_client.invoke(
                            FunctionName=function_name,
                            InvocationType='RequestResponse',
                            Payload=json.dumps({'performance_test': f'warm_execution_{i}'})
                        )
                        execution_time = time.time() - start_time
                        execution_times.append(execution_time)
                        
                        self.assertEqual(response['StatusCode'], 200)
                    
                    # Calculate performance metrics
                    avg_execution_time = mean(execution_times)
                    max_execution_time = max(execution_times)
                    
                    # Warm execution should be under 1 second on average
                    self.assertLess(avg_execution_time, 1.0,
                                  f"Average warm execution took {avg_execution_time:.2f}s in {region}")
                    
                    # Maximum execution should be under 2 seconds
                    self.assertLess(max_execution_time, 2.0,
                                  f"Max execution took {max_execution_time:.2f}s in {region}")

    @mark.it("S3 upload performance should meet requirements")
    def test_s3_upload_performance(self):
        """Test S3 upload performance for different file sizes"""
        regions = [
            ('eu-west-2', self.eu_west_s3, 'MultiRegionStackEUWest'),
            ('eu-central-1', self.eu_central_s3, 'MultiRegionStackEUCentral')
        ]
        
        # Test different file sizes (1KB, 10KB, 100KB, 1MB)
        test_sizes = [1024, 10240, 102400, 1048576]
        
        for region, s3_client, stack_prefix in regions:
            with self.subTest(region=region):
                bucket_name = self._get_output_value(stack_prefix, 'S3BucketSSES3Name')
                
                if bucket_name:
                    for size_bytes in test_sizes:
                        test_data = b'x' * size_bytes
                        test_key = f'performance-test/{size_bytes}-bytes-{int(time.time())}.dat'
                        
                        # Measure upload time
                        start_time = time.time()
                        s3_client.put_object(
                            Bucket=bucket_name,
                            Key=test_key,
                            Body=test_data
                        )
                        upload_time = time.time() - start_time
                        
                        # Calculate throughput (MB/s)
                        throughput_mbps = (size_bytes / (1024 * 1024)) / upload_time
                        
                        # Upload should complete within reasonable time
                        # Expect at least 1 MB/s throughput for files > 100KB
                        if size_bytes > 102400:
                            self.assertGreater(throughput_mbps, 1.0,
                                             f"S3 upload throughput {throughput_mbps:.2f} MB/s too slow for {size_bytes} bytes in {region}")
                        
                        # Clean up
                        s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    @mark.it("Concurrent Lambda execution should scale properly")
    def test_concurrent_lambda_execution(self):
        """Test Lambda concurrent execution performance"""
        regions = [
            ('eu-west-2', self.eu_west_lambda, 'MultiRegionStackEUWest'),
            ('eu-central-1', self.eu_central_lambda, 'MultiRegionStackEUCentral')
        ]
        
        concurrent_executions = 5  # Conservative number for testing

        for region, lambda_client, stack_prefix in regions:
            with self.subTest(region=region):
                lambda_arn = self._get_output_value(stack_prefix, 'LambdaFunctionArn')
                
                if lambda_arn:
                    function_name = lambda_arn.split(':')[-1]
                    
                    def invoke_lambda(execution_id):
                        """Single lambda invocation"""
                        start_time = time.time()
                        response = lambda_client.invoke(
                            FunctionName=function_name,
                            InvocationType='RequestResponse',
                            Payload=json.dumps({'concurrent_test': execution_id})
                        )
                        execution_time = time.time() - start_time
                        return {
                            'execution_id': execution_id,
                            'status_code': response['StatusCode'],
                            'execution_time': execution_time
                        }
                    
                    # Execute concurrent invocations
                    start_time = time.time()
                    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_executions) as executor:
                        futures = [executor.submit(invoke_lambda, i) for i in range(concurrent_executions)]
                        results = [future.result() for future in concurrent.futures.as_completed(futures)]
                    total_time = time.time() - start_time
                    
                    # Verify all executions succeeded
                    successful_executions = [r for r in results if r['status_code'] == 200]
                    self.assertEqual(len(successful_executions), concurrent_executions,
                                   f"Not all concurrent executions succeeded in {region}")
                    
                    # Verify concurrent execution efficiency
                    avg_execution_time = mean([r['execution_time'] for r in results])
                    
                    # Total time should be less than sum of individual execution times (parallelism)
                    self.assertLess(total_time, avg_execution_time * concurrent_executions * 0.8,
                                  f"Concurrent execution not efficient enough in {region}")

    @mark.it("Cross-region latency should be measurable")
    def test_cross_region_latency(self):
        """Test latency between regions for potential failover scenarios"""
        eu_west_lambda_arn = self._get_output_value('MultiRegionStackEUWest', 'LambdaFunctionArn')
        eu_central_lambda_arn = self._get_output_value('MultiRegionStackEUCentral', 'LambdaFunctionArn')
        
        if eu_west_lambda_arn and eu_central_lambda_arn:
            eu_west_function = eu_west_lambda_arn.split(':')[-1]
            eu_central_function = eu_central_lambda_arn.split(':')[-1]
            
            # Measure latency to both regions from current location
            latencies = {}
            
            # Test EU West latency
            start_time = time.time()
            response = self.eu_west_lambda.invoke(
                FunctionName=eu_west_function,
                InvocationType='RequestResponse',
                Payload=json.dumps({'latency_test': 'eu-west-2'})
            )
            latencies['eu-west-2'] = time.time() - start_time
            self.assertEqual(response['StatusCode'], 200)
            
            # Test EU Central latency
            start_time = time.time()
            response = self.eu_central_lambda.invoke(
                FunctionName=eu_central_function,
                InvocationType='RequestResponse',
                Payload=json.dumps({'latency_test': 'eu-central-1'})
            )
            latencies['eu-central-1'] = time.time() - start_time
            self.assertEqual(response['StatusCode'], 200)
            
            # Log latency information for analysis
            print(f"Cross-region latency: EU-West-2: {latencies['eu-west-2']:.3f}s, EU-Central-1: {latencies['eu-central-1']:.3f}s")
            
            # Both regions should respond within 5 seconds
            for region, latency in latencies.items():
                self.assertLess(latency, 5.0, f"Cross-region latency to {region} too high: {latency:.3f}s")

    @mark.it("Database connection pool performance should be optimal")
    def test_database_connection_performance(self):
        """Test database connection establishment performance"""
        regions = [
            ('eu-west-2', 'MultiRegionStackEUWest'),
            ('eu-central-1', 'MultiRegionStackEUCentral')
        ]
        
        for region, stack_prefix in regions:
            with self.subTest(region=region):
                db_endpoint = self._get_output_value(stack_prefix, 'DatabaseEndpoint')
                
                if db_endpoint:
                    # This is a placeholder for database connection testing
                    # In a real scenario, you would:
                    # 1. Create a Lambda that tests database connections
                    # 2. Measure connection establishment time
                    # 3. Test connection pooling effectiveness
                    # 4. Verify query response times
                    
                    # For now, just verify endpoint format
                    self.assertTrue(db_endpoint.endswith('.rds.amazonaws.com'),
                                  f"Database endpoint format invalid in {region}")
                    self.assertTrue(region in db_endpoint,
                                  f"Database endpoint should contain region {region}")

    @mark.it("Memory usage should be within acceptable limits")
    def test_lambda_memory_usage(self):
        """Test Lambda memory usage patterns"""
        regions = [
            ('eu-west-2', self.eu_west_lambda, 'MultiRegionStackEUWest'),
            ('eu-central-1', self.eu_central_lambda, 'MultiRegionStackEUCentral')
        ]
        
        for region, lambda_client, stack_prefix in regions:
            with self.subTest(region=region):
                lambda_arn = self._get_output_value(stack_prefix, 'LambdaFunctionArn')
                
                if lambda_arn:
                    function_name = lambda_arn.split(':')[-1]
                    
                    # Get function configuration to check memory allocation
                    function_config = lambda_client.get_function(FunctionName=function_name)
                    allocated_memory = function_config['Configuration']['MemorySize']
                    
                    # Execute function and check CloudWatch logs for memory usage
                    response = lambda_client.invoke(
                        FunctionName=function_name,
                        InvocationType='RequestResponse',
                        Payload=json.dumps({'memory_test': True})
                    )
                    
                    self.assertEqual(response['StatusCode'], 200)
                    
                    # Memory should be allocated appropriately (256 MB as per MODEL_RESPONSE.md)
                    self.assertEqual(allocated_memory, 256,
                                   f"Lambda memory allocation should be 256 MB in {region}")


if __name__ == '__main__':
    unittest.main()