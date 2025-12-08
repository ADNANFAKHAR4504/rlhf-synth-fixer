#!/usr/bin/env python3

"""
Infrastructure optimization script for TAP compliance monitoring environment.
Scales down Lambda, CloudWatch, and S3 resources for cost optimization.
"""

import os
import sys
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Handles infrastructure optimization for TAP compliance monitoring environment."""
    
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
        self.s3_client = boto3.client('s3', region_name=region_name)
        self.events_client = boto3.client('events', region_name=region_name)
        self.sns_client = boto3.client('sns', region_name=region_name)
        
        print(f"Initialized optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)
    
    def optimize_lambda_function(self) -> bool:
        """
        Optimize Lambda function configuration.
        - Reduce memory from 512 MB to 256 MB
        - Reduce timeout from 300s to 120s
        """
        print("\n[OPTIMIZE] Optimizing Lambda Function...")
        
        try:
            # Find the Lambda function - must match stack naming pattern
            functions = self.lambda_client.list_functions()
            function_name = None
            
            # Priority 1: Look for function with 'compliance-scanner' and environment suffix
            for func in functions['Functions']:
                func_name = func['FunctionName'].lower()
                if 'compliance-scanner' in func_name and self.environment_suffix.lower() in func_name:
                    function_name = func['FunctionName']
                    print(f"Found function (compliance-scanner): {function_name}")
                    break
            
            # Priority 2: Look for 'tapstack' in the name
            if not function_name:
                for func in functions['Functions']:
                    func_name = func['FunctionName'].lower()
                    if 'tapstack' in func_name and self.environment_suffix.lower() in func_name:
                        function_name = func['FunctionName']
                        print(f"Found function (TapStack): {function_name}")
                        break
            
            if not function_name:
                print(f"[ERROR] Lambda function not found for environment: {self.environment_suffix}")
                print(f"Available functions: {[f['FunctionName'] for f in functions['Functions']]}")
                return False
            
            # Get current configuration
            current_config = self.lambda_client.get_function_configuration(
                FunctionName=function_name
            )
            current_memory = current_config['MemorySize']
            current_timeout = current_config['Timeout']
            
            print(f"Current memory: {current_memory} MB")
            print(f"Current timeout: {current_timeout}s")
            
            # Skip if already optimized
            if current_memory <= 256 and current_timeout <= 120:
                print("[OK] Already optimized (256 MB, 120s or less)")
                return True
            
            # Update Lambda configuration
            print("Updating Lambda configuration...")
            self.lambda_client.update_function_configuration(
                FunctionName=function_name,
                MemorySize=256,
                Timeout=120
            )
            
            print("[OK] Lambda optimization complete:")
            print(f"   - Memory: {current_memory} MB -> 256 MB")
            print(f"   - Timeout: {current_timeout}s -> 120s")
            
            # Wait for update to complete
            print("Waiting for Lambda update to complete...")
            waiter = self.lambda_client.get_waiter('function_updated')
            waiter.wait(
                FunctionName=function_name,
                WaiterConfig={'Delay': 5, 'MaxAttempts': 30}
            )
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing Lambda: {e}")
            return False
    
    def optimize_cloudwatch_logs(self) -> bool:
        """
        Optimize CloudWatch Logs configuration.
        - Reduce retention from 30 days to 7 days
        """
        print("\n[OPTIMIZE] Optimizing CloudWatch Logs...")
        
        try:
            # Find the log group - must match stack naming pattern
            log_groups = self.logs_client.describe_log_groups(
                logGroupNamePrefix='/aws/lambda/compliance-scanner'
            )
            log_group_name = None
            current_retention = None
            
            # Look for log group with environment suffix
            for group in log_groups['logGroups']:
                if self.environment_suffix.lower() in group['logGroupName'].lower():
                    log_group_name = group['logGroupName']
                    current_retention = group.get('retentionInDays')
                    print(f"Found log group: {log_group_name}")
                    break
            
            if not log_group_name:
                print(f"[ERROR] Log group not found for environment: {self.environment_suffix}")
                print(f"Available log groups: {[g['logGroupName'] for g in log_groups['logGroups']]}")
                return False
            
            print(f"Current retention: {current_retention} days")
            
            # Skip if already optimized
            if current_retention and current_retention <= 7:
                print("[OK] Already optimized (7 days or less)")
                return True
            
            # Update log group retention
            print("Updating log group retention...")
            self.logs_client.put_retention_policy(
                logGroupName=log_group_name,
                retentionInDays=7
            )
            
            print("[OK] CloudWatch Logs optimization complete:")
            print(f"   - Retention: {current_retention} days -> 7 days")
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing CloudWatch Logs: {e}")
            return False
    
    def optimize_s3_bucket(self) -> bool:
        """
        Optimize S3 bucket configuration.
        - Add lifecycle rule to expire old compliance reports after 30 days
        - Transition to Glacier after 14 days
        """
        print("\n[OPTIMIZE] Optimizing S3 Bucket...")
        
        try:
            # Find the S3 bucket - must match stack naming pattern
            buckets = self.s3_client.list_buckets()
            bucket_name = None
            
            # Look for bucket with 'compliance-reports' and environment suffix
            for bucket in buckets['Buckets']:
                bucket_lower = bucket['Name'].lower()
                if 'compliance-reports' in bucket_lower and self.environment_suffix.lower() in bucket_lower:
                    bucket_name = bucket['Name']
                    print(f"Found bucket: {bucket_name}")
                    break
            
            if not bucket_name:
                print(f"[ERROR] S3 bucket not found for environment: {self.environment_suffix}")
                print(f"Available buckets: {[b['Name'] for b in buckets['Buckets']]}")
                return False
            
            # Check current lifecycle configuration
            try:
                current_lifecycle = self.s3_client.get_bucket_lifecycle_configuration(
                    Bucket=bucket_name
                )
                has_lifecycle = True
                print(f"Current lifecycle rules: {len(current_lifecycle.get('Rules', []))}")
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchLifecycleConfiguration':
                    has_lifecycle = False
                    print("No lifecycle configuration found")
                else:
                    raise
            
            # Define optimized lifecycle rules
            lifecycle_config = {
                'Rules': [
                    {
                        'ID': 'OptimizeComplianceReports',
                        'Status': 'Enabled',
                        'Filter': {
                            'Prefix': 'compliance-reports/'
                        },
                        'Transitions': [
                            {
                                'Days': 14,
                                'StorageClass': 'GLACIER'
                            }
                        ],
                        'Expiration': {
                            'Days': 90
                        }
                    },
                    {
                        'ID': 'CleanupOldVersions',
                        'Status': 'Enabled',
                        'Filter': {
                            'Prefix': ''
                        },
                        'NoncurrentVersionExpiration': {
                            'NoncurrentDays': 30
                        }
                    }
                ]
            }
            
            # Apply lifecycle configuration
            print("Applying lifecycle configuration...")
            self.s3_client.put_bucket_lifecycle_configuration(
                Bucket=bucket_name,
                LifecycleConfiguration=lifecycle_config
            )
            
            print("[OK] S3 optimization complete:")
            print("   - Reports transition to Glacier after 14 days")
            print("   - Reports expire after 90 days")
            print("   - Old versions expire after 30 days")
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing S3: {e}")
            return False
    
    def optimize_event_schedule(self) -> bool:
        """
        Optimize EventBridge schedule.
        - Reduce scan frequency from every 6 hours to every 24 hours
        """
        print("\n[OPTIMIZE] Optimizing EventBridge Schedule...")
        
        try:
            # Find the event rule - must match stack naming pattern
            rules = self.events_client.list_rules(
                NamePrefix='compliance-scan-schedule'
            )
            rule_name = None
            current_schedule = None
            
            # Look for rule with environment suffix
            for rule in rules['Rules']:
                if self.environment_suffix.lower() in rule['Name'].lower():
                    rule_name = rule['Name']
                    current_schedule = rule.get('ScheduleExpression')
                    print(f"Found rule: {rule_name}")
                    break
            
            if not rule_name:
                print(f"[ERROR] Event rule not found for environment: {self.environment_suffix}")
                print(f"Available rules: {[r['Name'] for r in rules['Rules']]}")
                return False
            
            print(f"Current schedule: {current_schedule}")
            
            # Skip if already optimized
            if current_schedule == 'rate(24 hours)' or current_schedule == 'rate(1 day)':
                print("[OK] Already optimized (24 hours)")
                return True
            
            # Update event rule schedule
            print("Updating event rule schedule...")
            self.events_client.put_rule(
                Name=rule_name,
                ScheduleExpression='rate(24 hours)',
                State='ENABLED',
                Description='Trigger compliance scan every 24 hours (optimized)'
            )
            
            print("[OK] EventBridge optimization complete:")
            print(f"   - Schedule: {current_schedule} -> rate(24 hours)")
            
            return True
            
        except ClientError as e:
            print(f"[ERROR] Error optimizing EventBridge: {e}")
            return False
    
    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.
        
        Returns:
            Dictionary with cost savings estimates
        """
        # These are rough estimates based on AWS pricing (varies by region)
        
        # Lambda savings (reduced memory and fewer invocations)
        lambda_savings = {
            'original_cost': (512 / 1024) * 0.0000166667 * 300 * 4 * 30,  # 512MB, 300s, 4x/day
            'optimized_cost': (256 / 1024) * 0.0000166667 * 120 * 1 * 30,  # 256MB, 120s, 1x/day
        }
        
        # CloudWatch Logs savings (reduced retention)
        logs_savings = {
            'storage_per_gb': 0.03,  # per GB per month
            'original_days': 30,
            'optimized_days': 7,
            'estimated_gb': 0.5  # Estimated log data per day
        }
        logs_monthly_savings = (
            logs_savings['storage_per_gb'] * 
            logs_savings['estimated_gb'] * 
            (logs_savings['original_days'] - logs_savings['optimized_days'])
        )
        
        # S3 savings (lifecycle transitions)
        s3_savings = {
            'standard_per_gb': 0.023,
            'glacier_per_gb': 0.004,
            'estimated_gb': 1  # Estimated report storage
        }
        s3_monthly_savings = (
            s3_savings['standard_per_gb'] - s3_savings['glacier_per_gb']
        ) * s3_savings['estimated_gb']
        
        # EventBridge savings (fewer invocations)
        events_savings = {
            'original_invocations': 4 * 30,  # 4x/day
            'optimized_invocations': 1 * 30,  # 1x/day
            'cost_per_million': 1.00
        }
        
        total_lambda_savings = lambda_savings['original_cost'] - lambda_savings['optimized_cost']
        
        return {
            'lambda_monthly_savings': round(total_lambda_savings, 2),
            'logs_monthly_savings': round(logs_monthly_savings, 2),
            's3_monthly_savings': round(s3_monthly_savings, 2),
            'events_monthly_savings': round(0.01, 2),  # Minimal but non-zero
            'total_monthly_savings': round(
                total_lambda_savings + logs_monthly_savings + s3_monthly_savings + 0.01, 2
            )
        }
    
    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n[START] Starting infrastructure optimization...")
        print("=" * 50)
        
        results = {
            'lambda': self.optimize_lambda_function(),
            'cloudwatch_logs': self.optimize_cloudwatch_logs(),
            's3': self.optimize_s3_bucket(),
            'eventbridge': self.optimize_event_schedule()
        }
        
        print("\n" + "=" * 50)
        print("[SUMMARY] Optimization Summary:")
        print("-" * 50)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        for service, success in results.items():
            status = "[OK] Success" if success else "[FAILED] Failed"
            print(f"{service.replace('_', ' ').title()}: {status}")
        
        print(f"\nTotal: {success_count}/{total_count} optimizations successful")
        
        if success_count == total_count:
            print("\n[SAVINGS] Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"Lambda Function: ${savings['lambda_monthly_savings']}")
            print(f"CloudWatch Logs: ${savings['logs_monthly_savings']}")
            print(f"S3 Storage: ${savings['s3_monthly_savings']}")
            print(f"EventBridge: ${savings['events_monthly_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
            print("\n[DONE] All optimizations completed successfully!")
        else:
            print("\n[WARNING] Some optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Optimize TAP compliance monitoring infrastructure for development environment"
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
        print("[DRY RUN] DRY RUN MODE - No changes will be made")
        print("\nPlanned optimizations:")
        print("- Lambda: Reduce memory 512->256 MB, timeout 300->120s")
        print("- CloudWatch Logs: Reduce retention 30->7 days")
        print("- S3: Add lifecycle rules (Glacier after 14 days, expire after 90 days)")
        print("- EventBridge: Reduce schedule frequency 6h->24h")
        
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
        print("\n\n[WARNING] Optimization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

