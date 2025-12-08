#!/usr/bin/env python3
"""
Infrastructure optimization script for RDS MySQL payment processing system.
Optimizes RDS instance class and storage allocation for cost reduction while
maintaining performance requirements.
"""

import os
import sys
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Handles infrastructure optimization for RDS MySQL payment processing system."""

    def __init__(self, environment_suffix: str = 'dev', region_name: str = 'us-east-1'):
        """
        Initialize the optimizer with AWS clients.

        Args:
            environment_suffix: The environment suffix (default: 'dev')
            region_name: AWS region name (default: 'us-east-1')
        """
        self.environment_suffix = environment_suffix
        self.region_name = region_name

        # Initialize AWS client
        self.rds_client = boto3.client('rds', region_name=region_name)

        print(f"Initialized RDS optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)

    def optimize_rds_instance(self) -> bool:
        """
        Optimize RDS MySQL instance for cost reduction.

        Baseline (before optimization):
        - Instance class: db.t4g.xlarge
        - Storage: 150GB GP3

        Optimized (after optimization):
        - Instance class: db.t4g.large (downgrade for cost savings)
        - Storage: 100GB GP3 (reduce to required size)

        Returns:
            bool: True if optimization succeeded, False otherwise
        """
        print("\n🔧 Optimizing RDS MySQL Instance...")

        try:
            # Find the RDS instance
            instances = self.rds_client.describe_db_instances()
            instance_id = None

            # Look for instance with 'mysql-optimized' and environment suffix
            for instance in instances['DBInstances']:
                instance_identifier = instance['DBInstanceIdentifier'].lower()
                if 'mysql-optimized' in instance_identifier and self.environment_suffix.lower() in instance_identifier:
                    instance_id = instance['DBInstanceIdentifier']
                    current_class = instance['DBInstanceClass']
                    current_storage = instance['AllocatedStorage']
                    print(f"Found RDS instance: {instance_id}")
                    print(f"Current instance class: {current_class}")
                    print(f"Current storage: {current_storage}GB")
                    break

            if not instance_id:
                print(f"❌ RDS instance not found for environment: {self.environment_suffix}")
                print(f"Available instances: {[i['DBInstanceIdentifier'] for i in instances['DBInstances']]}")
                return False

            # Verify this is the baseline (non-optimized) configuration
            if current_class != 'db.t4g.xlarge':
                print(f"⚠️ Instance is not at baseline (expected db.t4g.xlarge, found {current_class})")
                print("Skipping optimization - may have been already optimized")
                return True

            # Optimize: Downgrade instance class and reduce storage
            print("\nApplying optimizations...")
            print("  - Instance class: db.t4g.xlarge → db.t4g.large")
            print("  - Storage: 150GB → 100GB")

            self.rds_client.modify_db_instance(
                DBInstanceIdentifier=instance_id,
                DBInstanceClass='db.t4g.large',
                AllocatedStorage=100,
                ApplyImmediately=True
            )

            print("\n✅ RDS optimization initiated:")
            print("   - Instance class: db.t4g.xlarge → db.t4g.large (50% cost reduction)")
            print("   - Storage: 150GB → 100GB (33% cost reduction)")
            print("   - Expected monthly savings: ~$50-70")

            # Wait for instance to be available
            print("\nWaiting for RDS instance modification to complete...")
            waiter = self.rds_client.get_waiter('db_instance_available')
            waiter.wait(
                DBInstanceIdentifier=instance_id,
                WaiterConfig={'Delay': 30, 'MaxAttempts': 40}
            )

            print("✅ RDS instance modification complete")

            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing RDS: {e}")
            return False

    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from RDS optimization.

        Returns:
            Dictionary with cost savings estimates
        """
        # Cost estimates based on AWS pricing in us-east-1
        rds_savings = {
            'original_instance_cost': 0.146 * 24 * 30,  # db.t4g.xlarge hourly rate
            'optimized_instance_cost': 0.073 * 24 * 30,  # db.t4g.large hourly rate
            'storage_savings': 0.138 * 50  # GP3 cost per GB for 50GB reduction
        }

        total_savings = (
            (rds_savings['original_instance_cost'] - rds_savings['optimized_instance_cost']) +
            rds_savings['storage_savings']
        )

        return {
            'rds_instance_monthly_savings': round(
                rds_savings['original_instance_cost'] - rds_savings['optimized_instance_cost'], 2
            ),
            'rds_storage_monthly_savings': round(rds_savings['storage_savings'], 2),
            'total_monthly_savings': round(total_savings, 2)
        }

    def run_optimization(self) -> None:
        """Run RDS optimization."""
        print("\n🚀 Starting infrastructure optimization...")
        print("=" * 50)

        results = {
            'rds': self.optimize_rds_instance()
        }

        print("\n" + "=" * 50)
        print("📊 Optimization Summary:")
        print("-" * 50)

        success_count = sum(results.values())
        total_count = len(results)

        for service, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            print(f"{service.upper()}: {status}")

        print(f"\nTotal: {success_count}/{total_count} optimizations successful")

        if success_count == total_count:
            print("\n💰 Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"RDS Instance: ${savings['rds_instance_monthly_savings']}")
            print(f"RDS Storage: ${savings['rds_storage_monthly_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
            print("\n✨ All optimizations completed successfully!")
        else:
            print("\n⚠️  Optimization failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Optimize RDS MySQL infrastructure for payment processing system"
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
        print("- RDS Instance: db.t4g.xlarge → db.t4g.large (50% cost reduction)")
        print("- RDS Storage: 150GB → 100GB (33% storage cost reduction)")

        optimizer = InfrastructureOptimizer(environment_suffix, aws_region)
        savings = optimizer.get_cost_savings_estimate()
        print(f"\nEstimated monthly savings: ${savings['total_monthly_savings']}")
        return

    # Proceed with optimization
    print(f"🚀 Starting optimization in {aws_region}")
    print(f"Environment suffix: {environment_suffix}")

    try:
        optimizer = InfrastructureOptimizer(environment_suffix, aws_region)
        optimizer.run_optimization()
    except KeyboardInterrupt:
        print("\n\n⚠️  Optimization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
