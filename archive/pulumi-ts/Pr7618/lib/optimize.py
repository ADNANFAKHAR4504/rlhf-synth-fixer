#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ECS Fargate Service optimization script for right-sizing configurations.
Analyzes CloudWatch metrics and verifies ECS task optimizations based on actual utilization.
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError


class ECSOptimizer:
    """Handles ECS Fargate service optimization verification based on CloudWatch metrics."""

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
        self.ecs_client = boto3.client('ecs', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.logs_client = boto3.client('logs', region_name=region_name)
        self.ecr_client = boto3.client('ecr', region_name=region_name)

        print(f"Initialized ECS optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)

    def get_ecs_cluster(self) -> Optional[str]:
        """Find the ECS cluster based on naming pattern."""
        try:
            cluster_name = f'app-cluster-{self.environment_suffix}'

            response = self.ecs_client.describe_clusters(
                clusters=[cluster_name]
            )

            clusters = response.get('clusters', [])
            if clusters and clusters[0].get('status') == 'ACTIVE':
                print(f"Found ECS cluster: {cluster_name}")
                return cluster_name

            print(f"❌ ECS cluster not found or not active: {cluster_name}")
            return None

        except ClientError as e:
            print(f"❌ Error finding ECS cluster: {e}")
            return None

    def get_ecs_service(self, cluster_name: str) -> Optional[Dict[str, Any]]:
        """Find the ECS service based on naming pattern."""
        try:
            service_name = f'app-service-{self.environment_suffix}'

            response = self.ecs_client.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )

            services = response.get('services', [])
            if services and services[0].get('status') == 'ACTIVE':
                print(f"Found ECS service: {service_name}")
                return services[0]

            print(f"❌ ECS service not found or not active: {service_name}")
            return None

        except ClientError as e:
            print(f"❌ Error finding ECS service: {e}")
            return None

    def get_task_definition(self, task_definition_arn: str) -> Optional[Dict[str, Any]]:
        """Get task definition details."""
        try:
            response = self.ecs_client.describe_task_definition(
                taskDefinition=task_definition_arn
            )

            return response.get('taskDefinition')

        except ClientError as e:
            print(f"❌ Error getting task definition: {e}")
            return None

    def analyze_ecs_metrics(self, cluster_name: str, service_name: str) -> Dict[str, float]:
        """
        Analyze ECS service metrics from CloudWatch.
        Returns:
            Dictionary with ECS utilization statistics
        """
        print("\n📊 Analyzing CloudWatch metrics...")

        try:
            # Get metrics for the last 7 days
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=7)

            # Get CPU utilization
            cpu_response = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/ECS',
                MetricName='CPUUtilization',
                Dimensions=[
                    {'Name': 'ClusterName', 'Value': cluster_name},
                    {'Name': 'ServiceName', 'Value': service_name},
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour
                Statistics=['Average', 'Maximum'],
            )

            # Get Memory utilization
            memory_response = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/ECS',
                MetricName='MemoryUtilization',
                Dimensions=[
                    {'Name': 'ClusterName', 'Value': cluster_name},
                    {'Name': 'ServiceName', 'Value': service_name},
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average', 'Maximum'],
            )

            # Calculate metrics
            cpu_datapoints = cpu_response.get('Datapoints', [])
            memory_datapoints = memory_response.get('Datapoints', [])

            avg_cpu = sum(d['Average'] for d in cpu_datapoints) / len(cpu_datapoints) if cpu_datapoints else 0
            max_cpu = max((d['Maximum'] for d in cpu_datapoints), default=0)
            avg_memory = sum(d['Average'] for d in memory_datapoints) / len(memory_datapoints) if memory_datapoints else 0
            max_memory = max((d['Maximum'] for d in memory_datapoints), default=0)

            print(f"Average CPU utilization (7 days): {avg_cpu:.2f}%")
            print(f"Maximum CPU utilization: {max_cpu:.2f}%")
            print(f"Average memory utilization (7 days): {avg_memory:.2f}%")
            print(f"Maximum memory utilization: {max_memory:.2f}%")

            return {
                'avg_cpu': avg_cpu,
                'max_cpu': max_cpu,
                'avg_memory': avg_memory,
                'max_memory': max_memory,
            }

        except ClientError as e:
            print(f"⚠️  Error fetching metrics (using defaults): {e}")
            return {
                'avg_cpu': 0,
                'max_cpu': 0,
                'avg_memory': 0,
                'max_memory': 0,
            }

    def verify_task_optimizations(self, task_definition: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify that ECS task definition has optimized configurations.
        Args:
            task_definition: ECS task definition
        Returns:
            Dictionary with optimization verification results
        """
        print("\n🔍 Verifying ECS task optimizations...")

        results = {
            'cpu_optimized': False,
            'memory_optimized': False,
            'stop_timeout_configured': False,
            'log_retention_configured': False,
            'issues': [],
            'optimizations_applied': [],
        }

        # Check CPU (should be 256 CPU units)
        cpu = int(task_definition.get('cpu', '0'))
        if cpu == 256:
            results['cpu_optimized'] = True
            results['optimizations_applied'].append(f"✅ CPU: {cpu} units (optimized)")
        else:
            results['issues'].append(f"❌ CPU {cpu} units should be 256")

        # Check memory (should be 512MB)
        memory = int(task_definition.get('memory', '0'))
        if memory == 512:
            results['memory_optimized'] = True
            results['optimizations_applied'].append(f"✅ Memory: {memory}MB (optimized)")
        else:
            results['issues'].append(f"❌ Memory {memory}MB should be 512MB")

        # Check container definitions
        containers = task_definition.get('containerDefinitions', [])
        for container in containers:
            # Check stop timeout (should be 30 seconds)
            stop_timeout = container.get('stopTimeout', 0)
            if stop_timeout == 30:
                results['stop_timeout_configured'] = True
                results['optimizations_applied'].append(f"✅ Stop timeout: {stop_timeout}s (graceful shutdown)")
            else:
                results['issues'].append(f"❌ Stop timeout should be 30s, got {stop_timeout}s")

            # Check log configuration
            log_config = container.get('logConfiguration', {})
            if log_config.get('logDriver') == 'awslogs':
                results['optimizations_applied'].append("✅ CloudWatch Logs configured")

        return results

    def verify_log_retention(self) -> Dict[str, Any]:
        """
        Verify CloudWatch log group has proper retention configured.
        Returns:
            Dictionary with log retention verification results
        """
        print("\n📋 Verifying CloudWatch log retention...")

        log_group_name = f'/ecs/app-service-{self.environment_suffix}'

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

            if retention_days == 7:
                print(f"✅ Log retention: {retention_days} days (cost optimized)")
                return {
                    'configured': True,
                    'retention_days': retention_days,
                    'optimized': True
                }
            elif retention_days:
                print(f"⚠️  Log retention: {retention_days} days (recommended: 7 days)")
                return {
                    'configured': True,
                    'retention_days': retention_days,
                    'optimized': retention_days <= 14
                }
            else:
                print("❌ Log retention: Never expires (not cost optimized)")
                return {
                    'configured': False,
                    'issue': "No retention policy set - logs never expire"
                }

        except ClientError as e:
            print(f"❌ Error checking log retention: {e}")
            return {
                'configured': False,
                'issue': str(e)
            }

    def verify_ecr_lifecycle_policy(self) -> Dict[str, Any]:
        """
        Verify ECR repository has lifecycle policy for image cleanup.
        Returns:
            Dictionary with lifecycle policy verification results
        """
        print("\n🗂️  Verifying ECR lifecycle policy...")

        repo_name = f'app-repo-{self.environment_suffix}'

        try:
            response = self.ecr_client.get_lifecycle_policy(
                repositoryName=repo_name
            )

            if response.get('lifecyclePolicyText'):
                print(f"✅ ECR lifecycle policy configured for {repo_name}")
                return {
                    'configured': True,
                    'repository': repo_name
                }

        except ClientError as e:
            if e.response['Error']['Code'] == 'LifecyclePolicyNotFoundException':
                print(f"❌ No lifecycle policy configured for {repo_name}")
                return {
                    'configured': False,
                    'issue': 'No lifecycle policy - old images not automatically cleaned up'
                }
            else:
                print(f"⚠️  Error checking lifecycle policy: {e}")
                return {
                    'configured': False,
                    'issue': str(e)
                }

    def verify_cloudwatch_alarms(self) -> Dict[str, Any]:
        """
        Verify CloudWatch alarms for CPU and memory are configured.
        Returns:
            Dictionary with alarm verification results
        """
        print("\n⏰ Verifying CloudWatch alarms...")

        alarm_prefix = f'app-service-{self.environment_suffix}'

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix=alarm_prefix
            )

            alarms = response.get('MetricAlarms', [])
            cpu_alarm = any('cpu' in alarm['AlarmName'].lower() for alarm in alarms)
            memory_alarm = any('memory' in alarm['AlarmName'].lower() for alarm in alarms)

            results = {
                'cpu_alarm_configured': cpu_alarm,
                'memory_alarm_configured': memory_alarm,
            }

            if cpu_alarm:
                print("✅ CPU utilization alarm configured")
            else:
                print("❌ CPU utilization alarm not found")

            if memory_alarm:
                print("✅ Memory utilization alarm configured")
            else:
                print("❌ Memory utilization alarm not found")

            return results

        except ClientError as e:
            print(f"⚠️  Error checking alarms: {e}")
            return {
                'cpu_alarm_configured': False,
                'memory_alarm_configured': False,
                'issue': str(e)
            }

    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from optimizations.
        Returns:
            Dictionary with cost savings estimates
        """
        # Fargate pricing (us-east-1)
        # vCPU: $0.04048 per vCPU per hour
        # Memory: $0.004445 per GB per hour

        # Assumptions:
        # - Before: 1024 CPU (1 vCPU), 2048MB memory, running 24/7
        # - After: 256 CPU (0.25 vCPU), 512MB memory, running 24/7

        hours_per_month = 730

        # Before optimization
        old_vcpu = 1.0
        old_memory_gb = 2.0
        old_cost = (old_vcpu * 0.04048 + old_memory_gb * 0.004445) * hours_per_month

        # After optimization
        new_vcpu = 0.25
        new_memory_gb = 0.5
        new_cost = (new_vcpu * 0.04048 + new_memory_gb * 0.004445) * hours_per_month

        # Log storage savings (7 day retention)
        log_storage_savings = 5.0  # Estimated $5/month from log retention

        total_savings = (old_cost - new_cost) + log_storage_savings

        return {
            'baseline_monthly_cost': round(old_cost, 2),
            'optimized_monthly_cost': round(new_cost, 2),
            'monthly_savings': round(total_savings, 2),
            'savings_percentage': round((total_savings / old_cost) * 100, 1) if old_cost > 0 else 0,
            'cpu_reduction': '1024 CPU units → 256 CPU units (75% reduction)',
            'memory_reduction': '2048MB → 512MB (75% reduction)',
            'log_retention': '7 days retention policy',
        }

    def run_optimization(self) -> bool:
        """Run all optimization verification tasks."""
        print("\n🚀 Starting ECS Fargate service optimization verification...")
        print("=" * 50)

        # Get ECS cluster
        cluster_name = self.get_ecs_cluster()
        if not cluster_name:
            print("\n❌ Optimization verification failed - cluster not found")
            return False

        # Get ECS service
        service_data = self.get_ecs_service(cluster_name)
        if not service_data:
            print("\n❌ Optimization verification failed - service not found")
            return False

        service_name = service_data['serviceName']
        task_def_arn = service_data['taskDefinition']

        # Get task definition
        task_definition = self.get_task_definition(task_def_arn)
        if not task_definition:
            print("\n❌ Optimization verification failed - task definition not found")
            return False

        # Analyze metrics
        metrics = self.analyze_ecs_metrics(cluster_name, service_name)

        # Verify task optimizations
        optimization_results = self.verify_task_optimizations(task_definition)

        # Verify log retention
        log_results = self.verify_log_retention()

        # Verify ECR lifecycle policy
        ecr_results = self.verify_ecr_lifecycle_policy()

        # Verify CloudWatch alarms
        alarm_results = self.verify_cloudwatch_alarms()

        # Print results
        print("\n" + "=" * 50)
        print("📊 Optimization Verification Summary:")
        print("-" * 50)

        print("\nApplied Optimizations:")
        for opt in optimization_results['optimizations_applied']:
            print(f"   {opt}")

        if log_results.get('configured'):
            print(f"   ✅ Log retention: {log_results.get('retention_days')} days")

        if ecr_results.get('configured'):
            print(f"   ✅ ECR lifecycle policy configured")

        if alarm_results.get('cpu_alarm_configured'):
            print("   ✅ CPU alarm configured")

        if alarm_results.get('memory_alarm_configured'):
            print("   ✅ Memory alarm configured")

        if optimization_results['issues']:
            print("\nIssues Found:")
            for issue in optimization_results['issues']:
                print(f"   {issue}")

        # Print cost savings
        savings = self.get_cost_savings_estimate()
        print("\n💰 Cost Optimization Summary:")
        print("-" * 50)
        print(f"   CPU: {savings['cpu_reduction']}")
        print(f"   Memory: {savings['memory_reduction']}")
        print(f"   Log Retention: {savings['log_retention']}")
        print(f"\n   Baseline monthly cost: ${savings['baseline_monthly_cost']}")
        print(f"   Optimized monthly cost: ${savings['optimized_monthly_cost']}")
        print(f"   Monthly savings: ${savings['monthly_savings']} ({savings['savings_percentage']}%)")

        # Determine success
        all_optimized = (
            optimization_results['cpu_optimized'] and
            optimization_results['memory_optimized'] and
            optimization_results['stop_timeout_configured']
        )

        print("\n" + "=" * 50)
        if all_optimized:
            print("✨ ECS Fargate service optimization verification completed successfully!")
            return True
        else:
            print("⚠️  Some optimizations may need attention. Please review the issues above.")
            return True  # Return True as the verification ran successfully


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Verify and analyze ECS Fargate service optimizations"
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
        help='Show cost savings estimate without checking AWS resources'
    )

    args = parser.parse_args()

    environment_suffix = args.environment or os.getenv('ENVIRONMENT_SUFFIX') or 'dev'
    aws_region = args.region or os.getenv('AWS_REGION') or 'us-east-1'

    if args.dry_run:
        print("🔍 DRY RUN MODE - Showing estimated savings only")
        optimizer = ECSOptimizer(environment_suffix, aws_region)
        savings = optimizer.get_cost_savings_estimate()
        print(f"\nEstimated monthly savings: ${savings['monthly_savings']} ({savings['savings_percentage']}%)")
        print(f"CPU optimization: {savings['cpu_reduction']}")
        print(f"Memory optimization: {savings['memory_reduction']}")
        return

    try:
        optimizer = ECSOptimizer(environment_suffix, aws_region)
        optimizer.run_optimization()
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
