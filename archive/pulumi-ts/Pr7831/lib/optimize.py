#!/usr/bin/env python3
"""
Infrastructure optimization script for Lambda data processing infrastructure.

This script optimizes deployed AWS resources to reduce costs while maintaining
functionality. It connects to AWS, finds resources using environmentSuffix patterns,
and applies optimizations via AWS APIs.

Usage:
    export ENVIRONMENT_SUFFIX=dev
    export AWS_REGION=us-east-1
    python3 lib/optimize.py [--dry-run]

Optimizations:
- Lambda memory: 3008MB → Dynamic sizing (512MB-1024MB based on usage)
- CloudWatch log retention: Verify 7 days (already optimized in baseline)
- Reserved concurrency: Adjust based on actual usage patterns
"""

import os
import sys
import json
import time
import argparse
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

try:
    import boto3
    from botocore.exceptions import ClientError, BotoCoreError
except ImportError:
    print("ERROR: boto3 not installed. Run: pip install boto3")
    sys.exit(1)


class InfrastructureOptimizer:
    """Optimizes Lambda-based data processing infrastructure."""

    def __init__(self, environment_suffix: str, region_name: str, dry_run: bool = False):
        """
        Initialize the optimizer.

        Args:
            environment_suffix: Environment identifier (e.g., 'dev', 'prod')
            region_name: AWS region name
            dry_run: If True, only show what would be changed
        """
        self.environment_suffix = environment_suffix
        self.region_name = region_name
        self.dry_run = dry_run

        # Initialize AWS clients
        try:
            self.lambda_client = boto3.client('lambda', region_name=region_name)
            self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
            self.logs_client = boto3.client('logs', region_name=region_name)
            self.sqs_client = boto3.client('sqs', region_name=region_name)
        except Exception as e:
            print(f"ERROR: Failed to initialize AWS clients: {e}")
            sys.exit(1)

        self.optimizations_applied = []
        self.cost_savings = {
            'lambda_memory': 0.0,
            'log_retention': 0.0,
            'concurrency': 0.0,
        }

    def optimize_lambda_function(self) -> bool:
        """
        Optimize Lambda function memory and configuration.

        Returns:
            True if optimizations were applied, False otherwise
        """
        function_name = f"data-processing-{self.environment_suffix}"

        try:
            # Get current function configuration
            response = self.lambda_client.get_function_configuration(
                FunctionName=function_name
            )

            current_memory = response.get('MemorySize', 128)
            current_concurrency = response.get('ReservedConcurrentExecutions', 0)

            print(f"\nFound Lambda function: {function_name}")
            print(f"  Current memory: {current_memory}MB")
            print(f"  Current reserved concurrency: {current_concurrency}")

            # Analyze actual memory usage from CloudWatch
            optimal_memory = self._calculate_optimal_memory(function_name)

            # Optimize memory if needed
            if current_memory != optimal_memory:
                if self.dry_run:
                    print(f"  [DRY-RUN] Would update memory: {current_memory}MB → {optimal_memory}MB")
                else:
                    print(f"  Updating memory: {current_memory}MB → {optimal_memory}MB")
                    self.lambda_client.update_function_configuration(
                        FunctionName=function_name,
                        MemorySize=optimal_memory
                    )

                    # Wait for update to complete
                    self._wait_for_function_update(function_name)

                # Calculate cost savings
                # Lambda pricing: ~$0.0000166667 per GB-second
                # Assume 1M invocations/month, avg 100ms duration
                savings_per_month = (
                    (current_memory - optimal_memory) / 1024 * 0.0000166667 * 1000000 * 0.1
                )
                self.cost_savings['lambda_memory'] = savings_per_month

                self.optimizations_applied.append({
                    'resource': function_name,
                    'type': 'Lambda Memory',
                    'old_value': f"{current_memory}MB",
                    'new_value': f"{optimal_memory}MB",
                    'monthly_savings': f"${savings_per_month:.2f}"
                })

            # Optimize reserved concurrency
            optimal_concurrency = self._calculate_optimal_concurrency(function_name)
            if current_concurrency != optimal_concurrency:
                if self.dry_run:
                    print(f"  [DRY-RUN] Would update concurrency: {current_concurrency} → {optimal_concurrency}")
                else:
                    print(f"  Updating reserved concurrency: {current_concurrency} → {optimal_concurrency}")
                    if optimal_concurrency == 0:
                        self.lambda_client.delete_function_concurrency(
                            FunctionName=function_name
                        )
                    else:
                        self.lambda_client.put_function_concurrency(
                            FunctionName=function_name,
                            ReservedConcurrentExecutions=optimal_concurrency
                        )

                self.optimizations_applied.append({
                    'resource': function_name,
                    'type': 'Lambda Concurrency',
                    'old_value': str(current_concurrency),
                    'new_value': str(optimal_concurrency),
                    'monthly_savings': '$0.00'
                })

            return True

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"ERROR: Lambda function not found: {function_name}")
            else:
                print(f"ERROR: Failed to optimize Lambda function: {e}")
            return False
        except Exception as e:
            print(f"ERROR: Unexpected error optimizing Lambda: {e}")
            return False

    def _calculate_optimal_memory(self, function_name: str) -> int:
        """
        Calculate optimal memory size based on CloudWatch metrics.

        Args:
            function_name: Name of the Lambda function

        Returns:
            Optimal memory size in MB
        """
        try:
            # Query CloudWatch for actual memory usage
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=7)

            # Get max memory used metric
            response = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/Lambda',
                MetricName='MemoryUtilization',
                Dimensions=[
                    {'Name': 'FunctionName', 'Value': function_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Maximum', 'Average']
            )

            if response['Datapoints']:
                # Get max utilization
                max_util = max(dp['Maximum'] for dp in response['Datapoints'])
                avg_util = sum(dp['Average'] for dp in response['Datapoints']) / len(response['Datapoints'])

                print(f"  Memory utilization: max={max_util:.1f}%, avg={avg_util:.1f}%")

                # If utilization is low, reduce memory
                # Keep 20% headroom for safety
                if max_util < 60:
                    # For baseline 3008MB, optimize to 1024MB if usage is low
                    return 1024
                elif max_util < 80:
                    return 2048
                else:
                    return 3008
            else:
                print("  No memory utilization metrics found, using conservative 1024MB")
                # No metrics available, use conservative value
                return 1024

        except Exception as e:
            print(f"  WARNING: Could not calculate optimal memory: {e}")
            # Default to safe optimization
            return 1024

    def _calculate_optimal_concurrency(self, function_name: str) -> int:
        """
        Calculate optimal reserved concurrency based on usage patterns.

        Args:
            function_name: Name of the Lambda function

        Returns:
            Optimal reserved concurrency
        """
        try:
            # Query CloudWatch for concurrent executions
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=7)

            response = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/Lambda',
                MetricName='ConcurrentExecutions',
                Dimensions=[
                    {'Name': 'FunctionName', 'Value': function_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Maximum']
            )

            if response['Datapoints']:
                max_concurrent = max(dp['Maximum'] for dp in response['Datapoints'])
                print(f"  Max concurrent executions: {max_concurrent:.0f}")

                # Add 50% headroom
                optimal = int(max_concurrent * 1.5)

                # For dev environments with low usage, can reduce to 5
                if optimal < 5:
                    return 5

                return min(optimal, 10)  # Cap at baseline value
            else:
                print("  No concurrency metrics found, using 5")
                return 5

        except Exception as e:
            print(f"  WARNING: Could not calculate optimal concurrency: {e}")
            return 5

    def _wait_for_function_update(self, function_name: str, max_wait: int = 60):
        """
        Wait for Lambda function update to complete.

        Args:
            function_name: Name of the function
            max_wait: Maximum seconds to wait
        """
        print("  Waiting for update to complete...", end='', flush=True)

        start_time = time.time()
        while time.time() - start_time < max_wait:
            try:
                response = self.lambda_client.get_function(FunctionName=function_name)
                state = response['Configuration'].get('State', 'Active')
                last_update_status = response['Configuration'].get('LastUpdateStatus', 'Successful')

                if state == 'Active' and last_update_status == 'Successful':
                    print(" Done!")
                    return

                print(".", end='', flush=True)
                time.sleep(2)

            except Exception as e:
                print(f"\n  WARNING: Error checking update status: {e}")
                return

        print("\n  WARNING: Update did not complete within timeout")

    def verify_log_retention(self) -> bool:
        """
        Verify CloudWatch log retention is set correctly.

        Returns:
            True if verification passed, False otherwise
        """
        log_group_name = f"/aws/lambda/data-processing-{self.environment_suffix}"

        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )

            if not response['logGroups']:
                print(f"WARNING: Log group not found: {log_group_name}")
                return False

            for log_group in response['logGroups']:
                if log_group['logGroupName'] == log_group_name:
                    retention = log_group.get('retentionInDays', 'Never expire')
                    print(f"\nLog group: {log_group_name}")
                    print(f"  Retention: {retention} days")

                    if retention == 7:
                        print("  ✓ Retention already optimized")
                    else:
                        print(f"  WARNING: Expected 7 days, found {retention}")

                    return True

            return False

        except Exception as e:
            print(f"ERROR: Failed to verify log retention: {e}")
            return False

    def verify_dlq_configuration(self) -> bool:
        """
        Verify Dead Letter Queue is configured correctly.

        Returns:
            True if verification passed, False otherwise
        """
        function_name = f"data-processing-{self.environment_suffix}"

        try:
            response = self.lambda_client.get_function_configuration(
                FunctionName=function_name
            )

            dlq_config = response.get('DeadLetterConfig', {})
            target_arn = dlq_config.get('TargetArn')

            print(f"\nDead Letter Queue configuration:")
            if target_arn:
                print(f"  ✓ DLQ configured: {target_arn}")
                return True
            else:
                print("  WARNING: No DLQ configured")
                return False

        except Exception as e:
            print(f"ERROR: Failed to verify DLQ configuration: {e}")
            return False

    def get_optimization_report(self) -> Dict[str, Any]:
        """
        Generate optimization report.

        Returns:
            Dictionary containing optimization results and cost savings
        """
        total_savings = sum(self.cost_savings.values())

        return {
            'environment': self.environment_suffix,
            'region': self.region_name,
            'timestamp': datetime.utcnow().isoformat(),
            'dry_run': self.dry_run,
            'optimizations': self.optimizations_applied,
            'cost_savings': {
                **self.cost_savings,
                'total_monthly': total_savings
            },
            'annual_savings': total_savings * 12
        }


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description='Optimize Lambda data processing infrastructure'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without making changes'
    )
    parser.add_argument(
        '--region',
        default=os.environ.get('AWS_REGION', 'us-east-1'),
        help='AWS region (default: AWS_REGION env var or us-east-1)'
    )

    args = parser.parse_args()

    # Get environment suffix
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX')
    if not environment_suffix:
        print("ERROR: ENVIRONMENT_SUFFIX environment variable not set")
        print("Usage: export ENVIRONMENT_SUFFIX=dev && python3 lib/optimize.py")
        sys.exit(1)

    print("=" * 80)
    print("Lambda Data Processing Infrastructure Optimization")
    print("=" * 80)
    print(f"Environment: {environment_suffix}")
    print(f"Region: {args.region}")
    print(f"Mode: {'DRY-RUN' if args.dry_run else 'LIVE'}")
    print("=" * 80)

    # Create optimizer
    optimizer = InfrastructureOptimizer(
        environment_suffix=environment_suffix,
        region_name=args.region,
        dry_run=args.dry_run
    )

    # Run optimizations
    success = True

    print("\n[1/3] Optimizing Lambda function...")
    if not optimizer.optimize_lambda_function():
        success = False

    print("\n[2/3] Verifying log retention...")
    if not optimizer.verify_log_retention():
        print("  WARNING: Log retention verification failed")

    print("\n[3/3] Verifying DLQ configuration...")
    if not optimizer.verify_dlq_configuration():
        print("  WARNING: DLQ verification failed")

    # Generate report
    print("\n" + "=" * 80)
    print("Optimization Report")
    print("=" * 80)

    report = optimizer.get_optimization_report()

    if report['optimizations']:
        print(f"\nOptimizations applied: {len(report['optimizations'])}")
        for opt in report['optimizations']:
            print(f"\n  Resource: {opt['resource']}")
            print(f"  Type: {opt['type']}")
            print(f"  Change: {opt['old_value']} → {opt['new_value']}")
            print(f"  Monthly savings: {opt['monthly_savings']}")
    else:
        print("\nNo optimizations needed - infrastructure already optimal")

    print(f"\nEstimated Cost Savings:")
    print(f"  Lambda memory: ${report['cost_savings']['lambda_memory']:.2f}/month")
    print(f"  Log retention: ${report['cost_savings']['log_retention']:.2f}/month")
    print(f"  Concurrency: ${report['cost_savings']['concurrency']:.2f}/month")
    print(f"  Total: ${report['cost_savings']['total_monthly']:.2f}/month")
    print(f"  Annual: ${report['annual_savings']:.2f}/year")

    if args.dry_run:
        print("\n⚠️  This was a DRY-RUN - no changes were made")
        print("Run without --dry-run to apply optimizations")

    print("\n" + "=" * 80)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
