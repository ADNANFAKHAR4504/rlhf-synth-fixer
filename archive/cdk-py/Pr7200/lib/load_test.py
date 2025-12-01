#!/usr/bin/env python3
"""
Load testing script for TAP stack resources.
Generates realistic load on RDS, Redis, Lambda, and EC2 resources
to enable optimization recommendations.

Dependencies:
- boto3: Required (in Pipfile)
- psycopg2-binary: Optional, for RDS testing (in Pipfile dev-packages)
- requests: Optional, for HTTP testing (in Pipfile dev-packages)
- redis: Optional, for Redis testing (NOT in Pipfile - install separately if needed)
"""

import json
import logging
import os
import random
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import optional dependencies
try:
    import psycopg2
    from psycopg2 import pool
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    logger.warning("psycopg2 not available - RDS load testing will be skipped")

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("redis not available - Redis load testing will be skipped")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("requests not available - HTTP load testing will be skipped")


class LoadTestConfig:
    """Configuration for load testing."""

    def __init__(
        self,
        duration_minutes: int = 30,
        rds_threads: int = 20,
        redis_threads: int = 15,
        lambda_threads: int = 10,
        http_threads: int = 5,
        rds_queries_per_thread: int = 100,
        redis_ops_per_thread: int = 200,
        lambda_invocations_per_thread: int = 50,
        http_requests_per_thread: int = 100
    ):
        self.duration_minutes = duration_minutes
        self.rds_threads = rds_threads
        self.redis_threads = redis_threads
        self.lambda_threads = lambda_threads
        self.http_threads = http_threads
        self.rds_queries_per_thread = rds_queries_per_thread
        self.redis_ops_per_thread = redis_ops_per_thread
        self.lambda_invocations_per_thread = lambda_invocations_per_thread
        self.http_requests_per_thread = http_requests_per_thread


