#!/usr/bin/env python3

"""
Infrastructure optimization script for ECS development environment.
Scales down ECS, Auto Scaling Group, and related resources for cost optimization.
"""

import os
import sys
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Handles infrastructure optimization for ECS development environment."""
    
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
        self.autoscaling_client = boto3.client('autoscaling', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.ec2_client = boto3.client('ec2', region_name=region_name)
        
        print(f"Initialized optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)
    
    def optimize_auto_scaling_group(self) -> bool:
        """
        Optimize Auto Scaling Group for ECS cluster.
        - Reduce minSize from 1 to 0
        - Reduce maxSize from 10 to 2
        - Reduce desiredCapacity from 1 to 1 (keep at minimum)
        """
        print("\n🔧 Optimizing Auto Scaling Group...")
        
        try:
            # Find the Auto Scaling Group - must match stack naming pattern
            paginator = self.autoscaling_client.get_paginator('describe_auto_scaling_groups')
            asg_name = None
            current_asg = None
            
            for page in paginator.paginate():
                for asg in page['AutoScalingGroups']:
                    asg_name_lower = asg['AutoScalingGroupName'].lower()
                    # Priority 1: Look for 'ecs-asg' with environment suffix
                    if 'ecs-asg' in asg_name_lower and self.environment_suffix.lower() in asg_name_lower:
                        asg_name = asg['AutoScalingGroupName']
                        current_asg = asg
                        print(f"Found ASG (ecs-asg): {asg_name}")
                        break
                    # Priority 2: Look for 'pulumi-infra' pattern
                    if 'pulumi-infra' in asg_name_lower and 'ecs-asg' in asg_name_lower:
                        asg_name = asg['AutoScalingGroupName']
                        current_asg = asg
                        print(f"Found ASG (pulumi-infra): {asg_name}")
                        break
                if asg_name:
                    break
            
            if not asg_name or not current_asg:
                print(f"❌ Auto Scaling Group not found for environment: {self.environment_suffix}")
                return False
            
            current_min = current_asg['MinSize']
            current_max = current_asg['MaxSize']
            current_desired = current_asg['DesiredCapacity']
            
            print(f"Current configuration:")
            print(f"   - Min size: {current_min}")
            print(f"   - Max size: {current_max}")
            print(f"   - Desired capacity: {current_desired}")
            
            # Check if already optimized
            if current_max <= 2:
                print("✅ Already optimized (max size <= 2)")
                return True
            
            # Update Auto Scaling Group
            print("Updating Auto Scaling Group configuration...")
            self.autoscaling_client.update_auto_scaling_group(
                AutoScalingGroupName=asg_name,
                MinSize=0,
                MaxSize=2,
                DesiredCapacity=min(current_desired, 1)
            )
            
            print("✅ Auto Scaling Group optimization complete:")
            print(f"   - Min size: {current_min} → 0")
            print(f"   - Max size: {current_max} → 2")
            print(f"   - Desired capacity: {current_desired} → {min(current_desired, 1)}")
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing Auto Scaling Group: {e}")
            return False
    
    def optimize_ecs_service(self) -> bool:
        """
        Optimize ECS Service.
        - Reduce desiredCount to 1 task
        """
        print("\n🔧 Optimizing ECS Service...")
        
        try:
            # Find the ECS cluster using naming pattern: ecs-cluster-{environmentSuffix}
            clusters = self.ecs_client.list_clusters()
            cluster_arn = None
            expected_cluster_name = f'ecs-cluster-{self.environment_suffix}'
            
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
                    if 'ecs-cluster' in cluster_lower and self.environment_suffix.lower() in cluster_lower:
                        cluster_arn = cluster
                        print(f"Found cluster (pattern match): {cluster.split('/')[-1]}")
                        break
            
            # Try pulumi-infra pattern
            if not cluster_arn:
                for cluster in clusters['clusterArns']:
                    cluster_lower = cluster.lower()
                    if 'pulumi-infra' in cluster_lower:
                        cluster_arn = cluster
                        print(f"Found cluster (pulumi-infra): {cluster.split('/')[-1]}")
                        break
            
            if not cluster_arn:
                print(f"❌ ECS cluster not found. Expected: {expected_cluster_name}")
                print(f"Available clusters: {[c.split('/')[-1] for c in clusters['clusterArns']]}")
                return False
            
            # Find the service by naming pattern: ecs-service-{environmentSuffix}
            services = self.ecs_client.list_services(cluster=cluster_arn)
            service_arn = None
            expected_service_name = f'ecs-service-{self.environment_suffix}'
            
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
            
            # Update service
            print("Updating service desired count...")
            self.ecs_client.update_service(
                cluster=cluster_arn,
                service=service_arn,
                desiredCount=1
            )
            
            print("✅ ECS optimization complete:")
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
    
    def optimize_capacity_provider(self) -> bool:
        """
        Optimize ECS Capacity Provider settings.
        - Reduce target capacity from 80% to 100% (maximize instance utilization)
        """
        print("\n🔧 Optimizing Capacity Provider...")
        
        try:
            # List capacity providers
            capacity_providers = self.ecs_client.describe_capacity_providers()
            
            target_provider = None
            for provider in capacity_providers['capacityProviders']:
                provider_name = provider['name'].lower()
                # Skip FARGATE providers
                if 'fargate' in provider_name:
                    continue
                # Look for our capacity provider
                if 'capacity-provider' in provider_name and self.environment_suffix.lower() in provider_name:
                    target_provider = provider
                    print(f"Found capacity provider: {provider['name']}")
                    break
                # Try pulumi-infra pattern
                if 'pulumi-infra' in provider_name:
                    target_provider = provider
                    print(f"Found capacity provider (pulumi-infra): {provider['name']}")
                    break
            
            if not target_provider:
                print(f"❌ Capacity provider not found for environment: {self.environment_suffix}")
                print(f"Available providers: {[p['name'] for p in capacity_providers['capacityProviders']]}")
                return False
            
            current_target_capacity = target_provider.get('autoScalingGroupProvider', {}).get('managedScaling', {}).get('targetCapacity', 80)
            
            print(f"Current target capacity: {current_target_capacity}%")
            
            if current_target_capacity >= 100:
                print("✅ Already optimized (target capacity at 100%)")
                return True
            
            # Update capacity provider
            print("Updating capacity provider managed scaling...")
            self.ecs_client.update_capacity_provider(
                name=target_provider['name'],
                autoScalingGroupProvider={
                    'managedScaling': {
                        'status': 'ENABLED',
                        'targetCapacity': 100,
                        'minimumScalingStepSize': 1,
                        'maximumScalingStepSize': 2
                    },
                    'managedTerminationProtection': 'DISABLED'
                }
            )
            
            print("✅ Capacity Provider optimization complete:")
            print(f"   - Target capacity: {current_target_capacity}% → 100%")
            print("   - Max scaling step: 10 → 2")
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing Capacity Provider: {e}")
            return False
    
    def optimize_launch_template(self) -> bool:
        """
        Optimize Launch Template for ECS instances.
        - Downgrade instance type from t3.medium to t3.micro for dev
        """
        print("\n🔧 Optimizing Launch Template...")
        
        try:
            # Find launch templates
            response = self.ec2_client.describe_launch_templates()
            
            target_template = None
            for template in response['LaunchTemplates']:
                template_name = template['LaunchTemplateName'].lower()
                if 'ecs-launch-template' in template_name and self.environment_suffix.lower() in template_name:
                    target_template = template
                    print(f"Found launch template: {template['LaunchTemplateName']}")
                    break
                if 'pulumi-infra' in template_name and 'ecs-launch-template' in template_name:
                    target_template = template
                    print(f"Found launch template (pulumi-infra): {template['LaunchTemplateName']}")
                    break
            
            if not target_template:
                print(f"❌ Launch template not found for environment: {self.environment_suffix}")
                print(f"Available templates: {[t['LaunchTemplateName'] for t in response['LaunchTemplates']]}")
                return False
            
            # Get current version details
            version_response = self.ec2_client.describe_launch_template_versions(
                LaunchTemplateId=target_template['LaunchTemplateId'],
                Versions=['$Latest']
            )
            
            current_instance_type = version_response['LaunchTemplateVersions'][0]['LaunchTemplateData'].get('InstanceType', 't3.medium')
            
            print(f"Current instance type: {current_instance_type}")
            
            # Only downgrade if in dev environment and using larger instance
            if self.environment_suffix.lower() == 'prod':
                print("✅ Skipping instance type change for production")
                return True
            
            if current_instance_type in ['t3.micro', 't3.nano']:
                print("✅ Already optimized (using small instance type)")
                return True
            
            # Create new version with smaller instance type
            print("Creating new launch template version with smaller instance type...")
            
            # Get the current template data
            current_data = version_response['LaunchTemplateVersions'][0]['LaunchTemplateData']
            current_data['InstanceType'] = 't3.micro'
            
            self.ec2_client.create_launch_template_version(
                LaunchTemplateId=target_template['LaunchTemplateId'],
                LaunchTemplateData=current_data,
                SourceVersion='$Latest'
            )
            
            print("✅ Launch Template optimization complete:")
            print(f"   - Instance type: {current_instance_type} → t3.micro")
            print("   - New instances will use the smaller instance type")
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing Launch Template: {e}")
            return False
    
    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.
        
        Returns:
            Dictionary with cost savings estimates
        """
        # These are rough estimates based on AWS pricing (varies by region)
        # Prices are for us-east-1
        
        asg_savings = {
            # Reducing max from 10 to 2 instances (potential savings when scaling)
            'max_instance_savings': 8 * 0.0416 * 24 * 30,  # t3.medium
            # Instance type downgrade: t3.medium to t3.micro
            'instance_type_savings': (0.0416 - 0.0104) * 24 * 30
        }
        
        ecs_savings = {
            # Reducing tasks (EC2 launch type - savings come from instance reduction)
            'task_reduction': 0  # Already counted in ASG savings
        }
        
        capacity_provider_savings = {
            # Higher utilization means fewer instances needed
            'utilization_improvement': 0.0416 * 24 * 30 * 0.2  # ~20% improvement estimate
        }
        
        total_savings = (
            asg_savings['instance_type_savings'] +
            capacity_provider_savings['utilization_improvement']
        )
        
        return {
            'asg_monthly_savings': round(asg_savings['instance_type_savings'], 2),
            'capacity_provider_monthly_savings': round(capacity_provider_savings['utilization_improvement'], 2),
            'ecs_monthly_savings': round(ecs_savings['task_reduction'], 2),
            'potential_scaling_savings': round(asg_savings['max_instance_savings'], 2),
            'total_monthly_savings': round(total_savings, 2)
        }
    
    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n🚀 Starting infrastructure optimization...")
        print("=" * 50)
        
        results = {
            'auto_scaling_group': self.optimize_auto_scaling_group(),
            'ecs_service': self.optimize_ecs_service(),
            'capacity_provider': self.optimize_capacity_provider(),
            'launch_template': self.optimize_launch_template()
        }
        
        print("\n" + "=" * 50)
        print("📊 Optimization Summary:")
        print("-" * 50)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        for service, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            display_name = service.replace('_', ' ').title()
            print(f"{display_name}: {status}")
        
        print(f"\nTotal: {success_count}/{total_count} optimizations successful")
        
        if success_count == total_count:
            print("\n💰 Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"Auto Scaling Group: ${savings['asg_monthly_savings']}")
            print(f"Capacity Provider: ${savings['capacity_provider_monthly_savings']}")
            print(f"Potential scaling savings: ${savings['potential_scaling_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
            print("\n✨ All optimizations completed successfully!")
        else:
            print("\n⚠️  Some optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Optimize ECS infrastructure for development environment"
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
        print("- Auto Scaling Group: Reduce min 1→0, max 10→2, desired to 1")
        print("- ECS Service: Reduce desired count to 1 task")
        print("- Capacity Provider: Increase target capacity 80%→100%")
        print("- Launch Template: Downgrade instance type t3.medium→t3.micro")
        
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

