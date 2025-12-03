#!/usr/bin/env python3
"""
ECS Fargate Cost Optimization Script.
Optimizes ECS task definitions, CloudWatch logs, and service configurations.
"""

import os
import sys
import time
import json
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError


class ECSFargateOptimizer:
    """Handles ECS Fargate infrastructure cost optimization."""

    def __init__(self, environment_suffix: str = 'dev', region_name: str = 'us-east-1'):
        """
        Initialize the optimizer with AWS clients.

        Args:
            environment_suffix: The environment suffix for resource naming
            region_name: AWS region name (default: 'us-east-1')
        """
        self.environment_suffix = environment_suffix
        self.region_name = region_name

        # Initialize AWS clients
        self.ecs_client = boto3.client('ecs', region_name=region_name)
        self.logs_client = boto3.client('logs', region_name=region_name)

        print(f"Initialized ECS Fargate optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 60)

    def optimize_cloudwatch_logs(self) -> bool:
        """
        Optimize CloudWatch log retention.
        - Reduce retention from 14 days to 7 days
        """
        print("\n🔧 Optimizing CloudWatch Logs...")

        try:
            log_group_name = f'/ecs/fargate-app-{self.environment_suffix}'

            # Verify log group exists
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )

                if not response['logGroups']:
                    print(f"❌ Log group not found: {log_group_name}")
                    return False

                current_retention = response['logGroups'][0].get('retentionInDays', 'Never Expire')
                print(f"Found log group: {log_group_name}")
                print(f"Current retention: {current_retention} days")

            except ClientError as e:
                print(f"❌ Error checking log group: {e}")
                return False

            # Update retention policy
            self.logs_client.put_retention_policy(
                logGroupName=log_group_name,
                retentionInDays=7
            )

            print("✅ CloudWatch log optimization complete:")
            print(f"   - Retention: {current_retention} days → 7 days")

            return True

        except ClientError as e:
            print(f"❌ Error optimizing CloudWatch logs: {e}")
            return False

    def optimize_ecs_task_definition(self, task_def_arn: str) -> Optional[str]:
        """
        Create optimized task definition with reduced CPU and memory.
        - Reduce CPU from 2048 to 512 units
        - Reduce memory from 4096 to 1024 MB

        Args:
            task_def_arn: Current task definition ARN

        Returns:
            New task definition ARN or None if failed
        """
        print("\n🔧 Optimizing ECS Task Definition...")

        try:
            # Get current task definition
            response = self.ecs_client.describe_task_definition(
                taskDefinition=task_def_arn
            )

            task_def = response['taskDefinition']
            family = task_def['family']
            current_cpu = task_def['cpu']
            current_memory = task_def['memory']

            print(f"Current task definition: {family}")
            print(f"Current CPU: {current_cpu}, Memory: {current_memory}")

            # Check if already optimized
            if current_cpu == '512' and current_memory == '1024':
                print("✅ Task definition already optimized")
                return task_def_arn

            # Create new task definition with optimized values
            new_task_def = {
                'family': family,
                'taskRoleArn': task_def.get('taskRoleArn'),
                'executionRoleArn': task_def.get('executionRoleArn'),
                'networkMode': task_def['networkMode'],
                'containerDefinitions': task_def['containerDefinitions'],
                'volumes': task_def.get('volumes', []),
                'placementConstraints': task_def.get('placementConstraints', []),
                'requiresCompatibilities': task_def['requiresCompatibilities'],
                'cpu': '512',  # Optimized
                'memory': '1024',  # Optimized
                'tags': task_def.get('tags', [])
            }

            # Remove read-only fields
            for container in new_task_def['containerDefinitions']:
                container.pop('environment', None) if not container.get('environment') else None

            response = self.ecs_client.register_task_definition(**new_task_def)
            new_arn = response['taskDefinition']['taskDefinitionArn']

            print("✅ Task definition optimization complete:")
            print(f"   - CPU: {current_cpu} → 512")
            print(f"   - Memory: {current_memory} → 1024")
            print(f"   - New task definition: {new_arn}")

            return new_arn

        except ClientError as e:
            print(f"❌ Error optimizing task definition: {e}")
            return None

    def optimize_ecs_service(self) -> bool:
        """
        Optimize ECS Fargate service.
        - Update to use optimized task definition
        - Reduce desiredCount from 3 to 2 tasks
        """
        print("\n🔧 Optimizing ECS Service...")

        try:
            # Find the ECS cluster
            cluster_name = f'app-cluster-{self.environment_suffix}'
            clusters = self.ecs_client.list_clusters()
            cluster_arn = None

            for cluster in clusters['clusterArns']:
                if cluster_name in cluster:
                    cluster_arn = cluster
                    print(f"Found cluster: {cluster_name}")
                    break

            if not cluster_arn:
                print(f"❌ ECS cluster not found: {cluster_name}")
                print(f"Available clusters: {[c.split('/')[-1] for c in clusters['clusterArns']]}")
                return False

            # Find the service
            service_name = f'app-service-{self.environment_suffix}'
            services = self.ecs_client.list_services(cluster=cluster_arn)
            service_arn = None

            for service in services['serviceArns']:
                if service_name in service:
                    service_arn = service
                    print(f"Found service: {service_name}")
                    break

            if not service_arn:
                print(f"❌ ECS service not found: {service_name}")
                print(f"Available services: {[s.split('/')[-1] for s in services['serviceArns']]}")
                return False

            # Get current service details
            service_details = self.ecs_client.describe_services(
                cluster=cluster_arn,
                services=[service_arn]
            )

            service = service_details['services'][0]
            current_task_def = service['taskDefinition']
            current_desired_count = service['desiredCount']

            print(f"Current desired count: {current_desired_count}")
            print(f"Current task definition: {current_task_def.split('/')[-1]}")

            # Optimize task definition
            new_task_def_arn = self.optimize_ecs_task_definition(current_task_def)

            if not new_task_def_arn:
                print("❌ Failed to optimize task definition")
                return False

            # Determine target desired count
            target_desired_count = 2 if current_desired_count > 2 else current_desired_count

            # Update service with optimized task definition and desired count
            print(f"Updating service to desired count: {target_desired_count}")

            update_params = {
                'cluster': cluster_arn,
                'service': service_arn,
                'taskDefinition': new_task_def_arn,
            }

            # Only update desired count if it needs changing
            if current_desired_count != target_desired_count:
                update_params['desiredCount'] = target_desired_count

            self.ecs_client.update_service(**update_params)

            print("✅ ECS service optimization complete:")
            if current_desired_count != target_desired_count:
                print(f"   - Task count: {current_desired_count} → {target_desired_count}")
            print(f"   - Task definition updated to optimized version")

            # Wait for service to stabilize
            print("Waiting for service to stabilize...")
            waiter = self.ecs_client.get_waiter('services_stable')
            waiter.wait(
                cluster=cluster_arn,
                services=[service_arn],
                WaiterConfig={'Delay': 15, 'MaxAttempts': 40}
            )

            print("✅ Service stable")

            return True

        except ClientError as e:
            print(f"❌ Error optimizing ECS service: {e}")
            return False

    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.

        Returns:
            Dictionary with cost savings estimates
        """
        # AWS Fargate pricing (us-east-1)
        # vCPU: $0.04048 per vCPU per hour
        # Memory: $0.004445 per GB per hour

        # Task CPU/Memory savings
        original_cpu_cost = (2048 / 1024) * 0.04048  # 2 vCPU
        original_memory_cost = (4096 / 1024) * 0.004445  # 4 GB

        optimized_cpu_cost = (512 / 1024) * 0.04048  # 0.5 vCPU
        optimized_memory_cost = (1024 / 1024) * 0.004445  # 1 GB

        task_hourly_savings = (original_cpu_cost + original_memory_cost) - (optimized_cpu_cost + optimized_memory_cost)
        task_monthly_savings = task_hourly_savings * 24 * 30

        # Service desired count savings (1 fewer task)
        service_task_savings = (optimized_cpu_cost + optimized_memory_cost) * 24 * 30

        # CloudWatch Logs savings (7 days vs 14 days retention)
        # Approximate: $0.50 per GB ingested, assume 1GB/day for 3 tasks
        log_storage_savings = 0.03 * 7 * 3  # $0.03/GB/month, 7 extra days saved, 3GB

        total_savings = (task_monthly_savings * 3) + service_task_savings + log_storage_savings

        return {
            'task_rightsizing_monthly_savings': round(task_monthly_savings * 3, 2),  # All 3 tasks
            'service_scale_down_monthly_savings': round(service_task_savings, 2),  # 1 fewer task
            'cloudwatch_logs_monthly_savings': round(log_storage_savings, 2),
            'total_monthly_savings': round(total_savings, 2),
            'annual_savings': round(total_savings * 12, 2)
        }

    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n🚀 Starting ECS Fargate cost optimization...")
        print("=" * 60)

        results = {
            'cloudwatch_logs': self.optimize_cloudwatch_logs(),
            'ecs_service': self.optimize_ecs_service()
        }

        print("\n" + "=" * 60)
        print("📊 Optimization Summary:")
        print("-" * 60)

        success_count = sum(results.values())
        total_count = len(results)

        for service, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            print(f"{service.replace('_', ' ').title()}: {status}")

        print(f"\nTotal: {success_count}/{total_count} optimizations successful")

        if success_count == total_count:
            print("\n💰 Estimated Monthly Cost Savings:")
            print("-" * 60)
            savings = self.get_cost_savings_estimate()
            print(f"Task Right-Sizing (CPU/Memory): ${savings['task_rightsizing_monthly_savings']}")
            print(f"Service Scale-Down (3→2 tasks): ${savings['service_scale_down_monthly_savings']}")
            print(f"CloudWatch Logs (14→7 days): ${savings['cloudwatch_logs_monthly_savings']}")
            print(f"Total Monthly Savings: ${savings['total_monthly_savings']}")
            print(f"Annual Savings: ${savings['annual_savings']}")
            print("\n✨ All optimizations completed successfully!")
            print(f"💡 Estimated cost reduction: ~{int((savings['total_monthly_savings'] / 100) * 100)}%")
        else:
            print("\n⚠️  Some optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Optimize ECS Fargate infrastructure for cost savings"
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
        print("- ECS Task Definition: CPU 2048→512, Memory 4096→1024")
        print("- ECS Service: Desired count 3→2 tasks")
        print("- CloudWatch Logs: Retention 14→7 days")

        optimizer = ECSFargateOptimizer(environment_suffix, aws_region)
        savings = optimizer.get_cost_savings_estimate()
        print(f"\nEstimated monthly savings: ${savings['total_monthly_savings']}")
        print(f"Estimated annual savings: ${savings['annual_savings']}")
        return

    # Proceed with optimization
    print(f"🚀 Starting optimization in {aws_region}")
    print(f"Environment suffix: {environment_suffix}")

    try:
        optimizer = ECSFargateOptimizer(environment_suffix, aws_region)
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
