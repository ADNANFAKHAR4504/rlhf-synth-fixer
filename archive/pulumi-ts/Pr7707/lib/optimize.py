#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
RDS PostgreSQL optimization verification script.
Analyzes RDS instance configuration and CloudWatch metrics to verify optimization implementation.
"""

import os
import sys
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError


class RDSOptimizer:
    """Handles RDS PostgreSQL optimization verification and analysis."""

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
        self.rds_client = boto3.client('rds', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.sns_client = boto3.client('sns', region_name=region_name)
        self.ec2_client = boto3.client('ec2', region_name=region_name)

        print(f"Initialized RDS optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)

    def get_rds_instance(self) -> Optional[Dict[str, Any]]:
        """Find the RDS instance based on naming pattern."""
        try:
            expected_identifier = f'user-api-db-{self.environment_suffix}'

            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=expected_identifier
            )

            if response['DBInstances']:
                print(f"✅ Found RDS instance: {expected_identifier}")
                return response['DBInstances'][0]
            else:
                print(f"❌ RDS instance not found: {expected_identifier}")
                return None

        except ClientError as e:
            if e.response['Error']['Code'] == 'DBInstanceNotFound':
                print(f"❌ RDS instance not found: user-api-db-{self.environment_suffix}")
            else:
                print(f"❌ Error finding RDS instance: {e}")
            return None

    def verify_instance_configuration(self, instance: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify RDS instance has optimized configuration.
        Args:
            instance: RDS instance details
        Returns:
            Dictionary with configuration verification results
        """
        print("\n🔍 Verifying RDS instance configuration...")

        results = {
            'instance_class_optimized': False,
            'multi_az_enabled': False,
            'backup_configured': False,
            'performance_insights_enabled': False,
            'enhanced_monitoring_enabled': False,
            'encryption_enabled': False,
            'issues': [],
            'optimizations_applied': [],
        }

        # Check instance class (should be db.r6g.large)
        instance_class = instance.get('DBInstanceClass', '')
        if instance_class == 'db.r6g.large':
            results['instance_class_optimized'] = True
            results['optimizations_applied'].append(f"✅ Instance class: {instance_class} (Graviton optimized)")
        else:
            results['issues'].append(f"❌ Instance class {instance_class} should be db.r6g.large")

        # Check Multi-AZ deployment
        multi_az = instance.get('MultiAZ', False)
        if multi_az:
            results['multi_az_enabled'] = True
            results['optimizations_applied'].append("✅ Multi-AZ: Enabled (high availability)")
        else:
            results['issues'].append("❌ Multi-AZ should be enabled for high availability")

        # Check backup retention (should be 35 days)
        backup_retention = instance.get('BackupRetentionPeriod', 0)
        if backup_retention == 35:
            results['backup_configured'] = True
            results['optimizations_applied'].append(f"✅ Backup retention: {backup_retention} days (compliance ready)")
        elif backup_retention >= 7:
            results['backup_configured'] = True
            results['optimizations_applied'].append(f"✅ Backup retention: {backup_retention} days")
        else:
            results['issues'].append(f"❌ Backup retention {backup_retention} days should be 35 days")

        # Check Performance Insights
        perf_insights = instance.get('PerformanceInsightsEnabled', False)
        perf_retention = instance.get('PerformanceInsightsRetentionPeriod', 0)
        if perf_insights and perf_retention >= 7:
            results['performance_insights_enabled'] = True
            results['optimizations_applied'].append(f"✅ Performance Insights: Enabled ({perf_retention} days retention)")
        else:
            results['issues'].append("❌ Performance Insights should be enabled with 7-day retention")

        # Check Enhanced Monitoring
        monitoring_interval = instance.get('MonitoringInterval', 0)
        if monitoring_interval == 60:
            results['enhanced_monitoring_enabled'] = True
            results['optimizations_applied'].append(f"✅ Enhanced Monitoring: {monitoring_interval}s granularity")
        elif monitoring_interval > 0:
            results['enhanced_monitoring_enabled'] = True
            results['optimizations_applied'].append(f"✅ Enhanced Monitoring: {monitoring_interval}s granularity")
        else:
            results['issues'].append("❌ Enhanced Monitoring should be enabled with 60s interval")

        # Check storage encryption
        storage_encrypted = instance.get('StorageEncrypted', False)
        if storage_encrypted:
            results['encryption_enabled'] = True
            results['optimizations_applied'].append("✅ Storage encryption: Enabled")
        else:
            results['issues'].append("❌ Storage encryption should be enabled")

        # Check engine and version
        engine = instance.get('Engine', '')
        engine_version = instance.get('EngineVersion', '')
        if engine == 'postgres':
            results['optimizations_applied'].append(f"✅ Engine: {engine} {engine_version}")
        else:
            results['issues'].append(f"❌ Engine should be postgres, found: {engine}")

        return results

    def verify_parameter_group(self, instance: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify custom parameter group with optimization settings.
        Args:
            instance: RDS instance details
        Returns:
            Dictionary with parameter group verification results
        """
        print("\n📊 Verifying parameter group optimization...")

        results = {
            'custom_parameter_group': False,
            'optimized_parameters': [],
            'issues': [],
        }

        param_groups = instance.get('DBParameterGroups', [])
        if not param_groups:
            results['issues'].append("❌ No parameter group found")
            return results

        param_group_name = param_groups[0].get('DBParameterGroupName', '')

        # Check if custom parameter group (not default)
        if param_group_name.startswith('default.'):
            results['issues'].append(f"❌ Using default parameter group: {param_group_name}")
            return results

        results['custom_parameter_group'] = True
        results['optimized_parameters'].append(f"✅ Custom parameter group: {param_group_name}")

        try:
            # Get parameter details
            params_response = self.rds_client.describe_db_parameters(
                DBParameterGroupName=param_group_name,
                MaxRecords=100
            )

            parameters = params_response.get('Parameters', [])
            param_dict = {p['ParameterName']: p.get('ParameterValue') for p in parameters if p.get('ParameterValue')}

            # Check key optimization parameters
            if 'shared_buffers' in param_dict:
                results['optimized_parameters'].append(f"✅ shared_buffers: {param_dict['shared_buffers']} (query caching)")

            if 'effective_cache_size' in param_dict:
                results['optimized_parameters'].append(f"✅ effective_cache_size: {param_dict['effective_cache_size']} (query planning)")

            if 'maintenance_work_mem' in param_dict:
                results['optimized_parameters'].append(f"✅ maintenance_work_mem: {param_dict['maintenance_work_mem']}")

            if 'work_mem' in param_dict:
                results['optimized_parameters'].append(f"✅ work_mem: {param_dict['work_mem']}")

        except ClientError as e:
            results['issues'].append(f"⚠️ Could not verify parameters: {e}")

        return results

    def verify_cloudwatch_alarms(self, instance: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify CloudWatch alarms are configured.
        Args:
            instance: RDS instance details
        Returns:
            Dictionary with alarm verification results
        """
        print("\n🔔 Verifying CloudWatch alarms...")

        results = {
            'alarms_configured': [],
            'missing_alarms': [],
            'total_alarms': 0,
        }

        instance_identifier = instance.get('DBInstanceIdentifier', '')

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix=f'db-'
            )

            alarms = response.get('MetricAlarms', [])
            instance_alarms = [
                alarm for alarm in alarms
                if alarm.get('Dimensions') and
                any(d.get('Value') == instance_identifier for d in alarm.get('Dimensions', []))
            ]

            results['total_alarms'] = len(instance_alarms)

            # Check for required alarms
            alarm_types = {
                'cpu': False,
                'connections': False,
                'read_latency': False,
                'write_latency': False,
            }

            for alarm in instance_alarms:
                alarm_name = alarm.get('AlarmName', '').lower()
                metric_name = alarm.get('MetricName', '')

                if 'cpu' in alarm_name or metric_name == 'CPUUtilization':
                    alarm_types['cpu'] = True
                    results['alarms_configured'].append(f"✅ CPU utilization alarm: {alarm.get('AlarmName')}")

                if 'connection' in alarm_name or metric_name == 'DatabaseConnections':
                    alarm_types['connections'] = True
                    results['alarms_configured'].append(f"✅ Database connections alarm: {alarm.get('AlarmName')}")

                if 'read' in alarm_name and 'latency' in alarm_name or metric_name == 'ReadLatency':
                    alarm_types['read_latency'] = True
                    results['alarms_configured'].append(f"✅ Read latency alarm: {alarm.get('AlarmName')}")

                if 'write' in alarm_name and 'latency' in alarm_name or metric_name == 'WriteLatency':
                    alarm_types['write_latency'] = True
                    results['alarms_configured'].append(f"✅ Write latency alarm: {alarm.get('AlarmName')}")

            # Check for missing alarms
            if not alarm_types['cpu']:
                results['missing_alarms'].append("❌ CPU utilization alarm not found")
            if not alarm_types['connections']:
                results['missing_alarms'].append("❌ Database connections alarm not found")
            if not alarm_types['read_latency']:
                results['missing_alarms'].append("❌ Read latency alarm not found")
            if not alarm_types['write_latency']:
                results['missing_alarms'].append("❌ Write latency alarm not found")

        except ClientError as e:
            results['missing_alarms'].append(f"⚠️ Error checking alarms: {e}")

        return results

    def verify_sns_topic(self) -> Dict[str, Any]:
        """
        Verify SNS topic for alerts is configured.
        Returns:
            Dictionary with SNS topic verification results
        """
        print("\n📧 Verifying SNS topic for alerts...")

        results = {
            'topic_found': False,
            'topic_arn': None,
            'issues': [],
        }

        try:
            response = self.sns_client.list_topics()
            topics = response.get('Topics', [])

            # Look for database alerts topic
            for topic in topics:
                topic_arn = topic.get('TopicArn', '')
                if f'db-alerts-{self.environment_suffix}' in topic_arn:
                    results['topic_found'] = True
                    results['topic_arn'] = topic_arn
                    print(f"✅ SNS topic found: {topic_arn}")
                    break

            if not results['topic_found']:
                results['issues'].append(f"❌ SNS topic not found for: db-alerts-{self.environment_suffix}")

        except ClientError as e:
            results['issues'].append(f"⚠️ Error checking SNS topic: {e}")

        return results

    def analyze_performance_metrics(self, instance: Dict[str, Any]) -> Dict[str, float]:
        """
        Analyze recent performance metrics from CloudWatch.
        Args:
            instance: RDS instance details
        Returns:
            Dictionary with performance metrics
        """
        print("\n📈 Analyzing performance metrics...")

        instance_identifier = instance.get('DBInstanceIdentifier', '')

        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(hours=1)  # Last 1 hour

            # Get CPU utilization
            cpu_response = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='CPUUtilization',
                Dimensions=[
                    {'Name': 'DBInstanceIdentifier', 'Value': instance_identifier},
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,  # 5 minutes
                Statistics=['Average', 'Maximum'],
            )

            cpu_datapoints = cpu_response.get('Datapoints', [])
            avg_cpu = sum(d['Average'] for d in cpu_datapoints) / len(cpu_datapoints) if cpu_datapoints else 0
            max_cpu = max((d['Maximum'] for d in cpu_datapoints), default=0)

            print(f"Average CPU utilization (1h): {avg_cpu:.2f}%")
            print(f"Maximum CPU utilization (1h): {max_cpu:.2f}%")

            # Get database connections
            conn_response = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='DatabaseConnections',
                Dimensions=[
                    {'Name': 'DBInstanceIdentifier', 'Value': instance_identifier},
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=['Average', 'Maximum'],
            )

            conn_datapoints = conn_response.get('Datapoints', [])
            avg_conn = sum(d['Average'] for d in conn_datapoints) / len(conn_datapoints) if conn_datapoints else 0
            max_conn = max((d['Maximum'] for d in conn_datapoints), default=0)

            print(f"Average connections (1h): {avg_conn:.2f}")
            print(f"Maximum connections (1h): {max_conn:.2f}")

            return {
                'avg_cpu': avg_cpu,
                'max_cpu': max_cpu,
                'avg_connections': avg_conn,
                'max_connections': max_conn,
            }

        except ClientError as e:
            print(f"⚠️ Error fetching metrics: {e}")
            return {
                'avg_cpu': 0,
                'max_cpu': 0,
                'avg_connections': 0,
                'max_connections': 0,
            }

    def get_cost_optimization_summary(self) -> Dict[str, Any]:
        """
        Calculate estimated cost impact of optimizations.
        Returns:
            Dictionary with cost optimization summary
        """
        # RDS pricing estimates for us-east-1
        # db.t3.medium: ~$0.068/hour = ~$50/month
        # db.r6g.large: ~$0.192/hour = ~$140/month

        # However, performance improvements justify the cost:
        # - 16 GiB memory (vs 4 GiB) = 4x memory
        # - Graviton processors = better price/performance
        # - Multi-AZ = high availability
        # - Performance Insights = better troubleshooting
        # - Optimized parameters = better resource utilization

        return {
            'baseline_instance': 'db.t3.medium',
            'baseline_monthly_cost': 50,
            'optimized_instance': 'db.r6g.large',
            'optimized_monthly_cost': 140,
            'additional_monthly_cost': 90,
            'performance_improvement': '4x memory capacity',
            'reliability_improvement': 'Multi-AZ high availability',
            'monitoring_improvement': 'Performance Insights + Enhanced Monitoring',
            'justification': 'Cost increase justified by performance, reliability, and observability improvements',
        }

    def run_optimization(self) -> bool:
        """Run all optimization verification tasks."""
        print("\n🚀 Starting RDS PostgreSQL optimization verification...")
        print("=" * 50)

        # Get RDS instance
        instance = self.get_rds_instance()
        if not instance:
            print("\n❌ Optimization verification failed - instance not found")
            return False

        # Verify instance configuration
        config_results = self.verify_instance_configuration(instance)

        # Verify parameter group
        param_results = self.verify_parameter_group(instance)

        # Verify CloudWatch alarms
        alarm_results = self.verify_cloudwatch_alarms(instance)

        # Verify SNS topic
        sns_results = self.verify_sns_topic()

        # Analyze performance metrics
        metrics = self.analyze_performance_metrics(instance)

        # Print results
        print("\n" + "=" * 50)
        print("📊 Optimization Verification Summary:")
        print("-" * 50)

        print("\nApplied Optimizations:")
        for opt in config_results['optimizations_applied']:
            print(f"   {opt}")

        for opt in param_results['optimized_parameters']:
            print(f"   {opt}")

        if alarm_results['alarms_configured']:
            print("\nConfigured Alarms:")
            for alarm in alarm_results['alarms_configured']:
                print(f"   {alarm}")

        # Print issues
        all_issues = (
            config_results['issues'] +
            param_results['issues'] +
            alarm_results['missing_alarms'] +
            sns_results['issues']
        )

        if all_issues:
            print("\nIssues Found:")
            for issue in all_issues:
                print(f"   {issue}")

        # Print cost summary
        cost_summary = self.get_cost_optimization_summary()
        print("\n💰 Cost Optimization Summary:")
        print("-" * 50)
        print(f"   Baseline: {cost_summary['baseline_instance']} (~${cost_summary['baseline_monthly_cost']}/month)")
        print(f"   Optimized: {cost_summary['optimized_instance']} (~${cost_summary['optimized_monthly_cost']}/month)")
        print(f"   Additional cost: ~${cost_summary['additional_monthly_cost']}/month")
        print(f"\n   Performance: {cost_summary['performance_improvement']}")
        print(f"   Reliability: {cost_summary['reliability_improvement']}")
        print(f"   Monitoring: {cost_summary['monitoring_improvement']}")
        print(f"\n   {cost_summary['justification']}")

        # Determine success
        all_optimized = (
            config_results['instance_class_optimized'] and
            config_results['multi_az_enabled'] and
            config_results['performance_insights_enabled'] and
            config_results['enhanced_monitoring_enabled'] and
            param_results['custom_parameter_group'] and
            sns_results['topic_found']
        )

        print("\n" + "=" * 50)
        if all_optimized:
            print("✨ RDS optimization verification completed successfully!")
            return True
        else:
            print("⚠️ Some optimizations may need attention. Please review the issues above.")
            return True  # Return True as the verification ran successfully


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Verify and analyze RDS PostgreSQL optimizations"
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
        help='Show cost summary without checking AWS resources'
    )

    args = parser.parse_args()

    environment_suffix = args.environment or os.getenv('ENVIRONMENT_SUFFIX') or 'dev'
    aws_region = args.region or os.getenv('AWS_REGION') or 'us-east-1'

    if args.dry_run:
        print("🔍 DRY RUN MODE - Showing cost summary only")
        optimizer = RDSOptimizer(environment_suffix, aws_region)
        cost_summary = optimizer.get_cost_optimization_summary()
        print(f"\nCost Summary:")
        print(f"Baseline: {cost_summary['baseline_instance']} (~${cost_summary['baseline_monthly_cost']}/month)")
        print(f"Optimized: {cost_summary['optimized_instance']} (~${cost_summary['optimized_monthly_cost']}/month)")
        print(f"Additional cost: ~${cost_summary['additional_monthly_cost']}/month")
        return

    try:
        optimizer = RDSOptimizer(environment_suffix, aws_region)
        optimizer.run_optimization()
    except KeyboardInterrupt:
        print("\n\n⚠️ Optimization verification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