class StackOutputsReader:
    """Reads stack outputs from JSON file."""

    def __init__(self, outputs_file: str = 'cfn-outputs/flat-outputs.json'):
        self.outputs_file = outputs_file
        self.outputs = {}
        self._load_outputs()

    def _load_outputs(self):
        """Load outputs from JSON file."""
        if not os.path.exists(self.outputs_file):
            logger.warning(f"Outputs file not found: {self.outputs_file}")
            return

        try:
            with open(self.outputs_file, 'r') as f:
                self.outputs = json.load(f)
            logger.info(f"Loaded {len(self.outputs)} outputs from {self.outputs_file}")
        except Exception as e:
            logger.error(f"Error loading outputs: {e}")

    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get output value by key."""
        return self.outputs.get(key, default)

    def get_database_endpoint(self) -> Optional[str]:
        """Get RDS database endpoint."""
        return self.get('DatabaseEndpoint')

    def get_database_port(self) -> Optional[str]:
        """Get RDS database port."""
        return self.get('DatabasePort', '5432')

    def get_database_name(self) -> Optional[str]:
        """Get database name."""
        return self.get('DatabaseName', 'tapdb')

    def get_database_secret_arn(self) -> Optional[str]:
        """Get database secret ARN."""
        return self.get('DatabaseSecretArn')

    def get_redis_endpoint(self) -> Optional[str]:
        """Get Redis endpoint."""
        return self.get('RedisEndpoint')

    def get_redis_port(self) -> Optional[str]:
        """Get Redis port."""
        return self.get('RedisPort', '6379')

    def get_nlb_dns(self) -> Optional[str]:
        """Get NLB DNS name."""
        return self.get('NlbDnsName')

    def get_lambda_function_names(self) -> List[str]:
        """Get Lambda function names from outputs."""
        functions = []
        for key, value in self.outputs.items():
            if key.startswith('LambdaFunction') and key.endswith('Arn'):
                # Extract function name from ARN
                if isinstance(value, str) and ':function:' in value:
                    func_name = value.split(':function:')[-1].split(':')[0]
                    functions.append(func_name)
        return functions

    def get_region(self) -> Optional[str]:
        """Get AWS region."""
        return self.get('Region', 'us-east-1')


class RDSLoadTester:
    """Generates load on RDS database."""

    def __init__(self, outputs: StackOutputsReader, region: str):
        self.outputs = outputs
        self.region = region
        self.secretsmanager = boto3.client('secretsmanager', region_name=region)
        self.connection_pool = None
        self._setup_connection_pool()

    def _setup_connection_pool(self):
        """Setup database connection pool."""
        if not PSYCOPG2_AVAILABLE:
            logger.warning("psycopg2 not available, skipping RDS load testing")
            return

        endpoint = self.outputs.get_database_endpoint()
        port = self.outputs.get_database_port()
        dbname = self.outputs.get_database_name()
        secret_arn = self.outputs.get_database_secret_arn()

        if not endpoint or not secret_arn:
            logger.warning("Missing RDS connection details, skipping RDS load testing")
            return

        try:
            # Get database credentials from Secrets Manager
            secret_response = self.secretsmanager.get_secret_value(SecretId=secret_arn)
            secret = json.loads(secret_response['SecretString'])

            username = secret.get('username', 'postgres')
            password = secret.get('password')

            if not password:
                logger.warning("Could not retrieve database password")
                return

            # Create connection pool
            self.connection_pool = pool.ThreadedConnectionPool(
                minconn=5,
                maxconn=20,
                host=endpoint,
                port=int(port),
                database=dbname,
                user=username,
                password=password,
                connect_timeout=10
            )
            logger.info(f"RDS connection pool created for {endpoint}")
        except Exception as e:
            logger.error(f"Error setting up RDS connection pool: {e}")

    def _execute_query(self, query: str, params: tuple = None):
        """Execute a database query."""
        if not self.connection_pool:
            return None

        conn = None
        try:
            conn = self.connection_pool.getconn()
            with conn.cursor() as cur:
                cur.execute(query, params)
                if cur.description:
                    return cur.fetchall()
                conn.commit()
                return None
        except Exception as e:
            logger.debug(f"Query error: {e}")
            if conn:
                conn.rollback()
            return None
        finally:
            if conn:
                self.connection_pool.putconn(conn)

    def generate_load(self, num_queries: int, stop_event: threading.Event):
        """Generate database load."""
        if not self.connection_pool:
            return

        queries = [
            ("SELECT version();", ()),
            ("SELECT current_database(), current_user;", ()),
            ("SELECT COUNT(*) FROM pg_stat_activity;", ()),
            ("SELECT * FROM pg_stat_statements LIMIT 10;", ()),
            ("SELECT schemaname, tablename FROM pg_tables LIMIT 20;", ()),
            ("SELECT datname, numbackends, xact_commit, xact_rollback FROM pg_stat_database WHERE datname = current_database();", ()),
            ("SELECT pid, usename, application_name, state, query_start FROM pg_stat_activity WHERE state = 'active';", ()),
            ("SELECT relname, n_live_tup, n_dead_tup FROM pg_stat_user_tables LIMIT 10;", ()),
            ("SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes LIMIT 10;", ()),
            ("SELECT pg_size_pretty(pg_database_size(current_database()));", ()),
        ]

        executed = 0
        while executed < num_queries and not stop_event.is_set():
            query, params = random.choice(queries)
            self._execute_query(query, params)
            executed += 1
            time.sleep(random.uniform(0.1, 0.5))  # Random delay between queries

        logger.info(f"RDS load test completed: {executed} queries executed")


class RedisLoadTester:
    """Generates load on Redis cluster."""

    def __init__(self, outputs: StackOutputsReader, region: str):
        self.outputs = outputs
        self.region = region
        self.redis_client = None
        self._setup_redis_client()

    def _setup_redis_client(self):
        """Setup Redis client."""
        if not REDIS_AVAILABLE:
            logger.warning("redis not available, skipping Redis load testing")
            return

        endpoint = self.outputs.get_redis_endpoint()
        port = self.outputs.get_redis_port()

        if not endpoint:
            logger.warning("Missing Redis endpoint, skipping Redis load testing")
            return

        try:
            self.redis_client = redis.Redis(
                host=endpoint,
                port=int(port),
                decode_responses=True,
                socket_connect_timeout=10,
                socket_timeout=10
            )
            # Test connection
            self.redis_client.ping()
            logger.info(f"Redis client connected to {endpoint}:{port}")
        except Exception as e:
            logger.error(f"Error setting up Redis client: {e}")
            self.redis_client = None

    def generate_load(self, num_operations: int, stop_event: threading.Event):
        """Generate Redis load."""
        if not self.redis_client:
            return

        executed = 0
        while executed < num_operations and not stop_event.is_set():
            try:
                # Random operations
                op_type = random.choice(['set', 'get', 'hset', 'hget', 'incr', 'decr', 'lpush', 'rpop'])
                key = f"loadtest:{random.randint(1, 1000)}"

                if op_type == 'set':
                    self.redis_client.set(key, f"value_{random.randint(1, 10000)}", ex=3600)
                elif op_type == 'get':
                    self.redis_client.get(key)
                elif op_type == 'hset':
                    self.redis_client.hset(key, f"field_{random.randint(1, 10)}", f"value_{random.randint(1, 1000)}")
                elif op_type == 'hget':
                    self.redis_client.hget(key, f"field_{random.randint(1, 10)}")
                elif op_type == 'incr':
                    self.redis_client.incr(key)
                elif op_type == 'decr':
                    self.redis_client.decr(key)
                elif op_type == 'lpush':
                    self.redis_client.lpush(key, f"item_{random.randint(1, 1000)}")
                elif op_type == 'rpop':
                    self.redis_client.rpop(key)

                executed += 1
                time.sleep(random.uniform(0.05, 0.2))  # Random delay
            except Exception as e:
                logger.debug(f"Redis operation error: {e}")
                time.sleep(0.5)

        logger.info(f"Redis load test completed: {executed} operations executed")


class LambdaLoadTester:
    """Generates load on Lambda functions."""

    def __init__(self, outputs: StackOutputsReader, region: str):
        self.outputs = outputs
        self.region = region
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.function_names = outputs.get_lambda_function_names()

    def generate_load(self, num_invocations: int, stop_event: threading.Event):
        """Generate Lambda load."""
        if not self.function_names:
            logger.warning("No Lambda functions found in outputs")
            return

        executed = 0
        while executed < num_invocations and not stop_event.is_set():
            try:
                func_name = random.choice(self.function_names)
                payload = {
                    "source": "load-test",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "test_id": random.randint(1, 10000)
                }

                self.lambda_client.invoke(
                    FunctionName=func_name,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(payload)
                )
                executed += 1
                time.sleep(random.uniform(0.2, 1.0))  # Random delay
            except Exception as e:
                logger.debug(f"Lambda invocation error: {e}")
                time.sleep(1.0)

        logger.info(f"Lambda load test completed: {executed} invocations executed")


class HTTPLoadTester:
    """Generates HTTP load on NLB endpoint."""

    def __init__(self, outputs: StackOutputsReader):
        self.outputs = outputs
        self.nlb_dns = outputs.get_nlb_dns()

    def generate_load(self, num_requests: int, stop_event: threading.Event):
        """Generate HTTP load."""
        if not REQUESTS_AVAILABLE:
            logger.warning("requests not available, skipping HTTP load testing")
            return

        if not self.nlb_dns:
            logger.warning("Missing NLB DNS, skipping HTTP load testing")
            return

        executed = 0
        url = f"https://{self.nlb_dns}"

        while executed < num_requests and not stop_event.is_set():
            try:
                # Use a short timeout to avoid hanging
                response = requests.get(
                    url,
                    timeout=5,
                    verify=False,  # NLB may not have valid SSL cert
                    allow_redirects=True
                )
                executed += 1
                time.sleep(random.uniform(0.5, 2.0))  # Random delay
            except Exception as e:
                logger.debug(f"HTTP request error: {e}")
                time.sleep(1.0)

        logger.info(f"HTTP load test completed: {executed} requests executed")


class LoadTestOrchestrator:
    """Orchestrates load testing across all resources."""

    def __init__(self, config: LoadTestConfig, outputs_file: str = 'cfn-outputs/flat-outputs.json'):
        self.config = config
        self.outputs = StackOutputsReader(outputs_file)
        self.region = self.outputs.get_region() or 'us-east-1'
        self.stop_event = threading.Event()
        self.results = {
            'rds': {'executed': 0, 'errors': 0},
            'redis': {'executed': 0, 'errors': 0},
            'lambda': {'executed': 0, 'errors': 0},
            'http': {'executed': 0, 'errors': 0}
        }

    def run_load_test(self):
        """Run comprehensive load test."""
        logger.info("="*60)
        logger.info("Starting Load Test")
        logger.info("="*60)
        logger.info(f"Duration: {self.config.duration_minutes} minutes")
        logger.info(f"Region: {self.region}")
        logger.info(f"RDS threads: {self.config.rds_threads}")
        logger.info(f"Redis threads: {self.config.redis_threads}")
        logger.info(f"Lambda threads: {self.config.lambda_threads}")
        logger.info(f"HTTP threads: {self.config.http_threads}")
        logger.info("="*60)

        start_time = time.time()
        end_time = start_time + (self.config.duration_minutes * 60)

        # Create load testers
        rds_tester = RDSLoadTester(self.outputs, self.region)
        redis_tester = RedisLoadTester(self.outputs, self.region)
        lambda_tester = LambdaLoadTester(self.outputs, self.region)
        http_tester = HTTPLoadTester(self.outputs)

        # Start load generation threads
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = []

            # RDS load threads
            for i in range(self.config.rds_threads):
                future = executor.submit(
                    rds_tester.generate_load,
                    self.config.rds_queries_per_thread,
                    self.stop_event
                )
                futures.append(('rds', future))

            # Redis load threads
            for i in range(self.config.redis_threads):
                future = executor.submit(
                    redis_tester.generate_load,
                    self.config.redis_ops_per_thread,
                    self.stop_event
                )
                futures.append(('redis', future))

            # Lambda load threads
            for i in range(self.config.lambda_threads):
                future = executor.submit(
                    lambda_tester.generate_load,
                    self.config.lambda_invocations_per_thread,
                    self.stop_event
                )
                futures.append(('lambda', future))

            # HTTP load threads
            for i in range(self.config.http_threads):
                future = executor.submit(
                    http_tester.generate_load,
                    self.config.http_requests_per_thread,
                    self.stop_event
                )
                futures.append(('http', future))

            # Monitor and wait for completion or timeout
            logger.info("Load test in progress...")
            while time.time() < end_time:
                time.sleep(10)
                elapsed = int(time.time() - start_time)
                remaining = int(end_time - time.time())
                logger.info(f"Elapsed: {elapsed}s, Remaining: {remaining}s")

            # Stop all threads
            logger.info("Stopping load test...")
            self.stop_event.set()

            # Wait for all threads to complete
            for resource_type, future in futures:
                try:
                    future.result(timeout=30)
                except Exception as e:
                    logger.error(f"Error in {resource_type} load test: {e}")
                    self.results[resource_type]['errors'] += 1

        # Print summary
        self._print_summary()

    def _print_summary(self):
        """Print load test summary."""
        logger.info("\n" + "="*60)
        logger.info("Load Test Summary")
        logger.info("="*60)
        logger.info(f"RDS: {self.results['rds']['executed']} queries, {self.results['rds']['errors']} errors")
        logger.info(f"Redis: {self.results['redis']['executed']} operations, {self.results['redis']['errors']} errors")
        logger.info(f"Lambda: {self.results['lambda']['executed']} invocations, {self.results['lambda']['errors']} errors")
        logger.info(f"HTTP: {self.results['http']['executed']} requests, {self.results['http']['errors']} errors")
        logger.info("="*60)


def main():
    """Main entry point for load testing script."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate load on TAP stack resources for optimization testing'
    )
    parser.add_argument(
        '--duration',
        type=int,
        default=30,
        help='Load test duration in minutes (default: 30)'
    )
    parser.add_argument(
        '--rds-threads',
        type=int,
        default=20,
        help='Number of RDS load threads (default: 20)'
    )
    parser.add_argument(
        '--redis-threads',
        type=int,
        default=15,
        help='Number of Redis load threads (default: 15)'
    )
    parser.add_argument(
        '--lambda-threads',
        type=int,
        default=10,
        help='Number of Lambda load threads (default: 10)'
    )
    parser.add_argument(
        '--http-threads',
        type=int,
        default=5,
        help='Number of HTTP load threads (default: 5)'
    )
    parser.add_argument(
        '--outputs-file',
        type=str,
        default='cfn-outputs/flat-outputs.json',
        help='Path to stack outputs JSON file'
    )

    args = parser.parse_args()

    config = LoadTestConfig(
        duration_minutes=args.duration,
        rds_threads=args.rds_threads,
        redis_threads=args.redis_threads,
        lambda_threads=args.lambda_threads,
        http_threads=args.http_threads
    )

    orchestrator = LoadTestOrchestrator(config, args.outputs_file)
    orchestrator.run_load_test()


if __name__ == "__main__":
    main()

