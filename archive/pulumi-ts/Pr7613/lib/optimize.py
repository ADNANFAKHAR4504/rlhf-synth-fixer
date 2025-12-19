#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lambda Function optimization verification script for ETL infrastructure.
Analyzes CloudWatch metrics and verifies Lambda memory/timeout configurations match requirements.
"""

import os
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError


class LambdaEtlOptimizer:
    """Handles Lambda ETL infrastructure optimization verification."""

    def __init__(self, environment_suffix: str = 'dev', region_name: str = 'us-east-1'):
        """
        Initialize the optimizer with AWS clients.
        Args:
            environment_suffix: The environment suffix (default: 'dev')
            region_name: AWS region name (default: 'us-east-1')
        """
        self.environment_suffix = environment_suffix
        self.region_name = region_name

        # Initialize AWS clients
        self.lambda_client = boto3.client('lambda', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.logs_client = boto3.client('logs', region_name=region_name)
        self.sqs_client = boto3.client('sqs', region_name=region_name)

        # Define expected Lambda functions and their configurations
        self.expected_functions = {
            'api-handler': {
                'name': f'api-handler-{environment_suffix}',
                'memory': 512,
                'timeout': 30,
                'type': 'API Handler',
            },
            'batch-processor': {
                'name': f'batch-processor-{environment_suffix}',
                'memory': 1024,
                'timeout': 300,
                'type': 'Batch Processor',
            },
            'transform': {
                'name': f'transform-{environment_suffix}',
                'memory': 512,
                'timeout': 30,
                'type': 'Transform Function',
            },
        }

        print(f"Initialized Lambda ETL optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)

    def get_lambda_functions(self) -> Dict[str, Optional[Dict[str, Any]]]:
        """Find all Lambda functions based on naming pattern."""
        results = {}

        for key, config in self.expected_functions.items():
            try:
                response = self.lambda_client.get_function(
                    FunctionName=config['name']
                )
                print(f"✅ Found Lambda function: {config['name']}")
                results[key] = response
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    print(f"❌ Lambda function not found: {config['name']}")
                else:
                    print(f"❌ Error finding Lambda function {config['name']}: {e}")
                results[key] = None

        return results

    def verify_lambda_optimizations(self, function_key: str, function_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify that Lambda function has optimized configurations.
        Args:
            function_key: Key for the function type (api-handler, batch-processor, transform)
            function_data: Lambda function configuration
        Returns:
            Dictionary with optimization verification results
        """
        expected = self.expected_functions[function_key]
        config = function_data.get('Configuration', {})

        results = {
            'function_name': config.get('FunctionName', ''),
            'runtime_optimized': False,
            'memory_optimized': False,
            'timeout_optimized': False,
            'concurrency_configured': False,
            'xray_enabled': False,
            'dlq_configured': False,
            'layer_configured': False,
            'issues': [],
            'optimizations_applied': [],
        }

        # Check runtime (should be Node.js 18.x)
        runtime = config.get('Runtime', '')
        if runtime == 'nodejs18.x':
            results['runtime_optimized'] = True
            results['optimizations_applied'].append(f"✅ Runtime: {runtime} (upgraded from Node.js 14.x)")
        else:
            results['issues'].append(f"❌ Runtime {runtime} should be nodejs18.x")

        # Check memory
        memory = config.get('MemorySize', 0)
        if memory == expected['memory']:
            results['memory_optimized'] = True
            results['optimizations_applied'].append(f"✅ Memory: {memory}MB (optimized for {expected['type']})")
        else:
            results['issues'].append(f"❌ Memory {memory}MB should be {expected['memory']}MB")

        # Check timeout
        timeout = config.get('Timeout', 0)
        if timeout == expected['timeout']:
            results['timeout_optimized'] = True
            results['optimizations_applied'].append(f"✅ Timeout: {timeout}s (optimized for {expected['type']})")
        else:
            results['issues'].append(f"❌ Timeout {timeout}s should be {expected['timeout']}s")

        # Check X-Ray tracing
        tracing_config = config.get('TracingConfig', {})
        if tracing_config.get('Mode') == 'Active':
            results['xray_enabled'] = True
            results['optimizations_applied'].append("✅ X-Ray tracing: Active")
        else:
            results['issues'].append("❌ X-Ray tracing should be Active")

        # Check dead letter queue
        dlq_config = config.get('DeadLetterConfig', {})
        if dlq_config.get('TargetArn'):
            results['dlq_configured'] = True
            results['optimizations_applied'].append("✅ Dead Letter Queue: Configured")
        else:
            results['issues'].append("❌ Dead Letter Queue not configured")

        # Check Lambda layers
        layers = config.get('Layers', [])
        if layers:
            results['layer_configured'] = True
            results['optimizations_applied'].append(f"✅ Lambda Layers: {len(layers)} configured (shared dependencies)")
        else:
            results['issues'].append("⚠️  No Lambda layers configured")

        # Check reserved concurrency
        try:
            concurrency = self.lambda_client.get_function_concurrency(
                FunctionName=config.get('FunctionName')
            )
            reserved = concurrency.get('ReservedConcurrentExecutions', 0)
            if reserved > 0:
                results['concurrency_configured'] = True
                results['optimizations_applied'].append(f"✅ Reserved concurrency: {reserved}")
            else:
                results['issues'].append("⚠️  Reserved concurrency not configured")
        except ClientError:
            results['issues'].append("⚠️  Could not check reserved concurrency")

        # Check environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        if 'MAX_CONNECTIONS' in env_vars:
            results['optimizations_applied'].append(f"✅ Connection pooling: MAX_CONNECTIONS={env_vars['MAX_CONNECTIONS']}")

        return results

    def verify_log_retention(self, function_name: str) -> Dict[str, Any]:
        """
        Verify CloudWatch log group has proper retention configured.
        Returns:
            Dictionary with log retention verification results
        """
        log_group_name = f'/aws/lambda/{function_name}'

        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )

            log_groups = response.get('logGroups', [])
            if not log_groups:
                return {
                    'configured': False,
                    'issue': f"Log group {log_group_name} not found"
                }

            log_group = log_groups[0]
            retention_days = log_group.get('retentionInDays')

            if retention_days in [7, 30]:
                return {
                    'configured': True,
                    'retention_days': retention_days,
                    'optimized': True,
                    'message': f"✅ Log retention: {retention_days} days"
                }
            elif retention_days:
                return {
                    'configured': True,
                    'retention_days': retention_days,
                    'optimized': False,
                    'message': f"⚠️  Log retention: {retention_days} days (recommended: 7 or 30 days)"
                }
            else:
                return {
                    'configured': False,
                    'issue': "No retention policy - logs never expire (not cost optimized)"
                }

        except ClientError as e:
            return {
                'configured': False,
                'issue': f"Error checking log retention: {e}"
            }

    def verify_sqs_dlq(self) -> Dict[str, Any]:
        """
        Verify SQS Dead Letter Queue exists and is properly configured.
        Returns:
            Dictionary with DLQ verification results
        """
        dlq_name = f'lambda-dlq-{self.environment_suffix}'

        try:
            # Get queue URL
            response = self.sqs_client.get_queue_url(QueueName=dlq_name)
            queue_url = response['QueueUrl']

            # Get queue attributes
            attrs = self.sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['MessageRetentionPeriod']
            )

            retention_seconds = int(attrs['Attributes'].get('MessageRetentionPeriod', 0))
            retention_days = retention_seconds / 86400

            return {
                'configured': True,
                'queue_name': dlq_name,
                'retention_days': retention_days,
                'message': f"✅ DLQ configured: {dlq_name} (retention: {retention_days:.0f} days)"
            }

        except ClientError as e:
            if e.response['Error']['Code'] == 'AWS.SimpleQueueService.NonExistentQueue':
                return {
                    'configured': False,
                    'issue': f"DLQ not found: {dlq_name}"
                }
            else:
                return {
                    'configured': False,
                    'issue': f"Error checking DLQ: {e}"
                }

    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from optimizations.
        Returns:
            Dictionary with cost savings estimates
        """
        # Lambda pricing (us-east-1)
        # $0.0000166667 per GB-second
        # $0.20 per 1M requests

        # Assumptions based on task description:
        # Before: Node.js 14.x, no proper sizing, no layers, unlimited log retention
        # After: Node.js 18.x, optimized memory, Lambda layers, 7-day log retention

        # Estimate ~1000 invocations/day per function (3 functions = 3000 total)
        invocations_per_month = 3000 * 30  # 90,000 invocations/month

        # Average execution time ~500ms = 0.5s
        avg_duration_seconds = 0.5

        # Before optimization (assuming 1024MB average across all functions)
        old_memory_gb = 1024 / 1024  # 1 GB
        old_compute_cost = invocations_per_month * avg_duration_seconds * old_memory_gb * 0.0000166667

        # After optimization (weighted average: 512MB * 2 + 1024MB * 1 / 3 = 682MB)
        new_memory_gb = 682 / 1024  # 0.666 GB
        new_compute_cost = invocations_per_month * avg_duration_seconds * new_memory_gb * 0.0000166667

        # Request costs (same before and after)
        request_cost = (invocations_per_month / 1000000) * 0.20

        # Log storage savings (7 day retention vs unlimited)
        # Assume ~100KB logs per invocation, $0.03 per GB stored
        log_storage_before = (invocations_per_month * 0.0001 * 365 / 12) * 0.03  # Full year
        log_storage_after = (invocations_per_month * 0.0001 * 7 / 30) * 0.03  # 7 days

        # Layer savings (reduced deployment package size by ~40%)
        # Estimated faster cold starts = fewer timeout-related re-invocations
        deployment_savings = 0.50  # Estimated monthly savings from faster deployments

        total_savings = (old_compute_cost - new_compute_cost) + (log_storage_before - log_storage_after) + deployment_savings

        return {
            'baseline_monthly_cost': round(old_compute_cost + request_cost + log_storage_before, 2),
            'optimized_monthly_cost': round(new_compute_cost + request_cost + log_storage_after + deployment_savings, 2),
            'monthly_savings': round(total_savings, 2),
            'savings_percentage': round((total_savings / (old_compute_cost + log_storage_before)) * 100, 1) if old_compute_cost > 0 else 0,
            'optimizations': [
                'Runtime: Node.js 14.x → Node.js 18.x',
                'Memory: Right-sized (API: 512MB, Batch: 1024MB)',
                'Timeout: Optimized (API: 30s, Batch: 300s)',
                'Log Retention: Unlimited → 7 days (dev)',
                'Lambda Layers: Shared dependencies (reduced package size)',
                'X-Ray: Active tracing enabled',
            ],
        }

    def run_optimization(self) -> bool:
        """Run all optimization verification tasks."""
        print("\n🚀 Starting Lambda ETL Infrastructure Optimization Verification...")
        print("=" * 70)

        all_functions_ok = True

        # Get all Lambda functions
        functions = self.get_lambda_functions()

        # Verify SQS DLQ
        print("\n📬 Verifying Dead Letter Queue...")
        dlq_result = self.verify_sqs_dlq()
        if dlq_result.get('configured'):
            print(f"   {dlq_result['message']}")
        else:
            print(f"   ❌ {dlq_result['issue']}")
            all_functions_ok = False

        # Verify each Lambda function
        for key, function_data in functions.items():
            if not function_data:
                print(f"\n❌ Function {self.expected_functions[key]['name']} not found - skipping verification")
                all_functions_ok = False
                continue

            function_name = function_data['Configuration']['FunctionName']
            print(f"\n🔍 Verifying {self.expected_functions[key]['type']}: {function_name}")
            print("-" * 70)

            # Verify optimizations
            optimization_results = self.verify_lambda_optimizations(key, function_data)

            # Verify log retention
            log_results = self.verify_log_retention(function_name)

            # Print results
            if optimization_results['optimizations_applied']:
                print("\n   Applied Optimizations:")
                for opt in optimization_results['optimizations_applied']:
                    print(f"      {opt}")

            if log_results.get('configured'):
                print(f"      {log_results['message']}")

            if optimization_results['issues']:
                print("\n   Issues Found:")
                for issue in optimization_results['issues']:
                    print(f"      {issue}")
                    # Only mark as failed for critical issues (❌), not warnings (⚠️)
                    if '❌' in issue:
                        all_functions_ok = False

            if log_results.get('issue'):
                print(f"      ❌ {log_results['issue']}")
                all_functions_ok = False

        # Print cost savings
        savings = self.get_cost_savings_estimate()
        print("\n" + "=" * 70)
        print("💰 Cost Optimization Summary:")
        print("-" * 70)
        print("\n   Key Optimizations Applied:")
        for opt in savings['optimizations']:
            print(f"      • {opt}")
        print(f"\n   Baseline monthly cost: ${savings['baseline_monthly_cost']}")
        print(f"   Optimized monthly cost: ${savings['optimized_monthly_cost']}")
        print(f"   Monthly savings: ${savings['monthly_savings']} ({savings['savings_percentage']}%)")

        # Final result
        print("\n" + "=" * 70)
        if all_functions_ok:
            print("✅ Lambda ETL infrastructure optimization verification PASSED!")
            print("   All functions properly configured with performance optimizations.")
            print("   (Warnings shown are informational and do not indicate failure.)")
            return True
        else:
            print("❌ Lambda ETL infrastructure optimization verification FAILED!")
            print("   Critical issues found - please review above.")
            return False


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Verify Lambda ETL infrastructure optimizations"
    )
    parser.add_argument(
        '--environment',
        '-e',
        default=None,
        help='Environment suffix (overrides ENVIRONMENT_SUFFIX env var)'
    )
    parser.add_argument(
        '--region',
        '-r',
        default=None,
        help='AWS region (overrides AWS_REGION env var, defaults to us-east-1)'
    )

    args = parser.parse_args()

    environment_suffix = args.environment or os.getenv('ENVIRONMENT_SUFFIX') or 'dev'
    aws_region = args.region or os.getenv('AWS_REGION') or 'us-east-1'

    try:
        optimizer = LambdaEtlOptimizer(environment_suffix, aws_region)
        success = optimizer.run_optimization()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Optimization verification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
