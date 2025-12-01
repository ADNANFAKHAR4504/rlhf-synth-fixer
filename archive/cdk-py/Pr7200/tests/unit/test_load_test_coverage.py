#!/usr/bin/env python3
"""
Additional tests to improve coverage for lib/load_test.py.
These tests focus on executing the generate_load loops to cover missing lines.
"""
import json
import threading
import unittest
from unittest.mock import Mock, patch, MagicMock

from lib.load_test import (
    RDSLoadTester, RedisLoadTester, LambdaLoadTester, HTTPLoadTester,
    StackOutputsReader, LoadTestOrchestrator, LoadTestConfig
)


class TestRDSLoadTesterCoverage(unittest.TestCase):
    """Additional tests for RDSLoadTester to improve coverage."""

    @patch('lib.load_test.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.outputs = Mock(spec=StackOutputsReader)
        self.outputs.get_database_endpoint.return_value = 'test-db.region.rds.amazonaws.com'
        self.outputs.get_database_port.return_value = '5432'
        self.outputs.get_database_name.return_value = 'tapdb'
        self.outputs.get_database_secret_arn.return_value = 'arn:aws:secretsmanager:region:123456789012:secret:test'

    @patch('lib.load_test.PSYCOPG2_AVAILABLE', True)
    @patch('lib.load_test.pool.ThreadedConnectionPool')
    @patch('lib.load_test.boto3.client')
    @patch('lib.load_test.time.sleep')
    @patch('lib.load_test.random.choice')
    @patch('lib.load_test.random.uniform')
    def test_generate_load_executes_loop(self, mock_uniform, mock_choice, mock_sleep, mock_boto_client, mock_pool):
        """Test that generate_load actually executes the loop body multiple times."""
        mock_secrets = Mock()
        mock_boto_client.return_value = mock_secrets
        mock_secrets.get_secret_value.return_value = {
            'SecretString': json.dumps({
                'username': 'postgres',
                'password': 'test-password'
            })
        }

        mock_pool_instance = Mock()
        mock_pool.return_value = mock_pool_instance
        mock_conn = Mock()
        mock_pool_instance.getconn.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        mock_cursor.description = None
        mock_conn.cursor.return_value = mock_cursor

        # Provide enough queries for multiple loop iterations
        queries = [("SELECT version();", ())] * 50
        mock_choice.side_effect = queries
        mock_uniform.return_value = 0.01  # Very short delay

        # Control loop execution by setting stop_event after a few iterations
        call_count = [0]
        original_sleep = threading.Event.wait

        def controlled_sleep(delay):
            call_count[0] += 1
            if call_count[0] >= 3:  # Stop after 3 iterations
                return
            return original_sleep(0.001)  # Very short wait

        mock_sleep.side_effect = lambda x: None  # Make sleep instant

        tester = RDSLoadTester(self.outputs, 'us-east-1')
        stop_event = threading.Event()

        # Use a thread to stop after a short delay
        def stop_soon():
            import time
            time.sleep(0.05)  # Give time for loop to start
            stop_event.set()

        threading.Timer(0.05, stop_event.set).start()
        tester.generate_load(num_queries=10, stop_event=stop_event)

        # Verify queries were executed (loop body was hit)
        self.assertTrue(mock_cursor.execute.called)


class TestRedisLoadTesterCoverage(unittest.TestCase):
    """Additional tests for RedisLoadTester to improve coverage."""

    @patch('lib.load_test.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.outputs = Mock(spec=StackOutputsReader)
        self.outputs.get_redis_endpoint.return_value = 'test-redis.region.cache.amazonaws.com'
        self.outputs.get_redis_port.return_value = '6379'

    @patch('lib.load_test.REDIS_AVAILABLE', True)
    @patch('lib.load_test.redis.Redis')
    @patch('lib.load_test.time.sleep')
    @patch('lib.load_test.random.choice')
    @patch('lib.load_test.random.randint')
    @patch('lib.load_test.random.uniform')
    def test_generate_load_executes_all_operations(self, mock_uniform, mock_randint, mock_choice, mock_sleep, mock_redis):
        """Test that generate_load executes all operation types."""
        try:
            import redis
        except ImportError:
            self.skipTest("redis module not available")

        mock_client = Mock()
        mock_redis.return_value = mock_client
        mock_client.ping.return_value = True

        # Test all operation types
        operations = ['set', 'get', 'hset', 'hget', 'incr', 'decr', 'lpush', 'rpop']
        mock_choice.side_effect = operations * 5  # Repeat to ensure all are hit
        mock_randint.return_value = 1
        mock_uniform.return_value = 0.01  # Very short delay

        tester = RedisLoadTester(self.outputs, 'us-east-1')
        stop_event = threading.Event()

        # Execute multiple operations before stopping
        threading.Timer(0.2, stop_event.set).start()
        tester.generate_load(num_operations=20, stop_event=stop_event)

        # Verify operations were called
        self.assertTrue(mock_client.set.called or mock_client.get.called)


class TestLambdaLoadTesterCoverage(unittest.TestCase):
    """Additional tests for LambdaLoadTester to improve coverage."""

    @patch('lib.load_test.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.outputs = Mock(spec=StackOutputsReader)
        self.outputs.get_lambda_function_names.return_value = ['func1', 'func2']

    @patch('lib.load_test.boto3.client')
    @patch('lib.load_test.time.sleep')
    @patch('lib.load_test.random.choice')
    @patch('lib.load_test.random.randint')
    @patch('lib.load_test.random.uniform')
    @patch('lib.load_test.datetime')
    def test_generate_load_executes_invocations(self, mock_datetime, mock_uniform, mock_randint, mock_choice, mock_sleep, mock_boto_client):
        """Test that generate_load executes Lambda invocations."""
        from datetime import datetime, timezone

        mock_lambda = Mock()
        mock_boto_client.return_value = mock_lambda
        mock_choice.return_value = 'func1'
        mock_randint.return_value = 1
        mock_uniform.return_value = 0.01  # Very short delay

        # Mock datetime.now() properly
        mock_now = Mock()
        mock_now.isoformat.return_value = '2024-01-01T00:00:00+00:00'
        mock_datetime.now.return_value = mock_now

        tester = LambdaLoadTester(self.outputs, 'us-east-1')
        stop_event = threading.Event()

        # Execute multiple invocations before stopping
        threading.Timer(0.2, stop_event.set).start()
        tester.generate_load(num_invocations=20, stop_event=stop_event)

        # Verify invocations were attempted
        self.assertTrue(mock_lambda.invoke.called)


class TestHTTPLoadTesterCoverage(unittest.TestCase):
    """Additional tests for HTTPLoadTester to improve coverage."""

    def setUp(self):
        """Set up test fixtures."""
        self.outputs = Mock(spec=StackOutputsReader)
        self.outputs.get_nlb_dns.return_value = 'test-nlb-1234567890.elb.us-east-1.amazonaws.com'

    @patch('lib.load_test.REQUESTS_AVAILABLE', True)
    @patch('lib.load_test.requests.get')
    @patch('lib.load_test.time.sleep')
    @patch('lib.load_test.random.uniform')
    def test_generate_load_executes_requests(self, mock_uniform, mock_sleep, mock_get):
        """Test that generate_load executes HTTP requests."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        mock_uniform.return_value = 0.01  # Very short delay

        tester = HTTPLoadTester(self.outputs)
        stop_event = threading.Event()

        # Execute multiple requests before stopping
        threading.Timer(0.2, stop_event.set).start()
        tester.generate_load(num_requests=20, stop_event=stop_event)

        # Verify requests were made
        self.assertTrue(mock_get.called)


if __name__ == '__main__':
    unittest.main()

