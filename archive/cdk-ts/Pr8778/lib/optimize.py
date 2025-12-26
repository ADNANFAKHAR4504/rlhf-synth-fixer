#!/usr/bin/env python3
"""
Post-Deployment Infrastructure Optimization Script

This script optimizes the deployed multi-tier web application infrastructure
for cost-efficiency in development/test environments while maintaining
security and functionality.

Optimizations:
1. RDS PostgreSQL: Reduce backup retention from 7 to 1 day
2. Auto Scaling: Lower max capacity from 6 to 4 instances
3. CloudWatch Logs: Ensure log retention is set appropriately
4. S3 Lifecycle: Verify lifecycle policies are active

Usage:
    export ENVIRONMENT_SUFFIX=dev
    python3 lib/optimize.py [--dry-run]
"""

import argparse
import os
import sys
import time
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Optimizes the deployed CDK infrastructure for cost efficiency"""

    def __init__(self, environment_suffix: str, region: str = 'us-east-1', dry_run: bool = False):
        self.environment_suffix = environment_suffix
        self.region = region
        self.dry_run = dry_run

        # Initialize AWS clients
        self.rds_client = boto3.client('rds', region_name=region)
        self.autoscaling_client = boto3.client('autoscaling', region_name=region)
        self.cloudwatch_logs_client = boto3.client('logs', region_name=region)
        self.s3_client = boto3.client('s3', region_name=region)

        # Resource naming patterns based on CDK auto-generated names
        self.stack_prefix = f"TapStack{environment_suffix}"

        # Tracking
        self.optimizations_applied = []
        self.errors = []

    def log(self, message: str, level: str = 'INFO'):
        """Log messages with consistent formatting"""
        prefix = '[DRY-RUN] ' if self.dry_run else ''
        timestamp = time.strftime('%H:%M:%S')
        print(f"{prefix}[{timestamp}] [{level}] {message}")

    def find_rds_cluster(self) -> Optional[str]:
        """Find RDS PostgreSQL cluster"""
        try:
            self.log("Searching for RDS PostgreSQL cluster...")
            response = self.rds_client.describe_db_clusters()

            for cluster in response['DBClusters']:
                cluster_id = cluster['DBClusterIdentifier'].lower()
                # Match cluster with stack naming pattern
                if self.stack_prefix.lower() in cluster_id or self.environment_suffix.lower() in cluster_id:
                    self.log(f"Found RDS cluster: {cluster['DBClusterIdentifier']}")
                    return cluster['DBClusterIdentifier']

            self.log("RDS cluster not found", 'WARNING')
            return None
        except ClientError as e:
            self.log(f"Error finding RDS cluster: {e}", 'ERROR')
            return None

    def optimize_rds_backup_retention(self, cluster_id: str) -> bool:
        """Reduce RDS backup retention from 7 to 1 day for cost savings"""
        try:
            self.log(f"Optimizing RDS backup retention for {cluster_id}...")

            # Get current configuration
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster = response['DBClusters'][0]
            current_retention = cluster['BackupRetentionPeriod']

            if current_retention <= 1:
                self.log(f"Backup retention already optimized ({current_retention} day)", 'INFO')
                return True

            if self.dry_run:
                self.log(f"Would reduce backup retention: {current_retention} → 1 day")
                self.optimizations_applied.append(f"RDS backup retention: {current_retention} → 1 day")
                return True

            # Apply optimization
            self.rds_client.modify_db_cluster(
                DBClusterIdentifier=cluster_id,
                BackupRetentionPeriod=1,
                ApplyImmediately=True
            )

            self.log(f"✅ Reduced backup retention: {current_retention} → 1 day")
            self.optimizations_applied.append(f"RDS backup retention: {current_retention} → 1 day (saves storage costs)")
            return True

        except ClientError as e:
            self.log(f"Error optimizing RDS backup: {e}", 'ERROR')
            self.errors.append(f"RDS backup optimization: {str(e)}")
            return False

    def find_auto_scaling_group(self) -> Optional[str]:
        """Find Auto Scaling Group"""
        try:
            self.log("Searching for Auto Scaling Group...")
            response = self.autoscaling_client.describe_auto_scaling_groups()

            for asg in response['AutoScalingGroups']:
                asg_name = asg['AutoScalingGroupName'].lower()
                # Match ASG with stack naming pattern
                if self.stack_prefix.lower() in asg_name or self.environment_suffix.lower() in asg_name:
                    self.log(f"Found Auto Scaling Group: {asg['AutoScalingGroupName']}")
                    return asg['AutoScalingGroupName']

            self.log("Auto Scaling Group not found", 'WARNING')
            return None
        except ClientError as e:
            self.log(f"Error finding Auto Scaling Group: {e}", 'ERROR')
            return None

    def optimize_auto_scaling_capacity(self, asg_name: str) -> bool:
        """Reduce Auto Scaling max capacity from 6 to 4 instances"""
        try:
            self.log(f"Optimizing Auto Scaling capacity for {asg_name}...")

            # Get current configuration
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            asg = response['AutoScalingGroups'][0]
            current_max = asg['MaxSize']
            current_min = asg['MinSize']

            if current_max <= 4:
                self.log(f"Max capacity already optimized ({current_max} instances)", 'INFO')
                return True

            if self.dry_run:
                self.log(f"Would reduce max capacity: {current_max} → 4 instances")
                self.optimizations_applied.append(f"Auto Scaling max capacity: {current_max} → 4 instances")
                return True

            # Apply optimization
            self.autoscaling_client.update_auto_scaling_group(
                AutoScalingGroupName=asg_name,
                MinSize=min(current_min, 2),  # Keep min at 2 or less
                MaxSize=4
            )

            self.log(f"✅ Reduced max capacity: {current_max} → 4 instances")
            self.optimizations_applied.append(f"Auto Scaling max: {current_max} → 4 instances (reduces peak costs)")
            return True

        except ClientError as e:
            self.log(f"Error optimizing Auto Scaling: {e}", 'ERROR')
            self.errors.append(f"Auto Scaling optimization: {str(e)}")
            return False

    def optimize_cloudwatch_log_retention(self) -> bool:
        """Ensure CloudWatch Logs have appropriate retention"""
        try:
            self.log("Checking CloudWatch Logs retention...")

            response = self.cloudwatch_logs_client.describe_log_groups()
            optimized_count = 0

            for log_group in response.get('logGroups', []):
                log_group_name = log_group['logGroupName']

                # Only modify log groups related to our stack
                if self.stack_prefix.lower() not in log_group_name.lower():
                    continue

                current_retention = log_group.get('retentionInDays')

                # Set retention to 7 days if not set or too high
                if current_retention is None or current_retention > 7:
                    if self.dry_run:
                        self.log(f"Would set retention for {log_group_name}: 7 days")
                        optimized_count += 1
                    else:
                        self.cloudwatch_logs_client.put_retention_policy(
                            logGroupName=log_group_name,
                            retentionInDays=7
                        )
                        self.log(f"Set retention for {log_group_name}: 7 days")
                        optimized_count += 1

            if optimized_count > 0:
                self.optimizations_applied.append(f"CloudWatch Logs: Set 7-day retention on {optimized_count} log groups")
                self.log(f"✅ Optimized {optimized_count} log groups")
            else:
                self.log("CloudWatch Logs already optimized", 'INFO')

            return True

        except ClientError as e:
            self.log(f"Error optimizing CloudWatch Logs: {e}", 'ERROR')
            self.errors.append(f"CloudWatch Logs optimization: {str(e)}")
            return False

    def verify_s3_lifecycle_policies(self) -> bool:
        """Verify S3 lifecycle policies are configured"""
        try:
            self.log("Verifying S3 lifecycle policies...")

            response = self.s3_client.list_buckets()
            verified_count = 0

            for bucket in response['Buckets']:
                bucket_name = bucket['Name']

                # Only check buckets related to our stack
                if self.stack_prefix.lower() not in bucket_name.lower():
                    continue

                try:
                    lifecycle = self.s3_client.get_bucket_lifecycle_configuration(
                        Bucket=bucket_name
                    )
                    if lifecycle.get('Rules'):
                        self.log(f"Lifecycle policy active on {bucket_name}")
                        verified_count += 1
                except self.s3_client.exceptions.NoSuchLifecycleConfiguration:
                    self.log(f"No lifecycle policy on {bucket_name}", 'WARNING')

            if verified_count > 0:
                self.optimizations_applied.append(f"S3: Verified {verified_count} buckets have lifecycle policies")

            return True

        except ClientError as e:
            self.log(f"Error verifying S3 lifecycle: {e}", 'ERROR')
            self.errors.append(f"S3 verification: {str(e)}")
            return False

    def calculate_estimated_savings(self) -> Dict[str, float]:
        """Calculate estimated monthly cost savings"""
        # These are rough estimates based on AWS pricing
        savings = {
            'rds_backup': 0.0,
            'auto_scaling': 0.0,
            'cloudwatch_logs': 0.0,
            'total': 0.0
        }

        # RDS backup storage (assuming ~10GB database, 6 days saved @ $0.095/GB)
        savings['rds_backup'] = 10 * 6 * 0.095

        # Auto Scaling (2 fewer potential t3.medium instances @ $0.0416/hr)
        # Assuming they run 50% of the time during peak
        savings['auto_scaling'] = 2 * 0.0416 * 24 * 30 * 0.5

        # CloudWatch Logs (assuming 10GB/month saved @ $0.50/GB)
        savings['cloudwatch_logs'] = 10 * 0.50

        savings['total'] = sum([v for k, v in savings.items() if k != 'total'])

        return savings

    def optimize(self) -> bool:
        """Run all optimization steps"""
        self.log("=" * 70)
        self.log(f"Starting Infrastructure Optimization")
        self.log(f"Environment: {self.environment_suffix} | Region: {self.region}")
        self.log("=" * 70)

        # Step 1: Optimize RDS
        rds_cluster = self.find_rds_cluster()
        if rds_cluster:
            self.optimize_rds_backup_retention(rds_cluster)

        # Step 2: Optimize Auto Scaling
        asg = self.find_auto_scaling_group()
        if asg:
            self.optimize_auto_scaling_capacity(asg)

        # Step 3: Optimize CloudWatch Logs
        self.optimize_cloudwatch_log_retention()

        # Step 4: Verify S3 lifecycle policies
        self.verify_s3_lifecycle_policies()

        # Print summary
        self.log("=" * 70)
        self.log("Optimization Summary")
        self.log("=" * 70)

        if self.optimizations_applied:
            self.log(f"✅ Optimizations applied: {len(self.optimizations_applied)}")
            for opt in self.optimizations_applied:
                self.log(f"   • {opt}")
        else:
            self.log("No optimizations needed - infrastructure already optimized")

        if self.errors:
            self.log(f"\n⚠️  Errors encountered: {len(self.errors)}", 'WARNING')
            for error in self.errors:
                self.log(f"   • {error}", 'WARNING')

        if self.optimizations_applied and not self.dry_run:
            savings = self.calculate_estimated_savings()
            self.log("\n💰 Estimated Monthly Savings:")
            self.log(f"   • RDS Backups: ${savings['rds_backup']:.2f}")
            self.log(f"   • Auto Scaling: ${savings['auto_scaling']:.2f}")
            self.log(f"   • CloudWatch Logs: ${savings['cloudwatch_logs']:.2f}")
            self.log(f"   • Total: ${savings['total']:.2f}/month")

        self.log("=" * 70)

        return len(self.errors) == 0


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Optimize deployed CDK infrastructure for cost efficiency'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be optimized without making changes'
    )
    parser.add_argument(
        '--region',
        default='us-east-1',
        help='AWS region (default: us-east-1)'
    )

    args = parser.parse_args()

    # Get environment suffix from environment variable
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX')
    if not environment_suffix:
        print("ERROR: ENVIRONMENT_SUFFIX environment variable not set")
        print("\nUsage:")
        print("  export ENVIRONMENT_SUFFIX=dev")
        print("  python3 lib/optimize.py [--dry-run]")
        sys.exit(1)

    # Run optimization
    optimizer = InfrastructureOptimizer(
        environment_suffix=environment_suffix,
        region=args.region,
        dry_run=args.dry_run
    )

    success = optimizer.optimize()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

