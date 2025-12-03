#!/usr/bin/env python3
"""
Infrastructure optimization script for Lambda-based image processing pipeline.
Optimizes Lambda function memory allocations and CloudWatch log retention for cost savings.
"""

import os
import sys
import time
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError


class LambdaOptimizer:
    """Handles optimization for Lambda-based image processing infrastructure."""

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
        self.logs_client = boto3.client('logs', region_name=region_name)

        print(f"Initialized optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)

    def _find_lambda_function(self, function_pattern: str) -> Optional[str]:
        """
        Find a Lambda function by name pattern.

        Args:
            function_pattern: Pattern to match function name

        Returns:
            Function name if found, None otherwise
        """
        try:
            paginator = self.lambda_client.get_paginator('list_functions')
            for page in paginator.paginate():
                for function in page['Functions']:
                    func_name = function['FunctionName']
                    if function_pattern in func_name and self.environment_suffix in func_name:
                        return func_name
            return None
        except ClientError as e:
            print(f"❌ Error finding function with pattern '{function_pattern}': {e}")
            return None

    def optimize_lambda_memory(self, function_name: str, new_memory: int, old_memory: int) -> bool:
        """
        Optimize Lambda function memory allocation.

        Args:
            function_name: Name of the Lambda function
            new_memory: New memory allocation in MB
            old_memory: Current memory allocation in MB

        Returns:
            True if successful, False otherwise
        """
        try:
            print(f"Updating {function_name}: {old_memory}MB → {new_memory}MB")

            self.lambda_client.update_function_configuration(
                FunctionName=function_name,
                MemorySize=new_memory
            )

            # Wait for function to be updated
            waiter = self.lambda_client.get_waiter('function_updated')
            waiter.wait(FunctionName=function_name)

            print(f"✅ Successfully optimized {function_name}")
            return True

        except ClientError as e:
            print(f"❌ Error optimizing {function_name}: {e}")
            return False

    def optimize_thumbnail_generator(self) -> bool:
        """
        Optimize Thumbnail Generator Lambda function.
        - Reduce memory from 1024MB to 512MB
        """
        print("\n🔧 Optimizing Thumbnail Generator Lambda...")

        function_name = self._find_lambda_function('thumbnail-generator')
        if not function_name:
            print(f"❌ Thumbnail generator function not found for environment: {self.environment_suffix}")
            return False

        try:
            # Get current configuration
            response = self.lambda_client.get_function_configuration(FunctionName=function_name)
            current_memory = response['MemorySize']

            print(f"Found function: {function_name}")
            print(f"Current memory: {current_memory}MB")

            if current_memory <= 512:
                print("✅ Already optimized (512MB or less)")
                return True

            return self.optimize_lambda_memory(function_name, 512, current_memory)

        except ClientError as e:
            print(f"❌ Error optimizing thumbnail generator: {e}")
            return False

    def optimize_watermark_applier(self) -> bool:
        """
        Optimize Watermark Applier Lambda function.
        - Reduce memory from 512MB to 256MB
        """
        print("\n🔧 Optimizing Watermark Applier Lambda...")

        function_name = self._find_lambda_function('watermark-applier')
        if not function_name:
            print(f"❌ Watermark applier function not found for environment: {self.environment_suffix}")
            return False

        try:
            # Get current configuration
            response = self.lambda_client.get_function_configuration(FunctionName=function_name)
            current_memory = response['MemorySize']

            print(f"Found function: {function_name}")
            print(f"Current memory: {current_memory}MB")

            if current_memory <= 256:
                print("✅ Already optimized (256MB or less)")
                return True

            return self.optimize_lambda_memory(function_name, 256, current_memory)

        except ClientError as e:
            print(f"❌ Error optimizing watermark applier: {e}")
            return False

    def optimize_metadata_extractor(self) -> bool:
        """
        Optimize Metadata Extractor Lambda function.
        - Reduce memory from 256MB to 128MB
        """
        print("\n🔧 Optimizing Metadata Extractor Lambda...")

        function_name = self._find_lambda_function('metadata-extractor')
        if not function_name:
            print(f"❌ Metadata extractor function not found for environment: {self.environment_suffix}")
            return False

        try:
            # Get current configuration
            response = self.lambda_client.get_function_configuration(FunctionName=function_name)
            current_memory = response['MemorySize']

            print(f"Found function: {function_name}")
            print(f"Current memory: {current_memory}MB")

            if current_memory <= 128:
                print("✅ Already optimized (128MB or less)")
                return True

            return self.optimize_lambda_memory(function_name, 128, current_memory)

        except ClientError as e:
            print(f"❌ Error optimizing metadata extractor: {e}")
            return False

    def optimize_cloudwatch_logs(self) -> bool:
        """
        Optimize CloudWatch Log Groups.
        - Reduce retention from 7 days to 3 days
        """
        print("\n🔧 Optimizing CloudWatch Log Groups...")

        log_groups = [
            f'/aws/lambda/thumbnail-generator-{self.environment_suffix}',
            f'/aws/lambda/watermark-applier-{self.environment_suffix}',
            f'/aws/lambda/metadata-extractor-{self.environment_suffix}'
        ]

        success_count = 0

        for log_group_name in log_groups:
            try:
                # Check if log group exists
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )

                if not response['logGroups']:
                    print(f"⚠️  Log group not found: {log_group_name}")
                    continue

                current_retention = response['logGroups'][0].get('retentionInDays', 'Never expire')

                print(f"Found log group: {log_group_name}")
                print(f"Current retention: {current_retention} days")

                if current_retention == 3:
                    print("✅ Already optimized (3 days)")
                    success_count += 1
                    continue

                # Update retention to 3 days
                self.logs_client.put_retention_policy(
                    logGroupName=log_group_name,
                    retentionInDays=3
                )

                print(f"✅ Updated retention: {current_retention} → 3 days")
                success_count += 1

            except ClientError as e:
                print(f"❌ Error optimizing log group {log_group_name}: {e}")

        return success_count > 0

    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.

        Returns:
            Dictionary with cost savings estimates
        """
        # Lambda pricing (us-east-1, ARM64): $0.0000133334 per GB-second
        # Request pricing: $0.20 per 1M requests
        # Assuming 1M invocations per month per function, 1 second average duration

        lambda_price_per_gb_second = 0.0000133334
        invocations_per_month = 1_000_000
        avg_duration_seconds = 1.0

        # Thumbnail: 1024MB → 512MB
        thumbnail_savings = (
            (1024 - 512) / 1024 * lambda_price_per_gb_second *
            invocations_per_month * avg_duration_seconds
        )

        # Watermark: 512MB → 256MB
        watermark_savings = (
            (512 - 256) / 1024 * lambda_price_per_gb_second *
            invocations_per_month * avg_duration_seconds
        )

        # Metadata: 256MB → 128MB
        metadata_savings = (
            (256 - 128) / 1024 * lambda_price_per_gb_second *
            invocations_per_month * avg_duration_seconds
        )

        # CloudWatch Logs: 7 days → 3 days (57% reduction in storage)
        # Assuming 10MB logs per function per day, $0.50 per GB per month
        log_storage_price_per_gb = 0.50
        log_mb_per_function_per_day = 10
        log_savings = (
            (7 - 3) * log_mb_per_function_per_day * 3 / 1024 * log_storage_price_per_gb
        )

        total_savings = (
            thumbnail_savings + watermark_savings + metadata_savings + log_savings
        )

        return {
            'thumbnail_monthly_savings': round(thumbnail_savings, 2),
            'watermark_monthly_savings': round(watermark_savings, 2),
            'metadata_monthly_savings': round(metadata_savings, 2),
            'cloudwatch_logs_monthly_savings': round(log_savings, 2),
            'total_monthly_savings': round(total_savings, 2),
            'assumptions': {
                'invocations_per_month': invocations_per_month,
                'avg_duration_seconds': avg_duration_seconds,
                'log_mb_per_function_per_day': log_mb_per_function_per_day
            }
        }

    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n🚀 Starting infrastructure optimization...")
        print("=" * 50)

        results = {
            'thumbnail': self.optimize_thumbnail_generator(),
            'watermark': self.optimize_watermark_applier(),
            'metadata': self.optimize_metadata_extractor(),
            'logs': self.optimize_cloudwatch_logs()
        }

        print("\n" + "=" * 50)
        print("📊 Optimization Summary:")
        print("-" * 50)

        success_count = sum(results.values())
        total_count = len(results)

        for service, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            print(f"{service.capitalize()}: {status}")

        print(f"\nTotal: {success_count}/{total_count} optimizations successful")

        if success_count > 0:
            print("\n💰 Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"Thumbnail Generator: ${savings['thumbnail_monthly_savings']}")
            print(f"Watermark Applier: ${savings['watermark_monthly_savings']}")
            print(f"Metadata Extractor: ${savings['metadata_monthly_savings']}")
            print(f"CloudWatch Logs: ${savings['cloudwatch_logs_monthly_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
            print(f"\nAssumptions:")
            print(f"  - {savings['assumptions']['invocations_per_month']:,} invocations/month per function")
            print(f"  - {savings['assumptions']['avg_duration_seconds']} second average duration")
            print(f"  - {savings['assumptions']['log_mb_per_function_per_day']}MB logs per function per day")

            if success_count == total_count:
                print("\n✨ All optimizations completed successfully!")
            else:
                print("\n⚠️  Some optimizations failed. Please check the logs above.")
        else:
            print("\n⚠️  All optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Optimize Lambda-based image processing infrastructure"
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
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be optimized without making changes'
    )

    args = parser.parse_args()

    environment_suffix = args.environment or os.getenv('ENVIRONMENT_SUFFIX') or 'dev'
    aws_region = args.region or os.getenv('AWS_REGION') or 'us-east-1'

    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print("\nPlanned optimizations:")
        print("- Thumbnail Generator: Reduce memory 1024MB → 512MB")
        print("- Watermark Applier: Reduce memory 512MB → 256MB")
        print("- Metadata Extractor: Reduce memory 256MB → 128MB")
        print("- CloudWatch Logs: Reduce retention 7 days → 3 days")

        optimizer = LambdaOptimizer(environment_suffix, aws_region)
        savings = optimizer.get_cost_savings_estimate()
        print(f"\nEstimated monthly savings: ${savings['total_monthly_savings']}")
        print(f"(Based on {savings['assumptions']['invocations_per_month']:,} invocations/month per function)")
        return

    # Proceed with optimization
    print(f"🚀 Starting optimization in {aws_region}")
    print(f"Environment suffix: {environment_suffix}")

    try:
        optimizer = LambdaOptimizer(environment_suffix, aws_region)
        optimizer.run_optimization()
    except KeyboardInterrupt:
        print("\n\n⚠️  Optimization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
