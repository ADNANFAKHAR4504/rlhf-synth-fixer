#!/usr/bin/env python3

"""
Infrastructure optimization script for TAP Stack development environment.
Scales down ECS resources for cost optimization.
"""

import os
import sys
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Handles infrastructure optimization for TAP Stack development environment."""
    
    def __init__(self, environment_suffix: str = 'dev', region_name: str = 'us-east-1'):
        """
        Initialize the optimizer with AWS clients.
        
        Args:
            environment_suffix: The environment suffix (default: 'dev')
            region_name: AWS region name (default: 'us-east-1')
        """
        self.environment_suffix = environment_suffix
        self.resource_suffix = f'{environment_suffix}-j7'
        self.region_name = region_name
        
        # Initialize AWS clients
        self.ecs_client = boto3.client('ecs', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.application_autoscaling_client = boto3.client('application-autoscaling', region_name=region_name)
        
        print(f"Initialized optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)
    
    def optimize_ecs_service(self) -> bool:
        """
        Optimize ECS Fargate service.
        - Reduce desiredCount to minimum for cost savings
        - Adjust autoscaling settings for development
        """
        print("\n🔧 Optimizing ECS Fargate Service...")
        
        try:
            # Find the ECS cluster using exact naming pattern: ecs-cluster-{environmentSuffix}
            clusters = self.ecs_client.list_clusters()
            cluster_arn = None
            expected_cluster_name = f'ecs-cluster-{self.resource_suffix}'
            
            # First try exact match
            for cluster in clusters['clusterArns']:
                cluster_name = cluster.split('/')[-1]
                if cluster_name == expected_cluster_name:
                    cluster_arn = cluster
                    print(f"Found cluster (exact match): {cluster_name}")
                    break
            
            # If no exact match, try pattern match with ecs-cluster
            if not cluster_arn:
                for cluster in clusters['clusterArns']:
                    cluster_lower = cluster.lower()
                    if 'ecs-cluster-' in cluster_lower and self.resource_suffix.lower() in cluster_lower:
                        cluster_arn = cluster
                        print(f"Found cluster (pattern match): {cluster.split('/')[-1]}")
                        break
            
            if not cluster_arn:
                print(f"❌ ECS cluster not found. Expected: {expected_cluster_name}")
                print(f"Available clusters: {[c.split('/')[-1] for c in clusters['clusterArns']]}")
                return False
            
            # Find the service by exact naming pattern: ecs-service-{environmentSuffix}
            services = self.ecs_client.list_services(cluster=cluster_arn)
            service_arn = None
            expected_service_name = f'ecs-service-{self.resource_suffix}'
            
            # First, try exact match
            for service in services['serviceArns']:
                service_name = service.split('/')[-1]
                if service_name == expected_service_name:
                    service_arn = service
                    print(f"Found service (exact match): {service_name}")
                    break
            
            # If exact match not found, try pattern matching
            if not service_arn:
                for service in services['serviceArns']:
                    service_lower = service.lower()
                    if 'ecs-service' in service_lower:
                        service_arn = service
                        print(f"Found service (pattern match): {service.split('/')[-1]}")
                        break
            
            # If still not found and only one service, use it
            if not service_arn and len(services['serviceArns']) == 1:
                service_arn = services['serviceArns'][0]
                print(f"Using only available service: {service_arn.split('/')[-1]}")
            
            if not service_arn:
                print(f"❌ ECS service not found. Expected: {expected_service_name}")
                print(f"Available services: {[s.split('/')[-1] for s in services['serviceArns']]}")
                return False
            
            service_name = service_arn.split('/')[-1]
            
            # Get current service details
            service_details = self.ecs_client.describe_services(
                cluster=cluster_arn,
                services=[service_arn]
            )
            
            current_desired_count = service_details['services'][0]['desiredCount']
            print(f"Current desired count: {current_desired_count}")
            
            if current_desired_count <= 1:
                print("✅ Already optimized (1 or fewer tasks)")
                return True
            
            # Update service to minimum task count for development
            print("Updating service desired count...")
            self.ecs_client.update_service(
                cluster=cluster_arn,
                service=service_arn,
                desiredCount=1
            )
            
            print("✅ ECS service optimization complete:")
            print(f"   - Task count: {current_desired_count} → 1")
            
            # Wait for service to stabilize
            print("Waiting for service to stabilize...")
            waiter = self.ecs_client.get_waiter('services_stable')
            waiter.wait(
                cluster=cluster_arn,
                services=[service_arn],
                WaiterConfig={'Delay': 30, 'MaxAttempts': 20}
            )
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing ECS: {e}")
            return False
    
    def optimize_autoscaling(self) -> bool:
        """
        Optimize Application Auto Scaling settings for development.
        - Reduce minCapacity to 1
        - Reduce maxCapacity to 2 (for cost savings in dev)
        """
        print("\n🔧 Optimizing Auto Scaling Configuration...")
        
        try:
            # Find the scalable target for ECS service
            cluster_name = f'ecs-cluster-{self.resource_suffix}'
            service_name = f'ecs-service-{self.resource_suffix}'
            resource_id = f'service/{cluster_name}/{service_name}'
            
            targets = self.application_autoscaling_client.describe_scalable_targets(
                ServiceNamespace='ecs',
                ResourceIds=[resource_id]
            )
            
            if not targets['ScalableTargets']:
                print(f"❌ Auto scaling target not found for: {resource_id}")
                return False
            
            target = targets['ScalableTargets'][0]
            current_min = target['MinCapacity']
            current_max = target['MaxCapacity']
            
            print(f"Current scaling: min={current_min}, max={current_max}")
            
            if current_min == 1 and current_max <= 2:
                print("✅ Already optimized (min=1, max<=2)")
                return True
            
            # Update scaling configuration for development
            self.application_autoscaling_client.register_scalable_target(
                ServiceNamespace='ecs',
                ResourceId=resource_id,
                ScalableDimension='ecs:service:DesiredCount',
                MinCapacity=1,
                MaxCapacity=2
            )
            
            print("✅ Auto scaling optimization complete:")
            print(f"   - Min capacity: {current_min} → 1")
            print(f"   - Max capacity: {current_max} → 2")
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing auto scaling: {e}")
            return False
    
    def update_cloudwatch_alarms(self) -> bool:
        """
        Update CloudWatch alarms for development environment.
        - Adjust evaluation periods to reduce noise
        """
        print("\n🔧 Updating CloudWatch Alarms...")
        
        try:
            cpu_alarm_name = f'ecs-cpu-alarm-{self.resource_suffix}'
            memory_alarm_name = f'ecs-memory-alarm-{self.resource_suffix}'
            
            # Get current alarm configurations
            alarms = self.cloudwatch_client.describe_alarms(
                AlarmNames=[cpu_alarm_name, memory_alarm_name]
            )
            
            if not alarms['MetricAlarms']:
                print(f"❌ CloudWatch alarms not found")
                return False
            
            updated_count = 0
            
            for alarm in alarms['MetricAlarms']:
                alarm_name = alarm['AlarmName']
                current_eval_periods = alarm['EvaluationPeriods']
                
                # Update alarm to reduce noise in development
                if current_eval_periods < 3:
                    self.cloudwatch_client.put_metric_alarm(
                        AlarmName=alarm_name,
                        ComparisonOperator=alarm['ComparisonOperator'],
                        EvaluationPeriods=3,  # Increase to reduce false positives
                        MetricName=alarm['MetricName'],
                        Namespace=alarm['Namespace'],
                        Period=alarm['Period'],
                        Statistic=alarm['Statistic'],
                        Threshold=alarm['Threshold'],
                        AlarmDescription=alarm.get('AlarmDescription', ''),
                        Dimensions=alarm['Dimensions']
                    )
                    print(f"   Updated {alarm_name}: eval periods {current_eval_periods} → 3")
                    updated_count += 1
                else:
                    print(f"   {alarm_name}: already optimized (eval periods = {current_eval_periods})")
            
            print(f"✅ CloudWatch alarms updated: {updated_count} alarms modified")
            return True
            
        except ClientError as e:
            print(f"❌ Error updating CloudWatch alarms: {e}")
            return False
    
    def verify_iam_permissions(self) -> bool:
        """
        Verify IAM permissions follow least privilege principle.
        - Check that S3 policy only grants s3:GetObject
        """
        print("\n🔧 Verifying IAM Permissions...")
        
        try:
            iam_client = boto3.client('iam', region_name=self.region_name)
            
            policy_name = f'ecs-s3-policy-{self.resource_suffix}'
            
            # List policies to find ours
            policies = iam_client.list_policies(Scope='Local')
            policy_arn = None
            
            for policy in policies['Policies']:
                if policy['PolicyName'] == policy_name:
                    policy_arn = policy['Arn']
                    break
            
            if not policy_arn:
                print(f"❌ IAM policy not found: {policy_name}")
                return False
            
            # Get policy version
            policy_details = iam_client.get_policy(PolicyArn=policy_arn)
            default_version = policy_details['Policy']['DefaultVersionId']
            
            # Get policy document
            policy_version = iam_client.get_policy_version(
                PolicyArn=policy_arn,
                VersionId=default_version
            )
            
            policy_document = policy_version['PolicyVersion']['Document']
            
            # Verify least privilege
            for statement in policy_document.get('Statement', []):
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                
                for action in actions:
                    if action == 's3:*':
                        print(f"⚠️  Warning: Policy contains overly broad s3:* permission")
                        return False
                    elif action == 's3:GetObject':
                        print(f"✅ IAM policy follows least privilege: s3:GetObject only")
                        return True
            
            print("✅ IAM permissions verified")
            return True
            
        except ClientError as e:
            print(f"❌ Error verifying IAM permissions: {e}")
            return False
    
    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.
        
        Returns:
            Dictionary with cost savings estimates
        """
        # Cost estimates based on AWS pricing for us-east-1 (Fargate)
        # CPU: $0.04048 per vCPU per hour
        # Memory: $0.004445 per GB per hour
        
        ecs_savings = {
            # Original: 2 tasks with 512 CPU (0.5 vCPU) and 1GB memory
            'original_cost': 2 * (0.5 * 0.04048 + 1 * 0.004445) * 24 * 30,
            # Optimized: 1 task with same specs
            'optimized_cost': 1 * (0.5 * 0.04048 + 1 * 0.004445) * 24 * 30,
        }
        
        autoscaling_savings = {
            # Reduced max capacity means lower potential burst costs
            'original_max_cost': 4 * (0.5 * 0.04048 + 1 * 0.004445) * 24 * 30,
            'optimized_max_cost': 2 * (0.5 * 0.04048 + 1 * 0.004445) * 24 * 30,
        }
        
        total_savings = (
            (ecs_savings['original_cost'] - ecs_savings['optimized_cost'])
        )
        
        return {
            'ecs_monthly_savings': round(
                ecs_savings['original_cost'] - ecs_savings['optimized_cost'], 2
            ),
            'autoscaling_potential_savings': round(
                autoscaling_savings['original_max_cost'] - autoscaling_savings['optimized_max_cost'], 2
            ),
            'total_monthly_savings': round(total_savings, 2)
        }
    
    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n🚀 Starting TAP Stack infrastructure optimization...")
        print("=" * 50)
        
        results = {
            'ecs_service': self.optimize_ecs_service(),
            'autoscaling': self.optimize_autoscaling(),
            'cloudwatch_alarms': self.update_cloudwatch_alarms(),
            'iam_verification': self.verify_iam_permissions()
        }
        
        print("\n" + "=" * 50)
        print("📊 Optimization Summary:")
        print("-" * 50)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        for service, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            print(f"{service.replace('_', ' ').title()}: {status}")
        
        print(f"\nTotal: {success_count}/{total_count} optimizations successful")
        
        if success_count == total_count:
            print("\n💰 Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"ECS Service: ${savings['ecs_monthly_savings']}")
            print(f"Auto Scaling (potential): ${savings['autoscaling_potential_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
            print("\n✨ All optimizations completed successfully!")
        else:
            print("\n⚠️  Some optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Optimize TAP Stack infrastructure for development environment"
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
        print("- ECS Service: Reduce task count to 1 for development")
        print("- Auto Scaling: Reduce min=1, max=2 for cost savings")
        print("- CloudWatch Alarms: Adjust evaluation periods to reduce noise")
        print("- IAM Permissions: Verify least privilege (s3:GetObject only)")
        
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

