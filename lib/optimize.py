#!/usr/bin/env python3
"""
ECS Fargate Service Optimization Script

This script optimizes an existing ECS Fargate service deployment by:
1. Expanding autoscaling capacity (max tasks: 5 -> 10)
2. Adding advanced scaling policies (CPU, ALB request count, memory)
3. Creating CloudWatch alarms for monitoring
4. Enabling Container Insights for detailed metrics
5. Creating a CloudWatch dashboard with key metrics

Usage:
    export ENVIRONMENT_SUFFIX=dev
    python3 optimize.py [--dry-run]
"""

import argparse
import json
import os
import sys
import time
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError


class ECSOptimizer:
    """Optimizes ECS Fargate service with enhanced autoscaling and monitoring"""

    def __init__(self, environment_suffix: str, region: str = 'us-east-1', dry_run: bool = False):
        self.environment_suffix = environment_suffix
        self.region = region
        self.dry_run = dry_run

        # Initialize AWS clients
        self.ecs_client = boto3.client('ecs', region_name=region)
        self.appautoscaling_client = boto3.client('application-autoscaling', region_name=region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        self.elbv2_client = boto3.client('elbv2', region_name=region)

        # Resource naming patterns
        self.cluster_name = f"ecs-cluster-{environment_suffix}"
        self.service_name = f"fargate-service-{environment_suffix}"
        self.alb_name = f"ecs-alb-{environment_suffix}"
        self.target_group_name = f"ecs-tg-{environment_suffix}"

        # Optimization tracking
        self.optimizations_applied = []
        self.errors = []

    def log(self, message: str, level: str = 'INFO'):
        """Log messages with consistent formatting"""
        prefix = '[DRY-RUN] ' if self.dry_run else ''
        print(f"{prefix}[{level}] {message}")

    def find_cluster(self) -> Optional[str]:
        """Find ECS cluster by name pattern"""
        try:
            self.log(f"Searching for ECS cluster: {self.cluster_name}")
            response = self.ecs_client.describe_clusters(clusters=[self.cluster_name])

            if response['clusters'] and response['clusters'][0]['status'] == 'ACTIVE':
                cluster_arn = response['clusters'][0]['clusterArn']
                self.log(f"Found cluster: {cluster_arn}")
                return cluster_arn
            else:
                self.log(f"Cluster not found or not active: {self.cluster_name}", 'ERROR')
                return None
        except ClientError as e:
            self.log(f"Error finding cluster: {e}", 'ERROR')
            return None

    def find_service(self, cluster_arn: str) -> Optional[Dict]:
        """Find ECS service in cluster"""
        try:
            self.log(f"Searching for service: {self.service_name}")
            response = self.ecs_client.describe_services(
                cluster=cluster_arn,
                services=[self.service_name]
            )

            if response['services'] and response['services'][0]['status'] == 'ACTIVE':
                service = response['services'][0]
                self.log(f"Found service: {service['serviceName']}")
                return service
            else:
                self.log(f"Service not found or not active: {self.service_name}", 'ERROR')
                return None
        except ClientError as e:
            self.log(f"Error finding service: {e}", 'ERROR')
            return None

    def find_target_group(self) -> Optional[Dict[str, str]]:
        """Find ALB target group ARN and associated load balancer info"""
        try:
            self.log(f"Searching for target group: {self.target_group_name}")
            response = self.elbv2_client.describe_target_groups()

            for tg in response['TargetGroups']:
                if tg['TargetGroupName'] == self.target_group_name:
                    self.log(f"Found target group: {tg['TargetGroupArn']}")
                    # Return both target group ARN and load balancer ARNs
                    return {
                        'TargetGroupArn': tg['TargetGroupArn'],
                        'LoadBalancerArns': tg.get('LoadBalancerArns', [])
                    }

            self.log(f"Target group not found: {self.target_group_name}", 'WARNING')
            return None
        except ClientError as e:
            self.log(f"Error finding target group: {e}", 'ERROR')
            return None

    def check_scaling_policy_exists(self, cluster_name: str, service_name: str, metric_type: str) -> bool:
        """Check if a scaling policy with specific metric type already exists"""
        try:
            resource_id = f"service/{cluster_name}/{service_name}"
            response = self.appautoscaling_client.describe_scaling_policies(
                ServiceNamespace='ecs',
                ResourceId=resource_id,
                ScalableDimension='ecs:service:DesiredCount'
            )
            
            for policy in response.get('ScalingPolicies', []):
                policy_config = policy.get('TargetTrackingScalingPolicyConfiguration', {})
                metric_spec = policy_config.get('PredefinedMetricSpecification', {})
                if metric_spec.get('PredefinedMetricType') == metric_type:
                    self.log(f"Found existing scaling policy for {metric_type}: {policy['PolicyName']}")
                    return True
            return False
        except ClientError as e:
            self.log(f"Error checking existing scaling policies: {e}", 'WARNING')
            return False

    def build_alb_resource_label(self, target_group_info: Dict[str, Any]) -> Optional[str]:
        """Build the correct resource label for ALBRequestCountPerTarget metric"""
        try:
            tg_arn = target_group_info['TargetGroupArn']
            lb_arns = target_group_info.get('LoadBalancerArns', [])
            
            if not lb_arns:
                self.log("No load balancer associated with target group", 'WARNING')
                return None
            
            # Extract target group suffix: targetgroup/<name>/<id>
            # ARN format: arn:aws:elasticloadbalancing:region:account:targetgroup/name/id
            tg_suffix = '/'.join(tg_arn.split(':')[-1].split('/'))
            
            # Extract load balancer suffix: app/<name>/<id>
            # ARN format: arn:aws:elasticloadbalancing:region:account:loadbalancer/app/name/id
            lb_arn = lb_arns[0]
            lb_parts = lb_arn.split(':')[-1].split('/')
            # Remove 'loadbalancer' prefix, keep app/name/id
            lb_suffix = '/'.join(lb_parts[1:])
            
            # Construct resource label: app/<lb-name>/<lb-id>/targetgroup/<tg-name>/<tg-id>
            resource_label = f"{lb_suffix}/{tg_suffix}"
            self.log(f"Built resource label: {resource_label}")
            return resource_label
        except Exception as e:
            self.log(f"Error building resource label: {e}", 'ERROR')
            return None

    def enable_container_insights(self, cluster_arn: str) -> bool:
        """Enable Container Insights for detailed metrics"""
        try:
            self.log("Enabling Container Insights on cluster")
            if self.dry_run:
                self.optimizations_applied.append("Would enable Container Insights")
                return True

            self.ecs_client.update_cluster_settings(
                cluster=cluster_arn,
                settings=[
                    {
                        'name': 'containerInsights',
                        'value': 'enabled'
                    }
                ]
            )
            self.log("Container Insights enabled successfully")
            self.optimizations_applied.append("Enabled Container Insights for detailed container metrics")
            return True
        except ClientError as e:
            self.log(f"Error enabling Container Insights: {e}", 'ERROR')
            self.errors.append(f"Container Insights: {str(e)}")
            return False

    def update_autoscaling_capacity(self, cluster_arn: str, service_name: str) -> bool:
        """Update autoscaling max capacity from 5 to 10 tasks"""
        try:
            resource_id = f"service/{self.cluster_name}/{service_name}"
            self.log(f"Updating autoscaling capacity for {resource_id}")

            if self.dry_run:
                self.optimizations_applied.append("Would increase max capacity from 5 to 10 tasks")
                return True

            # Register scalable target with new max capacity
            self.appautoscaling_client.register_scalable_target(
                ServiceNamespace='ecs',
                ResourceId=resource_id,
                ScalableDimension='ecs:service:DesiredCount',
                MinCapacity=2,
                MaxCapacity=10  # Increased from baseline of 5
            )
            self.log("Autoscaling capacity updated: max 10 tasks")
            self.optimizations_applied.append("Increased max task capacity from 5 to 10 for better scalability")
            return True
        except ClientError as e:
            self.log(f"Error updating autoscaling capacity: {e}", 'ERROR')
            self.errors.append(f"Autoscaling capacity: {str(e)}")
            return False

    def create_target_tracking_scaling_policy(
        self,
        cluster_arn: str,
        service_name: str,
        policy_name: str,
        metric_spec: Dict,
        target_value: float
    ) -> bool:
        """Create target tracking scaling policy"""
        try:
            resource_id = f"service/{self.cluster_name}/{service_name}"
            full_policy_name = f"{policy_name}-{self.environment_suffix}"
            self.log(f"Creating scaling policy: {full_policy_name}")

            if self.dry_run:
                self.optimizations_applied.append(f"Would create scaling policy: {policy_name}")
                return True

            self.appautoscaling_client.put_scaling_policy(
                PolicyName=full_policy_name,
                ServiceNamespace='ecs',
                ResourceId=resource_id,
                ScalableDimension='ecs:service:DesiredCount',
                PolicyType='TargetTrackingScaling',
                TargetTrackingScalingPolicyConfiguration={
                    'TargetValue': target_value,
                    'PredefinedMetricSpecification': metric_spec,
                    'ScaleInCooldown': 60,
                    'ScaleOutCooldown': 60
                }
            )
            self.log(f"Scaling policy created: {full_policy_name}")
            return True
        except ClientError as e:
            self.log(f"Error creating scaling policy {policy_name}: {e}", 'ERROR')
            self.errors.append(f"Scaling policy {policy_name}: {str(e)}")
            return False

    def create_advanced_scaling_policies(self, cluster_arn: str, service_name: str) -> bool:
        """Create advanced scaling policies for CPU, memory, and ALB request count"""
        success = True

        # CPU-based scaling policy (75% target) - check if one already exists
        self.log("Creating CPU-based target tracking policy")
        if self.check_scaling_policy_exists(self.cluster_name, service_name, 'ECSServiceAverageCPUUtilization'):
            self.log("CPU scaling policy already exists (created by baseline CDK), skipping")
            self.optimizations_applied.append("CPU-based autoscaling already configured by baseline")
        else:
            cpu_success = self.create_target_tracking_scaling_policy(
                cluster_arn, service_name,
                'cpu-scaling-policy',
                {
                    'PredefinedMetricType': 'ECSServiceAverageCPUUtilization'
                },
                75.0
            )
            if cpu_success and not self.dry_run:
                self.optimizations_applied.append("Added CPU-based autoscaling (target: 75%)")
            success = success and cpu_success

        # Memory-based scaling policy (80% target) - check if one already exists
        self.log("Creating memory-based target tracking policy")
        if self.check_scaling_policy_exists(self.cluster_name, service_name, 'ECSServiceAverageMemoryUtilization'):
            self.log("Memory scaling policy already exists, skipping")
            self.optimizations_applied.append("Memory-based autoscaling already configured")
        else:
            memory_success = self.create_target_tracking_scaling_policy(
                cluster_arn, service_name,
                'memory-scaling-policy',
                {
                    'PredefinedMetricType': 'ECSServiceAverageMemoryUtilization'
                },
                80.0
            )
            if memory_success and not self.dry_run:
                self.optimizations_applied.append("Added memory-based autoscaling (target: 80%)")
            success = success and memory_success

        # ALB request count per target (1000 requests threshold)
        target_group_info = self.find_target_group()
        if target_group_info:
            self.log("Creating ALB request count scaling policy")
            
            # Build correct resource label with load balancer info
            resource_label = self.build_alb_resource_label(target_group_info)
            
            if not resource_label:
                self.log("Could not build ALB resource label, skipping ALB scaling policy", 'WARNING')
            else:
                # Check if ALB scaling policy already exists
                if self.check_scaling_policy_exists(self.cluster_name, service_name, 'ALBRequestCountPerTarget'):
                    self.log("ALB request count scaling policy already exists, skipping")
                    self.optimizations_applied.append("ALB request count scaling already configured")
                else:
                    try:
                        resource_id = f"service/{self.cluster_name}/{service_name}"
                        policy_name = f"alb-request-count-policy-{self.environment_suffix}"

                        if self.dry_run:
                            self.optimizations_applied.append("Would create ALB request count scaling policy")
                        else:
                            self.appautoscaling_client.put_scaling_policy(
                                PolicyName=policy_name,
                                ServiceNamespace='ecs',
                                ResourceId=resource_id,
                                ScalableDimension='ecs:service:DesiredCount',
                                PolicyType='TargetTrackingScaling',
                                TargetTrackingScalingPolicyConfiguration={
                                    'TargetValue': 1000.0,
                                    'PredefinedMetricSpecification': {
                                        'PredefinedMetricType': 'ALBRequestCountPerTarget',
                                        'ResourceLabel': resource_label
                                    },
                                    'ScaleInCooldown': 60,
                                    'ScaleOutCooldown': 60
                                }
                            )
                            self.log("ALB request count scaling policy created")
                            self.optimizations_applied.append("Added ALB request count per target scaling (threshold: 1000)")
                    except ClientError as e:
                        self.log(f"Error creating ALB scaling policy: {e}", 'ERROR')
                        self.errors.append(f"ALB scaling policy: {str(e)}")
                        success = False

        return success

    def create_cloudwatch_alarms(self, cluster_arn: str, service_name: str) -> bool:
        """Create CloudWatch alarms for CPU and memory"""
        success = True

        # CPU alarm (75% threshold)
        try:
            alarm_name = f"ecs-cpu-high-{self.environment_suffix}"
            self.log(f"Creating CloudWatch alarm: {alarm_name}")

            if self.dry_run:
                self.optimizations_applied.append("Would create CPU utilization alarm (>75%)")
            else:
                self.cloudwatch_client.put_metric_alarm(
                    AlarmName=alarm_name,
                    AlarmDescription=f'ECS CPU utilization above 75% for {service_name}',
                    MetricName='CPUUtilization',
                    Namespace='AWS/ECS',
                    Statistic='Average',
                    Period=300,
                    EvaluationPeriods=2,
                    Threshold=75.0,
                    ComparisonOperator='GreaterThanThreshold',
                    Dimensions=[
                        {'Name': 'ClusterName', 'Value': self.cluster_name},
                        {'Name': 'ServiceName', 'Value': service_name}
                    ]
                )
                self.log("CPU alarm created successfully")
                self.optimizations_applied.append("Created CloudWatch alarm for CPU utilization >75%")
        except ClientError as e:
            self.log(f"Error creating CPU alarm: {e}", 'ERROR')
            self.errors.append(f"CPU alarm: {str(e)}")
            success = False

        # Memory alarm (85% threshold)
        try:
            alarm_name = f"ecs-memory-high-{self.environment_suffix}"
            self.log(f"Creating CloudWatch alarm: {alarm_name}")

            if self.dry_run:
                self.optimizations_applied.append("Would create memory utilization alarm (>85%)")
            else:
                self.cloudwatch_client.put_metric_alarm(
                    AlarmName=alarm_name,
                    AlarmDescription=f'ECS memory utilization above 85% for {service_name}',
                    MetricName='MemoryUtilization',
                    Namespace='AWS/ECS',
                    Statistic='Average',
                    Period=300,
                    EvaluationPeriods=2,
                    Threshold=85.0,
                    ComparisonOperator='GreaterThanThreshold',
                    Dimensions=[
                        {'Name': 'ClusterName', 'Value': self.cluster_name},
                        {'Name': 'ServiceName', 'Value': service_name}
                    ]
                )
                self.log("Memory alarm created successfully")
                self.optimizations_applied.append("Created CloudWatch alarm for memory utilization >85%")
        except ClientError as e:
            self.log(f"Error creating memory alarm: {e}", 'ERROR')
            self.errors.append(f"Memory alarm: {str(e)}")
            success = False

        return success

    def create_cloudwatch_dashboard(self, cluster_arn: str, service_name: str) -> bool:
        """Create CloudWatch dashboard with key metrics"""
        try:
            dashboard_name = f"ecs-dashboard-{self.environment_suffix}"
            self.log(f"Creating CloudWatch dashboard: {dashboard_name}")

            if self.dry_run:
                self.optimizations_applied.append("Would create CloudWatch dashboard with key metrics")
                return True

            dashboard_body = {
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ECS", "CPUUtilization", {"stat": "Average"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": self.region,
                            "title": "ECS CPU Utilization",
                            "dimensions": {
                                "ClusterName": self.cluster_name,
                                "ServiceName": service_name
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ECS", "MemoryUtilization", {"stat": "Average"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": self.region,
                            "title": "ECS Memory Utilization",
                            "dimensions": {
                                "ClusterName": self.cluster_name,
                                "ServiceName": service_name
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": self.region,
                            "title": "ALB Request Count"
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ECS", "RunningTasksCount", {"stat": "Average"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": self.region,
                            "title": "ECS Task Count",
                            "dimensions": {
                                "ClusterName": self.cluster_name,
                                "ServiceName": service_name
                            }
                        }
                    }
                ]
            }

            self.cloudwatch_client.put_dashboard(
                DashboardName=dashboard_name,
                DashboardBody=json.dumps(dashboard_body)
            )
            self.log("CloudWatch dashboard created successfully")
            self.optimizations_applied.append("Created CloudWatch dashboard with CPU, memory, request count, and task count metrics")
            return True
        except ClientError as e:
            self.log(f"Error creating dashboard: {e}", 'ERROR')
            self.errors.append(f"Dashboard: {str(e)}")
            return False

    def optimize(self) -> bool:
        """Run all optimization steps"""
        self.log("=" * 60)
        self.log(f"Starting ECS Fargate optimization for environment: {self.environment_suffix}")
        self.log("=" * 60)

        # Step 1: Find cluster
        cluster_arn = self.find_cluster()
        if not cluster_arn:
            self.log("Cannot proceed without cluster", 'ERROR')
            return False

        # Step 2: Find service
        service = self.find_service(cluster_arn)
        if not service:
            self.log("Cannot proceed without service", 'ERROR')
            return False

        service_name = service['serviceName']

        # Step 3: Enable Container Insights
        self.enable_container_insights(cluster_arn)

        # Step 4: Update autoscaling capacity
        self.update_autoscaling_capacity(cluster_arn, service_name)

        # Step 5: Create advanced scaling policies
        self.create_advanced_scaling_policies(cluster_arn, service_name)

        # Step 6: Create CloudWatch alarms
        self.create_cloudwatch_alarms(cluster_arn, service_name)

        # Step 7: Create CloudWatch dashboard
        self.create_cloudwatch_dashboard(cluster_arn, service_name)

        # Summary
        self.log("=" * 60)
        self.log("Optimization Summary")
        self.log("=" * 60)
        self.log(f"Environment: {self.environment_suffix}")
        self.log(f"Cluster: {self.cluster_name}")
        self.log(f"Service: {service_name}")
        self.log(f"Optimizations applied: {len(self.optimizations_applied)}")
        for opt in self.optimizations_applied:
            self.log(f"  - {opt}")

        if self.errors:
            self.log(f"Errors encountered: {len(self.errors)}", 'WARNING')
            for error in self.errors:
                self.log(f"  - {error}", 'WARNING')

        self.log("=" * 60)
        self.log("Expected Benefits:", 'INFO')
        self.log("  - Better handling of traffic spikes with increased capacity (10 tasks max)")
        self.log("  - Multi-metric autoscaling for more responsive scaling")
        self.log("  - Proactive alerting on high CPU (>75%) and memory (>85%)")
        self.log("  - Detailed container insights for troubleshooting")
        self.log("  - Unified dashboard for operational visibility")
        self.log("=" * 60)

        return len(self.errors) == 0


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Optimize ECS Fargate service with enhanced autoscaling and monitoring'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
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
        print("Usage: export ENVIRONMENT_SUFFIX=dev && python3 optimize.py")
        sys.exit(1)

    # Run optimization
    optimizer = ECSOptimizer(
        environment_suffix=environment_suffix,
        region=args.region,
        dry_run=args.dry_run
    )

    success = optimizer.optimize()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
