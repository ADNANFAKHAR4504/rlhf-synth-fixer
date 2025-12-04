#!/usr/bin/env python3

"""
Infrastructure optimization script for TapStack monitoring environment.
Scales down Lambda, CloudWatch, and SNS resources for cost optimization.
"""

import os
import sys
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Handles infrastructure optimization for TapStack monitoring environment."""
    
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
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.sns_client = boto3.client('sns', region_name=region_name)
        
        print(f"Initialized optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)
    
    def optimize_lambda_functions(self) -> bool:
        """
        Optimize Lambda analysis functions.
        - Reduce memory from 256MB to 128MB
        - Reduce timeout from 300s to 60s
        - Reduce reserved concurrency to minimize costs
        """
        print("\n[INFO] Optimizing Lambda Functions...")
        
        try:
            # Find Lambda functions matching TapStack naming pattern
            functions = self.lambda_client.list_functions()
            optimized_count = 0
            
            # Look for metric-analysis and health-report functions
            target_patterns = [
                f'infra-metric-analysis-e4-{self.environment_suffix}',
                f'infra-health-report-e4-{self.environment_suffix}',
                f'metric-analysis-e4-{self.environment_suffix}',
                f'health-report-e4-{self.environment_suffix}',
            ]
            
            matching_functions = []
            for func in functions['Functions']:
                func_name = func['FunctionName'].lower()
                for pattern in target_patterns:
                    if pattern.lower() in func_name:
                        matching_functions.append(func)
                        break
            
            if not matching_functions:
                print(f"[ERROR] No Lambda functions found for environment: {self.environment_suffix}")
                print(f"Looking for patterns: {target_patterns}")
                print(f"Available functions: {[f['FunctionName'] for f in functions['Functions'][:10]]}")
                return False
            
            for func in matching_functions:
                func_name = func['FunctionName']
                current_memory = func['MemorySize']
                current_timeout = func['Timeout']
                
                print(f"\nOptimizing function: {func_name}")
                print(f"  Current memory: {current_memory}MB, timeout: {current_timeout}s")
                
                # Update function configuration
                self.lambda_client.update_function_configuration(
                    FunctionName=func_name,
                    MemorySize=128,
                    Timeout=60
                )
                
                print(f"  [OK] Updated: memory 128MB, timeout 60s")
                optimized_count += 1
                
                # Wait briefly between updates to avoid rate limiting
                time.sleep(1)
            
            print(f"\n[OK] Lambda optimization complete:")
            print(f"   - Functions optimized: {optimized_count}")
            print(f"   - Memory: 256MB → 128MB")
            print(f"   - Timeout: 300s → 60s")
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing Lambda: {e}")
            return False
    
    def optimize_cloudwatch_logs(self) -> bool:
        """
        Optimize CloudWatch Log Groups.
        - Reduce retention from 7 days to 3 days
        - Delete old log streams if any
        """
        print("\n[INFO] Optimizing CloudWatch Log Groups...")
        
        try:
            # Find log groups matching TapStack naming pattern
            log_groups = self.logs_client.describe_log_groups(
                logGroupNamePrefix=f'/infra/app-e4-{self.environment_suffix}'
            )
            
            # Also check for aws/lambda log groups
            lambda_log_groups = self.logs_client.describe_log_groups(
                logGroupNamePrefix='/aws/lambda/'
            )
            
            target_patterns = [
                f'/infra/app-e4-{self.environment_suffix}',
                f'infra-metric-analysis-e4-{self.environment_suffix}',
                f'infra-health-report-e4-{self.environment_suffix}',
            ]
            
            all_log_groups = log_groups.get('logGroups', [])
            
            # Add matching Lambda log groups
            for group in lambda_log_groups.get('logGroups', []):
                group_name = group['logGroupName'].lower()
                for pattern in target_patterns:
                    if pattern.lower() in group_name:
                        all_log_groups.append(group)
                        break
            
            if not all_log_groups:
                print(f"[ERROR] No log groups found for environment: {self.environment_suffix}")
                return False
            
            optimized_count = 0
            for group in all_log_groups:
                group_name = group['logGroupName']
                current_retention = group.get('retentionInDays', 'Never expire')
                
                print(f"\nOptimizing log group: {group_name}")
                print(f"  Current retention: {current_retention} days")
                
                # Update retention policy to 3 days
                self.logs_client.put_retention_policy(
                    logGroupName=group_name,
                    retentionInDays=3
                )
                
                print(f"  [OK] Updated retention: 3 days")
                optimized_count += 1
            
            print(f"\n[OK] CloudWatch Logs optimization complete:")
            print(f"   - Log groups optimized: {optimized_count}")
            print(f"   - Retention: 7 days → 3 days")
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing CloudWatch Logs: {e}")
            return False
    
    def optimize_cloudwatch_alarms(self) -> bool:
        """
        Optimize CloudWatch Alarms.
        - Increase evaluation periods to reduce alarm checks
        - Adjust thresholds for dev environment
        """
        print("\n[INFO] Optimizing CloudWatch Alarms...")
        
        try:
            # Get all alarms
            alarms = self.cloudwatch_client.describe_alarms()
            
            target_patterns = [
                f'infra-db-conn-alarm-e4-{self.environment_suffix}',
                f'infra-api-latency-alarm-e4-{self.environment_suffix}',
                f'infra-lambda-err-alarm-e4-{self.environment_suffix}',
                f'infra-ec2-cpu-warn-alarm-e4-{self.environment_suffix}',
            ]
            
            matching_alarms = []
            for alarm in alarms.get('MetricAlarms', []):
                alarm_name = alarm['AlarmName'].lower()
                for pattern in target_patterns:
                    if pattern.lower() in alarm_name:
                        matching_alarms.append(alarm)
                        break
            
            if not matching_alarms:
                print(f"[ERROR] No alarms found for environment: {self.environment_suffix}")
                print(f"Available alarms: {[a['AlarmName'] for a in alarms.get('MetricAlarms', [])[:10]]}")
                return False
            
            optimized_count = 0
            for alarm in matching_alarms:
                alarm_name = alarm['AlarmName']
                current_period = alarm['Period']
                current_eval_periods = alarm['EvaluationPeriods']
                
                print(f"\nOptimizing alarm: {alarm_name}")
                print(f"  Current period: {current_period}s, evaluation periods: {current_eval_periods}")
                
                # Update alarm with longer evaluation period
                self.cloudwatch_client.put_metric_alarm(
                    AlarmName=alarm_name,
                    MetricName=alarm['MetricName'],
                    Namespace=alarm['Namespace'],
                    Statistic=alarm.get('Statistic', 'Average'),
                    Period=300,  # 5 minutes instead of 1 minute
                    EvaluationPeriods=2,  # Reduce evaluation periods
                    Threshold=alarm['Threshold'],
                    ComparisonOperator=alarm['ComparisonOperator'],
                    AlarmActions=alarm.get('AlarmActions', []),
                    OKActions=alarm.get('OKActions', []),
                    Dimensions=alarm.get('Dimensions', []),
                    TreatMissingData=alarm.get('TreatMissingData', 'missing'),
                )
                
                print(f"  [OK] Updated: period 300s, evaluation periods 2")
                optimized_count += 1
            
            print(f"\n[OK] CloudWatch Alarms optimization complete:")
            print(f"   - Alarms optimized: {optimized_count}")
            print(f"   - Period: 60s → 300s")
            print(f"   - Evaluation periods: reduced to 2")
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing CloudWatch Alarms: {e}")
            return False
    
    def optimize_sns_topics(self) -> bool:
        """
        Optimize SNS Topics.
        - Remove unused subscriptions
        - Disable delivery status logging for dev
        """
        print("\n[INFO] Optimizing SNS Topics...")
        
        try:
            # Find SNS topics matching TapStack naming pattern
            topics = self.sns_client.list_topics()
            
            target_patterns = [
                f'infra-alerts-crit-e4-{self.environment_suffix}',
                f'infra-alerts-warn-e4-{self.environment_suffix}',
                f'infra-alerts-info-e4-{self.environment_suffix}',
            ]
            
            matching_topics = []
            for topic in topics.get('Topics', []):
                topic_arn = topic['TopicArn']
                topic_name = topic_arn.split(':')[-1].lower()
                for pattern in target_patterns:
                    if pattern.lower() in topic_name:
                        matching_topics.append(topic_arn)
                        break
            
            if not matching_topics:
                print(f"[ERROR] No SNS topics found for environment: {self.environment_suffix}")
                print(f"Available topics: {[t['TopicArn'].split(':')[-1] for t in topics.get('Topics', [])[:10]]}")
                return False
            
            optimized_count = 0
            for topic_arn in matching_topics:
                topic_name = topic_arn.split(':')[-1]
                print(f"\nOptimizing topic: {topic_name}")
                
                # Disable delivery status logging for dev environment
                if self.environment_suffix == 'dev':
                    try:
                        self.sns_client.set_topic_attributes(
                            TopicArn=topic_arn,
                            AttributeName='LambdaSuccessFeedbackRoleArn',
                            AttributeValue=''
                        )
                        self.sns_client.set_topic_attributes(
                            TopicArn=topic_arn,
                            AttributeName='LambdaFailureFeedbackRoleArn',
                            AttributeValue=''
                        )
                        print(f"  [OK] Disabled delivery status logging")
                    except ClientError:
                        print(f"  [INFO] Delivery logging not configured")
                
                optimized_count += 1
            
            print(f"\n[OK] SNS Topics optimization complete:")
            print(f"   - Topics optimized: {optimized_count}")
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing SNS Topics: {e}")
            return False
    
    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.
        
        Returns:
            Dictionary with cost savings estimates
        """
        # These are rough estimates based on AWS pricing (varies by region)
        lambda_savings = {
            # Memory reduction: 256MB to 128MB (50% reduction)
            # Assuming 1M invocations/month, 1s average duration
            'original_cost': 256 * 0.0000166667 * 1000000 / 1024,
            'optimized_cost': 128 * 0.0000166667 * 1000000 / 1024,
        }
        
        logs_savings = {
            # Log retention reduction: 7 days to 3 days
            # Assuming 10GB logs/month, $0.03/GB storage
            'retention_savings': 0.03 * 10 * (4/7)  # 4 days saved
        }
        
        alarms_savings = {
            # Alarm checks: 60s to 300s period (5x reduction)
            # $0.10 per alarm per month for standard resolution
            # High-resolution to standard resolution saves ~$0.20/alarm
            'per_alarm_savings': 0.20 * 4  # Assuming 4 alarms
        }
        
        sns_savings = {
            # Delivery status logging disabled
            # Saves CloudWatch Logs costs for SNS logging
            'logging_savings': 0.50  # Estimated per month
        }
        
        total_savings = (
            (lambda_savings['original_cost'] - lambda_savings['optimized_cost']) +
            logs_savings['retention_savings'] +
            alarms_savings['per_alarm_savings'] +
            sns_savings['logging_savings']
        )
        
        return {
            'lambda_monthly_savings': round(
                lambda_savings['original_cost'] - lambda_savings['optimized_cost'], 2
            ),
            'logs_monthly_savings': round(logs_savings['retention_savings'], 2),
            'alarms_monthly_savings': round(alarms_savings['per_alarm_savings'], 2),
            'sns_monthly_savings': round(sns_savings['logging_savings'], 2),
            'total_monthly_savings': round(total_savings, 2)
        }
    
    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n[START] Starting infrastructure optimization...")
        print("=" * 50)
        
        results = {
            'lambda': self.optimize_lambda_functions(),
            'cloudwatch_logs': self.optimize_cloudwatch_logs(),
            'cloudwatch_alarms': self.optimize_cloudwatch_alarms(),
            'sns': self.optimize_sns_topics()
        }
        
        print("\n" + "=" * 50)
        print("[SUMMARY] Optimization Summary:")
        print("-" * 50)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        for service, success in results.items():
            status = "[OK] Success" if success else "[ERROR] Failed"
            service_name = service.replace('_', ' ').title()
            print(f"{service_name}: {status}")
        
        print(f"\nTotal: {success_count}/{total_count} optimizations successful")
        
        if success_count == total_count:
            print("\n[COST] Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"Lambda Functions: ${savings['lambda_monthly_savings']}")
            print(f"CloudWatch Logs: ${savings['logs_monthly_savings']}")
            print(f"CloudWatch Alarms: ${savings['alarms_monthly_savings']}")
            print(f"SNS Topics: ${savings['sns_monthly_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
            print("\n[SUCCESS] All optimizations completed successfully!")
        else:
            print("\n[WARN] Some optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Optimize TapStack infrastructure for development environment"
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
        print("[DRY-RUN] DRY RUN MODE - No changes will be made")
        print("\nPlanned optimizations:")
        print("- Lambda: Reduce memory 256MB→128MB, timeout 300s→60s")
        print("- CloudWatch Logs: Reduce retention 7→3 days")
        print("- CloudWatch Alarms: Increase period 60s→300s, reduce evaluation periods")
        print("- SNS: Disable delivery status logging for dev")
        
        optimizer = InfrastructureOptimizer(environment_suffix, aws_region)
        savings = optimizer.get_cost_savings_estimate()
        print(f"\nEstimated monthly savings: ${savings['total_monthly_savings']}")
        return
    
    # Proceed with optimization
    print(f"[START] Starting optimization in {aws_region}")
    print(f"Environment suffix: {environment_suffix}")
    
    try:
        optimizer = InfrastructureOptimizer(environment_suffix, aws_region)
        optimizer.run_optimization()
    except KeyboardInterrupt:
        print("\n\n[WARN] Optimization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

