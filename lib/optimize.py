#!/usr/bin/env python3
"""
Infrastructure optimization script for Big Data Pipeline.
Scales down Glue jobs, reduces Athena scan limits, and optimizes S3 lifecycle for cost optimization.
"""

import os
import sys
import time
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Handles infrastructure optimization for Big Data Pipeline."""
    
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
        self.glue_client = boto3.client('glue', region_name=region_name)
        self.athena_client = boto3.client('athena', region_name=region_name)
        self.s3_client = boto3.client('s3', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        
        print(f"Initialized optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)
    
    def optimize_glue_job(self) -> bool:
        """
        Optimize Glue ETL job configuration.
        - Reduce timeout from 120 to 60 minutes
        - Note: G.1X requires minimum 2 workers, so we keep workers at 2
        """
        print("\n[INFO] Optimizing Glue ETL Job...")
        
        try:
            job_name = f'fin-glue-etl-job-{self.environment_suffix}'
            
            # Get current job configuration
            response = self.glue_client.get_job(JobName=job_name)
            job = response['Job']
            
            current_workers = job.get('NumberOfWorkers', 2)
            current_timeout = job.get('Timeout', 120)
            current_worker_type = job.get('WorkerType', 'G.1X')
            
            print(f"Found job: {job_name}")
            print(f"Current workers: {current_workers}")
            print(f"Current worker type: {current_worker_type}")
            print(f"Current timeout: {current_timeout} minutes")
            
            # G.1X requires minimum 2 workers, so we only optimize timeout
            # and keep minimum workers for the worker type
            optimized_timeout = 60
            
            # Update job with optimized settings
            self.glue_client.update_job(
                JobName=job_name,
                JobUpdate={
                    'Role': job['Role'],
                    'Command': job['Command'],
                    'DefaultArguments': job.get('DefaultArguments', {}),
                    'NumberOfWorkers': current_workers,  # Keep current (G.1X min is 2)
                    'WorkerType': current_worker_type,
                    'GlueVersion': job.get('GlueVersion', '4.0'),
                    'Timeout': optimized_timeout,
                    'MaxRetries': job.get('MaxRetries', 1),
                }
            )
            
            print("[SUCCESS] Glue job optimization complete:")
            print(f"   - Workers: {current_workers} (kept - G.1X minimum is 2)")
            print(f"   - Timeout: {current_timeout} minutes -> {optimized_timeout} minutes")
            
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'EntityNotFoundException':
                print(f"[WARNING] Glue job not found: fin-glue-etl-job-{self.environment_suffix}")
            else:
                print(f"[ERROR] Error optimizing Glue job: {e}")
            return False
    
    def optimize_athena_workgroup(self) -> bool:
        """
        Optimize Athena workgroup.
        - Reduce bytesScannedCutoffPerQuery from 5GB to 1GB
        """
        print("\n[INFO] Optimizing Athena Workgroup...")
        
        try:
            workgroup_name = f'fin-athena-workgroup-{self.environment_suffix}'
            
            # Get current workgroup configuration
            response = self.athena_client.get_work_group(WorkGroup=workgroup_name)
            config = response['WorkGroup']['Configuration']
            
            current_limit = config.get('BytesScannedCutoffPerQuery', 5368709120)
            current_limit_gb = current_limit / (1024 * 1024 * 1024)
            
            print(f"Found workgroup: {workgroup_name}")
            print(f"Current scan limit: {current_limit_gb:.2f} GB")
            
            # Optimize to 1GB scan limit
            new_limit = 1073741824  # 1 GB in bytes
            
            self.athena_client.update_work_group(
                WorkGroup=workgroup_name,
                ConfigurationUpdates={
                    'BytesScannedCutoffPerQuery': new_limit,
                    'EnforceWorkGroupConfiguration': True,
                }
            )
            
            print("[SUCCESS] Athena workgroup optimization complete:")
            print(f"   - Scan limit: {current_limit_gb:.2f} GB -> 1 GB")
            
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidRequestException':
                print(f"[WARNING] Athena workgroup not found: fin-athena-workgroup-{self.environment_suffix}")
            else:
                print(f"[ERROR] Error optimizing Athena workgroup: {e}")
            return False
    
    def optimize_s3_lifecycle(self) -> bool:
        """
        Optimize S3 bucket lifecycle policies.
        - Reduce intelligent tiering transition from 30 to 7 days
        - Reduce glacier transition from 90 to 30 days
        """
        print("\n[INFO] Optimizing S3 Lifecycle Policies...")
        
        buckets = [
            f'fin-s3-raw-{self.environment_suffix}',
            f'fin-s3-processed-{self.environment_suffix}',
        ]
        
        success_count = 0
        
        for bucket_name in buckets:
            try:
                # Check if bucket exists
                self.s3_client.head_bucket(Bucket=bucket_name)
                
                # Update lifecycle configuration
                lifecycle_config = {
                    'Rules': [
                        {
                            'ID': 'optimized-tiering',
                            'Status': 'Enabled',
                            'Filter': {'Prefix': ''},
                            'Transitions': [
                                {
                                    'Days': 7,
                                    'StorageClass': 'INTELLIGENT_TIERING'
                                },
                                {
                                    'Days': 30,
                                    'StorageClass': 'GLACIER'
                                }
                            ]
                        }
                    ]
                }
                
                self.s3_client.put_bucket_lifecycle_configuration(
                    Bucket=bucket_name,
                    LifecycleConfiguration=lifecycle_config
                )
                
                print(f"[SUCCESS] Optimized lifecycle for bucket: {bucket_name}")
                print("   - Intelligent Tiering: 30 days -> 7 days")
                print("   - Glacier: 90 days -> 30 days")
                success_count += 1
                
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    print(f"[WARNING] Bucket not found: {bucket_name}")
                else:
                    print(f"[ERROR] Error optimizing bucket {bucket_name}: {e}")
        
        return success_count > 0
    
    def optimize_glue_crawler(self) -> bool:
        """
        Optimize Glue crawler schedule.
        - Change schedule from daily to weekly (every Sunday at 2 AM)
        """
        print("\n[INFO] Optimizing Glue Crawler Schedule...")
        
        try:
            crawler_name = f'fin-glue-crawler-{self.environment_suffix}'
            
            # Get current crawler configuration
            response = self.glue_client.get_crawler(Name=crawler_name)
            crawler = response['Crawler']
            
            current_schedule = crawler.get('Schedule', {}).get('ScheduleExpression', 'Not set')
            
            print(f"Found crawler: {crawler_name}")
            print(f"Current schedule: {current_schedule}")
            
            # Update to weekly schedule (Sunday 2 AM UTC)
            self.glue_client.update_crawler(
                Name=crawler_name,
                Schedule='cron(0 2 ? * SUN *)'
            )
            
            print("[SUCCESS] Glue crawler optimization complete:")
            print("   - Schedule: Daily (2 AM) -> Weekly (Sunday 2 AM)")
            
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'EntityNotFoundException':
                print(f"[WARNING] Crawler not found: fin-glue-crawler-{self.environment_suffix}")
            else:
                print(f"[ERROR] Error optimizing crawler: {e}")
            return False
    
    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.
        
        Returns:
            Dictionary with cost savings estimates
        """
        # Rough estimates based on AWS pricing
        glue_savings = {
            # G.1X worker: $0.44/hour
            # Note: G.1X requires min 2 workers, so no worker reduction
            # Reduced timeout means less max cost per run (50% reduction)
            'timeout_reduction': 0.44 * 2 * 1 * 30,  # 2 workers, 1 hour saved/day
        }
        
        athena_savings = {
            # Reduced scan limit prevents runaway queries
            # $5 per TB scanned, reducing from 5GB to 1GB max
            'scan_limit_savings': 5 * 4 * 0.001 * 30,  # Assuming 30 queries/day prevented
        }
        
        s3_savings = {
            # Faster transition to cheaper storage
            # Intelligent Tiering is cheaper than Standard
            'tiering_savings': 0.023 * 0.77 * 100,  # Assuming 100GB, 77% savings
        }
        
        total_savings = (
            glue_savings['timeout_reduction'] +
            athena_savings['scan_limit_savings'] +
            s3_savings['tiering_savings']
        )
        
        return {
            'glue_monthly_savings': round(
                glue_savings['timeout_reduction'], 2
            ),
            'athena_monthly_savings': round(athena_savings['scan_limit_savings'], 2),
            's3_monthly_savings': round(s3_savings['tiering_savings'], 2),
            'total_monthly_savings': round(total_savings, 2)
        }
    
    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n[START] Starting infrastructure optimization...")
        print("=" * 50)
        
        results = {
            'glue_job': self.optimize_glue_job(),
            'athena_workgroup': self.optimize_athena_workgroup(),
            's3_lifecycle': self.optimize_s3_lifecycle(),
            'glue_crawler': self.optimize_glue_crawler(),
        }
        
        print("\n" + "=" * 50)
        print("[SUMMARY] Optimization Summary:")
        print("-" * 50)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        for service, success in results.items():
            status = "[SUCCESS]" if success else "[FAILED]"
            print(f"{service}: {status}")
        
        print(f"\nTotal: {success_count}/{total_count} optimizations successful")
        
        if success_count > 0:
            print("\n[SAVINGS] Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"Glue: ${savings['glue_monthly_savings']}")
            print(f"Athena: ${savings['athena_monthly_savings']}")
            print(f"S3: ${savings['s3_monthly_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
        
        if success_count == total_count:
            print("\n[COMPLETE] All optimizations completed successfully!")
        else:
            print("\n[WARNING] Some optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Optimize Big Data Pipeline infrastructure for cost savings"
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
        print("- Glue Job: Reduce timeout 120->60 minutes (G.1X requires min 2 workers)")
        print("- Athena Workgroup: Reduce scan limit 5GB->1GB")
        print("- S3 Lifecycle: Intelligent Tiering 30->7 days, Glacier 90->30 days")
        print("- Glue Crawler: Daily->Weekly schedule")
        
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
        print("\n\n[INTERRUPTED] Optimization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
